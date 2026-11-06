# YouPeak

Video rewards and creator platform. This repository holds every app, with each deployable in its own folder.

## Apps

| Folder | What it is | Deploy | Domain |
|---|---|---|---|
| [`landing/`](landing/) | Public marketing and policy site (Vite + React) | Vercel project `landing`, Root Directory `landing` | `youpeak.org` |
| [`admin-panel/`](admin-panel/) | Admin web panel (React) | Vercel project `admin`, Root Directory `admin-panel` | `admin.youpeak.app` |
| [`functions/`](functions/) | Backend API (Express) and Firebase Functions entry | Vercel project `api`, Root Directory `functions` | `api.youpeak.app` |
| [`flutter/`](flutter/) | Consumer app (Android, iOS, web) | Built locally with `scripts/`, uploaded to the `youpeak-web` project | `youpeak.app` |

Each app has its own dependencies, build, and `vercel.json` (where applicable). Every deployment uses the app's folder as its root.

## Other folders

- `scripts/` - build and deploy helpers, including `deploy-vercel.ps1`.
- `tools/` - local development stack (`local-dev/`), database import data (`db/`), and the fingerprint worker (`worker/`).
- `docs/` - all reports, design notes, and audit output. See [`docs/README.md`](docs/README.md).
- `archive/` - old local files kept for reference. Not used by any app. Ignored by git.
- `firebase.json`, `firestore.rules`, `firestore.indexes.json`, `storage.rules`, `.firebaserc` - Firebase project configuration.

## Local setup

Copy `.env.example` to `.env` in the app folder that needs it. Never commit `.env` files or service account keys.

```bash
# Backend
cd functions && npm ci
npm start                 # API on the local dev port
npm test                  # backend test suite (33 tests)

# Admin panel
cd admin-panel && npm ci
npm start

# Landing page
cd landing && npm ci
npm run dev               # local preview
npm run build             # production build and prerender
npm run verify:seo        # SEO checks on dist/

# Full local stack (emulators, API, admin)
node tools/local-dev/start.js
```

Flutter: `flutter/` builds with `scripts/build-consumer-web.ps1` and `scripts/build-consumer-apk.ps1`.

## Deploying to Vercel

Each Vercel project is linked to one folder. Deploy each one from the repo root:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/deploy-vercel.ps1 -Target landing -Prod
powershell -ExecutionPolicy Bypass -File scripts/deploy-vercel.ps1 -Target admin -Prod
powershell -ExecutionPolicy Bypass -File scripts/deploy-vercel.ps1 -Target api -Prod
```

The first run for a folder asks you to pick its Vercel project. The script refuses to deploy one folder to another folder's project. Add `-DryRun` to print the commands without deploying.

In the Vercel dashboard, each project's **Root Directory** must match its folder: `landing`, `admin-panel`, or `functions`.

## Conventions

- Keep folder names stable. Vercel Root Directory settings depend on them.
- Build output (`build/`, `dist/`), `node_modules/`, `.vercel/`, and logs stay out of git. See `.gitignore`.
- Secrets live only in local `.env` files and in Vercel environment variables.
