import React, { useState } from 'react';
import { X, Clock, Zap, ShieldCheck, ArrowRight } from 'lucide-react';
import { INITIAL_FRONT_DOCUMENTS } from '../data/documentsData';
import { LegalDocument } from '../types';

interface DeliveryCalculatorModalProps {
  onClose: () => void;
  onSelectDocument: (doc: LegalDocument) => void;
}

export const DeliveryCalculatorModal: React.FC<DeliveryCalculatorModalProps> = ({
  onClose,
  onSelectDocument
}) => {
  const [hours, setHours] = useState<number>(12);
  const [selectedDocId, setSelectedDocId] = useState<string>(INITIAL_FRONT_DOCUMENTS[0].id);

  const selectedDoc =
    INITIAL_FRONT_DOCUMENTS.find((d) => d.id === selectedDocId) ||
    INITIAL_FRONT_DOCUMENTS[0];

  const hoursSaved = Math.max(0, 24 - hours);
  const fastTrackFee = hoursSaved * 5;
  const basePrice = selectedDoc.basePrice;
  const totalPrice = basePrice + fastTrackFee;

  const handleProceed = () => {
    onClose();
    onSelectDocument(selectedDoc);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-black">
                Express Fast-Track Calculator
              </h3>
              <p className="text-xs text-blue-600 font-semibold">
                त्वरित डिलीवरी समय एवं शुल्क कैलकुलेटर
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close calculator"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto">
          {/* Formula description as explicitly given by user */}
          <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 text-xs text-slate-700 space-y-1 leading-relaxed">
            <span className="font-bold text-blue-900">
              आधिकारिक नियम (Official Delivery Tariff):
            </span>
            <p>
              24 घंटे के अंदर हम आपको एग्रीमेंट बना के देते हैं। यदि आपको जल्दी चाहिए, तो हम लोग पर आवर का <strong>₹5 चार्ज करते हैं</strong>।
            </p>
            <p className="text-slate-500 text-[11px]">
              जैसे 23 घंटे में ₹5 ज्यादा, 22 घंटे में ₹10 ज्यादा... न्यूनतम 2 घंटे लगेंगे।
            </p>
          </div>

          {/* Select Document */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              Select Document or Affidavit
            </label>
            <select
              value={selectedDocId}
              onChange={(e) => setSelectedDocId(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
            >
              {INITIAL_FRONT_DOCUMENTS.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.title} (₹{doc.basePrice})
                </option>
              ))}
            </select>
          </div>

          {/* Hours Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">
                Choose Delivery Timeline (घंटे चुनें):
              </span>
              <span className="text-sm font-black text-blue-600 bg-blue-50 px-3 py-0.5 rounded-full border border-blue-200">
                {hours} Hours
              </span>
            </div>

            <input
              type="range"
              min="2"
              max="24"
              step="1"
              value={hours}
              onChange={(e) => setHours(parseInt(e.target.value, 10))}
              className="w-full h-2 bg-blue-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />

            <div className="flex justify-between text-[11px] text-slate-500 font-semibold pt-0.5">
              <span className="text-blue-700">2 Hours (Min legal limit)</span>
              <span>12 Hours</span>
              <span>24 Hours (Standard)</span>
            </div>
          </div>

          {/* Live Math Calculation Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Standard Base Price:</span>
              <span className="font-semibold text-slate-900">₹{basePrice}</span>
            </div>

            <div className="flex justify-between text-slate-600">
              <span>
                Urgent Expedited Time ({hoursSaved}h saved @ ₹5/h):
              </span>
              <span className="font-semibold text-blue-700">
                +₹{fastTrackFee}
              </span>
            </div>

            <div className="border-t border-slate-200 pt-2 flex justify-between items-center text-sm">
              <span className="font-bold text-black">Total Amount:</span>
              <div className="text-right">
                <span className="text-lg font-black text-slate-900">
                  ₹{totalPrice}
                </span>
                <span className="block text-[10px] text-emerald-600 font-bold">
                  (Pay strictly after delivery!)
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              ₹0 Upfront. Payment is received only after delivery of the document.
            </span>
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleProceed}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <span>इस समय में बनवाएं (Order with this timeline)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
