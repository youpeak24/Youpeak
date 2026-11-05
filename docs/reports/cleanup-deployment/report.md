# Cleanup and deployment — 5 October 2026

## Cleanup scope

Removed five confirmed unused or generated files:

- `admin/frontend/src/assets/images/MetubeLogo.png`
- `admin/frontend/src/assets/images/logo2.svg`
- `admin/frontend/public/MetubeLogo.png`
- `temp_test_video.mp4`
- Root `firestore-debug.log` (generated diagnostic output).

No active application references to the three duplicate logo files were found.
The branding generator was updated so it no longer recreates them. Active
`logo.svg`, `YouPeakLogo.png`, Flutter icons, canonical artwork, database import
files, existing reports, and unrelated work were preserved.

Removed originals are backed up in `removed-files-2eb31c0685554d0ebe9916d73f767f8c.zip`.
`removed-files.json` contains original paths and SHA-256 hashes. The emulator can
regenerate its log; this is not an application dependency.

Added `.vercelignore` to keep the consumer source, audit files, fixtures, database
dumps, local environment files, signing files, and service-account files out of
the root admin/API deployment. Root-only exclusions are anchored so required
admin images/CSS and public `robots.txt` remain included.

This is conservative cleanup of proven candidates, not a claim that every
unreachable file in the repository has been identified.

## Verification

- Backend unit tests: 28/28 passed.
- Firebase demo-project emulator regression suites: 116/116 passed, 10 suites.
- Flutter tests: 107/107 passed.
- Local admin production build: passed with CI enabled.
- Fresh consumer web release build: passed, 114.4 seconds.
- Admin/API preview: remote build passed; `/api/ping` returns liveness JSON and
  unauthenticated `/client/setting` returns HTTP 401 JSON.
- Consumer preview: remote build passed; HTML serves Flutter bootstrap and
  updated wordmark returns HTTP 200 as an image.

The root preview initially failed because an unanchored upload exclusion omitted
admin assets; that exclusion was corrected. A consumer attempt initially inherited
root function configuration; explicit consumer `--local-config` corrected it.

Production settings remain on Vercel. Automatic approval review rejected a bulk
production environment export. A narrower request was approved: only the public
app client `secretKey` was retrieved into memory for compilation; no Firebase,
Cloudflare, JWT, or cron credentials were decrypted or saved by that operation.
The previously existing local client key was rejected by the live API, so it was
not used for the release build. Temporary compiler defines were removed by the
build helper. No new client-key file was required from the owner.

## Limits

No real Google account sign-in, live payment, payout, or media upload was executed
during this deployment. Emulator tests do not prove Firestore production rules.
The remote package install reports existing dependency advisories (root: 15;
admin: 64). Breaking dependency upgrades were not mixed into this cleanup.

No commit or push was made; deployments use this workspace snapshot.

## Completed production deployment

- Consumer project `youpeak-web`: deployment `dpl_7xvci8h9ZC9RKkNCK7FN6Te6GADP`, READY.
  Deployment URL: https://youpeak-i13cixrh1-youpeak24-1075.vercel.app
- Admin/API project `youpeak`: deployment `dpl_GAakR2rX6NRSR5yRosZS8YPZztpM`, READY.
  Deployment URL: https://youpeak-70jljrszf-youpeak24-1075.vercel.app
- Moved `youpeak.app` and `www.youpeak.app` to the consumer project. Retained
  the apex-to-www 308 redirect. `admin.youpeak.app` and `api.youpeak.app` remain
  on the admin/API project. No Cloudflare DNS records were changed.
- Confirmed the admin's production API base URL is `/`, so its API calls remain
  on the admin/API project after moving the consumer domains.

Final read-only production checks:

| URL / check | Result |
| --- | --- |
| https://youpeak-web.vercel.app | HTTP 200, Flutter bootstrap |
| https://youpeak.app | Redirects to www; HTTP 200, Flutter bootstrap |
| https://www.youpeak.app | HTTP 200, Flutter bootstrap |
| https://admin.youpeak.app | HTTP 200, React admin HTML |
| https://api.youpeak.app/api/ping | HTTP 200, API liveness JSON; dependencies not checked by this endpoint |
| `/client/setting` without client key | HTTP 401 JSON, expected |
| `/client/setting` with production app client key in memory | HTTP 200, `status: true` |
| Consumer `/tasker` deep link | HTTP 200, Flutter bootstrap |
| Consumer updated wordmark asset | HTTP 200, image/png |
| Consumer `/.well-known/assetlinks.json` | HTTP 200, valid JSON |

Evidence: `production-smoke.json`, `authenticated-settings-smoke.json`,
`routes-smoke.json`, and the original domain assignment in `domains-before.json`.
These HTTP checks confirm routing and settings access, not a real account login
or the correctness of every production feature.
