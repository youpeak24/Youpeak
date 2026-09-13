import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:youpeak/database/database.dart';
import 'package:youpeak/utils/constant/app_constant.dart';
import 'package:youpeak/utils/settings/app_settings.dart';

// Digital Partner Program — one-time license (ad-credits wallet + referral
// commissions). Purchase itself goes through the shared payment.createOrder
// flow (purpose: "digital_partner_license"); this only fetches the dashboard.
class DigitalPartnerApi {
  static Future<Map<String, dynamic>> getDashboard() async {
    AppSettings.showLog("Digital Partner Dashboard Api Calling...");

    final uri = Uri.parse("${Constant.baseURL}${Constant.getPartnerDashboard}?userId=${Database.loginUserId ?? ''}");
    final headers = {"key": Constant.secretKey};

    try {
      final response = await http.get(uri, headers: headers);
      AppSettings.showLog("Digital Partner Dashboard Api Response => ${response.body}");
      if (response.statusCode == 200) {
        return Map<String, dynamic>.from(json.decode(response.body));
      }
    } catch (error) {
      AppSettings.showLog("Digital Partner Dashboard Api Error => $error");
    }
    return {"status": false, "message": "Something went wrong."};
  }
}
