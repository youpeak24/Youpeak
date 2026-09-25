import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:youpeak/features/bites/model/get_shorts_video_model.dart';
import 'package:youpeak/core/constants/app_constant.dart';
import 'package:youpeak/core/settings/app_settings.dart';

class GetPreviewShortsVideoApi {
  static GetShortsVideoModel? getShortsVideoModel;
  static int startPagination = 0;
  static int limitPagination = 30;

  static Future<GetShortsVideoModel?> callApi(String loginUserId, [num? page, num? limit]) async {
    AppSettings.showLog("Get Shorts Video Api Calling... ");

    startPagination += 1;

    AppSettings.showLog("Get Shorts Pagination Page => $startPagination");

    final uri = Uri.parse(
        "${Constant.baseURL + Constant.getShortsVideo}?userId=$loginUserId&start=${page ?? startPagination}&limit=${limit ?? limitPagination}");

    final headers = {"key": Constant.secretKey};

    try {
      var response = await http.get(uri, headers: headers);

      if (response.statusCode == 200) {
        final jsonResponse = json.decode(response.body);
        AppSettings.showLog("Get Shorts Video Api => ${response.body}");

        return GetShortsVideoModel.fromJson(jsonResponse);
      } else {
        AppSettings.showLog("Get Shorts Video Api Video StateCode Error");
      }
    } catch (error) {
      AppSettings.showLog("Get Shorts Video Api Video Error => $error");
    }
    return null;
  }
}

//  Get Selected Video First Api...

//
// class PreviewShortsApi {
//   static int startPagination = 0;
//   static int limitPagination = 20;
//
//   static Future<PreviewShortsModel?> callApi({required String loginUserId, required String videoId}) async {
//     AppSettings.showLog("Preview Shorts Api Calling...");
//     startPagination += 1;
//     AppSettings.showLog("Pagination Page => $startPagination");
//
//     final uri = Uri.parse("${Constant.baseURL + Constant.previewShorts}?userId=$loginUserId&videoId=$videoId&start=$startPagination&limit=$limitPagination");
//
//     final headers = {"key": Constant.secretKey};
//
//     try {
//       final response = await http.get(uri, headers: headers);
//
//       if (response.statusCode == 200) {
//         final jsonResponse = json.decode(response.body);
//
//         AppSettings.showLog("Preview Shorts Api Response => ${response.body}");
//         return PreviewShortsModel.fromJson(jsonResponse);
//       } else {
//         AppSettings.showLog("Preview Shorts Api StateCode Error");
//       }
//     } catch (error) {
//       AppSettings.showLog("Preview Shorts Api Error => $error");
//     }
//     return null;
//   }
// }
