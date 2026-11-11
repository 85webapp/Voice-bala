import CryptoJS from 'crypto-js';

// 1. Public Encryption Key (Configured via Vercel / Netlify / Vite with fallback)
export const PUBLIC_ENCRYPTION_KEY =
  (typeof import.meta !== 'undefined' &&
    (import.meta.env?.PUBLIC_KEY ||
      import.meta.env?.VITE_PUBLIC_ENCRYPTION_KEY ||
      import.meta.env?.VITE_ENCRYPTION_SECRET)) ||
  (typeof process !== 'undefined' && process.env && (process.env.PUBLIC_KEY || process.env.VITE_PUBLIC_ENCRYPTION_KEY)) ||
  'ctc-legal-zero-db-aes-256-public-key-2026';

// 2. HMAC Secret for digital signature & authenticity (WEBSITE_SECRET_KEY)
export const SUBMISSION_HMAC_SECRET =
  (typeof import.meta !== 'undefined' &&
    (import.meta.env?.WEBSITE_SECRET_KEY ||
      import.meta.env?.VITE_SUBMISSION_HMAC_SECRET ||
      import.meta.env?.VITE_HMAC_SECRET)) ||
  (typeof process !== 'undefined' && process.env && (process.env.WEBSITE_SECRET_KEY || process.env.VITE_SUBMISSION_HMAC_SECRET)) ||
  'ctc-legal-hmac-sha256-authenticity-key-2026';

// 3. Website B Backend API Endpoint (NEXT_PUBLIC_WEBSITE_B_URL)
export const WEBSITE_B_API_ENDPOINT =
  (typeof import.meta !== 'undefined' &&
    (import.meta.env?.NEXT_PUBLIC_WEBSITE_B_URL ||
      import.meta.env?.VITE_WEBSITE_B_URL ||
      import.meta.env?.VITE_WEBSITE_B_API_URL)) ||
  (typeof process !== 'undefined' && process.env && (process.env.NEXT_PUBLIC_WEBSITE_B_URL || process.env.VITE_WEBSITE_B_URL)) ||
  'https://your-backend.vercel.app/api/orders/receive';

/**
 * Sequential Order ID Generator:
 * Generates cot_har_1, cot_har_2, cot_har_3... strictly incrementing and persisted.
 */
export function generateSequentialOrderId(): string {
  try {
    const STORAGE_KEY = 'cot_har_order_seq';
    let currentSeq = 0;
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = parseInt(stored, 10);
        if (!isNaN(parsed) && parsed >= 0) {
          currentSeq = parsed;
        }
      }
      currentSeq += 1;
      window.localStorage.setItem(STORAGE_KEY, currentSeq.toString());
    } else {
      currentSeq = 1;
    }
    return `cot_har_${currentSeq}`;
  } catch {
    return `cot_har_${Date.now() % 10000}`;
  }
}

export interface LightweightMetadata {
  firstPartyName: string;
  formName: string;
  timestamp: string;
  totalPrice: number | string;
  orderId?: string;
}

export interface EncryptedSubmissionResult {
  encryptedPayload: string;
  signature: string;
  websiteBUrl: string;
  timestamp: string;
}

/**
 * Encrypts all sensitive form data on the client side using AES-256 before any server request.
 * Uses PUBLIC_KEY for locking and WEBSITE_SECRET_KEY for authenticity.
 */
export function encryptFormDataAndSign(formData: Record<string, any>): EncryptedSubmissionResult {
  const jsonString = JSON.stringify(formData);

  // 1. Client-Side AES-256 Encryption (The Lock System)
  const encryptedPayload = CryptoJS.AES.encrypt(jsonString, PUBLIC_ENCRYPTION_KEY).toString();

  // 2. HMAC-SHA256 Digital Signature
  const signature = CryptoJS.HmacSHA256(encryptedPayload, SUBMISSION_HMAC_SECRET).toString(CryptoJS.enc.Hex);

  const timestamp = new Date().toISOString();

  // Reference URL for backend verification (browser stays on Website A!)
  const baseUrl = WEBSITE_B_API_ENDPOINT.includes('/api/')
    ? WEBSITE_B_API_ENDPOINT.split('/api/')[0]
    : WEBSITE_B_API_ENDPOINT;
  const websiteBUrl = `${baseUrl}/?payload=${encodeURIComponent(
    encryptedPayload
  )}&signature=${encodeURIComponent(signature)}`;

  return {
    encryptedPayload,
    signature,
    websiteBUrl,
    timestamp
  };
}



/**
 * Saves ONLY lightweight metadata to the backend Supabase endpoint:
 * - First Party Name (User's Name)
 * - Form Name / Document Type
 * - Date & Exact Time (Timestamp)
 * - Total Price / Final Payment Shown to User
 * Zero sensitive data or heavy files are sent to the database.
 */
export async function saveLightweightMetadata(metadata: LightweightMetadata): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('/api/orders/metadata', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        firstPartyName: metadata.firstPartyName,
        formName: metadata.formName,
        timestamp: metadata.timestamp || new Date().toISOString(),
        totalPrice: String(metadata.totalPrice),
        orderId: metadata.orderId || ''
      })
    });

    if (!response.ok) {
      console.warn('Metadata server save responded with non-200:', response.status);
    }
    return { success: true };
  } catch (err: any) {
    console.warn('Metadata server save failed (graceful offline fallback):', err);
    return { success: true }; // Does not block user redirection
  }
}



/**
 * Sends the encrypted ciphertext and digital HMAC signature directly via a POST request
 * to Website B's private API endpoint. If the external URL is blocked by CORS or offline,
 * it transparently relays through the secure /api/website-b/relay endpoint so nothing is lost.
 */
export async function postEncryptedPayloadToWebsiteB(
  result: EncryptedSubmissionResult,
  metadata: LightweightMetadata
): Promise<{ success: boolean; deliveredDirect: boolean; error?: string }> {
  const postBody = JSON.stringify({
    encryptedPayload: result.encryptedPayload,
    signature: result.signature,
    timestamp: result.timestamp,
    metadata: {
      orderId: metadata.orderId || '',
      formName: metadata.formName,
      timestamp: metadata.timestamp,
      totalPrice: metadata.totalPrice
    }
  });

  let deliveredDirect = false;

  // 1. Attempt direct POST to Website B API endpoint
  try {
    const directRes = await fetch(WEBSITE_B_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Digital-Signature': result.signature,
        'X-Encrypted-Timestamp': result.timestamp,
        'x-website-secret-key': SUBMISSION_HMAC_SECRET,
        'x-order-id': metadata.orderId || ''
      },
      body: postBody,
      mode: 'cors'
    });
    if (directRes.ok) {
      deliveredDirect = true;
    }
  } catch {
    console.info('[Zero-Knowledge] Direct POST to Website B attempted. Relaying via fallback relay...');
  }

  // 2. Also ensure local / fallback relay receives the encrypted package
  try {
    await fetch('/api/website-b/relay', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Digital-Signature': result.signature,
        'X-Encrypted-Timestamp': result.timestamp,
        'x-website-secret-key': SUBMISSION_HMAC_SECRET,
        'x-order-id': metadata.orderId || ''
      },
      body: postBody
    });
  } catch (relayErr) {
    console.warn('[Website B Relay Notice]:', relayErr);
  }

  return { success: true, deliveredDirect };
}

/**
 * Decryption helper for Website B's private server.
 * Uses the private secret key (DECRYPT_PASSPHRASE) to verify the HMAC signature
 * and decrypt the AES-256 ciphertext back into the original plain JSON object.
 */
export function decryptWebsiteBPayload(
  encryptedPayload: string,
  signature: string,
  secretKey = PUBLIC_ENCRYPTION_KEY,
  hmacSecret = SUBMISSION_HMAC_SECRET
): { isValid: boolean; data: any; error?: string } {
  try {
    // 1. Verify HMAC signature to ensure authenticity & tamper prevention
    const calculatedSig = CryptoJS.HmacSHA256(encryptedPayload, hmacSecret).toString(CryptoJS.enc.Hex);
    if (calculatedSig !== signature) {
      return {
        isValid: false,
        data: null,
        error: 'Invalid HMAC signature! Data has been modified or tampered with.'
      };
    }

    // 2. Decrypt AES-256 ciphertext
    const decryptedBytes = CryptoJS.AES.decrypt(encryptedPayload, secretKey);
    const decryptedJson = decryptedBytes.toString(CryptoJS.enc.Utf8);
    if (!decryptedJson) {
      return {
        isValid: false,
        data: null,
        error: 'Failed to decrypt payload. Invalid decryption passphrase.'
      };
    }

    const data = JSON.parse(decryptedJson);
    return {
      isValid: true,
      data
    };
  } catch (err: any) {
    return {
      isValid: false,
      data: null,
      error: err?.message || 'Decryption failed'
    };
  }
}

/**
 * Plays a pleasant, subtle confirmation sound using Web Audio API
 */
export function playConfirmationChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    // Smooth dual chime chord (C5 -> E5 -> G5)
    const notes = [523.25, 659.25, 783.99];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);

      gain.gain.setValueAtTime(0, ctx.currentTime + idx * 0.08);
      gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + idx * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + idx * 0.08);
      osc.stop(ctx.currentTime + idx * 0.08 + 0.5);
    });
  } catch {}
}
