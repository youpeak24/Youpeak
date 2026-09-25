import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:youpeak/core/storage/database/database.dart';
import 'package:youpeak/core/constants/app_constant.dart';
import 'package:youpeak/core/settings/app_settings.dart';

// Video Promotion (DOC-20260826-WA0214) — plan pricing + the caller's own
// campaign history. Purchasing itself goes through the shared
// payment.createOrder flow (purpose: "video_promotion"), same as every
// other paid feature.
class VideoPromotionApi {
  static Future<Map<String, dynamic>> getPlans() async {
    AppSettings.showLog("Video Promotion Plans Api Calling...");

    final uri = Uri.parse(Constant.baseURL + Constant.getVideoPromotionPlans);
    final headers = {"key": Constant.secretKey};

    try {
      final response = await http.get(uri, headers: headers);
      AppSettings.showLog("Video Promotion Plans Api Response => ${response.body}");
      if (response.statusCode == 200) {
        return Map<String, dynamic>.from(json.decode(response.body));
      }
    } catch (error) {
      AppSettings.showLog("Video Promotion Plans Api Error => $error");
    }
    return {"status": false, "message": "Something went wrong."};
  }

  static Future<Map<String, dynamic>> getMyCampaigns() async {
    AppSettings.showLog("My Video Promotions Api Calling...");

    final uri = Uri.parse("${Constant.baseURL}${Constant.getMyVideoPromotions}?userId=${Database.loginUserId ?? ''}");
    final headers = {"key": Constant.secretKey};

    try {
      final response = await http.get(uri, headers: headers);
      AppSettings.showLog("My Video Promotions Api Response => ${response.body}");
      if (response.statusCode == 200) {
        return Map<String, dynamic>.from(json.decode(response.body));
      }
    } catch (error) {
      AppSettings.showLog("My Video Promotions Api Error => $error");
    }
    return {"status": false, "message": "Something went wrong."};
  }
}
