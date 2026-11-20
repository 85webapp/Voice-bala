import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface WhiteSelectOption {
  value: string;
  label: string;
  group?: string;
}

export type WhiteSelectOptionInput = string | number | WhiteSelectOption;

interface WhiteSelectProps {
  value: string | number;
  onChange: (value: string) => void;
  options: WhiteSelectOptionInput[];
  placeholder?: string;
  variant?: 'default' | 'compact' | 'inline';
  className?: string;
  menuClassName?: string;
  disabled?: boolean;
  'aria-label'?: string;
  onTriggerClick?: (e: React.MouseEvent) => void;
}

export const WhiteSelect: React.FC<WhiteSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Select...',
  variant = 'default',
  className = '',
  menuClassName = '',
  disabled = false,
  'aria-label': ariaLabel,
  onTriggerClick
}) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const normalizedOptions = useMemo<WhiteSelectOption[]>(() => {
    return options.map((opt) =>
      typeof opt === 'object' && opt !== null
        ? opt
        : { value: String(opt), label: String(opt) }
    );
  }, [options]);

  const stringValue = String(value ?? '');
  const selectedOption = normalizedOptions.find((opt) => opt.value === stringValue);
  const displayLabel = selectedOption ? selectedOption.label : stringValue || placeholder;

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const triggerClasses =
    variant === 'inline'
      ? `inline-flex items-center justify-between gap-1 bg-white border border-slate-300 rounded-md px-2 py-0.5 mx-1 text-xs sm:text-sm font-semibold text-slate-900 leading-normal align-baseline focus:outline-none focus:ring-1 focus:ring-blue-600 cursor-pointer ${className}`
      : variant === 'compact'
      ? `w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-medium text-slate-900 flex items-center justify-between gap-2 focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer ${className}`
      : `w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 flex items-center justify-between gap-2 focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer ${className}`;

  const menuClasses =
    variant === 'inline'
      ? `absolute left-0 mt-1 min-w-[84px] w-max max-w-[260px] bg-white border border-slate-200 rounded-xl shadow-lg z-50 py-1 max-h-56 overflow-y-auto ${menuClassName}`
      : `absolute left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg z-50 py-1 max-h-64 overflow-y-auto ${menuClassName}`;

  let lastGroup: string | undefined = undefined;

  return (
    <div
      ref={containerRef}
      className={variant === 'inline' ? 'relative inline-block align-baseline' : 'relative w-full'}
      onClick={(e) => {
        if (variant === 'inline') {
          e.stopPropagation();
        }
      }}
    >
      <button
        type="button"
        disabled={disabled}
        aria-label={ariaLabel}
        aria-expanded={open}
        onClick={(e) => {
          if (variant === 'inline') {
            e.preventDefault();
            e.stopPropagation();
          }
          onTriggerClick?.(e);
          if (!disabled) {
            setOpen((prev) => !prev);
          }
        }}
        className={`${triggerClasses} ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
      >
        <span className="truncate text-left">{displayLabel}</span>
        <ChevronDown
          className={`${variant === 'inline' ? 'w-3.5 h-3.5' : 'w-4 h-4'} text-slate-500 shrink-0 transition-transform ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <div className={menuClasses}>
          {normalizedOptions.map((option) => {
            const isSelected = option.value === stringValue;
            const showGroupHeader = option.group && option.group !== lastGroup;
            lastGroup = option.group;

            return (
              <React.Fragment key={`${option.group || ''}-${option.value}`}>
                {showGroupHeader && (
                  <div className="px-3.5 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50 border-y border-slate-100 first:border-t-0">
                    {option.group}
                  </div>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    if (variant === 'inline') {
                      e.preventDefault();
                      e.stopPropagation();
                    }
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className={`w-full text-left ${
                    variant === 'inline' ? 'px-3 py-2 text-xs sm:text-sm' : 'px-3.5 py-2.5 text-xs sm:text-sm'
                  } flex items-center justify-between gap-2 bg-white hover:bg-slate-50 transition-colors cursor-pointer ${
                    isSelected ? 'font-bold text-blue-700' : 'font-medium text-slate-900'
                  }`}
                >
                  <span className="truncate">{option.label}</span>
                  {isSelected && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                </button>
              </React.Fragment>
            );
          })}
        </div>
      )}
    </div>
  );
};
