import React, { useState, useMemo, useEffect } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Building2,
  ShieldCheck,
  Plus,
  Trash2,
  Sparkles,
  UploadCloud,
  Layers,
  FileCheck2,
  AlertCircle,
  Volume2,
  Play,
  Square
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { LegalDocument, OrderItem } from '../types';
import { STATE_CATEGORIES, getSafeStampDuty } from '../data/stampDutyMatrix';
import { useExampleDetails } from '../hooks/useExampleDetails';
import {
  SupportedLanguage,
  SUPPORTED_LANGUAGES,
  speechController,
  fetchPageExplanation,
  fetchFieldExplanation,
  getVisibleFormLabels,
  getVisibleFieldLabel,
  getStoredAudioLanguage,
  setStoredAudioLanguage
} from '../data/voiceNarrationData';

interface CommercialNocWizardViewProps {
  document: LegalDocument;
  onBack: () => void;
  onOrderCreated: (order: OrderItem) => void;
  onNavigateToDashboard: () => void;
}

interface CoOwner {
  id: string;
  name: string;
  pan: string;
  aadhaarLast4: string;
}

interface CustomOperationalClause {
  id: string;
  header: string;
  description: string;
}

type StepId = '1' | '2' | '3' | '3B' | '4' | '5';

export const CommercialNocWizardView: React.FC<CommercialNocWizardViewProps> = ({
  document: initialDoc,
  onBack,
  onOrderCreated,
  onNavigateToDashboard
}) => {
  const showExample = useExampleDetails();
  const [currentPage, setCurrentPage] = useState<StepId>('1');

  // --- AUDIO EXPLAINER & MULTILINGUAL VOICE GUIDE ---
  const [selectedLang, setSelectedLang] = useState<SupportedLanguage>(getStoredAudioLanguage);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  useEffect(() => {
    const unsub = speechController.subscribe((speaking) => {
      setIsAudioPlaying(speaking);
    });
    return () => {
      unsub();
      speechController.stop();
    };
  }, []);

  useEffect(() => {
    speechController.stop();
  }, [currentPage]);

  const activeLangConfig = useMemo(() => {
    return SUPPORTED_LANGUAGES.find((l) => l.code === selectedLang) || SUPPORTED_LANGUAGES[0];
  }, [selectedLang]);

  const handlePlayPageSpeech = async () => {
    if (isAudioPlaying) { speechController.stop(); return; }
    const fields = getVisibleFormLabels();
    const explanation = await fetchPageExplanation('Commercial NOC Application', Number(currentPage), `Page ${currentPage}`, fields, selectedLang);
    if (explanation) speechController.speak(explanation, activeLangConfig.speechCode);
  };

  const handlePlayFieldSpeech = async (fieldKey: string) => {
    const label = getVisibleFieldLabel(fieldKey);
    const context = getVisibleFormLabels().join('; ');
    const explanation = await fetchFieldExplanation('Commercial NOC Application', fieldKey, label, context, selectedLang);
    if (explanation) speechController.speak(explanation, activeLangConfig.speechCode);
  };

  // --- PAGE 1: OBJECTIVE & STAMP JURISDICTION ---
  const [selectedState, setSelectedState] = useState<string>('Maharashtra');

  // Purpose of NOC [Multi-Select Checkbox - Pre-select GST & Bank Account Opening]
  const [purposes, setPurposes] = useState<Record<string, boolean>>({
    gst_reg: true,
    biz_license: false,
    subletting: false,
    bank_account: true,
    statutory_reg: false
  });

  const togglePurpose = (key: string) => {
    setPurposes((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const isPurposeValid = useMemo(() => {
    return Object.values(purposes).some((v) => v);
  }, [purposes]);

  // Property Classification
  const [propertyClassification, setPropertyClassification] = useState<string>('Commercial Building');

  // Stamp Duty Fee Paid By (New feature from user prompt)
  const [stampFeePaidBy, setStampFeePaidBy] = useState<'Landlord' | 'Business Owner' | 'Shared Equally'>(
    'Landlord'
  );

  // Recommended minimum state stamp duty
  const recommendedStamp = useMemo(() => {
    return getSafeStampDuty(initialDoc.title, selectedState);
  }, [initialDoc.title, selectedState]);

  // Stamp Selection Engine
  const [stampMode, setStampMode] = useState<'auto' | 'manual'>('auto');
  const [manualStampValue, setManualStampValue] = useState<number>(100);
  const [customManualStamp, setCustomManualStamp] = useState<string>('');

  const activeStampValue = useMemo(() => {
    if (stampMode === 'auto') return recommendedStamp;
    return manualStampValue === -1 ? Number(customManualStamp) || 0 : manualStampValue;
  }, [stampMode, recommendedStamp, manualStampValue, customManualStamp]);

  const isManualStampBelowThreshold = useMemo(() => {
    return stampMode === 'manual' && activeStampValue < recommendedStamp;
  }, [stampMode, activeStampValue, recommendedStamp]);

  // --- PAGE 2: THE GRANTOR (LANDLORD'S STANDING) ---
  const [landlordOwnershipType, setLandlordOwnershipType] = useState<string>('Sole Individual');
  const [landlordName, setLandlordName] = useState('');
  const [landlordFatherName, setLandlordFatherName] = useState('');
  const [landlordPan, setLandlordPan] = useState('');
  const [landlordAadhaarLast4, setLandlordAadhaarLast4] = useState('');
  const [landlordMobile, setLandlordMobile] = useState('');
  const [landlordEmail, setLandlordEmail] = useState('');
  const [clearTitleDeclared, setClearTitleDeclared] = useState(true);

  // Corporate Landlord
  const [corpCin, setCorpCin] = useState('');
  const [corpRegAddress, setCorpRegAddress] = useState('');
  const [corpRepName, setCorpRepName] = useState('');
  const [corpRepDesignation, setCorpRepDesignation] = useState('Director');
  const [corpResolutionDate, setCorpResolutionDate] = useState('');

  // Joint Landlords
  const [coOwners, setCoOwners] = useState<CoOwner[]>([]);
  const addCoOwner = () => {
    setCoOwners((prev) => [
      ...prev,
      { id: `co-${Date.now()}`, name: '', pan: '', aadhaarLast4: '' }
    ]);
  };
  const updateCoOwner = (id: string, field: keyof CoOwner, val: string) => {
    setCoOwners((prev) => prev.map((c) => (c.id === id ? { ...c, [field]: val } : c)));
  };
  const removeCoOwner = (id: string) => {
    setCoOwners((prev) => prev.filter((c) => c.id !== id));
  };

  // --- PAGE 3: THE GRANTEE (BUSINESS SCOPE & ENTITY) ---
  const [businessConstitution, setBusinessConstitution] = useState<string>('Sole Proprietorship');
  const [proposedBusinessName, setProposedBusinessName] = useState('');
  const [granteePan, setGranteePan] = useState('');
  const [granteeCin, setGranteeCin] = useState('');
  const [natureOfOperations, setNatureOfOperations] = useState<string>(
    'IT / Software / Back Office / Consultancy'
  );
  const [customNatureOfOperations, setCustomNatureOfOperations] = useState<string>('');

  // Signatory Details
  const [granteeSignatoryName, setGranteeSignatoryName] = useState('');
  const [granteeSignatoryFatherName, setGranteeSignatoryFatherName] = useState('');
  const [granteeDesignation, setGranteeDesignation] = useState<string>('Proprietor');
  const [authorizationDocUploaded, setAuthorizationDocUploaded] = useState(false);

  // Handle Dynamic Constitution to Signatory Designation Mapping
  const handleConstitutionChange = (newConstitution: string) => {
    setBusinessConstitution(newConstitution);
    if (newConstitution === 'Sole Proprietorship') {
      setGranteeDesignation('Proprietor');
    } else if (newConstitution === 'Partnership Firm') {
      setGranteeDesignation('Partner');
    } else if (
      newConstitution === 'Private Limited Company' ||
      newConstitution === 'Limited Liability Partnership (LLP)' ||
      newConstitution === 'One Person Company (OPC)' ||
      newConstitution === 'Public Limited Company'
    ) {
      setGranteeDesignation('Director');
    }
  };

  const handleBusinessNameChange = (val: string) => {
    const sanitized = val.replace(/[@#$%^&*]/g, '');
    setProposedBusinessName(sanitized);
  };

  const isRestaurantSelected = useMemo(() => {
    return natureOfOperations.toLowerCase().includes('restaurant') ||
      natureOfOperations.toLowerCase().includes('food');
  }, [natureOfOperations]);

  // --- PAGE 3B: PREMISES LOCATION, DIMENSIONS & BOUNDARIES (Moved from Page 1 as requested) ---
  const [premisesAddress, setPremisesAddress] = useState('');
  const [wardNumber, setWardNumber] = useState('');
  const [propertyTaxAssessmentNo, setPropertyTaxAssessmentNo] = useState('');
  const [superBuiltupArea, setSuperBuiltupArea] = useState('');
  const [carpetArea, setCarpetArea] = useState('');

  // Boundaries in simple human words
  const [eastBound, setEastBound] = useState('');
  const [westBound, setWestBound] = useState('');
  const [northBound, setNorthBound] = useState('');
  const [southBound, setSouthBound] = useState('');

  // --- PAGE 4: OPERATIONAL CONDITIONS & STATUTORY CLAUSES ---
  const [clauseMultiAgency, setClauseMultiAgency] = useState(true);
  const [clausePhysicalVerification, setClausePhysicalVerification] = useState(true);
  const [clauseSignboard, setClauseSignboard] = useState(true);
  const [clauseBooks, setClauseBooks] = useState(true);
  const [clauseStructural, setClauseStructural] = useState(true);
  const [clauseFssai, setClauseFssai] = useState(true);
  const [clauseFireSafety, setClauseFireSafety] = useState(true);
  const [clauseHealthTrade, setClauseHealthTrade] = useState(true);

  const [sublettingPermission, setSublettingPermission] = useState<'Strictly Prohibited' | 'Allowed'>('Strictly Prohibited');
  const [propertyTaxEscalation, setPropertyTaxEscalation] = useState('Fully Paid by Landlord');
  const [meterLoadConsent, setMeterLoadConsent] = useState(true);
  const [landlordIndemnityAccepted, setLandlordIndemnityAccepted] = useState(true);

  // Custom Clauses
  const [customClauses, setCustomClauses] = useState<CustomOperationalClause[]>([]);
  const addCustomClause = () => {
    setCustomClauses((prev) => [
      ...prev,
      { id: `c-${Date.now()}`, header: '', description: '' }
    ]);
  };
  const updateCustomClause = (id: string, field: 'header' | 'description', val: string) => {
    setCustomClauses((prev) => prev.map((c) => (c.id === id ? { ...c, [field]: val } : c)));
  };
  const removeCustomClause = (id: string) => {
    setCustomClauses((prev) => prev.filter((c) => c.id !== id));
  };

  // --- PAGE 5: WITNESS ATTESTATION & DELIVERY (NO NOTARY PUBLIC) ---
  const [witness1Name, setWitness1Name] = useState('');
  const [witness1Profession, setWitness1Profession] = useState('');
  const [witness1Address, setWitness1Address] = useState('');
  const [witness1Id, setWitness1Id] = useState('');
  const [witness1Mobile, setWitness1Mobile] = useState('');

  const [witness2Name, setWitness2Name] = useState('');
  const [witness2Profession, setWitness2Profession] = useState('');
  const [witness2Address, setWitness2Address] = useState('');
  const [witness2Id, setWitness2Id] = useState('');
  const [witness2Mobile, setWitness2Mobile] = useState('');

  // Delivery Preference
  const [deliveryPreference, setDeliveryPreference] = useState<'digital' | 'physical' | 'hybrid'>('digital');
  const [shippingAddress, setShippingAddress] = useState('');
  const [shippingPincode, setShippingPincode] = useState('');
  const [shippingPhone, setShippingPhone] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedOrder, setSubmittedOrder] = useState<OrderItem | null>(null);

  // Pricing Calculation (No Notary Surcharge!)
  const pricing = useMemo(() => {
    const stamp = activeStampValue;
    const eSign = 70; // Landlord + Grantee
    const govtPurchasing = 40;
    const platformFee = 49;
    const courierFee = deliveryPreference === 'digital' ? 0 : 50;

    const rawTotal = stamp + eSign + govtPurchasing + platformFee + courierFee;
    const remainder = rawTotal % 10;
    const totalPayable = remainder === 9 ? rawTotal : rawTotal + ((9 - remainder + 10) % 10);

    return {
      stamp,
      eSign,
      govtPurchasing,
      platformFee,
      courierFee,
      totalPayable
    };
  }, [activeStampValue, deliveryPreference]);

  // Step Validation & Forward Navigation
  const validateAndProceed = (targetNext: StepId) => {
    if (currentPage === '1') {
      if (!isPurposeValid) {
        alert('Please select at least one Purpose of NOC.');
        return;
      }
    }

    if (currentPage === '2') {
      const isCorp = landlordOwnershipType !== 'Sole Individual' && landlordOwnershipType !== 'Joint Owners';
      if (!isCorp) {
        if (!landlordName.trim() || !landlordPan.trim() || !landlordMobile.trim()) {
          alert('Please fill mandatory Landlord Name, PAN Card, and Mobile Number.');
          return;
        }
      } else {
        if (!landlordName.trim() || !corpRegAddress.trim() || !corpRepName.trim()) {
          alert('Please fill Entity Name, Registered Address, and Authorized Representative.');
          return;
        }
      }
      if (!clearTitleDeclared) {
        alert('Please accept the Title & Clear Encumbrance Declaration.');
        return;
      }
    }

    if (currentPage === '3') {
      if (!proposedBusinessName.trim() || !granteePan.trim() || !granteeSignatoryName.trim()) {
        alert('Please provide Proposed Business Name, PAN Card, and Signatory details.');
        return;
      }
      if (natureOfOperations === 'Other' && !customNatureOfOperations.trim()) {
        alert('Please specify the custom Nature of Business Operations.');
        return;
      }
    }

    if (currentPage === '3B') {
      if (!premisesAddress.trim()) {
        alert('Please provide complete Premises Address.');
        return;
      }
    }

    setCurrentPage(targetNext);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    if (currentPage === '1') onBack();
    else if (currentPage === '2') setCurrentPage('1');
    else if (currentPage === '3') setCurrentPage('2');
    else if (currentPage === '3B') setCurrentPage('3');
    else if (currentPage === '4') setCurrentPage('3B');
    else if (currentPage === '5') setCurrentPage('4');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (deliveryPreference !== 'digital') {
      if (!shippingAddress.trim() || !shippingPincode.trim() || !shippingPhone.trim()) {
        alert('Please provide complete physical shipping address, pincode, and contact number.');
        return;
      }
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const todayISO = new Date().toISOString().split('T')[0];
      const newOrderId = `CTC-${Math.floor(100000 + Math.random() * 900000)}`;

      const newOrder: OrderItem = {
        orderId: newOrderId,
        docTitle: 'Commercial No-Objection Certificate (NOC)',
        createdAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        date: todayISO,
        deliveryHours: 24,
        deliveryFee: pricing.courierFee,
        baseFee: pricing.totalPayable - pricing.courierFee,
        totalFee: pricing.totalPayable,
        paymentStatus: 'Unpaid',
        status: 'Processing',
        pendingHours: 1,
        applicantName: landlordName || 'Applicant',
        applicantPhone: landlordMobile || '9876543210',
        state: selectedState,
        stampDenomination: `₹${pricing.stamp}`,
        isPhysicalCourier: deliveryPreference !== 'digital',
        shippingAddress: deliveryPreference !== 'digital' ? shippingAddress : undefined,
        pincode: deliveryPreference !== 'digital' ? shippingPincode : undefined,
        shippingPhone: deliveryPreference !== 'digital' ? shippingPhone : undefined,
        shippingStatus: deliveryPreference !== 'digital' ? 'Pending Dispatch' : 'Not Ordered'
      };

      try {
        confetti({
          particleCount: 90,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {}

      setSubmittedOrder(newOrder);
      onOrderCreated(newOrder);
      setIsSubmitting(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 700);
  };

  if (submittedOrder) {
    return (
      <div className="w-full max-w-3xl mx-auto px-4 py-8 animate-fadeIn pb-24">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-lg text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-inner">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-black">
              Demo Docket Saved
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              This record was saved only in this browser; it has not been submitted to a provider.
            </p>
            <div className="mt-3 inline-block bg-slate-50 border border-slate-300 rounded-xl px-4 py-2">
              <span className="text-xs text-slate-500 mr-2">Docket ID:</span>
              <span className="font-mono font-black text-blue-600 text-base">
                {submittedOrder.orderId}
              </span>
            </div>
          </div>

          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 text-left text-xs sm:text-sm space-y-3">
            <div className="flex justify-between border-b border-slate-200/80 pb-2">
              <span className="text-slate-500">Document Type:</span>
              <span className="font-bold text-black">{submittedOrder.docTitle}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200/80 pb-2">
              <span className="text-slate-500">Jurisdiction &amp; State:</span>
              <span className="font-bold text-slate-900">{submittedOrder.state}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200/80 pb-2">
              <span className="text-slate-500">Stamp Paper Denomination:</span>
              <span className="font-bold text-blue-700">{submittedOrder.stampDenomination}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200/80 pb-2">
              <span className="text-slate-500">Business Grantee:</span>
              <span className="font-bold text-slate-900">{proposedBusinessName}</span>
            </div>
            <div className="flex justify-between pt-1 font-bold text-base text-black">
              <span>Displayed estimate (not a charge):</span>
              <span className="text-blue-600">₹{submittedOrder.totalFee}</span>
            </div>
          </div>

          <p className="text-xs text-slate-600">No document, e-stamp, signature, or payment is processed by this prototype.</p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={onNavigateToDashboard}
              className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md cursor-pointer transition-all"
            >
              Go to Dashboard &amp; Track Status
            </button>
            <button
              type="button"
              onClick={onBack}
              className="w-full sm:w-auto px-6 py-3.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold text-sm rounded-xl cursor-pointer transition-all"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Progress percentage
  const progressPercent = {
    '1': 16,
    '2': 33,
    '3': 50,
    '3B': 67,
    '4': 83,
    '5': 100
  }[currentPage];

  return (
    <div data-document-wizard className="w-full max-w-4xl mx-auto px-4 py-5 animate-fadeIn pb-28">
      {/* Top Header - Exact user specification: Dark Title + Blue Architecture subtitle */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-blue-600 transition-colors py-1.5 px-3 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Cancel &amp; Return</span>
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-200 h-1.5 rounded-full mt-3 overflow-hidden">
          <div
            className="bg-blue-600 h-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Form Title & Blue Architecture Subtitle */}
        <div className="mt-4">
          <h1 className="text-2xl sm:text-3xl font-black text-black">
            {initialDoc.title}
          </h1>
          <span className="text-sm font-bold text-blue-600 block mt-0.5">
            Architecture
          </span>
        </div>
      </div>

      {/* MULTILINGUAL AUDIO EXPLAINER BAR (TOP OF EVERY PAGE) */}
      <div className="mb-4 bg-linear-to-r from-blue-50 via-indigo-50 to-blue-50 border border-blue-200 rounded-2xl p-3 sm:p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${isAudioPlaying ? 'bg-blue-600 text-white animate-pulse' : 'bg-white text-blue-600 border border-blue-200'}`}>
            <Volume2 className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-900 block flex items-center gap-1.5">
              <span>Voice Guide &amp; Audio Explainer</span>
              {isAudioPlaying && (
                <span className="inline-flex items-center gap-1 text-[10px] text-blue-600 bg-white px-2 py-0.5 rounded-full border border-blue-200 font-semibold animate-pulse">
                  Playing...
                </span>
              )}
            </span>
            <span className="text-[11px] text-slate-500">
              Listen to complete instructions for Page {currentPage}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Language Selector */}
          <select
            value={selectedLang}
            onChange={(e) => {
              speechController.stop();
              const nextLang = e.target.value as SupportedLanguage;
              setSelectedLang(nextLang);
              setStoredAudioLanguage(nextLang);
            }}
            className="bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600 cursor-pointer shadow-2xs"
          >
            {SUPPORTED_LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.nativeName} ({lang.name})
              </option>
            ))}
          </select>

          {/* Play / Stop Button */}
          <button
            type="button"
            onClick={handlePlayPageSpeech}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold text-xs shadow-xs transition-all cursor-pointer ${
              isAudioPlaying
                ? 'bg-rose-600 hover:bg-rose-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isAudioPlaying ? (
              <>
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Stop</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Listen Page</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-5 sm:p-7">
        {/* ================= PAGE 1: OBJECTIVE & STAMP SELECTION ================= */}
        {currentPage === '1' && (
          <div className="space-y-6 animate-fadeIn">
            {/* MANDATORY & OPTIONAL BANNER AT TOP OF FORM (PAGE 1 ONLY) */}
            <div className="py-2 px-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs text-slate-700 font-medium">
              <div>
                Mandatory = <span className="text-red-500 font-bold">*</span>
              </div>
              <div>
                Optional = <span className="text-slate-400 font-medium">(Optional)</span>
              </div>
            </div>

            {/* State Selection */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  State / Union Territory (36 States/UTs) <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => handlePlayFieldSpeech('state')}
                  className="text-slate-400 hover:text-blue-600 transition-colors p-1"
                  title="Listen to field guide"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-black focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                {STATE_CATEGORIES.map((s) => (
                  <option key={s.name} value={s.name}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Purpose of NOC [Multi-Select Checkbox] */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  Purpose of NOC (Select all that apply) <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => handlePlayFieldSpeech('nocPurposes')}
                  className="text-slate-400 hover:text-blue-600 transition-colors p-1"
                  title="Listen to field guide"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  { key: 'gst_reg', label: 'GST Registration (Tax Allotment)' },
                  { key: 'biz_license', label: 'Business License / Gumasta / Shops & Est' },
                  { key: 'subletting', label: 'Sub-Letting / Sub-Leasing Permissions' },
                  { key: 'bank_account', label: 'Bank Account Opening / Corporate Address Proof' },
                  { key: 'statutory_reg', label: 'Central/State Statutory (FSSAI, MSME, Pollution, Fire)' }
                ].map((item) => (
                  <label
                    key={item.key}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                      purposes[item.key]
                        ? 'border-blue-600 bg-blue-50/60 ring-1 ring-blue-600'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={purposes[item.key]}
                      onChange={() => togglePurpose(item.key)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-xs font-semibold text-slate-800">{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Property Classification */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  Property Classification <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => handlePlayFieldSpeech('propertyType')}
                  className="text-slate-400 hover:text-blue-600 transition-colors p-1"
                  title="Listen to field guide"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <select
                value={propertyClassification}
                onChange={(e) => setPropertyClassification(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="Commercial Building">Commercial Building</option>
                <option value="IT Park/SEZ">IT Park / SEZ</option>
                <option value="Industrial Land/Shed">Industrial Land / Shed / Warehouse</option>
                <option value="Mixed-Use Urban Property">Mixed-Use Urban Property</option>
                <option value="Residential Property Used for Business">Residential Property Used for Business</option>
              </select>
            </div>

            {/* Stamp Duty Fee Paid By */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  Who is paying the Stamp Duty Fee? <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => handlePlayFieldSpeech('stampBorneBy')}
                  className="text-slate-400 hover:text-blue-600 transition-colors p-1"
                  title="Listen to field guide"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[
                  { key: 'Landlord', label: 'Landlord (मकान मालिक)' },
                  { key: 'Business Owner', label: 'Business Owner (बिजनेस ओनर)' },
                  { key: 'Shared Equally', label: 'Shared (50-50%)' }
                ].map((payer) => (
                  <label
                    key={payer.key}
                    className={`p-3 rounded-xl border cursor-pointer text-center transition-all ${
                      stampFeePaidBy === payer.key
                        ? 'border-blue-600 bg-blue-50/60 ring-1 ring-blue-600'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="stampFeePaidBy"
                      checked={stampFeePaidBy === payer.key}
                      onChange={() => setStampFeePaidBy(payer.key as any)}
                      className="sr-only"
                    />
                    <span className="text-xs font-bold text-black block">{payer.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Stamp Value Selection Engine */}
            <div className="space-y-3 pt-2 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  Stamp Paper Value Selection
                </span>
                <button
                  type="button"
                  onClick={() => handlePlayFieldSpeech('stampValue')}
                  className="text-slate-400 hover:text-blue-600 transition-colors p-1"
                  title="Listen to field guide"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    stampMode === 'auto' ? 'border-blue-600 bg-blue-50/60 ring-1 ring-blue-600' : 'border-slate-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="stampMode"
                    checked={stampMode === 'auto'}
                    onChange={() => setStampMode('auto')}
                    className="sr-only"
                  />
                  <span className="text-xs font-bold text-black block">Auto-Select Recommended Stamp Paper Value</span>
                  <span className="text-[11px] text-blue-700 font-semibold mt-0.5 block">
                    Locked at ₹{recommendedStamp} for {selectedState}
                  </span>
                </label>

                <label
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    stampMode === 'manual' ? 'border-blue-600 bg-blue-50/60 ring-1 ring-blue-600' : 'border-slate-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="stampMode"
                    checked={stampMode === 'manual'}
                    onChange={() => setStampMode('manual')}
                    className="sr-only"
                  />
                  <span className="text-xs font-bold text-black block">Manual Stamp Value Selection</span>
                  <span className="text-[11px] text-slate-500 mt-0.5 block">
                    Choose from standard denominations
                  </span>
                </label>
              </div>

              {stampMode === 'manual' && (
                <div className="space-y-2 animate-fadeIn">
                  <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-thin flex-nowrap sm:grid sm:grid-cols-7 sm:overflow-visible">
                    {[10, 20, 50, 100, 500, 1000].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => {
                          setManualStampValue(val);
                          setCustomManualStamp('');
                        }}
                        className={`shrink-0 min-w-[70px] sm:min-w-0 py-1.5 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                          manualStampValue === val
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-slate-700 border-slate-300'
                        }`}
                      >
                        ₹{val}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setManualStampValue(-1)}
                      className={`shrink-0 min-w-[70px] sm:min-w-0 py-1.5 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                        manualStampValue === -1
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-slate-700 border-slate-300'
                      }`}
                    >
                      Custom
                    </button>
                  </div>

                  {manualStampValue === -1 && (
                    <input
                      type="number"
                      value={customManualStamp}
                      onChange={(e) => setCustomManualStamp(e.target.value)}
                      placeholder={showExample ? "Custom Stamp Value (e.g. 200)" : ""}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-mono"
                    />
                  )}

                  {isManualStampBelowThreshold && (
                    <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-xs flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <span>
                        <strong>Warning:</strong> GST and municipal authorities may reject an NOC drafted on stamp paper below the state minimum.
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= PAGE 2: THE GRANTOR ================= */}
        {currentPage === '2' && (
          <div className="space-y-5 animate-fadeIn">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Landlord Ownership Type <span className="text-red-500">*</span>
              </label>
              <select
                value={landlordOwnershipType}
                onChange={(e) => setLandlordOwnershipType(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-black focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="Sole Individual">Sole Individual</option>
                <option value="Joint Owners">Joint Owners</option>
                <option value="Partnership Firm">Partnership Firm</option>
                <option value="LLP">Limited Liability Partnership (LLP)</option>
                <option value="Private Ltd / Public Ltd Company">Private Ltd / Public Ltd Company</option>
                <option value="HUF">Hindu Undivided Family (HUF)</option>
                <option value="Trust / Society">Trust / Society</option>
              </select>
            </div>

            {landlordOwnershipType !== 'Sole Individual' && landlordOwnershipType !== 'Joint Owners' ? (
              /* Corporate Landlord */
              <div className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-xs font-bold text-blue-700 uppercase tracking-wider block">
                  Corporate / Entity Ownership Details
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Entity Legal Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={landlordName}
                      onChange={(e) => setLandlordName(e.target.value)}
                      placeholder={showExample ? "e.g. Prestige Commercial Estates LLP" : ""}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      CIN / LLPIN <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={corpCin}
                      onChange={(e) => setCorpCin(e.target.value.toUpperCase())}
                      placeholder={showExample ? "e.g. U70100MH2019PTC112233" : ""}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono uppercase text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Registered Office Address <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={corpRegAddress}
                    onChange={(e) => setCorpRegAddress(e.target.value)}
                    placeholder={showExample ? "Full corporate registered office address" : ""}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Authorised Representative <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={corpRepName}
                      onChange={(e) => setCorpRepName(e.target.value)}
                      placeholder={showExample ? "e.g. Sunil Kothari" : ""}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Designation <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={corpRepDesignation}
                      onChange={(e) => setCorpRepDesignation(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    >
                      <option value="Managing Director">Managing Director</option>
                      <option value="Director">Director</option>
                      <option value="Managing Partner">Managing Partner</option>
                      <option value="Authorized Trustee">Authorized Trustee</option>
                      <option value="Power of Attorney Holder">Power of Attorney Holder</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Resolution / Auth Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={corpResolutionDate}
                      onChange={(e) => setCorpResolutionDate(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>
              </div>
            ) : (
              /* Individual / Joint Landlord */
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700">
                        Landlord Full Legal Name <span className="text-red-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => handlePlayFieldSpeech('landlordName')}
                        className="text-slate-400 hover:text-blue-600 p-1"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <input
                      type="text"
                      required
                      value={landlordName}
                      onChange={(e) => setLandlordName(e.target.value)}
                      placeholder={showExample ? "e.g. Ramesh Kumar Sark" : ""}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700">
                        Father's / Husband's Name <span className="text-red-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => handlePlayFieldSpeech('landlordFatherName')}
                        className="text-slate-400 hover:text-blue-600 p-1"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <input
                      type="text"
                      required
                      value={landlordFatherName}
                      onChange={(e) => setLandlordFatherName(e.target.value)}
                      placeholder={showExample ? "e.g. Late Shri Radhey Shyam" : ""}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* KYC Identifiers: PAN, Aadhaar, Mobile, Email (Optional) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Landlord / Corporate PAN Card <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => handlePlayFieldSpeech('landlordPan')}
                    className="text-slate-400 hover:text-blue-600 p-1"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <input
                  type="text"
                  required
                  maxLength={10}
                  value={landlordPan}
                  onChange={(e) => setLandlordPan(e.target.value.toUpperCase())}
                  placeholder={showExample ? "AABCB1234D" : ""}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-mono uppercase text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Aadhaar (Masked) / Passport <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => handlePlayFieldSpeech('landlordAadhaar')}
                    className="text-slate-400 hover:text-blue-600 p-1"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex items-center gap-1.5 font-mono text-xs">
                  <span className="px-2 py-2 bg-slate-100 border border-slate-300 rounded-lg text-slate-500">XXXX</span>
                  <span>-</span>
                  <span className="px-2 py-2 bg-slate-100 border border-slate-300 rounded-lg text-slate-500">XXXX</span>
                  <span>-</span>
                  <input
                    type="text"
                    maxLength={4}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={landlordAadhaarLast4}
                    onChange={(e) => setLandlordAadhaarLast4(e.target.value.replace(/\D/g, ''))}
                    placeholder={showExample ? "9012" : ""}
                    className="w-20 bg-white border border-slate-300 rounded-lg px-2.5 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Official Contact Mobile Number <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => handlePlayFieldSpeech('landlordMobile')}
                    className="text-slate-400 hover:text-blue-600 p-1"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={landlordMobile}
                  onChange={(e) => setLandlordMobile(e.target.value.replace(/\D/g, ''))}
                  placeholder={showExample ? "9876543210" : ""}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Contact Email ID <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => handlePlayFieldSpeech('landlordEmail')}
                    className="text-slate-400 hover:text-blue-600 p-1"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <input
                  type="email"
                  value={landlordEmail}
                  onChange={(e) => setLandlordEmail(e.target.value)}
                  placeholder={showExample ? "landlord@example.com" : ""}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            {/* Joint Owners extension */}
            {landlordOwnershipType === 'Joint Owners' && (
              <div className="pt-3 border-t border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">
                    Joint Co-Owners Consent ({coOwners.length})
                  </span>
                  <button
                    type="button"
                    onClick={addCoOwner}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white font-bold text-xs transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Co-Owner</span>
                  </button>
                </div>

                {coOwners.map((co) => (
                  <div key={co.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row gap-2 items-center">
                    <input
                      type="text"
                      value={co.name}
                      onChange={(e) => updateCoOwner(co.id, 'name', e.target.value)}
                      placeholder={showExample ? "Co-Owner Legal Name *" : ""}
                      className="flex-1 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                    />
                    <input
                      type="text"
                      maxLength={10}
                      value={co.pan}
                      onChange={(e) => updateCoOwner(co.id, 'pan', e.target.value.toUpperCase())}
                      placeholder={showExample ? "PAN *" : ""}
                      className="w-32 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono uppercase text-slate-900"
                    />
                    <button
                      type="button"
                      onClick={() => removeCoOwner(co.id)}
                      className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Clear Title Declaration in Simple Language */}
            <div className="p-3.5 bg-blue-50/60 border border-blue-200 rounded-xl">
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  required
                  checked={clearTitleDeclared}
                  onChange={(e) => setClearTitleDeclared(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-xs text-slate-800 leading-relaxed">
                  <strong>Title Declaration:</strong> I solemnly declare that this property has a clear legal title and I have full authority to grant this Commercial NOC.
                </span>
              </label>
            </div>
          </div>
        )}

        {/* ================= PAGE 3: THE GRANTEE (BUSINESS & ENTITY) ================= */}
        {currentPage === '3' && (
          <div className="space-y-4 animate-fadeIn">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Business Constitution <span className="text-red-500">*</span>
              </label>
              <select
                value={businessConstitution}
                onChange={(e) => handleConstitutionChange(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="Sole Proprietorship">Sole Proprietorship</option>
                <option value="Partnership Firm">Partnership Firm</option>
                <option value="Limited Liability Partnership (LLP)">Limited Liability Partnership (LLP)</option>
                <option value="Private Limited Company">Private Limited Company</option>
                <option value="One Person Company (OPC)">One Person Company (OPC)</option>
                <option value="Public Limited Company">Public Limited Company</option>
                <option value="Trust / NGO">Trust / NGO</option>
              </select>
            </div>

            {/* Proposed Business Name & PAN */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Proposed Business Name / Trade Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={proposedBusinessName}
                  onChange={(e) => handleBusinessNameChange(e.target.value)}
                  placeholder={showExample ? "e.g. Apex Logistical Solutions" : ""}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {businessConstitution === 'Sole Proprietorship'
                    ? "Proprietor's Personal PAN Card"
                    : 'Entity / Company PAN Card'}{' '}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={10}
                  value={granteePan}
                  onChange={(e) => setGranteePan(e.target.value.toUpperCase())}
                  placeholder={showExample ? "ABCDE1234F" : ""}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-mono uppercase text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            {/* CIN if Company/LLP */}
            {businessConstitution !== 'Sole Proprietorship' && businessConstitution !== 'Partnership Firm' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  CIN / LLPIN <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={granteeCin}
                  onChange={(e) => setGranteeCin(e.target.value.toUpperCase())}
                  placeholder={showExample ? "e.g. U74999DL2022PTC123456" : ""}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono uppercase text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            )}

            {/* Nature of Business Operations + 'Other' Custom Box Option */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nature of Business Operations <span className="text-red-500">*</span>
              </label>
              <select
                value={natureOfOperations}
                onChange={(e) => setNatureOfOperations(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="IT / Software / Back Office / Consultancy">IT / Software / Back Office / Consultancy</option>
                <option value="Retail / Showroom / Gym / Footfall Business">Retail / Showroom / Gym / Footfall Business</option>
                <option value="Logistics / Warehousing / Heavy Storage / Manufacturing">Logistics / Warehousing / Heavy Storage / Manufacturing</option>
                <option value="Restaurant / Cloud Kitchen / Food & Beverage">Restaurant / Cloud Kitchen / Food &amp; Beverage</option>
                <option value="Other">Other</option>
              </select>

              {/* Dynamic Custom Nature of Business Input Box when 'Other' is selected */}
              {natureOfOperations === 'Other' && (
                <div className="mt-2.5 animate-fadeIn">
                  <label className="block text-[11px] font-bold text-blue-900 mb-1">
                    Specify Nature of Business Operations <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={customNatureOfOperations}
                    onChange={(e) => setCustomNatureOfOperations(e.target.value)}
                    placeholder={showExample ? "Type your specific business category or activities" : ""}
                    className="w-full bg-white border border-blue-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              )}
            </div>

            {/* Authorised Signatory Details (Pre-selects Proprietor / Partner / Director) */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                Applicant / Authorized Signatory Details
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                    Full Legal Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={granteeSignatoryName}
                    onChange={(e) => setGranteeSignatoryName(e.target.value)}
                    placeholder={showExample ? "e.g. Tarun Bajaj" : ""}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                    Father's Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={granteeSignatoryFatherName}
                    onChange={(e) => setGranteeSignatoryFatherName(e.target.value)}
                    placeholder={showExample ? "e.g. S.K. Bajaj" : ""}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                    Designation <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={granteeDesignation}
                    onChange={(e) => setGranteeDesignation(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                  >
                    <option value="Proprietor">Proprietor</option>
                    <option value="Partner">Partner</option>
                    <option value="Director">Director</option>
                    <option value="Authorized Signatory via BR">Authorized Signatory via BR</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= PAGE 3B: PREMISES LOCATION & BOUNDARIES (MOVED FROM PAGE 1) ================= */}
        {currentPage === '3B' && (
          <div className="space-y-5 animate-fadeIn">
            <div>
              <span className="text-xs font-bold text-blue-700 uppercase tracking-wider block mb-1">
                Premises Location &amp; Dimension Details
              </span>
              <p className="text-xs text-slate-500">
                Provide the exact physical location of the commercial property and area measurements.
              </p>
            </div>

            {/* Complete Premises Address with road/street/landmark */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Premises Complete Address <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                value={premisesAddress}
                onChange={(e) => setPremisesAddress(e.target.value)}
                placeholder={showExample ? "Shop/Office/Plot No, Floor, Building Name, Road/Street, Landmark, City, State, PIN" : ""}
                className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
              />
            </div>

            {/* Optional Ward Number & Property Tax Assessment */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Municipal Ward Number / Zone Name <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={wardNumber}
                  onChange={(e) => setWardNumber(e.target.value)}
                  placeholder={showExample ? "e.g. Ward 42, West Zone" : ""}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Property Tax Holding / Khasra / Survey Number <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={propertyTaxAssessmentNo}
                  onChange={(e) => setPropertyTaxAssessmentNo(e.target.value)}
                  placeholder={showExample ? "e.g. TAX/2024/84910 or Survey 124/2" : ""}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            {/* Optional Super Built-up Area & Carpet Area */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Super Built-up Area (Sq. Ft.) <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="number"
                  value={superBuiltupArea}
                  onChange={(e) => setSuperBuiltupArea(e.target.value)}
                  placeholder={showExample ? "e.g. 1200" : ""}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Carpet Area (Sq. Ft.) <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="number"
                  value={carpetArea}
                  onChange={(e) => setCarpetArea(e.target.value)}
                  placeholder={showExample ? "e.g. 950" : ""}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            {/* Property Boundaries (सरल भाषा में - पूर्व, पश्चिम, उत्तर, दक्षिण) (All Optional) */}
            <div className="space-y-3 pt-3 border-t border-slate-200">
              <div>
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  Property Boundaries (चारों तरफ क्या है) <span className="text-slate-400 font-normal lowercase">(optional)</span>
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  आपकी प्रॉपर्टी के पूर्व, पश्चिम, उत्तर और दक्षिण में क्या चीज़ स्थित है (जैसे सड़क, खाली प्लॉट, दुकान या किसी का मकान)
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                    East (पूर्व दिशा में) <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={eastBound}
                    onChange={(e) => setEastBound(e.target.value)}
                    placeholder={showExample ? "सड़क, प्लॉट, घर या पड़ोसी की दुकान" : ""}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                    West (पश्चिम दिशा में) <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={westBound}
                    onChange={(e) => setWestBound(e.target.value)}
                    placeholder={showExample ? "सड़क, प्लॉट, घर या पड़ोसी की दुकान" : ""}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                    North (उत्तर दिशा में) <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={northBound}
                    onChange={(e) => setNorthBound(e.target.value)}
                    placeholder={showExample ? "सड़क, प्लॉट, घर या पड़ोसी की दुकान" : ""}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                    South (दक्षिण दिशा में) <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={southBound}
                    onChange={(e) => setSouthBound(e.target.value)}
                    placeholder={showExample ? "सड़क, प्लॉट, घर या पड़ोसी की दुकान" : ""}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= PAGE 4: OPERATIONAL CLAUSES IN SIMPLE LANGUAGE ================= */}
        {currentPage === '4' && (
          <div className="space-y-5 animate-fadeIn">
            {/* Simple Wording Statutory Permissions */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-blue-700 uppercase tracking-wider block">
                Business Clearances &amp; Statutory Permissions (Pre-checked)
              </span>

              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={clauseMultiAgency}
                  onChange={(e) => setClauseMultiAgency(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-xs text-slate-700">
                  <strong>सरकारी रजिस्ट्रेशन की अनुमति:</strong> मकान मालिक को इस पते पर किरायेदार द्वारा जीएसटी, एमएसएमई, दुकान स्थापना या व्यापार लाइसेंस लेने पर कोई आपत्ति नहीं है।
                </span>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={clausePhysicalVerification}
                  onChange={(e) => setClausePhysicalVerification(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-xs text-slate-700">
                  <strong>टैक्स अधिकारियों का निरीक्षण:</strong> जीएसटी व टैक्स अधिकारियों द्वारा इस पते पर आकर वेरिफिकेशन व स्पॉट जांच करने की पूर्ण अनुमति है।
                </span>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={clauseSignboard}
                  onChange={(e) => setClauseSignboard(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-xs text-slate-700">
                  <strong>साइनबोर्ड लगाने की अनुमति:</strong> किरायेदार दुकान या ऑफिस के बाहर अपनी फर्म का नाम व जीएसटी नंबर का बोर्ड लगा सकता है।
                </span>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={clauseBooks}
                  onChange={(e) => setClauseBooks(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-xs text-slate-700">
                  <strong>बिल व खाता-बही रखने की अनुमति:</strong> फर्म के टैक्स इनवॉइस व खाते इस पते पर रखे जा सकते हैं।
                </span>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={clauseStructural}
                  onChange={(e) => setClauseStructural(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-xs text-slate-700">
                  <strong>स्ट्रक्चरल सीमाएं:</strong> अस्थायी केबिन या फॉल्स सीलिंग का काम किया जा सकता है, मुख्य बीम या दीवार को नुकसान नहीं पहुँचाया जाएगा।
                </span>
              </label>
            </div>

            {/* Commercial Utilities & Indemnity */}
            <div className="pt-3 border-t border-slate-200 space-y-3">
              <span className="text-xs font-bold text-blue-700 uppercase tracking-wider block">
                Commercial Utilities &amp; Asset Protection
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Sub-Letting &amp; Co-Working Permission <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={sublettingPermission}
                    onChange={(e) => setSublettingPermission(e.target.value as any)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900"
                  >
                    <option value="Strictly Prohibited">Strictly Prohibited</option>
                    <option value="Allowed">Allowed (Authorizes co-working / desk licensing)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Property Tax Escalation Responsibility <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={propertyTaxEscalation}
                    onChange={(e) => setPropertyTaxEscalation(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900"
                  >
                    <option value="Fully Paid by Landlord">Fully Paid by Landlord</option>
                    <option value="Reimbursed by Tenant">Reimbursed by Tenant</option>
                    <option value="Divided on Pro-rata Basis">Divided on Pro-rata Basis</option>
                  </select>
                </div>
              </div>

              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl">
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    required
                    checked={landlordIndemnityAccepted}
                    onChange={(e) => setLandlordIndemnityAccepted(e.target.checked)}
                    className="mt-0.5 w-4 h-4 text-rose-600 rounded"
                  />
                  <span className="text-xs text-rose-900 leading-relaxed">
                    <strong>Landlord Indemnity:</strong> किरायेदार अपने व्यापार, टैक्स व देनदारियों के लिए स्वयं पूर्ण रूप से जिम्मेदार होगा। मकान मालिक की संपत्ति पर किसी भी प्रकार की टैक्स देनदारी या जब्ती लागू नहीं होगी।
                  </span>
                </label>
              </div>
            </div>

            {/* Custom Operational Clauses */}
            <div className="pt-3 border-t border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    Custom Operational Conditions
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Add custom rules if any
                  </span>
                </div>

                <button
                  type="button"
                  onClick={addCustomClause}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white font-bold text-xs transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Condition</span>
                </button>
              </div>

              {customClauses.map((cl, idx) => (
                <div key={cl.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-blue-700">Condition #{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeCustomClause(cl.id)}
                      className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={cl.header}
                    onChange={(e) => updateCustomClause(cl.id, 'header', e.target.value)}
                    placeholder={showExample ? "Condition Header" : ""}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-900"
                  />
                  <textarea
                    rows={2}
                    value={cl.description}
                    onChange={(e) => updateCustomClause(cl.id, 'description', e.target.value)}
                    placeholder={showExample ? "Describe condition details..." : ""}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-900 resize-none"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= PAGE 5: WITNESSES & DELIVERY (NO NOTARY) ================= */}
        {currentPage === '5' && (
          <form onSubmit={handleSubmit} className="space-y-6 animate-fadeIn">
            {/* Legal Witnesses (Optional for digital) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                    Witness Details <span className="text-slate-400 font-normal lowercase">(optional for digital)</span>
                  </span>
                  <span className="text-[11px] text-slate-500">
                    You can enter details for independent witnesses if desired.
                  </span>
                </div>
              </div>

              {/* Witness 1 */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                <span className="text-xs font-bold text-slate-800">Witness 1 Details</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={witness1Name}
                    onChange={(e) => setWitness1Name(e.target.value)}
                    placeholder={showExample ? "Full Legal Name" : ""}
                    className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                  />
                  <input
                    type="text"
                    value={witness1Profession}
                    onChange={(e) => setWitness1Profession(e.target.value)}
                    placeholder={showExample ? "Profession / Job Title" : ""}
                    className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                  />
                </div>
                <input
                  type="text"
                  value={witness1Address}
                  onChange={(e) => setWitness1Address(e.target.value)}
                  placeholder={showExample ? "Complete Residential Address" : ""}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="tel"
                    maxLength={10}
                    value={witness1Mobile}
                    onChange={(e) => setWitness1Mobile(e.target.value.replace(/\D/g, ''))}
                    placeholder={showExample ? "Mobile Number" : ""}
                    className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                  />
                  <input
                    type="text"
                    value={witness1Id}
                    onChange={(e) => setWitness1Id(e.target.value)}
                    placeholder={showExample ? "PAN / Aadhaar / Voter ID" : ""}
                    className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                  />
                </div>
              </div>

              {/* Witness 2 */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                <span className="text-xs font-bold text-slate-800">Witness 2 Details</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={witness2Name}
                    onChange={(e) => setWitness2Name(e.target.value)}
                    placeholder={showExample ? "Full Legal Name" : ""}
                    className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                  />
                  <input
                    type="text"
                    value={witness2Profession}
                    onChange={(e) => setWitness2Profession(e.target.value)}
                    placeholder={showExample ? "Profession / Job Title" : ""}
                    className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                  />
                </div>
                <input
                  type="text"
                  value={witness2Address}
                  onChange={(e) => setWitness2Address(e.target.value)}
                  placeholder={showExample ? "Complete Residential Address" : ""}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="tel"
                    maxLength={10}
                    value={witness2Mobile}
                    onChange={(e) => setWitness2Mobile(e.target.value.replace(/\D/g, ''))}
                    placeholder={showExample ? "Mobile Number" : ""}
                    className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                  />
                  <input
                    type="text"
                    value={witness2Id}
                    onChange={(e) => setWitness2Id(e.target.value)}
                    placeholder={showExample ? "PAN / Aadhaar / Voter ID" : ""}
                    className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                  />
                </div>
              </div>
            </div>

            {/* Delivery & Execution Mode */}
            <div className="space-y-3 pt-3 border-t border-slate-200">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                Execution &amp; Delivery Mode
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    deliveryPreference === 'digital'
                      ? 'border-blue-600 bg-blue-50/60 ring-1 ring-blue-600'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="deliveryPreference"
                    checked={deliveryPreference === 'digital'}
                    onChange={() => setDeliveryPreference('digital')}
                    className="sr-only"
                  />
                  <span className="text-xs font-bold text-black block">Digital e-Sign PDF</span>
                  <span className="text-[11px] text-slate-500 mt-0.5 block">
                    Instant delivery via email &amp; dashboard (1-2 Hours)
                  </span>
                </label>

                <label
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    deliveryPreference === 'physical'
                      ? 'border-blue-600 bg-blue-50/60 ring-1 ring-blue-600'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="deliveryPreference"
                    checked={deliveryPreference === 'physical'}
                    onChange={() => setDeliveryPreference('physical')}
                    className="sr-only"
                  />
                  <span className="text-xs font-bold text-black block">Physical Stamp Paper</span>
                  <span className="text-[11px] text-slate-500 mt-0.5 block">
                    Speed Post courier delivery (+₹50)
                  </span>
                </label>

                <label
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    deliveryPreference === 'hybrid'
                      ? 'border-blue-600 bg-blue-50/60 ring-1 ring-blue-600'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="deliveryPreference"
                    checked={deliveryPreference === 'hybrid'}
                    onChange={() => setDeliveryPreference('hybrid')}
                    className="sr-only"
                  />
                  <span className="text-xs font-bold text-black block">Hybrid Mode</span>
                  <span className="text-[11px] text-slate-500 mt-0.5 block">
                    Digital copy + Physical original (+₹50)
                  </span>
                </label>
              </div>

              {deliveryPreference !== 'digital' && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 space-y-2.5 animate-fadeIn">
                  <div className="text-xs text-amber-900">
                    <strong>Physical Shipping Details:</strong> Speed Post dispatch in 2 business days.
                  </div>
                  <input
                    type="text"
                    required
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    placeholder={showExample ? "Shipping Postal Address *" : ""}
                    className="w-full bg-white border border-amber-300 rounded-lg px-3 py-1.5 text-xs text-slate-900"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      maxLength={6}
                      required
                      value={shippingPincode}
                      onChange={(e) => setShippingPincode(e.target.value.replace(/\D/g, ''))}
                      placeholder={showExample ? "6-Digit PIN Code *" : ""}
                      className="bg-white border border-amber-300 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-900"
                    />
                    <input
                      type="tel"
                      required
                      value={shippingPhone}
                      onChange={(e) => setShippingPhone(e.target.value)}
                      placeholder={showExample ? "Contact Phone *" : ""}
                      className="bg-white border border-amber-300 rounded-lg px-3 py-1.5 text-xs text-slate-900"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Pricing Breakdown (Clean and without Notary Surcharge!) */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-3 border-b border-slate-200">
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                    Total Commercial NOC Fee
                  </span>
                  <div className="text-xl sm:text-2xl font-black text-black mt-0.5">
                    After delivery you will pay: <span className="text-blue-600">₹{pricing.totalPayable}</span>
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  Zero Upfront Payment
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Official Stamp Duty ({selectedState}):</span>
                  <span className="font-semibold text-slate-900">₹{pricing.stamp}</span>
                </div>
                <div className="flex justify-between">
                  <span>Aadhaar e-Sign Charges:</span>
                  <span className="font-semibold text-slate-900">₹{pricing.eSign}</span>
                </div>
                <div className="flex justify-between">
                  <span>Govt e-Sign Purchasing Charges:</span>
                  <span className="font-semibold text-slate-900">₹{pricing.govtPurchasing}</span>
                </div>
                <div className="flex justify-between">
                  <span>Platform Processing Fee:</span>
                  <span className="font-semibold text-slate-900">₹{pricing.platformFee}</span>
                </div>
                {pricing.courierFee > 0 && (
                  <div className="flex justify-between text-blue-700 font-semibold">
                    <span>Physical Speed Post Courier:</span>
                    <span>+₹{pricing.courierFee}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-sm text-black">
                  <span>Total Amount Due (Post-Delivery):</span>
                  <span className="text-blue-600">₹{pricing.totalPayable}</span>
                </div>
              </div>
            </div>

            {/* Bottom Actions for Page 5 */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs cursor-pointer transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs sm:text-sm shadow-md disabled:opacity-50 cursor-pointer transition-all"
              >
                {isSubmitting ? 'Generating Docket...' : 'Submit & Generate Commercial NOC Docket'}
                <Sparkles className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* Step Navigation Controls for Pages 1 to 4 (Page 1, 2, 3, 3B, 4) */}
        {currentPage !== '5' && (
          <div className="flex items-center justify-between pt-6 border-t border-slate-200 mt-6">
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{currentPage === '1' ? 'Cancel' : 'Previous Page'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (currentPage === '1') validateAndProceed('2');
                else if (currentPage === '2') validateAndProceed('3');
                else if (currentPage === '3') validateAndProceed('3B');
                else if (currentPage === '3B') validateAndProceed('4');
                else if (currentPage === '4') validateAndProceed('5');
              }}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs sm:text-sm shadow-xs cursor-pointer transition-all"
            >
              <span>Proceed to next</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
