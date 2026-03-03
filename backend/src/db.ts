import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Database connection with pooling for Vercel
const connectionString = process.env.DATABASE_URL || 'postgresql://localhost:5432/demo_shop';

const client = postgres(connectionString, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10
});

export const db = drizzle(client, { schema });

export default db;
