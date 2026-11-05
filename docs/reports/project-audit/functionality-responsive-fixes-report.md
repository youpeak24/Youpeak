# YouPeak: functional and responsive-layout fixes

| | |
|---|---|
| Workspace | `E:\Legendary One\youpeak\source`, branch `fix/deploy-readiness`. Nothing committed, pushed or deployed. Earlier tasks' uncommitted work was preserved |
| Dates | 2026-10-08 to 2026-10-09 |
| Evidence | `reports/project-audit/functionality-fixes/`: screenshots, JSON evidence, logs, harness |
| Test environment | Firestore/Auth emulators (`demo-youpeak-audit` for the suites, `demo-youpeak-local` for the browser runs), local API and test-fixture media. No production data was read or written, except for read-only checks that the production client key is embedded in the builds (true/false only, §3.10 and §8) |
| Release candidates | Web: `youpeak/build/web` (main.dart.js sha256 `2b704a07…`). APK: `youpeak/build/app/outputs/flutter-apk/app-release.apk` (sha256 `861c3a43…`). Copies of both are in `E:\Legendary One\youpeak\backups\rc-2026-10-09\` |

## 1. Status at a glance

| # | Issue | Status | One-line result |
|---|---|---|---|
| 1 | Video player controls | **Fixed (web). Android untested on a device** | The web player now has its own mouse, touch and keyboard controls. They were verified in Chrome at 1920, 768 and 390 |
| 2 | Video details page | **Fixed, with gaps** | Likes, dislikes, Watch Later, subscriptions, comments and views now persist and are counted correctly for every viewer, and the page keeps the desktop sidebar. Remaining gaps: comment deletion in the app, and real Peak Boost/payment flows (§3.2) |
| 3 | Starter Pass | **Partial** | Desktop layout, a correct "current level" and rupee prices. The web uses the server-verified checkout. A real Razorpay payment was not run. On Android the "membership portal" link is still a dead URL (DEP-5) |
| 4 | Public upload shown as Premium | **Fixed** | Root cause found in the server feed, the client shelf rule, and upload options carried over from the previous upload. Verified with a second viewer |
| 5 | Earn Rewards + Tasker | **Fixed** | Responsive layout at every browser width. Check-in calendar and streak bugs fixed. The balance difference is explained (§3.5) |
| 6 | Notifications | **Fixed** | Server read state, unread count, correct times, click-through, and a layout for every width. Records are now created for web users too |
| 7 | Upload / Add Details | **Fixed, with gaps** | Preview beside the form; options reset for each upload; schedule takes a date and time in UTC and is enforced and published by the server; "comments off" is enforced by the server. The upload itself was not re-run end to end in this task |
| 8 | Library and child pages | **Fixed** | Your Videos and My Playlist were always empty (response-shape mismatch); both work now. Playlists can be renamed, made public/private and deleted; Watch Later is explicit and always fresh |
| 9 | Search bars | **Fixed. App-side behaviour partly verified** | Typing is debounced and only the newest result is shown; input is encoded; retry on error; special characters, Tamil and private videos are tested on the server |
| 10 | Android release sign-in | **Root cause found; new APK built; device test pending** | The installed release APK was built without the production client key, so every sign-in call got HTTP 401 |

Critical audit findings fixed along the way: **D-01, P-01, PAY-1, WH-1**, plus **CF-01** (High). Still open: §9.

## 2. Mapping: screen → API → server → data

| Screen / action | API | Server change | Firestore |
|---|---|---|---|
| Video page: like / dislike | `POST client/video/likeOrDislikeOfVideo` (explicit action) | `util/engagement.service.js setLikeState`: one transaction | `LikeHistoryOfVideo/<user>_<video>`, `videos.like/dislike` |
| Video page: Watch Later | `POST client/saveToWatchLater/addVideoToWatchLater?action=add\|remove` | `setWatchLater` transaction; a request without `action` keeps the old toggle for older apps | `SaveToWatchLater/<user>_<video>` |
| Video page: subscribe | `POST client/userWiseSubscription/subscribedUnSubscibed?subscribe=true\|false` | Free: `setFreeSubscription`. Paid: `subscribePaid` (debit, credit and record in one transaction) | `UserWiseSubscription/<user>_<channel>`, `users.coin` |
| Video page: comment / reply / delete | `createComment` (+`requestId`), `createCommentReply`, new `DELETE client/videoComment/deleteComment` | Comment policy enforced; idempotent create; atomic reply count; author or video owner may delete | `VideoComment`, `LikeHistoryOfVideoComment` |
| Views and creator earnings | `POST client/watch/heartbeat` (and the legacy `createWatchHistory`) | `util/viewLedger.service.js` | `viewProgress/<user>_<video>`, `WatchHistory/<user>_<video>` |
| Share | Canonical `https://youpeak.app/share?pageRoutes=NormalVideo&id=<id>` | The player loads the video URL from the details, so the media URL is no longer in the link | – |
| Home feeds / Premium shelf | `videosOfHome`, `getVideos`, search, … | Per-video `videoUnlockCost` and `isPaidVideo` | `videos` |
| Upload / schedule | `createVideo`, `modifyVideo` | Options validated; `scheduledPublish.js` | `videos.scheduleType/scheduleTime` |
| Notifications | `getNotificationList`, new `PATCH client/notification/markRead` | Per-user query, `unreadCount`, `hasMore`, relative time | `Notification` (`isRead`) |
| Your Videos / channel tabs | `GET client/user/videosOfChannel` | Response shape the app parses; 1-based pages; owner-only status fields | `videos`, `WatchHistory` |
| My Playlist | `playListsOfChannel`, `newPlayList`, `updatePlayList`, `deletePlayList` | Card shape; validation; atomic `arrayUnion`/`arrayRemove`; owner only | `PlayList` |
| Search | `searchChannelVideoShortsByUser`, `getVideoList?search=` | Literal (escaped) matching; channels only; bounded paging | `videos`, `users` |
| Earn Rewards check-in | `getDailyRewardCoinByUser`, `handleDailyCheckInReward` | One India-time calendar; streak; de-duplicated weekdays | `checkIns`, `dailyrewards` |
| Starter Pass | `GET client/taskerTier/getAvailableTiers`; web purchase: `payment/createOrder` (`tier_upgrade`) → Razorpay → `payment/verify` | `currentLevel`, `canPurchase`, `isIncluded`, `watchHoursRemaining` | `membershipTiers`, `paymentTransactions` |
| Sign-in (all methods) | `POST client/user/login` | Unchanged | – |

## 3. Issue by issue

### 3.1 Video player controls (issue 1)

- **Reproduction (code and local build).** The local change being inspected made the old phone overlay permanently visible on the web. The picture was cropped (`BoxFit.cover`), and a failed load showed an endless spinner. The browser's `<video>` platform view could receive the clicks, and the old overlay toggled only on a tap that never reached it.
- **Root causes.**
  - The overlay depended on Flutter receiving a tap over the `<video>` element.
  - Its sizes came from the phone screen.
  - There was no error state.
- **Fix.**
  - `features/video/widget/web_video_controls.dart` (new, web only). It has a centre play/pause/replay button, a seek bar with the buffered range, elapsed/total time, ±10 s buttons, next video, mute plus a volume slider, a speed menu and fullscreen.
  - The controls hide automatically while playing and always show when paused, ended, buffering or in error.
  - Mouse: hover shows the controls and a click plays or pauses. Touch: a tap shows or hides them and a double tap on either half skips ±10 s. Keyboard: Space/K, ←/→ or J/L, ↑/↓, M, F, Esc.
  - `web/index.html`: `video { pointer-events: none }`, so events reach the controls.
  - `BoxFit.contain` on every platform, so nothing is cropped.
  - The web player is sized to the page width at 16:9.
  - The controller has an error state with **Retry** (`playbackError`, `retryPlayback`).
  - The native Android overlay and the ad logic are unchanged.
- **Watch time.** Seeking cannot add watch time. The client accumulator drops intervals in which the position jumped; muted, background and stalled playback are dropped too. The server bounds credit by wall-clock time, and skipping forward marks the view as skipped. These rules are unchanged; the new controls only call the existing seek API.
- **Verification** (`evidence/video-page-final-{1920,768,390}.json`, screenshots in `screenshots/after/video-*`):

  | Width | Player rect | Click/tap play-pause | +10 s | Mute | Console errors |
  |---|---|---|---|---|---|
  | 1920 | 1213×682 beside the sidebar | toggled | +4.4 s (clip end) | muted, volume 0 | 0 |
  | 768 | 768×432 (16:9) | toggled | +4.5 s | – | 0 |
  | 390 | 390×219 (16:9) | toggled | +1.4 s (clip end) | – | 0 |

  The 6-second test clip ends before a full 10 s skip, which is why the skips are short.
- **Not verified.** Native Android player on a device. Real HLS/R2 media (local fixtures only). Fullscreen in a real browser: headless Chrome accepts the request but there is no visible fullscreen to check.

### 3.2 Video details page (issue 2)

- **Root causes found:**
  1. **CF-01 (High, still open before this task).** Records are written under the model's collection name (`LikeHistoryOfVideo`, `UserWiseSubscription`, `VideoComment`, `WatchHistory`, `SaveToWatchLater`, `PlayList`, …). About 70 feed `$lookup`s and a few direct reads used other spellings (`likehistoryofvideos`, `userWiseSubscriptions`, `playLists`, …). Those were different, empty collections. So every feed and details page showed 0 views, comments and subscribers and false like/subscribed/saved flags, whatever had really happened.
  2. **Fire-and-forget actions with no rollback.** Likes, subscribe and save updated the UI optimistically and ignored the reply. Toggle endpoints meant a retry undid the action. A comment count went up before the server accepted the comment.
  3. **Lost updates.** Like counts were read-modify-write (two users liking at once counted once). A double tap created duplicate like records; a paid subscription double tap could charge twice.
  4. **Comments.** "Comments off" was checked with `=== 2` and missed `"2"`. The comments list crashed whenever a video had comments: the data layer did not support the `let`/`pipeline` `$lookup` form. This was the audit's "comments screen HTTP 500".
  5. **Views.** Rows were never written (the upsert was ignored), so every view count was 0.
  6. **Relative times.** The pipelines' date maths read ISO-string `createdAt` as 0, so feeds said "56 years ago".
  7. The details model parsed fields strictly (`commentType: "2"` made the page unreadable). A failed details or related-videos load spun forever.
  8. **Share links** embedded the raw storage URL. For a paid video that handed out the playback URL.
  9. **"appName" in the tab.** The title was read through `.tr` before the translations loaded. Non-English translations also still said "Me Tube".
  10. **"Large grey right-hand region" on desktop.** The related column showed a full-size "Data not found" illustration or shimmer placeholders. The page also had no sidebar and a 0.8 text scale.
- **Fixes:**
  - Collection names unified in `firestoreDb.normalizeCollectionName`. Nothing in the code or the DB import scripts ever wrote the other spellings; owner check in §10.
  - `engagement.service.js`: transactions with deterministic ids; explicit add/remove and subscribe/unsubscribe.
  - `video_engagement_api.dart` and new controller methods: optimistic change, then the server's state, or a rollback with a message; one request at a time per control.
  - The details page was rewritten (`VideoDetailsUi`):
    - expandable description;
    - action chips (Like, Dislike, Share, Save, Download, Peak Boost, Report);
    - channel row with the subscriber count and Subscribe or "Subscribe · N coins/mo", or **Edit video** for the owner;
    - comments box with policy text ("Comments are turned off");
    - unlock card for locked videos;
    - error and Retry states.
  - Desktop: the page is now inside the sidebar shell.
  - Text renders at 1.0 scale on desktop browser windows; the phone and the Android app keep 0.8.
  - Compact "No related videos yet" and Retry states.
  - Download on the web shows "Offline downloads are available in the YouPeak Android app". The Android download path is unchanged except for error handling.
  - Share uses the canonical link (and copies it on the web).
  - The tab title is the constant "YouPeak"; all 20 `appName` translations now say YouPeak.
- **View policy (documented in `util/viewLedger.service.js`).**
  - One view per signed-in viewer per video.
  - It counts after **30 s of verified playback**, or the whole video if it is shorter.
  - Refreshes, replays and re-renders never add views.
  - The owner's own viewing does not count.
  - Muted, background and >2× playback do not count (the existing heartbeat rules).
- **Cross-user and persistence results** (emulator suite 12 and browser):
  - LK-01: 5 parallel likes from one user give 1 record and a count of 1.
  - LK-02: two users liking at once both count.
  - LK-03: like and dislike are mutually exclusive; removing a like you don't have changes nothing.
  - LK-04: another user sees the shared counts and their own state.
  - LK-05: liking a private video is refused.
  - WL-01: 4 parallel adds give 1 record.
  - SB-01/02/03: repeated subscribes give 1 record; 5 parallel paid subscribes charge once and credit the owner once; insufficient coins charge nothing.
  - CM-01..04: "comments off" stored as `"2"` is refused; a retried `requestId` posts once; held comments are visible only to their author and the owner; a stranger's delete gets 403 and the author's succeeds; parallel replies are all counted.
  - VW-01/02: a view counts once after 30 s; claims faster than real time are refused.
  - TM-01: real relative times.
  - Browser (`evidence/video-actions.json`): like, save, subscribe and comment were written to the server and still showed after a reload; unlike restored the count and deleted the record.
- **Not done:**
  - Comment deletion has a server endpoint (`canDelete` is returned per comment), but the comments sheet has no delete button yet.
  - Comment sorting: the existing server options (top, most liked, newest) were not re-tested in the browser.
  - Peak Boost was not touched (no financial changes).
  - Cross-user checks in the browser used one local account; the second-user checks ran in the emulator suites.

### 3.3 Starter Pass (issue 3)

- **Root causes:**
  - The page was a 600 px phone column.
  - A user with no stored tier saw no "current" level.
  - Prices showed the admin's display currency ("$ 999"), but the tiers are priced and paid in INR.
  - "Upgrade Now" opened the membership portal, which returns 404 (DEP-5).
- **Fixes:**
  - The server returns `currentLevel` (Free = level 1 when nothing is stored), `isIncluded`, `canPurchase` (only paid levels above yours) and `watchHoursRemaining`.
  - The page shows a responsive grid of cards (4 across at 1920), the lifetime-hours progress, "This is your level" / "Included in your current level" / "Upgrade Now · ₹999", "N more watch hours to unlock it free", and a note that rewarded ads are app-only. It has error and Retry states.
  - **Web purchase** uses the same server-verified flow the web app already uses for coins: `createOrder(tier_upgrade)` → Razorpay Checkout → `verify`.
    - The server prices from `membershipTiers` and refuses the same or a lower level.
    - It activates only on a verified, captured payment of that order, once (the existing state machine; repo suite 05 PF-01..12 pass).
    - A cancelled checkout charges nothing. A paid-but-unconfirmed payment shows "We're confirming your payment…"; the webhook completes it.
  - **Android** still opens the portal (store-billing policy unchanged).
  - Paid upgrade **or** watch hours: the server checks either independently (`checkTaskerWatchHourUpgrade`, cumulative lifetime hours 50 / 100 / 200 / 400). The interpretation is unchanged; RC-10 stays open for the owner.
  - The Tasker dashboard reloads when you come back from Starter Pass or Earn Rewards.
- **Verification:** TT-01 (current level and purchasable levels). Browser at 1920/1366/768/390 (`screenshots/final*/starter-pass-*`): ₹ prices, no overflow.
- **Not verified / decision needed:**
  - A real Razorpay order was not created: no local Razorpay keys, and payments are out of scope.
  - **Decision:** the web now offers the in-page checkout for passes, consistent with web coin purchases. The owner should confirm this channel (RC-5), or ask for the portal to be restored.
  - Android pass purchase remains broken until the portal exists (DEP-5).

### 3.4 Public upload shown as Premium (issue 4)

- **Trace:** form (`videoChargeType` 1 = Free) → `createVideo` (`videoPrivacyType` stored as sent) → feed pipelines → `PremiumVideosShelf` → badge.
- **Root causes (three):**
  1. **Feed price inheritance.** Every feed projected the **channel's** `videoUnlockCost` as the video's price. A channel created by its first upload is given 10/10 prices, so all its free videos carried a price.
  2. **Shelf rule.** The shelf listed `videoPrivacyType == 2 || videoUnlockCost > 0`, so every free video of such a channel showed as "Premium Exclusive" with a PREMIUM badge. Playback was **not** restricted; only the label and listing were wrong.
  3. **Options carried over between uploads.** The upload controller lives as long as the main screen, so a previous upload's **Paid** (or Private, schedule, audience, comments) choice silently applied to the next upload.
- **Fixes:**
  - The feeds return a per-video price (0 for free videos) plus `isPaidVideo`.
  - The shelf lists `videoPrivacyType == 2` only.
  - `resetUploadOptions()` runs on every new upload.
  - A paid upload without an unlock price is refused with a message.
  - The "Private" label now matches the server ("Only you can view it", not "Only followers can view"), and no subscription price is demanded for it.
  - Visibility (who can see) and charges (price) stay separate concepts.
- **Verification:**
  - PR-01: a free video from a channel priced at 10 reaches **another viewer** with price 0, not paid, and playable (URL present).
  - PR-02: a paid video keeps its price, is marked paid, and its URL is withheld from a non-buyer.
  - PR-03: the owner sees their own free video as free.
  - Browser `screenshots/final/` home at 390: only "My paid video" is in the Premium shelf; the channel's free videos are not.
- **Production data:** nothing was rewritten. If the rdr2 record itself has `videoPrivacyType: 2` stored (possible through cause 3), it will still show as premium; the owner can switch it to Free in Edit video. Production records were not read.

### 3.5 Earn Rewards and Tasker dashboard (issue 5)

- **Layout.**
  - Earn Rewards uses a new responsive layout (`earn_reward_wide.dart`) at every browser width:
    - balance banner with the exact number (1,490, not "1.49k");
    - check-in card with readable 14 px day tiles (a scrollable strip on phones);
    - "Earn more" list (Referral, Engagement, Starter Pass, Tasker dashboard, Withdraw);
    - the app-only ads note.
  - The Android app keeps its own design.
  - The Tasker dashboard was already two-column. Its problem was the 0.8 text scale, now 1.0 on desktop. It reloads when you return from Earn or Starter Pass.
  - Before: `../web-tasking/screenshots/final/11-earn-1920.png`, `10-tasker-1920.png`. After: `screenshots/final/earn-*`, `tasker-*` and `screenshots/final-fresh/*`.
- **Check-in bugs fixed (server):**
  - The list compared an India-time check-in date with the UTC date, so for 5½ hours a day a done check-in looked open.
  - Only today's check-in counted, so earlier check-ins this week showed "Lost".
  - A broken streak kept showing the old number.
  - The check-in handler depended on the server's clock zone.
  - Duplicate reward-config rows repeated weekdays.
  - The server now returns `date`, `isToday`, `isPast` and `checkedInToday`, and the app uses them instead of the device date. Covered by CK-01.
- **Rewards.** Rewards stay server-decided, capped, deduplicated per video, and safe across parallel tabs and app plus web (existing suites 07 and 10 pass unchanged). Browser ad claims stay disabled; `AdReward` was not renamed.
- **1.49k vs 1,385.** Both screens show the same field (`users.coin`) from the same server value. The difference is **when each screen loaded**: each fetched once on open, with no refresh on return. Earn Rewards also **abbreviates** (1.49k means 1,485–1,494). The two screenshots therefore show two different moments, about 100 coins apart, roughly one like/comment reward or a check-in. Both screens now refresh on return and the desktop shows the exact number. It was not a ledger inconsistency.

### 3.6 Notifications (issue 6)

- **Root causes:**
  - Notification records were written only after a successful push, so web users (no push token) never had any.
  - Times read " hours ago" (unsupported `$dateDiff`).
  - There was no read state and no click action.
  - The whole collection was aggregated per request.
  - The page refetched on every rebuild (each window resize).
  - Scheduled and private uploads would have been announced.
- **Fixes:**
  - `videoNotifications.js`: an in-app record for every subscriber (deterministic id, one per subscriber per video). Only publicly listed videos are announced; scheduled ones are announced when they go live.
  - Per-user query; `isRead` and `unreadCount`; `PATCH markRead` (one or all, own records only).
  - Clearing an already empty list is not an error.
  - App: unread dot and bold text, "N new" chip, **Mark all read**, open → marks read and opens the video (the video page checks access).
  - Loads once per visit. Genuine empty state vs. load error with Retry was already in place and is kept.
  - Desktop header and list sizing.
- **Verification:** NT-01 (scoped list, real relative times, mark-read persists, can't mark another user's, another user's list → 403). SC-02 (one notification when a scheduled video goes live). Browser populated and empty states (`screenshots/populated/notifications-*`, `final/notifications-*`).

### 3.7 Upload video / Add Details (issue 7)

- **Layout.** Desktop shows the preview (16:9, not cropped) beside the details form (`screenshots/final/upload-form-*`). Phones keep one column.
- **Behaviour.** Options reset for each upload (§3.4).
- **Schedule** is now a date **and time** picker, shown with the timezone and sent as UTC ISO.
  - Before, a bare date was read as midnight UTC.
  - The server validates it: future (at least 1 min ahead; the app asks for at least 5 min), at most a year ahead; a bare date from older apps means midnight India time.
  - The video stays owner-only until then.
  - `scheduledPublish.js` publishes due videos (a transaction, so the flip happens once). It runs throttled to once a minute before video API responses, and in the daily cron. Before this, **nothing ever published a scheduled video**.
- **Options validation:** visibility 1–3, audience 1–3, comments 1–4, charges 1–2, all stored as numbers.
- **Comment policy** is enforced by the server:
  - 2 = off;
  - 4 = hold all (visible to the author and owner only);
  - 3 = the existing keyword screen.
  - There is no approval screen for held comments yet; that product gap is documented.
- **Unchanged from the earlier task:** direct-to-R2 upload with progress, cancel, retry, duplicate-publish protection and abandoned-upload cleanup. No large bodies go through Vercel and no credentials reach the client.
- **Tests:** SC-01 and SC-02 cover the schedule. The upload itself was **not** re-run end to end with the fake R2 in this task (the earlier report's E5–E8 cover it). "Successful navigation after publishing" means: the form closes immediately, and the Home banner shows progress and success.

### 3.8 Library and child pages (issue 8)

- **Root causes:**
  - **Your Videos** (and the channel's Videos/Bites tabs) were always empty: the server returned `video` while the app reads `videosTypeWiseOfChannel`.
  - **My Playlist** was always empty: `playList` vs `playListsOfChannel`, and the cards' count and thumbnail fields were missing.
  - Every channel list treated the app's page number as an item offset, so page 1 skipped the first item.
  - New Playlist required a channel.
  - The Watch Later list "removed" by calling the add/toggle endpoint.
  - My Playlist loaded twice per visit (duplicate cards).
  - Removing videos from a playlist silently did nothing (`$pull` with `$in`).
  - Playlist-name validation was missing, and adding someone else's private video was allowed.
- **Fixes:**
  - Shapes and 1-based paging fixed.
  - Owner-only status chips: Scheduled with time, Private, Unlisted, Paid, Under review.
  - Playlist controller rewritten: name 1–100 characters, Private/Public, only videos you can open, atomic add/remove, owner-only rename/privacy/delete, deleting twice is fine.
  - Playlist menu (Rename, Make public/private, Delete with confirmation).
  - Playlists for every signed-in user.
  - Watch Later reloads on open and removes explicitly.
  - Your Videos keeps its existing edit and delete. Delete is now persisted before the reply, and also deletes the R2 and Firebase media.
- **Verification:** PL-01, PL-02, CL-01, CL-02, DL-04, DL-05. Browser, populated (`screenshots/populated/*`, `final-fresh/*`): Your Videos with status chips, My Playlist with public/private and counts (no duplicates after the fix), Watch Later, and fresh sessions at 390 and 768. No overflow; no console errors.
- **Not supported (not added):** reordering a playlist. Playlist playback uses the existing Next behaviour.

### 3.9 Search bars (issue 9)

- **Inventory:**
  1. **Main search** (`SearchView`, sidebar or header): channels, videos and Bites.
  2. **"Add videos" picker when creating a playlist** (`getVideoList?search=`).
  3. Search history: local only.
  4. The upload form's location field is a country picker, not a server search.
- **Root causes:**
  - The query was sent unencoded (`C++` arrived as `C  `; `&` and `#` broke the request).
  - The server compiled user text as a regular expression (errors, and catastrophic backtracking on crafted input).
  - A request was sent per keystroke, and a late answer could overwrite a newer one.
  - A failed request left an endless loader.
  - There was no clear button, and Enter only saved history.
  - Channel search returned accounts without channels.
  - `searchChannel` loaded every user and returned raw user documents (P-01).
- **Fixes:**
  - Encoded query parameters; server-side literal matching (`escapeRegex`, 100-character cap).
  - Whitespace-only is an empty query.
  - Debounce of 350 ms; Enter and the search key search at once; clear (×).
  - A sequence number drops stale answers, and "load more" ignores pages for an old query.
  - Error state with Retry.
  - Channels only (active, not blocked), public fields only, page size capped at 50.
- **Verification:**
  - SR-01: `C++`, `(`, `[`, `?` and `\` return 200; Tamil found; `C++` matched literally; whitespace gives `EMPTY_QUERY`; private videos never appear.
  - SR-02: the playlist picker accepts the same characters.
  - P1-02: channel results contain no private fields.
  - **App-side debounce and stale-answer logic were reviewed but not exercised by an automated test.** The browser harness could not type into Flutter's search field in that run (`screenshots/final/search-*` shows the history view).
- **Limitation:** search still scans the matching collections on the server, because Firestore has no substring index. It is bounded by type and page, but large catalogues need a search index (e.g. Algolia/Typesense). Nothing is loaded into the browser for searching.

### 3.10 Android release sign-in (issue 10)

- **Trace:**
  - App flow: `GoogleSignInFlow` → Firebase Google sign-in on the phone → `SignUpApi` → `POST client/user/login` with the ID token → custom-token session.
  - The message "We could not verify your Google sign-in" appears **only after Google succeeded**, when `client/user/login` gave no user.
- **Evidence (no secrets printed):**
  - The release APK's signing certificate, SHA-1 `36e05d07…`, **is registered** on the Firebase Android OAuth client in `google-services.json` (package `com.YouPeak.Live1`, project `youpeak-9ff65`). Google's own step can therefore succeed.
  - The APK targets `https://api.youpeak.app/` and contains no local hosts.
  - **The production client key (`secretKey` on Vercel `youpeak`) is NOT embedded in the Oct 7 release APK.** Checked with `vercel env run` and a script that prints only true/false.
  - The same check against the live web bundle returns true, which validates the method.
- **Root cause.** The APK was built with a different or empty client key. Every call guarded by the shared key, `client/user/login` included, returns **401**, and the app showed the generic Google message. **Password and phone sign-in fail the same way**, because they finish through the same login endpoint.
- **Fixes:**
  - A **new release APK** was built with the repo's secure helper (`scripts/build-consumer-apk.ps1`). The key was injected from Vercel production for the duration of the build only, never printed or written to disk.
  - Verified: production key embedded = true; production API; no local hosts or dev key; signed with the same certificate (SHA-1 `36e05d07…`, SHA-256 `50c0a130…`).
  - The app now names the real cause: on 401, "This version of the YouPeak app can't connect to YouPeak right now. Please install the latest version." It also distinguishes a server error from a network error, for all sign-in methods.
  - The old APK is kept in `backups/pre-functionality-fixes-2026-10-09/` for reference.
- **Pending (owner, real device).** No device or real Google account was available. Steps in §10.

## 4. Critical audit findings handled in this task

| Finding | What was done | Test |
|---|---|---|
| **D-01**: operators dropped, so filters became whole-collection | `util/queryMatcher.js`: full evaluation of `$in/$nin/$ne/$gt…/$regex/$exists/$or/$and/$nor/$elemMatch/…`. Unsupported operators **throw**. Lookups by id list go through document paths. `findOne` and `updateOne` honour every condition (before, `updateOne({_id, userId})` could modify someone else's document). Bulk delete/update refuse an empty filter. Array fields use `array-contains`. `$pull` with `$in` works. Skip/limit apply after filtering | DL-01…05 |
| **P-01**: raw user documents in public endpoints | `aboutOfChannel` and `searchChannel` return whitelisted public fields. A client-router filter (`stripSensitiveFields`) removes credentials, push tokens, device ids and IPs from **every** response, and others' e-mail, phone and location | P1-01, P1-02 |
| **P-02**: guessable / colliding ids | New documents get random 24-hex ids. `Date.now()` made two documents created in the same millisecond share an id, so the second **overwrote** the first (found by CM-04) | CM-04 |
| **PAY-1**: unverified fulfilment endpoints | `createCoinPlanHistory`, `processRazorpayPayment` and `premiumPlan/createHistory` answer **410** before any logic. The current app no longer calls them | PY-01, AUTH-01 |
| **WH-1**: creator earnings minted by repeated calls | `createWatchHistory` no longer trusts the client's playhead. Earnings come only from server-verified viewing (`viewLedger`): each verified second paid once, persisted before the reply, at the existing `earningPerHour` rate and 40% threshold | WH-01, WH-02, VW-01/02 |
| **CF-01** (High): split collection names | Unified (§3.2) | LK-04, SB-01, WL-01, CM-02, VW-01 |
| Comments 500 | `let`/`pipeline` `$lookup` and `$expr` supported | CM-02/03 |

## 5. Tests and builds (final code)

| Check | Result | Log |
|---|---|---|
| Backend unit tests | **33/33** | `logs/node-test.txt` |
| Emulator suites (12; new suite 12 has 40 checks) | Final run **171/171**. Earlier runs during the work: 131/131 → 124/131 → 63/63 (3 suites) → 167/170 → 170/170 → 171/171. Each failure was fixed or the test was corrected; see the note below | `logs/emulator-full-{1,2,3}.log` |
| Flutter tests | **134/134** (9 new) | `logs/flutter-test.txt` |
| Flutter analyzer | **0 errors**, 82 warnings (baseline 83) | `logs/flutter-analyze.txt` |
| Backend module load (`npm run check`) | OK | – |
| Production web build (release helper, production key) | Built; production key embedded, production API, no local hosts or key material, title "YouPeak" | `logs/build-prod-web.log` |
| Release APK (release helper, production key) | Built; verified (§3.10) | `logs/build-release-apk.log` |
| Browser routes, 11 routes × 1920/1366/768/390 | All reached; sidebar at ≥1366; **no horizontal overflow; 0 console errors** in the final runs | `evidence/routes-*.json`, `screenshots/final/`, `final-fresh/`, `populated/` |
| Browser video actions | Like, save, subscribe and comment persisted and survived a reload; unlike reverted | `evidence/video-actions.json` |

**Note on the intermediate emulator failures:**
- Existing tests seeded non-canonical collection names (`playLists`) and video documents without `scheduleType`/`visibilityType`. Those were updated to realistic data.
- AUTH-01 expected 401 from a now-retired endpoint; it now expects 410.
- WEB-08 timing: the view ledger was moved after the reward claim.
- The real bugs found by the new checks (query reads in transactions under contention, colliding ids, duplicate weekdays, owner fields leaking) were fixed.
- PB-06 (the known emulator timeout from the previous report) did not recur in the final runs.

**Screenshot caveat.** Phone and tablet captures taken by **resizing** a desktop session can show legacy phone layouts at the pre-resize size, because they read the window size at first build. The authoritative 390 and 768 captures are therefore the **fresh-session** ones in `screenshots/final-fresh/`. One uncaught page error was logged once at 390, together with `net::ERR_NETWORK_CHANGED`; it did not reproduce in two reruns.

## 6. Changed files (this task)

- **Backend, new:**
  - `util/queryMatcher.js`, `util/engagement.service.js`, `util/viewLedger.service.js`, `util/scheduledPublish.js`, `util/videoNotifications.js`;
  - `middleware/stripSensitiveFields.js`, `middleware/retiredPaymentEndpoint.js`.
- **Backend, changed:**
  - `util/firestoreDb.service.js`, `util/mongooseShim.js`, `util/safeUser.js`;
  - `controllers/client/{video,videoComment,userWiseSubscription,saveToWatchLater,watchHistory,watchSession,notification,user,playLIst,dailyRewardCoin,taskerTier}.controller.js`, `controllers/cron.controller.js`;
  - `routes/client/{index,video,videoComment,notification,coinplan,premiumPlan}.route.js`.
- **App, new:**
  - `features/video/widget/web_video_controls.dart`, `features/video/api/video_engagement_api.dart`;
  - `features/rewards/view/earn_reward_wide.dart`, `features/playlist/api/playlist_manage_api.dart`.
- **App, changed:**
  - `main.dart` (title, desktop text scale, shell routes);
  - `features/video/{view/normal_video_details_view,controller/normal_video_details_controller,model/video_details_model}.dart`;
  - `features/main/view/wide_side_nav.dart`;
  - `features/rewards/{view/earn_reward_view,controller/earn_reward_controller,model/get_daily_reward_model}.dart`;
  - `features/tiers/view/tasker_tier_view.dart`, `features/tasker/presentation/tasker_dashboard_view.dart`;
  - `features/notifications/{view,controller,api,model}/*`;
  - `features/upload/{view/upload_video_view,view/visibility_page,controller/upload_video_controller}.dart`;
  - `features/library/{view/nav_library_page,view/watch_later_view,view/your_video_page,api/create_watch_later_api,controller/nav_library_controller}.dart`;
  - `features/channel/{view/get_playList_page,controller/get_play_list_controller,model/get_channel_video_model}.dart`;
  - `features/playlist/api/play_list_get_with_search_api.dart`;
  - `features/search/{api,controller,view}/*`;
  - `features/home/widget/premium_videos_shelf.dart`;
  - `features/auth/api/sign_up_api.dart`;
  - `core/deep_link/services/deep_link_services.dart`, `shared/widgets/common_share.dart`;
  - `core/localization/languages/*.dart` (`appName` only);
  - `web/index.html`.
- **Tests:** new `tests/emulator/suites/12-functionality-fixes.cjs` and `youpeak/test/features/functionality_fixes_test.dart`; updated `tests/emulator/suites/03-privacy-auth.cjs` and `10-web-tasking.cjs`.
- **Evidence and harness:** `reports/project-audit/functionality-fixes/**`.

## 7. Multi-user, concurrency, retry and persistence summary

| Concern | Result |
|---|---|
| Two users liking at once | Both counted (LK-02) |
| Double tap or retry: like, save, subscribe, comment, playlist, paid subscription | One record or charge each (LK-01, WL-01, SB-01/02, CM-02, PL-01: a true create race can leave at most one duplicate playlist with the same name) |
| Timeout whose operation succeeded | Explicit-state endpoints make a retry a no-op. The UI shows the server's reply or rolls back with a message |
| Another viewer sees the change | Through the next details/feed load (refetch on open). No new realtime listeners were added |
| Refresh / later login | State comes from the server (browser reload check) |
| Views | One per viewer per video, after verified playback |
| Free vs. paid visibility for another viewer | PR-01/02 |

## 8. Release candidate and rollback

- **Web** (`youpeak-web`): `youpeak/build/web`, main.dart.js `2b704a07…`, built with the production key and verified. Copy: `backups/rc-2026-10-09/consumer-web-rc`.
  - Previous production bundle: `99a1c0b0…`, in `backups/pre-functionality-fixes-2026-10-09/consumer-web-build`.
  - Rollback: promote the previous deployment (`youpeak-2qxk059ih`, per the last report) or redeploy that backup.
- **API / admin** (`youpeak`): the working-tree backend. Deploy together with the web build. The new web calls `markRead`, `deleteComment` and the explicit-action parameters; the older app keeps working with the toggle fallbacks.
  - Rollback: promote the previous deployment (`youpeak-92mqnl49s`). New data written meanwhile (deterministic engagement ids, `viewProgress`, `isRead`, `channelNames`) is ignored by older code.
- **APK:** `app-release.apk` `861c3a43…`, copy in `backups/rc-2026-10-09/`. Same signing key as before, so it updates the installed app in place.
- **Configuration:** nothing in production was changed. `.env.local` and the project links are unchanged; key material is not on disk.

## 9. Still open (known)

- **SEC-1:** exposed service-account key and secrets in git history. Needs coordinated rotation; not touched.
- **DEP-5:** membership portal 404, so passes can't be bought from Android (§3.3). **DEP-4/PAY-5:** webhook secret.
- **PAY-4, XSS-1, the partner and franchise findings, AD-4 payouts:** not in this task's flows; unchanged.
- The Firestore aggregate layer still loads whole collections for many feeds (performance at scale). Search has no index.
- **Production Firestore rules** may differ from the repo (seen earlier); not compared (no authorized access in this task).
- Rewarded ads on the web remain disabled (no server-verifiable completion). `AdReward` vs `adrewards` is unchanged.
- Product decisions:
  - in-page web checkout for passes (§3.3);
  - approval screen for held comments;
  - comment delete button in the sheet;
  - playlist reordering;
  - RC-10 watch-hour interpretation (cumulative lifetime is what the code does).

## 10. Owner actions

1. **Before deploying the backend,** confirm the collection-name unification is safe. Run the **read-only** count script (it prints counts only):
   `npx vercel env run -e production -- node reports/project-audit/functionality-fixes/harness/prod-collection-counts.cjs`.
   If any old spelling (`watchhistories`, `playLists`, `userWiseSubscriptions`, …) has documents, tell me before deploying; those records would no longer be counted.
2. **Android sign-in:**
   1. Uninstall the current YouPeak build, or install over it (same signing key).
   2. Install `backups/rc-2026-10-09/app-release-rc-2026-10-09.apk`.
   3. Test Google sign-in with a new account and an existing one.
   4. Cancel the Google picker once, then try again.
   5. Log out and log in again.
   6. Force-stop and reopen the app (the session should restore).
   7. Repeat with password and phone sign-in.
   - If the app is distributed through **Play** with Play App Signing, also add the **Play app-signing SHA-1/SHA-256** to Firebase → Project settings → Android app `com.YouPeak.Live1`. Then download a fresh `google-services.json` and rebuild.
3. **Deploy:** backend and admin (`youpeak`), then the web build (`youpeak-web`), when you authorize it. Then smoke-test the video page, a like on two accounts, Earn Rewards and Notifications on youpeak.app.
4. **Decide:** the web pass checkout (§3.3) and the portal for Android (DEP-5).
5. **Data:** if the rdr2 upload still shows Premium after the deploy, open it in Edit video and set Charges to Free. Its stored value may be Paid (§3.4).
