import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:youpeak/core/constants/app_constant.dart';
import 'package:youpeak/core/settings/app_settings.dart';

import 'package:youpeak/features/premium/model/get_premium_plan_purchase_history_model.dart';
import 'package:youpeak/core/network/app_session.dart';

class GetPremiumPlanHistoryApi {
  static int startPagination = 1;
  static int limitPagination = 10;
  static bool isLastPage = false;

  static Future<GetPremiumPlanPurchaseHistoryModel?> callApi(String loginUserId) async {
    final uri = Uri.parse(
      "${Constant.baseURL + Constant.premiumPlanPurchaseHistory}"
      "?userId=$loginUserId&start=$startPagination&limit=$limitPagination",
    );

    final headers = await AppSession.authHeaders();

    /// 🔹 REQUEST LOG
    AppSettings.showLog("========= PREMIUM HISTORY API REQUEST =========");
    AppSettings.showLog("PREMIUM HISTORY URL => $uri");
    AppSettings.showLog("PREMIUM HISTORY Headers => $headers");
    AppSettings.showLog("PREMIUM HISTORY Page => $startPagination");
    AppSettings.showLog("PREMIUM HISTORY Limit => $limitPagination");

    try {
      final response = await http.get(uri, headers: headers);

      /// 🔹 RESPONSE LOG
      AppSettings.showLog("========= PREMIUM HISTORY API RESPONSE =========");
      AppSettings.showLog("Status Code => ${response.statusCode}");
      AppSettings.showLog("Response Body => ${response.body}");

      if (response.statusCode == 200) {
        final jsonResponse = json.decode(response.body);

        final model = GetPremiumPlanPurchaseHistoryModel.fromJson(jsonResponse);

        /// 🔹 Pagination Check Log
        AppSettings.showLog("Received Items => ${model.planHistory?.length ?? 0}");

        if ((model.planHistory?.length ?? 0) < limitPagination) {
          isLastPage = true;
          AppSettings.showLog("Last Page Reached ✅");
        }

        return model;
      } else {
        AppSettings.showLog("❌ StatusCode Error");
      }
    } catch (e, stackTrace) {
      AppSettings.showLog("❌ API Exception => $e");
      AppSettings.showLog("StackTrace => $stackTrace");
    }

    return null;
  }
}
