import React from 'react';
import { POLICIES_DATA } from '../data/policiesData';
import { PolicySection } from '../types';

interface PoliciesSectionProps {
  onSelectPolicy: (policy: PolicySection) => void;
}

export const PoliciesSection: React.FC<PoliciesSectionProps> = ({ onSelectPolicy }) => {
  return (
    <section id="terms-and-policies-section" className="w-full mt-10 mb-8 pt-4">
      {/* Central Divider with Line and "Terms & Policies" in the Center */}
      <div className="relative flex items-center justify-center mb-6">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-slate-300" />
        </div>
        <div className="relative bg-[#f8fafc] px-4 sm:px-6">
          <span className="text-sm sm:text-base font-extrabold uppercase tracking-wider text-black bg-white px-4 py-1.5 rounded-full border border-slate-300 shadow-2xs">
            Terms &amp; Policies
          </span>
        </div>
      </div>

      {/* Clean blue bullet point links as specifically requested by user */}
      <div className="max-w-md mx-auto px-4 space-y-3">
        {POLICIES_DATA.map((policy) => (
          <div key={policy.id} className="flex items-start gap-2.5">
            <span className="text-blue-600 font-bold text-base leading-none select-none">
              &bull;
            </span>
            <button
              type="button"
              onClick={() => onSelectPolicy(policy)}
              className="text-left text-sm sm:text-base font-semibold text-blue-600 hover:text-blue-800 hover:underline transition-colors cursor-pointer"
            >
              {policy.title}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
};
