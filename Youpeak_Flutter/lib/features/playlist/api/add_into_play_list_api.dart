import 'dart:convert';

import 'package:get/get.dart';
import 'package:http/http.dart' as http;
import 'package:youpeak/core/utils/custom_toast.dart';
import 'package:youpeak/core/constants/app_constant.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'package:youpeak/core/constants/app_string.dart';
import 'package:youpeak/core/network/app_session.dart';

class AddIntoPlayListApi {
  static Future<void> callApi(
    String loginUserId,
    String loginUserChannelId,
    String playListId,
    String videoId,
    String playListName,
    int playListType,
  ) async {
    AppSettings.showLog("Add Into PlayList Api Calling...");

    final headers = await AppSession.authHeaders({"Content-Type": "application/json"});

    final uri = Uri.parse(Constant.baseURL + Constant.updatePlayList);

    final body = json.encode({
      "userId": loginUserId,
      "playListId": playListId,
      "playListName": playListName,
      "playListType": playListType,
      "videoId": [videoId], // 👈 Important
      "type": "add",
    });

    final response = await http.patch(uri, body: body, headers: headers);

    AppSettings.showLog("Body => $body");
    AppSettings.showLog("URI => $uri");

    if (response.statusCode == 200) {
      Map<String, dynamic> jsonResponse = json.decode(response.body);

      if (jsonResponse["message"] == "The video already exists in the playlist.") {
        CustomToast.show(AppStrings.videoAlreadyAdded.tr);
      } else {
        CustomToast.show(AppStrings.videoAddedSuccess.tr);
      }
    } else {
      CustomToast.show(AppStrings.someThingWentWrong.tr);
    }
  }
}

class RemoveIntoPlayListApi {
  static Future<void> callApi(
    String loginUserId,
    String loginUserChannelId,
    String playListId,
    String videoId,
    String playListName,
    int playListType,
  ) async {
    AppSettings.showLog("Remove Into PlayList Api Calling...");

    final headers = await AppSession.authHeaders({"Content-Type": "application/json"});

    final uri = Uri.parse(Constant.baseURL + Constant.updatePlayList);

    final body = json.encode({
      "userId": loginUserId,
      "playListId": playListId,
      "playListName": playListName,
      "playListType": playListType,
      "videoId": [videoId],
      "type": "remove",
    });

    final response = await http.patch(uri, body: body, headers: headers);

    AppSettings.showLog("Body => $body");
    AppSettings.showLog("URI => $uri");

    if (response.statusCode == 200) {
      Map<String, dynamic> jsonResponse = json.decode(response.body);

      if (jsonResponse["message"] == "The video already exists in the playlist.") {
        CustomToast.show(AppStrings.videoAlreadyAdded.tr);
      } else {
        CustomToast.show(AppStrings.videoRemovedSuccess.tr);
      }
    } else {
      CustomToast.show(AppStrings.someThingWentWrong.tr);
    }
  }
}
