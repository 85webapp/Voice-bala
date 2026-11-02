interface SecureSubmissionInput {
  firstPartyName: string;
  formName: string;
  totalPrice: number | null;
  details: Record<string, unknown>;
}

const encoder = new TextEncoder();

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function pemToBytes(pem: string): ArrayBuffer {
  pem = pem.replace(/\\n/g, '\n');
  const body = pem.replace(/-----BEGIN PUBLIC KEY-----|-----END PUBLIC KEY-----|\s/g, '');
  const binary = atob(body);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes.buffer;
}

async function encryptDetails(details: Record<string, unknown>, publicKeyPem: string): Promise<string> {
  if (!publicKeyPem) throw new Error('Form encryption is not configured.');

  const aesKey = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt']);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plaintext = encoder.encode(JSON.stringify(details));
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, aesKey, plaintext);
  const rawAesKey = await crypto.subtle.exportKey('raw', aesKey);
  const recipientKey = await crypto.subtle.importKey(
    'spki',
    pemToBytes(publicKeyPem),
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    false,
    ['encrypt']
  );
  const wrappedKey = await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, recipientKey, rawAesKey);

  const envelope = JSON.stringify({
    version: 1,
    algorithm: 'RSA-OAEP-256+A256GCM',
    key: toBase64Url(new Uint8Array(wrappedKey)),
    iv: toBase64Url(iv),
    ciphertext: toBase64Url(new Uint8Array(ciphertext))
  });
  return toBase64Url(encoder.encode(envelope));
}

export async function submitEncryptedForm(input: SecureSubmissionInput): Promise<void> {
  if (!input.firstPartyName.trim() || !input.formName.trim()) {
    throw new Error('Please provide the applicant name and form name before submitting.');
  }
  if (!(input.totalPrice === null || (Number.isFinite(input.totalPrice) && input.totalPrice >= 0))) {
    throw new Error('The displayed total price is invalid.');
  }

  const payload = await encryptDetails(input.details, import.meta.env.VITE_WEBSITE_B_PUBLIC_KEY);
  const accountPayload = await encryptDetails(input.details, import.meta.env.VITE_ACCOUNT_DATA_PUBLIC_KEY);
  const response = await fetch('/api/submissions', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      firstPartyName: input.firstPartyName.trim(),
      formName: input.formName.trim(),
      totalPrice: input.totalPrice,
      accountPayload,
      payload
    })
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok || typeof result.redirectUrl !== 'string') {
    throw new Error(typeof result.error === 'string' ? result.error : 'Could not securely submit this form.');
  }

  const redirectUrl = new URL(result.redirectUrl);
  if (redirectUrl.origin !== 'https://website-b-admin.com') {
    throw new Error('The secure submission returned an unexpected destination.');
  }
  window.location.replace(redirectUrl.toString());
}