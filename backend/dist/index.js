import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Redis } from 'ioredis';
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
// Redis Client initialization with graceful offline handling
export const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
        if (times > 3)
            return null; // Stop retrying after 3 attempts
        return Math.min(times * 200, 1000);
    }
});
redis.on('connect', () => {
    console.log('✅ Redis connected successfully.');
});
redis.on('error', (err) => {
    console.warn('⚠️ Redis connection notice:', err.message);
});
// MongoDB Connection
const connectMongoDB = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/vj_shopping_world';
        await mongoose.connect(mongoUri);
        console.log('✅ MongoDB connected successfully.');
    }
    catch (error) {
        console.error('❌ MongoDB connection error:', error);
    }
};
connectMongoDB();
// Health Check
app.get('/api/health', (_req, res) => {
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
