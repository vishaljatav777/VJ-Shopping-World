import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { API_BASE_URL } from '../config/api';

export default function Registration({ onLoginSuccess, initialRole = 'BUYER' }) {
  const [searchParams] = useSearchParams();
  const paramRole = searchParams.get('role')?.toUpperCase();
  const [activeRoleTab, setActiveRoleTab] = useState(paramRole || initialRole);

  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    email: '',
    password: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const navigate = useNavigate();

  // Password Security Strength Calculation
  const checkPasswordSecurity = (pwd) => {
    let score = 0;
    if (pwd.length >= 6) score += 1;
    if (pwd.length >= 10) score += 1;
    if (/\d/.test(pwd)) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) score += 1;

    let label = 'Weak';
    let colorClass = 'bg-rose-500';
    let textClass = 'text-rose-500';
    let width = 'w-1/3';

    if (score >= 4) {
      label = 'Strong';
      colorClass = 'bg-emerald-500';
      textClass = 'text-emerald-500';
      width = 'w-full';
    } else if (score >= 2) {
      label = 'Medium';
      colorClass = 'bg-amber-500';
      textClass = 'text-amber-500';
      width = 'w-2/3';
    }

    return {
      score,
      label,
      colorClass,
      textClass,
      width,
      hasMinLength: pwd.length >= 6,
      hasNumber: /\d/.test(pwd),
      hasUpperOrSpecial: /[A-Z!@#$%^&*]/.test(pwd)
    };
  };

  const security = checkPasswordSecurity(formData.password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    if (!formData.name.trim()) {
      setErrorMsg('Please enter your full name.');
      setLoading(false);
      return;
    }

    const sanitizePhone = (val) => {
      let digits = val.replace(/\D/g, '');
      if (digits.length === 12 && digits.startsWith('91')) {
        return digits.slice(2);
      }
      if (digits.length === 11 && digits.startsWith('0')) {
        return digits.slice(1);
      }
      return digits;
    };

    const cleanPhone = sanitizePhone(formData.phoneNumber);
    if (cleanPhone.length < 10) {
      setErrorMsg('Mobile number must be at least 10 numeric digits.');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          phoneNumber: cleanPhone,
          email: formData.email.trim() || undefined,
          password: formData.password,
          role: activeRoleTab
        })
      });

      let data;
      try {
        data = await res.json();
      } catch (jsonErr) {
        throw new Error('Unable to parse backend response. Verify backend API status.');
      }

      if (!res.ok) {
        setErrorMsg(data?.error || 'Registration failed. Please check details and try again.');
        return;
      }

      localStorage.setItem('vj_token', data.token);
      localStorage.setItem('vj_user', JSON.stringify(data.user));

      setSuccessMsg(`${activeRoleTab} account created successfully! Redirecting...`);
      if (onLoginSuccess) onLoginSuccess(data.user);

      setTimeout(() => {
        if (data.user.role === 'MERCHANT') navigate('/merchant');
        else if (data.user.role === 'RIDER') navigate('/rider');
        else navigate('/');
      }, 700);
    } catch (err) {
      console.error('Registration error:', err);
      setErrorMsg(err.message || 'Network connection error. Please verify backend API.');
    } finally {
      setLoading(false);
    }
  };

  const getPortalInfo = () => {
    if (activeRoleTab === 'MERCHANT') {
      return {
        icon: '🏪',
        title: 'Register Merchant Store',
        subtitle: 'Start listing products, managing orders, and receiving payments.',
        color: 'from-amber-600 to-amber-500'
      };
    }
    if (activeRoleTab === 'RIDER') {
      return {
        icon: '🛵',
        title: 'Register Bike Delivery Partner',
        subtitle: 'Become an active delivery partner and earn on express orders.',
        color: 'from-blue-600 to-indigo-600'
      };
    }
    return {
      icon: '🛍️',
      title: 'Create Buyer Account',
      subtitle: 'Join to order 15-minute express groceries, electronics, and local store items.',
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
              Full Name
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              placeholder="Enter full name"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">
              10-Digit Mobile Phone Number
            </label>
            <input
              type="tel"
              inputMode="numeric"
              maxLength={15}
              required
              value={formData.phoneNumber}
              onChange={(e) => {
                let digits = e.target.value.replace(/\D/g, '');
                if (digits.length >= 12 && digits.startsWith('91')) {
                  digits = digits.slice(2);
                } else if (digits.length >= 11 && digits.startsWith('0')) {
                  digits = digits.slice(1);
                }
                setFormData({ ...formData, phoneNumber: digits.slice(0, 10) });
              }}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-mono tracking-wider"
              placeholder="Enter 10-digit mobile number"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">
              Email Address (Optional)
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-mono"
              placeholder="Enter email address (optional)"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">
              Create Password
            </label>
            <div className="relative mb-2">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                placeholder="Create a strong password"
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

            {/* Password Security Strength Bar */}
            {formData.password.length > 0 && (
              <div className="space-y-1.5 p-2.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700/60">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-slate-500 dark:text-slate-400">Password Security:</span>
                  <span className={`font-bold ${security.textClass}`}>{security.label}</span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div className={`h-full ${security.colorClass} ${security.width} transition-all duration-300`} />
                </div>
                <div className="grid grid-cols-3 gap-1 pt-1 text-[10px] text-slate-500 dark:text-slate-400">
                  <span className={security.hasMinLength ? 'text-emerald-600 font-bold' : ''}>
                    {security.hasMinLength ? '✓' : '•'} Min 6 chars
                  </span>
                  <span className={security.hasNumber ? 'text-emerald-600 font-bold' : ''}>
                    {security.hasNumber ? '✓' : '•'} Has number
                  </span>
                  <span className={security.hasUpperOrSpecial ? 'text-emerald-600 font-bold' : ''}>
                    {security.hasUpperOrSpecial ? '✓' : '•'} Upper/Symbol
                  </span>
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 bg-gradient-to-tr ${info.color} text-white rounded-full font-bold text-sm shadow-md transition-all active:scale-98 disabled:opacity-50 mt-2`}
          >
            {loading ? 'Creating Account...' : `Register as ${activeRoleTab}`}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700/60 text-center">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Already registered?{' '}
            <Link
              to={`/login?role=${activeRoleTab.toLowerCase()}`}
              className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Sign In to {activeRoleTab} Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
