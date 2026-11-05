import 'dart:convert';

import 'package:get/get.dart';
import 'package:http/http.dart' as http;
import 'package:youpeak/core/utils/custom_toast.dart';
import 'package:youpeak/core/constants/app_constant.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'package:youpeak/core/constants/app_string.dart';
import 'package:youpeak/core/network/app_session.dart';

// ******************* Edit Complete *************************

class ReportVideoApi {
  static Future<void> callApi(String userId, String videoId, int reportType) async {
    AppSettings.showLog("Report Video Api Calling...");

    final uri = Uri.parse("${Constant.baseURL + Constant.reportVideo}?userId=$userId&videoId=$videoId&reportType=$reportType");

    final headers = await AppSession.authHeaders();

    try {
      final response = await http.post(uri, headers: headers);

      if (response.statusCode == 200) {
        AppSettings.showLog("Report Video Api Response => ${response.body}");

        Map<String, dynamic> jsonResponse = json.decode(response.body);

        if (jsonResponse["status"]) {
          CustomToast.show(AppStrings.reportSendSuccess.tr);
        }
      } else {
        AppSettings.showLog("Report Video Api StateCode Error");
      }
    } catch (error) {
      AppSettings.showLog("Report Video Api Error => $error");
    }
  }
}
