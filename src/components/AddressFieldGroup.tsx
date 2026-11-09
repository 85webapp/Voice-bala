import React, { useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';
import { STATE_CITIES_MAP } from '../data/indianCities';
import { useExampleDetails } from '../hooks/useExampleDetails';

// 28 States of India (as specified: 28 states first)
export const INDIAN_28_STATES = [
  'Uttar Pradesh', // Default
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

// 8 Union Territories of India (as specified: 8 UTs at the bottom)
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

// All countries with India at the top / default
export const WORLD_COUNTRIES = [
  'India',
  'United Arab Emirates',
  'United States',
  'United Kingdom',
  'Canada',
  'Australia',
  'Singapore',
  'Saudi Arabia',
  'Germany',
  'France',
  'Nepal',
  'Bangladesh',
  'Sri Lanka',
  'Other Country'
];

export interface AddressData {
  country: string;
  state: string;
  pincode: string;
  flatBuilding: string;
  areaStreet: string;
  landmark: string;
  city: string;
  fullAddressString: string;
}

interface AddressFieldGroupProps {
  label?: string;
  value?: string; // Existing composite address string
  onChangeAddress: (fullAddress: string, details?: AddressData) => void;
  required?: boolean;
  className?: string;
}

export const AddressFieldGroup: React.FC<AddressFieldGroupProps> = ({
  label = 'Complete Address',
  value = '',
  onChangeAddress,
  required = true,
  className = ''
}) => {
  const { getPlaceholder } = useExampleDetails();
  const [country, setCountry] = useState<string>('India');
  const [state, setState] = useState<string>('');
  const [pincode, setPincode] = useState<string>('');
  const [flatBuilding, setFlatBuilding] = useState<string>('');
  const [areaStreet, setAreaStreet] = useState<string>('');
  const [landmark, setLandmark] = useState<string>('');
  const [city, setCity] = useState<string>('');

  // If initial composite value exists and is parsed
  useEffect(() => {
    if (value && !flatBuilding && !areaStreet) {
      // Keep existing value as flat/building if starting
      const parts = value.split(',').map((p) => p.trim());
      if (parts.length >= 3) {
        setFlatBuilding(parts[0] || '');
        setAreaStreet(parts[1] || '');
      } else {
        setFlatBuilding(value);
      }
    }
  }, []);

  // Auto PIN Code state & city lookup
  const handlePincodeChange = (pin: string) => {
    const cleanPin = pin.replace(/\D/g, '').slice(0, 6);
    setPincode(cleanPin);

    if (cleanPin.length === 6) {
      const p = cleanPin;
      // Auto-identify based on Indian Postal Circle
      if (p.startsWith('201') || p.startsWith('202') || p.startsWith('203')) {
        setState('Uttar Pradesh');
        setCity('Noida / Ghaziabad');
      } else if (p.startsWith('226') || p.startsWith('227')) {
        setState('Uttar Pradesh');
        setCity('Lucknow');
      } else if (p.startsWith('208') || p.startsWith('209')) {
        setState('Uttar Pradesh');
        setCity('Kanpur');
      } else if (p.startsWith('282') || p.startsWith('283')) {
        setState('Uttar Pradesh');
        setCity('Agra');
      } else if (p.startsWith('205')) {
        setState('Uttar Pradesh');
        setCity('Mainpuri');
      } else if (p.startsWith('110')) {
        setState('Delhi (NCT)');
        setCity('New Delhi');
      } else if (p.startsWith('400')) {
        setState('Maharashtra');
        setCity('Mumbai');
      } else if (p.startsWith('411')) {
        setState('Maharashtra');
        setCity('Pune');
      } else if (p.startsWith('560')) {
        setState('Karnataka');
        setCity('Bengaluru');
      } else if (p.startsWith('380')) {
        setState('Gujarat');
        setCity('Ahmedabad');
      } else if (p.startsWith('600')) {
        setState('Tamil Nadu');
        setCity('Chennai');
      } else if (p.startsWith('500')) {
        setState('Telangana');
        setCity('Hyderabad');
      } else if (p.startsWith('700')) {
        setState('West Bengal');
        setCity('Kolkata');
      } else if (p.startsWith('302')) {
        setState('Rajasthan');
        setCity('Jaipur');
      }
    }
  };

  // Build combined standard Indian address string whenever any part updates
  useEffect(() => {
    const parts = [
      flatBuilding.trim(),
      areaStreet.trim(),
      landmark.trim() ? `Near ${landmark.trim()}` : '',
      city.trim(),
      state.trim(),
      pincode.trim() ? `PIN: ${pincode.trim()}` : '',
      country.trim()
    ].filter(Boolean);

    const fullStr = parts.join(', ');
    onChangeAddress(fullStr, {
      country,
      state,
      pincode,
      flatBuilding,
      areaStreet,
      landmark,
      city,
      fullAddressString: fullStr
    });
  }, [country, state, pincode, flatBuilding, areaStreet, landmark, city]);

  const citiesForState = STATE_CITIES_MAP[state] || ['Central City / District'];

  return (
    <div className={`space-y-3 p-4 bg-slate-50/80 border border-slate-200/90 rounded-2xl ${className}`}>
      <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2">
        <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
        <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
          {label} {required && <span className="text-red-500 font-bold">*</span>}
        </span>
      </div>

      {/* 1. Country (Default: India) & 2. State (Default: Uttar Pradesh - 28 States first, 8 UTs at bottom) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-bold text-slate-700 mb-1">
            Country <span className="text-red-500">*</span>
          </label>
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            {WORLD_COUNTRIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-700 mb-1">
            State / Territory <span className="text-red-500">*</span>
          </label>
          <select
            value={state}
            onChange={(e) => {
              setState(e.target.value);
            }}
            className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="">Select State / Territory</option>
            <optgroup label="28 Indian States (राज्य)">
              {INDIAN_28_STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </optgroup>
            <optgroup label="8 Union Territories (केंद्र शासित प्रदेश)">
              {INDIAN_8_UTS.map((ut) => (
                <option key={ut} value={ut}>
                  {ut}
                </option>
              ))}
            </optgroup>
          </select>
        </div>
      </div>

      {/* 3. PIN Code with Auto-Detect State/City & 4. Town / City */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-bold text-slate-700 mb-1">
            PIN Code (Postal Code) <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            required={required}
            value={pincode}
            onChange={(e) => handlePincodeChange(e.target.value)}
            placeholder={getPlaceholder("6-Digit PIN Code")}
            className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-700 mb-1">
            Town / City <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required={required}
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder={getPlaceholder("City / District")}
            className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
      </div>

      {/* 5. Flat, House No., Building, Company, Apartment */}
      <div>
        <label className="block text-[11px] font-bold text-slate-700 mb-1">
          Flat, House No., Building, Company, Apartment <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          required={required}
          value={flatBuilding}
          onChange={(e) => setFlatBuilding(e.target.value)}
          placeholder={getPlaceholder("Flat / House / Floor / Building / Office No.")}
          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
        />
      </div>

      {/* 6. Area, Street, Sector, Village */}
      <div>
        <label className="block text-[11px] font-bold text-slate-700 mb-1">
          Area, Street, Sector, Village <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          required={required}
          value={areaStreet}
          onChange={(e) => setAreaStreet(e.target.value)}
          placeholder={getPlaceholder("Road, Sector, Area or Village")}
          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
        />
      </div>

      {/* 7. Landmark (Optional) */}
      <div>
        <label className="block text-[11px] font-bold text-slate-700 mb-1">
          Landmark <span className="text-slate-400 font-normal">(Optional)</span>
        </label>
        <input
          type="text"
          value={landmark}
          onChange={(e) => setLandmark(e.target.value)}
          placeholder={getPlaceholder("e.g. Near Metro Station / Govt School")}
          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
        />
      </div>
    </div>
  );
};
