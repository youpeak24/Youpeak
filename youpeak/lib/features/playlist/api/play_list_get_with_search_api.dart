import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:youpeak/features/playlist/model/fetch_normal_video_model.dart';
import 'package:youpeak/features/playlist/model/get_playList_with_serach_response_model.dart';
import 'package:youpeak/core/constants/app_constant.dart';
import 'package:youpeak/core/settings/app_settings.dart';

class PlayListGetWithSearchApi {
  static int startPagination = 0;
  static int limitPagination = 20;

  static Future<GetPlayListWithSearchResponseModel?> callApi({required String search}) async {
    AppSettings.showLog("play list with search Video Api Calling...");

    startPagination += 1;

    AppSettings.showLog("Pagination Page => $startPagination");

    final uri = Uri.parse("${Constant.baseURL + Constant.playListGetWithSearch}?start=$startPagination&limit=$limitPagination&search=$search");

    AppSettings.showLog("Uri => $uri");

    final headers = {"key": Constant.secretKey};

    try {
      final response = await http.get(uri, headers: headers);

      if (response.statusCode == 200) {
        final jsonResponse = json.decode(response.body);

        AppSettings.showLog("play list with search Video Api Response => ${response.body}");

        return GetPlayListWithSearchResponseModel.fromJson(jsonResponse);
      } else {
        AppSettings.showLog("play list with search Video Api StateCode Error");
      }
    } catch (error) {
      AppSettings.showLog("play list with search Video Api Error => $error");
    }
    return null;
  }
}
