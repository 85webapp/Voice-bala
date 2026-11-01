import React, { useState, useMemo, useEffect } from 'react';
import { createRoot, Root } from 'react-dom/client';
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
    const speakerRoots = new Map<HTMLButtonElement, Root>();
    const attachFieldSpeakers = () => {
      for (const [button, root] of speakerRoots) {
        if (!button.isConnected) {
          root.unmount();
          speakerRoots.delete(button);
        }
      }

      wizardRoot.querySelectorAll<HTMLLabelElement>('label').forEach((label) => {
        if (label.querySelector('[data-field-speaker]')) return;
        const control = label.control || label.nextElementSibling?.matches('input,select,textarea') && label.nextElementSibling
          || label.parentElement?.querySelector('input,select,textarea');
        if (!(control instanceof HTMLInputElement || control instanceof HTMLSelectElement || control instanceof HTMLTextAreaElement)) return;
        if (control instanceof HTMLInputElement && ['checkbox', 'radio', 'hidden', 'submit'].includes(control.type)) return;

        const fieldLabel = label.textContent?.replace(/\s+/g, ' ').trim() || control.getAttribute('aria-label') || control.getAttribute('placeholder') || 'This field';
        const button = document.createElement('button');
        button.type = 'button';
        button.dataset.fieldSpeaker = 'true';
        button.className = 'ml-1 inline-flex align-middle items-center justify-center rounded-full p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600';
        button.setAttribute('aria-label', `Explain ${fieldLabel}`);
        button.title = `Explain ${fieldLabel}`;
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
        const root = createRoot(button);
        root.render(<Volume2 className="w-3.5 h-3.5" aria-hidden="true" />);
        speakerRoots.set(button, root);
      });
    };

    attachFieldSpeakers();
    const observer = new MutationObserver(attachFieldSpeakers);
    observer.observe(wizardRoot, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      speakerRoots.forEach((root, button) => {
        root.unmount();
        button.remove();
      });
      speakerRoots.clear();
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

  // --- PAGE 2: First Party Details ---
  const [firstPartyEntityType, setFirstPartyEntityType] = useState<'Individual' | 'Company'>('Individual');
  const [firstPartyName, setFirstPartyName] = useState('');
  const [firstPartySignatory, setFirstPartySignatory] = useState('');
  const [firstPartyDesignation, setFirstPartyDesignation] = useState('');
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
  const [secondPartyDesignation, setSecondPartyDesignation] = useState('');
  const [secondPartyFatherName, setSecondPartyFatherName] = useState('');
  const [secondPartyAgeOrIncDate, setSecondPartyAgeOrIncDate] = useState('');
  const [secondPartyAddress, setSecondPartyAddress] = useState('');
  const [secondPartyAadhaarLast4, setSecondPartyAadhaarLast4] = useState('');
  const [secondPartyMobile, setSecondPartyMobile] = useState('');
  const [secondPartyPan, setSecondPartyPan] = useState('');

  // --- PAGE 4: Core Document Specific Details ---
  const [scopeOfWork, setScopeOfWork] = useState('Standard statutory legal scope of work and mutual obligations as defined under Indian Contract Act, 1872.');
  const [considerationAmount, setConsiderationAmount] = useState('25,000');
  const [durationMonths, setDurationMonths] = useState('12 Months');
  const [exclusivityTerritory, setExclusivityTerritory] = useState('Pan India');
  const [noticePeriod, setNoticePeriod] = useState('15 Days written notice');

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

  // Statutory disclaimer checkbox
  const [intermediaryDisclaimerAccepted, setIntermediaryDisclaimerAccepted] = useState(false);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedOrder, setSubmittedOrder] = useState<OrderItem | null>(null);

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

    const rawTotal = stamp + eSign + govtPurchasing + platformFee + courierFee;

    // Charm pricing ending in 9
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
  }, [activeStampValue, isUnilateral, deliveryType]);

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
      if (!firstPartyPan.trim()) {
        alert('Please enter PAN Number for First Party.');
        return false;
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
        if (!secondPartyPan.trim()) {
          alert('Please enter PAN Number for Second Party.');
          return false;
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

  const handleSubmit = (e: React.FormEvent) => {
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

    if (!intermediaryDisclaimerAccepted) {
      alert('Please accept the Cotex Compliance intermediary verification checkbox before proceeding.');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const todayISO = new Date().toISOString().split('T')[0];
      const newOrderId = `CTC-${Math.floor(100000 + Math.random() * 900000)}`;

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

          {/* Details Card */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 text-left text-xs sm:text-sm space-y-3">
            <div className="flex justify-between border-b border-slate-200/80 pb-2">
              <span className="text-slate-500">Document Type:</span>
              <span className="font-bold text-black">{submittedOrder.docTitle}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200/80 pb-2">
              <span className="text-slate-500">State Jurisdiction:</span>
              <span className="font-bold text-slate-900">{submittedOrder.state}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200/80 pb-2">
              <span className="text-slate-500">Stamp Paper Denomination:</span>
              <span className="font-bold text-blue-700">{submittedOrder.stampDenomination}</span>
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
              <span>Displayed estimate (not a charge):</span>
              <span className="text-blue-600">₹{submittedOrder.totalFee}</span>
            </div>
          </div>

          {/* Reassurance Callout */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-xs sm:text-sm text-blue-900 text-left flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <strong>Prototype only:</strong>
              <p className="mt-0.5 text-blue-800">
                No draft, e-stamp, signature, courier delivery, or payment is processed by this prototype.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={onNavigateToDashboard}
              className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm rounded-xl shadow-md cursor-pointer transition-all"
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
          <span className="text-sm font-bold text-blue-600 block mt-0.5">
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
              Listen to AI explanation for {getStepNumberDisplay()} ({getStepTitle()})
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
            {/* MANDATORY & OPTIONAL BANNER AT TOP OF FORM (STRICTLY PAGE 1 ONLY) */}
            <div className="py-2 px-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs text-slate-700 font-medium">
              <div>
                Mandatory = <span className="text-red-500 font-bold">*</span>
              </div>
              <div>
                Optional = <span className="text-slate-400 font-medium">(Optional)</span>
              </div>
            </div>

            <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="text-xs text-blue-900">
                <strong>Government e-Stamp &amp; Legal Verification:</strong>
                <p className="mt-0.5 text-blue-800">
                  Select your document and target State/UT jurisdiction. Stamp duty is automatically determined strictly according to the official State Stamp Act master matrix.
                </p>
              </div>
            </div>

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

            {/* Stamp Paper Value: Auto-calculated dynamically */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-700 block">
                    Stamp Paper Value (Official Minimum)
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Auto-calculated from State Stamp Act matrix for {selectedState}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xl font-black text-blue-600">
                    ₹{activeStampValue}
                  </span>
                  <span className="block text-[10px] text-emerald-600 font-bold">
                    Statutory Compliant
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

        {/* ================= PAGE 2 ================= */}
        {currentPage === 2 && (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <span className="text-xs font-bold text-slate-500 uppercase">
                {docConfig.firstPartyRole}
              </span>

              {/* Entity Type Toggle */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500">Entity Type:</span>
                <button
                  type="button"
                  onClick={() => setFirstPartyEntityType('Individual')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    firstPartyEntityType === 'Individual'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Individual
                </button>
                <button
                  type="button"
                  onClick={() => setFirstPartyEntityType('Company')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    firstPartyEntityType === 'Company'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Company / Firm
                </button>
              </div>
            </div>

            {/* Full Legal Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {firstPartyEntityType === 'Company' ? 'Registered Company / Firm Name' : 'Full Legal Name'} <span className="text-red-500">* [MANDATORY]</span>
              </label>
              <input
                type="text"
                required
                value={firstPartyName}
                onChange={(e) => setFirstPartyName(e.target.value)}
                placeholder={firstPartyEntityType === 'Company' ? 'e.g. Acme Media Private Limited' : 'e.g. Ramesh Kumar Sharma'}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            {/* Authorized Signatory (If Company) */}
            {firstPartyEntityType === 'Company' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Authorized Signatory Name
                  </label>
                  <input
                    type="text"
                    value={firstPartySignatory}
                    onChange={(e) => setFirstPartySignatory(e.target.value)}
                    placeholder="e.g. Vikram Malhotra"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Designation
                  </label>
                  <input
                    type="text"
                    value={firstPartyDesignation}
                    onChange={(e) => setFirstPartyDesignation(e.target.value)}
                    placeholder="e.g. Managing Director / Partner"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>
            )}

            {/* Father's / Husband's Name & Age */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Father's / Husband's Name {firstPartyEntityType === 'Individual' ? <span className="text-red-500">*</span> : <span className="text-slate-400 font-normal">(Optional)</span>}
                </label>
                <input
                  type="text"
                  value={firstPartyFatherName}
                  onChange={(e) => setFirstPartyFatherName(e.target.value)}
                  placeholder="e.g. Late Shri Prem Nath Sharma"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {firstPartyEntityType === 'Company' ? 'Date of Incorporation' : 'Age / Date of Birth'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={firstPartyAgeOrIncDate}
                  onChange={(e) => setFirstPartyAgeOrIncDate(e.target.value)}
                  placeholder={firstPartyEntityType === 'Company' ? 'e.g. 14-08-2021' : 'e.g. 32 Years / 15-05-1992'}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            {/* Permanent Address */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Permanent Registered Address <span className="text-red-500">* [MANDATORY]</span>
              </label>
              <textarea
                rows={2}
                required
                value={firstPartyAddress}
                onChange={(e) => setFirstPartyAddress(e.target.value)}
                placeholder="House / Flat No, Street, Landmark, City, State, PIN code"
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
              />
            </div>

            {/* Aadhaar Last 4, Mobile, PAN */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Aadhaar (Last 4 Digits) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  maxLength={4}
                  value={firstPartyAadhaarLast4}
                  onChange={(e) => setFirstPartyAadhaarLast4(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 8492"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mobile (Aadhaar Linked) <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={firstPartyMobile}
                  onChange={(e) => setFirstPartyMobile(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  PAN Number <span className="text-red-500">* [MANDATORY]</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={10}
                  value={firstPartyPan}
                  onChange={(e) => setFirstPartyPan(e.target.value.toUpperCase())}
                  placeholder="e.g. ABCDE1234F"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-mono uppercase text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>
          </div>
        )}

        {/* ================= PAGE 3: SECOND PARTY (Only for Bilateral) ================= */}
        {currentPage === 3 && !isUnilateral && (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <span className="text-xs font-bold text-slate-500 uppercase">
                {docConfig.secondPartyRole}
              </span>

              {/* Entity Type Toggle */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500">Entity Type:</span>
                <button
                  type="button"
                  onClick={() => setSecondPartyEntityType('Individual')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    secondPartyEntityType === 'Individual'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Individual
                </button>
                <button
                  type="button"
                  onClick={() => setSecondPartyEntityType('Company')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    secondPartyEntityType === 'Company'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Company / Firm
                </button>
              </div>
            </div>

            {/* Full Legal Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {secondPartyEntityType === 'Company' ? 'Registered Company / Firm Name' : 'Full Legal Name'} <span className="text-red-500">* [MANDATORY]</span>
              </label>
              <input
                type="text"
                required
                value={secondPartyName}
                onChange={(e) => setSecondPartyName(e.target.value)}
                placeholder={secondPartyEntityType === 'Company' ? 'e.g. Zenith Tech Solutions LLP' : 'e.g. Priya Sharma'}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            {/* Authorized Signatory (If Company) */}
            {secondPartyEntityType === 'Company' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Authorized Signatory Name
                  </label>
                  <input
                    type="text"
                    value={secondPartySignatory}
                    onChange={(e) => setSecondPartySignatory(e.target.value)}
                    placeholder="e.g. Amit Kapoor"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Designation
                  </label>
                  <input
                    type="text"
                    value={secondPartyDesignation}
                    onChange={(e) => setSecondPartyDesignation(e.target.value)}
                    placeholder="e.g. Authorized Signatory / Partner"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>
            )}

            {/* Father's / Husband's Name & Age */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Father's / Husband's Name {secondPartyEntityType === 'Individual' ? <span className="text-red-500">*</span> : <span className="text-slate-400 font-normal">(Optional)</span>}
                </label>
                <input
                  type="text"
                  value={secondPartyFatherName}
                  onChange={(e) => setSecondPartyFatherName(e.target.value)}
                  placeholder="e.g. Shri Rajesh Sharma"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {secondPartyEntityType === 'Company' ? 'Date of Incorporation' : 'Age / Date of Birth'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={secondPartyAgeOrIncDate}
                  onChange={(e) => setSecondPartyAgeOrIncDate(e.target.value)}
                  placeholder={secondPartyEntityType === 'Company' ? 'e.g. 21-11-2022' : 'e.g. 28 Years / 08-09-1996'}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            {/* Permanent Address */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Permanent Registered Address <span className="text-red-500">* [MANDATORY]</span>
              </label>
              <textarea
                rows={2}
                required
                value={secondPartyAddress}
                onChange={(e) => setSecondPartyAddress(e.target.value)}
                placeholder="House / Flat No, Street, Landmark, City, State, PIN code"
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
              />
            </div>

            {/* Aadhaar Last 4, Mobile, PAN */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Aadhaar (Last 4 Digits) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  maxLength={4}
                  value={secondPartyAadhaarLast4}
                  onChange={(e) => setSecondPartyAadhaarLast4(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 5183"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mobile (Aadhaar Linked) <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={secondPartyMobile}
                  onChange={(e) => setSecondPartyMobile(e.target.value)}
                  placeholder="+91 98111 22334"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  PAN Number <span className="text-red-500">* [MANDATORY]</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={10}
                  value={secondPartyPan}
                  onChange={(e) => setSecondPartyPan(e.target.value.toUpperCase())}
                  placeholder="e.g. FGHIJ5678K"
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
                placeholder="Detail the exact commitments, deliverables, or declaration facts..."
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
                  placeholder="e.g. 50,000 or Nil (for family deeds)"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Validity / Duration
                </label>
                <input
                  type="text"
                  value={durationMonths}
                  onChange={(e) => setDurationMonths(e.target.value)}
                  placeholder="e.g. 11 Months / 1 Year / Perpetual"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
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
                  placeholder="e.g. Pan India / Instagram & YouTube"
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
                  placeholder="e.g. 15 Days written notice"
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
                        placeholder="e.g. No-Deletion Timeline / Exclusivity Period"
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
                        placeholder="Describe the exact legal condition, liability limit, or rule..."
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

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Complete Residential Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={w1Address}
                  onChange={(e) => setW1Address(e.target.value)}
                  placeholder="Address with City, State & Pincode"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

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
                    placeholder="+91 98999 11223"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Age / DOB <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={w1Age}
                    onChange={(e) => setW1Age(e.target.value)}
                    placeholder="e.g. 34"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
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
                    onChange={(e) => setW1AadhaarLast4(e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g. 4819"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>
            </div>

            {/* Witness 2 Details */}
            <div className="space-y-3 pt-4 border-t border-slate-200">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                Witness 2 Details <span className="text-slate-400 font-normal">(Recommended / Required by Sub-Registrar)</span>
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
                    placeholder="e.g. Manisha Rawat"
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
                    placeholder="e.g. Anand Rawat"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Complete Residential Address
                </label>
                <input
                  type="text"
                  value={w2Address}
                  onChange={(e) => setW2Address(e.target.value)}
                  placeholder="Address with City, State & Pincode"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    value={w2Mobile}
                    onChange={(e) => setW2Mobile(e.target.value)}
                    placeholder="+91 97111 88990"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Age / DOB <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={w2Age}
                    onChange={(e) => setW2Age(e.target.value)}
                    placeholder="e.g. 29"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
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
                    onChange={(e) => setW2AadhaarLast4(e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g. 7721"
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
                          placeholder="e.g. Ramesh Kumar"
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
                          placeholder="+91 98765 43210"
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
                        placeholder="Flat No, Building, Street, Landmark"
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
                        placeholder="e.g. 201301"
                        className="w-36 bg-white border border-amber-300 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                      />
                    </div>
                  </div>
                </div>
              )}
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
                <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-sm text-black">
                  <span>Total Amount Due (Post-Delivery):</span>
                  <span className="text-blue-600">₹{pricing.totalPayable}</span>
                </div>
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
              <span>Proceed to next</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
