import 'dotenv/config';
import { startOrderWorker } from './jobs/order-worker';

console.log('🚀 Starting order worker...');

startOrderWorker();

console.log('✅ Order worker started');
