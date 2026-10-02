import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700/80 pt-12 pb-8 mt-16 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-base font-bold">🛍️</div>
            <span className="font-extrabold text-lg text-slate-900 dark:text-white">VJ Express</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Hyperlocal 15-minute express delivery network for groceries, electronics, and local neighborhood stores.
          </p>
        </div>

        <div>
          <h5 className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-white mb-3">Portals</h5>
          <ul className="space-y-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <li><Link to="/" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Customer Marketplace</Link></li>
            <li><Link to="/merchant" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Seller Central</Link></li>
            <li><Link to="/rider" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Rider Console</Link></li>
            <li><Link to="/login" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Sign In</Link></li>
            <li><Link to="/register" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Create Account</Link></li>
          </ul>
        </div>

        <div>
          <h5 className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-white mb-3">Categories</h5>
          <ul className="space-y-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <li>Fresh Produce & Farm Direct</li>
            <li>Groceries & Daily Essentials</li>
            <li>Electronics & Headphones</li>
            <li>Local Sweet & Specialty Stores</li>
          </ul>
        </div>

        <div>
          <h5 className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-white mb-3">Trust & Security</h5>
          <ul className="space-y-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <li>🔑 4-Digit Handshake OTP</li>
            <li>📍 150m Haversine GPS Geofence</li>
            <li>🔒 Double-Entry Escrow Ledger</li>
            <li>⚡ 10-Min Ephemeral Redis Lock</li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 border-t border-slate-100 dark:border-slate-700/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
        <div>© 2026 VJ Express Hyperlocal Platform. All rights reserved.</div>
        <div className="flex gap-4">
          <span>Privacy Policy</span>
          <span>Terms of Service</span>
          <span>GST Compliance</span>
        </div>
      </div>
    </footer>
  );
}
