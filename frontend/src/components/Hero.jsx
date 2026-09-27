import React from 'react';

export default function Hero({ categories, selectedCategory, onSelectCategory }) {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
      <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center shadow-sm">
        <div className="lg:col-span-7 space-y-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
            ⚡ 15-MINUTE EXPRESS HYPERLOCAL DELIVERY
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
            Fresh Groceries & Local Stores Delivered Fast
          </h2>
          <p className="text-slate-600 dark:text-slate-300 text-base max-w-xl">
            Order directly from trusted local merchants, fresh farms, and neighborhood stores with instant rider dispatch.
          </p>
          
          <div className="flex items-center gap-8 pt-2">
            <div>
              <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">15 Mins</div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Avg. Delivery</div>
            </div>
            <div>
              <div className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">100%</div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Quality Assured</div>
            </div>
            <div>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-white">₹0</div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Surge Fee</div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 flex justify-center">
          <img 
            src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=700&q=80" 
            alt="Hyperlocal Store" 
            className="w-full max-h-60 object-cover rounded-xl border border-slate-200 dark:border-slate-700 shadow-md hover:scale-[1.02] transition-transform duration-300" 
          />
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto py-5 no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat}
            className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap transition-all shadow-sm ${
              selectedCategory === cat
                ? 'bg-indigo-600 text-white border-transparent'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-indigo-400'
            }`}
            onClick={() => onSelectCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>
    </section>
  );
}
