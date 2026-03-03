import { Queue, Worker } from 'bullmq';
import { db } from '../db';
import { orders, products, orderItems } from '../schema';
import { eq } from 'drizzle-orm';
  connection: process.env.REDIS_URL || 'redis://localhost:6379'
});

export const createOrderJob = async (name: string, data: any) => {
  await orderQueue.add(name, data);
};

export const startOrderWorker = () => {
  const worker = new Worker('order-processing', async (job) => {
    const { orderId } = job.data;

    console.log(`Processing order job ${job.id} for order ${orderId}`);

    switch (job.name) {
      case 'process-order':
        await processOrder(orderId);
        break;
      case 'allocate-inventory':
        await allocateInventory(orderId);
        break;
      case 'generate-shipping':
        await generateShipping(orderId);
        break;
      default:
        console.log(`Unknown job type: ${job.name}`);
    }
  }, {
    connection: process.env.REDIS_URL || 'redis://localhost:6379',
    concurrency: 5
  });

  worker.on('completed', (job) => {
    console.log(`Job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`Job ${job.id} failed:`, err);
  });
};

async function processOrder(orderId: number) {
  await db.update(orders)
    .set({ status: 'allocated', updatedAt: new Date() })
    .where(eq(orders.id, orderId));

  await allocateInventory(orderId);
}

async function allocateInventory(orderId: number) {
  const orderItems = await db.query.orderItems.findMany({
    where: eq(orderItems.orderId, orderId)
  });

  for (const item of orderItems) {
    await db.update(products)
      .set({
        stock: sql`${products.stock} - ${item.quantity}`
      })
      .where(eq(products.id, item.productId));
  }

  await db.update(orders)
    .set({ status: 'picking', updatedAt: new Date() })
    .where(eq(orders.id, orderId));
}

async function generateShipping(orderId: number) {
  await db.update(orders)
    .set({ status: 'shipped', updatedAt: new Date() })
    .where(eq(orders.id, orderId));
}

export { orderQueue };
