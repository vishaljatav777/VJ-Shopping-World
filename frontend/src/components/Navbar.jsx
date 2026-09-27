import React from 'react';
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

  return (
    <header className="sticky top-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 bg-gradient-to-tr from-indigo-600 to-indigo-500 rounded-xl flex items-center justify-center text-xl text-white shadow-sm group-hover:scale-105 transition-transform duration-200">
            🛍️
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white leading-none tracking-tight">
              VJ Express
            </h1>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
              Hyperlocal Network
            </span>
          </div>
        </Link>

        {/* Location Picker */}
        <div 
          onClick={onOpenLocationModal}
          className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-full cursor-pointer hover:border-indigo-500 transition-all text-xs sm:text-sm shadow-sm"
        >
          <span className="text-emerald-500">📍</span>
          <div>
            <div className="text-[10px] text-slate-400 dark:text-slate-400 leading-none">Deliver to</div>
            <strong className="text-xs font-semibold text-slate-800 dark:text-slate-200">{location}</strong>
          </div>
          <span className="text-xs opacity-40">▼</span>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-md relative hidden sm:block">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
          <input
            type="text"
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-full text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-sm"
            placeholder="Search groceries, electronics, fresh food..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Production Navigation Actions */}
        <nav className="flex items-center gap-3 sm:gap-4">
          {/* User Account / Auth & Role Portal Links */}
          {currentUser ? (
            <div className="flex items-center gap-2">
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
                  className="px-3 py-1.5 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 transition-colors"
                >
                  🛵 Rider Console
                </Link>
              )}
              <Link 
                to="/profile" 
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                👤 {currentUser.name || 'My Account'}
              </Link>
              <button
                onClick={onLogout}
                className="text-[11px] font-bold text-rose-500 hover:text-rose-600 underline px-1"
                title="Sign Out"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link 
              to="/auth" 
              className="px-4 py-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 rounded-full text-xs font-bold hover:bg-indigo-100 transition-all"
            >
              🔐 Sign In / Register
            </Link>
          )}

          {/* 3-Way Theme Switcher */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full p-1 gap-1">
            <button 
              className={`px-2 py-1 rounded-full text-xs font-semibold transition-all ${
                theme === 'light' 
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
              }`}
              onClick={() => setTheme('light')}
            >
              ☀️
            </button>
            <button 
              className={`px-2 py-1 rounded-full text-xs font-semibold transition-all ${
                theme === 'dark' 
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
              }`}
              onClick={() => setTheme('dark')}
            >
              🌙
            </button>
            <button 
              className={`px-2 py-1 rounded-full text-xs font-semibold transition-all ${
                theme === 'system' 
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
              }`}
              onClick={() => setTheme('system')}
            >
              💻 Auto
            </button>
          </div>

          {/* Cart Button */}
          <button 
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-semibold text-sm shadow-sm hover:shadow-md transition-all active:scale-95" 
            onClick={onOpenCart}
          >
            <span>🛒 Cart</span>
            {cartCount > 0 && (
              <span className="bg-rose-500 text-white text-xs font-extrabold px-2 py-0.5 rounded-full">
                {cartCount}
              </span>
            )}
          </button>
        </nav>
      </div>
    </header>
  );
}
