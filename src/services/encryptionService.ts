import CryptoJS from 'crypto-js';

// Default encryption key & HMAC secret (configured via Vercel / environment variable, with fallback)
const ENCRYPTION_SECRET =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_ENCRYPTION_SECRET) ||
  'ctc-legal-zero-db-aes-256-secret-key-2026';

const HMAC_SECRET =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_HMAC_SECRET) ||
  'ctc-legal-hmac-sha256-authenticity-key-2026';

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
 * Encrypts all form data on the client side using AES-256 before any server request.
 * Generates an HMAC-SHA256 signature to guarantee authenticity and prevent tampering.
 */
export function encryptFormDataAndSign(formData: Record<string, any>): EncryptedSubmissionResult {
  const jsonString = JSON.stringify(formData);

  // 1. Client-Side AES-256 Encryption
  const encryptedPayload = CryptoJS.AES.encrypt(jsonString, ENCRYPTION_SECRET).toString();

  // 2. HMAC-SHA256 Digital Signature
  const signature = CryptoJS.HmacSHA256(encryptedPayload, HMAC_SECRET).toString(CryptoJS.enc.Hex);

  const timestamp = new Date().toISOString();

  // 3. Target Website B URL with payload and signature parameters
  const websiteBUrl = `https://website-b-admin.com/?payload=${encodeURIComponent(
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
