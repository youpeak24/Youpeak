import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:youpeak/database/database.dart';
import 'package:youpeak/pages/login_related_page/fill_profile_page/get_profile_model.dart';
import 'package:youpeak/utils/constant/app_constant.dart';
import 'package:youpeak/utils/services/convert_to_network.dart';
import 'package:youpeak/utils/settings/app_settings.dart';

class GetProfileApi {
  static GetProfileModel? profileModel;
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
