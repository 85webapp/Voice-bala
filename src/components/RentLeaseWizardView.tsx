import React, { useState, useMemo, useEffect } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Home,
  ShieldCheck,
  Truck,
  Download,
  Plus,
  Trash2,
  Sparkles,
  UploadCloud,
  Layers,
  Volume2,
  VolumeX,
  Play,
  Square
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { LegalDocument, OrderItem } from '../types';
import { STATE_CATEGORIES, getSafeStampDuty } from '../data/stampDutyMatrix';
import { DateOfBirthPicker } from './DateOfBirthPicker';
import { useExampleDetails } from '../hooks/useExampleDetails';
import {
  SUPPORTED_LANGUAGES,
  SupportedLanguage,
  speechController,
  fetchPageExplanation,
  fetchFieldExplanation,
  getVisibleFormLabels,
  getVisibleFieldLabel,
  getStoredAudioLanguage,
  setStoredAudioLanguage
} from '../data/voiceNarrationData';
import { AadhaarInput } from './AadhaarInput';
import { AddressFieldGroup } from './AddressFieldGroup';
import {
  encryptFormDataAndSign,
  saveLightweightMetadata,
  postEncryptedPayloadToWebsiteB,
  playConfirmationChime,
  generateSequentialOrderId,
  ServerBSyncResult
} from '../services/encryptionService';
import { ExternalLink, Lock } from 'lucide-react';
import { showToast } from '../services/toastService';
import { ServerBSyncStatusCard } from './ServerBSyncStatusCard';

interface RentLeaseWizardViewProps {
  document: LegalDocument;
  onBack: () => void;
  onOrderCreated: (order: OrderItem) => void;
  onNavigateToDashboard: () => void;
}

interface CoOwner {
  id: string;
  name: string;
  fatherName: string;
  age: string;
  address: string;
  mobile: string;
  email: string;
  aadhaarLast4: string;
  pan: string;
}

interface CoOccupant {
  id: string;
  fullName: string;
  age: string;
  relationship: string;
}

interface CustomClause {
  id: string;
  title: string;
  description: string;
}

export const RentLeaseWizardView: React.FC<RentLeaseWizardViewProps> = ({
  document: initialDoc,
  onBack,
  onOrderCreated,
  onNavigateToDashboard
}) => {
  const { showExampleDetails, getPlaceholder } = useExampleDetails();
  const [currentPage, setCurrentPage] = useState<number>(1);

  // --- AUDIO EXPLAINER & LANGUAGE STATE ---
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

  // Stop audio whenever page changes
  useEffect(() => {
    speechController.stop();
  }, [currentPage]);

  const activeLangConfig = useMemo(() => {
    return SUPPORTED_LANGUAGES.find((l) => l.code === selectedLang) || SUPPORTED_LANGUAGES[0];
  }, [selectedLang]);

  // Gemini-generated page summary and contextual field guidance.
  const handlePlayPageSpeech = async () => {
    if (isAudioPlaying) { speechController.stop(); return; }
    const fields = getVisibleFormLabels();
    const explanation = await fetchPageExplanation(initialDoc.title, currentPage, `Page ${currentPage}`, fields, selectedLang);
    if (explanation) speechController.speak(explanation, activeLangConfig.speechCode);
  };

  const handlePlayFieldSpeech = async (fieldKey: string) => {
    const label = getVisibleFieldLabel(fieldKey);
    const context = getVisibleFormLabels().join('; ');
    const explanation = await fetchFieldExplanation(initialDoc.title, fieldKey, label, context, selectedLang);
    if (explanation) speechController.speak(explanation, activeLangConfig.speechCode);
  };

  // --- PAGE 1: SERVICE & STAMP SELECTION ---
  const [docCategory, setDocCategory] = useState<'residential' | 'commercial'>(() => {
    const lower = initialDoc.title.toLowerCase();
    if (lower.includes('commercial') || lower.includes('business')) return 'commercial';
    return 'residential';
  });

  const [selectedState, setSelectedState] = useState<string>('Delhi');
  const [tenancyPurpose, setTenancyPurpose] = useState<'residential' | 'commercial' | 'mixed'>(
    docCategory === 'commercial' ? 'commercial' : 'residential'
  );
  const [mixedUseArea, setMixedUseArea] = useState('');
  const [stampProcurementMode, setStampProcurementMode] = useState<'estamp' | 'physical_upload'>('estamp');
  const [physicalStampUploaded, setPhysicalStampUploaded] = useState(false);

  const [stampValue, setStampValue] = useState<number>(100);
  const [customStampValue, setCustomStampValue] = useState('');
  const [stampCostBorneBy, setStampCostBorneBy] = useState<string>('Shared Equally (50-50 Split)');
  const [customSplitText, setCustomSplitText] = useState('');

  // Sync tenancy purpose when category changes
  useEffect(() => {
    if (docCategory === 'commercial' && tenancyPurpose === 'residential') {
      setTenancyPurpose('commercial');
    } else if (docCategory === 'residential' && tenancyPurpose === 'commercial') {
      setTenancyPurpose('residential');
    }
  }, [docCategory]);

  const recommendedMinStamp = useMemo(() => {
    const docTitle = docCategory === 'commercial' ? 'Commercial Lease Agreement' : 'Residential Rent Agreement';
    return getSafeStampDuty(docTitle, selectedState);
  }, [docCategory, selectedState]);

  const isStampBelowThreshold = useMemo(() => {
    const effectiveValue = stampValue === -1 ? Number(customStampValue) || 0 : stampValue;
    return effectiveValue < recommendedMinStamp;
  }, [stampValue, customStampValue, recommendedMinStamp]);

  // --- PAGE 2: FIRST PARTY / LANDLORD DETAILS ---
  const [landlordEntityType, setLandlordEntityType] = useState<
    'Individual' | 'Joint Owners' | 'Partnership Firm / LLP' | 'Private Limited / Public Limited Company' | 'HUF' | 'Trust / Society'
  >('Individual');

  const [coOwners, setCoOwners] = useState<CoOwner[]>([]);

  // Individual Landlord fields (All blank by default)
  const [landlordName, setLandlordName] = useState('');
  const [landlordFatherName, setLandlordFatherName] = useState('');
  const [landlordDobOrAge, setLandlordDobOrAge] = useState('');
  const [landlordAddress, setLandlordAddress] = useState('');
  const [landlordMobile, setLandlordMobile] = useState('');
  const [landlordEmail, setLandlordEmail] = useState('');
  const [landlordAadhaarLast4, setLandlordAadhaarLast4] = useState('');
  const [landlordPan, setLandlordPan] = useState('');

  const STANDARD_DESIGNATIONS = [
    'Authorized Signatory',
    'Managing Director',
    'Director',
    'Proprietor',
    'Partner',
    'POA Holder',
    'Other'
  ];

  // Strict 10-char PAN input sanitization
  const handlePanInput = (raw: string, setter: (val: string) => void) => {
    const sanitized = raw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
    setter(sanitized);
  };

  // Corporate Landlord fields
  const [corporateRegNumber, setCorporateRegNumber] = useState('');
  const [corporateAddress, setCorporateAddress] = useState('');
  const [authSignatoryName, setAuthSignatoryName] = useState('');
  const [authSignatoryDesignation, setAuthSignatoryDesignation] = useState('Authorized Signatory');
  const [authSignatoryCustomDesignation, setAuthSignatoryCustomDesignation] = useState('');

  // POA Holder fields
  const [hasPoa, setHasPoa] = useState(false);
  const [poaName, setPoaName] = useState('');
  const [poaAadhaarLast4, setPoaAadhaarLast4] = useState('');
  const [poaAddress, setPoaAddress] = useState('');
  const [poaFileUploaded, setPoaFileUploaded] = useState(false);

  // Property Proof
  const [ownershipProofType, setOwnershipProofType] = useState<string>('Electricity Bill');
  const [propertyDocUploaded, setPropertyDocUploaded] = useState(false);

  const addCoOwner = () => {
    setCoOwners((prev) => [
      ...prev,
      {
        id: `co-${Date.now()}`,
        name: '',
        fatherName: '',
        age: '',
        address: '',
        mobile: '',
        email: '',
        aadhaarLast4: '',
        pan: ''
      }
    ]);
  };

  const updateCoOwner = (id: string, field: keyof CoOwner, val: string) => {
    setCoOwners((prev) => prev.map((c) => (c.id === id ? { ...c, [field]: val } : c)));
  };

  const removeCoOwner = (id: string) => {
    setCoOwners((prev) => prev.filter((c) => c.id !== id));
  };

  // --- PAGE 3: SECOND PARTY / TENANT DETAILS ---
  // CASE A: Residential (All blank by default)
  const [tenantName, setTenantName] = useState('');
  const [tenantFatherName, setTenantFatherName] = useState('');
  const [tenantAge, setTenantAge] = useState('');
  const [tenantAddress, setTenantAddress] = useState('');
  const [tenantMobile, setTenantMobile] = useState('');
  const [tenantEmail, setTenantEmail] = useState('');
  const [tenantAadhaarLast4, setTenantAadhaarLast4] = useState('');
  const [tenantPan, setTenantPan] = useState('');
  const [coOccupants, setCoOccupants] = useState<CoOccupant[]>([]);

  const addCoOccupant = () => {
    setCoOccupants((prev) => [
      ...prev,
      {
        id: `occ-${Date.now()}`,
        fullName: '',
        age: '',
        relationship: ''
      }
    ]);
  };

  const updateCoOccupant = (id: string, field: keyof CoOccupant, val: string) => {
    setCoOccupants((prev) => prev.map((o) => (o.id === id ? { ...o, [field]: val } : o)));
  };

  const removeCoOccupant = (id: string) => {
    setCoOccupants((prev) => prev.filter((c) => c.id !== id));
  };

  // CASE B: Commercial Tenancy (All blank by default)
  const [commercialEntityType, setCommercialEntityType] = useState<string>('Private Limited Company');
  const [commercialCompanyName, setCommercialCompanyName] = useState('');
  const [commercialOfficeAddress, setCommercialOfficeAddress] = useState('');
  const [commercialCin, setCommercialCin] = useState('');
  const [commercialCompanyPan, setCommercialCompanyPan] = useState('');
  const [commercialRepName, setCommercialRepName] = useState('');
  const [commercialRepDesignation, setCommercialRepDesignation] = useState('Authorized Signatory');
  const [commercialRepCustomDesignation, setCommercialRepCustomDesignation] = useState('');
  const [authDocUploaded, setAuthDocUploaded] = useState(false);
  const [commercialGstin, setCommercialGstin] = useState('');
  const [isUnregisteredGst, setIsUnregisteredGst] = useState(false);

  // --- PAGE 4: LEASE TERMS & STATUTORY CONDITIONS ---
  const [leaseTenure, setLeaseTenure] = useState<string>('11 Months');
  const [customTenure, setCustomTenure] = useState('');
  const [commencementDate, setCommencementDate] = useState('');
  const [monthlyRent, setMonthlyRent] = useState<string>('');
  const [rentDueDate, setRentDueDate] = useState<string>('5th of every calendar month');
  const [securityDeposit, setSecurityDeposit] = useState<string>('');
  const [noticePeriod, setNoticePeriod] = useState<string>('1 Month');
  const [paymentChannel, setPaymentChannel] = useState<string>('Bank Transfer (NEFT/RTGS/IMPS/UPI)');

  // Commercial Configurations
  const [rentEscalation, setRentEscalation] = useState<string>('5% Annually');
  const [customEscalation, setCustomEscalation] = useState('');
  const [lockInPeriod, setLockInPeriod] = useState<string>('6 Months');
  const [delayedRentInterest, setDelayedRentInterest] = useState<string>('12% Per Annum');

  // Statutory Clauses
  const [maintenanceBearer, setMaintenanceBearer] = useState<'tenant' | 'landlord'>('tenant');
  const [clauseUtility, setClauseUtility] = useState(true);
  const [clauseStructural, setClauseStructural] = useState(true);
  const [clauseSubletting, setClauseSubletting] = useState(true);
  const [clauseInspection, setClauseInspection] = useState(true);
  const [clauseForceMajeure, setClauseForceMajeure] = useState(true);

  // Custom Clauses
  const [customClauses, setCustomClauses] = useState<CustomClause[]>([]);

  const addCustomClause = () => {
    setCustomClauses((prev) => [
      ...prev,
      {
        id: `cl-${Date.now()}`,
        title: '',
        description: ''
      }
    ]);
  };

  const updateCustomClause = (id: string, field: 'title' | 'description', val: string) => {
    setCustomClauses((prev) => prev.map((c) => (c.id === id ? { ...c, [field]: val } : c)));
  };

  const removeCustomClause = (id: string) => {
    setCustomClauses((prev) => prev.filter((c) => c.id !== id));
  };

  // Statutory Warnings
  const isTenureLongTerm = useMemo(() => {
    if (leaseTenure === '22 Months' || leaseTenure === '33 Months') return true;
    if (leaseTenure === 'Custom Tenure') {
      const num = parseInt(customTenure, 10);
      return !isNaN(num) && num >= 12;
    }
    return false;
  }, [leaseTenure, customTenure]);

  const numericRent = Number(monthlyRent) || 0;
  const numericDeposit = Number(securityDeposit) || 0;

  const mtaCapExceeded = useMemo(() => {
    if (numericRent <= 0 || numericDeposit <= 0) return null;
    if (docCategory === 'residential') {
      const maxAllowed = numericRent * 2;
      return numericDeposit > maxAllowed ? { maxAllowed, type: 'residential' } : null;
    } else {
      const maxAllowed = numericRent * 6;
      return numericDeposit > maxAllowed ? { maxAllowed, type: 'commercial' } : null;
    }
  }, [docCategory, numericRent, numericDeposit]);

  const isPanMandatoryUnder194IB = useMemo(() => {
    if (docCategory === 'commercial') return true;
    return numericRent >= 50000;
  }, [docCategory, numericRent]);

  // --- PAGE 5: WITNESS DETAILS & EXECUTION FORMAT ---
  const [w1Name, setW1Name] = useState('');
  const [w1FatherName, setW1FatherName] = useState('');
  const [w1Address, setW1Address] = useState('');
  const [w1Mobile, setW1Mobile] = useState('');
  const [w1Age, setW1Age] = useState('');
  const [w1IdNumber, setW1IdNumber] = useState('');

  const [w2Name, setW2Name] = useState('');
  const [w2FatherName, setW2FatherName] = useState('');
  const [w2Address, setW2Address] = useState('');
  const [w2Mobile, setW2Mobile] = useState('');
  const [w2Age, setW2Age] = useState('');
  const [w2IdNumber, setW2IdNumber] = useState('');

  const [executionMode, setExecutionMode] = useState<'digital' | 'physical' | 'hybrid'>('digital');
  const [shippingAddress, setShippingAddress] = useState('');
  const [shippingPincode, setShippingPincode] = useState('');
  const [shippingPhone, setShippingPhone] = useState('');

  // Verification Mode: 'self' (₹0) vs 'expert' (+₹10)
  const [verificationMode, setVerificationMode] = useState<'self' | 'expert'>('self');

  // 5 Legal Declaration Checkboxes
  const [declarations, setDeclarations] = useState<boolean[]>([false, false, false, false, false]);
  const [isSpeakingDeclarations, setIsSpeakingDeclarations] = useState(false);

  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedOrder, setSubmittedOrder] = useState<OrderItem | null>(null);
  const [submissionSecurityDetails, setSubmissionSecurityDetails] = useState<{
    encryptedPayload: string;
    signature: string;
    websiteBUrl: string;
  } | null>(null);
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

  // Toggle all 5 declarations
  const handleToggleAllDeclarations = () => {
    const allChecked = declarations.every(Boolean);
    setDeclarations([!allChecked, !allChecked, !allChecked, !allChecked, !allChecked]);
  };

  // TTS Readout of 5 Declarations
  const handlePlayDeclarationsSpeech = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    if (isSpeakingDeclarations) {
      window.speechSynthesis.cancel();
      setIsSpeakingDeclarations(false);
      return;
    }
    window.speechSynthesis.cancel();
    const declarationText = [
      "किराया अनुबंध कानूनी घोषणाएँ:",
      "पहला: मैंने रेंट एग्रीमेंट के सभी नियम व शर्तें ध्यानपूर्वक पढ़ ली हैं और मैं इनसे पूर्णतः सहमत हूँ।",
      "दूसरा: प्रस्तुत की गई मकान मालिक, किरायेदार और गवाहों की व्यक्तिगत पहचान व पते की जानकारी पूर्णतः सत्य और प्रामाणिक है।",
      "तीसरा: इस विलेख का निष्पादन बिना किसी दबाव, कपट अथवा अनुचित प्रभाव के स्वतंत्र सहमति से किया जा रहा है।",
      "चौथा: राज्य सरकार की स्टाम्प ड्यूटी एवं ई-हस्ताक्षर नियमों के अनुपालन की पूरी ज़िम्मेदारी पक्षों की है।",
      "पाँचवाँ: मैं पुष्टि करता हूँ कि दस्तावेज़ डिलीवरी के पश्चात देय राशि का भुगतान नियमानुसार करूँगा।"
    ].join(" ");

    const utterance = new SpeechSynthesisUtterance(declarationText);
    utterance.lang = 'hi-IN';
    utterance.rate = 1.3;
    utterance.onend = () => setIsSpeakingDeclarations(false);
    utterance.onerror = () => setIsSpeakingDeclarations(false);
    setIsSpeakingDeclarations(true);
    window.speechSynthesis.speak(utterance);
  };

  // Pricing Calculation
  const pricing = useMemo(() => {
    const effectiveStamp = stampValue === -1 ? Number(customStampValue) || 100 : stampValue;
    const eSign = 70;
    const govtPurchasing = 40;
    const platformFee = 49;
    const courierFee = executionMode === 'digital' ? 0 : 50;
    const expertFee = verificationMode === 'expert' ? 10 : 0;

    const rawTotal = effectiveStamp + eSign + govtPurchasing + platformFee + courierFee + expertFee;
    const remainder = rawTotal % 10;
    const totalPayable = remainder === 9 ? rawTotal : rawTotal + ((9 - remainder + 10) % 10);

    return {
      effectiveStamp,
      eSign,
      govtPurchasing,
      platformFee,
      courierFee,
      expertFee,
      totalPayable
    };
  }, [stampValue, customStampValue, executionMode, verificationMode]);

  // Validation
  const validateAndProceed = (targetNext: number) => {
    if (currentPage === 1) {
      if (tenancyPurpose === 'mixed' && !mixedUseArea.trim()) {
        showToast('Please specify the dedicated commercial area for mixed-use tenancy.', 'warning');
        return;
      }
      if (stampProcurementMode === 'physical_upload' && !physicalStampUploaded) {
        showToast('Please attach or upload your pre-purchased physical stamp paper document.', 'warning');
        return;
      }
    }

    if (currentPage === 2) {
      const isCorp = landlordEntityType !== 'Individual' && landlordEntityType !== 'Joint Owners';
      if (!isCorp) {
        if (!landlordName.trim() || !landlordAddress.trim() || !landlordMobile.trim()) {
          showToast('Please fill mandatory Landlord Name, Address, and Mobile Number.', 'warning');
          return;
        }
      } else {
        if (!landlordName.trim() || !corporateAddress.trim() || !authSignatoryName.trim()) {
          showToast('Please fill Entity Name, Registered Address, and Authorized Signatory details.', 'warning');
          return;
        }
      }

      if (isPanMandatoryUnder194IB && !landlordPan.trim()) {
        showToast(
          docCategory === 'commercial'
            ? 'Commercial lease agreements require a mandatory Landlord PAN for tax audit compliance.'
            : 'Under Section 194-IB of the Income Tax Act, Monthly Rent is ₹50,000 or above, making Landlord PAN mandatory.',
          'warning'
        );
        return;
      }

      if (hasPoa && (!poaName.trim() || !poaAddress.trim())) {
        showToast('Please provide Power of Attorney holder name and address.', 'warning');
        return;
      }
    }

    if (currentPage === 3) {
      if (docCategory === 'residential') {
        if (!tenantName.trim() || !tenantAddress.trim() || !tenantMobile.trim()) {
          showToast('Please fill mandatory Tenant Name, Address, and Mobile Number.', 'warning');
          return;
        }
      } else {
        if (!commercialCompanyName.trim() || !commercialOfficeAddress.trim() || !commercialRepName.trim()) {
          showToast('Please fill Commercial Firm Name, Office Address, and Representative details.', 'warning');
          return;
        }
        if (!commercialCompanyPan.trim()) {
          showToast('Commercial Tenancy strictly requires the Company/Firm PAN Card number.', 'warning');
          return;
        }
      }
    }

    if (currentPage === 4) {
      if (!monthlyRent || numericRent <= 0) {
        showToast('Please enter Monthly Rent Amount.', 'warning');
        return;
      }
      if (!securityDeposit || numericDeposit < 0) {
        showToast('Please enter Security Deposit Amount.', 'warning');
        return;
      }
    }

    setCurrentPage(targetNext);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!w1Name.trim() || !w1Mobile.trim() || !w2Name.trim() || !w2Mobile.trim()) {
      showToast('Please fill complete details for both Witness 1 and Witness 2 (mandatory by law).', 'warning');
      return;
    }

    if (executionMode !== 'digital') {
      if (!shippingAddress.trim() || !shippingPincode.trim() || !shippingPhone.trim()) {
        showToast('Please provide complete physical shipping address, pincode, and contact number.', 'warning');
        return;
      }
    }

    if (declarations.some((val) => !val)) {
      showToast('कृपया आगे बढ़ने के लिए सभी 5 कानूनी घोषणाओं (Declarations) को स्वीकार करें।', 'warning');
      return;
    }

    if (!disclaimerAccepted) {
      showToast('Please accept the statutory declaration checkbox to proceed.', 'warning');
      return;
    }

    setIsSubmitting(true);

    try {
      const todayISO = new Date().toISOString().split('T')[0];
      const newOrderId = generateSequentialOrderId();

      const formattedDocTitle =
        docCategory === 'commercial'
          ? 'Commercial Lease Agreement (MTA Compliant)'
          : 'Residential Rent Agreement (MTA Compliant)';

      // 1. Gather sensitive data for client-side encryption
      const sensitiveData = {
        orderId: newOrderId,
        docTitle: formattedDocTitle,
        state: selectedState,
        landlord: {
          entityType: landlordEntityType,
          name: landlordName,
          fatherName: landlordFatherName,
          address: landlordAddress,
          pan: landlordPan,
          aadhaar: landlordAadhaarLast4,
          mobile: landlordMobile
        },
        tenant: {
          name: tenantName,
          fatherName: tenantFatherName,
          address: tenantAddress,
          pan: tenantPan,
          aadhaar: tenantAadhaarLast4,
          mobile: tenantMobile
        },
        leaseTerms: {
          monthlyRent,
          securityDeposit,
          lockInPeriod,
          leaseTenure,
          noticePeriod
        },
        witnesses: [
          { name: w1Name, fatherName: w1FatherName, address: w1Address, mobile: w1Mobile },
          { name: w2Name, fatherName: w2FatherName, address: w2Address, mobile: w2Mobile }
        ],
        pricing,
        timestamp: new Date().toISOString()
      };

      // 2. Client-side AES-256 + HMAC-SHA256
      const encResult = encryptFormDataAndSign(sensitiveData);
      const { encryptedPayload, signature, websiteBUrl } = encResult;

      // 3. Save ONLY 4 lightweight metadata fields into Supabase
      const metadata = {
        firstPartyName: landlordName || 'Applicant',
        formName: formattedDocTitle,
        timestamp: new Date().toISOString(),
        totalPrice: pricing.totalPayable,
        orderId: newOrderId
      };
      await saveLightweightMetadata(metadata);

      // 4. Directly POST encrypted ciphertext & HMAC signature to Website B API with try...catch
      const syncRes = await postEncryptedPayloadToWebsiteB(encResult, metadata);
      setServerBSyncResult(syncRes);
      setCachedEncPayload({ result: encResult, metadata });

      const newOrder: OrderItem = {
        orderId: newOrderId,
        docTitle: formattedDocTitle,
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
        stampDenomination: `₹${pricing.effectiveStamp}`,
        isPhysicalCourier: executionMode !== 'digital',
        shippingAddress: executionMode !== 'digital' ? shippingAddress : undefined,
        pincode: executionMode !== 'digital' ? shippingPincode : undefined,
        shippingPhone: executionMode !== 'digital' ? shippingPhone : undefined,
        shippingStatus: executionMode !== 'digital' ? 'Pending Dispatch' : 'Not Ordered'
      };

      try {
        playConfirmationChime();
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {}

      setSubmittedOrder(newOrder);
      setSubmissionSecurityDetails({ encryptedPayload, signature, websiteBUrl });
      onOrderCreated(newOrder);
      setIsSubmitting(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Submission error:', err);
      setIsSubmitting(false);
    }
  };

  // Submitted Success View
  if (submittedOrder) {
    return (
      <div className="w-full max-w-3xl mx-auto px-4 py-8 animate-fadeIn pb-24">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-lg text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-[#15803d] mx-auto flex items-center justify-center shadow-inner">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-[#15803d] text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-2">
              <Lock className="w-3.5 h-3.5 text-[#15803d]" />
              <span>AES-256 Client Encrypted • Zero-Database Rule</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-black mt-1">
              Order Confirmed &amp; Encrypted
            </h1>
            <p className="text-sm text-slate-500 mt-1 max-w-xl mx-auto">
              Zero-database compliance: Sensitive lease details have been AES-256 encrypted in your browser with HMAC digital signature. Only lightweight audit metadata was saved to Supabase.
            </p>
            <div className="mt-3 inline-block bg-slate-50 border border-slate-300 rounded-xl px-4 py-2">
              <span className="text-xs text-slate-500 mr-2">Docket ID:</span>
              <span className="font-mono font-black text-[#15803d] text-base">
                {submittedOrder.orderId}
              </span>
            </div>
          </div>

          {/* Server B Real-Time Sync Status (Try...Catch with Green / Red Exact Error Display) */}
          <ServerBSyncStatusCard
            syncResult={serverBSyncResult}
            isRetrying={isRetryingSync}
            onRetry={handleRetryServerBSync}
          />

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
              <span className="text-slate-500">Stamp Paper Value:</span>
              <span className="font-bold text-[#15803d]">{submittedOrder.stampDenomination}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200/80 pb-2">
              <span className="text-slate-500">Execution Mode:</span>
              <span className="font-bold text-slate-900">
                {executionMode === 'digital'
                  ? 'Digital Aadhaar OTP eSign'
                  : executionMode === 'physical'
                  ? 'Physical Stamp Paper Courier'
                  : 'Hybrid (Digital + Physical Both)'}
              </span>
            </div>
            <div className="flex justify-between pt-1 font-bold text-base text-black">
              <span>Final Payment (Pay After Delivery):</span>
              <span className="text-[#15803d]">₹{submittedOrder.totalFee}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={onNavigateToDashboard}
              className="w-full sm:w-auto px-8 py-3.5 bg-slate-900 hover:bg-black active:bg-slate-800 text-white font-bold text-sm rounded-xl shadow-md cursor-pointer transition-all"
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

  return (
    <div data-document-wizard className="w-full max-w-4xl mx-auto px-4 py-5 animate-fadeIn pb-28">
      {/* Top Header & Step Progress */}
      <div className="mb-5">
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
            className="bg-[#15803d] h-full transition-all duration-300"
            style={{ width: `${(currentPage / 5) * 100}%` }}
          />
        </div>

        {/* Title Header */}
        <div className="mt-4">
          <h1 className="text-2xl sm:text-3xl font-black text-black">
            {initialDoc.title}
          </h1>
          <span className="text-sm font-bold text-[#15803d] block mt-0.5">
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

      {/* FORM CONTAINER */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-5 sm:p-7">
        {/* ================= PAGE 1 ================= */}
        {currentPage === 1 && (
          <div className="space-y-6 animate-fadeIn">

            {/* Document Category Radio */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-slate-800">
                  Document Category <span className="text-red-500 font-bold">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => handlePlayFieldSpeech('docCategory')}
                  className="text-slate-400 hover:text-blue-600 transition-colors p-1"
                  title="Listen to field guide"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label
                  className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                    docCategory === 'residential'
                      ? 'border-blue-600 bg-blue-50/60 ring-1 ring-blue-600'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="docCategory"
                    checked={docCategory === 'residential'}
                    onChange={() => setDocCategory('residential')}
                    className="w-4 h-4 text-blue-600"
                  />
                  <div className="flex items-center gap-2.5">
                    <Home className="w-5 h-5 text-blue-600" />
                    <div>
                      <span className="text-sm font-bold text-black block">Residential Rent Agreement</span>
                      <span className="text-[11px] text-slate-500">Houses, flats, villas, co-living (MTA 2-month deposit rule)</span>
                    </div>
                  </div>
                </label>

                <label
                  className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                    docCategory === 'commercial'
                      ? 'border-blue-600 bg-blue-50/60 ring-1 ring-blue-600'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="docCategory"
                    checked={docCategory === 'commercial'}
                    onChange={() => setDocCategory('commercial')}
                    className="w-4 h-4 text-blue-600"
                  />
                  <div className="flex items-center gap-2.5">
                    <Building2 className="w-5 h-5 text-blue-600" />
                    <div>
                      <span className="text-sm font-bold text-black block">Commercial Lease Agreement</span>
                      <span className="text-[11px] text-slate-500">Shops, offices, warehouses, corporate hubs &amp; GST compliance</span>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* State Selection */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  State / Union Territory <span className="text-red-500 font-bold">*</span>
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
                <optgroup label="Standard Fixed Stamp Duty States">
                  {[
                    'Uttar Pradesh',
                    'Delhi',
                    'Punjab',
                    'Himachal Pradesh',
                    'Jammu & Kashmir',
                    'Ladakh',
                    'Chandigarh',
                    'Puducherry',
                    'Andaman & Nicobar',
                    'Assam',
                    'Uttarakhand',
                    'Meghalaya',
                    'Arunachal Pradesh',
                    'Gujarat',
                    'West Bengal',
                    'Odisha',
                    'Chhattisgarh',
                    'Andhra Pradesh',
                    'Madhya Pradesh',
                    'Tripura',
                    'Dadra & Nagar Haveli and Daman & Diu'
                  ].map((sName) => (
                    <option key={sName} value={sName}>
                      {sName} {sName === 'Gujarat' ? '(₹300)' : sName === 'Madhya Pradesh' ? '(₹500)' : ''}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Variable Duty States (Calculated Dynamically)">
                  {['Karnataka', 'Bihar', 'Jharkhand'].map((sName) => (
                    <option key={sName} value={sName}>
                      🔵 {sName} (Dynamic Calculation)
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* Purpose of Tenancy Specifics (Purely Residential or Purely Commercial) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  Purpose of Tenancy Specifics <span className="text-red-500 font-bold">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => handlePlayFieldSpeech('purpose')}
                  className="text-slate-400 hover:text-blue-600 transition-colors p-1"
                  title="Listen to field guide"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <select
                value={tenancyPurpose}
                onChange={(e) => setTenancyPurpose(e.target.value as any)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="residential">Purely Residential</option>
                <option value="commercial">Purely Commercial</option>
              </select>
            </div>

            {/* Stamp Paper Procurement Mode */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-slate-800">
                  Stamp Paper Procurement Mode <span className="text-red-500 font-bold">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => handlePlayFieldSpeech('stampProcurement')}
                  className="text-slate-400 hover:text-blue-600 transition-colors p-1"
                  title="Listen to field guide"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    stampProcurementMode === 'estamp'
                      ? 'border-blue-600 bg-blue-50/60 ring-1 ring-blue-600'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="procurementMode"
                    checked={stampProcurementMode === 'estamp'}
                    onChange={() => setStampProcurementMode('estamp')}
                    className="w-4 h-4 text-blue-600"
                  />
                  <div>
                    <span className="text-xs font-bold text-black block">E-Stamp Paper / Digital Stamp</span>
                    <span className="text-[11px] text-slate-500">System generated official state e-stamp</span>
                  </div>
                </label>

                <label
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    stampProcurementMode === 'physical_upload'
                      ? 'border-blue-600 bg-blue-50/60 ring-1 ring-blue-600'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="procurementMode"
                    checked={stampProcurementMode === 'physical_upload'}
                    onChange={() => setStampProcurementMode('physical_upload')}
                    className="w-4 h-4 text-blue-600"
                  />
                  <div>
                    <span className="text-xs font-bold text-black block">Physical Stamp Paper (User Upload)</span>
                    <span className="text-[11px] text-slate-500">Upload your own pre-purchased physical stamp</span>
                  </div>
                </label>
              </div>

              {/* Physical Stamp Upload Option Opens Directly if selected */}
              {stampProcurementMode === 'physical_upload' && (
                <div className="mt-3 p-4 bg-blue-50/70 border border-blue-300 rounded-xl space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">
                        Upload Pre-Purchased Physical Stamp Paper <span className="text-red-500 font-bold">*</span>
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Attach scanned front page of physical non-judicial stamp paper (PDF/JPG/PNG)
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setPhysicalStampUploaded(true)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        physicalStampUploaded
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>{physicalStampUploaded ? '✓ Document Attached' : 'Upload Stamp File'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Stamp Paper Value Selection */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <label className="block text-xs font-bold text-slate-800">
                    Stamp Paper Value Selection <span className="text-red-500 font-bold">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => handlePlayFieldSpeech('stampValue')}
                    className="text-slate-400 hover:text-blue-600 transition-colors p-1"
                    title="Listen to field guide"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <span className="text-[11px] font-bold text-blue-600">
                  Recommended for {selectedState}: ₹{recommendedMinStamp}
                </span>
              </div>

              {/* Mobile Horizontal Slider / Scroll, sm:grid */}
              <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-thin flex-nowrap sm:grid sm:grid-cols-7 sm:overflow-visible">
                {[10, 20, 50, 100, 500, 1000].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => {
                      setStampValue(val);
                      setCustomStampValue('');
                    }}
                    className={`shrink-0 min-w-[70px] sm:min-w-0 py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      stampValue === val
                        ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:border-blue-400'
                    }`}
                  >
                    ₹{val}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setStampValue(-1)}
                  className={`shrink-0 min-w-[70px] sm:min-w-0 py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    stampValue === -1
                      ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-300 hover:border-blue-400'
                  }`}
                >
                  Custom
                </button>
              </div>

              {stampValue === -1 && (
                <div className="mt-2.5">
                  <input
                    type="number"
                    value={customStampValue}
                    onChange={(e) => setCustomStampValue(e.target.value)}
                    placeholder={getPlaceholder("Enter custom stamp value in Rupees")}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              )}

              {isStampBelowThreshold && (
                <div className="mt-3 p-3.5 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-xs flex items-start gap-2.5 animate-fadeIn">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold">Dynamic Legal Guard-Rail Warning:</strong>
                    <p className="mt-0.5 text-amber-800">
                      Per {selectedState} statutory regulations, the recommended minimum stamp duty is <strong>₹{recommendedMinStamp}</strong>. Using a lower value may render this agreement inadmissible as primary evidence in a court of law under Section 35 of the Indian Stamp Act.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Stamp Duty Cost Paid By */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  Stamp Duty Cost Paid By <span className="text-red-500 font-bold">*</span>
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

              <select
                value={stampCostBorneBy}
                onChange={(e) => setStampCostBorneBy(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="First Party (Landlord / Lessor)">First Party (Landlord / Lessor)</option>
                <option value="Second Party (Tenant / Lessee)">Second Party (Tenant / Lessee)</option>
                <option value="Shared Equally (50-50 Split)">Shared Equally (50-50 Split)</option>
                <option value="Custom Split">Custom Ratio or Fixed Amount Split</option>
              </select>

              {stampCostBorneBy === 'Custom Split' && (
                <div className="mt-2">
                  <input
                    type="text"
                    value={customSplitText}
                    onChange={(e) => setCustomSplitText(e.target.value)}
                    placeholder={getPlaceholder("Enter custom ratio or division")}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= PAGE 2 ================= */}
        {currentPage === 2 && (
          <div className="space-y-5 animate-fadeIn">
            {/* Page 2 Distinct Header - Soft eye-friendly styling */}
            <div className="bg-slate-50 text-slate-900 rounded-2xl p-4 sm:p-5 shadow-2xs border border-slate-200 mb-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-black text-lg border border-blue-200">
                  1
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black tracking-wide uppercase text-slate-900">
                    1st Party Details Only
                  </h3>
                  <p className="text-xs text-slate-600 font-medium">
                    Landlord / Property Owner
                  </p>
                </div>
              </div>
            </div>

            {/* Landlord Entity Type */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  Lessor / Landlord Entity Type <span className="text-red-500 font-bold">*</span>
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
                value={landlordEntityType}
                onChange={(e) => setLandlordEntityType(e.target.value as any)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-black focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="Individual">Individual (Single Owner)</option>
                <option value="Joint Owners">Joint Owners / Co-Owners</option>
                <option value="Partnership Firm / LLP">Partnership Firm / LLP</option>
                <option value="Private Limited / Public Limited Company">Private Limited / Public Limited Company</option>
                <option value="HUF">Hindu Undivided Family (HUF)</option>
                <option value="Trust / Society">Trust / Society / AOP</option>
              </select>
            </div>

            {/* Corporate vs Individual Dynamic Layout */}
            {landlordEntityType !== 'Individual' && landlordEntityType !== 'Joint Owners' ? (
              /* Corporate Landlord Fields */
              <div className="space-y-3 bg-slate-50 border border-slate-200 rounded-xl p-4">
                <span className="text-xs font-bold text-blue-700 uppercase tracking-wider block">
                  Corporate / Entity Ownership Framework
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Entity Legal Name <span className="text-red-500 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={landlordName}
                      onChange={(e) => setLandlordName(e.target.value)}
                      placeholder={getPlaceholder("Enter Entity Registered Name")}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Company Registration / CIN / LLPIN <span className="text-red-500 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={corporateRegNumber}
                      onChange={(e) => setCorporateRegNumber(e.target.value.toUpperCase())}
                      placeholder={getPlaceholder("Enter CIN / LLPIN")}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono uppercase text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Registered Office Address <span className="text-red-500 font-bold">*</span>
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={corporateAddress}
                    onChange={(e) => setCorporateAddress(e.target.value)}
                    placeholder={getPlaceholder("Enter Registered Office Address")}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Authorized Signatory Name <span className="text-red-500 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={authSignatoryName}
                      onChange={(e) => setAuthSignatoryName(e.target.value)}
                      placeholder={getPlaceholder("Enter Signatory Full Name")}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Signatory Designation <span className="text-red-500 font-bold">*</span>
                    </label>
                    <select
                      value={authSignatoryDesignation}
                      onChange={(e) => setAuthSignatoryDesignation(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    >
                      {STANDARD_DESIGNATIONS.map((desig) => (
                        <option key={desig} value={desig}>{desig}</option>
                      ))}
                    </select>
                    {authSignatoryDesignation === 'Other' && (
                      <input
                        type="text"
                        value={authSignatoryCustomDesignation}
                        onChange={(e) => setAuthSignatoryCustomDesignation(e.target.value)}
                        placeholder={getPlaceholder("Enter Designation")}
                        className="mt-2 w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                      />
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* Individual / Joint Landlord Fields */
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700">
                        Full Legal Name <span className="text-red-500 font-bold">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => handlePlayFieldSpeech('landlordName')}
                        className="text-slate-400 hover:text-blue-600 transition-colors p-1"
                        title="Listen to field guide"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <input
                      type="text"
                      required
                      value={landlordName}
                      onChange={(e) => setLandlordName(e.target.value)}
                      placeholder={getPlaceholder("Enter Full Legal Name")}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700">
                        Father's / Husband's Name <span className="text-red-500 font-bold">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => handlePlayFieldSpeech('landlordFatherName')}
                        className="text-slate-400 hover:text-blue-600 transition-colors p-1"
                        title="Listen to field guide"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <input
                      type="text"
                      required
                      value={landlordFatherName}
                      onChange={(e) => setLandlordFatherName(e.target.value)}
                      placeholder={getPlaceholder("Enter Father's or Husband's Name")}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <DateOfBirthPicker
                      label="Age / Date of Birth (Age ≥ 18)"
                      value={landlordDobOrAge}
                      onChange={setLandlordDobOrAge}
                      required={true}
                      placeholder={getPlaceholder("DD/MM/YYYY")}
                      helperText={showExampleDetails ? "Format: DD/MM/YYYY" : undefined}
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700">
                        Permanent Residential Address <span className="text-red-500 font-bold">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => handlePlayFieldSpeech('landlordAddress')}
                        className="text-slate-400 hover:text-blue-600 transition-colors p-1"
                        title="Listen to field guide"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <input
                      type="text"
                      required
                      value={landlordAddress}
                      onChange={(e) => setLandlordAddress(e.target.value)}
                      placeholder={getPlaceholder("Enter Permanent Address with City and PIN code")}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Mobile (Without OTP verification button) & Email (Optional) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Current Mobile Number (10-Digit) <span className="text-red-500 font-bold">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => handlePlayFieldSpeech('landlordMobile')}
                    className="text-slate-400 hover:text-blue-600 transition-colors p-1"
                    title="Listen to field guide"
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
                  placeholder={getPlaceholder("Enter 10-Digit Mobile Number")}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Email Address <span className="text-slate-400 font-normal text-xs">(Optional)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => handlePlayFieldSpeech('landlordEmail')}
                    className="text-slate-400 hover:text-blue-600 transition-colors p-1"
                    title="Listen to field guide"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <input
                  type="email"
                  value={landlordEmail}
                  onChange={(e) => setLandlordEmail(e.target.value)}
                  placeholder={getPlaceholder("Enter Email Address")}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            {/* Aadhaar (12 Digits) & PAN Card Number */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <AadhaarInput
                  value={landlordAadhaarLast4}
                  onChange={(val) => setLandlordAadhaarLast4(val)}
                  label="Aadhaar Number (12 Digits)"
                  placeholder={getPlaceholder("1234 - 5678 - 9012")}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    PAN Card Number {isPanMandatoryUnder194IB ? <span className="text-red-500 font-bold">*</span> : <span className="text-slate-400 font-normal text-xs">(Optional)</span>}
                  </label>
                  <button
                    type="button"
                    onClick={() => handlePlayFieldSpeech('landlordPan')}
                    className="text-slate-400 hover:text-blue-600 transition-colors p-1"
                    title="Listen to field guide"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <input
                  type="text"
                  required={isPanMandatoryUnder194IB}
                  maxLength={10}
                  value={landlordPan}
                  onChange={(e) => handlePanInput(e.target.value, setLandlordPan)}
                  onKeyDown={(e) => {
                    if (landlordPan.length >= 10 && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
                      e.preventDefault();
                    }
                  }}
                  placeholder={getPlaceholder("Enter 10-Character PAN")}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-mono uppercase text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            {/* Joint Owners Extension */}
            {landlordEntityType === 'Joint Owners' && (
              <div className="pt-3 border-t border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">
                    Co-Owners / Joint Property Holders ({coOwners.length})
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

                {coOwners.map((co, idx) => (
                  <div key={co.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-blue-700">Co-Owner #{idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeCoOwner(co.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input
                        type="text"
                        value={co.name}
                        onChange={(e) => updateCoOwner(co.id, 'name', e.target.value)}
                        placeholder={getPlaceholder("Co-Owner Legal Name")}
                        className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs"
                      />
                      <input
                        type="tel"
                        maxLength={10}
                        inputMode="numeric"
                        value={co.mobile}
                        onChange={(e) => updateCoOwner(co.id, 'mobile', e.target.value.replace(/\D/g, ''))}
                        placeholder={getPlaceholder("Mobile Number")}
                        className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs"
                      />
                      <input
                        type="text"
                        maxLength={10}
                        value={co.pan}
                        onChange={(e) => updateCoOwner(co.id, 'pan', e.target.value.toUpperCase())}
                        placeholder={getPlaceholder("Co-Owner PAN")}
                        className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono uppercase"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Power of Attorney (POA) Holder Checkbox */}
            <div className="pt-3 border-t border-slate-200 space-y-3">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={hasPoa}
                  onChange={(e) => setHasPoa(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-xs font-bold text-slate-800">
                  Signing via a Power of Attorney (POA) Holder <span className="text-slate-400 font-normal text-xs">(Optional)</span>
                </span>
              </label>

              {hasPoa && (
                <div className="p-3.5 bg-blue-50/60 border border-blue-200 rounded-xl space-y-3 animate-fadeIn">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                        POA Holder Full Name <span className="text-red-500 font-bold">*</span>
                      </label>
                      <input
                        type="text"
                        required={hasPoa}
                        value={poaName}
                        onChange={(e) => setPoaName(e.target.value)}
                        placeholder={getPlaceholder("Enter POA Holder Full Name")}
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                        POA Holder Aadhaar Last 4 <span className="text-red-500 font-bold">*</span>
                      </label>
                      <input
                        type="text"
                        maxLength={4}
                        inputMode="numeric"
                        pattern="[0-9]*"
                        required={hasPoa}
                        value={poaAadhaarLast4}
                        onChange={(e) => setPoaAadhaarLast4(e.target.value.replace(/\D/g, ''))}
                        placeholder={getPlaceholder("Enter 4 Digits")}
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                      POA Holder Address <span className="text-red-500 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      required={hasPoa}
                      value={poaAddress}
                      onChange={(e) => setPoaAddress(e.target.value)}
                      placeholder={getPlaceholder("Enter Current Address of POA Holder")}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                    />
                  </div>

                  <div className="flex items-center justify-between p-2.5 bg-white border border-blue-200 rounded-lg">
                    <span className="text-xs text-slate-700">Certified POA Document:</span>
                    <button
                      type="button"
                      onClick={() => setPoaFileUploaded(true)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        poaFileUploaded
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>{poaFileUploaded ? '✓ POA Attached' : 'Upload Certified POA'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Proof of Property Ownership Type */}
            <div className="pt-3 border-t border-slate-200">
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  Proof of Property Ownership Type <span className="text-slate-400 font-normal text-xs">(Optional)</span>
                </label>
                <button
                  type="button"
                  onClick={() => handlePlayFieldSpeech('propertyProof')}
                  className="text-slate-400 hover:text-blue-600 transition-colors p-1"
                  title="Listen to field guide"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5">
                <select
                  value={ownershipProofType}
                  onChange={(e) => setOwnershipProofType(e.target.value)}
                  className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="Electricity Bill">Electricity Bill</option>
                  <option value="Sale Deed / Registry Copy">Sale Deed / Registry Copy</option>
                  <option value="Property Tax Receipt">Property Tax Receipt</option>
                  <option value="Mutation Copy">Mutation Copy</option>
                  <option value="Allotment Letter">Allotment Letter</option>
                  <option value="None">None / Not Attached</option>
                </select>

                {ownershipProofType !== 'None' && (
                  <button
                    type="button"
                    onClick={() => setPropertyDocUploaded(true)}
                    className={`inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      propertyDocUploaded
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                        : 'bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-600 border border-slate-300'
                    }`}
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>{propertyDocUploaded ? '✓ Document Uploaded' : 'Upload Property Document'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================= PAGE 3: SECOND PARTY / TENANT DETAILS ================= */}
        {currentPage === 3 && (
          <div className="space-y-5 animate-fadeIn">
            {/* Page 3 Distinct Header - Soft eye-friendly styling */}
            <div className="bg-slate-50 text-slate-900 rounded-2xl p-4 sm:p-5 shadow-2xs border border-slate-200 mb-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center font-black text-lg border border-indigo-200">
                  2
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black tracking-wide uppercase text-slate-900">
                    2nd Party Details Only
                  </h3>
                  <p className="text-xs text-slate-600 font-medium">
                    Tenant / Lessee
                  </p>
                </div>
              </div>
            </div>

            {docCategory === 'residential' ? (
              /* CASE A: RESIDENTIAL TENANCY */
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700">
                        Full Legal Name <span className="text-red-500 font-bold">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => handlePlayFieldSpeech('tenantName')}
                        className="text-slate-400 hover:text-blue-600 transition-colors p-1"
                        title="Listen to field guide"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <input
                      type="text"
                      required
                      value={tenantName}
                      onChange={(e) => setTenantName(e.target.value)}
                      placeholder={getPlaceholder("Enter Tenant Full Legal Name")}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700">
                        Father's / Husband's Name <span className="text-red-500 font-bold">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => handlePlayFieldSpeech('tenantFatherName')}
                        className="text-slate-400 hover:text-blue-600 transition-colors p-1"
                        title="Listen to field guide"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <input
                      type="text"
                      required
                      value={tenantFatherName}
                      onChange={(e) => setTenantFatherName(e.target.value)}
                      placeholder={getPlaceholder("Enter Father's or Husband's Name")}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <DateOfBirthPicker
                      label="Age / Date of Birth (Age ≥ 18)"
                      value={tenantAge}
                      onChange={setTenantAge}
                      required={true}
                      placeholder={getPlaceholder("DD/MM/YYYY")}
                      helperText={showExampleDetails ? "Format: DD/MM/YYYY" : undefined}
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700">
                        Permanent Native Address <span className="text-red-500 font-bold">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => handlePlayFieldSpeech('tenantAddress')}
                        className="text-slate-400 hover:text-blue-600 transition-colors p-1"
                        title="Listen to field guide"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <input
                      type="text"
                      required
                      value={tenantAddress}
                      onChange={(e) => setTenantAddress(e.target.value)}
                      placeholder={getPlaceholder("Enter Permanent Native Address")}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700">
                        Mobile Number (10-Digit) <span className="text-red-500 font-bold">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => handlePlayFieldSpeech('tenantMobile')}
                        className="text-slate-400 hover:text-blue-600 transition-colors p-1"
                        title="Listen to field guide"
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
                      value={tenantMobile}
                      onChange={(e) => setTenantMobile(e.target.value.replace(/\D/g, ''))}
                      placeholder={getPlaceholder("Enter 10-Digit Mobile Number")}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Email Address <span className="text-slate-400 font-normal text-xs">(Optional)</span>
                    </label>
                    <input
                      type="email"
                      value={tenantEmail}
                      onChange={(e) => setTenantEmail(e.target.value)}
                      placeholder={getPlaceholder("Enter Email Address")}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <AadhaarInput
                      value={tenantAadhaarLast4}
                      onChange={(val) => setTenantAadhaarLast4(val)}
                      label="Aadhaar Number (12 Digits)"
                      placeholder={getPlaceholder("1234 - 5678 - 9012")}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      PAN Card Number <span className="text-slate-400 font-normal text-xs">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      maxLength={10}
                      value={tenantPan}
                      onChange={(e) => handlePanInput(e.target.value, setTenantPan)}
                      onKeyDown={(e) => {
                        if (tenantPan.length >= 10 && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
                          e.preventDefault();
                        }
                      }}
                      placeholder={getPlaceholder("Enter 10-Character PAN")}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-mono uppercase text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>

                {/* Co-Occupants / Family Members Table */}
                <div className="pt-3 border-t border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-800">
                        Co-Occupants / Family Members Details <span className="text-slate-400 font-normal text-xs">(Optional)</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => handlePlayFieldSpeech('coOccupants')}
                        className="text-slate-400 hover:text-blue-600 transition-colors p-1"
                        title="Listen to field guide"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={addCoOccupant}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white font-bold text-xs transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Family Member</span>
                    </button>
                  </div>

                  {coOccupants.map((occ) => (
                    <div key={occ.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row gap-2.5 items-center">
                      <input
                        type="text"
                        value={occ.fullName}
                        onChange={(e) => updateCoOccupant(occ.id, 'fullName', e.target.value)}
                        placeholder={getPlaceholder("Full Legal Name")}
                        className="flex-1 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                      />
                      <input
                        type="text"
                        value={occ.age}
                        onChange={(e) => updateCoOccupant(occ.id, 'age', e.target.value)}
                        placeholder={getPlaceholder("Age")}
                        className="w-20 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                      />
                      <input
                        type="text"
                        value={occ.relationship}
                        onChange={(e) => updateCoOccupant(occ.id, 'relationship', e.target.value)}
                        placeholder={getPlaceholder("Relationship (e.g. Spouse / Son)")}
                        className="flex-1 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                      />
                      <button
                        type="button"
                        onClick={() => removeCoOccupant(occ.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* CASE B: COMMERCIAL TENANCY */
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Type of Business Entity <span className="text-red-500 font-bold">*</span>
                  </label>
                  <select
                    value={commercialEntityType}
                    onChange={(e) => setCommercialEntityType(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="Sole Proprietorship">Sole Proprietorship</option>
                    <option value="Partnership Firm">Partnership Firm</option>
                    <option value="Limited Liability Partnership (LLP)">Limited Liability Partnership (LLP)</option>
                    <option value="Private Limited Company">Private Limited Company</option>
                    <option value="Public Limited Company">Public Limited Company</option>
                    <option value="Trust / Society / NGO">Trust / Society / NGO</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700">
                        Registered Company / Firm Name <span className="text-red-500 font-bold">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => handlePlayFieldSpeech('commercialFirmName')}
                        className="text-slate-400 hover:text-blue-600 transition-colors p-1"
                        title="Listen to field guide"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <input
                      type="text"
                      required
                      value={commercialCompanyName}
                      onChange={(e) => setCommercialCompanyName(e.target.value)}
                      placeholder={getPlaceholder("Enter Registered Company / Firm Name")}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700">
                        Company / Firm PAN Card <span className="text-red-500 font-bold">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => handlePlayFieldSpeech('commercialPan')}
                        className="text-slate-400 hover:text-blue-600 transition-colors p-1"
                        title="Listen to field guide"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <input
                      type="text"
                      required
                      maxLength={10}
                      value={commercialCompanyPan}
                      onChange={(e) => setCommercialCompanyPan(e.target.value.toUpperCase())}
                      placeholder={getPlaceholder("Enter 10-Character Corporate PAN")}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-mono uppercase text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Registered Office Address <span className="text-red-500 font-bold">*</span>
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={commercialOfficeAddress}
                    onChange={(e) => setCommercialOfficeAddress(e.target.value)}
                    placeholder={getPlaceholder("Enter Registered Office Address")}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
                  />
                </div>

                {commercialEntityType !== 'Sole Proprietorship' && commercialEntityType !== 'Partnership Firm' && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700">
                        Corporate Identification Number (CIN) / LLPIN <span className="text-red-500 font-bold">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => handlePlayFieldSpeech('commercialCin')}
                        className="text-slate-400 hover:text-blue-600 transition-colors p-1"
                        title="Listen to field guide"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <input
                      type="text"
                      required
                      value={commercialCin}
                      onChange={(e) => setCommercialCin(e.target.value.toUpperCase())}
                      placeholder={getPlaceholder("Enter CIN / LLPIN")}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono uppercase text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                )}

                {/* Authorized Signatory Framework */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                    Authorized Signatory Framework
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <div className="flex items-center justify-between mb-0.5">
                        <label className="block text-[11px] font-bold text-slate-700">
                          Full Legal Name of Representative <span className="text-red-500 font-bold">*</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => handlePlayFieldSpeech('commercialSignatory')}
                          className="text-slate-400 hover:text-blue-600 transition-colors p-1"
                          title="Listen to field guide"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <input
                        type="text"
                        required
                        value={commercialRepName}
                        onChange={(e) => setCommercialRepName(e.target.value)}
                        placeholder={getPlaceholder("Enter Representative Full Legal Name")}
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                        Designation <span className="text-red-500 font-bold">*</span>
                      </label>
                      <select
                        value={commercialRepDesignation}
                        onChange={(e) => setCommercialRepDesignation(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                      >
                        {STANDARD_DESIGNATIONS.map((desig) => (
                          <option key={desig} value={desig}>{desig}</option>
                        ))}
                      </select>
                      {commercialRepDesignation === 'Other' && (
                        <input
                          type="text"
                          value={commercialRepCustomDesignation}
                          onChange={(e) => setCommercialRepCustomDesignation(e.target.value)}
                          placeholder={getPlaceholder("Enter Custom Designation")}
                          className="mt-2 w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                        />
                      )}
                    </div>
                  </div>

                  {commercialEntityType !== 'Sole Proprietorship' && (
                    <div className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-lg">
                      <span className="text-xs text-slate-700">
                        {commercialEntityType === 'Partnership Firm'
                          ? 'Partnership Authorization Letter:'
                          : 'Board Resolution Copy:'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setAuthDocUploaded(true)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          authDocUploaded
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        <UploadCloud className="w-3.5 h-3.5" />
                        <span>
                          {authDocUploaded
                            ? '✓ Authorization Uploaded'
                            : commercialEntityType === 'Partnership Firm'
                            ? 'Upload Partner Authorization'
                            : 'Upload Board Resolution Copy'}
                        </span>
                      </button>
                    </div>
                  )}
                </div>

                {/* GSTIN Field */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <label className="block text-xs font-bold text-slate-700">
                        GSTIN (Goods and Services Tax Number) {!isUnregisteredGst && <span className="text-red-500 font-bold">*</span>}
                      </label>
                      <button
                        type="button"
                        onClick={() => handlePlayFieldSpeech('commercialGstin')}
                        className="text-slate-400 hover:text-blue-600 transition-colors p-1"
                        title="Listen to field guide"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isUnregisteredGst}
                        onChange={(e) => {
                          setIsUnregisteredGst(e.target.checked);
                          if (e.target.checked) setCommercialGstin('');
                        }}
                        className="w-3.5 h-3.5 text-blue-600 rounded"
                      />
                      <span>I do not have a GSTIN / Unregistered Commercial Tenant</span>
                    </label>
                  </div>

                  {!isUnregisteredGst && (
                    <input
                      type="text"
                      maxLength={15}
                      required={!isUnregisteredGst}
                      value={commercialGstin}
                      onChange={(e) => setCommercialGstin(e.target.value.toUpperCase())}
                      placeholder={getPlaceholder("Enter 15-Digit GSTIN")}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-mono uppercase text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= PAGE 4 ================= */}
        {currentPage === 4 && (
          <div className="space-y-6 animate-fadeIn">
            {/* 1. Financial & Tenure Matrices */}
            <div className="space-y-4">
              <span className="text-xs font-bold text-blue-700 uppercase tracking-wider block">
                1. Financial &amp; Tenure Matrices
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Lease Tenure (Duration) <span className="text-red-500 font-bold">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => handlePlayFieldSpeech('leaseTenure')}
                      className="text-slate-400 hover:text-blue-600 transition-colors p-1"
                      title="Listen to field guide"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <select
                    value={leaseTenure}
                    onChange={(e) => setLeaseTenure(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="11 Months">11 Months (Standard Statutory Limit)</option>
                    <option value="10 Months">10 Months</option>
                    <option value="9 Months">9 Months</option>
                    <option value="8 Months">8 Months</option>
                    <option value="7 Months">7 Months</option>
                    <option value="6 Months">6 Months</option>
                    <option value="5 Months">5 Months</option>
                    <option value="4 Months">4 Months</option>
                    <option value="3 Months">3 Months</option>
                    <option value="2 Months">2 Months</option>
                    <option value="1 Month">1 Month</option>
                    <option value="Custom Tenure">Custom Tenure (1 to 11 Months Only)</option>
                  </select>

                  {leaseTenure === 'Custom Tenure' && (
                    <div className="mt-2 space-y-1">
                      <input
                        type="number"
                        min={1}
                        max={11}
                        value={customTenure}
                        onChange={(e) => {
                          const val = Math.min(11, Math.max(1, Number(e.target.value) || 1));
                          setCustomTenure(`${val} Months`);
                        }}
                        placeholder={getPlaceholder("Enter months (1 to 11 only)")}
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900"
                      />
                      <span className="text-[10px] text-blue-600 block">
                        Maximum 11 Months allowed under Section 17 of Registration Act, 1908.
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Lease Commencement Date <span className="text-red-500 font-bold">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={commencementDate}
                    onChange={(e) => setCommencementDate(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              {/* Statutory Alert for Tenure >= 12 Months */}
              {isTenureLongTerm && (
                <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-xl text-rose-900 text-xs flex items-start gap-2.5 animate-fadeIn">
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold">Mandatory Registration Warning (Registration Act, 1908):</strong>
                    <p className="mt-0.5 text-rose-800 leading-relaxed">
                      Leases of 12 months or more require mandatory registration at the Sub-Registrar Office under Section 17 of the Registration Act, 1908.
                    </p>
                  </div>
                </div>
              )}

              {/* Monthly Rent & Rent Due Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Monthly Rent Amount (INR) <span className="text-red-500 font-bold">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => handlePlayFieldSpeech('monthlyRent')}
                      className="text-slate-400 hover:text-blue-600 transition-colors p-1"
                      title="Listen to field guide"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
                    <input
                      type="number"
                      required
                      min={100}
                      value={monthlyRent}
                      onChange={(e) => setMonthlyRent(e.target.value)}
                      placeholder={getPlaceholder("Enter Monthly Rent")}
                      className="w-full bg-white border border-slate-300 rounded-xl pl-8 pr-3 py-2 text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Rent Due Date <span className="text-red-500 font-bold">*</span>
                  </label>
                  <select
                    value={rentDueDate}
                    onChange={(e) => setRentDueDate(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    {[1, 5, 7, 10, 15, 20, 25, 30].map((day) => (
                      <option key={day} value={`${day}th of every calendar month`}>
                        {day}th of every calendar month
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Security Deposit Amount */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <label className="block text-xs font-bold text-slate-700">
                        Security Deposit Amount (INR) <span className="text-red-500 font-bold">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => handlePlayFieldSpeech('securityDeposit')}
                        className="text-slate-400 hover:text-blue-600 transition-colors p-1"
                        title="Listen to field guide"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <span className="text-[10px] text-blue-600 font-bold">
                      MTA Cap: {docCategory === 'residential' ? 'Max 2 Mos' : 'Max 6 Mos'}
                    </span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
                    <input
                      type="number"
                      required
                      value={securityDeposit}
                      onChange={(e) => setSecurityDeposit(e.target.value)}
                      placeholder={getPlaceholder("Enter Security Deposit Amount")}
                      className="w-full bg-white border border-slate-300 rounded-xl pl-8 pr-3 py-2 text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Notice Period Duration <span className="text-red-500 font-bold">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => handlePlayFieldSpeech('noticePeriod')}
                      className="text-slate-400 hover:text-blue-600 transition-colors p-1"
                      title="Listen to field guide"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <select
                    value={noticePeriod}
                    onChange={(e) => setNoticePeriod(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="1 Month">1 Month</option>
                    <option value="2 Months">2 Months</option>
                    <option value="3 Months">3 Months</option>
                    <option value="15 Days">15 Days</option>
                  </select>
                </div>
              </div>

              {/* MTA Cap Soft Warning Banner */}
              {mtaCapExceeded && (
                <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-xs flex items-start gap-2.5 animate-fadeIn">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>Model Tenancy Act (MTA) Cap Notice:</strong>
                    <p className="mt-0.5 text-amber-800">
                      Under the Model Tenancy Act, security deposit for {mtaCapExceeded.type} premises is capped at a maximum of{' '}
                      {mtaCapExceeded.type === 'residential' ? '2 months' : '6 months'} rent (Recommended Max: ₹
                      {mtaCapExceeded.maxAllowed.toLocaleString('en-IN')}).
                    </p>
                  </div>
                </div>
              )}

              {/* Payment Channel */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Rent Payment Channel <span className="text-red-500 font-bold">*</span>
                </label>
                <select
                  value={paymentChannel}
                  onChange={(e) => setPaymentChannel(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="Bank Transfer (NEFT/RTGS/IMPS/UPI)">Bank Transfer (NEFT/RTGS/IMPS/UPI)</option>
                  <option value="Account Payee Cheque">Account Payee Cheque</option>
                  <option value="Cash / Other">Cash / Other</option>
                </select>
              </div>
            </div>

            {/* 2. Advanced Commercial Configurations */}
            {docCategory === 'commercial' && (
              <div className="pt-4 border-t border-slate-200 space-y-3">
                <span className="text-xs font-bold text-blue-700 uppercase tracking-wider block">
                  2. Advanced Commercial Configurations
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-0.5">
                      <label className="block text-[11px] font-bold text-slate-700">
                        Rent Escalation Clause <span className="text-red-500 font-bold">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => handlePlayFieldSpeech('rentEscalation')}
                        className="text-slate-400 hover:text-blue-600 transition-colors p-1"
                        title="Listen to field guide"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <select
                      value={rentEscalation}
                      onChange={(e) => setRentEscalation(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                    >
                      <option value="None">None</option>
                      <option value="5% Annually">5% Annually</option>
                      <option value="10% Annually">10% Annually</option>
                      <option value="Custom Percentage">Custom Percentage</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-0.5">
                      <label className="block text-[11px] font-bold text-slate-700">
                        Lock-in Period <span className="text-red-500 font-bold">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => handlePlayFieldSpeech('lockInPeriod')}
                        className="text-slate-400 hover:text-blue-600 transition-colors p-1"
                        title="Listen to field guide"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <select
                      value={lockInPeriod}
                      onChange={(e) => setLockInPeriod(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                    >
                      <option value="None">None</option>
                      <option value="6 Months">6 Months</option>
                      <option value="1 Year">1 Year</option>
                      <option value="2 Years">2 Years</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                      Delayed Rent Interest <span className="text-red-500 font-bold">*</span>
                    </label>
                    <select
                      value={delayedRentInterest}
                      onChange={(e) => setDelayedRentInterest(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                    >
                      <option value="None">None</option>
                      <option value="12% Per Annum">12% Per Annum</option>
                      <option value="18% Per Annum">18% Per Annum</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* 3. Statutory Legal Clauses */}
            <div className="pt-4 border-t border-slate-200 space-y-3">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                3. Statutory Legal Guard-Rails (Pre-checked for Maximum Court Admissibility)
              </span>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <span className="text-xs font-bold text-slate-800">
                  Maintenance Obligations Allocation:
                </span>
                <div className="flex items-center gap-4 text-xs">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="maintenance"
                      checked={maintenanceBearer === 'tenant'}
                      onChange={() => setMaintenanceBearer('tenant')}
                      className="text-blue-600"
                    />
                    <span>Tenant Pays Routine Maintenance</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="maintenance"
                      checked={maintenanceBearer === 'landlord'}
                      onChange={() => setMaintenanceBearer('landlord')}
                      className="text-blue-600"
                    />
                    <span>Landlord Pays Structural Maintenance</span>
                  </label>
                </div>
              </div>

              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={clauseUtility}
                  onChange={(e) => setClauseUtility(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-xs text-slate-700">
                  <strong>Utility Bills Allocation:</strong> Tenant explicitly undertakes to pay electricity, water, internet, and gas bills directly based on actual meter readings.
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
                  <strong>Structural Alteration Bar:</strong> Restricts the Tenant from making permanent modifications or structural shifts to beams/pillars without prior written authorization.
                </span>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={clauseSubletting}
                  onChange={(e) => setClauseSubletting(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-xs text-slate-700">
                  <strong>Sub-Letting Prohibition:</strong> Completely bars the tenant from sub-leasing or assigning the premises to any third party without a fresh written contract.
                </span>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={clauseInspection}
                  onChange={(e) => setClauseInspection(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-xs text-slate-700">
                  <strong>Landlord Inspection Access (MTA Rule):</strong> Grants inspection rights to the Landlord during business/daylight hours subject to a minimum 24-hour advance written notice.
                </span>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={clauseForceMajeure}
                  onChange={(e) => setClauseForceMajeure(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-xs text-slate-700">
                  <strong>Force Majeure Protocol:</strong> Explicit rules regarding rent waivers/suspensions during natural disasters, epidemics, or government-mandated lockdowns.
                </span>
              </label>
            </div>

            {/* 4. Dynamic Custom Clause Injector */}
            <div className="pt-4 border-t border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    4. Dynamic Custom Clause Injector <span className="text-slate-400 font-normal text-xs">(Optional)</span>
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Append unique terms with individual delete actions
                  </span>
                </div>

                <button
                  type="button"
                  onClick={addCustomClause}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white font-bold text-xs transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Custom Clause</span>
                </button>
              </div>

              {customClauses.map((clause, idx) => (
                <div key={clause.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-blue-700">Custom Condition #{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeCustomClause(clause.id)}
                      className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                    <input
                    type="text"
                    value={clause.title}
                    onChange={(e) => updateCustomClause(clause.id, 'title', e.target.value)}
                    placeholder={getPlaceholder("Enter Clause Title")}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-900"
                  />
                  <textarea
                    rows={2}
                    value={clause.description}
                    onChange={(e) => updateCustomClause(clause.id, 'description', e.target.value)}
                    placeholder={getPlaceholder("Enter full legal condition / stipulation...")}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-900 resize-none"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= PAGE 5 ================= */}
        {currentPage === 5 && (
          <form onSubmit={handleSubmit} className="space-y-6 animate-fadeIn">
            {/* 1. Mandatory Attestation (Two Witnesses) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-700 uppercase tracking-wider block">
                  1. Attestation (Two Witnesses)
                </span>
                <button
                  type="button"
                  onClick={() => handlePlayFieldSpeech('witnessDetails')}
                  className="text-slate-400 hover:text-blue-600 transition-colors p-1"
                  title="Listen to field guide"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Witness 1 */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <span className="text-xs font-bold text-slate-800">Witness 1 Details <span className="text-red-500 font-bold">*</span></span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    required
                    value={w1Name}
                    onChange={(e) => setW1Name(e.target.value)}
                    placeholder={getPlaceholder("Witness 1 Full Legal Name")}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900"
                  />
                  <input
                    type="text"
                    required
                    value={w1FatherName}
                    onChange={(e) => setW1FatherName(e.target.value)}
                    placeholder={getPlaceholder("Father's / Husband's Name")}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900"
                  />
                </div>
                <input
                  type="text"
                  required
                  value={w1Address}
                  onChange={(e) => setW1Address(e.target.value)}
                  placeholder={getPlaceholder("Complete Residential Address")}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900"
                />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={w1Mobile}
                    onChange={(e) => setW1Mobile(e.target.value.replace(/\D/g, ''))}
                    placeholder={getPlaceholder("10-Digit Mobile Number")}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900"
                  />
                  <DateOfBirthPicker
                    label="Age / Date of Birth"
                    value={w1Age}
                    onChange={setW1Age}
                    placeholder={getPlaceholder("DD/MM/YYYY")}
                    helperText={showExampleDetails ? "Optional" : undefined}
                  />
                  <input
                    type="text"
                    value={w1IdNumber}
                    onChange={(e) => setW1IdNumber(e.target.value)}
                    placeholder={getPlaceholder("ID Doc Number (Aadhaar/Voter ID/DL) (Optional)")}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900"
                  />
                </div>
              </div>

              {/* Witness 2 */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <span className="text-xs font-bold text-slate-800">Witness 2 Details <span className="text-red-500 font-bold">*</span></span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    required
                    value={w2Name}
                    onChange={(e) => setW2Name(e.target.value)}
                    placeholder={getPlaceholder("Witness 2 Full Legal Name")}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900"
                  />
                  <input
                    type="text"
                    required
                    value={w2FatherName}
                    onChange={(e) => setW2FatherName(e.target.value)}
                    placeholder={getPlaceholder("Father's / Husband's Name")}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900"
                  />
                </div>
                <input
                  type="text"
                  required
                  value={w2Address}
                  onChange={(e) => setW2Address(e.target.value)}
                  placeholder={getPlaceholder("Complete Residential Address")}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900"
                />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={w2Mobile}
                    onChange={(e) => setW2Mobile(e.target.value.replace(/\D/g, ''))}
                    placeholder={getPlaceholder("10-Digit Mobile Number")}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900"
                  />
                  <DateOfBirthPicker
                    label="Age / Date of Birth"
                    value={w2Age}
                    onChange={setW2Age}
                    placeholder={getPlaceholder("DD/MM/YYYY")}
                    helperText={showExampleDetails ? "Optional" : undefined}
                  />
                  <input
                    type="text"
                    value={w2IdNumber}
                    onChange={(e) => setW2IdNumber(e.target.value)}
                    placeholder={getPlaceholder("ID Doc Number (Aadhaar/Voter ID/DL) (Optional)")}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900"
                  />
                </div>
              </div>
            </div>

            {/* 2. Legal Execution Mode */}
            <div className="pt-4 border-t border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-700 uppercase tracking-wider block">
                  2. Legal Execution Mode <span className="text-red-500 font-bold">*</span>
                </span>
                <button
                  type="button"
                  onClick={() => handlePlayFieldSpeech('executionMode')}
                  className="text-slate-400 hover:text-blue-600 transition-colors p-1"
                  title="Listen to field guide"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Online Only */}
                <label
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    executionMode === 'digital'
                      ? 'border-blue-600 bg-blue-50/70 ring-1 ring-blue-600'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="executionMode"
                    checked={executionMode === 'digital'}
                    onChange={() => setExecutionMode('digital')}
                    className="sr-only"
                  />
                  <Download className="w-5 h-5 text-blue-600 mb-1" />
                  <span className="text-xs font-bold text-black block">Online Only (Digital Delivery)</span>
                  <span className="text-[10px] text-slate-500 mt-0.5 block leading-tight">
                    Instant digital stamping &amp; Aadhaar OTP eSign
                  </span>
                  <span className="text-[10px] text-emerald-600 font-bold block mt-1.5">
                    Ready in 1-2 Hours · ₹0 Courier
                  </span>
                </label>

                {/* Offline Only */}
                <label
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    executionMode === 'physical'
                      ? 'border-blue-600 bg-blue-50/70 ring-1 ring-blue-600'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="executionMode"
                    checked={executionMode === 'physical'}
                    onChange={() => setExecutionMode('physical')}
                    className="sr-only"
                  />
                  <Truck className="w-5 h-5 text-blue-600 mb-1" />
                  <span className="text-xs font-bold text-black block">Offline Only (Physical Courier)</span>
                  <span className="text-[10px] text-slate-500 mt-0.5 block leading-tight">
                    Official Physical Stamp Paper with wet-ink signatures
                  </span>
                  <span className="text-[10px] text-blue-600 font-bold block mt-1.5">
                    +₹50 Courier Fee
                  </span>
                </label>

                {/* Hybrid Mode */}
                <label
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    executionMode === 'hybrid'
                      ? 'border-blue-600 bg-blue-50/70 ring-1 ring-blue-600'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="executionMode"
                    checked={executionMode === 'hybrid'}
                    onChange={() => setExecutionMode('hybrid')}
                    className="sr-only"
                  />
                  <Layers className="w-5 h-5 text-blue-600 mb-1" />
                  <span className="text-xs font-bold text-black block">Hybrid Mode (Digital + Physical)</span>
                  <span className="text-[10px] text-slate-500 mt-0.5 block leading-tight">
                    Instant verified digital copy + dispatched physical stamp
                  </span>
                  <span className="text-[10px] text-blue-600 font-bold block mt-1.5">
                    +₹50 Courier Fee
                  </span>
                </label>
              </div>

              {/* Physical Delivery Alert Notice and Shipping Form */}
              {executionMode !== 'digital' && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3 animate-fadeIn">
                  <div className="flex items-start gap-2.5 text-amber-900 text-xs">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong>Physical Dispatch Notice:</strong>
                      <p className="mt-0.5 text-amber-800">
                        Delivery will take <strong>2 business days</strong> for physical dispatch via Speed Post. Your digital copy will still be provided immediately within <strong>1-2 hours</strong>.
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-amber-200/70 space-y-2.5">
                    <span className="text-xs font-bold text-amber-950 uppercase tracking-wider block">
                      Doorstep Shipping Details
                    </span>

                    <input
                      type="text"
                      required
                      value={shippingAddress}
                      onChange={(e) => setShippingAddress(e.target.value)}
                      placeholder={getPlaceholder("Enter Complete Street Address with City and State")}
                      className="w-full bg-white border border-amber-300 rounded-lg px-3 py-1.5 text-xs text-slate-900"
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <input
                        type="text"
                        maxLength={6}
                        inputMode="numeric"
                        pattern="[0-9]*"
                        required
                        value={shippingPincode}
                        onChange={(e) => setShippingPincode(e.target.value.replace(/\D/g, ''))}
                        placeholder={getPlaceholder("Enter 6-Digit Pincode")}
                        className="w-full bg-white border border-amber-300 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-900"
                      />
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={shippingPhone}
                        onChange={(e) => setShippingPhone(e.target.value.replace(/\D/g, ''))}
                        placeholder={getPlaceholder("Recipient 10-Digit Mobile")}
                        className="w-full bg-white border border-amber-300 rounded-lg px-3 py-1.5 text-xs text-slate-900"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Submit Verification Mode Selection */}
            <div className="space-y-3 pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                    Verification &amp; Review Mode <span className="text-red-500 font-bold">*</span>
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Choose how your rental draft should be reviewed before e-stamp procurement
                  </span>
                </div>
                <span className="text-[11px] text-blue-600 font-semibold hidden sm:inline">2 Options Available</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Mode A: Self-Verified (₹0) */}
                <div
                  onClick={() => setVerificationMode('self')}
                  role="button"
                  tabIndex={0}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    verificationMode === 'self'
                      ? 'bg-blue-50/80 border-blue-600 shadow-xs ring-2 ring-blue-600/50'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className={`w-5 h-5 ${verificationMode === 'self' ? 'text-blue-600' : 'text-slate-400'}`} />
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                        Self-Verified
                      </h4>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      ₹0 Extra (Free)
                    </span>
                  </div>
                  <p className="mt-2 text-[11px] text-slate-600 leading-relaxed">
                    You confirm all entered details. Immediate processing via automated system.
                  </p>
                </div>

                {/* Mode B: Expert Legal Re-check (+₹10) */}
                <div
                  onClick={() => setVerificationMode('expert')}
                  role="button"
                  tabIndex={0}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    verificationMode === 'expert'
                      ? 'bg-purple-50/80 border-purple-600 shadow-xs ring-2 ring-purple-600/50'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className={`w-5 h-5 ${verificationMode === 'expert' ? 'text-purple-600' : 'text-slate-400'}`} />
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                        Expert Legal Re-check
                      </h4>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                      +₹10 Extra
                    </span>
                  </div>
                  <p className="mt-2 text-[11px] text-slate-600 leading-relaxed">
                    Manual review of names, addresses, rental clauses, and stamp accuracy by our legal team.
                  </p>
                </div>
              </div>
            </div>

            {/* Dynamic Pricing Summary */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-3 border-b border-slate-200">
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                    Total Legal Fee &amp; Disbursements
                  </span>
                  <div className="text-xl sm:text-2xl font-black text-black mt-0.5">
                    After delivery you will pay: <span className="text-blue-600">₹{pricing.totalPayable}</span>
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 inline-block">
                    Zero Upfront Payment
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Stamp Paper Value ({selectedState} Matrix):</span>
                  <span className="font-semibold text-slate-900">₹{pricing.effectiveStamp}</span>
                </div>
                <div className="flex justify-between">
                  <span>Aadhaar e-Sign (Landlord &amp; Tenant + GST):</span>
                  <span className="font-semibold text-slate-900">₹{pricing.eSign}</span>
                </div>
                <div className="flex justify-between">
                  <span>Government e-Sign Purchasing Charges:</span>
                  <span className="font-semibold text-slate-900">₹{pricing.govtPurchasing}</span>
                </div>
                <div className="flex justify-between">
                  <span>Platform Fee (Cotex Compliance):</span>
                  <span className="font-semibold text-slate-900">₹{pricing.platformFee}</span>
                </div>
                {pricing.courierFee > 0 && (
                  <div className="flex justify-between text-blue-700 font-semibold">
                    <span>Physical Speed Post Courier Surcharge:</span>
                    <span>+₹{pricing.courierFee}</span>
                  </div>
                )}
                {pricing.expertFee > 0 && (
                  <div className="flex justify-between text-purple-700 font-semibold">
                    <span>Expert Legal Re-check (Manual Verification):</span>
                    <span>+₹{pricing.expertFee}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-sm text-black">
                  <span>Total Amount Due (Post-Delivery):</span>
                  <span className="text-blue-600">₹{pricing.totalPayable}</span>
                </div>
              </div>
            </div>

            {/* 5 Legal Declaration Checkboxes with Speaker Voice Audio */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    Legal Declarations (5 Declarations) <span className="text-red-500 font-bold">*</span>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Speaker button to read all 5 declarations aloud */}
                  <button
                    type="button"
                    onClick={handlePlayDeclarationsSpeech}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isSpeakingDeclarations
                        ? 'bg-rose-100 text-rose-700 border border-rose-300 animate-pulse'
                        : 'bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-200'
                    }`}
                    title="Listen to 5 declarations in voice"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>{isSpeakingDeclarations ? 'Stop Voice' : '🔊 Listen to Declarations'}</span>
                  </button>

                  {/* Select All toggle */}
                  <button
                    type="button"
                    onClick={handleToggleAllDeclarations}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-white text-slate-700 border border-slate-300 hover:bg-slate-100 cursor-pointer"
                  >
                    {declarations.every(Boolean) ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
              </div>

              <div className="space-y-2.5">
                {[
                  "1. I have carefully read and agreed to all terms and conditions of this rental agreement.",
                  "2. All personal identity and address details of landlord, tenant, and witnesses provided are true and verified.",
                  "3. This deed/agreement is being executed with free consent without any coercion, fraud, or undue influence.",
                  "4. I understand and accept full responsibility for compliance with state stamp duty and Aadhaar e-Sign regulations.",
                  "5. I confirm and agree to pay the post-delivery fee upon receipt of the verified legal document."
                ].map((declarationText, idx) => (
                  <label
                    key={idx}
                    className={`flex items-start gap-3 p-2.5 rounded-xl border transition-all cursor-pointer select-none ${
                      declarations[idx]
                        ? 'bg-emerald-50/70 border-emerald-300 text-slate-900 shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={declarations[idx]}
                      onChange={(e) => {
                        const updated = [...declarations];
                        updated[idx] = e.target.checked;
                        setDeclarations(updated);
                      }}
                      className="mt-0.5 w-4 h-4 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500 cursor-pointer shrink-0"
                    />
                    <span className="text-xs leading-relaxed">
                      {declarationText}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Disclaimer Checkbox */}
            <div className="p-4 bg-blue-50/50 border border-blue-200 rounded-xl">
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  required
                  checked={disclaimerAccepted}
                  onChange={(e) => setDisclaimerAccepted(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-600 cursor-pointer"
                />
                <span className="text-xs text-slate-700 leading-relaxed">
                  I verify that all entries are correct. Cotex Compliance acts strictly as an automated processing intermediary under the IT Act, 2000 and Model Tenancy Act guidelines.
                </span>
              </label>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setCurrentPage(4)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs cursor-pointer transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <button
                type="submit"
                disabled={isSubmitting || !disclaimerAccepted}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs sm:text-sm shadow-md disabled:opacity-50 cursor-pointer transition-all"
              >
                {isSubmitting ? 'Creating Docket...' : 'Submit & Generate Legal Rental Docket'}
                <Sparkles className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* Step Navigation Controls for Pages 1 to 4 */}
        {currentPage < 5 && (
          <div className="flex items-center justify-between pt-6 border-t border-slate-200 mt-6">
            <button
              type="button"
              onClick={currentPage === 1 ? onBack : () => setCurrentPage((p) => p - 1)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{currentPage === 1 ? 'Cancel' : 'Previous Page'}</span>
            </button>

            <button
              type="button"
              onClick={() => validateAndProceed(currentPage + 1)}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs sm:text-sm shadow-xs cursor-pointer transition-all"
            >
              <span>Next</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
