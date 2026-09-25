import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:youpeak/core/storage/database/database.dart';
import 'package:youpeak/features/auth/model/sign_up_model.dart';
import 'package:youpeak/core/constants/app_constant.dart';
import 'package:youpeak/core/settings/app_settings.dart';

class SignUpApi {
  static Future<SignUpModel?> callApi(String email, String? password, int loginType, String fcmToken, String identity) async {
    AppSettings.showLog("SignUp Api Calling...");

    final uri = Uri.parse(Constant.baseURL + Constant.userLogin);

    final headers = {"key": Constant.secretKey, "Content-Type": "application/json"};

    final body = loginType == 2 // Use => If Login With Google
        ? json.encode({'email': email, 'loginType': loginType, 'fcmToken': fcmToken, 'identity': identity})
        : json.encode({'email': email, 'password': password, 'loginType': loginType, 'fcmToken': fcmToken, 'identity': identity});

    try {
      final response = await http.post(uri, headers: headers, body: body);

      if (response.statusCode == 200) {
        Database.onSetLoginType(loginType);
        AppSettings.showLog("SignUp Api Response => ${response.body}");

        final jsonResponse = json.decode(response.body);

        return SignUpModel.fromJson(jsonResponse);
      } else {
        AppSettings.showLog("SignUp Api StateCode Error");
      }
    } catch (error) {
      AppSettings.showLog("SignUp Api Error => $error");
    }
    return null;
  }
}
