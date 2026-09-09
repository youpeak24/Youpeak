# YouPeak — Deployment Guide

## Architecture

| Layer | Platform | What runs there |
|---|---|---|
| Web (admin + agency dashboard) + REST API | **Vercel** | `admin/frontend` static build + `api/index.js` serverless function (wraps `functions/backend`) |
| Database, Auth (OTP), Push (FCM) | **Firebase** (`youpeak-9ff65`) | Firestore `settings.rules` + `firestore.indexes.json`; no Firebase Hosting, no Cloud Functions |
| Video & Shorts storage + adaptive streaming | **Cloudflare** | R2 bucket `youpeak-videos` (raw) + Cloudflare **Stream** (transcode → HLS → delivery) |
| Mobile app | Play Store / App Store | Flutter app in `youpeak/`, points at the Vercel API domain |

All other data (users, videos metadata, wallet, histories, withdrawals, …) lives in **Firestore**.

---

## 1. Rotate every previously-committed secret  ⚠️ REQUIRED

These were in git history and must be considered public. Rotate all of them **before** go-live:

| Secret | Where to rotate |
|---|---|
| Firebase Admin service account | Firebase Console → Project Settings → Service Accounts → *Generate new private key*, then disable the old key `f656fa51…` |
| Cloudflare R2 access key / secret (`cdb9bca4…` / `9d2946e0…`) | Cloudflare Dashboard → R2 → Manage R2 API Tokens → roll |
| MongoDB Atlas connection string | Atlas → Database Access → rotate the user password (or drop the cluster — Mongo is no longer used) |
| `secretKey` (`0LF8b…`) | Pick a new random 32+ char string. Update: Vercel env, the app build (`--dart-define`), admin web env |
| `JWT_SECRET` (`5BF2AE1515EA6`) | New random 32+ char string → Vercel env only |
| Super-admin password (`youpeak24@gmail.com` / `12345678`) | Log in once, then Admin Panel → Profile → change password |

## 2. Set environment variables in Vercel

Project → Settings → Environment Variables (Production). See `.env.example` for the full list. Minimum:

```
secretKey=<new random string>
JWT_SECRET=<new random string>
FIREBASE_SERVICE_ACCOUNT=<the new service-account JSON, one line>
FIREBASE_PROJECT_ID=youpeak-9ff65
CLOUDFLARE_ACCOUNT_ID=<...>
CLOUDFLARE_API_TOKEN=<Stream + R2 token>
CLOUDFLARE_R2_ACCESS_KEY=<new>
CLOUDFLARE_R2_SECRET_KEY=<new>
CLOUDFLARE_R2_BUCKET=youpeak-videos
CLOUDFLARE_R2_PUBLIC_DOMAIN=<r2.dev or custom domain>
CLOUDFLARE_STREAM_CUSTOMER_CODE=<from Stream dashboard>
NODE_ENV=production
REACT_APP_SECRET_KEY=<same value as secretKey>   # build-time, for admin/frontend
```

One-time only (remove after first login):
```
SEED_ADMIN_EMAIL=you@example.com
SEED_ADMIN_PASSWORD=<a strong password>
```

## 3. Deploy Firestore rules

```bash
firebase deploy --only firestore:rules,firestore:indexes,storage
```

## 4. Deploy to Vercel

```bash
vercel --prod
```
Build command and routing are in `vercel.json`. Verify after deploy:
```
GET  https://<domain>/api/ping           -> {"status":true,...}
GET  https://<domain>/client/setting      (with `key` header) -> settings, NO secret fields
POST https://<domain>/admin/login         -> token
```

## 5. Build the mobile app against production

```bash
cd youpeak
flutter build apk --release \
  --dart-define=API_BASE_URL=https://<domain>/ \
  --dart-define=API_SECRET_KEY=<secretKey value>
```

## 6. Cloudflare Stream wiring (video pipeline)

Video upload currently stores raw MP4 in R2. To get adaptive HLS + "stream from Cloudflare":
1. Enable **Cloudflare Stream** on the account.
2. Backend upload handler should call `cloudflareStorage.createStreamDirectUpload()` and store the returned `uid` + `streamPlaybackUrl` (`https://customer-<code>.cloudflarestream.com/<uid>/manifest/video.m3u8`) on the video document.
3. App plays the `streamPlaybackUrl` HLS URL directly (no backend proxy).

> This last step is **not yet wired** — see the "video pipeline" task.

---

## Known follow-ups (not blocking a soft launch)

- Client auth: users are still identified by a `userId` in the request body + shared key. Needs real per-user tokens (verify Firebase OTP → issue JWT).
- User passwords use reversible `Cryptr("myTotallySecretKey")` — migrate to bcrypt.
- Firestore query layer (`mongooseShim`) is equality-only, no pagination — rewrite the ~25 controllers using `$gte/$in/$or/$regex`.
- Feature engines from the spec docs + strategy call: ad-cap enforcement, tier caps, revenue split (10/10/80 + District Partner), 2-stage referral, ₹2,100 onboarding + payment gateway, copyright fingerprinting, content moderation, KYC, anti-fraud, Peak Boost.
- Delete the dead backend copies: `admin/backend/`, `admin/frontend/backend/`, and `metube/`.
