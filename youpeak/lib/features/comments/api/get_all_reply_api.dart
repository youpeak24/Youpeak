import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:youpeak/features/comments/model/get_all_reply_model.dart';
import 'package:youpeak/core/constants/app_constant.dart';
import 'package:youpeak/core/settings/app_settings.dart';

class GetAllReplyApi {
  static int startPagination = 1;
  static int limitPagination = 10;
  static bool hasMoreData = true;
  static int totalCount = 0;

  static Future<List<RepliesOfComment>?> callApi(String loginUserId, String videoId, String commentId) async {
    AppSettings.showLog("Get All Reply Api Calling... Page: $startPagination");

    final uri = Uri.parse(
        "${Constant.baseURL + Constant.getAllReply}?userId=$loginUserId&videoId=$videoId&recursiveCommentId=$commentId&start=$startPagination&limit=$limitPagination");

    AppSettings.showLog("Get All Reply uri => $uri");

    final headers = {"key": Constant.secretKey};

    try {
      final response = await http.get(uri, headers: headers);

      if (response.statusCode == 200) {
        final jsonResponse = json.decode(response.body);
        final model = GetAllReplyModel.fromJson(jsonResponse);
        final replies = model.repliesOfComment ?? [];

        totalCount = model.originalVideoComment?.totalReplies ?? replies.length;
        hasMoreData = replies.length >= limitPagination;

        AppSettings.showLog("Page: $startPagination | Got: ${replies.length} | hasMore: $hasMoreData");
        return replies;
      } else {
        AppSettings.showLog("Get All Reply StatusCode Error");
      }
    } catch (error) {
      AppSettings.showLog("Get All Reply Error => $error");
    }
    return null;
  }
}
