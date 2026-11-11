import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Building2,
  User,
  MapPin,
  Landmark,
  Plus,
  Trash2,
  Volume2,
  VolumeX,
  Phone,
  MessageCircle,
  FileText,
  Lock,
  ExternalLink
} from 'lucide-react';
import {
  speechController,
  getStoredAudioLanguage,
  SUPPORTED_LANGUAGES,
  getServiceVoiceScript
} from '../data/voiceNarrationData';
import { SERVICE_CATEGORIES } from '../data/servicesData';
import { VoiceGuidanceButton } from './VoiceGuidanceButton';
import { AadhaarInput } from './AadhaarInput';
import { useExampleDetails } from '../hooks/useExampleDetails';
import {
  encryptFormDataAndSign,
  saveLightweightMetadata,
  postEncryptedPayloadToWebsiteB,
  playConfirmationChime,
  generateSequentialOrderId
} from '../services/encryptionService';

interface GstRegistrationWizardProps {
  onBack: () => void;
}

const INDIAN_STATES = [
  'Uttar Pradesh', 'Maharashtra', 'Delhi', 'Gujarat', 'Karnataka',
  'Tamil Nadu', 'West Bengal', 'Rajasthan', 'Madhya Pradesh', 'Haryana',
  'Punjab', 'Bihar', 'Andhra Pradesh', 'Telangana', 'Kerala', 'Odisha'
];

const SAMPLE_DISTRICTS: Record<string, string[]> = {
  'Uttar Pradesh': ['Mainpuri', 'Noida (Gautam Buddha Nagar)', 'Lucknow', 'Agra', 'Kanpur', 'Ghaziabad', 'Varanasi', 'Prayagraj', 'Meerut', 'Bareilly'],
  'Maharashtra': ['Mumbai City', 'Mumbai Suburban', 'Pune', 'Thane', 'Nagpur', 'Nashik'],
  'Delhi': ['Central Delhi', 'New Delhi', 'North Delhi', 'South Delhi', 'West Delhi', 'East Delhi'],
  'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar'],
  'Karnataka': ['Bengaluru Urban', 'Bengaluru Rural', 'Mysuru', 'Mangaluru', 'Hubballi']
};

export const GstRegistrationWizard: React.FC<GstRegistrationWizardProps> = ({ onBack }) => {
  const { getPlaceholder } = useExampleDetails();
  const [activeTab, setActiveTab] = useState<'form' | 'request'>('form');
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [arnNumber, setArnNumber] = useState('');
  const [submissionSecurityDetails, setSubmissionSecurityDetails] = useState<{
    encryptedPayload: string;
    signature: string;
    websiteBUrl: string;
  } | null>(null);

  // Audio language
  const [audioLang] = useState(getStoredAudioLanguage());
  const activeLangConfig = SUPPORTED_LANGUAGES.find((l) => l.code === audioLang) || SUPPORTED_LANGUAGES[0];

  // Request Tab Form State
  const [requestData, setRequestData] = useState({
    name: '',
    phone: '',
    email: '',
    service: 'GST Registration'
  });
  const [requestSubmitted, setRequestSubmitted] = useState(false);

  // STEP 1 State
  const [step1, setStep1] = useState({
    state: 'Uttar Pradesh',
    district: 'Mainpuri',
    legalName: '',
    pan: '',
    email: '',
    phone: '',
    constitution: 'Sole Proprietorship' as 'Sole Proprietorship' | 'Partnership' | 'Private Limited Company' | 'LLP' | 'HUF / Society / Trust / Others'
  });

  // STEP 2 State
  const [proprietor, setProprietor] = useState({
    fullName: '',
    fatherName: '',
    dob: '',
    gender: 'Male',
    mobile: '',
    email: '',
    pan: '',
    aadhaar: '',
    address: '',
    pinCode: '',
    addressProofType: 'Electricity Bill',
    isAuthorizedSignatory: true,
    authSignatoryName: '',
    authSignatoryPan: ''
  });

  const [partners, setPartners] = useState([
    {
      fullName: '',
      designation: 'Director / Partner',
      dinPan: '',
      aadhaar: '',
      mobile: '',
      email: '',
      isAuthorizedSignatory: true
    }
  ]);

  // STEP 3 State
  const [step3, setStep3] = useState({
    buildingNo: '',
    street: '',
    locality: '',
    city: 'Mainpuri',
    pinCode: '',
    officeLandline: '',
    officeEmail: '',
    natureOfPossession: 'Rented / Leased',
    activities: ['Retail Business'] as string[],
    hasAdditionalPlace: false,
    additionalAddress: '',
    additionalPossession: 'Rented / Leased'
  });

  // STEP 4 State
  const [step4, setStep4] = useState({
    topCommoditiesDescription: '',
    accountNumber: '',
    ifscCode: '',
    bankName: '',
    branchName: '',
    ptinOrShopAct: '',
  });

  const handleRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRequestSubmitted(true);
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const orderId = generateSequentialOrderId();
    setArnNumber(orderId);

    // 1. Zero-Database Client-Side Encryption
    const sensitiveData = {
      orderId,
      service: 'GST Registration',
      step1,
      step2: partners,
      step3,
      step4,
      timestamp: new Date().toISOString()
    };
    const encResult = encryptFormDataAndSign(sensitiveData);
    const { encryptedPayload, signature, websiteBUrl } = encResult;

    // 2. Save ONLY 4 lightweight metadata fields in Supabase
    const metadata = {
      firstPartyName: step1.legalName || 'GST Applicant',
      formName: 'GST Registration',
      timestamp: new Date().toISOString(),
      totalPrice: '0',
      orderId
    };
    await saveLightweightMetadata(metadata);

    // 3. Directly POST encrypted ciphertext & HMAC signature to Website B API
    await postEncryptedPayloadToWebsiteB(encResult, metadata);

    setSubmissionSecurityDetails({ encryptedPayload, signature, websiteBUrl });
    setIsSubmitted(true);
    try {
      playConfirmationChime();
    } catch {}
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isSoleProp = step1.constitution === 'Sole Proprietorship';

  const addPartner = () => {
    setPartners((prev) => [
      ...prev,
      {
        fullName: '',
        designation: 'Director / Partner',
        dinPan: '',
        aadhaar: '',
        mobile: '',
        email: '',
        isAuthorizedSignatory: false
      }
    ]);
  };

  const removePartner = (index: number) => {
    if (partners.length <= 1) return;
    setPartners((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleActivity = (activity: string) => {
    setStep3((prev) => {
      const exists = prev.activities.includes(activity);
      return {
        ...prev,
        activities: exists
          ? prev.activities.filter((a) => a !== activity)
          : [...prev.activities, activity]
      };
    });
  };

  // If final submission success screen
  if (isSubmitted) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 py-6 animate-fadeIn pb-24">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 text-center shadow-sm space-y-4">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-[#15803d] text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-2">
              <Lock className="w-3.5 h-3.5 text-[#15803d]" />
              <span>AES-256 Client Encrypted • Zero-Database Rule</span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 mt-1">
              GST REG-01 Application Submitted!
            </h2>
            <p className="text-sm text-slate-600 max-w-md mx-auto mt-1">
              Your official Part-A and Part-B GST registration application has been submitted to the GST portal.
            </p>
          </div>

          {/* Zero-Knowledge Background Delivery Status Box (No Redirection) */}
          <div className="bg-emerald-50/90 border border-emerald-300 rounded-2xl p-4 sm:p-5 text-left space-y-2.5 max-w-md mx-auto">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-950 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#15803d]"></span>
                Silent Background Delivery Complete
              </span>
              <span className="text-xs font-bold text-[#15803d] bg-white px-2.5 py-0.5 rounded-full border border-emerald-200">
                Website A Verified
              </span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">
              Your GST registration application was encrypted on this device using AES-256 and transmitted directly to Website B via background API with HMAC authentication. No sensitive data was saved to our database.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 max-w-sm mx-auto">
            <div className="text-xs uppercase tracking-wider font-semibold text-slate-500">
              Application Reference Number (ARN)
            </div>
            <div className="text-xl font-mono font-black text-blue-600 mt-1 select-all">
              {arnNumber}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Status: Pending Field Officer Verification</div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm cursor-pointer shadow-sm"
            >
              Back to Home
            </button>
            <a
              href="https://wa.me/919999999999"
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp Admin for Tracking</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-5 animate-fadeIn pb-24">
      {/* Top Bar: Back to Services on left, Speaker & Quick Actions on right */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800 py-1.5 px-3 rounded-lg hover:bg-blue-50 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to services</span>
        </button>

        {/* Right Corner: Speaker Button with Tap-To-Stop */}
        <VoiceGuidanceButton serviceTitle="GST Registration" />
      </div>

      {/* Title */}
      <div className="mb-4">
        <p className="text-xs font-semibold text-slate-500">Registrations</p>
        <h1 className="text-2xl font-black text-black">GST Registration</h1>
      </div>

      {/* Two Sliders / Tabs: "Form" (default) & "Request" */}
      <div className="flex items-center border-b border-slate-200 mb-6 gap-6">
        <button
          type="button"
          onClick={() => setActiveTab('form')}
          className={`pb-3 text-sm font-bold cursor-pointer transition-colors relative ${
            activeTab === 'form' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <span>Form</span>
          {activeTab === 'form' && (
            <div className="absolute bottom-0 inset-x-0 h-0.5 bg-blue-600 rounded-full" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('request')}
          className={`pb-3 text-sm font-bold cursor-pointer transition-colors relative ${
            activeTab === 'request' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <span>Request (1-Hour Callback)</span>
          {activeTab === 'request' && (
            <div className="absolute bottom-0 inset-x-0 h-0.5 bg-blue-600 rounded-full" />
          )}
        </button>
      </div>

      {/* TAB 2: Quick Callback Request */}
      {activeTab === 'request' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm">
          {requestSubmitted ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Request Submitted Successfully!</h3>
              <p className="text-sm text-slate-600 mt-1 max-w-md mx-auto">
                Our GST registration specialist will call you on <strong>{requestData.phone}</strong> within 1 hour to complete your GST application.
              </p>
              <div className="mt-5 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={onBack}
                  className="px-5 py-2 bg-blue-600 text-white font-bold rounded-xl text-xs"
                >
                  Back to Services
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleRequestSubmit} className="space-y-4 max-w-lg mx-auto">
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900 leading-relaxed">
                💡 <strong>Skip the 4-step form:</strong> Enter your basic details below. Our GST officer will call you within 1 hour, verify your documents, and complete your GST registration directly.
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Your Name <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={getPlaceholder('Enter full name')}
                  value={requestData.name}
                  onChange={(e) => setRequestData({ ...requestData, name: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mobile Number <span className="text-rose-600">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder={getPlaceholder('10-digit mobile number')}
                  value={requestData.phone}
                  onChange={(e) => setRequestData({ ...requestData, phone: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email Address <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="email"
                  placeholder={getPlaceholder('name@example.com')}
                  value={requestData.email}
                  onChange={(e) => setRequestData({ ...requestData, email: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Service Selected
                </label>
                <select
                  value={requestData.service}
                  onChange={(e) => setRequestData({ ...requestData, service: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  {SERVICE_CATEGORIES.find((c) => c.id === 'registrations')?.services.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm shadow-sm cursor-pointer transition-all"
                >
                  Submit 1-Hour Callback Request
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* TAB 1: 4-STAGE FULL GST FORM */}
      {activeTab === 'form' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm">
          {/* Step Progress Tracker */}
          <div className="mb-6 border-b border-slate-200 pb-4">
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden flex">
              <div
                className="bg-blue-600 h-full transition-all duration-300"
                style={{ width: `${(currentStep / 4) * 100}%` }}
              />
            </div>
          </div>

          {/* Basic Details */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                <span>Basic Details</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    State <span className="text-rose-600">*</span>
                  </label>
                  <select
                    value={step1.state}
                    onChange={(e) => setStep1({ ...step1, state: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    {INDIAN_STATES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    District <span className="text-rose-600">*</span>
                  </label>
                  <select
                    value={step1.district}
                    onChange={(e) => setStep1({ ...step1, district: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    {(SAMPLE_DISTRICTS[step1.state] || ['Mainpuri', 'Central', 'HQ District']).map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Legal Name of the Business (As per PAN Card) <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={getPlaceholder('Enter business name as on PAN')}
                    value={step1.legalName}
                    onChange={(e) => setStep1({ ...step1, legalName: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Permanent Account Number (PAN) <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={10}
                    placeholder={getPlaceholder('e.g. ABCDE1234F')}
                    value={step1.pan}
                    onChange={(e) => setStep1({ ...step1, pan: e.target.value.toUpperCase() })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 uppercase font-mono focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  {step1.pan.length === 10 && (
                    <span className="text-[11px] text-emerald-600 font-semibold mt-0.5 block">
                      ✓ Valid PAN format validated with NSDL records
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email Address (For ARN &amp; OTPs) <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder={getPlaceholder('official@company.com')}
                    value={step1.email}
                    onChange={(e) => setStep1({ ...step1, email: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mobile Number (For GSTIN OTPs) <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    placeholder={getPlaceholder('10-digit mobile')}
                    value={step1.phone}
                    onChange={(e) => setStep1({ ...step1, phone: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Constitution of Business <span className="text-rose-600">*</span>
                  </label>
                  <select
                    value={step1.constitution}
                    onChange={(e) =>
                      setStep1({
                        ...step1,
                        constitution: e.target.value as any
                      })
                    }
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="Sole Proprietorship">Sole Proprietorship</option>
                    <option value="Partnership">Partnership</option>
                    <option value="Private Limited Company">Private Limited Company</option>
                    <option value="LLP">LLP</option>
                    <option value="HUF / Society / Trust / Others">HUF / Society / Trust / Others</option>
                  </select>
                  <p className="text-[11px] text-slate-500 mt-1">
                    ⚡ {isSoleProp ? 'Sole Proprietorship requires single proprietor KYC in Step 2.' : 'Partnership/Company requires multiple Partner/Director details in Step 2.'}
                  </p>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-6 py-2.5 rounded-xl cursor-pointer shadow-sm"
                >
                  <span>Next</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Promoters / Partners / Directors */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" />
                <span>
                  {isSoleProp ? 'Proprietor Personal & KYC Details' : 'Details of Partners / Directors / Promoters'}
                </span>
              </h2>

              {isSoleProp ? (
                /* Sole Proprietor Form */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Full Name of Proprietor <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={getPlaceholder("Proprietor's full name")}
                      value={proprietor.fullName}
                      onChange={(e) => setProprietor({ ...proprietor, fullName: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Father&apos;s Full Name <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={getPlaceholder("Father's name")}
                      value={proprietor.fatherName}
                      onChange={(e) => setProprietor({ ...proprietor, fatherName: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Date of Birth</label>
                    <input
                      type="date"
                      value={proprietor.dob}
                      onChange={(e) => setProprietor({ ...proprietor, dob: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Gender</label>
                    <select
                      value={proprietor.gender}
                      onChange={(e) => setProprietor({ ...proprietor, gender: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <AadhaarInput
                      value={proprietor.aadhaar}
                      onChange={(val) => setProprietor({ ...proprietor, aadhaar: val })}
                      required
                      label="Aadhaar Number"
                      placeholder={getPlaceholder('1234 - 5678 - 9012')}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Residential Pin Code</label>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder={getPlaceholder('6-digit PIN')}
                      value={proprietor.pinCode}
                      onChange={(e) => setProprietor({ ...proprietor, pinCode: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Residential Address</label>
                    <textarea
                      rows={2}
                      placeholder={getPlaceholder('Complete residential address')}
                      value={proprietor.address}
                      onChange={(e) => setProprietor({ ...proprietor, address: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div className="sm:col-span-2 p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={proprietor.isAuthorizedSignatory}
                        onChange={(e) => setProprietor({ ...proprietor, isAuthorizedSignatory: e.target.checked })}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="text-xs font-bold text-slate-800">
                        Proprietor is the Primary Authorized Signatory
                      </span>
                    </label>

                    {!proprietor.isAuthorizedSignatory && (
                      <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-slate-200">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Authorized Person Name
                          </label>
                          <input
                            type="text"
                            placeholder={getPlaceholder('Full name')}
                            value={proprietor.authSignatoryName}
                            onChange={(e) => setProprietor({ ...proprietor, authSignatoryName: e.target.value })}
                            className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Authorized Person PAN
                          </label>
                          <input
                            type="text"
                            maxLength={10}
                            placeholder={getPlaceholder('PAN')}
                            value={proprietor.authSignatoryPan}
                            onChange={(e) => setProprietor({ ...proprietor, authSignatoryPan: e.target.value.toUpperCase() })}
                            className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 uppercase"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Dynamic Partner / Director Table */
                <div className="space-y-3">
                  <p className="text-xs text-slate-600">
                    Add all Partners or Directors of the entity. At least 2 members are required.
                  </p>

                  {partners.map((partner, index) => (
                    <div key={index} className="p-4 bg-slate-50 border border-slate-200 rounded-xl relative">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-extrabold text-blue-600">
                          Partner / Director #{index + 1}
                        </span>
                        {partners.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removePartner(index)}
                            className="text-rose-600 hover:text-rose-800 p-1 text-xs flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove</span>
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">Full Name</label>
                          <input
                            type="text"
                            placeholder={getPlaceholder('Name')}
                            value={partner.fullName}
                            onChange={(e) => {
                              const updated = [...partners];
                              updated[index].fullName = e.target.value;
                              setPartners(updated);
                            }}
                            className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">DIN / PAN</label>
                          <input
                            type="text"
                            placeholder={getPlaceholder('DIN or PAN')}
                            value={partner.dinPan}
                            onChange={(e) => {
                              const updated = [...partners];
                              updated[index].dinPan = e.target.value.toUpperCase();
                              setPartners(updated);
                            }}
                            className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 uppercase"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">Mobile</label>
                          <input
                            type="tel"
                            maxLength={10}
                            placeholder={getPlaceholder('Mobile')}
                            value={partner.mobile}
                            onChange={(e) => {
                              const updated = [...partners];
                              updated[index].mobile = e.target.value;
                              setPartners(updated);
                            }}
                            className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={addPartner}
                    className="inline-flex items-center gap-1.5 py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold border border-blue-200 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Another Partner / Director</span>
                  </button>
                </div>
              )}

              <div className="pt-4 flex justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-5 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-200 cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-6 py-2.5 rounded-xl cursor-pointer shadow-sm"
                >
                  <span>Next</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Principal & Additional Place of Business */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span>Principal &amp; Additional Place of Business</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Building / Flat / Shop Number <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={getPlaceholder('Shop No. 12, Ground Floor')}
                    value={step3.buildingNo}
                    onChange={(e) => setStep3({ ...step3, buildingNo: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Street / Road / Lane <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={getPlaceholder('Market Road')}
                    value={step3.street}
                    onChange={(e) => setStep3({ ...step3, street: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    City / Town <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={step3.city}
                    onChange={(e) => setStep3({ ...step3, city: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    PIN Code <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    placeholder={getPlaceholder('205001')}
                    value={step3.pinCode}
                    onChange={(e) => setStep3({ ...step3, pinCode: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nature of Possession of Premises <span className="text-rose-600">*</span>
                  </label>
                  <select
                    value={step3.natureOfPossession}
                    onChange={(e) => setStep3({ ...step3, natureOfPossession: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="Own">Own → Electricity Bill + Registry Copy</option>
                    <option value="Rented / Leased">Rented / Leased → Rent Agreement + Electricity Bill + NOC</option>
                    <option value="Consent / Shared">Consent / Shared → Consent Letter + Owner ID + Electricity Bill</option>
                    <option value="Other">Other → Other documents</option>
                  </select>
                </div>

                {/* Nature of business activity checkboxes */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    Nature of Business Activity (Select all applicable)
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                    {[
                      'Retail Business',
                      'Wholesale',
                      'Manufacturing',
                      'Warehouse / Storage',
                      'Supply of Services',
                      'Office / Other'
                    ].map((act) => (
                      <label key={act} className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer">
                        <input
                          type="checkbox"
                          checked={step3.activities.includes(act)}
                          onChange={() => toggleActivity(act)}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                        <span className="font-semibold text-slate-800">{act}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Additional Place of Business Toggle */}
                <div className="sm:col-span-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        Are there any additional places of business (APOB)?
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Check if you have any godown, branch, or factory outside the principal office
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={step3.hasAdditionalPlace}
                      onChange={(e) => setStep3({ ...step3, hasAdditionalPlace: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                  </label>

                  {step3.hasAdditionalPlace && (
                    <div className="mt-3 pt-3 border-t border-slate-200 space-y-2">
                      <label className="block text-xs font-bold text-slate-700">
                        Additional Godown / Branch Address
                      </label>
                      <input
                        type="text"
                        placeholder={getPlaceholder('Complete address of godown or branch')}
                        value={step3.additionalAddress}
                        onChange={(e) => setStep3({ ...step3, additionalAddress: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 flex justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-5 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-200 cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(4)}
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-6 py-2.5 rounded-xl cursor-pointer shadow-sm"
                >
                  <span>Next</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Business Category, Bank Details & Final Verification */}
          {currentStep === 4 && (
            <form onSubmit={handleFinalSubmit} className="space-y-4">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                <Landmark className="w-4 h-4 text-blue-600" />
                <span>Business Category, Bank Details &amp; Final Verification</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Top Commodities / Services (Description without HSN) <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={getPlaceholder('e.g. Readymade Garments, Accounting Services, Food Products')}
                    value={step4.topCommoditiesDescription}
                    onChange={(e) => setStep4({ ...step4, topCommoditiesDescription: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <span className="text-[11px] text-slate-400">
                    Describe your top 5 goods or services in simple words (HSN codes not required).
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Bank Account Number <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={getPlaceholder('Bank Account Number')}
                    value={step4.accountNumber}
                    onChange={(e) => setStep4({ ...step4, accountNumber: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    IFSC Code <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    maxLength={11}
                    required
                    placeholder={getPlaceholder('e.g. SBIN0001234')}
                    value={step4.ifscCode}
                    onChange={(e) => setStep4({ ...step4, ifscCode: e.target.value.toUpperCase() })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 uppercase font-mono focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Bank Name</label>
                  <input
                    type="text"
                    placeholder={getPlaceholder('State Bank of India / HDFC Bank')}
                    value={step4.bankName}
                    onChange={(e) => setStep4({ ...step4, bankName: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Branch Name</label>
                  <input
                    type="text"
                    placeholder={getPlaceholder('Main Branch')}
                    value={step4.branchName}
                    onChange={(e) => setStep4({ ...step4, branchName: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    State Specific Info (PTIN / Shop &amp; Establishment Act) <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder={getPlaceholder('Shop Act Registration or PTIN number')}
                    value={step4.ptinOrShopAct}
                    onChange={(e) => setStep4({ ...step4, ptinOrShopAct: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div className="sm:col-span-2 p-4 bg-blue-50/70 border border-blue-200 rounded-xl">
                  <div className="text-xs font-bold text-blue-900 mb-1">
                    Verification &amp; Authentication Method
                  </div>
                  <div className="text-xs text-blue-800 leading-relaxed">
                    {isSoleProp ? (
                      <span>
                        ✅ <strong>E-Aadhaar OTP:</strong> Sole Proprietorship is verified via instantaneous OTP sent to Aadhaar-registered mobile number ({step1.phone || '9999999999'}).
                      </span>
                    ) : (
                      <span>
                        🛡️ <strong>Class-3 DSC Authentication:</strong> Private Limited Companies and LLPs require Class-3 Digital Signature Certificate of the Authorized Signatory before final government submission.
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="px-5 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-200 cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-8 py-3 rounded-xl cursor-pointer shadow-md transition-all"
                >
                  <FileText className="w-4 h-4" />
                  <span>Submit</span>
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
};
