# Demo Shop - Vue 3 Admin Panel

## Prerequisites

- Node.js 18+
- Backend API running on `http://localhost:3000`

## Setup

1. Copy environment variables:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` with your API URL:
   ```bash
   VITE_API_BASE_URL=http://localhost:3000/api
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

- `/login` - Admin login
- `/dashboard` - Dashboard with statistics
- `/products` - Product management (CRUD)
- `/orders` - Order management and shipping
- `/users` - User management

## Features

- Role-based access control (RBAC)
- Permission-based routing
- Product CRUD operations
- Order status management
- User management
