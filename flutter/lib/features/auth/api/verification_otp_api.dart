import 'dart:convert';

import 'package:get/get.dart';
import 'package:http/http.dart' as http;
import 'package:youpeak/core/utils/custom_toast.dart';
import 'package:youpeak/shared/widgets/loader_ui.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:youpeak/core/constants/app_constant.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'package:youpeak/core/network/app_session.dart';

class VerificationOtpApi {
  static Future<bool?> callApi(String email, String otp) async {
    AppSettings.showLog("VerificationOtp Api Calling...");

    final uri = Uri.parse(Constant.baseURL + Constant.verificationOtp);

    final headers = await AppSession.authHeaders({"Content-Type": "application/json"});

    final body = json.encode({'email': email, 'otp': otp});
    try {
      Get.dialog(const LoaderUi(color: AppColor.white), barrierDismissible: false);
      final response = await http.post(uri, body: body, headers: headers);
      Get.back();
      if (response.statusCode == 200) {
        final jsonResponse = json.decode(response.body);

        CustomToast.show(jsonResponse["message"]);
        AppSettings.showLog("VerificationOtp Response => ${response.body}");

        return jsonResponse["status"];
      } else {
        AppSettings.showLog("VerificationOtp StateCode Error");
      }
    } catch (error) {
      AppSettings.showLog("VerificationOtp Error => $error");
    }
    return null;
  }
}
