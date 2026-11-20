import React from 'react';

interface CircleIndicatorProps {
  checked: boolean;
  className?: string;
}

export const CircleIndicator: React.FC<CircleIndicatorProps> = ({
  checked,
  className = ''
}) => {
  return (
    <span
      aria-hidden="true"
      className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors bg-white ${
        checked ? 'border-slate-400' : 'border-slate-300'
      } ${className}`}
    >
      {checked && <span className="w-2 h-2 rounded-full bg-blue-600" />}
    </span>
  );
};

export function optionCardClass(
  selected: boolean,
  extraClasses = '',
  alignTop = false
): string {
  return `flex ${alignTop ? 'items-start' : 'items-center'} gap-2.5 px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm cursor-pointer transition-colors select-none ${
    selected
      ? 'bg-blue-50/75 border-slate-200 text-slate-900 font-semibold'
      : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50/70'
  } ${extraClasses}`.trim();
}

export const TOPIC_DIVIDER_CLASS = '-mx-5 px-5 sm:-mx-7 sm:px-7 border-t border-slate-200/80 pt-5';
export const SUBQUESTION_DIVIDER_CLASS = 'border-t border-slate-200/80 pt-4';
