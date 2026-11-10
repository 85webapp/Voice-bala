import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Phone,
  MessageCircle,
  Volume2,
  VolumeX,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Building2,
  FileCheck2,
  Car,
  FileText,
  Lock,
  ExternalLink
} from 'lucide-react';
import { ServiceCategory, SERVICE_CATEGORIES } from '../data/servicesData';
import { VoiceGuidanceButton } from './VoiceGuidanceButton';
import { ttsService } from '../services/textToSpeechService';
import { stopServiceVoice } from '../services/googleVoiceGuidance';
import { useExampleDetails } from '../hooks/useExampleDetails';
import {
  encryptFormDataAndSign,
  saveLightweightMetadata,
  postEncryptedPayloadToWebsiteB,
  playConfirmationChime
} from '../services/encryptionService';

interface ServiceFormViewProps {
  category: ServiceCategory;
  title: string;
  onBack: () => void;
}

export const ServiceFormView: React.FC<ServiceFormViewProps> = ({
  category,
  title: initialTitle,
  onBack
}) => {
  const { getPlaceholder } = useExampleDetails();
  const [selectedTitle, setSelectedTitle] = useState(initialTitle);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [referenceId, setReferenceId] = useState('');
  const [submissionSecurityDetails, setSubmissionSecurityDetails] = useState<{
    encryptedPayload: string;
    signature: string;
    websiteBUrl: string;
  } | null>(null);

  // Common Contact fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  // Insurance specific fields
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [chassisNumber, setChassisNumber] = useState('');
  const [engineNumber, setEngineNumber] = useState('');
  const [policyExpired, setPolicyExpired] = useState<'yes' | 'no'>('no');
  const [policyType, setPolicyType] = useState<'comprehensive' | 'third_party'>('comprehensive');
  const handleVehicleNumberChange = (raw: string) => {
    const clean = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
    let p1 = '';
    let p2 = '';
    let p3 = '';
    let p4 = '';

    let i = 0;
    while (i < clean.length && p1.length < 2) {
      if (/[A-Z]/.test(clean[i])) p1 += clean[i];
      i++;
    }
    while (i < clean.length && p2.length < 2) {
      if (/[0-9]/.test(clean[i])) p2 += clean[i];
      i++;
    }
    while (i < clean.length && p3.length < 2) {
      if (/[A-Z]/.test(clean[i])) {
        p3 += clean[i];
      } else if (/[0-9]/.test(clean[i]) && p3.length > 0) {
        break;
      }
      i++;
    }
    while (i < clean.length && p4.length < 4) {
      if (/[0-9]/.test(clean[i])) p4 += clean[i];
      i++;
    }

    const res = [p1, p2, p3, p4].filter(Boolean).join(' ');
    setVehicleNumber(res);
  };

  const [insuranceNotes, setInsuranceNotes] = useState('');

  // GST Filing specific fields
  const [gstin, setGstin] = useState('');
  const [gstFrequency, setGstFrequency] = useState<'monthly' | 'quarterly'>('monthly');
  const [selectedMonths, setSelectedMonths] = useState<string[]>(['October 2026']);
  const [selectedQuarter, setSelectedQuarter] = useState<string>('Q2 (Jul - Sep 2026)');

  // Income Tax Filing specific fields
  const [panNumber, setPanNumber] = useState('');
  const [assessmentYear, setAssessmentYear] = useState('AY 2026-27 (FY 2025-26)');
  const [incomeSource, setIncomeSource] = useState('Salary');
  const [taxAddress, setTaxAddress] = useState('');

  // Other Filing specific fields
  const [otherFilingAddress, setOtherFilingAddress] = useState('');
  const [whichFilingDetails, setWhichFilingDetails] = useState('');

  // Registrations (Pvt Ltd, LLP, Trademark, FSSAI) fields - NO PAN/GSTIN
  const [businessName, setBusinessName] = useState('');
  const [businessActivity, setBusinessActivity] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');

  // General fallback fields
  const [generalDetails, setGeneralDetails] = useState('');

  // Sync title when props change
  useEffect(() => {
    setSelectedTitle(initialTitle);
  }, [initialTitle]);

  const isInsurance = category.id === 'insurance';
  const isFilings = category.id === 'filings';
  const isRegistrations = category.id === 'registrations';

  const isOtherInsurance = selectedTitle.toLowerCase().includes('other');
  const isGstFiling = selectedTitle.toLowerCase().includes('gst filing');
  const isItrFiling = selectedTitle.toLowerCase().includes('income tax') || selectedTitle.toLowerCase().includes('itr');
  const isOtherFiling = selectedTitle.toLowerCase().includes('other filing');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ref = `CTC-${Math.floor(100000 + Math.random() * 900000)}`;
    setReferenceId(ref);

    // 1. Zero-Database Client-Side Encryption
    const sensitiveData = {
      orderId: ref,
      category: category.title,
      service: selectedTitle,
      name,
      phone,
      email,
      vehicleNumber,
      chassisNumber,
      engineNumber,
      businessName,
      businessAddress,
      businessActivity,
      generalDetails,
      timestamp: new Date().toISOString()
    };
    const encResult = encryptFormDataAndSign(sensitiveData);
    const { encryptedPayload, signature, websiteBUrl } = encResult;

    // 2. Save ONLY 4 lightweight metadata fields in Supabase
    const metadata = {
      firstPartyName: name || 'Service Applicant',
      formName: selectedTitle,
      timestamp: new Date().toISOString(),
      totalPrice: '0',
      orderId: ref
    };
    await saveLightweightMetadata(metadata);

    // 3. Directly POST encrypted ciphertext & HMAC signature to Website B API
    await postEncryptedPayloadToWebsiteB(encResult, metadata);

    setSubmissionSecurityDetails({ encryptedPayload, signature, websiteBUrl });
    setIsSubmitted(true);
    ttsService.stop();
    stopServiceVoice();
    try {
      playConfirmationChime();
    } catch {}
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleMonthToggle = (month: string) => {
    setSelectedMonths((prev) =>
      prev.includes(month) ? prev.filter((m) => m !== month) : [...prev, month]
    );
  };

  const registrationServices = (SERVICE_CATEGORIES.find((c) => c.id === 'registrations')?.services || []).filter(
    (s) => s !== 'GST Registration' && s !== 'MSME Udyam Registration'
  );

  const insuranceServices = SERVICE_CATEGORIES.find((c) => c.id === 'insurance')?.services || [];

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-5 animate-fadeIn pb-24 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Navigation Bar with Back button on left and Voice Speaker on right */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <button
          type="button"
          onClick={() => {
            ttsService.stop();
            stopServiceVoice();
            onBack();
          }}
          className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800 py-1.5 px-3 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to services</span>
        </button>

        {/* High-Quality Voice Speaker with Tap-To-Stop */}
        <VoiceGuidanceButton serviceTitle={selectedTitle} />
      </div>

      {/* Title & Category Banner */}
      <div className="mb-4">
        <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
          {category.title}
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-0.5">
          {selectedTitle}
        </h1>
      </div>

      {/* 1-Hour Call Back Guarantee & Direct Call/WhatsApp Strip */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/90 rounded-2xl p-4 sm:p-5 mb-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>1-Hour Callback Guarantee</span>
                <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white uppercase tracking-wider">
                  Fast Track
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5 max-w-xl">
                Submit your details below and our senior compliance executive will call you within 1 hour. Or contact us directly right now:
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href="tel:+912109141007"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold border border-slate-300 shadow-2xs transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-blue-600" />
              <span>Call Support</span>
            </a>
            <a
              href={`https://wa.me/912109141007?text=${encodeURIComponent(
                `Hello Cotrix Tax Group, I need assistance with ${selectedTitle}.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-2xs transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp Admin</span>
            </a>
          </div>
        </div>
      </div>

      {isSubmitted ? (
        /* Submission Success Confirmation */
        <div className="bg-white border border-emerald-200 rounded-2xl p-6 sm:p-8 text-center space-y-4 shadow-sm animate-fadeIn">
          <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-[#15803d] text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-2">
              <Lock className="w-3.5 h-3.5 text-[#15803d]" />
              <span>AES-256 Client Encrypted • Zero-Database Rule</span>
            </div>
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block">
              Request Successfully Recorded
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
              Thank You, {name || 'Applicant'}!
            </h2>
            <div className="inline-block mt-2 px-3 py-1 rounded-full bg-slate-100 text-slate-800 font-mono text-xs font-bold">
              Reference ID: {referenceId}
            </div>
          </div>

          {/* Website B Automatic Redirection Card */}


          <p className="text-sm text-slate-600 max-w-md mx-auto">
            Our compliance executive is reviewing your request for <strong className="text-slate-900">{selectedTitle}</strong> and will call you on <strong className="text-slate-900">+91 {phone}</strong> within 1 hour.
          </p>

          <div className="pt-4 flex flex-wrap justify-center gap-3">
            <a
              href="tel:+912109141007"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer"
            >
              <Phone className="w-4 h-4" />
              <span>Call Helpline Directly</span>
            </a>
            <button
              type="button"
              onClick={() => {
                setIsSubmitted(false);
                setName('');
                setPhone('');
                setEmail('');
                setVehicleNumber('');
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold cursor-pointer"
            >
              <span>Submit Another Request</span>
            </button>
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold cursor-pointer"
            >
              <span>Return to Services</span>
            </button>
          </div>
        </div>
      ) : (
        /* The Tailored Service Application Form */
        <form
          onSubmit={handleSubmit}
          className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-6"
        >
          {/* A. INSURANCE SPECIFIC FORM */}
          {isInsurance && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Which Vehicle Selector */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Which Vehicle Insurance? <span className="text-rose-600">*</span>
                  </label>
                  <select
                    value={selectedTitle}
                    onChange={(e) => setSelectedTitle(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    {insuranceServices.map((srv) => (
                      <option key={srv} value={srv}>
                        {srv}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Owner / Applicant Full Name <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={getPlaceholder('e.g. Ramesh Kumar Sharma')}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                {/* Mobile */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Mobile Number <span className="text-rose-600">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-sm font-semibold text-slate-400">+91</span>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      pattern="[6-9][0-9]{9}"
                      placeholder={getPlaceholder('9876543210')}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      className="w-full bg-white border border-slate-300 rounded-xl pl-12 pr-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>

                {/* Email (Optional) */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Email Address <span className="text-slate-400 font-normal">(Optional for policy soft-copy)</span>
                  </label>
                  <input
                    type="email"
                    placeholder={getPlaceholder('e.g. ramesh@example.com')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                {/* Vehicle Registration Number (Single line) */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Vehicle Registration Number {!isOtherInsurance && <span className="text-rose-600">*</span>}
                    {isOtherInsurance && <span className="text-slate-400 font-normal"> (Optional for other vehicles)</span>}
                  </label>
                  <input
                    type="text"
                    required={!isOtherInsurance}
                    maxLength={13}
                    placeholder={getPlaceholder('e.g. UP 84 AB 1234')}
                    value={vehicleNumber}
                    onChange={(e) => handleVehicleNumberChange(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-mono font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 uppercase"
                  />
                </div>

                {/* Optional Chassis Number (last 6 digits, opens numeric pad) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Chassis Number <span className="text-slate-400 font-normal">(Last 6 digits, optional)</span>
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    placeholder={getPlaceholder('6-Digit Number')}
                    value={chassisNumber}
                    onChange={(e) => setChassisNumber(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                {/* Optional Engine Number (last 6 digits, opens numeric pad) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Engine Number <span className="text-slate-400 font-normal">(Last 6 digits, optional)</span>
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    placeholder={getPlaceholder('6-Digit Number')}
                    value={engineNumber}
                    onChange={(e) => setEngineNumber(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                {/* Current Policy Expired? */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Is Current Policy Expired?
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPolicyExpired('no')}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold cursor-pointer transition-colors ${
                        policyExpired === 'no'
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-slate-300 text-slate-600 hover:border-slate-400'
                      }`}
                    >
                      No (Active)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPolicyExpired('yes')}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold cursor-pointer transition-colors ${
                        policyExpired === 'yes'
                          ? 'border-amber-600 bg-amber-50 text-amber-800'
                          : 'border-slate-300 text-slate-600 hover:border-slate-400'
                      }`}
                    >
                      Yes (Expired)
                    </button>
                  </div>
                </div>

                {/* Policy Type */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Required Policy Coverage
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPolicyType('comprehensive')}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold cursor-pointer transition-colors ${
                        policyType === 'comprehensive'
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-slate-300 text-slate-600 hover:border-slate-400'
                      }`}
                    >
                      Comprehensive (1st Party)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPolicyType('third_party')}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold cursor-pointer transition-colors ${
                        policyType === 'third_party'
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-slate-300 text-slate-600 hover:border-slate-400'
                      }`}
                    >
                      Third Party Only
                    </button>
                  </div>
                </div>

                {/* Additional notes / vehicle details */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Vehicle Model / Special Request <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <textarea
                    rows={2}
                    placeholder={getPlaceholder('e.g. Maruti Swift Dzire VXI, 2022 model, looking for maximum NCB discount')}
                    value={insuranceNotes}
                    onChange={(e) => setInsuranceNotes(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>
            </div>
          )}

          {/* B. FILINGS SPECIFIC FORMS */}
          {isFilings && (
            <div className="space-y-5">
              {/* Common Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Full Legal Name <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={getPlaceholder('e.g. Ramesh Kumar')}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Mobile Number <span className="text-rose-600">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-sm font-semibold text-slate-400">+91</span>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      pattern="[6-9][0-9]{9}"
                      placeholder={getPlaceholder('9876543210')}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      className="w-full bg-white border border-slate-300 rounded-xl pl-12 pr-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>
              </div>

              {/* GST Filing Form */}
              {isGstFiling && (
                <div className="space-y-4 pt-2 border-t border-slate-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        GSTIN Number <span className="text-slate-400 font-normal">(Optional if pending)</span>
                      </label>
                      <input
                        type="text"
                        maxLength={15}
                        placeholder={getPlaceholder('e.g. 09ABCDE1234F1Z5')}
                        value={gstin}
                        onChange={(e) => setGstin(e.target.value.toUpperCase())}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Filing Frequency
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setGstFrequency('monthly')}
                          className={`py-2 px-3 rounded-xl border text-xs font-bold cursor-pointer transition-colors ${
                            gstFrequency === 'monthly'
                              ? 'border-blue-600 bg-blue-50 text-blue-700'
                              : 'border-slate-300 text-slate-600 hover:border-slate-400'
                          }`}
                        >
                          Monthly (GSTR-1 / 3B)
                        </button>
                        <button
                          type="button"
                          onClick={() => setGstFrequency('quarterly')}
                          className={`py-2 px-3 rounded-xl border text-xs font-bold cursor-pointer transition-colors ${
                            gstFrequency === 'quarterly'
                              ? 'border-blue-600 bg-blue-50 text-blue-700'
                              : 'border-slate-300 text-slate-600 hover:border-slate-400'
                          }`}
                        >
                          Quarterly (QRMP / CMP-08)
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Frequency Selection details */}
                  {gstFrequency === 'monthly' ? (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Select Month(s) to File:
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {['October 2026', 'September 2026', 'August 2026'].map((m) => {
                          const isSel = selectedMonths.includes(m);
                          return (
                            <button
                              key={m}
                              type="button"
                              onClick={() => handleMonthToggle(m)}
                              className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                                isSel
                                  ? 'border-blue-600 bg-blue-600 text-white shadow-xs'
                                  : 'border-slate-300 text-slate-700 bg-slate-50 hover:bg-slate-100'
                              }`}
                            >
                              {m}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Select Quarter to File:
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          'Q2 (Jul - Sep 2026)',
                          'Q1 (Apr - Jun 2026)',
                          'Q4 (Jan - Mar 2026)'
                        ].map((q) => {
                          const isSel = selectedQuarter === q;
                          return (
                            <button
                              key={q}
                              type="button"
                              onClick={() => setSelectedQuarter(q)}
                              className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                                isSel
                                  ? 'border-blue-600 bg-blue-600 text-white shadow-xs'
                                  : 'border-slate-300 text-slate-700 bg-slate-50 hover:bg-slate-100'
                              }`}
                            >
                              {q}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Income Tax Return (ITR) Filing Form */}
              {isItrFiling && (
                <div className="space-y-4 pt-2 border-t border-slate-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Permanent Account Number (PAN) <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={10}
                        placeholder={getPlaceholder('e.g. ABCDE1234F')}
                        value={panNumber}
                        onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Assessment Year
                      </label>
                      <select
                        value={assessmentYear}
                        onChange={(e) => setAssessmentYear(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      >
                        <option value="AY 2026-27 (FY 2025-26)">AY 2026-27 (FY 2025-26)</option>
                        <option value="AY 2025-26 (FY 2024-25)">AY 2025-26 (FY 2024-25)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Email Address <span className="text-slate-400 font-normal">(Optional)</span>
                      </label>
                      <input
                        type="email"
                        placeholder={getPlaceholder('e.g. ramesh@example.com')}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Primary Source of Income
                      </label>
                      <select
                        value={incomeSource}
                        onChange={(e) => setIncomeSource(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      >
                        <option value="Salary">Salary (Form 16)</option>
                        <option value="Business / Profession">Business / Profession (44AD / 44ADA)</option>
                        <option value="House Property">Rental / House Property</option>
                        <option value="Capital Gain">Capital Gains (Stock / Mutual Fund / Property)</option>
                        <option value="Other">Other Sources (Interest / Dividend)</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Communication Address <span className="text-rose-600">*</span>
                      </label>
                      <textarea
                        required
                        rows={2}
                        placeholder={getPlaceholder('House / Flat No, Street, Landmark, City, State, PIN')}
                        value={taxAddress}
                        onChange={(e) => setTaxAddress(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Other Filing Form */}
              {isOtherFiling && (
                <div className="space-y-4 pt-2 border-t border-slate-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Email Address <span className="text-slate-400 font-normal">(Optional)</span>
                      </label>
                      <input
                        type="email"
                        placeholder={getPlaceholder('e.g. contact@example.com')}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Address <span className="text-rose-600">*</span>
                      </label>
                      <textarea
                        required
                        rows={2}
                        placeholder={getPlaceholder('Your full operational or postal address')}
                        value={otherFilingAddress}
                        onChange={(e) => setOtherFilingAddress(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Which Filing Assistance Do You Require? <span className="text-rose-600">*</span>
                      </label>
                      <textarea
                        required
                        rows={4}
                        placeholder={getPlaceholder('Please describe what filing assistance you need (TDS Return, PF/ESIC, MCA ROC Annual Return, Professional Tax, etc.)')}
                        value={whichFilingDetails}
                        onChange={(e) => setWhichFilingDetails(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* C. REGISTRATIONS SPECIFIC FORM (Pvt Ltd, LLP, Trademark, FSSAI) - NO PAN/GSTIN */}
          {isRegistrations && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Service Dropdown */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Registration Service <span className="text-rose-600">*</span>
                  </label>
                  <select
                    value={selectedTitle}
                    onChange={(e) => setSelectedTitle(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    {registrationServices.map((srv) => (
                      <option key={srv} value={srv}>
                        {srv}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Authorized Person / Applicant Full Name <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={getPlaceholder('e.g. Ramesh Kumar Sharma')}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                {/* Mobile */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Mobile Number <span className="text-rose-600">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-sm font-semibold text-slate-400">+91</span>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      pattern="[6-9][0-9]{9}"
                      placeholder={getPlaceholder('9876543210')}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      className="w-full bg-white border border-slate-300 rounded-xl pl-12 pr-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>

                {/* Business Name (Mandatory) */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Proposed Business / Trademark / Applicant Name <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={getPlaceholder('e.g. Apex Global Solutions Private Limited / Brand Name')}
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                {/* Email (Optional) */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Email Address <span className="text-slate-400 font-normal">(Optional for certificate delivery)</span>
                  </label>
                  <input
                    type="email"
                    placeholder={getPlaceholder('e.g. contact@apexsolutions.com')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                {/* Business Activity */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Nature of Business / Proposed Activity
                  </label>
                  <input
                    type="text"
                    placeholder={getPlaceholder('e.g. Software Development & IT Consulting / Restaurant & Fast Food')}
                    value={businessActivity}
                    onChange={(e) => setBusinessActivity(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                {/* Business Address */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Registered Business Address
                  </label>
                  <textarea
                    rows={2}
                    placeholder={getPlaceholder('Shop/Office No, Street, City, State, PIN')}
                    value={businessAddress}
                    onChange={(e) => setBusinessAddress(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>
            </div>
          )}

          {/* D. FALLBACK FOR OTHER CATEGORIES (Notices, Loans, Website) */}
          {!isInsurance && !isFilings && !isRegistrations && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Full Name <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={getPlaceholder('Your Name')}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Mobile Number <span className="text-rose-600">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-sm font-semibold text-slate-400">+91</span>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      pattern="[6-9][0-9]{9}"
                      placeholder={getPlaceholder('9876543210')}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      className="w-full bg-white border border-slate-300 rounded-xl pl-12 pr-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Email Address <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="email"
                    placeholder={getPlaceholder('e.g. contact@example.com')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Requirements / Details <span className="text-rose-600">*</span>
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder={getPlaceholder('Describe your requirement here...')}
                    value={generalDetails}
                    onChange={(e) => setGeneralDetails(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Submit Action */}
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-slate-100">
            <span className="text-xs text-slate-500 font-medium">
              We never share your contact information. Confidential &amp; Encrypted.
            </span>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl px-6 py-3 cursor-pointer shadow-md shadow-blue-600/20 hover:shadow-lg transition-all"
            >
              <span>Submit</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
