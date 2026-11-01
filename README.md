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

## Gemini endpoints
- `POST /api/gemini/search` — intent matching against the fixed 28-document allowlist and restricted-service refusals.
- `POST /api/gemini/explain-page` — page summary based on visible form labels.
- `POST /api/gemini/explain-field` — one-sentence explanation for a field.
- `GET /api/health` — service and configuration status.

The server reads the key only from `process.env.GEMINI_API_KEY`. If Gemini fails, the app should surface an error or localized refusal fallback rather than inventing document matches. The microphone requires browser Web Speech API support and microphone permission. Audio playback uses browser speech-synthesis voices, so exact voice availability varies by device.

## Build and checks
- `npm run build` builds the Vite frontend.
- `npm run lint` runs TypeScript checking.

The source in this delivery passed a TypeScript transpile/syntax scan, but a full dependency-backed build, strict typecheck, and live Gemini/browser test were not completed in the packaging environment. Run the commands above in an environment with npm registry access before production deployment.
