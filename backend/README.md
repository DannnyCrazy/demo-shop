# Demo Shop - Backend API

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Redis 6+
- Stripe account (test mode for development)

## Setup

1. Copy environment variables:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` with your values:
   ```bash
   DATABASE_URL=postgresql://user:password@localhost:5432/demo_shop
   REDIS_URL=redis://localhost:6379
   STRIPE_API_KEY=sk_test_your_key
   STRIPE_WEBHOOK_SECRET=whsec_your_secret
   JWT_SECRET=your_secret_min_32_chars
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Run database migrations:
   ```bash
   npm run migrations:push
   ```

5. Start development server:
   ```bash
   npm run dev
   ```

6. Start order worker (separate terminal):
   ```bash
   npm run worker
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Products
- `GET /api/products` - List products (with search, pagination)
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product (admin)
- `PUT /api/products/:id` - Update product (admin)
- `DELETE /api/products/:id` - Delete product (admin)

### Cart
- `GET /api/cart` - Get user's cart
- `POST /api/cart` - Add item to cart
- `PUT /api/cart/:id` - Update cart item quantity
- `DELETE /api/cart/:id` - Remove item from cart
- `DELETE /api/cart` - Clear cart

### Orders
- `GET /api/orders` - Get user's orders
- `GET /api/orders/:id` - Get single order details
- `POST /api/orders` - Create order from cart (checkout)

### Admin
- `GET /api/admin/orders` - List all orders (admin)
- `GET /api/admin/orders/:id` - Get order details (admin)
- `PUT /api/admin/orders/:id/status` - Update order status (ship order)

### Webhooks
- `POST /api/orders/webhook/stripe` - Stripe payment webhooks

## Order States

- `created` - Order created, awaiting payment
- `paid` - Payment completed
- `allocated` - Inventory allocated
- `picking` - Order being picked
- `shipped` - Order shipped to customer
- `delivered` - Order delivered
- `completed` - Order completed
- `cancelled` - Order cancelled
- `refunded` - Order refunded
- `returned` - Order returned
- `partial_shipped` - Partial shipment completed
