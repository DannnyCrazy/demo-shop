import express from 'express';
import { db } from '../db';
import { cartItems, products } from '../schema';
import { authenticate } from './auth';
import { eq, and } from 'drizzle-orm';

const router = express.Router();

// Get user's cart
router.get('/', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const cart = await db.query.cartItems.findMany({
      where: eq(cartItems.userId, userId),
      with: {
        product: true
      }
    });

    res.json({ items: cart, total: cart.reduce((sum, item) => sum + (item.product?.price || 0) * item.quantity, 0) });
  } catch (error) {
    next(error);
  }
});

// Add item to cart
router.post('/', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { productId, quantity = 1 } = req.body;

    // Check product exists and has stock
    const product = await db.query.products.findFirst({
      where: eq(products.id, productId)
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (product.stock < quantity) {
      return res.status(400).json({ error: 'Insufficient stock' });
    }

    // Check if item already in cart
    const existingItem = await db.query.cartItems.findFirst({
      where: and(
        eq(cartItems.userId, userId),
        eq(cartItems.productId, productId)
      )
    });

    if (existingItem) {
      // Update quantity
      const [updatedItem] = await db.update(cartItems)
        .set({ quantity: existingItem.quantity + quantity })
        .where(eq(cartItems.id, existingItem.id))
        .returning();
      res.json(updatedItem);
    } else {
      // Add new item
      const [newItem] = await db.insert(cartItems).values({
        userId,
        productId,
        quantity
      }).returning();
      res.status(201).json(newItem);
    }
  } catch (error) {
    next(error);
  }
});

// Update cart item quantity
router.put('/:id', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const cartItemId = Number(req.params.id);
    const { quantity } = req.body;

    if (quantity < 1) {
      return res.status(400).json({ error: 'Quantity must be at least 1' });
    }

    const [updatedItem] = await db.update(cartItems)
      .set({ quantity })
      .where(and(
        eq(cartItems.id, cartItemId),
        eq(cartItems.userId, userId)
      ))
      .returning();

    if (!updatedItem) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    res.json(updatedItem);
  } catch (error) {
    next(error);
  }
});

// Remove item from cart
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const [deletedItem] = await db.delete(cartItems)
      .where(and(
        eq(cartItems.id, Number(req.params.id)),
        eq(cartItems.userId, userId)
      ))
      .returning();

    if (!deletedItem) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    res.json({ message: 'Item removed from cart' });
  } catch (error) {
    next(error);
  }
});

// Clear cart
router.delete('/', authenticate, async (req, res, next) => {
  try {
    await db.delete(cartItems)
      .where(eq(cartItems.userId, req.user.userId));

    res.json({ message: 'Cart cleared' });
  } catch (error) {
    next(error);
  }
});

export default router;
