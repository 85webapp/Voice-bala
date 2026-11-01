import React, { useState } from 'react';
import {
  X,
  Clock,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Sparkles,
  Info
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { LegalDocument, OrderItem } from '../types';
import { STAMP_PAPER_VALUES } from '../data/documentsData';
import { INDIAN_STATES_LIST } from '../data/indianCities';

interface DocumentOrderModalProps {
  document: LegalDocument;
  onClose: () => void;
  onOrderCreated: (order: OrderItem) => void;
}

export const DocumentOrderModal: React.FC<DocumentOrderModalProps> = ({
  document,
  onClose,
  onOrderCreated
}) => {
  const [deliveryHours, setDeliveryHours] = useState<number>(24);
  const [selectedState, setSelectedState] = useState<string>('Delhi (NCT)');
  const [stampValue, setStampValue] = useState<string>('₹100');
  const [party1Name, setParty1Name] = useState<string>('');
  const [party2Name, setParty2Name] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [specialTerms, setSpecialTerms] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submittedOrder, setSubmittedOrder] = useState<OrderItem | null>(null);

  // ₹5 per hour expedited from 24h standard, min 2 hours
  const hoursSaved = Math.max(0, 24 - deliveryHours);
  const fastTrackFee = hoursSaved * 5;
  const baseFee = document.basePrice;
  const totalFee = baseFee + fastTrackFee;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!party1Name.trim() || !phone.trim()) {
      alert('Please enter Primary Party Name & Mobile Number.');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const todayISO = new Date().toISOString().split('T')[0];
      const newOrderId = `CTC-${Math.floor(100000 + Math.random() * 900000)}`;
      const newOrder: OrderItem = {
        orderId: newOrderId,
        docTitle: document.title,
        createdAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        date: todayISO,
        deliveryHours,
        deliveryFee: fastTrackFee,
        baseFee,
        totalFee,
        paymentStatus: 'Unpaid',
        status: 'Processing',
        pendingHours: 1,
        applicantName: party1Name,
        applicantPhone: phone,
        state: selectedState,
        stampDenomination: stampValue
      };

      try {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 }
        });
      } catch {}

      setSubmittedOrder(newOrder);
      onOrderCreated(newOrder);
      setIsSubmitting(false);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-fadeIn">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-black">
                {document.title}
              </h2>
              <span className="text-xs text-blue-600 font-semibold">
                Official Legal Drafting &amp; e-Stamp
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {submittedOrder ? (
            <div className="space-y-4 text-center py-4">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div>
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
                  Demo Record Saved
                </span>
                <h3 className="text-xl font-black text-black mt-0.5">
                  Demo Docket Created
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Docket Number:{' '}
                  <strong className="text-blue-600 font-mono text-sm">
                    {submittedOrder.orderId}
                  </strong>
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-left text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Document:</span>
                  <span className="font-bold text-slate-900">{submittedOrder.docTitle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Selected demo timeline:</span>
                  <span className="font-bold text-blue-600">
                    Within {submittedOrder.deliveryHours} Hours
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Displayed estimate:</span>
                  <span className="font-bold text-slate-900">₹{submittedOrder.totalFee}</span>
                </div>
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Billing Mode:</span>
                  <span>No payment is processed in this prototype</span>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-800 text-left flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  This record is saved only in this browser. It has not been sent to a service provider and no document or e-stamp will be delivered.
                </span>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl"
                >
                  Go to Dashboard
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Delivery Speed Slider */}
              <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <div>
                      <span className="text-xs font-bold text-black block">
                        Delivery Timeline
                      </span>
                      <span className="text-[10px] text-slate-500">
                        24h standard; +₹5 per hour expedited (Min 2 Hours)
                      </span>
                    </div>
                  </div>

                  <span className="text-xs font-black text-blue-700 bg-white px-2.5 py-0.5 rounded-full border border-blue-200">
                    {deliveryHours} Hours
                  </span>
                </div>

                <input
                  type="range"
                  min="2"
                  max="24"
                  step="1"
                  value={deliveryHours}
                  onChange={(e) => setDeliveryHours(parseInt(e.target.value, 10))}
                  className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />

                <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
                  <span className="text-blue-600">2h (Max Speed)</span>
                  <span>12h Express</span>
                  <span>24h Standard</span>
                </div>

                <div className="pt-2 border-t border-blue-200/60 flex items-center justify-between text-xs">
                  <span className="text-slate-600">
                    Base: ₹{baseFee} {hoursSaved > 0 && `+ Express: ₹${fastTrackFee}`}
                  </span>
                  <div>
                    <span className="font-bold text-slate-900">
                      Total: ₹{totalFee}
                    </span>
                    <span className="text-[10px] text-emerald-600 font-semibold ml-1.5">
                      (Pay after delivery)
                    </span>
                  </div>
                </div>
              </div>

              {/* State & Denomination */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    State for e-Stamp
                  </label>
                  <select
                    value={selectedState}
                    onChange={(e) => setSelectedState(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    {INDIAN_STATES_LIST.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Stamp Value
                  </label>
                  <select
                    value={stampValue}
                    onChange={(e) => setStampValue(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    {STAMP_PAPER_VALUES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Parties */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Primary Party / Deponent *
                  </label>
                  <input
                    type="text"
                    required
                    value={party1Name}
                    onChange={(e) => setParty1Name(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Second Party / Landlord
                  </label>
                  <input
                    type="text"
                    value={party2Name}
                    onChange={(e) => setParty2Name(e.target.value)}
                    placeholder="e.g. Suresh Verma"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              {/* Mobile & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mobile Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="client@example.com"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              {/* Special conditions */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Specific Terms &amp; Conditions
                </label>
                <textarea
                  rows={2}
                  value={specialTerms}
                  onChange={(e) => setSpecialTerms(e.target.value)}
                  placeholder="e.g. Monthly rent ₹15,000, 2 months security deposit, address details..."
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
                />
              </div>

              {/* Submit */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  {isSubmitting ? 'Saving...' : 'Save Demo Record'}
                  <Sparkles className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
