import 'dart:convert';
import 'dart:developer';

import 'package:get/get.dart';
import 'package:http/http.dart' as http;
import 'package:youpeak/core/utils/custom_toast.dart';
import 'package:youpeak/core/constants/app_constant.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'package:youpeak/core/constants/app_string.dart';

class EditProfileApi {
  static Future<bool> callApi({required String loginUserId, String? profileImage, required String gender}) async {
    AppSettings.showLog("Edit Profile Api Calling...");

    try {
      final headers = {"key": Constant.secretKey, "Content-Type": 'application/json'};

      final uri = Uri.parse('${Constant.baseURL + Constant.updateProfile}?userId=$loginUserId');

      // Required Fields...
      final body = profileImage != null
          ? json.encode({
              "fullName": AppSettings.nameController.text.trim(),
              "nickName": AppSettings.nickNameController.text.trim(),
              "email": AppSettings.emailController.text.trim(),
              "gender": gender,
              "mobileNumber": AppSettings.phoneController.text.trim(),
              "image": profileImage,
              "channelType": AppSettings.channelType.value.toString(),
              "age": AppSettings.ageController.text.trim(),
              "country": AppSettings.countryController.text.trim(),
              "ipAddress": AppSettings.ipAddress,
              "instagramLink": AppSettings.instagramController.text.trim(),
              "facebookLink": AppSettings.facebookController.text.trim(),
              "twitterLink": AppSettings.twitterController.text.trim(),
              "websiteLink": AppSettings.websiteController.text.trim(),
            })
          : json.encode({
              "fullName": AppSettings.nameController.text.trim(),
              "nickName": AppSettings.nickNameController.text.trim(),
              "email": AppSettings.emailController.text.trim(),
              "gender": gender,
              "mobileNumber": AppSettings.phoneController.text.trim(),
              "channelType": AppSettings.channelType.value.toString(),
              "age": AppSettings.ageController.text.trim(),
              "country": AppSettings.countryController.text.trim(),
              "ipAddress": AppSettings.ipAddress,
              "instagramLink": AppSettings.instagramController.text.trim(),
              "facebookLink": AppSettings.facebookController.text.trim(),
              "twitterLink": AppSettings.twitterController.text.trim(),
              "websiteLink": AppSettings.websiteController.text.trim(),
            });

      log("body ************ $body");

      final response = await http.patch(uri, body: body, headers: headers).timeout(const Duration(seconds: 15));

      final jsonResponse = jsonDecode(response.body);

      AppSettings.showLog("*********** ${response.body}");

      if (jsonResponse["message"] == "The provided channelName is already in use. Please choose a different one.") {
        CustomToast.show(AppStrings.channelNameIsAlreadyInUse.tr);
      } else if (jsonResponse["status"] == false) {
        CustomToast.show(AppStrings.someThingWentWrong.tr);
      }

      if (response.statusCode == 200) {
        AppSettings.showLog("Edit Profile Api Response => ${response.body}");
        return jsonResponse["status"];
      } else {
        AppSettings.showLog("Edit Profile Api Status Code Error");
        return jsonResponse["status"];
      }
    } catch (e) {
      AppSettings.showLog("Edit Profile Api Error => $e");
      CustomToast.show(AppStrings.someThingWentWrong.tr);
      return false;
    }
  }
}
