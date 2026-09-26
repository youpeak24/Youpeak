import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:youpeak/core/storage/database/database.dart';
import 'package:youpeak/features/profile/model/get_profile_model.dart';
import 'package:youpeak/core/constants/app_constant.dart';
import 'package:youpeak/core/services/convert_to_network.dart';
import 'package:youpeak/core/settings/app_settings.dart';

class GetProfileApi {
  static GetProfileModel? profileModel;

  /// Server's verdict on whether the app must show the web-portal activation
  /// lock screen: {locked, reason, activationUrl} (util/accessGate.js).
  static Map<String, dynamic>? accessGate;
  static Future<void> callApi(String loginUserId) async {
    AppSettings.showLog("GetProfile Api Calling... $loginUserId");

    final uri = Uri.parse("${Constant.baseURL + Constant.getProfile}?userId=$loginUserId");

    AppSettings.showLog("GetProfile Api Calling... $uri");

    final headers = {"key": Constant.secretKey};

    try {
      final response = await http.get(uri, headers: headers);

      if (response.statusCode == 200) {
        final jsonResponse = json.decode(response.body);

        profileModel = GetProfileModel.fromJson(jsonResponse);
        final gate = jsonResponse is Map ? (jsonResponse["user"] is Map ? jsonResponse["user"]["accessGate"] : null) : null;
        accessGate = gate is Map ? Map<String, dynamic>.from(gate) : null;

        if (profileModel != null && profileModel?.user != null) {
          final userId = profileModel?.user?.id ?? loginUserId;
          Database.onSetIsNewUser(false);
          Database.onSetLoginUserId(userId);

          AppSettings.channelName.value = profileModel?.user?.fullName ?? "";



          if (profileModel!.user!.channelId != null && profileModel!.user!.isChannel != null) {
            Database.onSetChannelId(profileModel!.user!.channelId!);
            Database.onSetIsChannel(profileModel!.user!.isChannel!);
          }
          if (profileModel?.user?.image != null) {
            String image = await ConvertToNetwork.convert(profileModel!.user!.image!);

            AppSettings.showLog("Profile Image => $image");
            Database.onSetProfileImage(image);
            AppSettings.profileImage.value = image;
          }
        }
        AppSettings.showLog("GetProfile Response => ${response.body}");
      } else {
        AppSettings.showLog("GetProfile StateCode Error");
      }
    } catch (error) {
      AppSettings.showLog("GetProfile Api Error => $error");
    }
  }
}
