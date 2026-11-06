# Vercel environment variables checklist

Four Vercel projects, all in the `youpeak24-1075` account. Paste each value in the matching project under **Settings → Environment Variables**, with **Production** selected, then redeploy.

**Never paste a value into this file or into git.** Copy each value from its source, shown below.

## The shared client key

`secretKey` is one value that must be identical in four places.

- **Source:** the `secretKey` variable in the old `youpeak` project (Settings → Environment Variables → reveal).
- **Paste into:** `youpeak-api` as `secretKey`, `youpeak-admin-panel` as `REACT_APP_SECRET_KEY`, `youpeak-landing` as `VITE_API_KEY`, and `youpeak-web` as `YOUPEAK_API_SECRET_KEY`.

---

## 1. `youpeak-api` (backend API)

Vercel → `youpeak-api` → Settings → Environment Variables.

| Variable | Required | What to paste | Copy from |
|---|---|---|---|
| `secretKey` | Yes | Shared client key | Old `youpeak` project |
| `JWT_SECRET` | Yes | Admin token signing secret | Old `youpeak` project |
| `NODE_ENV` | Yes | `production` | Type it |
| `FIREBASE_SERVICE_ACCOUNT` | Yes | Full service-account JSON, as one value | Firebase console → Project settings → Service accounts → Generate key |
| `FIREBASE_PROJECT_ID` | Yes | Firebase project ID | Firebase console |
| `FIREBASE_STORAGE_BUCKET` | Yes | Storage bucket name | Firebase console → Storage |
| `CLOUDFLARE_ACCOUNT_ID` | Yes | Cloudflare account ID | Cloudflare dashboard |
| `CLOUDFLARE_R2_ACCESS_KEY` | Yes | R2 access key | Cloudflare → R2 → API tokens |
| `CLOUDFLARE_R2_SECRET_KEY` | Yes | R2 secret key | Cloudflare → R2 → API tokens |
| `CLOUDFLARE_R2_BUCKET` | Yes | R2 bucket name | Cloudflare → R2 |
| `CLOUDFLARE_R2_ENDPOINT` | Yes | R2 S3 endpoint | Cloudflare → R2 |
| `CLOUDFLARE_R2_PUBLIC_DOMAIN` | Yes | Public domain for R2 files | Cloudflare → R2 → custom domain |
| `CLOUDFLARE_API_TOKEN` | Yes | Cloudflare API token (Stream) | Cloudflare → API tokens |
| `CLOUDFLARE_STREAM_CUSTOMER_CODE` | Yes | Stream customer code | Cloudflare → Stream |
| `CLOUDFLARE_STREAM_WEBHOOK_SECRET` | Yes | Stream webhook secret | Cloudflare → Stream → webhooks |
| `RAZORPAY_KEY_ID` | If paying via Razorpay | Starts with `rzp_live_` in production | Razorpay dashboard → API keys |
| `RAZORPAY_KEY_SECRET` | If paying via Razorpay | Razorpay secret | Razorpay dashboard |
| `RAZORPAY_WEBHOOK_SECRET` | If paying via Razorpay | Razorpay webhook secret | Razorpay → webhooks |
| `CRON_SECRET` | Yes | Random secret for cron jobs | Old `youpeak` project |
| `FINGERPRINT_WORKER_SECRET` | If using the worker | Worker secret | Old `youpeak` project |
| `PROMOTION_TOKEN_SECRET` | Yes | Promotion token secret | Old `youpeak` project |
| `USER_PW_SECRET` | Yes | User password secret | Old `youpeak` project |
| `ADMIN_SIGNUP_CODE` | If admin signup is used | Admin signup code | Old `youpeak` project |
| `ADMIN_JWT_EXPIRES_IN` | Optional | Admin token lifetime, e.g. `12h` | Type it |
| `ANDROID_APP_PACKAGE` | For app links | Android package name | Your app config |
| `ANDROID_CERT_SHA256` | For app links | Android signing cert SHA-256 | Your signing key |
| `IOS_APP_IDS` | For app links | iOS app IDs | Apple developer account |
| `MAX_VIDEO_BYTES` | Optional | Max upload size in bytes | Type it |

**Do not add** `ALLOW_LOCAL_DB_FALLBACK`. Do not add `SEED_ADMIN_EMAIL` or `SEED_ADMIN_PASSWORD` after first use.

---

## 2. `youpeak-admin-panel` (admin web panel)

Vercel → `youpeak-admin-panel` → Settings → Environment Variables.

| Variable | Required | What to paste | Copy from |
|---|---|---|---|
| `REACT_APP_SECRET_KEY` | Yes | Shared client key | Old `youpeak` project |
| `REACT_APP_APP_DOMAIN` | Optional | `youpeak.app` (default) | Type it |
| `REACT_APP_BASE_URL` | Leave empty | Empty uses the `/` proxy in `vercel.json` | — |

Create React App bakes these in at build time. Redeploy after changing them.

---

## 3. `youpeak-landing` (landing page)

Vercel → `youpeak-landing` → Settings → Environment Variables.

| Variable | Required | What to paste | Copy from |
|---|---|---|---|
| `VITE_API_BASE_URL` | Yes | `https://youpeak-api.vercel.app` | Type it (change later if you move to `api.youpeak.app`) |
| `VITE_API_KEY` | Yes | Shared client key | Old `youpeak` project |
| `VITE_FIREBASE_API_KEY` | Yes | Firebase web API key (public) | Firebase console → Project settings → Web app |
| `VITE_ADMIN_PANEL_URL` | Yes | `https://youpeak-admin-panel.vercel.app` | Type it |
| `GROQ_API_KEY` | For the chat assistant | Groq API key | Groq console |
| `GROQ_MODEL` | Optional | Defaults to `llama-3.3-70b-versatile` | Type it |

`VITE_` values are public (they end up in the browser). Do not put any other secret in a `VITE_` variable.

---

## 4. `youpeak-web` (Flutter web app)

Vercel → `youpeak-web` → Settings → Environment Variables.

| Variable | Required | What to paste | Copy from |
|---|---|---|---|
| `YOUPEAK_API_SECRET_KEY` | Yes | Shared client key | Old `youpeak` project |
| `YOUPEAK_API_BASE_URL` | Optional | `https://youpeak-api.vercel.app/` (default) | Type it |

The Flutter build reads these at build time, so redeploy after changing them.

---

## Checks after you paste

1. `youpeak-api`: open `https://youpeak-api.vercel.app/api/ping` and expect `status: true`. Then `/client/setting` without a key should return `401`. A `500` means a required variable is missing.
2. `youpeak-admin-panel`: sign in. A login error about the API means `REACT_APP_SECRET_KEY` doesn't match `secretKey`.
3. `youpeak-landing`: open the homepage. Check the chat assistant if you set `GROQ_API_KEY`.
4. `youpeak-web`: open the site and check that the app loads without a key error.
