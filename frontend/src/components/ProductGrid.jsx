import React from 'react';

export default function ProductGrid({ products, onAddToCart, cartItems }) {
  const getCartQuantity = (productId) => {
    const found = cartItems.find((item) => item._id === productId || item.id === productId);
    return found ? found.quantity : 0;
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Available Products
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Fresh items from nearby stores ready for express dispatch
          </p>
        </div>
        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
          {products.length} Products Available
        </span>
      </div>

      {products.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-12 text-center text-slate-500 dark:text-slate-400 shadow-sm">
          <p className="text-lg font-bold mb-1 text-slate-700 dark:text-slate-200">🔍 No products found</p>
          <p className="text-sm">Try adjusting your search query or selecting another category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => {
            const qty = getCartQuantity(product._id || product.id);
            const priceInRupees = (product.pricePaise / 100).toFixed(2);

            return (
              <div 
                key={product._id || product.id} 
                className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-xl overflow-hidden flex flex-col hover:border-indigo-400 dark:hover:border-indigo-500/80 hover:shadow-md transition-all duration-200 group"
              >
                <div className="w-full h-48 bg-slate-100 dark:bg-slate-900 relative overflow-hidden">
                  <img 
                    src={product.images && product.images[0] ? product.images[0] : 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80'} 
                    alt={product.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <span className="absolute top-2.5 left-2.5 bg-white/90 dark:bg-slate-900/90 text-emerald-600 dark:text-emerald-400 text-[10px] font-extrabold px-2.5 py-1 rounded-full border border-emerald-500/20 backdrop-blur-sm">
                    {product.category}
                  </span>
                </div>

                <div className="p-4 flex flex-col flex-1">
                  <h4 className="font-bold text-slate-900 dark:text-white text-base mb-1 line-clamp-1">
                    {product.title}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 line-clamp-2 leading-relaxed">
                    {product.description}
                  </p>
                  
                  <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-100 dark:border-slate-700/80">
                    <div>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold block leading-none">Price</span>
                      <span className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
                        ₹{priceInRupees}
                      </span>
                    </div>

                    {qty > 0 ? (
                      <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-700/80 border border-slate-200 dark:border-slate-600 rounded-full px-2 py-1">
                        <button 
                          className="w-6 h-6 rounded-full bg-white dark:bg-slate-800 text-slate-800 dark:text-white flex items-center justify-center font-bold text-xs shadow-xs hover:bg-slate-50 active:scale-95" 
                          onClick={() => onAddToCart(product, -1)}
                        >
                          -
                        </button>
                        <span className="font-bold text-xs text-slate-800 dark:text-white px-1">{qty}</span>
                        <button 
                          className="w-6 h-6 rounded-full bg-white dark:bg-slate-800 text-slate-800 dark:text-white flex items-center justify-center font-bold text-xs shadow-xs hover:bg-slate-50 active:scale-95" 
                          onClick={() => onAddToCart(product, 1)}
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <button 
                        className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-semibold text-xs shadow-xs transition-all active:scale-95" 
                        onClick={() => onAddToCart(product, 1)}
                      >
                        + Add to Cart
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
