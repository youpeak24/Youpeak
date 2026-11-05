import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:youpeak/core/storage/database/database.dart';
import 'package:youpeak/core/constants/app_constant.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'package:youpeak/core/network/app_session.dart';

// Grievance Officer mechanism (India IT Rules 2021) — client API calls.
class GrievanceApi {
  static Future<Map<String, dynamic>?> getOfficerDetails() async {
    AppSettings.showLog("Grievance Officer Api Calling...");

    final uri = Uri.parse(Constant.baseURL + Constant.grievanceOfficer);
    final headers = await AppSession.authHeaders();

    try {
      final response = await http.get(uri, headers: headers);

      if (response.statusCode == 200) {
        AppSettings.showLog("Grievance Officer Api Response => ${response.body}");
        final jsonResponse = json.decode(response.body);
        if (jsonResponse["status"] == true) {
          return Map<String, dynamic>.from(jsonResponse["data"] ?? {});
        }
      } else {
        AppSettings.showLog("Grievance Officer Api StateCode Error");
      }
    } catch (error) {
      AppSettings.showLog("Grievance Officer Api Error => $error");
    }
    return null;
  }

  static Future<Map<String, dynamic>> fileGrievance({
    required String category,
    required String description,
    String contactEmail = "",
  }) async {
    AppSettings.showLog("File Grievance Api Calling...");

    final uri = Uri.parse(Constant.baseURL + Constant.fileGrievance);
    final headers = await AppSession.authHeaders({"Content-Type": "application/json; charset=UTF-8"});

    final body = json.encode({
      "userId": Database.loginUserId ?? "",
      "category": category,
      "description": description,
      "contactEmail": contactEmail,
    });

    try {
      final response = await http.post(uri, headers: headers, body: body);

      if (response.statusCode == 200) {
        AppSettings.showLog("File Grievance Api Response => ${response.body}");
        return Map<String, dynamic>.from(json.decode(response.body));
      } else {
        AppSettings.showLog("File Grievance Api StateCode Error");
      }
    } catch (error) {
      AppSettings.showLog("File Grievance Api Error => $error");
    }
    return {"status": false, "message": "Something went wrong."};
  }

  static Future<Map<String, dynamic>> trackGrievance(String grievanceId) async {
    AppSettings.showLog("Track Grievance Api Calling...");

    final uri = Uri.parse("${Constant.baseURL}${Constant.trackGrievance}?grievanceId=$grievanceId");
    final headers = await AppSession.authHeaders();

    try {
      final response = await http.get(uri, headers: headers);

      if (response.statusCode == 200) {
        AppSettings.showLog("Track Grievance Api Response => ${response.body}");
        return Map<String, dynamic>.from(json.decode(response.body));
      } else {
        AppSettings.showLog("Track Grievance Api StateCode Error");
      }
    } catch (error) {
      AppSettings.showLog("Track Grievance Api Error => $error");
    }
    return {"status": false, "message": "Something went wrong."};
  }
}
