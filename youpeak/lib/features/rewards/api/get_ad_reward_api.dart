import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:youpeak/features/rewards/model/get_ad_reward_model.dart';
import 'package:youpeak/core/constants/app_constant.dart';
import 'package:youpeak/core/settings/app_settings.dart';

class GetAdRewardApi {
  static int startPagination = 1;
  static int limitPagination = 10;
  static bool isLastPage = false;

  static Future<GetAdRewardModel?> callApi({
    required String userId,
  }) async {
    final uri = Uri.parse(
      "${Constant.baseURL}${Constant.adRewardCoin}"
      "?userId=$userId&start=$startPagination&limit=$limitPagination",
    );

    final headers = {"key": Constant.secretKey};

    AppSettings.showLog("======== AD REWARD API CALL ========");
    AppSettings.showLog("Page Number (start) => $startPagination");
    AppSettings.showLog("Limit => $limitPagination");
    AppSettings.showLog("URL => $uri");

    try {
      final response = await http.get(uri, headers: headers);

      AppSettings.showLog("StatusCode => ${response.statusCode}");

      if (response.statusCode == 200) {
        final model = GetAdRewardModel.fromJson(json.decode(response.body));

        int dataLength = model.data?.length ?? 0;

        /// 🔥 PAGE WISE DATA COUNT LOG
        AppSettings.showLog("Page $startPagination data length ========> $dataLength");

        /// 🔥 Total data example print
        if (model.data != null && model.data!.isNotEmpty) {
          AppSettings.showLog("First item id => ${model.data!.first.id}");
        }

        /// Last page check
        if (dataLength < limitPagination) {
          isLastPage = true;
          AppSettings.showLog("This is LAST PAGE");
        }

        AppSettings.showLog("===================================");

        return model;
      }
    } catch (e) {
      AppSettings.showLog("Ad Reward API Error => $e");
    }

    return null;
  }
}
