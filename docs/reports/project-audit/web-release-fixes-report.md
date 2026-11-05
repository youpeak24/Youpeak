# YouPeak — Web release fixes: report

| | |
|---|---|
| Workspace | `E:\Legendary One\youpeak\source`, branch `fix/deploy-readiness` (nothing committed; earlier tasks' uncommitted work preserved) |
| Dates | 2026-10-06 → 2026-10-07 (IST) |
| Evidence | `reports/project-audit/web-release/` (screenshots, logs, JSON results, harness) |
| Deployed | Backend/admin and consumer web, both to production (§7). No production setting was changed (§8) |

## 1. Summary

| # | Issue | Status |
|---|---|---|
| 1 | Web exit/back navigation | **Fixed and live.** Browser back now works at every point tested: in the browser and Android-style mobile viewports, against the before build, the fixed build and production |
| 2 | Peak Boost fee sentence | **Fixed and live.** Only "Boosts can't be refunded." remains |
| 3 | Video upload "Something went wrong" | **Code fixed and live; uploads in production stay blocked by configuration.** The real cause is the R2 public-domain setting (§4.3), which only the owner can change |
| 4 | Channel creation and Channel Details | **Fixed and live.** Root causes and fixes are in §5. Verified locally in release and debug builds; not yet run on production with a test account |
| 5 | Web tasking and layouts | **Re-verified on the final code (local).** Production `allowWebTasking` was already effectively on, so I changed nothing |
| 6 | Tests and production build | **Green**, apart from one emulator timeout explained in §6 |
| 7–8 | Deployment and live verification | **Both projects deployed.** Signed-out checks pass live. Signed-in live checks are pending a production test account (§9) |

## 2. Issue 1: browser Back / exit

**Reproduced first, then fixed.** Headless Chrome put an external page in front of the app in the tab's history, then pressed Back.

**Root cause:**
- The sign-in, sign-up and main-tab screens wrapped Back in an "Exit app?" dialog. In a browser, its **Exit** button did nothing: the code only exits on Android or iOS. Users were stuck on the dialog.
- Sign-in options opened "Sign in with password" and "Sign up" with `Get.offAll`, which replaces the whole stack. Back from either page therefore skipped the sign-in options and left the site.
- Sign up opened from Sign in showed the exit dialog on Back instead of returning.

**Fix:**
- `lib/core/navigation/root_back.dart` → `handleRootBack()`:
  - A nested page pops normally.
  - On the main tabs, Back returns to the Home tab first.
  - In a browser, Back goes to the browser. Flutter then steps back in the tab's history, to the earlier page when one exists. The tab is never closed.
  - On Android and iOS, the existing exit confirmation is unchanged.
- The sign-in options now **push** the password and sign-up pages.
- `switchAuthPage()` moves between Sign in and Sign up:
  - when the page is on top of others, it replaces itself, so the stack can't loop;
  - when the page is the root, it pushes.

**Evidence** (`web-release/logs/navsuite-*.log`, `evidence/navsuite-*.json`):

| Scenario | Before (desktop / mobile) | After (desktop / mobile) |
|---|---|---|
| N1 Back on the first screen returns to the earlier page | pass / pass | pass / pass |
| N2 Back on the sign-in screen | **exit dialog, trapped** | returns to the earlier page |
| N3 Password page → Back | **left the site** (skipped sign-in options) | sign-in options; Forward OK; Back again leaves |
| N4 Sign up → Back | **exit dialog** | sign-in options |
| N5 Phone sign-in → Back | pass | pass |
| N6 Signed in: Back at Home, Forward, refresh | **exit dialog** | Back leaves; Forward and refresh land on Home with the session intact (not sign-in) |
| N7 Signed in: Back from an inner page, then refresh | pass | pass; no logout |

Totals: before 3/7 desktop, 2/7 mobile; after **7/7 desktop**. The mobile run of the fixed build scored 5/7 on its first pass. The two failures were a harness timing read (the page wasn't painted yet when its labels were sampled); the actual steps (leave, Forward, refresh → Home) all behaved correctly. After I added the retry, N1–N5 passed on mobile. Mobile N6/N7 were **not re-run** after the retry fix.

Native Android behaviour: `test/core/root_back_test.dart` (4 tests) covers:
- the exit dialog on a root page: Cancel keeps the app, Exit calls `SystemNavigator.pop`;
- a nested page pops normally;
- a non-Home tab returns to Home first;
- `switchAuthPage` replaces or pushes as described.

No Android device was used.

Screenshots: `screenshots/before/nav-*-exit-dialog.png`, `screenshots/after/nav-*.png`.

## 3. Issue 2: Peak Boost text

- **Change:** removed "`80% goes to the creator · 20% platform fee.`" from `peak_boost_bottom_sheet.dart`. The ⓘ icon and "Boosts can't be refunded." stay, with no leftover separator or gap.
- **Scope:** UI only. Allocations, wallet, conversion, validation and refunds are untouched.
- **Translations:** the string was hard-coded English, and no translations contain it.
- **Platforms:** one Flutter widget serves web and Android.
- **Evidence:**
  - Before/after screenshots: `screenshots/before/peak-boost-sheet-1366.png`, `screenshots/after/50-peak-boost-sheet-{1920,1366,768,390}.png`.
  - Text check: before `hasFeeText:true`; after `hasFeeText:false, hasNoRefund:true`.
  - The widget test now asserts the sentence is absent.

## 4. Issue 3: video upload

### 4.1 Flow traced

The app asks the API for a presigned R2 URL (`client/file/direct-upload-url`; the API records an upload grant). It then PUTs the file **directly to Cloudflare R2**, not through Vercel. The thumbnail goes to the API, which stores it in Firebase Storage. Finally `createVideo` checks the grant and that the object exists, then writes the Firestore record. That is the established secure design: no storage credentials reach the client and the bucket has no public write.

### 4.2 Defects found and fixed in code

- **Every failure became "Something went wrong".**
  - Each step now raises an `UploadFailure` with an accurate message: unsupported format, too large, session ended, storage unreachable (including CORS), upload permission expired, storage busy, uploads unavailable, publish refused with the server's reason.
  - Logs keep a sanitized diagnostic (HTTP status or S3 error code), never a signed URL or key.
- **No progress, cancel or retry.**
  - In the browser the file streams as a Blob over XHR, with real progress and an abort.
  - The phone build keeps its existing request.
  - Transient failures retry twice (2 s, then 5 s). A 403 fetches a fresh presigned URL.
  - The Home banner shows the step and percentage with **Cancel**. After a failure it offers **Retry** (the same captured request, no re-entry) and **Dismiss**.
- **Duplicate videos.**
  - `createVideo` is now idempotent per upload: a retry or second tap returns the existing video.
  - Concurrent publishes are serialised by an atomic grant claim. Emulator: 5 simultaneous publishes → 1 video.
- **Orphaned files.**
  - The cleanup helper called on failed publishes silently skipped R2 and Firebase URLs ("Unknown storage"). `util/mediaCleanup.js` now deletes them.
  - New `POST client/file/abandon-upload` deletes the caller's own **unpublished** uploads after a cancel or failure.
  - The daily cron removes uploads that were never published 72 h after their publish window ended. It skips any file a video references, and `UPLOAD_CLEANUP=off` disables it.
- **Size limits.** The declared file size is validated (2 GB default, `MAX_VIDEO_BYTES`). At publish, the stored object's real size is checked with HEAD.
- **Thumbnails.** Picked images are downscaled to at most 1280 px to fit the 4 MB API limit. Their size is checked first.

### 4.3 The actual production failure (read-only diagnosis with production credentials, nothing printed or changed)

- `CLOUDFLARE_R2_PUBLIC_DOMAIN` is **not set** in the `youpeak` production environment.
- Both Firestore settings docs set `r2PublicDomain` to `youpeak-videos.<account>.r2.cloudflarestorage.com`. That is R2's private S3 API endpoint, not a public delivery domain.
- The backend deliberately refuses that host, because unsigned videos can't play from it. So **every** presigned-URL request fails with `503 R2_DELIVERY_NOT_CONFIGURED`.
- The old app showed that as "Something went wrong"; the new app shows "Video uploads are temporarily unavailable". This affects any client that uses direct upload, not only the web.
- The production R2 key can't read the bucket's CORS (`GetBucketCors` → AccessDenied), so whether the browser PUT from `youpeak.app` is allowed is **unknown**.

**Owner actions needed** (configuration; not authorized for me to change):
1. In Cloudflare R2, give bucket `youpeak-videos` a public domain: a custom domain such as `media.youpeak.app`, or enable its r2.dev URL.
2. Set that origin as `CLOUDFLARE_R2_PUBLIC_DOMAIN` on Vercel project `youpeak` (Production), or as Admin → storage `r2PublicDomain`. Then redeploy.
3. Set the bucket's CORS policy:
   - origins `https://youpeak.app`, `https://www.youpeak.app`, `https://admin.youpeak.app`;
   - methods PUT, GET, HEAD;
   - header `content-type`.

### 4.4 Local end-to-end evidence

Setup: release build, emulators, a local Storage emulator, and a fake R2 with a CORS switch. Logs: `evidence/channel-upload-e2e.json`.

| | Result |
|---|---|
| E5 upload | pass: 1 video record; the R2 object has the real size (190,987 B, `video/webm`); thumbnail in Firebase Storage, not R2 |
| E6 two storage 500s | pass: retried automatically (3 PUTs), 1 video |
| E7 CORS blocked | pass: "Couldn't reach the video storage…", nothing published, **Retry** after the fix gave exactly 1 video |
| E8 Cancel mid-upload | pass: "Upload cancelled.", nothing published. The first attempt failed in the harness (the file chooser never opened); the rerun passed |

Not exercised: real R2, a real presigned signature, real CORS, files over about 200 KB, slow mobile networks, and Android.

## 5. Issue 4: channel creation and Channel Details

**Root causes:**
- **Browser channel-name check.**
  - The app sent the name as a JSON body on a GET. Browsers drop GET bodies, so every name looked taken on the web.
  - Reproduced **live** before the deploy: a free name sent as a query parameter came back `status:false` from production.
- **Weak server validation.**
  - `client/user/update {isChannel:true}` had no server validation, no uniqueness check and no protection against a double tap.
  - It stored `channelType` as the text "1".
  - It returned the full user document, including password-hash fields.
- **String numbers broke the app.**
  - The app's channel model read `channelType` strictly as an int, so a string value made the whole Channel Details reply unreadable: an endless placeholder, plus an unhandled null assertion.
  - **Found during this task:** the profile model read the prices strictly as numbers. A profile with `subscriptionCost: "10"` (the subscription-plan screen sends text) failed the post-login profile load, so that account could not finish signing in.
- **First upload created a broken channel.** It gave the channel a random `channelId`, while every channel query looks a channel up by the owner's user id. Such channels could not be opened.
- **No navigation after creation.** Success just closed the form.

**Fixes:**
- **`util/channel.service.js`.** Creation runs in one Firestore transaction and:
  - validates the fields (name 2–30 characters, description up to 500, type 1 or 2);
  - is idempotent (a retry returns the existing channel with `alreadyExists`);
  - reserves names case-insensitively in `channelNames`, and also checks legacy names;
  - takes the owner from the verified token;
  - stores numbers as numbers;
  - retries on transaction contention;
  - strips credentials from the reply;
  - sets no default prices (a default unlock price would list every free video in the Premium shelf).
- **Name check.** It reads the query string, still accepts the published Android build's body, and treats a name the caller already owns as available.
- **`detailsOfChannel`** coerces its numeric fields.
- **Channel models.** The channel and profile models parse text values and fill in safe defaults.
- **Channel page.** It shows an error with **Retry** instead of an endless placeholder.
- **Create screens.**
  - Both screens validate the fields and ignore repeat taps; the API also shares a single in-flight request.
  - On success they open the new channel.
- **First upload.** It now uses the owner's id as the channel id.

**Evidence:**

| Check | Result |
|---|---|
| Emulator suite `11-release-fixes` CH-01…08 | validation; ownership (403 for another user); 5 parallel creates → 1 channel; a two-person name race → 1 winner; GET-without-body name check |
| Browser E1–E4 | E1: Channel Details opens right after creation (`screenshots/after/e1-after-create.png`). E2: new login → Profile → Your Channel; refresh keeps the session. E3: triple tap → 1 channel. E4: empty, too short and taken names give a message and create nothing |
| Debug build (assertions on), fresh `flutter run -d web-server` | Channel Details for a newly created channel and for a legacy text-typed profile: **0 exception or overflow reports**; tabs render (`evidence/debug-channel-*.json`, `screenshots/after/debug-channel-details-*.png`) |

The earlier matrix recorded 759 exception reports on this page before its fix.

## 6. Tests and builds (final code)

| Check | Result | Log |
|---|---|---|
| Backend unit tests | **33/33** (5 new) | `logs/node-test.txt` |
| Emulator suites (11 suites, 131 checks; new suite 11, MED-02 updated for idempotent publish) | run 1 **131/131**, run 2 **130/131**, run 3 **131/131** | `logs/emulator-full-{1,2,3}.log` |
| Peak Boost alone ×3 | **9/9 each time** | `logs/emulator-peakboost-*.log` |
| Flutter tests | **125/125** (18 new) | `logs/flutter-test.txt` |
| Flutter analyzer | **0 errors**; 83 warnings (baseline 84, no new ones) | `logs/flutter-analyze.txt` |

**The one failure, PB-06 in run 2: an emulator timeout, not a regression.**
- 10 concurrent boosts against one wallet should give exactly 3 successes; it gave 2.
- The 8 losing requests hit the backend's 8-second `GCP_TIMEOUT` while the emulator serialised the transactions.
- The wallet was never overdrawn. The test passed in the other 2 combined runs and 3/3 isolated runs. Peak Boost code is untouched.

**Pre-existing risk worth knowing:** the timeout doesn't cancel the transaction, so a boost that timed out may still commit after the client saw an error.

## 7. Deployment

| Project | Before (rollback target) | Preview validated | Production now |
|---|---|---|---|
| `youpeak` (api.youpeak.app, admin.youpeak.app) | `dpl_GAakR2rX6NRSR5yRosZS8YPZztpM` (youpeak-70jljrszf, Oct 5 18:26 IST) | `dpl_9HkRPLZTXvPksW5gwLM1AtWmkK8S` (youpeak-k82q6zrxe): new code, no secrets in settings, per-user routes 401 without a session | `dpl_42v6NHSNUBrPyLYU5XMVe416GMwZ` (youpeak-92mqnl49s) |
| `youpeak-web` (youpeak.app, www.youpeak.app) | `dpl_7xvci8h9ZC9RKkNCK7FN6Te6GADP` (youpeak-i13cixrh1, Oct 5 18:27 IST) | `youpeak-7ozuwqwkc` (protected; checked via `vercel curl`: identical bundle, deep-link fallback, `assetlinks` rewrite) | `dpl_48zxadEM4ienqHK2HVYLqst9f1AD` (youpeak-2qxk059ih) |

**Backend deploy:**
- It shipped this task's backend files, the admin panel (source unchanged since Oct 5) and one earlier-task file not yet live: `util/watchLedger.service.js`, the frozen-playback fix verified by the rewards and web-tasking suites.
- The deployment directories are unchanged: the root project builds admin + API; `.vercelignore` excludes `youpeak/`, `reports/`, tests and credentials.
- The consumer project deploys static `youpeak/build/web` with its own `vercel.json` (no functions), so it can't inherit backend function settings.

**Consumer build:**
- Built with `scripts/build-consumer-web.ps1`. The production client key was supplied through `vercel env run -e production`, never printed or written to disk; `.env.local` was unchanged.
- The bundle embeds that key, points at `https://api.youpeak.app/`, and contains no loopback addresses, local-dev key or private-key material.
- Both live domains serve exactly the new `main.dart.js` (sha256 `99a1c0b0…`).

**Backup:** the previous production bundle (byte-identical to what was live, sha256 `7986e0b1…`) is in `E:\Legendary One\youpeak\backups\consumer-web-prod-dpl_7xvci8h9ZC9RKkNCK7FN6Te6GADP-2026-10-06\`, outside the repo.

## 8. Tasking setting: exact state and rollback

**State (read-only check):**
- `allowWebTasking` is **absent** from both Firestore settings docs (`default_settings` and `6a5a008c9fb97d1dc7aa9e61`), so the code default `true` applies.
- `system_configs/app_policy.security.allowWebTasking` = **true** (published 2026-10-05 16:47 UTC).
- `GET /client/setting` reported `true` before and after the deploy.

**Action:** none. The setting was already effectively on before this deploy, and I had no admin session to toggle it in the UI.

**Watch out:** if the Admin form shows the box unticked for an absent value and someone saves, web earning would switch **off**. Open Admin → Platform Config → Anti-Fraud & Task Security and confirm the box is ticked before saving that page.

**Rollback:**
- **Containment, no deploy:** Admin → Platform Config → Anti-Fraud & Task Security → untick "Allow tasking from the web app" → Save. The web locks within about a minute.
- **Consumer:** `vercel promote youpeak-i13cixrh1-youpeak24-1075.vercel.app` in `youpeak-web`, or deploy the backup folder.
- **Backend/admin:** `vercel promote youpeak-70jljrszf-youpeak24-1075.vercel.app` in `youpeak`. This brings the broken name check back, and the new app's abandon-upload calls would get 404 (harmless).
- **Data:** no migrations. New collections: `channelNames` (name reservations), and `claimId`/`claimedAt` fields on `uploadGrants`. Older code ignores them.

## 9. Live verification

**Done on production:**
- **Domains:** apex → 308 to www; www and api → 200; admin → 200; no Cloudflare proxy in front.
- **API:** liveness OK. Settings with the key: OK, with no secret field names. Upload, abandon and attest calls without a session → 401; cron without its secret → 401.
- **Fixed name check:** live (`CHANNEL_NAME_REQUIRED`; a free name is available).
- **New assets:** both domains serve the new bundle.
- **IP/VPN classification:** a normal home connection (Indian ISP, 122.183.x.x) is **not** flagged as datacenter/VPN. Cloudflare edge addresses aren't flagged either.
- **Ad-reward collections:** the code reads `AdReward` (0 documents); production data is in `adrewards` (5 documents). **Not changed:** see §10.

**Not done on production (pending):**
- **Signed-in navigation, channel creation, upload and earning on youpeak.app.** There is no production test account: email sign-up needs an OTP sent to an inbox I can't read, and Google sign-in needs you. These flows were verified only locally (§2, §4.4, §5) and with the watch/check-in harness (§10).
- **Live browser Back/Forward.** Not run against youpeak.app; the identical bundle passed the local suite.
- **Real Google sign-in cycle:** pending your interaction.
- **Upload on production:** blocked by the R2 public-domain configuration (§4.3).

No test records or media were created in production, so nothing needed cleaning up.

## 10. Web tasking and layouts (item 5)

Re-verified on the final code (local stack):
- **Emulator suites 07 (rewards) and 10 (web tasking)** cover: server-decided eligibility, check-in, likes, comments and watch time; daily caps shared with the app; parallel tabs and duplicate requests paying once; locked accounts getting a refusal rather than a false success; and browser ad claims refused.
- **Watch harness** (`logs/watch-final.log`):
  - playing earned 42 s for 65 s wall time, never above real time;
  - a hidden tab earned 0, and paused playback earned 0;
  - the lock page unlocked by itself 45 s after earning was switched back on.
- **Web earning off** (`logs/routes-weboff.log`): the dashboard explains it, offers no "Check again" loop, and the lock page sits inside the sidebar shell with "Go back".
- **Rewarded ads** stay app-only.

**Route matrix:**
- 18 routes × 4 widths (`evidence/routes-final.json`): all reached; sidebar at 1920 and 1366 on every route; no horizontal scroll at any width.
- Added this run at 4 widths: the Peak Boost sheet, the upload form (with and without a channel), and Channel Details of a new channel. Also the Tasks-paused page at 1920.

| Route | 1920 | 1366 | 768 | 390 |
|---|---|---|---|---|
| tasker, earn (incl. from profile), history, your videos, playlists, watch later, wallet, settings, help, time watched, create channel, channel, search, notifications, profile, library, home | ✅ S | ✅ S | ✅ | ✅ |
| Peak Boost sheet (new) | ✅ | ✅ | ✅ | ✅ |
| upload form, upload form without a channel, Channel Details of a new channel (new) | ✅ S | ✅ S | ✅ | ✅ |
| Tasks paused (web earning off) | ✅ S | – | – | – |

S = desktop sidebar.

**Not exercised:**
- Most of the 73 page classes in `web-tasking/route-inventory.md`, including: withdraw and withdrawal history, coin history, convert/buy coins, passes, edit profile, referral, monetization, playlist preview, subscribed channels, downloads, Bites player, create Bite, go live/live, video details at all widths, the upload sub-pages (thumbnail, description, visibility, audience, comments, charges), and the Tasks-paused page below 1920.
- Production layouts.

**This is a sample, not full coverage.**

**Ad-reward collection, open decision.** Pointing the `AdReward` model at `adrewards` would immediately show 5 paid ad tasks to the Android app. Ad claims are still reported by the app (AdMob server-side verification isn't set up), so I left both names unchanged.

## 11. Other observations

- Production Firestore refuses public reads of `system_configs`, while the repo's `firestore.rules` allows them. The deployed rules differ from the repo.
- Free videos from channels that have an unlock price appear in the Premium shelf (`premium_videos_shelf.dart` keys on `videoUnlockCost > 0`). The first-upload path still sets 10/10 prices, as it always did. Pre-existing; not changed.
- On wide windows, Channel Home video cards letterbox 16:9 thumbnails with a grey band. Pre-existing layout issue.
- **Harness limits:**
  - Flutter text fields only accept typed input with the accessibility tree off, so sign-in and forms are driven by coordinates measured in a separate session.
  - The debug web server accepts only one browser client per start.
  - Node may print a libuv assertion when a harness process exits; this happens after results are written.

## 12. Changed files (this task)

**Backend:**
- New: `functions/backend/util/channel.service.js`, `util/mediaCleanup.js`.
- Changed:
  - `util/uploadGrants.js`, `util/mediaPolicy.js`;
  - `util/cloudflareStorage.service.js` (endpoint override for loopback only);
  - `controllers/client/user.controller.js` (update, detailsOfChannel);
  - `controllers/client/video.controller.js` (createVideo, verifyChannelname, cleanup helper);
  - `controllers/client/file.controller.js`, `controllers/cron.controller.js`;
  - `routes/client/file.route.js`, `routes/client/video.route.js`.

**App:**
- New:
  - `youpeak/lib/core/navigation/root_back.dart`;
  - `core/file_upload/{upload_models,storage_put,storage_put_io,storage_put_web}.dart`.
- Changed:
  - `core/file_upload/{direct_upload_video_api,convert_video_image_api}.dart`;
  - `core/settings/app_settings.dart`, `core/constants/app_constant.dart`;
  - `features/auth/view/{lets_you_in_view,login_view,sign_up_view}.dart`, `features/main/view/main_home_view.dart`;
  - `features/peak_boost/presentation/peak_boost_bottom_sheet.dart`;
  - `features/upload/{api/upload_video_api,controller/upload_video_controller}.dart`, `features/home/view/nav_home_page.dart`;
  - `features/channel/{api/check_channel_name_api,api/create_channel_api,model/channel_home_model,controller/your_channel_controller,view/create_channel_view,view/create_channel_screen,view/your_channel_view}.dart`;
  - `features/profile/model/get_profile_model.dart`.

**Tests:**
- New: `tests/releaseFixes.test.cjs`, `tests/emulator/suites/11-release-fixes.cjs`, `youpeak/test/core/{video_upload_test,root_back_test}.dart`.
- Changed: `tests/media.test.cjs`, `tests/emulator/suites/08-media.cjs`, `youpeak/test/widgets/feature_widgets_test.dart`.

**Local stack:**
- `local-dev/start.js`: Storage emulator, opt-in `LOCAL_FAKE_R2`.
- `local-dev/firebase.json`.
- `local-dev/storage.rules`: a copy, because the emulator needs it inside its own folder.

**Evidence and harness:** `reports/project-audit/web-release/**` and this report.
