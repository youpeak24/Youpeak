import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:youpeak/core/constants/app_constant.dart';
import 'package:youpeak/core/network/app_session.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'package:youpeak/core/storage/database/database.dart';

/// Result of a playlist change: [ok] with the server's message (shown to the
/// user on failure — e.g. a name that's too long).
class PlaylistResult {
  const PlaylistResult(this.ok, this.message);

  final bool ok;
  final String message;
}

// Create / rename / privacy / delete. The server checks ownership and
// validates every field; these calls report its answer instead of assuming
// success.
class PlaylistManageApi {
  PlaylistManageApi._();

  static Future<PlaylistResult> _send(String method, String path, Map<String, dynamic> body) async {
    try {
      final headers = await AppSession.authHeaders(const {"Content-Type": "application/json; charset=UTF-8"});
      final uri = Uri.parse(Constant.baseURL + path);
      final payload = json.encode({"userId": Database.loginUserId, ...body});
      final http.Response r = switch (method) {
        "PATCH" => await http.patch(uri, headers: headers, body: payload).timeout(const Duration(seconds: 20)),
        "DELETE" => await http.delete(uri, headers: headers, body: payload).timeout(const Duration(seconds: 20)),
        _ => await http.post(uri, headers: headers, body: payload).timeout(const Duration(seconds: 20)),
      };
      final j = json.decode(r.body);
      if (j is Map && j["status"] == true) return PlaylistResult(true, (j["message"] ?? "").toString());
      return PlaylistResult(false, (j is Map ? j["message"] : null)?.toString() ?? "Something went wrong. Please try again.");
    } catch (e) {
      AppSettings.showLog("Playlist $method $path failed => $e");
      return const PlaylistResult(false, "Couldn't reach YouPeak. Check your connection and try again.");
    }
  }

  /// [playListType]: 1 private, 2 public.
  static Future<PlaylistResult> create({required String name, required int playListType, required List<String> videoIds}) =>
      _send("POST", Constant.createPlayList, {"playListName": name, "playListType": playListType, "videoId": videoIds});

  static Future<PlaylistResult> update({required String playListId, String? name, int? playListType}) => _send("PATCH", Constant.updatePlayList, {
        "playListId": playListId,
        if (name != null) "playListName": name,
        if (playListType != null) "playListType": playListType,
      });

  static Future<PlaylistResult> delete(String playListId) => _send("DELETE", "client/playlist/deletePlayList", {"playListId": playListId});
}
