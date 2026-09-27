import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma.js';

const router = Router();

// GET /api/rider/console — Fetch rider profile & assigned delivery orders
router.get('/console', async (_req: Request, res: Response): Promise<void> => {
  try {
    const rider = await prisma.rider.findFirst({
      include: {
        user: true,
        deliveries: {
          orderBy: { createdAt: 'desc' },
          include: { merchant: true, buyer: true }
        }
      }
    });

    if (!rider) {
      res.status(404).json({ error: 'Rider profile not found' });
      return;
    }

    const serializedDeliveries = rider.deliveries.map((d) => ({
      ...d,
      subtotalAmount: d.subtotalAmount.toString(),
      taxAmount: d.taxAmount.toString(),
      deliveryFeeAmount: d.deliveryFeeAmount.toString(),
      discountAmount: d.discountAmount.toString(),
      totalAmount: d.totalAmount.toString(),
      orderSequenceNumber: d.orderSequenceNumber.toString()
    }));

    res.json({
      rider: {
        ...rider,
        walletBalancePaise: rider.walletBalancePaise.toString()
      },
      deliveries: serializedDeliveries
    });
  } catch (error: any) {
    console.error('Rider console error:', error);
    res.status(500).json({ error: 'Failed to fetch rider console data', message: error.message });
  }
});

// PATCH /api/rider/toggle-availability — Toggle rider online status
router.patch('/toggle-availability', async (_req: Request, res: Response): Promise<void> => {
  try {
    const rider = await prisma.rider.findFirst();
    if (!rider) {
      res.status(404).json({ error: 'Rider profile not found' });
      return;
    }

    const updatedRider = await prisma.rider.update({
      where: { id: rider.id },
      data: { isAvailable: !rider.isAvailable }
    });

    res.json({
      message: `Rider is now ${updatedRider.isAvailable ? 'Online & Available' : 'Offline'}`,
      isAvailable: updatedRider.isAvailable
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to toggle availability', message: error.message });
  }
});

export default router;
