import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma.js';
import Product from '../models/product.model.js';
const router = Router();
// Zod Product Creation Schema
const createProductSchema = z.object({
    sku: z.string().min(3),
    title: z.string().min(2),
    description: z.string().min(5),
    category: z.string(),
    priceRupees: z.number().positive(),
    stockQuantity: z.number().int().nonnegative(),
    imageUrl: z.string().url().optional()
}).strict();
// GET /api/merchant/dashboard — Get merchant store data & active store orders
router.get('/dashboard', async (_req, res) => {
    try {
        const merchant = await prisma.merchant.findFirst({
            include: {
                user: true,
                orders: {
                    orderBy: { createdAt: 'desc' },
                    include: { buyer: true, rider: true }
                },
                ledgerEntries: {
                    orderBy: { createdAt: 'desc' },
                    take: 10
                }
            }
        });
        if (!merchant) {
            res.status(404).json({ error: 'Merchant account not found' });
            return;
        }
        // Fetch products belonging to this merchant from MongoDB
        const products = await Product.find({ merchantId: merchant.id }).sort({ createdAt: -1 });
        const serializedOrders = merchant.orders.map((o) => ({
            ...o,
            subtotalAmount: o.subtotalAmount.toString(),
            taxAmount: o.taxAmount.toString(),
            deliveryFeeAmount: o.deliveryFeeAmount.toString(),
            discountAmount: o.discountAmount.toString(),
            totalAmount: o.totalAmount.toString(),
            orderSequenceNumber: o.orderSequenceNumber.toString()
        }));
        const serializedLedger = merchant.ledgerEntries.map((l) => ({
            ...l,
            debitPaise: l.debitPaise.toString(),
            creditPaise: l.creditPaise.toString(),
            runningBalance: l.runningBalance.toString()
        }));
        res.json({
            merchant: {
                ...merchant,
                escrowBalancePaise: merchant.escrowBalancePaise.toString(),
                ledgerBalancePaise: merchant.ledgerBalancePaise.toString()
            },
            products,
            orders: serializedOrders,
            ledger: serializedLedger
        });
    }
    catch (error) {
        console.error('Merchant dashboard error:', error);
        res.status(500).json({ error: 'Failed to load merchant dashboard', message: error.message });
    }
});
// POST /api/merchant/products — Create new product in MongoDB
router.post('/products', async (req, res) => {
    try {
        const parseResult = createProductSchema.safeParse(req.body);
        if (!parseResult.success) {
            res.status(400).json({ error: 'Invalid product input', details: parseResult.error.format() });
            return;
        }
        const { sku, title, description, category, priceRupees, stockQuantity, imageUrl } = parseResult.data;
        // Get primary merchant ID
        const merchant = await prisma.merchant.findFirst();
        if (!merchant) {
            res.status(404).json({ error: 'Merchant account not found' });
            return;
        }
        const pricePaise = Math.round(priceRupees * 100);
        const newProduct = await Product.create({
            sku,
            title,
            description,
            category,
            pricePaise,
            stockQuantity,
            isAvailable: stockQuantity > 0,
            images: imageUrl ? [imageUrl] : ['https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80'],
            merchantId: merchant.id
        });
        res.status(201).json({ message: 'Product created successfully', product: newProduct });
    }
    catch (error) {
        console.error('Create product error:', error);
        res.status(500).json({ error: 'Failed to create product', message: error.message });
    }
});
export default router;
