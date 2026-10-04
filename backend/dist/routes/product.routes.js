import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma.js';
import { authenticateJwt, requireRole } from '../middleware/auth.middleware.js';
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
function serializeProduct(p) {
    return {
        ...p,
        _id: p.id,
        pricePaise: Number(p.pricePaise)
    };
}
// GET /api/products — Fetch product catalog directly from PostgreSQL database
router.get('/', async (req, res) => {
    try {
        const { category, search } = req.query;
        const whereFilter = { isAvailable: true };
        if (category && String(category) !== 'ALL') {
            whereFilter.category = String(category);
        }
        if (search) {
            whereFilter.title = { contains: String(search), mode: 'insensitive' };
        }
        const products = await prisma.product.findMany({
            where: whereFilter,
            orderBy: { createdAt: 'desc' }
        });
        const serialized = products.map(serializeProduct);
        return res.json({ count: serialized.length, products: serialized });
    }
    catch (error) {
        console.error('PostgreSQL product fetch error:', error);
        return res.json({ count: 0, products: [] });
    }
});
// GET /api/products/:id — Fetch single product directly from PostgreSQL database
router.get('/:id', async (req, res) => {
    try {
        const prodId = String(req.params.id);
        const product = await prisma.product.findUnique({
            where: { id: prodId }
        });
        if (!product) {
            return res.status(404).json({ error: 'Product not found.' });
        }
        return res.json({ product: serializeProduct(product) });
    }
    catch (error) {
        console.error('Fetch single product error:', error);
        return res.status(500).json({ error: 'Failed to fetch product details.' });
    }
});
// POST /api/products — Create product in PostgreSQL database (Merchant role only)
router.post('/', authenticateJwt, requireRole(['MERCHANT', 'ADMIN']), async (req, res) => {
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
                merchantId: req.user.id
            }
        });
        return res.status(201).json({ message: 'Product created successfully in PostgreSQL database!', product: serializeProduct(newProduct) });
    }
    catch (error) {
        console.error('Create product error:', error);
        if (error.code === 'P2002') {
            return res.status(409).json({ error: 'Product SKU must be unique.' });
        }
        return res.status(500).json({ error: 'Failed to create product in database.' });
    }
});
export default router;
