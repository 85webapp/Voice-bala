import React, { useState } from 'react';
import { X, LogOut, LogIn, ChevronRight, ShieldCheck, Volume2, Globe } from 'lucide-react';
import { UserProfile } from '../types';
import { SUPPORTED_LANGUAGES, SupportedLanguage, getStoredAudioLanguage, setStoredAudioLanguage } from '../data/voiceNarrationData';
import { useDisplayLanguage } from '../hooks/useDisplayLanguage';

interface SettingsModalProps {
  onClose: () => void;
  onOpenPolicies: () => void;
  onOpenAuth: () => void;
  onLogout: () => void;
  profile: UserProfile;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  onClose,
  onOpenPolicies,
  onOpenAuth,
  onLogout,
  profile
}) => {
  const { language: displayLanguage, setLanguage: setDisplayLanguage, t } = useDisplayLanguage();
  const [audioLang, setAudioLang] = useState<SupportedLanguage>(getStoredAudioLanguage);
  const [showExampleDetails, setShowExampleDetails] = useState<boolean>(() => {
    try {
      return localStorage.getItem('ctc_show_example_details') === 'true';
    } catch {
      return false;
    }
  });

  const handleToggleExampleDetails = (checked: boolean) => {
    setShowExampleDetails(checked);
    try {
      localStorage.setItem('ctc_show_example_details', String(checked));
      window.dispatchEvent(new Event('ctc_settings_changed'));
      window.dispatchEvent(new Event('ctc_example_details_changed'));
    } catch {}
  };

  const handleTermsClick = () => {
    onClose();
    // Scroll directly to Terms & Policies section as instructed by user
    setTimeout(() => {
      const el = document.getElementById('terms-and-policies-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      } else {
        onOpenPolicies();
      }
    }, 150);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-fadeIn font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header: Simply "Settings" with close button */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
          <h2 className="text-lg font-black text-black">Settings</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
            aria-label="Close settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 text-xs text-slate-700">
          {/* 1. Section: ACCOUNT (Defaults to Login if not authenticated) */}
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
              Account
            </span>

            {profile.isLoggedIn ? (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-black">
                    {profile.name || 'Member'}
                  </div>
                  <div className="text-xs text-slate-500 font-mono mt-0.5">
                    {profile.phone ? `+91 ${profile.phone}` : 'Registered Client'}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onLogout}
                  className="px-3 py-1.5 text-slate-600 hover:text-rose-600 font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-black">
                    Account Login
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Sign in to track orders and save your legal drafts
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenAuth();
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Login</span>
                </button>
              </div>
            )}
          </div>

          {/* 2. Section: FORM & DRAFTING (EXAMPLE DETAILS) */}
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
              Form &amp; Drafting
            </span>

            <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-2">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <div className="font-bold text-slate-900 text-xs">Example Details</div>
                  <div className="text-[11px] text-slate-400">
                    Show example hints in form input boxes (Default: OFF)
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={showExampleDetails}
                  onChange={(e) => handleToggleExampleDetails(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 accent-blue-600 cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* 3. Section: PREFERENCES & LANGUAGES */}
          <div className="space-y-3">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Preferences &amp; Languages
            </span>

            {/* Standalone Box: Display Language */}
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-600" />
                <div className="font-bold text-slate-900 text-xs">{t('Display Language')}</div>
              </div>
              <select
                value={displayLanguage}
                onChange={(e) => setDisplayLanguage(e.target.value as SupportedLanguage)}
                aria-label={t('Display Language')}
                className="bg-slate-50 border border-slate-300 text-slate-900 text-xs font-bold rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-blue-600 focus:outline-none cursor-pointer"
              >
                {SUPPORTED_LANGUAGES.map((language) => (
                  <option key={language.code} value={language.code}>
                    {language.code === 'en' ? 'English' : `${language.nativeName} (${language.name})`}
                  </option>
                ))}
              </select>
            </div>

            {/* Standalone Box: Audio Voice Language */}
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-blue-600" />
                <div className="font-bold text-slate-900 text-xs">Audio Voice Language</div>
              </div>
              <select
                value={audioLang}
                onChange={(e) => {
                  const next = e.target.value as SupportedLanguage;
                  setAudioLang(next);
                  setStoredAudioLanguage(next);
                }}
                className="bg-slate-50 border border-slate-300 text-slate-900 text-xs font-bold rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-blue-600 focus:outline-none cursor-pointer"
              >
                {SUPPORTED_LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.code === 'en' ? 'English' : `${l.nativeName} (${l.name})`}
                  </option>
                ))}
              </select>
            </div>

            {/* Currency & Date standard box */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-slate-600">
              <div className="flex justify-between items-center">
                <span>Active Currency:</span>
                <strong className="text-slate-900">₹ INR - Indian Rupee</strong>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-200/80">
                <span>Standard Date Format:</span>
                <strong className="text-slate-900">DD/MM/YYYY Indian Standard</strong>
              </div>
            </div>
          </div>

          {/* 4. Section: LEGAL & PROTECTION (MOVED TO THE VERY BOTTOM AS INSTRUCTED) */}
          <div className="pt-2 border-t border-slate-100">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
              Legal &amp; Protection
            </span>

            <button
              type="button"
              onClick={handleTermsClick}
              className="w-full bg-blue-50/60 hover:bg-blue-100/60 border border-blue-200 rounded-xl p-3.5 flex items-center justify-between text-left transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <div>
                  <div className="font-bold text-blue-900">Terms &amp; Protection Policies</div>
                  <div className="text-[11px] text-blue-700">Open legal clauses, payment rules &amp; vault terms</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-blue-600" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
