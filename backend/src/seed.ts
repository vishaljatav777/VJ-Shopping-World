import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { prisma } from './utils/prisma.js';

dotenv.config();

const sampleProducts = [
  { sku: 'GROC-MILK-001', title: 'Amul Taaza Toned Milk 1L', description: 'Fresh toned milk, pasteurized and homogenized. Perfect for daily tea, coffee, and cereal.', category: 'Grocery', pricePaise: 6800, stockQuantity: 150, isAvailable: true, images: ['https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80'] },
  { sku: 'GROC-BREAD-001', title: 'Britannia Brown Bread 400g', description: 'Wholesome brown bread baked fresh. Soft, fluffy, and perfect for sandwiches.', category: 'Grocery', pricePaise: 4500, stockQuantity: 80, isAvailable: true, images: ['https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80'] },
  { sku: 'GROC-RICE-001', title: 'India Gate Basmati Rice 5kg', description: 'Premium long-grain aged basmati rice. Aromatic and fluffy when cooked.', category: 'Grocery', pricePaise: 72000, stockQuantity: 40, isAvailable: true, images: ['https://images.unsplash.com/photo-1516684732162-798a0062be99?auto=format&fit=crop&w=600&q=80'] },
  { sku: 'ELEC-HEAD-001', title: 'boAt Rockerz 450 Bluetooth Headphones', description: 'On-ear wireless headphones with 15-hour playback, immersive bass, and comfy padding.', category: 'Electronics', pricePaise: 149900, stockQuantity: 25, isAvailable: true, images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80'] },
  { sku: 'ELEC-CHAR-001', title: 'Mi 20W Fast Charger with USB-C Cable', description: 'Compact 20W fast charger with braided USB-C cable. Charges phones and accessories quickly.', category: 'Electronics', pricePaise: 89900, stockQuantity: 60, isAvailable: true, images: ['https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=600&q=80'] },
  { sku: 'ELEC-EARB-001', title: 'Realme Buds Air 3 Wireless Earbuds', description: 'True wireless earbuds with active noise cancellation and 30-hour total battery life.', category: 'Electronics', pricePaise: 299900, stockQuantity: 15, isAvailable: true, images: ['https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=600&q=80'] },
  { sku: 'PROD-TOM-001', title: 'Fresh Organic Tomatoes 500g', description: 'Farm-fresh organic tomatoes, vine-ripened for maximum flavor. Perfect for curries and salads.', category: 'Fresh Produce', pricePaise: 3500, stockQuantity: 100, isAvailable: true, images: ['https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80'] },
  { sku: 'PROD-APPLE-001', title: 'Shimla Apples 1kg', description: 'Crisp and juicy Shimla apples, hand-picked for freshness and sweetness.', category: 'Fresh Produce', pricePaise: 18900, stockQuantity: 70, isAvailable: true, images: ['https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=600&q=80'] },
  { sku: 'PROD-SPIN-001', title: 'Fresh Spinach (Palak) 250g', description: 'Tender green spinach leaves, washed and ready to cook. Rich in iron and vitamins.', category: 'Fresh Produce', pricePaise: 2500, stockQuantity: 90, isAvailable: true, images: ['https://images.unsplash.com/photo-1574316071802-0d684efa7bf5?auto=format&fit=crop&w=600&q=80'] },
  { sku: 'LOCL-SNACK-001', title: 'Local Namkeen Mix 200g', description: 'Crunchy assorted namkeen mix from your neighborhood store. Spicy and savory.', category: 'Local Stores', pricePaise: 5500, stockQuantity: 120, isAvailable: true, images: ['https://images.unsplash.com/photo-1613919113640-25732ec5e61f?auto=format&fit=crop&w=600&q=80'] },
  { sku: 'LOCL-SWEET-001', title: 'Fresh Gulab Jamun 1 dozen', description: 'Soft, syrup-soaked gulab jamuns made fresh at the local sweet shop. A classic Indian dessert.', category: 'Local Stores', pricePaise: 12000, stockQuantity: 30, isAvailable: true, images: ['https://images.unsplash.com/photo-1642821373181-696a54913e93?auto=format&fit=crop&w=600&q=80'] },
  { sku: 'LOCL-TEA-001', title: 'Local Masala Chai Blend 250g', description: 'Aromatic masala chai blend with cardamom, ginger, and clove. Brew the perfect cup every time.', category: 'Local Stores', pricePaise: 8500, stockQuantity: 50, isAvailable: true, images: ['https://images.unsplash.com/photo-1597318181409-cf64d0b5d8a2?auto=format&fit=crop&w=600&q=80'] },
];

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
        update: { images: p.images },
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
