import React from 'react';
import { User, Settings, ShieldCheck } from 'lucide-react';
import { useDisplayLanguage } from '../hooks/useDisplayLanguage';

interface HeaderProps {
  onOpenProfile: () => void;
  onOpenSettings: () => void;
  orderCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenProfile,
  onOpenSettings,
  orderCount = 0
}) => {
  const { t } = useDisplayLanguage();
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200/90 shadow-xs transition-colors">
      <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Left Side: Profile Icon */}
        <div className="flex items-center">
          <button
            onClick={onOpenProfile}
            type="button"
            aria-label={t('Open User Profile')}
            className="relative p-2.5 rounded-full text-slate-800 hover:text-blue-600 hover:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 active:scale-95 cursor-pointer"
          >
            <User className="w-5 h-5" />
            {orderCount > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-blue-600 rounded-full ring-2 ring-white" />
            )}
          </button>
        </div>

        {/* Center: Bold Black "CTC" */}
        <div className="flex flex-col items-center justify-center text-center select-none cursor-pointer">
          <div className="flex items-center gap-1.5">
            <span className="text-2xl font-black tracking-tight text-black">
              CTC
            </span>
          </div>
          <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 -mt-0.5">
            {t('Legal & Compliance')}
          </span>
        </div>

        {/* Right Side: Settings Gear Icon */}
        <div className="flex items-center">
          <button
            onClick={onOpenSettings}
            type="button"
            aria-label={t('Open Settings')}
            className="p-2.5 rounded-full text-slate-800 hover:text-blue-600 hover:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 active:scale-95 cursor-pointer"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};
