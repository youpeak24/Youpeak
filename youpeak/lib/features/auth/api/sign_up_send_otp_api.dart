import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:youpeak/core/utils/custom_toast.dart';
import 'package:youpeak/core/constants/app_constant.dart';
import 'package:youpeak/core/settings/app_settings.dart';

class SignUpSendOtpApi {
  static Future<void> callApi(String email) async {
    AppSettings.showLog("SignUp Send Otp Api Calling...");

    final uri = Uri.parse(Constant.baseURL + Constant.loginSendOtp);

    final headers = {"key": Constant.secretKey, 'Content-Type': 'application/json'};

    final body = json.encode({'email': email});
    AppSettings.showLog("SignUp Send Otp Api BodY ${body}");
    try {
      final response = await http.post(uri, body: body, headers: headers);
      AppSettings.showLog("SignUp Send Otp Api ${response.body}");
      if (response.statusCode == 200) {
        final jsonResponse = json.decode(response.body);

        if (jsonResponse["status"]) CustomToast.show(jsonResponse["message"]);

        AppSettings.showLog("SignUp Send Otp Api Response => ${response.body}");
      } else {
        AppSettings.showLog("SignUp Send Otp Api StateCode Error");
      }
    } catch (error) {
      AppSettings.showLog("SignUp Send Otp Api Error => $error");
    }
  }
}
