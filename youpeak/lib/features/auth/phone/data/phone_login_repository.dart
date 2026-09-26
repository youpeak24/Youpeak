import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:http/http.dart' as http;
import 'package:youpeak/core/constants/app_constant.dart';
import 'package:youpeak/core/network/app_session.dart';
import 'package:youpeak/core/storage/database/database.dart';
import 'package:youpeak/features/auth/model/sign_up_model.dart';
import 'package:youpeak/features/auth/phone/data/phone_auth_service.dart';

const int loginTypePhone = 5;

/// Exchanges a verified Firebase phone ID token for a YouPeak account
/// (created on first login) and opens the per-user API session.
class PhoneLoginRepository {
  PhoneLoginRepository({http.Client? client}) : _http = client ?? http.Client();

  final http.Client _http;

  Future<SignUpModel> login(String firebaseIdToken) async {
    final fcm = Database.fcmToken;
    final response = await _http.post(
      Uri.parse(Constant.baseURL + Constant.userLogin),
      headers: {"key": Constant.secretKey, "Content-Type": "application/json"},
      body: jsonEncode({
        "loginType": loginTypePhone,
        "identity": Database.deviceId ?? "",
        // The backend requires a value; browsers register without push.
        "fcmToken": (fcm == null || fcm.isEmpty) ? "no-fcm-token" : fcm,
        "idToken": firebaseIdToken,
      }),
    );
    final json = jsonDecode(response.body);
    if (response.statusCode != 200 || json is! Map<String, dynamic> || json["status"] != true) {
      throw PhoneAuthError(json is Map && json["message"] is String ? json["message"] as String : "Couldn't sign in. Please try again.");
    }
    final model = SignUpModel.fromJson(json);
    if (model.user?.id == null) throw const PhoneAuthError("Couldn't sign in. Please try again.");
    await Database.onSetLoginType(loginTypePhone);
    await AppSession.establish(json["firebaseCustomToken"] as String?);
    return model;
  }
}

final phoneLoginRepositoryProvider = Provider<PhoneLoginRepository>((ref) => PhoneLoginRepository());
