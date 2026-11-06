# YouPeak

Monorepo for the YouPeak video rewards and creator platform. Each deployable has its own folder and its own Vercel project.

## Projects

| Folder | What it is | Deploy as | Production domain |
|---|---|---|---|
| `Youpeak_Landing_Page/` | Public marketing and policy site (Vite + React) | Vercel project, Root Directory `Youpeak_Landing_Page` | `youpeak.org` |
| `./` (repo root) + `Admin_Panel/`, `api/`, `functions/` | Admin panel (CRA) and the Express API | Vercel project, Root Directory `./` | `admin.youpeak.app`, `api.youpeak.app` |
| `Youpeak_Flutter/` | Consumer app (mobile + web) | Built with `scripts/build-consumer-web.ps1`, deployed to the `youpeak-web` project | `youpeak.app` |

Each Vercel project has one root. Do not point a project at the repo root unless it is the admin/API project.

## Folder map

- `Admin_Panel/frontend/` - admin panel source.
- `functions/backend/` - the Express API. `functions/` is the Firebase Functions wrapper.
- `api/index.js` - Vercel serverless entry point. It loads `functions/backend`.
- `Youpeak_Flutter/` - consumer app source.
- `Youpeak_Landing_Page/` - landing site source.
- `DB/` - seed and import data.
- `local-dev/` - local emulator stack for development.
- `tests/` - backend and integration tests.
- `scripts/` - build and deploy helpers.
- `worker/` - fingerprint worker (runs outside Vercel).
- `docs/` - design notes and audit reports. See `docs/README.md`.

## Getting started

Copy `.env.example` to `.env` and fill in the values. Never commit `.env` files or `serviceAccountKey.json`.

```bash
# Backend and admin build (repo root)
npm ci
npm run build          # builds the admin panel into dist/
npm start              # runs functions/backend/server.js
npm test               # backend tests

# Admin panel development
cd Admin_Panel/frontend && npm ci && npm start

# Landing page
cd Youpeak_Landing_Page && npm ci
npm run dev            # local preview
npm run build          # production build + prerender
npm run verify:seo     # SEO checks against dist/

# Local emulator stack (Firebase emulators + API + admin)
node local-dev/start.js
```

## Deploying

Deploy the landing page and the admin/API separately:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/deploy-vercel.ps1 -Target landing -Prod
powershell -ExecutionPolicy Bypass -File scripts/deploy-vercel.ps1 -Target api -Prod
```

The script links each folder to its own Vercel project and refuses to send the landing page to the admin project. Add `-DryRun` to print the commands without deploying.

The consumer app is built with `scripts/build-consumer-web.ps1` and `scripts/build-consumer-apk.ps1`.

## Conventions

- Keep deploy root folder names stable. Vercel Root Directory settings and `api/index.js` depend on them.
- Generated output (`build/`, `dist/`, `node_modules/`, `.vercel/`, logs) stays out of git. See `.gitignore`.
- Secrets live only in local `.env` files and in Vercel environment variables.
