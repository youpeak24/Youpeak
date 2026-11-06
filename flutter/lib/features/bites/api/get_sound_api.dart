import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:youpeak/features/bites/model/get_sound_model.dart';
import 'package:youpeak/core/constants/app_constant.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'package:youpeak/core/network/app_session.dart';

class GetSoundApi {
  static GetSoundModel? _getSoundModel;

  static Future<List<SoundList>?> callApi() async {
    AppSettings.showLog("Get Sound Api Calling...");

    final uri = Uri.parse(Constant.baseURL + Constant.getSoundList);

    final headers = await AppSession.authHeaders();

    try {
      final response = await http.get(uri, headers: headers);

      if (response.statusCode == 200) {
        final jsonResponse = json.decode(response.body);

        _getSoundModel = GetSoundModel.fromJson(jsonResponse);

        AppSettings.showLog("Get Sound Api Response => ${response.body}");

        return _getSoundModel?.soundList;
      } else {
        AppSettings.showLog("Get Sound Api StateCode Error");
      }
    } catch (error) {
      AppSettings.showLog("Get Sound Api Error => $error");
    }
    return null;
  }
}
