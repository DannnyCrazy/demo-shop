# Demo Shop - E-commerce MVP

Complete single-merchant B2C e-commerce platform.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                                                      │
│   Storefront (Nuxt 4)        Admin (Vue 3)     │
│   - SSR/CSR                   SPA               │
│   - Pinia State                 Pinia State      │
│   - Nuxt UI                    Element Plus       │
│       │                                   │
│       └───────────────────────────┴───────────────┤
│                         HTTP API (REST)                │
└──────────────────────────────────────────────────────────┘
                          │
                          │
                   ┌──────┴────────┐
                   │               │
              Backend (Medusa/Express)  BullMQ Worker
              - PostgreSQL              - Redis
              - Stripe
```

## Tech Stack

### Backend
- Node.js 18+
- Express.js
- TypeScript
- Drizzle ORM
- PostgreSQL 14+ with pg_trgm
- Redis + BullMQ
- Stripe Payments

### Storefront
- Nuxt 4
- Vue 3
- Pinia
- Nuxt UI
- Tailwind CSS
- Stripe.js

### Admin
- Vue 3
- Vite
- TypeScript
- Pinia
- Element Plus
- Vue Router

## Quick Start

### Backend
```bash
cd backend
cp .env.example .env
npm install
npm run dev  # Server on :3000
npm run worker  # Worker in separate terminal
```

### Storefront
```bash
cd storefront
cp .env.example .env
npm install
npm run dev  # Server on :3001
```

### Admin
```bash
cd admin
cp .env.example .env
npm install
npm run dev  # Server on :5173
```

## MVP Flow

1. **User Registration/Login**
   - User registers via storefront
   - JWT token issued and stored

2. **Browse Products**
   - View product listings with search
   - Add items to shopping cart

3. **Checkout**
   - Review cart
   - Enter shipping address
   - Pay via Stripe
   - Order created (status: `created`)

4. **Payment Webhook**
   - Stripe webhook received
   - Order status → `paid`
   - BullMQ job triggered for order processing

5. **Order Processing**
   - Job: `process-order` → status: `allocated`
   - Job: `allocate-inventory` → status: `picking`
   - Inventory deducted from stock

6. **Admin Shipping**
   - Admin views order in panel
   - Updates status to `shipped`
   - User sees updated status in "My Orders"

## Order State Machine

```
created → paid → allocated → picking → shipped → delivered → completed
   ↓         ↓         ↓        ↓
cancelled   cancelled  cancelled  cancelled  cancelled
refunded   returned  returned  returned
```

## Development

### Environment Variables

Required for all services:
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string

Backend only:
- `STRIPE_API_KEY` - Stripe secret key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret
- `JWT_SECRET` - JWT signing secret

Storefront only:
- `NUXT_API_BASE_URL` - Backend API URL
- `NUXT_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key

Admin only:
- `VITE_API_BASE_URL` - Backend API URL

## Database Setup

### PostgreSQL Extensions
Run migration to enable pg_trgm:
```bash
psql -U postgres -d demo_shop -f backend/migrations/0001_pg_trgm.sql
```

### Tables Created
- `users` - User accounts
- `categories` - Product categories
- `products` - Products with fuzzy search indexes
- `cart_items` - Shopping cart items
- `orders` - Orders with state machine
- `order_items` - Line items per order

## Deployment

### Vercel
All three projects deploy to Vercel as separate applications:
- Backend: Serverless functions
- Storefront: SSR application
- Admin: SPA static build

### Production Services
- Vercel Postgres (database with connection pooling)
- Vercel Blob (object storage for images)
- Upstash Redis (or self-hosted Redis)

## MVP Acceptance Criteria

✅ User can register and login
✅ User can browse products with search
✅ User can add items to cart and checkout
✅ Stripe payment integration working
✅ Order created and paid
✅ Admin can view and manage orders
✅ Admin can ship orders
✅ User can view order history
✅ Order status updates correctly propagated
