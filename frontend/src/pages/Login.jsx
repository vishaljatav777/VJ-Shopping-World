import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { API_BASE_URL } from '../config/api';

export default function Login({ onLoginSuccess, initialRole = 'BUYER' }) {
  const [searchParams] = useSearchParams();
  const paramRole = searchParams.get('role')?.toUpperCase();
  const [activeRoleTab, setActiveRoleTab] = useState(paramRole || initialRole);

  const [identifier, setIdentifier] = useState(''); // email or mobile phone
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    const cleanId = identifier.trim();
    if (!cleanId) {
      setErrorMsg('Please enter your email or 10-digit mobile number.');
      setLoading(false);
      return;
    }

    if (!password) {
      setErrorMsg('Please enter your password.');
      setLoading(false);
      return;
    }

    try {
      let res;
      try {
        res = await fetch(`${API_BASE_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            identifier: cleanId,
            password
          })
        });
      } catch (networkError) {
        console.error('Login fetch network error:', networkError);
        setErrorMsg('Unable to reach server. Render cloud server may be spinning up (cold start), please wait 5-10 seconds and click Sign In again.');
        setLoading(false);
        return;
      }

      let data;
      try {
        data = await res.json();
      } catch (jsonErr) {
        throw new Error('Unable to parse backend response. Verify server URL or API status.');
      }

      if (!res.ok) {
        setErrorMsg(data?.error || 'Authentication failed. Please check your credentials.');
        return;
      }

      localStorage.setItem('vj_token', data.token);
      localStorage.setItem('vj_user', JSON.stringify(data.user));

      setSuccessMsg('Login successful!');
      if (onLoginSuccess) onLoginSuccess(data.user);

      setTimeout(() => {
        if (data.user.role === 'MERCHANT') navigate('/merchant');
        else if (data.user.role === 'RIDER') navigate('/rider');
        else navigate('/');
      }, 600);
    } catch (err) {
      console.error('Login error:', err);
      setErrorMsg(err.message || 'Network connection error. Please verify backend API.');
    } finally {
      setLoading(false);
    }
  };

  const getPortalInfo = () => {
    if (activeRoleTab === 'MERCHANT') {
      return {
        icon: '🏪',
        title: 'Merchant Seller Sign In',
        subtitle: 'Access product inventory, order dispatch, and escrow balance.',
        color: 'from-amber-600 to-amber-500'
      };
    }
    if (activeRoleTab === 'RIDER') {
      return {
        icon: '🛵',
        title: 'Rider Partner Sign In',
        subtitle: 'Access delivery tasks, route batching, and OTP verification.',
        color: 'from-blue-600 to-indigo-600'
      };
    }
    return {
      icon: '🛍️',
      title: 'Customer Sign In',
      subtitle: 'Sign in to place orders, track live status, and manage profile.',
      color: 'from-indigo-600 to-indigo-500'
    };
  };

  const info = getPortalInfo();

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      {/* Role Selection Tabs */}
      <div className="flex bg-slate-200 dark:bg-slate-900 p-1.5 rounded-2xl mb-6 border border-slate-300 dark:border-slate-700 shadow-sm">
        <button
          type="button"
          onClick={() => setActiveRoleTab('BUYER')}
          className={`flex-1 py-2 text-xs font-extrabold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeRoleTab === 'BUYER'
              ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-md scale-[1.02]'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          🛍️ Customer
        </button>
        <button
          type="button"
          onClick={() => setActiveRoleTab('MERCHANT')}
          className={`flex-1 py-2 text-xs font-extrabold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeRoleTab === 'MERCHANT'
              ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-md scale-[1.02]'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          🏪 Merchant
        </button>
        <button
          type="button"
          onClick={() => setActiveRoleTab('RIDER')}
          className={`flex-1 py-2 text-xs font-extrabold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeRoleTab === 'RIDER'
              ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-md scale-[1.02]'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          🛵 Rider
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="text-center mb-6">
          <div className={`w-14 h-14 bg-gradient-to-tr ${info.color} rounded-2xl flex items-center justify-center text-white text-3xl mx-auto mb-3 shadow-md`}>
            {info.icon}
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {info.title}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {info.subtitle}
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-600 dark:text-rose-400 mb-4">
            ⚠️ {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-600 dark:text-emerald-400 mb-4">
            ✓ {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">
              Email or 10-Digit Mobile Number
            </label>
            <input
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-mono"
              placeholder="Enter email or 10-digit mobile number"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                placeholder="Enter password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 bg-gradient-to-tr ${info.color} text-white rounded-full font-bold text-sm shadow-md transition-all active:scale-98 disabled:opacity-50 mt-2`}
          >
            {loading ? 'Authenticating...' : `Sign In as ${activeRoleTab}`}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700/60 text-center">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Don't have an account yet?{' '}
            <Link
              to={`/register?role=${activeRoleTab.toLowerCase()}`}
              className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Create {activeRoleTab} Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
