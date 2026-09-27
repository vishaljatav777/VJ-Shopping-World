import crypto from 'crypto';

export interface OrderRiskAssessment {
  riskScore: number;
  isCodAllowed: boolean;
  riskFlags: string[];
}

export interface GstTaxBreakdown {
  taxType: 'INTRA_STATE' | 'INTER_STATE';
  cgstPaise: bigint;
  sgstPaise: bigint;
  igstPaise: bigint;
  totalTaxPaise: bigint;
  invoiceNumber: string;
}

/**
 * 1. Dynamic Risk Score Engine (0 to 100) from Plan PDF (Page 5)
 */
export function evaluateOrderRisk(params: {
  isNewAccount: boolean; // <24 hours old
  paymentMethod: 'COD' | 'ONLINE';
  orderTotalPaise: bigint; // In Paise
  buyerPhone: string;
}): OrderRiskAssessment {
  let riskScore = 0;
  const riskFlags: string[] = [];

  // New account flag (+25)
  if (params.isNewAccount) {
    riskScore += 25;
    riskFlags.push('NEW_ACCOUNT_LESS_THAN_24H');
  }

  // High-value COD flag (> ₹2,500 = 250000 Paise) (+35)
  if (params.paymentMethod === 'COD' && params.orderTotalPaise > 250000n) {
    riskScore += 35;
    riskFlags.push('HIGH_VALUE_COD_ORDER');
  }

  // Threshold check: Risk Score > 60 disables COD
  const isCodAllowed = riskScore <= 60;
  if (!isCodAllowed && params.paymentMethod === 'COD') {
    riskFlags.push('COD_DISABLED_DUE_TO_HIGH_RISK');
  }

  return {
    riskScore,
    isCodAllowed,
    riskFlags
  };
}

/**
 * 2. Haversine Distance Formula for Geofenced Delivery Validation (Page 5)
 * Returns distance in meters between rider and destination dropoff.
 */
export function calculateHaversineDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in meters
}

/**
 * 3. GST Tax Engine & Invoice Generation (Page 27)
 * Splits intra-state into CGST 2.5% + SGST 2.5%, or inter-state into IGST 5%.
 */
export function calculateGstTaxSplit(params: {
  subtotalPaise: bigint;
  merchantStateCode: string; // e.g. "07" (Delhi)
  buyerStateCode: string;    // e.g. "07" (Delhi)
  invoiceSequenceNumber: number;
}): GstTaxBreakdown {
  const isIntraState = params.merchantStateCode === params.buyerStateCode;
  const totalTaxPaise = (params.subtotalPaise * 5n) / 100n; // 5% GST

  let cgstPaise = 0n;
  let sgstPaise = 0n;
  let igstPaise = 0n;

  if (isIntraState) {
    cgstPaise = totalTaxPaise / 2n;
    sgstPaise = totalTaxPaise - cgstPaise; // Handle odd paise
  } else {
    igstPaise = totalTaxPaise;
  }

  const currentYear = new Date().getFullYear();
  const nextYear = (currentYear + 1).toString().slice(-2);
  const formattedSeq = params.invoiceSequenceNumber.toString().padStart(4, '0');
  const invoiceNumber = `INV/${currentYear}-${nextYear}/${formattedSeq}`;

  return {
    taxType: isIntraState ? 'INTRA_STATE' : 'INTER_STATE',
    cgstPaise,
    sgstPaise,
    igstPaise,
    totalTaxPaise,
    invoiceNumber
  };
}

/**
 * 4. Generate 4-digit Delivery Handshake OTP (Page 2, 8)
 */
export function generateHandshakeOtp(): { otp: string; hash: string } {
  const otp = Math.floor(1000 + Math.random() * 9000).toString();
  const hash = crypto.createHash('sha256').update(otp).digest('hex');
  return { otp, hash };
}
