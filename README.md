# Document India — Gemini voice integration

## Security first
A Gemini API key was shared in chat. Treat that key as exposed: revoke it in Google AI Studio / Google Cloud and create a replacement before deployment. Do not reuse an exposed key. This archive intentionally does not contain API credentials.

## Requirements
- Node.js 20.19+ (Node 22 recommended)
- A new Google Gemini API key

## Run locally
1. Run `npm install`.
2. Copy `.env.example` to `.env`.
3. Open `.env` and replace `replace_with_your_new_server_side_key` with your newly generated key. Do not include quotes unless required by your environment.
4. Run `npm run dev`.
5. Check `http://localhost:3000/api/health`; it reports whether the server sees a Gemini key.

## Deploy
Add `GEMINI_API_KEY` and optionally `GEMINI_MODEL=gemini-2.5-flash` to your hosting provider's server-side Environment Variables / Secrets settings, then redeploy. Do not set `VITE_GEMINI_API_KEY` and do not put the key in React components, HTML, or any client-side bundle.

## Secure form submissions
The browser encrypts form details with AES-256-GCM and wraps the one-time AES key with Website B's RSA-OAEP/SHA-256 public key before making a request. Set `VITE_WEBSITE_B_PUBLIC_KEY` to Website B's PEM-encoded `PUBLIC KEY`; it is public by design and is embedded in the frontend build. Website B must use the matching private key and the envelope format `version`, `algorithm`, `key`, `iv`, and `ciphertext` (base64url encoded).

Set `SUPABASE_CONNECTION_STRING`, `AUTH_SESSION_SECRET`, `SUBMISSION_HMAC_SECRET`, and `ACCOUNT_DATA_PRIVATE_KEY` as server-only Vercel environment variables. The session and HMAC secrets must each contain at least 32 bytes of high-entropy random data. `VITE_ACCOUNT_DATA_PUBLIC_KEY` is the matching SPKI public key; the browser encrypts each form before the API request, and the private key stays server-side. Website B must use the HMAC secret to verify lowercase-hex HMAC-SHA-256 signatures over the exact `payload` query value. Apply both SQL migrations in order before deployment. Account passwords are stored as salted scrypt hashes. Supabase stores account-owned form details only as an encrypted envelope; the API decrypts them only after filtering by the signed HttpOnly session's user ID. Metadata columns retain the applicant name, form name, server timestamp, and displayed total price; callback forms without a price store `NULL`.

Registration and login use a unique 10-digit mobile number and password. Registration also collects the user's name and password confirmation. `GET /api/auth/me` restores the session, `POST /api/auth/logout` clears it, and `GET /api/submissions` returns only records for the authenticated account. The frontend does not keep profile/order data in localStorage.

Vercel uses `vercel.json` and `api/index.ts` to route API requests through the existing Express app. Set both public-key variables for the Vite build and all private values as server-side variables, then redeploy. The HMAC establishes that this service signed the submitted ciphertext after accepting it; it does not prove a submitter's identity, and Website B should validate/decrypt the envelope before processing it. The redirect includes ciphertext in the URL, so Website B should avoid logging full query strings and must keep a `no-referrer` policy.

The redirect is limited to 7,500 characters to avoid browser/proxy URL limits. Oversized form submissions fail closed and are not written to Supabase.

## Gemini endpoints
- `POST /api/gemini/search` — intent matching against the fixed 28-document allowlist and restricted-service refusals.
- `POST /api/gemini/explain-page` — page summary based on visible form labels.
- `POST /api/gemini/explain-field` — one-sentence explanation for a field.
- `GET /api/health` — service and configuration status.
- `POST /api/auth/register` and `POST /api/auth/login` — create accounts and establish an HttpOnly session.
- `GET /api/auth/me` and `POST /api/auth/logout` — restore and clear the account session.
- `GET /api/submissions` — return the signed-in user's saved forms only.
- `POST /api/submissions` — stores account-owned form details, then returns a signed Website B redirect.

The server reads the key only from `process.env.GEMINI_API_KEY`. If Gemini fails, the app should surface an error or localized refusal fallback rather than inventing document matches. The microphone requires browser Web Speech API support and microphone permission. Audio playback uses browser speech-synthesis voices, so exact voice availability varies by device.

## Build and checks
- `npm run build` builds the Vite frontend.
- `npm run lint` runs TypeScript checking.

The form redirect includes ciphertext in the URL, so Website B should avoid logging full query strings and must keep a `no-referrer` policy. A live Supabase/authentication round trip requires the deployment environment variables and the SQL migration to be configured.
