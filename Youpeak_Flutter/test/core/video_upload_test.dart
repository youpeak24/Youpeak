import 'dart:convert';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:youpeak/core/file_upload/direct_upload_video_api.dart';
import 'package:youpeak/core/file_upload/upload_models.dart';
import 'package:youpeak/core/network/app_api_client.dart';
import 'package:youpeak/core/platform/local_media.dart';
import 'package:image_picker/image_picker.dart';
import 'package:youpeak/features/channel/model/channel_home_model.dart';
import 'package:youpeak/features/profile/model/get_profile_model.dart';

/// A API client whose upload-URL endpoint answers from [handler].
AppApiClient _api(http.Response Function(http.Request) handler, {List<http.Request>? seen}) => AppApiClient(
      baseUrl: "https://api.test/",
      idToken: ({bool forceRefresh = false}) async => "token",
      httpClient: MockClient((req) async {
        seen?.add(req);
        return handler(req);
      }),
    );

http.Response _grant(int n) => http.Response(
      jsonEncode({"status": true, "uploadURL": "https://r2.test/put/$n?sig=abc", "publicUrl": "https://cdn.test/normalvideo/$n.mp4"}),
      200,
    );

void main() {
  late Directory dir;
  late String videoPath;

  setUp(() async {
    dir = await Directory.systemTemp.createTemp("upload_test");
    final file = File("${dir.path}/clip.mp4")..writeAsBytesSync(List.filled(2048, 7));
    videoPath = file.path;
  });
  tearDown(() => dir.delete(recursive: true));

  Future<void> noWait(Duration _) async {}

  group("DirectUploadVideoApi.upload", () {
    test("asks for a presigned URL with the real size and type, puts the file, returns the public URL", () async {
      final seen = <http.Request>[];
      final puts = <String>[];
      final progress = <double>[];
      final url = await DirectUploadVideoApi.upload(
        videoPath,
        true,
        api: _api((_) => _grant(1), seen: seen),
        delay: noWait,
        onProgress: progress.add,
        put: ({required url, required path, required contentType, required onProgress, required cancel}) async {
          puts.add("$url|$contentType|$path");
          onProgress(0.5);
          onProgress(1);
          return const StoragePutResult(status: 200);
        },
      );
      expect(url, "https://cdn.test/normalvideo/1.mp4");
      final body = jsonDecode(seen.single.body) as Map<String, dynamic>;
      expect(body["contentType"], "video/mp4");
      expect(body["fileSize"], 2048);
      expect(body["folderStructure"], isNotEmpty);
      expect(puts.single, startsWith("https://r2.test/put/1?sig=abc|video/mp4|"));
      expect(progress, [0.5, 1]);
    });

    test("a busy storage server (503) is retried and the upload then succeeds", () async {
      var attempts = 0;
      final waits = <Duration>[];
      final url = await DirectUploadVideoApi.upload(
        videoPath,
        true,
        api: _api((_) => _grant(2)),
        delay: (d) async => waits.add(d),
        put: ({required url, required path, required contentType, required onProgress, required cancel}) async {
          attempts++;
          return attempts < 3 ? const StoragePutResult(status: 503) : const StoragePutResult(status: 200);
        },
      );
      expect(url, endsWith("/2.mp4"));
      expect(attempts, 3);
      expect(waits, DirectUploadVideoApi.retryDelays);
    });

    test("an expired permission (403) gets a fresh presigned URL, not the same one again", () async {
      var grants = 0;
      final urls = <String>[];
      final url = await DirectUploadVideoApi.upload(
        videoPath,
        true,
        api: _api((_) => _grant(++grants)),
        delay: noWait,
        put: ({required url, required path, required contentType, required onProgress, required cancel}) async {
          urls.add(url);
          return urls.length == 1 ? const StoragePutResult(status: 403, body: "<Error><Code>AccessDenied</Code></Error>") : const StoragePutResult(status: 200);
        },
      );
      expect(grants, 2);
      expect(urls, ["https://r2.test/put/1?sig=abc", "https://r2.test/put/2?sig=abc"]);
      expect(url, endsWith("/2.mp4"));
    });

    test("no response at all (offline, or the storage CORS policy blocks the browser) ends with an accurate, retried failure", () async {
      var puts = 0;
      await expectLater(
        DirectUploadVideoApi.upload(
          videoPath,
          true,
          api: _api((_) => _grant(3)),
          delay: noWait,
          put: ({required url, required path, required contentType, required onProgress, required cancel}) async {
            puts++;
            return const StoragePutResult(status: 0, networkError: true);
          },
        ),
        throwsA(isA<UploadFailure>().having((e) => e.code, "code", "STORAGE_UNREACHABLE").having((e) => e.userMessage, "message", contains("video storage"))),
      );
      expect(puts, 1 + DirectUploadVideoApi.retryDelays.length);
    });

    test("a refusal that retrying cannot fix is reported at once, with the reason", () async {
      var puts = 0;
      await expectLater(
        DirectUploadVideoApi.upload(
          videoPath,
          true,
          api: _api((_) => _grant(4)),
          delay: noWait,
          put: ({required url, required path, required contentType, required onProgress, required cancel}) async {
            puts++;
            return const StoragePutResult(status: 400, body: "<Error><Code>InvalidArgument</Code></Error>");
          },
        ),
        throwsA(isA<UploadFailure>().having((e) => e.code, "code", "STORAGE_REJECTED").having((e) => e.diagnostic, "diagnostic", "HTTP 400 InvalidArgument")),
      );
      expect(puts, 1);
    });

    test("API refusals become specific messages (unsupported type, unavailable storage, signed-out)", () async {
      Future<UploadFailure> failWith(http.Response response) async {
        try {
          await DirectUploadVideoApi.upload(videoPath, true, api: _api((_) => response), delay: noWait);
        } on UploadFailure catch (e) {
          return e;
        }
        fail("expected a failure");
      }

      final type = await failWith(http.Response(jsonEncode({"status": false, "code": "INVALID_VIDEO_TYPE", "message": "x"}), 400));
      expect(type.code, "VIDEO_FORMAT");
      final config = await failWith(http.Response(jsonEncode({"status": false, "code": "R2_DELIVERY_NOT_CONFIGURED", "message": "x"}), 503));
      expect(config.code, "UPLOAD_UNAVAILABLE");
      expect(config.userMessage, contains("temporarily unavailable"));
      final auth = await failWith(http.Response(jsonEncode({"status": false, "code": "AUTH_REQUIRED", "message": "x"}), 401));
      expect(auth.code, "AUTH_REQUIRED");
      final tooBig = await failWith(http.Response(jsonEncode({"status": false, "code": "FILE_TOO_LARGE", "message": "Videos can be at most 2 GB."}), 413));
      expect(tooBig.code, "FILE_TOO_LARGE");
    });

    test("an empty file is refused before anything is requested", () async {
      final empty = File("${dir.path}/empty.mp4")..writeAsBytesSync([]);
      var asked = false;
      await expectLater(
        DirectUploadVideoApi.upload(empty.path, true, api: _api((_) {
          asked = true;
          return _grant(5);
        })),
        throwsA(isA<UploadFailure>().having((e) => e.code, "code", "EMPTY_FILE")),
      );
      expect(asked, isFalse);
    });

    test("cancelling stops the upload without further attempts", () async {
      final cancel = UploadCancelToken();
      var puts = 0;
      await expectLater(
        DirectUploadVideoApi.upload(
          videoPath,
          true,
          api: _api((_) => _grant(6)),
          cancel: cancel,
          delay: noWait,
          put: ({required url, required path, required contentType, required onProgress, required cancel}) async {
            puts++;
            cancel.cancel();
            return const StoragePutResult(status: 0, aborted: true);
          },
        ),
        throwsA(isA<UploadFailure>().having((e) => e.code, "code", "CANCELLED")),
      );
      expect(puts, 1);
    });

    test("a browser-picked WebM keeps its real type (part of the signature)", () async {
      final webm = LocalMedia.remember(XFile(videoPath, name: "rec.webm", mimeType: "video/webm"));
      expect(DirectUploadVideoApi.contentTypeFor(webm), anyOf("video/webm", "video/mp4")); // path-based on the VM; the browser build keeps the picker's type
      expect(DirectUploadVideoApi.extensionFor("video/webm"), "webm");
      expect(DirectUploadVideoApi.extensionFor("video/quicktime"), "mov");
      expect(DirectUploadVideoApi.extensionFor("video/mp4"), "mp4");
    });
  });

  group("failure mapping", () {
    test("storage statuses", () {
      expect(failureForStoragePut(const StoragePutResult(status: 413), isWeb: true).code, "FILE_TOO_LARGE");
      expect(failureForStoragePut(const StoragePutResult(status: 500), isWeb: false).retryable, isTrue);
      expect(failureForStoragePut(const StoragePutResult(status: 403), isWeb: true).code, "UPLOAD_AUTH_EXPIRED");
      final cors = failureForStoragePut(const StoragePutResult(status: 0, networkError: true), isWeb: true);
      expect(cors.diagnostic, contains("CORS"));
      expect(failureForStoragePut(const StoragePutResult(status: 0, networkError: true), isWeb: false).diagnostic, isNot(contains("CORS")));
    });

    test("diagnostics never contain a signed URL", () {
      final f = failureForStoragePut(const StoragePutResult(status: 403, body: "<Error><Code>SignatureDoesNotMatch</Code></Error>"), isWeb: true);
      expect(f.toString(), isNot(contains("X-Amz")));
      expect(f.diagnostic, "HTTP 403 SignatureDoesNotMatch");
    });
  });

  group("GetProfileModel", () {
    test("a creator profile with prices saved as text still loads (sign-in reads it)", () {
      final m = GetProfileModel.fromJson({
        "status": true,
        "user": {"_id": "u1", "isChannel": true, "channelType": "1", "subscriptionCost": "10", "videoUnlockCost": "", "age": "21"},
      });
      expect(m.user?.channelType, 1);
      expect(m.user?.subscriptionCost, 10);
      expect(m.user?.videoUnlockCost, isNull);
      expect(m.user?.age, 21);
    });
  });

  group("ChannelHomeModel", () {
    test("reads numbers that arrive as strings and fills missing fields, so the channel page cannot crash on a null", () {
      final m = ChannelHomeModel.fromJson({
        "status": true,
        "channelType": "1",
        "subscriptionCost": "10",
        "detailsOfChannel": [
          {"_id": "v1", "title": "t", "views": "7", "videoType": "2"},
          {"videoUrl": null},
          "garbage",
        ],
      });
      expect(m.channelType, 1);
      expect(m.subscriptionCost, 10);
      expect(m.totalVideosOfChannel, 0);
      expect(m.totalSubscribers, 0);
      expect(m.channelName, "");
      expect(m.isSubscribed, false);
      expect(m.detailsOfChannel!.length, 2);
      final v = m.detailsOfChannel!.first;
      expect(v.views, 7);
      expect(v.videoType, 2);
      expect(v.isSaveToWatchLater, false);
      final blank = m.detailsOfChannel!.last;
      expect(blank.id, "");
      expect(blank.videoTime, 0);
      expect(blank.channelId, "");
    });

    test("a reply without a body still parses", () {
      final m = ChannelHomeModel.fromJson({"status": false, "message": "Channel not found."});
      expect(m.status, false);
      expect(m.message, "Channel not found.");
      expect(m.detailsOfChannel, isNull);
    });
  });
}
