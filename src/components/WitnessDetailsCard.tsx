import React from 'react';
import { AadhaarInput } from './AadhaarInput';
import { AddressFieldGroup } from './AddressFieldGroup';
import { DateOfBirthPicker } from './DateOfBirthPicker';
import { useExampleDetails } from '../hooks/useExampleDetails';

interface WitnessDetailsCardProps {
  witnessNumber: 1 | 2;
  name: string;
  onNameChange: (val: string) => void;
  fatherName: string;
  onFatherNameChange: (val: string) => void;
  profession: string;
  onProfessionChange: (val: string) => void;
  ageOrDob: string;
  onAgeOrDobChange: (val: string) => void;
  mobile: string;
  onMobileChange: (val: string) => void;
  aadhaar: string;
  onAadhaarChange: (val: string) => void;
  address: string;
  onAddressChange: (val: string) => void;
}

export const WitnessDetailsCard: React.FC<WitnessDetailsCardProps> = ({
  witnessNumber,
  name,
  onNameChange,
  fatherName,
  onFatherNameChange,
  profession,
  onProfessionChange,
  ageOrDob,
  onAgeOrDobChange,
  mobile,
  onMobileChange,
  aadhaar,
  onAadhaarChange,
  address,
  onAddressChange
}) => {
  const { showExampleDetails, getPlaceholder } = useExampleDetails();

  return (
    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
      <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
        Witness {witnessNumber} Details <span className="text-red-500 font-bold">*</span>
      </span>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-bold text-slate-700 mb-1">
            Full Legal Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder={getPlaceholder(`Witness ${witnessNumber} Full Legal Name`)}
            className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-700 mb-1">
            Father's / Husband's Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={fatherName}
            onChange={(e) => onFatherNameChange(e.target.value)}
            placeholder={getPlaceholder("Father's / Husband's Name")}
            className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-bold text-slate-700 mb-1">
            Profession / Job Title <span className="text-slate-400 font-normal">(Optional)</span>
          </label>
          <input
            type="text"
            value={profession}
            onChange={(e) => onProfessionChange(e.target.value)}
            placeholder={getPlaceholder('e.g. Service / Business')}
            className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div>
          <DateOfBirthPicker
            label="Age / Date of Birth"
            value={ageOrDob}
            onChange={onAgeOrDobChange}
            placeholder={getPlaceholder('DD/MM/YYYY')}
            helperText={showExampleDetails ? 'Format: DD/MM/YYYY' : undefined}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-bold text-slate-700 mb-1">
            Mobile Number (10 Digits) <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            inputMode="numeric"
            pattern="[0-9]*"
            required
            maxLength={10}
            value={mobile}
            onChange={(e) => onMobileChange(e.target.value.replace(/\D/g, '').slice(0, 10))}
            placeholder={getPlaceholder('10-Digit Mobile Number')}
            className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div>
          <AadhaarInput
            label="Aadhaar Number (12 Digits)"
            value={aadhaar}
            onChange={onAadhaarChange}
            required
          />
        </div>
      </div>

      <AddressFieldGroup
        label="Complete Residential Address"
        variant="standard"
        value={address}
        onChangeAddress={(addr) => onAddressChange(addr)}
        required
      />
    </div>
  );
};
