import express from 'express';
import { db } from '../db';
import { orders, orderItems, products } from '../schema';
import { authenticate, requireAdmin } from './auth';
import { eq, desc, sql } from 'drizzle-orm';
const router = express.Router();

// Get all orders (admin)
router.get('/', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = db.query.orders.findMany({
      orderBy: [desc(orders.createdAt)]
    });

    if (status) {
      query = query.where(eq(orders.status, status));
    }

    const allOrders = await query
      .limit(Number(limit))
      .offset(offset);

    const [count] = await db.select({ count: sql<number>`count(*)` }).from(orders);

    res.json({
      orders: allOrders,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: Number(count?.count || 0)
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get single order (admin)
router.get('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, Number(req.params.id)),
      with: {
        items: true
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    next(error);
  }
});

// Update order status (ship order)
router.put('/:id/status', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const orderId = Number(req.params.id);
    const { status } = req.body;

    const validTransitions: Record<string, string[]> = {
      'created': ['paid', 'cancelled'],
      'paid': ['allocated', 'cancelled'],
      'allocated': ['picking', 'cancelled'],
      'picking': ['shipped', 'partial_shipped', 'cancelled'],
      'shipped': ['delivered', 'partial_shipped'],
      'delivered': ['completed'],
      'partial_shipped': ['shipped', 'delivered', 'completed']
    };

    const order = await db.query.orders.findFirst({
      where: eq(orders.id, orderId)
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const allowedStatuses = validTransitions[order.status] || [];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        error: `Invalid status transition from ${order.status} to ${status}`,
        allowed: allowedStatuses
      });
    }

    const [updatedOrder] = await db.update(orders)
      .set({ status, updatedAt: new Date() })
      .where(eq(orders.id, orderId))
      .returning();

    res.json(updatedOrder);
  } catch (error) {
    next(error);
  }
});

export default router;
