import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Navbar({ 
  cartCount, 
  onOpenCart, 
  location, 
  onOpenLocationModal, 
  searchQuery, 
  setSearchQuery,
  theme,
  setTheme,
  currentUser,
  onLogout
}) {
  const currentPath = useLocation().pathname;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/80 shadow-xs transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Desktop & Mobile Header Bar */}
        <div className="h-16 sm:h-18 flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Brand Logo & Compact Title */}
          <Link to="/" className="flex items-center gap-2 sm:gap-2.5 shrink-0 group">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-tr from-indigo-600 to-indigo-500 rounded-xl flex items-center justify-center text-lg sm:text-xl text-white shadow-sm group-hover:scale-105 transition-transform duration-200">
              🛍️
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white leading-none tracking-tight">
                VJ Express
              </h1>
              <span className="text-[10px] sm:text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide block sm:inline">
                15-Min Delivery
              </span>
            </div>
          </Link>

          {/* Deliver To Location Selector */}
          <div 
            onClick={onOpenLocationModal}
            className="hidden xs:flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1 sm:py-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-full cursor-pointer hover:border-indigo-500 transition-all text-xs shadow-xs max-w-[140px] sm:max-w-xs truncate"
          >
            <span className="text-emerald-500 text-xs sm:text-sm">📍</span>
            <div className="truncate">
              <div className="text-[9px] sm:text-[10px] text-slate-400 dark:text-slate-400 leading-none">Deliver to</div>
              <strong className="text-[11px] sm:text-xs font-semibold text-slate-800 dark:text-slate-200 truncate block">{location}</strong>
            </div>
            <span className="text-[10px] opacity-40">▼</span>
          </div>

          {/* Desktop Central Search Bar */}
          <div className="hidden md:block flex-1 max-w-md relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
            <input
              type="text"
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-full text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-xs"
              placeholder="Search groceries, electronics, fresh food..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Desktop & Mobile Right Actions */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            {/* Desktop Navigation Links */}
            <div className="hidden lg:flex items-center gap-2">
              {currentUser ? (
                <>
                  {currentUser.role === 'MERCHANT' && (
                    <Link
                      to="/merchant"
                      className="px-3 py-1.5 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 transition-colors"
                    >
                      🏪 Seller Central
                    </Link>
                  )}
                  {currentUser.role === 'RIDER' && (
                    <Link
                      to="/rider"
                      className="px-3 py-1.5 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 transition-colors"
                    >
                      🛵 Rider Console
                    </Link>
                  )}
                  <Link 
                    to="/profile" 
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    👤 {currentUser.name || 'Account'}
                  </Link>
                </>
              ) : (
                <Link 
                  to="/auth" 
                  className="px-3.5 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 rounded-full text-xs font-bold hover:bg-indigo-100 transition-all"
                >
                  🔐 Sign In
                </Link>
              )}
            </div>

            {/* Compact Theme Toggle */}
            <button
              onClick={() => {
                const nextTheme = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
                setTheme(nextTheme);
              }}
              className="p-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              title={`Theme: ${theme}`}
            >
              {theme === 'light' ? '☀️' : theme === 'dark' ? '🌙' : '💻'}
            </button>

            {/* Cart Button */}
            <button 
              className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-semibold text-xs sm:text-sm shadow-xs hover:shadow-md transition-all active:scale-95 shrink-0" 
              onClick={onOpenCart}
            >
              <span>🛒 <span className="hidden sm:inline">Cart</span></span>
              {cartCount > 0 && (
                <span className="bg-rose-500 text-white text-[11px] font-extrabold px-1.5 py-0.2 rounded-full">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-xl focus:outline-none"
            >
              <span className="text-xl">{mobileMenuOpen ? '✕' : '☰'}</span>
            </button>
          </div>
        </div>

        {/* Mobile Search Input Row */}
        <div className="md:hidden pb-3">
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🔍</span>
            <input
              type="text"
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-full text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              placeholder="Search groceries, electronics, farm fresh..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown / Slide-out */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-4 space-y-3 transition-all">
          <div 
            onClick={() => {
              onOpenLocationModal();
              setMobileMenuOpen(false);
            }}
            className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs"
          >
            <span className="font-semibold text-slate-700 dark:text-slate-200">📍 Deliver Location</span>
            <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">{location}</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-bold pt-1">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className={`p-3 rounded-xl border text-center transition-colors ${
                currentPath === '/' ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 border-indigo-200' : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
              }`}
            >
              🛍️ Customer Market
            </Link>

            <Link
              to="/merchant"
              onClick={() => setMobileMenuOpen(false)}
              className={`p-3 rounded-xl border text-center transition-colors ${
                currentPath === '/merchant' ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 border-amber-200' : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
              }`}
            >
              🏪 Seller Central
            </Link>

            <Link
              to="/rider"
              onClick={() => setMobileMenuOpen(false)}
              className={`p-3 rounded-xl border text-center transition-colors ${
                currentPath === '/rider' ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 border-blue-200' : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
              }`}
            >
              🛵 Rider Console
            </Link>

            {currentUser ? (
              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className={`p-3 rounded-xl border text-center transition-colors ${
                  currentPath === '/profile' ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 border-indigo-200' : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                }`}
              >
                👤 Profile ({currentUser.name?.split(' ')[0] || 'User'})
              </Link>
            ) : (
              <Link
                to="/auth"
                onClick={() => setMobileMenuOpen(false)}
                className="p-3 rounded-xl bg-indigo-600 text-white font-bold text-center"
              >
                🔐 Sign In / Register
              </Link>
            )}
          </div>

          {currentUser && (
            <button
              onClick={() => {
                onLogout();
                setMobileMenuOpen(false);
              }}
              className="w-full py-2.5 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 font-bold text-xs rounded-xl"
            >
              🚪 Sign Out of Account
            </button>
          )}
        </div>
      )}
    </header>
  );
}
