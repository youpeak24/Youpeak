import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:youpeak/core/storage/database/database.dart';
import 'package:youpeak/features/comments/model/get_all_comment_model.dart';
import 'package:youpeak/core/constants/app_constant.dart';
import 'package:youpeak/core/settings/app_settings.dart';

// class GetAllCommentApi {
//   static int startPagination = 0;
//   static int limitPagination = 10;
//
//   static GetAllCommentModel? getAllCommentModel;
//   static const List commentType = ["top", "newest", "mostLiked"];
//   static Future<List<VideoComment>?> callApi(String videoId, int commentTypeIndex) async {
//     AppSettings.showLog("Get All Comment Api Calling...");
//     startPagination += 1;
//
//     final uri = Uri.parse(
//         "${Constant.baseURL + Constant.getAllComment}?userId=${Database.loginUserId}&videoId=$videoId&commentType=${commentType[commentTypeIndex]}&start=$startPagination&limit=$limitPagination");
//
//     AppSettings.showLog("Get All Comment Api url => $uri");
//
//     final headers = {"key": Constant.secretKey};
//
//     try {
//       final response = await http.get(uri, headers: headers);
//
//       if (response.statusCode == 200) {
//         final jsonResponse = json.decode(response.body);
//
//         getAllCommentModel = GetAllCommentModel.fromJson(jsonResponse);
//         AppSettings.showLog("Get All Comment Response => ${getAllCommentModel?.videoComment?.length}");
//         return getAllCommentModel?.videoComment!;
//       } else {
//         AppSettings.showLog("Get All Comment StateCode Error");
//       }
//     } catch (error) {
//       AppSettings.showLog("Get All Comment Error => $error");
//     }
//     return null;
//   }
// }

class GetAllCommentApi {
  static int startPagination = 1; // 0 નહીં, 1 થી શરૂ
  static int limitPagination = 10;
  static bool hasMoreData = true;
  static GetAllCommentModel? getAllCommentModel;

  static const List commentType = ["top", "newest", "mostLiked"];

  static Future<List<VideoComment>?> callApi(String videoId, int commentTypeIndex) async {
    final uri = Uri.parse(
        "${Constant.baseURL + Constant.getAllComment}?userId=${Database.loginUserId}&videoId=$videoId&commentType=${commentType[commentTypeIndex]}&start=$startPagination&limit=$limitPagination");

    AppSettings.showLog("Get All Comment Api url => $uri");

    final headers = {"key": Constant.secretKey};

    try {
      final response = await http.get(uri, headers: headers);

      if (response.statusCode == 200) {
        final jsonResponse = json.decode(response.body);
        getAllCommentModel = GetAllCommentModel.fromJson(jsonResponse);

        final comments = getAllCommentModel?.videoComment ?? [];

        // જો 10 કરતાં ઓછા આવ્યા = વધારે data નથી
        hasMoreData = comments.length >= limitPagination;

        AppSettings.showLog("Page: $startPagination | Got: ${comments.length} | hasMore: $hasMoreData");
        return comments;
      }
    } catch (error) {
      AppSettings.showLog("Get All Comment Error => $error");
    }
    return null;
  }
}
