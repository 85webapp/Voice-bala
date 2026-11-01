# Document India upgrade audit

## Changes in this delivery
- Aligned `esbuild` with Vite 8's `^0.27 || ^0.28` peer range and regenerated `bun.lock`.
- Fixed two wizard page-explanation calls to send the numeric page number expected by the shared API helper.
- Prevented stale Gemini search responses from replacing current results and passed the newly selected audio language to reruns.
- Kept the search callback stable so voice recognition is not stopped and recreated on every transcript update.
- Added an explicit JSON 404 for unknown `/api` routes instead of returning the SPA HTML fallback.
- Lazy-loaded the four large document wizard views, reducing the entry JS bundle from 622 kB to about 337 kB.
- Removed settings controls and portal/record-management affordances that had no working behavior.
- Updated the Vite alias to use `import.meta.dirname`, removing the config-loader warning.
- Removed legacy hardcoded page/field narration maps; wizard summaries and field explanations call the Gemini-backed API.
- Removed the random fake search text used when Web Speech Recognition is unsupported. The UI now explains that the browser does not support voice input.
- Speech search now sends a query to Gemini only after a final recognition result, not every interim transcript.
- Added visible AI-search error feedback instead of silently leaving stale results.
- Scoped visible field-label collection to the active wizard and added best-effort resolution of real field labels for speaker buttons.
- Added request size/language validation, bounded field/context input, safe allowlist filtering for document IDs, localized refusal messages, and `/api/health`.
- Fixed false-positive refusal matching for ordinary words such as “first” (FIR matching) and common uses of “will”; narrowed POA matching to whole-word/explicit terms.
- Removed the disallowed document from project inventories and reference matrix.
- Ensured `npm start` uses `tsx` and included `tsx` as a production dependency.

## Static checks performed
- `npm install --no-package-lock` succeeded and reported zero vulnerabilities across 183 installed packages.
- `npm run lint` passed (`tsc --noEmit`).
- `npm run build` passed without Vite config or large-chunk warnings; initial JS is about 337 kB (99 kB gzip).
- Bun frozen lockfile validation passed; Vite and `tsx` resolve `esbuild@0.28.2`.
- Confirmed 28 unique frontend document IDs, 28 category entries, and no missing or unknown category titles.
- Smoke-tested production routes: `/api/health` returns JSON 200, unknown `/api` paths return JSON 404, and `/` serves the SPA.
- Smoke-tested development API validation: empty search returns 400, while explanation endpoints without a Gemini key return 503 JSON.
- Confirmed the frontend document list and backend Gemini allowlist each contain 28 documents; no disallowed document references were found in source/reference files.

## Remaining readiness limits
- No automated unit or browser test suite is configured; no visual browser/end-to-end test was run.
- Live Gemini calls were not tested because no `GEMINI_API_KEY` is configured. The implemented API routes correctly report unavailable configuration.
- Authentication, orders, physical delivery, payments, and admin/record management are currently client-side/demo flows; orders and profile data are stored in browser `localStorage`, not a durable backend.
- Gemini endpoints have no authentication or rate limiting. Add deployment-appropriate abuse controls before exposing the paid API publicly.
- Marketing metadata refers to government registration and DigiLocker e-sign services, but no such integration is implemented in this app.

Treat the app as a build-verified prototype, not a production-ready legal-service platform, until the missing integrations and operational controls are implemented and tested.
