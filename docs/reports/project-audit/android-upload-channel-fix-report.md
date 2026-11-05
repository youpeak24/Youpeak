# Android upload and channel errors — investigation and fix

**Date:** 12 Oct 2026 · **Device:** OPPO CPH1823, Android 10 (SDK 29), 5.8 GB RAM · **Branch:** `fix/deploy-readiness`, uncommitted (existing uncommitted fixes preserved)

Nothing was committed, pushed or deployed. No production setting was changed, no payment was made, and no video was published.

## 0. Read this first: what was verified where

| Level | What it covers | Status |
|---|---|---|
| **Real phone (OPPO)** | Identity and installed build; one observed cold start; install of the corrected APK, hash-verified on the device | Done. The phone was **signed out** when I got access, so the signed-in flows were **not exercised on it**. It was **disconnected before I could launch the new build**, so that launch is unconfirmed. |
| **Production request log** | What the Android app asked production for, and the status it got | Partial (see §2) |
| **Replica of what production runs** | The app's exact requests, replayed against a byte-identical copy of the deployed backend | Done |
| **Emulator / unit / widget tests** | Backend and Flutter logic | Done |
| **Real browser (web build of the same Dart code), isolated local stack** | The new failure screens, with one endpoint's answer replaced per scenario | Done. **This is the web build, not Android.** |

I could not capture the actual failing request from the phone. The root causes below are therefore established from the code, the deployed backend and reproductions. Which trigger fired on your phone is **not** device-confirmed, and I say so where it matters.

## 1. Root causes

### 1.1 "Some thing went wrong !!" when uploading

**Established (code + production behaviour):** in the Oct 10 build, the only path from Create → Upload that shows that exact toast is the **preview player failing to start** (`upload_video_controller.dart`, `initializeVideoPlayer`). It popped the whole form with `Get.back()` and showed the generic toast. That happens before any API call or storage request. It also matches your screenshot: the toast appears on Home, because the form was popped. Everything after the form (channel check, upload-URL request, storage PUT, publish) already produced specific messages.

**Not confirmed on the device:** that the preview failed on your phone for the video you picked. Release builds do not send the app's log output to `logcat`, and the phone was signed out.

Other defects found on the same path (each reproduced or read from code):

| # | Defect | Evidence |
|---|---|---|
| a | A user **without a channel** whose profile has no `socialMediaLinks` object gets **HTTP 500** on first upload (`createVideo` writes into it unguarded). The same code is in production. | Reproduced by the new suite (AC-07/08 failed with `Cannot read properties of undefined (reading 'instagramLink')`) |
| b | Android read the **whole video into memory** before the PUT; any failure there, including running out of memory, was reported as "no connection" | `storage_put_io.dart` before the change |
| c | Channel eligibility used only the **cached** `Database.isChannel` / `channelId`, set by whichever profile call last succeeded | `upload_video_view.dart` before the change |
| d | A 403 from our API ("not your channel", "account mismatch") was shown as "your session has ended, sign in again" | `failureForApi` before the change |
| e | A channel mismatch at publish came back as **HTTP 200** with only a sentence, so the app could not tell it from other errors | `video.controller.js` before the change |

### 1.2 "Some thing went wrong !!" when checking the channel

**Established:** the channel page and the channel-home call collapsed every failure (401, 403, 5xx, a dropped connection, an unreadable reply) into `null`, and `null` rendered as the generic message. There was no distinction between "no channel", "signed out", "refused" and "network or server down".

**Reproduced against the replica of production** (Oct 7 deployment, byte-identical backend files):

| Request the app makes | Replica result |
|---|---|
| `client/user/profile`, `detailsOfChannel` with a valid owner session | 200, data returned |
| no token | profile 401 `AUTH_REQUIRED` |
| bad / expired token | 401 `AUTH_INVALID` |
| another account's `userId` | 403 `USER_MISMATCH` |
| **`videosOfChannel` / `playListsOfChannel` / `aboutOfChannel`** | **200, but with `video` / `playList` / top-level `channel`.** The app reads `videosTypeWiseOfChannel` / `playListsOfChannel` / `aboutOfChannel`, so these tabs are **empty even with a perfect session**. |

The last row is a certain, reproduced production gap. It would also make a successfully uploaded video **not appear in the owner's Videos tab**. The working tree already sends both key sets; production does not (see §4).

**Not confirmed on the device:** which of 401 / 403 / 5xx / network applied on your phone.

### 1.3 What the phone itself showed

- At 14:46 IST the cold start asked for translations and settings (all 200) and **no profile**, then showed **Login**: no saved session.
- A login plus Home load, probably this phone, appears at 14:18 IST in the retained log, all 200. **No channel or upload request is in the retained log window.** That fits a failure that happened before any request, or earlier than the window.
- **Silent sign-out risk (code):** at start-up the profile call had a 4-second wait, and on failure the splash called `Database.logOut()`. That call erases local storage, preferences and **downloaded videos**. A slow mobile connection (the status bar showed 13 KB/s) was treated as "account deleted". I did not confirm this is what logged this phone out.

## 2. Comparing the installed app with production

| Check | Result |
|---|---|
| Installed APK | sha256 `65b8d6e7…`, identical to the Oct 10 release candidate; versionName 1.1.2; signing SHA-1 `36e05d07…` |
| Production deployment | Oct 7 17:38 IST (`dpl_H4Fe7ap5…`), the latest. 508 of 542 deployed files are identical to the working tree; **33 differ, 32 of them backend** |
| Differing backend files that matter here | `user.controller.js` (channel tabs DTO), `video.controller.js`, `routes/client/video.route.js`, `firestoreDb.service.js`, `mongooseShim.js`, `safeUser.js`, plus the Phase 1–3 payment/promotion/boost files |
| Identical to production | `file.controller.js` (upload URL), `uploadGrants.js`, `user.route.js`, the auth middleware. The upload-URL and storage code is **not** the difference between "web upload worked" and Android. |
| Key | Both APKs and the live web bundle embed the **current** production client key (booleans only; never printed) |
| Storage delivery | `videos.youpeak.app` answers from Cloudflare; CORS preflight allows `https://youpeak.app`. Android's native requests aren't subject to CORS. The presigned R2 PUT itself can't be tested without an authenticated session. |
| Unattributed 401s | At 15:24–15:25 IST production logged 401 on translation, settings and login, each preceded by a browser preflight. Not the phone (no preflight from Android), not the live web bundle (key is correct), not my local bundle (it only contacts localhost). Source unknown. |

## 3. What changed

### Backend (`functions/backend/`) — needs deployment

| File | Change |
|---|---|
| `controllers/client/video.controller.js` | Channel refusals at publish/edit are now **403 `CHANNEL_NOT_OWNED`** / **404 `CHANNEL_NOT_FOUND`** (message unchanged); `socialMediaLinks` guarded so a first upload by an account without it no longer 500s |
| `controllers/client/user.controller.js` | Channel reads add `code`: `CHANNEL_ID_REQUIRED`, `CHANNEL_NOT_FOUND` (still HTTP 200 for older apps) |
| `controllers/client/userFirestore.controller.js` | `getProfile` adds `USER_NOT_FOUND` / `USER_BLOCKED` codes |

### App (`youpeak/lib/`)

| File | Change |
|---|---|
| `core/network/api_problem.dart` (new) | One classifier: no session / session expired / forbidden / blocked / not found / offline / timeout / server / refused / unreadable, with the right message and a short diagnostic (HTTP status + code, never a token or URL) |
| `features/channel/data/channel_lookup.dart` (new) | The channel lookup from the **server's record**, with five outcomes: found, no channel, authentication required, permission denied, unavailable. An expired token is refreshed once and retried before it is reported |
| `features/channel/api/channel_home_api.dart`, `controller/your_channel_controller.dart`, `view/your_channel_view.dart` | Channel page shows the accurate reason, the code, and **Retry** or **Sign in again** as appropriate |
| `features/upload/controller/upload_video_controller.dart`, `view/upload_video_view.dart` | Preview is optional (form stays, duration read with FFprobe); a server-truth channel check before publishing; double-tap guard; accurate dialog with Retry / Cancel / Sign in again; the form and its details are kept |
| `core/platform/media_duration.dart` (new) | FFprobe duration so a preview failure doesn't block publishing |
| `core/file_upload/storage_put_io.dart`, `upload_models.dart`, `features/upload/api/upload_video_api.dart` | Streamed PUT with progress and cancel (no whole-file buffer); read errors are a distinct class; 403 is "permission", not "session ended"; channel codes mapped |
| `features/profile/api/get_profile_api.dart`, `features/splash/splash_session_policy.dart` (new), `features/splash/view/splash_screen_view.dart` | The profile call reports why it failed; start-up signs out **only** when the server says the account is gone or the session is invalid, and otherwise shows "Couldn't load your account — you're still signed in" with Retry |

### Preserved

Upload progress, Cancel, Retry, duplicate prevention (one publish per upload; five parallel publishes give one video), and abandoned-file cleanup are untouched in `runUpload` and covered by the tests. Existing uncommitted fixes were not reverted.

### Tests and harness

- `tests/emulator/suites/14-android-upload-channel.cjs` (11 checks)
- `youpeak/test/core/android_upload_channel_test.dart` (19 tests)
- `tests/emulator/harness.cjs` — `BACKEND_DIR` selects another backend copy
- `reports/project-audit/android-upload-channel/harness/` — `replay.cjs`, `states.cjs`

## 4. Verification

| Check | Result | Log |
|---|---|---|
| Emulator suites (14) | **203/203** (192 earlier + 11 new) | `android-upload-channel/logs/emulator-full.log` |
| Backend unit tests | **33/33** | `logs/node-test.txt` |
| Flutter tests | **168/168** | `logs/flutter-test.txt` |
| Flutter analyze | **0 errors**; the saved log shows 83 warnings, one of which was an unused import in my new test file (removed afterwards, so 82, all pre-existing) | `logs/flutter-analyze.txt` |
| Replica replay (production code vs working tree) | Same statuses; the working tree adds the three tab keys | `logs/replay-deployed-oct7.json`, `logs/replay-working-tree.json` |
| Real browser, local stack | **14/14** scenarios | `logs/states-run.log`, `screenshots/after/` |

New emulator checks cover: owner vs no-channel lookup; the distinct 401 / 401 / 403 outcomes; channel codes; an owner publishing and **the video appearing in that channel's tab**; another user refused (`CHANNEL_NOT_OWNED`, nothing created); a token publishing only as itself; a stale channel id (404, no channel created); first upload creating exactly one channel and one video; **double tap / retry giving one video**; and a blocked account.

Browser scenarios (web build, one endpoint's answer replaced each time):
- **Upload gate:** no session, expired session, permission refused, connection dropped (then Retry works), server error, no channel yet (creation flow opens), owner (publishing starts; the local stack has no storage, so it says uploads are unavailable, not auth).
- **Your Channel:** owner opens it; expired session; refused; connection dropped; server error.
- **App start:** failed profile keeps the user signed in with Retry; "account gone" signs out to Login.

Tests added in Flutter include:
- the classifier and the five lookup outcomes;
- token refresh before a session problem is reported;
- a streamed PUT against a real loopback server (headers, content length, chunking, progress, a 403 body, unreachable, empty file, cancel mid-transfer);
- the preview fallback;
- the start-up sign-out policy.

## 5. Release build

| | |
|---|---|
| APK | `youpeak/build/app/outputs/flutter-apk/app-release.apk`, sha256 **`38899266ae2a49e9…`** |
| Copy | `E:\Legendary One\youpeak\backups\rc-android-fix-2026-10-12\app-release-rc-android-fix-2026-10-12.apk` |
| Built with | The repo's `build-consumer-apk.ps1` via `vercel env run -e production` (key injected for the build only, never printed) |
| Checks | Production key embedded; production API URL; no local hosts; signing SHA-1 `36e05d07…` (**unchanged**, so it updates in place) |
| On the phone | Installed with `adb install -r`; on-device hash matches. **Launch not observed** (phone disconnected afterwards). |
| Previous candidates | Oct 10 APK `65b8d6e7…` in `backups\rc-promotion-2026-10-10\` |

## 6. Remaining blockers and what needs deploying

1. **Deploy the backend** (`youpeak`: API + admin) from the working tree. Until then, with any app version: the Videos / Playlists / About tabs stay empty, and a first upload by an account without `socialMediaLinks` can still 500. The client changes work without it, but with the older codes (a missing account looks like a session problem, a channel mismatch at publish is a message rather than a 403). **Not done: needs your authorization.**
2. **Sign in on the phone and re-run the real-device check.** I need a signed-in session (I did not and will not use your credentials) and the phone reconnected. The device test I would run: Profile → Your Channel; Create → Upload a video → pick a video → Add Details (preview or the "preview unavailable" panel); turn mobile data off and press Upload to see the "Couldn't check your channel" dialog (nothing is uploaded offline). **I will not press Upload with a connection**, since that publishes a real video.
3. **Which failure hit your phone is not confirmed.** If it recurs on the new build, the message and the small code under it (for example `HTTP 401 AUTH_INVALID`) now say which one it was.
4. **Production data not checked:** how many real accounts lack `socialMediaLinks` (reading user records in bulk was out of scope). The fix removes the crash either way.
5. **Older app versions** still show a generic message for these failures; only this build has the new screens.
6. **Unattributed browser 401s** at 15:24–15:25 IST (§2): worth a look if web users report sign-in failures.
7. **Cached channel state** is still used for the menu entries; the upload path no longer depends on it, and the lookup refreshes it.
