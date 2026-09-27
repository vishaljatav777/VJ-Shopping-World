import React from 'react';

export default function OrderTrackerModal({ order, onClose, onAdvanceStatus, deliveryOtp, isReadOnly = false }) {
  if (!order) return null;

  const statuses = [
    { key: 'CREATED', title: 'Order Placed', desc: 'Order & financial escrow ledger recorded' },
    { key: 'MERCHANT_PREPARING', title: 'Merchant Packing', desc: 'Store is packing your fresh items' },
    { key: 'READY_FOR_PICKUP', title: 'Ready for Pickup', desc: 'Package sealed & assigned to rider' },
    { key: 'OUT_FOR_DELIVERY', title: 'Out for Delivery', desc: 'Rider is on the way to your location' },
    { key: 'DELIVERED', title: 'Delivered', desc: 'Order safely delivered to your doorstep' }
  ];

  const getCurrentStepIndex = () => {
    const idx = statuses.findIndex((s) => s.key === order.status);
    return idx >= 0 ? idx : 0;
  };

  const currentIdx = getCurrentStepIndex();
  const displayOtp = deliveryOtp || order.deliveryOtp || '4892';

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">⚡ Express Order Live Tracker</h3>
            <span className="text-xs text-slate-400 font-mono">Order ID: #{order.id?.slice(0, 12)}</span>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl font-bold p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* 4-Digit Handshake OTP Banner */}
        {order.status !== 'DELIVERED' && (
          <div className="bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 rounded-xl p-4 mb-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 block">🔑 Doorstep Delivery OTP</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Share with rider to confirm delivery</span>
            </div>
            <span className="font-mono text-2xl font-black tracking-widest text-slate-900 dark:text-white bg-white dark:bg-slate-900 px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xs">
              {displayOtp}
            </span>
          </div>
        )}

        {/* Status Steps */}
        <div className="space-y-4 my-4">
          {statuses.map((step, idx) => {
            const isCompleted = idx < currentIdx;
            const isActive = idx === currentIdx;

            return (
              <div key={step.key} className="flex items-center gap-3.5">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-extrabold transition-all ${
                  isCompleted 
                    ? 'bg-emerald-600 text-white' 
                    : isActive 
                    ? 'bg-indigo-600 text-white shadow-md ring-4 ring-indigo-500/20 animate-pulse' 
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-400 border border-slate-200 dark:border-slate-600'
                }`}>
                  {isCompleted ? '✓' : idx + 1}
                </div>
                <div>
                  <h4 className={`text-sm font-bold ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-900 dark:text-white'}`}>
                    {step.title}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{step.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Read-Only Status Notice or Partner Advance Controls */}
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
          {isReadOnly ? (
            <div className="w-full text-center py-1">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1.5">
                🔒 Live Status — Verified by VJ Express Logistics Network
              </span>
            </div>
          ) : (
            <>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Partner Controls:</span>
              {currentIdx < statuses.length - 1 ? (
                <button 
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-bold text-xs shadow-xs transition-all active:scale-95"
                  onClick={() => onAdvanceStatus && onAdvanceStatus(statuses[currentIdx + 1].key)}
                >
                  Advance to: {statuses[currentIdx + 1].title} ➔
                </button>
              ) : (
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">🎉 Order Delivered & Complete!</span>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
