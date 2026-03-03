# Demo Shop - Nuxt 4 Storefront

## Prerequisites

- Node.js 18+
- Backend API running on `http://localhost:3000`

## Setup

1. Copy environment variables:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` with your values:
   ```bash
   NUXT_API_BASE_URL=http://localhost:3000/api
   NUXT_STRIPE_PUBLISHABLE_KEY=pk_test_your_key
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Start development server:
   ```bash
   npm run dev
   ```

## Pages

- `/` - Product listing with search
- `/products/[id]` - Product detail page
- `/login` - User login
- `/register` - User registration
- `/cart` - Shopping cart
- `/checkout` - Order checkout with Stripe
- `/orders` - Order history

## Features

- Product search with fuzzy matching
- Shopping cart management
- User authentication (JWT)
- Stripe payment integration
- Order history and status tracking
