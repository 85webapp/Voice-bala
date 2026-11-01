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
  Square,
  MapPin
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { LegalDocument, OrderItem } from '../types';
import { STATE_CATEGORIES, getSafeStampDuty } from '../data/stampDutyMatrix';
import { lookupGstJurisdiction } from '../data/gstJurisdictionData';
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

interface GstNocWizardViewProps {
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

interface CustomGstClause {
  id: string;
  header: string;
  description: string;
}

type StepId = '1' | '2' | '3' | '3B' | '4' | '5';

export const GstNocWizardView: React.FC<GstNocWizardViewProps> = ({
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
    const explanation = await fetchPageExplanation('GST NOC Application', Number(currentPage), `Page ${currentPage}`, fields, selectedLang);
    if (explanation) speechController.speak(explanation, activeLangConfig.speechCode);
  };

  const handlePlayFieldSpeech = async (fieldKey: string) => {
    const label = getVisibleFieldLabel(fieldKey);
    const context = getVisibleFormLabels().join('; ');
    const explanation = await fetchFieldExplanation('GST NOC Application', fieldKey, label, context, selectedLang);
    if (explanation) speechController.speak(explanation, activeLangConfig.speechCode);
  };

  // --- PAGE 1: PREMISES TYPE & GEOGRAPHIC JURISDICTION ---
  const [premisesType, setPremisesType] = useState<string>('Commercial Building / Shop / Office');
  const [selectedState, setSelectedState] = useState<string>('Uttar Pradesh');

  // GST Jurisdiction Guide with PIN code lookup
  const [pincode, setPincode] = useState('201301');
  const [gstCommissionerate, setGstCommissionerate] = useState('');
  const [gstDivision, setGstDivision] = useState('');
  const [gstRange, setGstRange] = useState('');

  useEffect(() => {
    if (pincode.length === 6) {
      const result = lookupGstJurisdiction(pincode, selectedState);
      setGstCommissionerate(result.commissionerate);
      setGstDivision(result.division);
      setGstRange(result.range);
    }
  }, [pincode, selectedState]);

  // Recommended stamp
  const recommendedStamp = useMemo(() => {
    return getSafeStampDuty('Landlord NOC for GST', selectedState);
  }, [selectedState]);

  // Stamp Selection
  const [stampMode, setStampMode] = useState<'auto' | 'manual'>('auto');
  const [manualStampValue, setManualStampValue] = useState<number>(100);
  const [customManualStamp, setCustomManualStamp] = useState<string>('');
  const [stampFeePaidBy, setStampFeePaidBy] = useState<'Landlord' | 'Business Owner' | 'Shared Equally'>('Landlord');

  const activeStampValue = useMemo(() => {
    if (stampMode === 'auto') return recommendedStamp;
    return manualStampValue === -1 ? Number(customManualStamp) || 0 : manualStampValue;
  }, [stampMode, recommendedStamp, manualStampValue, customManualStamp]);

  const isManualStampBelowThreshold = useMemo(() => {
    return stampMode === 'manual' && activeStampValue < recommendedStamp;
  }, [stampMode, activeStampValue, recommendedStamp]);

  // --- PAGE 2: THE GRANTOR - LANDLORD'S TAX IDENTITY ---
  const [ownershipStatus, setOwnershipStatus] = useState<string>('Sole Owner');
  const [landlordName, setLandlordName] = useState('');
  const [landlordFatherName, setLandlordFatherName] = useState('');
  const [landlordPan, setLandlordPan] = useState('');
  const [landlordAadhaarLast4, setLandlordAadhaarLast4] = useState('');
  const [landlordMobile, setLandlordMobile] = useState('');
  const [landlordEmail, setLandlordEmail] = useState('');

  // Dynamic Ownership Extension
  const [coOwners, setCoOwners] = useState<CoOwner[]>([]);
  const [corpCompanyName, setCorpCompanyName] = useState('');
  const [corpCin, setCorpCin] = useState('');
  const [boardResolutionUploaded, setBoardResolutionUploaded] = useState(false);

  const addCoOwner = () => {
    setCoOwners((prev) => [
      ...prev,
      {
        id: `co-${Date.now()}`,
        name: '',
        pan: '',
        aadhaarLast4: ''
      }
    ]);
  };

  const updateCoOwner = (id: string, field: keyof CoOwner, val: string) => {
    setCoOwners((prev) => prev.map((c) => (c.id === id ? { ...c, [field]: val } : c)));
  };

  const removeCoOwner = (id: string) => {
    setCoOwners((prev) => prev.filter((c) => c.id !== id));
  };

  // --- PAGE 3: THE GRANTEE - PROPOSED GST ENTITY ---
  const [proposedTradeName, setProposedTradeName] = useState('');
  const [legalBusinessName, setLegalBusinessName] = useState('');
  const [constitutionOfBusiness, setConstitutionOfBusiness] = useState<string>('Proprietorship');
  const [granteePan, setGranteePan] = useState('');
  const [applicantName, setApplicantName] = useState('');
  const [signingAuthorityUploaded, setSigningAuthorityUploaded] = useState(false);

  const handleTradeNameChange = (val: string) => {
    const cleaned = val.replace(/[@#$%^&]/g, '');
    setProposedTradeName(cleaned);
  };

  // --- PAGE 3B: PREMISES & UTILITY DOCUMENT ---
  const [premisesAddress, setPremisesAddress] = useState('');
  const [wardNumber, setWardNumber] = useState('');
  const [propertyTaxAssessmentNo, setPropertyTaxAssessmentNo] = useState('');
  const [ownershipDocType, setOwnershipDocType] = useState<string>('Electricity Bill (Not older than 2 months)');
  const [utilityDocUploaded, setUtilityDocUploaded] = useState(false);
  const [docOwnerNameString, setDocOwnerNameString] = useState('');

  // --- PAGE 4: GST COMPLIANCE & OFFICER INSPECTION CLAUSES ---
  const [clauseRule9Physical, setClauseRule9Physical] = useState(true);
  const [clauseRule18Banner, setClauseRule18Banner] = useState(true);
  const [clauseSec35Books, setClauseSec35Books] = useState(true);
  const [clauseTaxIndemnity, setClauseTaxIndemnity] = useState(true);
  const [clauseSubmeterConsent, setClauseSubmeterConsent] = useState(true);

  // Custom Clauses default to empty array []
  const [customGstClauses, setCustomGstClauses] = useState<CustomGstClause[]>([]);

  const addCustomGstClause = () => {
    setCustomGstClauses((prev) => [
      ...prev,
      {
        id: `gst-${Date.now()}`,
        header: '',
        description: ''
      }
    ]);
  };

  const updateCustomGstClause = (id: string, field: 'header' | 'description', val: string) => {
    setCustomGstClauses((prev) => prev.map((c) => (c.id === id ? { ...c, [field]: val } : c)));
  };

  const removeCustomGstClause = (id: string) => {
    setCustomGstClauses((prev) => prev.filter((c) => c.id !== id));
  };

  // --- PAGE 5: EXECUTION MODE & SUMMARY ---
  const [deliveryPreference, setDeliveryPreference] = useState<'digital' | 'physical' | 'hybrid'>('digital');
  const [shippingAddress, setShippingAddress] = useState('');
  const [shippingPincode, setShippingPincode] = useState('');
  const [shippingPhone, setShippingPhone] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedOrder, setSubmittedOrder] = useState<OrderItem | null>(null);

  // Name Matching Check
  const nameMismatchDetected = useMemo(() => {
    if (!utilityDocUploaded || !docOwnerNameString.trim() || !landlordName.trim()) return false;
    const cleanL = landlordName.toLowerCase().replace(/[^a-z]/g, '');
    const cleanD = docOwnerNameString.toLowerCase().replace(/[^a-z]/g, '');
    if (cleanL === cleanD) return false;
    const tokensL = landlordName.toLowerCase().split(/\s+/);
    const tokensD = docOwnerNameString.toLowerCase().split(/\s+/);
    const common = tokensL.filter((t) => tokensD.includes(t));
    return common.length === 0;
  }, [utilityDocUploaded, docOwnerNameString, landlordName]);

  // Pricing: ZERO upfront payment!
  const pricing = useMemo(() => {
    const stamp = activeStampValue;
    const eSign = 70;
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

  // Page Navigation Validation
  const validateAndProceed = (targetNext: StepId) => {
    if (currentPage === '1') {
      if (!pincode.trim() || pincode.length !== 6) {
        alert('Please enter a valid 6-digit PIN code.');
        return;
      }
    }

    if (currentPage === '2') {
      if (!landlordName.trim() || !landlordPan.trim() || !landlordMobile.trim()) {
        alert('Please provide Landlord Name, PAN, and Mobile number.');
        return;
      }
      if (ownershipStatus === 'Authorized Director / Partner / Trustee') {
        if (!corpCompanyName.trim() || !corpCin.trim()) {
          alert('Please enter Company Name and CIN.');
          return;
        }
      }
    }

    if (currentPage === '3') {
      if (!proposedTradeName.trim() || !legalBusinessName.trim() || !granteePan.trim() || !applicantName.trim()) {
        alert('Please fill Proposed Trade Name, Legal Business Name, PAN, and Applicant Name.');
        return;
      }
    }

    if (currentPage === '3B') {
      if (!premisesAddress.trim()) {
        alert('Please enter complete Principal Place of Business Address.');
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
        alert('Please provide physical courier delivery address, pincode, and phone number.');
        return;
      }
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const todayISO = new Date().toISOString().split('T')[0];
      const newOrderId = `CTC-${Math.floor(100000 + Math.random() * 900000)}`;

      const newOrder: OrderItem = {
        orderId: newOrderId,
        docTitle: 'Landlord NOC for GST Registration',
        createdAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        date: todayISO,
        deliveryHours: 24,
        deliveryFee: pricing.courierFee,
        baseFee: pricing.totalPayable - pricing.courierFee,
        totalFee: pricing.totalPayable,
        paymentStatus: 'Unpaid',
        status: 'Processing',
        pendingHours: 1,
        applicantName: applicantName || landlordName || 'Applicant',
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
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 uppercase tracking-wider">
              Demo Record Saved Locally
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-black mt-2">
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
              <span className="text-slate-500">Proposed Trade Name:</span>
              <span className="font-bold text-slate-900">{proposedTradeName}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200/80 pb-2">
              <span className="text-slate-500">GST Jurisdiction:</span>
              <span className="font-bold text-slate-900">{gstCommissionerate} · {gstDivision}</span>
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
      {/* Top Header */}
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

        <div className="w-full bg-slate-200 h-1.5 rounded-full mt-3 overflow-hidden">
          <div
            className="bg-blue-600 h-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Title Header */}
        <div className="mt-4">
          <h1 className="text-2xl sm:text-3xl font-black text-black">
            {initialDoc.title}
          </h1>
          <span className="text-sm font-bold text-blue-600 block mt-0.5">
            Architecture
          </span>
        </div>
      </div>

      {/* MULTILINGUAL AUDIO EXPLAINER BAR */}
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
        {/* ================= PAGE 1 ================= */}
        {currentPage === '1' && (
          <div className="space-y-6 animate-fadeIn">
            {/* MANDATORY & OPTIONAL BANNER AT TOP OF FORM (STRICTLY PAGE 1 ONLY) */}
            <div className="py-2 px-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs text-slate-700 font-medium">
              <div>
                Mandatory = <span className="text-red-500 font-bold">*</span>
              </div>
              <div>
                Optional = <span className="text-slate-400 font-medium">(Optional)</span>
              </div>
            </div>

            {/* Type of Premises */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  Type of Premises <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => handlePlayFieldSpeech('gstPremisesType')}
                  className="text-slate-400 hover:text-blue-600 transition-colors p-1"
                  title="Listen to field guide"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <select
                value={premisesType}
                onChange={(e) => setPremisesType(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-black focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="Commercial Building / Shop / Office">Commercial Building / Shop / Office</option>
                <option value="Industrial Area / Shed / Warehouse">Industrial Area / Shed / Warehouse</option>
                <option value="Residential Property used for Business">Residential Property used for Business</option>
              </select>
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

            {/* Pincode & GST Jurisdiction auto-mapping */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  PIN Code <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => handlePlayFieldSpeech('gstPincode')}
                  className="text-slate-400 hover:text-blue-600 transition-colors p-1"
                  title="Listen to field guide"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <input
                type="text"
                maxLength={6}
                required
                value={pincode}
                onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                placeholder="6-digit Area PIN"
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />

              {gstCommissionerate && (
                <div className="mt-2.5 p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs space-y-1 animate-fadeIn">
                  <div className="flex items-center justify-between text-blue-900 font-bold">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-blue-600" />
                      Auto-Mapped GST Jurisdiction
                    </span>
                    <button
                      type="button"
                      onClick={() => handlePlayFieldSpeech('gstJurisdiction')}
                      className="text-slate-400 hover:text-blue-600 p-0.5"
                    >
                      <Volume2 className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 pt-1 text-[11px] text-slate-700">
                    <div>Commissionerate: <strong>{gstCommissionerate}</strong></div>
                    <div>Division: <strong>{gstDivision}</strong></div>
                    <div>Range: <strong>{gstRange}</strong></div>
                  </div>
                </div>
              )}
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

            {/* Stamp Paper Denomination */}
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
                      placeholder="Custom Stamp Value (e.g. 200)"
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-mono"
                    />
                  )}

                  {isManualStampBelowThreshold && (
                    <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-xs flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <span>
                        <strong>Warning:</strong> GST authorities may issue a clarification notice if stamp paper value is below statutory state limit.
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= PAGE 2: LANDLORD TAX IDENTITY ================= */}
        {currentPage === '2' && (
          <div className="space-y-4 animate-fadeIn">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  Landlord Standing &amp; Entity Type <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => handlePlayFieldSpeech('landlordEntity')}
                  className="text-slate-400 hover:text-blue-600 transition-colors p-1"
                  title="Listen to field guide"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <select
                value={ownershipStatus}
                onChange={(e) => setOwnershipStatus(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="Sole Owner">Sole Individual Owner</option>
                <option value="Co-Owner / Joint Owner">Co-Owner / Joint Owners</option>
                <option value="Authorized Director / Partner / Trustee">Corporate Entity / Company / LLP</option>
              </select>
            </div>

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
                  placeholder={showExample ? "e.g. Ramesh Chandra Verma" : ""}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
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
                  placeholder={showExample ? "e.g. Late Shri Jagdish Verma" : ""}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            {/* KYC: PAN (Alphanumeric text removed), Mobile (No OTP button), Email (Optional) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Landlord PAN Card <span className="text-red-500">*</span>
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
                  placeholder={showExample ? "ABCDE1234F" : ""}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-mono uppercase text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Active Mobile Number <span className="text-red-500">*</span>
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
                  value={landlordMobile}
                  onChange={(e) => setLandlordMobile(e.target.value.replace(/\D/g, ''))}
                  placeholder={showExample ? "9876543210" : ""}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Email ID <span className="text-slate-400 font-normal">(Optional)</span>
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
                  placeholder={showExample ? "owner@example.com" : ""}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            {/* Corporate Owner Extension */}
            {ownershipStatus === 'Authorized Director / Partner / Trustee' && (
              <div className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-xl animate-fadeIn">
                <span className="text-xs font-bold text-blue-700 uppercase tracking-wider block">
                  Corporate Lessor Credentials
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Company / LLP Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={corpCompanyName}
                      onChange={(e) => setCorpCompanyName(e.target.value)}
                      placeholder={showExample ? "e.g. Skyline Commercial Assets Pvt Ltd" : ""}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900"
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
                      placeholder={showExample ? "e.g. U72200UP2018PTC105544" : ""}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono uppercase text-slate-900"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= PAGE 3: THE GRANTEE - PROPOSED GST ENTITY ================= */}
        {currentPage === '3' && (
          <div className="space-y-4 animate-fadeIn">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  Constitution of Business <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => handlePlayFieldSpeech('nocBizCategory')}
                  className="text-slate-400 hover:text-blue-600 p-1"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <select
                value={constitutionOfBusiness}
                onChange={(e) => setConstitutionOfBusiness(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="Proprietorship">Sole Proprietorship</option>
                <option value="Partnership">Partnership Firm</option>
                <option value="Private Limited Company">Private Limited Company</option>
                <option value="Limited Liability Partnership">Limited Liability Partnership (LLP)</option>
                <option value="One Person Company">One Person Company (OPC)</option>
                <option value="Trust / Society / Club / AOP">Trust / Society / Club / AOP</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Proposed Trade Name (दुकान या ब्रांड का नाम) <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => handlePlayFieldSpeech('gstTradeName')}
                    className="text-slate-400 hover:text-blue-600 p-1"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={proposedTradeName}
                  onChange={(e) => handleTradeNameChange(e.target.value)}
                  placeholder={showExample ? "e.g. Apex Global Enterprises" : ""}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Legal Name (पैन के अनुसार कानूनी नाम) <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => handlePlayFieldSpeech('gstLegalName')}
                    className="text-slate-400 hover:text-blue-600 p-1"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={legalBusinessName}
                  onChange={(e) => setLegalBusinessName(e.target.value)}
                  placeholder={showExample ? "e.g. Amit Kumar Sharma" : ""}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    PAN Card <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => handlePlayFieldSpeech('nocGranteePan')}
                    className="text-slate-400 hover:text-blue-600 p-1"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>
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

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Applicant Full Name <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => handlePlayFieldSpeech('nocApplicantName')}
                    className="text-slate-400 hover:text-blue-600 p-1"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={applicantName}
                  onChange={(e) => setApplicantName(e.target.value)}
                  placeholder={showExample ? "e.g. Amit Sharma" : ""}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>
          </div>
        )}

        {/* ================= PAGE 3B: PRINCIPAL PLACE OF BUSINESS & UTILITY DOCUMENT ================= */}
        {currentPage === '3B' && (
          <div className="space-y-4 animate-fadeIn">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  Principal Place of Business Address (जीएसटी परिसर का पूरा पता) <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => handlePlayFieldSpeech('premisesAddress')}
                  className="text-slate-400 hover:text-blue-600 p-1"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <textarea
                rows={3}
                required
                value={premisesAddress}
                onChange={(e) => setPremisesAddress(e.target.value)}
                placeholder={showExample ? "Shop/Office No., Floor, Building Name, Road, Sector/Area, City, Pincode" : ""}
                className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Municipal Ward / Zone <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => handlePlayFieldSpeech('nocMunicipalWard')}
                    className="text-slate-400 hover:text-blue-600 p-1"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <input
                  type="text"
                  value={wardNumber}
                  onChange={(e) => setWardNumber(e.target.value)}
                  placeholder={showExample ? "e.g. Ward 24, Zone 3" : ""}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Property Tax / Assessment No. <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => handlePlayFieldSpeech('nocHoldingNo')}
                    className="text-slate-400 hover:text-blue-600 p-1"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <input
                  type="text"
                  value={propertyTaxAssessmentNo}
                  onChange={(e) => setPropertyTaxAssessmentNo(e.target.value)}
                  placeholder={showExample ? "e.g. TAX/2023/88910" : ""}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            {/* Utility Document Upload (Electricity Bill not older than 2 months) */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 pt-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">
                    Upload Supporting Ownership / Utility Document <span className="text-red-500">*</span>
                  </span>
                  <span className="text-[11px] text-slate-500">
                    GST Rule 9 mandates an electricity bill, municipal tax receipt, or property deed
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handlePlayFieldSpeech('propertyProof')}
                  className="text-slate-400 hover:text-blue-600 p-1"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <select
                value={ownershipDocType}
                onChange={(e) => setOwnershipDocType(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="Electricity Bill (Not older than 2 months)">Electricity Bill (Not older than 2 months)</option>
                <option value="Municipal Property Tax Receipt">Municipal Property Tax Receipt</option>
                <option value="Registered Sale Deed / Title Deed">Registered Sale Deed / Title Deed</option>
                <option value="Water Bill / Landline Bill">Water Bill / Landline Bill</option>
              </select>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-white border border-slate-200 rounded-xl">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    {utilityDocUploaded ? '✓ Document Attached' : 'Attach Scanned File (PDF/JPG)'}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    File must be clear and legible for GST officer audit
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setUtilityDocUploaded(true)}
                  className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                    utilityDocUploaded
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                      : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                  }`}
                >
                  {utilityDocUploaded ? 'Attached' : 'Upload Document'}
                </button>
              </div>

              {utilityDocUploaded && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                    Owner Name Printed on Utility Bill / Deed <span className="text-slate-400 font-normal">(Optional Verification)</span>
                  </label>
                  <input
                    type="text"
                    value={docOwnerNameString}
                    onChange={(e) => setDocOwnerNameString(e.target.value)}
                    placeholder="Enter name exactly as printed on electricity bill"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900"
                  />
                  {nameMismatchDetected && (
                    <p className="text-[11px] text-amber-700 mt-1">
                      Note: If the electricity meter is registered in the name of an ancestor or builder, keep an inheritance or possession proof ready for GST queries.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= PAGE 4: GST COMPLIANCE & OFFICER INSPECTION CLAUSES ================= */}
        {currentPage === '4' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="space-y-3">
              <span className="text-xs font-bold text-blue-700 uppercase tracking-wider block">
                Statutory GST Consent Clauses (Pre-checked)
              </span>

              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={clauseRule9Physical}
                  onChange={(e) => setClauseRule9Physical(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-xs text-slate-700">
                  <strong>जीएसटी ऑफिसर का भौतिक निरीक्षण (Rule 9):</strong> मकान मालिक को जीएसटी अधिकारियों द्वारा परिसर के भौतिक सत्यापन (Physical Verification) पर कोई आपत्ति नहीं है।
                </span>
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); handlePlayFieldSpeech('declNoObjection'); }}
                  className="text-slate-400 hover:text-blue-600 p-0.5 ml-auto"
                >
                  <Volume2 className="w-3 h-3" />
                </button>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={clauseRule18Banner}
                  onChange={(e) => setClauseRule18Banner(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-xs text-slate-700">
                  <strong>जीएसटी साइनबोर्ड की अनुमति (Rule 18):</strong> परिसर के मुख्य प्रवेश द्वार पर फर्म का नाम और 15 अंकों का GSTIN साइनबोर्ड प्रदर्शित करने की पूर्ण अनुमति है।
                </span>
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); handlePlayFieldSpeech('declStatutoryCompliance'); }}
                  className="text-slate-400 hover:text-blue-600 p-0.5 ml-auto"
                >
                  <Volume2 className="w-3 h-3" />
                </button>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={clauseSec35Books}
                  onChange={(e) => setClauseSec35Books(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-xs text-slate-700">
                  <strong>बुक्स ऑफ अकाउंट्स रखना (Section 35):</strong> व्यापार के सभी बिल, टैक्स इनवॉइस व खाते इस परिसर में रखने की सहमति दी जाती है।
                </span>
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); handlePlayFieldSpeech('declStatutoryCompliance'); }}
                  className="text-slate-400 hover:text-blue-600 p-0.5 ml-auto"
                >
                  <Volume2 className="w-3 h-3" />
                </button>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={clauseTaxIndemnity}
                  onChange={(e) => setClauseTaxIndemnity(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-xs text-slate-700">
                  <strong>टैक्स देनदारी क्षतिपूर्ति (Tax Indemnity):</strong> किरायेदार के व्यापारिक टैक्स, जीएसटी चालान व जुर्माने की जिम्मेदारी केवल किरायेदार की होगी, मकान मालिक की नहीं।
                </span>
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); handlePlayFieldSpeech('declRevocationRight'); }}
                  className="text-slate-400 hover:text-blue-600 p-0.5 ml-auto"
                >
                  <Volume2 className="w-3 h-3" />
                </button>
              </label>
            </div>

            {/* Custom Clauses */}
            <div className="pt-3 border-t border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    Custom Operational Clauses
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Add custom stipulations or mutually agreed covenants
                  </span>
                </div>
                <button
                  type="button"
                  onClick={addCustomGstClause}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Custom Clause</span>
                </button>
              </div>

              {customGstClauses.length > 0 && (
                <div className="space-y-2 mt-2">
                  {customGstClauses.map((clause, idx) => (
                    <div key={clause.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700">Clause #{idx + 1}</span>
                        <button
                          type="button"
                          onClick={() => removeCustomGstClause(clause.id)}
                          className="text-slate-400 hover:text-rose-600 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <input
                        type="text"
                        value={clause.header}
                        onChange={(e) => updateCustomGstClause(clause.id, 'header', e.target.value)}
                        placeholder="Clause Title (e.g. Sub-meter Agreement)"
                        className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                      />
                      <textarea
                        rows={2}
                        value={clause.description}
                        onChange={(e) => updateCustomGstClause(clause.id, 'description', e.target.value)}
                        placeholder="Clause description or conditions"
                        className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-900 resize-none"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= PAGE 5: EXECUTION MODE & SUMMARY ================= */}
        {currentPage === '5' && (
          <div className="space-y-5 animate-fadeIn">
            {/* Delivery Preference */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  Delivery &amp; Execution Preference
                </span>
                <button
                  type="button"
                  onClick={() => handlePlayFieldSpeech('executionMode')}
                  className="text-slate-400 hover:text-blue-600 p-1"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
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
                  <span className="text-xs font-bold text-black block">Digital PDF with Aadhaar eSign</span>
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Instant delivery directly to email &amp; dashboard
                  </span>
                </label>

                <label
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
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
                  <span className="text-xs font-bold text-black block">Physical Courier on Original Stamp</span>
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Speed Post courier delivery with tracking (+₹50)
                  </span>
                </label>

                <label
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
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
                  <span className="text-xs font-bold text-black block">Hybrid (Digital + Physical Courier)</span>
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Immediate digital copy + original physical stamp
                  </span>
                </label>
              </div>
            </div>

            {/* Courier Address Inputs */}
            {deliveryPreference !== 'digital' && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 animate-fadeIn">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  Courier Shipping Address
                </span>
                <textarea
                  rows={2}
                  required
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  placeholder="Complete shipping address for physical delivery"
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 resize-none"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={shippingPincode}
                    onChange={(e) => setShippingPincode(e.target.value.replace(/\D/g, ''))}
                    placeholder="Delivery PIN Code"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono"
                  />
                  <input
                    type="tel"
                    maxLength={10}
                    required
                    value={shippingPhone}
                    onChange={(e) => setShippingPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="Courier Contact Mobile Number"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono"
                  />
                </div>
              </div>
            )}

            {/* Transparent Fee Summary: ZERO UPFRONT PAYMENT */}
            <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                <span>Fee Breakdown</span>
                <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full text-[10px]">
                  Zero Upfront Payment
                </span>
              </div>
              <div className="text-xs text-slate-600 space-y-1">
                <div className="flex justify-between">
                  <span>Stamp Paper Duty ({selectedState}):</span>
                  <span>₹{pricing.stamp}</span>
                </div>
                <div className="flex justify-between">
                  <span>Aadhaar OTP eSign &amp; Procurement:</span>
                  <span>₹{pricing.eSign + pricing.govtPurchasing}</span>
                </div>
                <div className="flex justify-between">
                  <span>Platform Drafting &amp; Docket Generation:</span>
                  <span>₹{pricing.platformFee}</span>
                </div>
                {pricing.courierFee > 0 && (
                  <div className="flex justify-between">
                    <span>Speed Post Courier:</span>
                    <span>₹{pricing.courierFee}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-slate-900 border-t border-blue-200 pt-1.5 text-sm">
                  <span>Total Payable Strictly After Delivery:</span>
                  <span className="text-blue-600">₹{pricing.totalPayable}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="mt-7 pt-4 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={handleBack}
            className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 cursor-pointer transition-all inline-flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>

          {currentPage !== '5' ? (
            <button
              type="button"
              onClick={() => {
                const stepMap: Record<StepId, StepId> = {
                  '1': '2',
                  '2': '3',
                  '3': '3B',
                  '3B': '4',
                  '4': '5',
                  '5': '5'
                };
                validateAndProceed(stepMap[currentPage]);
              }}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md cursor-pointer transition-all inline-flex items-center gap-1.5"
            >
              <span>Proceed to Next</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-7 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md cursor-pointer transition-all inline-flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Generating Docket...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Submit &amp; Generate GST NOC</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
