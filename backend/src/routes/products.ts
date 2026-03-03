import express from 'express';
import { db } from '../db';
import { products, categories } from '../schema';
import { authenticate } from './auth';
import { eq, desc, or, ilike } from 'drizzle-orm';

const router = express.Router();

// Get all products with search and pagination
router.get('/', async (req, res, next) => {
  try {
    const { search, category, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = db.select().from(products);

    // Join with category if needed
    if (category) {
      query = query.leftJoin(categories, eq(categories.id, products.categoryId));
    }

    // Fuzzy search with ILIKE and pg_trgm
    // Note: In production, ensure pg_trgm extension is enabled and indexes are created
    if (search && typeof search === 'string') {
      const searchTerm = `%${search}%`;
      query = query.where(
        or(
          ilike(products.name, searchTerm),
          ilike(products.model, searchTerm)
        )
      );
    }

    // Category filter
    if (category) {
      query = query.where(eq(products.categoryId, Number(category)));
    }

    const productList = await query
      .limit(Number(limit))
      .offset(offset)
      .orderBy(products.createdAt);

    const [count] = await db.select({ count: sql<number>`count(*)` }).from(products);

    res.json({
      products: productList,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: Number(count?.count || 0),
        pages: Math.ceil((count?.count || 0) / Number(limit))
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get single product
router.get('/:id', async (req, res, next) => {
  try {
    const product = await db.query.products.findFirst({
      where: eq(products.id, Number(req.params.id))
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    next(error);
  }
});

// Create product (admin only)
router.post('/', authenticate, async (req, res, next) => {
  try {
    const { name, model, description, price, categoryId, stock, imageUrl } = req.body;

    const [newProduct] = await db.insert(products).values({
      name,
      model,
      description,
      price,
      categoryId,
      stock: stock || 0,
      imageUrl
    }).returning();

    res.status(201).json(newProduct);
  } catch (error) {
    next(error);
  }
});

// Update product (admin only)
router.put('/:id', authenticate, async (req, res, next) => {
  try {
    const { name, model, description, price, categoryId, stock, imageUrl } = req.body;
    const id = Number(req.params.id);

    const [updatedProduct] = await db.update(products)
      .set({
        name,
        model,
        description,
        price,
        categoryId,
        stock,
        imageUrl,
        updatedAt: new Date()
      })
      .where(eq(products.id, id))
      .returning();

    if (!updatedProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(updatedProduct);
  } catch (error) {
    next(error);
  }
});

// Delete product (admin only)
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const [deletedProduct] = await db.delete(products)
      .where(eq(products.id, Number(req.params.id)))
      .returning();

    if (!deletedProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ message: 'Product deleted' });
  } catch (error) {
    next(error);
  }
});

export default router;
