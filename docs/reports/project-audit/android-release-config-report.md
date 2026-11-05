# Android release build configuration — root cause and safeguards

**Date:** 13 Oct 2026 · **Branch:** `fix/deploy-readiness`, uncommitted (all existing uncommitted changes preserved)

Nothing was committed, pushed or redeployed. No production setting was changed, no payment was made and no video was published. The backend and its authentication are untouched.

## 1. Result

| | |
|---|---|
| **Distributable APK** | `E:\Legendary One\youpeak\source\youpeak\build\release\android\youpeak-1.1.2+2-production-20261013-061243-g894b2f4e-s5800f364.apk` |
| **Copy** | `E:\Legendary One\youpeak\backups\rc-android-release-2026-10-13\` (APK + manifest + `.sha256`) |
| **SHA-256** | `971b193bf358a149ee81e0bae9d46da8eab5148c8d9cc6fc99761c1088bb10de` |
| Build ID | `20261013-061243-g894b2f4e-s5800f364` (UTC time, git commit, code-and-config fingerprint) |
| Version | 1.1.2, code 2 (unchanged, so it updates the installed app in place) |
| Signing certificate | SHA-256 `50c0a130de3be10a296b85520ff2c270c0c070642723372e564e7ed9a0c0f986` · SHA-1 `36e05d07096a1e4b444691e01f9ae043f2cfca06`, identical to the installed release |
| API origin | `https://api.youpeak.app/` |
| **On the phone** | **Not installed. The phone was not connected (`adb devices` empty). Device verification is pending.** |

## 2. Root cause

**Confirmed**

- The APK you installed (`1d32f135…`) is the file at the standard Flutter output path, written **16:30:56 IST on 12 Oct**, after my 15:08 install. Verified with the new verifier: signed with the correct release certificate, correct application id, not debuggable, production API origin compiled in, **but the current production client key is not compiled in** (a true/false check; the value was never printed).
- That API key is `String.fromEnvironment("API_SECRET_KEY", defaultValue: "")`. A release build made without it is **silently produced** with an empty key, and the backend then answers 401 to every key-gated request (login, settings, translations). That matches the 401s in the production log at 17:11 IST.
- Nothing stopped such a build: `android/app/build.gradle` had no check, and the only validation lived in the helper, which a direct `flutter build apk --release` bypasses. The helper and a plain build also wrote to the **same path** (`build/app/outputs/flutter-apk/app-release.apk`), so one overwrote the other with nothing to tell them apart (same version `1.1.2+2`, same name).
- Gradle also fell back to the **debug signing key** when `android/key.properties` was missing, a second way to get an unusable "release".

**Checked and ruled out**

- No persistent `YOUPEAK_API_SECRET_KEY` / `API_SECRET_KEY` / `secretKey` environment variable at user or machine scope (so the helper cannot have picked up a stale one).
- No `dart-defines` in `android/gradle.properties`, `android/local.properties` or `~/.gradle/gradle.properties`.
- No IDE task, launch config or CI workflow existed in the repository that builds a release.

**Assumption (not provable from the evidence)**

- Who ran the build, and how. The helper throws on an empty key, so it cannot have produced an empty-key APK. The most consistent explanation is a direct `flutter build apk --release` (terminal or IDE) with no defines. I did not read your shell history. The APK does not reveal whether its key was empty or a different value, only that it is not the current one.

## 3. Safeguards added

| Layer | File | What it does |
|---|---|---|
| Build time, **every** release build | `youpeak/android/app/build.gradle` (`validateReleaseConfig`) | Fails `flutter build apk/appbundle --release`, `flutter run --release` and any IDE release build **before the Dart compile starts**, unless `BUILD_PROFILE` is `production` or `development`, the client key is present and plausible, the API is https and non-local (production) or local-only (development), local-dev switches are off, and release signing exists (production). It also deletes a stale `app-release.apk` when it refuses. The key is never printed. |
| Run time, **every platform** | `youpeak/lib/core/config/build_config.dart`, `main.dart` | A release app with the same problems shows "This build can't start" and makes no API calls, instead of failing later as 401. Debug runs are not affected. Covers web/iOS, where Gradle is not involved. |
| Release helper | `scripts/build-consumer-apk.ps1` | Refuses before building (key, signing, origin allow-list). Deletes the previous flutter output, moves earlier artifacts into `superseded/`, builds with a unique `BUILD_ID`, verifies the result, then names the APK and writes a manifest. A build that fails verification leaves **no** installable file. |
| Verifier | `scripts/verify-android-apk.ps1` | Standalone, works on any APK. Checks signature, pinned certificate, application id, debuggable flag, API origin, no local hosts, key compiled in (true/false only) and the build id. |
| Release identity | `scripts/android-release.json` | Non-secret pin: application id, allowed API origins, signing certificate fingerprints. |
| Web build | `scripts/build-consumer-web.ps1` | Now declares `BUILD_PROFILE=production` and a build id, so the web release still starts. |
| Docs / IDE | `DEPLOYMENT.md` §5, `local-dev/README.md`, `.vscode/tasks.json` | One documented command. `.vscode/` is git-ignored in this repository, so the tasks file is local only. |

**Development builds are still supported**: `flutter run` (debug) needs nothing extra; a release-*mode* emulator build uses `scripts/build-consumer-apk.ps1 -Development` or `--dart-define=BUILD_PROFILE=development`, is accepted only against a local API, and is named `...-NOT-FOR-DISTRIBUTION.apk` with `distributable: false`.

**Not done on purpose:** the key is not hardcoded or committed, and no server credential can enter the APK (a key containing `PRIVATE KEY` or starting with `{` is rejected by all three layers). Backend authentication was not changed.

## 4. Supported release command

From `E:\Legendary One\youpeak\source`:

```powershell
npx vercel env run -e production -- powershell -ExecutionPolicy Bypass -File scripts/build-consumer-apk.ps1
```

Output: `youpeak\build\release\android\youpeak-<version>+<code>-production-<buildId>.apk`, `.manifest.json`, `.apk.sha256`. **Install only an APK that has a manifest.** To check any APK you were handed:

```powershell
npx vercel env run -e production -- powershell -File scripts\verify-android-apk.ps1 -Apk <path>
```

Without the production environment the key check reports "not checked", which is **not** a pass.

## 5. Verification

| Check | Result | Evidence |
|---|---|---|
| The installed APK is detected as unusable | FAIL on the key check only; all else passes | verifier output (§2) |
| **Missing configuration fails a release build** | **Yes**, 8 of 8 | `android-release-config/logs/negative-*.log` |
| Correct configuration produces a successful release | **Yes** (helper, from the current working tree) | `logs/production-build-final.log` |
| Production client key embedded | **true** (every ABI) | manifest, verifier |
| API origin | `https://api.youpeak.app/` compiled in | manifest, verifier |
| Development / emulator mode disabled | `USE_LOCAL_DEV=false`, emulator defines empty, no local hosts compiled in | build defines, manifest, verifier |
| Signing matches the installed release | Same certificate as the Oct 10/12 releases | manifest `matchesReleasePin: true` |
| Artifact hash equals its manifest | true | independent check |
| Key value absent from manifest and saved logs | true | scanned under `vercel env run` |
| Flutter tests | **178/178** (10 new: `build_config_test.dart`, `sign_in_rejected_test.dart`) | `logs/flutter-test.txt` |
| Flutter analyze | **0 errors**, 82 warnings (pre-existing) | `logs/flutter-analyze.txt` |

The eight refused builds:

| # | Build | Refused because |
|---|---|---|
| 1 | plain `flutter build apk --release` (no defines) | `BUILD_PROFILE` not set; stale APK removed |
| 2 | production profile, no key | key missing, would be 401 |
| 3 | production, API `http://10.0.2.2:5055/` | not an https origin |
| 4 | production, `USE_LOCAL_DEV=true` + emulator define | local switches in production |
| 5 | development profile, production API | development may only target a local API |
| 6 | production with the local dev key | dev key not allowed |
| 7 | production with a private-key-like value | credential, not a client key |
| 8 | production, `key.properties` absent (renamed, then restored) | release signing not configured |

Along the way I found and fixed two mistakes of my own in the first version of the Gradle guard (an unterminated string and a regular expression that would have flagged any key containing the letter "s"). The negative runs above are what caught them.

## 6. Things to know

- **The rejected APK** was copied to `backups\rejected-no-production-key-2026-10-12\` (named `...NO-PRODUCTION-KEY-DO-NOT-INSTALL.apk`) before the guard removed it from the output path.
- **Earlier artifacts:** two verified runs from the same source fingerprint (`...123541...`, `...052039...`) are in `build/release/android/superseded/`. They are not the current result; the helper now does this on every run.
- **This does not prove the app works end to end.** It fixes only the build configuration, so settings, translations and login are no longer rejected for a missing key. The channel and upload fixes from the previous task still depend on a backend deployment, and none of the signed-in flows have been exercised on the phone.
- **Version is unchanged (1.1.2 code 2).** Builds are told apart by build id, manifest and hash, not by version number.
- **Warnings** in `main.dart` (two unused imports) are pre-existing.

## 7. Pending (needs the phone)

1. Connect the phone (USB debugging on).
2. I install over the existing app without clearing data (`adb install -r`), compare the installed hash with the manifest, and confirm in the production log that settings and translations return 200 instead of 401.
3. **You** enter your own credentials to sign in. I will not request or extract them.

## 8. Follow-up: "login not working in the app and on the website" (13 Oct)

The screenshot you sent is a **debug run from source** (`localhost:65308`, `flutter run -d chrome`) calling the production API. Google's popup succeeded, then `POST https://api.youpeak.app/client/user/login` returned **401** and the app said "install the latest version".

| Finding | Evidence |
|---|---|
| Same root cause as the APK: no client key compiled in | A plain `flutter run` has `API_SECRET_KEY=""`; the release guard deliberately does not check debug runs |
| The production backend is healthy | Key-gated routes with the production key: login 200, `/client/setting` 200, translations 200. With no key, or the local dev key: **401** on all three |
| The live website carries the correct key | `www.youpeak.app/main.dart.js` (sha256 `99a1c0b0…`) embeds the current production key (true/false check) |
| My earlier docs were wrong | They said a debug `flutter run` "needs no extra settings"; that is false when it talks to the production API. Corrected in `DEPLOYMENT.md` §5 and `local-dev/README.md` |
| The unattributed browser 401s in the earlier log (15:24 IST) | Consistent with this: a browser run at localhost with no key. Not proven |

### What changed

- **`scripts/run-web-dev.ps1`** (new): runs the app from source with the key supplied from the environment (temporary defines file, never printed). `-Local` targets the local stack; `-Device <id>` runs on Android. A run without a key is refused with an explanation.
- **Message:** a 401 on login now says whether the build has no key at all or an out-of-date one, instead of always "install the latest version" (`sign_up_api.dart`, test `sign_in_rejected_test.dart`).
- **IDE task:** "YouPeak: run web from source (production API, with key)" in `.vscode/tasks.json` (local only: `.vscode/` is git-ignored here).

### Verified

- A **profile-mode** web build made with the script's mechanism, loaded in a real browser: `/client/setting` and `/client/translation/revealLatestVersion` were sent with the correct key and returned **200** (the same requests in your screenshot's run returned 401). The output was a scratch folder, deleted afterwards.
- The `flutter run -d web-server` debug variant starts and serves with the key supplied (log in `logs/run-web-dev.log`), but a headless browser never got past its loading splash in the time allowed, so the 200s above come from the profile build.
- **Not verified:** a real sign-in. I did not use your credentials, and a made-up account is rejected by Firebase before the backend is called, so it cannot exercise the login route. The 401 you saw is the key gate, which is shown fixed; whatever happens after the gate (Google verification, account lookup) was not exercised.

### What this means for you

- **Running from source:** use `scripts/run-web-dev.ps1` (or the VS Code task) instead of `flutter run`.
- **The phone app:** install the APK above (built from this final tree); the one on the phone is still the key-less `1d32f135…`.
- **The live website:** nothing to fix for the key. If real users still cannot sign in there, the next step is a real sign-in observed with its production log lines, which needs you to perform it with your own account.
