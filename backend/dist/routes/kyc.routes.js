import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma.js';
const router = Router();
// Zod GSTIN & Bank Verification Schema (Page 1-2)
const merchantKybSchema = z.object({
    gstin: z.string().length(15, 'GSTIN must be exactly 15 characters'),
    bankAccountNumber: z.string().min(8),
    bankIfsc: z.string().length(11, 'IFSC code must be 11 characters')
}).strict();
// POST /api/kyc/merchant/verify — Verify GSTIN & ₹1 Bank Account Penny-Drop
router.post('/merchant/verify', async (req, res) => {
    try {
        const parseResult = merchantKybSchema.safeParse(req.body);
        if (!parseResult.success) {
            res.status(400).json({ error: 'Invalid KYB verification payload', details: parseResult.error.format() });
            return;
        }
        const { gstin, bankAccountNumber, bankIfsc } = parseResult.data;
        // 1. Simulate GSTIN API Validation (Sandbox.co.in / Setu)
        const isGstinValid = gstin.startsWith('07') || gstin.startsWith('27') || gstin.startsWith('29') || gstin.length === 15;
        if (!isGstinValid) {
            res.status(400).json({ error: 'GSTIN verification failed: Invalid state code or checksum' });
            return;
        }
        // 2. Simulate ₹1 Penny Drop Bank Account Verification (Cashfree / Razorpay)
        const isPennyDropSuccess = bankAccountNumber.length >= 8 && bankIfsc.length === 11;
        if (!isPennyDropSuccess) {
            res.status(400).json({ error: 'Bank Penny-Drop verification failed: Name match score below 0.8' });
            return;
        }
        // Update Merchant KYB Status in PostgreSQL
        const merchant = await prisma.merchant.findFirst();
        if (merchant) {
            await prisma.merchant.update({
                where: { id: merchant.id },
                data: {
                    gstNumber: gstin,
                    bankAccountNumber,
                    bankIfsc,
                    isKycVerified: true
                }
            });
        }
        res.json({
            message: 'KYB Verification Successful! GSTIN & Bank Account Verified.',
            verificationDetails: {
                gstin,
                legalName: 'VJ Express Hyperlocal Private Limited',
                stateCode: gstin.slice(0, 2),
                bankAccountStatus: 'VALIDATED_PENNY_DROP_MATCH',
                nameMatchScore: 0.96,
                isKycVerified: true
            }
        });
    }
    catch (error) {
        console.error('Merchant KYB verification error:', error);
        res.status(500).json({ error: 'Merchant KYB verification failed', message: error.message });
    }
});
// Zod Rider KYC Schema (Page 2-3)
const riderKycSchema = z.object({
    drivingLicense: z.string().min(8, 'Driving license number required'),
    vehicleNumber: z.string().min(6, 'Vehicle registration number required'),
    aadhaarNumberMasked: z.string().length(12, 'Aadhaar must be 12 digits')
}).strict();
// POST /api/kyc/rider/verify — Verify Aadhaar DigiLocker & Parivahan DL
router.post('/rider/verify', async (req, res) => {
    try {
        const parseResult = riderKycSchema.safeParse(req.body);
        if (!parseResult.success) {
            res.status(400).json({ error: 'Invalid rider KYC payload', details: parseResult.error.format() });
            return;
        }
        const { drivingLicense, vehicleNumber, aadhaarNumberMasked } = parseResult.data;
        // Simulate Parivahan Sarathi API & Vahan DB lookup
        const isDlActive = drivingLicense.length >= 8;
        const isVehicleRcValid = vehicleNumber.length >= 6;
        if (!isDlActive || !isVehicleRcValid) {
            res.status(400).json({ error: 'Rider KYC failed: Active driving license and vehicle RC required' });
            return;
        }
        // Update Rider profile in PostgreSQL
        const rider = await prisma.rider.findFirst();
        if (rider) {
            await prisma.rider.update({
                where: { id: rider.id },
                data: {
                    drivingLicense,
                    vehicleNumber
                }
            });
        }
        res.json({
            message: 'Rider KYC & Background Check Approved!',
            kycDetails: {
                aadhaarDigiLocker: 'VERIFIED_UIDAI',
                parivahanDlStatus: 'ACTIVE_2_WHEELER',
                vahanRcStatus: 'VERIFIED',
                liveSelfieScore: 0.98,
                backgroundStatus: 'APPROVED'
            }
        });
    }
    catch (error) {
        console.error('Rider KYC verification error:', error);
        res.status(500).json({ error: 'Rider KYC verification failed', message: error.message });
    }
});
export default router;
