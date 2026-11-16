// High-Quality Text-to-Speech Audio Service
// Supports natural voice synthesis, Chrome stall prevention, multilingual prioritization, and tap-to-stop interaction.

import { SupportedLanguage, getStoredAudioLanguage, SUPPORTED_LANGUAGES } from '../data/voiceNarrationData';

export interface TTSState {
  isSpeaking: boolean;
  activeTitle: string | null;
  language: SupportedLanguage;
}

export type TTSListener = (state: TTSState) => void;

class TextToSpeechService {
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isSpeakingState = false;
  private currentTitleState: string | null = null;
  private listeners: Set<TTSListener> = new Set();
  private voices: SpeechSynthesisVoice[] = [];
  private keepAliveTimer: any = null;
  private isInitialized = false;

  constructor() {
    this.initVoices();
  }

  private initVoices() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    
    const loadVoices = () => {
      try {
        this.voices = window.speechSynthesis.getVoices();
        if (this.voices.length > 0) {
          this.isInitialized = true;
        }
      } catch (err) {
        console.warn('TTS: could not load system voices', err);
      }
    };

    loadVoices();
    if (typeof window.speechSynthesis.onvoiceschanged !== 'undefined') {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }

  public subscribe(listener: TTSListener): () => void {
    this.listeners.add(listener);
    // Notify immediate initial state
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getState(): TTSState {
    return {
      isSpeaking: this.isSpeakingState,
      activeTitle: this.currentTitleState,
      language: getStoredAudioLanguage()
    };
  }

  private notify() {
    const state = this.getState();
    this.listeners.forEach((listener) => {
      try {
        listener(state);
      } catch (err) {
        console.error('TTS listener error', err);
      }
    });
  }

  /**
   * Selects the highest quality natural/neural voice available for the language.
   */
  private findBestVoice(langCode: string): SpeechSynthesisVoice | null {
    if (this.voices.length === 0 && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.voices = window.speechSynthesis.getVoices();
    }
    if (this.voices.length === 0) return null;

    const lowerLang = langCode.toLowerCase();
    const prefix = lowerLang.split('-')[0];

    // Priority 1: Indian Natural / Google / Neural / Online voices matching language
    const naturalIndian = this.voices.find((v) => {
      const vLang = v.lang.toLowerCase();
      const vName = v.name.toLowerCase();
      const isMatchingLang = vLang.startsWith(prefix) || vLang.includes(prefix);
      const isHighQuality =
        vName.includes('natural') ||
        vName.includes('google') ||
        vName.includes('neural') ||
        vName.includes('swara') ||
        vName.includes('neerja') ||
        vName.includes('lekha') ||
        vName.includes('veena') ||
        vName.includes('online');
      return isMatchingLang && isHighQuality;
    });
    if (naturalIndian) return naturalIndian;

    // Priority 2: Exact language tag match (e.g., hi-IN or en-IN)
    const exactMatch = this.voices.find((v) => v.lang.toLowerCase() === lowerLang);
    if (exactMatch) return exactMatch;

    // Priority 3: Prefix language match (e.g. hi, en)
    const prefixMatch = this.voices.find((v) => v.lang.toLowerCase().startsWith(prefix));
    if (prefixMatch) return prefixMatch;

    // Fallback: Default system voice
    return this.voices.find((v) => v.default) || this.voices[0] || null;
  }

  /**
   * Starts playback of voice guidance for a given service.
   * If already speaking the same service, tap-to-stop will halt playback.
   */
  public speak(serviceTitle: string, customScript?: string): boolean {
    if (typeof window === 'undefined' || !('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') {
      return false;
    }

    // Stop any existing speech first
    this.stop();

    const currentLang = getStoredAudioLanguage();
    const langConfig = SUPPORTED_LANGUAGES.find((l) => l.code === currentLang) || SUPPORTED_LANGUAGES[0];
    const script = customScript || this.getServiceVoiceScript(serviceTitle, currentLang);
    const cleanText = script
      .replace(/[*_#]/g, '')
      .replace(/सबमिट/g, 'सब्मिट')
      .trim();

    if (!cleanText) return false;

    try {
      const synthesis = window.speechSynthesis;
      // In case engine is in paused state
      if (synthesis.paused) {
        synthesis.resume();
      }

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = langConfig.speechCode;
      // 0.93 rate produces clear, articulate speech that is easy to understand without sounding rushed
      utterance.rate = 0.93;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      const chosenVoice = this.findBestVoice(langConfig.speechCode);
      if (chosenVoice) {
        utterance.voice = chosenVoice;
      }

      utterance.onstart = () => {
        this.isSpeakingState = true;
        this.currentTitleState = serviceTitle;
        this.notify();
        this.startKeepAlive();
      };

      utterance.onend = () => {
        this.cleanupState();
      };

      utterance.onerror = (e) => {
        // 'interrupted' or 'canceled' are expected when user taps stop
        if (e.error !== 'interrupted' && e.error !== 'canceled') {
          console.warn('TTS playback note:', e.error);
        }
        this.cleanupState();
      };

      if (typeof window !== 'undefined') {
        (window as any).__ctc_active_utterance = utterance;
      }
      this.currentUtterance = utterance;
      synthesis.speak(utterance);
      return true;
    } catch (err) {
      console.warn('TTS speak error:', err);
      this.cleanupState();
      return false;
    }
  }

  /**
   * Tap-To-Stop: Instantly cancels playback and resets speaking status.
   */
  public stop() {
    this.clearKeepAlive();
    try {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    } catch (err) {
      console.warn('TTS cancel error:', err);
    }
    this.cleanupState();
  }

  /**
   * Toggles speech: If currently speaking, stops immediately (Tap-to-stop).
   * Otherwise, starts playing the guidance for the specified service.
   */
  public toggle(serviceTitle: string, customScript?: string) {
    if (this.isSpeakingState) {
      this.stop();
    } else {
      this.speak(serviceTitle, customScript);
    }
  }

  public isSpeaking(): boolean {
    return this.isSpeakingState;
  }

  private cleanupState() {
    this.clearKeepAlive();
    if (typeof window !== 'undefined') {
      (window as any).__ctc_active_utterance = null;
    }
    this.isSpeakingState = false;
    this.currentTitleState = null;
    this.currentUtterance = null;
    this.notify();
  }

  /**
   * Chrome has a known bug where speech synthesis stalls after ~14 seconds
   * because of internal garbage collection. This timer prevents that stall.
   */
  private startKeepAlive() {
    this.clearKeepAlive();
    this.keepAliveTimer = setInterval(() => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window && this.isSpeakingState) {
        try {
          window.speechSynthesis.pause();
          window.speechSynthesis.resume();
        } catch {}
      }
    }, 5000);
  }

  private clearKeepAlive() {
    if (this.keepAliveTimer) {
      clearInterval(this.keepAliveTimer);
      this.keepAliveTimer = null;
    }
  }

  /**
   * Professional spoken guidance scripts specifically tailored to explain that:
   * 1. Users can complete the form directly, OR
   * 2. Submit a request for expert coordination.
   * 3. Users can tap the speaker button anytime to stop the audio.
   */
  public getServiceVoiceScript(serviceTitle: string, lang: SupportedLanguage): string {
    const lower = serviceTitle.toLowerCase();

    // 1. GST Registration
    if (lower.includes('gst reg') || (lower.includes('gst') && lower.includes('registration'))) {
      if (lang === 'hi') {
        return "जीएसटी रजिस्ट्रेशन के लिए आपके पास दो आसान विकल्प हैं। आप चाहें तो नीचे दिए गए 4-स्टेप फॉर्म को खुद भरकर सब्मिट कर सकते हैं, अथवा ऊपर 'रिक्वेस्ट' स्लाइडर पर क्लिक करके केवल अपना नाम और मोबाइल नंबर सब्मिट कर सकते हैं। हमारे टैक्स कंसल्टेंट 1 घंटे के भीतर आपसे संपर्क करेंगे और आपके बिज़नेस का जीएसटी रजिस्ट्रेशन खुद प्रोसेस करवा देंगे। आवाज़ को रोकने के लिए आप ऊपर स्पीकर बटन पर कभी भी टैप कर सकते हैं।";
      }
      return "For GST Registration, you have two convenient options. You can complete the 4-step registration form directly right here, or tap the Request tab above to submit your basic contact details. Our Tax Consultant will call you within one hour to coordinate and complete your GST registration. You can tap the speaker button at any time to stop this audio.";
    }

    // 2. MSME Udyam Registration
    if (lower.includes('udyam') || lower.includes('msme')) {
      if (lang === 'hi') {
        return "उद्यम रजिस्ट्रेशन के लिए आप यह 5-स्टेप ऑफिशियल फॉर्म खुद भर सकते हैं, या फिर ऊपर दिए गए 'रिक्वेस्ट' विकल्प पर क्लिक करके अपनी बेसिक डिटेल्स सब्मिट कर सकते हैं। हमारी कंप्लायंस टीम 1 घंटे में आपसे संपर्क करेगी और आपका उद्यम सर्टिफिकेट तुरंत जारी करवा देगी। आवाज़ बंद करने के लिए स्पीकर बटन पर टैप करें।";
      }
      return "For MSME Udyam Registration, you can fill out this 5-step official application directly, or switch to the Request tab to request dedicated assistance. Our team will contact you within one hour to issue your government Udyam Certificate. Tap the speaker button at any time to stop this voice guidance.";
    }

    // 3. GST Filing (Strict Tax Consultant wording — no CA)
    if (lower.includes('gst filing') || (lower.includes('gst') && lower.includes('filing'))) {
      if (lang === 'hi') {
        return "जीएसटी फाइलिंग के लिए हमारे टैक्स कंसल्टेंट के साथ समन्वय आवश्यक होता है। आप यहाँ अपनी मासिक अथवा तिमाही फाइलिंग डिटेल्स भर सकते हैं, या 1-घंटे के कॉलबैक के लिए अपनी रिक्वेस्ट सब्मिट कर सकते हैं। हमारे टैक्स कंसल्टेंट सीधे आपसे कोऑर्डिनेट करेंगे। ऑडियो रोकने के लिए स्पीकर बटन पर टैप करें।";
      }
      return "GST Return Filing requires invoice reconciliation and coordination with our Tax Consultant. You can enter your monthly or quarterly filing details here, or submit a request for an expert callback within one hour. Our Tax Consultant will assist you directly. Tap the speaker button anytime to stop this audio.";
    }

    // 4. Income Tax Return (ITR) Filing (Tax Consultant)
    if (lower.includes('income tax') || lower.includes('itr')) {
      if (lang === 'hi') {
        return "इनकम टैक्स रिटर्न फाइलिंग के लिए आप अपनी पैन व आय विवरण इस फॉर्म में भर सकते हैं, या फिर हमारे टैक्स कंसल्टेंट से समन्वय के लिए रिक्वेस्ट सब्मिट कर सकते हैं। हमारे टैक्स कंसल्टेंट 1 घंटे के अंदर संपर्क करके आपकी अधिकतम टैक्स बचत के साथ आईटीआर फाइल करवाएंगे। आवाज़ बंद करने के लिए स्पीकर पर टैप करें।";
      }
      return "For Income Tax Return Filing, you can enter your PAN and income details in this form, or submit a request for direct Tax Consultant coordination. Our Tax Consultants will reach out within one hour to compute your deductions and file your return. Tap the speaker button to stop.";
    }

    // 5. Other Filing
    if (lower.includes('other filing') || (lower.includes('filing') && lower.includes('other'))) {
      if (lang === 'hi') {
        return "विभिन्न कानूनी व वैधानिक फाइलिंग्स के लिए आप यहाँ अपनी आवश्यकता लिखकर फॉर्म सब्मिट कर सकते हैं। हमारी टैक्स कंसल्टेंट टीम 1 घंटे के भीतर आपसे समन्वय करेगी और आपकी फाइलिंग पूर्ण करवाएगी। आवाज़ बंद करने के लिए स्पीकर बटन पर टैप करें।";
      }
      return "For custom statutory and compliance filings, you can describe your requirements in this form or request Tax Consultant coordination. Our team will call you within one hour to handle the entire filing process. Tap the speaker icon to stop audio.";
    }

    // 6. Website & Digital Services (Tailored per service)
    if (lower.includes('website development')) {
      return lang === 'hi'
        ? "आपने वेबसाइट डेवलपमेंट सेलेक्ट किया है। आप यह फॉर्म भरकर रिक्वेस्ट सेंड कर सकते हैं। हमारी टीम एक घंटे के अंदर आपसे कॉल करेगी और कॉल करने के बाद आपके प्रोजेक्ट पर काम चालू किया जाएगा। या फिर आप सीधे डायरेक्ट कॉल कर सकते हैं।"
        : "You have selected Website Development. You can fill out this form and send your request. Our team will call you within one hour, and work on your project will start right after the call. You can also call us directly.";
    }
    if (lower.includes('logo making') || lower.includes('logo')) {
      return lang === 'hi'
        ? "आपने लोगो मेकिंग सेलेक्ट किया है। आप यह फॉर्म भरकर रिक्वेस्ट भेज सकते हैं या फिर सीधे डायरेक्ट कॉल कर सकते हैं। एक घंटे के भीतर हमारी टीम आपसे कॉल करेगी और कॉल करने के बाद आपके प्रोजेक्ट पर काम चालू किया जाएगा।"
        : "You have selected Logo Making. You can send a request through this form or call us directly. Our team will call you within one hour and begin work on your project after the call.";
    }
    if (lower.includes('purchase domain') || lower.includes('domain')) {
      return lang === 'hi'
        ? "आपने परचेस डोमेन सेलेक्ट किया है। आप यह फॉर्म भरकर रिक्वेस्ट भेज सकते हैं या फिर सीधे डायरेक्ट कॉल कर सकते हैं। एक घंटे के भीतर हमारी टीम आपसे कॉल करेगी और कॉल करने के बाद आपके प्रोजेक्ट पर काम चालू किया जाएगा।"
        : "You have selected Purchase Domain. You can send a request through this form or call us directly. Our team will call you within one hour and begin work on your domain project after the call.";
    }
    if (lower.includes('hosting')) {
      return lang === 'hi'
        ? "आपने होस्टिंग सेलेक्ट किया है। आप यह फॉर्म भरकर रिक्वेस्ट भेज सकते हैं या फिर सीधे डायरेक्ट कॉल कर सकते हैं। एक घंटे के भीतर हमारी टीम आपसे कॉल करेगी और कॉल करने के बाद आपके प्रोजेक्ट पर काम चालू किया जाएगा।"
        : "You have selected Hosting. You can send a request through this form or call us directly. Our team will call you within one hour and begin work on your hosting setup after the call.";
    }
    if (lower.includes('banner making') || lower.includes('banner')) {
      return lang === 'hi'
        ? "आपने बैनर मेकिंग सेलेक्ट किया है। आप यह फॉर्म भरकर रिक्वेस्ट भेज सकते हैं या फिर सीधे डायरेक्ट कॉल कर सकते हैं। एक घंटे के भीतर हमारी टीम आपसे कॉल करेगी और कॉल करने के बाद आपके प्रोजेक्ट पर काम चालू किया जाएगा।"
        : "You have selected Banner Making. You can send a request through this form or call us directly. Our team will call you within one hour and begin work on your banner project after the call.";
    }

    // 7. Bank Loans & Current Account
    if (lower.includes('current account')) {
      return lang === 'hi'
        ? "आपने करंट अकाउंट फाइल मेकिंग सेलेक्ट किया है। अगर आपको करंट अकाउंट ओपन कराना है, तो आप यह फॉर्म भर सकते हैं जिससे एक घंटे के अंदर हमारे कांटेक्ट सपोर्ट से आपका कोऑर्डिनेशन कराया जाएगा। या फिर आप डायरेक्ट कॉल पर क्लिक करके कॉल कर सकते हैं, क्योंकि यह काम केवल फॉर्म भरने से नहीं हो सकता, इसके लिए कोऑर्डिनेशन ज़रूरी है।"
        : "You have selected Current Account File Making. To open a current account, you can fill out this form and our contact support will coordinate with you within one hour, or click Direct Call immediately because this cannot be done by form alone and coordination is essential.";
    }
    if (lower.includes('mudra loan online') || (lower.includes('mudra') && lower.includes('online'))) {
      return lang === 'hi'
        ? "आपने मुद्रा लोन ऑनलाइन रिक्वेस्ट सेलेक्ट किया है। आप यह फॉर्म भर सकते हैं जिससे एक घंटे के अंदर हमारे कांटेक्ट सपोर्ट से आपका कोऑर्डिनेशन कराया जाएगा। या फिर आप डायरेक्ट कॉल पर क्लिक करके कॉल कर सकते हैं, क्योंकि यह काम केवल फॉर्म भरने से नहीं हो सकता, इसके लिए कोऑर्डिनेशन ज़रूरी है।"
        : "You have selected Mudra Loan Online Request. You can fill out this form and our contact support will coordinate with you within one hour, or click Direct Call immediately because this process cannot be completed by form alone and coordination is essential.";
    }
    if (lower.includes('mudra')) {
      return lang === 'hi'
        ? "आपने मुद्रा लोन फाइल मेकिंग सेलेक्ट किया है। अगर आपको मुद्रा लोन की फाइल बनवानी है, तो आप यह फॉर्म भर सकते हैं जिससे एक घंटे के अंदर हमारे कांटेक्ट सपोर्ट से आपका कोऑर्डिनेशन कराया जाएगा। या फिर आप डायरेक्ट कॉल पर क्लिक करके कॉल कर सकते हैं, क्योंकि यह काम केवल फॉर्म भरने से नहीं हो सकता, इसके लिए कोऑर्डिनेशन ज़रूरी है।"
        : "You have selected Mudra Loan File Making. You can fill out this form and our contact support will coordinate with you within one hour, or click Direct Call immediately because this cannot be completed by form alone and coordination is essential.";
    }

    // 8. Call Support
    if (lower.includes('support') || lower.includes('call') || lower.includes('harshit')) {
      return lang === 'hi'
        ? "कॉन्ट्रैक्ट्स, टैक्स एंड कंप्लायंस ग्रुप के 24/7 डेडिकेटेड कांटेक्ट सपोर्ट में आपका स्वागत है। आप हमारे यहां कभी भी, किसी भी दिन कॉल कर सकते हैं। हमारे प्रतिनिधि हर्षित जी से आपकी प्रॉपर बात कराई जाएगी, जिनसे आप जब चाहें कोऑर्डिनेशन कर सकते हैं।"
        : "Welcome to the 24/7 Dedicated Contact Support of Contracts, Tax and Compliance Group. You can call us any time on any day and speak properly with Harshit for direct coordination whenever you wish.";
    }

    // 9. Insurance Services (Car, Bike, Truck, Misc, Other)
    if (lower.includes('insurance')) {
      if (lang === 'hi') {
        return "वाहन बीमा के लिए आप अपनी गाड़ी का नंबर और डिटेल्स इस फॉर्म में भरकर तुरंत सब्मिट कर सकते हैं, या फिर 1-घंटे के भीतर बेस्ट प्रीमियम कोटेशन के लिए रिक्वेस्ट भेज सकते हैं। हमारे इंश्योरेंस एक्सपर्ट सभी प्रमुख बीमा कंपनियों से डिस्काउंट कोटेशन के साथ आपसे कोऑर्डिनेट करेंगे। आवाज़ रोकने के लिए ऊपर स्पीकर पर टैप करें।";
      }
      return "For vehicle insurance, you can enter your registration details to request instant quotes, or submit a callback request. Our policy team will compare top insurers and coordinate with you within one hour for maximum discounts. Tap the speaker button anytime to stop this voice.";
    }

    // 10. Company, LLP, Trademark, FSSAI Registrations
    if (
      lower.includes('company') ||
      lower.includes('pvt') ||
      lower.includes('llp') ||
      lower.includes('trademark') ||
      lower.includes('fssai') ||
      lower.includes('food')
    ) {
      if (lang === 'hi') {
        return "इस वैधानिक रजिस्ट्रेशन के लिए आप अपनी कंपनी अथवा ट्रेडमार्क का विवरण इस फॉर्म में भरकर सीधे सब्मिट कर सकते हैं, या विशेषज्ञ सहायता के लिए 1-घंटे के कॉलबैक की रिक्वेस्ट भेज सकते हैं। हमारे लीगल एक्सपर्ट्स सरकारी पोर्टल पर आपकी पूरी प्रक्रिया पूर्ण करवाएंगे। आवाज़ रोकने के लिए स्पीकर पर टैप करें।";
      }
      return "For this statutory registration, you can enter your business or trademark details in this form, or submit a request for expert coordination. Our legal compliance officers will reach out within one hour to manage the government portal process. Tap the speaker button anytime to stop.";
    }

    // Default Fallback Guidance
    if (lang === 'hi') {
      return "इस सेवा के लिए आप नीचे दिए गए फॉर्म को खुद पूरा भर सकते हैं, अथवा विशेषज्ञ सहायता के लिए केवल अपनी बेसिक डिटेल्स सब्मिट करके 1-घंटे के कॉलबैक की रिक्वेस्ट कर सकते हैं। हमारी टीम पूरी प्रक्रिया में आपका मार्गदर्शन करेगी। ऑडियो रोकने के लिए ऊपर स्पीकर बटन पर टैप करें।";
    }
    return "For this service, you can either complete the application form directly, or submit a quick request for expert coordination. Our compliance advisors will contact you within one hour to assist with every step. Tap the speaker button at any time to stop the audio guidance.";
  }
}

export const ttsService = new TextToSpeechService();
