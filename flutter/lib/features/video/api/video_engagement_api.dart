import 'dart:convert';
import 'dart:math';

import 'package:http/http.dart' as http;
import 'package:youpeak/core/constants/app_constant.dart';
import 'package:youpeak/core/network/app_session.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'package:youpeak/core/storage/database/database.dart';

// Like/dislike, Watch Later, subscribe and comment calls for the video page.
//
// Each sends the state the viewer asked for (not a toggle), so a retry after
// a timeout or a double tap can't flip it back, and returns what the server
// stored — the page shows that, or rolls its optimistic change back when the
// call fails (null).

class LikeState {
  const LikeState({required this.isLike, required this.isDislike, required this.like, required this.dislike});

  final bool isLike;
  final bool isDislike;
  final int like;
  final int dislike;
}

class SubscribeState {
  const SubscribeState({required this.isSubscribed, this.totalSubscribers, this.message});

  final bool isSubscribed;
  final int? totalSubscribers;
  final String? message;
}

class CommentResult {
  const CommentResult({required this.ok, this.held = false, this.message, this.code});

  final bool ok;
  final bool held;
  final String? message;
  final String? code;
}

class VideoEngagementApi {
  VideoEngagementApi._();

  static const _timeout = Duration(seconds: 20);

  static Future<Map<String, dynamic>?> _send(String method, Uri uri, {Map<String, dynamic>? body}) async {
    try {
      final headers = await AppSession.authHeaders(body != null ? const {"Content-Type": "application/json"} : const {});
      final http.Response r;
      switch (method) {
        case "PATCH":
          r = await http.patch(uri, headers: headers, body: body != null ? json.encode(body) : null).timeout(_timeout);
          break;
        case "DELETE":
          r = await http.delete(uri, headers: headers, body: body != null ? json.encode(body) : null).timeout(_timeout);
          break;
        default:
          r = await http.post(uri, headers: headers, body: body != null ? json.encode(body) : null).timeout(_timeout);
      }
      final decoded = json.decode(r.body);
      if (decoded is Map<String, dynamic>) {
        decoded["_httpStatus"] = r.statusCode;
        return decoded;
      }
    } catch (e) {
      AppSettings.showLog("VideoEngagementApi $method ${uri.path} failed => $e");
    }
    return null;
  }

  static int _int(dynamic v) => v is num ? v.toInt() : int.tryParse("$v") ?? 0;

  /// action: like | dislike | likeremove | dislikeremove
  static Future<LikeState?> setLike(String videoId, String action) async {
    final uri = Uri.parse("${Constant.baseURL}${Constant.likeDislikeVideo}").replace(queryParameters: {
      "userId": Database.loginUserId ?? "",
      "videoId": videoId,
      "likeOrDislike": action,
    });
    final j = await _send("POST", uri);
    if (j == null || j["status"] != true) return null;
    return LikeState(isLike: j["isLike"] == true, isDislike: j["isDislike"] == true, like: _int(j["like"]), dislike: _int(j["dislike"]));
  }

  static Future<bool?> setWatchLater(String videoId, bool saved) async {
    final uri = Uri.parse("${Constant.baseURL}${Constant.createWatchLater}").replace(queryParameters: {
      "userId": Database.loginUserId ?? "",
      "videoId": videoId,
      "action": saved ? "add" : "remove",
    });
    final j = await _send("POST", uri);
    if (j == null || j["status"] != true) return null;
    return j["isSaved"] == true;
  }

  static Future<SubscribeState?> setSubscribed(String channelId, bool subscribe) async {
    final uri = Uri.parse("${Constant.baseURL}${Constant.subscribeChannel}").replace(queryParameters: {
      "userId": Database.loginUserId ?? "",
      "channelId": channelId,
      "subscribe": "$subscribe",
    });
    final j = await _send("POST", uri);
    if (j == null) return null;
    if (j["status"] != true) return SubscribeState(isSubscribed: !subscribe, message: j["message"]?.toString());
    return SubscribeState(
      isSubscribed: j["isSubscribed"] == true,
      totalSubscribers: j["totalSubscribers"] == null ? null : _int(j["totalSubscribers"]),
    );
  }

  static String newRequestId() {
    final r = Random.secure();
    return List.generate(16, (_) => r.nextInt(16).toRadixString(16)).join();
  }

  /// [requestId] makes a retry of the same comment idempotent on the server.
  static Future<CommentResult> createComment(String videoId, String text, {required String requestId}) async {
    final j = await _send("POST", Uri.parse("${Constant.baseURL}${Constant.createComment}"), body: {
      "userId": Database.loginUserId,
      "videoId": videoId,
      "commentText": text,
      "requestId": requestId,
    });
    if (j == null) return const CommentResult(ok: false, message: "Couldn't post your comment. Check your connection and try again.");
    if (j["status"] != true) return CommentResult(ok: false, message: j["message"]?.toString(), code: j["code"]?.toString());
    return CommentResult(ok: true, held: j["held"] == true, message: j["message"]?.toString());
  }

  static Future<bool> deleteComment(String commentId) async {
    final uri = Uri.parse("${Constant.baseURL}client/videoComment/deleteComment").replace(queryParameters: {"commentId": commentId});
    final j = await _send("DELETE", uri);
    return j != null && j["status"] == true;
  }
}
