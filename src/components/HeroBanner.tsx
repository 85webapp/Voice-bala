import React from 'react';
import { Headphones, FileText, Landmark, Check } from 'lucide-react';

export const HeroBanner: React.FC = () => {
  return (
    <div className="w-full mb-6">
      {/* Banner container: image covers entire box, text overlaid directly on bottom of photo */}
      <div className="relative w-full overflow-hidden rounded-2xl border border-slate-200/90 shadow-sm bg-white">
        {/* Full Banner Photo spanning entire container */}
        <img
          src="/assets/aistudio/1793430026987_162e6cfc.png"
          alt="Cotrik Tax & Compliance Group - Made for India's Businessmen & Professionals"
          className="w-full h-auto block select-none"
          loading="eager"
        />

        {/* Text & Logos overlaid directly ON the banner photo at the very bottom */}
        <div className="absolute bottom-0 inset-x-0 w-full px-2.5 sm:px-6 md:px-8 pb-1.5 sm:pb-3 md:pb-4 pt-3 sm:pt-6 bg-gradient-to-t from-white/95 via-white/80 to-transparent">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-4 items-center justify-between">
            {/* 1. 24/7 Contact Support with Headphone icon */}
            <div className="flex items-center gap-1.5 sm:gap-2.5">
              <Headphones className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-slate-900 shrink-0" />
              <div className="flex flex-col text-left leading-tight">
                <span className="font-extrabold text-[10px] sm:text-xs md:text-sm text-slate-900 leading-none">24/7</span>
                <span className="text-[9px] sm:text-[11px] md:text-xs font-semibold text-slate-800 leading-tight whitespace-nowrap">Contact Support</span>
              </div>
            </div>

            {/* 2. File / Document icon with Pay After Delivery */}
            <div className="flex items-center gap-1.5 sm:gap-2.5">
              <FileText className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-emerald-800 shrink-0" />
              <span className="text-[10px] sm:text-xs md:text-sm font-bold text-slate-900 leading-tight whitespace-nowrap">Pay After Delivery</span>
            </div>

            {/* 3. Govt emblem icon with Govt E-Stamp & e-Sign */}
            <div className="flex items-center gap-1.5 sm:gap-2.5">
              <Landmark className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-slate-900 shrink-0" />
              <span className="text-[10px] sm:text-xs md:text-sm font-bold text-slate-900 leading-tight whitespace-nowrap">Govt E-Stamp &amp; e-Sign</span>
            </div>

            {/* 4. Green background with white check with GST & MSME Verified */}
            <div className="flex items-center gap-1.5 sm:gap-2.5">
              <div className="w-3.5 h-3.5 sm:w-5 sm:h-5 rounded-full bg-[#1b5e20] text-white flex items-center justify-center shrink-0 shadow-xs">
                <Check className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 stroke-[3]" />
              </div>
              <span className="text-[10px] sm:text-xs md:text-sm font-bold text-slate-900 leading-tight whitespace-nowrap">GST &amp; MSME Verified</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
