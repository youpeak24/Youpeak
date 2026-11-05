# Google Sign-In on the Flutter web app — Report

| | |
|---|---|
| Date | 2026-10-04 → 2026-10-05 |
| Project | `E:\Legendary One\youpeak\source` (working tree; nothing committed, pushed or deployed) |
| Deployed app checked | https://youpeak-web.vercel.app (bundle last modified 2026-10-04 17:36 GMT) |
| Evidence | `reports/project-audit/google-signin/` |

## 1. Confirmed root cause (deployed)

Reproduced in Chrome on https://youpeak-web.vercel.app by clicking **Continue with Google** (no credentials entered; `deployed/log-1920.txt`):

- Firebase error: **`auth/unauthorized-domain`** — *"This domain is not authorized for OAuth operations for your Firebase project."*
- Firebase SDK console warning: *"Add your domain (youpeak-web.vercel.app) to the OAuth redirect domains list in the Firebase console → Authentication → Settings."*
- The project's live config (`getProjectConfig` / `v1/projects`, both HTTP 200) lists only:
  `localhost`, `youpeak-9ff65.firebaseapp.com`, `youpeak-9ff65.web.app`.
  **`youpeak-web.vercel.app`, `youpeak.app` and `www.youpeak.app` are not authorized.**
- The Firebase handler window opened and was closed by the SDK; the app returned to "Let's you in" with only a 1-second generic "Google login failed !!" toast.

Ruled out with evidence:

| Check | Result |
|---|---|
| Vercel Deployment Protection | none — `youpeak-web.vercel.app` returns 200 to anonymous requests |
| COOP / CSP headers that break popups | none on the app or on `youpeak-9ff65.firebaseapp.com/__/auth/handler` |
| `authDomain` | `youpeak-9ff65.firebaseapp.com` (in the authorized list; handler reachable, 200) |
| Popup / user gesture | the handler window opened from the tap — not a popup-blocker problem |
| API URL / CORS | bundle targets `https://api.youpeak.app/`; preflight from `https://youpeak-web.vercel.app` → 204, origin echoed, `content-type,key` allowed |
| Secrets in the browser | live `client/setting` response (156 keys) contains no service-account or secret field names; the web bundle contains no PEM key or key values (only JSON field names of an unused settings model) |

Domain notes (no DNS changed): `youpeak.app` → 308 → `www.youpeak.app`, which currently serves the **admin React build**, not the Flutter app.

## 2. Backend / session compatibility (live Sep 28 vs local Phase 2)

- Live backend = commit `894b2f4e` (2026-09-28). Its `POST /client/user/login` already **requires a verified Firebase ID token** for Google (`loginType 2`), takes the email from the token, and mints a Firebase custom token for the app session. The app (`SignUpApi`) already sends the current Firebase ID token — compatible.
- `GET /client/user/profile`: live requires only the app key; local Phase 2 requires the app session token. The app sends both → works against either.
- The currently deployed web bundle already contains the Oct 3 working-tree fixes (including `AppSession` recording the user id after the custom-token sign-in), so **authorizing the domain alone should make Google sign-in work on the current deployment**, provided the live backend's service account can still mint custom tokens (see §6.4).

## 3. Code changes (Flutter app)

| File | Change | Why |
|---|---|---|
| `lib/features/auth/service/google_login.dart` | returns a typed outcome (`signedIn` / `cancelled` / `failed(code)`) instead of swallowing every error into `null` | the screens could not tell a cancel from `unauthorized-domain` |
| `lib/features/auth/service/google_sign_in_flow.dart` (new) | one shared "Continue with Google" flow | replaces 5 duplicated handlers with inconsistent behaviour |
| `lib/features/auth/view/lets_you_in_view.dart`, `login_view.dart`, `sign_up_view.dart` | the 5 Google buttons call `GoogleSignInFlow.run` | — |
| `lib/core/utils/custom_toast.dart` | optional `long:` toast (5 s) | the 1 s web default made error messages unreadable |
| `lib/core/constants/app_string.dart`, `languages/language_en.dart` | new messages | — |
| `test/features/google_sign_in_flow_test.dart` (new) | 5 tests | error-code mapping, cancel, idle state |

Behaviour of the shared flow:
- **One attempt at a time** (double taps open one window).
- **Cancel** (window closed): quiet, loader closes, back on the sign-in screen (Firebase reports the close after ~9 s by design).
- **Clear errors**: unauthorized domain, popup blocked, provider disabled, network, account exists with another method; others → generic.
- **Backend refusal** (blocked, unverified, server error): signs out of Firebase and stays on the sign-in screen with the server's message. (The old Let's-you-in handler **navigated into the app anyway** after a failed backend login.)
- New user → Fill Profile; existing user with a profile → main screen.
- Loader opened in the same tap as the popup, so the browser treats the popup as user-initiated.

No backend, security-rule, password-migration, authorization, media-ownership, paywall or financial code was changed.

## 4. Verification

### 4.1 Local, end to end (isolated: Firebase Auth emulator's Google account picker, emulator Firestore, local backend `demo-youpeak-local`)
Release build with local dev defines; `local-emulator/google-e2e-1920.json`, `google-e2e-390.json`:

| Check | 1920 px | 390 px |
|---|---|---|
| Two quick taps open a single Google window | ✅ | ✅ |
| Closing the window returns to sign-in, no stuck loader, no error toast | ✅ (8.7 s) | ✅ (8.7 s) |
| New Google account chosen in the picker | ✅ | ✅ |
| Backend verified the Google ID token and created the user | ✅ | ✅ |
| New user → Fill Profile | ✅ | ✅ |
| Session persists across a page refresh | ✅ | ✅ |
| Logout returns to sign-in | ✅ | ✅ |
| Returning user → main screen, no duplicate account | ✅ | ✅ |

The emulator does not enforce authorized domains, so that path was verified separately:

### 4.2 New production build against the real Firebase config (read-only)
The new production build served from `http://127.0.0.1:5087` (not an authorized domain): real Firebase returned **`unauthorized-domain`** and the app showed *"Google sign-in is not available on this website address yet. Please use phone or password sign-in for now."* (`prod-build/prod-check.json`, screenshot). No account signed in.

### 4.3 Not verified
- A real Google account sign-in on the deployed site (requires the Firebase setting in §5 and your Google account).
- That the Google provider is enabled in the console and the live backend can mint custom tokens (not visible from outside; §5, §6.4).

### 4.4 Tests and builds
| | Result |
|---|---|
| `flutter test --no-pub` | **96/96** pass (91 previous + 5 new) |
| Dart analyzer | 0 errors, 84 warnings, 813 info (previous: 0 / 85 / 814) |
| `flutter build web --release` (production config) | pass; no local/emulator hosts; API `https://api.youpeak.app/`; no key material |
| `npm test` (backend, unchanged) | 28/28 pass |

## 5. Required settings (owner — I have no console access)

**Firebase Console → project `youpeak-9ff65`**
1. **Authentication → Settings → Authorized domains → Add domain:** `youpeak-web.vercel.app` ← fixes the deployed app.
2. Same list, add `youpeak.app` and `www.youpeak.app` now, so the future domain move doesn't repeat this failure (adding them changes no DNS). `admin.youpeak.app` is not needed (the admin doesn't use Firebase sign-in).
3. **Authentication → Sign-in method → Google:** confirm *Enabled* and a project support email is set.

**Google Cloud Console** — no change needed while `authDomain` stays `youpeak-9ff65.firebaseapp.com`: Firebase manages the OAuth client's redirect URI `https://youpeak-9ff65.firebaseapp.com/__/auth/handler`. Only if you later switch `authDomain` to your own domain must that domain's `/__/auth/handler` be added to the OAuth client.

**Vercel** — no change: no Deployment Protection on the production URL. Preview URLs (different hostnames) will show the "not available on this website address" message unless added to Authorized domains — expected.

## 6. Remaining blockers and notes
1. Real-account sign-in on the deployed site is untested until §5.1 is done.
2. Popup-based sign-in can be blocked by in-app browsers (Instagram/Facebook webviews) and strict popup settings; the app now says so. A redirect fallback was not added: with `authDomain` on `firebaseapp.com`, redirect sign-in is unreliable in browsers that partition third-party storage.
3. **Local development only:** after a reload with a saved session, FlutterFire initialises Auth before the app can attach the emulator, so that page session talks to Google's real Auth endpoints (blocked in tests). Sign in again after logout + reload to use the emulator.
4. **Exposed Firebase private key:** treat it as compromised. The live backend needs a valid service account for `createCustomToken`. Rotate in this order to avoid an outage: create a new key → update `FIREBASE_SERVICE_ACCOUNT` in the API's Vercel env → redeploy the API → verify login → delete the old key in Google Cloud IAM. Never put it in Flutter/browser code (it is not there today).
5. `www.youpeak.app` currently serves the admin build; move only when ready (DNS untouched here).
6. Files changed outside this task since the last report: `DEPLOYMENT.md`, `youpeak/web/vercel.json`, `tests/api-liveness.test.cjs` (left untouched).

## 7. Deploying the fix safely
1. Do §5.1 (+5.2, 5.3). Wait a minute, open https://youpeak-web.vercel.app in a private window, tap **Continue with Google**, sign in with your own account — this already works with the current deployment if §2 holds.
2. Then deploy the new web build (clearer errors, duplicate-tap guard, safe failure handling) when you authorize it: `cd youpeak && flutter build web --release`, deploy `youpeak/build/web` to the `youpeak-web` Vercel project (same as the Oct 4 deployment), and repeat step 1 plus: cancel (close the window), logout, sign in again, refresh.
3. Rotate the service-account key (§6.4) as a separate change.
4. Before moving `youpeak.app` / `www.youpeak.app` to the Flutter app, confirm both are in Authorized domains.
