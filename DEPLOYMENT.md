# Vercel Deployment Guide - Demo Shop

## Prerequisites

- Vercel account ([vercel.com](https://vercel.com))
- Git repository pushed to GitHub/GitLab/Bitbucket
- Vercel CLI installed: `npm i -g vercel`

## Deployment Strategy

### Separate Projects

Each workspace (backend, storefront, admin) should be deployed as separate Vercel projects:

```
demo-shop/
├── backend/          → Vercel Project 1
├── storefront/       → Vercel Project 2  
└── admin/           → Vercel Project 3
```

### Project 1: Backend API

```bash
cd backend
vercel
```

**Vercel Project Settings:**
- Name: `demo-shop-backend`
- Framework Preset: Other
- Root Directory: `./`
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

**Environment Variables:**
```bash
DATABASE_URL=postgresql://user:password@your-project.supabase.co:5432/demo_shop
REDIS_URL=redis://your-redis.upstash.io:6379
STRIPE_API_KEY=sk_live_your_production_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
JWT_SECRET=your_production_secret_min_32_characters
NODE_ENV=production
PORT=3000
```

**Serverless Configuration:**
- Backend uses Express.js with Vercel functions
- API routes automatically deploy as serverless functions
- BullMQ worker runs on separate dyno

### Project 2: Storefront (Nuxt 4)

```bash
cd storefront
vercel
```

**Vercel Project Settings:**
- Name: `demo-shop-storefront`
- Framework Preset: Nuxt.js
- Root Directory: `./`
- Build Command: `npm run build`
- Output Directory: `.output`

**Environment Variables:**
```bash
NUXT_API_BASE_URL=https://demo-shop-backend.vercel.app/api
NUXT_STRIPE_PUBLISHABLE_KEY=pk_live_your_publishable_key
```

**Nuxt 4 on Vercel:**
- SSR enabled by default
- Static generation option available
- Edge functions for API routes

### Project 3: Admin Panel (Vue 3)

```bash
cd admin
vercel
```

**Vercel Project Settings:**
- Name: `demo-shop-admin`
- Framework Preset: Vite
- Root Directory: `./`
- Build Command: `npm run build`
- Output Directory: `dist`

**Environment Variables:**
```bash
VITE_API_BASE_URL=https://demo-shop-backend.vercel.app/api
```

**Vue 3 + Vite on Vercel:**
- SPA deployment (static files)
- All routes served from `/index.html`
- Client-side routing via Vue Router

## Production Database (Vercel Postgres)

### Setup

1. Create Vercel Postgres database:
   ```bash
   vercel postgres create demo-shop-db --region=us-east-1
   ```

2. Get connection string:
   ```bash
   vercel postgres ls
   ```

3. Configure environment variables in all projects with the `DATABASE_URL`

### Connection Pooling

Vercel Postgres automatically handles connection pooling. Update backend `db.ts`:

```typescript
import { drizzle } from 'drizzle-orm/postgres-js';
import { attachDatabasePool } from '@vercel/postgres';  // Vercel Postgres SDK
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL;
const client = postgres(connectionString, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10
});

// Attach Vercel connection pool for automatic cleanup
attachDatabasePool(client);

export const db = drizzle(client, { schema });
export default db;
```

## Production Storage (Vercel Blob)

### Setup

1. Install Blob SDK:
   ```bash
   cd backend
   npm install @vercel/blob
   cd ../storefront
   npm install @vercel/blob
   ```

2. Update backend to use Blob for image uploads:

```typescript
// backend/src/routes/products.ts or separate upload endpoint
import { put } from '@vercel/blob';

router.post('/upload', authenticate, async (req, res) => {
  try {
    const file = req.files?.image;
    if (!file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = `products/${Date.now()}-${file.originalname}`;

    await put(filename, buffer, {
      access: 'public',
      contentType: file.mimetype
    });

    const url = `https://your-blob-store.public.blob.vercel-storage.net/${filename}`;

    res.json({ url });
  } catch (error) {
    res.status(500).json({ error: 'Upload failed' });
  }
});
```

3. Update storefront to use Blob URLs for product images

## Environment Variables Management

### Vercel Dashboard

Go to each project in Vercel dashboard → Settings → Environment Variables:

**Backend:**
```
DATABASE_URL = [from Vercel Postgres]
REDIS_URL = [from Upstash/Redis Cloud]
STRIPE_API_KEY = sk_live_*
STRIPE_WEBHOOK_SECRET = whsec_*
JWT_SECRET = [generate 32-char secret]
```

**Storefront:**
```
NUXT_API_BASE_URL = https://demo-shop-backend.vercel.app/api
NUXT_STRIPE_PUBLISHABLE_KEY = pk_live_*
```

**Admin:**
```
VITE_API_BASE_URL = https://demo-shop-backend.vercel.app/api
```

### Environment-Specific Variables

You can set different values per environment (Production, Preview, Development):

```
[Production] DATABASE_URL = postgres://prod-db...
[Preview]     DATABASE_URL = postgres://preview-db...
[Development] DATABASE_URL = postgres://local-db...
```

## Deployment Commands

### Deploy All Projects

```bash
# Deploy backend
cd backend && vercel --prod

# Deploy storefront  
cd storefront && vercel --prod

# Deploy admin
cd admin && vercel --prod
```

### Deploy to Preview

```bash
# Create preview deployment
vercel
```

## Domain Configuration

### Custom Domains

Add your custom domains in Vercel dashboard:

1. Go to project settings → Domains
2. Add domain: `api.yourdomain.com` (backend)
3. Add domain: `shop.yourdomain.com` (storefront)
4. Add domain: `admin.yourdomain.com` (admin)
5. Configure DNS records as shown by Vercel

### Subdomains (Vercel provides)

If you don't have custom domains:
- Backend: `demo-shop-backend.vercel.app`
- Storefront: `demo-shop-storefront.vercel.app`
- Admin: `demo-shop-admin.vercel.app`

## Cron Jobs (Order Processing)

Vercel Cron configuration for BullMQ worker:

**vercel.json in backend:**
```json
{
  "crons": [
    {
      "path": "/api/worker/health-check",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

Create `/api/worker/health-check` endpoint to ensure BullMQ worker stays alive in serverless environment.

## Testing Deployment

### Health Checks

```bash
# Backend
curl https://demo-shop-backend.vercel.app/health

# Storefront
curl https://demo-shop-storefront.vercel.app

# Admin
curl https://demo-shop-admin.vercel.app
```

### End-to-End Test

1. **User Flow:**
   - Register new account
   - Browse products with search
   - Add product to cart
   - Checkout with Stripe test mode
   - Verify order created (status: `paid`)
   - Login to admin
   - View and ship order
   - Check order history (status: `shipped`)

2. **Order State Verification:**
   - Created → Paid (via Stripe webhook)
   - Paid → Allocated (BullMQ job)
   - Allocated → Picking (BullMQ job)
   - Picking → Shipped (admin action)
   - Shipped → User visible

## Troubleshooting

### Common Issues

**1. Build Failures**
```bash
# Clear cache and rebuild
rm -rf node_modules .nuxt dist .output
npm install
npm run build
```

**2. Environment Variables Not Loading**
- Ensure `VITE_` prefix for admin variables
- Ensure `NUXT_` prefix for storefront variables
- Redeploy after changing environment variables

**3. Database Connection Issues**
- Check Vercel Postgres status: `vercel postgres ls`
- Verify DATABASE_URL is correct
- Check Vercel Postgres logs in dashboard

**4. Stripe Webhook Issues**
- Webhook URL: `https://demo-shop-backend.vercel.app/api/orders/webhook/stripe`
- Add webhook endpoint in Stripe dashboard
- Verify STRIPE_WEBHOOK_SECRET matches

**5. CORS Issues**
- Ensure backend CORS includes production URLs
- Update `STORE_CORS` environment variable in backend

## Monitoring

### Vercel Analytics

1. Go to Vercel dashboard → Analytics
2. Monitor:
   - Request throughput
   - Error rates
   - Response times
   - Geographic distribution

### Logs

```bash
# View logs
vercel logs

# Follow logs in real-time
vercel logs --follow
```

## Production Checklist

- [ ] All three projects deployed to Vercel
- [ ] Vercel Postgres database created and connected
- [ ] Vercel Blob storage configured
- [ ] All environment variables set in production
- [ ] Custom domains configured (optional)
- [ ] Stripe webhook URL registered
- [ ] CORS configured for production URLs
- [ ] Health check endpoints responding
- [ ] End-to-end MVP flow tested
- [ ] Monitoring and alerts configured

## Post-Deployment

Once deployed:

1. **Update Stripe webhook URL** in Stripe dashboard
2. **Test payment flow** with Stripe test mode
3. **Monitor first transactions** via Vercel logs
4. **Set up analytics** in Stripe dashboard
5. **Configure backup strategy** for Vercel Postgres
