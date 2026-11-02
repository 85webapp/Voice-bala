import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { createDecipheriv, createHmac, privateDecrypt, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { Pool } from 'pg';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
export { app };
const port = process.env.PORT || 3000;
const submissionPool = process.env.SUPABASE_CONNECTION_STRING
  ? new Pool({ connectionString: process.env.SUPABASE_CONNECTION_STRING, ssl: { rejectUnauthorized: true } })
  : null;

app.use(express.json({ limit: '256kb' }));

// Initialize Google GenAI
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

// Master 28 Permitted Legal Documents
const ALLOWED_DOCUMENTS = [
  { id: 'rent-11-month', title: '11th Month Rent Agreement', category: 'Rent & Property' },
  { id: 'landlord-noc-business', title: 'Landlord NOC for Business', category: 'Rent & Property' },
  { id: 'sub-lease-agreement', title: 'Sublease Agreement', category: 'Rent & Property' },
  { id: 'landlord-noc-gst', title: 'Landlord NOC for GST', category: 'Rent & Property' },
  { id: 'brand-sponsorship-promo', title: 'Brand Sponsorship & Promotion Agreement', category: 'Creators and Freelancers' },
  { id: 'influencer-collab-agreement', title: 'Influencer Collaboration Agreement', category: 'Creators and Freelancers' },
  { id: 'content-rights-copyright', title: 'Content Right & Copyright Transfer Agreement', category: 'Creators and Freelancers' },
  { id: 'freelancer-client-contract', title: 'Freelancer & Client Service Contract', category: 'Creators and Freelancers' },
  { id: 'nda-agreement', title: 'Non-Disclosure Agreement (NDA)', category: 'Creators and Freelancers' },
  { id: 'video-audio-release-form', title: 'Video/Audio Release Form', category: 'Creators and Freelancers' },
  { id: 'partnership-deed', title: 'Partnership Deed', category: 'Business and Partnerships' },
  { id: 'proprietorship-declaration-deed', title: 'Proprietorship Declaration Deed', category: 'Business and Partnerships' },
  { id: 'founder-co-founder-agreement', title: 'Founder & Co-Founder Agreement', category: 'Business and Partnerships' },
  { id: 'vendor-supplier-agreement', title: 'Vendor & Supplier Agreement', category: 'Vendor, Supplier & IT' },
  { id: 'software-it-service-agreement', title: 'Software & IT Service Agreement', category: 'Vendor, Supplier & IT' },
  { id: 'job-work-manufacturing-agreement', title: 'Job Work & Manufacturing Agreement', category: 'Vendor, Supplier & IT' },
  { id: 'equipments-machinery-lease', title: 'Equipment & Machinery Lease Agreement', category: 'Business and Partnerships' },
  { id: 'website-app-terms-privacy', title: 'Website & App Terms of Service and Privacy Policy', category: 'Vendor, Supplier & IT' },
  { id: 'name-change-affidavit', title: 'Name Change Affidavit', category: 'Personal Affidavits' },
  { id: 'address-proof-affidavit', title: 'Address Proof Correction Affidavit', category: 'Personal Affidavits' },
  { id: 'dob-correction-affidavit', title: 'Date of Birth & Age Correction Affidavit', category: 'Personal Affidavits' },
  { id: 'loss-of-document-affidavit', title: 'Loss of Document Affidavit', category: 'Personal Affidavits' },
  { id: 'anti-ragging-gap-year-affidavit', title: 'Anti-Ragging & Gap Year Affidavit', category: 'Education, Job & Government' },
  { id: 'income-unemployment-affidavit', title: 'Income & Unemployment Affidavit', category: 'Education, Job & Government' },
  { id: 'first-child-single-child-affidavit', title: 'First Child / Single Child Affidavit', category: 'Education, Job & Government' },
  { id: 'employment-contract-offer-letter', title: 'Employment Contract & Offer Letter', category: 'Finance, HR & Vehicle' },
  { id: 'general-consent-declaration-letter', title: 'General Consent & Declaration Letter', category: 'Finance, HR & Vehicle' },
  { id: 'old-vehicle-sales-agreement', title: 'Vehicle Sales & Purchase Agreement', category: 'Finance, HR & Vehicle' }
];

// Helper: check for forbidden categories
function checkForbiddenIntent(text: string): { isForbidden: boolean; category: string; legalReason: string } {
  const lower = text.toLowerCase();
  
  if (/\b(last will|wills|will and testament|testament|(?:need|want|make|create|prepare|draft|write)\s+(?:to\s+)?(?:a\s+)?will)\b/.test(lower) && !/\bwill\s+(?:rent|search|find|help|need)\b/.test(lower) || lower.includes('vasiyat') || lower.includes('wasiyat') || lower.includes('वसीयत')) {
    return {
      isForbidden: true,
      category: 'Wills & Testaments (वसीयत)',
      legalReason: 'A Will has specific execution and attestation requirements under Indian succession law, and registration is not universally mandatory. This platform does not generate Wills; please consult a qualified legal professional to confirm the correct execution and registration process for your circumstances.'
    };
  }

  if (lower.includes('power of attorney') || /\bpoa\b/.test(lower) || lower.includes('mukhtarnama') || lower.includes('power-of-attorney') || lower.includes('मुख्तारनामा')) {
    return {
      isForbidden: true,
      category: 'Power of Attorney (POA / मुख्तारनामा)',
      legalReason: 'Power of Attorney requirements depend on its purpose, state rules, and the transaction involved. This platform does not generate these instruments; please contact the relevant Sub-Registrar or a qualified legal professional to confirm execution, stamping, notarization, and registration requirements.'
    };
  }

  if (
    lower.includes('sale deed') ||
    lower.includes('property registry') ||
    lower.includes('land registry') ||
    lower.includes('conveyance deed') ||
    lower.includes('plot registry') ||
    lower.includes('flat registry') ||
    lower.includes('immovable property transfer') ||
    lower.includes('bainama') ||
    lower.includes('zameen registry') ||
    lower.includes('jameen registry') ||
    lower.includes('property bechna')
  ) {
    return {
      isForbidden: true,
      category: 'Real Estate Sale Deeds / Property Registry (बैनामा / रजिस्ट्री)',
      legalReason: 'Transfers of immovable property generally require a properly stamped and registered instrument, with procedure and fees depending on the transaction and state. Please contact the relevant Sub-Registrar office or a qualified legal professional; an online template alone does not complete a property transfer.'
    };
  }

  if (
    /\bfir\b/.test(lower) ||
    lower.includes('police complaint') ||
    lower.includes('criminal complaint') ||
    lower.includes('first information report') ||
    lower.includes('crime report') ||
    lower.includes('criminal case') ||
    lower.includes('criminal matter') ||
    lower.includes('criminal proceedings')
  ) {
    return {
      isForbidden: true,
      category: 'FIR & Criminal Legal Filings (प्रथम सूचना रिपोर्ट / पुलिस शिकायत)',
      legalReason: 'An FIR and criminal filings must follow the applicable police or judicial procedure; a private online agreement template cannot file an FIR or replace an official complaint process. Please contact the appropriate police station, court, or legal aid service.'
    };
  }

  return { isForbidden: false, category: '', legalReason: '' };
}

const SUPPORTED_AUDIO_LANGUAGES = new Set(['hi', 'en', 'mr', 'gu', 'ml', 'ta', 'te', 'bn', 'kn', 'pa']);
const MAX_QUERY_LENGTH = 2000;
const MAX_FIELD_COUNT = 80;
const MAX_FIELD_LENGTH = 180;
const MAX_UI_TRANSLATION_COUNT = 40;
const MAX_UI_TRANSLATION_LENGTH = 240;
const uiTranslationCache = new Map<string, string>();
const NO_MATCH_SPEECH: Record<string, string> = {
  hi: "हमारे पास आपके सवाल के मुताबिक चीजें हमें ढूंढने में नहीं मिली हैं। सही फॉर्म चुनने के लिए आप ऊपर दिए गए 'Call to Admin' विकल्प पर डायरेक्ट कॉल कर सकते हैं।",
  en: "I could not find a matching document in our list. To choose the right form, call directly using the existing 'Call to Admin' option above.",
  mr: "तुमच्या प्रश्नाशी जुळणारा दस्तऐवज यादीत सापडला नाही. योग्य फॉर्म निवडण्यासाठी वर दिलेल्या 'Call to Admin' पर्यायावर थेट कॉल करा.",
  gu: "તમારા પ્રશ્નને અનુરૂપ દસ્તાવેજ મળ્યો નથી. યોગ્ય ફોર્મ પસંદ કરવા માટે ઉપરના 'Call to Admin' વિકલ્પ પર સીધો કૉલ કરો.",
  pa: "ਤੁਹਾਡੇ ਸਵਾਲ ਨਾਲ ਮਿਲਦਾ ਦਸਤਾਵੇਜ਼ ਨਹੀਂ ਮਿਲਿਆ। ਸਹੀ ਫਾਰਮ ਚੁਣਨ ਲਈ ਉੱਪਰ ਦਿੱਤੇ 'Call to Admin' ਵਿਕਲਪ ਰਾਹੀਂ ਸਿੱਧਾ ਕਾਲ ਕਰੋ।",
  ml: "നിങ്ങളുടെ ചോദ്യത്തിന് അനുയോജ്യമായ രേഖ കണ്ടെത്താനായില്ല. ശരിയായ ഫോം തിരഞ്ഞെടുക്കാൻ മുകളിലുള്ള 'Call to Admin' ഓപ്ഷനിൽ നേരിട്ട് വിളിക്കാം.",
  ta: "உங்கள் கேள்விக்குப் பொருந்தும் ஆவணம் கிடைக்கவில்லை. சரியான படிவத்தைத் தேர்வு செய்ய மேலே உள்ள 'Call to Admin' விருப்பத்தின் மூலம் நேரடியாக அழைக்கலாம்.",
  te: "మీ ప్రశ్నకు సరిపోయే పత్రం దొరకలేదు. సరైన ఫారమ్ ఎంచుకోవడానికి పైన ఉన్న 'Call to Admin' ఎంపిక ద్వారా నేరుగా కాల్ చేయండి.",
  bn: "আপনার প্রশ্নের সঙ্গে মেলে এমন নথি পাওয়া যায়নি। সঠিক ফর্ম বেছে নিতে উপরের 'Call to Admin' বিকল্পে সরাসরি ফোন করুন।",
  kn: "ನಿಮ್ಮ ಪ್ರಶ್ನೆಗೆ ಹೊಂದುವ ದಾಖಲೆ ಸಿಗಲಿಲ್ಲ. ಸರಿಯಾದ ಫಾರ್ಮ್ ಆಯ್ಕೆ ಮಾಡಲು ಮೇಲಿನ 'Call to Admin' ಆಯ್ಕೆಗೆ ನೇರವಾಗಿ ಕರೆ ಮಾಡಿ."
};
function normalizeAudioLanguage(value: unknown): string {
  return typeof value === 'string' && SUPPORTED_AUDIO_LANGUAGES.has(value) ? value : 'hi';
}
function cleanText(value: unknown, maxLength = 500): string {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

async function localizedRefusal(category: string, audioLanguage: string): Promise<string> {
  const fallbacks: Record<string, string> = {
    hi: `माफ़ कीजिए, ${category} के लिए ऑनलाइन टेम्पलेट पर्याप्त नहीं है। कृपया सही प्रक्रिया और ज़रूरी दस्तावेज़ जानने के लिए संबंधित सब-रजिस्ट्रार कार्यालय, पुलिस या सरकारी प्राधिकरण से सीधे संपर्क करें।`,
    en: `Sorry, this request needs an official process rather than a simple online document. Please check with the relevant Sub-Registrar office or authority in person before proceeding.`,
    mr: `क्षमस्व, ${category} साठी फक्त ऑनलाइन टेम्पलेट पुरेसे नाही. योग्य प्रक्रिया आणि आवश्यक कागदपत्रांसाठी संबंधित सब-रजिस्ट्रार कार्यालय किंवा अधिकाऱ्यांशी प्रत्यक्ष संपर्क साधा.`,
    gu: `માફ કરશો, ${category} માટે માત્ર ઑનલાઇન નમૂનો પૂરતો નથી. યોગ્ય પ્રક્રિયા અને જરૂરી દસ્તાવેજો માટે સંબંધિત સબ-રજિસ્ટ્રાર કચેરી અથવા અધિકારીનો સંપર્ક કરો.`,
    pa: `ਮਾਫ਼ ਕਰਨਾ, ${category} ਲਈ ਸਿਰਫ਼ ਆਨਲਾਈਨ ਦਸਤਾਵੇਜ਼ ਕਾਫ਼ੀ ਨਹੀਂ ਹੈ। ਸਹੀ ਪ੍ਰਕਿਰਿਆ ਲਈ ਸੰਬੰਧਤ ਸਬ-ਰਜਿਸਟਰਾਰ ਦਫ਼ਤਰ ਜਾਂ ਅਧਿਕਾਰੀ ਨਾਲ ਸੰਪਰਕ ਕਰੋ।`,
    ml: `ക്ഷമിക്കണം, ${category} ന് ഒരു ഓൺലൈൻ മാതൃക മാത്രം മതിയാകില്ല. ശരിയായ നടപടിക്രമത്തിനും ആവശ്യമായ രേഖകൾക്കും ബന്ധപ്പെട്ട സബ് രജിസ്ട്രാർ ഓഫീസിനെയോ അധികാരിയെയോ നേരിട്ട് ബന്ധപ്പെടുക.`,
    ta: `மன்னிக்கவும், ${category} க்கு ஆன்லைன் மாதிரி மட்டும் போதாது. சரியான நடைமுறை மற்றும் தேவையான ஆவணங்களுக்கு சம்பந்தப்பட்ட சார் பதிவாளர் அலுவலகம் அல்லது அதிகாரியை நேரில் அணுகவும்.`,
    te: `క్షమించండి, ${category} కోసం ఆన్‌లైన్ నమూనా మాత్రమే సరిపోదు. సరైన ప్రక్రియ, అవసరమైన పత్రాల కోసం సంబంధిత సబ్-రిజిస్ట్రార్ కార్యాలయం లేదా అధికారిని సంప్రదించండి.`,
    bn: `দুঃখিত, ${category}-এর জন্য শুধু অনলাইন নথির নমুনা যথেষ্ট নয়। সঠিক প্রক্রিয়া ও প্রয়োজনীয় নথির জন্য সংশ্লিষ্ট সাব-রেজিস্ট্রার অফিস বা কর্তৃপক্ষের সঙ্গে সরাসরি যোগাযোগ করুন।`,
    kn: `ಕ್ಷಮಿಸಿ, ${category} ಗಾಗಿ ಆನ್‌ಲೈನ್ ಮಾದರಿ ಮಾತ್ರ ಸಾಕಾಗುವುದಿಲ್ಲ. ಸರಿಯಾದ ಕ್ರಮ ಮತ್ತು ಅಗತ್ಯ ದಾಖಲೆಗಳಿಗಾಗಿ ಸಂಬಂಧಿತ ಸಬ್-ರಿಜಿಸ್ಟ್ರಾರ್ ಕಚೇರಿ ಅಥವಾ ಅಧಿಕಾರಿಯನ್ನು ನೇರವಾಗಿ ಸಂಪರ್ಕಿಸಿ.`
  };
  const fallback = fallbacks[audioLanguage] || fallbacks.hi;
  if (!ai) return fallback;
  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: `Write a short, polite refusal for an Indian user asking for this restricted service: ${category}. Explain in a practical, non-alarmist way that they should visit/contact the relevant official Sub-Registrar, police station, court, or government authority as applicable. Do not invent statutory section numbers or claim that every case legally requires biometric verification. Language code: ${audioLanguage}. If language code is en, use natural conversational Indian English/Hinglish, not formal British English. Return JSON only: {"spokenText":"one or two sentences"}.`,
      config: { responseMimeType: 'application/json' }
    });
    const parsed = JSON.parse(response.text || '{}');
    return cleanText(parsed.spokenText, 900) || fallback;
  } catch (error) {
    console.warn('Gemini refusal localization failed; using localized safe refusal.', error);
    return fallback;
  }
}

app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'document-india', geminiConfigured: Boolean(apiKey) }));

const SESSION_COOKIE = 'ctc_session';
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 30;
const PHONE_PATTERN = /^[0-9]{10}$/;

function getSessionSecret(): string | null {
  const secret = process.env.AUTH_SESSION_SECRET;
  return secret && Buffer.byteLength(secret, 'utf8') >= 32 ? secret : null;
}

function createSessionToken(userId: string): string {
  const secret = getSessionSecret();
  if (!secret) throw new Error('Authentication is not configured.');
  const payload = Buffer.from(JSON.stringify({ userId, expiresAt: Math.floor(Date.now() / 1000) + SESSION_DURATION_SECONDS })).toString('base64url');
  const signature = createHmac('sha256', secret).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

function getSessionUserId(req: express.Request): string | null {
  const cookie = req.headers.cookie?.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${SESSION_COOKIE}=`));
  const token = cookie?.slice(SESSION_COOKIE.length + 1);
  const [payload, encodedSignature] = token?.split('.') || [];
  const secret = getSessionSecret();
  if (!payload || !encodedSignature || !secret) return null;

  const expected = createHmac('sha256', secret).update(payload).digest();
  let actual: Buffer;
  try {
    actual = Buffer.from(encodedSignature, 'base64url');
  } catch {
    return null;
  }
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;

  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return typeof session.userId === 'string' && /^[0-9a-f-]{36}$/i.test(session.userId) &&
      Number.isInteger(session.expiresAt) && session.expiresAt > Math.floor(Date.now() / 1000)
      ? session.userId
      : null;
  } catch {
    return null;
  }
}

function setSessionCookie(res: express.Response, userId: string): void {
  const secure = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1' ? '; Secure' : '';
  res.setHeader('Set-Cookie', `${SESSION_COOKIE}=${createSessionToken(userId)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_DURATION_SECONDS}${secure}`);
}

function clearSessionCookie(res: express.Response): void {
  const secure = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1' ? '; Secure' : '';
  res.setHeader('Set-Cookie', `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`);
}

function hashPassword(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, 64, (error, derivedKey) => error ? reject(error) : resolve(derivedKey));
  });
}

function authUnavailable(res: express.Response): boolean {
  if (!submissionPool || !getSessionSecret() || !getAccountDataPrivateKey()) {
    res.status(503).json({ error: 'Account services are not configured.' });
    return true;
  }
  return false;
}

function getAccountDataPrivateKey(): string | null {
  const privateKey = process.env.ACCOUNT_DATA_PRIVATE_KEY?.replace(/\\n/g, '\n').trim();
  return privateKey || null;
}

function decryptAccountPayload(accountPayload: string): Record<string, unknown> {
  const privateKey = getAccountDataPrivateKey();
  if (!privateKey) throw new Error('Account data decryption is not configured.');

  const envelope = JSON.parse(Buffer.from(accountPayload, 'base64url').toString('utf8'));
  if (envelope.version !== 1 || envelope.algorithm !== 'RSA-OAEP-256+A256GCM') {
    throw new Error('Stored account form envelope is invalid.');
  }
  const aesKey = privateDecrypt(
    { key: privateKey, oaepHash: 'sha256' },
    Buffer.from(envelope.key, 'base64url')
  );
  const iv = Buffer.from(envelope.iv, 'base64url');
  const sealed = Buffer.from(envelope.ciphertext, 'base64url');
  if (aesKey.length !== 32 || iv.length !== 12 || sealed.length < 16) {
    throw new Error('Stored account form envelope is invalid.');
  }

  const decipher = createDecipheriv('aes-256-gcm', aesKey, iv);
  decipher.setAuthTag(sealed.subarray(sealed.length - 16));
  const plaintext = Buffer.concat([
    decipher.update(sealed.subarray(0, sealed.length - 16)),
    decipher.final()
  ]);
  const details = JSON.parse(plaintext.toString('utf8'));
  if (!details || typeof details !== 'object' || Array.isArray(details)) {
    throw new Error('Stored account form details are invalid.');
  }
  return details as Record<string, unknown>;
}

app.post('/api/auth/register', async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (authUnavailable(res)) return;
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
  const phone = typeof req.body?.phone === 'string' ? req.body.phone : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  if (!name || name.length > 120 || !PHONE_PATTERN.test(phone) || password.length < 8 || password.length > 128) {
    return res.status(400).json({ error: 'Enter a name, a 10-digit mobile number, and a password of at least 8 characters.' });
  }

  try {
    const salt = randomBytes(16);
    const passwordHash = await hashPassword(password, salt);
    const result = await submissionPool!.query(
      'INSERT INTO app_users (full_name, phone, password_hash) VALUES ($1, $2, $3) RETURNING id, full_name, phone',
      [name, phone, `${salt.toString('base64url')}.${passwordHash.toString('base64url')}`]
    );
    setSessionCookie(res, result.rows[0].id);
    return res.status(201).json({ user: { name: result.rows[0].full_name, phone: result.rows[0].phone } });
  } catch (error) {
    if ((error as { code?: string })?.code === '23505') return res.status(409).json({ error: 'An account with this mobile number already exists.' });
    console.error('Account registration failed:', error);
    return res.status(503).json({ error: 'Could not create the account right now.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (authUnavailable(res)) return;
  const phone = typeof req.body?.phone === 'string' ? req.body.phone : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  if (!PHONE_PATTERN.test(phone) || !password || password.length > 128) {
    return res.status(400).json({ error: 'Enter a valid 10-digit mobile number and password.' });
  }

  try {
    const result = await submissionPool!.query(
      'SELECT id, full_name, phone, password_hash FROM app_users WHERE phone = $1',
      [phone]
    );
    const user = result.rows[0];
    const [encodedSalt, encodedHash] = typeof user?.password_hash === 'string' ? user.password_hash.split('.') : [];
    if (!user || !encodedSalt || !encodedHash) return res.status(401).json({ error: 'Mobile number or password is incorrect.' });
    const expected = Buffer.from(encodedHash, 'base64url');
    const actual = await hashPassword(password, Buffer.from(encodedSalt, 'base64url'));
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
      return res.status(401).json({ error: 'Mobile number or password is incorrect.' });
    }
    setSessionCookie(res, user.id);
    return res.json({ user: { name: user.full_name, phone: user.phone } });
  } catch (error) {
    console.error('Account login failed:', error);
    return res.status(503).json({ error: 'Could not sign in right now.' });
  }
});

app.get('/api/auth/me', async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (authUnavailable(res)) return;
  const userId = getSessionUserId(req);
  if (!userId) return res.status(401).json({ error: 'Sign in to continue.' });
  try {
    const result = await submissionPool!.query('SELECT full_name, phone FROM app_users WHERE id = $1', [userId]);
    if (!result.rows[0]) return res.status(401).json({ error: 'Sign in to continue.' });
    return res.json({ user: { name: result.rows[0].full_name, phone: result.rows[0].phone } });
  } catch (error) {
    console.error('Account session lookup failed:', error);
    return res.status(503).json({ error: 'Could not load the account right now.' });
  }
});

app.post('/api/auth/logout', (_req, res) => {
  clearSessionCookie(res);
  return res.json({ ok: true });
});

app.get('/api/submissions', async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (authUnavailable(res)) return;
  const userId = getSessionUserId(req);
  if (!userId) return res.status(401).json({ error: 'Sign in to view your saved forms.' });
  try {
    const result = await submissionPool!.query(
      'SELECT id, first_party_name, form_name, submitted_at, total_price, account_payload FROM form_submissions WHERE user_id = $1 ORDER BY submitted_at DESC',
      [userId]
    );
    const submissions = result.rows.map((row) => ({
      id: row.id,
      first_party_name: row.first_party_name,
      form_name: row.form_name,
      submitted_at: row.submitted_at,
      total_price: row.total_price,
      details: decryptAccountPayload(row.account_payload)
    }));
    return res.json({ submissions });
  } catch (error) {
    console.error('Account submissions lookup failed:', error);
    return res.status(503).json({ error: 'Could not load saved forms right now.' });
  }
});

app.post('/api/submissions', async (req, res) => {
  const { firstPartyName, formName, totalPrice, payload } = req.body || {};
  const signatureSecret = process.env.SUBMISSION_HMAC_SECRET;
  const userId = getSessionUserId(req);

  if (authUnavailable(res)) return;
  if (!submissionPool) return res.status(503).json({ error: 'Secure form submissions are not configured.' });
  if (!signatureSecret || Buffer.byteLength(signatureSecret, 'utf8') < 32) {
    return res.status(503).json({ error: 'Secure form submissions are not configured.' });
  }
  if (!userId) return res.status(401).json({ error: 'Sign in before saving a form.' });
  const accountPayload = req.body?.accountPayload;
  if (
    typeof firstPartyName !== 'string' || !firstPartyName.trim() || firstPartyName.length > 160 ||
    typeof formName !== 'string' || !formName.trim() || formName.length > 120 ||
    !(totalPrice === null || (typeof totalPrice === 'number' && Number.isFinite(totalPrice) && totalPrice >= 0)) ||
    typeof payload !== 'string' || payload.length > 5500 || !/^[A-Za-z0-9_-]+$/.test(payload) ||
    typeof accountPayload !== 'string' || accountPayload.length > 200_000 || !/^[A-Za-z0-9_-]+$/.test(accountPayload)
  ) {
    return res.status(400).json({ error: 'Submission metadata or encrypted payload is invalid.' });
  }

  try {
    const signature = createHmac('sha256', signatureSecret).update(payload, 'utf8').digest('hex');
    const redirectUrl = new URL('https://website-b-admin.com/');
    redirectUrl.searchParams.set('payload', payload);
    redirectUrl.searchParams.set('signature', signature);

    if (redirectUrl.toString().length > 7500) {
      return res.status(413).json({ error: 'The encrypted submission exceeds Website B URL limits.' });
    }

    const submission = await submissionPool.query(
      'INSERT INTO form_submissions (user_id, first_party_name, form_name, submitted_at, total_price, account_payload) VALUES ($1, $2, $3, NOW(), $4, $5) RETURNING submitted_at',
      [userId, firstPartyName.trim(), formName.trim(), totalPrice, accountPayload]
    );
    res.setHeader('Cache-Control', 'no-store');
    return res.json({ redirectUrl: redirectUrl.toString(), submittedAt: submission.rows[0].submitted_at });
  } catch (error) {
    console.error('Secure form submission failed:', error);
    return res.status(503).json({ error: 'Submission storage is temporarily unavailable.' });
  }
});

// 1. AI Voice / Text Intent Search Bar Endpoint
app.post('/api/gemini/search', async (req, res) => {
  try {
    const { query } = req.body || {};
    const audioLanguage = normalizeAudioLanguage(req.body?.audioLanguage);

    if (typeof query !== 'string' || !query.trim()) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    if (query.length > MAX_QUERY_LENGTH) return res.status(413).json({ error: 'Search query is too long.' });

    const trimmedQuery = query.trim();

    // Check strict refusal filter first
    const forbidden = checkForbiddenIntent(trimmedQuery);
    if (forbidden.isForbidden) {
      const spokenText = await localizedRefusal(forbidden.category, audioLanguage);

      return res.json({
        refusal: true,
        forbiddenCategory: forbidden.category,
        refusalReason: forbidden.legalReason,
        spokenText,
        matches: []
      });
    }

    // Call Gemini API to match against the 28 allowed documents
    const docInventorySummary = ALLOWED_DOCUMENTS.map(
      (d) => `- ID: "${d.id}", Title: "${d.title}", Category: "${d.category}"`
    ).join('\n');

    const prompt = `You are the Lead Legal Architect for "Document India" legal tech platform.
A citizen has spoken or typed the following request in an Indian regional language or English:
"${trimmedQuery}"

TARGET AUDIO LANGUAGE FOR SPOKEN EXPLANATION: "${audioLanguage}" (e.g. hi=Hindi, en=Hinglish/Conversational English, mr=Marathi, gu=Gujarati, ml=Malayalam, te=Telugu, bn=Bengali, pa=Punjabi, ta=Tamil, kn=Kannada).

ALLOWED 28 MASTER LEGAL DOCUMENTS INVENTORY:
${docInventorySummary}

FORBIDDEN CATEGORIES (Strict Refusal):
1. Wills / Testaments (वसीयत)
2. Power of Attorney (POA / मुख्तारनामा)
3. Real Estate Sale Deeds / Property Registry / Immovable property transfer
4. FIR / Criminal filings

TASK:
1. First, check if the query relates to any of the 4 FORBIDDEN CATEGORIES. If yes, set refusal: true and explain the legal requirement for Sub-Registrar / Police Station appearance under Indian law.
2. If allowed and one or more inventory items genuinely match, identify the 1 to 3 best matching documents. Return an empty matches array when none is a reasonable match; never force an unrelated result.
3. If matches exist, provide a warm spokenText in the requested language that briefly names the recommendations, what each is for, and how to start using it. If there are no matches, say: "हमारे पास आपके सवाल के मुताबिक चीजें हमें ढूंढने में नहीं मिली हैं। सही फॉर्म चुनने के लिए आप ऊपर दिए गए 'Call to Admin' विकल्प पर डायरेक्ट कॉल कर सकते हैं।" in Hindi, or an equivalent natural message in the requested language. Do not invent a call control.

Respond ONLY with valid JSON in this exact structure:
{
  "refusal": false,
  "forbiddenCategory": "",
  "refusalReason": "",
  "matches": [
    {
      "id": "matched document id",
      "title": "matched document title",
      "category": "category name",
      "matchScore": 0.95,
      "explanation": "Why this document matches user's request"
    }
  ],
  "spokenText": "Spoken audio text in requested audioLanguage"
}`;

    if (!apiKey || !ai) {
      return res.status(503).json({ error: 'Gemini is not configured. Set GEMINI_API_KEY on the server.' });
    }

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const rawText = response.text || '{}';
    const parsed = JSON.parse(rawText);
    const allowedById = new Map(ALLOWED_DOCUMENTS.map((doc) => [doc.id, doc]));
    const safeMatches = Array.isArray(parsed.matches) ? parsed.matches.filter((item: any) => allowedById.has(item?.id)).slice(0, 3).map((item: any) => ({ ...allowedById.get(item.id), matchScore: Number.isFinite(Number(item.matchScore)) ? Math.max(0, Math.min(1, Number(item.matchScore))) : 0.5, explanation: cleanText(item.explanation, 500) })) : [];
    const refusal = Boolean(parsed.refusal);
    const spokenText = refusal ? cleanText(parsed.spokenText, 1800) : safeMatches.length ? cleanText(parsed.spokenText, 1800) : NO_MATCH_SPEECH[audioLanguage];
    return res.json({ refusal, forbiddenCategory: String(parsed.forbiddenCategory || ''), refusalReason: String(parsed.refusalReason || ''), matches: refusal ? [] : safeMatches, spokenText });
  } catch (error: any) {
    console.error('Gemini search error:', error);
    return res.status(502).json({ error: 'Gemini could not process this request. Please try again.' });
  }
});

// 2. Contextual Page-Level Audio Explainer
app.post('/api/gemini/explain-page', async (req, res) => {
  try {
    const { documentTitle, pageNumber, pageTitle } = req.body || {};
    const fields = Array.isArray(req.body?.fields) ? req.body.fields.filter((field: unknown) => typeof field === 'string').slice(0, MAX_FIELD_COUNT).map((field: string) => field.slice(0, MAX_FIELD_LENGTH)) : [];
    const audioLanguage = normalizeAudioLanguage(req.body?.audioLanguage);
    if (typeof documentTitle !== 'string' || !documentTitle.trim() || typeof pageTitle !== 'string' || !pageTitle.trim()) return res.status(400).json({ error: 'documentTitle and pageTitle are required.' });

    if (!apiKey || !ai) return res.status(503).json({ error: 'Gemini is not configured. Set GEMINI_API_KEY on the server.' });

    const prompt = `You are a warm, helpful legal assistant explaining a legal form wizard step to an Indian user.
Document: "${cleanText(documentTitle, 160)}"
Page Number: ${Number.isFinite(Number(pageNumber)) ? Math.max(1, Math.min(50, Number(pageNumber))) : 1}
Page Title: "${cleanText(pageTitle, 160)}"
Key fields on this page: ${fields.join(', ')}

TARGET AUDIO LANGUAGE: "${audioLanguage}" (hi=Hindi, en=Conversational Indian English/Hinglish, mr=Marathi, gu=Gujarati, ml=Malayalam, te=Telugu, bn=Bengali, pa=Punjabi, ta=Tamil, kn=Kannada).

Provide a warm, reassuring 2-3 sentence spoken script explaining what this page is for and how to complete it.
Tone: Respectful, simple, non-bureaucratic, conversational.
Respond ONLY with a JSON object: {"spokenText": "..."}`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    const spokenText = cleanText(parsed.spokenText, 1800);
    if (!spokenText) return res.status(502).json({ error: 'Gemini returned an empty explanation.' });
    return res.json({ spokenText });
  } catch (error: any) {
    console.error('Gemini explain-page error:', error);
    return res.status(502).json({ error: 'Gemini could not explain this page. Please try again.' });
  }
});

// 3. Field-Level Micro Contextual Explainer
app.post('/api/gemini/explain-field', async (req, res) => {
  try {
    const { documentTitle, fieldKey, fieldLabel } = req.body || {};
    const context = cleanText(req.body?.context, 1500);
    const audioLanguage = normalizeAudioLanguage(req.body?.audioLanguage);
    if (typeof documentTitle !== 'string' || !documentTitle.trim()) return res.status(400).json({ error: 'documentTitle is required.' });

    if (!apiKey || !ai) return res.status(503).json({ error: 'Gemini is not configured. Set GEMINI_API_KEY on the server.' });
    if (typeof fieldLabel !== 'string' || !fieldLabel.trim()) return res.status(400).json({ error: 'fieldLabel is required' });

    const prompt = `You are explaining a single input field on an Indian legal document form.
Document: "${cleanText(documentTitle, 160)}"
Field: "${cleanText(fieldLabel, 180)}" (Key: "${cleanText(fieldKey, 100)}")
Context: "${context}"

TARGET AUDIO LANGUAGE: "${audioLanguage}" (hi=Hindi, en=Conversational Indian English/Hinglish, mr=Marathi, gu=Gujarati, ml=Malayalam, te=Telugu, bn=Bengali, pa=Punjabi, ta=Tamil, kn=Kannada).

Provide exactly 1 warm, clear spoken sentence explaining what to enter in this field and why.
Do NOT use jargon.
Respond ONLY with a JSON object: {"spokenText": "..."}`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    const spokenText = cleanText(parsed.spokenText, 1800);
    if (!spokenText) return res.status(502).json({ error: 'Gemini returned an empty explanation.' });
    return res.json({ spokenText });
  } catch (error: any) {
    console.error('Gemini explain-field error:', error);
    return res.status(502).json({ error: 'Gemini could not explain this field. Please try again.' });
  }
});

app.post('/api/gemini/translate-ui', async (req, res) => {
  try {
    const { texts, language } = req.body || {};
    if (!Array.isArray(texts) || texts.length === 0 || texts.length > MAX_UI_TRANSLATION_COUNT) {
      return res.status(400).json({ error: `texts must contain 1-${MAX_UI_TRANSLATION_COUNT} items.` });
    }
    if (typeof language !== 'string' || !SUPPORTED_AUDIO_LANGUAGES.has(language)) {
      return res.status(400).json({ error: 'A supported language code is required.' });
    }
    const sourceTexts = texts.map((text: unknown) => cleanText(text, MAX_UI_TRANSLATION_LENGTH));
    if (sourceTexts.some((text: string) => !text)) return res.status(400).json({ error: 'Translation text cannot be empty.' });
    if (language === 'en') return res.json({ translations: sourceTexts });
    if (!ai) return res.status(503).json({ error: 'Gemini is not configured. Set GEMINI_API_KEY on the server.' });

    const keys = sourceTexts.map((text: string) => `${language}:${text}`);
    const missingIndices = keys.map((key: string, index: number) => uiTranslationCache.has(key) ? -1 : index).filter((index: number) => index >= 0);
    if (missingIndices.length) {
      const missingTexts = missingIndices.map((index: number) => sourceTexts[index]);
      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: `Translate each UI text string into language code "${language}". Preserve meaning, punctuation, names, product terms, numbers, and placeholders. Return JSON only as {"translations":[...]} with exactly ${missingTexts.length} strings in input order. Do not add explanations. Input: ${JSON.stringify(missingTexts)}`,
        config: { responseMimeType: 'application/json' }
      });
      const parsed = JSON.parse(response.text || '{}');
      if (!Array.isArray(parsed.translations) || parsed.translations.length !== missingTexts.length) {
        return res.status(502).json({ error: 'Translation service returned an invalid response.' });
      }
      missingIndices.forEach((sourceIndex: number, index: number) => {
        const translation = cleanText(parsed.translations[index], MAX_UI_TRANSLATION_LENGTH * 2);
        if (translation) uiTranslationCache.set(keys[sourceIndex], translation);
      });
      while (uiTranslationCache.size > 5000) uiTranslationCache.delete(uiTranslationCache.keys().next().value!);
    }

    return res.json({ translations: keys.map((key: string, index: number) => uiTranslationCache.get(key) || sourceTexts[index]) });
  } catch (error) {
    console.error('Gemini UI translation error:', error);
    return res.status(502).json({ error: 'UI translation is temporarily unavailable.' });
  }
});

// In-memory cache for audio buffers to avoid re-fetching from Google
const ttsAudioCache = new Map<string, Buffer>();

function splitTtsText(str: string, maxLength = 140): string[] {
  const normalized = str.replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxLength) return [normalized];

  const chunks: string[] = [];
  const parts = normalized.split(/([।!?.,;:—]+)/);
  let cur = '';

  for (let i = 0; i < parts.length; i += 2) {
    const textPart = parts[i] || '';
    const punctPart = parts[i + 1] || '';
    const segment = textPart + punctPart;

    if (!segment.trim()) continue;

    if ((cur + segment).length <= maxLength) {
      cur += segment;
    } else {
      if (cur.trim()) chunks.push(cur.trim());
      if (segment.length > maxLength) {
        const words = segment.split(' ');
        let wordBuf = '';
        for (const w of words) {
          if ((wordBuf + ' ' + w).length <= maxLength) {
            wordBuf = wordBuf ? `${wordBuf} ${w}` : w;
          } else {
            if (wordBuf.trim()) chunks.push(wordBuf.trim());
            wordBuf = w;
          }
        }
        cur = wordBuf;
      } else {
        cur = segment;
      }
    }
  }

  if (cur.trim()) chunks.push(cur.trim());
  return chunks.length > 0 ? chunks : [normalized];
}

// Google TTS Audio Proxy - Handles chunking & seamless stream concatenation
app.get('/api/tts-audio', async (req, res) => {
  try {
    const q = typeof req.query.q === 'string' ? req.query.q : typeof req.query.text === 'string' ? req.query.text : '';
    const tl = typeof req.query.tl === 'string' ? req.query.tl : typeof req.query.lang === 'string' ? req.query.lang : 'hi';

    if (!q.trim()) {
      return res.status(400).json({ error: 'Text query (q) is required' });
    }

    const trimmedText = q.trim();
    const cacheKey = `${tl}:${trimmedText}`;

    if (ttsAudioCache.has(cacheKey)) {
      const cachedBuffer = ttsAudioCache.get(cacheKey)!;
      res.set({
        'Content-Type': 'audio/mpeg',
        'Content-Length': cachedBuffer.length.toString(),
        'Cache-Control': 'public, max-age=86400',
        'Accept-Ranges': 'bytes'
      });
      return res.end(cachedBuffer);
    }

    const chunks = splitTtsText(trimmedText, 140);
    const audioBuffers: Buffer[] = [];

    for (const chunk of chunks) {
      const googleTTSUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(chunk)}&tl=${encodeURIComponent(tl)}&client=tw-ob`;
      const upstream = await fetch(googleTTSUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': 'https://translate.google.com/'
        }
      });

      if (!upstream.ok) {
        console.error(`[TTS Proxy] Upstream returned status ${upstream.status} for chunk: "${chunk}"`);
        return res.status(upstream.status).send(`TTS upstream error (${upstream.status})`);
      }

      const ab = await upstream.arrayBuffer();
      audioBuffers.push(Buffer.from(ab));
    }

    const finalBuffer = Buffer.concat(audioBuffers);

    if (ttsAudioCache.size > 200) {
      const firstKey = ttsAudioCache.keys().next().value;
      if (firstKey) ttsAudioCache.delete(firstKey);
    }
    ttsAudioCache.set(cacheKey, finalBuffer);

    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': finalBuffer.length.toString(),
      'Cache-Control': 'public, max-age=86400',
      'Accept-Ranges': 'bytes'
    });

    return res.end(finalBuffer);
  } catch (err) {
    console.error('TTS proxy error:', err);
    return res.status(500).json({ error: 'Failed to stream TTS audio' });
  }
});

app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'API endpoint not found.' });
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  }

  app.listen(Number(port), '0.0.0.0', () => {
    console.log(`Document India Full-Stack server running on http://0.0.0.0:${port}`);
  });
}

if (process.env.VERCEL !== '1') startServer();
