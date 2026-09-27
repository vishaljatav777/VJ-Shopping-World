import React from 'react';

export default function LocationModal({ isOpen, onClose, currentLocation, onSelectLocation }) {
  if (!isOpen) return null;

  const popularLocations = [
    'Sector 62, Noida',
    'Connaught Place, New Delhi',
    'Indiranagar, Bengaluru',
    'Bandra West, Mumbai',
    'Gachibowli, Hyderabad'
  ];

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">📍 Select Delivery Location</h3>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl font-bold p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            ✕
          </button>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
          Choose your neighborhood to view available 15-minute express local stores and merchants near you.
        </p>

        <div className="space-y-2">
          {popularLocations.map((loc) => (
            <button
              key={loc}
              className={`w-full flex items-center justify-between p-3 rounded-xl border text-sm font-semibold transition-all ${
                currentLocation === loc
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 hover:border-slate-300'
              }`}
              onClick={() => {
                onSelectLocation(loc);
                onClose();
              }}
            >
              <span>📍 {loc}</span>
              {currentLocation === loc && <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
