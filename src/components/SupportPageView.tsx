import React, { useEffect } from 'react';
import { ArrowLeft, Headphones, Phone, MessageCircle, Clock, ShieldCheck, CheckCircle2, ListChecks } from 'lucide-react';
import { VoiceGuidanceButton } from './VoiceGuidanceButton';
import { playServiceVoice, stopServiceVoice } from '../services/googleVoiceGuidance';

interface SupportPageViewProps {
  onBack: () => void;
  onOpenCheckSteps?: () => void;
}

export const SupportPageView: React.FC<SupportPageViewProps> = ({ onBack, onOpenCheckSteps }) => {
  useEffect(() => {
    playServiceVoice('Call Support');
    return () => {
      stopServiceVoice();
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 pb-24 font-['Plus_Jakarta_Sans',sans-serif] animate-fadeIn">
      {/* Sticky Top Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3 shadow-2xs">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => {
              stopServiceVoice();
              onBack();
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 font-bold text-xs sm:text-sm transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <div className="text-center">
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-[#15803d] block">
              Cotrix Tcg Support
            </span>
            <h1 className="text-sm sm:text-base font-black text-slate-900">
              24/7 Call &amp; Support
            </h1>
          </div>

          <VoiceGuidanceButton serviceTitle="Call Support" />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        {/* Hero Support Card */}
        <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-7 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#15803d] flex items-center justify-center shrink-0 border border-emerald-200">
                <Headphones className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 block">
                  Dedicated Legal &amp; Compliance Desk
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                  Speak Directly with Harshit
                </h2>
              </div>
            </div>

            <span className="inline-flex items-center gap-1.5 self-start sm:self-center text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
              Online 24/7
            </span>
          </div>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Connect directly with our senior representative for immediate assistance with Agreements, Affidavits, GST &amp; Udyam Registrations, Tax Notices, Insurance, Bank Loan Files, and e-Stamp Paper delivery.
          </p>

          {/* Primary Call & WhatsApp Action Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <a
              href="tel:+919286596391"
              className="w-full inline-flex items-center justify-center gap-2.5 py-3.5 px-5 bg-[#15803d] hover:bg-[#166534] active:bg-[#14532d] text-white font-bold text-sm sm:text-base rounded-xl shadow-md transition-all cursor-pointer"
            >
              <Phone className="w-5 h-5" />
              <span>Direct Call (+91 92865 96391)</span>
            </a>

            <a
              href="https://wa.me/919286596391?text=Hello%20Harshit,%20I%20need%20assistance%20regarding%20CTC%20Legal%20Services."
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2.5 py-3.5 px-5 bg-[#25D366] hover:bg-[#20bd5a] active:bg-[#1da851] text-white font-bold text-sm sm:text-base rounded-xl shadow-md transition-all cursor-pointer"
            >
              <MessageCircle className="w-5 h-5 fill-current" />
              <span>WhatsApp Message</span>
            </a>
          </div>
        </section>

        {/* Guarantees & SLA Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-1.5">
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">5-Minute Response</h3>
            <p className="text-xs text-slate-600">
              Immediate call pickup or callback within 5 minutes during application verification.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-1.5">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Zero Upfront Charge</h3>
            <p className="text-xs text-slate-600">
              Discuss your full requirement freely before paying anything or generating an order.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-1.5">
            <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">End-to-End Guidance</h3>
            <p className="text-xs text-slate-600">
              We guide on State Stamp Duty, Aadhaar e-Sign, GST, Udyam, Notices &amp; Loan files.
            </p>
          </div>
        </section>

        {/* Optional Shortcut to Check Steps */}
        {onOpenCheckSteps && (
          <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <ListChecks className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Want to see how the 10-minute process works?</h3>
                <p className="text-xs text-slate-500">Watch the quick step-by-step video &amp; workflow guide.</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                stopServiceVoice();
                onOpenCheckSteps();
              }}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer shrink-0"
            >
              View Check Steps →
            </button>
          </section>
        )}
      </main>
    </div>
  );
};
