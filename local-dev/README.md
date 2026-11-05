# Local stack (isolated test data)

Runs the admin panel, the backend API and (optionally) the Flutter web app on
your machine against **local Firebase emulators** filled with demo data.
Nothing here touches production: no live Firestore or Firebase Auth, no R2 /
Stream, no push notifications, no email. The backend gets a throwaway service
account for the `demo-youpeak-local` project and blank Cloudflare/email
credentials.

```
node local-dev/start.js              # start (keeps the data from the last run)
node local-dev/start.js --reset      # start with fresh demo data
node local-dev/start.js --no-admin   # skip the admin web app
```

Stop with **Ctrl+C**. The emulators save their data to `local-dev/emulator-data/`
(git-ignored) on a clean exit.

> Do not use plain `npm start` / `npm run dev` for local work: `server.js` now
> refuses to start against the live Firebase project unless it is pointed at
> the emulator with a `demo-*` project (as this stack does), `NODE_ENV=production`
> is set, or `ALLOW_LIVE_FIREBASE=true` is set deliberately.

| What | Link |
|---|---|
| Admin panel | http://localhost:3055/login |
| Backend API | http://localhost:5055/health |
| Database / Auth viewer (emulator UI) | http://127.0.0.1:4005/ |
| Test-fixture media | http://127.0.0.1:5056/ |

Every account's password is `Test@1234`:

| Login | Email |
|---|---|
| Super Admin (admin panel) | superadmin@youpeak.test |
| District Partner (Franchise) — Trichy (admin panel) | district@youpeak.test |
| Digital Partner — Trichy (admin panel) | partner@youpeak.test |
| App viewer (Flutter web, "Sign in with password") | viewer@youpeak.test |

## Flutter web app against this stack

From `Youpeak_Flutter/`, while the stack is running:

```
flutter run -d chrome --web-port=5057 \
  --dart-define=API_BASE_URL=http://localhost:5055/ \
  --dart-define=API_SECRET_KEY=youpeak-local-dev-key \
  --dart-define=AUTH_EMULATOR=127.0.0.1:9095 \
  --dart-define=FIRESTORE_EMULATOR=127.0.0.1:8095
```

`scripts/run-web-dev.ps1 -Local` runs the app against this stack with those defines already set (a plain
`flutter run` against the **production** API needs the client key: use `scripts/run-web-dev.ps1`).
The command above is a debug run and needs nothing else. A **release-mode** build against this stack
(`flutter build web --release`, or `scripts/build-consumer-apk.ps1 -Development` for an emulator APK) must
also pass `--dart-define=BUILD_PROFILE=development`; without it the app refuses to start. A development
build is only accepted against a local API and is never a distributable build.

`AUTH_EMULATOR` / `FIRESTORE_EMULATOR` are development-only switches
(`Youpeak_Flutter/lib/core/config/local_emulators.dart`): production builds never set
them, and they are ignored unless both the emulator and `API_BASE_URL` are on
this machine.

Known limitation: when a saved session is restored on page load, the Firebase
Auth web SDK makes one `accounts:lookup` request to Google's real Identity
Toolkit before the app can switch it to the emulator (FlutterFire initialises
Auth inside `Firebase.initializeApp`). It carries only an emulator-issued
token, reads and writes nothing, and the session continues against the
emulator.

## Test fixtures

`fixtures/` holds small, locally generated clips and posters, each visibly
labelled **"LOCAL TEST FIXTURE"** (two 9:16 portrait Bites and one 16:9 clip
for the letterbox check). The seed points the demo videos and Bites at them
(`storageProvider: "local-test-fixture"`, `isTestFixture: true`) instead of the
public sample URLs in `../DB`, which were labelled as R2/Stream uploads. They
verify UI and player behaviour only — not Cloudflare storage or delivery.

Requirements: Node 24, Java 17+ (for the emulators), and the existing `npm ci`
installs in the repo root and `Admin_Panel/frontend`. The emulators run through
`npx firebase-tools@13`, because firebase-tools v14 and later need Java 21.

Files: `config.js` (ports, accounts), `seed.js` (demo data from `../DB/*.json`
plus the test logins and fixture media; it skips `settings.json` and builds
settings from the backend defaults with every credential blanked),
`firebase.json` (emulator ports), `start.js` (starts everything, serves
`fixtures/`).
