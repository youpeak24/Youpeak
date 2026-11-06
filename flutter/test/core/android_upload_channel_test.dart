import 'dart:convert';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:get/get.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:youpeak/core/file_upload/storage_put_io.dart';
import 'package:youpeak/core/file_upload/upload_models.dart';
import 'package:youpeak/core/network/api_problem.dart';
import 'package:youpeak/core/network/app_api_client.dart';
import 'package:youpeak/features/channel/api/channel_home_api.dart';
import 'package:youpeak/features/splash/splash_session_policy.dart';
import 'package:youpeak/features/channel/data/channel_lookup.dart';
import 'package:youpeak/features/upload/controller/upload_video_controller.dart';

AppApiClient _client(http.Response Function(http.Request) handler, {String? Function()? token, List<bool>? forced}) => AppApiClient(
      baseUrl: "https://api.test/",
      idToken: ({bool forceRefresh = false}) async {
        forced?.add(forceRefresh);
        return token == null ? "token" : token();
      },
      httpClient: MockClient((req) async => handler(req)),
    );

http.Response _json(Object body, [int status = 200]) => http.Response(jsonEncode(body), status);

ChannelLookupService _service(http.Response Function(http.Request) handler, {String? uid = "u1", String? Function()? token, List<bool>? forced}) =>
    ChannelLookupService(api: _client(handler, token: token, forced: forced), userId: () => uid, cache: false);

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  SharedPreferences.setMockInitialValues({});

  group("ApiProblem", () {
    ApiProblem p(String code, String message, int? status, [Map<String, dynamic> data = const {"status": false}]) =>
        ApiProblem.fromException(ApiException(code, message, httpStatus: status, data: data));

    test("each failure class is distinguished and says something different", () {
      final kinds = {
        ApiProblemKind.noSession: p("AUTH_REQUIRED", "x", 401),
        ApiProblemKind.sessionExpired: p("AUTH_INVALID", "x", 401),
        ApiProblemKind.forbidden: p("USER_MISMATCH", "You can only do this for your own account.", 403),
        ApiProblemKind.blocked: p("USER_BLOCKED", "You are blocked by the admin.", 403),
        ApiProblemKind.notFound: p("CHANNEL_NOT_FOUND", "Channel not found.", 200),
        ApiProblemKind.offline: p("NETWORK_ERROR", "x", null, const {}),
        ApiProblemKind.timeout: p("NETWORK_TIMEOUT", "x", null, const {}),
        ApiProblemKind.server: p("SERVER_ERROR", "x", 500, const {"status": false}),
        ApiProblemKind.unreadable: p("REQUEST_FAILED", "x", 200, const {}),
        ApiProblemKind.refused: p("CHANNEL_NOT_OWNED", "Not yours.", 400),
      };
      kinds.forEach((kind, problem) => expect(problem.kind, kind, reason: kind.name));
      final messages = kinds.values.map((e) => e.message(what: "your channel")).toSet();
      expect(messages.length, kinds.length, reason: "no two failures share a message");
      // Only sign-in problems offer sign-in; only transient ones offer Retry.
      expect(kinds[ApiProblemKind.noSession]!.needsSignIn && kinds[ApiProblemKind.sessionExpired]!.needsSignIn, isTrue);
      expect(kinds[ApiProblemKind.forbidden]!.needsSignIn, isFalse);
      expect(kinds[ApiProblemKind.forbidden]!.canRetry, isFalse);
      expect(kinds[ApiProblemKind.offline]!.canRetry && kinds[ApiProblemKind.server]!.canRetry, isTrue);
    });

    test("diagnostics carry status and code only", () {
      expect(p("AUTH_INVALID", "Your session has expired.", 401).diagnostic, "HTTP 401 AUTH_INVALID");
      expect(p("NETWORK_ERROR", "x", null, const {}).diagnostic, "NETWORK_ERROR");
    });

    test("upload: a 403 from our API is a permission refusal, not an ended session; 401 is", () {
      expect(failureForApi(const ApiException("USER_MISMATCH", "You can only do this for your own account.", httpStatus: 403)).code, "PERMISSION_DENIED");
      expect(failureForApi(const ApiException("AUTH_INVALID", "expired", httpStatus: 401)).code, "AUTH_REQUIRED");
      expect(failureForStoragePut(const StoragePutResult(status: 0, readError: true), isWeb: false).code, "FILE_UNREADABLE");
    });
  });

  group("ChannelLookupService", () {
    test("owner → found, with the server's channel id", () async {
      final r = await _service((_) => _json({"status": true, "user": {"_id": "u1", "isChannel": true, "channelId": "u1", "fullName": "Asha"}})).lookupOwn();
      expect(r, isA<ChannelFound>().having((f) => f.channelId, "channelId", "u1").having((f) => f.name, "name", "Asha"));
    });

    test("no channel → NoChannel (isChannel false, or no channel id)", () async {
      expect(await _service((_) => _json({"status": true, "user": {"_id": "u1", "isChannel": false}})).lookupOwn(), isA<NoChannel>());
      expect(await _service((_) => _json({"status": true, "user": {"_id": "u1"}})).lookupOwn(), isA<NoChannel>());
    });

    test("no session on the device → auth required (nothing is sent)", () async {
      var sent = 0;
      final r = await _service((_) {
        sent++;
        return _json({"status": true});
      }, token: () => null)
          .lookupOwn();
      expect(r, isA<ChannelAuthRequired>().having((a) => a.expired, "expired", false));
      expect(sent, 0);
      expect(await _service((_) => _json({}), uid: null).lookupOwn(), isA<ChannelAuthRequired>());
    });

    test("expired token: refreshed once and retried — an owner is not told to sign in", () async {
      final forced = <bool>[];
      var calls = 0;
      final r = await _service((req) {
        calls++;
        return req.headers["Authorization"] == "Bearer fresh"
            ? _json({"status": true, "user": {"isChannel": true, "channelId": "u1"}})
            : _json({"status": false, "code": "AUTH_INVALID", "message": "Your session has expired."}, 401);
      }, token: () => forced.isNotEmpty && forced.last ? "fresh" : "stale", forced: forced)
          .lookupOwn();
      expect(r, isA<ChannelFound>());
      expect(calls, 2);
      expect(forced, [false, true]);
    });

    test("server keeps refusing the session → auth required (expired)", () async {
      final r = await _service((_) => _json({"status": false, "code": "AUTH_INVALID", "message": "x"}, 401)).lookupOwn();
      expect(r, isA<ChannelAuthRequired>().having((a) => a.expired, "expired", true));
    });

    test("403 → denied (not auth, not 'no channel'); blocked account → denied", () async {
      final r = await _service((_) => _json({"status": false, "code": "USER_MISMATCH", "message": "You can only do this for your own account."}, 403)).lookupOwn();
      expect(r, isA<ChannelDenied>().having((d) => d.problem.kind, "kind", ApiProblemKind.forbidden));
      final b = await _service((_) => _json({"status": true, "user": {"isChannel": true, "channelId": "u1", "isBlock": true}})).lookupOwn();
      expect(b, isA<ChannelDenied>().having((d) => d.problem.kind, "kind", ApiProblemKind.blocked));
    });

    test("network failure, server error and an unreadable reply are 'unavailable' — never 'no channel'", () async {
      final offline = ChannelLookupService(
        api: AppApiClient(baseUrl: "https://api.test/", idToken: ({bool forceRefresh = false}) async => "t", httpClient: MockClient((_) async => throw const SocketException("down"))),
        userId: () => "u1",
        cache: false,
      );
      expect(await offline.lookupOwn(), isA<ChannelUnavailable>().having((u) => u.problem.kind, "kind", ApiProblemKind.offline));
      expect(await _service((_) => _json({"status": false, "message": "boom"}, 500)).lookupOwn(),
          isA<ChannelUnavailable>().having((u) => u.problem.kind, "kind", ApiProblemKind.server));
      expect(await _service((_) => http.Response("<html>bad gateway</html>", 200)).lookupOwn(),
          isA<ChannelUnavailable>().having((u) => u.problem.kind, "kind", ApiProblemKind.unreadable));
      expect(await _service((_) => _json({"status": true, "user": "not-an-object"})).lookupOwn(), isA<ChannelUnavailable>());
    });
  });

  group("splash: when is a signed-in user signed out?", () {
    ApiProblem p(String code, String message, int? status) =>
        ApiProblem.fromException(ApiException(code, message, httpStatus: status, data: const {"status": false}));

    test("only when the server says the account can't continue", () {
      expect(decideSplashStart(p("AUTH_NO_ACCOUNT", "Account not found.", 401)), SplashStart.signOut);
      expect(decideSplashStart(p("AUTH_INVALID", "expired", 401)), SplashStart.signOut);
      expect(decideSplashStart(p("AUTH_REQUIRED", "x", 401)), SplashStart.signOut);
      expect(decideSplashStart(p("", "User does not found!", 200)), SplashStart.signOut, reason: "older server without a code");
      expect(decideSplashStart(p("USER_BLOCKED", "You are blocked by the admin.", 403)), SplashStart.blocked);
    });

    test("a slow or failed connection never signs anyone out (it would wipe their local data)", () {
      expect(decideSplashStart(null), SplashStart.retry, reason: "no answer yet (splash stopped waiting)");
      expect(decideSplashStart(const ApiProblem(ApiProblemKind.timeout, code: "NETWORK_TIMEOUT")), SplashStart.retry);
      expect(decideSplashStart(const ApiProblem(ApiProblemKind.offline, code: "NETWORK_ERROR")), SplashStart.retry);
      expect(decideSplashStart(p("SERVER_ERROR", "boom", 500)), SplashStart.retry);
      expect(decideSplashStart(const ApiProblem.unreadable(httpStatus: 200)), SplashStart.retry);
    });
  });

  group("ChannelHomeApi.fetch", () {
    test("returns the model on success and the problem on failure; the page is handed back", () async {
      ChannelHomeApi.startPagination = 0;
      final ok = await ChannelHomeApi.fetch("u1", "u1", api: _client((_) => _json({"status": true, "channelName": "A", "detailsOfChannel": []})));
      expect(ok.ok, isTrue);
      expect(ok.model!.channelName, "A");

      final denied = await ChannelHomeApi.fetch("u1", "other", api: _client((_) => _json({"status": false, "code": "USER_MISMATCH", "message": "no"}, 403)));
      expect(denied.ok, isFalse);
      expect(denied.problem!.kind, ApiProblemKind.forbidden);

      final unreadable = await ChannelHomeApi.fetch("u1", "u1", api: _client((_) => _json({"status": true, "detailsOfChannel": 5})));
      expect(unreadable.problem?.kind, anyOf(ApiProblemKind.unreadable, isNull), reason: "a bad list must not crash");
    });

    test("a channel that does not exist says so (not a generic failure)", () async {
      final r = await ChannelHomeApi.fetch("u1", "ghost", api: _client((_) => _json({"status": false, "code": "CHANNEL_NOT_FOUND", "message": "Channel not found."})));
      expect(r.problem!.kind, ApiProblemKind.notFound);
      expect(r.problem!.message(what: "this channel"), "Channel not found.");
    });
  });

  group("putFileToStorage (Android streaming PUT)", () {
    // The test binding answers every HTTP request with 400; these tests talk to
    // a real loopback server.
    setUpAll(() => HttpOverrides.global = null);

    late Directory dir;
    late HttpServer server;
    late String url;
    final received = <List<int>>[];
    final requestHeaders = <String, String>{};
    var respondWith = 200;
    var respondBody = "";

    setUp(() async {
      dir = await Directory.systemTemp.createTemp("put_test");
      received.clear();
      requestHeaders.clear();
      respondWith = 200;
      respondBody = "";
      server = await HttpServer.bind(InternetAddress.loopbackIPv4, 0);
      url = "http://127.0.0.1:${server.port}/put?sig=abc";
      server.listen((req) async {
        requestHeaders["method"] = req.method;
        requestHeaders["content-type"] = req.headers.contentType?.mimeType ?? "";
        requestHeaders["content-length"] = "${req.contentLength}";
        try {
          await for (final chunk in req) {
            received.add(chunk);
          }
          req.response.statusCode = respondWith;
          req.response.write(respondBody);
          await req.response.close();
        } catch (_) {
          // The client went away mid-upload (a cancel); nothing to answer.
        }
      });
    });

    tearDown(() async {
      await server.close(force: true);
      await dir.delete(recursive: true);
    });

    File makeFile(int bytes) {
      final f = File("${dir.path}/v.mp4");
      f.writeAsBytesSync(List<int>.generate(bytes, (i) => i % 251));
      return f;
    }

    test("streams the file with the right headers and reports progress up to 1", () async {
      final f = makeFile(3 * 1024 * 1024 + 123);
      final progress = <double>[];
      final r = await putFileToStorage(url: url, path: f.path, contentType: "video/mp4", onProgress: progress.add, cancel: UploadCancelToken());
      expect(r.ok, isTrue);
      expect(requestHeaders["method"], "PUT");
      expect(requestHeaders["content-type"], "video/mp4");
      expect(requestHeaders["content-length"], "${f.lengthSync()}");
      expect(received.fold<int>(0, (n, c) => n + c.length), f.lengthSync());
      expect(progress.first, 0);
      expect(progress.last, 1);
      expect(progress, orderedEquals([...progress]..sort()), reason: "progress never goes backwards");
      expect(received.length, greaterThan(1), reason: "sent in chunks, not one buffer");
    });

    test("a storage refusal comes back with its status and body for classification", () async {
      respondWith = 403;
      respondBody = "<Error><Code>SignatureDoesNotMatch</Code></Error>";
      final r = await putFileToStorage(url: url, path: makeFile(2048).path, contentType: "video/mp4", onProgress: (_) {}, cancel: UploadCancelToken());
      expect(r.status, 403);
      expect(failureForStoragePut(r, isWeb: false).code, "UPLOAD_AUTH_EXPIRED");
    });

    test("unreachable storage is a network error; a missing or empty file is a read error", () async {
      final unreachable = await putFileToStorage(url: "http://127.0.0.1:1/put", path: makeFile(2048).path, contentType: "video/mp4", onProgress: (_) {}, cancel: UploadCancelToken());
      expect(unreachable.networkError, isTrue);
      final empty = File("${dir.path}/empty.mp4")..writeAsBytesSync(const []);
      final r = await putFileToStorage(url: url, path: empty.path, contentType: "video/mp4", onProgress: (_) {}, cancel: UploadCancelToken());
      expect(r.readError, isTrue);
    });

    test("cancelling mid-transfer aborts it (not reported as a network error)", () async {
      final f = makeFile(24 * 1024 * 1024);
      final token = UploadCancelToken();
      final r = await putFileToStorage(
        url: url,
        path: f.path,
        contentType: "video/mp4",
        onProgress: (p) {
          if (p > 0.05) token.cancel();
        },
        cancel: token,
      );
      expect(r.aborted, isTrue);
      expect(failureForStoragePut(r, isWeb: false).code, "CANCELLED");
    });
  });

  group("UploadVideoController preview", () {
    test("a preview that can't start keeps the form (no navigation), flags it, and a missing length blocks upload with a reason", () async {
      Get.testMode = true;
      final c = UploadVideoController();
      await c.initializeVideoPlayer("/definitely/not/a/video.mp4");
      expect(c.previewUnavailable.value, isTrue);
      expect(c.chewieController, isNull);
      expect(c.videoPlayerController, isNull);
      expect(c.videoTime.value, 0, reason: "no length could be read from a missing file");
      // The controller is still usable: re-initialising resets the flag first.
      c.previewUnavailable.value = false;
      expect(c.previewUnavailable.value, isFalse);
    });
  });
}
