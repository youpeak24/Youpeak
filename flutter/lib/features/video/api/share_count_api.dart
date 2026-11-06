import 'package:http/http.dart' as http;
import 'package:youpeak/core/constants/app_constant.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'package:youpeak/core/network/app_session.dart';

class ShareCountApiClass {
  static Future<void> callApi(String loginUserId, String videoId) async {
    AppSettings.showLog("Share Count Api Calling...");

    final uri = Uri.parse("${Constant.baseURL + Constant.shareCount}?userId=$loginUserId&videoId=$videoId");

    final headers = await AppSession.authHeaders();

    try {
      final response = await http.post(uri, headers: headers);

      if (response.statusCode == 200) {
        AppSettings.showLog("Share Count Api Response => ${response.body}");
      } else {
        AppSettings.showLog("Share Count Api StateCode Error");
      }
    } catch (error) {
      AppSettings.showLog("Share Count Api Error => $error");
    }
  }
}
