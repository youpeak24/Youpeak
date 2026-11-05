import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:youpeak/features/monetization/model/video_engagement_reward_model.dart';
import 'package:youpeak/core/constants/app_constant.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'package:youpeak/core/network/app_session.dart';

class VideoEngagementRewardApi {
  static VideoEngagementRewardModel? videoEngagementRewardModel;
  static Future<void> callApi({required String loginUserId, required String videoId, required String totalWatchTime}) async {
    AppSettings.showLog("Video Engagement Reward Api Calling...");

    try {
      final headers = await AppSession.authHeaders({"Content-Type": 'application/json'});

      final uri = Uri.parse('${Constant.baseURL + Constant.videoEngagementReward}?userId=$loginUserId&videoId=$videoId&totalWatchTime=$totalWatchTime');

      AppSettings.showLog("Video Engagement Reward Api Uri => $uri");

      final response = await http.patch(uri, headers: headers);

      final jsonResponse = jsonDecode(response.body);

      AppSettings.showLog("Video Engagement Reward Api Response => $jsonResponse");

      videoEngagementRewardModel = VideoEngagementRewardModel.fromJson(jsonResponse);
    } catch (e) {
      AppSettings.showLog("Video Engagement Reward Api Error => $e");
    }
  }
}
