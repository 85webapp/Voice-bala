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
import { AadhaarInput } from './AadhaarInput';
import { AddressFieldGroup } from './AddressFieldGroup';
import {
  PropertyBoundariesSection,
  PropertyBoundariesState,
  createInitialPropertyBoundaries,
  formatSingleBoundary
} from './PropertyBoundariesSection';
import { LegalDocument, OrderItem } from '../types';
import { STATE_CATEGORIES, getSafeStampDuty } from '../data/stampDutyMatrix';
import { useExampleDetails } from '../hooks/useExampleDetails';
import {
  encryptFormDataAndSign,
  saveLightweightMetadata,
  postEncryptedPayloadToWebsiteB,
  playConfirmationChime,
  generateSequentialOrderId,
  ServerBSyncResult,
  UploadedDocumentPayload,
  fieldEntry,
  checkboxEntry,
  buildSubmissionOverview,
  readFileAsUploadPayload
} from '../services/encryptionService';
import { Lock, ExternalLink } from 'lucide-react';
import { showToast } from '../services/toastService';
import { ServerBSyncStatusCard } from './ServerBSyncStatusCard';
import { VoiceGuidanceButton } from './VoiceGuidanceButton';
import { FormRequestTabBar, HorizontalSwipeContainer, WizardModeTab } from './FormRequestTabBar';
import { QuickCallbackRequestPanel } from './QuickCallbackRequestPanel';

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
  const { showExampleDetails, getPlaceholder } = useExampleDetails();
  const showExample = showExampleDetails;
  const [activeTab, setActiveTab] = useState<WizardModeTab>('form');
  const [currentPage, setCurrentPage] = useState<StepId>('1');

  // --- PAGE 1: PREMISES TYPE & GEOGRAPHIC JURISDICTION ---
  const [premisesType, setPremisesType] = useState<string>('Commercial Building / Shop / Office');
  const [selectedState, setSelectedState] = useState<string>('Uttar Pradesh');

  // Recommended stamp
  const recommendedStamp = useMemo(() => {
    return getSafeStampDuty('Landlord NOC for GST', selectedState);
  }, [selectedState]);

  // Stamp Paper Procurement Mode & Denomination
  const [stampProcurementMode, setStampProcurementMode] = useState<'estamp' | 'physical_upload'>('estamp');
  const [physicalStampFile, setPhysicalStampFile] = useState<UploadedDocumentPayload | null>(null);
  const physicalStampUploaded = Boolean(physicalStampFile);

  const [stampValue, setStampValue] = useState<number>(100);
  const [customStampValue, setCustomStampValue] = useState<string>('');
  const [stampCostBorneBy, setStampCostBorneBy] = useState<string>('First Party (Landlord / Owner)');
  const [customSplitText, setCustomSplitText] = useState<string>('');

  const activeStampValue = useMemo(() => {
    return stampValue === -1 ? Number(customStampValue) || 0 : stampValue;
  }, [stampValue, customStampValue]);

  const isStampBelowThreshold = useMemo(() => {
    return activeStampValue < recommendedStamp;
  }, [activeStampValue, recommendedStamp]);

  // --- PAGE 2: THE GRANTOR - LANDLORD'S TAX IDENTITY ---
  const [ownershipStatus, setOwnershipStatus] = useState<string>('Sole Owner');
  const [landlordName, setLandlordName] = useState('');
  const [landlordFatherName, setLandlordFatherName] = useState('');
  const [landlordAddress, setLandlordAddress] = useState('');
  const [landlordPan, setLandlordPan] = useState('');
  const [landlordAadhaarLast4, setLandlordAadhaarLast4] = useState('');
  const [landlordMobile, setLandlordMobile] = useState('');
  const [landlordEmail, setLandlordEmail] = useState('');

  // Dynamic Ownership Extension
  const [coOwners, setCoOwners] = useState<CoOwner[]>([]);
  const [corpCompanyName, setCorpCompanyName] = useState('');
  const [corpCin, setCorpCin] = useState('');
  const [boardResolutionFile, setBoardResolutionFile] = useState<UploadedDocumentPayload | null>(null);
  const boardResolutionUploaded = Boolean(boardResolutionFile);

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
  const [granteeAddress, setGranteeAddress] = useState('');
  const [signingAuthorityFile, setSigningAuthorityFile] = useState<UploadedDocumentPayload | null>(null);
  const signingAuthorityUploaded = Boolean(signingAuthorityFile);

  const handleTradeNameChange = (val: string) => {
    const cleaned = val.replace(/[@#$%^&]/g, '');
    setProposedTradeName(cleaned);
  };

  // --- PAGE 3B: PREMISES & UTILITY DOCUMENT ---
  const [premisesAddress, setPremisesAddress] = useState('');
  const [showOptionalPremisesDetails, setShowOptionalPremisesDetails] = useState(false);
  const [wardNumber, setWardNumber] = useState('');
  const [propertyTaxAssessmentNo, setPropertyTaxAssessmentNo] = useState('');
  const [buildingBoundaries, setBuildingBoundaries] = useState<PropertyBoundariesState>(() =>
    createInitialPropertyBoundaries()
  );
  const [ownershipDocType, setOwnershipDocType] = useState<string>('Electricity Bill (Not older than 2 months)');
  const [utilityDocFile, setUtilityDocFile] = useState<UploadedDocumentPayload | null>(null);
  const utilityDocUploaded = Boolean(utilityDocFile);
  const [docOwnerNameString, setDocOwnerNameString] = useState('');

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
      if (stampProcurementMode === 'physical_upload' && !physicalStampUploaded) {
        showToast('Please upload your pre-purchased Physical Stamp Paper before proceeding.', 'warning');
        return;
      }
    }

    if (currentPage === '2') {
      if (!landlordName.trim()) {
        showToast('Please provide Landlord Name.', 'warning');
        return;
      }
      if (!landlordAddress.trim()) {
        showToast('Please provide complete Landlord Residential / Registered Address.', 'warning');
        return;
      }
      if (landlordPan.trim().length !== 10) {
        showToast('Landlord 10-character PAN Number is mandatory.', 'warning');
        return;
      }
      if (landlordAadhaarLast4.replace(/\D/g, '').length !== 12) {
        showToast('Landlord 12-digit Aadhaar Number is mandatory.', 'warning');
        return;
      }
      if (landlordMobile.replace(/\D/g, '').length !== 10) {
        showToast('Please provide a valid 10-digit Landlord Mobile Number.', 'warning');
        return;
      }
      if (ownershipStatus === 'Authorized Director / Partner / Trustee') {
        if (!corpCompanyName.trim() || !corpCin.trim()) {
          showToast('Please enter Company Name and CIN.', 'warning');
          return;
        }
      }
    }

    if (currentPage === '3') {
      if (!proposedTradeName.trim() || !legalBusinessName.trim() || granteePan.trim().length !== 10 || !applicantName.trim()) {
        showToast('Please fill Proposed Trade Name, Legal Business Name, valid 10-char PAN, and Applicant Name.', 'warning');
        return;
      }
      if (!granteeAddress.trim()) {
        showToast('Please provide complete Applicant / Business Communication Address.', 'warning');
        return;
      }
    }

    if (currentPage === '3B') {
      if (!premisesAddress.trim()) {
        showToast('Please enter complete Principal Place of Business Address.', 'warning');
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

    if (deliveryPreference !== 'digital') {
      if (!shippingAddress.trim() || shippingPincode.replace(/\D/g, '').length !== 6) {
        showToast('Please provide physical courier delivery address and 6-digit pincode.', 'warning');
        return;
      }
      if (shippingPhone.replace(/\D/g, '').length !== 10) {
        showToast('Please provide a valid 10-digit Courier Contact Mobile Number.', 'warning');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const now = new Date();
      const todayISO = now.toISOString().split('T')[0];
      const newOrderId = generateSequentialOrderId();

      const submissionOverview = buildSubmissionOverview({
        orderId: newOrderId,
        requestType: 'NOC Request',
        mainCategory: initialDoc.category || 'Affidavits & Legal Formats',
        subCategory: 'Landlord NOC for GST Registration',
        availableCategories: [
          'Affidavits & Legal Formats',
          'Rent & Property Agreements',
          'Commercial & Business Contracts',
          'Registrations & Tax Filings'
        ],
        availableSubCategories: [
          'Landlord NOC for GST Registration',
          'Commercial Landlord NOC',
          'Residential / Utility NOC'
        ],
        documentTitle: 'Landlord NOC for GST Registration',
        date: now
      });

      const uploadedDocuments: UploadedDocumentPayload[] = [
        physicalStampFile,
        boardResolutionFile,
        signingAuthorityFile,
        utilityDocFile
      ].filter((item): item is UploadedDocumentPayload => Boolean(item));

      const eastBound = formatSingleBoundary(buildingBoundaries.east);
      const westBound = formatSingleBoundary(buildingBoundaries.west);
      const northBound = formatSingleBoundary(buildingBoundaries.north);
      const southBound = formatSingleBoundary(buildingBoundaries.south);

      const stateOptions = STATE_CATEGORIES.map((s) => s.name);
      const stampBorneOptions = [
        'First Party (Landlord / Owner)',
        'Second Party (Applicant / GST Taxpayer)',
        'Shared Equally (50-50 Split)',
        'Custom Split'
      ];

      const sections = [
        {
          pageNumber: 1,
          sectionTitle: 'Premises Type, Jurisdiction & Stamp Duty',
          fields: [
            fieldEntry('Type of Premises', premisesType, false, [
              'Commercial Building / Shop / Office',
              'Industrial Area / Shed / Warehouse',
              'Residential Property used for Business'
            ]),
            fieldEntry('State / Union Territory', selectedState, false, stateOptions),
            fieldEntry('Stamp Paper Procurement Mode', stampProcurementMode === 'estamp' ? 'E-Stamp Paper / Digital Stamp' : 'Physical Stamp Paper (User Upload)', false, ['E-Stamp Paper / Digital Stamp', 'Physical Stamp Paper (User Upload)']),
            fieldEntry('Physical Stamp File', physicalStampFile ? `${physicalStampFile.fileName}` : '', stampProcurementMode !== 'physical_upload'),
            fieldEntry('Stamp Duty Cost Paid By', stampCostBorneBy, false, stampBorneOptions),
            fieldEntry('Custom Stamp Cost Split Details', customSplitText, stampCostBorneBy !== 'Custom Split'),
            fieldEntry('Selected Stamp Paper Value (INR)', `₹${pricing.stamp}`, false, ['₹10', '₹20', '₹50', '₹100', '₹500', '₹1000', 'Custom']),
            fieldEntry('Custom Stamp Input (if Custom selected)', stampValue === -1 ? customStampValue : '', true)
          ]
        },
        {
          pageNumber: 2,
          sectionTitle: '1st Party (Landlord / Property Owner)',
          fields: [
            fieldEntry('Landlord Standing & Entity Type', ownershipStatus, false, [
              'Sole Owner',
              'Co-Owner / Joint Owner',
              'Authorized Director / Partner / Trustee'
            ]),
            fieldEntry('Landlord Full Legal Name', landlordName, false),
            fieldEntry("Father's / Husband's Name", landlordFatherName, false),
            fieldEntry('Landlord Residential / Registered Address', landlordAddress, false),
            fieldEntry('Landlord PAN Card', landlordPan, false),
            fieldEntry('Aadhaar Number (12 Digits)', landlordAadhaarLast4, true),
            fieldEntry('Active Mobile Number', landlordMobile, false),
            fieldEntry('Email ID', landlordEmail, true),
            fieldEntry('Co-Owners / Joint Owners List', coOwners.length > 0 ? coOwners : '', ownershipStatus !== 'Co-Owner / Joint Owner'),
            fieldEntry('Corporate Company / LLP Name', corpCompanyName, ownershipStatus !== 'Authorized Director / Partner / Trustee'),
            fieldEntry('Corporate CIN / LLPIN', corpCin, ownershipStatus !== 'Authorized Director / Partner / Trustee'),
            fieldEntry('Board Resolution / Authorization Upload', boardResolutionFile ? `${boardResolutionFile.fileName} (${boardResolutionFile.mimeType})` : '', true)
          ]
        },
        {
          pageNumber: 3,
          sectionTitle: '2nd Party (Proposed GST Business Entity)',
          fields: [
            fieldEntry('Constitution of Business', constitutionOfBusiness, false, [
              'Proprietorship',
              'Partnership',
              'Private Limited Company',
              'Limited Liability Partnership',
              'One Person Company',
              'Trust / Society / Club / AOP'
            ]),
            fieldEntry('Proposed Trade Name', proposedTradeName, false),
            fieldEntry('Legal Name (As on PAN)', legalBusinessName, false),
            fieldEntry('Business / Grantee PAN Card', granteePan, false),
            fieldEntry('Applicant Full Name', applicantName, false),
            fieldEntry('Applicant / Business Communication Address', granteeAddress, false),
            fieldEntry('Applicant Signing Authority / ID Proof Upload', signingAuthorityFile ? `${signingAuthorityFile.fileName} (${signingAuthorityFile.mimeType})` : '', true)
          ]
        },
        {
          pageNumber: '3B',
          sectionTitle: 'Principal Place of Business & Utility Proof',
          fields: [
            fieldEntry('Principal Place of Business Address', premisesAddress, false),
            fieldEntry('Municipal Ward / Zone', wardNumber, true),
            fieldEntry('Property Tax / Assessment No.', propertyTaxAssessmentNo, true),
            fieldEntry('East Building Boundary', eastBound, true),
            fieldEntry('West Building Boundary', westBound, true),
            fieldEntry('North Building Boundary', northBound, true),
            fieldEntry('South Building Boundary', southBound, true),
            fieldEntry('Ownership / Utility Document Type', ownershipDocType, false, [
              'Electricity Bill (Not older than 2 months)',
              'Municipal Property Tax Receipt',
              'Registered Sale Deed / Title Deed',
              'Water Bill / Landline Bill'
            ]),
            fieldEntry('Supporting Utility / Ownership File', utilityDocFile ? `${utilityDocFile.fileName} (${utilityDocFile.mimeType})` : '', true),
            fieldEntry('Owner Name Printed on Utility Bill / Deed', docOwnerNameString, true)
          ]
        },
        {
          pageNumber: 4,
          sectionTitle: 'Statutory GST Compliance & Custom Clauses',
          fields: [
            checkboxEntry('Physical Verification by GST Officer (Rule 9)', clauseRule9Physical, true),
            checkboxEntry('Display of GSTIN Signboard (Rule 18)', clauseRule18Banner, true),
            checkboxEntry('Maintenance of Books of Accounts (Section 35)', clauseSec35Books, true),
            checkboxEntry('Tax Liability Indemnity Clause', clauseTaxIndemnity, true),
            checkboxEntry('Sub-meter / Utility Consent Clause', clauseSubmeterConsent, true),
            fieldEntry('Custom Operational Clauses', customGstClauses.length > 0 ? customGstClauses : '', true)
          ]
        },
        {
          pageNumber: 5,
          sectionTitle: 'Delivery Mode, Courier Address & Fee Breakdown',
          fields: [
            fieldEntry('Delivery & Execution Preference', deliveryPreference, false, ['digital', 'physical', 'hybrid']),
            fieldEntry('Courier Shipping Address', shippingAddress, deliveryPreference === 'digital'),
            fieldEntry('Courier Delivery PIN Code', shippingPincode, deliveryPreference === 'digital'),
            fieldEntry('Courier Contact Mobile Number', shippingPhone, deliveryPreference === 'digital'),
            fieldEntry('Total Payable Fee (Pay After Delivery)', `₹${pricing.totalPayable}`, false)
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
        docTitle: 'Landlord NOC for GST Registration',
        category: initialDoc.category,
        premisesType,
        state: selectedState,
        stampProcurementMode,
        physicalStampFile,
        stampCostBorneBy: stampCostBorneBy === 'Custom Split' ? customSplitText : stampCostBorneBy,
        stampDutyAmount: pricing.stamp,
        landlord: {
          name: landlordName,
          fatherName: landlordFatherName,
          address: landlordAddress,
          ownershipStatus,
          pan: landlordPan,
          aadhaar: landlordAadhaarLast4,
          mobile: landlordMobile,
          email: landlordEmail,
          coOwners,
          corpCompanyName: corpCompanyName || '',
          corpCin: corpCin || '',
          boardResolutionUploaded,
          boardResolutionFile
        },
        premises: {
          address: premisesAddress,
          wardNumber,
          propertyTaxAssessmentNo,
          boundaries: { eastBound, westBound, northBound, southBound, structured: buildingBoundaries },
          ownershipDocType,
          utilityDocUploaded,
          utilityDocFile,
          docOwnerNameString
        },
        trade: {
          proposedTradeName,
          legalBusinessName,
          constitutionOfBusiness,
          granteePan,
          applicantName,
          address: granteeAddress,
          signingAuthorityUploaded,
          signingAuthorityFile
        },
        clauses: {
          clauseRule9Physical,
          clauseRule18Banner,
          clauseSec35Books,
          clauseTaxIndemnity,
          clauseSubmeterConsent,
          customGstClauses
        },
        delivery: {
          deliveryPreference,
          shippingAddress: deliveryPreference !== 'digital' ? shippingAddress : '',
          pincode: deliveryPreference !== 'digital' ? shippingPincode : '',
          shippingPhone: deliveryPreference !== 'digital' ? shippingPhone : ''
        },
        sections,
        uploadedDocuments,
        photoUrl: uploadedDocuments[0]?.dataUrl || undefined,
        pricing,
        timestamp: now.toISOString()
      };

      // 2. Client-Side AES-256 + HMAC-SHA256
      const encResult = encryptFormDataAndSign(sensitiveData);
      const { encryptedPayload, signature, websiteBUrl } = encResult;

      // 3. Save ONLY 4 lightweight metadata fields to Supabase
      const metadata = {
        firstPartyName: applicantName || landlordName || 'Applicant',
        formName: 'Landlord NOC for GST Registration',
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
              Zero-database compliance: Sensitive GST NOC details have been encrypted in browser using AES-256. Only lightweight audit metadata was saved to Supabase.
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
              <span className="text-slate-500">Proposed Trade Name:</span>
              <span className="font-bold text-slate-900">{proposedTradeName}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200/80 pb-2">
              <span className="text-slate-500">State / Jurisdiction:</span>
              <span className="font-bold text-slate-900">{submittedOrder.state}</span>
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

        {activeTab === 'form' && (
          <div className="w-full bg-slate-200 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-[#15803d] h-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
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

        <FormRequestTabBar
          activeTab={activeTab}
          onChangeTab={setActiveTab}
          className="mt-4"
        />
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
        {/* ================= PAGE 1 ================= */}
        {currentPage === '1' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Type of Premises */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Type of Premises <span className="text-red-500">*</span>
              </label>
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
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                State / Union Territory (36 States/UTs) <span className="text-red-500">*</span>
              </label>
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



            {/* Stamp Paper Procurement Mode (Identical to 11 Month Rent Agreement) */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-2">
                Stamp Paper Procurement Mode <span className="text-red-500 font-bold">*</span>
              </label>

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
                          onChange={(e) => handleRealFileSelect(e, 'Pre-Purchased Physical Stamp Paper', setPhysicalStampFile)}
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
                    <strong>Warning:</strong> Per {selectedState} statutory regulations, the recommended minimum stamp duty is <strong>₹{recommendedStamp}</strong>. GST authorities may issue a clarification notice if stamp paper value is below state minimum.
                  </span>
                </div>
              )}
            </div>

            {/* Stamp Duty Cost Paid By */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Stamp Duty Cost Paid By <span className="text-red-500 font-bold">*</span>
              </label>

              <select
                value={stampCostBorneBy}
                onChange={(e) => setStampCostBorneBy(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="First Party (Landlord / Owner)">First Party (Landlord / Owner)</option>
                <option value="Second Party (Business Owner / Grantee)">Second Party (Business Owner / Grantee)</option>
                <option value="Shared Equally (50-50 Split)">Shared Equally (50-50 Split)</option>
                <option value="Custom Split">Custom Ratio or Fixed Amount Split</option>
              </select>

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

        {/* ================= PAGE 2: LANDLORD TAX IDENTITY ================= */}
        {currentPage === '2' && (
          <div className="space-y-4 animate-fadeIn">
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
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Landlord Standing &amp; Entity Type <span className="text-red-500">*</span>
              </label>
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
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Landlord Full Legal Name <span className="text-red-500">*</span>
                </label>
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
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Father's / Husband's Name <span className="text-red-500">*</span>
                </label>
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
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Landlord PAN Card <span className="text-red-500">*</span>
                </label>
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
                <AadhaarInput
                  value={landlordAadhaarLast4}
                  onChange={(val) => setLandlordAadhaarLast4(val)}
                  required
                  label="Aadhaar Number (12 Digits)"
                  placeholder={showExample ? "1234 - 5678 - 9012" : "12-digit Aadhaar number"}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Active Mobile Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  inputMode="numeric"
                  required
                  maxLength={10}
                  value={landlordMobile}
                  onChange={(e) => setLandlordMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder={showExample ? "9876543210" : ""}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email ID <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="email"
                  value={landlordEmail}
                  onChange={(e) => setLandlordEmail(e.target.value)}
                  placeholder={showExample ? "owner@example.com" : ""}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            <AddressFieldGroup
              label="Landlord Residential / Registered Address"
              variant="standard"
              value={landlordAddress}
              onChangeAddress={(addr) => setLandlordAddress(addr)}
              required
            />

            {/* Co-Owner Joint Landlords Extension */}
            {ownershipStatus === 'Co-Owner / Joint Owner' && (
              <div className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-xl animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">
                    Joint Property Co-Owners (Optional)
                  </span>
                  <button
                    type="button"
                    onClick={addCoOwner}
                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-800 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Co-Owner</span>
                  </button>
                </div>

                {coOwners.map((co, idx) => (
                  <div key={co.id} className="p-3 bg-white border border-slate-200 rounded-xl space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-600">Co-Owner #{idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeCoOwner(co.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                          Co-Owner Full Name
                        </label>
                        <input
                          type="text"
                          value={co.name}
                          onChange={(e) => updateCoOwner(co.id, 'name', e.target.value)}
                          placeholder={showExample ? "e.g. Sunita Verma" : ""}
                          className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                          PAN Card Number
                        </label>
                        <input
                          type="text"
                          maxLength={10}
                          value={co.pan}
                          onChange={(e) => updateCoOwner(co.id, 'pan', e.target.value.toUpperCase())}
                          placeholder={showExample ? "ABCDE1234F" : ""}
                          className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono uppercase text-slate-900"
                        />
                      </div>
                      <div>
                        <AadhaarInput
                          value={co.aadhaarLast4}
                          onChange={(val) => updateCoOwner(co.id, 'aadhaarLast4', val)}
                          label="Aadhaar Number (12 Digits)"
                          placeholder={showExample ? "1234 - 5678 - 9012" : "12-digit Aadhaar number"}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

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

                <div className="pt-2 border-t border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-800">
                      Board Resolution / Authorization Letter <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <span className="text-[11px] text-slate-500 block">
                      {boardResolutionFile
                        ? `Attached: ${boardResolutionFile.fileName} (${Math.max(1, Math.round(boardResolutionFile.sizeBytes / 1024))} KB)`
                        : 'Attach signed corporate authorization (PDF/JPG/PNG)'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer shadow-xs transition-all">
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>{boardResolutionFile ? 'Change File' : 'Upload File'}</span>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => handleRealFileSelect(e, 'Corporate Board Resolution', setBoardResolutionFile)}
                        className="sr-only"
                      />
                    </label>
                    {boardResolutionFile && (
                      <button
                        type="button"
                        onClick={() => setBoardResolutionFile(null)}
                        className="px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white text-slate-600 hover:text-rose-600 text-xs font-semibold cursor-pointer"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= PAGE 3: THE GRANTEE - PROPOSED GST ENTITY ================= */}
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
                Constitution of Business <span className="text-red-500">*</span>
              </label>
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
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Proposed Trade Name <span className="text-red-500">*</span>
                </label>
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
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Legal Name (As on PAN) <span className="text-red-500">*</span>
                </label>
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
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  PAN Card <span className="text-red-500">*</span>
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

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Applicant Full Name <span className="text-red-500">*</span>
                </label>
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

            <AddressFieldGroup
              label="Applicant / Business Communication Address"
              variant="standard"
              value={granteeAddress}
              onChangeAddress={(addr) => setGranteeAddress(addr)}
              required
            />

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-800">
                  Applicant Signing Authority / Authorization Proof <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <span className="text-[11px] text-slate-500 block">
                  {signingAuthorityFile
                    ? `Attached: ${signingAuthorityFile.fileName} (${Math.max(1, Math.round(signingAuthorityFile.sizeBytes / 1024))} KB)`
                    : 'Upload Partnership Deed, Authorization Letter, or ID Proof (PDF/JPG/PNG)'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <label className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer shadow-xs transition-all">
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>{signingAuthorityFile ? 'Change File' : 'Upload File'}</span>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handleRealFileSelect(e, 'Applicant Signing Authority Proof', setSigningAuthorityFile)}
                    className="sr-only"
                  />
                </label>
                {signingAuthorityFile && (
                  <button
                    type="button"
                    onClick={() => setSigningAuthorityFile(null)}
                    className="px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white text-slate-600 hover:text-rose-600 text-xs font-semibold cursor-pointer"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================= PAGE 3B: PRINCIPAL PLACE OF BUSINESS & UTILITY DOCUMENT ================= */}
        {currentPage === '3B' && (
          <div className="space-y-4 animate-fadeIn">
            <AddressFieldGroup
              label="Principal Place of Business Address"
              variant="property"
              value={premisesAddress}
              onChangeAddress={(addr) => setPremisesAddress(addr)}
              required
            />

            {/* Collapsible Optional Details (Ward, Property Tax No., Building Boundaries) */}
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
                <div className="p-4 pt-2 border-t border-slate-200 space-y-4 bg-slate-50/50 animate-fadeIn">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Municipal Ward / Zone <span className="text-slate-400 font-normal">(Optional)</span>
                      </label>
                      <input
                        type="text"
                        value={wardNumber}
                        onChange={(e) => setWardNumber(e.target.value)}
                        placeholder={showExample ? "e.g. Ward 24, Zone 3" : ""}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Property Tax / Assessment No. <span className="text-slate-400 font-normal">(Optional)</span>
                      </label>
                      <input
                        type="text"
                        value={propertyTaxAssessmentNo}
                        onChange={(e) => setPropertyTaxAssessmentNo(e.target.value)}
                        placeholder={showExample ? "e.g. TAX/2023/88910" : ""}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                  </div>

                  <PropertyBoundariesSection
                    title="Building Boundaries"
                    value={buildingBoundaries}
                    onChange={setBuildingBoundaries}
                  />
                </div>
              )}
            </div>

            {/* Utility Document Upload (Electricity Bill not older than 2 months) */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 pt-3">
              <div>
                <label className="text-xs font-bold text-slate-900 block">
                  Upload Supporting Ownership / Utility Document <span className="text-red-500">*</span>
                </label>
                <span className="text-[11px] text-slate-500">
                  GST Rule 9 mandates an electricity bill, municipal tax receipt, or property deed
                </span>
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
                    {utilityDocFile
                      ? `Attached: ${utilityDocFile.fileName} (${Math.max(1, Math.round(utilityDocFile.sizeBytes / 1024))} KB)`
                      : 'Attach Scanned File (PDF/JPG/PNG)'}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    File must be clear and legible for GST officer audit
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <label className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                    utilityDocFile
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                      : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                  }`}>
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>{utilityDocFile ? 'Change File' : 'Upload Document'}</span>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => handleRealFileSelect(e, ownershipDocType || 'Supporting Utility Document', setUtilityDocFile)}
                      className="sr-only"
                    />
                  </label>
                  {utilityDocFile && (
                    <button
                      type="button"
                      onClick={() => setUtilityDocFile(null)}
                      className="px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white text-slate-600 hover:text-rose-600 text-xs font-semibold cursor-pointer"
                    >
                      Remove
                    </button>
                  )}
                </div>
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
                  <strong>Physical Verification by GST Officer (Rule 9):</strong> Landlord has no objection to physical inspection or verification of the premises by GST authorities.
                </span>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={clauseRule18Banner}
                  onChange={(e) => setClauseRule18Banner(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-xs text-slate-700">
                  <strong>Display of GSTIN Signboard (Rule 18):</strong> Full consent to display the business name and 15-digit GSTIN on the entrance signboard.
                </span>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={clauseSec35Books}
                  onChange={(e) => setClauseSec35Books(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-xs text-slate-700">
                  <strong>Maintenance of Books of Accounts (Section 35):</strong> Consent to keep business accounting records, invoices, and ledgers at these premises.
                </span>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={clauseTaxIndemnity}
                  onChange={(e) => setClauseTaxIndemnity(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-xs text-slate-700">
                  <strong>Tax Liability Indemnity:</strong> All commercial taxes, GST liabilities, and penalties remain solely with the tenant/grantee, not the property owner.
                </span>
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
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-2">
                Delivery &amp; Execution Preference
              </span>

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
              <div className="space-y-3 animate-fadeIn">
                <AddressFieldGroup
                  label="Courier Shipping Address"
                  variant="standard"
                  defaultState={selectedState}
                  value={shippingAddress}
                  onChangeAddress={(fullAddr, details) => {
                    setShippingAddress(fullAddr);
                    if (details?.pincode !== undefined) {
                      setShippingPincode(details.pincode);
                    }
                  }}
                  required
                />
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Courier Contact Mobile Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    required
                    value={shippingPhone}
                    onChange={(e) => setShippingPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder={showExample ? "9876543210" : ""}
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
              <span>Next</span>
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
      )}
      </HorizontalSwipeContainer>
    </div>
  );
};
