import React, { useEffect, useState } from 'react';
import { User, Settings, VolumeX, Volume2 } from 'lucide-react';
import { useDisplayLanguage } from '../hooks/useDisplayLanguage';
import { stopServiceVoice, subscribeVoiceState } from '../services/googleVoiceGuidance';

interface HeaderProps {
  onOpenProfile: () => void;
  onOpenSettings: () => void;
  orderCount?: number;
  onNavigateHome?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenProfile,
  onOpenSettings,
  orderCount = 0,
  onNavigateHome
}) => {
  const { t } = useDisplayLanguage();
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeVoiceState((playing) => {
      setIsAudioPlaying(playing);
    });
    return () => unsubscribe();
  }, []);

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

        {/* Center: Bold Black "CTC" Clickable to Home */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => {
            stopServiceVoice();
            onNavigateHome?.();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              stopServiceVoice();
              onNavigateHome?.();
            }
          }}
          className="flex flex-col items-center justify-center text-center select-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-lg p-1"
        >
          <div className="flex items-center gap-1.5">
            <span className="text-2xl font-black tracking-tight text-black">
              CTC
            </span>
          </div>
          <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 -mt-0.5">
            {t('Legal & Compliance')}
          </span>
        </div>

        {/* Right Side: Speaker Mute/Stop button & Settings Gear Icon */}
        <div className="flex items-center gap-1.5">
          {/* Top-Right Speaker Stop / Mute Button */}
          {isAudioPlaying && (
            <button
              onClick={() => stopServiceVoice()}
              type="button"
              aria-label="Stop Voice Guidance"
              title="Voice Guidance Playing · Click to stop audio"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs animate-pulse cursor-pointer transition-all active:scale-95"
            >
              <VolumeX className="w-4 h-4 shrink-0" />
              <span className="text-[11px] font-extrabold pr-0.5 hidden xs:inline">Mute Audio</span>
            </button>
          )}

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
