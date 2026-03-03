import express from 'express';
import { db } from '../db';
import { orders, orderItems, cartItems, products } from '../schema';
import { authenticate } from './auth';
import { createOrderJob } from '../jobs/order-worker';
import Stripe from 'stripe';
import { eq, desc } from 'drizzle-orm';
import Stripe from 'stripe';

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_API_KEY || '', {
  apiVersion: '2025-01-27.acacia'
});

const generateOrderNumber = () => {
  return `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
};
const generateOrderNumber = () => {
  return `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
};

router.get('/', authenticate, async (req, res, next) => {
router.get('/', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const userOrders = await db.query.orders.findMany({
      where: eq(orders.userId, userId),
      orderBy: [desc(orders.createdAt)]
    });

    res.json({ orders: userOrders });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', authenticate, async (req, res, next) => {
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const orderId = Number(req.params.id);

    const order = await db.query.orders.findFirst({
      where: eq(orders.id, orderId),
      with: {
        items: true
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    if (order.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(order);
  } catch (error) {
    next(error);
  }
});

router.post('/', authenticate, async (req, res, next) => {
router.post('/', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { shippingAddress } = req.body;

    if (!shippingAddress) {
      return res.status(400).json({ error: 'Shipping address is required' });
    }

    const cart = await db.query.cartItems.findMany({
    const cart = await db.query.cartItems.findMany({
      where: eq(cartItems.userId, userId),
      with: {
        product: true
      }
    });

    if (cart.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    for (const item of cart) {
    for (const item of cart) {
      if (!item.product || item.product.stock < item.quantity) {
        return res.status(400).json({
          error: 'Insufficient stock',
          product: item.product.name
        });
      }
    }

    const subtotal = cart.reduce((sum, item) => sum + (item.product?.price || 0) * item.quantity, 0);
    const tax = subtotal * 0.1;
    const total = subtotal + tax;
    const subtotal = cart.reduce((sum, item) => sum + (item.product?.price || 0) * item.quantity, 0);
    const tax = subtotal * 0.1; // 10% tax rate
    const total = subtotal + tax;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(total * 100),
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(total * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        userId: userId.toString()
      }
    });

    const [newOrder] = await db.insert(orders).values({
    const [newOrder] = await db.insert(orders).values({
      orderNumber: generateOrderNumber(),
      userId,
      status: 'created',
      subtotal,
      tax,
      total,
      stripePaymentIntentId: paymentIntent.id,
      shippingAddress
    }).returning();

    for (const item of cart) {
    for (const item of cart) {
      await db.insert(orderItems).values({
        orderId: newOrder.id,
        productId: item.productId,
        quantity: item.quantity,
        price: item.product?.price || 0,
        productName: item.product?.name || '',
        productModel: item.product?.model || ''
      });
    }

    await db.delete(cartItems).where(eq(cartItems.userId, userId));
    await db.delete(cartItems).where(eq(cartItems.userId, userId));

    res.status(201).json({
      order: newOrder,
      clientSecret: paymentIntent.client_secret
    });
  } catch (error) {
    next(error);
  }
});

router.post('/webhook/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
router.post('/webhook/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send('Webhook signature verification failed');
  }

  if (event.type === 'payment_intent.succeeded') {
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;

    const [order] = await db.update(orders)
    const [order] = await db.update(orders)
      .set({ status: 'paid', updatedAt: new Date() })
      .where(eq(orders.stripePaymentIntentId, paymentIntent.id))
      .returning();

    if (order) {
      // Trigger order processing job
      await createOrderJob('process-order', {
        orderId: order.id
      });
    }
  }

  if (event.type === 'payment_intent.payment_failed') {
  if (event.type === 'payment_intent.payment_failed') {
    await db.update(orders)
      .set({ status: 'cancelled', updatedAt: new Date() })
      .where(eq(orders.stripePaymentIntentId, event.data.object.id));
  }

  res.json({ received: true });
});

export default router;
