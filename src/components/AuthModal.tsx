import React, { useState } from 'react';
import { X, Phone, User, CheckCircle2 } from 'lucide-react';
import { UserProfile } from '../types';

interface AuthModalProps {
  onClose: () => void;
  onLoginSuccess: (user: Partial<UserProfile>) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose, onLoginSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');

  // Login form state
  const [loginPhone, setLoginPhone] = useState('');

  // Register form state
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regSuccessMsg, setRegSuccessMsg] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!regName.trim() || !regPhone.trim()) {
      setErrorMsg('Please fill in all registration fields.');
      return;
    }

    // Demo profiles are local only; no credentials are created or verified.
    setLoginPhone(regPhone);
    setRegSuccessMsg(true);
    setTimeout(() => {
      setRegSuccessMsg(false);
      setMode('login');
    }, 1200);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!loginPhone.trim()) {
      setErrorMsg('Please enter your mobile number.');
      return;
    }

    // Success login
    onLoginSuccess({
      name: regName || 'Admin User',
      phone: loginPhone,
      isLoggedIn: true
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-fadeIn">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Modal Top Header with Close */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2">
            <span className="text-lg font-black text-black">Demo Account</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Demo profile actions */}
        <div className="flex bg-slate-100 p-1 m-4 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMsg('');
            }}
            className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all ${
              mode === 'login'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Continue
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setErrorMsg('');
            }}
            className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all ${
              mode === 'register'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            New profile
          </button>
        </div>

        {/* Form Body */}
        <div className="px-6 pb-6 pt-1">
          <p className="mb-4 text-xs text-slate-500">Demo access is not authenticated. Profile details are stored only in this browser.</p>
          {errorMsg && (
            <div className="mb-4 p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
              {errorMsg}
            </div>
          )}

          {regSuccessMsg && (
            <div className="mb-4 p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Demo profile ready. Returning to continue...</span>
            </div>
          )}

          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mobile Number (demo only)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    value={loginPhone}
                    onChange={(e) => setLoginPhone(e.target.value)}
                    placeholder="Enter a display contact number"
                    className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-colors cursor-pointer shadow-xs mt-2"
              >
                Continue in demo
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mobile Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-colors cursor-pointer shadow-xs mt-2"
              >
                Create demo profile
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
