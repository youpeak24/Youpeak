import 'package:flutter_test/flutter_test.dart';
import 'package:youpeak/core/config/local_emulators.dart';

void main() {
  const localApi = "http://localhost:5055/";
  const productionApi = "https://api.youpeak.app/";

  test("unset switch: no emulator (every production build)", () {
    expect(localEmulator("", apiBaseUrl: localApi), isNull);
    expect(localEmulator("", apiBaseUrl: productionApi), isNull);
  });

  test("loopback emulator with a local API is used", () {
    final address = localEmulator("127.0.0.1:8095", apiBaseUrl: localApi);
    expect(address?.host, "127.0.0.1");
    expect(address?.port, 8095);
    expect(localEmulator("localhost:9095", apiBaseUrl: "http://127.0.0.1:5055/")?.port, 9095);
  });

  test("a build talking to the production API ignores the switch", () {
    expect(localEmulator("127.0.0.1:8095", apiBaseUrl: productionApi), isNull);
  });

  test("non-loopback or malformed addresses are ignored", () {
    expect(localEmulator("10.1.2.3:8095", apiBaseUrl: localApi), isNull);
    expect(localEmulator("firestore.googleapis.com:443", apiBaseUrl: localApi), isNull);
    expect(localEmulator("127.0.0.1", apiBaseUrl: localApi), isNull);
    expect(localEmulator("127.0.0.1:notaport", apiBaseUrl: localApi), isNull);
    expect(localEmulator("127.0.0.1:70000", apiBaseUrl: localApi), isNull);
  });
}
