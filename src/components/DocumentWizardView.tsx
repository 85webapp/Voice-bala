import React, { useState, useMemo, useEffect } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  FileText,
  Building2,
  User,
  ShieldCheck,
  Truck,
  Download,
  Plus,
  Trash2,
  Clock,
  Sparkles,
  HelpCircle,
  ChevronRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { LegalDocument, OrderItem } from '../types';
import { STATE_CATEGORIES, getSafeStampDuty, isUnilateralDocument } from '../data/stampDutyMatrix';
import { getDocumentConfig, CustomKeyValueTerm } from '../data/documentFormConfigs';
import { INITIAL_FRONT_DOCUMENTS } from '../data/documentsData';
import { getDocumentIdRule } from '../data/documentIdRequirements';
import { DateOfBirthPicker, calculateAgeInYears } from './DateOfBirthPicker';
import { useExampleDetails } from '../hooks/useExampleDetails';
import { AddressFieldGroup } from './AddressFieldGroup';
import { WitnessDetailsCard } from './WitnessDetailsCard';
import { CircleIndicator, optionCardClass, TOPIC_DIVIDER_CLASS } from './OptionControl';
import {
  encryptFormDataAndSign,
  saveLightweightMetadata,
  postEncryptedPayloadToWebsiteB,
  playConfirmationChime,
  generateSequentialOrderId,
  buildSubmissionOverview,
  fieldEntry,
  checkboxEntry,
  ServerBSyncResult
} from '../services/encryptionService';
import { ExternalLink, Lock } from 'lucide-react';
import { showToast } from '../services/toastService';
import { ServerBSyncStatusCard } from './ServerBSyncStatusCard';
import { playServiceVoice } from '../services/googleVoiceGuidance';
import { VoiceGuidanceButton } from './VoiceGuidanceButton';
import { FormRequestTabBar, HorizontalSwipeContainer, WizardModeTab } from './FormRequestTabBar';
import { QuickCallbackRequestPanel } from './QuickCallbackRequestPanel';
import {
  CreatorSponsorshipPage4,
  CreatorSponsorshipDetails,
  DEFAULT_CREATOR_SPONSORSHIP_DETAILS,
  validateCreatorSponsorshipPage4,
  WORK_TYPE_OPTIONS,
  PAYMENT_RECEIVE_OPTIONS,
  LIVE_VIDEO_VALIDITY_OPTIONS,
  PLATFORM_OPTIONS,
  TERRITORY_OPTIONS,
  CANCELLING_AGREEMENT_OPTIONS,
  CONTENT_APPROVAL_OPTIONS,
  USAGE_RIGHTS_OPTIONS,
  BREACH_PENALTY_OPTIONS,
  LEGAL_COPYRIGHT_OPTIONS
} from './CreatorSponsorshipPage4';
import { WhiteSelect } from './WhiteSelect';
import {
  CompanyEntityFields,
  CompanyEntityDetails,
  DEFAULT_COMPANY_ENTITY_DETAILS,
  validateCompanyEntityFields,
  COMPANY_SUBTYPE_OPTIONS,
  COMPANY_DESIGNATION_OPTIONS,
  getCompanyRegFieldMeta
} from './CompanyEntityFields';
import {
  ContentRightsPage4,
  ContentRightsDetails,
  DEFAULT_CONTENT_RIGHTS_DETAILS,
  validateContentRightsPage4,
  CONTENT_NATURE_OPTIONS,
  RIGHT_TO_MODIFY_OPTIONS,
  PAYMENT_MADE_HOW_OPTIONS,
  TAXES_OPTIONS,
  ORIGINALITY_CLAIM_OPTIONS,
  USAGE_PLATFORM_OPTIONS,
  TIME_PERIOD_OPTIONS,
  REUSE_RESTRICTION_OPTIONS,
  CREATOR_NAME_OPTIONS,
  CONFIDENTIALITY_OPTIONS
} from './ContentRightsPage4';
import {
  AgreementValiditySection,
  AgreementValidityValue,
  DEFAULT_AGREEMENT_VALIDITY,
  AGREEMENT_VALIDITY_OPTIONS_LABELS,
  formatAgreementValidity,
  isAgreementValidityValid
} from './AgreementValiditySection';
import {
  CopyrightTransferPage4,
  CopyrightTransferDetails,
  DEFAULT_COPYRIGHT_TRANSFER_DETAILS,
  validateCopyrightTransferPage4,
  COPYRIGHT_CONTENT_TYPES,
  TRANSFER_EFFECT_OPTIONS,
  RAW_SOURCE_FILE_OPTIONS,
  EDITING_RETRANSFER_OPTIONS,
  NAME_MENTION_OPTIONS,
  AI_DISCLOSURE_OPTIONS,
  EXISTING_COMMITMENTS_OPTIONS,
  REFUND_CANCELLATION_OPTIONS,
  MORAL_RESPECTFUL_USE_OPTIONS
} from './CopyrightTransferPage4';
import {
  FreelancerServicePage4,
  FreelancerOwnRulesSection,
  FreelancerServiceDetails,
  DEFAULT_FREELANCER_SERVICE_DETAILS,
  validateFreelancerServicePage4,
  getEffectiveOwnRules,
  FREELANCER_WORK_KINDS,
  FREELANCER_EXTRA_CHANGES_OPTIONS,
  FREELANCER_PAYMENT_HOW_OPTIONS,
  FREELANCER_TAXES_OPTIONS,
  FREELANCER_OWNERSHIP_OPTIONS,
  FREELANCER_CANCEL_MONEY_OPTIONS,
  FREELANCER_CONFIDENTIALITY_OPTIONS,
  FREELANCER_TOOLS_OPTIONS,
  FREELANCER_EXTRA_COST_OPTIONS,
  FREELANCER_DONE_CONFIRMATION_OPTIONS
} from './FreelancerServicePage4';
import {
  NdaPage4,
  NdaOwnRulesSection,
  NdaDetails,
  DEFAULT_NDA_DETAILS,
  validateNdaPage4,
  getEffectiveNdaOwnRules,
  formatNdaSecretDuration,
  NDA_WHO_SHARES_OPTIONS,
  NDA_WHAT_IS_SECRET_OPTIONS,
  NDA_WHY_SHARED_OPTIONS,
  NDA_HANDLING_RULES_OPTIONS,
  NDA_SHARE_WITH_TEAM_OPTIONS,
  NDA_NOT_SECRET_OPTIONS,
  NDA_RETURN_DELETE_OPTIONS,
  NDA_BREACH_OPTIONS,
  NDA_NOTICE_OPTIONS,
  NDA_WRITTEN_TERMS_OPTIONS
} from './NdaPage4';
import {
  VideoAudioReleasePage4,
  VideoAudioOwnRulesSection,
  VideoAudioReleaseDetails,
  DEFAULT_VIDEO_AUDIO_DETAILS,
  validateVideoAudioReleasePage4,
  getEffectiveVideoAudioOwnRules,
  formatVideoAudioDuration,
  VIDEO_AUDIO_MEDIA_TYPES,
  VIDEO_AUDIO_USAGE_TYPES,
  VIDEO_AUDIO_TERRITORY_OPTIONS,
  VIDEO_AUDIO_WHEN_PAID_OPTIONS,
  VIDEO_AUDIO_HOW_COUNTED_OPTIONS,
  VIDEO_AUDIO_EDITING_OPTIONS,
  VIDEO_AUDIO_IDENTITY_OPTIONS,
  VIDEO_AUDIO_RIGHTS_CONFIRM_OPTIONS,
  VIDEO_AUDIO_NOTICE_OPTIONS,
  VIDEO_AUDIO_WRITTEN_RULES_OPTIONS
} from './VideoAudioReleasePage4';
import { SignatoryAuthoritySection } from './SignatoryAuthoritySection';
import { TopicHeader } from './TopicHeader';

interface DocumentWizardViewProps {
  document: LegalDocument;
  onBack: () => void;
  onOrderCreated: (order: OrderItem) => void;
  onNavigateToDashboard: () => void;
}

export const DocumentWizardView: React.FC<DocumentWizardViewProps> = ({
  document: initialDoc,
  onBack,
  onOrderCreated,
  onNavigateToDashboard
}) => {
  const { showExampleDetails, getPlaceholder } = useExampleDetails();
  const [activeTab, setActiveTab] = useState<WizardModeTab>('form');
  // Current document selection (can be swapped via Page 1 dropdown)
  const [selectedDocTitle, setSelectedDocTitle] = useState(initialDoc.title);

  // Configuration for currently selected document
  const docConfig = useMemo(() => {
    return getDocumentConfig(selectedDocTitle);
  }, [selectedDocTitle]);

  const isUnilateral = useMemo(() => {
    return isUnilateralDocument(selectedDocTitle) || docConfig.isUnilateral;
  }, [selectedDocTitle, docConfig]);

  const isCreatorSponsorshipForm = useMemo(() => {
    return (
      selectedDocTitle === 'Brand Sponsorship & Promotion Agreement' ||
      selectedDocTitle === 'Influencer Collaboration Agreement'
    );
  }, [selectedDocTitle]);

  const isContentRightsForm = useMemo(() => {
    return selectedDocTitle === 'Content Rights Agreement';
  }, [selectedDocTitle]);

  const isCopyrightTransferForm = useMemo(() => {
    return selectedDocTitle === 'Copyright Transfer Agreement';
  }, [selectedDocTitle]);

  const isFreelancerForm = useMemo(() => {
    return selectedDocTitle === 'Freelancer & Client Service Contract';
  }, [selectedDocTitle]);

  const isNdaForm = useMemo(() => {
    return selectedDocTitle === 'Non-Disclosure Agreement (NDA)';
  }, [selectedDocTitle]);

  const isVideoAudioForm = useMemo(() => {
    return selectedDocTitle === 'Video/Audio Release Form';
  }, [selectedDocTitle]);

  const isRentOrLeaseDoc = useMemo(() => {
    const t = selectedDocTitle.toLowerCase();
    return (
      t.includes('rent') ||
      t.includes('lease') ||
      t.includes('tenan') ||
      t.includes('sublease')
    );
  }, [selectedDocTitle]);

  const isAffidavitDoc = useMemo(() => {
    return selectedDocTitle.toLowerCase().includes('affidavit');
  }, [selectedDocTitle]);

  // Page index (1 to 5). If isUnilateral, step 3 is skipped
  const [currentPage, setCurrentPage] = useState<number>(1);
  const totalPages = isUnilateral ? 4 : 5; // User UI shows Page X of 5, or adjusts cleanly

  // --- PAGE 1: Document & State Selection ---
  const [selectedState, setSelectedState] = useState<string>('Uttar Pradesh');
  const [paidBy, setPaidBy] = useState<'First Party' | 'Second Party' | '50-50%'>('First Party');
  // Auto-calculated stamp value from matrix
  const autoStampValue = useMemo(() => {
    return getSafeStampDuty(selectedDocTitle, selectedState);
  }, [selectedDocTitle, selectedState]);
  const [overrideStampValue, setOverrideStampValue] = useState<number | null>(null);
  const activeStampValue = overrideStampValue ?? autoStampValue;

  // Whenever state or doc title changes, reset override
  useEffect(() => {
    setOverrideStampValue(null);
  }, [selectedDocTitle, selectedState]);

  // Master Statutory ID Requirements (PAN, Aadhaar & Witnesses) for current document
  const docIdRule = useMemo(() => {
    return getDocumentIdRule(selectedDocTitle);
  }, [selectedDocTitle]);

  const STANDARD_DESIGNATIONS = [
    'Authorized Signatory',
    'Managing Director',
    'Director',
    'Proprietor',
    'Partner',
    'POA Holder',
    'Other'
  ];

  // --- PAGE 2: First Party Details ---
  const [firstPartyEntityType, setFirstPartyEntityType] = useState<'Individual' | 'Company'>('Individual');
  const [firstPartyCompanyDetails, setFirstPartyCompanyDetails] = useState<CompanyEntityDetails>(
    DEFAULT_COMPANY_ENTITY_DETAILS
  );
  const [firstPartyName, setFirstPartyName] = useState('');
  const [firstPartySignatory, setFirstPartySignatory] = useState('');
  const [firstPartyDesignation, setFirstPartyDesignation] = useState('Authorized Signatory');
  const [firstPartyCustomDesignation, setFirstPartyCustomDesignation] = useState('');
  const [firstPartyFatherName, setFirstPartyFatherName] = useState('');
  const [firstPartyAgeOrIncDate, setFirstPartyAgeOrIncDate] = useState('');
  const [firstPartyAddress, setFirstPartyAddress] = useState('');
  const [firstPartyEmail, setFirstPartyEmail] = useState('');
  const [firstPartyMobile, setFirstPartyMobile] = useState('');
  const [firstPartyPan, setFirstPartyPan] = useState('');
  const [firstPartyEntityAuthConfirmed, setFirstPartyEntityAuthConfirmed] = useState(false);
  const [showFirstPartyEntityAuthError, setShowFirstPartyEntityAuthError] = useState(false);

  // --- PAGE 3: Second Party Details (Bilateral only) ---
  const [secondPartyEntityType, setSecondPartyEntityType] = useState<'Individual' | 'Company'>('Individual');
  const [secondPartyCompanyDetails, setSecondPartyCompanyDetails] = useState<CompanyEntityDetails>(
    DEFAULT_COMPANY_ENTITY_DETAILS
  );
  const [secondPartyName, setSecondPartyName] = useState('');
  const [secondPartySignatory, setSecondPartySignatory] = useState('');
  const [secondPartyDesignation, setSecondPartyDesignation] = useState('Authorized Signatory');
  const [secondPartyCustomDesignation, setSecondPartyCustomDesignation] = useState('');
  const [secondPartyFatherName, setSecondPartyFatherName] = useState('');
  const [secondPartyAgeOrIncDate, setSecondPartyAgeOrIncDate] = useState('');
  const [secondPartyAddress, setSecondPartyAddress] = useState('');
  const [secondPartyEmail, setSecondPartyEmail] = useState('');
  const [secondPartyMobile, setSecondPartyMobile] = useState('');
  const [secondPartyPan, setSecondPartyPan] = useState('');
  const [secondPartyEntityAuthConfirmed, setSecondPartyEntityAuthConfirmed] = useState(false);
  const [showSecondPartyEntityAuthError, setShowSecondPartyEntityAuthError] = useState(false);

  // Conditional Age Check (e.g., Name Change Affidavit: Age >= 18 makes PAN Mandatory)
  const firstPartyAge = useMemo(() => {
    const parsedFromDob = calculateAgeInYears(firstPartyAgeOrIncDate);
    if (parsedFromDob !== null) return parsedFromDob;
    const numeric = Number((firstPartyAgeOrIncDate || '').trim());
    if (/^\d{1,3}$/.test((firstPartyAgeOrIncDate || '').trim()) && numeric >= 0 && numeric < 130) {
      return numeric;
    }
    return null;
  }, [firstPartyAgeOrIncDate]);

  const effectiveFirstPartyPan = useMemo(() => {
    if (docIdRule.panMandatoryMinAge !== undefined && firstPartyAge !== null) {
      return firstPartyAge >= docIdRule.panMandatoryMinAge ? 'mandatory' : 'optional';
    }
    return docIdRule.pan;
  }, [docIdRule, firstPartyAge]);

  const effectiveSecondPartyPan = docIdRule.secondPartyPan ?? docIdRule.pan;
  const requireWitnesses = docIdRule.requireWitnesses;

  // Strict 10-char PAN input sanitization
  const handlePanInput = (raw: string, setter: (val: string) => void) => {
    const sanitized = raw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
    setter(sanitized);
  };

  // --- PAGE 4: Core Document Specific Details ---
  const [scopeOfWork, setScopeOfWork] = useState('');
  const [considerationAmount, setConsiderationAmount] = useState('');
  const [durationMonths, setDurationMonths] = useState('');
  const [exclusivityTerritory, setExclusivityTerritory] = useState('');
  const [noticePeriod, setNoticePeriod] = useState('');
  const [creatorDetails, setCreatorDetails] = useState<CreatorSponsorshipDetails>(
    DEFAULT_CREATOR_SPONSORSHIP_DETAILS
  );
  const [contentRightsDetails, setContentRightsDetails] = useState<ContentRightsDetails>(
    DEFAULT_CONTENT_RIGHTS_DETAILS
  );
  const [copyrightTransferDetails, setCopyrightTransferDetails] = useState<CopyrightTransferDetails>(
    DEFAULT_COPYRIGHT_TRANSFER_DETAILS
  );
  const [freelancerDetails, setFreelancerDetails] = useState<FreelancerServiceDetails>(
    DEFAULT_FREELANCER_SERVICE_DETAILS
  );
  const [ndaDetails, setNdaDetails] = useState<NdaDetails>(
    DEFAULT_NDA_DETAILS
  );
  const [videoAudioDetails, setVideoAudioDetails] = useState<VideoAudioReleaseDetails>(
    DEFAULT_VIDEO_AUDIO_DETAILS
  );
  const [agreementValidity, setAgreementValidity] = useState<AgreementValidityValue>(
    DEFAULT_AGREEMENT_VALIDITY
  );
  const [signatoryAuthorized, setSignatoryAuthorized] = useState(false);
  const [showSignatoryError, setShowSignatoryError] = useState(false);

  // Key-Value Pair Custom Terms (Empty array by default)
  const [customTerms, setCustomTerms] = useState<CustomKeyValueTerm[]>([]);

  const addCustomTerm = () => {
    setCustomTerms((prev) => [
      ...prev,
      {
        id: `term-${Date.now()}`,
        title: '',
        description: ''
      }
    ]);
  };

  const updateCustomTerm = (id: string, field: 'title' | 'description', val: string) => {
    setCustomTerms((prev) =>
      prev.map((t) => (t.id === id ? { ...t, [field]: val } : t))
    );
  };

  const removeCustomTerm = (id: string) => {
    setCustomTerms((prev) => prev.filter((t) => t.id !== id));
  };

  // --- PAGE 5: Witness & Delivery Preferences + Pricing ---
  // Witness 1
  const [w1Name, setW1Name] = useState('');
  const [w1FatherName, setW1FatherName] = useState('');
  const [w1Profession, setW1Profession] = useState('');
  const [w1Email, setW1Email] = useState('');
  const [w1Above18, setW1Above18] = useState(false);
  const [w1Address, setW1Address] = useState('');
  const [w1Mobile, setW1Mobile] = useState('');

  // Witness 2
  const [w2Name, setW2Name] = useState('');
  const [w2FatherName, setW2FatherName] = useState('');
  const [w2Profession, setW2Profession] = useState('');
  const [w2Email, setW2Email] = useState('');
  const [w2Above18, setW2Above18] = useState(false);
  const [w2Address, setW2Address] = useState('');
  const [w2Mobile, setW2Mobile] = useState('');

  // Delivery preference: 'digital' | 'physical'
  const [deliveryType, setDeliveryType] = useState<'digital' | 'physical'>('digital');
  // Physical courier address
  const [shippingAddress, setShippingAddress] = useState('');
  const [shippingPincode, setShippingPincode] = useState('');
  const [shippingRecipientName, setShippingRecipientName] = useState('');
  const [shippingPhone, setShippingPhone] = useState('');

  // 5 Legal Declaration Checkboxes
  const [declarations, setDeclarations] = useState<boolean[]>([false, false, false, false, false]);

  // Verification Mode: 'self' (₹0) vs 'expert' (+₹10)
  const [verificationMode, setVerificationMode] = useState<'self' | 'expert'>('self');

  // Statutory disclaimer checkbox
  const [intermediaryDisclaimerAccepted, setIntermediaryDisclaimerAccepted] = useState(false);

  // Submission state
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

  // --- PRICING CALCULATION ---
  const pricing = useMemo(() => {
    const stamp = activeStampValue;
    // eSign: Bilateral = ₹30 + GST (Party 1) + ₹30 + GST (Party 2) = ₹70
    // Unilateral = ₹30 + GST (Deponent) = ₹35
    const eSign = isUnilateral ? 35 : 70;
    // Govt e-Sign purchasing charges: ₹40 (bilateral) or ₹20 (unilateral)
    const govtPurchasing = isUnilateral ? 20 : 40;
    // Platform fee: ₹49 (Explicit user amendment)
    const platformFee = 49;
    // Physical Courier surcharge: +₹50
    const courierFee = deliveryType === 'physical' ? 50 : 0;
    // Expert Legal Re-check: +₹10
    const expertFee = verificationMode === 'expert' ? 10 : 0;

    const rawTotal = stamp + eSign + govtPurchasing + platformFee + courierFee + expertFee;

    // Charm pricing ending in 9
    const remainder = rawTotal % 10;
    const totalPayable = remainder === 9 ? rawTotal : rawTotal + ((9 - remainder + 10) % 10);

    return {
      stamp,
      eSign,
      govtPurchasing,
      platformFee,
      courierFee,
      expertFee,
      totalPayable
    };
  }, [activeStampValue, isUnilateral, deliveryType, verificationMode]);

  // Handle Page navigation with validation
  const validatePage = (pageNumber: number): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (pageNumber === 1) {
      if (!selectedDocTitle.trim() || !selectedState.trim()) {
        showToast('Please confirm document type and state.', 'warning');
        return false;
      }
      return true;
    }

    if (pageNumber === 2) {
      if (firstPartyEntityType === 'Company') {
        const companyErr = validateCompanyEntityFields({
          partyLabel: 'First Party',
          entityName: firstPartyName,
          signatoryName: firstPartySignatory,
          designation: firstPartyDesignation,
          customDesignation: firstPartyCustomDesignation,
          registeredAddress: firstPartyAddress,
          email: firstPartyEmail,
          mobile: firstPartyMobile,
          companyPan: firstPartyPan,
          companyDetails: firstPartyCompanyDetails,
          entityAuthConfirmed: firstPartyEntityAuthConfirmed
        });
        if (!firstPartyEntityAuthConfirmed) {
          setShowFirstPartyEntityAuthError(true);
        }
        if (companyErr) {
          showToast(companyErr, 'warning');
          return false;
        }
        return true;
      }

      if (!firstPartyName.trim()) {
        showToast('Please enter Full Legal Name for First Party.', 'warning');
        return false;
      }
      if (docIdRule.panMandatoryMinAge !== undefined && firstPartyAge === null) {
        showToast('Please enter a valid Date of Birth (DD/MM/YYYY) to verify age eligibility.', 'warning');
        return false;
      }
      if (!firstPartyAddress.trim()) {
        showToast('Please enter Address for First Party.', 'warning');
        return false;
      }
      if (!emailRegex.test(firstPartyEmail.trim())) {
        showToast('Please enter a valid Email Address for First Party.', 'warning');
        return false;
      }
      const cleanMobile1 = firstPartyMobile.replace(/\D/g, '');
      if (cleanMobile1.length !== 10) {
        showToast('Please enter a valid 10-digit Mobile Number for First Party.', 'warning');
        return false;
      }
      if (effectiveFirstPartyPan === 'mandatory') {
        if (!firstPartyPan.trim() || firstPartyPan.trim().length !== 10) {
          const reasonMsg = docIdRule.panMandatoryMinAge !== undefined
            ? `PAN Card is Mandatory for ${selectedDocTitle} when Age is ${docIdRule.panMandatoryMinAge}+ years.`
            : `PAN Card is Mandatory for ${selectedDocTitle}.`;
          showToast(`${reasonMsg} Please enter a valid 10-character PAN.`, 'warning');
          return false;
        }
      } else if (firstPartyPan.trim().length > 0 && firstPartyPan.trim().length !== 10) {
        showToast('If entering First Party PAN Number, please enter a valid 10-character PAN.', 'warning');
        return false;
      }
      return true;
    }

    if (pageNumber === 3) {
      if (!isUnilateral) {
        if (secondPartyEntityType === 'Company') {
          const companyErr = validateCompanyEntityFields({
            partyLabel: 'Second Party',
            entityName: secondPartyName,
            signatoryName: secondPartySignatory,
            designation: secondPartyDesignation,
            customDesignation: secondPartyCustomDesignation,
            registeredAddress: secondPartyAddress,
            email: secondPartyEmail,
            mobile: secondPartyMobile,
            companyPan: secondPartyPan,
            companyDetails: secondPartyCompanyDetails,
            entityAuthConfirmed: secondPartyEntityAuthConfirmed
          });
          if (!secondPartyEntityAuthConfirmed) {
            setShowSecondPartyEntityAuthError(true);
          }
          if (companyErr) {
            showToast(companyErr, 'warning');
            return false;
          }
          return true;
        }

        if (!secondPartyName.trim()) {
          showToast('Please enter Full Legal Name for Second Party.', 'warning');
          return false;
        }
        if (!secondPartyAddress.trim()) {
          showToast('Please enter Address for Second Party.', 'warning');
          return false;
        }
        if (!emailRegex.test(secondPartyEmail.trim())) {
          showToast('Please enter a valid Email Address for Second Party.', 'warning');
          return false;
        }
        const cleanMobile2 = secondPartyMobile.replace(/\D/g, '');
        if (cleanMobile2.length !== 10) {
          showToast('Please enter a valid 10-digit Mobile Number for Second Party.', 'warning');
          return false;
        }
        if (effectiveSecondPartyPan === 'mandatory') {
          if (!secondPartyPan.trim() || secondPartyPan.trim().length !== 10) {
            showToast(`Second Party 10-character PAN Card is Mandatory for ${selectedDocTitle}.`, 'warning');
            return false;
          }
        } else if (secondPartyPan.trim().length > 0 && secondPartyPan.trim().length !== 10) {
          showToast('If entering Second Party PAN Number, please enter a valid 10-character PAN.', 'warning');
          return false;
        }
      }
      return true;
    }

    if (pageNumber === 4) {
      if (isContentRightsForm) {
        const err = validateContentRightsPage4(contentRightsDetails);
        if (err) {
          showToast(err, 'warning');
          return false;
        }
      } else if (isCopyrightTransferForm) {
        const err = validateCopyrightTransferPage4(copyrightTransferDetails);
        if (err) {
          showToast(err, 'warning');
          return false;
        }
      } else if (isCreatorSponsorshipForm) {
        const err = validateCreatorSponsorshipPage4(creatorDetails);
        if (err) {
          showToast(err, 'warning');
          return false;
        }
        if (!isAgreementValidityValid(agreementValidity)) {
          showToast('Please select Agreement Validity.', 'warning');
          return false;
        }
      } else if (isFreelancerForm) {
        const err = validateFreelancerServicePage4(freelancerDetails);
        if (err) {
          showToast(err, 'warning');
          return false;
        }
      } else if (isNdaForm) {
        const err = validateNdaPage4(ndaDetails);
        if (err) {
          showToast(err, 'warning');
          return false;
        }
      } else if (isVideoAudioForm) {
        const err = validateVideoAudioReleasePage4(videoAudioDetails);
        if (err) {
          showToast(err, 'warning');
          return false;
        }
      } else {
        if (!scopeOfWork.trim()) {
          showToast('Please fill in Deliverables & Scope of Work.', 'warning');
          return false;
        }
        if (!considerationAmount.trim()) {
          showToast('Please enter Financial Consideration / Fee.', 'warning');
          return false;
        }
        if (!isRentOrLeaseDoc && !durationMonths.trim()) {
          showToast('Please enter Validity / Duration.', 'warning');
          return false;
        }
        if (isRentOrLeaseDoc && !durationMonths.trim()) {
          showToast('Please select Validity / Duration.', 'warning');
          return false;
        }
        if (!exclusivityTerritory.trim()) {
          showToast('Please enter Territory / Platforms.', 'warning');
          return false;
        }
        if (!noticePeriod.trim()) {
          showToast('Please enter Termination / Notice Period.', 'warning');
          return false;
        }
        if (!isRentOrLeaseDoc && !isAgreementValidityValid(agreementValidity)) {
          showToast('Please select Agreement Validity.', 'warning');
          return false;
        }
      }

      if (!signatoryAuthorized) {
        setShowSignatoryError(true);
        showToast(
          'Please tick "Yes, I am authorized to enter this agreement." under Signatory Authority Confirmation.',
          'warning'
        );
        return false;
      }

      return true;
    }

    return true;
  };

  const handleNext = () => {
    if (!validatePage(currentPage)) return;

    if (currentPage === 2 && isUnilateral) {
      // Skip Page 3 completely for unilateral declarations!
      setCurrentPage(4);
    } else {
      setCurrentPage((prev) => Math.min(5, prev + 1));
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePrev = () => {
    if (currentPage === 4 && isUnilateral) {
      // Skip backwards over Page 3
      setCurrentPage(2);
    } else {
      setCurrentPage((prev) => Math.max(1, prev - 1));
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (requireWitnesses) {
      if (!w1Name.trim() || !w1FatherName.trim() || !w1Address.trim()) {
        showToast('Witness 1 Name, Father/Husband Name, and Address are mandatory.', 'warning');
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
        showToast('Witness 2 Name, Father/Husband Name, and Address are mandatory.', 'warning');
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
    }

    if (deliveryType === 'physical') {
      if (!shippingRecipientName.trim() || !shippingAddress.trim() || shippingPincode.replace(/\D/g, '').length !== 6) {
        showToast('Please enter Recipient Name, Shipping Address, and 6-digit Pincode.', 'warning');
        return;
      }
      if (shippingPhone.replace(/\D/g, '').length !== 10) {
        showToast('Please enter a valid 10-digit Physical Delivery Phone Number.', 'warning');
        return;
      }
    }

    // Verify all 5 declarations
    if (declarations.some((val) => !val)) {
      showToast('कृपया आगे बढ़ने के लिए सभी 5 कानूनी घोषणाओं (Declarations) को स्वीकार करें।', 'warning');
      return;
    }

    if (!intermediaryDisclaimerAccepted) {
      showToast('Please accept the Cotex Compliance intermediary verification checkbox before proceeding.', 'warning');
      return;
    }

    setIsSubmitting(true);

    try {
      const now = new Date();
      const todayISO = now.toISOString().split('T')[0];
      const newOrderId = generateSequentialOrderId();

      const resolvedDocMeta = INITIAL_FRONT_DOCUMENTS.find((d) => d.title === selectedDocTitle);
      const resolvedMainCategory = resolvedDocMeta?.category || initialDoc.category || 'Legal Document';
      const lowerTitle = selectedDocTitle.toLowerCase();
      const inferredRequestType = lowerTitle.includes('affidavit') || resolvedMainCategory.toLowerCase().includes('affidavit')
        ? 'Affidavit Request'
        : lowerTitle.includes('noc')
        ? 'NOC Request'
        : lowerTitle.includes('will') || lowerTitle.includes('power of attorney')
        ? 'Legal Deed / Authorization Request'
        : 'Agreement Request';

      const submissionOverview = buildSubmissionOverview({
        orderId: newOrderId,
        requestType: inferredRequestType,
        mainCategory: resolvedMainCategory,
        subCategory: selectedDocTitle,
        availableCategories: Array.from(new Set(INITIAL_FRONT_DOCUMENTS.map((d) => d.category))),
        availableSubCategories: INITIAL_FRONT_DOCUMENTS.map((d) => d.title),
        documentTitle: selectedDocTitle,
        date: now
      });

      const stateOptions = STATE_CATEGORIES.map((s) => s.name);
      const docTitleOptions = INITIAL_FRONT_DOCUMENTS.map((d) => d.title);
      const declarationTexts = [
        '1. मैंने दस्तावेज़ के सभी नियम व शर्तें ध्यानपूर्वक पढ़ ली हैं और मैं इनसे सहमत हूँ। (I have carefully read and agreed to all terms and conditions of this legal draft.)',
        '2. प्रस्तुत की गई दोनों पक्षों और गवाहों की व्यक्तिगत पहचान (PAN व ईमेल) व पते की जानकारी पूर्णतः सत्य और प्रामाणिक है। (All personal identity and address details of parties and witnesses provided are true and verified.)',
        '3. इस विलेख/करार का निष्पादन बिना किसी दबाव, कपट अथवा अनुचित प्रभाव के स्वतंत्र सहमति से किया जा रहा है। (This deed/agreement is being executed with free consent without any coercion, fraud, or undue influence.)',
        '4. संबंधित राज्य सरकार की स्टाम्प ड्यूटी एवं डिजिटल ई-हस्ताक्षर (Digital e-Sign) नियमों के अनुपालन की पूरी ज़िम्मेदारी मेरी है। (I understand and accept full responsibility for compliance with state stamp duty and Digital e-Sign regulations.)',
        '5. मैं पुष्टि करता हूँ कि दस्तावेज़ डिलीवरी के पश्चात देय राशि का भुगतान नियमानुसार करूँगा। (I confirm and agree to pay the post-delivery fee upon receipt of the verified legal document.)'
      ];

      const sections = [
        {
          pageNumber: 1,
          sectionTitle: 'Page 1: Document Type, Jurisdiction & Stamp Selection',
          fields: [
            fieldEntry('Selected Document Type', selectedDocTitle, false, docTitleOptions),
            fieldEntry('Document Category', resolvedMainCategory, false, Array.from(new Set(INITIAL_FRONT_DOCUMENTS.map((d) => d.category)))),
            fieldEntry('Execution Nature', isUnilateral ? 'Unilateral (1 Party)' : 'Bilateral (2 Parties)', false, ['Unilateral (1 Party)', 'Bilateral (2 Parties)']),
            fieldEntry('Selected State / Union Territory', selectedState, false, stateOptions),
            fieldEntry('Stamp Paper Value (INR)', `₹${activeStampValue}`, false, ['₹10', '₹20', '₹50', '₹100', '₹200', '₹500']),
            fieldEntry('Stamp Paper Override Applied', overrideStampValue !== null ? `Yes (₹${overrideStampValue})` : `Default Recommended (₹${autoStampValue})`, true),
            fieldEntry('Stamp Duty Paid By', paidBy, false, isUnilateral ? ['First Party'] : ['First Party', 'Second Party', '50-50%'])
          ]
        },
        {
          pageNumber: 2,
          sectionTitle: `Page 2: 1st Party Details (${docConfig.firstPartyRole})`,
          fields:
            firstPartyEntityType === 'Company'
              ? [
                  fieldEntry('First Party Entity Type', 'Company / Firm', false, ['Individual', 'Company / Firm']),
                  fieldEntry('Company / Firm Type', firstPartyCompanyDetails.subType, false, COMPANY_SUBTYPE_OPTIONS),
                  fieldEntry('Registered Company / Firm Name', firstPartyName, false),
                  fieldEntry(getCompanyRegFieldMeta(firstPartyCompanyDetails.subType).label, firstPartyCompanyDetails.regNumber, !getCompanyRegFieldMeta(firstPartyCompanyDetails.subType).required),
                  fieldEntry('Company / Firm GSTIN Number', firstPartyCompanyDetails.gstin, true),
                  fieldEntry('Company / Firm PAN Card', firstPartyPan, false),
                  fieldEntry('Date of Incorporation', firstPartyAgeOrIncDate, true),
                  fieldEntry('Email Address', firstPartyEmail, false),
                  fieldEntry('Registered Office / Business Address', firstPartyAddress, false),
                  fieldEntry('Authorized Signatory / Proprietor Name', firstPartySignatory, false),
                  fieldEntry('Signatory Designation', firstPartyDesignation === 'Other' ? firstPartyCustomDesignation : firstPartyDesignation, false, COMPANY_DESIGNATION_OPTIONS),
                  fieldEntry('Authorized Mobile Number', firstPartyMobile, false),
                  fieldEntry('Board Resolution / Auth Letter Date', firstPartyCompanyDetails.authLetterDate, true),
                  fieldEntry('Authorization Ref No.', firstPartyCompanyDetails.authLetterRef, true),
                  checkboxEntry('Entity Signing Authorization Confirmed', firstPartyEntityAuthConfirmed, false)
                ]
              : [
                  fieldEntry('First Party Entity Type', firstPartyEntityType, false, ['Individual', 'Company']),
                  fieldEntry('Full Legal Name', firstPartyName, false),
                  fieldEntry("Father's / Husband's Name", firstPartyFatherName, true),
                  fieldEntry('Age / Date of Birth', firstPartyAgeOrIncDate, true),
                  fieldEntry('Email Address', firstPartyEmail, false),
                  fieldEntry('Complete Address', firstPartyAddress, false),
                  fieldEntry('Mobile Number', firstPartyMobile, false),
                  fieldEntry('PAN Card Number', firstPartyPan, effectiveFirstPartyPan !== 'mandatory')
                ]
        },
        {
          pageNumber: 3,
          sectionTitle: isUnilateral
            ? 'Page 3: 2nd Party Details (Skipped — Unilateral Document)'
            : `Page 3: 2nd Party Details (${docConfig.secondPartyRole})`,
          fields: isUnilateral
            ? [fieldEntry('Second Party Applicable', 'No — Unilateral Affidavit / Declaration', true)]
            : secondPartyEntityType === 'Company'
            ? [
                fieldEntry('Second Party Entity Type', 'Company / Firm', false, ['Individual', 'Company / Firm']),
                fieldEntry('Company / Firm Type', secondPartyCompanyDetails.subType, false, COMPANY_SUBTYPE_OPTIONS),
                fieldEntry('Registered Company / Firm Name', secondPartyName, false),
                fieldEntry(getCompanyRegFieldMeta(secondPartyCompanyDetails.subType).label, secondPartyCompanyDetails.regNumber, !getCompanyRegFieldMeta(secondPartyCompanyDetails.subType).required),
                fieldEntry('Company / Firm GSTIN Number', secondPartyCompanyDetails.gstin, true),
                fieldEntry('Company / Firm PAN Card', secondPartyPan, false),
                fieldEntry('Date of Incorporation', secondPartyAgeOrIncDate, true),
                fieldEntry('Email Address', secondPartyEmail, false),
                fieldEntry('Registered Office / Business Address', secondPartyAddress, false),
                fieldEntry('Authorized Signatory / Proprietor Name', secondPartySignatory, false),
                fieldEntry('Signatory Designation', secondPartyDesignation === 'Other' ? secondPartyCustomDesignation : secondPartyDesignation, false, COMPANY_DESIGNATION_OPTIONS),
                fieldEntry('Authorized Mobile Number', secondPartyMobile, false),
                fieldEntry('Board Resolution / Auth Letter Date', secondPartyCompanyDetails.authLetterDate, true),
                fieldEntry('Authorization Ref No.', secondPartyCompanyDetails.authLetterRef, true),
                checkboxEntry('Entity Signing Authorization Confirmed', secondPartyEntityAuthConfirmed, false)
              ]
            : [
                fieldEntry('Second Party Entity Type', secondPartyEntityType, false, ['Individual', 'Company']),
                fieldEntry('Full Legal Name', secondPartyName, false),
                fieldEntry("Father's / Husband's Name", secondPartyFatherName, true),
                fieldEntry('Age / Date of Birth', secondPartyAgeOrIncDate, true),
                fieldEntry('Email Address', secondPartyEmail, false),
                fieldEntry('Complete Address', secondPartyAddress, false),
                fieldEntry('Mobile Number', secondPartyMobile, false),
                fieldEntry('PAN Card Number', secondPartyPan, effectiveSecondPartyPan !== 'mandatory')
              ]
        },
        {
          pageNumber: 4,
          sectionTitle: 'Page 4: Core Legal Scope & Custom Terms',
          fields: isContentRightsForm
            ? [
                fieldEntry(
                  'Nature of Content',
                  contentRightsDetails.natureOfContent === 'Others'
                    ? `Others: ${contentRightsDetails.natureOfContentCustom}`
                    : contentRightsDetails.natureOfContent,
                  false,
                  CONTENT_NATURE_OPTIONS
                ),
                fieldEntry('Content Title', contentRightsDetails.contentTitle, true),
                fieldEntry('Content Description', contentRightsDetails.contentDescription, true),
                fieldEntry(
                  'Type of Rights Granted',
                  contentRightsDetails.rightsGrantedType === 'full_ownership'
                    ? 'Full ownership forever (Buyer becomes the owner)'
                    : contentRightsDetails.rightsGrantedType === 'exclusive_timed'
                    ? `Only buyer can use it for ${contentRightsDetails.exclusiveNumber} ${contentRightsDetails.exclusiveUnit} time (Exclusive)`
                    : 'Buyer and other people can also use it (Non-Exclusive)',
                  false
                ),
                fieldEntry('Right to Modify', contentRightsDetails.rightToModify, false, RIGHT_TO_MODIFY_OPTIONS),
                fieldEntry(
                  'Total Payment / Fee Amount (₹)',
                  contentRightsDetails.paymentAmount ? `₹${contentRightsDetails.paymentAmount}` : '',
                  true
                ),
                fieldEntry('How will the payment be made?', contentRightsDetails.paymentMadeHow, false, PAYMENT_MADE_HOW_OPTIONS),
                fieldEntry(
                  'When should the payment be cleared?',
                  contentRightsDetails.paymentClearedWhen === 'immediate'
                    ? 'Immediately on delivery'
                    : contentRightsDetails.paymentClearedWhen === 'within'
                    ? `Within ${contentRightsDetails.paymentClearedNumber} ${contentRightsDetails.paymentClearedUnit} of delivery`
                    : `Custom: ${contentRightsDetails.paymentClearedCustom}`,
                  false
                ),
                fieldEntry('Taxes / GST', contentRightsDetails.taxesIncluded, false, TAXES_OPTIONS),
                fieldEntry('Late Fees Applicable', contentRightsDetails.hasLateFee, false, ['Yes', 'No']),
                ...(contentRightsDetails.hasLateFee === 'Yes'
                  ? [
                      fieldEntry(
                        'Grace Days Before Late Fees Start',
                        `${contentRightsDetails.lateFeeGraceNumber} ${contentRightsDetails.lateFeeGraceUnit}`,
                        false
                      ),
                      fieldEntry(
                        'Late Fee Charge',
                        contentRightsDetails.lateFeeType === 'Fixed'
                          ? `Fixed: ₹${contentRightsDetails.lateFeeFixedAmount}`
                          : `Percentage: ${contentRightsDetails.lateFeePercentValue}% ${contentRightsDetails.lateFeePercentPeriod}`,
                        false
                      )
                    ]
                  : []),
                fieldEntry('Originality and Third Party Claim', contentRightsDetails.originalityClaim, false, ORIGINALITY_CLAIM_OPTIONS),
                fieldEntry('Content Format and File Proof (Content Link)', contentRightsDetails.contentLink, true),
                fieldEntry('Usage / Platform Limit', contentRightsDetails.usagePlatforms.join(', '), false, USAGE_PLATFORM_OPTIONS),
                fieldEntry(
                  'Time Period / Validity',
                  contentRightsDetails.usageTimePeriod === 'Custom'
                    ? `Custom: ${contentRightsDetails.usageTimePeriodCustom}`
                    : contentRightsDetails.usageTimePeriod,
                  false,
                  TIME_PERIOD_OPTIONS
                ),
                fieldEntry('Reuse / Release Restriction', contentRightsDetails.reuseRestriction, false, REUSE_RESTRICTION_OPTIONS),
                fieldEntry('Take Down / Removal if Dispute Happens', contentRightsDetails.takeDownOnDispute, false, ['Yes', 'No']),
                fieldEntry('Creator Name Credit', contentRightsDetails.creatorNameCredit, false, CREATOR_NAME_OPTIONS),
                fieldEntry('Confidentiality / Project Privacy', contentRightsDetails.confidentiality, false, CONFIDENTIALITY_OPTIONS),
                fieldEntry('Agreement Validity', formatAgreementValidity(contentRightsDetails.agreementValidity), false, AGREEMENT_VALIDITY_OPTIONS_LABELS),
                fieldEntry(
                  'Termination / Cancellation Notice',
                  contentRightsDetails.terminationNoticeType === 'immediate'
                    ? 'Immediate'
                    : contentRightsDetails.terminationNoticeType === '7_days'
                    ? '7 days notice'
                    : `${contentRightsDetails.terminationNoticeNumber} ${contentRightsDetails.terminationNoticeUnit} notice`,
                  false
                ),
                checkboxEntry(
                  'Signatory Authority Confirmation (Yes, I am authorized to enter this agreement.)',
                  signatoryAuthorized,
                  false
                ),
                fieldEntry(
                  'Custom Terms Added',
                  customTerms.length > 0
                    ? customTerms.map((t, i) => `${i + 1}. ${t.title || 'Untitled'}: ${t.description}`).join(' | ')
                    : '',
                  true
                )
              ]
            : isCopyrightTransferForm
            ? [
                fieldEntry(
                  'Content Type',
                  copyrightTransferDetails.contentType === 'Other'
                    ? `Other: ${copyrightTransferDetails.contentTypeCustom}`
                    : copyrightTransferDetails.contentType,
                  false,
                  COPYRIGHT_CONTENT_TYPES
                ),
                fieldEntry('Work Title', copyrightTransferDetails.workTitle, true),
                fieldEntry('Project Name', copyrightTransferDetails.projectName, true),
                fieldEntry('Description (Short Summary)', copyrightTransferDetails.workDescription, true),
                fieldEntry('Content Link', copyrightTransferDetails.contentLink, true),
                fieldEntry(
                  'Transfer Scope and Type',
                  copyrightTransferDetails.transferScope === 'complete_forever'
                    ? 'Complete transfer forever (Full rights move to the buyer)'
                    : copyrightTransferDetails.transferScope === 'specific_period'
                    ? `Transfer for a specific time period: ${copyrightTransferDetails.transferPeriodNumber} ${copyrightTransferDetails.transferPeriodUnit}`
                    : `Transfer only for specific uses or platform: ${copyrightTransferDetails.transferSpecificUses}`,
                  false
                ),
                fieldEntry(
                  'Past Use / Prior Publication',
                  copyrightTransferDetails.pastUseStatus === 'new_unpublished'
                    ? 'No, it is completely new and unpublished'
                    : `Yes, it was published earlier (${copyrightTransferDetails.pastUseDetails})`,
                  false
                ),
                fieldEntry(
                  'When Does Transfer Take Effect?',
                  copyrightTransferDetails.transferEffectTiming,
                  false,
                  TRANSFER_EFFECT_OPTIONS
                ),
                fieldEntry(
                  'Raw / Source File',
                  copyrightTransferDetails.rawSourceFile,
                  false,
                  RAW_SOURCE_FILE_OPTIONS
                ),
                fieldEntry(
                  'Editing, Changes and Re-transfer',
                  copyrightTransferDetails.editingAndRetransfer,
                  false,
                  EDITING_RETRANSFER_OPTIONS
                ),
                fieldEntry(
                  'Name Mention',
                  copyrightTransferDetails.nameMention,
                  false,
                  NAME_MENTION_OPTIONS
                ),
                fieldEntry(
                  'Total Payment / Fee Amount (₹)',
                  copyrightTransferDetails.paymentAmount ? `₹${copyrightTransferDetails.paymentAmount}` : '',
                  true
                ),
                fieldEntry('How will the payment be made?', copyrightTransferDetails.paymentMadeHow, false, PAYMENT_MADE_HOW_OPTIONS),
                fieldEntry(
                  'When should the payment be cleared?',
                  copyrightTransferDetails.paymentClearedWhen === 'immediate'
                    ? 'Immediately on delivery'
                    : copyrightTransferDetails.paymentClearedWhen === 'within'
                    ? `Within ${copyrightTransferDetails.paymentClearedNumber} ${copyrightTransferDetails.paymentClearedUnit} of delivery`
                    : `Custom: ${copyrightTransferDetails.paymentClearedCustom}`,
                  false
                ),
                fieldEntry('Taxes / GST', copyrightTransferDetails.taxesIncluded, false, TAXES_OPTIONS),
                fieldEntry('Late Fees Applicable', copyrightTransferDetails.hasLateFee, false, ['Yes', 'No']),
                ...(copyrightTransferDetails.hasLateFee === 'Yes'
                  ? [
                      fieldEntry(
                        'Grace Days Before Late Fees Start',
                        `${copyrightTransferDetails.lateFeeGraceNumber} ${copyrightTransferDetails.lateFeeGraceUnit}`,
                        false
                      ),
                      fieldEntry(
                        'Late Fee Charge',
                        copyrightTransferDetails.lateFeeType === 'Fixed'
                          ? `Fixed: ₹${copyrightTransferDetails.lateFeeFixedAmount}`
                          : `Percentage: ${copyrightTransferDetails.lateFeePercentValue}% ${copyrightTransferDetails.lateFeePercentPeriod}`,
                        false
                      )
                    ]
                  : []),
                fieldEntry('Originality and Third Party Claim', copyrightTransferDetails.originalityClaim, false, ORIGINALITY_CLAIM_OPTIONS),
                fieldEntry('AI Generated Content Disclosure', copyrightTransferDetails.aiDisclosure, false, AI_DISCLOSURE_OPTIONS),
                fieldEntry('Existing Commitments / Conflict', copyrightTransferDetails.existingCommitments, false, EXISTING_COMMITMENTS_OPTIONS),
                fieldEntry(
                  'Delivery Proof / Acceptance',
                  copyrightTransferDetails.deliveryAcceptance === 'on_delivery'
                    ? 'As soon as files are delivered'
                    : copyrightTransferDetails.deliveryAcceptance === 'within_days'
                    ? `Within ${copyrightTransferDetails.deliveryAcceptanceDays} days unless objected`
                    : 'Only after written confirmation from the buyer',
                  false
                ),
                fieldEntry('Refund / Cancellation if Work is Not Done', copyrightTransferDetails.refundCancellation, false, REFUND_CANCELLATION_OPTIONS),
                fieldEntry('Moral / Respectful Use Condition', copyrightTransferDetails.moralRespectfulUse, false, MORAL_RESPECTFUL_USE_OPTIONS),
                fieldEntry('Confidentiality / Project Privacy', copyrightTransferDetails.confidentiality, false, CONFIDENTIALITY_OPTIONS),
                fieldEntry('Agreement Validity', formatAgreementValidity(copyrightTransferDetails.agreementValidity), false, AGREEMENT_VALIDITY_OPTIONS_LABELS),
                checkboxEntry(
                  'Signatory Authority Confirmation (Yes, I am authorized to enter this agreement.)',
                  signatoryAuthorized,
                  false
                ),
                fieldEntry(
                  'Custom Terms Added',
                  customTerms.length > 0
                    ? customTerms.map((t, i) => `${i + 1}. ${t.title || 'Untitled'}: ${t.description}`).join(' | ')
                    : '',
                  true
                )
              ]
            : isCreatorSponsorshipForm
            ? [
                fieldEntry(
                  'What work need to be done',
                  creatorDetails.workType === 'Custom / Other'
                    ? `Custom / Other: ${creatorDetails.workTypeCustom}`
                    : creatorDetails.workType,
                  false,
                  WORK_TYPE_OPTIONS
                ),
                fieldEntry('Describe your work or video', creatorDetails.workDescription, true),
                fieldEntry(
                  'How much is the total payment?',
                  creatorDetails.totalPayment
                    ? `₹${creatorDetails.totalPayment}${creatorDetails.addExtraGst ? ` (+ ${creatorDetails.gstRate} Extra GST)` : ''}`
                    : creatorDetails.addExtraGst
                    ? `+ ${creatorDetails.gstRate} Extra GST`
                    : '',
                  true
                ),
                fieldEntry('Add extra GST', creatorDetails.addExtraGst ? `Yes (${creatorDetails.gstRate})` : 'No', true),
                fieldEntry(
                  'Payment receive',
                  creatorDetails.paymentReceive === 'Custom'
                    ? `Custom: ${creatorDetails.paymentReceiveCustom}`
                    : creatorDetails.paymentReceive,
                  false,
                  PAYMENT_RECEIVE_OPTIONS
                ),
                fieldEntry(
                  'Validity of live video',
                  creatorDetails.liveVideoValidity === 'Custom'
                    ? `Custom: ${creatorDetails.liveVideoCustomNumber} ${creatorDetails.liveVideoCustomUnit}`
                    : creatorDetails.liveVideoValidity,
                  false,
                  LIVE_VIDEO_VALIDITY_OPTIONS
                ),
                fieldEntry(
                  'Platform',
                  creatorDetails.platforms
                    .map((p) =>
                      p === 'Custom / Other' && creatorDetails.platformCustom.trim()
                        ? `Custom / Other: ${creatorDetails.platformCustom.trim()}`
                        : p
                    )
                    .join(', '),
                  false,
                  PLATFORM_OPTIONS.map((p) => p.label)
                ),
                fieldEntry(
                  'Territory',
                  creatorDetails.territory === 'Specific State / City Only'
                    ? `Specific State / City Only: ${creatorDetails.territorySpecific}`
                    : creatorDetails.territory,
                  false,
                  TERRITORY_OPTIONS
                ),
                fieldEntry(
                  'Cancelling the Agreement',
                  creatorDetails.cancellingAgreement,
                  false,
                  CANCELLING_AGREEMENT_OPTIONS
                ),
                fieldEntry(
                  'Content Approval',
                  creatorDetails.contentApproval,
                  false,
                  CONTENT_APPROVAL_OPTIONS
                ),
                fieldEntry(
                  'Exclusivity / Competitor',
                  creatorDetails.exclusivityOption === 'yes'
                    ? 'Yes, creator can work with anyone anytime'
                    : `No, creator cannot promote competing brand during ${creatorDetails.exclusivityNumber} ${creatorDetails.exclusivityUnit} and after the campaign`,
                  false,
                  [
                    'Yes, creator can work with anyone anytime',
                    'No, creator cannot promote competing brand during [duration] and after the campaign'
                  ]
                ),
                fieldEntry(
                  'Usage Rights / Paid Ads',
                  creatorDetails.usageRightsPaidAds,
                  false,
                  USAGE_RIGHTS_OPTIONS
                ),
                fieldEntry(
                  'Video Modification',
                  creatorDetails.videoModificationOption === 'unlimited'
                    ? 'Unlimited'
                    : `Maximum ${creatorDetails.videoModificationCount} edits`,
                  false,
                  ['Maximum [1-100] edits', 'Unlimited']
                ),
                fieldEntry(
                  'Breach of Contract and Penalties',
                  creatorDetails.breachPenalty,
                  false,
                  BREACH_PENALTY_OPTIONS
                ),
                fieldEntry(
                  'Legal Problems or Copyright Problem — Who is Responsible?',
                  creatorDetails.legalCopyrightResponsibility,
                  false,
                  LEGAL_COPYRIGHT_OPTIONS
                ),
                fieldEntry('Late Payment Fees', creatorDetails.latePayment.hasLateFee, false, ['Yes', 'No']),
                ...(creatorDetails.latePayment.hasLateFee === 'Yes'
                  ? [
                      fieldEntry(
                        'Grace Period',
                        `${creatorDetails.latePayment.lateFeeGraceNumber} ${creatorDetails.latePayment.lateFeeGraceUnit}`,
                        false
                      ),
                      fieldEntry(
                        'Late Fee Charge',
                        creatorDetails.latePayment.lateFeeType === 'Fixed'
                          ? `Fixed: ₹${creatorDetails.latePayment.lateFeeFixedAmount}`
                          : `Percentage: ${creatorDetails.latePayment.lateFeePercentValue}% ${creatorDetails.latePayment.lateFeePercentPeriod}`,
                        false
                      )
                    ]
                  : []),
                fieldEntry('Agreement Validity', formatAgreementValidity(agreementValidity), false, AGREEMENT_VALIDITY_OPTIONS_LABELS),
                checkboxEntry(
                  'Signatory Authority Confirmation (Yes, I am authorized to enter this agreement.)',
                  signatoryAuthorized,
                  false
                ),
                fieldEntry(
                  'Custom Terms Added',
                  customTerms.length > 0
                    ? customTerms.map((t, i) => `${i + 1}. ${t.title || 'Untitled'}: ${t.description}`).join(' | ')
                    : '',
                  true
                )
              ]
            : isFreelancerForm
            ? [
                fieldEntry(
                  'Work Type',
                  freelancerDetails.workKind === 'Other Work'
                    ? `Other Work: ${freelancerDetails.workKindCustom}`
                    : freelancerDetails.workKind,
                  false,
                  FREELANCER_WORK_KINDS
                ),
                fieldEntry('What Work Will You Do', freelancerDetails.workTaskText, false),
                fieldEntry('Description', freelancerDetails.workDescription, true),
                fieldEntry('Finish & Delivery Time', `${freelancerDetails.finishNumber} ${freelancerDetails.finishUnit}`, false),
                fieldEntry('Extra Changes', freelancerDetails.extraChanges, false, FREELANCER_EXTRA_CHANGES_OPTIONS),
                fieldEntry('Total Agreed Fee (₹)', freelancerDetails.paymentAmount ? `₹${freelancerDetails.paymentAmount}` : '', true),
                fieldEntry('Payment Method', freelancerDetails.paymentHow, false, FREELANCER_PAYMENT_HOW_OPTIONS),
                fieldEntry(
                  'When Payment Comes',
                  freelancerDetails.paymentWhenType === 'before_start'
                    ? 'Before starting / at the start.'
                    : freelancerDetails.paymentWhenType === 'on_delivery'
                    ? 'When work is delivered.'
                    : `Within ${freelancerDetails.paymentWhenNumber} ${freelancerDetails.paymentWhenUnit} of getting the bill.`,
                  false
                ),
                fieldEntry('Taxes / GST', freelancerDetails.taxesOption, false, FREELANCER_TAXES_OPTIONS),
                fieldEntry('Late Payment Fees', freelancerDetails.hasLateFee, false, ['Yes', 'No']),
                ...(freelancerDetails.hasLateFee === 'Yes'
                  ? [
                      fieldEntry('Grace Period', `${freelancerDetails.lateFeeGraceNumber} ${freelancerDetails.lateFeeGraceUnit}`, false),
                      fieldEntry(
                        'Late Fee Charge',
                        freelancerDetails.lateFeeType === 'Fixed'
                          ? `Fixed: ₹${freelancerDetails.lateFeeFixedAmount}`
                          : `Percentage: ${freelancerDetails.lateFeePercentValue}% ${freelancerDetails.lateFeePercentPeriod}`,
                        false
                      )
                    ]
                  : []),
                fieldEntry('Who Owns the Work', freelancerDetails.workOwnership, false, FREELANCER_OWNERSHIP_OPTIONS),
                fieldEntry(
                  'Canceling Notice Period',
                  freelancerDetails.cancelNoticeType === 'stop_immediately'
                    ? 'Stop right away.'
                    : freelancerDetails.cancelNoticeType === 'cannot_stop'
                    ? 'Cannot stop early.'
                    : `${freelancerDetails.cancelNoticeNumber} ${freelancerDetails.cancelNoticeUnit} notice.`,
                  false
                ),
                fieldEntry('Early Stop Money Rule', freelancerDetails.cancelMoneyRule, false, FREELANCER_CANCEL_MONEY_OPTIONS),
                fieldEntry('Keep Things Private', freelancerDetails.keepPrivate, false, FREELANCER_CONFIDENTIALITY_OPTIONS),
                fieldEntry('Tools and Materials', freelancerDetails.toolsAndMaterials, false, FREELANCER_TOOLS_OPTIONS),
                fieldEntry('Extra Cost or Expenses', freelancerDetails.extraCostExpenses, false, FREELANCER_EXTRA_COST_OPTIONS),
                fieldEntry('Work Completion Confirmation', freelancerDetails.workDoneConfirmation, false, FREELANCER_DONE_CONFIRMATION_OPTIONS),
                fieldEntry('Agreement Validity', formatAgreementValidity(freelancerDetails.agreementValidity), false, AGREEMENT_VALIDITY_OPTIONS_LABELS),
                checkboxEntry(
                  'Signatory Authority Confirmation (Yes, I am authorized to enter this agreement.)',
                  signatoryAuthorized,
                  false
                ),
                fieldEntry('Has Own Rules?', freelancerDetails.hasOwnRules, false, ['Yes', 'No']),
                fieldEntry(
                  'Your Own Rules List',
                  freelancerDetails.hasOwnRules === 'Yes'
                    ? getEffectiveOwnRules(freelancerDetails).map((r, i) => `${i + 1}. ${r}`).join(' | ')
                    : 'None',
                  freelancerDetails.hasOwnRules !== 'Yes'
                )
              ]
            : isNdaForm
            ? [
                fieldEntry('Who Shares Secret Information?', ndaDetails.whoSharesSecret, false, NDA_WHO_SHARES_OPTIONS),
                fieldEntry(
                  'What is Secret (Categories)',
                  ndaDetails.secretCategories.join(', ') +
                    (ndaDetails.secretCategories.includes('Other Secret Information') && ndaDetails.secretOtherDetail
                      ? ` (${ndaDetails.secretOtherDetail})`
                      : ''),
                  false,
                  NDA_WHAT_IS_SECRET_OPTIONS
                ),
                fieldEntry('Secret Topic', ndaDetails.secretTopicTitle, false),
                fieldEntry('Secret Project Description', ndaDetails.secretProjectDescription, false),
                fieldEntry(
                  'Why Secret Information is Shared',
                  ndaDetails.sharePurposeType === 'Other reason'
                    ? `Other reason: ${ndaDetails.sharePurposeOther}`
                    : ndaDetails.sharePurposeType,
                  false,
                  NDA_WHY_SHARED_OPTIONS
                ),
                fieldEntry('Purpose Details', ndaDetails.sharePurposeDetails, false),
                fieldEntry(
                  'How Secret Information Must Be Handled',
                  ndaDetails.handlingRules.join(' | '),
                  false,
                  NDA_HANDLING_RULES_OPTIONS
                ),
                fieldEntry('Extra Care Rules', ndaDetails.handlingExtraRules, true),
                fieldEntry('Share with Team or Staff', ndaDetails.shareWithTeam, false, NDA_SHARE_WITH_TEAM_OPTIONS),
                fieldEntry(
                  'What is Not Secret?',
                  ndaDetails.notSecretExclusions.join(' | '),
                  false,
                  NDA_NOT_SECRET_OPTIONS
                ),
                fieldEntry('How long to hide secret information', formatNdaSecretDuration(ndaDetails), false),
                fieldEntry(
                  'Return or delete secret files',
                  ndaDetails.returnOrDeleteFiles === 'Custom'
                    ? `Custom: ${ndaDetails.returnOrDeleteCustom}`
                    : ndaDetails.returnOrDeleteFiles,
                  false,
                  NDA_RETURN_DELETE_OPTIONS
                ),
                fieldEntry(
                  'If NDA breaks',
                  ndaDetails.breachConsequence === 'Pay a fixed penalty amount'
                    ? `${ndaDetails.breachConsequence} (Fixed Penalty: ₹${ndaDetails.breachFixedPenaltyAmount})`
                    : ndaDetails.breachConsequence,
                  false,
                  NDA_BREACH_OPTIONS
                ),
                fieldEntry('Official notice and proof', ndaDetails.officialNoticeMethod, false, NDA_NOTICE_OPTIONS),
                fieldEntry(
                  'Specific Notice Address',
                  ndaDetails.specificNoticeAddress,
                  ndaDetails.officialNoticeMethod !== 'Specific email or address for notice'
                ),
                fieldEntry(
                  'Only written terms and changes',
                  ndaDetails.writtenTermsRules.join(' | '),
                  false,
                  NDA_WRITTEN_TERMS_OPTIONS
                ),
                fieldEntry('Agreement Validity', formatAgreementValidity(ndaDetails.agreementValidity), false, AGREEMENT_VALIDITY_OPTIONS_LABELS),
                checkboxEntry(
                  'Signatory Authority Confirmation (Yes, I am authorized to enter this agreement.)',
                  signatoryAuthorized,
                  false
                ),
                fieldEntry('Has Own Rules?', ndaDetails.hasOwnRules, false, ['Yes', 'No']),
                fieldEntry(
                  'Your Extra Rules List',
                  ndaDetails.hasOwnRules === 'Yes'
                    ? getEffectiveNdaOwnRules(ndaDetails).map((r, i) => `${i + 1}. ${r}`).join(' | ')
                    : 'None',
                  ndaDetails.hasOwnRules !== 'Yes'
                )
              ]
            : isVideoAudioForm
            ? [
                fieldEntry(
                  'What video or audio is included?',
                  videoAudioDetails.mediaTypes.join(', '),
                  false,
                  VIDEO_AUDIO_MEDIA_TYPES
                ),
                fieldEntry('Recording Details (Date, Place, Topic/Title)', videoAudioDetails.mediaDetails, false),
                fieldEntry(
                  'How it can be used?',
                  videoAudioDetails.usageTypes.join(', ') +
                    (videoAudioDetails.usageTypes.includes('Other uses') && videoAudioDetails.usageCustom
                      ? ` (${videoAudioDetails.usageCustom})`
                      : ''),
                  false,
                  VIDEO_AUDIO_USAGE_TYPES
                ),
                fieldEntry(
                  'Where it can be used',
                  videoAudioDetails.territoryType === 'Specific country or region'
                    ? `Specific country or region: ${videoAudioDetails.territoryCustom}`
                    : videoAudioDetails.territoryType,
                  false,
                  VIDEO_AUDIO_TERRITORY_OPTIONS
                ),
                fieldEntry('How long it can be used', formatVideoAudioDuration(videoAudioDetails), false),
                fieldEntry(
                  'Payment or free release',
                  videoAudioDetails.releasePaymentType === 'paid'
                    ? `Paid release — ₹${videoAudioDetails.paymentAmount}`
                    : 'Free release (no payment)',
                  false,
                  ['Paid release', 'Free release (no payment)']
                ),
                fieldEntry(
                  'When payment will be made',
                  videoAudioDetails.paymentWhen,
                  videoAudioDetails.releasePaymentType !== 'paid',
                  VIDEO_AUDIO_WHEN_PAID_OPTIONS
                ),
                fieldEntry(
                  'How payment will be counted as paid',
                  videoAudioDetails.paymentCountedHow,
                  videoAudioDetails.releasePaymentType !== 'paid',
                  VIDEO_AUDIO_HOW_COUNTED_OPTIONS
                ),
                fieldEntry('Editing and changes', videoAudioDetails.editingAllowed, false, VIDEO_AUDIO_EDITING_OPTIONS),
                fieldEntry(
                  'Showing your name or identity',
                  videoAudioDetails.identityDisplay === 'Other'
                    ? `Other: ${videoAudioDetails.identityCustom}`
                    : videoAudioDetails.identityDisplay,
                  false,
                  VIDEO_AUDIO_IDENTITY_OPTIONS
                ),
                fieldEntry(
                  'No claim or objection confirmation',
                  videoAudioDetails.rightsConfirmChecks.join(' | '),
                  false,
                  VIDEO_AUDIO_RIGHTS_CONFIRM_OPTIONS
                ),
                fieldEntry(
                  'Official notice method',
                  videoAudioDetails.officialNoticeMethod,
                  false,
                  VIDEO_AUDIO_NOTICE_OPTIONS
                ),
                fieldEntry(
                  'Written rules confirmation',
                  videoAudioDetails.writtenRulesChecks.join(' | '),
                  false,
                  VIDEO_AUDIO_WRITTEN_RULES_OPTIONS
                ),
                fieldEntry('Agreement Validity', formatAgreementValidity(videoAudioDetails.agreementValidity), false, AGREEMENT_VALIDITY_OPTIONS_LABELS),
                checkboxEntry(
                  'Signatory Authority Confirmation (Yes, I am authorized to enter this agreement.)',
                  signatoryAuthorized,
                  false
                ),
                fieldEntry('Has Own Rules?', videoAudioDetails.hasOwnRules, false, ['Yes', 'No']),
                fieldEntry(
                  'Your Extra Rules List',
                  videoAudioDetails.hasOwnRules === 'Yes'
                    ? getEffectiveVideoAudioOwnRules(videoAudioDetails).map((r, i) => `${i + 1}. ${r}`).join(' | ')
                    : 'None',
                  videoAudioDetails.hasOwnRules !== 'Yes'
                )
              ]
            : [
                fieldEntry(docConfig.coreSectionTitle || 'Scope / Statement / Core Clauses', scopeOfWork, true),
                fieldEntry('Consideration / Financial Terms', considerationAmount, true),
                fieldEntry('Duration / Validity Months', durationMonths, true),
                fieldEntry('Territory / Jurisdiction Scope', exclusivityTerritory, true),
                fieldEntry('Notice Period / Termination Clause', noticePeriod, true),
                ...(!isRentOrLeaseDoc
                  ? [
                      fieldEntry(
                        'Agreement Validity',
                        formatAgreementValidity(agreementValidity),
                        false,
                        AGREEMENT_VALIDITY_OPTIONS_LABELS
                      )
                    ]
                  : []),
                checkboxEntry(
                  'Signatory Authority Confirmation (Yes, I am authorized to enter this agreement.)',
                  signatoryAuthorized,
                  false
                ),
                fieldEntry(
                  'Custom Terms Added',
                  customTerms.length > 0
                    ? customTerms.map((t, i) => `${i + 1}. ${t.title || 'Untitled'}: ${t.description}`).join(' | ')
                    : '',
                  true
                )
              ]
        },
        {
          pageNumber: 5,
          sectionTitle: requireWitnesses
            ? 'Page 5: Witnesses, Delivery, Review Mode & Legal Declarations'
            : 'Page 5: Delivery, Review Mode & Legal Declarations (Witnesses Not Applicable)',
          fields: [
            ...(requireWitnesses
              ? [
                  fieldEntry('Witness 1 Full Legal Name', w1Name, false),
                  fieldEntry("Witness 1 Father's / Husband's Name", w1FatherName, false),
                  fieldEntry('Witness 1 Email Address', w1Email, false),
                  fieldEntry('Witness 1 Profession / Job Title', w1Profession, true),
                  fieldEntry('Witness 1 Residential Address', w1Address, false),
                  fieldEntry('Witness 1 Mobile Number', w1Mobile, false),
                  checkboxEntry('Witness 1 is above 18+', w1Above18, false),
                  fieldEntry('Witness 2 Full Legal Name', w2Name, false),
                  fieldEntry("Witness 2 Father's / Husband's Name", w2FatherName, false),
                  fieldEntry('Witness 2 Email Address', w2Email, false),
                  fieldEntry('Witness 2 Profession / Job Title', w2Profession, true),
                  fieldEntry('Witness 2 Residential Address', w2Address, false),
                  fieldEntry('Witness 2 Mobile Number', w2Mobile, false),
                  checkboxEntry('Witness 2 is above 18+', w2Above18, false)
                ]
              : [
                  fieldEntry('Witnesses Applicable', 'No — Unilateral Affidavit / Proprietorship Declaration Deed', true)
                ]),
            fieldEntry('Delivery Mode Selected', deliveryType === 'physical' ? 'Physical Courier Delivery (+₹50)' : 'Digital Delivery Only (Free)', false, ['Digital Delivery Only (Free)', 'Physical Courier Delivery (+₹50)']),
            fieldEntry('Shipping Recipient Name', shippingRecipientName, deliveryType !== 'physical'),
            fieldEntry('Shipping Delivery Phone', shippingPhone, deliveryType !== 'physical'),
            fieldEntry('Shipping Street Address', shippingAddress, deliveryType !== 'physical'),
            fieldEntry('Shipping Pincode', shippingPincode, deliveryType !== 'physical'),
            fieldEntry('Verification & Review Mode', verificationMode === 'expert' ? 'Expert Legal Re-check (+₹10)' : 'Self-Verified (Free)', false, ['Self-Verified (Free)', 'Expert Legal Re-check (+₹10)']),
            fieldEntry('Total Amount Payable Post-Delivery', `₹${pricing.totalPayable}`, false),
            ...declarationTexts.map((txt, idx) => checkboxEntry(txt, Boolean(declarations[idx]), false)),
            checkboxEntry('Intermediary Disclaimer Accepted (Cotex Compliance IT Act 2000)', intermediaryDisclaimerAccepted, false)
          ]
        }
      ];

      // 1. Gather complete sensitive details for zero-database encryption
      const sensitivePayload = {
        orderId: newOrderId,
        submissionOverview,
        submittedDate: submissionOverview.submittedDate,
        submittedTime: submissionOverview.submittedTime,
        requestType: submissionOverview.requestType,
        mainCategory: submissionOverview.mainCategory,
        subCategory: submissionOverview.subCategory,
        docTitle: selectedDocTitle,
        category: resolvedMainCategory,
        state: selectedState,
        paidBy,
        stampDutyAmount: activeStampValue,
        firstParty: {
          entityType: firstPartyEntityType,
          companyDetails: firstPartyEntityType === 'Company' ? firstPartyCompanyDetails : null,
          name: firstPartyName,
          signatory: firstPartySignatory,
          designation: firstPartyDesignation === 'Other' ? firstPartyCustomDesignation : firstPartyDesignation,
          fatherName: firstPartyFatherName,
          ageOrIncDate: firstPartyAgeOrIncDate,
          address: firstPartyAddress,
          email: firstPartyEmail,
          mobile: firstPartyMobile,
          pan: firstPartyPan,
          entityAuthConfirmed: firstPartyEntityType === 'Company' ? firstPartyEntityAuthConfirmed : undefined
        },
        secondParty: isUnilateral ? null : {
          entityType: secondPartyEntityType,
          companyDetails: secondPartyEntityType === 'Company' ? secondPartyCompanyDetails : null,
          name: secondPartyName,
          signatory: secondPartySignatory,
          designation: secondPartyDesignation === 'Other' ? secondPartyCustomDesignation : secondPartyDesignation,
          fatherName: secondPartyFatherName,
          ageOrIncDate: secondPartyAgeOrIncDate,
          address: secondPartyAddress,
          email: secondPartyEmail,
          mobile: secondPartyMobile,
          pan: secondPartyPan,
          entityAuthConfirmed: secondPartyEntityType === 'Company' ? secondPartyEntityAuthConfirmed : undefined
        },
        documentDetails: isContentRightsForm
          ? {
              scopeOfWork: `${contentRightsDetails.natureOfContent}${contentRightsDetails.contentTitle ? ` — ${contentRightsDetails.contentTitle}` : ''}`,
              considerationAmount: contentRightsDetails.paymentAmount ? `₹${contentRightsDetails.paymentAmount}` : '',
              durationMonths: formatAgreementValidity(contentRightsDetails.agreementValidity),
              exclusivityTerritory: contentRightsDetails.usagePlatforms.join(', '),
              noticePeriod:
                contentRightsDetails.terminationNoticeType === 'immediate'
                  ? 'Immediate'
                  : contentRightsDetails.terminationNoticeType === '7_days'
                  ? '7 days notice'
                  : `${contentRightsDetails.terminationNoticeNumber} ${contentRightsDetails.terminationNoticeUnit} notice`,
              contentRightsDetails,
              signatoryAuthorized
            }
          : isCopyrightTransferForm
          ? {
              scopeOfWork: `${
                copyrightTransferDetails.contentType === 'Other'
                  ? copyrightTransferDetails.contentTypeCustom
                  : copyrightTransferDetails.contentType
              }${copyrightTransferDetails.workTitle ? ` — ${copyrightTransferDetails.workTitle}` : ''}`,
              considerationAmount: copyrightTransferDetails.paymentAmount
                ? `₹${copyrightTransferDetails.paymentAmount}`
                : '',
              durationMonths: formatAgreementValidity(copyrightTransferDetails.agreementValidity),
              exclusivityTerritory:
                copyrightTransferDetails.transferScope === 'complete_forever'
                  ? 'Complete transfer forever'
                  : copyrightTransferDetails.transferScope === 'specific_period'
                  ? `${copyrightTransferDetails.transferPeriodNumber} ${copyrightTransferDetails.transferPeriodUnit}`
                  : copyrightTransferDetails.transferSpecificUses,
              noticePeriod: copyrightTransferDetails.refundCancellation,
              copyrightTransferDetails,
              signatoryAuthorized
            }
          : isCreatorSponsorshipForm
          ? {
              scopeOfWork: `${
                creatorDetails.workType === 'Custom / Other'
                  ? creatorDetails.workTypeCustom
                  : creatorDetails.workType
              }${creatorDetails.workDescription ? ` — ${creatorDetails.workDescription}` : ''}`,
              considerationAmount: creatorDetails.totalPayment
                ? `₹${creatorDetails.totalPayment}${creatorDetails.addExtraGst ? ` (+ ${creatorDetails.gstRate} Extra GST)` : ''}`
                : '',
              durationMonths: formatAgreementValidity(agreementValidity),
              exclusivityTerritory: `${
                creatorDetails.territory === 'Specific State / City Only'
                  ? creatorDetails.territorySpecific
                  : creatorDetails.territory
              } | Platforms: ${creatorDetails.platforms.join(', ')}`,
              noticePeriod: creatorDetails.cancellingAgreement,
              creatorSponsorshipDetails: creatorDetails,
              agreementValidity,
              signatoryAuthorized
            }
          : isFreelancerForm
          ? {
              scopeOfWork: `${
                freelancerDetails.workKind === 'Other Work'
                  ? freelancerDetails.workKindCustom
                  : freelancerDetails.workKind
              } — ${freelancerDetails.workTaskText}`,
              considerationAmount: freelancerDetails.paymentAmount
                ? `₹${freelancerDetails.paymentAmount}`
                : '',
              durationMonths: formatAgreementValidity(freelancerDetails.agreementValidity),
              exclusivityTerritory: 'As per Freelancer Service Contract',
              noticePeriod:
                freelancerDetails.cancelNoticeType === 'stop_immediately'
                  ? 'Stop right away'
                  : freelancerDetails.cancelNoticeType === 'cannot_stop'
                  ? 'Cannot stop early'
                  : `${freelancerDetails.cancelNoticeNumber} ${freelancerDetails.cancelNoticeUnit} notice`,
              freelancerDetails: {
                ...freelancerDetails,
                ownRules: getEffectiveOwnRules(freelancerDetails)
              },
              signatoryAuthorized
            }
          : isNdaForm
          ? {
              scopeOfWork: `${ndaDetails.secretTopicTitle} — ${ndaDetails.secretProjectDescription}`,
              considerationAmount: ndaDetails.breachFixedPenaltyAmount
                ? `Fixed Penalty: ₹${ndaDetails.breachFixedPenaltyAmount}`
                : 'Non-Disclosure Confidentiality Covenant',
              durationMonths: formatAgreementValidity(ndaDetails.agreementValidity),
              exclusivityTerritory: formatNdaSecretDuration(ndaDetails),
              noticePeriod: ndaDetails.officialNoticeMethod,
              ndaDetails: {
                ...ndaDetails,
                ownRules: getEffectiveNdaOwnRules(ndaDetails)
              },
              signatoryAuthorized
            }
          : isVideoAudioForm
          ? {
              scopeOfWork: `${videoAudioDetails.mediaTypes.join(', ')} — ${videoAudioDetails.mediaDetails}`,
              considerationAmount:
                videoAudioDetails.releasePaymentType === 'paid' && videoAudioDetails.paymentAmount
                  ? `₹${videoAudioDetails.paymentAmount}`
                  : 'Free Release (No Payment)',
              durationMonths: formatAgreementValidity(videoAudioDetails.agreementValidity),
              exclusivityTerritory: `${
                videoAudioDetails.territoryType === 'Specific country or region'
                  ? videoAudioDetails.territoryCustom
                  : videoAudioDetails.territoryType
              } | Duration: ${formatVideoAudioDuration(videoAudioDetails)}`,
              noticePeriod: videoAudioDetails.officialNoticeMethod,
              videoAudioDetails: {
                ...videoAudioDetails,
                ownRules: getEffectiveVideoAudioOwnRules(videoAudioDetails)
              },
              signatoryAuthorized
            }
          : {
              scopeOfWork,
              considerationAmount,
              durationMonths,
              exclusivityTerritory,
              noticePeriod,
              agreementValidity: !isRentOrLeaseDoc ? agreementValidity : undefined,
              signatoryAuthorized
            },
        witnesses: requireWitnesses
          ? [
              { name: w1Name, fatherName: w1FatherName, email: w1Email, profession: w1Profession, address: w1Address, mobile: w1Mobile, isAbove18: w1Above18 },
              { name: w2Name, fatherName: w2FatherName, email: w2Email, profession: w2Profession, address: w2Address, mobile: w2Mobile, isAbove18: w2Above18 }
            ]
          : [],
        pricing,
        verificationMode,
        delivery: {
          type: deliveryType,
          recipientName: deliveryType === 'physical' ? shippingRecipientName : undefined,
          shippingAddress: deliveryType === 'physical' ? shippingAddress : undefined,
          pincode: deliveryType === 'physical' ? shippingPincode : undefined,
          shippingPhone: deliveryType === 'physical' ? shippingPhone : undefined
        },
        customTerms,
        signatoryAuthorized,
        declarationsAccepted: declarations.every(Boolean),
        intermediaryDisclaimerAccepted,
        sections,
        timestamp: now.toISOString()
      };

      // 2. Client-Side AES-256 Encryption & HMAC Signature
      const encResult = encryptFormDataAndSign(sensitivePayload);
      const { encryptedPayload, signature, websiteBUrl } = encResult;

      // 3. Save ONLY 4 lightweight metadata fields to Supabase
      const metadata = {
        firstPartyName: firstPartyName || 'Applicant',
        formName: selectedDocTitle,
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
        docTitle: selectedDocTitle,
        createdAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        date: todayISO,
        deliveryHours: 24,
        deliveryFee: pricing.courierFee,
        baseFee: pricing.totalPayable - pricing.courierFee,
        totalFee: pricing.totalPayable,
        paymentStatus: 'Unpaid',
        status: 'Processing',
        pendingHours: 1,
        applicantName: firstPartyName,
        applicantPhone: firstPartyMobile,
        state: selectedState,
        stampDenomination: `₹${pricing.stamp}`,
        isPhysicalCourier: deliveryType === 'physical',
        shippingAddress: deliveryType === 'physical' ? shippingAddress : undefined,
        pincode: deliveryType === 'physical' ? shippingPincode : undefined,
        shippingPhone: deliveryType === 'physical' ? shippingPhone : undefined,
        shippingStatus: deliveryType === 'physical' ? 'Pending Dispatch' : 'Not Ordered'
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

  // Human-readable step display
  const getStepNumberDisplay = () => {
    if (isUnilateral) {
      if (currentPage === 1) return 'Page 1 of 4';
      if (currentPage === 2) return 'Page 2 of 4';
      if (currentPage === 4) return 'Page 3 of 4';
      return 'Page 4 of 4';
    }
    return `Page ${currentPage} of 5`;
  };

  const getStepTitle = () => {
    switch (currentPage) {
      case 1:
        return 'Document & State Selection';
      case 2:
        return `First Party Details (${docConfig.firstPartyRole})`;
      case 3:
        return `Second Party Details (${docConfig.secondPartyRole})`;
      case 4:
        return docConfig.coreSectionTitle;
      case 5:
        return 'Witness & Delivery Preferences';
      default:
        return 'Document Wizard';
    }
  };

  // If order was successfully submitted, show final confirmation view
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
              Your sensitive data has been encrypted directly in your browser using AES-256 with an HMAC digital signature. Only lightweight metadata was stored in Supabase.
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

          {/* Details Card */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 text-left text-xs sm:text-sm space-y-3">
            <div className="flex justify-between border-b border-slate-200/80 pb-2">
              <span className="text-slate-500">Document Type:</span>
              <span className="font-bold text-black">{submittedOrder.docTitle}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200/80 pb-2">
              <span className="text-slate-500">First Party / Applicant:</span>
              <span className="font-bold text-slate-900">{submittedOrder.applicantName}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200/80 pb-2">
              <span className="text-slate-500">State Jurisdiction:</span>
              <span className="font-bold text-slate-900">{submittedOrder.state}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200/80 pb-2">
              <span className="text-slate-500">Stamp Paper Denomination:</span>
              <span className="font-bold text-[#15803d]">{submittedOrder.stampDenomination}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200/80 pb-2">
              <span className="text-slate-500">Delivery Preference:</span>
              <span className="font-bold text-slate-900">
                {submittedOrder.isPhysicalCourier
                  ? 'Physical Courier (Speed Post) + Digital Copy'
                  : 'Digital Copy (WhatsApp & Email)'}
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
      {/* Top Navigation & Step Indicator */}
      <div className="mb-6">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-blue-600 transition-colors py-1.5 px-3 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Cancel &amp; Return</span>
          </button>

          <VoiceGuidanceButton serviceTitle={selectedDocTitle} />
        </div>

        {/* Progress Bar */}
        {activeTab === 'form' && (
          <div className="w-full bg-slate-200 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-blue-600 h-full transition-all duration-300"
              style={{
                width: `${(currentPage / 5) * 100}%`
              }}
            />
          </div>
        )}

        {/* Title Header */}
        <div className="mt-4">
          <h1 className="text-2xl sm:text-3xl font-black text-black">
            {selectedDocTitle}
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
          initialItemTitle={selectedDocTitle}
          categoryLabel={initialDoc.category}
          onBack={onBack}
          onSwitchToForm={() => setActiveTab('form')}
        />
      ) : (
      /* Main Wizard Form Container */
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-5 sm:p-7">
        {/* ================= PAGE 1 ================= */}
        {currentPage === 1 && (
          <div className="space-y-6 animate-fadeIn">

            {/* Document Type Dropdown (Auto-selected, selectable) */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Type of Document <span className="text-red-500 font-bold">*</span>
              </label>
              <WhiteSelect
                value={selectedDocTitle}
                onChange={(val) => {
                  setSelectedDocTitle(val);
                  playServiceVoice(val);
                }}
                options={INITIAL_FRONT_DOCUMENTS.map((doc) => doc.title)}
                aria-label="Type of Document"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Auto-selected from your previous click. You can switch to any agreement or affidavit.
              </span>
            </div>

            {/* State Selection Dropdown: Exactly 3 categorized tiers */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                State / Union Territory Selection <span className="text-red-500 font-bold">*</span>
              </label>
              <WhiteSelect
                value={selectedState}
                onChange={setSelectedState}
                aria-label="State / Union Territory Selection"
                options={[
                  ...STATE_CATEGORIES.filter((s) => s.category === 'online_download').map((s) => ({
                    value: s.name,
                    label: s.label,
                    group: '1. Online Purchase & Download Available (Plain Text)'
                  })),
                  ...STATE_CATEGORIES.filter((s) => s.category === 'online_nodownload').map((s) => ({
                    value: s.name,
                    label: s.label,
                    group: '2. Online Purchase Available, Download Not Available (🔵 Blue Dot)'
                  })),
                  ...STATE_CATEGORIES.filter((s) => s.category === 'offline_only').map((s) => ({
                    value: s.name,
                    label: s.label,
                    group: '3. Neither Online Purchase nor Download Available (⭐ Star)'
                  }))
                ]}
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Covers all 36 States &amp; UTs with state-specific automated e-stamp procurement.
              </span>
            </div>

            {/* Stamp Paper Value */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-700 block">
                    Stamp Paper Value (Official Minimum)
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xl font-black text-blue-600">
                    ₹{activeStampValue}
                  </span>
                </div>
              </div>

              {/* Optional Custom Stamp Paper Override */}
              <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <span className="text-slate-500">Need a higher denomination?</span>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin flex-nowrap">
                  {[20, 50, 100, 200, 300, 500, 1000].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setOverrideStampValue(val)}
                      className={`shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                        activeStampValue === val
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-slate-700 border-slate-300 hover:border-blue-400'
                      }`}
                    >
                      ₹{val}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Stamp Duty Paid By */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Stamp Duty Paid By
              </label>
              <WhiteSelect
                value={paidBy}
                onChange={(val) => setPaidBy(val as any)}
                aria-label="Stamp Duty Paid By"
                options={
                  isUnilateral
                    ? [{ value: 'First Party', label: `First Party (${docConfig.firstPartyRole})` }]
                    : [
                        { value: 'First Party', label: `First Party (${docConfig.firstPartyRole})` },
                        { value: 'Second Party', label: `Second Party (${docConfig.secondPartyRole})` },
                        { value: '50-50%', label: '50-50% Shared Equally' }
                      ]
                }
              />
            </div>
          </div>
        )}

        {/* ================= PAGE 2: FIRST PARTY ================= */}
        {currentPage === 2 && (
          <div className="space-y-4 animate-fadeIn">
            {/* Page 2 Distinct Header - Soft eye-friendly styling */}
            <div className="-mt-1 bg-slate-50 text-slate-900 rounded-2xl p-3.5 sm:p-4 shadow-2xs border border-slate-200 mb-2">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-black text-base border border-blue-200">
                  1
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black tracking-wide uppercase text-slate-900">
                    1st Party Details Only
                  </h3>
                  <p className="text-xs text-slate-600 font-medium">
                    {docConfig.firstPartyRole}
                  </p>
                </div>
              </div>
            </div>

            {/* Entity Type: Label on Top, options wide & spacious below */}
            <div className="pb-3 border-b border-slate-200">
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Entity Type <span className="text-red-500">*</span>
                </label>
                <span className="text-[11px] font-semibold text-slate-500 uppercase">
                  {docConfig.firstPartyRole}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setFirstPartyEntityType('Individual')}
                  className={`py-2.5 px-4 rounded-xl font-bold transition-all text-xs sm:text-sm cursor-pointer flex items-center justify-center gap-2 ${
                    firstPartyEntityType === 'Individual'
                      ? 'bg-[#15803d] text-white shadow-sm ring-2 ring-[#15803d]/30'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'
                  }`}
                >
                  <User className="w-4 h-4" />
                  <span>Individual</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFirstPartyEntityType('Company')}
                  className={`py-2.5 px-4 rounded-xl font-bold transition-all text-xs sm:text-sm cursor-pointer flex items-center justify-center gap-2 ${
                    firstPartyEntityType === 'Company'
                      ? 'bg-[#15803d] text-white shadow-sm ring-2 ring-[#15803d]/30'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  <span>Company / Firm</span>
                </button>
              </div>
            </div>

            {firstPartyEntityType === 'Company' ? (
              <CompanyEntityFields
                partyLabel="First Party"
                companyDetails={firstPartyCompanyDetails}
                onChangeCompanyDetails={setFirstPartyCompanyDetails}
                entityName={firstPartyName}
                onEntityNameChange={setFirstPartyName}
                signatoryName={firstPartySignatory}
                onSignatoryNameChange={setFirstPartySignatory}
                designation={firstPartyDesignation}
                onDesignationChange={setFirstPartyDesignation}
                customDesignation={firstPartyCustomDesignation}
                onCustomDesignationChange={setFirstPartyCustomDesignation}
                incorporationDate={firstPartyAgeOrIncDate}
                onIncorporationDateChange={setFirstPartyAgeOrIncDate}
                registeredAddress={firstPartyAddress}
                onRegisteredAddressChange={setFirstPartyAddress}
                email={firstPartyEmail}
                onEmailChange={setFirstPartyEmail}
                mobile={firstPartyMobile}
                onMobileChange={setFirstPartyMobile}
                companyPan={firstPartyPan}
                onCompanyPanChange={setFirstPartyPan}
                entityAuthConfirmed={firstPartyEntityAuthConfirmed}
                onEntityAuthConfirmedChange={(val) => {
                  setFirstPartyEntityAuthConfirmed(val);
                  if (val) setShowFirstPartyEntityAuthError(false);
                }}
                showEntityAuthError={showFirstPartyEntityAuthError}
              />
            ) : (
              <>
                {/* Full Legal Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Full Legal Name <span className="text-red-500 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={firstPartyName}
                    onChange={(e) => setFirstPartyName(e.target.value)}
                    placeholder={getPlaceholder('e.g. Ramesh Kumar Sharma')}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                {/* Father's / Husband's Name & Age / DOB Picker */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Father's / Husband's Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={firstPartyFatherName}
                      onChange={(e) => setFirstPartyFatherName(e.target.value)}
                      placeholder={getPlaceholder('e.g. Late Shri Prem Nath Sharma')}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <DateOfBirthPicker
                      label="Age / Date of Birth"
                      value={firstPartyAgeOrIncDate}
                      onChange={setFirstPartyAgeOrIncDate}
                      required={true}
                      placeholder="DD/MM/YYYY"
                      helperText={showExampleDetails ? 'Format: DD/MM/YYYY' : undefined}
                    />
                  </div>
                </div>

                {/* Permanent Address with Standardized 7-Field Group */}
                <AddressFieldGroup
                  label="Permanent Registered Address"
                  value={firstPartyAddress}
                  onChangeAddress={setFirstPartyAddress}
                  required
                />

                {/* Email, Mobile, PAN (No Aadhaar) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Email Address <span className="text-red-500 font-bold">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={firstPartyEmail}
                      onChange={(e) => setFirstPartyEmail(e.target.value)}
                      placeholder={getPlaceholder('ramesh@example.com')}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Mobile Number <span className="text-red-500 font-bold">*</span>
                    </label>
                    <input
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      required
                      value={firstPartyMobile}
                      onChange={(e) => setFirstPartyMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder={getPlaceholder('9876543210')}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      PAN Number{' '}
                      {effectiveFirstPartyPan === 'mandatory' ? (
                        <span className="text-red-500 font-bold">
                          *{docIdRule.panMandatoryMinAge !== undefined ? ` (Age ${docIdRule.panMandatoryMinAge}+)` : ''}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-normal">
                          {docIdRule.panMandatoryMinAge !== undefined ? `(Optional if Age < ${docIdRule.panMandatoryMinAge})` : '(Optional)'}
                        </span>
                      )}
                    </label>
                    <input
                      type="text"
                      required={effectiveFirstPartyPan === 'mandatory'}
                      maxLength={10}
                      value={firstPartyPan}
                      onChange={(e) => handlePanInput(e.target.value, setFirstPartyPan)}
                      onKeyDown={(e) => {
                        if (firstPartyPan.length >= 10 && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
                          e.preventDefault();
                        }
                      }}
                      placeholder={getPlaceholder('ABCDE1234F')}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-mono uppercase text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ================= PAGE 3: SECOND PARTY (Only for Bilateral) ================= */}
        {currentPage === 3 && !isUnilateral && (
          <div className="space-y-4 animate-fadeIn">
            {/* Page 3 Distinct Header - Soft eye-friendly styling */}
            <div className="-mt-1 bg-slate-50 text-slate-900 rounded-2xl p-3.5 sm:p-4 shadow-2xs border border-slate-200 mb-2">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center font-black text-base border border-indigo-200">
                  2
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black tracking-wide uppercase text-slate-900">
                    2nd Party Details Only
                  </h3>
                  <p className="text-xs text-slate-600 font-medium">
                    {docConfig.secondPartyRole}
                  </p>
                </div>
              </div>
            </div>

            {/* Entity Type: Label on Top, options wide & spacious below */}
            <div className="pb-3 border-b border-slate-200">
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Entity Type <span className="text-red-500">*</span>
                </label>
                <span className="text-[11px] font-semibold text-slate-500 uppercase">
                  {docConfig.secondPartyRole}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setSecondPartyEntityType('Individual')}
                  className={`py-2.5 px-4 rounded-xl font-bold transition-all text-xs sm:text-sm cursor-pointer flex items-center justify-center gap-2 ${
                    secondPartyEntityType === 'Individual'
                      ? 'bg-[#15803d] text-white shadow-sm ring-2 ring-[#15803d]/30'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'
                  }`}
                >
                  <User className="w-4 h-4" />
                  <span>Individual</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSecondPartyEntityType('Company')}
                  className={`py-2.5 px-4 rounded-xl font-bold transition-all text-xs sm:text-sm cursor-pointer flex items-center justify-center gap-2 ${
                    secondPartyEntityType === 'Company'
                      ? 'bg-[#15803d] text-white shadow-sm ring-2 ring-[#15803d]/30'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  <span>Company / Firm</span>
                </button>
              </div>
            </div>

            {secondPartyEntityType === 'Company' ? (
              <CompanyEntityFields
                partyLabel="Second Party"
                companyDetails={secondPartyCompanyDetails}
                onChangeCompanyDetails={setSecondPartyCompanyDetails}
                entityName={secondPartyName}
                onEntityNameChange={setSecondPartyName}
                signatoryName={secondPartySignatory}
                onSignatoryNameChange={setSecondPartySignatory}
                designation={secondPartyDesignation}
                onDesignationChange={setSecondPartyDesignation}
                customDesignation={secondPartyCustomDesignation}
                onCustomDesignationChange={setSecondPartyCustomDesignation}
                incorporationDate={secondPartyAgeOrIncDate}
                onIncorporationDateChange={setSecondPartyAgeOrIncDate}
                registeredAddress={secondPartyAddress}
                onRegisteredAddressChange={setSecondPartyAddress}
                email={secondPartyEmail}
                onEmailChange={setSecondPartyEmail}
                mobile={secondPartyMobile}
                onMobileChange={setSecondPartyMobile}
                companyPan={secondPartyPan}
                onCompanyPanChange={setSecondPartyPan}
                entityAuthConfirmed={secondPartyEntityAuthConfirmed}
                onEntityAuthConfirmedChange={(val) => {
                  setSecondPartyEntityAuthConfirmed(val);
                  if (val) setShowSecondPartyEntityAuthError(false);
                }}
                showEntityAuthError={showSecondPartyEntityAuthError}
              />
            ) : (
              <>
                {/* Full Legal Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Full Legal Name <span className="text-red-500 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={secondPartyName}
                    onChange={(e) => setSecondPartyName(e.target.value)}
                    placeholder={getPlaceholder('e.g. Priya Sharma')}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                {/* Father's / Husband's Name & Age / DOB Picker */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Father's / Husband's Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={secondPartyFatherName}
                      onChange={(e) => setSecondPartyFatherName(e.target.value)}
                      placeholder={getPlaceholder('e.g. Shri Rajesh Sharma')}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <DateOfBirthPicker
                      label="Age / Date of Birth"
                      value={secondPartyAgeOrIncDate}
                      onChange={setSecondPartyAgeOrIncDate}
                      required={true}
                      placeholder="DD/MM/YYYY"
                      helperText={showExampleDetails ? 'Format: DD/MM/YYYY' : undefined}
                    />
                  </div>
                </div>

                {/* Permanent Address with Standardized 7-Field Group */}
                <AddressFieldGroup
                  label="Permanent Registered Address"
                  value={secondPartyAddress}
                  onChangeAddress={setSecondPartyAddress}
                  required
                />

                {/* Email, Mobile, PAN (No Aadhaar) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Email Address <span className="text-red-500 font-bold">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={secondPartyEmail}
                      onChange={(e) => setSecondPartyEmail(e.target.value)}
                      placeholder={getPlaceholder('priya@example.com')}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Mobile Number <span className="text-red-500 font-bold">*</span>
                    </label>
                    <input
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      required
                      value={secondPartyMobile}
                      onChange={(e) => setSecondPartyMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder={getPlaceholder('9811122334')}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      PAN Number {effectiveSecondPartyPan === 'mandatory' ? <span className="text-red-500 font-bold">*</span> : effectiveSecondPartyPan === 'optional' ? <span className="text-slate-400 font-normal">(Optional)</span> : <span className="text-slate-400 font-normal">(N/A)</span>}
                    </label>
                    <input
                      type="text"
                      required={effectiveSecondPartyPan === 'mandatory'}
                      maxLength={10}
                      value={secondPartyPan}
                      onChange={(e) => handlePanInput(e.target.value, setSecondPartyPan)}
                      onKeyDown={(e) => {
                        if (secondPartyPan.length >= 10 && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
                          e.preventDefault();
                        }
                      }}
                      placeholder={getPlaceholder('FGHIJ5678K')}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-mono uppercase text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ================= PAGE 4: CORE DOCUMENT SPECIFICS ================= */}
        {currentPage === 4 && (
          <div className="space-y-5 animate-fadeIn">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Document Specific Parameters
              </span>
              <p className="text-xs text-slate-600 mt-0.5">
                Configure primary commercials, timelines, and specialized covenants for this deed.
              </p>
            </div>

            {isContentRightsForm ? (
              <div className="space-y-6">
                <ContentRightsPage4
                  value={contentRightsDetails}
                  onChange={setContentRightsDetails}
                />
                <div className={TOPIC_DIVIDER_CLASS}>
                  <SignatoryAuthoritySection
                    topicNumber={16}
                    checked={signatoryAuthorized}
                    onChange={(checked) => {
                      setSignatoryAuthorized(checked);
                      if (checked) setShowSignatoryError(false);
                    }}
                    showError={showSignatoryError}
                  />
                </div>
              </div>
            ) : isCopyrightTransferForm ? (
              <div className="space-y-6">
                <CopyrightTransferPage4
                  value={copyrightTransferDetails}
                  onChange={setCopyrightTransferDetails}
                />
                <div className={TOPIC_DIVIDER_CLASS}>
                  <SignatoryAuthoritySection
                    topicNumber={18}
                    checked={signatoryAuthorized}
                    onChange={(checked) => {
                      setSignatoryAuthorized(checked);
                      if (checked) setShowSignatoryError(false);
                    }}
                    showError={showSignatoryError}
                  />
                </div>
              </div>
            ) : isCreatorSponsorshipForm ? (
              <div className="space-y-6">
                <CreatorSponsorshipPage4
                  value={creatorDetails}
                  onChange={setCreatorDetails}
                />
                <div className={TOPIC_DIVIDER_CLASS}>
                  <AgreementValiditySection
                    topicNumber={16}
                    value={agreementValidity}
                    onChange={setAgreementValidity}
                  />
                </div>
                <div className={TOPIC_DIVIDER_CLASS}>
                  <SignatoryAuthoritySection
                    topicNumber={17}
                    checked={signatoryAuthorized}
                    onChange={(checked) => {
                      setSignatoryAuthorized(checked);
                      if (checked) setShowSignatoryError(false);
                    }}
                    showError={showSignatoryError}
                  />
                </div>
              </div>
            ) : isFreelancerForm ? (
              <div className="space-y-6">
                <FreelancerServicePage4
                  value={freelancerDetails}
                  onChange={setFreelancerDetails}
                />
                <div className={TOPIC_DIVIDER_CLASS}>
                  <SignatoryAuthoritySection
                    topicNumber={12}
                    checked={signatoryAuthorized}
                    onChange={(checked) => {
                      setSignatoryAuthorized(checked);
                      if (checked) setShowSignatoryError(false);
                    }}
                    showError={showSignatoryError}
                  />
                </div>
                <FreelancerOwnRulesSection
                  topicNumber={13}
                  value={freelancerDetails}
                  onChange={setFreelancerDetails}
                />
              </div>
            ) : isNdaForm ? (
              <div className="space-y-6">
                <NdaPage4
                  value={ndaDetails}
                  onChange={setNdaDetails}
                />
                <div className={TOPIC_DIVIDER_CLASS}>
                  <SignatoryAuthoritySection
                    topicNumber={13}
                    checked={signatoryAuthorized}
                    onChange={(checked) => {
                      setSignatoryAuthorized(checked);
                      if (checked) setShowSignatoryError(false);
                    }}
                    showError={showSignatoryError}
                  />
                </div>
                <NdaOwnRulesSection
                  topicNumber={14}
                  value={ndaDetails}
                  onChange={setNdaDetails}
                />
              </div>
            ) : isVideoAudioForm ? (
              <div className="space-y-6">
                <VideoAudioReleasePage4
                  value={videoAudioDetails}
                  onChange={setVideoAudioDetails}
                />
                <div className={TOPIC_DIVIDER_CLASS}>
                  <SignatoryAuthoritySection
                    topicNumber={10}
                    checked={signatoryAuthorized}
                    onChange={(checked) => {
                      setSignatoryAuthorized(checked);
                      if (checked) setShowSignatoryError(false);
                    }}
                    showError={showSignatoryError}
                  />
                </div>
                <VideoAudioOwnRulesSection
                  topicNumber={11}
                  value={videoAudioDetails}
                  onChange={setVideoAudioDetails}
                />
              </div>
            ) : (
              <div className="space-y-6">
                {/* 1. Deliverables & Scope of Work */}
                <div className="space-y-2">
                  <TopicHeader
                    number={1}
                    title="Deliverables & Scope of Work"
                    question="What are the exact commitments, deliverables, or declaration facts?"
                    required
                  />
                  <textarea
                    rows={2}
                    value={scopeOfWork}
                    onChange={(e) => setScopeOfWork(e.target.value)}
                    placeholder={getPlaceholder('Detail the exact commitments, deliverables, or declaration facts...')}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
                  />
                </div>

                {/* 2 & 3. Commercial Considerations & Duration */}
                <div className={`${TOPIC_DIVIDER_CLASS} grid grid-cols-1 sm:grid-cols-2 gap-4`}>
                  <div className="space-y-2">
                    <TopicHeader
                      number={2}
                      title="Financial Consideration / Fee (₹)"
                      question="What is the agreed fee or financial consideration?"
                      required
                    />
                    <input
                      type="text"
                      value={considerationAmount}
                      onChange={(e) => setConsiderationAmount(e.target.value)}
                      placeholder={getPlaceholder('e.g. 50,000 or Nil (for family deeds)')}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div className="space-y-2">
                    <TopicHeader
                      number={3}
                      title={isRentOrLeaseDoc ? 'Validity / Duration (Max 11 Months)' : 'Validity / Duration'}
                      question="What is the term or validity duration?"
                      required
                    />
                    {isRentOrLeaseDoc ? (
                      <div>
                        <WhiteSelect
                          variant="compact"
                          value={durationMonths}
                          placeholder="Select duration"
                          onChange={setDurationMonths}
                          aria-label="Validity / Duration"
                          options={[
                            { value: '11 Months', label: '11 Months (Registration Exempt)' },
                            '10 Months',
                            '9 Months',
                            '8 Months',
                            '7 Months',
                            '6 Months',
                            '5 Months',
                            '4 Months',
                            '3 Months',
                            '2 Months',
                            '1 Month'
                          ]}
                        />
                        <span className="text-[10px] text-blue-700 mt-1 block">
                          Legal Rule: Under the Registration Act 1908, 11 months is the standard limit for unregistered lease agreements.
                        </span>
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={durationMonths}
                        onChange={(e) => setDurationMonths(e.target.value)}
                        placeholder={getPlaceholder('e.g. 11 Months / 1 Year / Perpetual')}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    )}
                  </div>
                </div>

                {/* 4 & 5. Territory & Notice Period */}
                <div className={`${TOPIC_DIVIDER_CLASS} grid grid-cols-1 sm:grid-cols-2 gap-4`}>
                  <div className="space-y-2">
                    <TopicHeader
                      number={4}
                      title="Territory / Platforms"
                      question="Where will this agreement or deed apply?"
                      required
                    />
                    <input
                      type="text"
                      value={exclusivityTerritory}
                      onChange={(e) => setExclusivityTerritory(e.target.value)}
                      placeholder={getPlaceholder('e.g. Pan India / Instagram & YouTube')}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div className="space-y-2">
                    <TopicHeader
                      number={5}
                      title="Termination / Notice Period"
                      question="How much notice is required to terminate early?"
                      required
                    />
                    <input
                      type="text"
                      value={noticePeriod}
                      onChange={(e) => setNoticePeriod(e.target.value)}
                      placeholder={getPlaceholder('e.g. 15 Days written notice')}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>

                {!isRentOrLeaseDoc && (
                  <div className={TOPIC_DIVIDER_CLASS}>
                    <AgreementValiditySection
                      topicNumber={6}
                      value={agreementValidity}
                      onChange={setAgreementValidity}
                      isAffidavit={isAffidavitDoc}
                    />
                  </div>
                )}

                <div className={TOPIC_DIVIDER_CLASS}>
                  <SignatoryAuthoritySection
                    topicNumber={isRentOrLeaseDoc ? 6 : 7}
                    checked={signatoryAuthorized}
                    onChange={(checked) => {
                      setSignatoryAuthorized(checked);
                      if (checked) setShowSignatoryError(false);
                    }}
                    showError={showSignatoryError}
                  />
                </div>
              </div>
            )}

            {/* Custom Terms / Policies: Key-Value Pair format (Hidden for Freelancer, NDA, and Video/Audio Release where Your Own Rules sits at bottom) */}
            {!isFreelancerForm && !isNdaForm && !isVideoAudioForm && (
            <div className="-mx-5 px-5 sm:-mx-7 sm:px-7 pt-4 border-t border-slate-200/80">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    Custom Terms &amp; Policies (Key-Value Pair Format)
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Box 1: Title (Short) · Box 2: Description (Paragraph)
                  </span>
                </div>

                <button
                  type="button"
                  onClick={addCustomTerm}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white font-bold text-xs transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Custom Term</span>
                </button>
              </div>

              <div className="space-y-3">
                {customTerms.map((term, index) => (
                  <div
                    key={term.id}
                    className="p-3.5 bg-slate-50/80 border border-slate-200 rounded-xl relative space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-blue-700">
                        Custom Clause #{index + 1}
                      </span>
                      {customTerms.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeCustomTerm(term.id)}
                          className="text-slate-400 hover:text-rose-600 p-1"
                          title="Remove clause"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Box 1: Title - Short */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                        Title (Short)
                      </label>
                      <input
                        type="text"
                        value={term.title}
                        onChange={(e) => updateCustomTerm(term.id, 'title', e.target.value)}
                        placeholder={getPlaceholder('e.g. No-Deletion Timeline / Exclusivity Period')}
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                      />
                    </div>

                    {/* Box 2: Description - Paragraph */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                        Description (Paragraph)
                      </label>
                      <textarea
                        rows={2}
                        value={term.description}
                        onChange={(e) => updateCustomTerm(term.id, 'description', e.target.value)}
                        placeholder={getPlaceholder('Describe the exact legal condition, liability limit, or rule...')}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600 resize-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            )}
          </div>
        )}

        {/* ================= PAGE 5: WITNESS & DELIVERY PREFERENCES + PRICING ================= */}
        {currentPage === 5 && (
          <form onSubmit={handleSubmit} className="space-y-6 animate-fadeIn">
            {/* Witness 1 & Witness 2 (Hidden for Affidavits & Proprietorship Declaration Deed) */}
            {requireWitnesses && (
              <div className="space-y-4">
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
            )}

            {/* Delivery Preferences: Digital vs Physical Courier */}
            <div className="pt-4 border-t border-slate-200 space-y-3">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                Delivery Preference Selection
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Digital Delivery */}
                <div
                  onClick={() => setDeliveryType('digital')}
                  role="button"
                  tabIndex={0}
                  className={`p-4 rounded-xl border cursor-pointer transition-colors ${
                    deliveryType === 'digital'
                      ? 'bg-blue-50/75 border-slate-200'
                      : 'bg-white border-slate-200 hover:bg-slate-50/70'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <CircleIndicator checked={deliveryType === 'digital'} />
                    <Download className={`w-5 h-5 ${deliveryType === 'digital' ? 'text-blue-600' : 'text-slate-400'}`} />
                    <div>
                      <h4 className="text-sm font-bold text-black">
                        Digital Delivery Only
                      </h4>
                      <span className="text-[11px] text-slate-500 block">
                        Instant PDF via WhatsApp &amp; Email
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 text-xs font-semibold text-emerald-600">
                    Ready in 1-2 hours · Zero shipping charge
                  </div>
                </div>

                {/* Physical Stamp Paper Courier */}
                <div
                  onClick={() => setDeliveryType('physical')}
                  role="button"
                  tabIndex={0}
                  className={`p-4 rounded-xl border cursor-pointer transition-colors ${
                    deliveryType === 'physical'
                      ? 'bg-blue-50/75 border-slate-200'
                      : 'bg-white border-slate-200 hover:bg-slate-50/70'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <CircleIndicator checked={deliveryType === 'physical'} />
                    <Truck className={`w-5 h-5 ${deliveryType === 'physical' ? 'text-blue-600' : 'text-slate-400'}`} />
                    <div>
                      <h4 className="text-sm font-bold text-black">
                        Physical Courier Delivery
                      </h4>
                      <span className="text-[11px] text-slate-500 block">
                        Original Stamp Paper via Speed Post
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 text-xs font-semibold text-blue-600">
                    +₹50 Flat Courier Charge
                  </div>
                </div>
              </div>

              {/* Physical Delivery Alert Notice and Shipping Form */}
              {deliveryType === 'physical' && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3 animate-fadeIn">
                  <div className="flex items-start gap-2.5 text-amber-900 text-xs sm:text-sm">
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong>Important Dispatch Timeline Notice:</strong>
                      <p className="mt-0.5 text-amber-800">
                        Delivery will take <strong>2 business days</strong> for physical dispatch via Speed Post. Your digital copy will still be provided immediately within <strong>1-2 hours</strong>.
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-amber-200/70 space-y-3">
                    <span className="text-xs font-bold text-amber-950 uppercase tracking-wider block">
                      Doorstep Shipping Details
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-semibold text-amber-900 mb-0.5">
                          Recipient Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required={deliveryType === 'physical'}
                          value={shippingRecipientName}
                          onChange={(e) => setShippingRecipientName(e.target.value)}
                          placeholder={getPlaceholder('e.g. Ramesh Kumar')}
                          className="w-full bg-white border border-amber-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-amber-900 mb-0.5">
                          Delivery Phone Number <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="tel"
                          inputMode="numeric"
                          maxLength={10}
                          required={deliveryType === 'physical'}
                          value={shippingPhone}
                          onChange={(e) => setShippingPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                          placeholder={getPlaceholder('9876543210')}
                          className="w-full bg-white border border-amber-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                        />
                      </div>
                    </div>

                    <AddressFieldGroup
                      label="Delivery Shipping Address"
                      variant="standard"
                      defaultState={selectedState || 'Uttar Pradesh'}
                      value={shippingAddress}
                      onChangeAddress={(fullAddr, details) => {
                        setShippingAddress(fullAddr);
                        if (details?.pincode !== undefined) {
                          setShippingPincode(details.pincode);
                        }
                      }}
                      required={deliveryType === 'physical'}
                      className="bg-white"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Submit Verification Mode Selection */}
            <div className="space-y-3 pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                    Verification &amp; Review Mode <span className="text-red-500">*</span>
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Choose how your legal draft should be reviewed before e-stamp procurement
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
                  className={`p-4 rounded-xl border cursor-pointer transition-colors ${
                    verificationMode === 'self'
                      ? 'bg-blue-50/75 border-slate-200'
                      : 'bg-white border-slate-200 hover:bg-slate-50/70'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CircleIndicator checked={verificationMode === 'self'} />
                      <ShieldCheck className={`w-5 h-5 ${verificationMode === 'self' ? 'text-blue-600' : 'text-slate-400'}`} />
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                        Self-Verified (स्व-सत्यापित)
                      </h4>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      ₹0 Extra (Free)
                    </span>
                  </div>
                  <p className="mt-2 text-[11px] text-slate-600 leading-relaxed">
                    आप स्वयं दर्ज की गई सभी जानकारियों की पुष्टि करते हैं। स्वचालित प्रणाली द्वारा तत्काल प्रोसेसिंग।
                  </p>
                </div>

                {/* Mode B: Expert Legal Re-check (+₹10) */}
                <div
                  onClick={() => setVerificationMode('expert')}
                  role="button"
                  tabIndex={0}
                  className={`p-4 rounded-xl border cursor-pointer transition-colors ${
                    verificationMode === 'expert'
                      ? 'bg-blue-50/75 border-slate-200'
                      : 'bg-white border-slate-200 hover:bg-slate-50/70'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CircleIndicator checked={verificationMode === 'expert'} />
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
                    वरिष्ठ कानूनी विशेषज्ञ द्वारा नामों, पतों, कानूनी क्लॉज और स्टाम्प सटीकता की मैन्युअल पुनः-जांच।
                  </p>
                </div>
              </div>
            </div>

            {/* DYNAMIC PRICING CALCULATOR */}
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

              {/* Breakdown */}
              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Stamp Paper Value ({selectedState} Matrix):</span>
                  <span className="font-semibold text-slate-900">₹{pricing.stamp}</span>
                </div>
                <div className="flex justify-between">
                  <span>
                    Digital e-Sign ({isUnilateral ? '1 Party' : '2 Parties'} + GST):
                  </span>
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
                    कानूनी शपथ एवं घोषणाएँ (5 Declarations) <span className="text-red-500">*</span>
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
                  "1. मैंने दस्तावेज़ के सभी नियम व शर्तें ध्यानपूर्वक पढ़ ली हैं और मैं इनसे सहमत हूँ। (I have carefully read and agreed to all terms and conditions of this legal draft.)",
                  "2. प्रस्तुत की गई दोनों पक्षों और गवाहों की व्यक्तिगत पहचान (PAN व ईमेल) व पते की जानकारी पूर्णतः सत्य और प्रामाणिक है। (All personal identity and address details of parties and witnesses provided are true and verified.)",
                  "3. इस विलेख/करार का निष्पादन बिना किसी दबाव, कपट अथवा अनुचित प्रभाव के स्वतंत्र सहमति से किया जा रहा है। (This deed/agreement is being executed with free consent without any coercion, fraud, or undue influence.)",
                  "4. संबंधित राज्य सरकार की स्टाम्प ड्यूटी एवं डिजिटल ई-हस्ताक्षर (Digital e-Sign) नियमों के अनुपालन की पूरी ज़िम्मेदारी मेरी है। (I understand and accept full responsibility for compliance with state stamp duty and Digital e-Sign regulations.)",
                  "5. मैं पुष्टि करता हूँ कि दस्तावेज़ डिलीवरी के पश्चात देय राशि का भुगतान नियमानुसार करूँगा। (I confirm and agree to pay the post-delivery fee upon receipt of the verified legal document.)"
                ].map((declarationText, idx) => (
                  <label
                    key={idx}
                    className={optionCardClass(Boolean(declarations[idx]), 'p-2.5 text-xs', true)}
                  >
                    <input
                      type="checkbox"
                      required
                      checked={declarations[idx]}
                      onChange={(e) => {
                        const next = [...declarations];
                        next[idx] = e.target.checked;
                        setDeclarations(next);
                      }}
                      className="sr-only"
                    />
                    <CircleIndicator checked={Boolean(declarations[idx])} className="mt-0.5" />
                    <span className="leading-relaxed">{declarationText}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Platform Intermediary Disclaimer Checkbox */}
            <label
              className={optionCardClass(
                intermediaryDisclaimerAccepted,
                'p-4 text-xs',
                true
              )}
            >
              <input
                type="checkbox"
                required
                checked={intermediaryDisclaimerAccepted}
                onChange={(e) => setIntermediaryDisclaimerAccepted(e.target.checked)}
                className="sr-only"
              />
              <CircleIndicator checked={intermediaryDisclaimerAccepted} className="mt-0.5" />
              <span className="text-xs text-slate-700 leading-relaxed">
                I verify that all entries are correct. Cotex Compliance acts strictly as an automated processing intermediary under the IT Act, 2000.
              </span>
            </label>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={handlePrev}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs cursor-pointer transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <button
                type="submit"
                disabled={isSubmitting || !intermediaryDisclaimerAccepted}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs sm:text-sm shadow-md disabled:opacity-50 cursor-pointer transition-all"
              >
                {isSubmitting ? 'Creating Docket...' : 'Submit & Generate Legal Docket'}
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
              onClick={currentPage === 1 ? onBack : handlePrev}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{currentPage === 1 ? 'Cancel' : 'Previous'}</span>
            </button>

            <button
              type="button"
              onClick={handleNext}
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
