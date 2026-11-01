import React from 'react';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { PolicySection } from '../types';

interface PolicyPageViewProps {
  policy: PolicySection;
  onBack: () => void;
}

export const PolicyPageView: React.FC<PolicyPageViewProps> = ({ policy, onBack }) => {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 animate-fadeIn">
      {/* Top Navigation */}
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors py-1.5 px-3 rounded-lg hover:bg-blue-50 cursor-pointer mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Home</span>
      </button>

      {/* Policy Page Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs mb-6">
        <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">
          Prototype disclosure
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-black mt-1 mb-2">
          {policy.title}
        </h1>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-medium">
          This prototype does not provide legal, payment, document-delivery, e-stamp, e-signature, or government-registration services. Do not rely on sample policy text as a service commitment.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5 text-sm text-slate-700 leading-relaxed">
        Profile and demo order records are stored in this browser. Search and audio explanations require a configured Gemini server; avoid submitting sensitive personal information. No external service request, payment, or legal document is created by the demo order flow.
      </div>

      <div className="mt-8 bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-3.5 text-xs text-amber-900">
        <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <strong className="font-bold">Independent verification required</strong>
          <p className="mt-1 text-amber-800 leading-relaxed">
            Verify any provider, registration, legal requirement, fee, or service availability directly with the relevant authority or a qualified professional.
          </p>
        </div>
      </div>

      {/* Bottom Back Button */}
      <div className="mt-8 pt-4 flex justify-center">
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-colors cursor-pointer shadow-xs"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
};
