import React, { useRef } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { useExampleDetails } from '../hooks/useExampleDetails';

interface DateOfBirthPickerProps {
  label: string;
  value: string; // Stored in DD/MM/YYYY or free text
  onChange: (formattedVal: string) => void;
  required?: boolean;
  placeholder?: string;
  helperText?: string;
}

/**
 * Format string as user types: DD/MM/YYYY
 * Inserts '/' after 2 digits, then after next 2 digits, and caps year at 4 digits.
 */
export function formatDobInput(raw: string, prevVal = ''): string {
  // If user pressed backspace on a slash, remove the slash and previous digit
  if (prevVal.length > raw.length && (prevVal.endsWith('/') || prevVal.length === 3 || prevVal.length === 6)) {
    return raw;
  }

  // Strip non-digits
  const digits = raw.replace(/\D/g, '').slice(0, 8); // max 8 digits: DDMMYYYY

  if (digits.length <= 2) {
    return digits;
  }
  if (digits.length <= 4) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
}

/**
 * Converts YYYY-MM-DD (from calendar picker) to DD/MM/YYYY
 */
export function convertIsoToDdMmYyyy(iso: string): string {
  if (!iso || !iso.includes('-')) return iso;
  const parts = iso.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
  }
  return iso;
}

/**
 * Converts DD/MM/YYYY to YYYY-MM-DD for native date input value
 */
export function convertDdMmYyyyToIso(ddmmyyyy: string): string {
  if (!ddmmyyyy || !ddmmyyyy.includes('/')) return '';
  const parts = ddmmyyyy.split('/');
  if (parts.length === 3 && parts[2].length === 4) {
    const [day, month, year] = parts;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  return '';
}

/**
 * Calculate age in years from DD/MM/YYYY
 */
export function calculateAgeInYears(ddmmyyyy: string): number | null {
  if (!ddmmyyyy || !ddmmyyyy.includes('/')) return null;
  const parts = ddmmyyyy.split('/');
  if (parts.length === 3 && parts[2].length === 4) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    const birthDate = new Date(year, month, day);
    if (!isNaN(birthDate.getTime())) {
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age >= 0 && age < 130 ? age : null;
    }
  }
  return null;
}

export const DateOfBirthPicker: React.FC<DateOfBirthPickerProps> = ({
  label,
  value,
  onChange,
  required = false,
  placeholder,
  helperText
}) => {
  const hiddenDateRef = useRef<HTMLInputElement>(null);
  const { showExampleDetails, getPlaceholder } = useExampleDetails();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const formatted = formatDobInput(raw, value);
    onChange(formatted);
  };

  const handleCalendarPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isoVal = e.target.value; // YYYY-MM-DD
    if (isoVal) {
      const formatted = convertIsoToDdMmYyyy(isoVal);
      onChange(formatted);
    }
  };

  const openCalendarPicker = () => {
    if (hiddenDateRef.current) {
      if (typeof hiddenDateRef.current.showPicker === 'function') {
        try {
          hiddenDateRef.current.showPicker();
        } catch {
          hiddenDateRef.current.click();
        }
      } else {
        hiddenDateRef.current.click();
      }
    }
  };

  const computedAge = calculateAgeInYears(value);
  const effectivePlaceholder = getPlaceholder(placeholder || 'DD/MM/YYYY');

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="block text-xs font-bold text-slate-700">
          {label} {required ? <span className="text-red-500 font-bold">*</span> : <span className="text-slate-400 font-normal">(Optional)</span>}
        </label>
        {computedAge !== null && (
          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            Age: {computedAge} Years
          </span>
        )}
      </div>

      <div className="relative flex items-center">
        <input
          type="text"
          required={required}
          maxLength={10}
          value={value}
          onChange={handleInputChange}
          placeholder={effectivePlaceholder}
          className="w-full bg-white border border-slate-300 rounded-xl pl-3.5 pr-11 py-2 text-xs sm:text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all placeholder:text-slate-400"
        />

        {/* Calendar Picker Trigger Icon */}
        <button
          type="button"
          onClick={openCalendarPicker}
          title="Pick date from calendar"
          aria-label="Open Calendar"
          className="absolute right-1.5 p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
        >
          <CalendarIcon className="w-4 h-4" />
        </button>

        {/* Hidden native HTML5 Date Input for reliable calendar popup */}
        <input
          ref={hiddenDateRef}
          type="date"
          tabIndex={-1}
          value={convertDdMmYyyyToIso(value)}
          onChange={handleCalendarPick}
          className="absolute -top-100 opacity-0 pointer-events-none w-0 h-0"
          max="2035-12-31"
          min="1920-01-01"
        />
      </div>

      <div className="mt-1 text-[11px] text-slate-400">
        <span>{helperText || (showExampleDetails ? 'Format: DD/MM/YYYY (e.g. 15/08/1995)' : 'Format: DD/MM/YYYY')}</span>
      </div>
    </div>
  );
};

