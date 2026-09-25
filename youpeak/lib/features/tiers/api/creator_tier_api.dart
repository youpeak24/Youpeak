import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:youpeak/core/storage/database/database.dart';
import 'package:youpeak/core/constants/app_constant.dart';
import 'package:youpeak/core/settings/app_settings.dart';

// Creator VIP Pass — subscriber-gated ad-revenue-share tiers.
class CreatorTierApi {
  static Future<Map<String, dynamic>> getAvailableTiers() async {
    AppSettings.showLog("Creator Tier Api Calling...");

    final uri = Uri.parse("${Constant.baseURL}${Constant.getCreatorTiers}?userId=${Database.loginUserId ?? ''}");
    final headers = {"key": Constant.secretKey};

    try {
      final response = await http.get(uri, headers: headers);
      AppSettings.showLog("Creator Tier Api Response => ${response.body}");
      if (response.statusCode == 200) {
        return Map<String, dynamic>.from(json.decode(response.body));
      }
    } catch (error) {
      AppSettings.showLog("Creator Tier Api Error => $error");
    }
    return {"status": false, "message": "Something went wrong."};
  }
}
