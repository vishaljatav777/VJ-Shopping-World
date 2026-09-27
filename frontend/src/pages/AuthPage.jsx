import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AuthPage({ onLoginSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({
    phoneNumber: '9876543210',
    password: 'Password123!',
    name: 'Vishal User',
    role: 'BUYER'
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';

    try {
      const res = await fetch(`http://localhost:5000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isRegister ? formData : {
          phoneNumber: formData.phoneNumber,
          password: formData.password
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Authentication failed');
        return;
      }

      localStorage.setItem('vj_token', data.token);
      localStorage.setItem('vj_user', JSON.stringify(data.user));
      
      setSuccessMsg(isRegister ? 'Account created successfully!' : 'Login successful!');
      if (onLoginSuccess) onLoginSuccess(data.user);

      setTimeout(() => {
        if (data.user.role === 'MERCHANT') navigate('/merchant');
        else if (data.user.role === 'RIDER') navigate('/rider');
        else navigate('/');
      }, 800);
    } catch (err) {
      setErrorMsg('Network error connecting to backend API');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-6 sm:p-8 shadow-xl">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-2xl mx-auto mb-3 shadow-md">
            🔐
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {isRegister ? 'Create VJ Express Account' : 'Welcome Back'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {isRegister ? 'Register as a Buyer, Seller, or Bike Partner' : 'Sign in to your account with phone number'}
          </p>
        </div>

        {/* Tab Switcher */}
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
            Register
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
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">Full Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                placeholder="e.g. Vishal Buyer"
              />
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">Phone Number</label>
            <input
              type="text"
              required
              value={formData.phoneNumber}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
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
              className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              placeholder="••••••••"
            />
          </div>

          {isRegister && (
            <div>
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">Account Type / Role</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="BUYER">Customer / Buyer</option>
                <option value="MERCHANT">Merchant / Store Owner</option>
                <option value="RIDER">Delivery Bike Partner</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-bold text-sm shadow-sm transition-all active:scale-98 disabled:opacity-50"
          >
            {loading ? 'Processing...' : isRegister ? 'Create Account' : 'Sign In Now'}
          </button>
        </form>
      </div>
    </div>
  );
}
