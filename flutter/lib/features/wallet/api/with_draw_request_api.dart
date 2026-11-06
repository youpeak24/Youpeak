import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:youpeak/features/wallet/model/with_draw_request_model.dart';
import 'package:youpeak/core/constants/app_constant.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'package:youpeak/core/network/app_session.dart';

class WithDrawRequestApi {
  static Future<WithDrawRequestModel?> callApi({
    required String loginUserId,
    required String amount,
    required String paymentGateway,
    required List<String> paymentDetails,
  }) async {
    AppSettings.showLog("With Draw Request Api Calling...");

    final uri = Uri.parse(Constant.baseURL + Constant.withDrawRequest);

    AppSettings.showLog("With Draw Request Api Url => $uri");

    final headers = await AppSession.authHeaders({"Content-Type": "application/json; charset=UTF-8"});

    final body = json.encode({
      "userId": loginUserId,
      "requestAmount": amount,
      "paymentGateway": paymentGateway,
      "paymentDetails": paymentDetails,
    });

    AppSettings.showLog("With Draw Request Api Url => $body");

    try {
      final response = await http.post(uri, headers: headers, body: body);

      if (response.statusCode == 200) {
        final jsonResponse = json.decode(response.body);

        AppSettings.showLog("With Draw Request Api Response => ${response.body}");
        return WithDrawRequestModel.fromJson(jsonResponse);
      } else {
        AppSettings.showLog("With Draw Request Api StateCode Error");
      }
    } catch (error) {
      AppSettings.showLog("With Draw Request Api Error => $error");
    }
    return null;
  }
}
