import React from 'react';

interface AadhaarInputProps {
  value: string; // 12-digit raw string or formatted
  onChange: (raw12Digits: string) => void;
  required?: boolean;
  label?: string;
  placeholder?: string;
  id?: string;
  className?: string;
  helperText?: string;
}

/**
 * Aadhaar input component that collects full 12 digits in a single input field.
 * Formats automatically as "XXXX - XXXX - XXXX" as the user types without losing focus
 * or closing the mobile numeric keyboard.
 */
export const AadhaarInput: React.FC<AadhaarInputProps> = ({
  value,
  onChange,
  required = false,
  label = 'Aadhaar Number (12 Digits)',
  placeholder = '1234 - 5678 - 9012',
  id,
  className = ''
}) => {
  // Extract strictly digits
  const rawDigits = (value || '').replace(/\D/g, '').slice(0, 12);

  // Format into 4 - 4 - 4
  const formatDisplay = (digits: string): string => {
    if (!digits) return '';
    const parts: string[] = [];
    if (digits.length > 0) parts.push(digits.slice(0, 4));
    if (digits.length > 4) parts.push(digits.slice(4, 8));
    if (digits.length > 8) parts.push(digits.slice(8, 12));
    return parts.join(' - ');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputDigits = e.target.value.replace(/\D/g, '').slice(0, 12);
    onChange(inputDigits);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedText = e.clipboardData.getData('text');
    if (pastedText) {
      e.preventDefault();
      const inputDigits = pastedText.replace(/\D/g, '').slice(0, 12);
      onChange(inputDigits);
    }
  };

  const displayValue = formatDisplay(rawDigits);

  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label htmlFor={id} className="block text-xs font-bold text-slate-700">
          {label} {required && <span className="text-red-500 font-bold">*</span>}
        </label>
      )}

      <div className="relative">
        <input
          id={id}
          type="text"
          inputMode="numeric"
          pattern="[0-9]{4} - [0-9]{4} - [0-9]{4}"
          title="Please enter a complete 12-digit Aadhaar number (e.g. 1234 - 5678 - 9012)"
          maxLength={20}
          autoComplete="off"
          required={required}
          value={displayValue}
          onChange={handleChange}
          onPaste={handlePaste}
          placeholder={placeholder}
          className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-mono tracking-wider text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all shadow-2xs"
        />
      </div>
    </div>
  );
};
