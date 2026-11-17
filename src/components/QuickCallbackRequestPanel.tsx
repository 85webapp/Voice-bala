import React, { useEffect, useId, useMemo, useState } from 'react';
import {
  PhoneCall,
  CheckCircle2,
  MapPin,
  Loader2,
  User,
  Mail,
  FileText,
  HelpCircle,
  MessageCircle,
  Send,
  ArrowLeft,
  Sparkles
} from 'lucide-react';
import { INITIAL_FRONT_DOCUMENTS, MASTER_CATEGORIES } from '../data/documentsData';
import { SERVICE_CATEGORIES } from '../data/servicesData';
import { STATE_CITIES_MAP } from '../data/indianCities';
import { lookupPincodeAsync, lookupPincodeSync, normalizeIndianStateName } from '../utils/pincodeLookup';
import {
  buildSubmissionOverview,
  encryptFormDataAndSign,
  fieldEntry,
  generateSequentialOrderId,
  playConfirmationChime,
  postEncryptedPayloadToWebsiteB,
  saveLightweightMetadata,
  ServerBSyncResult
} from '../services/encryptionService';
import { playServiceVoice } from '../services/googleVoiceGuidance';
import { ServerBSyncStatusCard } from './ServerBSyncStatusCard';

export const ALL_INDIAN_STATES_UTS: string[] = [
  'Uttar Pradesh',
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Delhi (NCT)',
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
  'West Bengal',
  'Andaman and Nicobar Islands',
  'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Jammu and Kashmir',
  'Ladakh',
  'Lakshadweep',
  'Puducherry',
  'Custom / Other State'
];

const EXTRA_DISTRICTS_BY_STATE: Record<string, string[]> = {
  'Uttar Pradesh': [
    'Lucknow',
    'Noida (Gautam Buddha Nagar)',
    'Greater Noida',
    'Kanpur',
    'Agra',
    'Mainpuri',
    'Varanasi',
    'Prayagraj',
    'Ghaziabad',
    'Meerut',
    'Bareilly',
    'Aligarh',
    'Moradabad',
    'Gorakhpur',
    'Saharanpur',
    'Jhansi',
    'Muzaffarnagar',
    'Mathura',
    'Ayodhya',
    'Firozabad',
    'Etawah',
    'Etah',
    'Hardoi',
    'Sitapur',
    'Jaunpur',
    'Azamgarh',
    'Sultanpur',
    'Raebareli'
  ],
  'Odisha': ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Puri', 'Sambalpur', 'Berhampur'],
  'Himachal Pradesh': ['Shimla', 'Solan', 'Kangra (Dharamshala)', 'Mandi', 'Kullu', 'Hamirpur'],
  'Jharkhand': ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro', 'Hazaribagh', 'Deoghar'],
  'Chhattisgarh': ['Raipur', 'Bilaspur', 'Durg', 'Bhilai', 'Korba', 'Raigarh'],
  'Assam': ['Guwahati (Kamrup)', 'Dibrugarh', 'Silchar', 'Jorhat', 'Tezpur', 'Nagaon'],
  'Kerala': ['Kochi (Ernakulam)', 'Thiruvananthapuram', 'Kozhikode', 'Thrissur', 'Kollam', 'Kannur'],
  'Jammu and Kashmir': ['Jammu', 'Srinagar', 'Anantnag', 'Baramulla', 'Udhampur'],
  'Ladakh': ['Leh', 'Kargil'],
  'Chandigarh': ['Chandigarh'],
  'Puducherry': ['Puducherry', 'Karaikal'],
  'Andaman and Nicobar Islands': ['Port Blair (South Andaman)'],
  'Dadra and Nagar Haveli and Daman and Diu': ['Silvassa', 'Daman', 'Diu'],
  'Lakshadweep': ['Kavaratti'],
  'Arunachal Pradesh': ['Itanagar', 'Naharlagun', 'Pasighat', 'Tawang'],
  'Manipur': ['Imphal East', 'Imphal West', 'Thoubal'],
  'Meghalaya': ['Shillong (East Khasi Hills)', 'Tura'],
  'Mizoram': ['Aizawl', 'Lunglei'],
  'Nagaland': ['Kohima', 'Dimapur', 'Mokokchung'],
  'Sikkim': ['Gangtok', 'Namchi'],
  'Tripura': ['Agartala (West Tripura)', 'Udaipur']
};

export function getDistrictSuggestionsForState(stateName: string): string[] {
  const normalized = normalizeIndianStateName(stateName) || stateName;
  const fromExtra = EXTRA_DISTRICTS_BY_STATE[normalized] || [];
  const fromMap = STATE_CITIES_MAP[normalized] || [];
  const combined = Array.from(new Set([...fromExtra, ...fromMap]));
  return combined;
}

export function getContextualQuestion(selectedItem: string, mode: 'document' | 'registration'): {
  question: string;
  placeholder: string;
} {
  const title = (selectedItem || '').toLowerCase();

  if (mode === 'registration') {
    if (title.includes('gst')) {
      return {
        question: 'Business Constitution & Expected Monthly Turnover?',
        placeholder: 'e.g., Proprietorship / Partnership / Pvt Ltd, trading or services, premises rented or owned...'
      };
    }
    if (title.includes('udyam') || title.includes('msme')) {
      return {
        question: 'Nature of Business (Manufacturing / Services) & Staff Count?',
        placeholder: 'e.g., Retail Shop / IT Consulting / Manufacturing unit, start date & approximate investment...'
      };
    }
    if (title.includes('private limited') || title.includes('llp')) {
      return {
        question: 'Number of Proposed Directors / Partners & Preferred Company Names?',
        placeholder: 'e.g., 2 Directors, authorized capital ₹1 Lakh, suggested company names...'
      };
    }
    if (title.includes('trademark')) {
      return {
        question: 'Brand Name / Logo & Products or Services You Sell Under It?',
        placeholder: 'e.g., Brand wordmark/logo details & business class / products sold...'
      };
    }
    if (title.includes('fssai')) {
      return {
        question: 'Food Business Type (Cloud Kitchen / Restaurant / Manufacturer) & Turnover?',
        placeholder: 'e.g., Bakery / Catering / Online food delivery, annual turnover under ₹12L or above...'
      };
    }
    return {
      question: 'Business / Applicant Requirement & Preferred Timeline?',
      placeholder: 'Briefly mention your business type, urgency, or any specific document question...'
    };
  }

  // Document mode contextual questions
  if (title.includes('11th month rent') || title.includes('rent agreement')) {
    return {
      question: 'Property Type (Residential / Commercial), Monthly Rent & Tenure?',
      placeholder: 'e.g., Residential 2BHK / Commercial Shop, Monthly rent ₹15,000, Security deposit ₹30,000...'
    };
  }
  if (title.includes('landlord noc')) {
    return {
      question: 'Purpose of NOC (GST Registration / Trade License) & Business Name?',
      placeholder: 'e.g., Shop/office address, landlord relationship (owned/relative), GST or business license use...'
    };
  }
  if (title.includes('vehicle')) {
    return {
      question: 'Vehicle Registration Number, Model & Handover Status?',
      placeholder: 'e.g., UP 84 AB 1234, Bike/Car model year, token paid / full handover date...'
    };
  }
  if (title.includes('name change')) {
    return {
      question: 'Old Name, New Name & Document Where Correction Is Needed?',
      placeholder: 'e.g., Old name vs new spelling, required for Gazette / Passport / Bank / Marksheet...'
    };
  }
  if (title.includes('address proof')) {
    return {
      question: 'Current Residing Address & Authority Requiring This Affidavit?',
      placeholder: 'e.g., Needed for Bank Account / Passport / Gas connection / Aadhaar address proof...'
    };
  }
  if (title.includes('date of birth') || title.includes('age correction')) {
    return {
      question: 'Recorded DOB vs Correct Actual DOB & Proof Available?',
      placeholder: 'e.g., Marksheet/Birth Certificate date vs Aadhaar/PAN date...'
    };
  }
  if (title.includes('loss of document')) {
    return {
      question: 'Which Document Was Lost & Do You Have Police NCR / GD No.?',
      placeholder: 'e.g., Lost 10th Marksheet / RC Book / Registry paper, NCR No. if lodged...'
    };
  }
  if (title.includes('anti-ragging') || title.includes('gap year')) {
    return {
      question: 'College / University Name & Course / Academic Gap Details?',
      placeholder: 'e.g., Student name, course & college name, or gap duration and reason...'
    };
  }
  if (title.includes('income affidavit')) {
    return {
      question: 'Annual Family Income & Authority / Scholarship Purpose?',
      placeholder: 'e.g., ₹2,40,000 per annum, required for EWS / College scholarship / UP Government scheme...'
    };
  }
  if (title.includes('unemployment')) {
    return {
      question: 'Highest Qualification & Scheme / Govt Loan Requiring Affidavit?',
      placeholder: 'e.g., Graduate, unemployed since 2024, required for Mukhyamantri Yuva Udyami / Govt job...'
    };
  }
  if (title.includes('first child') || title.includes('single girl child')) {
    return {
      question: 'Child Name, Date of Birth & School / Admission Requirement?',
      placeholder: 'e.g., School admission / CBSE fee waiver / KVS quota...'
    };
  }
  if (title.includes('founder') || title.includes('proprietorship') || title.includes('nda') || title.includes('vendor') || title.includes('influencer') || title.includes('brand sponsorship') || title.includes('freelancer') || title.includes('content rights') || title.includes('copyright')) {
    return {
      question: 'Key Parties Involved & Brief Commercial Terms / Stamp Requirement?',
      placeholder: 'e.g., Party names, service fee or equity terms, urgency & delivery preference...'
    };
  }

  return {
    question: 'Specific Details, Parties Involved, or Drafting Preference?',
    placeholder: 'Briefly share your requirement so our legal executive can prepare the draft on your callback...'
  };
}

interface QuickCallbackRequestPanelProps {
  mode: 'document' | 'registration';
  initialItemTitle: string;
  categoryLabel?: string;
  onBack?: () => void;
  onSwitchToForm?: () => void;
}

export const QuickCallbackRequestPanel: React.FC<QuickCallbackRequestPanelProps> = ({
  mode,
  initialItemTitle,
  categoryLabel,
  onBack,
  onSwitchToForm
}) => {
  const datalistId = useId();
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [pincode, setPincode] = useState('');
  const [stateName, setStateName] = useState('Uttar Pradesh');
  const [customState, setCustomState] = useState('');
  const [district, setDistrict] = useState('');
  const [selectedItem, setSelectedItem] = useState(initialItemTitle);
  const [relatedAnswer, setRelatedAnswer] = useState('');

  const [isLookingUpPin, setIsLookingUpPin] = useState(false);
  const [pinLookupNote, setPinLookupNote] = useState<string>('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [referenceId, setReferenceId] = useState('');
  const [serverBSyncResult, setServerBSyncResult] = useState<ServerBSyncResult | null>(null);
  const [lastEncryptedSubmission, setLastEncryptedSubmission] = useState<{
    result: any;
    metadata: any;
    payload: any;
  } | null>(null);

  useEffect(() => {
    setSelectedItem(initialItemTitle);
  }, [initialItemTitle]);

  const selectableItems = useMemo(() => {
    if (mode === 'document') {
      const titles = INITIAL_FRONT_DOCUMENTS.map((d) => d.title);
      if (initialItemTitle && !titles.includes(initialItemTitle)) {
        return [initialItemTitle, ...titles];
      }
      return titles;
    }
    const regCat = SERVICE_CATEGORIES.find((c) => c.id === 'registrations');
    const regServices = regCat ? regCat.services : [
      'GST Registration',
      'MSME Udyam Registration',
      'Private Limited Company Registration',
      'Limited Liability Partnership (LLP) Registration',
      'Trademark Certificate',
      'FSSAI Food License'
    ];
    if (initialItemTitle && !regServices.includes(initialItemTitle)) {
      return [initialItemTitle, ...regServices];
    }
    return regServices;
  }, [mode, initialItemTitle]);

  const effectiveState = stateName === 'Custom / Other State' ? customState.trim() : stateName;
  const districtSuggestions = useMemo(
    () => getDistrictSuggestionsForState(effectiveState || 'Uttar Pradesh'),
    [effectiveState]
  );

  const contextualQuestion = useMemo(
    () => getContextualQuestion(selectedItem, mode),
    [selectedItem, mode]
  );

  const handlePincodeChange = async (rawValue: string) => {
    const clean = rawValue.replace(/\D/g, '').slice(0, 6);
    setPincode(clean);
    setPinLookupNote('');

    if (clean.length === 6) {
      const syncMatch = lookupPincodeSync(clean);
      if (syncMatch) {
        if (syncMatch.state) {
          const normalized = normalizeIndianStateName(syncMatch.state) || syncMatch.state;
          if (ALL_INDIAN_STATES_UTS.includes(normalized)) {
            setStateName(normalized);
          } else {
            setStateName('Custom / Other State');
            setCustomState(syncMatch.state);
          }
        }
        if (syncMatch.city) {
          setDistrict(syncMatch.city);
        }
        setPinLookupNote('Detected region from PIN code...');
      }

      setIsLookingUpPin(true);
      try {
        const asyncMatch = await lookupPincodeAsync(clean);
        if (asyncMatch) {
          if (asyncMatch.state) {
            const normalized = normalizeIndianStateName(asyncMatch.state) || asyncMatch.state;
            if (ALL_INDIAN_STATES_UTS.includes(normalized)) {
              setStateName(normalized);
            } else {
              setStateName('Custom / Other State');
              setCustomState(asyncMatch.state);
            }
          }
          if (asyncMatch.city) {
            setDistrict(asyncMatch.city);
          }
          setPinLookupNote(`Auto-filled: ${asyncMatch.city || 'District'}, ${asyncMatch.state || ''}`);
        } else if (!syncMatch) {
          setPinLookupNote('PIN not found in postal index — select State & District manually');
        }
      } finally {
        setIsLookingUpPin(false);
      }
    }
  };

  const handleStateSelectChange = (newState: string) => {
    setStateName(newState);
    if (newState !== 'Custom / Other State') {
      setCustomState('');
    }
  };

  const handleSelectedItemChange = (newItem: string) => {
    setSelectedItem(newItem);
    playServiceVoice(newItem);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const cleanPhone = mobile.replace(/\D/g, '');
    if (!fullName.trim()) {
      setFormError('Please enter your Full Name.');
      return;
    }
    if (cleanPhone.length !== 10) {
      setFormError('Please enter a valid 10-digit Mobile Number.');
      return;
    }
    if (pincode.trim().length > 0 && pincode.trim().length !== 6) {
      setFormError('PIN Code must be 6 digits if provided (or leave it blank).');
      return;
    }

    setIsSubmitting(true);
    const orderId = generateSequentialOrderId();
    setReferenceId(orderId);

    const matchedDoc = INITIAL_FRONT_DOCUMENTS.find((d) => d.title === selectedItem);
    const resolvedCategory =
      categoryLabel ||
      matchedDoc?.category ||
      (mode === 'registration' ? 'Registrations' : 'Agreements & Affidavits');

    const overview = buildSubmissionOverview({
      orderId,
      requestType:
        mode === 'registration'
          ? '1-Hour Callback Request (Registration)'
          : '1-Hour Callback Request (Agreement / Affidavit)',
      mainCategory: resolvedCategory,
      subCategory: selectedItem,
      availableCategories:
        mode === 'document'
          ? MASTER_CATEGORIES.map((c) => c.name)
          : SERVICE_CATEGORIES.map((c) => c.title),
      availableSubCategories: selectableItems,
      documentTitle: selectedItem
    });

    const sections = [
      {
        pageNumber: 1,
        sectionTitle: '1-Hour Callback Request Details',
        fields: [
          fieldEntry('Full Name', fullName.trim(), false),
          fieldEntry('Mobile Number (10 Digits)', cleanPhone, false),
          fieldEntry('Email Address', email.trim(), true),
          fieldEntry('PIN Code (6 Digits)', pincode.trim(), true),
          fieldEntry('State / Union Territory', effectiveState || 'Uttar Pradesh', false, ALL_INDIAN_STATES_UTS),
          fieldEntry('District / City', district.trim(), true, districtSuggestions),
          fieldEntry(
            mode === 'registration' ? 'Selected Registration Service' : 'Selected Document / Agreement',
            selectedItem,
            false,
            selectableItems
          ),
          fieldEntry(`Related Question: ${contextualQuestion.question}`, relatedAnswer.trim(), true)
        ]
      }
    ];

    const payload = {
      submissionOverview: overview,
      requestType: overview.requestType,
      mainCategory: resolvedCategory,
      subCategory: selectedItem,
      documentTitle: selectedItem,
      service: selectedItem,
      category: resolvedCategory,
      clientName: fullName.trim(),
      clientPhone: cleanPhone,
      clientEmail: email.trim(),
      pincode: pincode.trim(),
      state: effectiveState || 'Uttar Pradesh',
      district: district.trim(),
      city: district.trim(),
      relatedQuestion: contextualQuestion.question,
      relatedAnswer: relatedAnswer.trim(),
      sections,
      totalPrice: 'Callback Request (Free Consultation)',
      orderId,
      timestamp: overview.submittedTimestampISO
    };

    const metadata = {
      firstPartyName: fullName.trim(),
      formName: `${selectedItem} (1-Hour Callback Request)`,
      timestamp: overview.submittedTimestampISO,
      totalPrice: 'Callback Request',
      orderId
    };

    const encrypted = encryptFormDataAndSign(payload);
    setLastEncryptedSubmission({ result: encrypted, metadata, payload });

    await saveLightweightMetadata(metadata);
    const syncResult = await postEncryptedPayloadToWebsiteB(encrypted, metadata, payload);
    setServerBSyncResult(syncResult);

    playConfirmationChime();
    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  const handleRetrySync = async () => {
    if (!lastEncryptedSubmission) return;
    setIsSubmitting(true);
    const syncRes = await postEncryptedPayloadToWebsiteB(
      lastEncryptedSubmission.result,
      lastEncryptedSubmission.metadata,
      lastEncryptedSubmission.payload
    );
    setServerBSyncResult(syncRes);
    setIsSubmitting(false);
  };

  if (isSubmitted) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 shadow-lg p-6 sm:p-8 text-center animate-fadeIn">
        <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-4 shadow-xs">
          <CheckCircle2 className="w-9 h-9" />
        </div>
        <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900">
          1-Hour Callback Request Submitted!
        </h3>
        <p className="mt-2 text-sm text-slate-600 max-w-md mx-auto">
          Thank you, <strong className="text-slate-900">{fullName}</strong>. Our specialist executive will call you on{' '}
          <strong className="text-slate-900">+91 {mobile}</strong> within 1 hour regarding{' '}
          <strong className="text-emerald-800">{selectedItem}</strong>.
        </p>

        <div className="mt-5 inline-flex flex-col sm:flex-row items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700">
          <span>Reference ID: <code className="text-emerald-700 font-bold">{referenceId}</code></span>
          <span className="hidden sm:inline text-slate-300">|</span>
          <span>Location: {district ? `${district}, ` : ''}{effectiveState || 'Uttar Pradesh'}</span>
        </div>

        <div className="mt-5 max-w-lg mx-auto text-left">
          <ServerBSyncStatusCard
            syncResult={serverBSyncResult}
            isRetrying={isSubmitting}
            onRetry={handleRetrySync}
          />
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {onSwitchToForm && (
            <button
              type="button"
              onClick={() => {
                setIsSubmitted(false);
                onSwitchToForm();
              }}
              className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 cursor-pointer"
            >
              Switch to Full Form
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setIsSubmitted(false);
              setRelatedAnswer('');
            }}
            className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs cursor-pointer"
          >
            Submit Another Callback Request
          </button>
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer inline-flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Home
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-lg overflow-hidden animate-fadeIn">
      {/* Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-800 p-5 sm:p-6 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 text-[11px] font-bold uppercase tracking-wider text-emerald-100 mb-2">
              <Sparkles className="w-3 h-3" />
              Fast Assisted Desk · 1-Hour Callback
            </div>
            <h3 className="text-lg sm:text-xl font-extrabold tracking-tight">
              Don&apos;t Want to Fill the Long Form? Request a Callback
            </h3>
            <p className="mt-1 text-xs sm:text-sm text-emerald-100/90">
              Share basic details &amp; location — our legal/CA team will call you within 1 hour and fill everything on call.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href="tel:+912109141007"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white text-emerald-900 hover:bg-emerald-50 text-xs font-bold shadow-sm transition-colors"
            >
              <PhoneCall className="w-3.5 h-3.5 text-emerald-700" />
              Direct Call
            </a>
            <a
              href={`https://wa.me/912109141007?text=${encodeURIComponent(
                `Hello! I need 1-hour callback assistance for: ${selectedItem}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400/40 text-xs font-bold shadow-sm transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              WhatsApp
            </a>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-5 sm:p-7 space-y-5">
        {formError && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-800">
            {formError}
          </div>
        )}

        {/* Selected Document / Registration Dropdown */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-emerald-700" />
            {mode === 'registration' ? 'Selected Registration / Service' : 'Selected Agreement / Affidavit'}
            <span className="text-rose-600">*</span>
          </label>
          <select
            value={selectedItem}
            onChange={(e) => handleSelectedItemChange(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
          >
            {selectableItems.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        {/* Name, Mobile, Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-500" />
              Full Name <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your full name"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <PhoneCall className="w-3.5 h-3.5 text-slate-500" />
              Mobile Number (10 Digits) <span className="text-rose-600">*</span>
            </label>
            <input
              type="tel"
              required
              inputMode="numeric"
              maxLength={10}
              value={mobile}
              onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="10-digit WhatsApp / Calling No."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-500" />
              Email Address <span className="text-slate-400 font-medium">(Optional)</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com (Optional)"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between gap-1.5">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                PIN Code (6 Digits) <span className="text-slate-400 font-medium">(Optional)</span>
              </span>
              {isLookingUpPin && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                  <Loader2 className="w-3 h-3 animate-spin" /> Fetching...
                </span>
              )}
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={pincode}
              onChange={(e) => handlePincodeChange(e.target.value)}
              placeholder="e.g. 205001 (auto-fills State & District)"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
            {pinLookupNote && (
              <p className="mt-1 text-[11px] font-semibold text-emerald-700">{pinLookupNote}</p>
            )}
          </div>
        </div>

        {/* State & District/City */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                State / Union Territory <span className="text-slate-500 font-medium">(Default: Uttar Pradesh)</span>
              </label>
              <select
                value={stateName}
                onChange={(e) => handleStateSelectChange(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              >
                {ALL_INDIAN_STATES_UTS.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
              {stateName === 'Custom / Other State' && (
                <input
                  type="text"
                  value={customState}
                  onChange={(e) => setCustomState(e.target.value)}
                  placeholder="Enter custom State / Region name"
                  className="mt-2 w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                District / City <span className="text-slate-400 font-medium">(Auto-fills via PIN or type/choose)</span>
              </label>
              <input
                type="text"
                list={datalistId}
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder={`Type or pick District in ${effectiveState || 'Uttar Pradesh'}`}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
              <datalist id={datalistId}>
                {districtSuggestions.map((d) => (
                  <option key={d} value={d} />
                ))}
              </datalist>
            </div>
          </div>
        </div>

        {/* Short Contextual Question */}
        <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80">
          <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{contextualQuestion.question}</span>
            <span className="text-slate-400 font-medium">(Optional)</span>
          </label>
          <textarea
            rows={2}
            value={relatedAnswer}
            onChange={(e) => setRelatedAnswer(e.target.value)}
            placeholder={contextualQuestion.placeholder}
            className="w-full px-3.5 py-2.5 rounded-xl border border-amber-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 resize-y"
          />
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          {onSwitchToForm && (
            <button
              type="button"
              onClick={onSwitchToForm}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Or Switch to Full Form
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto sm:ml-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-extrabold shadow-md transition-all disabled:opacity-60 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending Callback Request...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Submit 1-Hour Callback Request
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
