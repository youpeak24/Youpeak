# Local admin panel (isolated test stack)

Runs the whole admin panel on your machine against a **local Firestore emulator**
filled with demo data. Nothing here touches production: no live Firestore, no R2,
no push notifications, no email. The backend gets a throwaway service account and
blank Cloudflare/email credentials.

```
node local-dev/start.js            # start (keeps the data from the last run)
node local-dev/start.js --reset    # start with fresh demo data
```

Stop with **Ctrl+C**. The emulator saves its data to `local-dev/emulator-data/`
(git-ignored) on a clean exit.

| What | Link |
|---|---|
| Admin panel | http://localhost:3055/login |
| Backend API | http://localhost:5055/health |
| Database viewer (emulator UI) | http://127.0.0.1:4005/firestore |

Every account's password is `Test@1234`:

| Panel | Email |
|---|---|
| Super Admin | superadmin@youpeak.test |
| District Partner (Franchise) — Trichy | district@youpeak.test |
| Digital Partner — Trichy | partner@youpeak.test |

Requirements: Node 24, Java 17+ (for the emulator), and the existing `npm ci`
installs in the repo root and `admin/frontend`. The emulator runs through
`npx firebase-tools@13`, because firebase-tools v14 and later need Java 21.

Files: `config.js` (ports, accounts), `seed.js` (demo data from `../DB/*.json`
plus the test logins; it skips `settings.json` and builds settings from the backend
defaults with every credential blanked), `firebase.json` (emulator ports).
