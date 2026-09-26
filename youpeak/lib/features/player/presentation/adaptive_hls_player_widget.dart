import 'dart:async';

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:video_player/video_player.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:youpeak/features/peak_boost/presentation/peak_boost_button.dart';
import 'package:youpeak/features/report/view/custom_report_view.dart';
import 'package:youpeak/features/watch_tracking/presentation/watch_heartbeat_tracker.dart';

/// Video player for YouPeak streams.
///
/// • Adaptive bitrate: give it the HLS master playlist (`.m3u8`) and the
///   platform player (ExoPlayer on Android, AVPlayer on iOS, hls.js in the
///   browser via video_player_web_hls) switches between the 360p / 480p /
///   720p / 1080p renditions as bandwidth changes. Falls back to the
///   progressive [fallbackUrl] when there is no HLS rendition.
/// • Watch time: a [WatchHeartbeatTracker] reports genuine viewing to the
///   server-side ledger. Speed is capped at 2x, matching the anti-fraud rule.
/// • Action bar: Peak Boost and the IT Rules 2021 report sheet.
/// • [audioMuted] (set by content moderation on a video) plays it silent
///   with no unmute; muted playback earns no watch time.
class AdaptiveHlsPlayerWidget extends StatefulWidget {
  const AdaptiveHlsPlayerWidget({
    super.key,
    required this.videoId,
    this.hlsUrl,
    this.fallbackUrl,
    this.creatorName,
    this.isOwnVideo = false,
    this.audioMuted = false,
    this.autoPlay = true,
    this.showActionBar = true,
    this.trackWatchTime = true,
    this.controllerFactory,
  }) : assert(hlsUrl != null || fallbackUrl != null, "Give the player an hlsUrl or a fallbackUrl");

  final String videoId;
  final String? hlsUrl;
  final String? fallbackUrl;
  final String? creatorName;
  final bool isOwnVideo;
  final bool audioMuted;
  final bool autoPlay;
  final bool showActionBar;
  final bool trackWatchTime;

  /// For tests: build the controller for a URL.
  final VideoPlayerController Function(Uri uri, VideoFormat? formatHint)? controllerFactory;

  static const speeds = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];

  @override
  State<AdaptiveHlsPlayerWidget> createState() => _AdaptiveHlsPlayerWidgetState();
}

class _AdaptiveHlsPlayerWidgetState extends State<AdaptiveHlsPlayerWidget> {
  VideoPlayerController? _controller;
  WatchHeartbeatTracker? _tracker;
  bool _failed = false;
  bool _showControls = true;
  Timer? _hideTimer;

  String get _url => (widget.hlsUrl?.isNotEmpty ?? false) ? widget.hlsUrl! : widget.fallbackUrl!;

  bool get _isHls => Uri.tryParse(_url)?.path.toLowerCase().endsWith(".m3u8") ?? false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void didUpdateWidget(covariant AdaptiveHlsPlayerWidget old) {
    super.didUpdateWidget(old);
    if (old.videoId != widget.videoId || old.hlsUrl != widget.hlsUrl || old.fallbackUrl != widget.fallbackUrl) _load();
  }

  Future<void> _load() async {
    _disposePlayer();
    setState(() => _failed = false);
    final uri = Uri.parse(_url);
    final hint = _isHls ? VideoFormat.hls : null;
    final controller = widget.controllerFactory?.call(uri, hint) ??
        VideoPlayerController.networkUrl(uri, formatHint: hint, videoPlayerOptions: VideoPlayerOptions(mixWithOthers: false));
    _controller = controller;
    controller.addListener(_onTick);
    try {
      await controller.initialize();
      if (!mounted || !identical(_controller, controller)) return;
      if (widget.audioMuted) await controller.setVolume(0);
      if (widget.trackWatchTime) _tracker = WatchHeartbeatTracker(videoId: widget.videoId)..attach(controller);
      if (widget.autoPlay) await controller.play();
      _scheduleHide();
      setState(() {});
    } catch (_) {
      if (mounted && identical(_controller, controller)) setState(() => _failed = true);
    }
  }

  void _onTick() {
    final c = _controller;
    if (c == null || !mounted) return;
    if (c.value.hasError && !_failed) setState(() => _failed = true);
  }

  void _disposePlayer() {
    _hideTimer?.cancel();
    _tracker?.detach();
    _tracker = null;
    final c = _controller;
    _controller = null;
    c?.removeListener(_onTick);
    c?.dispose();
  }

  @override
  void dispose() {
    _disposePlayer();
    super.dispose();
  }

  void _scheduleHide() {
    _hideTimer?.cancel();
    _hideTimer = Timer(const Duration(seconds: 3), () {
      if (mounted && (_controller?.value.isPlaying ?? false)) setState(() => _showControls = false);
    });
  }

  void _toggleControls() {
    setState(() => _showControls = !_showControls);
    if (_showControls) _scheduleHide();
  }

  Future<void> _togglePlay() async {
    final c = _controller;
    if (c == null) return;
    c.value.isPlaying ? await c.pause() : await c.play();
    setState(() {});
    _scheduleHide();
  }

  Future<void> _toggleMute() async {
    final c = _controller;
    if (c == null || widget.audioMuted) return;
    await c.setVolume(c.value.volume > 0 ? 0 : 1);
    setState(() {});
  }

  Future<void> _setSpeed(double speed) async {
    await _controller?.setPlaybackSpeed(speed.clamp(0.25, 2.0));
    setState(() {});
  }

  String _format(Duration d) {
    final h = d.inHours;
    final m = d.inMinutes.remainder(60).toString().padLeft(h > 0 ? 2 : 1, "0");
    final s = d.inSeconds.remainder(60).toString().padLeft(2, "0");
    return h > 0 ? "$h:$m:$s" : "$m:$s";
  }

  @override
  Widget build(BuildContext context) {
    final c = _controller;
    final ready = c != null && c.value.isInitialized;
    final aspect = ready && c.value.aspectRatio > 0 ? c.value.aspectRatio : 16 / 9;

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        AspectRatio(
          aspectRatio: aspect,
          child: ColoredBox(
            color: Colors.black,
            child: _failed
                ? _ErrorView(onRetry: _load)
                : !ready
                    ? const Center(child: CircularProgressIndicator(color: AppColor.primaryColor))
                    : GestureDetector(
                        behavior: HitTestBehavior.opaque,
                        onTap: _toggleControls,
                        child: Stack(
                          fit: StackFit.expand,
                          children: [
                            Center(child: AspectRatio(aspectRatio: aspect, child: VideoPlayer(c))),
                            ValueListenableBuilder<VideoPlayerValue>(
                              valueListenable: c,
                              builder: (_, v, __) => v.isBuffering ? const Center(child: CircularProgressIndicator(color: AppColor.white)) : const SizedBox.shrink(),
                            ),
                            AnimatedOpacity(
                              opacity: _showControls ? 1 : 0,
                              duration: const Duration(milliseconds: 200),
                              child: IgnorePointer(ignoring: !_showControls, child: _controls(c)),
                            ),
                          ],
                        ),
                      ),
          ),
        ),
        if (widget.showActionBar)
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            child: Row(
              children: [
                PeakBoostButton(videoId: widget.videoId, creatorName: widget.creatorName, isOwnVideo: widget.isOwnVideo),
                const Spacer(),
                IconButton(
                  tooltip: "Report video",
                  constraints: const BoxConstraints(minWidth: 44, minHeight: 44),
                  onPressed: () => CustomReportView.show(widget.videoId),
                  icon: const Icon(Icons.outlined_flag_rounded, color: AppColor.primaryTextIcons),
                ),
              ],
            ),
          ),
      ],
    );
  }

  Widget _controls(VideoPlayerController c) {
    return DecoratedBox(
      decoration: BoxDecoration(color: AppColor.darkSurface.withValues(alpha: 0.35)),
      child: Stack(
        children: [
          Center(
            child: ValueListenableBuilder<VideoPlayerValue>(
              valueListenable: c,
              builder: (_, v, __) => IconButton(
                iconSize: 56,
                tooltip: v.isPlaying ? "Pause" : "Play",
                onPressed: _togglePlay,
                icon: Icon(v.isPlaying ? Icons.pause_circle_filled_rounded : Icons.play_circle_fill_rounded, color: AppColor.white),
              ),
            ),
          ),
          Positioned(
            top: 8,
            right: 8,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(color: Colors.black.withValues(alpha: 0.75), borderRadius: BorderRadius.circular(4)),
              child: Text(_isHls ? "AUTO" : "SD", style: GoogleFonts.urbanist(color: AppColor.white, fontSize: 11, fontWeight: FontWeight.w800)),
            ),
          ),
          Positioned(
            left: 0,
            right: 0,
            bottom: 0,
            child: ValueListenableBuilder<VideoPlayerValue>(
              valueListenable: c,
              builder: (_, v, __) => Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Row(
                    children: [
                      const SizedBox(width: 12),
                      Text("${_format(v.position)} / ${_format(v.duration)}", style: GoogleFonts.urbanist(color: AppColor.white, fontSize: 12, fontWeight: FontWeight.w700)),
                      const Spacer(),
                      IconButton(
                        tooltip: widget.audioMuted ? "Audio removed" : (v.volume > 0 ? "Mute" : "Unmute"),
                        constraints: const BoxConstraints(minWidth: 44, minHeight: 44),
                        onPressed: widget.audioMuted ? null : _toggleMute,
                        icon: Icon(v.volume > 0 ? Icons.volume_up_rounded : Icons.volume_off_rounded, color: AppColor.white),
                      ),
                      PopupMenuButton<double>(
                        tooltip: "Playback speed",
                        initialValue: v.playbackSpeed,
                        onSelected: _setSpeed,
                        itemBuilder: (_) => [for (final s in AdaptiveHlsPlayerWidget.speeds) PopupMenuItem(value: s, child: Text(s == 1 ? "Normal" : "${s}x"))],
                        child: SizedBox(
                          width: 48,
                          height: 44,
                          child: Center(
                            child: Text("${v.playbackSpeed == v.playbackSpeed.roundToDouble() ? v.playbackSpeed.toStringAsFixed(0) : v.playbackSpeed}x",
                                style: GoogleFonts.urbanist(color: AppColor.white, fontWeight: FontWeight.w800)),
                          ),
                        ),
                      ),
                    ],
                  ),
                  VideoProgressIndicator(
                    c,
                    allowScrubbing: true,
                    padding: const EdgeInsets.only(top: 4, bottom: 6, left: 8, right: 8),
                    colors: VideoProgressColors(playedColor: AppColor.primaryColor, bufferedColor: AppColor.white.withValues(alpha: 0.4), backgroundColor: AppColor.white.withValues(alpha: 0.15)),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ErrorView extends StatelessWidget {
  const _ErrorView({required this.onRetry});

  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) => Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.wifi_off_rounded, color: AppColor.white, size: 36),
            const SizedBox(height: 8),
            Text("This video couldn't load.", style: GoogleFonts.urbanist(color: AppColor.white, fontWeight: FontWeight.w700)),
            TextButton(onPressed: onRetry, child: Text("Try again", style: GoogleFonts.urbanist(color: AppColor.coinGold, fontWeight: FontWeight.w800))),
          ],
        ),
      );
}
