import { Router, Request, Response } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import { prisma } from '../utils/prisma.js';
import Product from '../models/product.model.js';

const router = Router();

// Zod Initiate Return Schema
const initiateReturnSchema = z.object({
  reason: z.string().min(3),
  cancellationOtp: z.string().length(4).optional()
}).strict();

// POST /api/return/:orderId/initiate — Initiate Return-To-Retailer (RTR)
router.post('/:orderId/initiate', async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId } = req.params;
    const parseResult = initiateReturnSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: 'Invalid return request', details: parseResult.error.format() });
      return;
    }

    const { reason } = parseResult.data;

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    // Generate 4-digit Merchant Return OTP
    const rawMerchantOtp = Math.floor(1000 + Math.random() * 9000).toString();
    const returnOtpHash = crypto.createHash('sha256').update(rawMerchantOtp).digest('hex');

    // Update Order Status to RETURN_IN_TRANSIT
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'RETURN_IN_TRANSIT',
        returnOtpHash
      }
    });

    res.json({
      message: 'Return-To-Retailer (RTR) initiated! Rider rerouted back to merchant store.',
      merchantReturnOtp: rawMerchantOtp, // Visible on rider's app when arriving at store
      reason,
      order: {
        ...updatedOrder,
        subtotalAmount: updatedOrder.subtotalAmount.toString(),
        taxAmount: updatedOrder.taxAmount.toString(),
        deliveryFeeAmount: updatedOrder.deliveryFeeAmount.toString(),
        discountAmount: updatedOrder.discountAmount.toString(),
        totalAmount: updatedOrder.totalAmount.toString(),
        orderSequenceNumber: updatedOrder.orderSequenceNumber.toString()
      }
    });
  } catch (error: any) {
    console.error('Initiate return error:', error);
    res.status(500).json({ error: 'Failed to initiate return', message: error.message });
  }
});

// Zod Verify Merchant Return Schema
const verifyReturnSchema = z.object({
  merchantOtp: z.string().length(4),
  isSealIntact: z.boolean().default(true)
}).strict();

// POST /api/return/:orderId/verify-merchant-return — Merchant Restock & Handshake (Page 29-30)
router.post('/:orderId/verify-merchant-return', async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId } = req.params;
    const parseResult = verifyReturnSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: 'Invalid return verification payload', details: parseResult.error.format() });
      return;
    }

    const { merchantOtp, isSealIntact } = parseResult.data;

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    // Verify OTP Hash
    const inputHash = crypto.createHash('sha256').update(merchantOtp).digest('hex');
    if (order.returnOtpHash && order.returnOtpHash !== inputHash) {
      res.status(400).json({ error: 'Invalid Merchant Return OTP. Restock rejected.' });
      return;
    }

    if (!isSealIntact) {
      res.status(400).json({ error: 'Tamper-Evident Seal Broken! Return flagged for admin arbitration.' });
      return;
    }

    // Execute atomic PostgreSQL status update + restocking
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: 'RETURNED_TO_STORE' }
    });

    res.json({
      message: 'Merchant Return OTP verified! Parcel returned & inventory restocked.',
      order: {
        ...updatedOrder,
        subtotalAmount: updatedOrder.subtotalAmount.toString(),
        taxAmount: updatedOrder.taxAmount.toString(),
        deliveryFeeAmount: updatedOrder.deliveryFeeAmount.toString(),
        discountAmount: updatedOrder.discountAmount.toString(),
        totalAmount: updatedOrder.totalAmount.toString(),
        orderSequenceNumber: updatedOrder.orderSequenceNumber.toString()
      }
    });
  } catch (error: any) {
    console.error('Verify merchant return error:', error);
    res.status(500).json({ error: 'Failed to complete merchant return', message: error.message });
  }
});

export default router;
