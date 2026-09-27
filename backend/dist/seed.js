import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { prisma } from './utils/prisma.js';
import Product from './models/product.model.js';
dotenv.config();
const sampleProducts = [
    {
        sku: 'GROC-MILK-001',
        title: 'Amul Taaza Toned Milk (1 Litre)',
        description: 'Fresh pasteurized toned milk with optimal cream content.',
        category: 'Grocery',
        pricePaise: 6800, // ₹68.00
        stockQuantity: 150,
        isAvailable: true,
        images: ['https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80']
    },
    {
        sku: 'GROC-ATT-002',
        title: 'Aashirvaad Shuddh Chakki Atta (5 kg)',
        description: '100% pure whole wheat flour processed with traditional chakki process.',
        category: 'Grocery',
        pricePaise: 24500, // ₹245.00
        stockQuantity: 80,
        isAvailable: true,
        images: ['https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=600&q=80']
    },
    {
        sku: 'ELEC-HEAD-003',
        title: 'boAt Rockerz 450 Wireless Headphones',
        description: '40mm dynamic drivers, up to 15 hours playback, HD immersive sound.',
        category: 'Electronics',
        pricePaise: 149900, // ₹1,499.00
        stockQuantity: 30,
        isAvailable: true,
        images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80']
    },
    {
        sku: 'ELEC-POW-004',
        title: 'Mi Power Bank 3i 20000mAh (18W Fast Charging)',
        description: 'Dual output ports, triple input ports, smart power management.',
        category: 'Electronics',
        pricePaise: 199900, // ₹1,999.00
        stockQuantity: 45,
        isAvailable: true,
        images: ['https://images.unsplash.com/photo-1609592424009-dd28731338d3?auto=format&fit=crop&w=600&q=80']
    },
    {
        sku: 'FRESH-ORG-005',
        title: 'Organic Farm Fresh Bananas (1 Dozen)',
        description: 'Naturally ripened, chemical-free delicious bananas sourced directly from local farmers.',
        category: 'Fresh Produce',
        pricePaise: 6000, // ₹60.00
        stockQuantity: 200,
        isAvailable: true,
        images: ['https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=600&q=80']
    },
    {
        sku: 'LOCAL-SWEET-006',
        title: 'Special Local Kaju Katli (500g Box)',
        description: 'Authentic rich cashew sweet prepared by VJ Local Mithai Store.',
        category: 'Local Stores',
        pricePaise: 45000, // ₹450.00
        stockQuantity: 25,
        isAvailable: true,
        images: ['https://images.unsplash.com/photo-1599785209707-a456fc1337bb?auto=format&fit=crop&w=600&q=80']
    }
];
async function seed() {
    try {
        console.log('🌱 Starting database seed script...');
        // 1. Connect MongoDB
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/vj_shopping_world';
        await mongoose.connect(mongoUri);
        console.log('✅ MongoDB connected for seeding.');
        // 2. Create Demo Users & Roles in PostgreSQL via Prisma
        const passwordHash = await bcrypt.hash('Password123!', 10);
        // Buyer User
        const buyerUser = await prisma.user.upsert({
            where: { phoneNumber: '9876543210' },
            update: {},
            create: {
                phoneNumber: '9876543210',
                name: 'Vishal Buyer',
                passwordHash,
                role: 'BUYER'
            }
        });
        // Merchant User
        const merchantUser = await prisma.user.upsert({
            where: { phoneNumber: '9876543211' },
            update: {},
            create: {
                phoneNumber: '9876543211',
                name: 'VJ Express Merchant Store',
                passwordHash,
                role: 'MERCHANT'
            }
        });
        // Merchant Profile
        const merchant = await prisma.merchant.upsert({
            where: { userId: merchantUser.id },
            update: {},
            create: {
                userId: merchantUser.id,
                legalName: 'VJ Express Hyperlocal Private Limited',
                gstNumber: '07AAAAA0000A1Z5',
                bankAccountNumber: '9182736450192837',
                bankIfsc: 'HDFC0001234',
                isKycVerified: true,
                latitude: 28.6139,
                longitude: 77.2090
            }
        });
        // Rider User
        const riderUser = await prisma.user.upsert({
            where: { phoneNumber: '9876543212' },
            update: {},
            create: {
                phoneNumber: '9876543212',
                name: 'Rahul Rider (Express Delivery)',
                passwordHash,
                role: 'RIDER'
            }
        });
        // Rider Profile
        await prisma.rider.upsert({
            where: { userId: riderUser.id },
            update: {},
            create: {
                userId: riderUser.id,
                vehicleNumber: 'DL-01-AB-1234',
                drivingLicense: 'DL1420110012345',
                isAvailable: true,
                currentLat: 28.6145,
                currentLng: 77.2095
            }
        });
        console.log('✅ PostgreSQL demo users, merchant, and rider seeded.');
        // 3. Seed MongoDB Products
        await Product.deleteMany({});
        const productsToInsert = sampleProducts.map((p) => ({
            ...p,
            merchantId: merchant.id
        }));
        await Product.insertMany(productsToInsert);
        console.log(`✅ MongoDB seeded with ${sampleProducts.length} products.`);
        console.log('🎉 Seeding completed successfully!');
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Seeding error:', error);
        process.exit(1);
    }
}
seed();
