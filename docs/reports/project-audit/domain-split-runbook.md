# YouPeak domain split — local preparation, 2026-10-03

## Target

| URL / data | Destination |
|---|---|
| youpeak.app and www.youpeak.app | Flutter consumer web, separate static Vercel project (suggested name: youpeak-web) |
| admin.youpeak.app | Existing youpeak Vercel project, React admin |
| api.youpeak.app | Same existing Vercel project, backend function |
| Video and Bite bytes, playback | Cloudflare R2; Cloudflare Stream when its processing path is enabled and verified |
| Records, accounts, balances, video metadata | Firebase Firestore / Auth |
| Images, thumbnails, other uploaded non-video assets | Firebase Storage |

Sharing one Vercel project for admin/API preserves the current same-origin admin API behavior. The consumer build uses https://api.youpeak.app/. The API-host rewrite sends requests to the backend instead of the React SPA. API CORS currently permits the consumer origin. Production CORS hardening is separate work.

## Local changes

- Root vercel.json: host-based API routing and the missing /internal worker callback route.
- youpeak/web/vercel.json: static project configuration; app-link verification endpoints forward to the API; Flutter and referral paths fall back to index.html. /share stays on Flutter.
- api/index.js: GET /api/ping (or /ping) returns liveness without Firebase initialisation or writes. dependenciesChecked=false explicitly means no database, authentication or media check was performed.
- scripts/build-consumer-web.ps1: reproducible release build. Define the client API key locally through YOUPEAK_API_SECRET_KEY. Temporary define JSON lives in ignored .dart_tool and is removed afterward. Only the client key is included; never supply a Firebase JSON, private key, R2 secret, or server JWT secret.

The Flutter API default was already api.youpeak.app. No app business rules or existing remediation were replaced.

## Order for external setup

1. On the existing youpeak Vercel project, open Settings > Domains. Add admin.youpeak.app and api.youpeak.app. Use the exact DNS records Vercel supplies in Cloudflare, initially DNS-only. Confirm valid configuration and HTTPS. Keep apex/www attached to their current project while validating the consumer preview.
2. Prepare a staging API with isolated Firebase credentials and matching client key. Complete Phase 2 QA before deploying the changed backend and matching app to production. A Ready deployment and /api/ping prove neither database access nor complete release readiness.
3. Build Flutter against that staging API. In a local PowerShell session set YOUPEAK_API_SECRET_KEY to the staging backend secretKey, then run:

   ```powershell
   .\scripts\build-consumer-web.ps1 -ApiBaseUrl 'https://<staging-api-host>/'
   ```

   The command outputs youpeak/build/web. Deploy this directory as a separate static Vercel project; framework Other, no install/build command. When using CLI, deploy this directory with vercel, not --prebuilt (which expects .vercel/output). Do not point a Git-connected Flutter project at an ignored build directory and expect Vercel to generate Flutter automatically.
4. Validate consumer preview: onboarding, login/token refresh, desktop and phone layouts, deep/referral links, protected routes, upload ownership, Cloudflare video/Bite upload and seekable playback, Firebase asset upload. Register the exact preview/custom hosts in Firebase Authentication Authorized Domains and the deployed origins in R2 CORS. R2 public delivery needs a configured custom domain; its S3 API endpoint is not unsigned playback. Verify any existing external media migration separately.
5. After staging passes and release blockers are resolved, build the consumer with the production API and matching production client key. Deploy the backend plus matching client together to accommodate the newly authenticated routes. Set REACT_APP_BASE_URL=https://api.youpeak.app/ if selecting cross-origin admin calls; leaving it unset retains same-origin admin/API calls on the combined project. REACT_APP_SECRET_KEY must match backend secretKey.
6. Attach youpeak.app and www.youpeak.app to the validated consumer project. If Vercel asks to move them from the existing project, confirm only at this final cutover. Keep admin/API aliases attached to the existing project. Use the DNS targets Vercel supplies; do not guess CNAME/A values.
7. Recheck all hosts, /api/ping, real authentication and media delivery. Consumer /.well-known files must return JSON, not Flutter index.html. Configure callbacks on api.youpeak.app for Stream, payments and workers as applicable. Ensure api host requests never render the admin SPA.

## Pending security and account configuration

Read-only account inspection found old Firebase and R2 credentials still active. The owner manually confirmed newer key IDs are saved in Vercel; that does not establish which snapshot an existing deployment uses. A Firebase private key was subsequently pasted into chat. Treat that key as exposed and rotate it before production release; the owner asked to defer replacement for now. No credential revocation was performed.

No Vercel project creation, DNS changes, domain transfer, commit, push, or deployment was performed in this local preparation. The existing live site remains on its current deployment.

Local verification: npm test passed 28/28, including media provider/fallback checks and two API liveness/dispatch checks. Both Vercel configs parse as JSON. The PowerShell build script parses and refuses a missing client key or service-account JSON before starting Flutter. No new Flutter release artifact was built in this preparation; its matching client key is still required locally. Vercel routing, DNS, HTTPS and real provider behavior remain external checks.

References: [Vercel rewrites](https://vercel.com/docs/routing/rewrites), [environment-variable deployment behavior](https://vercel.com/docs/environment-variables/managing-environment-variables), [CLI deployment](https://vercel.com/docs/cli/deploy).
