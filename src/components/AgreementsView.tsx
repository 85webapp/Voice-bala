import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, FileText, Search, Mic, MicOff, X } from 'lucide-react';
import { MASTER_CATEGORIES, INITIAL_FRONT_DOCUMENTS } from '../data/documentsData';
import { LegalDocument } from '../types';

interface AgreementsViewProps {
  onSelectDocument: (doc: LegalDocument) => void;
}

export const AgreementsView: React.FC<AgreementsViewProps> = ({ onSelectDocument }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState('');
  // All dropdowns closed by default as instructed
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});

  const toggleCategory = (catId: string) => {
    setOpenCategories((prev) => ({
      ...prev,
      [catId]: !prev[catId]
    }));
  };

  const handleVoiceSearch = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-IN';
      recognition.onstart = () => {
        setVoiceError('');
        setIsListening(true);
      };
      recognition.onresult = (e: any) => {
        const text = e.results[0][0].transcript;
        setSearchQuery(text);
        setIsListening(false);
      };
      recognition.onerror = () => {
        setIsListening(false);
        setVoiceError('Voice search failed. Please type your query or try again.');
      };
      recognition.onend = () => setIsListening(false);
      recognition.start();
    } else {
      setVoiceError('Voice input is not supported by this browser. Please type your query.');
    }
  };

  const handleItemClick = (itemTitle: string, categoryName: string) => {
    const existing = INITIAL_FRONT_DOCUMENTS.find(
      (d) => d.title.toLowerCase() === itemTitle.toLowerCase()
    );

    if (existing) {
      onSelectDocument(existing);
    } else {
      const dynamicDoc: LegalDocument = {
        id: itemTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        title: itemTitle,
        category: categoryName,
        description: `${itemTitle} drafting template.`,
        standardHours: 24,
        basePrice: 299,
        requiredFields: ['First Party Name', 'Second Party Name', 'City', 'Phone Number'],
        stampDutyRecommended: '₹100 (Standard)'
      };
      onSelectDocument(dynamicDoc);
    }
  };

  // If search query is active, filter items across categories
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) {
      return MASTER_CATEGORIES;
    }
    const q = searchQuery.toLowerCase().trim();
    return MASTER_CATEGORIES.map((cat) => ({
      ...cat,
      items: cat.items.filter(
        (item) =>
          item.toLowerCase().includes(q) || cat.name.toLowerCase().includes(q)
      )
    })).filter((cat) => cat.items.length > 0);
  }, [searchQuery]);

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-5 animate-fadeIn pb-24">
      {/* Top Header: Simply "Agreements" */}
      <div className="mb-4">
        <h1 className="text-2xl font-black text-black">Agreements</h1>
      </div>
      {voiceError && <p role="alert" className="-mt-4 mb-4 text-xs text-amber-800">{voiceError}</p>}

      {/* Search Bar + Microphone */}
      <div className="relative flex items-center mb-6">
        <Search className="w-4 h-4 text-slate-400 absolute left-4 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search an Agreement or Affidavit"
          className="w-full bg-white text-slate-900 placeholder:text-slate-400 text-sm pl-11 pr-24 py-3 rounded-xl border border-slate-300 shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-600"
        />

        <div className="absolute right-2.5 flex items-center gap-1.5">
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="p-1 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={handleVoiceSearch}
            className={`p-2 rounded-lg transition-colors cursor-pointer ${
              isListening
                ? 'bg-red-500 text-white animate-pulse'
                : 'bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white'
            }`}
            title="Voice search"
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* The 7 Categories - No numbers (no 01, 02), No pre-opened dropdowns */}
      <div className="space-y-3">
        {filteredCategories.map((cat) => {
          // When searching, auto-expand matching categories; otherwise respect state
          const isOpen = searchQuery.trim() ? true : !!openCategories[cat.id];

          return (
            <div
              key={cat.id}
              className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden"
            >
              <button
                type="button"
                onClick={() => toggleCategory(cat.id)}
                className={`w-full px-4 sm:px-5 py-3.5 flex items-center justify-between text-left transition-colors cursor-pointer ${
                  isOpen ? 'bg-blue-50/50' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                      isOpen
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-blue-50 text-blue-600'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-black">{cat.name}</h2>
                    <span className="text-xs text-slate-400 font-normal">
                      {cat.items.length} legal documents
                    </span>
                  </div>
                </div>

                <div
                  className={`p-1 text-slate-400 transition-transform duration-200 ${
                    isOpen ? 'rotate-180 text-blue-600' : ''
                  }`}
                >
                  <ChevronDown className="w-5 h-5" />
                </div>
              </button>

              {/* Sub-items dropdown */}
              {isOpen && (
                <div className="px-3 sm:px-4 py-2 bg-slate-50/70 border-t border-slate-200/80 space-y-1.5 animate-fadeIn">
                  {cat.items.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleItemClick(item, cat.name)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleItemClick(item, cat.name);
                        }
                      }}
                      className="group bg-white hover:bg-blue-50 active:bg-blue-100 border border-slate-200 hover:border-blue-300 rounded-lg px-3.5 py-2.5 flex items-center justify-between cursor-pointer transition-all"
                    >
                      <span className="text-sm font-semibold text-slate-900 group-hover:text-blue-700 truncate pr-2">
                        {item}
                      </span>
                      <div className="shrink-0 flex items-center">
                        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-600 group-hover:bg-blue-700 text-white font-bold text-xs shadow-2xs transition-all">
                          <span>Make</span>
                          <span className="font-extrabold text-xs">→</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
