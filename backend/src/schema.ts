import { pgTable, serial, text, integer, timestamp, decimal, boolean, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Order states enum
export const orderStatus = ['created', 'paid', 'allocated', 'picking', 'shipped', 'delivered', 'completed', 'cancelled', 'refunded', 'returned', 'partial_shipped'] as const;
export type OrderStatus = typeof orderStatus[number];

// Users table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  role: text('role').notNull().default('customer'), // 'customer', 'admin'
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Categories table
export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Products table
export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  model: text('model').notNull(), // Product model number
  description: text('description'),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  categoryId: integer('category_id').references(() => categories.id),
  stock: integer('stock').notNull().default(0),
  imageUrl: text('image_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Product search index with pg_trgm
// Note: GIN index with gin_trgm_ops needs to be created via SQL migration
// CREATE INDEX idx_products_name_trgm ON products USING GIN (name gin_trgm_ops);
// CREATE INDEX idx_products_model_trgm ON products USING GIN (model gin_trgm_ops);

// Cart items
export const cartItems = pgTable('cart_items', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  productId: integer('product_id').references(() => products.id).notNull(),
  quantity: integer('quantity').notNull().default(1),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Orders
export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  orderNumber: text('order_number').notNull().unique(),
  userId: integer('user_id').references(() => users.id).notNull(),
  status: text('status').notNull().$type<OrderStatus>().default('created'),
  subtotal: decimal('subtotal', { precision: 10, scale: 2 }).notNull().default('0'),
  tax: decimal('tax', { precision: 10, scale: 2 }).notNull().default('0'),
  total: decimal('total', { precision: 10, scale: 2 }).notNull().default('0'),
  stripePaymentIntentId: text('stripe_payment_intent_id'),
  shippingAddress: text('shipping_address'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Order items
export const orderItems = pgTable('order_items', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').references(() => orders.id).notNull(),
  productId: integer('product_id').references(() => products.id).notNull(),
  quantity: integer('quantity').notNull(),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  productName: text('product_name').notNull(),
  productModel: text('product_model').notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many: orders }));
export const categoriesRelations = relations(categories, ({ many: products }));
export const productsRelations = relations(products, ({ one: categories, many: orderItems }));
export const cartItemsRelations = relations(cartItems, ({ one: users, one: products }));
export const ordersRelations = relations(orders, ({ one: users, many: orderItems }));
export const orderItemsRelations = relations(orderItems, ({ one: orders, one: products }));
