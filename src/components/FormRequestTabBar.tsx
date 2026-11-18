import React from 'react';
import { FileText, PhoneCall, ArrowLeftRight } from 'lucide-react';

export type WizardModeTab = 'form' | 'request';

interface FormRequestTabBarProps {
  activeTab: WizardModeTab;
  onChangeTab: (tab: WizardModeTab) => void;
  requestLabel?: string;
  formLabel?: string;
  className?: string;
}

export const FormRequestTabBar: React.FC<FormRequestTabBarProps> = ({
  activeTab,
  onChangeTab,
  formLabel = 'Form',
  requestLabel = 'Request (1-Hour Callback)',
  className = ''
}) => {
  return (
    <div className={`w-full ${className}`}>
      <div
        role="tablist"
        aria-label="Switch between Full Form and 1-Hour Callback Request"
        className="grid grid-cols-2 p-1.5 bg-slate-100 border border-slate-200 rounded-2xl shadow-xs gap-1.5"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'form'}
          onClick={() => onChangeTab('form')}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'form'
              ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80 ring-1 ring-slate-900/5'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <FileText className={`w-4 h-4 shrink-0 ${activeTab === 'form' ? 'text-blue-700' : 'text-slate-400'}`} />
          <span className="truncate">{formLabel}</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'request'}
          onClick={() => onChangeTab('request')}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'request'
              ? 'bg-emerald-700 text-white shadow-sm ring-1 ring-emerald-800/30'
              : 'text-slate-600 hover:text-emerald-800 hover:bg-emerald-50/70'
          }`}
        >
          <PhoneCall className={`w-4 h-4 shrink-0 ${activeTab === 'request' ? 'text-emerald-200' : 'text-emerald-600'}`} />
          <span className="truncate">{requestLabel}</span>
        </button>
      </div>
      <div className="mt-1.5 flex items-center justify-center gap-1.5 text-[11px] font-medium text-slate-500">
        <ArrowLeftRight className="w-3 h-3 text-slate-400" />
        <span>Tap a tab above to switch between Form &amp; 1-Hour Callback Request</span>
      </div>
    </div>
  );
};

interface HorizontalSwipeContainerProps {
  activeTab: WizardModeTab;
  onChangeTab: (tab: WizardModeTab) => void;
  children: React.ReactNode;
  className?: string;
}

export const HorizontalSwipeContainer: React.FC<HorizontalSwipeContainerProps> = ({
  children,
  className = ''
}) => {
  // Click/tap-only switching prevents accidental tab changes while scrolling or filling fields on touch devices
  return <div className={className}>{children}</div>;
};
