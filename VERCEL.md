# Vercel Deployment Configuration

## Backend

Build and deploy as Vercel functions or Node.js app:
```bash
cd backend
vercel
```

## Storefront

Build as Nuxt SSR application:
```bash
cd storefront
vercel
```

## Admin

Build as static Vue SPA:
```bash
cd admin
vercel
```

## Production Services

### Vercel Postgres
```bash
# Create database
vercel postgres create demo-shop-db --region=us-east-1

# Get connection string
vercel postgres ls
```

### Vercel Blob
Object storage for product images. Configure in Vercel dashboard.

## Environment Variables

Set these in each Vercel project's Settings → Environment Variables:

**Backend:**
- DATABASE_URL (from Vercel Postgres)
- REDIS_URL (from Upstash or self-hosted)
- STRIPE_API_KEY
- STRIPE_WEBHOOK_SECRET
- JWT_SECRET
- NODE_ENV=production

**Storefront:**
- NUXT_API_BASE_URL
- NUXT_STRIPE_PUBLISHABLE_KEY

**Admin:**
- VITE_API_BASE_URL

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete guide.
