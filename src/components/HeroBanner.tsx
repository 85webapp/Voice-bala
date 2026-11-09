import React, { useEffect, useState } from 'react';
import { Headphones, FileText, Landmark, BadgeCheck } from 'lucide-react';

export const HeroBanner: React.FC = () => {
  // Switch between Pair 0 and Pair 1 smoothly
  // Pair 0: 24/7 Contact Support (left) & Pay After Delivery (right)
  // Pair 1: Govt E-Stamp & e-Sign (left) & GST & MSME Verified (right)
  const [activePair, setActivePair] = useState<0 | 1>(0);
  const [isFading, setIsFading] = useState<boolean>(false);

  useEffect(() => {
    // Alternates every 5.5 seconds with a smooth 400ms fade transition
    const interval = setInterval(() => {
      setIsFading(true);
      setTimeout(() => {
        setActivePair((prev) => (prev === 0 ? 1 : 0));
        setIsFading(false);
      }, 400);
    }, 5500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full mb-6">
      {/* Banner container */}
      <div className="relative w-full overflow-hidden rounded-2xl border border-slate-200/90 shadow-sm bg-white">
        {/* Full Banner Photo spanning entire container */}
        <img
          src="/assets/aistudio/1793430026987_162e6cfc.png"
          alt="Cotrik Tax & Compliance Group - Made for India's Businessmen & Professionals"
          className="w-full h-auto block select-none"
          loading="eager"
          decoding="async"
          fetchPriority="high"
        />

        {/* Text & Logos overlaid directly ON the banner photo at the bottom */}
        <div className="absolute bottom-0 inset-x-0 w-full px-3 sm:px-6 md:px-8 pb-2 sm:pb-3.5 md:pb-4 pt-4 sm:pt-6 bg-gradient-to-t from-white/95 via-white/85 to-transparent">
          <div
            className={`flex items-center justify-between gap-2 sm:gap-6 transition-all duration-400 ease-in-out ${
              isFading ? 'opacity-0 translate-y-1 scale-98' : 'opacity-100 translate-y-0 scale-100'
            }`}
          >
            {activePair === 0 ? (
              <>
                {/* 1. Left: 24/7 Contact Support with Headphone icon */}
                <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                  <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                    <Headphones className="w-4 h-4 sm:w-5 sm:h-5 text-slate-900 shrink-0" />
                  </div>
                  <div className="flex flex-col text-left leading-tight truncate">
                    <span className="font-extrabold text-[11px] sm:text-xs md:text-sm text-slate-900 leading-none">
                      24/7
                    </span>
                    <span className="text-[10px] sm:text-xs md:text-sm font-semibold text-slate-800 leading-tight truncate">
                      Contact Support
                    </span>
                  </div>
                </div>

                {/* 2. Right: File / Document icon with Pay After Delivery */}
                <div className="flex items-center gap-2 sm:gap-2.5 justify-end min-w-0">
                  <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-800 shrink-0" />
                  </div>
                  <span className="text-[11px] sm:text-xs md:text-sm font-bold text-slate-900 leading-tight whitespace-nowrap">
                    Pay After Delivery
                  </span>
                </div>
              </>
            ) : (
              <>
                {/* 3. Left: Govt emblem icon with Govt E-Stamp & e-Sign */}
                <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                  <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                    <Landmark className="w-4 h-4 sm:w-5 sm:h-5 text-slate-900 shrink-0" />
                  </div>
                  <span className="text-[11px] sm:text-xs md:text-sm font-bold text-slate-900 leading-tight whitespace-nowrap">
                    Govt E-Stamp &amp; e-Sign
                  </span>
                </div>

                {/* 4. Right: Star-badge check with GST & MSME Verified */}
                <div className="flex items-center gap-1.5 sm:gap-2 justify-end min-w-0">
                  <BadgeCheck className="w-5 h-5 sm:w-5.5 sm:h-5.5 text-[#1b5e20] fill-[#1b5e20]/15 shrink-0" />
                  <span className="text-[11px] sm:text-xs md:text-sm font-bold text-slate-900 leading-tight whitespace-nowrap">
                    GST &amp; MSME Verified
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
