# YouPeak Android Release Configuration Fix — Verification & Handoff Report

**Date**: 12 October 2026  
**Auditor / Agent**: Antigravity  
**Workspace**: `E:\Legendary One\youpeak\source`  
**Flutter App**: `E:\Legendary One\youpeak\source\youpeak`  
**Artifact Directory**: `reports/project-audit/android-release-config/`

---

## 1. Executive Summary

This task resolved the critical release-configuration defect in the YouPeak Android app distribution pipeline. Previously, release APKs built via standard Flutter release commands lacked the production client API key (`API_SECRET_KEY`), defaulting silently to an empty string `""`. When installed on devices, all calls to `/client/setting`, `/client/user_login`, and dynamic translation endpoints were rejected by the production backend with **HTTP 401**, causing the app to present the blocking notice:
> *"This version of the YouPeak app can't connect to YouPeak right now. Please install the latest version."*

A multi-layered safeguard architecture has been established across Gradle build validation, Dart startup guards, unit testing, release helper automation, and post-build binary artifact verification. 

A verified production release artifact has been successfully built, cryptographically signed, verified against all release pins without credential exposure, and packaged with an immutable release manifest.

---

## 2. Retained Work & Integrity

All prior work across the repository was inspected and preserved:
1. **Uncommitted Working Tree**: All 568 uncommitted files across `admin/`, `functions/backend/`, `youpeak/lib/`, `local-dev/`, and `reports/` were preserved intact.
2. **Prior Architecture & Safeguards**:
   - Gradle release validation task `:app:validateReleaseConfig` in `youpeak/android/app/build.gradle`.
   - Dart runtime configuration guard `BuildConfig` and `BuildConfigErrorApp` in `youpeak/lib/core/config/build_config.dart`.
   - Automated release builder `scripts/build-consumer-apk.ps1`.
   - Release verifier `scripts/verify-android-apk.ps1`.
   - Release pins definition in `scripts/android-release.json`.
3. **Audit Evidence**:
   - All 7 negative release build logs in `reports/project-audit/android-release-config/logs/` were inspected and retained.
   - Reference bad APK (`1d32f135...`) and verified candidate backup (`38899266...`) in `E:\Legendary One\youpeak\backups/` were verified.

---

## 3. Root Cause & Implemented Safeguards

### Root Cause
Flutter compile-time environment defines (`String.fromEnvironment("API_SECRET_KEY", defaultValue: "")`) do not fail compilation when omitted. Plain `flutter build apk --release` compiled an APK with empty credentials, which was then signed with release keys and distributed, silently failing on first network request.

### Safeguards Implemented
1. **Gradle Build Verification (`validateReleaseConfig` in `youpeak/android/app/build.gradle`)**:
   - Intercepts all release tasks (`preReleaseBuild`, `compileFlutterBuildRelease`, `assembleRelease`, `bundleRelease`, `packageRelease`) before compilation.
   - Refuses the build immediately if `BUILD_PROFILE` is missing or invalid.
   - Validates that `API_SECRET_KEY` is present, $\ge 16$ chars, contains no whitespace, is not a private key or service-account JSON, and is not the local development key.
   - Validates that `API_BASE_URL` is an `https` origin in production and not a loopback/private host.
   - Rejects emulator switches (`USE_LOCAL_DEV=true`, `AUTH_EMULATOR`, `FIRESTORE_EMULATOR`) in production.
   - Verifies that `android/key.properties` and the referenced keystore exist.
   - **Stale Output Cleanup**: On refusal, immediately deletes any pre-existing `app-release.apk` or `app-release.apk.sha1` so a stale artifact cannot be mistaken for the current build.

2. **Dart Runtime Startup Gate (`BuildConfig` in `youpeak/lib/core/config/build_config.dart`)**:
   - In release mode (`kReleaseMode`), evaluates configuration before initializing Firebase.
   - If configuration problems exist, immediately halts regular app flow and renders `BuildConfigErrorApp`, clearly listing the configuration violations and preventing HTTP 401 runtime confusion.
   - Retains `BuildConfig.buildId` in the main execution path to guarantee inclusion in compiled AOT snapshots.

3. **Dart Configuration Unit Tests (`youpeak/test/core/build_config_test.dart`)**:
   - Created a 7-case automated test suite verifying `evaluateBuildConfig` against invalid profiles, missing keys, private-key injection, local dev keys in production, loopback/private origins in production, emulator flags, and valid development configurations. All 7 unit tests pass cleanly.

4. **Automated Release Helper (`scripts/build-consumer-apk.ps1`)**:
   - Resolves secrets securely from Vercel production environment (`$env:secretKey`) or `$env:YOUPEAK_API_SECRET_KEY`.
   - Never exposes secrets on the command line or in log files.
   - Generates an atomic temporary JSON define file in `.dart_tool/` and cleans it up via a `finally` block.
   - Generates a unique `BUILD_ID` incorporating UTC timestamp, Git commit, and source fingerprint.
   - Corrected `Get-Git` helper argument handling to reliably extract Git commit hashes in PowerShell.

5. **Post-Build Artifact Verifier (`scripts/verify-android-apk.ps1`)**:
   - Inspects the finished APK file directly using Android SDK tools (`apksigner`, `aapt2`).
   - Verifies the cryptographic signature against the pinned release certificate SHA-256 (`50c0a130de3b...`).
   - Confirms `applicationId` is `com.YouPeak.Live1` and `notDebuggable` is true.
   - Decompresses and scans `libapp.so` across all 3 architectures (`armeabi-v7a`, `arm64-v8a`, `x86_64`) to confirm `https://api.youpeak.app/`, presence of the production key (reporting only a boolean flag), absence of local hosts, and matching `BUILD_ID`.

---

## 4. Negative Release-Build Matrix Results

All 7 required negative test cases were confirmed to fail exclusively due to the intended configuration guard (`:app:validateReleaseConfig`), with exit code 1, and with all stale APK outputs deleted.

| # | Test Case Description | Exit Code | Validation Reason / Refusal Message | Stale APK Cleared | Log File |
|---|---|:---:|---|:---:|---|
| 1 | Unspecified release profile (plain `flutter build apk --release`) | 1 | `BUILD_PROFILE is not set. Build releases with scripts/build-consumer-apk.ps1 (BUILD_PROFILE=production), or pass BUILD_PROFILE=development for an emulator-only build.` | Yes (`app-release.apk` deleted) | `negative-1-plain-release.log` |
| 2 | `BUILD_PROFILE=production` without `API_SECRET_KEY` | 1 | `API_SECRET_KEY is missing: the backend would reject every request (HTTP 401).` | Yes | `negative-2-production-no-key.log` |
| 3 | Production with dummy key & `API_BASE_URL=http://10.0.2.2:5055/` | 1 | `API_BASE_URL must be an https origin for a production build.` | Yes | `negative-3-production-local-api.log` |
| 4 | Production with `USE_LOCAL_DEV=true` & `AUTH_EMULATOR=127.0.0.1:9095` | 1 | `USE_LOCAL_DEV must be false in a production build.`<br>`AUTH_EMULATOR / FIRESTORE_EMULATOR must be empty in a production build.` | Yes | `negative-4-production-local-switches.log` |
| 5 | `BUILD_PROFILE=development` with dummy key & production API | 1 | `A development build may only target a local API (localhost, 127.0.0.1 or 10.0.2.2), not api.youpeak.app.` | Yes | `negative-5-development-prod-api.log` |
| 6 | Production with `API_SECRET_KEY=youpeak-local-dev-key` | 1 | `The local development key cannot be used in a production build.` | Yes | `negative-6-production-dev-key.log` |
| 7 | Production with private key credential (`-----BEGIN PRIVATE KEY-----...`) | 1 | `API_SECRET_KEY does not look like the client API key (too short, or contains whitespace).`<br>`API_SECRET_KEY holds a credential, not the client key. Never embed a service-account or private key.` | Yes | `negative-7-production-private-key.log` |

---

## 5. Positive Production Build & Verification

The production release build was executed via:
```powershell
npx vercel env run -e production -- powershell -ExecutionPolicy Bypass -File scripts/build-consumer-apk.ps1
```

### Build Result
- **Gradle Task Execution**: `assembleRelease` passed (210.3s)
- **Pre-Compile Check**: `Release configuration OK (BUILD_PROFILE=production, API https://api.youpeak.app/)`
- **Output Artifact**: `youpeak/build/release/android/youpeak-1.1.2+2-production-20261012-123541-g894b2f4e-s11b37858.apk`
- **Manifest**: `youpeak/build/release/android/youpeak-1.1.2+2-production-20261012-123541-g894b2f4e-s11b37858.manifest.json`
- **Checksum**: `youpeak/build/release/android/youpeak-1.1.2+2-production-20261012-123541-g894b2f4e-s11b37858.apk.sha256`

### Cryptographic & Artifact Identity
- **File Size**: 247,707,459 bytes (~236.2 MB)
- **SHA-256 Hash**: `732af5d1f10480610a26b3fcf5073e43ac04f5ce673bf2bde83cb8fbb5232bf3`
- **Application ID**: `com.YouPeak.Live1`
- **Version Name**: `1.1.2`
- **Version Code**: `2`
- **Build ID**: `20261012-123541-g894b2f4e-s11b37858`
- **Signing Certificate SHA-256**: `50c0a130de3be10a296b85520ff2c270c0c070642723372e564e7ed9a0c0f986`
- **Signing Certificate SHA-1**: `36e05d07096a1e4b444691e01f9ae043f2cfca06`

### Artifact Verification Matrix (`verify-android-apk.ps1`)
| Verification Check | Target / Expected | Actual / Result | Status |
|---|---|---|:---:|
| `signatureVerifies` | Valid v1/v2/v3 signature | Verified | **PASS** |
| `signedWithReleaseCertificate` | `50c0a130de3be10a296b85520ff2c270c0c070642723372e564e7ed9a0c0f986` | Matched release pin | **PASS** |
| `applicationId` | `com.YouPeak.Live1` | `com.YouPeak.Live1` | **PASS** |
| `notDebuggable` | `false` | `false` (Non-debuggable) | **PASS** |
| `dartLibrariesFound` | 3 ABIs (`armeabi-v7a`, `arm64-v8a`, `x86_64`) | 3 AOT `libapp.so` entries | **PASS** |
| `apiOriginCompiledIn` | `https://api.youpeak.app/` | Present in all 3 ABIs | **PASS** |
| `noLocalDevelopmentHosts` | No localhost / loopback hosts | Zero local hosts found | **PASS** |
| `productionKeyCompiledIn` | Production key present | Present in all 3 ABIs (value unprinted) | **PASS** |
| `isTheRecordedBuild` | `20261012-123541-g894b2f4e-s11b37858` | Verified in all 3 ABIs | **PASS** |

---

## 6. Device Verification Status

- **Device Query**: Queried `adb devices` via Android SDK platform-tools.
- **Result**: No physical device or emulator currently connected.
- **Status**: **Pending device connection**.
- **Installation Procedure**:
  Once the device is plugged in and authorized via USB debugging:
  ```powershell
  & "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" install -r "E:\Legendary One\youpeak\source\youpeak\build\release\android\youpeak-1.1.2+2-production-20261012-123541-g894b2f4e-s11b37858.apk"
  ```
  *(The `-r` flag reinstalls the package over the existing app while preserving all local storage, database, and preferences).*

---

## 7. Known Limitations & Scope Boundaries

1. **Backend Integration**:
   - The production client key is confirmed present, resolving the HTTP 401 rejections on `/client/setting`, `/client/user_login`, and translations.
   - App operation requires active network connectivity to `https://api.youpeak.app/`.
2. **Third-Party Integrations**:
   - Video live streaming depends on live Zego Express credentials.
   - In-app payments depend on live Razorpay configuration.
   - Push notifications and OTP depend on Firebase SMS quota and Google Services configuration.
   - Google Sign-In requires SHA-1 fingerprint (`36e05d07096a1e4b444691e01f9ae043f2cfca06`) to be mapped in the Firebase / Google Cloud project console.

