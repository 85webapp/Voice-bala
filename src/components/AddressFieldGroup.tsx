import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import { useExampleDetails } from '../hooks/useExampleDetails';
import { lookupPincodeAsync, lookupPincodeSync } from '../utils/pincodeLookup';

// 28 States of India (Uttar Pradesh first / default)
export const INDIAN_28_STATES = [
  'Uttar Pradesh',
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttarakhand',
  'West Bengal'
];

// 8 Union Territories of India
export const INDIAN_8_UTS = [
  'Andaman and Nicobar Islands',
  'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi (NCT)',
  'Jammu and Kashmir',
  'Ladakh',
  'Lakshadweep',
  'Puducherry'
];

export interface AddressData {
  country: string;
  state: string;
  pincode: string;
  city: string;
  areaOrSociety: string;
  landmark: string;
  flatBuilding: string;
  areaStreet: string;
  fullAddressString: string;
}

interface AddressFieldGroupProps {
  label?: string;
  variant?: 'standard' | 'property';
  defaultState?: string;
  value?: string;
  onChangeAddress: (fullAddress: string, details?: AddressData) => void;
  required?: boolean;
  className?: string;
}

export const AddressFieldGroup: React.FC<AddressFieldGroupProps> = ({
  label = 'Complete Address',
  variant = 'standard',
  defaultState = 'Uttar Pradesh',
  value = '',
  onChangeAddress,
  required = true,
  className = ''
}) => {
  const { getPlaceholder } = useExampleDetails();
  const [state, setState] = useState<string>(defaultState || 'Uttar Pradesh');
  const [pincode, setPincode] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [areaOrSociety, setAreaOrSociety] = useState<string>('');
  const [landmark, setLandmark] = useState<string>('');
  const [flatBuilding, setFlatBuilding] = useState<string>('');
  const [streetRoad, setStreetRoad] = useState<string>('');
  const [isLookingUpPin, setIsLookingUpPin] = useState<boolean>(false);

  const onChangeRef = useRef(onChangeAddress);
  onChangeRef.current = onChangeAddress;
  const latestPinRef = useRef<string>('');
  const initializedFromValueRef = useRef<boolean>(false);

  // Hydrate initial composite value only once if non-empty
  useEffect(() => {
    if (!initializedFromValueRef.current && value && !flatBuilding && !streetRoad && !city && !pincode) {
      initializedFromValueRef.current = true;
      setFlatBuilding(value);
    }
  }, [value]);

  const handlePincodeChange = async (rawPin: string) => {
    const cleanPin = rawPin.replace(/\D/g, '').slice(0, 6);
    setPincode(cleanPin);
    latestPinRef.current = cleanPin;

    if (cleanPin.length === 6) {
      // 1. Instant synchronous lookup
      const syncResult = lookupPincodeSync(cleanPin);
      if (syncResult) {
        if (syncResult.state) setState(syncResult.state);
        if (syncResult.city) setCity(syncResult.city);
      }

      // 2. Live API lookup for exact city/district & state
      setIsLookingUpPin(true);
      try {
        const asyncResult = await lookupPincodeAsync(cleanPin);
        if (latestPinRef.current === cleanPin && asyncResult) {
          if (asyncResult.state) setState(asyncResult.state);
          if (asyncResult.city) setCity(asyncResult.city);
        }
      } finally {
        if (latestPinRef.current === cleanPin) {
          setIsLookingUpPin(false);
        }
      }
    } else {
      setIsLookingUpPin(false);
    }
  };

  // Emit combined formatted address whenever user-entered components update
  useEffect(() => {
    const hasMeaningfulInput =
      pincode.trim().length > 0 ||
      city.trim().length > 0 ||
      areaOrSociety.trim().length > 0 ||
      landmark.trim().length > 0 ||
      flatBuilding.trim().length > 0 ||
      streetRoad.trim().length > 0;

    if (!hasMeaningfulInput) {
      onChangeRef.current('', {
        country: 'India',
        state,
        pincode: '',
        city: '',
        areaOrSociety: '',
        landmark: '',
        flatBuilding: '',
        areaStreet: '',
        fullAddressString: ''
      });
      return;
    }

    const parts =
      variant === 'property'
        ? [
            flatBuilding.trim(),
            streetRoad.trim(),
            areaOrSociety.trim(),
            city.trim(),
            state.trim(),
            pincode.trim() ? `PIN: ${pincode.trim()}` : ''
          ]
        : [
            flatBuilding.trim(),
            streetRoad.trim(),
            areaOrSociety.trim(),
            landmark.trim() ? `Near ${landmark.trim()}` : '',
            city.trim(),
            state.trim(),
            pincode.trim() ? `PIN: ${pincode.trim()}` : ''
          ];

    const fullStr = parts.filter(Boolean).join(', ');
    onChangeRef.current(fullStr, {
      country: 'India',
      state,
      pincode,
      city,
      areaOrSociety,
      landmark,
      flatBuilding,
      areaStreet: streetRoad,
      fullAddressString: fullStr
    });
  }, [variant, state, pincode, city, areaOrSociety, landmark, flatBuilding, streetRoad]);

  return (
    <div className={`space-y-3 p-4 bg-slate-50/80 border border-slate-200/90 rounded-2xl ${className}`}>
      <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2">
        <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
        <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
          {label} {required && <span className="text-red-500 font-bold">*</span>}
        </span>
      </div>

      {/* 1. State (Default: Uttar Pradesh, customizable) & 2. PIN Code (Auto-fills State & City) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-bold text-slate-700 mb-1">
            State / Union Territory {required && <span className="text-red-500">*</span>}
          </label>
          <select
            value={state}
            onChange={(e) => setState(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <optgroup label="28 Indian States">
              {INDIAN_28_STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </optgroup>
            <optgroup label="8 Union Territories">
              {INDIAN_8_UTS.map((ut) => (
                <option key={ut} value={ut}>
                  {ut}
                </option>
              ))}
            </optgroup>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-700 mb-1">
            PIN Code {required && <span className="text-red-500">*</span>}
          </label>
          <div className="relative">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              required={required}
              value={pincode}
              onChange={(e) => handlePincodeChange(e.target.value)}
              placeholder={getPlaceholder('6-Digit PIN Code')}
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            {isLookingUpPin && (
              <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin absolute right-3 top-1/2 -translate-y-1/2" />
            )}
          </div>
        </div>
      </div>

      {/* 3. City & 4. Area (standard) or Society Name / Locality (property) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-bold text-slate-700 mb-1">
            City {required && <span className="text-red-500">*</span>}
          </label>
          <input
            type="text"
            required={required}
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder={getPlaceholder('City / District')}
            className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-700 mb-1">
            {variant === 'property' ? 'Society Name / Locality' : 'Area'}{' '}
            {required && <span className="text-red-500">*</span>}
          </label>
          <input
            type="text"
            required={required}
            value={areaOrSociety}
            onChange={(e) => setAreaOrSociety(e.target.value)}
            placeholder={getPlaceholder(
              variant === 'property'
                ? 'e.g. Gaur City / Sector 62 / Gomti Nagar'
                : 'e.g. Sector / Colony / Mohalla / Village'
            )}
            className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
      </div>

      {/* 5. Landmark (only for standard address) */}
      {variant === 'standard' && (
        <div>
          <label className="block text-[11px] font-bold text-slate-700 mb-1">
            Landmark <span className="text-slate-400 font-normal">(Optional)</span>
          </label>
          <input
            type="text"
            value={landmark}
            onChange={(e) => setLandmark(e.target.value)}
            placeholder={getPlaceholder('e.g. Near Metro Station / City Park')}
            className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
      )}

      {/* 6. House No. / Flat No. / Building Name & 7. Street / Road Name */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-bold text-slate-700 mb-1">
            {variant === 'property'
              ? 'House No. / Flat No. / Building No.'
              : 'House No. / Flat No. / Building Name'}{' '}
            {required && <span className="text-red-500">*</span>}
          </label>
          <input
            type="text"
            required={required}
            value={flatBuilding}
            onChange={(e) => setFlatBuilding(e.target.value)}
            placeholder={getPlaceholder('e.g. Flat 304, Tower B')}
            className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-700 mb-1">
            Street / Road Name {required && <span className="text-red-500">*</span>}
          </label>
          <input
            type="text"
            required={required}
            value={streetRoad}
            onChange={(e) => setStreetRoad(e.target.value)}
            placeholder={getPlaceholder('e.g. MG Road / Main Link Road')}
            className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
      </div>
    </div>
  );
};
