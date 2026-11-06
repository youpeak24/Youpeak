import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:youpeak/features/help_center/model/get_faq_model.dart';
import 'package:youpeak/core/constants/app_constant.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'package:youpeak/core/network/app_session.dart';

class GetFAQApi {
  static GetFaqModel? _getFaqModel;

  static Future<List<FaQ>?> callApi() async {
    AppSettings.showLog("Get FAQ Api Calling...");

    final uri = Uri.parse(Constant.baseURL + Constant.getFAQ);

    final headers = await AppSession.authHeaders();

    try {
      final response = await http.get(uri, headers: headers);

      if (response.statusCode == 200) {
        final jsonResponse = json.decode(response.body);

        AppSettings.showLog("Get FAQ Api Response => ${response.body}");

        _getFaqModel = GetFaqModel.fromJson(jsonResponse);

        return _getFaqModel?.faQ;
      } else {
        AppSettings.showLog("Get FAQ Api StateCode Error");
      }
    } catch (error) {
      AppSettings.showLog("Get FAQ Api Error => $error");
    }
    return null;
  }
}
