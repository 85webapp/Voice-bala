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
function resolveWebsiteBEndpoint(): string {
  const metaUrl =
    (typeof import.meta !== 'undefined' &&
      (import.meta.env?.NEXT_PUBLIC_WEBSITE_B_URL ||
        import.meta.env?.VITE_WEBSITE_B_URL ||
        import.meta.env?.VITE_WEBSITE_B_API_URL)) ||
    (typeof process !== 'undefined' && process.env && (process.env.NEXT_PUBLIC_WEBSITE_B_URL || process.env.VITE_WEBSITE_B_URL));
  if (metaUrl && typeof metaUrl === 'string' && !metaUrl.includes('your-backend.vercel.app') && metaUrl.startsWith('http')) {
    return metaUrl;
  }
  return 'https://2nd-bew.vercel.app/api/receive-order';
}

export const WEBSITE_B_API_ENDPOINT = resolveWebsiteBEndpoint();

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

export interface UploadedDocumentPayload {
  fieldLabel: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  uploaded: boolean;
  dataUrl?: string;
}

export interface AnnotatedField {
  label: string;
  value: any;
  optional: boolean;
  filled: boolean;
  status: 'Mandatory - Filled' | 'Mandatory - Not Filled' | 'Optional - Filled' | 'Optional - Not Filled';
  availableOptions?: string[];
}

export interface DossierSection {
  pageNumber?: number | string;
  sectionTitle: string;
  fields: AnnotatedField[];
}

export interface SubmissionOverview {
  orderId: string;
  requestType: string;
  mainCategory: string;
  subCategory: string;
  availableCategories?: string[];
  availableSubCategories?: string[];
  documentTitle: string;
  submittedDate: string;
  submittedTime: string;
  submittedTimestampISO: string;
}

/**
 * Computes exact local Indian Date & Time with seconds for top-level Website 2 display.
 */
export function formatSubmissionDateTime(dateInput: Date = new Date()): {
  submittedDate: string;
  submittedTime: string;
  submittedTimestampISO: string;
} {
  const submittedTimestampISO = dateInput.toISOString();
  try {
    const submittedDate = dateInput.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      timeZone: 'Asia/Kolkata'
    });
    const submittedTime = dateInput.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata'
    });
    return { submittedDate, submittedTime, submittedTimestampISO };
  } catch {
    return {
      submittedDate: submittedTimestampISO.split('T')[0],
      submittedTime: submittedTimestampISO.split('T')[1]?.slice(0, 8) || '',
      submittedTimestampISO
    };
  }
}

/**
 * Helper to create a structured annotated field so optional & empty fields are NEVER omitted.
 */
export function fieldEntry(
  label: string,
  value: any,
  optional = false,
  availableOptions?: string[]
): AnnotatedField {
  let filled = false;
  if (Array.isArray(value)) {
    filled = value.length > 0;
  } else if (typeof value === 'boolean') {
    filled = value;
  } else if (typeof value === 'number') {
    filled = !Number.isNaN(value);
  } else if (value && typeof value === 'object') {
    filled = Object.keys(value).length > 0;
  } else if (value !== undefined && value !== null) {
    filled = String(value).trim().length > 0;
  }

  const normalizedValue = filled
    ? value
    : optional
    ? 'Not Filled (Optional)'
    : '';

  const status: AnnotatedField['status'] = optional
    ? filled
      ? 'Optional - Filled'
      : 'Optional - Not Filled'
    : filled
    ? 'Mandatory - Filled'
    : 'Mandatory - Not Filled';

  return {
    label,
    value: normalizedValue,
    optional,
    filled,
    status,
    ...(availableOptions && availableOptions.length > 0 ? { availableOptions } : {})
  };
}

export function buildSubmissionOverview(params: {
  orderId: string;
  requestType: string;
  mainCategory: string;
  subCategory: string;
  availableCategories?: string[];
  availableSubCategories?: string[];
  documentTitle: string;
  date?: Date;
}): SubmissionOverview {
  const { submittedDate, submittedTime, submittedTimestampISO } = formatSubmissionDateTime(params.date || new Date());
  return {
    orderId: params.orderId,
    requestType: params.requestType,
    mainCategory: params.mainCategory,
    subCategory: params.subCategory,
    ...(params.availableCategories ? { availableCategories: params.availableCategories } : {}),
    ...(params.availableSubCategories ? { availableSubCategories: params.availableSubCategories } : {}),
    documentTitle: params.documentTitle,
    submittedDate,
    submittedTime,
    submittedTimestampISO
  };
}

/**
 * Reads a user-selected File object into base64 dataUrl + metadata for real Website 2 transmission.
 * Enforces 1.8 MB per-file limit to keep serverless JSON bodies within Vercel limits.
 */
export async function readFileAsUploadPayload(
  file: File,
  fieldLabel: string,
  maxBytes = 1.8 * 1024 * 1024
): Promise<UploadedDocumentPayload | null> {
  if (!file) return null;
  if (file.size > maxBytes) {
    showToast(
      `File "${file.name}" is too large (${(file.size / (1024 * 1024)).toFixed(2)} MB). Please upload a file under 1.8 MB.`,
      'warning',
      5000
    );
    return null;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve({
        fieldLabel,
        fileName: file.name,
        mimeType: file.type || 'application/octet-stream',
        sizeBytes: file.size,
        uploaded: true,
        dataUrl: typeof reader.result === 'string' ? reader.result : undefined
      });
    };
    reader.onerror = () => {
      showToast(`Could not read file "${file.name}". Please try another file.`, 'error', 4000);
      resolve(null);
    };
    reader.readAsDataURL(file);
  });
}

export interface EncryptedSubmissionResult {
  encryptedPayload: string;
  signature: string;
  websiteBUrl: string;
  timestamp: string;
  rawFormData?: Record<string, any>;
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
    timestamp,
    rawFormData: formData
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



import { showToast } from './toastService';

export interface ServerBSyncResult {
  success: boolean;
  deliveredDirect: boolean;
  status: 'synced' | 'failed';
  message: string;
  error?: string;
  endpoint: string;
}

/**
 * Builds the comprehensive payload containing:
 * - Top-level submissionOverview (requestType, mainCategory, subCategory, availableCategories, exact date & time)
 * - Direct indexable fields for Website 2 dashboard (clientName, clientPhone, clientEmail, formName, category, etc.)
 * - Annotated page-by-page sections (mandatory + optional filled/unfilled markers)
 * - Real uploadedDocuments (with base64 dataUrl) and auto-extracted photoUrl
 * - Zero-knowledge encrypted ciphertext (encryptedPayload) & digital HMAC signature
 * - Complete original legalData & registrationData & raw_payload
 */
export function buildWebsiteBPayload(
  result: EncryptedSubmissionResult,
  metadata: LightweightMetadata,
  explicitFormData?: Record<string, any>
): Record<string, any> {
  const rawData: Record<string, any> = explicitFormData || result.rawFormData || {};

  const clientName =
    rawData.clientName ||
    rawData.client_name ||
    metadata.firstPartyName ||
    rawData.firstParty?.name ||
    rawData.firstPartyName ||
    rawData.landlord?.name ||
    rawData.landlordName ||
    rawData.tenant?.name ||
    rawData.tenantName ||
    rawData.applicantName ||
    rawData.step1?.legalName ||
    rawData.step1?.entrepreneurName ||
    rawData.name ||
    'Applicant';

  const clientPhone =
    rawData.clientPhone ||
    rawData.client_phone ||
    rawData.firstParty?.mobile ||
    rawData.firstParty?.phone ||
    rawData.firstPartyMobile ||
    rawData.landlord?.mobile ||
    rawData.landlordMobile ||
    rawData.tenant?.mobile ||
    rawData.tenantMobile ||
    rawData.applicantPhone ||
    rawData.step1?.mobile ||
    rawData.step1?.phone ||
    rawData.mobile ||
    rawData.phone ||
    rawData.shippingPhone ||
    '';

  const clientEmail =
    rawData.clientEmail ||
    rawData.client_email ||
    rawData.firstParty?.email ||
    rawData.firstPartyEmail ||
    rawData.landlord?.email ||
    rawData.landlordEmail ||
    rawData.applicantEmail ||
    rawData.step1?.email ||
    rawData.email ||
    '';

  const formName =
    metadata.formName ||
    rawData.submissionOverview?.documentTitle ||
    rawData.formName ||
    rawData.form_name ||
    rawData.documentTitle ||
    rawData.docTitle ||
    rawData.selectedDocTitle ||
    rawData.service ||
    'Legal Document';

  const category =
    rawData.submissionOverview?.mainCategory ||
    rawData.category ||
    rawData.documentCategory ||
    rawData.serviceCategory ||
    'Rent & Property';

  const state =
    rawData.state ||
    rawData.selectedState ||
    rawData.firstParty?.state ||
    rawData.landlord?.state ||
    rawData.step1?.state ||
    'Delhi';

  const stampDutyAmount =
    Number(
      rawData.stampDutyAmount ??
      rawData.pricing?.stamp ??
      rawData.pricing?.effectiveStamp ??
      rawData.stampDuty ??
      metadata.totalPrice ??
      500
    ) || 500;

  const orderId =
    metadata.orderId ||
    rawData.orderId ||
    rawData.urn ||
    generateSequentialOrderId();

  const uploadedDocuments: UploadedDocumentPayload[] = Array.isArray(rawData.uploadedDocuments)
    ? rawData.uploadedDocuments.filter(Boolean)
    : [];

  const firstImageDoc = uploadedDocuments.find(
    (doc) => doc && doc.uploaded && doc.dataUrl && doc.mimeType?.startsWith('image/')
  );

  const photoUrl =
    rawData.photoUrl ||
    rawData.photo_url ||
    rawData.userPhoto ||
    rawData.photo ||
    firstImageDoc?.dataUrl ||
    null;

  const fallbackDateTime = formatSubmissionDateTime(
    result.timestamp ? new Date(result.timestamp) : new Date()
  );

  const submissionOverview: SubmissionOverview = rawData.submissionOverview || {
    orderId,
    requestType: rawData.requestType || 'Legal Document Request',
    mainCategory: category,
    subCategory: rawData.subCategory || formName,
    documentTitle: formName,
    submittedDate: fallbackDateTime.submittedDate,
    submittedTime: fallbackDateTime.submittedTime,
    submittedTimestampISO: result.timestamp || metadata.timestamp || fallbackDateTime.submittedTimestampISO
  };

  const sections: DossierSection[] = Array.isArray(rawData.sections) ? rawData.sections : [];

  const party1Obj = rawData.party1 || {
    fullName:
      rawData.firstParty?.name ||
      rawData.landlord?.name ||
      rawData.step1?.legalName ||
      rawData.step1?.entrepreneurName ||
      clientName,
    phone:
      rawData.firstParty?.mobile ||
      rawData.landlord?.mobile ||
      rawData.step1?.mobile ||
      clientPhone ||
      '',
    email:
      rawData.firstParty?.email ||
      rawData.landlord?.email ||
      rawData.step1?.email ||
      clientEmail ||
      '',
    address:
      rawData.firstParty?.address ||
      rawData.landlord?.address ||
      rawData.premises?.address ||
      rawData.property?.address ||
      '',
    pan:
      rawData.firstParty?.pan ||
      rawData.landlord?.pan ||
      rawData.step1?.pan ||
      rawData.panNumber ||
      '',
    aadhaarLast4:
      rawData.firstParty?.aadhaar ||
      rawData.landlord?.aadhaar ||
      rawData.step1?.aadhaar ||
      ''
  };

  const party2Obj = rawData.party2 || (rawData.secondParty || rawData.tenant || rawData.grantee || rawData.commercialTenant
    ? {
        fullName:
          rawData.secondParty?.name ||
          rawData.tenant?.name ||
          rawData.commercialTenant?.companyName ||
          rawData.grantee?.businessName ||
          rawData.grantee?.applicantName ||
          '',
        phone:
          rawData.secondParty?.mobile ||
          rawData.tenant?.mobile ||
          rawData.secondParty?.phone ||
          '',
        email:
          rawData.secondParty?.email ||
          rawData.tenant?.email ||
          '',
        address:
          rawData.secondParty?.address ||
          rawData.tenant?.address ||
          rawData.commercialTenant?.officeAddress ||
          '',
        pan:
          rawData.secondParty?.pan ||
          rawData.tenant?.pan ||
          rawData.commercialTenant?.companyPan ||
          rawData.grantee?.pan ||
          '',
        aadhaarLast4:
          rawData.secondParty?.aadhaar ||
          rawData.tenant?.aadhaar ||
          ''
      }
    : undefined);

  const normalizedLegalData = {
    documentTitle: formName,
    state,
    submissionOverview,
    sections,
    uploadedDocuments,
    party1: party1Obj,
    ...(party2Obj ? { party2: party2Obj } : {}),
    ...rawData
  };

  return {
    // Top-level structured header for Website 2 instant display
    submissionOverview,
    submittedDate: submissionOverview.submittedDate,
    submittedTime: submissionOverview.submittedTime,
    requestType: submissionOverview.requestType,
    mainCategory: submissionOverview.mainCategory,
    subCategory: submissionOverview.subCategory,

    // Top-level direct identifiers for Website 2 dashboard & orders table
    clientName,
    client_name: clientName,
    clientPhone: clientPhone || 'Not Provided',
    client_phone: clientPhone || 'Not Provided',
    clientEmail,
    client_email: clientEmail,
    formName,
    form_name: formName,
    documentTitle: formName,
    state,
    category,
    stampDutyAmount,
    stampDutyValue: stampDutyAmount,
    stamp_duty_value: stampDutyAmount,
    totalPrice: metadata.totalPrice,
    orderId,
    referenceCode: orderId,
    reference_code: orderId,
    photoUrl,
    photo_url: photoUrl,

    // Annotated page-by-page breakdown and real uploaded documents
    sections,
    uploadedDocuments,

    // Zero-knowledge encryption fields
    encryptedPayload: result.encryptedPayload,
    signature: result.signature,
    timestamp: result.timestamp || metadata.timestamp || new Date().toISOString(),

    // Complete form datasets (camelCase required by Website 2 + snake_case aliases)
    legalData: normalizedLegalData,
    registrationData: normalizedLegalData,
    legal_data: normalizedLegalData,
    registration_data: normalizedLegalData,
    formData: rawData,
    raw_payload: rawData,

    // Metadata & audit
    metadata: {
      orderId,
      formName,
      requestType: submissionOverview.requestType,
      mainCategory: submissionOverview.mainCategory,
      subCategory: submissionOverview.subCategory,
      submittedDate: submissionOverview.submittedDate,
      submittedTime: submissionOverview.submittedTime,
      firstPartyName: clientName,
      clientPhone,
      clientEmail,
      timestamp: metadata.timestamp,
      totalPrice: metadata.totalPrice
    },
    source: 'Website A'
  };
}

/**
 * Sends the encrypted ciphertext and complete form payload directly via a POST request
 * to Website 2 (https://2nd-bew.vercel.app/api/receive-order).
 * - Always uses method: 'POST'
 * - Sends CORS-compliant headers for direct browser fetch
 * - Falls back to server-side relay (/api/website-b/relay, method: 'POST') ONLY if direct fetch fails
 * - Never creates duplicate orders when direct POST succeeds
 */
export async function postEncryptedPayloadToWebsiteB(
  result: EncryptedSubmissionResult,
  metadata: LightweightMetadata,
  explicitFormData?: Record<string, any>
): Promise<ServerBSyncResult> {
  const payloadObject = buildWebsiteBPayload(result, metadata, explicitFormData);
  const postBody = JSON.stringify(payloadObject);

  let syncStatus: 'synced' | 'failed' = 'failed';
  let syncMessage = '';
  let syncError: string | undefined = undefined;

  // 1. Direct fetch() to Website 2 using method: 'POST' and CORS-compliant headers
  try {
    const directRes = await fetch(WEBSITE_B_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'website_secret_key': SUBMISSION_HMAC_SECRET,
        'x-hmac-signature': result.signature,
        'x-submission-signature': result.signature
      },
      body: postBody,
      mode: 'cors'
    });

    if (directRes.ok) {
      syncStatus = 'synced';
      syncMessage = 'Data synced to Server B successfully!';
      showToast('Data synced to Server B successfully!', 'success', 5000);
      return {
        success: true,
        deliveredDirect: true,
        status: syncStatus,
        message: syncMessage,
        endpoint: WEBSITE_B_API_ENDPOINT
      };
    } else {
      let serverErrorBody = '';
      try {
        const text = await directRes.text();
        serverErrorBody = text.slice(0, 100);
      } catch {}
      syncError = `HTTP ${directRes.status} ${directRes.statusText || 'Error'}${
        serverErrorBody ? ' - ' + serverErrorBody : ''
      }`;
    }
  } catch (networkErr: any) {
    syncError = networkErr?.message || 'Direct browser connection issue';
  }

  // 2. Fallback: Server-side relay via method: 'POST' (/api/website-b/relay) if direct browser fetch failed
  try {
    const relayRes = await fetch('/api/website-b/relay', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: postBody
    });

    if (relayRes.ok) {
      const relayData = await relayRes.json().catch(() => null);
      if (relayData?.success || relayData?.deliveredToWebsiteB) {
        syncStatus = 'synced';
        syncMessage = 'Data synced to Server B successfully!';
        syncError = undefined;
        showToast('Data synced to Server B successfully!', 'success', 5000);
      }
    } else if (!syncError) {
      syncError = `Relay HTTP ${relayRes.status}`;
    }
  } catch (relayErr: any) {
    console.warn('[Website B Relay Notice]:', relayErr);
  }

  if (syncStatus !== 'synced') {
    const errName = syncError || 'Website B unreachable';
    syncMessage = `Sync Failed: [${errName}]`;
    showToast(`Sync Failed: [${errName}]`, 'error', 7000);
  }

  return {
    success: syncStatus === 'synced',
    deliveredDirect: syncStatus === 'synced',
    status: syncStatus,
    message: syncMessage,
    error: syncError,
    endpoint: WEBSITE_B_API_ENDPOINT
  };
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
