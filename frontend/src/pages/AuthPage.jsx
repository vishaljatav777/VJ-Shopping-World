import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { API_BASE_URL } from '../config/api';

export default function AuthPage({ onLoginSuccess }) {
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get('role')?.toUpperCase() || 'BUYER';

  const [activeRoleTab, setActiveRoleTab] = useState(initialRole); // 'BUYER' | 'MERCHANT' | 'RIDER'
  const [isRegister, setIsRegister] = useState(false);

  const [formData, setFormData] = useState({
    phoneNumber: '',
    password: '',
    name: '',
    role: initialRole
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    setFormData((prev) => ({ ...prev, role: activeRoleTab }));
  }, [activeRoleTab]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    if (formData.phoneNumber.length !== 10) {
      setErrorMsg('Mobile number must be a valid 10-digit numeric phone number.');
      setLoading(false);
      return;
    }

    const endpoint = isRegister ? '/auth/register' : '/auth/login';

    try {
      const payload = isRegister
        ? { ...formData, role: activeRoleTab }
        : {
            phoneNumber: formData.phoneNumber,
            password: formData.password
          };

      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Authentication failed. Please check your credentials.');
        return;
      }

      localStorage.setItem('vj_token', data.token);
      localStorage.setItem('vj_user', JSON.stringify(data.user));

      setSuccessMsg(isRegister ? `${activeRoleTab} account created successfully!` : 'Login successful!');
      if (onLoginSuccess) onLoginSuccess(data.user);

      setTimeout(() => {
        if (data.user.role === 'MERCHANT') navigate('/merchant');
        else if (data.user.role === 'RIDER') navigate('/rider');
        else navigate('/');
      }, 700);
    } catch (err) {
      setErrorMsg('Network connection error. Please verify backend API.');
    } finally {
      setLoading(false);
    }
  };

  const getPortalInfo = () => {
    if (activeRoleTab === 'MERCHANT') {
      return {
        icon: '🏪',
        title: isRegister ? 'Register Merchant Store' : 'Merchant Seller Sign In',
        subtitle: 'Manage inventory, process orders, and inspect double-entry escrow balance.',
        color: 'from-amber-600 to-amber-500'
      };
    }
    if (activeRoleTab === 'RIDER') {
      return {
        icon: '🛵',
        title: isRegister ? 'Register Bike Partner' : 'Rider Console Sign In',
        subtitle: 'Receive instant hyperlocal delivery tasks with 4-digit doorstep OTP verification.',
        color: 'from-blue-600 to-indigo-600'
      };
    }
    return {
      icon: '🛍️',
      title: isRegister ? 'Create Buyer Account' : 'Customer Sign In',
      subtitle: 'Order 15-minute express groceries, electronics, and local store items.',
      color: 'from-indigo-600 to-indigo-500'
    };
  };

  const info = getPortalInfo();

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      {/* Role Selection Tabs */}
      <div className="flex bg-slate-200 dark:bg-slate-900 p-1.5 rounded-2xl mb-6 border border-slate-300 dark:border-slate-700 shadow-sm">
        <button
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

        {/* Sign In vs Register Toggle */}
        <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-full mb-6 border border-slate-200 dark:border-slate-700">
          <button
            className={`flex-1 py-1.5 text-xs font-bold rounded-full transition-all ${
              !isRegister ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs' : 'text-slate-500'
            }`}
            onClick={() => setIsRegister(false)}
          >
            Sign In
          </button>
          <button
            className={`flex-1 py-1.5 text-xs font-bold rounded-full transition-all ${
              isRegister ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs' : 'text-slate-500'
            }`}
            onClick={() => setIsRegister(true)}
          >
            Create Account
          </button>
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
          {isRegister && (
            <div>
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">
                {activeRoleTab === 'MERCHANT' ? 'Legal Store Owner / Merchant Name' : activeRoleTab === 'RIDER' ? 'Rider Full Legal Name' : 'Full Name'}
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                placeholder={activeRoleTab === 'MERCHANT' ? 'e.g. Vishal Traders' : 'e.g. Vishal Kumar'}
              />
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">
              Registered Mobile Phone Number (10 Digits)
            </label>
            <input
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={10}
              required
              value={formData.phoneNumber}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                setFormData({ ...formData, phoneNumber: digits });
              }}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-mono tracking-wider"
              placeholder="e.g. 9876543210"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">Password</label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 bg-gradient-to-tr ${info.color} text-white rounded-full font-bold text-sm shadow-md transition-all active:scale-98 disabled:opacity-50 mt-2`}
          >
            {loading ? 'Authenticating...' : isRegister ? `Register as ${activeRoleTab}` : `Sign In as ${activeRoleTab}`}
          </button>
        </form>
      </div>
    </div>
  );
}
