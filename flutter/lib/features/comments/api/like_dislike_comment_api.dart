import 'package:http/http.dart' as http;
import 'package:youpeak/core/constants/app_constant.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'package:youpeak/core/network/app_session.dart';

// ******************* Edit Complete *************************

// class LikeDisLikeCommentApi {
//   static Future<void> callApi(String userId, String commentId, bool isLike) async {
//     AppSettings.showLog("Like DisLike Comment Api Calling...");
//
//     final uri = Uri.parse(
//         "${Constant.baseURL + Constant.likeDislikeComment}?userId=$userId&videoCommentId=$commentId&likeOrDislike=${isLike ? "like" : "dislike"}");
//
//     final headers = {"key": Constant.secretKey};
//
//     try {
//       final response = await http.post(uri, headers: headers);
//
//       if (response.statusCode == 200) {
//         AppSettings.showLog("Like DisLike Comment Api Response => ${response.body}");
//       } else {
//         AppSettings.showLog("Like DisLike Comment Api StateCode Error");
//       }
//     } catch (error) {
//       AppSettings.showLog("Like DisLike Comment Api Error => $error");
//     }
//   }
// }
class LikeDisLikeCommentApi {
  static Future<void> callApi(
    String userId,
    String commentId,
    String type,
  ) async {
    AppSettings.showLog("Like DisLike Comment Api Calling...");

    final uri = Uri.parse("${Constant.baseURL + Constant.likeDislikeComment}"
        "?userId=$userId"
        "&videoCommentId=$commentId"
        "&likeOrDislike=$type");

    final headers = await AppSession.authHeaders();

    try {
      final response = await http.post(uri, headers: headers);

      if (response.statusCode == 200) {
        AppSettings.showLog("Response => ${response.body}");
      } else {
        AppSettings.showLog("StatusCode Error");
      }
    } catch (error) {
      AppSettings.showLog("Error => $error");
    }
  }
}
