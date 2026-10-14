import React from 'react';

export default function Hero({ categories, selectedCategory, onSelectCategory }) {
  return (
    <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-6 sm:pt-10">
      <div className="bg-white dark:bg-slate-800/60 rounded-3xl p-6 sm:p-12 grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 items-center shadow-sm">
        <div className="lg:col-span-7 space-y-4 sm:space-y-5">
          <span className="inline-flex items-center gap-2.5 text-[10px] sm:text-xs font-medium uppercase tracking-[0.25em] text-emerald-600 dark:text-emerald-400">
            <span className="h-px w-8 bg-emerald-400/70"></span>
            15-Minute Express Delivery
          </span>
          <h2 className="font-heading text-4xl sm:text-6xl font-semibold text-slate-900 dark:text-white leading-[1.04] tracking-tight">
            Fresh Groceries &amp; Local Stores,{' '}
            <span className="italic font-medium text-indigo-600 dark:text-indigo-400">delivered</span> fast
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base max-w-xl leading-relaxed font-light">
            Order directly from trusted local merchants, fresh farms, and neighborhood stores with instant rider dispatch.
          </p>

          <div className="grid grid-cols-3 gap-4 sm:gap-8 pt-5 border-t border-slate-200/80 dark:border-slate-700/50">
            <div>
              <div className="font-heading text-2xl sm:text-4xl font-semibold text-emerald-600 dark:text-emerald-400">15<span className="text-base sm:text-2xl italic"> mins</span></div>
              <div className="label-caps text-[9px] sm:text-[10px] text-slate-400 mt-1">Avg. Delivery</div>
            </div>
            <div>
              <div className="font-heading text-2xl sm:text-4xl font-semibold text-indigo-600 dark:text-indigo-400">100<span className="text-base sm:text-2xl italic">%</span></div>
              <div className="label-caps text-[9px] sm:text-[10px] text-slate-400 mt-1">Quality Assured</div>
            </div>
            <div>
              <div className="font-heading text-2xl sm:text-4xl font-semibold text-slate-900 dark:text-white">₹0</div>
              <div className="label-caps text-[9px] sm:text-[10px] text-slate-400 mt-1">Surge Fee</div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 flex justify-center">
          <div className="relative w-full">
            <div className="absolute -inset-2 bg-gradient-to-tr from-indigo-100/60 to-amber-100/60 dark:from-indigo-900/30 dark:to-amber-900/20 rounded-3xl blur-sm"></div>
            <img
              src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=700&q=80"
              alt="Hyperlocal Store"
              className="relative w-full h-56 sm:h-72 object-cover rounded-2xl shadow-md hover:scale-[1.015] transition-transform duration-500"
            />
          </div>
        </div>
      </div>

      {/* Editorial Category Tabs — quiet underline rail */}
      <div className="flex items-center gap-6 sm:gap-8 overflow-x-auto py-5 sm:py-6 no-scrollbar whitespace-nowrap border-b border-slate-200/80 dark:border-slate-700/60">
        {categories.map((cat) => (
          <button
            key={cat}
            className={`pb-2 -mb-px text-xs sm:text-sm font-medium uppercase tracking-[0.15em] whitespace-nowrap border-b-2 transition-colors duration-200 shrink-0 ${
              selectedCategory === cat
                ? 'text-indigo-700 dark:text-indigo-300 border-indigo-500'
                : 'text-slate-400 border-transparent hover:text-slate-700 dark:hover:text-slate-200'
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
