import 'dart:async';
import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:youpeak/core/network/api_problem.dart';
import 'package:youpeak/core/network/app_api_client.dart';
import 'package:youpeak/core/storage/database/database.dart';
import 'package:youpeak/features/profile/model/get_profile_model.dart';
import 'package:youpeak/core/constants/app_constant.dart';
import 'package:youpeak/core/services/convert_to_network.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'package:youpeak/core/network/app_session.dart';

class GetProfileApi {
  static GetProfileModel? profileModel;

  /// Server's verdict on whether the app must show the web-portal activation
  /// lock screen: {locked, reason, activationUrl} (util/accessGate.js).
  static Map<String, dynamic>? accessGate;

  /// Why the last [callApi] didn't produce a profile (null when it did).
  /// Lets the splash tell "the server says this account is gone" (sign out)
  /// from "the network was slow or down" (keep the session and retry).
  static ApiProblem? lastProblem;

  /// The profile call is still running (the splash gave up waiting on it).
  static bool inFlight = false;

  static Future<void> callApi(String loginUserId) async {
    AppSettings.showLog("GetProfile Api Calling... $loginUserId");
    lastProblem = null;
    inFlight = true;

    final uri = Uri.parse("${Constant.baseURL + Constant.getProfile}?userId=$loginUserId");

    AppSettings.showLog("GetProfile Api Calling... $uri");

    final headers = await AppSession.authHeaders();

    try {
      final response = await http.get(uri, headers: headers).timeout(const Duration(seconds: 20));

      Map<String, dynamic> body = const {};
      try {
        final decoded = json.decode(response.body);
        if (decoded is Map<String, dynamic>) body = decoded;
      } catch (_) {}
      if (response.statusCode != 200 || body["status"] != true) {
        lastProblem = ApiProblem.fromException(ApiException(
          (body["code"] ?? (response.statusCode >= 500 ? "SERVER_ERROR" : "REQUEST_FAILED")).toString(),
          (body["message"] ?? "").toString(),
          httpStatus: response.statusCode,
          data: body,
        ));
      }

      if (response.statusCode == 200) {
        final jsonResponse = json.decode(response.body);

        profileModel = GetProfileModel.fromJson(jsonResponse);
        final gate = jsonResponse is Map ? (jsonResponse["user"] is Map ? jsonResponse["user"]["accessGate"] : null) : null;
        accessGate = gate is Map ? Map<String, dynamic>.from(gate) : null;

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
    } on TimeoutException {
      lastProblem = const ApiProblem(ApiProblemKind.timeout, code: "NETWORK_TIMEOUT");
      AppSettings.showLog("GetProfile Api timed out");
    } catch (error) {
      // A thrown error with no HTTP answer: no connection (or an unreadable reply).
      lastProblem = error is FormatException
          ? const ApiProblem.unreadable(httpStatus: 200)
          : const ApiProblem(ApiProblemKind.offline, code: "NETWORK_ERROR");
      AppSettings.showLog("GetProfile Api Error => ${error.runtimeType}");
    } finally {
      inFlight = false;
    }
  }
}
