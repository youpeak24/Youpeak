import 'package:flutter_test/flutter_test.dart';
import 'package:youpeak/core/config/build_config.dart';

const _goodKey = "0123456789abcdef0123456789abcdef";

List<String> _check({
  String profile = "production",
  String api = "https://api.youpeak.app/",
  String key = _goodKey,
  bool localDev = false,
  String auth = "",
  String firestore = "",
}) =>
    evaluateBuildConfig(profile: profile, apiBaseUrl: api, apiKey: key, useLocalDev: localDev, authEmulator: auth, firestoreEmulator: firestore);

void main() {
  group("evaluateBuildConfig", () {
    test("a correct production build has no problems", () {
      expect(_check(), isEmpty);
    });

    test("a release build with no BUILD_PROFILE is refused (what a plain `flutter build apk --release` produces)", () {
      final p = _check(profile: "", key: "");
      expect(p, hasLength(1));
      expect(p.single, contains("BUILD_PROFILE is not set"));
      expect(p.single, contains("scripts/build-consumer-apk.ps1"));
    });

    test("a production build with no client key is refused: every request would be 401", () {
      final p = _check(key: "");
      expect(p.single, contains("API_SECRET_KEY is missing"));
      expect(p.single, contains("401"));
    });

    test("keys that are obviously not the client key are refused, and the value is never echoed", () {
      for (final bad in ["x9z", "has a space in it 0123456789", " $_goodKey", "-----BEGIN PRIVATE KEY-----abcdef", '{"type":"service_account"}']) {
        final p = _check(key: bad);
        expect(p, isNotEmpty, reason: bad);
        expect(p.join(" "), isNot(contains(bad)), reason: "message must not repeat the key");
      }
    });

    test("production must target an https, non-local API", () {
      expect(_check(api: "http://api.youpeak.app/"), isNotEmpty);
      for (final local in ["https://localhost/", "http://10.0.2.2:5055/", "http://127.0.0.1:5055/", "https://192.168.1.20/", "https://intranet.local/"]) {
        expect(_check(api: local), isNotEmpty, reason: local);
      }
      expect(_check(api: "https://staging.youpeak.app/"), isEmpty);
    });

    test("production refuses development switches and the local development key", () {
      expect(_check(localDev: true).join(), contains("USE_LOCAL_DEV"));
      expect(_check(auth: "127.0.0.1:9095").join(), contains("EMULATOR"));
      expect(_check(firestore: "127.0.0.1:8095").join(), contains("EMULATOR"));
      expect(_check(key: "youpeak-local-dev-key").join(), contains("development key"));
    });

    test("a development build is allowed only against a local API", () {
      expect(_check(profile: "development", api: "http://10.0.2.2:5055/", key: "youpeak-local-dev-key"), isEmpty);
      expect(_check(profile: "development", api: "http://localhost:5055/"), isEmpty);
      expect(_check(profile: "development", api: "https://api.youpeak.app/"), isNotEmpty);
      expect(_check(profile: "development", api: "http://10.0.2.2:5055/", key: ""), isNotEmpty);
    });

    test("an unknown profile is refused", () {
      expect(_check(profile: "staging"), isNotEmpty);
      expect(_check(profile: "Production"), isNotEmpty, reason: "exact match only");
    });
  });

  test("debug/test runs are never blocked by the release guard", () {
    // flutter test runs in debug mode: releaseProblems() only checks release builds.
    expect(BuildConfig.releaseProblems(), isEmpty);
  });
}
