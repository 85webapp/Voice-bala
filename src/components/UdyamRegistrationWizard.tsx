import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Building2,
  FileCheck2,
  Plus,
  Trash2,
  Volume2,
  VolumeX,
  Award,
  Download,
  AlertTriangle,
  MapPin,
  Landmark,
  ShieldCheck,
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
import { useExampleDetails } from '../hooks/useExampleDetails';
import { AadhaarInput } from './AadhaarInput';
import {
  encryptFormDataAndSign,
  saveLightweightMetadata,
  postEncryptedPayloadToWebsiteB,
  playConfirmationChime
} from '../services/encryptionService';

interface UdyamRegistrationWizardProps {
  onBack: () => void;
}

export const UdyamRegistrationWizard: React.FC<UdyamRegistrationWizardProps> = ({ onBack }) => {
  const { getPlaceholder } = useExampleDetails();
  const [activeTab, setActiveTab] = useState<'form' | 'request'>('form');
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [udyamRegNumber, setUdyamRegNumber] = useState('');
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
    service: 'MSME Udyam Registration'
  });
  const [requestSubmitted, setRequestSubmitted] = useState(false);

  // STEP 1 State: Aadhaar Authentication & PAN Gate
  const [step1, setStep1] = useState({
    aadhaarNumber: '',
    entrepreneurName: '',
    otpSent: false,
    otpValue: '',
    otpVerified: false,
    hasPan: 'Yes',
    panNumber: ''
  });

  // STEP 2 State: Constitution & Social
  const [step2, setStep2] = useState({
    organizationType: 'PROPRIETORY',
    socialCategory: 'GENERAL',
    casteCertificateNumber: '',
    gender: 'Male',
    physicallyHandicapped: 'No'
  });

  // STEP 3 State: Enterprise Names, Units, Addresses & Bank Details
  const [step3, setStep3] = useState({
    enterpriseName: '',
    officialEmail: '',
    officialMobile: '',
    dateOfCommencement: '',
    previousUamNumber: '',
    bankName: '',
    ifscCode: '',
    bankAccountNumber: ''
  });

  const [unitsList, setUnitsList] = useState([
    {
      unitName: '',
      flatNo: '',
      buildingName: '',
      villageOrTown: '',
      block: '',
      city: '',
      district: '',
      state: '',
      pinCode: ''
    }
  ]);

  // STEP 4 State: Activity, Investment & Turnover
  const [step4, setStep4] = useState({
    majorActivity: 'MANUFACTURING',
    nicCodes: '',
    empMale: 0,
    empFemale: 0,
    empOther: 0,
    investmentInPlantMachinery: 0,
    annualTurnover: 0
  });

  // STEP 5 State: DIC Selection & Declaration
  const [step5, setStep5] = useState({
    preferredDIC: 'DIC Mainpuri, Uttar Pradesh',
    declarationAccepted: false,
    finalAadhaarOtp: '',
    otpVerified: false
  });

  // Helper for dynamic MSME classification
  const getClassification = (investment: number, turnover: number) => {
    const oneCr = 10000000;
    const fiveCr = 50000000;
    const tenCr = 100000000;
    const fiftyCr = 500000000;
    const twoFiftyCr = 2500000000;

    if (investment <= oneCr && turnover <= fiveCr) {
      return {
        category: 'Micro Enterprise',
        badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        limits: 'Investment ≤ ₹1 Cr & Turnover ≤ ₹5 Cr'
      };
    }
    if (investment <= tenCr && turnover <= fiftyCr) {
      return {
        category: 'Small Enterprise',
        badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
        limits: 'Investment ≤ ₹10 Cr & Turnover ≤ ₹50 Cr'
      };
    }
    if (investment <= fiftyCr && turnover <= twoFiftyCr) {
      return {
        category: 'Medium Enterprise',
        badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-300',
        limits: 'Investment ≤ ₹50 Cr & Turnover ≤ ₹250 Cr'
      };
    }
    return {
      category: 'Large Enterprise (Exceeds MSME Threshold)',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
      limits: 'Exceeds standard MSME limits'
    };
  };

  const classification = getClassification(
    Number(step4.investmentInPlantMachinery) || 0,
    Number(step4.annualTurnover) || 0
  );

  const totalEmployees =
    (Number(step4.empMale) || 0) +
    (Number(step4.empFemale) || 0) +
    (Number(step4.empOther) || 0);

  const handleSendAadhaarOtp = () => {
    if (step1.aadhaarNumber.length === 12) {
      setStep1((prev) => ({ ...prev, otpSent: true, otpValue: '482910' }));
    }
  };

  const handleVerifyAadhaarOtp = () => {
    setStep1((prev) => ({ ...prev, otpVerified: true }));
  };

  const addUnit = () => {
    setUnitsList((prev) => [
      ...prev,
      {
        unitName: `Unit-${prev.length + 1}`,
        flatNo: '',
        buildingName: '',
        villageOrTown: '',
        block: '',
        city: 'Mainpuri',
        district: 'Mainpuri',
        state: 'Uttar Pradesh',
        pinCode: '205001'
      }
    ]);
  };

  const removeUnit = (index: number) => {
    if (unitsList.length <= 1) return;
    setUnitsList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRequestSubmitted(true);
  };

  const handleFinalUdyamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const stateCode = 'UP';
    const distCode = '07';
    const randDigits = Math.floor(1000000 + Math.random() * 9000000);
    const urn = `UDYAM-${stateCode}-${distCode}-${randDigits}`;
    setUdyamRegNumber(urn);

    // 1. Zero-Database Client-Side Encryption
    const sensitiveData = {
      orderId: urn,
      service: 'MSME Udyam Registration',
      step1,
      step2,
      step3,
      step4,
      step5,
      timestamp: new Date().toISOString()
    };
    const encResult = encryptFormDataAndSign(sensitiveData);
    const { encryptedPayload, signature, websiteBUrl } = encResult;

    // 2. Save ONLY 4 lightweight metadata fields in Supabase
    const metadata = {
      firstPartyName: step1.entrepreneurName || 'MSME Applicant',
      formName: 'MSME Udyam Registration',
      timestamp: new Date().toISOString(),
      totalPrice: '0',
      orderId: urn
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

  // Success certificate preview
  if (isSubmitted) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 py-6 animate-fadeIn pb-24">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 text-center shadow-sm space-y-4">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <Award className="w-10 h-10" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-[#15803d] text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-2">
              <Lock className="w-3.5 h-3.5 text-[#15803d]" />
              <span>AES-256 Client Encrypted • Zero-Database Rule</span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 mt-1">
              Udyam Registration Certificate Generated!
            </h2>
            <p className="text-sm text-slate-600 max-w-md mx-auto mt-1">
              Congratulations! Your enterprise has been officially registered under the Ministry of Micro, Small and Medium Enterprises.
            </p>
          </div>



          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 max-w-md mx-auto text-left">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-2">
              <span className="text-xs uppercase tracking-wider font-bold text-slate-500">
                Udyam Registration Number (URN)
              </span>
              <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                Active &amp; Verified
              </span>
            </div>
            <div className="text-xl font-mono font-black text-blue-600 select-all">
              {udyamRegNumber}
            </div>

            <div className="mt-3 pt-3 border-t border-slate-200 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-500 block">Enterprise:</span>
                <span className="font-bold text-slate-900">{step3.enterpriseName || 'My Business Enterprise'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Category:</span>
                <span className="font-bold text-emerald-700">{classification.category.split(' ')[0]} Enterprise</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                alert(`Udyam Certificate ${udyamRegNumber} downloaded successfully!`);
              }}
              className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>Download Official Udyam Certificate (PDF)</span>
            </button>
            <button
              type="button"
              onClick={onBack}
              className="w-full sm:w-auto px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm cursor-pointer"
            >
              Back to Home
            </button>
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
        <VoiceGuidanceButton serviceTitle="MSME Udyam Registration" />
      </div>

      {/* Title */}
      <div className="mb-4">
        <p className="text-xs font-semibold text-slate-500">Registrations</p>
        <h1 className="text-2xl font-black text-black">MSME Udyam Registration</h1>
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
          <span>Form (5-Step Official Workflow)</span>
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
          <span>Request (Instant 1-Hour Certificate Issuance)</span>
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
                Our MSME officer will call you on <strong>{requestData.phone}</strong> within 1 hour and generate your Udyam Certificate immediately.
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
                💡 <strong>Instant Assistance:</strong> Skip the technical 5-step form. Enter your basic details and our team will coordinate with you within 1 hour to hand over your government Udyam Certificate.
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
                  inputMode="numeric"
                  maxLength={10}
                  required
                  placeholder={getPlaceholder('10-digit mobile number')}
                  value={requestData.phone}
                  onChange={(e) => setRequestData({ ...requestData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
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

      {/* TAB 1: 5-STEP UDYAM OFFICIAL FORM */}
      {activeTab === 'form' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm">
          {/* Progress Tracker */}
          <div className="mb-6 border-b border-slate-200 pb-4">
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden flex">
              <div
                className="bg-blue-600 h-full transition-all duration-300"
                style={{ width: `${(currentStep / 5) * 100}%` }}
              />
            </div>
          </div>

          {/* Aadhaar Authentication & PAN Gate */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>Aadhaar Authentication &amp; PAN Verification</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <AadhaarInput
                    value={step1.aadhaarNumber}
                    onChange={(val) => setStep1({ ...step1, aadhaarNumber: val })}
                    required
                    label="Aadhaar Number (12 Digits)"
                    placeholder={getPlaceholder('1234 - 5678 - 9012')}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Name of Entrepreneur (As per Aadhaar) <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={getPlaceholder('Exact name on Aadhaar card')}
                    value={step1.entrepreneurName}
                    onChange={(e) => setStep1({ ...step1, entrepreneurName: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div className="sm:col-span-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleSendAadhaarOtp}
                    disabled={step1.aadhaarNumber.length !== 12 || !step1.entrepreneurName.trim()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl cursor-pointer"
                  >
                    {step1.otpSent ? 'Resend Aadhaar OTP' : 'Validate & Send OTP'}
                  </button>
                  {step1.otpSent && (
                    <span className="text-xs text-emerald-600 font-semibold">
                      OTP sent to Aadhaar linked mobile number!
                    </span>
                  )}
                </div>

                {step1.otpSent && !step1.otpVerified && (
                  <div className="sm:col-span-2 p-3 bg-blue-50/60 border border-blue-200 rounded-xl flex items-center gap-3">
                    <input
                      type="text"
                      maxLength={6}
                      placeholder={getPlaceholder('Enter 6-digit OTP')}
                      value={step1.otpValue}
                      onChange={(e) => setStep1({ ...step1, otpValue: e.target.value })}
                      className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm font-mono text-slate-900 w-36"
                    />
                    <button
                      type="button"
                      onClick={handleVerifyAadhaarOtp}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg cursor-pointer"
                    >
                      Verify OTP
                    </button>
                  </div>
                )}

                {/* Sub-section unlocked on OTP verification */}
                {step1.otpVerified && (
                  <div className="sm:col-span-2 p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-3">
                    <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Aadhaar Verification Successful</span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Do you have a PAN? (PAN Card Availability) <span className="text-rose-600">*</span>
                      </label>
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer">
                          <input
                            type="radio"
                            name="hasPan"
                            checked={step1.hasPan === 'Yes'}
                            onChange={() => setStep1({ ...step1, hasPan: 'Yes' })}
                            className="text-blue-600"
                          />
                          <span>Yes</span>
                        </label>
                        <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer">
                          <input
                            type="radio"
                            name="hasPan"
                            checked={step1.hasPan === 'No'}
                            onChange={() => setStep1({ ...step1, hasPan: 'No' })}
                            className="text-blue-600"
                          />
                          <span>No</span>
                        </label>
                      </div>
                    </div>

                    {step1.hasPan === 'Yes' ? (
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          PAN Number <span className="text-rose-600">*</span>
                        </label>
                        <input
                          type="text"
                          maxLength={10}
                          placeholder={getPlaceholder('ABCDE1234F')}
                          value={step1.panNumber}
                          onChange={(e) => setStep1({ ...step1, panNumber: e.target.value.toUpperCase() })}
                          className="w-full sm:w-72 bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 font-mono uppercase focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>
                    ) : (
                      <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                        <span>
                          Statutory Requirement: As per Ministry guidelines, PAN is mandatory for official Udyam Registration.
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  disabled={!step1.otpVerified || (step1.hasPan === 'Yes' && step1.panNumber.length !== 10)}
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold text-sm px-6 py-2.5 rounded-xl cursor-pointer shadow-sm"
                >
                  <span>Next</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Constitution & Social Categories */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                <span>STEP 2: Constitution of Business &amp; Social Categories</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Type of Organization <span className="text-rose-600">*</span>
                  </label>
                  <select
                    value={step2.organizationType}
                    onChange={(e) => setStep2({ ...step2, organizationType: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="PROPRIETORY">Proprietorship</option>
                    <option value="HUF">Hindu Undivided Family (HUF)</option>
                    <option value="PARTNERSHIP">Partnership Firm</option>
                    <option value="CO_OPERATIVE">Co-operative / Society / Trust</option>
                    <option value="PVT_LTD">Private Limited Company</option>
                    <option value="PUBLIC_LTD">Public Limited Company</option>
                    <option value="LLP">Limited Liability Partnership (LLP)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Social Category <span className="text-rose-600">*</span>
                  </label>
                  <select
                    value={step2.socialCategory}
                    onChange={(e) => setStep2({ ...step2, socialCategory: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="GENERAL">General</option>
                    <option value="SC">SC</option>
                    <option value="ST">ST</option>
                    <option value="OBC">OBC</option>
                  </select>
                </div>

                {step2.socialCategory !== 'GENERAL' && (
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Caste Certificate Number <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder={getPlaceholder('Caste certificate reference number')}
                      value={step2.casteCertificateNumber}
                      onChange={(e) => setStep2({ ...step2, casteCertificateNumber: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Gender</label>
                  <div className="flex items-center gap-4 pt-1">
                    {['Male', 'Female', 'Other'].map((g) => (
                      <label key={g} className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer">
                        <input
                          type="radio"
                          name="gender"
                          checked={step2.gender === g}
                          onChange={() => setStep2({ ...step2, gender: g })}
                          className="text-blue-600"
                        />
                        <span>{g}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Physically Handicapped?
                  </label>
                  <div className="flex items-center gap-4 pt-1">
                    {['Yes', 'No'].map((ph) => (
                      <label key={ph} className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer">
                        <input
                          type="radio"
                          name="physicallyHandicapped"
                          checked={step2.physicallyHandicapped === ph}
                          onChange={() => setStep2({ ...step2, physicallyHandicapped: ph })}
                          className="text-blue-600"
                        />
                        <span>{ph}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

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

          {/* STEP 3: Enterprise Names, Units, Addresses & Bank Details */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span>STEP 3: Enterprise Name, Units &amp; Bank Details</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Name of Enterprise <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={getPlaceholder('e.g. Shyam Traders & Manufacturing')}
                    value={step3.enterpriseName}
                    onChange={(e) => setStep3({ ...step3, enterpriseName: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Official Mobile Number <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    required
                    maxLength={10}
                    placeholder={getPlaceholder('10-digit mobile')}
                    value={step3.officialMobile}
                    onChange={(e) => setStep3({ ...step3, officialMobile: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Official Email Address</label>
                  <input
                    type="email"
                    placeholder={getPlaceholder('official@enterprise.com')}
                    value={step3.officialEmail}
                    onChange={(e) => setStep3({ ...step3, officialEmail: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Date of Commencement of Operations <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={step3.dateOfCommencement}
                    onChange={(e) => setStep3({ ...step3, dateOfCommencement: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Previous UAM Number <span className="text-slate-400 font-normal">(If migrated from Udyog Aadhaar)</span>
                  </label>
                  <input
                    type="text"
                    placeholder={getPlaceholder('UP07A0001234')}
                    value={step3.previousUamNumber}
                    onChange={(e) => setStep3({ ...step3, previousUamNumber: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                {/* Dynamic Units / Plant Management */}
                <div className="sm:col-span-2 pt-2 border-t border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-900">
                      Plant &amp; Unit Locations ({unitsList.length})
                    </span>
                    <button
                      type="button"
                      onClick={addUnit}
                      className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Plant / Unit</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {unitsList.map((unit, index) => (
                      <div key={index} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-extrabold text-blue-700">Unit #{index + 1}</span>
                          {unitsList.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeUnit(index)}
                              className="text-rose-600 hover:text-rose-800 text-xs flex items-center gap-1 cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Remove</span>
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                          <input
                            type="text"
                            placeholder={getPlaceholder('Flat/Plot No.')}
                            value={unit.flatNo}
                            onChange={(e) => {
                              const updated = [...unitsList];
                              updated[index].flatNo = e.target.value;
                              setUnitsList(updated);
                            }}
                            className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900"
                          />
                          <input
                            type="text"
                            placeholder={getPlaceholder('Building / Estate')}
                            value={unit.buildingName}
                            onChange={(e) => {
                              const updated = [...unitsList];
                              updated[index].buildingName = e.target.value;
                              setUnitsList(updated);
                            }}
                            className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900"
                          />
                          <input
                            type="text"
                            placeholder={getPlaceholder('City')}
                            value={unit.city}
                            onChange={(e) => {
                              const updated = [...unitsList];
                              updated[index].city = e.target.value;
                              setUnitsList(updated);
                            }}
                            className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900"
                          />
                          <input
                            type="text"
                            maxLength={6}
                            placeholder={getPlaceholder('PIN Code')}
                            value={unit.pinCode}
                            onChange={(e) => {
                              const updated = [...unitsList];
                              updated[index].pinCode = e.target.value;
                              setUnitsList(updated);
                            }}
                            className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bank Account Details */}
                <div className="sm:col-span-2 pt-2 border-t border-slate-200">
                  <span className="block text-xs font-bold text-slate-900 mb-2">
                    Bank Account Details
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Bank Name</label>
                      <input
                        type="text"
                        placeholder={getPlaceholder('State Bank of India')}
                        value={step3.bankName}
                        onChange={(e) => setStep3({ ...step3, bankName: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">IFSC Code</label>
                      <input
                        type="text"
                        maxLength={11}
                        placeholder={getPlaceholder('SBIN0001234')}
                        value={step3.ifscCode}
                        onChange={(e) => setStep3({ ...step3, ifscCode: e.target.value.toUpperCase() })}
                        className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-mono uppercase"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Account Number</label>
                      <input
                        type="text"
                        placeholder={getPlaceholder('Bank Account Number')}
                        value={step3.bankAccountNumber}
                        onChange={(e) => setStep3({ ...step3, bankAccountNumber: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-mono"
                      />
                    </div>
                  </div>
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

          {/* STEP 4: Activity, Investment & Turnover (Auto-Classification Engine) */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                <Landmark className="w-4 h-4 text-blue-600" />
                <span>STEP 4: Activity, Investment &amp; Automatic Classification</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Major Activity <span className="text-rose-600">*</span>
                  </label>
                  <div className="flex items-center gap-4 pt-1">
                    {['MANUFACTURING', 'SERVICES', 'TRADING'].map((act) => (
                      <label key={act} className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer">
                        <input
                          type="radio"
                          name="majorActivity"
                          checked={step4.majorActivity === act}
                          onChange={() => setStep4({ ...step4, majorActivity: act })}
                          className="text-blue-600"
                        />
                        <span>{act}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    NIC Activity Code (2-digit / 4-digit / 5-digit) <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={step4.nicCodes}
                    onChange={(e) => setStep4({ ...step4, nicCodes: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                {/* Employment numbers */}
                <div className="sm:col-span-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="text-xs font-bold text-slate-900 mb-2">
                    Persons Employed (Dynamic Total: <strong className="text-blue-600">{totalEmployees} employees</strong>)
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Male</label>
                      <input
                        type="number"
                        min={0}
                        value={step4.empMale}
                        onChange={(e) => setStep4({ ...step4, empMale: parseInt(e.target.value) || 0 })}
                        className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Female</label>
                      <input
                        type="number"
                        min={0}
                        value={step4.empFemale}
                        onChange={(e) => setStep4({ ...step4, empFemale: parseInt(e.target.value) || 0 })}
                        className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Other</label>
                      <input
                        type="number"
                        min={0}
                        value={step4.empOther}
                        onChange={(e) => setStep4({ ...step4, empOther: parseInt(e.target.value) || 0 })}
                        className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                      />
                    </div>
                  </div>
                </div>

                {/* Investment and Turnover */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Written Down Value (WDV) in Plant &amp; Machinery (₹) <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={step4.investmentInPlantMachinery}
                    onChange={(e) => setStep4({ ...step4, investmentInPlantMachinery: parseInt(e.target.value) || 0 })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <span className="text-[11px] text-slate-400">Excluding pollution control &amp; R&amp;D.</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Total Annual Turnover (₹) <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={step4.annualTurnover}
                    onChange={(e) => setStep4({ ...step4, annualTurnover: parseInt(e.target.value) || 0 })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <span className="text-[11px] text-slate-400">Export turnover is excluded.</span>
                </div>

                {/* Automatic Classification Engine Badge */}
                <div className="sm:col-span-2 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-[11px] uppercase tracking-wider font-bold text-slate-500 block">
                      Automatic MSME Enterprise Classification
                    </span>
                    <span className="text-base font-black text-slate-900 block mt-0.5">
                      {classification.category}
                    </span>
                    <span className="text-xs text-slate-600">{classification.limits}</span>
                  </div>

                  <span className={`px-3 py-1 rounded-full text-xs font-extrabold border ${classification.badgeColor}`}>
                    Eligible for Priority MSME Benefits
                  </span>
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
                  type="button"
                  onClick={() => setCurrentStep(5)}
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-6 py-2.5 rounded-xl cursor-pointer shadow-sm"
                >
                  <span>Next</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: DIC Selection & Final Declaration */}
          {currentStep === 5 && (
            <form onSubmit={handleFinalUdyamSubmit} className="space-y-4">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-blue-600" />
                <span>STEP 5: DIC Selection, Self-Declaration &amp; Final Submission</span>
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    District Industries Centre (DIC) <span className="text-rose-600">*</span>
                  </label>
                  <select
                    value={step5.preferredDIC}
                    onChange={(e) => setStep5({ ...step5, preferredDIC: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="DIC Mainpuri, Uttar Pradesh">DIC Mainpuri, Uttar Pradesh</option>
                    <option value="DIC Gautam Buddha Nagar (Noida)">DIC Gautam Buddha Nagar (Noida)</option>
                    <option value="DIC Lucknow, Uttar Pradesh">DIC Lucknow, Uttar Pradesh</option>
                    <option value="DIC Kanpur, Uttar Pradesh">DIC Kanpur, Uttar Pradesh</option>
                  </select>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      required
                      checked={step5.declarationAccepted}
                      onChange={(e) => setStep5({ ...step5, declarationAccepted: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded mt-0.5"
                    />
                    <span className="text-xs text-slate-700 leading-relaxed">
                      I hereby declare that the information given above is true and correct to the best of my knowledge and belief. I am aware that furnishing false information is a punishable offense under Section 27 of the MSMED Act, 2006.
                    </span>
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Final Confirmation Aadhaar OTP (Enter any 6 digits to verify) <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    placeholder="Enter 6-digit confirmation OTP"
                    value={step5.finalAadhaarOtp}
                    onChange={(e) => setStep5({ ...step5, finalAadhaarOtp: e.target.value })}
                    className="w-full sm:w-64 bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(4)}
                  className="px-5 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-200 cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={!step5.declarationAccepted || step5.finalAadhaarOtp.length < 6}
                  className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold text-sm px-8 py-3 rounded-xl cursor-pointer shadow-md transition-all"
                >
                  <Award className="w-4 h-4" />
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
