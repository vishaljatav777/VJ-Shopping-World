import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma.js';
import Product from '../models/product.model.js';
import { 
  generateHandshakeOtp, 
  calculateHaversineDistanceMeters, 
  evaluateOrderRisk, 
  calculateGstTaxSplit 
} from '../utils/securityEngine.js';

const router = Router();

// Zod Checkout Schema with Strict Quantity Caps (Max 10 per SKU)
const checkoutSchema = z.object({
  buyerId: z.string().uuid(),
  merchantId: z.string().uuid(),
  paymentMode: z.enum(['COD', 'ONLINE']).default('ONLINE'),
  items: z.array(
    z.object({
      productId: z.string(),
      quantity: z.number().int().positive().max(10, 'Single-order item quantity capped at 10 items')
    }).strict()
  ).nonempty(),
  shippingAddress: z.object({
    street: z.string(),
    city: z.string(),
    pincode: z.string(),
    contactPhone: z.string()
  }).strict(),
  dropoffLatitude: z.number().optional(),
  dropoffLongitude: z.number().optional()
}).strict();

// POST /api/orders/checkout — Create order, risk assessment, GST tax invoice, and 4-digit Handshake OTP
router.post('/checkout', async (req: Request, res: Response): Promise<void> => {
  try {
    const parseResult = checkoutSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: 'Invalid checkout request data', details: parseResult.error.format() });
      return;
    }

    const { buyerId, merchantId, paymentMode, items, shippingAddress, dropoffLatitude, dropoffLongitude } = parseResult.data;

    // Verify Buyer & Merchant exist
    const buyer = await prisma.user.findUnique({ where: { id: buyerId } });
    if (!buyer) {
      res.status(404).json({ error: 'Buyer not found' });
      return;
    }

    const merchant = await prisma.merchant.findUnique({ where: { id: merchantId } });
    if (!merchant) {
      res.status(404).json({ error: 'Merchant store not found' });
      return;
    }

    // Recalculate Subtotal on Server in Paise from MongoDB products
    let calculatedSubtotalPaise = 0n;

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product || !product.isAvailable) {
        res.status(400).json({ error: `Product unavailable: ${item.productId}` });
        return;
      }
      if (product.stockQuantity < item.quantity) {
        res.status(400).json({ error: `Insufficient stock for product: ${product.title}` });
        return;
      }
      calculatedSubtotalPaise += BigInt(product.pricePaise) * BigInt(item.quantity);
    }

    // Flat Hyperlocal Delivery Fee: ₹49 (4900 Paise)
    const deliveryFeePaise = 4900n;

    // GST Tax Compliance Breakdown
    const taxBreakdown = calculateGstTaxSplit({
      subtotalPaise: calculatedSubtotalPaise,
      merchantStateCode: '07', // Delhi
      buyerStateCode: '07',    // Delhi
      invoiceSequenceNumber: Math.floor(Math.random() * 9000) + 1000
    });

    const totalAmountPaise = calculatedSubtotalPaise + deliveryFeePaise + taxBreakdown.totalTaxPaise;

    // Dynamic Anti-Fraud Risk Engine
    const riskAssessment = evaluateOrderRisk({
      isNewAccount: false,
      paymentMethod: paymentMode,
      orderTotalPaise: totalAmountPaise,
      buyerPhone: shippingAddress.contactPhone
    });

    if (!riskAssessment.isCodAllowed && paymentMode === 'COD') {
      res.status(400).json({
        error: 'High-risk order: COD disabled for orders over ₹2,500. Please select online payment.',
        riskFlags: riskAssessment.riskFlags
      });
      return;
    }

    // Generate 4-digit Delivery Handshake OTP
    const { otp: rawDeliveryOtp, hash: deliveryOtpHash } = generateHandshakeOtp();

    // Assign available rider automatically if available
    const availableRider = await prisma.rider.findFirst({
      where: { isAvailable: true }
    });

    // Execute atomic PostgreSQL financial transaction
    const order = await prisma.$transaction(async (tx) => {
      // 1. Create Order
      const newOrder = await tx.order.create({
        data: {
          buyerId,
          merchantId,
          riderId: availableRider?.id || null,
          status: 'CREATED',
          paymentStatus: 'CAPTURED',
          subtotalAmount: calculatedSubtotalPaise,
          taxAmount: taxBreakdown.totalTaxPaise,
          deliveryFeeAmount: deliveryFeePaise,
          discountAmount: 0n,
          totalAmount: totalAmountPaise,
          deliveryOtpHash,
          shippingAddress: shippingAddress as any,
          dropoffLatitude: dropoffLatitude || 28.6139,
          dropoffLongitude: dropoffLongitude || 77.2090
        }
      });

      // 2. Create Double-Entry Ledger for Escrow hold
      const prevLedger = await tx.ledgerEntry.findFirst({
        where: { merchantId },
        orderBy: { createdAt: 'desc' }
      });
      const runningBalance = (prevLedger?.runningBalance || 0n) + totalAmountPaise;

      await tx.ledgerEntry.create({
        data: {
          orderId: newOrder.id,
          merchantId,
          accountType: 'ESCROW_HOLD',
          debitPaise: 0n,
          creditPaise: totalAmountPaise,
          runningBalance,
          transactionHash: `TX_${Date.now()}_${newOrder.id.slice(0, 8)}`,
          prevRecordHash: prevLedger?.transactionHash || 'GENESIS'
        }
      });

      // 3. Outbox Event
      await tx.outboxEvent.create({
        data: {
          aggregateType: 'ORDER',
          aggregateId: newOrder.id,
          eventType: 'ORDER_CREATED',
          payload: {
            orderId: newOrder.id,
            buyerId,
            merchantId,
            totalAmountPaise: totalAmountPaise.toString()
          },
          orderId: newOrder.id
        }
      });

      return newOrder;
    });

    // Convert BigInt to string for JSON serialization
    res.status(201).json({
      message: 'Order created successfully with 4-digit Handshake OTP!',
      deliveryOtp: rawDeliveryOtp, // Returned to buyer UI for handshake verification
      taxInvoice: taxBreakdown.invoiceNumber,
      order: {
        ...order,
        subtotalAmount: order.subtotalAmount.toString(),
        taxAmount: order.taxAmount.toString(),
        deliveryFeeAmount: order.deliveryFeeAmount.toString(),
        discountAmount: order.discountAmount.toString(),
        totalAmount: order.totalAmount.toString(),
        orderSequenceNumber: order.orderSequenceNumber.toString()
      }
    });
  } catch (error: any) {
    console.error('Order Checkout Error:', error);
    res.status(500).json({ error: 'Order checkout failed', message: error.message });
  }
});

// POST /api/orders/:orderId/verify-delivery-otp — Geofenced & OTP Delivery Handshake (Page 5, 8)
const verifyDeliverySchema = z.object({
  otp: z.string().length(4),
  riderLat: z.number(),
  riderLng: z.number()
}).strict();

router.post('/:orderId/verify-delivery-otp', async (req: Request, res: Response): Promise<void> => {
  try {
    const orderId = req.params.orderId as string;
    const parseResult = verifyDeliverySchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: 'Invalid payload for delivery OTP verification', details: parseResult.error.format() });
      return;
    }

    const { otp, riderLat, riderLng } = parseResult.data;

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    // 1. Geofence Distance Check (< 150m radius)
    const dropoffLat = order.dropoffLatitude || 28.6139;
    const dropoffLng = order.dropoffLongitude || 77.2090;

    const distanceMeters = calculateHaversineDistanceMeters(riderLat, riderLng, dropoffLat, dropoffLng);

    if (distanceMeters > 150) {
      res.status(400).json({
        error: `Geofence check failed: Rider is ${Math.round(distanceMeters)}m away from customer dropoff location (Must be within 150m).`
      });
      return;
    }

    // 2. Handshake OTP Hash Verification
    const crypto = await import('crypto');
    const inputHash = crypto.createHash('sha256').update(otp).digest('hex');

    if (order.deliveryOtpHash && order.deliveryOtpHash !== inputHash) {
      res.status(400).json({ error: 'Invalid 4-digit Delivery Handshake OTP.' });
      return;
    }

    // Update Order Status to DELIVERED
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: 'DELIVERED' }
    });

    res.json({
      message: 'Delivery Handshake verified! Order marked DELIVERED.',
      distanceMeters: Math.round(distanceMeters),
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
    console.error('Verify delivery OTP error:', error);
    res.status(500).json({ error: 'Failed to verify delivery OTP', message: error.message });
  }
});

// GET /api/orders/user/:buyerId — Get buyer orders
router.get('/user/:buyerId', async (req: Request, res: Response): Promise<void> => {
  try {
    const buyerId = req.params.buyerId as string;
    const orders = await prisma.order.findMany({
      where: { buyerId },
      include: { merchant: true, rider: true },
      orderBy: { createdAt: 'desc' }
    });

    const serializedOrders = orders.map((o) => ({
      ...o,
      subtotalAmount: o.subtotalAmount.toString(),
      taxAmount: o.taxAmount.toString(),
      deliveryFeeAmount: o.deliveryFeeAmount.toString(),
      discountAmount: o.discountAmount.toString(),
      totalAmount: o.totalAmount.toString(),
      orderSequenceNumber: o.orderSequenceNumber.toString()
    }));

    res.json({ orders: serializedOrders });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch user orders', message: error.message });
  }
});

// GET /api/orders/:orderId — Get order status
router.get('/:orderId', async (req: Request, res: Response): Promise<void> => {
  try {
    const orderId = req.params.orderId as string;
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { merchant: true, rider: true }
    });

    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    res.json({
      order: {
        ...order,
        subtotalAmount: order.subtotalAmount.toString(),
        taxAmount: order.taxAmount.toString(),
        deliveryFeeAmount: order.deliveryFeeAmount.toString(),
        discountAmount: order.discountAmount.toString(),
        totalAmount: order.totalAmount.toString(),
        orderSequenceNumber: order.orderSequenceNumber.toString()
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch order', message: error.message });
  }
});

// PATCH /api/orders/:orderId/status — Update order status
const updateStatusSchema = z.object({
  status: z.enum([
    'CREATED',
    'PAYMENT_PENDING',
    'MERCHANT_PREPARING',
    'READY_FOR_PICKUP',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
    'CANCELLATION_REQUESTED',
    'RETURN_IN_TRANSIT',
    'RETURNED_TO_STORE',
    'REFUNDED'
  ])
}).strict();

router.patch('/:orderId/status', async (req: Request, res: Response): Promise<void> => {
  try {
    const orderId = req.params.orderId as string;
    const parseResult = updateStatusSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: 'Invalid status update', details: parseResult.error.format() });
      return;
    }

    const { status } = parseResult.data;

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status }
    });

    res.json({
      message: `Order status updated to ${status}`,
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
    res.status(500).json({ error: 'Failed to update order status', message: error.message });
  }
});

export default router;
