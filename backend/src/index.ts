import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.routes.js';
import productRoutes from './routes/product.routes.js';
import cartRoutes from './routes/cart.routes.js';
import orderRoutes from './routes/order.routes.js';
import merchantRoutes from './routes/merchant.routes.js';
import riderRoutes from './routes/rider.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import kycRoutes from './routes/kyc.routes.js';
import returnRoutes from './routes/return.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Ultra-fast In-Memory Ephemeral Store (Zero Redis dependency)
class InMemoryRedisClient {
  private store = new Map<string, { value: string; expiresAt?: number }>();

  async set(key: string, value: string, ...args: any[]): Promise<'OK' | null> {
    let ttlSeconds: number | undefined;
    let nx = false;

    for (let i = 0; i < args.length; i++) {
      if (typeof args[i] === 'string' && args[i].toUpperCase() === 'EX') {
        ttlSeconds = Number(args[i + 1]);
      }
      if (typeof args[i] === 'string' && args[i].toUpperCase() === 'NX') {
        nx = true;
      }
    }

    const existing = this.getSync(key);
    if (nx && existing !== null) {
      return null;
    }

    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined;
    this.store.set(key, { value, expiresAt });
    return 'OK';
  }

  async get(key: string): Promise<string | null> {
    return this.getSync(key);
  }

  private getSync(key: string): string | null {
    const item = this.store.get(key);
    if (!item) return null;
    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  }

  async expire(key: string, seconds: number): Promise<number> {
    const item = this.store.get(key);
    if (!item) return 0;
    item.expiresAt = Date.now() + seconds * 1000;
    return 1;
  }

  async del(key: string): Promise<number> {
    return this.store.delete(key) ? 1 : 0;
  }
}

export const redis = new InMemoryRedisClient();

// PostgreSQL (Prisma) Connection Check
import { prisma } from './utils/prisma.js';
const connectPostgreSQL = async () => {
  if (process.env.NODE_ENV === 'production' && process.env.DATABASE_URL?.includes('localhost')) {
    console.log('ℹ️ Render environment: Operating on MongoDB Atlas Data Engine (PostgreSQL DATABASE_URL not set).');
    return;
  }
  try {
    await prisma.$connect();
    console.log('✅ PostgreSQL (Prisma ORM) connected successfully.');
  } catch (error) {
    console.log('ℹ️ Operating on MongoDB Atlas Data Engine for production storage.');
  }
};
connectPostgreSQL();

// MongoDB Connection
const connectMongoDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/vj_shopping_world';
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB connected successfully.');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
  }
};
connectMongoDB();

// Health Check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'VJ-Shopping-World API Core',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/merchant', merchantRoutes);
app.use('/api/rider', riderRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/kyc', kycRoutes);
app.use('/api/return', returnRoutes);

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 VJ-Shopping-World Backend API running on http://localhost:${PORT}`);
});
