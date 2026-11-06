import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:youpeak/features/search/model/search_model.dart';
import 'package:youpeak/core/constants/app_constant.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'package:youpeak/core/network/app_session.dart';

class SearchApi {
  static int startPagination = 1;
  static int limitPagination = 10;
  static bool hasMoreData = true;

  static Future<SearchModel?> callApi(
      String userId, String searchString, String type) async {
    AppSettings.showLog("Search Api Calling... Page: $startPagination");

    // Encoded: "C++", "&", "#" and Tamil text reach the server as typed.
    final uri = Uri.parse(Constant.baseURL + Constant.search).replace(queryParameters: {
      "userId": userId,
      "searchString": searchString,
      "type": type,
      "start": "$startPagination",
      "limit": "$limitPagination",
    });

    AppSettings.showLog("Search Api url => $uri");
    final headers = await AppSession.authHeaders();

    try {
      final response = await http.post(uri, headers: headers);

      if (response.statusCode == 200) {
        final jsonResponse = json.decode(response.body);

        AppSettings.showLog(
            "model>>>>>>>>>>>>>>>>>>>>>${jsonEncode(jsonResponse)}");

        final model = SearchModel.fromJson(jsonResponse);

        final videoLen = model.searchData?.videos?.length ?? 0;
        final shortsLen = model.searchData?.shorts?.length ?? 0;
        final channelLen = model.searchData?.channel?.length ?? 0;
        hasMoreData = videoLen >= limitPagination ||
            shortsLen >= limitPagination ||
            channelLen >= limitPagination;

        AppSettings.showLog("Page: $startPagination | hasMore: $hasMoreData");
        return model;
      } else {
        AppSettings.showLog("Search Api StatusCode Error => ${response.body}");
        return null;
      }
    } catch (error) {
      AppSettings.showLog("Search Api Error => $error");
      return null;
    }
  }
}
