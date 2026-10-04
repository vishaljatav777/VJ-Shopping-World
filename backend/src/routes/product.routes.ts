import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma.js';
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

const fallbackProducts = [
  {
    _id: '1',
    id: '1',
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
    id: '2',
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
    id: '3',
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
    id: '4',
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
    id: '5',
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

function serializeProduct(p: any) {
  return {
    ...p,
    _id: p.id,
    pricePaise: Number(p.pricePaise)
  };
}

// GET /api/products — Fetch catalog from PostgreSQL
router.get('/', async (req: Request, res: Response) => {
  try {
    const { category, search } = req.query;
    const whereFilter: any = { isAvailable: true };

    if (category) {
      whereFilter.category = String(category);
    }
    if (search) {
      whereFilter.title = { contains: String(search), mode: 'insensitive' };
    }

    const products = await prisma.product.findMany({
      where: whereFilter,
      orderBy: { createdAt: 'desc' }
    });

    if (products.length === 0) {
      return res.json({ count: fallbackProducts.length, products: fallbackProducts });
    }

    const serialized = products.map(serializeProduct);
    return res.json({ count: serialized.length, products: serialized });
  } catch (error) {
    console.warn('PostgreSQL product query fallback:', error);
    return res.json({ count: fallbackProducts.length, products: fallbackProducts });
  }
});

// GET /api/products/:id — Fetch single product from PostgreSQL
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const prodId = String(req.params.id);
    const product = await prisma.product.findUnique({
      where: { id: prodId }
    });

    if (!product) {
      const fallback = fallbackProducts.find(f => f.id === prodId || f._id === prodId);
      if (fallback) return res.json({ product: fallback });
      return res.status(404).json({ error: 'Product not found.' });
    }

    return res.json({ product: serializeProduct(product) });
  } catch (error) {
    const prodId = String(req.params.id);
    const fallback = fallbackProducts.find(f => f.id === prodId || f._id === prodId);
    if (fallback) return res.json({ product: fallback });
    return res.status(500).json({ error: 'Failed to fetch product details.' });
  }
});

// POST /api/products — Create product in PostgreSQL (Merchant role only)
router.post('/', authenticateJwt, requireRole(['MERCHANT', 'ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    const parseResult = ProductCreateSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Validation failed', details: parseResult.error.flatten() });
    }

    const { sku, title, description, category, pricePaise, stockQuantity, images } = parseResult.data;

    const newProduct = await prisma.product.create({
      data: {
        sku,
        title,
        description,
        category,
        pricePaise: BigInt(pricePaise),
        stockQuantity,
        isAvailable: stockQuantity > 0,
        images,
        merchantId: req.user!.id
      }
    });

    return res.status(201).json({ message: 'Product created successfully in PostgreSQL!', product: serializeProduct(newProduct) });
  } catch (error: any) {
    console.error('Create product error:', error);
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Product SKU must be unique.' });
    }
    return res.status(500).json({ error: 'Failed to create product.' });
  }
});

// POST /api/products/seed — Seed test products into PostgreSQL
router.post('/seed', async (_req: Request, res: Response) => {
  try {
    for (const prod of fallbackProducts) {
      await prisma.product.upsert({
        where: { sku: prod.sku },
        update: {},
        create: {
          sku: prod.sku,
          title: prod.title,
          description: prod.description,
          category: prod.category,
          pricePaise: BigInt(prod.pricePaise),
          stockQuantity: prod.stockQuantity,
          isAvailable: prod.isAvailable,
          images: prod.images
        }
      });
    }

    return res.json({ message: 'Sample test products seeded successfully into PostgreSQL.' });
  } catch (error) {
    console.error('Seed products error:', error);
    return res.status(500).json({ error: 'Failed to seed sample products.' });
  }
});

export default router;
