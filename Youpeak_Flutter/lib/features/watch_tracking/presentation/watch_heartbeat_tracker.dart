import 'dart:async';
import 'dart:math' as math;

import 'package:flutter/widgets.dart';
import 'package:video_player/video_player.dart';
import 'package:youpeak/core/assets/app_visuals.dart';
import 'package:youpeak/core/network/app_api_client.dart';
import 'package:youpeak/core/network/app_session.dart';
import 'package:youpeak/core/providers/app_provider_container.dart';
import 'package:youpeak/core/security/security_service.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'package:youpeak/core/system_config/presentation/system_configs_provider.dart';
import 'package:youpeak/core/utils/custom_toast.dart';
import 'package:youpeak/core/utils/money_format.dart';
import 'package:youpeak/features/tasker/presentation/tasker_dashboard_provider.dart';
import 'package:youpeak/features/watch_tracking/data/heartbeat_api.dart';
import 'package:youpeak/features/watch_tracking/domain/watch_time_accumulator.dart';

/// Reports genuine viewing of one video to the watch-time ledger.
///
/// Samples the player every second into a [WatchTimeAccumulator] and sends a
/// heartbeat every `app_policy.heartbeatIntervalSeconds` (10 s at launch)
/// with the seconds that counted. Muted, paused, buffering, > 2x, seeking or
/// backgrounded playback never counts. Works with any [VideoPlayerController]
/// — the Chewie-based screens and [AdaptiveHlsPlayerWidget] alike.
///
///     tracker = WatchHeartbeatTracker(videoId: id)..attach(videoPlayerController);
///     …
///     tracker.detach();   // flushes the last seconds
class WatchHeartbeatTracker with WidgetsBindingObserver {
  WatchHeartbeatTracker({required this.videoId, this.onResult, HeartbeatApi? api, DateTime Function()? clock})
      : _api = api,
        _clock = clock ?? DateTime.now;

  final String videoId;
  final void Function(HeartbeatResult result)? onResult;
  final HeartbeatApi? _api;
  final DateTime Function() _clock;

  final WatchTimeAccumulator _accumulator = WatchTimeAccumulator();
  VideoPlayerController? _controller;
  Timer? _sampler;
  Timer? _beater;
  bool _foreground = true;
  bool _sending = false;
  bool _pausedForLock = false;

  HeartbeatApi get _heartbeatApi => _api ?? appProviderContainer.read(heartbeatApiProvider);

  void attach(VideoPlayerController controller) {
    if (identical(_controller, controller)) return;
    detach(flush: false);
    _controller = controller;
    _accumulator.reset();
    _foreground = WidgetsBinding.instance.lifecycleState == null || WidgetsBinding.instance.lifecycleState == AppLifecycleState.resumed;
    WidgetsBinding.instance.addObserver(this);
    _sampler = Timer.periodic(const Duration(seconds: 1), (_) => _sample());
    final interval = appProviderContainer.read(systemConfigsProvider).appPolicy.heartbeatIntervalSeconds;
    _beater = Timer.periodic(Duration(seconds: interval), (_) => _beat());
  }

  /// Stop tracking; by default sends whatever counted since the last beat.
  void detach({bool flush = true}) {
    if (_controller == null) return;
    _sample();
    _sampler?.cancel();
    _beater?.cancel();
    _sampler = null;
    _beater = null;
    WidgetsBinding.instance.removeObserver(this);
    if (flush) _beat();
    _controller = null;
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    _foreground = state == AppLifecycleState.resumed;
    _sample();
  }

  void _sample() {
    final c = _controller;
    if (c == null) return;
    try {
      final v = c.value;
      if (!v.isInitialized) return;
      _accumulator.add(PlaybackSample(
        at: _clock(),
        position: v.position,
        isPlaying: v.isPlaying,
        isBuffering: v.isBuffering,
        volume: v.volume,
        speed: v.playbackSpeed,
        foreground: _foreground,
      ));
    } catch (_) {
      // Controller disposed under us — the owner will detach.
    }
  }

  Future<void> _beat() async {
    if (_sending) return;
    if (_pausedForLock) {
      // Resume once the re-check has cleared the lock (e.g. a renewed
      // attestation); until then the server would refuse anyway.
      if (appProviderContainer.read(securityServiceProvider).isLocked) return;
      _pausedForLock = false;
    }
    final seconds = _accumulator.take();
    if (seconds < 1) {
      _accumulator.restore(seconds);
      return;
    }
    if (!AppSession.isEstablished) return; // signed out: nothing to credit to
    if (appProviderContainer.read(securityServiceProvider).isLocked) return; // server would refuse

    final v = _controller?.value;
    _sending = true;
    try {
      final result = await _heartbeatApi.send(
        videoId: videoId,
        playedSeconds: seconds,
        position: v?.position ?? Duration.zero,
        playbackRate: v?.playbackSpeed ?? 1,
        muted: (v?.volume ?? 1) <= 0,
        foreground: _foreground,
      );
      _handle(result);
    } on ApiException catch (e) {
      if (e.code == "SECURITY_LOCK") {
        _pausedForLock = true;
        appProviderContainer.read(securityServiceProvider.notifier).recheck();
      } else if (e.code == "NETWORK_ERROR" || e.code == "NETWORK_TIMEOUT") {
        // Retry with the next beat (the server caps a single beat anyway).
        _accumulator.restore(math.min(seconds, 15));
      }
      AppSettings.showLog("watch heartbeat refused => $e");
    } finally {
      _sending = false;
    }
  }

  void _handle(HeartbeatResult r) {
    onResult?.call(r);
    if (r.milestoneReached && r.milestoneCoins > 0) {
      CustomToast.celebrate("2-hour watch bonus! +${MoneyFormat.coins(r.milestoneCoins)} coins", AppVisuals.partyPopper);
    }
    if (r.tierUpgraded) {
      CustomToast.celebrate("Level up! You're now ${r.newTierName ?? "on the next level"}.", AppVisuals.partyPopper);
    }
    if (r.milestoneReached || r.tierUpgraded) appProviderContainer.invalidate(taskerDashboardProvider);
  }
}
