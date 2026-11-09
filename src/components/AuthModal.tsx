import React, { useState } from 'react';
import { X, Phone, User, Lock, CheckCircle2, ShieldCheck } from 'lucide-react';
import { UserProfile } from '../types';
import { playConfirmationChime } from '../services/encryptionService';

interface AuthModalProps {
  onClose: () => void;
  onLoginSuccess: (user: Partial<UserProfile>) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose, onLoginSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');

  // Login form state
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state (Name, Mobile, Password, Confirm Password)
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  // Feedback states
  const [successBanner, setSuccessBanner] = useState<{ visible: boolean; message: string }>({
    visible: false,
    message: ''
  });
  const [errorMsg, setErrorMsg] = useState('');

  // Retrieve existing registered users from localStorage
  const getRegisteredUsers = (): Record<string, { name: string; phone: string; password: string }> => {
    try {
      const saved = localStorage.getItem('ctc_registered_users');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanPhone = regPhone.replace(/\D/g, '');
    if (!regName.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    if (cleanPhone.length !== 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!regPassword || regPassword.length < 4) {
      setErrorMsg('Password must be at least 4 characters long.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setErrorMsg('Passwords do not match. Please verify.');
      return;
    }

    // Save into database / local store
    try {
      const users = getRegisteredUsers();
      users[cleanPhone] = {
        name: regName.trim(),
        phone: cleanPhone,
        password: regPassword
      };
      localStorage.setItem('ctc_registered_users', JSON.stringify(users));
    } catch (err) {
      console.warn('Could not write user to localStorage:', err);
    }

    // Green tick + sound chime
    playConfirmationChime();
    setSuccessBanner({
      visible: true,
      message: 'You registered successfully!'
    });

    // Auto-slide to login tab and prefill the registered mobile number
    setTimeout(() => {
      setSuccessBanner({ visible: false, message: '' });
      setLoginPhone(cleanPhone);
      setLoginPassword('');
      setMode('login');
    }, 1200);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanPhone = loginPhone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setErrorMsg('Please enter your 10-digit mobile number.');
      return;
    }
    if (!loginPassword) {
      setErrorMsg('Please enter your password.');
      return;
    }

    const users = getRegisteredUsers();
    const existingUser = users[cleanPhone];

    // If registered, check password; if new, register on the fly or authenticate
    if (existingUser && existingUser.password !== loginPassword) {
      setErrorMsg('Incorrect password. Please try again.');
      return;
    }

    const resolvedName = existingUser?.name || 'Verified Member';

    // Green tick + sound chime
    playConfirmationChime();
    setSuccessBanner({
      visible: true,
      message: 'Successfully Logged In!'
    });

    setTimeout(() => {
      onLoginSuccess({
        name: resolvedName,
        phone: cleanPhone,
        isLoggedIn: true
      });
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-fadeIn">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Modal Top Header with Close */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2">
            <span className="text-lg font-black text-black">
              {mode === 'login' ? 'Account Login' : 'Create Account'}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Tab Bar: Login / Register tabs with active blue underline */}
        <div className="flex border-b border-slate-200 px-6 pt-2">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMsg('');
              setSuccessBanner({ visible: false, message: '' });
            }}
            className={`flex-1 py-3 text-sm font-bold transition-all cursor-pointer border-b-2 text-center ${
              mode === 'login'
                ? 'border-blue-600 text-blue-600 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setErrorMsg('');
              setSuccessBanner({ visible: false, message: '' });
            }}
            className={`flex-1 py-3 text-sm font-bold transition-all cursor-pointer border-b-2 text-center ${
              mode === 'register'
                ? 'border-blue-600 text-blue-600 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Register
          </button>
        </div>

        {/* Form Body */}
        <div className="px-6 py-5">
          {errorMsg && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700 animate-fadeIn">
              {errorMsg}
            </div>
          )}

          {successBanner.visible && (
            <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2.5 animate-fadeIn shadow-xs">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span className="text-sm">{successBanner.message}</span>
            </div>
          )}

          {/* TAB 1: LOGIN */}
          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mobile Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={10}
                    required
                    value={loginPhone}
                    onChange={(e) => setLoginPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-xs sm:text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#15803d] hover:bg-[#166534] text-white font-bold text-sm rounded-xl transition-all cursor-pointer shadow-md shadow-emerald-700/20 active:scale-98 mt-2"
              >
                Login
              </button>
            </form>
          ) : (
            /* TAB 2: REGISTER */
            <form onSubmit={handleRegister} className="space-y-3.5">
              {/* 1. Name */}
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
                    className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              {/* 2. Mobile Number (10 digits numeric) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mobile Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={10}
                    required
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              {/* 3. Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              {/* 4. Confirm Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#15803d] hover:bg-[#166534] text-white font-bold text-sm rounded-xl transition-all cursor-pointer shadow-md shadow-emerald-700/20 active:scale-98 mt-2"
              >
                Register
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
