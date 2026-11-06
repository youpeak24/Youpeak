import 'dart:async';
import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:youpeak/core/network/app_api_client.dart';

void main() {
  test("sends the app key and the Firebase ID token, returns the JSON", () async {
    late http.Request seen;
    final client = AppApiClient(
      baseUrl: "https://api.test/",
      idToken: ({bool forceRefresh = false}) async => "token-1",
      httpClient: MockClient((req) async {
        seen = req;
        return http.Response(jsonEncode({"status": true, "coins": 5}), 200);
      }),
    );
    final res = await client.post("client/peakBoost", {"coins": 500});
    expect(res["coins"], 5);
    expect(seen.url.toString(), "https://api.test/client/peakBoost");
    expect(seen.headers["Authorization"], "Bearer token-1");
    expect(seen.headers.containsKey("key"), isTrue);
    expect(jsonDecode(seen.body), {"coins": 500});
  });

  test("status:false becomes an ApiException carrying the server's code and data", () async {
    final client = AppApiClient(
      baseUrl: "https://api.test/",
      idToken: ({bool forceRefresh = false}) async => "t",
      httpClient: MockClient((_) async => http.Response(jsonEncode({"status": false, "code": "INSUFFICIENT_BALANCE", "message": "Insufficient balance.", "balance": 40}), 200)),
    );
    await expectLater(
      client.post("client/peakBoost", {}),
      throwsA(isA<ApiException>().having((e) => e.code, "code", "INSUFFICIENT_BALANCE").having((e) => e.data["balance"], "balance", 40)),
    );
  });

  test("an expired token is refreshed once and the call retried", () async {
    final forced = <bool>[];
    var calls = 0;
    final client = AppApiClient(
      baseUrl: "https://api.test/",
      idToken: ({bool forceRefresh = false}) async {
        forced.add(forceRefresh);
        return forceRefresh ? "fresh" : "stale";
      },
      httpClient: MockClient((req) async {
        calls++;
        if (req.headers["Authorization"] == "Bearer stale") {
          return http.Response(jsonEncode({"status": false, "code": "AUTH_INVALID", "message": "expired"}), 401);
        }
        return http.Response(jsonEncode({"status": true}), 200);
      }),
    );
    await client.get("client/tasker/dashboard");
    expect(calls, 2);
    expect(forced, [false, true]);
  });

  test("no session -> AUTH_REQUIRED without calling the server", () async {
    var called = false;
    final client = AppApiClient(
      baseUrl: "https://api.test/",
      idToken: ({bool forceRefresh = false}) async => null,
      httpClient: MockClient((_) async {
        called = true;
        return http.Response("{}", 200);
      }),
    );
    await expectLater(client.get("x"), throwsA(isA<ApiException>().having((e) => e.isAuthError, "auth", isTrue)));
    expect(called, isFalse);
  });

  test("network failure -> NETWORK_ERROR", () async {
    final client = AppApiClient(
      baseUrl: "https://api.test/",
      idToken: ({bool forceRefresh = false}) async => "t",
      httpClient: MockClient((_) async => throw http.ClientException("offline")),
    );
    await expectLater(client.get("x"), throwsA(isA<ApiException>().having((e) => e.code, "code", "NETWORK_ERROR")));
  });

  test("a sign-in token that never arrives ends in NETWORK_TIMEOUT, not endless loading", () async {
    var requests = 0;
    final client = AppApiClient(
      baseUrl: "https://api.test/",
      timeout: const Duration(milliseconds: 50),
      idToken: ({bool forceRefresh = false}) => Completer<String?>().future,
      httpClient: MockClient((_) async {
        requests++;
        return http.Response(jsonEncode({"status": true}), 200);
      }),
    );
    await expectLater(client.get("client/tasker/dashboard"), throwsA(isA<ApiException>().having((e) => e.code, "code", "NETWORK_TIMEOUT")));
    expect(requests, 0);
  });

  test("no session: AUTH_REQUIRED before any request is sent", () async {
    var requests = 0;
    final client = AppApiClient(
      baseUrl: "https://api.test/",
      idToken: ({bool forceRefresh = false}) async => null,
      httpClient: MockClient((_) async {
        requests++;
        return http.Response("{}", 200);
      }),
    );
    await expectLater(client.get("client/tasker/dashboard"), throwsA(isA<ApiException>().having((e) => e.isAuthError, "isAuthError", isTrue)));
    expect(requests, 0);
  });
}
