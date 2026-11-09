import React, { useEffect, useRef } from 'react';
import { ArrowLeft, CheckCircle2, PhoneCall, FileText, Clock, ShieldCheck, ArrowRight } from 'lucide-react';

interface CheckStepsViewProps {
  onBack: () => void;
  onSelectAgreements: () => void;
}

export const CheckStepsView: React.FC<CheckStepsViewProps> = ({ onBack, onSelectAgreements }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Ensure video auto-plays and never pauses per user specification:
  // "जैसे ही कोई भी बंदा चेक स्टेप्स पर क्लिक करेगा, डायरेक्ट वीडियो चालू हो जाएगी। ना बंद और चालू करने का कोई ऑप्शन होगा, ना यह देखने का कोई ऑप्शन होगा कि कितनी वीडियो हो गई है, कितनी रह गई है। डायरेक्ट चलेगी और चलती ही रहेगी।"
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.muted = true;
      video.playsInline = true;
      video.loop = true;
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Retry muted playback if browser restricts
          video.muted = true;
          video.play().catch(() => {});
        });
      }
    }
  }, []);

  const steps = [
    {
      stepNumber: '01',
      title: 'Select the right form.',
      description: 'Choose your desired legal agreement, affidavit, power of attorney, or statutory compliance form from our verified template directory.',
      image: '/assets/aistudio/IMG_adb3a157-d4da-4b63-8273-52cfc952e8f2_124dc57d.jpg',
      imageAlt: 'Step 1 - Select the right form',
      icon: FileText
    },
    {
      stepNumber: '02',
      title: 'Attend the call within 5 minutes.',
      description: 'Our senior legal compliance representative calls you promptly within 5 minutes to verify names, terms, stamp duty state, and special clauses.',
      image: '/assets/aistudio/CalTransfers_Cover-1024x452_52239ca2.png',
      imageAlt: 'Step 2 - Attend the call within 5 minutes',
      icon: PhoneCall
    },
    {
      stepNumber: '03',
      title: 'Check the details on the call.',
      description: 'Carefully cross-check the first party, second party details, rent/financial terms, and government e-Stamp denomination together on the call.',
      image: '/assets/aistudio/d-white-people-clipboard-checklist-renderer-illustration-success-concept-background-66163758_b6a89fe1.jpg',
      imageAlt: 'Step 3 - Check the details on the call',
      icon: CheckCircle2
    },
    {
      stepNumber: '04',
      title: 'Complete receive the agreement in 10 minutes.',
      description: 'Receive your fully prepared, verified legal agreement and affidavit digitally within 10 minutes, plus track fast doorstep physical delivery.',
      image: '/assets/aistudio/1794120968673_a999c9e3.png',
      imageAlt: 'Step 4 - Complete receive the agreement in 10 minutes',
      icon: Clock
    }
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 pb-24 font-['Plus_Jakarta_Sans',sans-serif] animate-fadeIn">
      {/* Sticky Header with Back Button and Cotrix Tcg branding */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3 shadow-2xs">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 font-bold text-xs sm:text-sm transition-all cursor-pointer"
            aria-label="Back to home"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <div className="text-center">
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-[#15803d] block">
              Cotrix Tcg
            </span>
            <h1 className="text-sm sm:text-base font-black text-slate-900">
              Check Steps
            </h1>
          </div>

          <div className="w-16 flex justify-end">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#15803d] bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-[#15803d] animate-pulse"></span>
              Verified
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Continuous Autoplaying Video: Full portrait aspect ratio so no bottom characters are cut off */}
        <div className="relative max-w-xs sm:max-w-sm mx-auto rounded-2xl overflow-hidden border-2 border-slate-900/10 shadow-lg bg-black aspect-[9/16] flex items-center justify-center">
          <video
            ref={videoRef}
            src="/assets/aistudio/Blue_Stop_Dreaming_Start_Doing_Quote_Mobile_Video_9deb27ad.mp4"
            autoPlay
            loop
            muted
            playsInline
            controls={false}
            disablePictureInPicture
            disableRemotePlayback
            className="w-full h-full object-contain pointer-events-none select-none"
            aria-label="Cotrix Tcg Process Video"
          />
        </div>

        {/* Page Hero Intro */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs text-center space-y-1.5">
          <span className="text-xs font-bold text-[#15803d] uppercase tracking-wider">
            Fast Track Legal Documentation
          </span>
          <h2 className="text-lg sm:text-xl font-black text-slate-900">
            How Cotrix Tcg Works
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
            Follow these 4 simple steps to get your government e-Stamped agreement or affidavit prepared, verified, and delivered in record time.
          </p>
        </div>

        {/* 4 Interactive Step Cards with User Photos */}
        <div className="space-y-4">
          {steps.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={item.stepNumber}
                className="bg-white rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition-all duration-300 overflow-hidden group"
              >
                <div className="p-4 sm:p-5 flex flex-col sm:flex-row gap-4 items-center sm:items-start">
                  {/* Step Image */}
                  <div className="w-full sm:w-44 h-36 shrink-0 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center relative">
                    <img
                      src={item.image}
                      alt={item.imageAlt}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                      decoding="async"
                    />
                    <div className="absolute top-2 left-2 bg-[#15803d] text-white text-[11px] font-black px-2 py-0.5 rounded-md shadow-xs">
                      Step {item.stepNumber}
                    </div>
                  </div>

                  {/* Step Details */}
                  <div className="flex-1 min-w-0 space-y-2 text-left">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <h3 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
                        {item.title}
                      </h3>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      {item.description}
                    </p>

                    <div className="pt-1 flex items-center gap-2 text-[11px] font-bold text-[#15803d]">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Cotrix Tcg Verified Procedure</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Closing Instruction & Final Call to Action */}
        <div className="bg-gradient-to-br from-emerald-50 via-white to-blue-50 rounded-2xl border-2 border-[#15803d]/30 p-6 shadow-sm text-center space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#15803d]/10 text-[#15803d] text-xs font-black uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span>Cotrix Tcg Guarantee</span>
          </div>

          <div className="space-y-1">
            <h3 className="text-base sm:text-xl font-black text-slate-900">
              Follow this step and make an agreement or affidavit.
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
              Ready to start? Select your form now and get your document verified with zero delay.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={onSelectAgreements}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-[#15803d] hover:bg-[#166534] active:bg-[#14532d] text-white font-bold text-sm sm:text-base shadow-md transition-all cursor-pointer group"
            >
              <span>Make Agreement or Affidavit</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              type="button"
              onClick={onBack}
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold text-sm transition-all cursor-pointer"
            >
              Back to Home
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};
