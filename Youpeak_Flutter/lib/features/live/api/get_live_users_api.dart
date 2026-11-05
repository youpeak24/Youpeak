import 'dart:convert';

import 'package:get/get.dart';
import 'package:http/http.dart' as http;
import 'package:youpeak/features/live/model/get_live_users_model.dart';
import 'package:youpeak/core/constants/app_constant.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'package:youpeak/core/network/app_session.dart';

class GetLiveUsersApi {
  static GetLiveUsersModel? getLiveUsersModel;
  static RxList<LiveUserList> mainLiveUsers = <LiveUserList>[].obs;

  static bool isLive(String channelId) {
    bool isLiveUser = false;
    for (int i = 0; i < GetLiveUsersApi.mainLiveUsers.length; i++) {
      if (GetLiveUsersApi.mainLiveUsers[i].channelId == channelId) {
        isLiveUser = true;
        break;
      }
    }
    return isLiveUser;
  }

  static String roomId(String channelId) {
    String id = "";
    for (int i = 0; i < GetLiveUsersApi.mainLiveUsers.length; i++) {
      if (GetLiveUsersApi.mainLiveUsers[i].channelId == channelId) {
        id = GetLiveUsersApi.mainLiveUsers[i].liveHistoryId!;
        break;
      }
    }
    return id;
  }

  static Future<void> callApi({required String loginUserId}) async {
    AppSettings.showLog("Get Live Users Api Calling...");

    final uri = Uri.parse(
        "${Constant.baseURL + Constant.getLiveUsers}?userId=$loginUserId");

    final headers = await AppSession.authHeaders();

    try {
      final response = await http.get(uri, headers: headers);

      if (response.statusCode == 200) {
        AppSettings.showLog("Get Live1 Users Api Response => ${response.body}");
        final jsonResponse = jsonDecode(response.body);
        getLiveUsersModel = GetLiveUsersModel.fromJson(jsonResponse);
        if (getLiveUsersModel != null) {
          mainLiveUsers.value = getLiveUsersModel!.liveUserList!;
        }
      } else {
        AppSettings.showLog("Get Live1 Users Api StateCode Error");
      }
    } catch (error) {
      AppSettings.showLog("Get Live1 Users Api Error => $error");
    }
  }
}
