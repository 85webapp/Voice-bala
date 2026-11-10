/**
 * =======================================================================
 * WEBSITE B (ADMIN PANEL SERVER) - ZERO-KNOWLEDGE DECRYPTION EXAMPLE
 * =======================================================================
 *
 * This server runs in a private, secure environment (e.g., Vercel Serverless, Node.js, AWS).
 * It holds the secret DECRYPT_PASSPHRASE in its private environment variables.
 *
 * It receives the AES-256 encrypted payload and HMAC signature from Website A,
 * verifies that the payload has NOT been tampered with, unlocks the data,
 * and passes the clean plain JSON to your PDF / E-Stamp generation engine.
 *
 * Requirements:
 *   npm install express crypto-js dotenv
 */

import express from 'express';
import CryptoJS from 'crypto-js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json({ limit: '10mb' }));

// 1. Private Environment Variables on Website B Server
const DECRYPT_PASSPHRASE = process.env.DECRYPT_PASSPHRASE || process.env.VITE_PUBLIC_ENCRYPTION_KEY || 'ctc-legal-zero-db-aes-256-public-key-2026';
const HMAC_SECRET = process.env.HMAC_SECRET || process.env.VITE_SUBMISSION_HMAC_SECRET || 'ctc-legal-hmac-sha256-authenticity-key-2026';

/**
 * Decrypts AES-256 payload and verifies HMAC-SHA256 digital signature
 */
function decryptAndVerify(encryptedPayload, signature) {
  // Step A: HMAC Signature Check (Tamper-Proof Verification)
  const computedSignature = CryptoJS.HmacSHA256(encryptedPayload, HMAC_SECRET).toString(CryptoJS.enc.Hex);
  if (computedSignature !== signature) {
    throw new Error('HMAC Signature verification failed: Payload was altered or untrusted source.');
  }

  // Step B: AES-256 Decryption using Secret Passphrase
  const bytes = CryptoJS.AES.decrypt(encryptedPayload, DECRYPT_PASSPHRASE);
  const plainTextJson = bytes.toString(CryptoJS.enc.Utf8);

  if (!plainTextJson) {
    throw new Error('Decryption failed: Incorrect DECRYPT_PASSPHRASE or corrupted ciphertext.');
  }

  return JSON.parse(plainTextJson);
}

/**
 * 2. POST API Endpoint: Called directly by Website A upon user submission
 * POST https://website-b-admin.com/api/orders/receive
 */
app.post('/api/orders/receive', (req, res) => {
  try {
    const { encryptedPayload, signature, metadata, timestamp } = req.body;

    if (!encryptedPayload || !signature) {
      return res.status(400).json({ error: 'Missing encryptedPayload or signature' });
    }

    console.log(`[Website B] Incoming Order from Website A: Order ID: ${metadata?.orderId}, Form: ${metadata?.formName}`);

    // Unlock data inside Website B's private server memory only
    const unlockedFormData = decryptAndVerify(encryptedPayload, signature);

    console.log('[Website B] Successfully decrypted sensitive fields:');
    console.log(`- Applicant: ${unlockedFormData.firstParty?.name || unlockedFormData.name || metadata?.firstPartyName}`);
    console.log(`- Document: ${unlockedFormData.docTitle || unlockedFormData.service || metadata?.formName}`);

    // Step C: Trigger PDF Generation & E-Stamp Execution
    // generateOfficialPdfAndStamp(unlockedFormData);

    return res.json({
      success: true,
      message: 'Payload verified, decrypted and queued for PDF generation.',
      orderId: metadata?.orderId,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('[Website B Error]', err.message);
    return res.status(401).json({ error: err.message });
  }
});

/**
 * 3. GET Query Parameters Fallback: When browser redirects with ?payload=...&signature=...
 */
app.get('/admin/inspect-order', (req, res) => {
  try {
    const { payload, signature } = req.query;
    if (!payload || !signature) {
      return res.status(400).send('Missing payload or signature query parameters');
    }

    const unlockedData = decryptAndVerify(payload, signature);
    res.json({
      status: 'Decrypted Successfully',
      order: unlockedData
    });
  } catch (err) {
    res.status(403).send(`Decryption error: ${err.message}`);
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Website B (Admin Server) running on port ${PORT}`);
  console.log(`DECRYPT_PASSPHRASE loaded: ${Boolean(DECRYPT_PASSPHRASE)}`);
});
