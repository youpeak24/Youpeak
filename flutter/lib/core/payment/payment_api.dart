import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:youpeak/core/storage/database/database.dart';
import 'package:youpeak/core/constants/app_constant.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'package:youpeak/core/network/app_session.dart';

// Gateway-agnostic payment flow (Razorpay wired server-side):
//   createOrder -> open gateway checkout -> verify -> server fulfils (credits
// coins / activates tier / etc.) — see functions/backend/controllers/client/payment.controller.js
class PaymentApi {
  static Future<Map<String, dynamic>> createOrder({
    required String purpose,
    String? tierId,
    String? billingPeriod,
    String? coinPlanId,
    String? premiumPlanId,
    String? videoId,
    String? planName,
    String? packId,
    String gateway = "razorpay",
  }) async {
    AppSettings.showLog("Payment CreateOrder Api Calling... purpose=$purpose");

    final uri = Uri.parse(Constant.baseURL + Constant.paymentCreateOrder);
    final headers = await AppSession.authHeaders({"Content-Type": "application/json; charset=UTF-8"});
    final body = json.encode({
      "userId": Database.loginUserId ?? "",
      "purpose": purpose,
      "gateway": gateway,
      if (tierId != null) "tierId": tierId,
      if (billingPeriod != null) "billingPeriod": billingPeriod,
      if (coinPlanId != null) "coinPlanId": coinPlanId,
      if (premiumPlanId != null) "premiumPlanId": premiumPlanId,
      if (videoId != null) "videoId": videoId,
      if (planName != null) "planName": planName,
      if (packId != null) "packId": packId,
    });

    try {
      final response = await http.post(uri, headers: headers, body: body);
      AppSettings.showLog("Payment CreateOrder Api Response => ${response.body}");
      if (response.statusCode == 200) {
        return Map<String, dynamic>.from(json.decode(response.body));
      }
    } catch (error) {
      AppSettings.showLog("Payment CreateOrder Api Error => $error");
    }
    return {"status": false, "message": "Something went wrong."};
  }

  static Future<Map<String, dynamic>> verify({
    required String orderId,
    required String paymentId,
    required String signature,
  }) async {
    AppSettings.showLog("Payment Verify Api Calling...");

    final uri = Uri.parse(Constant.baseURL + Constant.paymentVerify);
    final headers = await AppSession.authHeaders({"Content-Type": "application/json; charset=UTF-8"});
    final body = json.encode({
      "userId": Database.loginUserId ?? "",
      "orderId": orderId,
      "paymentId": paymentId,
      "signature": signature,
    });

    try {
      final response = await http.post(uri, headers: headers, body: body);
      AppSettings.showLog("Payment Verify Api Response => ${response.body}");
      if (response.statusCode == 200) {
        return Map<String, dynamic>.from(json.decode(response.body));
      }
    } catch (error) {
      AppSettings.showLog("Payment Verify Api Error => $error");
    }
    return {"status": false, "message": "Something went wrong."};
  }
}
