import React, { useState } from 'react';
import { API_BASE_URL } from '../config/api';

export default function KycVerificationModal({ isOpen, onClose, role = 'MERCHANT', onKycComplete }) {
  if (!isOpen) return null;

  const [merchantData, setMerchantData] = useState({
    gstin: '07AAAAA0000A1Z5',
    bankAccountNumber: '9182736450192837',
    bankIfsc: 'HDFC0001234'
  });

  const [riderData, setRiderData] = useState({
    drivingLicense: 'DL1420110012345',
    vehicleNumber: 'DL-01-AB-1234',
    aadhaarNumberMasked: '987654321098'
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successResult, setSuccessResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const isMerchant = role === 'MERCHANT';
    const endpoint = isMerchant ? '/kyc/merchant/verify' : '/kyc/rider/verify';
    const payload = isMerchant ? merchantData : riderData;

    try {
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await res.json();

      if (!res.ok) {
        setErrorMsg(result.error || 'Verification failed');
        return;
      }

      setSuccessResult(result);
      if (onKycComplete) onKycComplete(result);
    } catch (err) {
      setErrorMsg('Network error while executing document verification');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
              {role === 'MERCHANT' ? '📄 Merchant KYB Verification' : '🆔 Rider KYC Verification'}
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">Government ID & Bank Account Validation</span>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl font-bold p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            ✕
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-600 dark:text-rose-400 mb-4">
            ⚠️ {errorMsg}
          </div>
        )}

        {successResult ? (
          <div className="space-y-3 py-2">
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-700 dark:text-emerald-300 text-xs space-y-1.5">
              <strong className="text-sm font-extrabold block">✓ Verification Approved!</strong>
              <p>{successResult.message}</p>
              {successResult.verificationDetails && (
                <div className="pt-2 text-[11px] space-y-1 border-t border-emerald-200 dark:border-emerald-800">
                  <div>Legal Entity: {successResult.verificationDetails.legalName}</div>
                  <div>GSTIN Status: Active ({successResult.verificationDetails.stateCode})</div>
                  <div>Penny Drop Match Score: {successResult.verificationDetails.nameMatchScore * 100}%</div>
                </div>
              )}
            </div>

            <button 
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-bold text-xs" 
              onClick={onClose}
            >
              Done & Continue
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {role === 'MERCHANT' ? (
              <>
                <div>
                  <label className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">GSTIN Number (15 Digits)</label>
                  <input
                    type="text"
                    required
                    maxLength={15}
                    value={merchantData.gstin}
                    onChange={(e) => setMerchantData({ ...merchantData, gstin: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">Bank Account No.</label>
                    <input
                      type="text"
                      required
                      value={merchantData.bankAccountNumber}
                      onChange={(e) => setMerchantData({ ...merchantData, bankAccountNumber: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">IFSC Code</label>
                    <input
                      type="text"
                      required
                      maxLength={11}
                      value={merchantData.bankIfsc}
                      onChange={(e) => setMerchantData({ ...merchantData, bankIfsc: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">Driving License (DL)</label>
                  <input
                    type="text"
                    required
                    value={riderData.drivingLicense}
                    onChange={(e) => setRiderData({ ...riderData, drivingLicense: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">Vehicle RC No.</label>
                    <input
                      type="text"
                      required
                      value={riderData.vehicleNumber}
                      onChange={(e) => setRiderData({ ...riderData, vehicleNumber: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">Aadhaar No. (12 Digits)</label>
                    <input
                      type="text"
                      required
                      maxLength={12}
                      value={riderData.aadhaarNumberMasked}
                      onChange={(e) => setRiderData({ ...riderData, aadhaarNumberMasked: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-full font-semibold text-xs" onClick={onClose}>Cancel</button>
              <button type="submit" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-bold text-xs" disabled={loading}>
                {loading ? 'Verifying with Govt APIs...' : 'Execute Instant Verification'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
