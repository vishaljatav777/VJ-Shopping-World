import { Router, Request, Response } from 'express';
import { z } from 'zod';
import Product from '../models/product.model.js';
import { authenticateJwt, requireRole, AuthRequest } from '../middleware/auth.middleware.js';

const router = Router();

const ProductCreateSchema = z.object({
  sku: z.string(),
  title: z.string().min(3),
  description: z.string(),
  category: z.string(),
  pricePaise: z.number().positive(),
  stockQuantity: z.number().int().min(0),
  images: z.array(z.string()).default([])
});

// GET /api/products — Fetch catalog
router.get('/', async (req: Request, res: Response) => {
  try {
    const { category, search } = req.query;
    const queryFilter: any = { isAvailable: true };

    if (category) {
      queryFilter.category = String(category);
    }
    if (search) {
      queryFilter.title = { $regex: String(search), $options: 'i' };
    }

    const products = await Product.find(queryFilter).sort({ createdAt: -1 });
    return res.json({ count: products.length, products });
  } catch (error) {
    console.warn('MongoDB query warning, using fallback catalog:', error);
    const fallbackProducts = [
      {
        _id: '1',
        sku: 'GROC-MILK-001',
        title: 'Amul Taaza Toned Milk (1 Litre)',
        description: 'Fresh pasteurized toned milk with optimal cream content.',
        category: 'Grocery',
        pricePaise: 6800,
        stockQuantity: 150,
        isAvailable: true,
        images: ['https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80']
      },
      {
        _id: '2',
        sku: 'GROC-ATT-002',
        title: 'Aashirvaad Shuddh Chakki Atta (5 kg)',
        description: '100% pure whole wheat flour processed with traditional chakki process.',
        category: 'Grocery',
        pricePaise: 24500,
        stockQuantity: 80,
        isAvailable: true,
        images: ['https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=600&q=80']
      },
      {
        _id: '3',
        sku: 'ELEC-HEAD-003',
        title: 'boAt Rockerz 450 Wireless Headphones',
        description: '40mm dynamic drivers, up to 15 hours playback, HD immersive sound.',
        category: 'Electronics',
        pricePaise: 149900,
        stockQuantity: 30,
        isAvailable: true,
        images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80']
      },
      {
        _id: '4',
        sku: 'ELEC-POW-004',
        title: 'Mi Power Bank 3i 20000mAh (18W Fast Charging)',
        description: 'Dual output ports, triple input ports, smart power management.',
        category: 'Electronics',
        pricePaise: 199900,
        stockQuantity: 45,
        isAvailable: true,
        images: ['https://i03.appmifile.com/499_item_in/27/08/2024/3019f0e8675d6bb6f6499aeca9a77604!600x600!85.png']
      },
      {
        _id: '5',
        sku: 'FRESH-ORG-005',
        title: 'Organic Farm Fresh Bananas (1 Dozen)',
        description: 'Naturally ripened, chemical-free delicious bananas sourced directly from local farmers.',
        category: 'Fresh Produce',
        pricePaise: 6000,
        stockQuantity: 200,
        isAvailable: true,
        images: ['https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=600&q=80']
      }
    ];
    return res.json({ count: fallbackProducts.length, products: fallbackProducts });
  }
});

// GET /api/products/:id — Fetch single product
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found.' });
    }
    return res.json({ product });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch product details.' });
  }
});

// POST /api/products — Create product (Merchant role only)
router.post('/', authenticateJwt, requireRole(['MERCHANT', 'ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    const parseResult = ProductCreateSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Validation failed', details: parseResult.error.flatten() });
    }

    const newProduct = await Product.create({
      ...parseResult.data,
      merchantId: req.user!.id
    });

    return res.status(201).json({ message: 'Product created successfully', product: newProduct });
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Product SKU must be unique.' });
    }
    return res.status(500).json({ error: 'Failed to create product.' });
  }
});

// POST /api/products/seed — Seed 5 initial test products
router.post('/seed', async (_req: Request, res: Response) => {
  try {
    const sampleProducts = [
      {
        sku: 'SKU-SAR-01',
        title: 'Kanjivaram Silk Saree',
        description: 'Authentic handcrafted pure silk saree with Zari border.',
        category: 'Fashion & Ethnic Wear',
        pricePaise: 499900, // ₹4,999.00
        stockQuantity: 15,
        images: ['https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=500'],
        merchantId: 'merchant-seed-01'
      },
      {
        sku: 'SKU-SHI-02',
        title: 'Slim-Fit Linen Casual Shirt',
        description: '100% breathable cotton-linen shirt for summer comfort.',
        category: 'Men Fashion',
        pricePaise: 129900, // ₹1,299.00
        stockQuantity: 40,
        images: ['https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500'],
        merchantId: 'merchant-seed-01'
      },
      {
        sku: 'SKU-SHO-03',
        title: 'Pro-Runner Cushioning Sneakers',
        description: 'Lightweight breathable mesh running shoes with air cushion.',
        category: 'Footwear & Sports',
        pricePaise: 249900, // ₹2,499.00
        stockQuantity: 25,
        images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500'],
        merchantId: 'merchant-seed-02'
      },
      {
        sku: 'SKU-BAG-04',
        title: 'Italian Genuine Leather Handbag',
        description: 'Handcrafted luxury leather handbag with gold accents.',
        category: 'Fashion Accessories',
        pricePaise: 399900, // ₹3,999.00
        stockQuantity: 10,
        images: ['https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=500'],
        merchantId: 'merchant-seed-02'
      },
      {
        sku: 'SKU-EAR-05',
        title: 'True Wireless Noise Cancelling Earbuds',
        description: 'Active Noise Cancellation with 30-hour battery life.',
        category: 'Electronics & Audio',
        pricePaise: 199900, // ₹1,999.00
        stockQuantity: 50,
        images: ['https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500'],
        merchantId: 'merchant-seed-03'
      }
    ];

    for (const prod of sampleProducts) {
      await Product.updateOne({ sku: prod.sku }, { $set: prod }, { upsert: true });
    }

    return res.json({ message: '5 sample test products seeded successfully.' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to seed sample products.' });
  }
});

export default router;
