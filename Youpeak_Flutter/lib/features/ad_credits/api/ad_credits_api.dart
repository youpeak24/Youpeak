import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:youpeak/core/constants/app_constant.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'package:youpeak/core/network/app_session.dart';
import 'package:youpeak/features/ad_credits/model/ad_credits_models.dart';

class AdCreditsApi {
  static Future<AdCreditWalletData?> fetchWallet() async {
    AppSettings.showLog("AdCreditsApi: fetchWallet calling...");
    final uri = Uri.parse("${Constant.baseURL}${Constant.adCreditsWallet}");
    final headers = await AppSession.authHeaders();

    try {
      final response = await http.get(uri, headers: headers);
      AppSettings.showLog("AdCreditsApi: fetchWallet response => ${response.body}");
      if (response.statusCode == 200) {
        final jsonResponse = json.decode(response.body);
        if (jsonResponse['status'] == true && jsonResponse['wallet'] != null) {
          return AdCreditWalletData.fromJson(Map<String, dynamic>.from(jsonResponse['wallet']));
        }
      }
    } catch (e) {
      AppSettings.showLog("AdCreditsApi fetchWallet error: $e");
    }
    return null;
  }

  static Future<List<AdCreditPack>> fetchPacks() async {
    AppSettings.showLog("AdCreditsApi: fetchPacks calling...");
    final uri = Uri.parse("${Constant.baseURL}${Constant.adCreditsPacks}");
    final headers = await AppSession.authHeaders();

    try {
      final response = await http.get(uri, headers: headers);
      AppSettings.showLog("AdCreditsApi: fetchPacks response => ${response.body}");
      if (response.statusCode == 200) {
        final jsonResponse = json.decode(response.body);
        if (jsonResponse['status'] == true && jsonResponse['packs'] is List) {
          return (jsonResponse['packs'] as List)
              .map((p) => AdCreditPack.fromJson(Map<String, dynamic>.from(p)))
              .where((p) => p.isActive)
              .toList();
        }
      }
    } catch (e) {
      AppSettings.showLog("AdCreditsApi fetchPacks error: $e");
    }
    return [];
  }

  static Future<List<AdCreditLedgerItem>> fetchHistory({int limit = 20, String? startAfter}) async {
    AppSettings.showLog("AdCreditsApi: fetchHistory calling...");
    var url = "${Constant.baseURL}${Constant.adCreditsHistory}?limit=$limit";
    if (startAfter != null && startAfter.isNotEmpty) {
      url += "&startAfter=$startAfter";
    }
    final uri = Uri.parse(url);
    final headers = await AppSession.authHeaders();

    try {
      final response = await http.get(uri, headers: headers);
      AppSettings.showLog("AdCreditsApi: fetchHistory response => ${response.body}");
      if (response.statusCode == 200) {
        final jsonResponse = json.decode(response.body);
        if (jsonResponse['status'] == true && jsonResponse['history'] is List) {
          return (jsonResponse['history'] as List)
              .map((item) => AdCreditLedgerItem.fromJson(Map<String, dynamic>.from(item)))
              .toList();
        }
      }
    } catch (e) {
      AppSettings.showLog("AdCreditsApi fetchHistory error: $e");
    }
    return [];
  }

  static Future<Map<String, dynamic>> consumeCredits({
    required double amount,
    required String operationId,
    String purpose = "ad_consumption",
    Map<String, dynamic>? reference,
  }) async {
    AppSettings.showLog("AdCreditsApi: consumeCredits calling...");
    final uri = Uri.parse("${Constant.baseURL}${Constant.adCreditsConsume}");
    final headers = await AppSession.authHeaders({"Content-Type": "application/json; charset=UTF-8"});
    final body = json.encode({
      "amount": amount,
      "operationId": operationId,
      "purpose": purpose,
      "reference": reference ?? {},
    });

    try {
      final response = await http.post(uri, headers: headers, body: body);
      AppSettings.showLog("AdCreditsApi: consumeCredits response => ${response.body}");
      if (response.statusCode == 200) {
        return Map<String, dynamic>.from(json.decode(response.body));
      }
    } catch (e) {
      AppSettings.showLog("AdCreditsApi consumeCredits error: $e");
    }
    return {"status": false, "message": "Failed to communicate with credits service."};
  }
}

