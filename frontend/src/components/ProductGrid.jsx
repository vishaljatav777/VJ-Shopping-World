import React from 'react';

export default function ProductGrid({ products, onAddToCart, cartItems }) {
  const getCartQuantity = (productId) => {
    const found = cartItems.find((item) => item._id === productId || item.id === productId);
    return found ? found.quantity : 0;
  };

  return (
    <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pb-16">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div>
          <h3 className="text-lg sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Available Products
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Fresh items from nearby local stores ready for 15-min dispatch
          </p>
        </div>
        <span className="text-[11px] sm:text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 sm:px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800 whitespace-nowrap">
          {products.length} Items
        </span>
      </div>

      {products.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-8 sm:p-12 text-center text-slate-500 dark:text-slate-400 shadow-xs">
          <p className="text-base sm:text-lg font-bold mb-1 text-slate-700 dark:text-slate-200">🔍 No products found</p>
          <p className="text-xs sm:text-sm">Try adjusting your search query or selecting another category.</p>
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
                className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-2xl overflow-hidden flex flex-col hover:border-indigo-400 dark:hover:border-indigo-500/80 hover:shadow-md transition-all duration-200 group"
              >
                {/* Product Image Container */}
                <div className="w-full h-32 sm:h-44 bg-slate-100 dark:bg-slate-900 relative overflow-hidden">
                  <img 
                    src={product.images && product.images[0] ? product.images[0] : 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80'} 
                    alt={product.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <span className="absolute top-2 left-2 bg-white/90 dark:bg-slate-900/90 text-emerald-600 dark:text-emerald-400 text-[9px] sm:text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-emerald-500/20 backdrop-blur-xs max-w-[90%] truncate">
                    {product.category}
                  </span>
                </div>

                {/* Product Content Details */}
                <div className="p-2.5 sm:p-4 flex flex-col flex-1">
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm mb-1 line-clamp-1">
                    {product.title}
                  </h4>
                  <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mb-3 line-clamp-2 leading-tight">
                    {product.description}
                  </p>
                  
                  {/* Footer Actions: Price + Add Button */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-auto pt-2 border-t border-slate-100 dark:border-slate-700/80">
                    <div>
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 uppercase font-bold block leading-none">Price</span>
                      <span className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                        ₹{priceInRupees}
                      </span>
                    </div>

                    {qty > 0 ? (
                      <div className="flex items-center justify-between gap-1 bg-slate-100 dark:bg-slate-700/80 border border-slate-200 dark:border-slate-600 rounded-full px-2 py-1">
                        <button 
                          className="w-5 h-5 rounded-full bg-white dark:bg-slate-800 text-slate-800 dark:text-white flex items-center justify-center font-bold text-xs shadow-xs hover:bg-slate-50 active:scale-95" 
                          onClick={() => onAddToCart(product, -1)}
                        >
                          -
                        </button>
                        <span className="font-bold text-xs text-slate-800 dark:text-white px-1">{qty}</span>
                        <button 
                          className="w-5 h-5 rounded-full bg-white dark:bg-slate-800 text-slate-800 dark:text-white flex items-center justify-center font-bold text-xs shadow-xs hover:bg-slate-50 active:scale-95" 
                          onClick={() => onAddToCart(product, 1)}
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <button 
                        className="w-full sm:w-auto px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-bold text-xs shadow-xs transition-all active:scale-95 text-center" 
                        onClick={() => onAddToCart(product, 1)}
                      >
                        + Add
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
