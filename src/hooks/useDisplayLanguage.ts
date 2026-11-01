import { useEffect, useState } from 'react';
import { SupportedLanguage, SUPPORTED_LANGUAGES } from '../data/voiceNarrationData';

const DISPLAY_LANGUAGE_STORAGE_KEY = 'ctc_display_language_v1';
const DISPLAY_LANGUAGE_EVENT = 'ctc_display_language_changed';
const translationsByLanguage: Partial<Record<SupportedLanguage, Record<string, string>>> = {
  hi: {
    Home: 'होम', Dashboard: 'डैशबोर्ड', Agreements: 'समझौते', Menu: 'मेन्यू',
    Settings: 'सेटिंग्स', 'Legal & Compliance': 'कानूनी और अनुपालन',
    'Open User Profile': 'उपयोगकर्ता प्रोफ़ाइल खोलें', 'Open Settings': 'सेटिंग्स खोलें',
    'Preferences & Languages': 'प्राथमिकताएँ और भाषाएँ', 'Display Language': 'ऐप की भाषा',
    'Audio Explainer Language:': 'ऑडियो भाषा:', 'Select Audio Language': 'ऑडियो भाषा चुनें', Search: 'खोजें',
    'Search an Agreement or Affidavit': 'समझौता या शपथपत्र खोजें',
    Registrations: 'पंजीकरण', Insurance: 'बीमा', Filings: 'फाइलिंग',
    'Popular Agreements & Affidavits': 'लोकप्रिय समझौते और शपथपत्र',
    'Popular Registrations': 'लोकप्रिय पंजीकरण', 'Popular Insurance': 'लोकप्रिय बीमा', 'Popular Filings': 'लोकप्रिय फाइलिंग',
    Make: 'बनाएं', 'View All Categories': 'सभी श्रेणियां देखें', 'Back to services': 'सेवाओं पर वापस जाएं',
    Services: 'सेवाएं'
  },
  te: {
    Home: 'హోమ్', Dashboard: 'డాష్‌బోర్డ్', Agreements: 'ఒప్పందాలు', Menu: 'మెను',
    Settings: 'సెట్టింగ్‌లు', 'Display Language': 'యాప్ భాష',
    'Search an Agreement or Affidavit': 'ఒప్పందం లేదా అఫిడవిట్ కోసం వెతకండి',
    Registrations: 'రిజిస్ట్రేషన్లు', Insurance: 'భీమా', Filings: 'ఫైలింగ్స్',
    'Popular Agreements & Affidavits': 'ప్రజాదరణ పొందిన ఒప్పందాలు మరియు అఫిడవిట్లు',
    'Popular Registrations': 'ప్రజాదరణ పొందిన రిజిస్ట్రేషన్లు',
    'Popular Insurance': 'ప్రజాదరణ పొందిన భీమా', 'Popular Filings': 'ప్రజాదరణ పొందిన ఫైలింగ్స్',
    Make: 'చేయండి', 'View All Categories': 'అన్ని వర్గాలను చూడండి', Services: 'సేవలు'
  },
  ml: {
    Home: 'ഹോം', Dashboard: 'ഡാഷ്ബോർഡ്', Agreements: 'കരാറുകൾ', Menu: 'മെനു',
    Settings: 'ക്രമീകരണങ്ങൾ', 'Display Language': 'ആപ്പ് ഭാഷ',
    'Search an Agreement or Affidavit': 'കരാറോ സത്യവാങ്മൂലമോ തിരയുക',
    Registrations: 'രജിസ്ട്രേഷനുകൾ', Insurance: 'ഇൻഷുറൻസ്', Filings: 'ഫയലിംഗുകൾ',
    'Popular Agreements & Affidavits': 'ജനപ്രിയ കരാറുകളും സത്യവാങ്മൂലങ്ങളും',
    'Popular Registrations': 'ജനപ്രിയ രജിസ്ട്രേഷനുകൾ',
    'Popular Insurance': 'ജനപ്രിയ ഇൻഷുറൻസ്', 'Popular Filings': 'ജനപ്രിയ ഫയലിംഗുകൾ',
    Make: 'ഉണ്ടാക്കുക', 'View All Categories': 'എല്ലാ വിഭാഗങ്ങളും കാണുക', Services: 'സേവനങ്ങൾ'
  },
  ta: {
    Home: 'முகப்பு', Dashboard: 'டாஷ்போர்டு', Agreements: 'ஒப்பந்தங்கள்', Menu: 'மெனு',
    Settings: 'அமைப்புகள்', 'Display Language': 'செயலி மொழி',
    'Search an Agreement or Affidavit': 'ஒப்பந்தம் அல்லது பிரமாணப் பத்திரத்தைத் தேடுங்கள்',
    Registrations: 'பதிவுகள்', Insurance: 'காப்பீடு', Filings: 'தாக்கல்',
    'Popular Agreements & Affidavits': 'பிரபலமான ஒப்பந்தங்கள் மற்றும் பிரமாணப் பத்திரங்கள்',
    'Popular Registrations': 'பிரபலமான பதிவுகள்',
    'Popular Insurance': 'பிரபலமான காப்பீடு', 'Popular Filings': 'பிரபலமான தாக்கல்',
    Make: 'உருவாக்கு', 'View All Categories': 'அனைத்து வகைகளையும் காண்க', Services: 'சேவைகள்'
  },
  gu: {
    Home: 'હોમ', Dashboard: 'ડેશબોર્ડ', Agreements: 'કરારો', Menu: 'મેનુ',
    Settings: 'સેટિંગ્સ', 'Display Language': 'એપની ભાષા',
    'Search an Agreement or Affidavit': 'કરાર અથવા સોગંદનામું શોધો',
    Registrations: 'નોંધણીઓ', Insurance: 'વીમો', Filings: 'ફાઇલિંગ',
    'Popular Agreements & Affidavits': 'લોકપ્રિય કરારો અને સોગંદનામા',
    'Popular Registrations': 'લોકપ્રિય નોંધણીઓ',
    'Popular Insurance': 'લોકપ્રિય વીમો', 'Popular Filings': 'લોકપ્રિય ફાઇલિંગ',
    Make: 'બનાવો', 'View All Categories': 'બધી શ્રેણીઓ જુઓ', Services: 'સેવાઓ'
  },
  mr: {
    Home: 'मुख्यपृष्ठ', Dashboard: 'डॅशबोर्ड', Agreements: 'करार', Menu: 'मेनू',
    Settings: 'सेटिंग्ज', 'Display Language': 'अॅपची भाषा',
    'Search an Agreement or Affidavit': 'करार किंवा प्रतिज्ञापत्र शोधा',
    Registrations: 'नोंदणी', Insurance: 'विमा', Filings: 'फायलिंग',
    'Popular Agreements & Affidavits': 'लोकप्रिय करार आणि प्रतिज्ञापत्रे',
    'Popular Registrations': 'लोकप्रिय नोंदणी',
    'Popular Insurance': 'लोकप्रिय विमा', 'Popular Filings': 'लोकप्रिय फायलिंग',
    Make: 'तयार करा', 'View All Categories': 'सर्व श्रेणी पहा', Services: 'सेवा'
  },
  pa: {
    Home: 'ਮੁੱਖ ਪੰਨਾ', Dashboard: 'ਡੈਸ਼ਬੋਰਡ', Agreements: 'ਸਮਝੌਤੇ', Menu: 'ਮੀਨੂ',
    Settings: 'ਸੈਟਿੰਗਾਂ', 'Display Language': 'ਐਪ ਭਾਸ਼ਾ',
    'Search an Agreement or Affidavit': 'ਸਮਝੌਤਾ ਜਾਂ ਹਲਫ਼ਨਾਮਾ ਖੋਜੋ',
    Registrations: 'ਰਜਿਸਟ੍ਰੇਸ਼ਨ', Insurance: 'ਬੀਮਾ', Filings: 'ਫਾਈਲਿੰਗ',
    'Popular Agreements & Affidavits': 'ਪ੍ਰਸਿੱਧ ਸਮਝੌਤੇ ਅਤੇ ਹਲਫ਼ਨਾਮੇ',
    'Popular Registrations': 'ਪ੍ਰਸਿੱਧ ਰਜਿਸਟ੍ਰੇਸ਼ਨ',
    'Popular Insurance': 'ਪ੍ਰਸਿੱਧ ਬੀਮਾ', 'Popular Filings': 'ਪ੍ਰਸਿੱਧ ਫਾਈਲਿੰਗ',
    Make: 'ਬਣਾਓ', 'View All Categories': 'ਸਾਰੀਆਂ ਸ਼੍ਰੇਣੀਆਂ ਦੇਖੋ', Services: 'ਸੇਵਾਵਾਂ'
  },
  bn: {
    Home: 'হোম', Dashboard: 'ড্যাশবোর্ড', Agreements: 'চুক্তি', Menu: 'মেনু',
    Settings: 'সেটিংস', 'Display Language': 'অ্যাপের ভাষা',
    'Search an Agreement or Affidavit': 'চুক্তি বা হলফনামা অনুসন্ধান করুন',
    Registrations: 'নিবন্ধন', Insurance: 'বীমা', Filings: 'ফাইলিং',
    'Popular Agreements & Affidavits': 'জনপ্রিয় চুক্তি ও হলফনামা',
    'Popular Registrations': 'জনপ্রিয় নিবন্ধন',
    'Popular Insurance': 'জনপ্রিয় বীমা', 'Popular Filings': 'জনপ্রিয় ফাইলিং',
    Make: 'তৈরি করুন', 'View All Categories': 'সব বিভাগ দেখুন', Services: 'পরিষেবা'
  },
  kn: {
    Home: 'ಮುಖಪುಟ', Dashboard: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್', Agreements: 'ಒಪ್ಪಂದಗಳು', Menu: 'ಮೆನು',
    Settings: 'ಸೆಟ್ಟಿಂಗ್‌ಗಳು', 'Display Language': 'ಅಪ್ಲಿಕೇಶನ್ ಭಾಷೆ',
    'Search an Agreement or Affidavit': 'ಒಪ್ಪಂದ ಅಥವಾ ಅಫಿಡವಿಟ್ ಹುಡುಕಿ',
    Registrations: 'ನೋಂದಣಿಗಳು', Insurance: 'ವಿಮೆ', Filings: 'ಫೈಲಿಂಗ್‌ಗಳು',
    'Popular Agreements & Affidavits': 'ಜನಪ್ರಿಯ ಒಪ್ಪಂದಗಳು ಮತ್ತು ಅಫಿಡವಿಟ್‌ಗಳು',
    'Popular Registrations': 'ಜನಪ್ರಿಯ ನೋಂದಣಿಗಳು',
    'Popular Insurance': 'ಜನಪ್ರಿಯ ವಿಮೆ', 'Popular Filings': 'ಜನಪ್ರಿಯ ಫೈಲಿಂಗ್‌ಗಳು',
    Make: 'ರಚಿಸಿ', 'View All Categories': 'ಎಲ್ಲಾ ವರ್ಗಗಳನ್ನು ವೀಕ್ಷಿಸಿ', Services: 'ಸೇವೆಗಳು'
  },
  en: {}
};

type TranslationTarget = {
  original: string;
  apply: (translation: string) => void;
  isCurrent: () => boolean;
};
const originalText = new WeakMap<Text, string>();
const originalAttributes = new WeakMap<Element, Map<string, string>>();
let activeDisplayLanguage: SupportedLanguage = 'en';

export function getStoredDisplayLanguage(): SupportedLanguage {
  try {
    const saved = localStorage.getItem(DISPLAY_LANGUAGE_STORAGE_KEY) as SupportedLanguage | null;
    if (saved && SUPPORTED_LANGUAGES.some((language) => language.code === saved)) return saved;
  } catch {}
  return 'en';
}

export function setStoredDisplayLanguage(language: SupportedLanguage) {
  try {
    localStorage.setItem(DISPLAY_LANGUAGE_STORAGE_KEY, language);
    localStorage.setItem('ctc_audio_language_v2', language);
    window.dispatchEvent(new CustomEvent(DISPLAY_LANGUAGE_EVENT, { detail: { language } }));
    window.dispatchEvent(new CustomEvent('ctc_audio_language_changed', { detail: { lang: language } }));
  } catch {}
}

function localTranslation(text: string, language: SupportedLanguage): string | undefined {
  return translationsByLanguage[language]?.[text.trim()];
}

async function translateBatch(texts: string[], language: SupportedLanguage): Promise<string[]> {
  try {
    const response = await fetch('/api/gemini/translate-ui', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texts, language })
    });
    if (!response.ok) return texts;
    const payload = await response.json();
    if (!Array.isArray(payload.translations)) return texts;
    return texts.map((text, index) => {
      const translated = payload.translations[index];
      return typeof translated === 'string' && translated.trim() ? translated : text;
    });
  } catch {
    return texts;
  }
}

function preserveWhitespace(original: string, translation: string) {
  const leading = original.match(/^\s*/)?.[0] || '';
  const trailing = original.match(/\s*$/)?.[0] || '';
  return `${leading}${translation.trim()}${trailing}`;
}

async function translateTargets(targets: TranslationTarget[], language: SupportedLanguage) {
  for (const target of targets) {
    const knownTranslation = localTranslation(target.original, language);
    if (knownTranslation) target.apply(knownTranslation);
  }

  const remoteTargets = targets.filter((target) => !localTranslation(target.original, language));
  for (let offset = 0; offset < remoteTargets.length; offset += 40) {
    const batch = remoteTargets.slice(offset, offset + 40);
    const translated = await translateBatch(batch.map((target) => target.original), language);
    if (activeDisplayLanguage !== language) return;
    batch.forEach((target, index) => {
      if (target.isCurrent()) target.apply(translated[index]);
    });
  }
}

function translateSubtree(root: Node, language: SupportedLanguage) {
  const targets: TranslationTarget[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      const content = node.textContent?.trim() || '';
      if (!parent || !content || content.length > 240 || content.length < 2) return NodeFilter.FILTER_REJECT;
      if (parent.closest('script,style,noscript,svg,[data-display-language-ignore],[contenteditable="true"]')) return NodeFilter.FILTER_REJECT;
      if (!/[\p{L}]/u.test(content)) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }
  });
  const textNodes: Text[] = root.nodeType === Node.TEXT_NODE ? [root as Text] : [];
  let node: Node | null;
  while ((node = walker.nextNode())) textNodes.push(node as Text);
  for (const textNode of textNodes) {
    const parent = textNode.parentElement;
    const content = textNode.data.trim();
    if (!parent || !content || content.length > 240 || content.length < 2) continue;
    if (parent.closest('script,style,noscript,svg,[data-display-language-ignore],[contenteditable="true"]')) continue;
    if (!/[\p{L}]/u.test(content)) continue;
    const original = originalText.get(textNode) ?? textNode.data;
    originalText.set(textNode, original);
    if (language === 'en') textNode.data = original;
    else targets.push({
      original: original.trim(),
      apply: (translation) => { textNode.data = preserveWhitespace(original, translation); },
      isCurrent: () => textNode.isConnected && originalText.get(textNode) === original
    });
  }

  const elements: Element[] = root.nodeType === Node.ELEMENT_NODE ? [root as Element] : [];
  if (root instanceof Element) elements.push(...Array.from(root.querySelectorAll('*')));
  for (const element of elements) {
    if (element.closest('script,style,noscript,svg,[data-display-language-ignore],[contenteditable="true"]')) continue;
    const originals = originalAttributes.get(element) || new Map<string, string>();
    for (const attribute of ['placeholder', 'aria-label', 'title']) {
      const current = element.getAttribute(attribute);
      const original = originals.get(attribute) ?? current;
      if (!original || original.length > 240 || original.length < 2) continue;
      originals.set(attribute, original);
      if (language === 'en') element.setAttribute(attribute, original);
      else targets.push({
        original,
        apply: (translation) => element.setAttribute(attribute, translation.trim()),
        isCurrent: () => element.isConnected && originals.get(attribute) === original
      });
    }
    originalAttributes.set(element, originals);
  }
  if (language !== 'en') void translateTargets(targets, language);
}

export function useDisplayLanguage(options: { translateDom?: boolean } = {}) {
  const [language, setLanguageState] = useState<SupportedLanguage>(getStoredDisplayLanguage);

  useEffect(() => {
    const syncLanguage = (event: Event) => {
      const nextLanguage = (event as CustomEvent<{ language?: SupportedLanguage }>).detail?.language;
      if (nextLanguage && SUPPORTED_LANGUAGES.some((item) => item.code === nextLanguage)) {
        activeDisplayLanguage = nextLanguage;
        setLanguageState(nextLanguage);
      }
    };
    window.addEventListener(DISPLAY_LANGUAGE_EVENT, syncLanguage);
    return () => window.removeEventListener(DISPLAY_LANGUAGE_EVENT, syncLanguage);
  }, []);

  useEffect(() => {
    if (!options.translateDom) return;
    activeDisplayLanguage = language;
    document.documentElement.lang = language;
    translateSubtree(document.body, language);
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        record.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE || node.nodeType === Node.TEXT_NODE) {
            translateSubtree(node, language);
          }
        });
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [language, options.translateDom]);

  return {
    language,
    setLanguage: setStoredDisplayLanguage,
    t: (key: string) => localTranslation(key, language) || key
  };
}