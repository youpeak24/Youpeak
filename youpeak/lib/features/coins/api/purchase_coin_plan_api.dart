import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:youpeak/features/coins/model/purchase_coin_plan_model.dart';
import 'package:youpeak/core/constants/app_constant.dart';
import 'package:youpeak/core/settings/app_settings.dart';

class PurchaseCoinPlanApi {
  static Future<PurchaseCoinPlanModel?> callApi({
    required String loginUserId,
    required String coinPlanId,
    required String paymentGateway,
  }) async {
    AppSettings.showLog("Purchase Coin Plan Api Calling...");

    final uri = Uri.parse("${Constant.baseURL}${Constant.purchaseCoinPlan}");
    final headers = {"key": Constant.secretKey, "Content-Type": "application/json"};

    final body = json.encode({
      "userId": loginUserId,
      "coinPlanId": coinPlanId,
      "paymentGateway": paymentGateway,
    });

    AppSettings.showLog("Purchase Coin Plan Api Uri => $uri");
    AppSettings.showLog("Purchase Coin Plan Api BODY => $body");

    try {
      final response = await http.post(uri, headers: headers, body: body);

      if (response.statusCode == 200) {
        final jsonResponse = json.decode(response.body);

        AppSettings.showLog("Purchase Coin Plan Api Response => ${response.body}");

        return PurchaseCoinPlanModel.fromJson(jsonResponse);
      } else {
        AppSettings.showLog("Purchase Coin Plan Api StateCode Error => ${response.statusCode} :: ${response.body}");
      }
    } catch (error) {
      AppSettings.showLog("Purchase Coin Plan Api Error => $error");
    }
    return null;
  }
}
