import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { prisma } from './utils/prisma.js';

dotenv.config();


async function seed() {
  try {
    console.log('🌱 Starting PostgreSQL database seed script...');
    await prisma.$connect();

    // 1. Create Demo Users & Roles in PostgreSQL via Prisma
    const passwordHash = await bcrypt.hash('Password123!', 10);

    // Buyer User
    await prisma.user.upsert({
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

    // 2. Seed PostgreSQL Products
    for (const p of sampleProducts) {
      await prisma.product.upsert({
        where: { sku: p.sku },
        update: {},
        create: {
          sku: p.sku,
          title: p.title,
          description: p.description,
          category: p.category,
          pricePaise: BigInt(p.pricePaise),
          stockQuantity: p.stockQuantity,
          isAvailable: p.isAvailable,
          images: p.images,
          merchantId: merchant.id
        }
      });
    }

    console.log(`✅ PostgreSQL seeded with ${sampleProducts.length} products.`);

    console.log('🎉 Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
}

seed();
