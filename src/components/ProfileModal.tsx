import React, { useState, useMemo } from 'react';
import { X, Plus, Camera, Search, Check, ShieldCheck } from 'lucide-react';
import { UserProfile } from '../types';
import { STATE_CITIES_MAP, INDIAN_STATES_LIST } from '../data/indianCities';

interface ProfileModalProps {
  profile: UserProfile;
  onSaveProfile: (profile: UserProfile) => void;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  profile,
  onSaveProfile,
  onClose
}) => {
  const [formData, setFormData] = useState<UserProfile>(profile);
  const [citySearch, setCitySearch] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Available cities dependent on selected state
  const availableCities = useMemo(() => {
    const stateCities = STATE_CITIES_MAP[formData.state] || [
      'Central City',
      'Civil Lines',
      'Main Market',
      'Industrial Area',
      'Metro Center'
    ];
    if (!citySearch.trim()) {
      return stateCities;
    }
    const q = citySearch.toLowerCase().trim();
    return stateCities.filter((c) => c.toLowerCase().includes(q));
  }, [formData.state, citySearch]);

  const handleStateChange = (newState: string) => {
    const newCities = STATE_CITIES_MAP[newState] || [];
    setFormData((prev) => ({
      ...prev,
      state: newState,
      city: newCities.length > 0 ? newCities[0] : ''
    }));
    setCitySearch('');
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          avatarUrl: reader.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile(formData);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header: Pure English */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
          <h2 className="text-lg font-black text-black">Profile</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {saveSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Profile saved successfully!</span>
            </div>
          )}

          {/* Profile Picture / Add Logo Area with Plus Icon */}
          <div className="flex flex-col items-center justify-center py-2">
            <div className="relative group">
              <div className="w-20 h-20 rounded-full bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden">
                {formData.avatarUrl ? (
                  <img
                    src={formData.avatarUrl}
                    alt="User Logo"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Camera className="w-7 h-7 text-slate-400" />
                )}
              </div>

              {/* Add Logo Plus Button */}
              <label className="absolute bottom-0 right-0 w-7 h-7 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center shadow-md cursor-pointer transition-colors">
                <Plus className="w-4 h-4" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
              </label>
            </div>
            <span className="text-xs font-semibold text-slate-600 mt-2">
              {formData.avatarUrl ? 'Change Logo' : 'Add Logo'}
            </span>
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Ramesh Kumar"
              className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          {/* Mobile Number & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Mobile Number
              </label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 98765 43210"
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="client@example.com"
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          {/* State Dropdown (First) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              State
            </label>
            <select
              value={formData.state}
              onChange={(e) => handleStateChange(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
            >
              {INDIAN_STATES_LIST.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          {/* Dynamic City Dropdown (Dependent on selected state) with Search */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              City ({formData.state})
            </label>

            {/* City search box if state has many cities */}
            <div className="relative mb-2">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={citySearch}
                onChange={(e) => setCitySearch(e.target.value)}
                placeholder={`Search city in ${formData.state}...`}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>

            <select
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
            >
              {availableCities.map((cityName) => (
                <option key={cityName} value={cityName}>
                  {cityName}
                </option>
              ))}
            </select>
          </div>

          {/* GSTIN (Optional) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              GSTIN (Optional)
            </label>
            <input
              type="text"
              value={formData.gstin || ''}
              onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
              placeholder="e.g. 07AAAAA0000A1Z5"
              className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 uppercase"
            />
          </div>

          {/* Save Button */}
          <div className="pt-3">
            <button
              type="submit"
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-colors cursor-pointer shadow-xs"
            >
              Save Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
