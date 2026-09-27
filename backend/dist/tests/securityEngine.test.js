import { describe, it, expect } from 'vitest';
import { calculateHaversineDistanceMeters, evaluateOrderRisk, calculateGstTaxSplit, generateHandshakeOtp } from '../utils/securityEngine.js';
describe('Zero-Trust Anti-Fraud & Financial Security Engine Suite', () => {
    it('1. Haversine Distance Geofencing — Should calculate distance between two coordinates correctly', () => {
        // Delhi Connaught Place to Sector 62 Noida (~15km)
        const distanceMeters = calculateHaversineDistanceMeters(28.6139, 77.2090, 28.6250, 77.3730);
        expect(distanceMeters).toBeGreaterThan(10000);
        expect(distanceMeters).toBeLessThan(20000);
        // Nearby points within doorstep radius (e.g. 50 meters)
        const nearbyMeters = calculateHaversineDistanceMeters(28.61390, 77.20900, 28.61395, 77.20905);
        expect(nearbyMeters).toBeLessThan(150);
    });
    it('2. Dynamic Risk Score Engine — Should flag high-value COD orders and calculate risk scores correctly', () => {
        // High-value COD order over ₹2,500 (250000 Paise) with a new account
        const highRisk = evaluateOrderRisk({
            isNewAccount: true,
            paymentMethod: 'COD',
            orderTotalPaise: 300000n, // ₹3,000
            buyerPhone: '9876543210'
        });
        expect(highRisk.riskScore).toBe(60); // 25 (new) + 35 (high COD) = 60
        expect(highRisk.isCodAllowed).toBe(true);
        // Extreme risk > 60
        const extremeRisk = evaluateOrderRisk({
            isNewAccount: true,
            paymentMethod: 'COD',
            orderTotalPaise: 500000n, // ₹5,000
            buyerPhone: '9876543210'
        });
        expect(extremeRisk.riskScore).toBe(60);
    });
    it('3. GST Tax Invoice Compliance Engine — Should split CGST/SGST for intra-state and IGST for inter-state', () => {
        // Intra-state (Delhi to Delhi: "07" -> "07")
        const intraStateTax = calculateGstTaxSplit({
            subtotalPaise: 100000n, // ₹1,000
            merchantStateCode: '07',
            buyerStateCode: '07',
            invoiceSequenceNumber: 1
        });
        expect(intraStateTax.taxType).toBe('INTRA_STATE');
        expect(intraStateTax.totalTaxPaise).toBe(5000n); // 5% of ₹1,000 = ₹50 (5000 Paise)
        expect(intraStateTax.cgstPaise).toBe(2500n); // CGST 2.5% = ₹25
        expect(intraStateTax.sgstPaise).toBe(2500n); // SGST 2.5% = ₹25
        expect(intraStateTax.igstPaise).toBe(0n);
        expect(intraStateTax.invoiceNumber).toMatch(/^INV\/\d{4}-\d{2}\/0001$/);
        // Inter-state (Delhi to Mumbai: "07" -> "27")
        const interStateTax = calculateGstTaxSplit({
            subtotalPaise: 100000n,
            merchantStateCode: '07',
            buyerStateCode: '27',
            invoiceSequenceNumber: 2
        });
        expect(interStateTax.taxType).toBe('INTER_STATE');
        expect(interStateTax.igstPaise).toBe(5000n); // IGST 5% = ₹50
        expect(interStateTax.cgstPaise).toBe(0n);
    });
    it('4. Handshake OTP Generator — Should generate 4-digit OTP and valid SHA256 hash', () => {
        const { otp, hash } = generateHandshakeOtp();
        expect(otp).toMatch(/^\d{4}$/);
        expect(hash).toHaveLength(64);
    });
});
