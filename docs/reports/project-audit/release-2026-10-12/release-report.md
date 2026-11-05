# Production release — October 12, 2026 (IST)

User authorized deploying the latest update. Deployed the current working tree's API/admin and rebuilt consumer website. No Git commit or push was made. No live payment or test video publication was performed.

## Active deployments

- API/admin project `youpeak`: `dpl_GSRoGU6wV2QHemH3qHYvoeDgigS2`, https://youpeak-btkpvxx2u-youpeak24-1075.vercel.app
- Consumer project `youpeak-web`: `dpl_EuVQp6EVZbU4SQ1x7bhdM94EY7QC`, https://youpeak-7n49c6aya-youpeak24-1075.vercel.app
- Both built with production settings, initially without assigning the custom domains. Backend checks passed before promoting API/admin; consumer was promoted afterwards.
- Public consumer JS SHA-256: `8f4034a59e3e685e72341bae0b769a4f377518a636e93b4bb82d5567bf59637b`, identical to the freshly built local bundle.

## Verification in this release

- Backend unit tests: 33/33. Initial sandbox run had two loopback EACCES failures; rerun with networking permissions passed.
- Isolated Firebase emulator checks: 203/203 (14 suites). Concurrent tests emitted timeout/retry logs but all assertions passed.
- Flutter tests: 168/168.
- Vercel admin production build: compiled successfully.
- Flutter production web build: succeeded using the existing secure build helper and production environment. Client key was not printed.
- Six API checks passed against the new deployment and then `https://api.youpeak.app`: ping; settings with current client key; promotion catalogue; channel validation code; missing-session profile refusal; missing-client-key refusal.
- `youpeak.app`, `www.youpeak.app`, `youpeak-web.vercel.app`, and `admin.youpeak.app` returned 200. Consumer entrypoints contain the Flutter bootstrap; served JS matches the local build exactly.
- Evidence: `live-smoke.json`, `web-smoke.json`, and isolated suite results in `tests/emulator/out/results.json`.

## Limits and existing warnings

Signed-in phone channel/upload flows and real payment remain unverified by this release. Public HTTP checks do not prove authenticated UI behavior. Analyzer was not rerun; the preceding fix report recorded zero errors. Vercel dependency installation reported existing audit vulnerabilities (root 17; admin 94) and a large admin bundle; no dependency upgrades were attempted during deployment.

## Rollback

Previous API/admin release: https://youpeak-m4jt8r46n-youpeak24-1075.vercel.app

Previous consumer release: https://youpeak-2qxk059ih-youpeak24-1075.vercel.app

Promote the appropriate previous deployment in its corresponding linked project if rollback is required. No rollback performed.
