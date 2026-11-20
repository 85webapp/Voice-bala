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
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { AddressFieldGroup } from './AddressFieldGroup';
import { DateOfBirthPicker } from './DateOfBirthPicker';
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
  COMPANY_DESIGNATION_OPTIONS,
  ENTITY_AUTH_CONFIRM_LABEL,
  getCompanyFieldLabels,
  getCompanyRegFieldMeta,
  isAuthDateRequired,
  isGstinRequiredForSubType
} from './CompanyEntityFields';
import { LegalDocument, OrderItem } from '../types';
import { STATE_CATEGORIES, getSafeStampDuty } from '../data/stampDutyMatrix';
import { useExampleDetails } from '../hooks/useExampleDetails';
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
import { Lock, ExternalLink } from 'lucide-react';
import { showToast } from '../services/toastService';
import { ServerBSyncStatusCard } from './ServerBSyncStatusCard';
import { VoiceGuidanceButton } from './VoiceGuidanceButton';
import { FormRequestTabBar, HorizontalSwipeContainer, WizardModeTab } from './FormRequestTabBar';
import { QuickCallbackRequestPanel } from './QuickCallbackRequestPanel';
import { TopicHeader } from './TopicHeader';
import { SignatoryAuthoritySection } from './SignatoryAuthoritySection';
import {
  CircleIndicator,
  SUBQUESTION_DIVIDER_CLASS,
  TOPIC_DIVIDER_CLASS,
  optionCardClass
} from './OptionControl';

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
  const { showExampleDetails, getPlaceholder } = useExampleDetails();
  const showExample = showExampleDetails;
  const [activeTab, setActiveTab] = useState<WizardModeTab>('form');
  const [currentPage, setCurrentPage] = useState<StepId>('1');

  // --- PAGE 1: OBJECTIVE & STAMP JURISDICTION ---
  const [selectedState, setSelectedState] = useState<string>('Uttar Pradesh');

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

  // Stamp Paper Procurement Mode & Denomination
  const [stampProcurementMode, setStampProcurementMode] = useState<'estamp' | 'physical_upload'>('estamp');
  const [physicalStampFile, setPhysicalStampFile] = useState<UploadedDocumentPayload | null>(null);
  const physicalStampUploaded = Boolean(physicalStampFile);

  // Recommended minimum state stamp duty
  const recommendedStamp = useMemo(() => {
    return getSafeStampDuty(initialDoc.title, selectedState);
  }, [initialDoc.title, selectedState]);

  const [stampValue, setStampValue] = useState<number>(100);
  const [customStampValue, setCustomStampValue] = useState<string>('');
  const [stampCostBorneBy, setStampCostBorneBy] = useState<string>('First Party (Landlord / Lessor)');
  const [customSplitText, setCustomSplitText] = useState<string>('');

  const activeStampValue = useMemo(() => {
    return stampValue === -1 ? Number(customStampValue) || 0 : stampValue;
  }, [stampValue, customStampValue]);

  const isStampBelowThreshold = useMemo(() => {
    return activeStampValue < recommendedStamp;
  }, [activeStampValue, recommendedStamp]);

  const handlePhysicalStampSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const payload = await readFileAsUploadPayload(file, 'Pre-Purchased Physical Stamp Paper');
    if (payload) {
      setPhysicalStampFile(payload);
      showToast(`${payload.fileName} attached successfully.`, 'success', 3000);
    }
  };

  // --- PAGE 2: THE GRANTOR (LANDLORD'S STANDING) ---
  const [landlordOwnershipType, setLandlordOwnershipType] = useState<string>('Sole Individual');
  const [landlordName, setLandlordName] = useState('');
  const [landlordFatherName, setLandlordFatherName] = useState('');
  const [landlordAddress, setLandlordAddress] = useState('');
  const [landlordPan, setLandlordPan] = useState('');
  const [landlordMobile, setLandlordMobile] = useState('');
  const [landlordEmail, setLandlordEmail] = useState('');
  const [clearTitleDeclared, setClearTitleDeclared] = useState(true);

  // Corporate Landlord
  const [corpCin, setCorpCin] = useState('');
  const [corpGstin, setCorpGstin] = useState('');
  const [corpIncDate, setCorpIncDate] = useState('');
  const [corpRegAddress, setCorpRegAddress] = useState('');
  const [corpRepName, setCorpRepName] = useState('');
  const [corpRepDesignation, setCorpRepDesignation] = useState('Director');
  const [corpResolutionDate, setCorpResolutionDate] = useState('');
  const [landlordEntityAuthConfirmed, setLandlordEntityAuthConfirmed] = useState(false);
  const [showLandlordEntityAuthError, setShowLandlordEntityAuthError] = useState(false);

  // Joint Landlords
  const [coOwners, setCoOwners] = useState<CoOwner[]>([]);
  const addCoOwner = () => {
    setCoOwners((prev) => [
      ...prev,
      { id: `co-${Date.now()}`, name: '', pan: '' }
    ]);
  };
  const updateCoOwner = (id: string, field: keyof CoOwner, val: string) => {
    setCoOwners((prev) => prev.map((c) => (c.id === id ? { ...c, [field]: val } : c)));
  };
  const removeCoOwner = (id: string) => {
    setCoOwners((prev) => prev.filter((c) => c.id !== id));
  };

  // --- PAGE 3: THE GRANTEE (BUSINESS SCOPE & ENTITY) ---
  const [businessConstitution, setBusinessConstitution] = useState<string>('Sole Proprietorship Firm');
  const [proposedBusinessName, setProposedBusinessName] = useState('');
  const [granteePan, setGranteePan] = useState('');
  const [granteeCin, setGranteeCin] = useState('');
  const [granteeGstin, setGranteeGstin] = useState('');
  const [granteeIncDate, setGranteeIncDate] = useState('');
  const [granteeAuthDate, setGranteeAuthDate] = useState('');
  const [granteeEmail, setGranteeEmail] = useState('');
  const [natureOfOperations, setNatureOfOperations] = useState<string>(
    'IT / Software / Back Office / Consultancy'
  );
  const [customNatureOfOperations, setCustomNatureOfOperations] = useState<string>('');

  // Signatory & Grantee Communication Details
  const [granteeSignatoryName, setGranteeSignatoryName] = useState('');
  const [granteeSignatoryFatherName, setGranteeSignatoryFatherName] = useState('');
  const [granteeAddress, setGranteeAddress] = useState('');
  const [granteeDesignation, setGranteeDesignation] = useState<string>('Proprietor');
  const [granteeEntityAuthConfirmed, setGranteeEntityAuthConfirmed] = useState(false);
  const [showGranteeEntityAuthError, setShowGranteeEntityAuthError] = useState(false);
  const [authorizationDocFile, setAuthorizationDocFile] = useState<UploadedDocumentPayload | null>(null);
  const authorizationDocUploaded = Boolean(authorizationDocFile);

  const handleAuthFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const payload = await readFileAsUploadPayload(file, 'Authorization Letter / Board Resolution');
    if (payload) {
      setAuthorizationDocFile(payload);
      showToast(`${payload.fileName} attached successfully.`, 'success', 3000);
    }
  };

  // Handle Dynamic Constitution to Signatory Designation Mapping
  const handleConstitutionChange = (newConstitution: string) => {
    setBusinessConstitution(newConstitution);
    if (newConstitution === 'Sole Proprietorship Firm') {
      setGranteeDesignation('Proprietor');
    } else if (newConstitution === 'Partnership Firm') {
      setGranteeDesignation('Partner');
    } else if (newConstitution === 'Limited Liability Partnership (LLP)') {
      setGranteeDesignation('Designated Partner');
    } else if (newConstitution === 'Hindu Undivided Family (HUF)') {
      setGranteeDesignation('Karta');
    } else if (newConstitution === 'Trust / Society / AOP') {
      setGranteeDesignation('Authorized Trustee');
    } else if (
      newConstitution === 'Private Limited Company (Pvt Ltd)' ||
      newConstitution === 'Public Limited Company (Ltd)'
    ) {
      setGranteeDesignation('Director');
    } else {
      setGranteeDesignation('Authorized Signatory');
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

  // --- PAGE 3B: PREMISES LOCATION, DIMENSIONS & BOUNDARIES ---
  const [premisesAddress, setPremisesAddress] = useState('');
  const [showOptionalPremisesDetails, setShowOptionalPremisesDetails] = useState(false);
  const [wardNumber, setWardNumber] = useState('');
  const [propertyTaxAssessmentNo, setPropertyTaxAssessmentNo] = useState('');
  const [superBuiltupArea, setSuperBuiltupArea] = useState('');
  const [carpetArea, setCarpetArea] = useState('');

  // Structured Property Boundaries + Optional Toggle
  const [propertyBoundaries, setPropertyBoundaries] = useState<PropertyBoundariesState>(() =>
    createInitialPropertyBoundaries()
  );
  const [boundariesOptional, setBoundariesOptional] = useState(false);

  // --- PAGE 4: OPERATIONAL CONDITIONS & STATUTORY CLAUSES (Nothing Pre-Selected) ---
  const [clauseMultiAgency, setClauseMultiAgency] = useState(false);
  const [clausePhysicalVerification, setClausePhysicalVerification] = useState(false);
  const [clauseSignboard, setClauseSignboard] = useState(false);
  const [clauseBooks, setClauseBooks] = useState(false);
  const [clauseStructural, setClauseStructural] = useState(false);
  const [clauseFssai, setClauseFssai] = useState(false);
  const [clauseFireSafety, setClauseFireSafety] = useState(false);
  const [clauseHealthTrade, setClauseHealthTrade] = useState(false);

  const [nocDuration, setNocDuration] = useState<string>('');
  const [customNocDuration, setCustomNocDuration] = useState<string>('');
  const [sublettingPermission, setSublettingPermission] = useState<'Not Allowed' | 'Allowed' | ''>('');
  const [propertyTaxEscalation, setPropertyTaxEscalation] = useState('');
  const [meterLoadConsent, setMeterLoadConsent] = useState(false);
  const [landlordIndemnityAccepted, setLandlordIndemnityAccepted] = useState(false);
  const [signatoryAuthorized, setSignatoryAuthorized] = useState(false);
  const [showSignatoryError, setShowSignatoryError] = useState(false);

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
  const [witness1FatherName, setWitness1FatherName] = useState('');
  const [witness1Profession, setWitness1Profession] = useState('');
  const [witness1Email, setWitness1Email] = useState('');
  const [witness1Above18, setWitness1Above18] = useState(false);
  const [witness1Address, setWitness1Address] = useState('');
  const [witness1Mobile, setWitness1Mobile] = useState('');

  const [witness2Name, setWitness2Name] = useState('');
  const [witness2FatherName, setWitness2FatherName] = useState('');
  const [witness2Profession, setWitness2Profession] = useState('');
  const [witness2Email, setWitness2Email] = useState('');
  const [witness2Above18, setWitness2Above18] = useState(false);
  const [witness2Address, setWitness2Address] = useState('');
  const [witness2Mobile, setWitness2Mobile] = useState('');

  // Delivery Preference
  const [deliveryPreference, setDeliveryPreference] = useState<'digital' | 'physical' | 'hybrid'>('digital');
  const [shippingAddress, setShippingAddress] = useState('');
  const [shippingPincode, setShippingPincode] = useState('');
  const [shippingPhone, setShippingPhone] = useState('');

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
        showToast('Please select at least one Purpose of NOC.', 'warning');
        return;
      }
      if (stampProcurementMode === 'physical_upload' && !physicalStampUploaded) {
        showToast('Please upload your pre-purchased Physical Stamp Paper before proceeding.', 'warning');
        return;
      }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (currentPage === '2') {
      const isCorp = landlordOwnershipType !== 'Sole Individual' && landlordOwnershipType !== 'Joint Owners';
      if (!isCorp) {
        if (!landlordName.trim()) {
          showToast('Please fill mandatory Landlord Legal Name.', 'warning');
          return;
        }
        if (!landlordAddress.trim()) {
          showToast('Please fill complete Landlord Residential Address.', 'warning');
          return;
        }
      } else {
        const landlordLabels = getCompanyFieldLabels(landlordOwnershipType);
        const landlordRegMeta = getCompanyRegFieldMeta(landlordOwnershipType);
        const landlordGstinRequired = isGstinRequiredForSubType(landlordOwnershipType);
        const isLandlordSoleProp = landlordOwnershipType === 'Sole Proprietorship Firm';
        if (!landlordName.trim() || !corpRegAddress.trim() || !corpRepName.trim()) {
          showToast(
            isLandlordSoleProp
              ? 'Please fill Proprietor Name, Business / Firm Name, and Business Address.'
              : `Please fill ${landlordLabels.entityNameLabel}, ${landlordLabels.addressLabel}, and ${landlordLabels.signatoryLabel}.`,
            'warning'
          );
          return;
        }
        if (landlordRegMeta.required && !corpCin.trim()) {
          showToast(`Please enter ${landlordRegMeta.label} for Landlord entity.`, 'warning');
          return;
        }
        const cleanCorpGstin = corpGstin.trim().toUpperCase();
        if (landlordGstinRequired && cleanCorpGstin.length !== 15) {
          showToast('Please enter a valid 15-character Company / Firm GSTIN for Landlord.', 'warning');
          return;
        }
        if (!landlordGstinRequired && cleanCorpGstin.length > 0 && cleanCorpGstin.length !== 15) {
          showToast('If entering GSTIN for Landlord, please enter all 15 characters.', 'warning');
          return;
        }
        if (isAuthDateRequired(landlordOwnershipType) && !corpResolutionDate.trim()) {
          showToast('Please select Board Resolution / Authorization Letter Date for Landlord entity.', 'warning');
          return;
        }
      }
      if (landlordPan.trim().length !== 10) {
        showToast('Landlord / Corporate 10-character PAN Card is mandatory.', 'warning');
        return;
      }
      if (landlordMobile.replace(/\D/g, '').length !== 10) {
        showToast('Please enter a valid 10-digit Landlord Mobile Number.', 'warning');
        return;
      }
      if (!landlordEmail.trim() || !emailRegex.test(landlordEmail.trim())) {
        showToast('Please enter a valid mandatory Landlord Email Address.', 'warning');
        return;
      }
      if (isCorp && !landlordEntityAuthConfirmed) {
        setShowLandlordEntityAuthError(true);
        showToast(`Please tick "${ENTITY_AUTH_CONFIRM_LABEL}" before continuing.`, 'warning');
        return;
      }
      if (!clearTitleDeclared) {
        showToast('Please accept the Title & Clear Encumbrance Declaration.', 'warning');
        return;
      }
    }

    if (currentPage === '3') {
      const isGranteeCompany = businessConstitution !== 'Sole Proprietorship Firm';
      if (!proposedBusinessName.trim() || !granteeSignatoryName.trim()) {
        showToast('Please provide Business / Firm Name and Proprietor / Signatory Name.', 'warning');
        return;
      }
      if (isGranteeCompany) {
        const granteeRegMeta = getCompanyRegFieldMeta(businessConstitution);
        const granteeGstinRequired = isGstinRequiredForSubType(businessConstitution);
        if (granteeRegMeta.required && !granteeCin.trim()) {
          showToast(`Please enter ${granteeRegMeta.label} for Grantee entity.`, 'warning');
          return;
        }
        const cleanGranteeGstin = granteeGstin.trim().toUpperCase();
        if (granteeGstinRequired && cleanGranteeGstin.length !== 15) {
          showToast('Please enter a valid 15-character Company / Firm GSTIN for Grantee.', 'warning');
          return;
        }
        if (!granteeGstinRequired && cleanGranteeGstin.length > 0 && cleanGranteeGstin.length !== 15) {
          showToast('If entering GSTIN for Grantee, please enter all 15 characters.', 'warning');
          return;
        }
        if (isAuthDateRequired(businessConstitution) && !granteeAuthDate.trim()) {
          showToast('Please select Board Resolution / Authorization Letter Date for Grantee entity.', 'warning');
          return;
        }
      } else {
        const cleanGranteeGstin = granteeGstin.trim().toUpperCase();
        if (cleanGranteeGstin.length > 0 && cleanGranteeGstin.length !== 15) {
          showToast('If entering GSTIN, please enter all 15 characters.', 'warning');
          return;
        }
      }
      if (!granteeAddress.trim()) {
        showToast('Please provide complete Registered Office / Business Address.', 'warning');
        return;
      }
      if (granteePan.trim().length !== 10) {
        showToast('Second Party (Grantee) 10-character PAN Card is mandatory.', 'warning');
        return;
      }
      if (!granteeEmail.trim() || !emailRegex.test(granteeEmail.trim())) {
        showToast('Please enter a valid mandatory Grantee Email Address.', 'warning');
        return;
      }
      if (natureOfOperations === 'Other' && !customNatureOfOperations.trim()) {
        showToast('Please specify the custom Nature of Business Operations.', 'warning');
        return;
      }
      if (!granteeEntityAuthConfirmed) {
        setShowGranteeEntityAuthError(true);
        showToast(`Please tick "${ENTITY_AUTH_CONFIRM_LABEL}" before continuing.`, 'warning');
        return;
      }
    }

    if (currentPage === '3B') {
      if (!premisesAddress.trim()) {
        showToast('Please provide complete Premises Address.', 'warning');
        return;
      }
      if (!boundariesOptional && !areAllBoundariesFilled(propertyBoundaries)) {
        showToast('Please complete all four Property Boundaries or select "Change to Optional".', 'warning');
        return;
      }
    }

    if (currentPage === '4') {
      if (
        !clauseMultiAgency &&
        !clausePhysicalVerification &&
        !clauseSignboard &&
        !clauseBooks &&
        !clauseStructural
      ) {
        showToast('Please select at least one clearance under Topic 1 (Business Clearances & Statutory Permissions).', 'warning');
        return;
      }
      if (!nocDuration.trim()) {
        showToast('Please select NOC Validity / Duration.', 'warning');
        return;
      }
      if (nocDuration === 'Custom' && !customNocDuration.trim()) {
        showToast('Please specify your Custom NOC Duration.', 'warning');
        return;
      }
      if (!sublettingPermission) {
        showToast('Please select Sub-Letting & Co-Working Permission.', 'warning');
        return;
      }
      if (!propertyTaxEscalation) {
        showToast('Please select Property Tax Escalation Responsibility.', 'warning');
        return;
      }
      if (!landlordIndemnityAccepted) {
        showToast('Please confirm the Landlord Indemnity acceptance checkbox.', 'warning');
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

  const handleBack = () => {
    if (currentPage === '1') onBack();
    else if (currentPage === '2') setCurrentPage('1');
    else if (currentPage === '3') setCurrentPage('2');
    else if (currentPage === '3B') setCurrentPage('3');
    else if (currentPage === '4') setCurrentPage('3B');
    else if (currentPage === '5') setCurrentPage('4');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!witness1Name.trim() || !witness1FatherName.trim() || !witness1Address.trim()) {
      showToast('Witness 1 Full Legal Name, Father/Husband Name, and Residential Address are mandatory.', 'warning');
      return;
    }
    if (!witness1Email.trim() || !emailRegex.test(witness1Email.trim())) {
      showToast('Please enter a valid Email Address for Witness 1.', 'warning');
      return;
    }
    if (!witness1Above18) {
      showToast('Please confirm that Witness 1 is above 18+.', 'warning');
      return;
    }
    if (witness1Mobile.replace(/\D/g, '').length !== 10) {
      showToast('Please enter a valid 10-digit Mobile Number for Witness 1.', 'warning');
      return;
    }

    if (!witness2Name.trim() || !witness2FatherName.trim() || !witness2Address.trim()) {
      showToast('Witness 2 Full Legal Name, Father/Husband Name, and Residential Address are mandatory.', 'warning');
      return;
    }
    if (!witness2Email.trim() || !emailRegex.test(witness2Email.trim())) {
      showToast('Please enter a valid Email Address for Witness 2.', 'warning');
      return;
    }
    if (!witness2Above18) {
      showToast('Please confirm that Witness 2 is above 18+.', 'warning');
      return;
    }
    if (witness2Mobile.replace(/\D/g, '').length !== 10) {
      showToast('Please enter a valid 10-digit Mobile Number for Witness 2.', 'warning');
      return;
    }

    if (deliveryPreference !== 'digital') {
      if (!shippingAddress.trim() || shippingPincode.replace(/\D/g, '').length !== 6) {
        showToast('Please provide complete physical shipping address and 6-digit pincode.', 'warning');
        return;
      }
      if (shippingPhone.replace(/\D/g, '').length !== 10) {
        showToast('Please enter a valid 10-digit Contact Phone Number.', 'warning');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const now = new Date();
      const todayISO = now.toISOString().split('T')[0];
      const newOrderId = generateSequentialOrderId();

      const selectedPurposeLabels = [
        purposes.gst_reg ? 'GST Registration (Tax Allotment)' : null,
        purposes.biz_license ? 'Business License / Gumasta / Shops & Est' : null,
        purposes.subletting ? 'Sub-Letting / Sub-Leasing Permissions' : null,
        purposes.bank_account ? 'Bank Account Opening / Corporate Address Proof' : null,
        purposes.statutory_reg ? 'Central/State Statutory (FSSAI, MSME, Pollution, Fire)' : null
      ].filter(Boolean) as string[];

      const isCorpLandlord = landlordOwnershipType !== 'Sole Individual' && landlordOwnershipType !== 'Joint Owners';
      const uploadedDocuments: UploadedDocumentPayload[] = [
        physicalStampFile,
        authorizationDocFile
      ].filter((item): item is UploadedDocumentPayload => Boolean(item));

      const eastBound = formatSingleBoundary(propertyBoundaries.east);
      const westBound = formatSingleBoundary(propertyBoundaries.west);
      const northBound = formatSingleBoundary(propertyBoundaries.north);
      const southBound = formatSingleBoundary(propertyBoundaries.south);
      const effectiveNocDuration = nocDuration === 'Custom' ? customNocDuration || 'Custom Duration' : nocDuration;

      const submissionOverview = buildSubmissionOverview({
        orderId: newOrderId,
        requestType: 'Commercial NOC Request',
        mainCategory: 'Rent & Property',
        subCategory: initialDoc.title || 'Commercial No-Objection Certificate (NOC)',
        availableCategories: ['Rent & Property', 'Agreements', 'Affidavits'],
        availableSubCategories: ['Commercial No-Objection Certificate (NOC)', 'Landlord NOC for Business', 'Landlord NOC for GST'],
        documentTitle: 'Commercial No-Objection Certificate (NOC)',
        date: now
      });

      const stateOptions = STATE_CATEGORIES.map((s) => s.name);
      const propertyClassOptions = [
        'Commercial Building',
        'IT Park/SEZ',
        'Industrial Land/Shed',
        'Mixed-Use Urban Property',
        'Residential Property Used for Business'
      ];
      const stampBorneOptions = [
        'First Party (Landlord / Lessor)',
        'Second Party (Grantee / Tenant)',
        'Shared Equally (50-50 Split)',
        'Custom Split'
      ];
      const landlordOwnershipOptions = [
        'Sole Individual',
        'Joint Owners',
        'Partnership Firm',
        'Limited Liability Partnership (LLP)',
        'Private Limited Company (Pvt Ltd)',
        'Public Limited Company (Ltd)',
        'Hindu Undivided Family (HUF)',
        'Trust / Society / AOP',
        'Sole Proprietorship Firm'
      ];
      const constitutionOptions = [
        'Sole Proprietorship Firm',
        'Partnership Firm',
        'Limited Liability Partnership (LLP)',
        'Private Limited Company (Pvt Ltd)',
        'Public Limited Company (Ltd)',
        'Joint Owners / Co-Owners',
        'Hindu Undivided Family (HUF)',
        'Trust / Society / AOP'
      ];
      const natureOptions = [
        'IT / Software / Back Office / Consultancy',
        'Retail / Showroom / Gym / Footfall Business',
        'Logistics / Warehousing / Heavy Storage / Manufacturing',
        'Restaurant / Cloud Kitchen / Food & Beverage',
        'Other'
      ];
      const nocDurationOptions = [
        '1 Month',
        '2 Months',
        '3 Months',
        '6 Months',
        '1 Year',
        '2 Years',
        '3 Years',
        'Until Lease Validity',
        'Forever (until cancelled in writing)',
        'Custom'
      ];
      const isGranteeCompany = businessConstitution !== 'Sole Proprietorship Firm';

      const sections = [
        {
          pageNumber: 1,
          sectionTitle: 'Objective, Jurisdiction & Stamp Duty',
          fields: [
            fieldEntry('Selected State / Union Territory', selectedState, false, stateOptions),
            checkboxEntry('Purpose — GST Registration (Tax Allotment)', Boolean(purposes.gst_reg), true),
            checkboxEntry('Purpose — Business License / Gumasta / Shops & Est', Boolean(purposes.biz_license), true),
            checkboxEntry('Purpose — Sub-Letting / Sub-Leasing Permissions', Boolean(purposes.subletting), true),
            checkboxEntry('Purpose — Bank Account Opening / Corporate Address Proof', Boolean(purposes.bank_account), true),
            checkboxEntry('Purpose — Central/State Statutory (FSSAI, MSME, Pollution, Fire)', Boolean(purposes.statutory_reg), true),
            fieldEntry('Property Classification', propertyClassification, false, propertyClassOptions),
            fieldEntry('Stamp Paper Procurement Mode', stampProcurementMode === 'estamp' ? 'E-Stamp Paper / Digital Stamp' : 'Physical Stamp Paper (User Upload)', false, ['E-Stamp Paper / Digital Stamp', 'Physical Stamp Paper (User Upload)']),
            fieldEntry('Physical Stamp File', physicalStampFile ? `${physicalStampFile.fileName}` : '', stampProcurementMode !== 'physical_upload'),
            fieldEntry('Stamp Duty Cost Paid By', stampCostBorneBy, false, stampBorneOptions),
            fieldEntry('Custom Stamp Cost Split Details', customSplitText, stampCostBorneBy !== 'Custom Split'),
            fieldEntry('Final Stamp Paper Value (INR)', `₹${pricing.stamp}`, false, ['₹10', '₹20', '₹50', '₹100', '₹500', '₹1000', 'Custom'])
          ]
        },
        {
          pageNumber: 2,
          sectionTitle: '1st Party / Grantor (Landlord) Details',
          fields: [
            fieldEntry('Landlord Ownership Type', landlordOwnershipType, false, landlordOwnershipOptions),
            fieldEntry(
              isCorpLandlord
                ? getCompanyFieldLabels(landlordOwnershipType).entityNameLabel
                : 'Landlord Full Legal Name',
              landlordName,
              false
            ),
            fieldEntry(getCompanyRegFieldMeta(landlordOwnershipType).label, corpCin, !isCorpLandlord),
            fieldEntry('Company / Firm GSTIN Number', corpGstin, !isCorpLandlord),
            fieldEntry(getCompanyFieldLabels(landlordOwnershipType).incDateLabel, corpIncDate, !isCorpLandlord),
            fieldEntry(getCompanyFieldLabels(landlordOwnershipType).addressLabel, corpRegAddress, !isCorpLandlord),
            fieldEntry(getCompanyFieldLabels(landlordOwnershipType).signatoryLabel, corpRepName, !isCorpLandlord),
            fieldEntry('Signatory Designation', corpRepDesignation, !isCorpLandlord || landlordOwnershipType === 'Sole Proprietorship Firm', COMPANY_DESIGNATION_OPTIONS),
            fieldEntry('Board Resolution / Auth Letter Date', corpResolutionDate, !isCorpLandlord || landlordOwnershipType === 'Sole Proprietorship Firm'),
            fieldEntry("Father's / Husband's Name", landlordFatherName, isCorpLandlord),
            fieldEntry('Permanent Residential Address', landlordAddress, isCorpLandlord),
            fieldEntry(
              isCorpLandlord ? getCompanyFieldLabels(landlordOwnershipType).panLabel : 'Landlord PAN Card',
              landlordPan,
              false
            ),
            fieldEntry('Official Contact Mobile Number', landlordMobile, false),
            fieldEntry('Contact Email ID', landlordEmail, false),
            fieldEntry('Joint Co-Owners Added', coOwners.length > 0 ? coOwners : '', true),
            checkboxEntry(ENTITY_AUTH_CONFIRM_LABEL, landlordEntityAuthConfirmed, !isCorpLandlord),
            checkboxEntry('Clear Legal Title & Encumbrance Declaration Accepted', clearTitleDeclared, false)
          ]
        },
        {
          pageNumber: 3,
          sectionTitle: '2nd Party / Grantee (Business & Entity) Details',
          fields: [
            fieldEntry('Business Constitution', businessConstitution, false, constitutionOptions),
            fieldEntry(
              isGranteeCompany
                ? getCompanyFieldLabels(businessConstitution).entityNameLabel
                : 'Proposed Business / Firm Name',
              proposedBusinessName,
              false
            ),
            fieldEntry(getCompanyFieldLabels(businessConstitution).panLabel, granteePan, false),
            fieldEntry(
              isGranteeCompany ? 'Registered Office Address of Company' : 'Business Address',
              granteeAddress,
              false
            ),
            fieldEntry(getCompanyRegFieldMeta(businessConstitution).label, granteeCin, !isGranteeCompany),
            fieldEntry('Company / Firm GSTIN Number', granteeGstin, true),
            fieldEntry(getCompanyFieldLabels(businessConstitution).incDateLabel, granteeIncDate, true),
            fieldEntry('Official Email Address', granteeEmail, false),
            fieldEntry('Board Resolution / Auth Letter Date', granteeAuthDate, !isGranteeCompany),
            fieldEntry('Nature of Business Operations', natureOfOperations, false, natureOptions),
            fieldEntry('Custom Nature of Operations Description', customNatureOfOperations, natureOfOperations !== 'Other'),
            fieldEntry(
              isGranteeCompany ? getCompanyFieldLabels(businessConstitution).signatoryLabel : 'Proprietor Full Legal Name',
              granteeSignatoryName,
              false
            ),
            fieldEntry("Signatory Father's Name", granteeSignatoryFatherName, false),
            fieldEntry('Signatory Designation', granteeDesignation, false, COMPANY_DESIGNATION_OPTIONS),
            checkboxEntry(ENTITY_AUTH_CONFIRM_LABEL, granteeEntityAuthConfirmed, false),
            fieldEntry('Authorization Letter / Board Resolution File', authorizationDocFile ? `${authorizationDocFile.fileName} (${Math.round(authorizationDocFile.sizeBytes / 1024)} KB)` : '', true)
          ]
        },
        {
          pageNumber: '3B',
          sectionTitle: 'Premises Location, Area & Boundaries',
          fields: [
            fieldEntry('Premises Complete Address', premisesAddress, false),
            fieldEntry('Municipal Ward Number / Zone', wardNumber, true),
            fieldEntry('Property Tax Holding / Survey No.', propertyTaxAssessmentNo, true),
            fieldEntry('Super Built-up Area (Sq. Ft.)', superBuiltupArea, true),
            fieldEntry('Carpet Area (Sq. Ft.)', carpetArea, true),
            checkboxEntry('Boundaries Marked Optional', boundariesOptional, true),
            fieldEntry('East Boundary', eastBound, boundariesOptional),
            fieldEntry('West Boundary', westBound, boundariesOptional),
            fieldEntry('North Boundary', northBound, boundariesOptional),
            fieldEntry('South Boundary', southBound, boundariesOptional)
          ]
        },
        {
          pageNumber: 4,
          sectionTitle: 'Operational Clauses & Statutory Permissions',
          fields: [
            checkboxEntry('Government Registration Permission (GST, MSME, Shop & Est, Trade License)', clauseMultiAgency, true),
            checkboxEntry('Tax Officer Inspection Permission (Physical verification & spot inspection)', clausePhysicalVerification, true),
            checkboxEntry('Signboard Display Permission (Display business name & GSTIN signboard)', clauseSignboard, true),
            checkboxEntry('Books & Invoices Permission (Maintain tax invoices, ledgers & accounting records)', clauseBooks, true),
            checkboxEntry('Structural Limits (Temporary partitions / false ceiling without beam damage)', clauseStructural, true),
            checkboxEntry('FSSAI Licensing Consent', clauseFssai, true),
            checkboxEntry('Fire Safety Compliance Consent', clauseFireSafety, true),
            checkboxEntry('Health Trade License Consent', clauseHealthTrade, true),
            checkboxEntry('Electricity Meter / Load Enhancement Consent', meterLoadConsent, true),
            fieldEntry('NOC Validity / Duration', nocDuration, false, nocDurationOptions),
            fieldEntry('Custom NOC Duration', customNocDuration, nocDuration !== 'Custom'),
            fieldEntry('Sub-Letting & Co-Working Permission', sublettingPermission, false, ['Not Allowed', 'Allowed']),
            fieldEntry('Property Tax Escalation Responsibility', propertyTaxEscalation, false, ['Fully Paid by Landlord', 'Reimbursed by Tenant', 'Divided on Pro-rata Basis']),
            checkboxEntry('Landlord Indemnity Clause (Tenant solely responsible for taxes & liabilities)', landlordIndemnityAccepted, false),
            checkboxEntry('Signatory Authority Confirmation (Yes, I am authorized to enter this agreement.)', signatoryAuthorized, false),
            fieldEntry(
              'Custom Operational Conditions',
              customClauses.length > 0
                ? customClauses.map((c, i) => `${i + 1}. ${c.header || 'Condition'}: ${c.description}`).join(' | ')
                : '',
              true
            )
          ]
        },
        {
          pageNumber: 5,
          sectionTitle: 'Witnesses, Delivery & Pricing',
          fields: [
            fieldEntry('Witness 1 Full Legal Name', witness1Name, false),
            fieldEntry("Witness 1 Father's / Husband's Name", witness1FatherName, false),
            fieldEntry('Witness 1 Profession', witness1Profession, true),
            fieldEntry('Witness 1 Email Address', witness1Email, false),
            checkboxEntry('Witness 1 Confirmed Above 18+', witness1Above18, false),
            fieldEntry('Witness 1 Residential Address', witness1Address, false),
            fieldEntry('Witness 1 Mobile Number', witness1Mobile, false),
            fieldEntry('Witness 2 Full Legal Name', witness2Name, false),
            fieldEntry("Witness 2 Father's / Husband's Name", witness2FatherName, false),
            fieldEntry('Witness 2 Profession', witness2Profession, true),
            fieldEntry('Witness 2 Email Address', witness2Email, false),
            checkboxEntry('Witness 2 Confirmed Above 18+', witness2Above18, false),
            fieldEntry('Witness 2 Residential Address', witness2Address, false),
            fieldEntry('Witness 2 Mobile Number', witness2Mobile, false),
            fieldEntry('Execution & Delivery Mode', deliveryPreference, false, ['digital', 'physical', 'hybrid']),
            fieldEntry('Shipping Postal Address', shippingAddress, deliveryPreference === 'digital'),
            fieldEntry('Shipping PIN Code', shippingPincode, deliveryPreference === 'digital'),
            fieldEntry('Shipping Contact Phone', shippingPhone, deliveryPreference === 'digital'),
            fieldEntry('Total Payable Post-Delivery (INR)', `₹${pricing.totalPayable}`, false)
          ]
        }
      ];

      // 1. Gather complete sensitive data for zero-database encryption
      const sensitiveData = {
        orderId: newOrderId,
        submissionOverview,
        submittedDate: submissionOverview.submittedDate,
        submittedTime: submissionOverview.submittedTime,
        requestType: submissionOverview.requestType,
        mainCategory: submissionOverview.mainCategory,
        subCategory: submissionOverview.subCategory,
        docTitle: 'Commercial No-Objection Certificate (NOC)',
        category: initialDoc.category,
        state: selectedState,
        purposes,
        stampProcurementMode,
        physicalStampFile,
        stampCostBorneBy: stampCostBorneBy === 'Custom Split' ? customSplitText : stampCostBorneBy,
        stampDutyAmount: pricing.stamp,
        landlord: {
          entityType: landlordOwnershipType,
          name: landlordName,
          fatherName: landlordFatherName,
          address: isCorpLandlord ? corpRegAddress : landlordAddress,
          pan: landlordPan,
          mobile: landlordMobile,
          email: landlordEmail,
          clearTitleDeclared,
          entityAuthConfirmed: isCorpLandlord ? landlordEntityAuthConfirmed : undefined,
          coOwners: coOwners.length > 0 ? coOwners : undefined,
          corporate: isCorpLandlord ? {
            corpCin,
            corpGstin,
            corpIncDate,
            corpRegAddress,
            corpRepName,
            corpRepDesignation,
            corpResolutionDate
          } : undefined
        },
        grantee: {
          businessName: proposedBusinessName,
          constitutionType: businessConstitution,
          pan: granteePan,
          gstin: granteeGstin,
          incorporationDate: granteeIncDate,
          authDate: granteeAuthDate,
          email: granteeEmail,
          address: granteeAddress,
          cin: granteeCin,
          natureOfOperations: natureOfOperations === 'Other' ? customNatureOfOperations : natureOfOperations,
          authorizedPerson: granteeSignatoryName,
          fatherName: granteeSignatoryFatherName,
          designation: granteeDesignation,
          entityAuthConfirmed: granteeEntityAuthConfirmed,
          authorizationDocUploaded,
          authorizationDocFile
        },
        property: {
          address: premisesAddress,
          classification: propertyClassification,
          wardNumber,
          propertyTaxAssessmentNo,
          superBuiltupArea,
          carpetArea,
          boundariesOptional,
          boundaries: { eastBound, westBound, northBound, southBound, structured: propertyBoundaries }
        },
        clauses: {
          clauseMultiAgency,
          clausePhysicalVerification,
          clauseSignboard,
          clauseBooks,
          clauseStructural,
          clauseFssai,
          clauseFireSafety,
          clauseHealthTrade,
          nocDuration: effectiveNocDuration,
          sublettingPermission,
          propertyTaxEscalation,
          meterLoadConsent,
          landlordIndemnityAccepted,
          signatoryAuthorized,
          customClauses
        },
        witnesses: [
          { name: witness1Name, fatherName: witness1FatherName, profession: witness1Profession, email: witness1Email, isAbove18: witness1Above18, address: witness1Address, mobile: witness1Mobile },
          { name: witness2Name, fatherName: witness2FatherName, profession: witness2Profession, email: witness2Email, isAbove18: witness2Above18, address: witness2Address, mobile: witness2Mobile }
        ],
        delivery: {
          deliveryPreference,
          shippingAddress: deliveryPreference !== 'digital' ? shippingAddress : undefined,
          pincode: deliveryPreference !== 'digital' ? shippingPincode : undefined,
          shippingPhone: deliveryPreference !== 'digital' ? shippingPhone : undefined
        },
        pricing,
        uploadedDocuments,
        sections,
        timestamp: now.toISOString()
      };

      // 2. Client-Side AES-256 + HMAC-SHA256
      const encResult = encryptFormDataAndSign(sensitiveData);
      const { encryptedPayload, signature, websiteBUrl } = encResult;

      // 3. Save ONLY 4 lightweight metadata fields to Supabase
      const metadata = {
        firstPartyName: landlordName || 'Applicant',
        formName: 'Commercial No-Objection Certificate (NOC)',
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
              Zero-database compliance: Sensitive commercial NOC details have been encrypted in browser using AES-256. Only lightweight audit metadata saved to Supabase.
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
              <span className="text-slate-500">Stamp Paper Denomination:</span>
              <span className="font-bold text-[#15803d]">{submittedOrder.stampDenomination}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200/80 pb-2">
              <span className="text-slate-500">Business Grantee:</span>
              <span className="font-bold text-slate-900">{proposedBusinessName}</span>
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
              className="w-full sm:w-auto px-8 py-3.5 bg-slate-900 hover:bg-black text-white font-bold text-sm rounded-xl shadow-md cursor-pointer transition-all"
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
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}

        {/* Form Title & Green Architecture Subtitle */}
        <div className="mt-4">
          <h1 className="text-2xl sm:text-3xl font-black text-black">
            {initialDoc.title}
          </h1>
          <span className="text-sm font-bold text-[#15803d] block mt-0.5">
            Architecture
          </span>
        </div>

        {(currentPage === '1' || activeTab === 'request') && (
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
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-5 sm:p-7">
        {/* ================= PAGE 1: OBJECTIVE & STAMP SELECTION ================= */}
        {currentPage === '1' && (
          <div className="space-y-6 animate-fadeIn">

            {/* State Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                State / Union Territory (36 States/UTs) <span className="text-red-500 font-bold">*</span>
              </label>
              <WhiteSelect
                value={selectedState}
                onChange={(val) => setSelectedState(val)}
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
                aria-label="State / Union Territory"
              />
            </div>

            {/* Purpose of NOC [Multi-Select Checkbox] */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Purpose of NOC (Select all that apply) <span className="text-red-500 font-bold">*</span>
              </label>
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
                    className={optionCardClass(Boolean(purposes[item.key]), 'font-semibold')}
                  >
                    <input
                      type="checkbox"
                      checked={purposes[item.key]}
                      onChange={() => togglePurpose(item.key)}
                      className="sr-only"
                    />
                    <CircleIndicator checked={Boolean(purposes[item.key])} />
                    <span className="text-xs font-semibold text-slate-800">{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Property Classification */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Property Classification <span className="text-red-500 font-bold">*</span>
              </label>
              <WhiteSelect
                value={propertyClassification}
                onChange={(val) => setPropertyClassification(val)}
                options={[
                  { value: 'Commercial Building', label: 'Commercial Building' },
                  { value: 'IT Park/SEZ', label: 'IT Park / SEZ' },
                  { value: 'Industrial Land/Shed', label: 'Industrial Land / Shed / Warehouse' },
                  { value: 'Mixed-Use Urban Property', label: 'Mixed-Use Urban Property' },
                  { value: 'Residential Property Used for Business', label: 'Residential Property Used for Business' }
                ]}
                aria-label="Property Classification"
              />
            </div>

            {/* Stamp Paper Procurement Mode (Identical to 11 Month Rent Agreement) */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-2">
                Stamp Paper Procurement Mode <span className="text-red-500 font-bold">*</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className={optionCardClass(stampProcurementMode === 'estamp')}>
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
                    <span className="text-[11px] text-slate-500">System generated official state e-stamp</span>
                  </div>
                </label>

                <label className={optionCardClass(stampProcurementMode === 'physical_upload')}>
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
                    <span className="text-[11px] text-slate-500">Upload your own pre-purchased physical stamp</span>
                  </div>
                </label>
              </div>

              {stampProcurementMode === 'physical_upload' && (
                <div className="mt-3 p-4 bg-blue-50/70 border border-blue-300 rounded-xl space-y-3 animate-fadeIn">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">
                        Upload Pre-Purchased Physical Stamp Paper <span className="text-red-500 font-bold">*</span>
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Attach scanned front page of physical non-judicial stamp paper (PDF/JPG/PNG)
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
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
                          onChange={handlePhysicalStampSelect}
                        />
                      </label>
                      {physicalStampFile && (
                        <button
                          type="button"
                          onClick={() => setPhysicalStampFile(null)}
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

            {/* Stamp Paper Value Selection */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  Stamp Paper Value Selection <span className="text-red-500 font-bold">*</span>
                </label>
                <span className="text-[11px] font-bold text-blue-600">
                  Recommended for {selectedState}: ₹{recommendedStamp}
                </span>
              </div>

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
                    placeholder={showExample ? "Enter custom stamp value in Rupees" : ""}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              )}

              {isStampBelowThreshold && (
                <div className="mt-3 p-3.5 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-xs flex items-start gap-2.5 animate-fadeIn">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Warning:</strong> Per {selectedState} statutory regulations, the recommended minimum stamp duty is <strong>₹{recommendedStamp}</strong>. Authorities may reject an NOC drafted below the state minimum.
                  </span>
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
                onChange={(val) => setStampCostBorneBy(val)}
                options={[
                  { value: 'First Party (Landlord / Lessor)', label: 'First Party (Landlord / Lessor)' },
                  { value: 'Second Party (Business Owner / Grantee)', label: 'Second Party (Business Owner / Grantee)' },
                  { value: 'Shared Equally (50-50 Split)', label: 'Shared Equally (50-50 Split)' },
                  { value: 'Custom Split', label: 'Custom Ratio or Fixed Amount Split' }
                ]}
                aria-label="Stamp Duty Cost Paid By"
              />

              {stampCostBorneBy === 'Custom Split' && (
                <div className="mt-2">
                  <input
                    type="text"
                    value={customSplitText}
                    onChange={(e) => setCustomSplitText(e.target.value)}
                    placeholder={showExample ? "Enter custom ratio or division" : ""}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= PAGE 2: THE GRANTOR ================= */}
        {currentPage === '2' && (
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

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Landlord Ownership Type <span className="text-red-500">*</span>
              </label>
              <WhiteSelect
                value={landlordOwnershipType}
                onChange={(val) => setLandlordOwnershipType(val)}
                options={[
                  { value: 'Sole Individual', label: 'Sole Individual' },
                  { value: 'Joint Owners', label: 'Joint Owners' },
                  { value: 'Partnership Firm', label: 'Partnership Firm' },
                  { value: 'Limited Liability Partnership (LLP)', label: 'Limited Liability Partnership (LLP)' },
                  { value: 'Private Limited Company (Pvt Ltd)', label: 'Private Limited Company (Pvt Ltd)' },
                  { value: 'Public Limited Company (Ltd)', label: 'Public Limited Company (Ltd)' },
                  { value: 'Hindu Undivided Family (HUF)', label: 'Hindu Undivided Family (HUF)' },
                  { value: 'Trust / Society / AOP', label: 'Trust / Society / AOP' },
                  { value: 'Sole Proprietorship Firm', label: 'Sole Proprietorship Firm' }
                ]}
                aria-label="Landlord Ownership Type"
              />
            </div>

            {landlordOwnershipType !== 'Sole Individual' && landlordOwnershipType !== 'Joint Owners' ? (
              /* Corporate Landlord */
              (() => {
                const landlordRegMeta = getCompanyRegFieldMeta(landlordOwnershipType);
                const landlordAuthMandatory = isAuthDateRequired(landlordOwnershipType);
                const landlordGstinRequired = isGstinRequiredForSubType(landlordOwnershipType);
                const landlordLabels = getCompanyFieldLabels(landlordOwnershipType);
                const isLandlordSoleProp = landlordOwnershipType === 'Sole Proprietorship Firm';
                return (
              <div className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-xs font-bold text-blue-700 uppercase tracking-wider block">
                  {isLandlordSoleProp ? 'Sole Proprietorship Details' : 'Corporate / Entity Ownership Details'}
                </span>

                {isLandlordSoleProp ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {landlordLabels.signatoryLabel} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={corpRepName}
                        onChange={(e) => setCorpRepName(e.target.value)}
                        placeholder={showExample ? landlordLabels.signatoryPlaceholder : ""}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {landlordLabels.entityNameLabel} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={landlordName}
                        onChange={(e) => setLandlordName(e.target.value)}
                        placeholder={showExample ? landlordLabels.entityNamePlaceholder : ""}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {landlordLabels.entityNameLabel} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={landlordName}
                        onChange={(e) => setLandlordName(e.target.value)}
                        placeholder={showExample ? landlordLabels.entityNamePlaceholder : ""}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {landlordRegMeta.label}{' '}
                        {landlordRegMeta.required ? (
                          <span className="text-red-500">*</span>
                        ) : (
                          <span className="text-slate-400 font-normal">(Optional)</span>
                        )}
                      </label>
                      <input
                        type="text"
                        required={landlordRegMeta.required}
                        value={corpCin}
                        onChange={(e) => setCorpCin(e.target.value.toUpperCase())}
                        placeholder={showExample ? landlordRegMeta.placeholder : ""}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono uppercase text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Company / Firm GSTIN Number{' '}
                      {landlordGstinRequired ? (
                        <span className="text-red-500">*</span>
                      ) : (
                        <span className="text-slate-400 font-normal">(Optional)</span>
                      )}
                    </label>
                    <input
                      type="text"
                      required={landlordGstinRequired}
                      maxLength={15}
                      value={corpGstin}
                      onChange={(e) => setCorpGstin(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 15))}
                      placeholder={showExample ? "27AABCU9603R1ZM" : ""}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono uppercase text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <DateOfBirthPicker
                      label={landlordLabels.incDateLabel}
                      value={corpIncDate}
                      onChange={setCorpIncDate}
                      required={false}
                      placeholder="DD/MM/YYYY"
                      helperText={showExample ? 'Format: DD/MM/YYYY' : undefined}
                    />
                  </div>
                </div>

                {isLandlordSoleProp && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {landlordRegMeta.label} <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={corpCin}
                      onChange={(e) => setCorpCin(e.target.value.toUpperCase())}
                      placeholder={showExample ? landlordRegMeta.placeholder : ""}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono uppercase text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                )}

                <AddressFieldGroup
                  label={landlordLabels.addressLabel}
                  variant="standard"
                  value={corpRegAddress}
                  onChangeAddress={(addr) => setCorpRegAddress(addr)}
                  required
                />

                {!isLandlordSoleProp && (
                  <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-3">
                    <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block">
                      Authorized Signatory &amp; Authorization Details
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          {landlordLabels.signatoryLabel} <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={corpRepName}
                          onChange={(e) => setCorpRepName(e.target.value)}
                          placeholder={showExample ? landlordLabels.signatoryPlaceholder : ""}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Signatory Designation <span className="text-red-500">*</span>
                        </label>
                        <WhiteSelect
                          variant="compact"
                          value={corpRepDesignation}
                          onChange={(val) => setCorpRepDesignation(val)}
                          options={COMPANY_DESIGNATION_OPTIONS}
                          aria-label="Landlord Signatory Designation"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Board Resolution / Auth Letter Date{' '}
                          {landlordAuthMandatory ? (
                            <span className="text-red-500">*</span>
                          ) : (
                            <span className="text-slate-400 font-normal">(Optional)</span>
                          )}
                        </label>
                        <input
                          type="date"
                          required={landlordAuthMandatory}
                          value={corpResolutionDate}
                          onChange={(e) => setCorpResolutionDate(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
                );
              })()
            ) : (
              /* Individual / Joint Landlord */
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Landlord Full Legal Name <span className="text-red-500">*</span>
                    </label>
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
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Father's / Husband's Name <span className="text-red-500">*</span>
                    </label>
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

                <AddressFieldGroup
                  label="Permanent Residential Address"
                  variant="standard"
                  value={landlordAddress}
                  onChangeAddress={(addr) => setLandlordAddress(addr)}
                  required
                />
              </div>
            )}

            {/* KYC Identifiers: PAN, Mobile, Mandatory Email */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {landlordOwnershipType !== 'Sole Individual' && landlordOwnershipType !== 'Joint Owners'
                    ? getCompanyFieldLabels(landlordOwnershipType).panLabel
                    : 'Landlord PAN Card'}{' '}
                  <span className="text-red-500">*</span>
                </label>
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
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Official Contact Mobile Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={landlordMobile}
                  onChange={(e) => setLandlordMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder={showExample ? "9876543210" : ""}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
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
                  <div key={co.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row gap-2 sm:items-end">
                    <div className="flex-1 w-full">
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                        Co-Owner Full Legal Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={co.name}
                        onChange={(e) => updateCoOwner(co.id, 'name', e.target.value)}
                        placeholder={showExample ? "Co-Owner Legal Name *" : ""}
                        className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                      />
                    </div>
                    <div className="sm:w-36 w-full">
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                        Co-Owner PAN <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        maxLength={10}
                        value={co.pan}
                        onChange={(e) => updateCoOwner(co.id, 'pan', e.target.value.toUpperCase())}
                        placeholder={showExample ? "PAN *" : ""}
                        className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono uppercase text-slate-900"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeCoOwner(co.id)}
                      className="text-slate-400 hover:text-rose-600 p-1.5 self-end cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Mandatory Entity Authorization Checkbox for Corporate/Firm Landlords */}
            {landlordOwnershipType !== 'Sole Individual' && landlordOwnershipType !== 'Joint Owners' && (
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

            {/* Clear Title Declaration in Simple Language */}
            <div>
              <label className={optionCardClass(clearTitleDeclared, '', true)}>
                <input
                  type="checkbox"
                  required
                  checked={clearTitleDeclared}
                  onChange={(e) => setClearTitleDeclared(e.target.checked)}
                  className="sr-only"
                />
                <CircleIndicator checked={clearTitleDeclared} className="mt-0.5" />
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
                    Business Owner / Grantee
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Business Constitution <span className="text-red-500">*</span>
              </label>
              <WhiteSelect
                value={businessConstitution}
                onChange={(val) => handleConstitutionChange(val)}
                options={[
                  { value: 'Sole Proprietorship Firm', label: 'Sole Proprietorship Firm' },
                  { value: 'Partnership Firm', label: 'Partnership Firm' },
                  { value: 'Limited Liability Partnership (LLP)', label: 'Limited Liability Partnership (LLP)' },
                  { value: 'Private Limited Company (Pvt Ltd)', label: 'Private Limited Company (Pvt Ltd)' },
                  { value: 'Public Limited Company (Ltd)', label: 'Public Limited Company (Ltd)' },
                  { value: 'Joint Owners / Co-Owners', label: 'Joint Owners / Co-Owners' },
                  { value: 'Hindu Undivided Family (HUF)', label: 'Hindu Undivided Family (HUF)' },
                  { value: 'Trust / Society / AOP', label: 'Trust / Society / AOP' }
                ]}
                aria-label="Business Constitution"
              />
            </div>

            {/* Proposed Business / Firm Name & PAN */}
            {(() => {
              const granteeLabels = getCompanyFieldLabels(businessConstitution);
              const granteeRegMeta = getCompanyRegFieldMeta(businessConstitution);
              const granteeAuthMandatory = isAuthDateRequired(businessConstitution);
              const granteeGstinRequired = isGstinRequiredForSubType(businessConstitution);
              const isGranteeSoleProp = businessConstitution === 'Sole Proprietorship Firm';
              return (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {isGranteeSoleProp
                          ? 'Proposed Business / Firm Name'
                          : granteeLabels.entityNameLabel}{' '}
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={proposedBusinessName}
                        onChange={(e) => handleBusinessNameChange(e.target.value)}
                        placeholder={showExample ? granteeLabels.entityNamePlaceholder : ""}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {granteeLabels.panLabel} <span className="text-red-500">*</span>
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

                  {/* Company / Firm Details (Date of Incorporation stays UP here, GSTIN Optional for non-Pvt/Ltd) */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl animate-fadeIn">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {granteeRegMeta.label}{' '}
                        {granteeRegMeta.required && !isGranteeSoleProp ? (
                          <span className="text-red-500">*</span>
                        ) : (
                          <span className="text-slate-400 font-normal">(Optional)</span>
                        )}
                      </label>
                      <input
                        type="text"
                        required={granteeRegMeta.required && !isGranteeSoleProp}
                        value={granteeCin}
                        onChange={(e) => setGranteeCin(e.target.value.toUpperCase())}
                        placeholder={showExample ? granteeRegMeta.placeholder : ""}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono uppercase text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Company / Firm GSTIN Number{' '}
                        {granteeGstinRequired ? (
                          <span className="text-red-500">*</span>
                        ) : (
                          <span className="text-slate-400 font-normal">(Optional)</span>
                        )}
                      </label>
                      <input
                        type="text"
                        required={granteeGstinRequired}
                        maxLength={15}
                        value={granteeGstin}
                        onChange={(e) => setGranteeGstin(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 15))}
                        placeholder={showExample ? "27AABCU9603R1ZM" : ""}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono uppercase text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>

                    <div>
                      <DateOfBirthPicker
                        label={granteeLabels.incDateLabel}
                        value={granteeIncDate}
                        onChange={setGranteeIncDate}
                        required={false}
                        placeholder="DD/MM/YYYY"
                        helperText={showExample ? 'Format: DD/MM/YYYY' : undefined}
                      />
                    </div>
                  </div>

                  {/* Mandatory Email Address */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Official Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={granteeEmail}
                      onChange={(e) => setGranteeEmail(e.target.value)}
                      placeholder={showExample ? "grantee@business.com" : ""}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  {/* Nature of Business Operations + 'Other' Custom Box Option */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nature of Business Operations <span className="text-red-500">*</span>
                    </label>
                    <WhiteSelect
                      value={natureOfOperations}
                      onChange={(val) => setNatureOfOperations(val)}
                      options={[
                        { value: 'IT / Software / Back Office / Consultancy', label: 'IT / Software / Back Office / Consultancy' },
                        { value: 'Retail / Showroom / Gym / Footfall Business', label: 'Retail / Showroom / Gym / Footfall Business' },
                        { value: 'Logistics / Warehousing / Heavy Storage / Manufacturing', label: 'Logistics / Warehousing / Heavy Storage / Manufacturing' },
                        { value: 'Restaurant / Cloud Kitchen / Food & Beverage', label: 'Restaurant / Cloud Kitchen / Food & Beverage' },
                        { value: 'Other', label: 'Other' }
                      ]}
                      aria-label="Nature of Business Operations"
                    />

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

                  <AddressFieldGroup
                    label={granteeLabels.addressLabel}
                    variant="standard"
                    value={granteeAddress}
                    onChangeAddress={(addr) => setGranteeAddress(addr)}
                    required
                  />

                  {/* Authorised Signatory Details (No Aadhaar, No Date of Incorporation) */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                      {isGranteeSoleProp ? 'Proprietor Details' : 'Authorized Signatory & Authorization Details'}
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                          {granteeLabels.signatoryLabel} <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={granteeSignatoryName}
                          onChange={(e) => setGranteeSignatoryName(e.target.value)}
                          placeholder={showExample ? granteeLabels.signatoryPlaceholder : ""}
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
                        <WhiteSelect
                          variant="compact"
                          value={granteeDesignation}
                          onChange={(val) => setGranteeDesignation(val)}
                          options={COMPANY_DESIGNATION_OPTIONS}
                          aria-label="Grantee Signatory Designation"
                        />
                      </div>
                    </div>

                    {!isGranteeSoleProp && (
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                          Board Resolution / Auth Letter Date{' '}
                          {granteeAuthMandatory ? (
                            <span className="text-red-500">*</span>
                          ) : (
                            <span className="text-slate-400 font-normal">(Optional)</span>
                          )}
                        </label>
                        <input
                          type="date"
                          required={granteeAuthMandatory}
                          value={granteeAuthDate}
                          onChange={(e) => setGranteeAuthDate(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>
                    )}

                    <div className="pt-2 border-t border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-800">
                          Authorization Letter / Board Resolution <span className="text-slate-400 font-normal">(Optional)</span>
                        </label>
                        <span className="text-[11px] text-slate-500 block">
                          {authorizationDocFile
                            ? `Attached: ${authorizationDocFile.fileName} (${Math.max(1, Math.round(authorizationDocFile.sizeBytes / 1024))} KB)`
                            : 'Attach signed authorization letter or board resolution (PDF/JPG/PNG)'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer shadow-xs transition-all">
                          <UploadCloud className="w-3.5 h-3.5" />
                          <span>{authorizationDocFile ? 'Change File' : 'Upload File'}</span>
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            onChange={handleAuthFileSelect}
                            className="sr-only"
                          />
                        </label>
                        {authorizationDocFile && (
                          <button
                            type="button"
                            onClick={() => setAuthorizationDocFile(null)}
                            className="px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white text-slate-600 hover:text-rose-600 text-xs font-semibold cursor-pointer"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Mandatory Bottom Entity Authorization Confirmation Checkbox */}
                  <div className="space-y-1.5">
                    <label
                      className={optionCardClass(
                        granteeEntityAuthConfirmed,
                        showGranteeEntityAuthError && !granteeEntityAuthConfirmed
                          ? 'border-rose-400 bg-rose-50/40'
                          : '',
                        true
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={granteeEntityAuthConfirmed}
                        onChange={(e) => {
                          setGranteeEntityAuthConfirmed(e.target.checked);
                          if (e.target.checked) setShowGranteeEntityAuthError(false);
                        }}
                        className="sr-only"
                      />
                      <CircleIndicator checked={granteeEntityAuthConfirmed} className="mt-0.5" />
                      <span className="text-xs text-slate-800">
                        {ENTITY_AUTH_CONFIRM_LABEL} <span className="text-red-500 font-bold">*</span>
                      </span>
                    </label>
                    {showGranteeEntityAuthError && !granteeEntityAuthConfirmed && (
                      <p className="text-xs font-bold text-rose-600">
                        Please tick &ldquo;{ENTITY_AUTH_CONFIRM_LABEL}&rdquo; before continuing.
                      </p>
                    )}
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {/* ================= PAGE 3B: PREMISES LOCATION & BOUNDARIES ================= */}
        {currentPage === '3B' && (
          <div className="space-y-5 animate-fadeIn">
            <div>
              <span className="text-xs font-bold text-blue-700 uppercase tracking-wider block mb-1">
                Premises Location &amp; Dimension Details
              </span>
              <p className="text-xs text-slate-500">
                Provide the exact physical location of the commercial property and boundary details.
              </p>
            </div>

            <AddressFieldGroup
              label="Premises Address"
              variant="property"
              value={premisesAddress}
              onChangeAddress={(addr) => setPremisesAddress(addr)}
              required
            />

            {/* Collapsible Optional Details */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
              <button
                type="button"
                onClick={() => setShowOptionalPremisesDetails((prev) => !prev)}
                className="w-full px-4 py-3 flex items-center justify-between text-xs font-bold text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <span>Optional Details</span>
                {showOptionalPremisesDetails ? (
                  <ChevronUp className="w-4 h-4 text-slate-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-500" />
                )}
              </button>

              {showOptionalPremisesDetails && (
                <div className="p-4 pt-2 border-t border-slate-200 space-y-3 bg-slate-50/50 animate-fadeIn">
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
                </div>
              )}
            </div>

            {/* Structured Property Boundaries with "Change to Optional" toggle */}
            <PropertyBoundariesSection
              title="Property Boundaries"
              value={propertyBoundaries}
              onChange={setPropertyBoundaries}
              showOptionalToggle
              isOptional={boundariesOptional}
              onToggleOptional={setBoundariesOptional}
            />
          </div>
        )}

        {/* ================= PAGE 4: OPERATIONAL CLAUSES IN SIMPLE ENGLISH ================= */}
        {currentPage === '4' && (
          <div className="space-y-5 animate-fadeIn">
            {/* Simple English Statutory Permissions */}
            <div className="space-y-2.5">
              <TopicHeader
                number={1}
                title="Business Clearances & Statutory Permissions"
                question="Which business registrations, inspections, and premises permissions are included in this NOC?"
                required
              />

              <label className={optionCardClass(clauseMultiAgency, '', true)}>
                <input
                  type="checkbox"
                  checked={clauseMultiAgency}
                  onChange={(e) => setClauseMultiAgency(e.target.checked)}
                  className="sr-only"
                />
                <CircleIndicator checked={clauseMultiAgency} className="mt-0.5" />
                <span className="text-xs text-slate-700">
                  <strong>Government Registration Permission:</strong> The landlord has no objection to the tenant obtaining GST, MSME, Shop &amp; Establishment, or Trade License registrations at this address.
                </span>
              </label>

              <label className={optionCardClass(clausePhysicalVerification, '', true)}>
                <input
                  type="checkbox"
                  checked={clausePhysicalVerification}
                  onChange={(e) => setClausePhysicalVerification(e.target.checked)}
                  className="sr-only"
                />
                <CircleIndicator checked={clausePhysicalVerification} className="mt-0.5" />
                <span className="text-xs text-slate-700">
                  <strong>Tax Officer Inspection:</strong> GST and tax authorities have full permission to visit this address for physical verification and spot inspection.
                </span>
              </label>

              <label className={optionCardClass(clauseSignboard, '', true)}>
                <input
                  type="checkbox"
                  checked={clauseSignboard}
                  onChange={(e) => setClauseSignboard(e.target.checked)}
                  className="sr-only"
                />
                <CircleIndicator checked={clauseSignboard} className="mt-0.5" />
                <span className="text-xs text-slate-700">
                  <strong>Signboard Display Permission:</strong> The tenant may install their business name and GST number signboard outside the shop or office.
                </span>
              </label>

              <label className={optionCardClass(clauseBooks, '', true)}>
                <input
                  type="checkbox"
                  checked={clauseBooks}
                  onChange={(e) => setClauseBooks(e.target.checked)}
                  className="sr-only"
                />
                <CircleIndicator checked={clauseBooks} className="mt-0.5" />
                <span className="text-xs text-slate-700">
                  <strong>Books &amp; Invoices Permission:</strong> The business's tax invoices, ledgers, and accounting records may be maintained at this address.
                </span>
              </label>

              <label className={optionCardClass(clauseStructural, '', true)}>
                <input
                  type="checkbox"
                  checked={clauseStructural}
                  onChange={(e) => setClauseStructural(e.target.checked)}
                  className="sr-only"
                />
                <CircleIndicator checked={clauseStructural} className="mt-0.5" />
                <span className="text-xs text-slate-700">
                  <strong>Structural Limits:</strong> Temporary partitions or false ceiling work may be carried out without damaging any main structural beams or load-bearing walls.
                </span>
              </label>
            </div>

            {/* NOC Duration */}
            <div className={`${TOPIC_DIVIDER_CLASS} space-y-2.5`}>
              <TopicHeader
                number={2}
                title="NOC Validity / Duration"
                question="How long should this Commercial NOC remain valid?"
                required
              />
              <WhiteSelect
                value={nocDuration}
                onChange={(val) => setNocDuration(val)}
                placeholder="Select NOC validity duration"
                options={[
                  { value: '1 Month', label: '1 Month' },
                  { value: '2 Months', label: '2 Months' },
                  { value: '3 Months', label: '3 Months' },
                  { value: '6 Months', label: '6 Months' },
                  { value: '1 Year', label: '1 Year' },
                  { value: '2 Years', label: '2 Years' },
                  { value: '3 Years', label: '3 Years' },
                  { value: 'Until Lease Validity', label: 'Until Lease Validity' },
                  { value: 'Forever (until cancelled in writing)', label: 'Forever (until cancelled in writing)' },
                  { value: 'Custom', label: 'Custom Duration' }
                ]}
                aria-label="NOC Validity / Duration"
              />

              {nocDuration === 'Custom' && (
                <input
                  type="text"
                  value={customNocDuration}
                  onChange={(e) => setCustomNocDuration(e.target.value)}
                  placeholder={showExample ? "e.g. 18 Months or Until GST Surrender" : ""}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              )}
            </div>

            {/* Commercial Utilities & Indemnity */}
            <div className={`${TOPIC_DIVIDER_CLASS} space-y-3`}>
              <TopicHeader
                number={3}
                title="Commercial Utilities & Asset Protection"
                question="How will sub-letting, property tax escalation, and landlord indemnity be handled?"
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Sub-Letting &amp; Co-Working Permission <span className="text-red-500">*</span>
                  </label>
                  <WhiteSelect
                    variant="compact"
                    value={sublettingPermission}
                    onChange={(val) => setSublettingPermission(val as 'Not Allowed' | 'Allowed')}
                    placeholder="Select permission"
                    options={['Not Allowed', 'Allowed']}
                    aria-label="Sub-Letting Permission"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Property Tax Escalation Responsibility <span className="text-red-500">*</span>
                  </label>
                  <WhiteSelect
                    variant="compact"
                    value={propertyTaxEscalation}
                    onChange={(val) => setPropertyTaxEscalation(val)}
                    placeholder="Select responsibility"
                    options={[
                      'Fully Paid by Landlord',
                      'Reimbursed by Tenant',
                      'Divided on Pro-rata Basis'
                    ]}
                    aria-label="Property Tax Escalation Responsibility"
                  />
                </div>
              </div>

              <div className={SUBQUESTION_DIVIDER_CLASS}>
                <label className={optionCardClass(landlordIndemnityAccepted, '', true)}>
                  <input
                    type="checkbox"
                    checked={landlordIndemnityAccepted}
                    onChange={(e) => setLandlordIndemnityAccepted(e.target.checked)}
                    className="sr-only"
                  />
                  <CircleIndicator checked={landlordIndemnityAccepted} className="mt-0.5" />
                  <span className="text-xs text-slate-800 leading-relaxed">
                    <strong>Landlord Indemnity:</strong> The tenant shall remain solely responsible for all business operations, statutory taxes, GST filings, and commercial liabilities. No tax liability or attachment shall apply to the landlord's property. <span className="text-red-500 font-bold">*</span>
                  </span>
                </label>
              </div>
            </div>

            {/* Signatory Authority Confirmation */}
            <div className={TOPIC_DIVIDER_CLASS}>
              <SignatoryAuthoritySection
                topicNumber={4}
                checked={signatoryAuthorized}
                onChange={(val) => {
                  setSignatoryAuthorized(val);
                  if (val) setShowSignatoryError(false);
                }}
                showError={showSignatoryError}
              />
            </div>

            {/* Custom Operational Clauses */}
            <div className={`${TOPIC_DIVIDER_CLASS} space-y-3`}>
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
            {/* Standardized Witness Cards */}
            <div className="space-y-4">
              <WitnessDetailsCard
                witnessNumber={1}
                name={witness1Name}
                onNameChange={setWitness1Name}
                fatherName={witness1FatherName}
                onFatherNameChange={setWitness1FatherName}
                profession={witness1Profession}
                onProfessionChange={setWitness1Profession}
                email={witness1Email}
                onEmailChange={setWitness1Email}
                isAbove18={witness1Above18}
                onIsAbove18Change={setWitness1Above18}
                mobile={witness1Mobile}
                onMobileChange={setWitness1Mobile}
                address={witness1Address}
                onAddressChange={setWitness1Address}
              />

              <WitnessDetailsCard
                witnessNumber={2}
                name={witness2Name}
                onNameChange={setWitness2Name}
                fatherName={witness2FatherName}
                onFatherNameChange={setWitness2FatherName}
                profession={witness2Profession}
                onProfessionChange={setWitness2Profession}
                email={witness2Email}
                onEmailChange={setWitness2Email}
                isAbove18={witness2Above18}
                onIsAbove18Change={setWitness2Above18}
                mobile={witness2Mobile}
                onMobileChange={setWitness2Mobile}
                address={witness2Address}
                onAddressChange={setWitness2Address}
              />
            </div>

            {/* Delivery & Execution Mode */}
            <div className="space-y-3 pt-3 border-t border-slate-200">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                Execution &amp; Delivery Mode
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label className={optionCardClass(deliveryPreference === 'digital', '', true)}>
                  <input
                    type="radio"
                    name="deliveryPreference"
                    checked={deliveryPreference === 'digital'}
                    onChange={() => setDeliveryPreference('digital')}
                    className="sr-only"
                  />
                  <CircleIndicator checked={deliveryPreference === 'digital'} className="mt-0.5" />
                  <div>
                    <span className="text-xs font-bold text-black block">Digital e-Sign PDF</span>
                    <span className="text-[11px] text-slate-500 mt-0.5 block">
                      Instant delivery via email &amp; dashboard (1-2 Hours)
                    </span>
                  </div>
                </label>

                <label className={optionCardClass(deliveryPreference === 'physical', '', true)}>
                  <input
                    type="radio"
                    name="deliveryPreference"
                    checked={deliveryPreference === 'physical'}
                    onChange={() => setDeliveryPreference('physical')}
                    className="sr-only"
                  />
                  <CircleIndicator checked={deliveryPreference === 'physical'} className="mt-0.5" />
                  <div>
                    <span className="text-xs font-bold text-black block">Physical Stamp Paper</span>
                    <span className="text-[11px] text-slate-500 mt-0.5 block">
                      Speed Post courier delivery (+₹50)
                    </span>
                  </div>
                </label>

                <label className={optionCardClass(deliveryPreference === 'hybrid', '', true)}>
                  <input
                    type="radio"
                    name="deliveryPreference"
                    checked={deliveryPreference === 'hybrid'}
                    onChange={() => setDeliveryPreference('hybrid')}
                    className="sr-only"
                  />
                  <CircleIndicator checked={deliveryPreference === 'hybrid'} className="mt-0.5" />
                  <div>
                    <span className="text-xs font-bold text-black block">Hybrid Mode</span>
                    <span className="text-[11px] text-slate-500 mt-0.5 block">
                      Digital copy + Physical original (+₹50)
                    </span>
                  </div>
                </label>
              </div>

              {deliveryPreference !== 'digital' && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 space-y-2.5 animate-fadeIn">
                  <div className="text-xs text-amber-900">
                    <strong>Physical Shipping Details:</strong> Speed Post dispatch in 2 business days.
                  </div>
                  <AddressFieldGroup
                    label="Shipping Postal Address"
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
                      Contact Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      required
                      value={shippingPhone}
                      onChange={(e) => setShippingPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder={showExample ? "9876543210" : ""}
                      className="w-full bg-white border border-amber-300 rounded-lg px-3 py-1.5 text-xs text-slate-900"
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
                  <span>Digital e-Sign Charges:</span>
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
              <span>{currentPage === '1' ? 'Cancel' : 'Previous'}</span>
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
