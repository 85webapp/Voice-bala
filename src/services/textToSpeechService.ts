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
    const cleanText = script.replace(/[*_#]/g, '').trim();

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
        return "जीएसटी रजिस्ट्रेशन के लिए आपके पास दो आसान विकल्प हैं। आप चाहें तो नीचे दिए गए 4-स्टेप फॉर्म को खुद भरकर सबमिट कर सकते हैं, अथवा ऊपर 'रिक्वेस्ट' स्लाइडर पर क्लिक करके केवल अपना नाम और मोबाइल नंबर सबमिट कर सकते हैं। हमारे टैक्स एक्सपर्ट 1 घंटे के भीतर आपसे संपर्क करेंगे और आपके बिज़नेस का जीएसटी रजिस्ट्रेशन खुद प्रोसेस करवा देंगे। आवाज़ को रोकने के लिए आप ऊपर स्पीकर बटन पर कभी भी टैप कर सकते हैं।";
      }
      return "For GST Registration, you have two convenient options. You can complete the 4-step registration form directly right here, or tap the Request tab above to submit your basic contact details. Our compliance specialist will call you within one hour to coordinate and complete your GST registration. You can tap the speaker button at any time to stop this audio.";
    }

    // 2. MSME Udyam Registration
    if (lower.includes('udyam') || lower.includes('msme')) {
      if (lang === 'hi') {
        return "उद्यम रजिस्ट्रेशन के लिए आप यह 5-स्टेप ऑफिशियल फॉर्म खुद भर सकते हैं, या फिर ऊपर दिए गए 'रिक्वेस्ट' विकल्प पर क्लिक करके अपनी बेसिक डिटेल्स सबमिट कर सकते हैं। हमारी कंप्लायंस टीम 1 घंटे में आपसे संपर्क करेगी और आपका उद्यम सर्टिफिकेट तुरंत जारी करवा देगी। आवाज़ बंद करने के लिए स्पीकर बटन पर टैप करें।";
      }
      return "For MSME Udyam Registration, you can fill out this 5-step official application directly, or switch to the Request tab to request dedicated assistance. Our team will contact you within one hour to issue your government Udyam Certificate. Tap the speaker button at any time to stop this voice guidance.";
    }

    // 3. GST Filing
    if (lower.includes('gst filing') || (lower.includes('gst') && lower.includes('filing'))) {
      if (lang === 'hi') {
        return "जीएसटी फाइलिंग के लिए समन्वय और इनवॉइस समाधान आवश्यक होता है। आप यहाँ अपनी मासिक अथवा तिमाही फाइलिंग डिटेल्स भर सकते हैं, या 1-घंटे के कॉलबैक के लिए अपनी रिक्वेस्ट सबमिट कर सकते हैं। हमारे जीएसटी एक्सपर्ट सीधे आपसे कोऑर्डिनेट करेंगे। ऑडियो रोकने के लिए स्पीकर बटन पर टैप करें।";
      }
      return "GST Return Filing requires invoice reconciliation and statutory coordination. You can enter your monthly or quarterly filing details here, or submit a request for an expert callback within one hour. Our tax managers will assist you directly. Tap the speaker button anytime to stop this audio.";
    }

    // 4. Income Tax Return (ITR) Filing
    if (lower.includes('income tax') || lower.includes('itr')) {
      if (lang === 'hi') {
        return "इनकम टैक्स रिटर्न फाइलिंग के लिए आप अपनी पैन व आय विवरण इस फॉर्म में भर सकते हैं, या फिर हमारी विशेषज्ञ सीए टीम से समन्वय के लिए रिक्वेस्ट सबमिट कर सकते हैं। हमारे टैक्स एडवाइज़र 1 घंटे के अंदर संपर्क करके आपकी अधिकतम टैक्स बचत के साथ आईटीआर फाइल करवाएंगे। आवाज़ बंद करने के लिए स्पीकर पर टैप करें।";
      }
      return "For Income Tax Return Filing, you can enter your PAN and income details in this form, or submit a request for direct CA consultation. Our tax advisors will reach out within one hour to compute your deductions and file your return. Tap the speaker button to stop.";
    }

    // 5. Other Filing
    if (lower.includes('other filing') || (lower.includes('filing') && lower.includes('other'))) {
      if (lang === 'hi') {
        return "विभिन्न कानूनी व वैधानिक फाइलिंग्स के लिए आप यहाँ अपनी आवश्यकता लिखकर फॉर्म सबमिट कर सकते हैं। हमारी सीनियर कंप्लायंस टीम 1 घंटे के भीतर आपसे समन्वय करेगी और आपकी फाइलिंग पूर्ण करवाएगी। आवाज़ बंद करने के लिए स्पीकर बटन पर टैप करें।";
      }
      return "For custom statutory and compliance filings, you can describe your requirements in this form or request expert coordination. Our team will call you within one hour to handle the entire filing process. Tap the speaker icon to stop audio.";
    }

    // 6. Insurance Services (Car, Bike, Truck, Misc, Other)
    if (lower.includes('insurance')) {
      if (lang === 'hi') {
        return "वाहन बीमा के लिए आप अपनी गाड़ी का नंबर और डिटेल्स इस फॉर्म में भरकर तुरंत सबमिट कर सकते हैं, या फिर 1-घंटे के भीतर बेस्ट प्रीमियम कोटेशन के लिए रिक्वेस्ट भेज सकते हैं। हमारे इंश्योरेंस एक्सपर्ट सभी प्रमुख बीमा कंपनियों से डिस्काउंट कोटेशन के साथ आपसे कोऑर्डिनेट करेंगे। आवाज़ रोकने के लिए ऊपर स्पीकर पर टैप करें।";
      }
      return "For vehicle insurance, you can enter your registration details to request instant quotes, or submit a callback request. Our policy team will compare top insurers and coordinate with you within one hour for maximum discounts. Tap the speaker button anytime to stop this voice.";
    }

    // 7. Company, LLP, Trademark, FSSAI Registrations
    if (
      lower.includes('company') ||
      lower.includes('pvt') ||
      lower.includes('llp') ||
      lower.includes('trademark') ||
      lower.includes('fssai') ||
      lower.includes('food')
    ) {
      if (lang === 'hi') {
        return "इस वैधानिक रजिस्ट्रेशन के लिए आप अपनी कंपनी अथवा ट्रेडमार्क का विवरण इस फॉर्म में भरकर सीधे सबमिट कर सकते हैं, या विशेषज्ञ सहायता के लिए 1-घंटे के कॉलबैक की रिक्वेस्ट भेज सकते हैं। हमारे लीगल एक्सपर्ट्स सरकारी पोर्टल पर आपकी पूरी प्रक्रिया पूर्ण करवाएंगे। आवाज़ रोकने के लिए स्पीकर पर टैप करें।";
      }
      return "For this statutory registration, you can enter your business or trademark details in this form, or submit a request for expert coordination. Our legal compliance officers will reach out within one hour to manage the government portal process. Tap the speaker button anytime to stop.";
    }

    // Default Fallback Guidance
    if (lang === 'hi') {
      return "इस सेवा के लिए आप नीचे दिए गए फॉर्म को खुद पूरा भर सकते हैं, अथवा विशेषज्ञ सहायता के लिए केवल अपनी बेसिक डिटेल्स सबमिट करके 1-घंटे के कॉलबैक की रिक्वेस्ट कर सकते हैं। हमारी टीम पूरी प्रक्रिया में आपका मार्गदर्शन करेगी। ऑडियो रोकने के लिए ऊपर स्पीकर बटन पर टैप करें।";
    }
    return "For this service, you can either complete the application form directly, or submit a quick request for expert coordination. Our compliance advisors will contact you within one hour to assist with every step. Tap the speaker button at any time to stop the audio guidance.";
  }
}

export const ttsService = new TextToSpeechService();
