# Demo Shop - E-commerce MVP

Complete single-merchant B2C e-commerce platform built with:

- **Backend**: Express.js + TypeScript + Drizzle ORM + PostgreSQL + Redis + BullMQ + Stripe
- **Storefront**: Nuxt 4 + Vue 3 + Pinia + Nuxt UI + Tailwind CSS
- **Admin**: Vue 3 + Vite + TypeScript + Element Plus + Pinia + Vue Router
- **Database**: PostgreSQL with pg_trgm extension for fuzzy search
- **Cache/Queue**: Redis + BullMQ
- **Storage**: Vercel Blob (production) / MinIO (development)

## Structure

```
demo-shop/
├── backend/          # Express.js backend
├── storefront/       # Nuxt 4 storefront
├── admin/           # Vue 3 admin panel
└── package.json      # Monorepo root
```

## MVP Flow

1. User registers and logs in (JWT authentication)
2. Browses products (fuzzy search with pg_trgm) → adds to cart
3. Checkout with Stripe payment → order created → status: `paid`
4. Payment webhook → BullMQ job triggers order processing
5. Order processing: `allocated` → `picking` → inventory deducted
6. Admin views order → ships it → status: `shipped`
7. User sees updated status in "My Orders"

## Quick Start

### Development

```bash
# Install dependencies
npm install

# Start all services
npm run dev
```

### Individual Services

```bash
npm run dev:backend   # Backend API on :3000
npm run dev:storefront # Storefront on :3001
npm run dev:admin    # Admin panel on :5173
```

### Deploy to Production

```bash
# Deploy all projects
npm run deploy

# Or deploy individually
cd backend && vercel --prod
cd storefront && vercel --prod
cd admin && vercel --prod
```

## Documentation

- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Vercel deployment guide
- **[VERCEL.md](./VERCEL.md)** - Vercel configuration summary
- **[DEVELOPMENT.md](./DEVELOPMENT.md)** - Complete architecture guide
- **[PROGRESS.md](./PROGRESS.md)** - Implementation tracking
- **[backend/README.md](./backend/README.md)** - Backend API documentation
- **[storefront/README.md](./storefront/README.md)** - Storefront documentation
- **[admin/README.md](./admin/README.md)** - Admin panel documentation

## Deployment

All three projects deploy to Vercel as separate applications:
- Backend: Serverless functions or Node.js app
- Storefront: SSR application
- Admin: SPA static build


### Production Services
- Vercel Postgres for database with connection pooling
- Vercel Blob for object storage
- Environment variables configured per project

## Project Status

✅ All implementation complete
✅ Ready for deployment
⏳ Testing pending (requires npm install)

Complete single-merchant B2C e-commerce platform built with:

- **Backend**: Express.js + TypeScript + Drizzle ORM + PostgreSQL + Redis + BullMQ + Stripe
- **Storefront**: Nuxt 4 + Vue 3 + Pinia + Nuxt UI + Tailwind CSS
- **Admin**: Vue 3 + Vite + TypeScript + Element Plus + Pinia + Vue Router
- **Database**: PostgreSQL with pg_trgm extension for fuzzy search
- **Cache/Queue**: Redis + BullMQ
- **Storage**: Vercel Blob (production) / MinIO (development)

## Structure

\`\`\`
demo-shop/
├── backend/          # Express.js backend
├── storefront/       # Nuxt 4 storefront
├── admin/           # Vue 3 admin panel
└── package.json      # Monorepo root
\`\`\`

## MVP Flow

1. User registers and logs in (JWT authentication)
2. Browses products (fuzzy search with pg_trgm) → adds to cart
3. Checkout with Stripe payment → order created → status: \`created\`
4. Payment webhook → order status: \`paid\` → BullMQ job triggers
5. Order processing: \`allocated\` → \`picking\` → inventory deducted
6. Admin views order → ships it → status: \`shipped\`
7. User sees updated status in "My Orders"

## Development

\`\`\`bash
npm install
npm run dev
\`\`\`

### Start all services:

\`\`\`bash
./start-dev.sh
\`\`\`

### Individual services:

\`\`\`bash
npm run dev:backend   # Backend API on :3000
npm run dev:storefront # Storefront on :3001
npm run dev:admin    # Admin panel on :5173
\`\`\`

## Documentation

- [DEVELOPMENT.md](./DEVELOPMENT.md) - Architecture, API endpoints, MVP flow
- [PROGRESS.md](./PROGRESS.md) - Implementation status and tracking
- [backend/README.md](./backend/README.md) - Backend API documentation
- [storefront/README.md](./storefront/README.md) - Storefront documentation
- [admin/README.md](./admin/README.md) - Admin panel documentation

## Deployment

Deploy to Vercel with:
- Vercel Postgres for database
- Vercel Blob for object storage

## Project Status

✅ Backend API complete with order state machine
🔄 Storefront pages in progress (delegated)
🔄 Admin pages in progress (delegated)
⏳ Deployment and testing pending

## License

See [LICENSE](./LICENSE) file.
