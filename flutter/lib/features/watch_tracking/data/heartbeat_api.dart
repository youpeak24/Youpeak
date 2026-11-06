import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:youpeak/core/network/app_api_client.dart';

class HeartbeatResult {
  const HeartbeatResult({
    required this.creditedSeconds,
    required this.watchMinutesToday,
    required this.milestoneReached,
    required this.milestoneCoins,
    required this.lifetimeWatchHours,
    required this.dailyCapReached,
    required this.tierUpgraded,
    this.newTierName,
  });

  factory HeartbeatResult.fromJson(Map<String, dynamic> j) => HeartbeatResult(
        creditedSeconds: (j["creditedSeconds"] as num?)?.toDouble() ?? 0,
        watchMinutesToday: (j["watchMinutesToday"] as num?)?.round() ?? 0,
        milestoneReached: j["milestoneReached"] == true,
        milestoneCoins: (j["milestoneCoins"] as num?)?.round() ?? 0,
        lifetimeWatchHours: (j["lifetimeWatchHours"] as num?)?.toDouble() ?? 0,
        dailyCapReached: j["dailyCapReached"] == true,
        tierUpgraded: j["tierUpgraded"] == true,
        newTierName: j["newTierName"] as String?,
      );

  final double creditedSeconds;
  final int watchMinutesToday;
  final bool milestoneReached;
  final int milestoneCoins;
  final double lifetimeWatchHours;
  final bool dailyCapReached;
  final bool tierUpgraded;
  final String? newTierName;
}

class HeartbeatApi {
  const HeartbeatApi(this._api);

  final AppApiClient _api;

  Future<HeartbeatResult> send({
    required String videoId,
    required double playedSeconds,
    required Duration position,
    required double playbackRate,
    required bool muted,
    required bool foreground,
  }) async {
    final json = await _api.post("client/watch/heartbeat", {
      "videoId": videoId,
      "playedSeconds": double.parse(playedSeconds.toStringAsFixed(2)),
      "positionSeconds": position.inMilliseconds / 1000,
      "playbackRate": playbackRate,
      "muted": muted,
      "foreground": foreground,
    });
    return HeartbeatResult.fromJson(json);
  }
}

final heartbeatApiProvider = Provider<HeartbeatApi>((ref) => HeartbeatApi(ref.watch(appApiClientProvider)));
