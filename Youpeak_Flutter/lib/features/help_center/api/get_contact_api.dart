import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:youpeak/features/help_center/model/get_contact_model.dart';
import 'package:youpeak/core/constants/app_constant.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'package:youpeak/core/network/app_session.dart';

class GetContactApi {
  static GetContactModel? _getContactModel;

  static Future<List<Contact>?> callApi() async {
    AppSettings.showLog("Get Contact Api Calling...");

    final uri = Uri.parse(Constant.baseURL + Constant.getContact);

    final headers = await AppSession.authHeaders();

    try {
      final response = await http.get(uri, headers: headers);

      if (response.statusCode == 200) {
        final jsonResponse = json.decode(response.body);

        AppSettings.showLog("Get Contact Api Response => ${response.body}");

        _getContactModel = GetContactModel.fromJson(jsonResponse);

        return _getContactModel?.contact;
      } else {
        AppSettings.showLog("Get Contact Api StateCode Error");
      }
    } catch (error) {
      AppSettings.showLog("Get Contact Api Error => $error");
    }
    return null;
  }
}
