import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:youpeak/core/utils/custom_toast.dart';
import 'package:youpeak/core/constants/app_constant.dart';
import 'package:youpeak/core/settings/app_settings.dart';

class ForgotPasswordSendOtpApi {
  static Future<void> callApi(String email) async {
    AppSettings.showLog("Forgot Password SendOtp Api Calling...");

    final uri = Uri.parse(Constant.baseURL + Constant.forgotPasswordSendOtp);

    final headers = {"key": Constant.secretKey, 'Content-Type': 'application/json'};

    final body = json.encode({'email': email});
    try {
      final response = await http.post(uri, body: body, headers: headers);

      if (response.statusCode == 200) {
        final jsonResponse = json.decode(response.body);

        if (jsonResponse["status"]) CustomToast.show(jsonResponse["message"]);

        AppSettings.showLog("ForgotPassword SendOtp Response => ${response.body}");
      } else {
        AppSettings.showLog("ForgotPassword SendOtp StateCode Error");
      }
    } catch (error) {
      AppSettings.showLog("ForgotPassword SendOtp Error => $error");
    }
  }
}
