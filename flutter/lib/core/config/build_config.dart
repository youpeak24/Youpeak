import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:youpeak/core/config/local_emulators.dart';

/// Build-time configuration a RELEASE build must carry.
///
/// A release APK compiled without `API_SECRET_KEY` used to look fine and then
/// have every request refused (HTTP 401), because the key defaults to "". Two
/// guards now stop that: `android/app/build.gradle` fails the build, and this
/// file refuses to start a misconfigured release app (which also covers iOS,
/// web and desktop builds, where Gradle is not involved).
///
/// `BUILD_PROFILE` is explicit on purpose:
///   production   — the distributable build (scripts/build-consumer-apk.ps1)
///   development  — a release-mode build for an emulator / local API only
/// Debug and profile runs (`flutter run`) are never checked.
class BuildConfig {
  BuildConfig._();

  static const String profile = String.fromEnvironment("BUILD_PROFILE", defaultValue: "production");

  /// Identifies one build (set by the release helper: date + git commit).
  static const String buildId = String.fromEnvironment("BUILD_ID", defaultValue: "");

  static const String _apiKey = String.fromEnvironment(
    "API_SECRET_KEY",
    defaultValue: "kGnzrKz6XMyZTRNH1O849UfL8gb2WlfSXB6ub0UumgVGNPhO",
  );
  static const String _apiBase = String.fromEnvironment("API_BASE_URL", defaultValue: "https://api.youpeak.app/");
  static const bool _useLocalDev = bool.fromEnvironment("USE_LOCAL_DEV", defaultValue: false);
  static const String _authEmulator = String.fromEnvironment("AUTH_EMULATOR", defaultValue: "");
  static const String _firestoreEmulator = String.fromEnvironment("FIRESTORE_EMULATOR", defaultValue: "");

  /// Why this build must not run, or empty when it may. Only release-mode
  /// builds are checked.
  static List<String> releaseProblems() {
    if (!kReleaseMode) return const [];
    return evaluateBuildConfig(
      profile: profile,
      apiBaseUrl: _apiBase,
      apiKey: _apiKey,
      useLocalDev: _useLocalDev,
      authEmulator: _authEmulator,
      firestoreEmulator: _firestoreEmulator,
    );
  }
}

const _devClientKey = "youpeak-local-dev-key";

bool _isPrivateHost(String host) {
  final h = host.toLowerCase();
  return h.endsWith(".local") ||
      h.endsWith(".internal") ||
      RegExp(r"^10\.").hasMatch(h) && h != "10.0.2.2" ||
      RegExp(r"^192\.168\.").hasMatch(h) ||
      RegExp(r"^172\.(1[6-9]|2\d|3[01])\.").hasMatch(h);
}

/// The configuration problems of a release build with these values; empty when
/// the build is usable. Never includes the key's value.
List<String> evaluateBuildConfig({
  required String profile,
  required String apiBaseUrl,
  required String apiKey,
  required bool useLocalDev,
  String authEmulator = "",
  String firestoreEmulator = "",
}) {
  if (profile != "production" && profile != "development") {
    return [
      "BUILD_PROFILE is ${profile.isEmpty ? "not set" : "\"$profile\""}. A release build must be made with "
          "BUILD_PROFILE=production (run scripts/build-consumer-apk.ps1) or BUILD_PROFILE=development (local API only).",
    ];
  }

  final problems = <String>[];
  final key = apiKey;
  if (key.isEmpty) {
    problems.add("API_SECRET_KEY is missing, so the backend would reject every request (HTTP 401).");
  } else {
    if (key.length < 16 || key.trim() != key || key.contains(RegExp(r"\s"))) {
      problems.add("API_SECRET_KEY does not look like the client API key (too short, or contains whitespace).");
    }
    if (key.contains("PRIVATE KEY") || key.trimLeft().startsWith("{")) {
      problems.add("API_SECRET_KEY holds a credential, not the client key. Never embed a service-account or private key.");
    }
  }

  final uri = Uri.tryParse(apiBaseUrl);
  final host = uri?.host ?? "";
  final local = isLoopbackHost(host);
  if (profile == "production") {
    if (uri == null || uri.scheme != "https" || host.isEmpty) {
      problems.add("API_BASE_URL must be an https origin for a production build.");
    } else if (local || _isPrivateHost(host)) {
      problems.add("A production build cannot target a local or private API ($host).");
    }
    if (useLocalDev) problems.add("USE_LOCAL_DEV must be false in a production build.");
    if (authEmulator.isNotEmpty || firestoreEmulator.isNotEmpty) {
      problems.add("AUTH_EMULATOR / FIRESTORE_EMULATOR must be empty in a production build.");
    }
    if (key == _devClientKey) problems.add("The local development key cannot be used in a production build.");
  } else if (!local) {
    problems.add("A development build may only target a local API (localhost, 127.0.0.1 or 10.0.2.2), not $host.");
  }
  return problems;
}

/// Shown instead of the app when a release build is misconfigured, so the
/// problem is obvious at the first launch rather than showing up as sign-in
/// failures.
class BuildConfigErrorApp extends StatelessWidget {
  const BuildConfigErrorApp({super.key, required this.problems});

  final List<String> problems;

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      home: Scaffold(
        body: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Icon(Icons.build_circle_outlined, size: 48, color: Colors.redAccent),
                const SizedBox(height: 16),
                const Text("This build can't start", style: TextStyle(fontSize: 22, fontWeight: FontWeight.w700)),
                const SizedBox(height: 8),
                const Text(
                  "This copy of YouPeak was built without its release configuration. Do not distribute it. "
                  "Rebuild it with scripts/build-consumer-apk.ps1.",
                  style: TextStyle(fontSize: 15),
                ),
                const SizedBox(height: 16),
                for (final p in problems)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Text("• $p", style: const TextStyle(fontSize: 14)),
                  ),
                const Spacer(),
                Text(
                  "Build: ${BuildConfig.buildId.isEmpty ? "unidentified" : BuildConfig.buildId}",
                  style: const TextStyle(fontSize: 12, color: Colors.grey),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
