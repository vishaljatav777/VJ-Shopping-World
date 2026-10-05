import { Router, Response } from 'express';
import { z } from 'zod';
import { redis } from '../index.js';
import { prisma } from '../utils/prisma.js';
import { authenticateJwt, AuthRequest } from '../middleware/auth.middleware.js';

const router = Router();

const ReserveCartSchema = z.object({
  sku: z.string(),
  quantity: z.number().int().positive()
});

// POST /api/cart/reserve — Reserve stock for 10 minutes (600s TTL) in Redis
router.post('/reserve', authenticateJwt, async (req: AuthRequest, res: Response) => {
  try {
    const parseResult = ReserveCartSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Validation failed', details: parseResult.error.flatten() });
    }

    const { sku, quantity } = parseResult.data;
    const userId = req.user!.id;

    // Check actual stock in MySQL
    const product = await prisma.product.findUnique({ where: { sku } }).catch(() => null);
    if (!product || !product.isAvailable) {
      return res.status(404).json({ error: 'Product unavailable or out of stock.' });
    }

    if (product.stockQuantity < quantity) {
      return res.status(400).json({ error: `Insufficient stock. Only ${product.stockQuantity} items remaining.` });
    }

    // Set 10-minute ephemeral cart lock in Redis
    const lockKey = `cart:lock:${sku}:${userId}`;
    const acquired = await redis.set(lockKey, String(quantity), 'EX', 600, 'NX');

    if (!acquired) {
      // Extend TTL if already locked by user
      await redis.expire(lockKey, 600);
    }

    return res.json({
      message: 'Item reserved in cart for 10 minutes.',
      lockKey,
      sku,
      reservedQuantity: quantity,
      expiresInSeconds: 600
    });
  } catch (error) {
    console.error('Cart Reservation Error:', error);
    return res.status(500).json({ error: 'Failed to reserve cart item.' });
  }
});

// DELETE /api/cart/release — Release cart reservation
router.delete('/release', authenticateJwt, async (req: AuthRequest, res: Response) => {
  try {
    const { sku } = req.body;
    const userId = req.user!.id;
    const lockKey = `cart:lock:${sku}:${userId}`;

    await redis.del(lockKey);
    return res.json({ message: 'Cart lock released successfully.' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to release cart lock.' });
  }
});

export default router;
