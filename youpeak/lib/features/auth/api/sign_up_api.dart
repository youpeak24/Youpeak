import 'dart:convert';

import 'package:firebase_auth/firebase_auth.dart';
import 'package:http/http.dart' as http;
import 'package:youpeak/core/network/app_session.dart';
import 'package:youpeak/core/storage/database/database.dart';
import 'package:youpeak/features/auth/model/sign_up_model.dart';
import 'package:youpeak/core/constants/app_constant.dart';
import 'package:youpeak/core/settings/app_settings.dart';

class SignUpApi {
  static Future<SignUpModel?> callApi(String email, String? password, int loginType, String fcmToken, String identity) async {
    AppSettings.showLog("SignUp Api Calling...");

    final uri = Uri.parse(Constant.baseURL + Constant.userLogin);

    final headers = {"key": Constant.secretKey, "Content-Type": "application/json"};

    // Google (2) / Apple (3) / social (1): the backend signs the user in only
    // on a verified Firebase ID token, and takes the email from that token.
    // Every caller has just signed in to Firebase with the provider, so the
    // current Firebase user is that account.
    final isSocial = loginType == 1 || loginType == 2 || loginType == 3;
    String? idToken;
    if (isSocial) {
      try {
        idToken = await FirebaseAuth.instance.currentUser?.getIdToken();
      } catch (e) {
        AppSettings.showLog("SignUp Api: couldn't read the Firebase ID token => $e");
      }
    }

    final body = isSocial
        ? json.encode({'email': email, 'loginType': loginType, 'fcmToken': fcmToken, 'identity': identity, 'idToken': idToken})
        : json.encode({'email': email, 'password': password, 'loginType': loginType, 'fcmToken': fcmToken, 'identity': identity});

    try {
      final response = await http.post(uri, headers: headers, body: body);

      if (response.statusCode == 200) {
        Database.onSetLoginType(loginType);
        AppSettings.showLog("SignUp Api Response => ${response.body}");

        final jsonResponse = json.decode(response.body);

        // Opens the per-user API session (Peak Boost, watch heartbeat, Tasker
        // dashboard, withdrawals) — see core/network/app_session.dart.
        if (jsonResponse is Map && jsonResponse["firebaseCustomToken"] is String) {
          await AppSession.establish(jsonResponse["firebaseCustomToken"] as String);
        }

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
