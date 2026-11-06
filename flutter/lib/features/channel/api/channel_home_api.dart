import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:youpeak/features/channel/model/channel_home_model.dart';
import 'package:youpeak/features/channel/model/get_play_list_model.dart';
import 'package:youpeak/core/constants/app_constant.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'package:youpeak/core/network/api_problem.dart';
import 'package:youpeak/core/network/app_api_client.dart';
import 'package:youpeak/core/network/app_session.dart';

/// One channel-home page, or the reason it couldn't be loaded.
class ChannelHomeFetch {
  const ChannelHomeFetch({this.model, this.problem});

  final ChannelHomeModel? model;
  final ApiProblem? problem;

  bool get ok => model != null;
}

class ChannelHomeApi {
  static int startPagination = 0;
  static int limitPagination = 20;

  /// Like [callApi], but says *why* a load failed (signed out, session
  /// expired, refused, offline, server error, unreadable reply) instead of
  /// returning null for all of them. An expired ID token is refreshed once and
  /// retried by [AppApiClient].
  static Future<ChannelHomeFetch> fetch(String userId, String channelId, {AppApiClient? api}) async {
    startPagination += 1;
    final path = "${Constant.channelHome}?channelId=${Uri.encodeQueryComponent(channelId)}&userId=${Uri.encodeQueryComponent(userId)}"
        "&start=$startPagination&limit=$limitPagination";
    try {
      final json = await (api ?? AppApiClient()).get(path);
      try {
        return ChannelHomeFetch(model: ChannelHomeModel.fromJson(json));
      } catch (e) {
        AppSettings.showLog("Channel Home reply unreadable => ${e.runtimeType}");
        return const ChannelHomeFetch(problem: ApiProblem.unreadable(httpStatus: 200));
      }
    } on ApiException catch (e) {
      final problem = ApiProblem.fromException(e);
      AppSettings.showLog("Channel Home failed => ${problem.diagnostic}");
      return ChannelHomeFetch(problem: problem);
    }
  }

  static Future<ChannelHomeModel?> callApi(String userId, String channelId) async {
    AppSettings.showLog("Channel Home Api Calling...$userId **** $channelId");

    startPagination += 1;
    AppSettings.showLog("Pagination Page Index => $startPagination");

    final uri =
        Uri.parse("${Constant.baseURL + Constant.channelHome}?channelId=$channelId&userId=$userId&start=$startPagination&limit=$limitPagination");

    AppSettings.showLog("Channel Home Api => $uri");

    final headers = await AppSession.authHeaders();

    try {
      final response = await http.get(uri, headers: headers);

      if (response.statusCode == 200) {
        final jsonResponse = json.decode(response.body);

        AppSettings.showLog("Channel Home Api Response => ${response.body}");

        return ChannelHomeModel.fromJson(jsonResponse);
      } else {
        AppSettings.showLog("Channel Home Api StateCode Error");
      }
    } catch (error) {
      AppSettings.showLog("Channel Home Api Error => $error");
    }
    return null;
  }
}

class GetPlayListOnlyApi {
  static int startPagination = 0;
  static int limitPagination = 20;

  static Future<GetPlayListModel?> callApi(String userId, String playListId) async {
    AppSettings.showLog("get play list Api Calling...$userId **** $playListId");

    startPagination += 1;
    AppSettings.showLog("Pagination Page Index => $startPagination");

    final uri = Uri.parse(
        "${Constant.baseURL + Constant.getPlayListVideos}?playListId=$playListId&userId=$userId&start=$startPagination&limit=$limitPagination");

    AppSettings.showLog("get play list Api => $uri");

    final headers = await AppSession.authHeaders();

    try {
      final response = await http.get(uri, headers: headers);

      if (response.statusCode == 200) {
        final jsonResponse = json.decode(response.body);

        AppSettings.showLog("get play list Api Response => ${response.body}");

        return GetPlayListModel.fromJson(jsonResponse);
      } else {
        AppSettings.showLog("get play list Api StateCode Error");
      }
    } catch (error) {
      AppSettings.showLog("get play list Api Error => $error");
    }
    return null;
  }
}
