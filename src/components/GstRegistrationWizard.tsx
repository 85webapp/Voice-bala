import React, { useState } from 'react';
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
  MessageCircle,
  FileText,
  Lock
} from 'lucide-react';
import { SERVICE_CATEGORIES } from '../data/servicesData';
import { VoiceGuidanceButton } from './VoiceGuidanceButton';
import { useExampleDetails } from '../hooks/useExampleDetails';
import { CircleIndicator, optionCardClass } from './OptionControl';
import {
  encryptFormDataAndSign,
  saveLightweightMetadata,
  postEncryptedPayloadToWebsiteB,
  playConfirmationChime,
  generateSequentialOrderId,
  buildSubmissionOverview,
  fieldEntry,
  checkboxEntry,
  DossierSection,
  ServerBSyncResult
} from '../services/encryptionService';
import { ServerBSyncStatusCard } from './ServerBSyncStatusCard';
import { showToast } from '../services/toastService';
import { AddressFieldGroup } from './AddressFieldGroup';
import { FormRequestTabBar, HorizontalSwipeContainer, WizardModeTab } from './FormRequestTabBar';
import { QuickCallbackRequestPanel } from './QuickCallbackRequestPanel';
import { WhiteSelect } from './WhiteSelect';

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
  const [activeTab, setActiveTab] = useState<WizardModeTab>('form');
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [arnNumber, setArnNumber] = useState('');
  const [serverBSyncResult, setServerBSyncResult] = useState<ServerBSyncResult | null>(null);
  const [isRetryingSync, setIsRetryingSync] = useState(false);
  const [cachedEncPayload, setCachedEncPayload] = useState<{ result: any; metadata: any } | null>(null);

  const handleRetryServerBSync = async () => {
    if (!cachedEncPayload) return;
    setIsRetryingSync(true);
    try {
      const retryRes = await postEncryptedPayloadToWebsiteB(cachedEncPayload.result, cachedEncPayload.metadata);
      setServerBSyncResult(retryRes);
    } finally {
      setIsRetryingSync(false);
    }
  };

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



  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(step1.email.trim())) {
      showToast('Please enter a valid Business Email Address in Step 1.', 'warning');
      setCurrentStep(1);
      return;
    }
    if (step1.phone.replace(/\D/g, '').length !== 10) {
      showToast('Please enter a valid 10-digit business mobile number in Step 1.', 'warning');
      setCurrentStep(1);
      return;
    }
    if (isSoleProp) {
      if (!emailRegex.test(proprietor.email.trim())) {
        showToast('Please enter a valid Proprietor Email Address in Step 2.', 'warning');
        setCurrentStep(2);
        return;
      }
      if (proprietor.pan.trim().length !== 10) {
        showToast('Please enter a valid 10-character Proprietor PAN Card Number in Step 2.', 'warning');
        setCurrentStep(2);
        return;
      }
    }
    if (!isSoleProp) {
      const invalidPartner = partners.find((p) => p.mobile.trim().length > 0 && p.mobile.replace(/\D/g, '').length !== 10);
      if (invalidPartner) {
        showToast('Each Partner/Director mobile number must be exactly 10 digits.', 'warning');
        setCurrentStep(2);
        return;
      }
      const missingPartnerEmail = partners.find((p) => !emailRegex.test(p.email.trim()));
      if (missingPartnerEmail) {
        showToast('Please enter a valid Email Address for every Partner / Director in Step 2.', 'warning');
        setCurrentStep(2);
        return;
      }
    }
    const orderId = generateSequentialOrderId();
    const now = new Date();
    setArnNumber(orderId);

    const registrationServices = SERVICE_CATEGORIES.find((c) => c.id === 'registrations')?.services || [];
    const constitutionOptions = ['Sole Proprietorship', 'Partnership', 'Private Limited Company', 'LLP', 'HUF / Society / Trust / Others'];
    const districtOptions = SAMPLE_DISTRICTS[step1.state] || ['Mainpuri', 'Central', 'HQ District'];
    const possessionOptions = ['Own', 'Rented / Leased', 'Consent / Shared', 'Other'];
    const activityOptions = [
      'Retail Business',
      'Wholesale',
      'Manufacturing',
      'Warehouse / Storage',
      'Supply of Services',
      'Office / Other'
    ];

    const submissionOverview = buildSubmissionOverview({
      orderId,
      requestType: 'Registration Request (Full 4-Step GST Form)',
      mainCategory: 'Registrations',
      subCategory: 'GST Registration',
      availableCategories: SERVICE_CATEGORIES.map((c) => c.title),
      availableSubCategories: registrationServices,
      documentTitle: 'GST Registration',
      date: now
    });

    const isSole = step1.constitution === 'Sole Proprietorship';
    const sections: DossierSection[] = [
      {
        pageNumber: 1,
        sectionTitle: 'Step 1: Basic Business Details',
        fields: [
          fieldEntry('State', step1.state, false, INDIAN_STATES),
          fieldEntry('District', step1.district, false, districtOptions),
          fieldEntry('Legal Name of Business (As per PAN)', step1.legalName, false),
          fieldEntry('Business PAN Number', step1.pan, false),
          fieldEntry('Business Email Address', step1.email, false),
          fieldEntry('Business Mobile Number', step1.phone, false),
          fieldEntry('Constitution of Business', step1.constitution, false, constitutionOptions)
        ]
      },
      {
        pageNumber: 2,
        sectionTitle: isSole ? 'Step 2: Sole Proprietor Details' : 'Step 2: Partners / Directors Details',
        fields: isSole
          ? [
              fieldEntry('Proprietor Full Name', proprietor.fullName, false),
              fieldEntry("Proprietor Father's Name", proprietor.fatherName, false),
              fieldEntry('Date of Birth', proprietor.dob, true),
              fieldEntry('Gender', proprietor.gender, false, ['Male', 'Female', 'Other']),
              fieldEntry('Proprietor Mobile', proprietor.mobile, true),
              fieldEntry('Proprietor Email', proprietor.email, false),
              fieldEntry('Proprietor PAN', proprietor.pan, false),
              fieldEntry('Residential Address', proprietor.address, false),
              fieldEntry('Residential PIN Code', proprietor.pinCode, true),
              fieldEntry('Address Proof Type', proprietor.addressProofType, true),
              checkboxEntry('Proprietor is the Primary Authorized Signatory', proprietor.isAuthorizedSignatory, true),
              fieldEntry('Separate Authorized Signatory Name', proprietor.isAuthorizedSignatory ? '' : proprietor.authSignatoryName, true),
              fieldEntry('Separate Authorized Signatory PAN', proprietor.isAuthorizedSignatory ? '' : proprietor.authSignatoryPan, true)
            ]
          : partners.flatMap((p, idx) => [
              fieldEntry(`Partner/Director #${idx + 1} Full Name`, p.fullName, true),
              fieldEntry(`Partner/Director #${idx + 1} Designation`, p.designation, true),
              fieldEntry(`Partner/Director #${idx + 1} DIN / PAN`, p.dinPan, true),
              fieldEntry(`Partner/Director #${idx + 1} Mobile`, p.mobile, true),
              fieldEntry(`Partner/Director #${idx + 1} Email`, p.email, false),
              checkboxEntry(`Partner/Director #${idx + 1} Is Authorized Signatory`, p.isAuthorizedSignatory, true)
            ])
      },
      {
        pageNumber: 3,
        sectionTitle: 'Step 3: Principal & Additional Place of Business',
        fields: [
          fieldEntry('Building / Flat / Premises No.', step3.buildingNo, false),
          fieldEntry('Road / Street / Lane', step3.street, false),
          fieldEntry('Locality / Sub-Locality', step3.locality, true),
          fieldEntry('City / Town / Village', step3.city, false),
          fieldEntry('Premises PIN Code', step3.pinCode, false),
          fieldEntry('Office Landline', step3.officeLandline, true),
          fieldEntry('Office Email', step3.officeEmail, true),
          fieldEntry('Nature of Possession', step3.natureOfPossession, false, possessionOptions),
          ...activityOptions.map((act) =>
            checkboxEntry(`Business Activity — ${act}`, step3.activities.includes(act), true)
          ),
          checkboxEntry('Are there any additional places of business (APOB)?', step3.hasAdditionalPlace, true),
          fieldEntry('Additional Place Address', step3.hasAdditionalPlace ? step3.additionalAddress : '', true),
          fieldEntry('Additional Place Possession Nature', step3.hasAdditionalPlace ? step3.additionalPossession : '', true, possessionOptions)
        ]
      },
      {
        pageNumber: 4,
        sectionTitle: 'Step 4: Goods/Services & Bank Account',
        fields: [
          fieldEntry('Top Commodities / HSN / SAC Description', step4.topCommoditiesDescription, false),
          fieldEntry('Bank Account Number', step4.accountNumber, false),
          fieldEntry('IFSC Code', step4.ifscCode, false),
          fieldEntry('Bank Name', step4.bankName, true),
          fieldEntry('Branch Name', step4.branchName, true),
          fieldEntry('Professional Tax / Shop & Establishment Act Reg. No.', step4.ptinOrShopAct, true)
        ]
      }
    ];

    // 1. Zero-Database Client-Side Encryption
    const sensitiveData = {
      orderId,
      submissionOverview,
      sections,
      service: 'GST Registration',
      category: 'Registrations',
      step1,
      proprietor: isSole ? proprietor : undefined,
      partners: !isSole ? partners : undefined,
      step2: isSole ? proprietor : partners,
      step3,
      step4,
      timestamp: now.toISOString()
    };
    const encResult = encryptFormDataAndSign(sensitiveData);

    // 2. Save ONLY 4 lightweight metadata fields in Supabase
    const metadata = {
      firstPartyName: step1.legalName || proprietor.fullName || 'GST Applicant',
      formName: 'GST Registration',
      timestamp: now.toISOString(),
      totalPrice: '0',
      orderId
    };
    await saveLightweightMetadata(metadata);

    // 3. Directly POST encrypted ciphertext & HMAC signature to Website B API with try...catch
    const syncRes = await postEncryptedPayloadToWebsiteB(encResult, metadata);
    setServerBSyncResult(syncRes);
    setCachedEncPayload({ result: encResult, metadata });

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

          {/* Server B Real-Time Sync Status (Try...Catch with Green / Red Exact Error Display) */}
          <div className="max-w-md mx-auto text-left">
            <ServerBSyncStatusCard
              syncResult={serverBSyncResult}
              isRetrying={isRetryingSync}
              onRetry={handleRetryServerBSync}
            />
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

      {/* Mode Switcher (Page 1 only) */}
      {(currentStep === 1 || activeTab === 'request') && (
        <FormRequestTabBar activeTab={activeTab} onChangeTab={setActiveTab} className="mb-6" />
      )}

      <HorizontalSwipeContainer activeTab={activeTab} onChangeTab={setActiveTab}>
      {/* TAB 2: Upgraded Quick Callback Request */}
      {activeTab === 'request' ? (
        <QuickCallbackRequestPanel
          mode="registration"
          initialItemTitle="GST Registration"
          categoryLabel="Registrations"
          onBack={onBack}
          onSwitchToForm={() => setActiveTab('form')}
        />
      ) : (
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
                  <WhiteSelect
                    variant="compact"
                    value={step1.state}
                    onChange={(val) => setStep1({ ...step1, state: val })}
                    options={INDIAN_STATES}
                    aria-label="State"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    District <span className="text-rose-600">*</span>
                  </label>
                  <WhiteSelect
                    variant="compact"
                    value={step1.district}
                    onChange={(val) => setStep1({ ...step1, district: val })}
                    options={SAMPLE_DISTRICTS[step1.state] || ['Mainpuri', 'Central', 'HQ District']}
                    aria-label="District"
                  />
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
                    inputMode="numeric"
                    required
                    maxLength={10}
                    placeholder={getPlaceholder('10-digit mobile')}
                    value={step1.phone}
                    onChange={(e) => setStep1({ ...step1, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Constitution of Business <span className="text-rose-600">*</span>
                  </label>
                  <WhiteSelect
                    value={step1.constitution}
                    onChange={(val) =>
                      setStep1({
                        ...step1,
                        constitution: val as any
                      })
                    }
                    options={[
                      'Sole Proprietorship',
                      'Partnership',
                      'Private Limited Company',
                      'LLP',
                      'HUF / Society / Trust / Others'
                    ]}
                    aria-label="Constitution of Business"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    ⚡ {isSoleProp ? 'Sole Proprietorship requires single proprietor KYC in Step 2.' : 'Partnership/Company requires multiple Partner/Director details in Step 2.'}
                  </p>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(step1.email.trim())) {
                      showToast('Please enter a valid Email Address.', 'warning');
                      return;
                    }
                    if (step1.phone.replace(/\D/g, '').length !== 10) {
                      showToast('Please enter a valid 10-digit mobile number.', 'warning');
                      return;
                    }
                    setCurrentStep(2);
                  }}
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
                    <WhiteSelect
                      variant="compact"
                      value={proprietor.gender}
                      onChange={(val) => setProprietor({ ...proprietor, gender: val })}
                      options={['Male', 'Female', 'Other']}
                      aria-label="Gender"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Proprietor Email Address <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder={getPlaceholder('proprietor@business.com')}
                      value={proprietor.email}
                      onChange={(e) => setProprietor({ ...proprietor, email: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Proprietor PAN Card Number <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={10}
                      placeholder={getPlaceholder('ABCDE1234F')}
                      value={proprietor.pan}
                      onChange={(e) =>
                        setProprietor({
                          ...proprietor,
                          pan: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10)
                        })
                      }
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-mono uppercase text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <AddressFieldGroup
                      label="Residential Address"
                      variant="standard"
                      defaultState={step1.state || 'Uttar Pradesh'}
                      value={proprietor.address}
                      onChangeAddress={(fullAddr, details) =>
                        setProprietor((prev) => ({
                          ...prev,
                          address: fullAddr,
                          pinCode: details?.pincode || prev.pinCode
                        }))
                      }
                      required
                    />
                  </div>

                  <div className="sm:col-span-2 p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <label className={optionCardClass(proprietor.isAuthorizedSignatory)}>
                      <input
                        type="checkbox"
                        checked={proprietor.isAuthorizedSignatory}
                        onChange={(e) => setProprietor({ ...proprietor, isAuthorizedSignatory: e.target.checked })}
                        className="sr-only"
                      />
                      <CircleIndicator checked={proprietor.isAuthorizedSignatory} />
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

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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
                            inputMode="numeric"
                            maxLength={10}
                            placeholder={getPlaceholder('10-digit mobile')}
                            value={partner.mobile}
                            onChange={(e) => {
                              const updated = [...partners];
                              updated[index].mobile = e.target.value.replace(/\D/g, '').slice(0, 10);
                              setPartners(updated);
                            }}
                            className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Email Address <span className="text-rose-600">*</span>
                          </label>
                          <input
                            type="email"
                            required
                            placeholder={getPlaceholder('partner@company.com')}
                            value={partner.email}
                            onChange={(e) => {
                              const updated = [...partners];
                              updated[index].email = e.target.value;
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
                  onClick={() => {
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (isSoleProp) {
                      if (!emailRegex.test(proprietor.email.trim())) {
                        showToast('Please enter a valid Proprietor Email Address.', 'warning');
                        return;
                      }
                      if (proprietor.pan.trim().length !== 10) {
                        showToast('Please enter a valid 10-character Proprietor PAN Card Number.', 'warning');
                        return;
                      }
                    }
                    if (!isSoleProp) {
                      const invalidPartner = partners.find((p) => p.mobile.trim().length > 0 && p.mobile.replace(/\D/g, '').length !== 10);
                      if (invalidPartner) {
                        showToast('Partner/Director mobile number must be exactly 10 digits.', 'warning');
                        return;
                      }
                      const missingPartnerEmail = partners.find((p) => !emailRegex.test(p.email.trim()));
                      if (missingPartnerEmail) {
                        showToast('Please enter a valid Email Address for every Partner / Director.', 'warning');
                        return;
                      }
                    }
                    setCurrentStep(3);
                  }}
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
                <div className="sm:col-span-2">
                  <AddressFieldGroup
                    label="Principal Place of Business Address"
                    variant="property"
                    defaultState={step1.state || 'Uttar Pradesh'}
                    onChangeAddress={(_, details) =>
                      setStep3((prev) => ({
                        ...prev,
                        buildingNo: details?.flatBuilding || '',
                        street: details?.areaStreet || '',
                        locality: details?.areaOrSociety || '',
                        city: details?.city || '',
                        pinCode: details?.pincode || ''
                      }))
                    }
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nature of Possession of Premises <span className="text-rose-600">*</span>
                  </label>
                  <WhiteSelect
                    value={step3.natureOfPossession}
                    onChange={(val) => setStep3({ ...step3, natureOfPossession: val })}
                    options={[
                      { value: 'Own', label: 'Own → Electricity Bill + Registry Copy' },
                      { value: 'Rented / Leased', label: 'Rented / Leased → Rent Agreement + Electricity Bill + NOC' },
                      { value: 'Consent / Shared', label: 'Consent / Shared → Consent Letter + Owner ID + Electricity Bill' },
                      { value: 'Other', label: 'Other → Other documents' }
                    ]}
                    aria-label="Nature of Possession of Premises"
                  />
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
                    ].map((act) => {
                      const active = step3.activities.includes(act);
                      return (
                        <label key={act} className={optionCardClass(active, 'p-2')}>
                          <input
                            type="checkbox"
                            checked={active}
                            onChange={() => toggleActivity(act)}
                            className="sr-only"
                          />
                          <CircleIndicator checked={active} />
                          <span className="font-semibold text-slate-800">{act}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Additional Place of Business Toggle */}
                <div className="sm:col-span-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <label className={optionCardClass(step3.hasAdditionalPlace, 'justify-between')}>
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        Are there any additional places of business (APOB)?
                      </div>
                      <div className="text-[11px] font-normal text-slate-500">
                        Check if you have any godown, branch, or factory outside the principal office
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={step3.hasAdditionalPlace}
                      onChange={(e) => setStep3({ ...step3, hasAdditionalPlace: e.target.checked })}
                      className="sr-only"
                    />
                    <CircleIndicator checked={step3.hasAdditionalPlace} />
                  </label>

                  {step3.hasAdditionalPlace && (
                    <div className="mt-3 pt-3 border-t border-slate-200">
                      <AddressFieldGroup
                        label="Additional Godown / Branch Address"
                        variant="property"
                        defaultState={step1.state || 'Uttar Pradesh'}
                        value={step3.additionalAddress}
                        onChangeAddress={(fullAddr) =>
                          setStep3((prev) => ({ ...prev, additionalAddress: fullAddr }))
                        }
                        required={false}
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
                  onClick={() => {
                    if (!step3.buildingNo.trim() || !step3.street.trim() || !step3.city.trim() || step3.pinCode.replace(/\D/g, '').length !== 6) {
                      showToast('Please complete Principal Place of Business Address (including 6-digit PIN Code).', 'warning');
                      return;
                    }
                    setCurrentStep(4);
                  }}
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
                        ✅ <strong>Mobile &amp; Email OTP Verification:</strong> Sole Proprietorship is verified via instantaneous OTP sent to registered mobile number ({step1.phone || '9999999999'}) and email.
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
      </HorizontalSwipeContainer>
    </div>
  );
};
