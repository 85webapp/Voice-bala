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
  ChevronRight,
  Volume2,
  VolumeX,
  Play,
  Square
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { LegalDocument, OrderItem } from '../types';
import { STATE_CATEGORIES, getSafeStampDuty, isUnilateralDocument } from '../data/stampDutyMatrix';
import { getDocumentConfig, CustomKeyValueTerm } from '../data/documentFormConfigs';
import { INITIAL_FRONT_DOCUMENTS } from '../data/documentsData';
import { getDocumentIdRule } from '../data/documentIdRequirements';
import { DateOfBirthPicker } from './DateOfBirthPicker';
import { useExampleDetails } from '../hooks/useExampleDetails';
import {
  SupportedLanguage,
  SUPPORTED_LANGUAGES,
  speechController,
  getStoredAudioLanguage,
  setStoredAudioLanguage,
  fetchPageExplanation,
  fetchFieldExplanation,
  getVisibleFormLabels
} from '../data/voiceNarrationData';
import { AadhaarInput } from './AadhaarInput';
import { AddressFieldGroup } from './AddressFieldGroup';
import {
  encryptFormDataAndSign,
  saveLightweightMetadata,
  postEncryptedPayloadToWebsiteB,
  playConfirmationChime
} from '../services/encryptionService';
import { ExternalLink, Lock } from 'lucide-react';

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
  // Current document selection (can be swapped via Page 1 dropdown)
  const [selectedDocTitle, setSelectedDocTitle] = useState(initialDoc.title);

  // Configuration for currently selected document
  const docConfig = useMemo(() => {
    return getDocumentConfig(selectedDocTitle);
  }, [selectedDocTitle]);

  const isUnilateral = useMemo(() => {
    return isUnilateralDocument(selectedDocTitle) || docConfig.isUnilateral;
  }, [selectedDocTitle, docConfig]);

  // Page index (1 to 5). If isUnilateral, step 3 is skipped
  const [currentPage, setCurrentPage] = useState<number>(1);
  const totalPages = isUnilateral ? 4 : 5; // User UI shows Page X of 5, or adjusts cleanly

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
  }, [currentPage, selectedDocTitle]);

  const activeLangConfig = useMemo(() => {
    return SUPPORTED_LANGUAGES.find((l) => l.code === selectedLang) || SUPPORTED_LANGUAGES[0];
  }, [selectedLang]);

  const handlePlayPageSpeech = async () => {
    if (isAudioPlaying) {
      speechController.stop();
      return;
    }

    const explanation = await fetchPageExplanation(
      selectedDocTitle,
      currentPage,
      getStepTitle(),
      getVisibleFormLabels(),
      selectedLang
    );

    if (explanation) speechController.speak(explanation, activeLangConfig.speechCode);
  };

  useEffect(() => {
    const wizardRoot = document.querySelector<HTMLElement>('[data-document-wizard]');
    if (!wizardRoot) return;

    const attachFieldSpeakers = () => {
      wizardRoot.querySelectorAll<HTMLLabelElement>('label').forEach((label) => {
        if (label.querySelector('[data-field-speaker]')) return;
        const control = label.control || (label.nextElementSibling?.matches('input,select,textarea') && label.nextElementSibling)
          || label.parentElement?.querySelector('input,select,textarea');
        if (!(control instanceof HTMLInputElement || control instanceof HTMLSelectElement || control instanceof HTMLTextAreaElement)) return;
        if (control instanceof HTMLInputElement && ['checkbox', 'radio', 'hidden', 'submit'].includes(control.type)) return;

        const fieldLabel = label.textContent?.replace(/\s+/g, ' ').trim() || control.getAttribute('aria-label') || control.getAttribute('placeholder') || 'This field';
        const button = document.createElement('button');
        button.type = 'button';
        button.dataset.fieldSpeaker = 'true';
        button.className = 'ml-1 inline-flex align-middle items-center justify-center rounded-full p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 cursor-pointer';
        button.setAttribute('aria-label', `Explain ${fieldLabel}`);
        button.title = `Explain ${fieldLabel}`;
        button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-3.5 h-3.5" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>';
        button.addEventListener('click', (event) => {
          event.preventDefault();
          event.stopPropagation();
          void (async () => {
            try {
              const context = getVisibleFormLabels().filter((text) => !text.startsWith('Explain ')).join('; ');
              const explanation = await fetchFieldExplanation(selectedDocTitle, control.name || control.id || fieldLabel, fieldLabel, context, selectedLang);
              if (explanation) speechController.speak(explanation, activeLangConfig.speechCode);
            } catch (error) {
              console.warn('Field explanation failed:', error);
            }
          })();
        });
        label.append(button);
      });
    };

    attachFieldSpeakers();
    const observer = new MutationObserver(attachFieldSpeakers);
    observer.observe(wizardRoot, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      wizardRoot.querySelectorAll('[data-field-speaker]').forEach((btn) => {
        try { btn.remove(); } catch {}
      });
    };
  }, [selectedDocTitle, selectedLang, activeLangConfig.speechCode]);

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

  // Master Statutory ID Requirements (PAN & Aadhaar) for current document
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
  const [firstPartyName, setFirstPartyName] = useState('');
  const [firstPartySignatory, setFirstPartySignatory] = useState('');
  const [firstPartyDesignation, setFirstPartyDesignation] = useState('Authorized Signatory');
  const [firstPartyCustomDesignation, setFirstPartyCustomDesignation] = useState('');
  const [firstPartyFatherName, setFirstPartyFatherName] = useState('');
  const [firstPartyAgeOrIncDate, setFirstPartyAgeOrIncDate] = useState('');
  const [firstPartyAddress, setFirstPartyAddress] = useState('');
  const [firstPartyAadhaarLast4, setFirstPartyAadhaarLast4] = useState('');
  const [firstPartyMobile, setFirstPartyMobile] = useState('');
  const [firstPartyPan, setFirstPartyPan] = useState('');

  // --- PAGE 3: Second Party Details (Bilateral only) ---
  const [secondPartyEntityType, setSecondPartyEntityType] = useState<'Individual' | 'Company'>('Individual');
  const [secondPartyName, setSecondPartyName] = useState('');
  const [secondPartySignatory, setSecondPartySignatory] = useState('');
  const [secondPartyDesignation, setSecondPartyDesignation] = useState('Authorized Signatory');
  const [secondPartyCustomDesignation, setSecondPartyCustomDesignation] = useState('');
  const [secondPartyFatherName, setSecondPartyFatherName] = useState('');
  const [secondPartyAgeOrIncDate, setSecondPartyAgeOrIncDate] = useState('');
  const [secondPartyAddress, setSecondPartyAddress] = useState('');
  const [secondPartyAadhaarLast4, setSecondPartyAadhaarLast4] = useState('');
  const [secondPartyMobile, setSecondPartyMobile] = useState('');
  const [secondPartyPan, setSecondPartyPan] = useState('');

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
  const [w1Address, setW1Address] = useState('');
  const [w1Mobile, setW1Mobile] = useState('');
  const [w1Age, setW1Age] = useState('');
  const [w1AadhaarLast4, setW1AadhaarLast4] = useState('');

  // Witness 2
  const [w2Name, setW2Name] = useState('');
  const [w2FatherName, setW2FatherName] = useState('');
  const [w2Address, setW2Address] = useState('');
  const [w2Mobile, setW2Mobile] = useState('');
  const [w2Age, setW2Age] = useState('');
  const [w2AadhaarLast4, setW2AadhaarLast4] = useState('');

  // Delivery preference: 'digital' | 'physical'
  const [deliveryType, setDeliveryType] = useState<'digital' | 'physical'>('digital');
  // Physical courier address
  const [shippingAddress, setShippingAddress] = useState('');
  const [shippingPincode, setShippingPincode] = useState('');
  const [shippingRecipientName, setShippingRecipientName] = useState('');
  const [shippingPhone, setShippingPhone] = useState('');

  // 5 Legal Declaration Checkboxes
  const [declarations, setDeclarations] = useState<boolean[]>([false, false, false, false, false]);
  const [isSpeakingDeclarations, setIsSpeakingDeclarations] = useState(false);

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
  const [redirectCountdown, setRedirectCountdown] = useState<number>(5);

  useEffect(() => {
    if (!submissionSecurityDetails) return;
    const timer = setInterval(() => {
      setRedirectCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          window.location.href = submissionSecurityDetails.websiteBUrl;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [submissionSecurityDetails]);

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
      "कानूनी घोषणाएँ:",
      "पहला: मैंने दस्तावेज़ के सभी नियम व शर्तें ध्यानपूर्वक पढ़ ली हैं और मैं इनसे सहमत हूँ।",
      "दूसरा: प्रस्तुत की गई दोनों पक्षों और गवाहों की व्यक्तिगत पहचान व पते की जानकारी पूर्णतः सत्य और प्रामाणिक है।",
      "तीसरा: इस विलेख का निष्पादन बिना किसी दबाव, कपट अथवा अनुचित प्रभाव के स्वतंत्र सहमति से किया जा रहा है।",
      "चौथा: संबंधित राज्य सरकार की स्टाम्प ड्यूटी एवं ई-हस्ताक्षर नियमों के अनुपालन की पूरी ज़िम्मेदारी मेरी है।",
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
    if (pageNumber === 1) {
      if (!selectedDocTitle.trim() || !selectedState.trim()) {
        alert('Please confirm document type and state.');
        return false;
      }
      return true;
    }

    if (pageNumber === 2) {
      if (!firstPartyName.trim()) {
        alert('Please enter Full Legal Name for First Party.');
        return false;
      }
      if (!firstPartyAddress.trim()) {
        alert('Please enter Address for First Party.');
        return false;
      }
      if (!firstPartyMobile.trim()) {
        alert('Please enter Mobile Number (Aadhaar linked) for First Party.');
        return false;
      }
      if (docIdRule.pan === 'mandatory') {
        if (!firstPartyPan.trim() || firstPartyPan.trim().length !== 10) {
          alert(`PAN Card is Mandatory for ${selectedDocTitle}. Please enter a valid 10-character PAN.`);
          return false;
        }
      }
      if (docIdRule.aadhaar === 'mandatory') {
        const cleanAadhaar = firstPartyAadhaarLast4.replace(/\D/g, '');
        if (!cleanAadhaar || cleanAadhaar.length < 4) {
          alert(`Aadhaar Card is Mandatory for ${selectedDocTitle}. Please enter a valid Aadhaar number.`);
          return false;
        }
      }
      return true;
    }

    if (pageNumber === 3) {
      if (!isUnilateral) {
        if (!secondPartyName.trim()) {
          alert('Please enter Full Legal Name for Second Party.');
          return false;
        }
        if (!secondPartyAddress.trim()) {
          alert('Please enter Address for Second Party.');
          return false;
        }
        if (!secondPartyMobile.trim()) {
          alert('Please enter Mobile Number for Second Party.');
          return false;
        }
        if (docIdRule.pan === 'mandatory') {
          if (!secondPartyPan.trim() || secondPartyPan.trim().length !== 10) {
            alert(`PAN Card is Mandatory for ${selectedDocTitle}. Please enter Second Party 10-character PAN.`);
            return false;
          }
        }
        if (docIdRule.aadhaar === 'mandatory') {
          const cleanAadhaar = secondPartyAadhaarLast4.replace(/\D/g, '');
          if (!cleanAadhaar || cleanAadhaar.length < 4) {
            alert(`Aadhaar Card is Mandatory for ${selectedDocTitle}. Please enter Second Party Aadhaar number.`);
            return false;
          }
        }
      }
      return true;
    }

    if (pageNumber === 4) {
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

    if (!w1Name.trim() || !w1Mobile.trim()) {
      alert('Please fill at least Witness 1 Name and Mobile Number.');
      return;
    }

    if (deliveryType === 'physical') {
      if (!shippingAddress.trim() || !shippingPincode.trim() || !shippingPhone.trim()) {
        alert('Please enter complete Physical Courier Shipping Address, Pincode, and Contact Number.');
        return;
      }
    }

    // Verify all 5 declarations
    if (declarations.some((val) => !val)) {
      alert('कृपया आगे बढ़ने के लिए सभी 5 कानूनी घोषणाओं (Declarations) को स्वीकार करें।');
      return;
    }

    if (!intermediaryDisclaimerAccepted) {
      alert('Please accept the Cotex Compliance intermediary verification checkbox before proceeding.');
      return;
    }

    setIsSubmitting(true);

    try {
      const todayISO = new Date().toISOString().split('T')[0];
      const newOrderId = `CTC-${Math.floor(100000 + Math.random() * 900000)}`;

      // 1. Gather complete sensitive details for zero-database encryption
      const sensitivePayload = {
        orderId: newOrderId,
        docTitle: selectedDocTitle,
        state: selectedState,
        firstParty: {
          entityType: firstPartyEntityType,
          name: firstPartyName,
          signatory: firstPartySignatory,
          designation: firstPartyDesignation === 'Other' ? firstPartyCustomDesignation : firstPartyDesignation,
          fatherName: firstPartyFatherName,
          ageOrIncDate: firstPartyAgeOrIncDate,
          address: firstPartyAddress,
          aadhaar: firstPartyAadhaarLast4,
          mobile: firstPartyMobile,
          pan: firstPartyPan
        },
        secondParty: isUnilateral ? null : {
          entityType: secondPartyEntityType,
          name: secondPartyName,
          signatory: secondPartySignatory,
          designation: secondPartyDesignation === 'Other' ? secondPartyCustomDesignation : secondPartyDesignation,
          fatherName: secondPartyFatherName,
          ageOrIncDate: secondPartyAgeOrIncDate,
          address: secondPartyAddress,
          aadhaar: secondPartyAadhaarLast4,
          mobile: secondPartyMobile,
          pan: secondPartyPan
        },
        witnesses: [
          { name: w1Name, fatherName: w1FatherName, address: w1Address, mobile: w1Mobile, age: w1Age },
          { name: w2Name, fatherName: w2FatherName, address: w2Address, mobile: w2Mobile, age: w2Age }
        ],
        pricing,
        delivery: {
          type: deliveryType,
          shippingAddress: deliveryType === 'physical' ? shippingAddress : undefined,
          pincode: deliveryType === 'physical' ? shippingPincode : undefined,
          shippingPhone: deliveryType === 'physical' ? shippingPhone : undefined
        },
        customTerms,
        timestamp: new Date().toISOString()
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

      // 4. Directly POST encrypted ciphertext & HMAC signature to Website B API
      await postEncryptedPayloadToWebsiteB(encResult, metadata);

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

          {/* Website B Automatic Redirection Card */}
          {submissionSecurityDetails && (
            <div className="bg-emerald-50/70 border-2 border-[#15803d]/30 rounded-2xl p-4 sm:p-5 text-left space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#15803d] animate-pulse"></span>
                  Website B Production Redirection
                </span>
                <span className="text-xs font-bold text-[#15803d] bg-white px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Redirecting in {redirectCountdown}s
                </span>
              </div>
              <p className="text-xs text-slate-600">
                Encrypted payload &amp; HMAC signature ready for transmission. Proceeding to:
              </p>
              <div className="p-2.5 bg-white border border-slate-200 rounded-xl font-mono text-[11px] text-slate-700 break-all select-all">
                {submissionSecurityDetails.websiteBUrl}
              </div>
              <div className="pt-1">
                <a
                  href={submissionSecurityDetails.websiteBUrl}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 bg-[#15803d] hover:bg-[#166534] text-white font-bold text-sm rounded-xl shadow-md transition-all cursor-pointer"
                >
                  <span>Proceed to Website B Immediately</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          )}

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
            style={{
              width: `${(currentPage / 5) * 100}%`
            }}
          />
        </div>

        {/* Title Header */}
        <div className="mt-4">
          <h1 className="text-2xl sm:text-3xl font-black text-black">
            {selectedDocTitle}
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
              Listen to AI audio guidance for this section
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

      {/* Main Wizard Form Container */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-5 sm:p-7">
        {/* ================= PAGE 1 ================= */}
        {currentPage === 1 && (
          <div className="space-y-6 animate-fadeIn">

            {/* Document Type Dropdown (Auto-selected, selectable) */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Type of Document <span className="text-red-500 font-bold">*</span>
              </label>
              <select
                value={selectedDocTitle}
                onChange={(e) => setSelectedDocTitle(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-black focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                {INITIAL_FRONT_DOCUMENTS.map((doc) => (
                  <option key={doc.id} value={doc.title}>
                    {doc.title}
                  </option>
                ))}
              </select>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Auto-selected from your previous click. You can switch to any agreement or affidavit.
              </span>
            </div>

            {/* State Selection Dropdown: Exactly 3 categorized tiers */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                State / Union Territory Selection <span className="text-red-500 font-bold">*</span>
              </label>
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-black focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <optgroup label="1. Online Purchase & Download Available (Plain Text)">
                  {STATE_CATEGORIES.filter((s) => s.category === 'online_download').map((s) => (
                    <option key={s.name} value={s.name}>
                      {s.label}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="2. Online Purchase Available, Download Not Available (🔵 Blue Dot)">
                  {STATE_CATEGORIES.filter((s) => s.category === 'online_nodownload').map((s) => (
                    <option key={s.name} value={s.name}>
                      {s.label}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="3. Neither Online Purchase nor Download Available (⭐ Star)">
                  {STATE_CATEGORIES.filter((s) => s.category === 'offline_only').map((s) => (
                    <option key={s.name} value={s.name}>
                      {s.label}
                    </option>
                  ))}
                </optgroup>
              </select>
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
              <select
                value={paidBy}
                onChange={(e) => setPaidBy(e.target.value as any)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="First Party">First Party ({docConfig.firstPartyRole})</option>
                {!isUnilateral && (
                  <>
                    <option value="Second Party">Second Party ({docConfig.secondPartyRole})</option>
                    <option value="50-50%">50-50% Shared Equally</option>
                  </>
                )}
              </select>
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

            {/* Full Legal Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {firstPartyEntityType === 'Company' ? 'Registered Company / Firm Name' : 'Full Legal Name'} <span className="text-red-500 font-bold">*</span>
              </label>
              <input
                type="text"
                required
                value={firstPartyName}
                onChange={(e) => setFirstPartyName(e.target.value)}
                placeholder={getPlaceholder(firstPartyEntityType === 'Company' ? 'e.g. Acme Media Private Limited' : 'e.g. Ramesh Kumar Sharma')}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            {/* Authorized Signatory (If Company) */}
            {firstPartyEntityType === 'Company' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Authorized Signatory Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={firstPartySignatory}
                    onChange={(e) => setFirstPartySignatory(e.target.value)}
                    placeholder={getPlaceholder('e.g. Vikram Malhotra')}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Signatory Designation <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={firstPartyDesignation}
                    onChange={(e) => setFirstPartyDesignation(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    {STANDARD_DESIGNATIONS.map((desig) => (
                      <option key={desig} value={desig}>{desig}</option>
                    ))}
                  </select>
                  {firstPartyDesignation === 'Other' && (
                    <input
                      type="text"
                      value={firstPartyCustomDesignation}
                      onChange={(e) => setFirstPartyCustomDesignation(e.target.value)}
                      placeholder={getPlaceholder('Specify Designation')}
                      className="mt-2 w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                    />
                  )}
                </div>
              </div>
            )}

            {/* Father's / Husband's Name & Age / DOB Picker */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Father's / Husband's Name {firstPartyEntityType === 'Individual' ? <span className="text-red-500">*</span> : <span className="text-slate-400 font-normal">(Optional)</span>}
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
                  label={firstPartyEntityType === 'Company' ? 'Date of Incorporation' : 'Age / Date of Birth'}
                  value={firstPartyAgeOrIncDate}
                  onChange={setFirstPartyAgeOrIncDate}
                  required={true}
                  placeholder="DD/MM/YYYY"
                  helperText={showExampleDetails ? "Format: DD/MM/YYYY" : undefined}
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

            {/* Aadhaar (12-Digit Seamless), Mobile, PAN */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <AadhaarInput
                  label="Aadhaar Card Number"
                  value={firstPartyAadhaarLast4}
                  onChange={setFirstPartyAadhaarLast4}
                  required={docIdRule.aadhaar === 'mandatory'}
                  helperText="12-digit number"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mobile (Aadhaar Linked) <span className="text-red-500 font-bold">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={firstPartyMobile}
                  onChange={(e) => setFirstPartyMobile(e.target.value)}
                  placeholder={getPlaceholder('+91 98765 43210')}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  PAN Number {docIdRule.pan === 'mandatory' ? <span className="text-red-500 font-bold">*</span> : docIdRule.pan === 'optional' ? <span className="text-slate-400 font-normal">(Optional)</span> : <span className="text-slate-400 font-normal">(N/A)</span>}
                </label>
                <input
                  type="text"
                  required={docIdRule.pan === 'mandatory'}
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

            {/* Full Legal Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {secondPartyEntityType === 'Company' ? 'Registered Company / Firm Name' : 'Full Legal Name'} <span className="text-red-500 font-bold">*</span>
              </label>
              <input
                type="text"
                required
                value={secondPartyName}
                onChange={(e) => setSecondPartyName(e.target.value)}
                placeholder={getPlaceholder(secondPartyEntityType === 'Company' ? 'e.g. Zenith Tech Solutions LLP' : 'e.g. Priya Sharma')}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            {/* Authorized Signatory (If Company) */}
            {secondPartyEntityType === 'Company' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Authorized Signatory Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={secondPartySignatory}
                    onChange={(e) => setSecondPartySignatory(e.target.value)}
                    placeholder={getPlaceholder('e.g. Amit Kapoor')}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Signatory Designation <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={secondPartyDesignation}
                    onChange={(e) => setSecondPartyDesignation(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    {STANDARD_DESIGNATIONS.map((desig) => (
                      <option key={desig} value={desig}>{desig}</option>
                    ))}
                  </select>
                  {secondPartyDesignation === 'Other' && (
                    <input
                      type="text"
                      value={secondPartyCustomDesignation}
                      onChange={(e) => setSecondPartyCustomDesignation(e.target.value)}
                      placeholder={getPlaceholder('Specify Designation')}
                      className="mt-2 w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                    />
                  )}
                </div>
              </div>
            )}

            {/* Father's / Husband's Name & Age / DOB Picker */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Father's / Husband's Name {secondPartyEntityType === 'Individual' ? <span className="text-red-500">*</span> : <span className="text-slate-400 font-normal">(Optional)</span>}
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
                  label={secondPartyEntityType === 'Company' ? 'Date of Incorporation' : 'Age / Date of Birth'}
                  value={secondPartyAgeOrIncDate}
                  onChange={setSecondPartyAgeOrIncDate}
                  required={true}
                  placeholder="DD/MM/YYYY"
                  helperText={showExampleDetails ? "Format: DD/MM/YYYY" : undefined}
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

            {/* Aadhaar (12-Digit Seamless), Mobile, PAN */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <AadhaarInput
                  label="Aadhaar Card Number"
                  value={secondPartyAadhaarLast4}
                  onChange={setSecondPartyAadhaarLast4}
                  required={docIdRule.aadhaar === 'mandatory'}
                  helperText="12-digit number"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mobile (Aadhaar Linked) <span className="text-red-500 font-bold">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={secondPartyMobile}
                  onChange={(e) => setSecondPartyMobile(e.target.value)}
                  placeholder={getPlaceholder('+91 98111 22334')}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  PAN Number {docIdRule.pan === 'mandatory' ? <span className="text-red-500 font-bold">*</span> : docIdRule.pan === 'optional' ? <span className="text-slate-400 font-normal">(Optional)</span> : <span className="text-slate-400 font-normal">(N/A)</span>}
                </label>
                <input
                  type="text"
                  required={docIdRule.pan === 'mandatory'}
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

            {/* Scope / Deliverables */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Deliverables &amp; Scope of Work
              </label>
              <textarea
                rows={2}
                value={scopeOfWork}
                onChange={(e) => setScopeOfWork(e.target.value)}
                placeholder={getPlaceholder('Detail the exact commitments, deliverables, or declaration facts...')}
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
              />
            </div>

            {/* Commercial Considerations */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Financial Consideration / Fee (₹)
                </label>
                <input
                  type="text"
                  value={considerationAmount}
                  onChange={(e) => setConsiderationAmount(e.target.value)}
                  placeholder={getPlaceholder('e.g. 50,000 or Nil (for family deeds)')}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Validity / Duration {selectedDocTitle.toLowerCase().includes('rent') || selectedDocTitle.toLowerCase().includes('lease') || selectedDocTitle.toLowerCase().includes('tenan') || selectedDocTitle.toLowerCase().includes('sublease') ? <span className="text-red-500 font-bold">(Max 11 Months)</span> : null}
                </label>
                {selectedDocTitle.toLowerCase().includes('rent') || selectedDocTitle.toLowerCase().includes('lease') || selectedDocTitle.toLowerCase().includes('tenan') || selectedDocTitle.toLowerCase().includes('sublease') ? (
                  <div>
                    <select
                      value={durationMonths}
                      onChange={(e) => setDurationMonths(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    >
                      <option value="11 Months">11 Months (Registration Exempt)</option>
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
                    </select>
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

            {/* Territory & Notice Period */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Territory / Platforms
                </label>
                <input
                  type="text"
                  value={exclusivityTerritory}
                  onChange={(e) => setExclusivityTerritory(e.target.value)}
                  placeholder={getPlaceholder('e.g. Pan India / Instagram & YouTube')}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Termination / Notice Period
                </label>
                <input
                  type="text"
                  value={noticePeriod}
                  onChange={(e) => setNoticePeriod(e.target.value)}
                  placeholder={getPlaceholder('e.g. 15 Days written notice')}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            {/* Custom Terms / Policies: Key-Value Pair format */}
            <div className="pt-3 border-t border-slate-200">
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
          </div>
        )}

        {/* ================= PAGE 5: WITNESS & DELIVERY PREFERENCES + PRICING ================= */}
        {currentPage === 5 && (
          <form onSubmit={handleSubmit} className="space-y-6 animate-fadeIn">
            {/* Witness 1 Details */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                Witness 1 Details <span className="text-red-500">*</span>
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Legal Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={w1Name}
                    onChange={(e) => setW1Name(e.target.value)}
                    placeholder="e.g. Rohit Verma"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Father's / Husband's Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={w1FatherName}
                    onChange={(e) => setW1FatherName(e.target.value)}
                    placeholder="e.g. S.K. Verma"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <AddressFieldGroup
                label="Complete Residential Address"
                value={w1Address}
                onChangeAddress={setW1Address}
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mobile Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={w1Mobile}
                    onChange={(e) => setW1Mobile(e.target.value)}
                    placeholder={getPlaceholder('+91 98999 11223')}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <DateOfBirthPicker
                    label="Age / Date of Birth"
                    value={w1Age}
                    onChange={setW1Age}
                    placeholder="DD/MM/YYYY"
                    helperText={showExampleDetails ? "Format: DD/MM/YYYY" : undefined}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Aadhaar Last 4 <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    value={w1AadhaarLast4}
                    onChange={(e) => setW1AadhaarLast4(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder={getPlaceholder('4819')}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>
            </div>

            {/* Witness 2 Details */}
            <div className="space-y-3 pt-4 border-t border-slate-200">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                Witness 2 Details <span className="text-slate-400 font-normal">(Optional)</span>
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Legal Name
                  </label>
                  <input
                    type="text"
                    value={w2Name}
                    onChange={(e) => setW2Name(e.target.value)}
                    placeholder={getPlaceholder('e.g. Manisha Rawat')}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Father's / Husband's Name
                  </label>
                  <input
                    type="text"
                    value={w2FatherName}
                    onChange={(e) => setW2FatherName(e.target.value)}
                    placeholder={getPlaceholder('e.g. Anand Rawat')}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <AddressFieldGroup
                label="Complete Residential Address"
                value={w2Address}
                onChangeAddress={setW2Address}
                required={false}
              />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    value={w2Mobile}
                    onChange={(e) => setW2Mobile(e.target.value)}
                    placeholder={getPlaceholder('+91 97111 88990')}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <DateOfBirthPicker
                    label="Age / Date of Birth"
                    value={w2Age}
                    onChange={setW2Age}
                    placeholder="DD/MM/YYYY"
                    helperText={showExampleDetails ? "Format: DD/MM/YYYY" : undefined}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Aadhaar Last 4 <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    value={w2AadhaarLast4}
                    onChange={(e) => setW2AadhaarLast4(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder={getPlaceholder('7721')}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>
            </div>

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
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    deliveryType === 'digital'
                      ? 'bg-blue-50/70 border-blue-600 shadow-xs ring-1 ring-blue-600'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
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
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    deliveryType === 'physical'
                      ? 'bg-blue-50/70 border-blue-600 shadow-xs ring-1 ring-blue-600'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
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
                          required={deliveryType === 'physical'}
                          value={shippingPhone}
                          onChange={(e) => setShippingPhone(e.target.value)}
                          placeholder={getPlaceholder('+91 98765 43210')}
                          className="w-full bg-white border border-amber-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-amber-900 mb-0.5">
                        Street Address &amp; Landmark <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required={deliveryType === 'physical'}
                        value={shippingAddress}
                        onChange={(e) => setShippingAddress(e.target.value)}
                        placeholder={getPlaceholder('Flat No, Building, Street, Landmark')}
                        className="w-full bg-white border border-amber-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-amber-900 mb-0.5">
                        Pincode (6 digits) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        required={deliveryType === 'physical'}
                        value={shippingPincode}
                        onChange={(e) => setShippingPincode(e.target.value.replace(/\D/g, ''))}
                        placeholder={getPlaceholder('201301')}
                        className="w-36 bg-white border border-amber-300 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
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
                    Aadhaar e-Sign ({isUnilateral ? '1 Party' : '2 Parties'} + GST):
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
                    <span>{isSpeakingDeclarations ? 'रोकें (Stop Voice)' : '🔊 5 घोषणाएँ सुनें (Voice)'}</span>
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
                  "1. मैंने दस्तावेज़ के सभी नियम व शर्तें ध्यानपूर्वक पढ़ ली हैं और मैं इनसे सहमत हूँ। (I have carefully read and agreed to all terms and conditions of this legal draft.)",
                  "2. प्रस्तुत की गई दोनों पक्षों और गवाहों की व्यक्तिगत पहचान (PAN/Aadhaar) व पते की जानकारी पूर्णतः सत्य और प्रामाणिक है। (All personal identity and address details of parties and witnesses provided are true and verified.)",
                  "3. इस विलेख/करार का निष्पादन बिना किसी दबाव, कपट अथवा अनुचित प्रभाव के स्वतंत्र सहमति से किया जा रहा है। (This deed/agreement is being executed with free consent without any coercion, fraud, or undue influence.)",
                  "4. संबंधित राज्य सरकार की स्टाम्प ड्यूटी एवं ई-हस्ताक्षर (Aadhaar e-Sign) नियमों के अनुपालन की पूरी ज़िम्मेदारी मेरी है। (I understand and accept full responsibility for compliance with state stamp duty and Aadhaar e-Sign regulations.)",
                  "5. मैं पुष्टि करता हूँ कि दस्तावेज़ डिलीवरी के पश्चात देय राशि का भुगतान नियमानुसार करूँगा। (I confirm and agree to pay the post-delivery fee upon receipt of the verified legal document.)"
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
                      required
                      checked={declarations[idx]}
                      onChange={(e) => {
                        const next = [...declarations];
                        next[idx] = e.target.checked;
                        setDeclarations(next);
                      }}
                      className="mt-0.5 w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-600 cursor-pointer shrink-0"
                    />
                    <span className="text-xs leading-relaxed">{declarationText}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Platform Intermediary Disclaimer Checkbox */}
            <div className="p-4 bg-blue-50/50 border border-blue-200 rounded-xl">
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  required
                  checked={intermediaryDisclaimerAccepted}
                  onChange={(e) => setIntermediaryDisclaimerAccepted(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-600 cursor-pointer"
                />
                <span className="text-xs text-slate-700 leading-relaxed">
                  I verify that all entries are correct. Cotex Compliance acts strictly as an automated processing intermediary under the IT Act, 2000.
                </span>
              </label>
            </div>

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
              <span>{currentPage === 1 ? 'Cancel' : 'Previous Page'}</span>
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
    </div>
  );
};
