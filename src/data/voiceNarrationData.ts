// Multilingual Voice Explainer & Speech Synthesis Data for Legal Wizards
// Sweet, conversational Hindi & multilingual spoken explanations explaining what to enter and why
import { INITIAL_FRONT_DOCUMENTS } from './documentsData';

export type SupportedLanguage = 'hi' | 'en' | 'mr' | 'gu' | 'ml' | 'ta' | 'te' | 'bn' | 'kn' | 'pa';

export interface LanguageOption {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  speechCode: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'hi', name: 'Hindi', nativeName: 'हिंदी', speechCode: 'hi-IN' },
  { code: 'en', name: 'English', nativeName: 'English', speechCode: 'en-IN' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', speechCode: 'mr-IN' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', speechCode: 'gu-IN' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', speechCode: 'pa-IN' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', speechCode: 'ml-IN' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', speechCode: 'ta-IN' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', speechCode: 'te-IN' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', speechCode: 'bn-IN' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', speechCode: 'kn-IN' }
];

// Narration text is generated dynamically by the server-side Gemini endpoints.

class SpeechController {
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isSpeakingState = false;
  private listeners: ((speaking: boolean) => void)[] = [];
  private keepAliveTimer: any = null;

  constructor() {
    this.isSpeakingState = false;
  }

  public subscribe(fn: (speaking: boolean) => void) {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn);
    };
  }

  private notify(state: boolean) {
    this.isSpeakingState = state;
    this.listeners.forEach((fn) => fn(state));
  }

  private clearKeepAlive() {
    if (this.keepAliveTimer) {
      clearInterval(this.keepAliveTimer);
      this.keepAliveTimer = null;
    }
  }

  private startKeepAlive() {
    this.clearKeepAlive();
    this.keepAliveTimer = setInterval(() => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window && this.isSpeakingState) {
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      }
    }, 9000);
  }

  public speak(text: string, langCode: string) {
    try {
      if (typeof window === 'undefined' || !('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') return;
      const cleanText = text.replace(/[*_#]/g, '').trim();
      if (!cleanText) return;

      this.stop();
      const synthesis = window.speechSynthesis;
      if (synthesis.paused) synthesis.resume();

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = langCode;
      utterance.rate = 0.93;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      const voices = synthesis.getVoices();
      const languagePrefix = langCode.split('-')[0].toLowerCase();
      const matchingVoice =
        voices.find((v) => (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Neural') || v.name.includes('Swara') || v.name.includes('Neerja') || v.name.includes('India')) && v.lang.toLowerCase().startsWith(languagePrefix)) ||
        voices.find((v) => v.lang.toLowerCase() === langCode.toLowerCase()) ||
        voices.find((v) => v.lang.toLowerCase().startsWith(`${languagePrefix}-`));
      if (matchingVoice) utterance.voice = matchingVoice;

      utterance.onstart = () => {
        this.notify(true);
        this.startKeepAlive();
      };
      utterance.onend = () => {
        this.clearKeepAlive();
        this.notify(false);
        this.currentUtterance = null;
      };
      utterance.onerror = (e) => {
        this.clearKeepAlive();
        this.notify(false);
        this.currentUtterance = null;
      };

      this.currentUtterance = utterance;
      synthesis.speak(utterance);
    } catch (error) {
      console.warn('Speech synthesis is unavailable:', error);
      this.clearKeepAlive();
      this.currentUtterance = null;
      this.notify(false);
    }
  }

  public stop() {
    this.clearKeepAlive();
    try {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
    } catch (error) {
      console.warn('Could not stop speech synthesis:', error);
    }
    this.currentUtterance = null;
    this.notify(false);
  }

  public isSpeaking(): boolean {
    return this.isSpeakingState;
  }
}

export const speechController = new SpeechController();

// Preferences & Storage Key for Audio Explainer Language
export const AUDIO_LANG_STORAGE_KEY = 'ctc_audio_language_v2';

export function getStoredAudioLanguage(): SupportedLanguage {
  try {
    const saved = localStorage.getItem(AUDIO_LANG_STORAGE_KEY) as SupportedLanguage;
    if (saved && SUPPORTED_LANGUAGES.some((l) => l.code === saved)) {
      return saved;
    }
  } catch {}
  return 'hi'; // Default Hindi per user instruction
}

export function setStoredAudioLanguage(lang: SupportedLanguage) {
  try {
    localStorage.setItem(AUDIO_LANG_STORAGE_KEY, lang);
    window.dispatchEvent(new CustomEvent('ctc_audio_language_changed', { detail: { lang } }));
  } catch {}
}

export function getServiceVoiceScript(serviceTitle: string, lang: SupportedLanguage): string {
  const lower = serviceTitle.toLowerCase();
  
  if (lower.includes('gst reg') || (lower.includes('gst') && lower.includes('registration'))) {
    if (lang === 'hi') {
      return "जीएसटी रजिस्ट्रेशन के लिए आप चाहें तो यह 4-स्टेप फॉर्म खुद भर सकते हैं, या ऊपर दिए गए रिक्वेस्ट स्लाइडर पर क्लिक करके केवल अपना नाम और नंबर सबमिट कर सकते हैं। हमारे कंप्लायंस ऑफिसर एक घंटे के अंदर आपसे संपर्क करेंगे और आपका जीएसटी रजिस्ट्रेशन पूरा करवा देंगे।";
    }
    return "For GST Registration, you can complete this 4-step form, or switch to the Request tab above to submit your basic details. Our agent will call you within one hour to assist and process your GSTIN.";
  }

  if (lower.includes('udyam') || lower.includes('msme')) {
    if (lang === 'hi') {
      return "उद्यम रजिस्ट्रेशन के लिए आप यह 5-स्टेप फॉर्म भर सकते हैं या रिक्वेस्ट स्लाइडर पर क्लिक करके अपनी बेसिक डिटेल्स सबमिट कर सकते हैं। हमारी टीम एक घंटे के अंदर आपसे संपर्क करेगी और तुरंत आपका उद्यम सर्टिफिकेट प्रोसेस करके आपको हैंडओवर कर देगी।";
    }
    return "For Udyam Registration, you can fill this complete 5-step form or switch to Request to submit basic details. Our team will coordinate with you within one hour to issue your Udyam Certificate.";
  }

  if (lower.includes('insurance')) {
    if (lower.includes('other')) {
      if (lang === 'hi') {
        return "आपने अन्य वाहन बीमा चुना है। आप अपनी डिटेल्स सबमिट करके रिक्वेस्ट भेज सकते हैं। एक घंटे के भीतर आपसे संपर्क किया जाएगा या आप सीधे कॉल अथवा व्हाट्सएप बटन पर क्लिक करके संपर्क कर सकते हैं, क्योंकि बीमा के लिए कोऑर्डिनेशन जरूरी है।";
      }
      return "You have selected Other Vehicle Insurance. Submit this form request and our team will contact you within one hour, or call our 24/7 support line directly.";
    }
    if (lang === 'hi') {
      return "वाहन बीमा के लिए आप यह फॉर्म भरकर रिक्वेस्ट सबमिट कर सकते हैं। एक घंटे में हमारे एजेंट आपसे संपर्क करेंगे या आप सीधे कॉल अथवा व्हाट्सएप पर बात कर सकते हैं, क्योंकि यह केवल फॉर्म से संभव नहीं है और कोऑर्डिनेशन जरूरी है।";
    }
    return "For vehicle insurance, submit your details and our policy agent will reach out within one hour. You can also connect directly via phone call or WhatsApp for instant quotation.";
  }

  if (lower.includes('gst filing') || (lower.includes('gst') && lower.includes('filing'))) {
    if (lang === 'hi') {
      return "जीएसटी फाइलिंग केवल एक फॉर्म से नहीं की जा सकती, इसके लिए समन्वय जरूरी है। आप फॉर्म भरकर रिक्वेस्ट भेज सकते हैं, हमारे एजेंट एक घंटे में आपसे संपर्क करेंगे या आप डायरेक्ट कॉल अथवा व्हाट्सएप पर बात कर सकते हैं।";
    }
    return "GST filing requires invoice reconciliation and return coordination. Submit your details for our tax advisor to call you within one hour, or contact us directly via call or WhatsApp.";
  }

  if (lower.includes('income tax') || lower.includes('itr')) {
    if (lang === 'hi') {
      return "इनकम टैक्स फाइलिंग केवल फॉर्म से नहीं हो सकती, इसके लिए कोऑर्डिनेशन जरूरी है। आप फॉर्म सबमिट कर दें, हमारी टीम एक घंटे में आपको संपर्क करेगी या आप डायरेक्ट कॉल अथवा व्हाट्सएप पर बात कर सकते हैं।";
    }
    return "Income tax return filing requires financial computation. Submit your details for our tax team to connect within one hour, or call our 24/7 support desk.";
  }

  if (lower.includes('other filing')) {
    if (lang === 'hi') {
      return "आपने अदर फाइलिंग सेलेक्ट किया है। यह केवल फॉर्म से फाइल नहीं हो सकती। आप यह फॉर्म सबमिट कर दें, एक घंटे में टीम आपसे संपर्क करेगी या आप डायरेक्ट कॉल अथवा व्हाट्सएप कर सकते हैं।";
    }
    return "For custom filing requests, submit your requirement description. Our compliance team will reach out within one hour, or contact us via call or WhatsApp.";
  }

  // Other legal registrations: Pvt Ltd, LLP, Trademark, FSSAI
  if (lang === 'hi') {
    return "यह रजिस्ट्रेशन एक कानूनी और तकनीकी प्रक्रिया है। आप यहाँ फॉर्म भरकर रिक्वेस्ट सबमिट कर सकते हैं, एक घंटे में हमारे एजेंट आपसे बात करेंगे या आप डायरेक्ट कॉल सपोर्ट अथवा व्हाट्सएप पर बात कर सकते हैं।";
  }
  return "This registration involves statutory compliance. Submit this request for our experts to contact you within one hour, or connect directly via Call Support or WhatsApp.";
}

/** Collect visible form labels from the active document wizard, not hidden templates. */
export function getVisibleFormLabels(): string[] {
  if (typeof document === 'undefined') return [];
  const roots = Array.from(document.querySelectorAll<HTMLElement>('[data-document-wizard]'))
    .filter((el) => el.getClientRects().length > 0);
  const root = roots[0] || document.body;
  const selectors = 'label, legend, [aria-label], [data-field-label], .field-label';
  const seen = new Set<string>();
  return Array.from(root.querySelectorAll<HTMLElement>(selectors))
    .filter((el) => el.getClientRects().length > 0)
    .filter((el) => !el.closest('button,[data-display-language-ignore]'))
    .map((el) => (el.innerText || el.getAttribute('aria-label') || el.getAttribute('data-field-label') || '').replace(/\s+/g, ' ').trim())
    .filter((text) => text.length > 1 && text.length < 180)
    .filter((text) => { const key = text.toLocaleLowerCase(); if (seen.has(key)) return false; seen.add(key); return true; })
    .slice(0, 80);
}

/** Resolve the real visible label for a speaker button's field key when possible. */
export function getVisibleFieldLabel(fieldKey: string): string {
  if (typeof document !== 'undefined') {
    const key = fieldKey.toLowerCase().replace(/[^a-z0-9]/g, '');
    const root = Array.from(document.querySelectorAll<HTMLElement>('[data-document-wizard]'))
      .find((element) => element.getClientRects().length > 0) || document;
    const labels = Array.from(root.querySelectorAll<HTMLElement>('label, legend, [data-field-label]'))
      .filter((element) => element.getClientRects().length > 0)
      .map((element) => element.textContent?.replace(/\s+/g, ' ').trim() || '')
      .filter(Boolean);
    const fieldHints: Record<string, string[]> = {
      landlordentity: ['landlord standing', 'entity type'],
      landlordname: ['landlord full legal name', 'full legal name'],
      tenantname: ['tenant full legal name', 'tenant name'],
      landlordfathername: ["father's / husband's name", "father's name"],
      tenantfathername: ["father's / husband's name", "father's name"],
      landlordage: ['age / date of birth', 'date of incorporation'],
      landlordaddress: ['landlord permanent address', 'permanent address'],
      tenantaddress: ['tenant permanent address', 'permanent address'],
      landlordmobile: ['landlord mobile number', 'mobile number'],
      tenantmobile: ['tenant mobile number', 'mobile number'],
      landlordemail: ['landlord email', 'email address'],
      tenantemail: ['tenant email', 'email address'],
      landlordaadhaar: ['aadhaar number'],
      landlordpan: ['pan number', 'pan card'],
      tenantpan: ['tenant pan', 'pan number'],
      gstpincode: ['pin code', 'pincode'],
      gstjurisdiction: ['gst jurisdiction', 'commissionerate'],
      gstpremisestype: ['premises type'],
      gsttradename: ['trade name'],
      gstlegalname: ['legal name'],
      landlordnocbizcategory: ['business category', 'business activity'],
      stampborneby: ['stamp duty borne by', 'who bears stamp duty'],
      stampvalue: ['stamp paper value', 'stamp denomination'],
      executionmode: ['execution mode', 'signing mode'],
      propertyproof: ['property proof', 'ownership proof'],
      leasetenure: ['lease tenure', 'tenure'],
      monthlyrent: ['monthly rent'],
      securitydeposit: ['security deposit'],
      noticeperiod: ['notice period'],
      rentescalation: ['rent escalation'],
      lockinperiod: ['lock-in period', 'lock in period'],
      commercialfirmname: ['firm name', 'business name'],
      commercialpan: ['company pan', 'pan number'],
      commercialcin: ['cin number', 'corporate identification number'],
      commercialgstin: ['gstin'],
      commercialsignatory: ['authorized signatory', 'signatory name']
    };
    const hints = fieldHints[key];
    if (hints) {
      const hintedLabel = labels.find((label) => hints.some((hint) => label.toLowerCase().includes(hint)));
      if (hintedLabel) return hintedLabel;
    }

    const controls = Array.from(root.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('input, select, textarea'));
    const candidates = controls.map((control) => {
      const controlKey = `${control.id} ${control.name} ${control.getAttribute('data-field-key') || ''}`.toLowerCase().replace(/[^a-z0-9]/g, '');
      const score = controlKey === key ? 100 : controlKey.includes(key) ? 80 : key.includes(controlKey) && controlKey.length >= 5 ? 50 : 0;
      return { control, score };
    }).filter((candidate) => candidate.score > 0).sort((a, b) => b.score - a.score);
    for (const { control } of candidates) {
      const label = control.labels?.[0] || control.closest('label');
      if (label?.textContent?.trim()) return label.textContent.replace(/\s+/g, ' ').trim();
      const labelledBy = control.getAttribute('aria-labelledby');
      if (labelledBy) {
        const text = labelledBy.split(/\s+/).map((id) => document.getElementById(id)?.textContent || '').join(' ').trim();
        if (text) return text;
      }
      const aria = control.getAttribute('aria-label');
      if (aria) return aria.trim();
      const wrapperLabel = control.parentElement?.querySelector<HTMLElement>('label, legend, [data-field-label]');
      if (wrapperLabel?.textContent?.trim()) return wrapperLabel.textContent.replace(/\s+/g, ' ').trim();
      const placeholder = control.getAttribute('placeholder');
      if (placeholder) return placeholder.trim();
    }

    const fieldTokens = fieldKey.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase().split(/[^a-z0-9]+/).filter((token) => token.length > 2);
    const matchingLabel = labels.map((label) => {
      const labelTokens = label.toLowerCase().split(/[^a-z0-9]+/).filter((token) => token.length > 2);
      const score = fieldTokens.reduce((total, token) => total + (labelTokens.includes(token) ? Math.min(token.length, 5) : 0), 0);
      return { label, score };
    }).sort((a, b) => b.score - a.score)[0];
    if (matchingLabel?.score >= 3) return matchingLabel.label;
  }
  return fieldKey.replace(/[-_]/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/\b\w/g, (c) => c.toUpperCase());
}

export interface SearchIntentResult {
  refusal: boolean;
  forbiddenCategory?: string;
  refusalReason?: string;
  spokenText: string;
  matches: Array<{
    id: string;
    title: string;
    category: string;
    matchScore: number;
    explanation: string;
  }>;
}

const PAGE_EXPLANATION_FALLBACKS: Record<SupportedLanguage, (page: string, fields: string) => string> = {
  hi: (page, fields) => { const details = fields ? `इसमें ${fields} की जानकारी दें। ` : ''; return `${page} इस फॉर्म का मौजूदा चरण है। ${details}यह जानकारी दस्तावेज़ को सही ढंग से तैयार करने और आपके विवरणों की पुष्टि करने के लिए आवश्यक है। आधिकारिक रिकॉर्ड के अनुसार सही और पूरा विवरण भरें।`; },
  en: (page, fields) => { const details = fields ? `Enter the requested details: ${fields}. ` : ''; return `${page} is the current step of this form. ${details}These details help prepare the document accurately and verify the information. Use the exact information shown on your supporting records.`; },
  mr: (page, fields) => { const details = fields ? `मागितलेली माहिती भरा: ${fields}. ` : ''; return `${page} हा या फॉर्मचा सध्याचा टप्पा आहे. ${details}दस्तऐवज अचूक तयार करण्यासाठी आणि माहितीची पडताळणी करण्यासाठी हे तपशील आवश्यक आहेत. अधिकृत नोंदींनुसार माहिती भरा.`; },
  gu: (page, fields) => { const details = fields ? `માગેલી વિગતો ભરો: ${fields}. ` : ''; return `${page} આ ફોર્મનું વર્તમાન પગલું છે. ${details}દસ્તાવેજ સચોટ બનાવવા અને માહિતી ચકાસવા માટે આ વિગતો જરૂરી છે. તમારા સત્તાવાર રેકોર્ડ મુજબ માહિતી ભરો.`; },
  pa: (page, fields) => { const details = fields ? `ਮੰਗੀ ਗਈ ਜਾਣਕਾਰੀ ਭਰੋ: ${fields}। ` : ''; return `${page} ਇਸ ਫਾਰਮ ਦਾ ਮੌਜੂਦਾ ਪੜਾਅ ਹੈ। ${details}ਦਸਤਾਵੇਜ਼ ਸਹੀ ਤਰ੍ਹਾਂ ਤਿਆਰ ਕਰਨ ਅਤੇ ਵੇਰਵਿਆਂ ਦੀ ਪੁਸ਼ਟੀ ਲਈ ਇਹ ਜਾਣਕਾਰੀ ਲੋੜੀਂਦੀ ਹੈ। ਆਪਣੇ ਅਧਿਕਾਰਤ ਰਿਕਾਰਡਾਂ ਅਨੁਸਾਰ ਵੇਰਵੇ ਭਰੋ।`; },
  ml: (page, fields) => { const details = fields ? `ആവശ്യപ്പെട്ട വിവരങ്ങൾ നൽകുക: ${fields}. ` : ''; return `${page} ഈ ഫോമിന്റെ നിലവിലെ ഘട്ടമാണ്. ${details}രേഖ കൃത്യമായി തയ്യാറാക്കാനും വിവരങ്ങൾ പരിശോധിക്കാനും ഈ വിവരങ്ങൾ ആവശ്യമാണ്. ഔദ്യോഗിക രേഖകളിലുള്ളതുപോലെ വിവരങ്ങൾ നൽകുക.`; },
  ta: (page, fields) => { const details = fields ? `கேட்கப்பட்ட விவரங்களை உள்ளிடவும்: ${fields}. ` : ''; return `${page} இந்தப் படிவத்தின் தற்போதைய படியாகும். ${details}ஆவணத்தைத் துல்லியமாகத் தயாரிக்கவும் தகவல்களைச் சரிபார்க்கவும் இந்த விவரங்கள் தேவை. உங்கள் அதிகாரப்பூர்வ பதிவுகளின்படி நிரப்பவும்.`; },
  te: (page, fields) => { const details = fields ? `అడిగిన వివరాలను నమోదు చేయండి: ${fields}. ` : ''; return `${page} ఈ ఫారమ్‌లో ప్రస్తుత దశ. ${details}పత్రాన్ని సరిగ్గా సిద్ధం చేయడానికి, సమాచారాన్ని ధృవీకరించడానికి ఈ వివరాలు అవసరం. అధికారిక రికార్డుల ప్రకారం నమోదు చేయండి.`; },
  bn: (page, fields) => { const details = fields ? `চাওয়া তথ্য লিখুন: ${fields}। ` : ''; return `${page} এই ফর্মের বর্তমান ধাপ। ${details}নথিটি সঠিকভাবে তৈরি ও তথ্য যাচাই করতে এই বিবরণগুলি প্রয়োজন। আপনার সরকারি নথি অনুযায়ী তথ্য দিন।`; },
  kn: (page, fields) => { const details = fields ? `ಕೇಳಲಾದ ವಿವರಗಳನ್ನು ನಮೂದಿಸಿ: ${fields}. ` : ''; return `${page} ಈ ಫಾರ್ಮ್‌ನ ಪ್ರಸ್ತುತ ಹಂತವಾಗಿದೆ. ${details}ದಾಖಲೆಯನ್ನು ಸರಿಯಾಗಿ ಸಿದ್ಧಪಡಿಸಲು ಮತ್ತು ಮಾಹಿತಿಯನ್ನು ಪರಿಶೀಲಿಸಲು ಈ ವಿವರಗಳು ಅಗತ್ಯ. ಅಧಿಕೃತ ದಾಖಲೆಗಳಲ್ಲಿರುವಂತೆ ನಮೂದಿಸಿ.`; }
};

const FIELD_EXPLANATION_FALLBACKS: Record<SupportedLanguage, (field: string, document: string, context: string) => string> = {
  hi: (field, document, context) => { const detail = context ? `(${context}) के अनुसार ` : ''; return `${field} में ${detail}अपनी सही जानकारी भरें। ${document} तैयार करने और आपके विवरण की पुष्टि करने के लिए यह जानकारी आवश्यक है।`; },
  en: (field, document, context) => { const detail = context ? ` (${context})` : ''; return `Enter the accurate information requested in ${field}${detail}. This is needed to prepare ${document} correctly and verify the details you provide.`; },
  mr: (field, document, context) => { const detail = context ? ` (${context})` : ''; return `${field}${detail} मध्ये अचूक माहिती भरा. ${document} योग्यरीत्या तयार करण्यासाठी आणि तपशील पडताळण्यासाठी ही माहिती आवश्यक आहे.`; },
  gu: (field, document, context) => { const detail = context ? ` (${context})` : ''; return `${field}${detail} માં સાચી માહિતી ભરો. ${document} યોગ્ય રીતે તૈયાર કરવા અને વિગતો ચકાસવા માટે આ માહિતી જરૂરી છે.`; },
  pa: (field, document, context) => { const detail = context ? ` (${context})` : ''; return `${field}${detail} ਵਿੱਚ ਸਹੀ ਜਾਣਕਾਰੀ ਭਰੋ। ${document} ਨੂੰ ਠੀਕ ਤਰ੍ਹਾਂ ਤਿਆਰ ਕਰਨ ਅਤੇ ਵੇਰਵਿਆਂ ਦੀ ਜਾਂਚ ਲਈ ਇਹ ਜਾਣਕਾਰੀ ਲੋੜੀਂਦੀ ਹੈ।`; },
  ml: (field, document, context) => { const detail = context ? ` (${context})` : ''; return `${field}${detail} എന്നതിൽ ശരിയായ വിവരം നൽകുക. ${document} കൃത്യമായി തയ്യാറാക്കാനും വിശദാംശങ്ങൾ പരിശോധിക്കാനും ഇത് ആവശ്യമാണ്.`; },
  ta: (field, document, context) => { const detail = context ? ` (${context})` : ''; return `${field}${detail} என்பதில் சரியான தகவலை உள்ளிடவும். ${document} துல்லியமாகத் தயாரிக்கவும் விவரங்களைச் சரிபார்க்கவும் இது தேவை.`; },
  te: (field, document, context) => { const detail = context ? ` (${context})` : ''; return `${field}${detail} లో సరైన సమాచారాన్ని నమోదు చేయండి. ${document} ను సరిగ్గా సిద్ధం చేయడానికి, వివరాలను ధృవీకరించడానికి ఇది అవసరం.`; },
  bn: (field, document, context) => { const detail = context ? ` (${context})` : ''; return `${field}${detail}-এ সঠিক তথ্য লিখুন। ${document} সঠিকভাবে তৈরি ও বিবরণ যাচাই করতে এটি প্রয়োজন।`; },
  kn: (field, document, context) => { const detail = context ? ` (${context})` : ''; return `${field}${detail} ನಲ್ಲಿ ಸರಿಯಾದ ಮಾಹಿತಿಯನ್ನು ನಮೂದಿಸಿ. ${document} ಅನ್ನು ಸರಿಯಾಗಿ ಸಿದ್ಧಪಡಿಸಲು ಮತ್ತು ವಿವರಗಳನ್ನು ಪರಿಶೀಲಿಸಲು ಇದು ಅಗತ್ಯ.`; }
};

function pageExplanationFallback(pageNumber: number, pageTitle: string, fields: string[], language: SupportedLanguage): string {
  const fieldList = fields.slice(0, 6).join(', ');
  return PAGE_EXPLANATION_FALLBACKS[language](`Page ${pageNumber}: ${pageTitle}`, fieldList);
}

function fieldExplanationFallback(documentTitle: string, fieldLabel: string, context: string, language: SupportedLanguage): string {
  return FIELD_EXPLANATION_FALLBACKS[language](fieldLabel, documentTitle, context.slice(0, 140));
}

const DOCUMENT_INTENT_TERMS: Record<string, string[]> = {
  'rent-11-month': ['rent', 'rental', 'house rent', 'home rent', 'kiraya', 'किराया', 'tenant', 'tenancy', 'house agreement', 'residential lease'],
  'landlord-noc-business': ['landlord noc', 'business noc', 'shop permission', 'business address', 'trade license'],
  'sub-lease-agreement': ['sublease', 'sub-lease', 'sub lease', 'subletting', 'secondary tenant'],
  'landlord-noc-gst': ['gst noc', 'gst landlord', 'gst address', 'gst registration premises'],
  'brand-sponsorship-promo': ['brand sponsorship', 'sponsor creator', 'brand promotion'],
  'influencer-collab-agreement': ['influencer', 'collaboration', 'brand collab', 'social media creator'],
  'content-rights-copyright': ['copyright', 'content rights', 'transfer content', 'intellectual property'],
  'freelancer-client-contract': ['freelancer', 'freelance', 'client service', 'independent contractor'],
  'nda-agreement': ['nda', 'non disclosure', 'confidentiality', 'secret information'],
  'video-audio-release-form': ['video release', 'audio release', 'model release', 'recording permission'],
  'partnership-deed': ['partnership deed', 'business partners', 'profit sharing'],
  'proprietorship-declaration-deed': ['proprietorship', 'sole proprietor', 'sole trader'],
  'founder-co-founder-agreement': ['founder', 'cofounder', 'co-founder', 'startup equity'],
  'vendor-supplier-agreement': ['vendor', 'supplier', 'supply contract', 'procurement'],
  'software-it-service-agreement': ['software', 'it service', 'saas', 'app development', 'developer contract'],
  'job-work-manufacturing-agreement': ['job work', 'manufacturing', 'factory production'],
  'equipments-machinery-lease': ['equipment lease', 'machinery lease', 'machine rental'],
  'website-app-terms-privacy': ['website terms', 'app terms', 'privacy policy', 'terms of service'],
  'name-change-affidavit': ['name change', 'change name', 'नाम बदलना', 'नाम परिवर्तन'],
  'address-proof-affidavit': ['address proof', 'address correction', 'residence proof', 'पता सुधार'],
  'dob-correction-affidavit': ['date of birth', 'dob correction', 'birth date correction', 'जन्म तिथि'],
  'loss-of-document-affidavit': ['lost document', 'missing certificate', 'document lost', 'खोया हुआ दस्तावेज'],
  'anti-ragging-gap-year-affidavit': ['anti ragging', 'ragging', 'gap year', 'education gap'],
  'income-unemployment-affidavit': ['income affidavit', 'unemployment', 'income certificate', 'आय प्रमाण'],
  'first-child-single-child-affidavit': ['first child', 'single child', 'only child', 'single girl child'],
  'employment-contract-offer-letter': ['employment contract', 'job offer', 'offer letter', 'employee agreement'],
  'general-consent-declaration-letter': ['consent letter', 'permission letter', 'declaration letter', 'authorization'],
  'old-vehicle-sales-agreement': ['vehicle sale', 'car sale', 'bike sale', 'vehicle purchase', 'वाहन बिक्री']
};

const NO_MATCH_SPEECH: Record<SupportedLanguage, string> = {
  hi: "हमारे पास आपके सवाल के मुताबिक चीजें हमें ढूंढने में नहीं मिली हैं। सही फॉर्म चुनने के लिए आप ऊपर दिए गए 'Call to Admin' विकल्प पर डायरेक्ट कॉल कर सकते हैं।",
  en: "I could not find a matching document in our list. To choose the right form, you can call directly using the existing 'Call to Admin' option above.",
  mr: "तुमच्या प्रश्नाशी जुळणारा दस्तऐवज यादीत सापडला नाही. योग्य फॉर्म निवडण्यासाठी वर दिलेल्या 'Call to Admin' पर्यायावर थेट कॉल करा.",
  gu: "તમારા પ્રશ્નને અનુરૂપ દસ્તાવેજ મળ્યો નથી. યોગ્ય ફોર્મ પસંદ કરવા માટે ઉપરના 'Call to Admin' વિકલ્પ પર સીધો કૉલ કરો.",
  pa: "ਤੁਹਾਡੇ ਸਵਾਲ ਨਾਲ ਮਿਲਦਾ ਦਸਤਾਵੇਜ਼ ਨਹੀਂ ਮਿਲਿਆ। ਸਹੀ ਫਾਰਮ ਚੁਣਨ ਲਈ ਉੱਪਰ ਦਿੱਤੇ 'Call to Admin' ਵਿਕਲਪ ਰਾਹੀਂ ਸਿੱਧਾ ਕਾਲ ਕਰੋ।",
  ml: "നിങ്ങളുടെ ചോദ്യത്തിന് അനുയോജ്യമായ രേഖ കണ്ടെത്താനായില്ല. ശരിയായ ഫോം തിരഞ്ഞെടുക്കാൻ മുകളിലുള്ള 'Call to Admin' ഓപ്ഷനിൽ നേരിട്ട് വിളിക്കാം.",
  ta: "உங்கள் கேள்விக்குப் பொருந்தும் ஆவணம் கிடைக்கவில்லை. சரியான படிவத்தைத் தேர்வு செய்ய மேலே உள்ள 'Call to Admin' விருப்பத்தின் மூலம் நேரடியாக அழைக்கலாம்.",
  te: "మీ ప్రశ్నకు సరిపోయే పత్రం దొరకలేదు. సరైన ఫారమ్ ఎంచుకోవడానికి పైన ఉన్న 'Call to Admin' ఎంపిక ద్వారా నేరుగా కాల్ చేయండి.",
  bn: "আপনার প্রশ্নের সঙ্গে মেলে এমন নথি পাওয়া যায়নি। সঠিক ফর্ম বেছে নিতে উপরের 'Call to Admin' বিকল্পে সরাসরি ফোন করুন।",
  kn: "ನಿಮ್ಮ ಪ್ರಶ್ನೆಗೆ ಹೊಂದುವ ದಾಖಲೆ ಸಿಗಲಿಲ್ಲ. ಸರಿಯಾದ ಫಾರ್ಮ್ ಆಯ್ಕೆ ಮಾಡಲು ಮೇಲಿನ 'Call to Admin' ಆಯ್ಕೆಗೆ ನೇರವಾಗಿ ಕರೆ ಮಾಡಿ."
};

const LOCAL_MATCH_SPEECH: Record<SupportedLanguage, (titles: string[]) => string> = {
  hi: (titles) => `आपके सवाल के लिए ये दस्तावेज़ सबसे उपयुक्त हैं: ${titles.join('; ')}। इनमें से सही दस्तावेज़ खोलें, संबंधित पक्षों की जानकारी भरें और आगे बढ़ने से पहले सभी विवरण जाँचें।`,
  en: (titles) => `These documents may fit your request: ${titles.join('; ')}. Open the closest match, enter the requested party and document details, and review everything before continuing.`,
  mr: (titles) => `तुमच्या प्रश्नासाठी हे दस्तऐवज योग्य असू शकतात: ${titles.join('; ')}. योग्य दस्तऐवज उघडा, संबंधित पक्षांची माहिती भरा आणि पुढे जाण्यापूर्वी तपशील तपासा.`,
  gu: (titles) => `તમારી વિનંતી માટે આ દસ્તાવેજો યોગ્ય હોઈ શકે છે: ${titles.join('; ')}. યોગ્ય દસ્તાવેજ ખોલો, પક્ષકારોની વિગતો ભરો અને આગળ વધતા પહેલાં તપાસો.`,
  pa: (titles) => `ਤੁਹਾਡੀ ਬੇਨਤੀ ਲਈ ਇਹ ਦਸਤਾਵੇਜ਼ ਢੁਕਵੇਂ ਹੋ ਸਕਦੇ ਹਨ: ${titles.join('; ')}। ਸਭ ਤੋਂ ਢੁਕਵਾਂ ਦਸਤਾਵੇਜ਼ ਖੋਲ੍ਹੋ, ਪੱਖਾਂ ਦੇ ਵੇਰਵੇ ਭਰੋ ਅਤੇ ਅੱਗੇ ਵਧਣ ਤੋਂ ਪਹਿਲਾਂ ਜਾਂਚੋ।`,
  ml: (titles) => `നിങ്ങളുടെ ആവശ്യത്തിന് ഈ രേഖകൾ അനുയോജ്യമായേക്കാം: ${titles.join('; ')}. അനുയോജ്യമായ രേഖ തുറന്ന് കക്ഷികളുടെ വിവരങ്ങൾ നൽകുകയും തുടരുന്നതിന് മുമ്പ് പരിശോധിക്കുകയും ചെയ്യുക.`,
  ta: (titles) => `உங்கள் கோரிக்கைக்கு இந்த ஆவணங்கள் பொருந்தக்கூடும்: ${titles.join('; ')}. பொருத்தமான ஆவணத்தைத் திறந்து, தரப்பினரின் விவரங்களை நிரப்பி, தொடர்வதற்கு முன் சரிபார்க்கவும்.`,
  te: (titles) => `మీ అభ్యర్థనకు ఈ పత్రాలు సరిపోవచ్చు: ${titles.join('; ')}. సరైన పత్రాన్ని తెరిచి, సంబంధిత పక్షాల వివరాలు నమోదు చేసి, కొనసాగించే ముందు తనిఖీ చేయండి.`,
  bn: (titles) => `আপনার অনুরোধের জন্য এই নথিগুলি উপযুক্ত হতে পারে: ${titles.join('; ')}। সঠিক নথিটি খুলুন, পক্ষগুলির তথ্য দিন এবং এগোনোর আগে যাচাই করুন।`,
  kn: (titles) => `ನಿಮ್ಮ ವಿನಂತಿಗೆ ಈ ದಾಖಲೆಗಳು ಹೊಂದಿಕೆಯಾಗಬಹುದು: ${titles.join('; ')}. ಸೂಕ್ತ ದಾಖಲೆಯನ್ನು ತೆರೆಯಿರಿ, ಪಕ್ಷಗಳ ವಿವರಗಳನ್ನು ನಮೂದಿಸಿ ಮತ್ತು ಮುಂದುವರಿಯುವ ಮೊದಲು ಪರಿಶೀಲಿಸಿ.`
};

function localIntentMatch(query: string, language: SupportedLanguage): SearchIntentResult {
  const normalizedQuery = query.toLocaleLowerCase().normalize('NFKC');
  const queryTokens = normalizedQuery.match(/[\p{L}\p{N}]+/gu)?.filter((token) => token.length > 1) || [];
  const stopWords = new Set(['the', 'for', 'and', 'with', 'need', 'make', 'want', 'please', 'document', 'agreement', 'affidavit', 'एक', 'का', 'की', 'के', 'मुझे', 'चाहिए']);
  const tokens = queryTokens.filter((token) => !stopWords.has(token));
  const scored = INITIAL_FRONT_DOCUMENTS.map((document) => {
    const corpus = `${document.id} ${document.title} ${document.category} ${document.description} ${document.requiredFields.join(' ')}`.toLocaleLowerCase();
    const terms = DOCUMENT_INTENT_TERMS[document.id] || [];
    const directMatch = terms.some((term) => normalizedQuery.includes(term.toLocaleLowerCase()));
    const matchedTokens = tokens.filter((token) => corpus.includes(token) || terms.some((term) => term.toLocaleLowerCase().includes(token)));
    const score = Math.min(1, (matchedTokens.length / Math.max(tokens.length, 1)) * 0.7 + (directMatch ? 0.35 : 0));
    return { document, score };
  }).filter((item) => item.score >= 0.32).sort((a, b) => b.score - a.score).slice(0, 3);

  const matches = scored.map(({ document, score }) => ({
    id: document.id,
    title: document.title,
    category: document.category,
    matchScore: score,
    explanation: document.description
  }));
  return {
    refusal: false,
    matches,
    spokenText: matches.length ? LOCAL_MATCH_SPEECH[language](matches.map((match) => `${match.title}: ${match.explanation}`)) : NO_MATCH_SPEECH[language]
  };
}

// 1. Search Document Intent via Gemini backend
export async function searchDocumentIntent(
  query: string,
  audioLanguage?: SupportedLanguage
): Promise<SearchIntentResult | null> {
  const lang = audioLanguage || getStoredAudioLanguage();
  try {
    const res = await fetch('/api/gemini/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, audioLanguage: lang })
    });
    if (!res.ok) throw new Error(`Server returned ${res.status}`);
    const result = await res.json() as SearchIntentResult;
    if (result.refusal || result.matches?.length) return result;
    return localIntentMatch(query, lang);
  } catch (err) {
    console.warn('Gemini search request failed:', err);
    return localIntentMatch(query, lang);
  }
}

// 2. Dynamic Contextual Page Explainer via Gemini backend
export async function fetchPageExplanation(
  documentTitle: string,
  pageNumber: number,
  pageTitle: string,
  fields: string[] = [],
  audioLanguage?: SupportedLanguage
): Promise<string> {
  const lang = audioLanguage || getStoredAudioLanguage();
  try {
    const res = await fetch('/api/gemini/explain-page', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documentTitle, pageNumber, pageTitle, fields, audioLanguage: lang })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.spokenText) return data.spokenText;
    }
  } catch (err) {
    console.warn('Gemini page explanation request failed:', err);
  }
  return pageExplanationFallback(pageNumber, pageTitle, fields, lang);
}

// 3. Dynamic Contextual Field Explainer via Gemini backend
export async function fetchFieldExplanation(
  documentTitle: string,
  fieldKey: string,
  fieldLabel: string,
  context = '',
  audioLanguage?: SupportedLanguage
): Promise<string> {
  const lang = audioLanguage || getStoredAudioLanguage();
  try {
    const res = await fetch('/api/gemini/explain-field', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documentTitle, fieldKey, fieldLabel, context, audioLanguage: lang })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.spokenText) return data.spokenText;
    }
  } catch (err) {
    console.warn('Gemini field explanation request failed:', err);
  }
  return fieldExplanationFallback(documentTitle, fieldLabel || fieldKey, context, lang);
}

