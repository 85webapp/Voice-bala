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
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { LegalDocument, OrderItem } from '../types';
import { STATE_CATEGORIES, getSafeStampDuty } from '../data/stampDutyMatrix';
import { DateOfBirthPicker } from './DateOfBirthPicker';
import { useExampleDetails } from '../hooks/useExampleDetails';
import { AddressFieldGroup } from './AddressFieldGroup';
import {
  PropertyBoundariesSection,
  PropertyBoundariesState,
  createInitialPropertyBoundaries,
  formatSingleBoundary,
  areAllBoundariesFilled
} from './PropertyBoundariesSection';
import { WitnessDetailsCard } from './WitnessDetailsCard';
import { WhiteSelect } from './WhiteSelect';
import {
  COMPANY_SUBTYPE_OPTIONS,
  COMPANY_DESIGNATION_OPTIONS,
  isGstinRequiredForSubType,
  getCompanyRegFieldMeta,
  isAuthDateRequired,
  getCompanyFieldLabels,
  ENTITY_AUTH_CONFIRM_LABEL
} from './CompanyEntityFields';
import {
  CircleIndicator,
  optionCardClass,
  TOPIC_DIVIDER_CLASS,
  SUBQUESTION_DIVIDER_CLASS
} from './OptionControl';
import {
  LatePaymentFeesSection,
  LatePaymentFeesValue,
  DEFAULT_LATE_PAYMENT_FEES,
  validateLatePaymentFees
} from './LatePaymentFeesSection';
import {
  encryptFormDataAndSign,
  saveLightweightMetadata,
  postEncryptedPayloadToWebsiteB,
  playConfirmationChime,
  generateSequentialOrderId,
  buildSubmissionOverview,
  fieldEntry,
  checkboxEntry,
  readFileAsUploadPayload,
  UploadedDocumentPayload,
  ServerBSyncResult
} from '../services/encryptionService';
import { ExternalLink, Lock } from 'lucide-react';
import { showToast } from '../services/toastService';
import { ServerBSyncStatusCard } from './ServerBSyncStatusCard';
import { VoiceGuidanceButton } from './VoiceGuidanceButton';
import { FormRequestTabBar, HorizontalSwipeContainer, WizardModeTab } from './FormRequestTabBar';
import { QuickCallbackRequestPanel } from './QuickCallbackRequestPanel';
import { TopicHeader } from './TopicHeader';
import { SignatoryAuthoritySection } from './SignatoryAuthoritySection';

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
  pan: string;
}

interface CoOccupant {
  id: string;
  fullName: string;
  age: string;
  relationship: string;
}

interface FurnishedItem {
  id: string;
  itemName: string;
  price: string;
  uniqueId: string;
  condition: 'Good' | 'Average' | 'Bad' | 'New';
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
  const [activeTab, setActiveTab] = useState<WizardModeTab>('form');
  const [currentPage, setCurrentPage] = useState<number>(1);

  // --- SERVICE & STAMP SELECTION ---
  const [docCategory, setDocCategory] = useState<'residential' | 'commercial'>(() => {
    const lower = initialDoc.title.toLowerCase();
    if (lower.includes('commercial') || lower.includes('business')) return 'commercial';
    return 'residential';
  });

  const [selectedState, setSelectedState] = useState<string>('Uttar Pradesh');
  const [tenancyPurpose, setTenancyPurpose] = useState<'residential' | 'commercial' | 'mixed'>(
    docCategory === 'commercial' ? 'commercial' : 'residential'
  );
  const [mixedUseArea, setMixedUseArea] = useState('');
  const [stampProcurementMode, setStampProcurementMode] = useState<'estamp' | 'physical_upload'>('estamp');
  const [physicalStampFile, setPhysicalStampFile] = useState<UploadedDocumentPayload | null>(null);
  const physicalStampUploaded = Boolean(physicalStampFile);

  const handleRealFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
    fieldLabel: string,
    setter: React.Dispatch<React.SetStateAction<UploadedDocumentPayload | null>>
  ) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const payload = await readFileAsUploadPayload(file, fieldLabel);
    if (payload) {
      setter(payload);
      showToast(`${payload.fileName} attached successfully.`, 'success', 3000);
    }
  };

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
  const [landlordPan, setLandlordPan] = useState('');

  // Strict 10-char PAN input sanitization
  const handlePanInput = (raw: string, setter: (val: string) => void) => {
    const sanitized = raw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
    setter(sanitized);
  };

  // Corporate Landlord fields
  const [corporateRegNumber, setCorporateRegNumber] = useState('');
  const [corporateGstin, setCorporateGstin] = useState('');
  const [landlordIncorporationDate, setLandlordIncorporationDate] = useState('');
  const [corporateAuthDate, setCorporateAuthDate] = useState('');
  const [corporateAddress, setCorporateAddress] = useState('');
  const [authSignatoryName, setAuthSignatoryName] = useState('');
  const [authSignatoryDesignation, setAuthSignatoryDesignation] = useState('Authorized Signatory');
  const [authSignatoryCustomDesignation, setAuthSignatoryCustomDesignation] = useState('');
  const [landlordEntityAuthConfirmed, setLandlordEntityAuthConfirmed] = useState(false);
  const [showLandlordEntityAuthError, setShowLandlordEntityAuthError] = useState(false);

  // POA Holder fields
  const [hasPoa, setHasPoa] = useState(false);
  const [poaName, setPoaName] = useState('');
  const [poaAddress, setPoaAddress] = useState('');
  const [poaFile, setPoaFile] = useState<UploadedDocumentPayload | null>(null);
  const poaFileUploaded = Boolean(poaFile);

  // Property Proof
  const [ownershipProofType, setOwnershipProofType] = useState<string>('Electricity Bill');
  const [propertyDocFile, setPropertyDocFile] = useState<UploadedDocumentPayload | null>(null);
  const propertyDocUploaded = Boolean(propertyDocFile);

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
  const [commercialEntityType, setCommercialEntityType] = useState<string>('Private Limited Company (Pvt Ltd)');
  const [commercialCompanyName, setCommercialCompanyName] = useState('');
  const [commercialOfficeAddress, setCommercialOfficeAddress] = useState('');
  const [commercialCin, setCommercialCin] = useState('');
  const [commercialCompanyPan, setCommercialCompanyPan] = useState('');
  const [commercialIncDate, setCommercialIncDate] = useState('');
  const [commercialEmail, setCommercialEmail] = useState('');
  const [commercialMobile, setCommercialMobile] = useState('');
  const [commercialRepName, setCommercialRepName] = useState('');
  const [commercialRepDesignation, setCommercialRepDesignation] = useState('Authorized Signatory');
  const [commercialRepCustomDesignation, setCommercialRepCustomDesignation] = useState('');
  const [commercialAuthDate, setCommercialAuthDate] = useState('');
  const [authDocFile, setAuthDocFile] = useState<UploadedDocumentPayload | null>(null);
  const authDocUploaded = Boolean(authDocFile);
  const [commercialGstin, setCommercialGstin] = useState('');
  const [commercialEntityAuthConfirmed, setCommercialEntityAuthConfirmed] = useState(false);
  const [showCommercialEntityAuthError, setShowCommercialEntityAuthError] = useState(false);

  // --- STEP 4: PROPERTY DETAILS ---
  const [propertyAddress, setPropertyAddress] = useState('');
  const [propertyBoundaries, setPropertyBoundaries] = useState<PropertyBoundariesState>(createInitialPropertyBoundaries);
  const [propertyBoundariesOptional, setPropertyBoundariesOptional] = useState<boolean>(false);
  const [propertyType, setPropertyType] = useState<string>('Flat / Apartment');
  const [furnishingStatus, setFurnishingStatus] = useState<'Furnished' | 'Semi Furnished' | 'Unfurnished'>('Unfurnished');
  const [furnishedItems, setFurnishedItems] = useState<FurnishedItem[]>([]);

  const addFurnishedItem = () => {
    setFurnishedItems((prev) => [
      ...prev,
      {
        id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        itemName: '',
        price: '',
        uniqueId: '',
        condition: 'Good'
      }
    ]);
  };

  const updateFurnishedItem = (id: string, field: keyof FurnishedItem, val: string) => {
    setFurnishedItems((prev) => prev.map((item) => (item.id === id ? { ...item, [field]: val } : item)));
  };

  const removeFurnishedItem = (id: string) => {
    setFurnishedItems((prev) => prev.filter((item) => item.id !== id));
  };

  // --- STEP 5: LEASE TERMS & STATUTORY CONDITIONS ---
  const [leaseTenure, setLeaseTenure] = useState<string>('11 Months');
  const [customTenure, setCustomTenure] = useState('');
  const [commencementDate, setCommencementDate] = useState('');
  const [monthlyRent, setMonthlyRent] = useState<string>('');
  const [rentDueDate, setRentDueDate] = useState<string>('5th of every calendar month');
  const [securityDeposit, setSecurityDeposit] = useState<string>('');
  const [noticePeriod, setNoticePeriod] = useState<string>('1 Month');
  const [paymentChannel, setPaymentChannel] = useState<string>('Any Type');

  // Who Will Pay (Utility Bills dropdown checklist)
  const UTILITY_BILL_ITEMS = [
    'Electricity Bill',
    'Water Bill',
    'Gas Bill',
    'Telephone Bill',
    'Internet / Broadband Bill'
  ];
  const [utilityBillsDropdownOpen, setUtilityBillsDropdownOpen] = useState<boolean>(false);
  const [tenantUtilityBills, setTenantUtilityBills] = useState<Record<string, boolean>>({
    'Electricity Bill': false,
    'Water Bill': false,
    'Gas Bill': false,
    'Telephone Bill': false,
    'Internet / Broadband Bill': false
  });
  const toggleUtilityBill = (billName: string) => {
    setTenantUtilityBills((prev) => ({ ...prev, [billName]: !prev[billName] }));
  };

  // Society & Small/Big Maintenance
  const [societyMaintenanceBy, setSocietyMaintenanceBy] = useState<'Tenant' | 'Owner'>('Tenant');
  const [smallMaintenanceBy, setSmallMaintenanceBy] = useState<'Tenant' | 'Owner'>('Tenant');
  const [bigMaintenanceBy, setBigMaintenanceBy] = useState<'Owner' | 'Tenant'>('Owner');

  // Commercial Configurations
  const [rentEscalation, setRentEscalation] = useState<string>('5% Annually');
  const [customEscalation, setCustomEscalation] = useState('');
  const [delayedRentInterest, setDelayedRentInterest] = useState<string>('12% Per Annum');

  // Lock-in Period (Checkbox + Duration + Break Fine Amount)
  const [hasLockInPeriod, setHasLockInPeriod] = useState<boolean>(false);
  const [lockInPeriod, setLockInPeriod] = useState<string>('1 Month');
  const [customLockInDuration, setCustomLockInDuration] = useState<string>('');
  const [lockInFineAmount, setLockInFineAmount] = useState<string>('');

  // Late Payment Fees (Standardized across all forms)
  const [latePayment, setLatePayment] = useState<LatePaymentFeesValue>(DEFAULT_LATE_PAYMENT_FEES);

  // Statutory Clauses (Zero pre-selections by default)
  const [clauseStructural, setClauseStructural] = useState(false);
  const [clauseSubletting, setClauseSubletting] = useState(false);
  const [clausePetsAllowed, setClausePetsAllowed] = useState(false);
  const [clauseInspection, setClauseInspection] = useState(false);
  const [clauseForceMajeure, setClauseForceMajeure] = useState(false);
  const [signatoryAuthorized, setSignatoryAuthorized] = useState(false);
  const [showSignatoryError, setShowSignatoryError] = useState(false);

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

  // PAN strictly mandatory for both Landlord and Tenant in Rent / Lease Agreements
  const isPanMandatoryUnder194IB = true;

  // --- STEP 6: WITNESS DETAILS & EXECUTION FORMAT ---
  const [w1Name, setW1Name] = useState('');
  const [w1FatherName, setW1FatherName] = useState('');
  const [w1Profession, setW1Profession] = useState('');
  const [w1Email, setW1Email] = useState('');
  const [w1Above18, setW1Above18] = useState(false);
  const [w1Address, setW1Address] = useState('');
  const [w1Mobile, setW1Mobile] = useState('');

  const [w2Name, setW2Name] = useState('');
  const [w2FatherName, setW2FatherName] = useState('');
  const [w2Profession, setW2Profession] = useState('');
  const [w2Email, setW2Email] = useState('');
  const [w2Above18, setW2Above18] = useState(false);
  const [w2Address, setW2Address] = useState('');
  const [w2Mobile, setW2Mobile] = useState('');

  const [executionMode, setExecutionMode] = useState<'digital' | 'physical' | 'hybrid'>('digital');
  const [shippingAddress, setShippingAddress] = useState('');
  const [shippingPincode, setShippingPincode] = useState('');
  const [shippingPhone, setShippingPhone] = useState('');

  // Verification Mode: 'self' (₹0) vs 'expert' (+₹10)
  const [verificationMode, setVerificationMode] = useState<'self' | 'expert'>('self');

  // 5 Legal Declaration Checkboxes
  const [declarations, setDeclarations] = useState<boolean[]>([false, false, false, false, false]);

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

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (currentPage === 2) {
      const isCorp = landlordEntityType !== 'Individual' && landlordEntityType !== 'Joint Owners';
      const isCorpGstinReq = landlordEntityType === 'Private Limited / Public Limited Company';
      if (!isCorp) {
        if (!landlordName.trim() || !landlordAddress.trim()) {
          showToast('Please fill mandatory Landlord Name and Address.', 'warning');
          return;
        }
      } else {
        if (!landlordName.trim() || !corporateAddress.trim() || !authSignatoryName.trim()) {
          showToast('Please fill Entity Name, Registered Office Address of Company, and Authorized Signatory details.', 'warning');
          return;
        }
        const cleanCorpGstin = corporateGstin.trim().toUpperCase();
        if (isCorpGstinReq && cleanCorpGstin.length !== 15) {
          showToast('Please enter a valid 15-character Company / Firm GSTIN Number for Landlord.', 'warning');
          return;
        }
        if (!isCorpGstinReq && cleanCorpGstin.length > 0 && cleanCorpGstin.length !== 15) {
          showToast('If entering GSTIN for Landlord, please enter all 15 characters.', 'warning');
          return;
        }
      }

      if (landlordMobile.replace(/\D/g, '').length !== 10) {
        showToast('Please enter a valid 10-digit Mobile Number for Landlord.', 'warning');
        return;
      }

      if (!emailRegex.test(landlordEmail.trim())) {
        showToast('Please enter a valid Email Address for Landlord.', 'warning');
        return;
      }

      if (landlordPan.trim().length !== 10) {
        showToast(isCorp ? 'Landlord 10-character Company / Firm PAN Card is mandatory.' : 'Landlord 10-character PAN Card Number is mandatory.', 'warning');
        return;
      }

      if (isCorp && !landlordEntityAuthConfirmed) {
        setShowLandlordEntityAuthError(true);
        showToast(`Please tick "${ENTITY_AUTH_CONFIRM_LABEL}" for Landlord.`, 'warning');
        return;
      }

      if (hasPoa) {
        if (!poaName.trim() || !poaAddress.trim()) {
          showToast('Please provide Power of Attorney holder name and address.', 'warning');
          return;
        }
      }
    }

    if (currentPage === 3) {
      if (docCategory === 'residential') {
        if (!tenantName.trim() || !tenantAddress.trim()) {
          showToast('Please fill mandatory Tenant Name and Address.', 'warning');
          return;
        }
        if (tenantMobile.replace(/\D/g, '').length !== 10) {
          showToast('Please enter a valid 10-digit Mobile Number for Tenant.', 'warning');
          return;
        }
        if (!emailRegex.test(tenantEmail.trim())) {
          showToast('Please enter a valid Email Address for Tenant.', 'warning');
          return;
        }
        if (tenantPan.trim().length !== 10) {
          showToast('Tenant 10-character PAN Card Number is mandatory.', 'warning');
          return;
        }
      } else {
        const commLabels = getCompanyFieldLabels(commercialEntityType);
        const commRegMeta = getCompanyRegFieldMeta(commercialEntityType);
        const isCommSole = commercialEntityType === 'Sole Proprietorship Firm';
        const isCommGstinReq = isGstinRequiredForSubType(commercialEntityType);

        if (!commercialCompanyName.trim()) {
          showToast(`Please enter ${commLabels.entityNameLabel} for Commercial Tenant.`, 'warning');
          return;
        }
        if (!commercialRepName.trim()) {
          showToast(`Please enter ${commLabels.signatoryLabel} for Commercial Tenant.`, 'warning');
          return;
        }
        if (commRegMeta.required && !commercialCin.trim()) {
          showToast(`Please enter ${commRegMeta.label} for Commercial Tenant.`, 'warning');
          return;
        }
        const cleanCommGstin = commercialGstin.trim().toUpperCase();
        if (isCommGstinReq && cleanCommGstin.length !== 15) {
          showToast('Please enter a valid 15-character GSTIN Number for Commercial Tenant.', 'warning');
          return;
        }
        if (!isCommGstinReq && cleanCommGstin.length > 0 && cleanCommGstin.length !== 15) {
          showToast('If entering GSTIN for Commercial Tenant, please enter all 15 characters.', 'warning');
          return;
        }
        if (commercialCompanyPan.trim().length !== 10) {
          showToast(`Commercial Tenancy requires a valid 10-character ${commLabels.panLabel}.`, 'warning');
          return;
        }
        if (!emailRegex.test(commercialEmail.trim())) {
          showToast('Please enter a valid Email Address for Commercial Tenant.', 'warning');
          return;
        }
        if (commercialMobile.replace(/\D/g, '').length !== 10) {
          showToast('Please enter a valid 10-digit Mobile Number for Commercial Tenant.', 'warning');
          return;
        }
        if (!commercialOfficeAddress.trim()) {
          showToast(`Please enter ${commLabels.addressLabel} for Commercial Tenant.`, 'warning');
          return;
        }
        if (!isCommSole && isAuthDateRequired(commercialEntityType) && !commercialAuthDate.trim()) {
          showToast('Please select Board Resolution / Auth Letter Date for Commercial Tenant.', 'warning');
          return;
        }
        if (!commercialEntityAuthConfirmed) {
          setShowCommercialEntityAuthError(true);
          showToast(`Please tick "${ENTITY_AUTH_CONFIRM_LABEL}" for Commercial Tenant.`, 'warning');
          return;
        }
      }
    }

    if (currentPage === 4) {
      if (!propertyAddress.trim()) {
        showToast('Please fill mandatory Property Address.', 'warning');
        return;
      }
      if (!propertyBoundariesOptional && !areAllBoundariesFilled(propertyBoundaries)) {
        showToast('Please complete all 4 Property Boundaries (East, West, North, South) or check Change to Optional.', 'warning');
        return;
      }
    }

    if (currentPage === 5) {
      if (!monthlyRent || numericRent <= 0) {
        showToast('Please enter Monthly Rent Amount.', 'warning');
        return;
      }
      if (!securityDeposit || numericDeposit < 0) {
        showToast('Please enter Security Deposit Amount.', 'warning');
        return;
      }
      const lateErr = validateLatePaymentFees(latePayment, true);
      if (lateErr) {
        showToast(lateErr, 'warning');
        return;
      }
      if (!signatoryAuthorized) {
        setShowSignatoryError(true);
        showToast('Please confirm Signatory Authority to proceed.', 'warning');
        return;
      }
    }

    setCurrentPage(targetNext);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!w1Name.trim() || !w1FatherName.trim() || !w1Address.trim()) {
      showToast('Please fill Witness 1 Name, Father/Husband Name, and Residential Address.', 'warning');
      return;
    }
    if (!emailRegex.test(w1Email.trim())) {
      showToast('Please enter a valid Email Address for Witness 1.', 'warning');
      return;
    }
    if (w1Mobile.replace(/\D/g, '').length !== 10) {
      showToast('Please enter a valid 10-digit Mobile Number for Witness 1.', 'warning');
      return;
    }
    if (!w1Above18) {
      showToast('Please confirm that Witness 1 is above 18+.', 'warning');
      return;
    }

    if (!w2Name.trim() || !w2FatherName.trim() || !w2Address.trim()) {
      showToast('Please fill Witness 2 Name, Father/Husband Name, and Residential Address.', 'warning');
      return;
    }
    if (!emailRegex.test(w2Email.trim())) {
      showToast('Please enter a valid Email Address for Witness 2.', 'warning');
      return;
    }
    if (w2Mobile.replace(/\D/g, '').length !== 10) {
      showToast('Please enter a valid 10-digit Mobile Number for Witness 2.', 'warning');
      return;
    }
    if (!w2Above18) {
      showToast('Please confirm that Witness 2 is above 18+.', 'warning');
      return;
    }

    if (executionMode !== 'digital') {
      if (!shippingAddress.trim() || shippingPincode.replace(/\D/g, '').length !== 6) {
        showToast('Please provide complete physical shipping address and 6-digit pincode.', 'warning');
        return;
      }
      if (shippingPhone.replace(/\D/g, '').length !== 10) {
        showToast('Please provide a valid 10-digit Shipping Contact Number.', 'warning');
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
      const now = new Date();
      const todayISO = now.toISOString().split('T')[0];
      const newOrderId = generateSequentialOrderId();

      const formattedDocTitle =
        docCategory === 'commercial'
          ? 'Commercial Lease Agreement (MTA Compliant)'
          : 'Residential Rent Agreement (MTA Compliant)';

      const uploadedDocuments: UploadedDocumentPayload[] = [
        physicalStampFile,
        poaFile,
        propertyDocFile,
        authDocFile
      ].filter((doc): doc is UploadedDocumentPayload => Boolean(doc));

      const submissionOverview = buildSubmissionOverview({
        orderId: newOrderId,
        requestType: 'Rent / Lease Agreement Request',
        mainCategory: 'Rent & Property',
        subCategory: formattedDocTitle,
        availableCategories: ['Rent & Property', 'Agreements', 'Affidavits'],
        availableSubCategories: ['Residential Rent Agreement', 'Commercial Lease Agreement'],
        documentTitle: formattedDocTitle,
        date: now
      });

      const isCorpLandlord = landlordEntityType !== 'Individual' && landlordEntityType !== 'Joint Owners';

      const utilityPayStatusList = UTILITY_BILL_ITEMS.map((bill) =>
        tenantUtilityBills[bill] ? `Tenant pays ${bill}` : `Owner pays ${bill}`
      );
      const effectiveLockInDuration = hasLockInPeriod
        ? lockInPeriod === 'Custom'
          ? customLockInDuration || 'Custom'
          : lockInPeriod
        : 'None';

      const stateOptionLabels = STATE_CATEGORIES.map((s) => s.name);
      const stampBorneOptions = [
        'Shared Equally (50-50 Split)',
        'First Party (Landlord / Owner)',
        'Second Party (Tenant / Lessee)',
        'Custom Split'
      ];
      const landlordEntityOptions = [
        'Individual',
        'Joint Owners',
        'Partnership Firm / LLP',
        'Private Limited / Public Limited Company',
        'HUF',
        'Trust / Society'
      ];
      const leaseTenureOptions = [
        '11 Months',
        '10 Months',
        '9 Months',
        '8 Months',
        '7 Months',
        '6 Months',
        '5 Months',
        '4 Months',
        '3 Months',
        '2 Months',
        '1 Month',
        'Custom Tenure'
      ];
      const rentDueDateOptions = [1, 5, 7, 10, 15, 20, 25, 30].map(
        (d) => `${d}th of every calendar month`
      );
      const noticePeriodOptions = ['1 Month', '2 Months', '3 Months', '15 Days'];
      const paymentChannelOptions = [
        'Any Type',
        'Bank Transfer (NEFT/RTGS/IMPS/UPI)',
        'Account Payee Cheque',
        'Cash / Other'
      ];
      const lockInPeriodOptions = ['1 Month', '2 Months', '3 Months', '6 Months', 'Custom'];
      const rentEscalationOptions = ['None', '5% Annually', '10% Annually', 'Custom Percentage'];
      const delayedInterestOptions = ['None', '12% Per Annum', '18% Per Annum'];
      const declarationTexts = [
        '1. I have carefully read and agreed to all terms and conditions of this rental agreement.',
        '2. All personal identity and address details of landlord, tenant, and witnesses provided are true and verified.',
        '3. This deed/agreement is being executed with free consent without any coercion, fraud, or undue influence.',
        '4. I understand and accept full responsibility for compliance with state stamp duty and Digital OTP e-Sign regulations.',
        '5. I confirm and agree to pay the post-delivery fee upon receipt of the verified legal document.'
      ];

      const sections = [
        {
          pageNumber: 1,
          sectionTitle: 'Document Category, State & Stamp Selection',
          fields: [
            fieldEntry('Document Category', docCategory === 'commercial' ? 'Commercial Lease Agreement' : 'Residential Rent Agreement', false, ['Residential Rent Agreement', 'Commercial Lease Agreement']),
            fieldEntry('Selected State / Union Territory', selectedState, false, stateOptionLabels),
            fieldEntry('Purpose of Tenancy Specifics', tenancyPurpose, false, ['residential', 'commercial', 'mixed']),
            fieldEntry('Mixed Use Area Details', mixedUseArea, true),
            fieldEntry('Stamp Paper Procurement Mode', stampProcurementMode === 'physical_upload' ? 'Physical Stamp Paper (User Upload)' : 'E-Stamp Paper / Digital Stamp', false, ['E-Stamp Paper / Digital Stamp', 'Physical Stamp Paper (User Upload)']),
            fieldEntry('Pre-Purchased Physical Stamp Uploaded', physicalStampFile ? `${physicalStampFile.fileName} (${Math.round(physicalStampFile.sizeBytes / 1024)} KB)` : '', true),
            fieldEntry('Selected Stamp Paper Value (INR)', `₹${pricing.effectiveStamp}`, false, ['₹10', '₹20', '₹50', '₹100', '₹500', '₹1000', 'Custom']),
            fieldEntry('Recommended Minimum State Stamp Duty', `₹${recommendedMinStamp}`, false),
            fieldEntry('Stamp Duty Cost Paid By', stampCostBorneBy, false, stampBorneOptions),
            fieldEntry('Custom Stamp Cost Split Details', customSplitText, stampCostBorneBy !== 'Custom Split')
          ]
        },
        {
          pageNumber: 2,
          sectionTitle: '1st Party / Landlord Details',
          fields: [
            fieldEntry('Lessor / Landlord Entity Type', landlordEntityType, false, landlordEntityOptions),
            fieldEntry(isCorpLandlord ? 'Entity Legal Name' : 'Full Legal Name', landlordName, false),
            fieldEntry('Company Registration / CIN / LLPIN', corporateRegNumber, !isCorpLandlord),
            fieldEntry('Company / Firm GSTIN Number', corporateGstin, !isCorpLandlord || landlordEntityType !== 'Private Limited / Public Limited Company'),
            fieldEntry('Date of Incorporation', landlordIncorporationDate, !isCorpLandlord),
            fieldEntry('Board Resolution / Auth Letter Date', corporateAuthDate, !isCorpLandlord),
            fieldEntry('Registered Office Address of Company', corporateAddress, !isCorpLandlord),
            fieldEntry('Authorized Signatory Name', authSignatoryName, !isCorpLandlord),
            fieldEntry('Signatory Designation', authSignatoryDesignation === 'Other' ? authSignatoryCustomDesignation : authSignatoryDesignation, !isCorpLandlord, COMPANY_DESIGNATION_OPTIONS),
            checkboxEntry(ENTITY_AUTH_CONFIRM_LABEL, landlordEntityAuthConfirmed, !isCorpLandlord),
            fieldEntry("Father's / Husband's Name", landlordFatherName, isCorpLandlord),
            fieldEntry('Age / Date of Birth', landlordDobOrAge, isCorpLandlord),
            fieldEntry('Permanent Residential Address', landlordAddress, isCorpLandlord),
            fieldEntry('Current Mobile Number', landlordMobile, false),
            fieldEntry('Email Address', landlordEmail, false),
            fieldEntry(isCorpLandlord ? 'Company / Firm PAN Card' : 'PAN Card Number', landlordPan, false),
            fieldEntry('Co-Owners / Joint Property Holders', coOwners.length > 0 ? coOwners : '', true),
            checkboxEntry('Signing via Power of Attorney (POA)', hasPoa, true),
            fieldEntry('POA Holder Full Name', poaName, !hasPoa),
            fieldEntry('POA Holder Address', poaAddress, !hasPoa),
            fieldEntry('Certified POA Document Uploaded', poaFile ? poaFile.fileName : '', true),
            fieldEntry('Proof of Property Ownership Type', ownershipProofType, true, ['Sale Deed / Registry', 'Property Tax Receipt', 'Electricity Bill', 'Allotment Letter', 'Municipal Khata']),
            fieldEntry('Property Ownership Document Uploaded', propertyDocFile ? `${propertyDocFile.fileName} (${Math.round(propertyDocFile.sizeBytes / 1024)} KB)` : '', true)
          ]
        },
        {
          pageNumber: 3,
          sectionTitle: docCategory === 'commercial' ? '2nd Party / Commercial Tenant Details' : '2nd Party / Residential Tenant Details',
          fields:
            docCategory === 'residential'
              ? [
                  fieldEntry('Tenant Full Legal Name', tenantName, false),
                  fieldEntry("Tenant Father's / Husband's Name", tenantFatherName, false),
                  fieldEntry('Tenant Age / Date of Birth', tenantAge, false),
                  fieldEntry('Tenant Permanent Native Address', tenantAddress, false),
                  fieldEntry('Tenant Mobile Number', tenantMobile, false),
                  fieldEntry('Tenant Email Address', tenantEmail, false),
                  fieldEntry('Tenant PAN Card Number', tenantPan, false),
                  fieldEntry('Co-Occupants / Family Members Details', coOccupants.length > 0 ? coOccupants : '', true)
                ]
              : [
                  fieldEntry('Business Entity Type', commercialEntityType, false, COMPANY_SUBTYPE_OPTIONS),
                  fieldEntry('Registered Company / Firm Name', commercialCompanyName, false),
                  fieldEntry('Company / Firm PAN Card', commercialCompanyPan, false),
                  fieldEntry('Registered Office Address of Company', commercialOfficeAddress, false),
                  fieldEntry('CIN / LLPIN / Registration No.', commercialCin, true),
                  fieldEntry('Company / Firm GSTIN Number', commercialGstin, !isGstinRequiredForSubType(commercialEntityType)),
                  fieldEntry('Date of Incorporation', commercialIncDate, true),
                  fieldEntry('Commercial Tenant Email Address', commercialEmail, false),
                  fieldEntry('Commercial Tenant Mobile Number', commercialMobile, false),
                  fieldEntry('Authorized Representative Full Legal Name', commercialRepName, false),
                  fieldEntry('Representative Designation', commercialRepDesignation === 'Other' ? commercialRepCustomDesignation : commercialRepDesignation, false, COMPANY_DESIGNATION_OPTIONS),
                  fieldEntry('Board Resolution / Auth Letter Date', commercialAuthDate, true),
                  fieldEntry('Board Resolution / Partner Authorization File', authDocFile ? authDocFile.fileName : '', true),
                  checkboxEntry(ENTITY_AUTH_CONFIRM_LABEL, commercialEntityAuthConfirmed, false)
                ]
        },
        {
          pageNumber: 4,
          sectionTitle: 'Property Details, Boundaries & Furnishings',
          fields: [
            fieldEntry('Property Address', propertyAddress, false),
            fieldEntry('Property Type', propertyType, false),
            checkboxEntry('Change to Optional (Property Boundaries)', propertyBoundariesOptional, true),
            fieldEntry('East Boundary', formatSingleBoundary(propertyBoundaries.east), propertyBoundariesOptional),
            fieldEntry('West Boundary', formatSingleBoundary(propertyBoundaries.west), propertyBoundariesOptional),
            fieldEntry('North Boundary', formatSingleBoundary(propertyBoundaries.north), propertyBoundariesOptional),
            fieldEntry('South Boundary', formatSingleBoundary(propertyBoundaries.south), propertyBoundariesOptional),
            fieldEntry('Furnishing Status', furnishingStatus, false, ['Furnished', 'Semi Furnished', 'Unfurnished']),
            fieldEntry(
              'Furnished Items Inventory',
              furnishedItems.length > 0
                ? furnishedItems.map((it, idx) => `${idx + 1}. ${it.itemName} (₹${it.price || '0'}, ID: ${it.uniqueId || 'N/A'}, Condition: ${it.condition})`).join(' | ')
                : '',
              true
            )
          ]
        },
        {
          pageNumber: 5,
          sectionTitle: 'Lease Terms & Statutory Conditions',
          fields: [
            fieldEntry('Lease Tenure (Duration)', leaseTenure, false, leaseTenureOptions),
            fieldEntry('Custom Lease Tenure (Months)', customTenure, leaseTenure !== 'Custom Tenure'),
            fieldEntry('Lease Start Date', commencementDate, false),
            fieldEntry('Monthly Rent Amount (INR)', monthlyRent, false),
            fieldEntry('Rent Due Date', rentDueDate, false, rentDueDateOptions),
            fieldEntry('Security Deposit Amount (INR)', securityDeposit, false),
            fieldEntry('Notice Period Duration', noticePeriod, false, noticePeriodOptions),
            fieldEntry('Rent Payment Channel', paymentChannel, false, paymentChannelOptions),
            ...UTILITY_BILL_ITEMS.map((bill) =>
              checkboxEntry(`Utility Bill — Tenant pays ${bill}`, Boolean(tenantUtilityBills[bill]), true)
            ),
            fieldEntry('Society Maintenance Charge Who Pay', societyMaintenanceBy, false, ['Tenant', 'Owner']),
            fieldEntry('Small Maintenance Bearer', smallMaintenanceBy, false, ['Tenant', 'Owner']),
            fieldEntry('Big Maintenance Bearer', bigMaintenanceBy, false, ['Owner', 'Tenant']),
            checkboxEntry('Sublease Not Allowed (Tenant cannot sublet without written owner permission)', clauseSubletting, true),
            checkboxEntry('Pets & Pet Usage (Allow domestic pets on premises)', clausePetsAllowed, true),
            checkboxEntry('No Structure Changes (Tenant cannot break or alter walls/pillars/beams)', clauseStructural, true),
            checkboxEntry('Owner Visit Notice (Daytime inspection with 24 hrs prior notice)', clauseInspection, true),
            checkboxEntry('Force Majeure Protocol (Natural disaster / lockdown rent relaxation)', clauseForceMajeure, true),
            checkboxEntry('Lock-in Period Applicable', hasLockInPeriod, true),
            fieldEntry('Lock-in Period Duration', hasLockInPeriod ? lockInPeriod : '', !hasLockInPeriod, lockInPeriodOptions),
            fieldEntry('Custom Lock-in Duration', customLockInDuration, !hasLockInPeriod || lockInPeriod !== 'Custom'),
            fieldEntry('Lock-in Break Fine / Fee (INR)', lockInFineAmount, !hasLockInPeriod),
            fieldEntry('Late Payment Fees', latePayment.hasLateFee, false, ['Yes', 'No']),
            ...(latePayment.hasLateFee === 'Yes'
              ? [
                  fieldEntry('Late Fee Grace Period', `${latePayment.lateFeeGraceNumber} ${latePayment.lateFeeGraceUnit}`, false),
                  fieldEntry(
                    'Late Fee Charge',
                    latePayment.lateFeeType === 'Fixed'
                      ? `Fixed: ₹${latePayment.lateFeeFixedAmount}`
                      : `Percentage: ${latePayment.lateFeePercentValue}% ${latePayment.lateFeePercentPeriod}`,
                    false
                  )
                ]
              : []),
            fieldEntry('Rent Escalation Clause', rentEscalation, docCategory !== 'commercial', rentEscalationOptions),
            fieldEntry('Custom Rent Escalation Percentage', customEscalation, docCategory !== 'commercial' || rentEscalation !== 'Custom Percentage'),
            fieldEntry('Delayed Rent Interest', delayedRentInterest, docCategory !== 'commercial', delayedInterestOptions),
            checkboxEntry('Signatory Authority Confirmation (Yes, I am authorized to enter this agreement.)', signatoryAuthorized, false),
            fieldEntry(
              'Custom Clauses Added',
              customClauses.length > 0
                ? customClauses.map((c, idx) => `${idx + 1}. ${c.title || 'Untitled'}: ${c.description}`).join(' | ')
                : '',
              true
            )
          ]
        },
        {
          pageNumber: 6,
          sectionTitle: 'Witnesses, Execution Mode, Review & Legal Declarations',
          fields: [
            fieldEntry('Witness 1 Full Legal Name', w1Name, false),
            fieldEntry("Witness 1 Father's / Husband's Name", w1FatherName, false),
            fieldEntry('Witness 1 Email Address', w1Email, false),
            fieldEntry('Witness 1 Profession', w1Profession, true),
            fieldEntry('Witness 1 Residential Address', w1Address, false),
            fieldEntry('Witness 1 Mobile Number', w1Mobile, false),
            checkboxEntry('Witness 1 is above 18+', w1Above18, false),
            fieldEntry('Witness 2 Full Legal Name', w2Name, false),
            fieldEntry("Witness 2 Father's / Husband's Name", w2FatherName, false),
            fieldEntry('Witness 2 Email Address', w2Email, false),
            fieldEntry('Witness 2 Profession', w2Profession, true),
            fieldEntry('Witness 2 Residential Address', w2Address, false),
            fieldEntry('Witness 2 Mobile Number', w2Mobile, false),
            checkboxEntry('Witness 2 is above 18+', w2Above18, false),
            fieldEntry('Legal Execution Mode', executionMode, false, ['digital', 'physical', 'hybrid']),
            fieldEntry('Shipping Street Address', shippingAddress, executionMode === 'digital'),
            fieldEntry('Shipping Pincode', shippingPincode, executionMode === 'digital'),
            fieldEntry('Shipping Contact Mobile', shippingPhone, executionMode === 'digital'),
            fieldEntry('Verification & Review Mode', verificationMode === 'expert' ? 'Expert Legal Re-check (+₹10)' : 'Self-Verified (Free)', false, ['Self-Verified (Free)', 'Expert Legal Re-check (+₹10)']),
            fieldEntry('Total Payable Post-Delivery (INR)', `₹${pricing.totalPayable}`, false),
            ...declarationTexts.map((txt, idx) => checkboxEntry(txt, Boolean(declarations[idx]), false)),
            checkboxEntry('Statutory Intermediary Disclaimer Accepted (Cotex Compliance IT Act 2000 & MTA)', disclaimerAccepted, false)
          ]
        }
      ];

      // 1. Gather sensitive data for client-side encryption
      const sensitiveData = {
        orderId: newOrderId,
        submissionOverview,
        submittedDate: submissionOverview.submittedDate,
        submittedTime: submissionOverview.submittedTime,
        requestType: submissionOverview.requestType,
        mainCategory: submissionOverview.mainCategory,
        subCategory: submissionOverview.subCategory,
        docTitle: formattedDocTitle,
        category: initialDoc.category,
        docCategory,
        state: selectedState,
        tenancyPurpose,
        mixedUseArea: tenancyPurpose === 'mixed' ? mixedUseArea : undefined,
        stampProcurementMode,
        physicalStampUploaded,
        physicalStampFile,
        stampDutyAmount: pricing.effectiveStamp,
        stampCostBorneBy: stampCostBorneBy === 'Custom Split' ? customSplitText : stampCostBorneBy,
        landlord: {
          entityType: landlordEntityType,
          name: landlordName,
          fatherName: landlordFatherName,
          dobOrAge: landlordDobOrAge,
          address: landlordAddress,
          pan: landlordPan,
          mobile: landlordMobile,
          email: landlordEmail,
          coOwners: coOwners.length > 0 ? coOwners : undefined,
          corporateRegNumber: corporateRegNumber || undefined,
          corporateGstin: corporateGstin || undefined,
          landlordIncorporationDate: landlordIncorporationDate || undefined,
          corporateAuthDate: corporateAuthDate || undefined,
          corporateAddress: corporateAddress || undefined,
          authSignatoryName: authSignatoryName || undefined,
          authSignatoryDesignation: authSignatoryDesignation === 'Other' ? authSignatoryCustomDesignation : authSignatoryDesignation,
          landlordEntityAuthConfirmed: isCorpLandlord ? landlordEntityAuthConfirmed : undefined,
          hasPoa,
          poaDetails: hasPoa ? { poaName, poaAddress, poaFileUploaded, poaFile } : undefined,
          ownershipProofType,
          propertyDocUploaded,
          propertyDocFile
        },
        tenant: {
          name: tenantName,
          fatherName: tenantFatherName,
          age: tenantAge,
          address: tenantAddress,
          pan: tenantPan,
          mobile: tenantMobile,
          email: tenantEmail,
          coOccupants: coOccupants.length > 0 ? coOccupants : undefined
        },
        commercialTenant: docCategory === 'commercial' ? {
          entityType: commercialEntityType,
          companyName: commercialCompanyName,
          officeAddress: commercialOfficeAddress,
          cin: commercialCin,
          companyPan: commercialCompanyPan,
          incorporationDate: commercialIncDate || undefined,
          email: commercialEmail,
          mobile: commercialMobile,
          repName: commercialRepName,
          repDesignation: commercialRepDesignation === 'Other' ? commercialRepCustomDesignation : commercialRepDesignation,
          authLetterDate: commercialAuthDate || undefined,
          authDocUploaded,
          authDocFile,
          gstin: commercialGstin,
          entityAuthConfirmed: commercialEntityAuthConfirmed
        } : undefined,
        propertyDetails: {
          propertyAddress,
          propertyType,
          propertyBoundariesOptional,
          boundaries: propertyBoundaries,
          furnishingStatus,
          furnishedItems: furnishingStatus !== 'Unfurnished' ? furnishedItems : []
        },
        leaseTerms: {
          monthlyRent,
          securityDeposit,
          hasLockInPeriod,
          lockInPeriod: effectiveLockInDuration,
          lockInFineAmount: hasLockInPeriod ? lockInFineAmount : undefined,
          hasLatePaymentPenalty: latePayment.hasLateFee === 'Yes',
          latePayment: latePayment.hasLateFee === 'Yes' ? latePayment : undefined,
          leaseTenure: leaseTenure === 'Custom Tenure' ? customTenure : leaseTenure,
          leaseStartDate: commencementDate,
          rentDueDate,
          noticePeriod,
          paymentChannel,
          utilityBills: utilityPayStatusList,
          societyMaintenanceBy,
          smallMaintenanceBy,
          bigMaintenanceBy,
          rentEscalation: rentEscalation === 'Custom Percentage' ? customEscalation : rentEscalation,
          delayedRentInterest,
          clauses: {
            clauseStructural,
            clauseSubletting,
            clausePetsAllowed,
            clauseInspection,
            clauseForceMajeure
          },
          signatoryAuthorized,
          customClauses
        },
        witnesses: [
          { name: w1Name, fatherName: w1FatherName, email: w1Email, profession: w1Profession, address: w1Address, mobile: w1Mobile, isAbove18: w1Above18 },
          { name: w2Name, fatherName: w2FatherName, email: w2Email, profession: w2Profession, address: w2Address, mobile: w2Mobile, isAbove18: w2Above18 }
        ],
        delivery: {
          executionMode,
          shippingAddress: executionMode !== 'digital' ? shippingAddress : undefined,
          pincode: executionMode !== 'digital' ? shippingPincode : undefined,
          shippingPhone: executionMode !== 'digital' ? shippingPhone : undefined
        },
        verificationMode,
        pricing,
        declarationsAccepted: declarations.every(Boolean),
        disclaimerAccepted,
        uploadedDocuments,
        sections,
        timestamp: now.toISOString()
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
                  ? 'Digital OTP eSign'
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
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-blue-600 transition-colors py-1.5 px-3 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Cancel &amp; Return</span>
          </button>

          <VoiceGuidanceButton serviceTitle={initialDoc.title} />
        </div>

        {/* Progress Bar */}
        {activeTab === 'form' && (
          <div className="w-full bg-slate-200 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-[#15803d] h-full transition-all duration-300"
              style={{ width: `${(currentPage / 6) * 100}%` }}
            />
          </div>
        )}

        {/* Title Header */}
        <div className="mt-4">
          <h1 className="text-2xl sm:text-3xl font-black text-black">
            {initialDoc.title}
          </h1>
          <span className="text-sm font-bold text-[#15803d] block mt-0.5">
            Architecture
          </span>
        </div>

        {(currentPage === 1 || activeTab === 'request') && (
          <FormRequestTabBar
            activeTab={activeTab}
            onChangeTab={setActiveTab}
            className="mt-4"
          />
        )}
      </div>

      <HorizontalSwipeContainer activeTab={activeTab} onChangeTab={setActiveTab}>
      {activeTab === 'request' ? (
        <QuickCallbackRequestPanel
          mode="document"
          initialItemTitle={initialDoc.title}
          categoryLabel={initialDoc.category}
          onBack={onBack}
          onSwitchToForm={() => setActiveTab('form')}
        />
      ) : (
      /* FORM CONTAINER */
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-5 sm:p-7">
        {/* ================= PAGE 1 ================= */}
        {currentPage === 1 && (
          <div className="space-y-6 animate-fadeIn">

            {/* Document Category Radio */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-2">
                Document Category <span className="text-red-500 font-bold">*</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className={optionCardClass(docCategory === 'residential', 'p-3.5')}>
                  <input
                    type="radio"
                    name="docCategory"
                    checked={docCategory === 'residential'}
                    onChange={() => setDocCategory('residential')}
                    className="sr-only"
                  />
                  <CircleIndicator checked={docCategory === 'residential'} />
                  <div className="flex items-center gap-2.5">
                    <Home className="w-5 h-5 text-blue-600 shrink-0" />
                    <div>
                      <span className="text-sm font-bold text-black block">Residential Rent Agreement</span>
                      <span className="text-[11px] font-normal text-slate-500">Houses, flats, villas, co-living (MTA 2-month deposit rule)</span>
                    </div>
                  </div>
                </label>

                <label className={optionCardClass(docCategory === 'commercial', 'p-3.5')}>
                  <input
                    type="radio"
                    name="docCategory"
                    checked={docCategory === 'commercial'}
                    onChange={() => setDocCategory('commercial')}
                    className="sr-only"
                  />
                  <CircleIndicator checked={docCategory === 'commercial'} />
                  <div className="flex items-center gap-2.5">
                    <Building2 className="w-5 h-5 text-blue-600 shrink-0" />
                    <div>
                      <span className="text-sm font-bold text-black block">Commercial Lease Agreement</span>
                      <span className="text-[11px] font-normal text-slate-500">Shops, offices, warehouses, corporate hubs &amp; GST compliance</span>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* State Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                State / Union Territory <span className="text-red-500 font-bold">*</span>
              </label>
              <WhiteSelect
                value={selectedState}
                onChange={setSelectedState}
                aria-label="State / Union Territory"
                options={[
                  ...[
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
                  ].map((sName) => ({
                    value: sName,
                    label: `${sName}${sName === 'Gujarat' ? ' (₹300)' : sName === 'Madhya Pradesh' ? ' (₹500)' : ''}`,
                    group: 'Standard Fixed Stamp Duty States'
                  })),
                  ...['Karnataka', 'Bihar', 'Jharkhand'].map((sName) => ({
                    value: sName,
                    label: `🔵 ${sName} (Dynamic Calculation)`,
                    group: 'Variable Duty States (Calculated Dynamically)'
                  }))
                ]}
              />
            </div>

            {/* Purpose of Tenancy Specifics (Purely Residential or Purely Commercial) */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Purpose of Tenancy Specifics <span className="text-red-500 font-bold">*</span>
              </label>
              <WhiteSelect
                value={tenancyPurpose}
                onChange={(val) => setTenancyPurpose(val as any)}
                aria-label="Purpose of Tenancy Specifics"
                options={[
                  { value: 'residential', label: 'Purely Residential' },
                  { value: 'commercial', label: 'Purely Commercial' }
                ]}
              />
            </div>

            {/* Stamp Paper Procurement Mode */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-2">
                Stamp Paper Procurement Mode <span className="text-red-500 font-bold">*</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className={optionCardClass(stampProcurementMode === 'estamp', 'p-3')}>
                  <input
                    type="radio"
                    name="procurementMode"
                    checked={stampProcurementMode === 'estamp'}
                    onChange={() => setStampProcurementMode('estamp')}
                    className="sr-only"
                  />
                  <CircleIndicator checked={stampProcurementMode === 'estamp'} />
                  <div>
                    <span className="text-xs font-bold text-black block">E-Stamp Paper / Digital Stamp</span>
                    <span className="text-[11px] font-normal text-slate-500">System generated official state e-stamp</span>
                  </div>
                </label>

                <label className={optionCardClass(stampProcurementMode === 'physical_upload', 'p-3')}>
                  <input
                    type="radio"
                    name="procurementMode"
                    checked={stampProcurementMode === 'physical_upload'}
                    onChange={() => setStampProcurementMode('physical_upload')}
                    className="sr-only"
                  />
                  <CircleIndicator checked={stampProcurementMode === 'physical_upload'} />
                  <div>
                    <span className="text-xs font-bold text-black block">Physical Stamp Paper (User Upload)</span>
                    <span className="text-[11px] font-normal text-slate-500">Upload your own pre-purchased physical stamp</span>
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

                    <label className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      physicalStampUploaded
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}>
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>{physicalStampFile ? `✓ ${physicalStampFile.fileName}` : 'Upload Stamp File'}</span>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        onChange={(e) => handleRealFileSelect(e, 'Pre-Purchased Physical Stamp Paper', setPhysicalStampFile)}
                      />
                    </label>
                    {physicalStampFile && (
                      <button
                        type="button"
                        onClick={() => setPhysicalStampFile(null)}
                        className="ml-2 text-xs text-rose-600 font-bold hover:underline cursor-pointer"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Stamp Paper Value Selection */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  Stamp Paper Value Selection <span className="text-red-500 font-bold">*</span>
                </label>
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
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Stamp Duty Cost Paid By <span className="text-red-500 font-bold">*</span>
              </label>

              <WhiteSelect
                value={stampCostBorneBy}
                onChange={setStampCostBorneBy}
                aria-label="Stamp Duty Cost Paid By"
                options={[
                  { value: 'First Party (Landlord / Lessor)', label: 'First Party (Landlord / Lessor)' },
                  { value: 'Second Party (Tenant / Lessee)', label: 'Second Party (Tenant / Lessee)' },
                  { value: 'Shared Equally (50-50 Split)', label: 'Shared Equally (50-50 Split)' },
                  { value: 'Custom Split', label: 'Custom Ratio or Fixed Amount Split' }
                ]}
              />

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
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Lessor / Landlord Entity Type <span className="text-red-500 font-bold">*</span>
              </label>
              <WhiteSelect
                value={landlordEntityType}
                onChange={(val) => setLandlordEntityType(val as any)}
                aria-label="Lessor / Landlord Entity Type"
                options={[
                  { value: 'Individual', label: 'Individual (Single Owner)' },
                  { value: 'Joint Owners', label: 'Joint Owners / Co-Owners' },
                  { value: 'Partnership Firm / LLP', label: 'Partnership Firm / LLP' },
                  { value: 'Private Limited / Public Limited Company', label: 'Private Limited / Public Limited Company' },
                  { value: 'HUF', label: 'Hindu Undivided Family (HUF)' },
                  { value: 'Trust / Society', label: 'Trust / Society / AOP' }
                ]}
              />
            </div>

            {/* Corporate vs Individual Dynamic Layout */}
            {landlordEntityType !== 'Individual' && landlordEntityType !== 'Joint Owners' ? (
              /* Corporate Landlord Fields */
              <div className="space-y-4 bg-slate-50 border border-slate-200 rounded-xl p-4">
                <span className="text-xs font-bold text-blue-700 uppercase tracking-wider block">
                  Corporate / Entity Ownership Framework
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Registered Company / Firm Name <span className="text-red-500 font-bold">*</span>
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
                      {landlordEntityType === 'Partnership Firm / LLP'
                        ? 'LLPIN / Firm Registration Number'
                        : landlordEntityType === 'Trust / Society'
                        ? 'Trust / Society / AOP Registration Number'
                        : landlordEntityType === 'HUF'
                        ? 'Karta Full Name (HUF Head)'
                        : 'CIN (Company Identification Number)'}{' '}
                      {landlordEntityType === 'Partnership Firm / LLP' ? (
                        <span className="text-slate-400 font-normal">(Optional)</span>
                      ) : (
                        <span className="text-red-500 font-bold">*</span>
                      )}
                    </label>
                    <input
                      type="text"
                      required={landlordEntityType !== 'Partnership Firm / LLP'}
                      value={corporateRegNumber}
                      onChange={(e) => setCorporateRegNumber(landlordEntityType === 'HUF' ? e.target.value : e.target.value.toUpperCase())}
                      placeholder={getPlaceholder("Enter CIN / LLPIN / Registration Number")}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono uppercase text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Company / Firm GSTIN Number{' '}
                      {landlordEntityType === 'Private Limited / Public Limited Company' ? (
                        <span className="text-red-500 font-bold">*</span>
                      ) : (
                        <span className="text-slate-400 font-normal">(Optional)</span>
                      )}
                    </label>
                    <input
                      type="text"
                      required={landlordEntityType === 'Private Limited / Public Limited Company'}
                      maxLength={15}
                      value={corporateGstin}
                      onChange={(e) =>
                        setCorporateGstin(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 15))
                      }
                      placeholder={getPlaceholder("27AABCU9603R1ZM")}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono uppercase text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <DateOfBirthPicker
                      label="Date of Incorporation"
                      value={landlordIncorporationDate}
                      onChange={setLandlordIncorporationDate}
                      required={false}
                      placeholder="DD/MM/YYYY"
                      helperText={showExampleDetails ? 'Format: DD/MM/YYYY' : undefined}
                    />
                  </div>
                </div>

                <div>
                  <AddressFieldGroup
                    label="Registered Office Address of Company"
                    variant="standard"
                    value={corporateAddress}
                    onChangeAddress={(addr) => setCorporateAddress(addr)}
                    required
                  />
                </div>

                {/* Authorized Signatory Box (No Date of Incorporation, No Aadhaar) */}
                <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-3">
                  <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block">
                    Authorized Signatory &amp; Authorization Details
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                      <WhiteSelect
                        variant="compact"
                        value={authSignatoryDesignation}
                        onChange={setAuthSignatoryDesignation}
                        options={COMPANY_DESIGNATION_OPTIONS}
                        aria-label="Signatory Designation"
                      />
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

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Board Resolution / Auth Letter Date <span className="text-slate-400 font-normal">(Optional)</span>
                      </label>
                      <input
                        type="date"
                        value={corporateAuthDate}
                        onChange={(e) => setCorporateAuthDate(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Individual / Joint Landlord Fields */
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Full Legal Name <span className="text-red-500 font-bold">*</span>
                    </label>
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
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Father's / Husband's Name <span className="text-red-500 font-bold">*</span>
                    </label>
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

                <AddressFieldGroup
                  label="Permanent Residential Address"
                  variant="standard"
                  value={landlordAddress}
                  onChangeAddress={(addr) => setLandlordAddress(addr)}
                  required
                />
              </div>
            )}

            {/* Mobile, Email (Mandatory) & PAN Card Number */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mobile Number (10-Digit) <span className="text-red-500 font-bold">*</span>
                </label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={landlordMobile}
                  onChange={(e) => setLandlordMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder={getPlaceholder("Enter 10-Digit Mobile Number")}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email Address <span className="text-red-500 font-bold">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={landlordEmail}
                  onChange={(e) => setLandlordEmail(e.target.value)}
                  placeholder={getPlaceholder("Enter Email Address")}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {landlordEntityType !== 'Individual' && landlordEntityType !== 'Joint Owners'
                    ? 'Company / Firm PAN Card'
                    : 'PAN Card Number'}{' '}
                  <span className="text-red-500 font-bold">*</span>
                </label>
                <input
                  type="text"
                  required
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

            {landlordEntityType !== 'Individual' && landlordEntityType !== 'Joint Owners' && (
              <div className="space-y-1.5">
                <label
                  className={optionCardClass(
                    landlordEntityAuthConfirmed,
                    showLandlordEntityAuthError && !landlordEntityAuthConfirmed
                      ? 'border-rose-400 bg-rose-50/40'
                      : '',
                    true
                  )}
                >
                  <input
                    type="checkbox"
                    checked={landlordEntityAuthConfirmed}
                    onChange={(e) => {
                      setLandlordEntityAuthConfirmed(e.target.checked);
                      if (e.target.checked) setShowLandlordEntityAuthError(false);
                    }}
                    className="sr-only"
                  />
                  <CircleIndicator checked={landlordEntityAuthConfirmed} className="mt-0.5" />
                  <span className="text-xs text-slate-800">
                    {ENTITY_AUTH_CONFIRM_LABEL} <span className="text-red-500 font-bold">*</span>
                  </span>
                </label>
                {showLandlordEntityAuthError && !landlordEntityAuthConfirmed && (
                  <p className="text-xs font-bold text-rose-600">
                    Please tick &ldquo;{ENTITY_AUTH_CONFIRM_LABEL}&rdquo; before continuing.
                  </p>
                )}
              </div>
            )}

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
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                          Co-Owner Full Legal Name
                        </label>
                        <input
                          type="text"
                          value={co.name}
                          onChange={(e) => updateCoOwner(co.id, 'name', e.target.value)}
                          placeholder={getPlaceholder("Co-Owner Legal Name")}
                          className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                          Mobile Number (10 Digits)
                        </label>
                        <input
                          type="tel"
                          maxLength={10}
                          inputMode="numeric"
                          value={co.mobile}
                          onChange={(e) => updateCoOwner(co.id, 'mobile', e.target.value.replace(/\D/g, '').slice(0, 10))}
                          placeholder={getPlaceholder("Mobile Number")}
                          className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                          Co-Owner PAN Number
                        </label>
                        <input
                          type="text"
                          maxLength={10}
                          value={co.pan}
                          onChange={(e) => updateCoOwner(co.id, 'pan', e.target.value.toUpperCase())}
                          placeholder={getPlaceholder("Co-Owner PAN")}
                          className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono uppercase text-slate-900"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Power of Attorney (POA) Holder Checkbox */}
            <div className="pt-3 border-t border-slate-200 space-y-3">
              <label className={optionCardClass(hasPoa)}>
                <input
                  type="checkbox"
                  checked={hasPoa}
                  onChange={(e) => setHasPoa(e.target.checked)}
                  className="sr-only"
                />
                <CircleIndicator checked={hasPoa} />
                <span className="text-xs font-bold text-slate-800">
                  Signing via a Power of Attorney (POA) Holder <span className="text-slate-400 font-normal text-xs">(Optional)</span>
                </span>
              </label>

              {hasPoa && (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3 animate-fadeIn">
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
                    <AddressFieldGroup
                      label="POA Holder Address"
                      variant="standard"
                      value={poaAddress}
                      onChangeAddress={(addr) => setPoaAddress(addr)}
                      required={hasPoa}
                    />
                  </div>

                  <div className="flex items-center justify-between p-2.5 bg-white border border-blue-200 rounded-lg gap-2 flex-wrap">
                    <span className="text-xs text-slate-700">Certified POA Document:</span>
                    <div className="flex items-center gap-2">
                      <label className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        poaFileUploaded
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}>
                        <UploadCloud className="w-3.5 h-3.5" />
                        <span>{poaFile ? `✓ ${poaFile.fileName}` : 'Upload Certified POA'}</span>
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          className="hidden"
                          onChange={(e) => handleRealFileSelect(e, 'Certified Power of Attorney (POA) Document', setPoaFile)}
                        />
                      </label>
                      {poaFile && (
                        <button
                          type="button"
                          onClick={() => setPoaFile(null)}
                          className="text-xs text-rose-600 font-bold hover:underline cursor-pointer"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Proof of Property Ownership Type */}
            <div className="pt-3 border-t border-slate-200">
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Proof of Property Ownership Type <span className="text-slate-400 font-normal text-xs">(Optional)</span>
              </label>

              <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
                <div className="flex-1">
                  <WhiteSelect
                    variant="compact"
                    value={ownershipProofType}
                    onChange={setOwnershipProofType}
                    aria-label="Proof of Property Ownership Type"
                    options={[
                      'Electricity Bill',
                      'Sale Deed / Registry Copy',
                      'Property Tax Receipt',
                      'Mutation Copy',
                      'Allotment Letter',
                      { value: 'None', label: 'None / Not Attached' }
                    ]}
                  />
                </div>

                {ownershipProofType !== 'None' && (
                  <div className="flex items-center gap-2">
                    <label className={`inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      propertyDocUploaded
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                        : 'bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-600 border border-slate-300'
                    }`}>
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>{propertyDocFile ? `✓ ${propertyDocFile.fileName}` : 'Upload Property Document'}</span>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        onChange={(e) => handleRealFileSelect(e, `Property Ownership Document (${ownershipProofType})`, setPropertyDocFile)}
                      />
                    </label>
                    {propertyDocFile && (
                      <button
                        type="button"
                        onClick={() => setPropertyDocFile(null)}
                        className="text-xs text-rose-600 font-bold hover:underline cursor-pointer"
                      >
                        Remove
                      </button>
                    )}
                  </div>
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
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Full Legal Name <span className="text-red-500 font-bold">*</span>
                    </label>
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
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Father's / Husband's Name <span className="text-red-500 font-bold">*</span>
                    </label>
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

                <AddressFieldGroup
                  label="Permanent Native Address"
                  variant="standard"
                  value={tenantAddress}
                  onChangeAddress={(addr) => setTenantAddress(addr)}
                  required
                />

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Mobile Number (10-Digit) <span className="text-red-500 font-bold">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={tenantMobile}
                      onChange={(e) => setTenantMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder={getPlaceholder("Enter 10-Digit Mobile Number")}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Email Address <span className="text-red-500 font-bold">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={tenantEmail}
                      onChange={(e) => setTenantEmail(e.target.value)}
                      placeholder={getPlaceholder("Enter Email Address")}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      PAN Card Number <span className="text-red-500 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      required
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
                    <span className="text-xs font-bold text-slate-800">
                      Co-Occupants / Family Members Details <span className="text-slate-400 font-normal text-xs">(Optional)</span>
                    </span>

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
                    <div key={occ.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row gap-2.5 sm:items-end">
                      <div className="flex-1">
                        <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                          Co-Occupant Full Legal Name
                        </label>
                        <input
                          type="text"
                          value={occ.fullName}
                          onChange={(e) => updateCoOccupant(occ.id, 'fullName', e.target.value)}
                          placeholder={getPlaceholder("Full Legal Name")}
                          className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                        />
                      </div>
                      <div className="sm:w-24">
                        <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                          Age
                        </label>
                        <input
                          type="text"
                          value={occ.age}
                          onChange={(e) => updateCoOccupant(occ.id, 'age', e.target.value)}
                          placeholder={getPlaceholder("Age")}
                          className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                          Relationship with Tenant
                        </label>
                        <input
                          type="text"
                          value={occ.relationship}
                          onChange={(e) => updateCoOccupant(occ.id, 'relationship', e.target.value)}
                          placeholder={getPlaceholder("Relationship (e.g. Spouse / Son)")}
                          className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeCoOccupant(occ.id)}
                        className="text-slate-400 hover:text-rose-600 p-1.5 self-end cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (() => {
              /* CASE B: COMMERCIAL TENANCY */
              const commLabels = getCompanyFieldLabels(commercialEntityType);
              const commRegMeta = getCompanyRegFieldMeta(commercialEntityType);
              const isCommSole = commercialEntityType === 'Sole Proprietorship Firm';
              const isCommGstinReq = isGstinRequiredForSubType(commercialEntityType);
              const isCommAuthDateReq = isAuthDateRequired(commercialEntityType);

              return (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Type of Business Entity <span className="text-red-500 font-bold">*</span>
                  </label>
                  <WhiteSelect
                    value={commercialEntityType}
                    onChange={setCommercialEntityType}
                    aria-label="Type of Business Entity"
                    options={COMPANY_SUBTYPE_OPTIONS}
                  />
                </div>

                {isCommSole ? (
                  <>
                    {/* Sole Proprietorship: Proprietor Name & Business/Firm Name separately */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          {commLabels.signatoryLabel} <span className="text-red-500 font-bold">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={commercialRepName}
                          onChange={(e) => setCommercialRepName(e.target.value)}
                          placeholder={getPlaceholder(commLabels.signatoryPlaceholder)}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          {commLabels.entityNameLabel} <span className="text-red-500 font-bold">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={commercialCompanyName}
                          onChange={(e) => setCommercialCompanyName(e.target.value)}
                          placeholder={getPlaceholder(commLabels.entityNamePlaceholder)}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          {commLabels.panLabel} <span className="text-red-500 font-bold">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={10}
                          value={commercialCompanyPan}
                          onChange={(e) => setCommercialCompanyPan(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10))}
                          placeholder={getPlaceholder("ABCDE1234F")}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-mono uppercase text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          GSTIN Number <span className="text-slate-400 font-normal">(Optional)</span>
                        </label>
                        <input
                          type="text"
                          maxLength={15}
                          value={commercialGstin}
                          onChange={(e) => setCommercialGstin(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 15))}
                          placeholder={getPlaceholder("27AABCU9603R1ZM (Optional)")}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-mono uppercase text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          {commRegMeta.label} <span className="text-slate-400 font-normal">(Optional)</span>
                        </label>
                        <input
                          type="text"
                          value={commercialCin}
                          onChange={(e) => setCommercialCin(e.target.value.toUpperCase())}
                          placeholder={getPlaceholder(commRegMeta.placeholder)}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono uppercase text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>

                      <div>
                        <DateOfBirthPicker
                          label={commLabels.incDateLabel}
                          value={commercialIncDate}
                          onChange={setCommercialIncDate}
                          required={false}
                          placeholder="DD/MM/YYYY"
                          helperText={showExampleDetails ? 'Format: DD/MM/YYYY' : undefined}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Email Address <span className="text-red-500 font-bold">*</span>
                        </label>
                        <input
                          type="email"
                          required
                          value={commercialEmail}
                          onChange={(e) => setCommercialEmail(e.target.value)}
                          placeholder={getPlaceholder("proprietor@example.com")}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Mobile Number (10-Digit) <span className="text-red-500 font-bold">*</span>
                        </label>
                        <input
                          type="tel"
                          required
                          maxLength={10}
                          inputMode="numeric"
                          value={commercialMobile}
                          onChange={(e) => setCommercialMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                          placeholder={getPlaceholder("Enter 10-Digit Mobile Number")}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>
                    </div>

                    <AddressFieldGroup
                      label={commLabels.addressLabel}
                      variant="standard"
                      value={commercialOfficeAddress}
                      onChangeAddress={(addr) => setCommercialOfficeAddress(addr)}
                      required
                    />
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          {commLabels.entityNameLabel} <span className="text-red-500 font-bold">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={commercialCompanyName}
                          onChange={(e) => setCommercialCompanyName(e.target.value)}
                          placeholder={getPlaceholder(commLabels.entityNamePlaceholder)}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          {commRegMeta.label}{' '}
                          {commRegMeta.required ? (
                            <span className="text-red-500 font-bold">*</span>
                          ) : (
                            <span className="text-slate-400 font-normal">(Optional)</span>
                          )}
                        </label>
                        <input
                          type="text"
                          required={commRegMeta.required}
                          value={commercialCin}
                          onChange={(e) =>
                            setCommercialCin(
                              commercialEntityType === 'Joint Owners / Co-Owners' ||
                                commercialEntityType === 'Hindu Undivided Family (HUF)'
                                ? e.target.value
                                : e.target.value.toUpperCase()
                            )
                          }
                          placeholder={getPlaceholder(commRegMeta.placeholder)}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono uppercase text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Company / Firm GSTIN Number{' '}
                          {isCommGstinReq ? (
                            <span className="text-red-500 font-bold">*</span>
                          ) : (
                            <span className="text-slate-400 font-normal">(Optional)</span>
                          )}
                        </label>
                        <input
                          type="text"
                          maxLength={15}
                          required={isCommGstinReq}
                          value={commercialGstin}
                          onChange={(e) => setCommercialGstin(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 15))}
                          placeholder={getPlaceholder("Enter 15-Digit GSTIN")}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-mono uppercase text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          {commLabels.panLabel} <span className="text-red-500 font-bold">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={10}
                          value={commercialCompanyPan}
                          onChange={(e) => setCommercialCompanyPan(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10))}
                          placeholder={getPlaceholder("Enter 10-Character Corporate PAN")}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-mono uppercase text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>
                    </div>

                    {/* Date of Incorporation (In Company Details, NOT inside Signatory Box) & Official Email */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <DateOfBirthPicker
                          label={commLabels.incDateLabel}
                          value={commercialIncDate}
                          onChange={setCommercialIncDate}
                          required={false}
                          placeholder="DD/MM/YYYY"
                          helperText={showExampleDetails ? 'Format: DD/MM/YYYY' : undefined}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Official Company / Entity Email <span className="text-red-500 font-bold">*</span>
                        </label>
                        <input
                          type="email"
                          required
                          value={commercialEmail}
                          onChange={(e) => setCommercialEmail(e.target.value)}
                          placeholder={getPlaceholder("legal@company.com")}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>
                    </div>

                    <div>
                      <AddressFieldGroup
                        label={commLabels.addressLabel}
                        variant="standard"
                        value={commercialOfficeAddress}
                        onChangeAddress={(addr) => setCommercialOfficeAddress(addr)}
                        required
                      />
                    </div>

                    {/* Authorized Signatory Framework (No Aadhaar, No Date of Incorporation) */}
                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                      <span className="text-xs font-bold text-blue-700 uppercase tracking-wider block">
                        Authorized Signatory &amp; Authorization Details
                      </span>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                            {commLabels.signatoryLabel} <span className="text-red-500 font-bold">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={commercialRepName}
                            onChange={(e) => setCommercialRepName(e.target.value)}
                            placeholder={getPlaceholder(commLabels.signatoryPlaceholder)}
                            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                            Designation <span className="text-red-500 font-bold">*</span>
                          </label>
                          <WhiteSelect
                            variant="compact"
                            value={commercialRepDesignation}
                            onChange={setCommercialRepDesignation}
                            options={COMPANY_DESIGNATION_OPTIONS}
                            aria-label="Representative Designation"
                          />
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

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Authorized Mobile Number <span className="text-red-500 font-bold">*</span>
                          </label>
                          <input
                            type="tel"
                            required
                            maxLength={10}
                            inputMode="numeric"
                            value={commercialMobile}
                            onChange={(e) => setCommercialMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                            placeholder={getPlaceholder("9811122334")}
                            className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Board Resolution / Auth Letter Date{' '}
                            {isCommAuthDateReq ? (
                              <span className="text-red-500 font-bold">*</span>
                            ) : (
                              <span className="text-slate-400 font-normal">(Optional)</span>
                            )}
                          </label>
                          <input
                            type="date"
                            required={isCommAuthDateReq}
                            value={commercialAuthDate}
                            onChange={(e) => setCommercialAuthDate(e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-lg gap-2 flex-wrap">
                        <span className="text-xs text-slate-700">
                          {commercialEntityType === 'Partnership Firm'
                            ? 'Partnership Authorization Letter:'
                            : 'Board Resolution Copy:'}
                        </span>
                        <div className="flex items-center gap-2">
                          <label className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            authDocUploaded
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}>
                            <UploadCloud className="w-3.5 h-3.5" />
                            <span>
                              {authDocFile
                                ? `✓ ${authDocFile.fileName}`
                                : commercialEntityType === 'Partnership Firm'
                                ? 'Upload Partner Authorization'
                                : 'Upload Board Resolution Copy'}
                            </span>
                            <input
                              type="file"
                              accept="image/*,.pdf"
                              className="hidden"
                              onChange={(e) => handleRealFileSelect(
                                e,
                                commercialEntityType === 'Partnership Firm' ? 'Partnership Authorization Letter' : 'Board Resolution Copy',
                                setAuthDocFile
                              )}
                            />
                          </label>
                          {authDocFile && (
                            <button
                              type="button"
                              onClick={() => setAuthDocFile(null)}
                              className="text-xs text-rose-600 font-bold hover:underline cursor-pointer"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Mandatory Bottom Entity Authorization Checkbox */}
                <div className="pt-1 space-y-1.5">
                  <label
                    className={optionCardClass(
                      commercialEntityAuthConfirmed,
                      showCommercialEntityAuthError && !commercialEntityAuthConfirmed
                        ? 'border-rose-400 bg-rose-50/40'
                        : '',
                      true
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={commercialEntityAuthConfirmed}
                      onChange={(e) => {
                        setCommercialEntityAuthConfirmed(e.target.checked);
                        if (e.target.checked) setShowCommercialEntityAuthError(false);
                      }}
                      className="sr-only"
                    />
                    <CircleIndicator checked={commercialEntityAuthConfirmed} className="mt-0.5" />
                    <span className="text-xs text-slate-800">
                      {ENTITY_AUTH_CONFIRM_LABEL} <span className="text-red-500 font-bold">*</span>
                    </span>
                  </label>
                  {showCommercialEntityAuthError && !commercialEntityAuthConfirmed && (
                    <p className="text-xs font-bold text-rose-600">
                      Please tick &ldquo;{ENTITY_AUTH_CONFIRM_LABEL}&rdquo; before continuing.
                    </p>
                  )}
                </div>
              </div>
              );
            })()}
          </div>
        )}

        {/* ================= STEP 4: PROPERTY DETAILS ================= */}
        {currentPage === 4 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-slate-50 text-slate-900 rounded-2xl p-4 sm:p-5 shadow-2xs border border-slate-200 mb-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-lg border border-emerald-200">
                  3
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black tracking-wide uppercase text-slate-900">
                    Property Details
                  </h3>
                  <p className="text-xs text-slate-600 font-medium">
                    Premises Address, Boundaries, Property Type &amp; Furnishing Inventory
                  </p>
                </div>
              </div>
            </div>

            {/* 1. Property Address */}
            <AddressFieldGroup
              label="Property Address"
              variant="property"
              value={propertyAddress}
              onChangeAddress={(addr) => setPropertyAddress(addr)}
              required
            />

            {/* 2. Property Boundaries */}
            <PropertyBoundariesSection
              title="Property Boundaries"
              subtitle="Specify what sits on the East, West, North, and South sides of the rented property."
              value={propertyBoundaries}
              onChange={setPropertyBoundaries}
              showOptionalToggle
              isOptional={propertyBoundariesOptional}
              onToggleOptional={setPropertyBoundariesOptional}
            />

            {/* 3. Property Type & Furnishing Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Property Type <span className="text-red-500 font-bold">*</span>
                </label>
                <WhiteSelect
                  value={propertyType}
                  onChange={setPropertyType}
                  aria-label="Property Type"
                  options={[
                    'Flat / Apartment',
                    'Independent House / Villa',
                    'Builder Floor',
                    'Shop / Showroom',
                    'Office Space',
                    'Warehouse / Godown',
                    'Studio / Room',
                    'Other Property'
                  ]}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Furnishing Status <span className="text-red-500 font-bold">*</span>
                </label>
                <WhiteSelect
                  value={furnishingStatus}
                  onChange={(val) => setFurnishingStatus(val as 'Furnished' | 'Semi Furnished' | 'Unfurnished')}
                  aria-label="Furnishing Status"
                  options={['Unfurnished', 'Semi Furnished', 'Furnished']}
                />
              </div>
            </div>

            {/* 4. Furnished Items Inventory (Visible when Furnished or Semi Furnished) */}
            {furnishingStatus !== 'Unfurnished' && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 animate-fadeIn">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div>
                    <span className="text-xs font-bold text-slate-900 block uppercase tracking-wide">
                      Furnished Items &amp; Appliances List ({furnishedItems.length})
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Add furniture, AC, fridge, fans, or fittings provided with the property.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={addFurnishedItem}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-2xs cursor-pointer transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Items</span>
                  </button>
                </div>

                {furnishedItems.length === 0 ? (
                  <p className="text-xs text-slate-500 bg-white border border-dashed border-slate-300 rounded-xl p-3 text-center">
                    No items added yet. Click &ldquo;Add Items&rdquo; to list furniture or appliances.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {furnishedItems.map((item, idx) => (
                      <div key={item.id} className="p-3 bg-white border border-slate-200 rounded-xl space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-blue-700">Item #{idx + 1}</span>
                          <button
                            type="button"
                            onClick={() => removeFurnishedItem(item.id)}
                            className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                            title="Remove item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                              Item Name <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={item.itemName}
                              onChange={(e) => updateFurnishedItem(item.id, 'itemName', e.target.value)}
                              placeholder={getPlaceholder('e.g. Split AC / Double Bed')}
                              className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                              Price (₹)
                            </label>
                            <input
                              type="number"
                              value={item.price}
                              onChange={(e) => updateFurnishedItem(item.id, 'price', e.target.value)}
                              placeholder={getPlaceholder('e.g. 25000')}
                              className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                              Unique ID <span className="text-slate-400 font-normal">(Optional)</span>
                            </label>
                            <input
                              type="text"
                              value={item.uniqueId}
                              onChange={(e) => updateFurnishedItem(item.id, 'uniqueId', e.target.value)}
                              placeholder={getPlaceholder('Serial / Model ID')}
                              className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                              Condition
                            </label>
                            <WhiteSelect
                              variant="compact"
                              value={item.condition}
                              onChange={(val) => updateFurnishedItem(item.id, 'condition', val)}
                              options={['Good', 'Average', 'Bad', 'New']}
                              aria-label="Furnished item condition"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ================= STEP 5: LEASE TERMS & STATUTORY CONDITIONS ================= */}
        {currentPage === 5 && (
          <div className="space-y-6 animate-fadeIn">
            {/* 1. Financial & Tenure Matrices */}
            <div className="space-y-4">
              <TopicHeader
                number={1}
                title="Financial & Tenure Matrices"
                question="What are the lease duration, start date, monthly rent, deposit, and payment channel?"
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Lease Tenure (Duration) <span className="text-red-500 font-bold">*</span>
                  </label>
                  <WhiteSelect
                    variant="compact"
                    value={leaseTenure}
                    onChange={setLeaseTenure}
                    aria-label="Lease Tenure"
                    options={[
                      { value: '11 Months', label: '11 Months (Standard Statutory Limit)' },
                      '10 Months',
                      '9 Months',
                      '8 Months',
                      '7 Months',
                      '6 Months',
                      '5 Months',
                      '4 Months',
                      '3 Months',
                      '2 Months',
                      '1 Month',
                      { value: 'Custom Tenure', label: 'Custom Tenure (1 to 11 Months Only)' }
                    ]}
                  />

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
                    Lease Start Date <span className="text-red-500 font-bold">*</span>
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
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Monthly Rent Amount (INR) <span className="text-red-500 font-bold">*</span>
                  </label>
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
                  <WhiteSelect
                    variant="compact"
                    value={rentDueDate}
                    onChange={setRentDueDate}
                    aria-label="Rent Due Date"
                    options={[1, 5, 7, 10, 15, 20, 25, 30].map(
                      (day) => `${day}th of every calendar month`
                    )}
                  />
                </div>
              </div>

              {/* Security Deposit Amount & Notice Period */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Security Deposit Amount (INR) <span className="text-red-500 font-bold">*</span>
                    </label>
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
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Notice Period Duration <span className="text-red-500 font-bold">*</span>
                  </label>
                  <WhiteSelect
                    variant="compact"
                    value={noticePeriod}
                    onChange={setNoticePeriod}
                    aria-label="Notice Period Duration"
                    options={['1 Month', '2 Months', '3 Months', '15 Days']}
                  />
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

              {/* Payment Channel (Any Type default) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Rent Payment Channel <span className="text-red-500 font-bold">*</span>
                </label>
                <WhiteSelect
                  variant="compact"
                  value={paymentChannel}
                  onChange={setPaymentChannel}
                  aria-label="Rent Payment Channel"
                  options={[
                    'Any Type',
                    'Bank Transfer (NEFT/RTGS/IMPS/UPI)',
                    'Account Payee Cheque',
                    'Cash / Other'
                  ]}
                />
              </div>
            </div>

            {/* 2. Who Will Pay? & Maintenance Allocation */}
            <div className={`${TOPIC_DIVIDER_CLASS} space-y-4`}>
              <TopicHeader
                number={2}
                title="Utility Bills & Maintenance Responsibility"
                question="Who will pay the utility bills, society charges, and small or major maintenance costs?"
                required
              />

              {/* Who Will Pay? Utility Bills Dropdown Checklist */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                <label className="block text-xs font-bold text-slate-800">
                  Who Will Pay? <span className="text-slate-500 font-normal">(Utility Bills)</span>
                </label>

                <button
                  type="button"
                  onClick={() => setUtilityBillsDropdownOpen((o) => !o)}
                  className="w-full flex items-center justify-between bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 hover:border-blue-500 cursor-pointer transition-colors"
                >
                  <span>Tenant pays the bill</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-blue-600">
                      {UTILITY_BILL_ITEMS.filter((b) => tenantUtilityBills[b]).length}/{UTILITY_BILL_ITEMS.length} Selected
                    </span>
                    {utilityBillsDropdownOpen ? (
                      <ChevronUp className="w-4 h-4 text-slate-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-500" />
                    )}
                  </div>
                </button>

                {utilityBillsDropdownOpen && (
                  <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-2 animate-fadeIn">
                    <span className="text-[11px] text-slate-500 block">
                      Checked bills are paid by the Tenant. Any unchecked bill will be paid by the Owner.
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {UTILITY_BILL_ITEMS.map((bill) => {
                        const isTenantPay = Boolean(tenantUtilityBills[bill]);
                        return (
                          <label
                            key={bill}
                            className={optionCardClass(isTenantPay, 'justify-between')}
                          >
                            <span className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={isTenantPay}
                                onChange={() => toggleUtilityBill(bill)}
                                className="sr-only"
                              />
                              <CircleIndicator checked={isTenantPay} />
                              <span>{bill}</span>
                            </span>
                            <span className={`text-[10px] font-bold ${isTenantPay ? 'text-blue-700' : 'text-amber-700'}`}>
                              {isTenantPay ? 'Tenant' : 'Owner'}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                {UTILITY_BILL_ITEMS.some((b) => !tenantUtilityBills[b]) && (
                  <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">
                    Owner pays:{' '}
                    {UTILITY_BILL_ITEMS.filter((b) => !tenantUtilityBills[b]).join(', ')}
                  </p>
                )}
              </div>

              {/* Society Maintenance Charge + Small Maintenance + Big Maintenance */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Society Maintenance Charge Who Pay? <span className="text-red-500">*</span>
                  </label>
                  <WhiteSelect
                    variant="compact"
                    value={societyMaintenanceBy}
                    onChange={(val) => setSocietyMaintenanceBy(val as 'Tenant' | 'Owner')}
                    options={['Tenant', 'Owner']}
                    aria-label="Society Maintenance Charge Who Pay"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-0.5">
                    Who Pay Small Maintenance? <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[10px] text-slate-500 block mb-1">
                    (like bulb, wire, tap, switch, etc.)
                  </span>
                  <WhiteSelect
                    variant="compact"
                    value={smallMaintenanceBy}
                    onChange={(val) => setSmallMaintenanceBy(val as 'Tenant' | 'Owner')}
                    options={['Tenant', 'Owner']}
                    aria-label="Who Pay Small Maintenance"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-0.5">
                    Who Pays Big Maintenance? <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[10px] text-slate-500 block mb-1">
                    (like modifying home, floor, paint, roof, etc.)
                  </span>
                  <WhiteSelect
                    variant="compact"
                    value={bigMaintenanceBy}
                    onChange={(val) => setBigMaintenanceBy(val as 'Owner' | 'Tenant')}
                    options={['Owner', 'Tenant']}
                    aria-label="Who Pays Big Maintenance"
                  />
                </div>
              </div>
            </div>

            {/* Commercial Escalation & Delayed Interest */}
            {docCategory === 'commercial' && (
              <div className={`${TOPIC_DIVIDER_CLASS} space-y-3`}>
                <TopicHeader
                  number={3}
                  title="Commercial Financial Configurations"
                  question="What rent escalation and delayed rent interest terms apply to this commercial lease?"
                  required
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                      Rent Escalation Clause <span className="text-red-500 font-bold">*</span>
                    </label>
                    <WhiteSelect
                      variant="compact"
                      value={rentEscalation}
                      onChange={setRentEscalation}
                      options={['None', '5% Annually', '10% Annually', 'Custom Percentage']}
                      aria-label="Rent Escalation Clause"
                    />
                    {rentEscalation === 'Custom Percentage' && (
                      <input
                        type="text"
                        value={customEscalation}
                        onChange={(e) => setCustomEscalation(e.target.value)}
                        placeholder={getPlaceholder("e.g. 7% per annum")}
                        className="mt-2 w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                      Delayed Rent Interest <span className="text-red-500 font-bold">*</span>
                    </label>
                    <WhiteSelect
                      variant="compact"
                      value={delayedRentInterest}
                      onChange={setDelayedRentInterest}
                      options={['None', '12% Per Annum', '18% Per Annum']}
                      aria-label="Delayed Rent Interest"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Agreement Clauses, Lock-in Period & Late Payment Penalty */}
            <div className={`${TOPIC_DIVIDER_CLASS} space-y-3`}>
              <TopicHeader
                number={docCategory === 'commercial' ? 4 : 3}
                title="Agreement Rules & Optional Terms"
                question="Which tenancy rules, lock-in period, and late payment terms apply?"
                required
              />

              {/* Sublease */}
              <label className={optionCardClass(clauseSubletting, '', true)}>
                <input
                  type="checkbox"
                  checked={clauseSubletting}
                  onChange={(e) => setClauseSubletting(e.target.checked)}
                  className="sr-only"
                />
                <CircleIndicator checked={clauseSubletting} className="mt-0.5" />
                <span className="text-xs text-slate-700">
                  <strong>{clauseSubletting ? 'Sublease Not Allowed:' : 'Sublease Allowed:'}</strong>{' '}
                  {clauseSubletting
                    ? 'Sublease is not allowed. The tenant cannot sublet or rent the property to any third party without written permission from the owner.'
                    : 'Sublease is allowed. The tenant may sublet part or full premises with prior notice to the owner.'}
                </span>
              </label>

              {/* Pets & Pet Usage */}
              <label className={optionCardClass(clausePetsAllowed, '', true)}>
                <input
                  type="checkbox"
                  checked={clausePetsAllowed}
                  onChange={(e) => setClausePetsAllowed(e.target.checked)}
                  className="sr-only"
                />
                <CircleIndicator checked={clausePetsAllowed} className="mt-0.5" />
                <span className="text-xs text-slate-700">
                  <strong>Pets &amp; Pet Usage:</strong>{' '}
                  {clausePetsAllowed
                    ? 'Domestic pets are allowed on the premises provided the tenant maintains cleanliness and ensures no disturbance or damage.'
                    : 'Allow domestic pets on the premises (Unchecked — pets are not allowed).'}
                </span>
              </label>

              {/* No Structure Changes */}
              <label className={optionCardClass(clauseStructural, '', true)}>
                <input
                  type="checkbox"
                  checked={clauseStructural}
                  onChange={(e) => setClauseStructural(e.target.checked)}
                  className="sr-only"
                />
                <CircleIndicator checked={clauseStructural} className="mt-0.5" />
                <span className="text-xs text-slate-700">
                  <strong>No Structure Changes:</strong> The tenant cannot break or alter any walls, pillars, or beams without written permission from the property owner.
                </span>
              </label>

              {/* Owner Visit Notice */}
              <label className={optionCardClass(clauseInspection, '', true)}>
                <input
                  type="checkbox"
                  checked={clauseInspection}
                  onChange={(e) => setClauseInspection(e.target.checked)}
                  className="sr-only"
                />
                <CircleIndicator checked={clauseInspection} className="mt-0.5" />
                <span className="text-xs text-slate-700">
                  <strong>Owner Visit Notice:</strong> The property owner can visit the property for inspection during daytime only after giving at least 24 hours prior notice to the tenant.
                </span>
              </label>

              {/* Force Majeure Protocol */}
              <label className={optionCardClass(clauseForceMajeure, '', true)}>
                <input
                  type="checkbox"
                  checked={clauseForceMajeure}
                  onChange={(e) => setClauseForceMajeure(e.target.checked)}
                  className="sr-only"
                />
                <CircleIndicator checked={clauseForceMajeure} className="mt-0.5" />
                <span className="text-xs text-slate-700">
                  <strong>Force Majeure Protocol:</strong> Fair rules for rent suspension or relaxation during natural disasters or government-mandated lockdowns.
                </span>
              </label>

              {/* Lock-in Period Checkbox + Duration + Break Fine Amount */}
              <div className={`${SUBQUESTION_DIVIDER_CLASS} space-y-3`}>
                <label className={optionCardClass(hasLockInPeriod, '', true)}>
                  <input
                    type="checkbox"
                    checked={hasLockInPeriod}
                    onChange={(e) => setHasLockInPeriod(e.target.checked)}
                    className="sr-only"
                  />
                  <CircleIndicator checked={hasLockInPeriod} className="mt-0.5" />
                  <span className="text-xs text-slate-800">
                    <strong>Lock-in Period:</strong> Set a minimum lock-in duration during which neither party can terminate the lease without a break fine.
                  </span>
                </label>

                {hasLockInPeriod && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 animate-fadeIn">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Lock-in Duration <span className="text-red-500">*</span>
                      </label>
                      <WhiteSelect
                        variant="compact"
                        value={lockInPeriod}
                        onChange={setLockInPeriod}
                        aria-label="Lock-in Duration"
                        options={[
                          '1 Month',
                          '2 Months',
                          '3 Months',
                          '6 Months',
                          { value: 'Custom', label: 'Custom (e.g. 1 Month 28 Days)' }
                        ]}
                      />

                      {lockInPeriod === 'Custom' && (
                        <input
                          type="text"
                          value={customLockInDuration}
                          onChange={(e) => setCustomLockInDuration(e.target.value)}
                          placeholder={getPlaceholder('e.g. 1 Month 28 Days')}
                          className="mt-2 w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                        />
                      )}
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Fine / Fee if Lock-in is Broken (₹) <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
                        <input
                          type="number"
                          min={0}
                          value={lockInFineAmount}
                          onChange={(e) => setLockInFineAmount(e.target.value)}
                          placeholder={getPlaceholder('Enter fine amount in INR')}
                          className="w-full bg-white border border-slate-300 rounded-lg pl-7 pr-3 py-1.5 text-xs text-slate-900"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* Late Payment Fees */}
            <div className={TOPIC_DIVIDER_CLASS}>
              <LatePaymentFeesSection
                topicNumber={docCategory === 'commercial' ? 5 : 4}
                radioNamePrefix="rl"
                value={latePayment}
                onChange={setLatePayment}
              />
            </div>

            {/* Signatory Authority Confirmation */}
            <div className={TOPIC_DIVIDER_CLASS}>
              <SignatoryAuthoritySection
                topicNumber={docCategory === 'commercial' ? 6 : 5}
                checked={signatoryAuthorized}
                onChange={(val) => {
                  setSignatoryAuthorized(val);
                  if (val) setShowSignatoryError(false);
                }}
                showError={showSignatoryError}
              />
            </div>

            {/* Dynamic Custom Clause Injector */}
            <div className={`${TOPIC_DIVIDER_CLASS} space-y-3`}>
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

        {/* ================= STEP 6: WITNESSES & EXECUTION ================= */}
        {currentPage === 6 && (
          <form onSubmit={handleSubmit} className="space-y-6 animate-fadeIn">
            {/* 1. Attestation (Two Witnesses) */}
            <div className="space-y-4">
              <span className="text-xs font-bold text-blue-700 uppercase tracking-wider block">
                1. Attestation (Two Witnesses)
              </span>

              <WitnessDetailsCard
                witnessNumber={1}
                name={w1Name}
                onNameChange={setW1Name}
                fatherName={w1FatherName}
                onFatherNameChange={setW1FatherName}
                profession={w1Profession}
                onProfessionChange={setW1Profession}
                email={w1Email}
                onEmailChange={setW1Email}
                isAbove18={w1Above18}
                onIsAbove18Change={setW1Above18}
                mobile={w1Mobile}
                onMobileChange={setW1Mobile}
                address={w1Address}
                onAddressChange={setW1Address}
              />

              <WitnessDetailsCard
                witnessNumber={2}
                name={w2Name}
                onNameChange={setW2Name}
                fatherName={w2FatherName}
                onFatherNameChange={setW2FatherName}
                profession={w2Profession}
                onProfessionChange={setW2Profession}
                email={w2Email}
                onEmailChange={setW2Email}
                isAbove18={w2Above18}
                onIsAbove18Change={setW2Above18}
                mobile={w2Mobile}
                onMobileChange={setW2Mobile}
                address={w2Address}
                onAddressChange={setW2Address}
              />
            </div>

            {/* 2. Legal Execution Mode */}
            <div className="pt-4 border-t border-slate-200 space-y-3">
              <span className="text-xs font-bold text-blue-700 uppercase tracking-wider block">
                2. Legal Execution Mode <span className="text-red-500 font-bold">*</span>
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Online Only */}
                <label className={optionCardClass(executionMode === 'digital', 'flex-col items-start p-3.5')}>
                  <input
                    type="radio"
                    name="executionMode"
                    checked={executionMode === 'digital'}
                    onChange={() => setExecutionMode('digital')}
                    className="sr-only"
                  />
                  <div className="flex items-center justify-between w-full mb-1">
                    <Download className="w-5 h-5 text-blue-600" />
                    <CircleIndicator checked={executionMode === 'digital'} />
                  </div>
                  <span className="text-xs font-bold text-black block">Online Only (Digital Delivery)</span>
                  <span className="text-[10px] font-normal text-slate-500 mt-0.5 block leading-tight">
                    Instant digital stamping &amp; OTP eSign
                  </span>
                  <span className="text-[10px] text-emerald-600 font-bold block mt-1.5">
                    Ready in 1-2 Hours · ₹0 Courier
                  </span>
                </label>

                {/* Offline Only */}
                <label className={optionCardClass(executionMode === 'physical', 'flex-col items-start p-3.5')}>
                  <input
                    type="radio"
                    name="executionMode"
                    checked={executionMode === 'physical'}
                    onChange={() => setExecutionMode('physical')}
                    className="sr-only"
                  />
                  <div className="flex items-center justify-between w-full mb-1">
                    <Truck className="w-5 h-5 text-blue-600" />
                    <CircleIndicator checked={executionMode === 'physical'} />
                  </div>
                  <span className="text-xs font-bold text-black block">Offline Only (Physical Courier)</span>
                  <span className="text-[10px] font-normal text-slate-500 mt-0.5 block leading-tight">
                    Official Physical Stamp Paper with wet-ink signatures
                  </span>
                  <span className="text-[10px] text-blue-600 font-bold block mt-1.5">
                    +₹50 Courier Fee
                  </span>
                </label>

                {/* Hybrid Mode */}
                <label className={optionCardClass(executionMode === 'hybrid', 'flex-col items-start p-3.5')}>
                  <input
                    type="radio"
                    name="executionMode"
                    checked={executionMode === 'hybrid'}
                    onChange={() => setExecutionMode('hybrid')}
                    className="sr-only"
                  />
                  <div className="flex items-center justify-between w-full mb-1">
                    <Layers className="w-5 h-5 text-blue-600" />
                    <CircleIndicator checked={executionMode === 'hybrid'} />
                  </div>
                  <span className="text-xs font-bold text-black block">Hybrid Mode (Digital + Physical)</span>
                  <span className="text-[10px] font-normal text-slate-500 mt-0.5 block leading-tight">
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

                    <AddressFieldGroup
                      label="Doorstep Shipping Address"
                      variant="standard"
                      defaultState={selectedState || 'Uttar Pradesh'}
                      value={shippingAddress}
                      onChangeAddress={(fullAddr, details) => {
                        setShippingAddress(fullAddr);
                        if (details?.pincode !== undefined) {
                          setShippingPincode(details.pincode);
                        }
                      }}
                      required
                      className="bg-white"
                    />

                    <div>
                      <label className="block text-[11px] font-bold text-amber-900 mb-0.5">
                        Recipient 10-Digit Mobile <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={shippingPhone}
                        onChange={(e) => setShippingPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
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
                  className={optionCardClass(verificationMode === 'self', 'flex-col items-stretch p-4')}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <CircleIndicator checked={verificationMode === 'self'} />
                      <ShieldCheck className={`w-5 h-5 ${verificationMode === 'self' ? 'text-blue-600' : 'text-slate-400'}`} />
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                        Self-Verified
                      </h4>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      ₹0 Extra (Free)
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] font-normal text-slate-600 leading-relaxed">
                    You confirm all entered details. Immediate processing via automated system.
                  </p>
                </div>

                {/* Mode B: Expert Legal Re-check (+₹10) */}
                <div
                  onClick={() => setVerificationMode('expert')}
                  role="button"
                  tabIndex={0}
                  className={optionCardClass(verificationMode === 'expert', 'flex-col items-stretch p-4')}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <CircleIndicator checked={verificationMode === 'expert'} />
                      <Sparkles className={`w-5 h-5 ${verificationMode === 'expert' ? 'text-blue-600' : 'text-slate-400'}`} />
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                        Expert Legal Re-check
                      </h4>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                      +₹10 Extra
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] font-normal text-slate-600 leading-relaxed">
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
                  <span>Digital e-Sign (Landlord &amp; Tenant + GST):</span>
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
                  "4. I understand and accept full responsibility for compliance with state stamp duty and Digital OTP e-Sign regulations.",
                  "5. I confirm and agree to pay the post-delivery fee upon receipt of the verified legal document."
                ].map((declarationText, idx) => (
                  <label
                    key={idx}
                    className={optionCardClass(declarations[idx], '', true)}
                  >
                    <input
                      type="checkbox"
                      checked={declarations[idx]}
                      onChange={(e) => {
                        const updated = [...declarations];
                        updated[idx] = e.target.checked;
                        setDeclarations(updated);
                      }}
                      className="sr-only"
                    />
                    <CircleIndicator checked={declarations[idx]} className="mt-0.5" />
                    <span className="text-xs leading-relaxed">
                      {declarationText}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Disclaimer Checkbox */}
            <label className={optionCardClass(disclaimerAccepted, 'p-4', true)}>
              <input
                type="checkbox"
                required
                checked={disclaimerAccepted}
                onChange={(e) => setDisclaimerAccepted(e.target.checked)}
                className="sr-only"
              />
              <CircleIndicator checked={disclaimerAccepted} className="mt-0.5" />
              <span className="text-xs text-slate-700 leading-relaxed">
                I verify that all entries are correct. Cotex Compliance acts strictly as an automated processing intermediary under the IT Act, 2000 and Model Tenancy Act guidelines.
              </span>
            </label>

            {/* Form Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setCurrentPage(5);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
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

        {/* Step Navigation Controls for Steps 1 to 5 */}
        {currentPage < 6 && (
          <div className="flex items-center justify-between pt-6 border-t border-slate-200 mt-6">
            <button
              type="button"
              onClick={
                currentPage === 1
                  ? onBack
                  : () => {
                      setCurrentPage((p) => p - 1);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
              }
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{currentPage === 1 ? 'Cancel' : 'Previous'}</span>
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
      )}
      </HorizontalSwipeContainer>
    </div>
  );
};
