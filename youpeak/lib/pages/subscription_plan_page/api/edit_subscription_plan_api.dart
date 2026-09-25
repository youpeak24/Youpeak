import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:youpeak/pages/login_related_page/fill_profile_page/get_profile_model.dart';
import 'package:youpeak/utils/constant/app_constant.dart';
import 'package:youpeak/utils/settings/app_settings.dart';

class EditSubscriptionPlanApi {
  static Future<GetProfileModel?> callApi({required String loginUserId, required String subscriptionCost, required String videoUnlockCost}) async {
    AppSettings.showLog("Edit Subscription Plan Api Calling...");

    try {
      final headers = {"key": Constant.secretKey, "Content-Type": 'application/json'};

      final uri = Uri.parse('${Constant.baseURL + Constant.updateProfile}?userId=$loginUserId');

      final body = json.encode({
        "subscriptionCost": subscriptionCost,
        "videoUnlockCost": videoUnlockCost,
      });

      AppSettings.showLog("Edit Subscription Plan Api Body => $body");

      final response = await http.patch(uri, body: body, headers: headers);

      final jsonResponse = jsonDecode(response.body);

      AppSettings.showLog("Edit Subscription Plan Api Response => ${response.body}");

      if (response.statusCode == 200) {
        return GetProfileModel.fromJson(jsonResponse);
      } else {
        AppSettings.showLog("Edit Subscription Plan Api Status Code Error");
        return null;
      }
    } catch (e) {
      AppSettings.showLog("Edit Subscription Plan Api Error => $e");
      return null;
    }
  }
}
