import React from 'react';

export default function ProductGrid({ products, onAddToCart, cartItems }) {
  const getCartQuantity = (productId) => {
    const found = cartItems.find((item) => item._id === productId || item.id === productId);
    return found ? found.quantity : 0;
  };

  return (
    <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pb-20 pt-2">
      <div className="flex items-end justify-between mb-5 sm:mb-8">
        <div>
          <span className="label-caps text-[10px] text-amber-600 dark:text-amber-400">The Market</span>
          <h3 className="font-heading text-2xl sm:text-4xl font-semibold text-slate-900 dark:text-white tracking-tight mt-1">
            Available Products
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-light mt-0.5">
            Fresh items from nearby local stores ready for 15-min dispatch
          </p>
        </div>
        <span className="label-caps text-[10px] sm:text-xs text-emerald-600 dark:text-emerald-400 whitespace-nowrap pb-1">
          {products.length} Items
        </span>
      </div>

      {products.length === 0 ? (
        <div className="bg-white dark:bg-slate-800/60 rounded-3xl p-10 sm:p-16 text-center text-slate-500 dark:text-slate-400 shadow-sm">
          <p className="font-heading text-xl sm:text-2xl font-semibold mb-1 text-slate-800 dark:text-slate-200">No products found</p>
          <p className="text-xs sm:text-sm font-light">Try adjusting your search query or selecting another category.</p>
        </div>
      ) : (
        /* Highly Responsive Grid: 2 cols on Mobile, 3 cols on sm, 4 on md, 5 on lg, 6 on xl */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-5">
          {products.map((product) => {
            const qty = getCartQuantity(product._id || product.id);
            const priceInRupees = (product.pricePaise / 100).toFixed(2);

            return (
              <div
                key={product._id || product.id}
                className="bg-white dark:bg-slate-800/60 rounded-2xl overflow-hidden flex flex-col shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group"
              >
                {/* Product Image Container */}
                <div className="w-full h-32 sm:h-44 bg-slate-100 dark:bg-slate-900 relative overflow-hidden">
                  <img
                    src={product.images && product.images[0] ? product.images[0] : 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80'}
                    alt={product.title}
                    className="w-full h-full object-cover group-hover:scale-[1.06] transition-transform duration-500"
                  />
                  <span className="absolute top-2 left-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm text-slate-600 dark:text-slate-300 text-[8px] sm:text-[9px] font-medium uppercase tracking-[0.18em] px-2 py-1 rounded-full max-w-[90%] truncate">
                    {product.category}
                  </span>
                </div>

                {/* Product Content Details */}
                <div className="p-3 sm:p-4 flex flex-col flex-1">
                  <h4 className="font-semibold text-slate-900 dark:text-white text-xs sm:text-sm mb-1 line-clamp-1">
                    {product.title}
                  </h4>
                  <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mb-3 line-clamp-2 leading-relaxed font-light">
                    {product.description}
                  </p>

                  {/* Footer Actions: Price + Add Button */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-auto pt-2.5 border-t border-slate-100 dark:border-slate-700/60">
                    <div>
                      <span className="label-caps text-[8px] sm:text-[9px] text-slate-400 block leading-none">Price</span>
                      <span className="font-heading text-lg sm:text-xl font-semibold text-slate-900 dark:text-white tracking-tight">
                        ₹{priceInRupees}
                      </span>
                    </div>

                    {qty > 0 ? (
                      <div className="flex items-center justify-between gap-1 bg-slate-100 dark:bg-slate-700/60 rounded-full px-2 py-1">
                        <button
                          className="w-5 h-5 rounded-full bg-white dark:bg-slate-800 text-slate-800 dark:text-white flex items-center justify-center font-semibold text-xs shadow-xs hover:bg-slate-50 active:scale-95"
                          onClick={() => onAddToCart(product, -1)}
                        >
                          -
                        </button>
                        <span className="font-semibold text-xs text-slate-800 dark:text-white px-1">{qty}</span>
                        <button
                          className="w-5 h-5 rounded-full bg-white dark:bg-slate-800 text-slate-800 dark:text-white flex items-center justify-center font-semibold text-xs shadow-xs hover:bg-slate-50 active:scale-95"
                          onClick={() => onAddToCart(product, 1)}
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <button
                        className="w-full sm:w-auto px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-medium text-xs tracking-wide shadow-xs transition-all active:scale-95 text-center"
                        onClick={() => onAddToCart(product, 1)}
                      >
                        Add
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
