import 'package:http/http.dart' as http;
import 'package:youpeak/core/storage/database/database.dart';
import 'package:youpeak/core/constants/app_constant.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'package:youpeak/core/network/app_session.dart';

// class LikeDisLikeVideoApi {
//   static Future<void> callApi(String videoId, bool isLike) async {
//     AppSettings.showLog("Like DisLike Video Api Calling...$isLike");
//
//     final uri = Uri.parse(
//         "${Constant.baseURL + Constant.likeDislikeVideo}?userId=${Database.loginUserId!}&videoId=$videoId&likeOrDislike=${isLike ? "like" : "dislike"}");
//
//     final headers = {"key": Constant.secretKey};
//
//     AppSettings.showLog("uri>>>>>>>>>>>>>>>>>>>>$uri");
//
//     try {
//       final response = await http.post(uri, headers: headers);
//
//       if (response.statusCode == 200) {
//         AppSettings.showLog("Like DisLike Video Api Response => ${response.body}");
//       } else {
//         AppSettings.showLog("Like DisLike Video Api StateCode Error");
//       }
//     } catch (error) {
//       AppSettings.showLog("Like DisLike Video Api Error => $error");
//     }
//   }
// }
class LikeDisLikeVideoApi {
  static Future<void> callApi(String videoId, String action) async {
    AppSettings.showLog("Like DisLike Video Api Calling...$action");

    final uri = Uri.parse("${Constant.baseURL + Constant.likeDislikeVideo}?userId=${Database.loginUserId!}&videoId=$videoId&likeOrDislike=$action");

    final headers = await AppSession.authHeaders();

    try {
      final response = await http.post(uri, headers: headers);

      if (response.statusCode == 200) {
        AppSettings.showLog("Response => ${response.body}");
      } else {
        AppSettings.showLog("StateCode Error");
      }
    } catch (error) {
      AppSettings.showLog("Error => $error");
    }
  }
}
