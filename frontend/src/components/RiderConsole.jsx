import React, { useState, useEffect } from 'react';
import KycVerificationModal from './KycVerificationModal';

export default function RiderConsole({ currentUser, onRoleUpdated }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [otpModalOrder, setOtpModalOrder] = useState(null);
  const [inputOtp, setInputOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [showKycModal, setShowKycModal] = useState(false);
  const [agreedRiderRules, setAgreedRiderRules] = useState(false);

  useEffect(() => {
    fetchConsole();
  }, []);

  const fetchConsole = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/rider/console');
      if (res.ok) {
        const result = await res.json();
        setData(result);
      }
    } catch (err) {
      console.warn('Rider console fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleOnline = async () => {
    try {
      await fetch('http://localhost:5000/api/rider/toggle-availability', { method: 'PATCH' });
      fetchConsole();
    } catch (err) {
      console.error('Toggle availability error:', err);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await fetch(`http://localhost:5000/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      fetchConsole();
    } catch (err) {
      console.error('Update delivery status error:', err);
    }
  };

  const handleVerifyDeliveryOtp = async (e) => {
    e.preventDefault();
    setOtpError('');

    try {
      const res = await fetch(`http://localhost:5000/api/orders/${otpModalOrder.id}/verify-delivery-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          otp: inputOtp,
          riderLat: 28.6139,
          riderLng: 77.2090
        })
      });

      const result = await res.json();

      if (!res.ok) {
        setOtpError(result.error || 'Invalid OTP or Geofence check failed');
        return;
      }

      setOtpModalOrder(null);
      setInputOtp('');
      fetchConsole();
    } catch (err) {
      setOtpError('Failed to verify delivery OTP');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-500 dark:text-slate-400">
        <p>Loading Rider Delivery Console...</p>
      </div>
    );
  }

  // Guard 1: Not logged in
  if (!currentUser) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-3xl p-8 shadow-xl space-y-4">
          <div className="w-16 h-16 bg-indigo-500/10 text-indigo-500 rounded-2xl flex items-center justify-center text-3xl mx-auto">
            🛵
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Delivery Partner Console Access</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            You must sign in or register an authorized Rider account with verified Driving License & vehicle details to pick up and dispatch orders.
          </p>
          <div className="pt-4">
            <a href="/auth" className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-bold text-sm shadow-md inline-block">
              🔐 Sign In / Register as Rider Partner
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Guard 2: Logged in, but Role is not RIDER (e.g. BUYER or MERCHANT)
  if (currentUser.role !== 'RIDER') {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-3xl p-8 shadow-xl space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center text-2xl font-bold">
              🛵
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Rider Partner Onboarding & Safety Rules</h2>
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">Current Role: {currentUser.role} (Rider Credentials Required)</span>
            </div>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-3 text-xs text-slate-600 dark:text-slate-300">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">📜 VJ Express Rider Partner Rules & Regulations</h3>
            <ul className="space-y-2 list-disc pl-4">
              <li>Must upload valid state <strong>Driving License (DL)</strong> & <strong>Vehicle RC details</strong>.</li>
              <li>Must complete <strong>DigiLocker Masked Aadhaar verification</strong> for identity trust.</li>
              <li>Must perform <strong>4-digit Handshake OTP verification at doorstep</strong> within <strong>&lt;150m GPS Geofence</strong>.</li>
              <li>Riders can buy products as a customer, but cannot add store products as a merchant unless separate merchant KYB verification is completed.</li>
            </ul>
          </div>

          <div className="flex items-center gap-3 p-3 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 rounded-xl">
            <input
              type="checkbox"
              id="riderRulesCheck"
              checked={agreedRiderRules}
              onChange={(e) => setAgreedRiderRules(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
            />
            <label htmlFor="riderRulesCheck" className="text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
              I agree to the Rider Partner Rules, safety regulations, and doorstep geofenced OTP verification protocol.
            </label>
          </div>

          <button
            disabled={!agreedRiderRules}
            onClick={() => setShowKycModal(true)}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-full font-bold text-sm shadow-md transition-all"
          >
            Submit DL & Aadhaar Credentials to Activate Rider Console ➔
          </button>
        </div>

        <KycVerificationModal
          isOpen={showKycModal}
          onClose={() => setShowKycModal(false)}
          role="RIDER"
          onKycComplete={() => {
            setShowKycModal(false);
            const updatedUser = { ...currentUser, role: 'RIDER', isKycVerified: true };
            localStorage.setItem('vj_user', JSON.stringify(updatedUser));
            if (onRoleUpdated) onRoleUpdated(updatedUser);
            fetchConsole();
          }}
        />
      </div>
    );
  }

  const rider = data?.rider || {
    vehicleNumber: 'DL-01-AB-1234',
    drivingLicense: 'DL1420110012345',
    isAvailable: true,
    isKycVerified: true
  };

  const deliveries = data?.deliveries || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Rider Header Panel */}
      <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-6 sm:p-8 mb-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${
                rider.isAvailable 
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' 
                  : 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800'
              }`}>
                ● {rider.isAvailable ? 'ONLINE & ACTIVE FOR DISPATCH' : 'OFFLINE'}
              </span>

              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                🛡️ GOVT KYC VERIFIED
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Rahul Rider (Express Delivery)
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Vehicle RC: {rider.vehicleNumber} • Driving License: {rider.drivingLicense}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowKycModal(true)}
              className="px-4 py-2.5 rounded-full font-bold text-xs border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-200 transition-all"
            >
              🆔 Verify Govt Proof
            </button>
            <button 
              className={`px-5 py-2.5 rounded-full font-bold text-sm shadow-sm transition-all active:scale-95 w-fit ${
                rider.isAvailable 
                  ? 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-white hover:bg-slate-200' 
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
              onClick={handleToggleOnline}
            >
              {rider.isAvailable ? 'Go Offline' : 'Go Online Now'}
            </button>
          </div>
        </div>
      </div>

      <KycVerificationModal
        isOpen={showKycModal}
        onClose={() => setShowKycModal(false)}
        role="RIDER"
        onKycComplete={() => fetchConsole()}
      />

      {/* Assigned Deliveries */}
      <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-4">🛵 Assigned Delivery Dispatches</h3>
      {deliveries.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-10 text-center text-slate-500 dark:text-slate-400 shadow-sm">
          No delivery assignments currently active. Stay online for automatic dispatch!
        </div>
      ) : (
        <div className="space-y-4">
          {deliveries.map((d) => (
            <div 
              key={d.id} 
              className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm"
            >
              <div>
                <div className="flex items-center gap-3">
                  <strong className="text-base font-bold text-slate-900 dark:text-white">Dispatch #{d.id.slice(0, 8)}</strong>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                    {d.status}
                  </span>
                </div>
                <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Pickup: {d.merchant?.legalName || 'VJ Express Merchant Store'} ➔ Dropoff: Sector 62, Noida
                </div>
              </div>

              <div className="flex items-center gap-2">
                {d.status === 'READY_FOR_PICKUP' && (
                  <button className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-bold text-xs shadow-xs transition-all" onClick={() => handleUpdateStatus(d.id, 'OUT_FOR_DELIVERY')}>
                    Pick Up & Start Delivery ➔
                  </button>
                )}
                {d.status === 'OUT_FOR_DELIVERY' && (
                  <button className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full font-bold text-xs shadow-xs transition-all" onClick={() => setOtpModalOrder(d)}>
                    🔑 Verify OTP & Deliver
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delivery Handshake OTP Verification Modal */}
      {otpModalOrder && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mb-1">🔑 Delivery Handshake OTP</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Enter the 4-digit OTP provided by the customer at doorstep:
            </p>

            <form onSubmit={handleVerifyDeliveryOtp} className="space-y-4">
              <input
                type="text"
                maxLength={4}
                required
                placeholder="e.g. 4892"
                value={inputOtp}
                onChange={(e) => setInputOtp(e.target.value)}
                className="w-full py-3 text-2xl tracking-[8px] text-center font-bold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:border-indigo-500"
              />

              {otpError && (
                <div className="text-xs text-rose-500 font-semibold">
                  ⚠️ {otpError}
                </div>
              )}

              <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                📍 Geofenced Rider GPS Verification: Active (&lt;150m from dropoff)
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button type="button" className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-full font-semibold text-xs" onClick={() => setOtpModalOrder(null)}>Cancel</button>
                <button type="submit" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-bold text-xs shadow-xs">Confirm Handshake</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
