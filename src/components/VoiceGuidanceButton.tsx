import React, { useEffect, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import {
  playServiceVoice,
  stopServiceVoice,
  toggleServiceVoice,
  subscribeVoiceState,
  isServiceVoicePlaying
} from '../services/googleVoiceGuidance';
import { SUPPORTED_LANGUAGES, getStoredAudioLanguage } from '../data/voiceNarrationData';

interface VoiceGuidanceButtonProps {
  serviceTitle: string;
  autoPlay?: boolean;
  autoPlayDelayMs?: number;
  className?: string;
  variant?: 'compact' | 'full';
}

export const VoiceGuidanceButton: React.FC<VoiceGuidanceButtonProps> = ({
  serviceTitle,
  autoPlay = false,
  autoPlayDelayMs = 500,
  className = '',
  variant = 'full'
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(() => isServiceVoicePlaying(serviceTitle));
  const [currentLang, setCurrentLang] = useState(getStoredAudioLanguage);

  useEffect(() => {
    const handleLangChange = () => {
      setCurrentLang(getStoredAudioLanguage());
    };
    window.addEventListener('ctc_audio_language_changed', handleLangChange);

    const unsubscribe = subscribeVoiceState(() => {
      setIsPlaying(isServiceVoicePlaying(serviceTitle));
    });

    let autoTimer: any = null;
    if (autoPlay) {
      autoTimer = setTimeout(() => {
        playServiceVoice(serviceTitle);
      }, autoPlayDelayMs);
    }

    return () => {
      if (autoTimer) clearTimeout(autoTimer);
      unsubscribe();
      window.removeEventListener('ctc_audio_language_changed', handleLangChange);
    };
  }, [serviceTitle, autoPlay, autoPlayDelayMs]);

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Rule 4: Top-right corner speaker button that calls stopServiceVoice() when active
    if (isPlaying) {
      stopServiceVoice();
    } else {
      playServiceVoice(serviceTitle);
    }
  };

  const langConfig = SUPPORTED_LANGUAGES.find((l) => l.code === currentLang) || SUPPORTED_LANGUAGES[0];

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <button
        type="button"
        onClick={handleToggle}
        aria-label={
          isPlaying
            ? 'Stop voice guidance (Tap to stop)'
            : `Listen to voice guidance in ${langConfig.name}`
        }
        aria-pressed={isPlaying}
        title={
          isPlaying
            ? 'Tap to stop voice guidance'
            : `Listen to voice guidance in ${langConfig.nativeName} (${langConfig.name})`
        }
        className={`group relative inline-flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 shadow-xs ${
          isPlaying
            ? 'bg-amber-500 hover:bg-amber-600 text-white border border-amber-600 ring-2 ring-amber-300/80 shadow-md animate-pulse'
            : 'bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 hover:text-blue-700 border border-slate-300 hover:border-blue-400'
        }`}
      >
        {isPlaying ? (
          <>
            {/* Animated Equalizer soundwave bars */}
            <span className="flex items-end gap-0.5 h-3.5 mr-0.5" aria-hidden="true">
              <span className="w-1 bg-white rounded-full animate-[bounce_0.8s_infinite] h-2" />
              <span className="w-1 bg-white rounded-full animate-[bounce_0.6s_infinite_0.2s] h-3.5" />
              <span className="w-1 bg-white rounded-full animate-[bounce_0.7s_infinite_0.1s] h-2.5" />
            </span>
            <VolumeX className="w-4 h-4 shrink-0 text-white" />
            <span className="font-extrabold tracking-tight">Tap to Stop</span>
          </>
        ) : (
          <>
            <div className="w-5 h-5 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Volume2 className="w-3.5 h-3.5" />
            </div>
            {variant === 'full' ? (
              <span className="font-semibold text-slate-800 group-hover:text-blue-700">
                Voice Guidance
              </span>
            ) : (
              <span className="font-semibold text-slate-800 group-hover:text-blue-700">
                Guide
              </span>
            )}
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 group-hover:bg-blue-50 text-slate-600 group-hover:text-blue-700 uppercase tracking-wider">
              {langConfig.code}
            </span>
          </>
        )}
      </button>

      {/* Helper floating hint pill when speaking */}
      {isPlaying && (
        <span className="absolute -bottom-6 right-0 text-[10px] text-amber-700 font-medium whitespace-nowrap bg-amber-50 px-2 py-0.5 rounded border border-amber-200 pointer-events-none animate-fadeIn hidden sm:inline-block">
          Playing voice guide · Tap to stop
        </span>
      )}
    </div>
  );
};
