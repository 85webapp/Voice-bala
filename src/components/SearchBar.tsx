import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Mic,
  MicOff,
  X,
  Volume2,
  VolumeX,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Loader2
} from 'lucide-react';
import {
  SUPPORTED_LANGUAGES,
  SupportedLanguage,
  getStoredAudioLanguage,
  speechController,
  searchDocumentIntent,
  SearchIntentResult
} from '../data/voiceNarrationData';
import { INITIAL_FRONT_DOCUMENTS } from '../data/documentsData';
import { LegalDocument } from '../types';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  resultCount?: number;
  onSelectDocument?: (doc: LegalDocument) => void;
}

// Global declaration for Web Speech API
declare global {
  interface Window {
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
  }
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  onSelectDocument
}) => {
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [audioLang, setAudioLang] = useState<SupportedLanguage>(getStoredAudioLanguage);

  // AI Search states
  const [isSearchingAI, setIsSearchingAI] = useState(false);
  const [aiResult, setAiResult] = useState<SearchIntentResult | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const recognitionRef = useRef<any>(null);
  const searchTimeoutRef = useRef<any>(null);
  const searchRequestIdRef = useRef(0);
  const shouldListenRef = useRef(false);
  const recognitionRestartRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync audio language changes
  useEffect(() => {
    const handleLangChange = (e: any) => {
      if (e.detail?.lang) {
        setAudioLang(e.detail.lang);
      }
    };
    window.addEventListener('ctc_audio_language_changed', handleLangChange);
    return () => window.removeEventListener('ctc_audio_language_changed', handleLangChange);
  }, []);

  // Sync speech controller state
  useEffect(() => {
    const unsub = speechController.subscribe((speaking) => {
      setIsSpeaking(speaking);
    });
    return () => unsub();
  }, []);

  const activeLangConfig = SUPPORTED_LANGUAGES.find((l) => l.code === audioLang) || SUPPORTED_LANGUAGES[0];

  // Initialize Speech Recognition with selected language
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = activeLangConfig.speechCode;

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechError(null);
        speechController.stop();
      };

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('');
        onChange(transcript);
        const latest = event.results[event.results.length - 1];
        if (latest?.isFinal) triggerAiSearch(transcript);
      };

      recognition.onerror = (event: any) => {
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          shouldListenRef.current = false;
        }
        if (event.error === 'not-allowed') {
          setSpeechError('Microphone permission blocked. Please allow mic in your browser.');
        } else if (event.error === 'no-speech') {
          setSpeechError('No speech detected. Try speaking closer to mic.');
        } else {
          setSpeechError('Voice input error. Please try again or type.');
        }
        setTimeout(() => setSpeechError(null), 3500);
      };

      recognition.onend = () => {
        if (shouldListenRef.current) {
          if (recognitionRestartRef.current) clearTimeout(recognitionRestartRef.current);
          recognitionRestartRef.current = setTimeout(() => {
            try {
              recognition.start();
            } catch {
              shouldListenRef.current = false;
              setIsListening(false);
            }
          }, 250);
        } else {
          setIsListening(false);
        }
      };

      recognitionRef.current = recognition;
      if (shouldListenRef.current) {
        try {
          recognition.start();
        } catch {
          shouldListenRef.current = false;
          setIsListening(false);
        }
      }
    }

    return () => {
      if (recognitionRestartRef.current) clearTimeout(recognitionRestartRef.current);
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        try { recognitionRef.current.stop(); } catch {}
      }
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [activeLangConfig.speechCode, onChange]);

  // Trigger Gemini AI Intent Search
  const triggerAiSearch = (queryText: string, language: SupportedLanguage = audioLang) => {
    const requestId = ++searchRequestIdRef.current;
    if (!queryText.trim() || queryText.trim().length < 3) {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      setAiResult(null);
      setAiError(null);
      setIsSearchingAI(false);
      return;
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(async () => {
      if (requestId !== searchRequestIdRef.current) return;
      setIsSearchingAI(true);
      setAiError(null);
      try {
        const result = await searchDocumentIntent(queryText.trim(), language);
        if (requestId !== searchRequestIdRef.current) return;
        if (result) {
          setAiResult(result);
          // Play spoken readout if present
          if (result.spokenText) {
            const speechCode = SUPPORTED_LANGUAGES.find((item) => item.code === language)?.speechCode || activeLangConfig.speechCode;
            speechController.speak(result.spokenText, speechCode);
          }
        } else {
          setAiError('AI search is temporarily unavailable. Please check the server Gemini configuration and try again.');
        }
      } catch (err) {
        if (requestId !== searchRequestIdRef.current) return;
        console.warn('AI search execution error', err);
        setAiError('AI search is temporarily unavailable. Please try again.');
      } finally {
        if (requestId === searchRequestIdRef.current) setIsSearchingAI(false);
      }
    }, 600);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange(val);
    if (!val.trim()) {
      searchRequestIdRef.current += 1;
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      setIsSearchingAI(false);
      setAiResult(null);
      setAiError(null);
      speechController.stop();
    } else {
      setAiResult(null);
      setAiError(null);
      triggerAiSearch(val);
    }
  };

  const handleClear = () => {
    searchRequestIdRef.current += 1;
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    setIsSearchingAI(false);
    onChange('');
    setAiResult(null);
    setAiError(null);
    speechController.stop();
  };

  const toggleListening = () => {
    speechController.stop();

    if (!recognitionRef.current) {
      setSpeechError('Voice input is not supported by this browser. Please type your query or use a supported browser.');
      return;
    }

    if (isListening) {
      shouldListenRef.current = false;
      if (recognitionRestartRef.current) clearTimeout(recognitionRestartRef.current);
      try {
        recognitionRef.current.stop();
      } catch {}
      setIsListening(false);
    } else {
      shouldListenRef.current = true;
      try {
        recognitionRef.current.start();
      } catch {
        shouldListenRef.current = false;
        setIsListening(false);
      }
    }
  };

  const toggleSpeechAudio = () => {
    if (isSpeaking) {
      speechController.stop();
    } else if (aiResult?.spokenText) {
      speechController.speak(aiResult.spokenText, activeLangConfig.speechCode);
    }
  };

  const handleCardClick = (docId: string, title: string) => {
    speechController.stop();
    const existing = INITIAL_FRONT_DOCUMENTS.find(
      (d) => d.id === docId || d.title.toLowerCase() === title.toLowerCase()
    );
    if (existing && onSelectDocument) {
      onSelectDocument(existing);
    } else if (onSelectDocument) {
      // Dynamic document
      onSelectDocument({
        id: docId,
        title: title,
        category: 'Legal Document',
        description: `Official ${title} drafted under statutory Indian compliance.`,
        standardHours: 24,
        basePrice: 299,
        requiredFields: ['First Party Name', 'Second Party Name', 'Address', 'State'],
        stampDutyRecommended: '₹100'
      });
    }
  };

  return (
    <div className="w-full mb-3">
      {/* Search Input Bar */}
      <div className="relative flex items-center">
        {/* Left Search Icon or Loading Spinner */}
        <div className="absolute left-4 pointer-events-none text-slate-400">
          {isSearchingAI ? (
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
          ) : (
            <Search className="w-5 h-5 text-slate-500" />
          )}
        </div>

        {/* Main Search Input: Strictly "Search an Agreement or Affidavit" */}
        <input
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              triggerAiSearch(value);
            }
          }}
          placeholder="Search an Agreement or Affidavit"
          aria-label="Search an Agreement or Affidavit"
          className="w-full bg-white text-slate-900 placeholder:text-slate-400 text-sm sm:text-base font-medium pl-12 pr-28 py-3.5 rounded-xl border border-slate-300 shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all"
        />

        {/* Right Action Buttons */}
        <div className="absolute right-2.5 flex items-center gap-1.5">
          {/* Clear button */}
          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Glowing Speaker Audio Indicator if speech is available/playing */}
          {aiResult?.spokenText && (
            <button
              type="button"
              onClick={toggleSpeechAudio}
              className={`p-2 rounded-lg transition-all duration-200 cursor-pointer flex items-center justify-center ${
                isSpeaking
                  ? 'bg-amber-500 text-white animate-pulse shadow-md shadow-amber-500/30 ring-2 ring-amber-400'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
              title={isSpeaking ? 'Stop Spoken Audio' : 'Listen Explanation'}
              aria-label={isSpeaking ? 'Stop speaking' : 'Listen explanation'}
            >
              {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-blue-600" />}
            </button>
          )}

          {/* Microphone Voice Button */}
          <button
            type="button"
            onClick={toggleListening}
            aria-label={isListening ? 'Stop listening' : 'Search by Voice'}
            className={`p-2 rounded-lg transition-all duration-200 cursor-pointer flex items-center justify-center ${
              isListening
                ? 'bg-red-500 text-white animate-pulse shadow-md shadow-red-500/30 ring-2 ring-red-400'
                : 'bg-slate-100 text-black hover:bg-slate-200'
            }`}
            title={isListening ? 'Listening... Speak now' : 'Search by Voice'}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Gemini API error */}
      {aiError && (
        <div role="alert" className="mt-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{aiError}</span>
        </div>
      )}

      {/* Microphone Error Message */}
      {speechError && (
        <div className="mt-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center gap-2 animate-fadeIn">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{speechError}</span>
        </div>
      )}

      {/* AI INTENT SEARCH RESULT: STRICT REFUSAL CARD */}
      {aiResult && aiResult.refusal && (
        <div className="mt-3 p-4 bg-rose-50 border-2 border-rose-300 rounded-2xl shadow-sm text-rose-900 animate-fadeIn">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-700 bg-rose-100 px-2 py-0.5 rounded">
                  Service Not Available
                </span>
                {aiResult.spokenText && (
                  <button
                    type="button"
                    onClick={toggleSpeechAudio}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                      isSpeaking ? 'bg-rose-600 text-white animate-pulse' : 'bg-rose-200 text-rose-800 hover:bg-rose-300'
                    }`}
                  >
                    {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                    <span>{isSpeaking ? 'Stop Audio' : 'Listen Advisory'}</span>
                  </button>
                )}
              </div>

              <h3 className="text-sm sm:text-base font-bold text-rose-950 mt-1">
                {aiResult.forbiddenCategory || 'This legal filing'} is not available in this prototype
              </h3>

              <p className="text-xs sm:text-sm text-rose-800 mt-1 leading-relaxed">
                {aiResult.refusalReason}
              </p>

              <div className="mt-2.5 pt-2.5 border-t border-rose-200 text-[11px] text-rose-700 flex items-center gap-2">
                Contact the relevant government authority or a qualified legal professional to confirm the requirements for your situation.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI INTENT SEARCH RESULT: MATCHED LEGAL RECOMMENDATION */}
      {aiResult && !aiResult.refusal && aiResult.matches && aiResult.matches.length > 0 && (
        <div className="mt-3 p-4 bg-blue-50/70 border border-blue-200 rounded-2xl shadow-2xs animate-fadeIn">
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-1.5 text-blue-900 font-bold text-xs sm:text-sm">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>AI Legal Recommendation</span>
            </div>

            {aiResult.spokenText && (
              <button
                type="button"
                onClick={toggleSpeechAudio}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                  isSpeaking ? 'bg-blue-600 text-white animate-pulse shadow-sm' : 'bg-white text-blue-700 border border-blue-200 hover:bg-blue-100'
                }`}
              >
                {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                <span>{isSpeaking ? 'Stop Voice' : 'Listen Voice'}</span>
              </button>
            )}
          </div>

          {/* Spoken summary text display */}
          {aiResult.spokenText && (
            <p className="text-xs text-blue-950 bg-white/80 p-2.5 rounded-xl border border-blue-100 mb-3 leading-relaxed">
              &ldquo;{aiResult.spokenText}&rdquo;
            </p>
          )}

          {/* Matched Document Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {aiResult.matches.slice(0, 3).map((match) => (
              <div
                key={match.id}
                onClick={() => handleCardClick(match.id, match.title)}
                className="bg-white hover:bg-blue-600 hover:text-white p-3 rounded-xl border border-blue-200/80 shadow-2xs transition-all duration-200 cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] text-blue-600 group-hover:text-blue-100 font-medium mb-1">
                    <span>{match.category}</span>
                    <span className="bg-blue-50 group-hover:bg-blue-500 text-blue-700 group-hover:text-white px-1.5 py-0.5 rounded text-[10px] font-bold">
                      {Math.round((match.matchScore || 0.9) * 100)}% Match
                    </span>
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-white">
                    {match.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 group-hover:text-blue-100 mt-1 line-clamp-2">
                    {match.explanation}
                  </p>
                </div>

                <div className="mt-2 pt-2 border-t border-slate-100 group-hover:border-blue-500 flex items-center justify-between text-xs font-bold text-blue-600 group-hover:text-white">
                  <span>Start Draft</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
