import 'dart:convert';

import 'package:firebase_auth/firebase_auth.dart';
import 'package:http/http.dart' as http;
import 'package:youpeak/core/network/app_session.dart';
import 'package:youpeak/core/storage/database/database.dart';
import 'package:youpeak/features/auth/model/sign_up_model.dart';
import 'package:youpeak/core/constants/app_constant.dart';
import 'package:youpeak/core/settings/app_settings.dart';

/// What to say when the backend answers 401 to the login call itself (before
/// any account is looked at): the app build's client key was refused.
///
/// With no key compiled in, this is a build made without its configuration:
/// a developer's `flutter run`/`flutter build` that skipped the key, which
/// the supported scripts avoid. With a key, it is a build whose key is out of
/// date, which an update fixes.
String signInRejectedMessage({required bool keyCompiledIn}) => keyCompiledIn
    ? "This version of the YouPeak app can't connect to YouPeak right now. Please install the latest version."
    : "This copy of the app was built without its API key, so YouPeak rejects it (HTTP 401). "
        "Install the official release, or if you are running it from source use scripts/run-web-dev.ps1.";

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

    // The backend rejects a login without an FCM token ("Invalid details").
    // The web app has no push token and a phone may fail to get one, so send
    // the same placeholder as the phone-number login does.
    final pushToken = fcmToken.isEmpty ? "no-fcm-token" : fcmToken;

    final body = isSocial
        ? json.encode({'email': email, 'loginType': loginType, 'fcmToken': pushToken, 'identity': identity, 'idToken': idToken})
        : json.encode({'email': email, 'password': password, 'loginType': loginType, 'fcmToken': pushToken, 'identity': identity});

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
      } else if (response.statusCode == 401) {
        // The server refused this app build's client key (a build made
        // without the production key). Say so: it isn't the user's account.
        AppSettings.showLog("SignUp Api 401: client key rejected (key compiled in: ${Constant.secretKey.isNotEmpty})");
        return SignUpModel(status: false, message: signInRejectedMessage(keyCompiledIn: Constant.secretKey.isNotEmpty));
      } else {
        AppSettings.showLog("SignUp Api StateCode Error ${response.statusCode}");
        return SignUpModel(status: false, message: "YouPeak couldn't sign you in right now (server error). Please try again in a moment.");
      }
    } catch (error) {
      AppSettings.showLog("SignUp Api Error => ${error.runtimeType}");
      return SignUpModel(status: false, message: "Couldn't reach YouPeak. Check your internet connection and try again.");
    }
  }
}
