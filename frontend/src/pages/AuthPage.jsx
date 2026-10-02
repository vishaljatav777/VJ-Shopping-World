import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Login from './Login';
import Registration from './Registration';

export default function AuthPage({ onLoginSuccess, mode = 'login' }) {
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get('mode') === 'register' ? 'register' : mode;
  const [authMode, setAuthMode] = useState(initialMode); // 'login' | 'register'

  return (
    <div className="max-w-md mx-auto px-4 pt-4">
      {/* Sign In vs Create Account Toggle */}
      <div className="flex bg-slate-200 dark:bg-slate-900 p-1 rounded-full mb-2 border border-slate-300 dark:border-slate-700 shadow-sm max-w-xs mx-auto">
        <button
          type="button"
          className={`flex-1 py-1.5 text-xs font-bold rounded-full transition-all ${
            authMode === 'login'
              ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
          onClick={() => setAuthMode('login')}
        >
          Sign In
        </button>
        <button
          type="button"
          className={`flex-1 py-1.5 text-xs font-bold rounded-full transition-all ${
            authMode === 'register'
              ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
          onClick={() => setAuthMode('register')}
        >
          Create Account
        </button>
      </div>

      {authMode === 'login' ? (
        <Login onLoginSuccess={onLoginSuccess} />
      ) : (
        <Registration onLoginSuccess={onLoginSuccess} />
      )}
    </div>
  );
}
