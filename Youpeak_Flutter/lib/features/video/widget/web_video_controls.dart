import 'dart:async';

import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:video_player/video_player.dart';
import 'package:youpeak/core/platform/web_video_fullscreen.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:youpeak/features/video/controller/normal_video_details_controller.dart';

// Player controls for the web app (desktop and mobile browsers).
//
// The phone app keeps its own overlay. In a browser the overlay must work
// with a mouse as well as touch, so here:
//  * mouse: moving over the player shows the controls, they hide again after
//    a few seconds of playback; a click on the picture plays/pauses;
//  * touch: a tap shows/hides the controls, a double tap on the left/right
//    half skips 10 s back/forward;
//  * keyboard (when the player has focus): Space/K play-pause, ←/→ (J/L)
//    10 s, ↑/↓ volume, M mute, F fullscreen, Esc leaves fullscreen;
//  * paused, ended, buffering and error states are always shown.
// Seeking never adds watch time: the watch tracker drops intervals in which
// the position jumped (WatchTimeAccumulator).
class WebVideoControls extends StatefulWidget {
  const WebVideoControls({super.key, required this.controller, required this.fullscreen, this.onBack, this.title});

  final NormalVideoDetailsController controller;
  final bool fullscreen;
  final VoidCallback? onBack;
  final String? title;

  @override
  State<WebVideoControls> createState() => _WebVideoControlsState();
}

class _WebVideoControlsState extends State<WebVideoControls> {
  static const _hideAfter = Duration(seconds: 3);
  static const _skip = Duration(seconds: 10);

  final FocusNode _focus = FocusNode(debugLabel: "web-video-player");
  VideoPlayerController? _video;
  Timer? _hideTimer;
  bool _visible = true;
  bool _dragging = false;
  double? _dragValue;
  double _volume = 1;
  double _lastVolume = 1;
  String? _flash; // "+10 s" / "-10 s" feedback
  Timer? _flashTimer;

  NormalVideoDetailsController get c => widget.controller;

  @override
  void initState() {
    super.initState();
    _attach();
    _scheduleHide();
  }

  @override
  void didUpdateWidget(covariant WebVideoControls oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (_video != c.videoPlayerController) _attach();
  }

  void _attach() {
    _video?.removeListener(_onTick);
    _video = c.videoPlayerController;
    _video?.addListener(_onTick);
    _volume = c.isSpeaker.value ? (_video?.value.volume ?? 1) : 0;
  }

  void _onTick() {
    if (!mounted) return;
    setState(() {});
    if (!_isPlaying) _show(autoHide: false);
  }

  @override
  void dispose() {
    _video?.removeListener(_onTick);
    _hideTimer?.cancel();
    _flashTimer?.cancel();
    _focus.dispose();
    super.dispose();
  }

  VideoPlayerValue? get _value => _video?.value;
  bool get _isPlaying => _value?.isPlaying ?? false;
  Duration get _duration => _value?.duration ?? Duration.zero;
  Duration get _position => _value?.position ?? Duration.zero;
  bool get _ended => _duration > Duration.zero && _position >= _duration - const Duration(milliseconds: 300) && !_isPlaying;

  void _show({bool autoHide = true}) {
    if (!_visible) setState(() => _visible = true);
    if (autoHide) _scheduleHide();
  }

  void _scheduleHide() {
    _hideTimer?.cancel();
    _hideTimer = Timer(_hideAfter, () {
      if (mounted && _isPlaying && !_dragging) setState(() => _visible = false);
    });
  }

  void _togglePlay() {
    final v = _video;
    if (v == null || c.showAd) return;
    if (_ended) {
      v.seekTo(Duration.zero);
      v.play();
    } else if (_isPlaying) {
      v.pause();
    } else {
      v.play();
    }
    _show();
  }

  Future<void> _seekBy(Duration delta) async {
    final v = _video;
    if (v == null || c.showAd) return;
    var target = _position + delta;
    if (target < Duration.zero) target = Duration.zero;
    if (target > _duration) target = _duration;
    if (delta > Duration.zero) c.isVideoSkip = true;
    await v.seekTo(target);
    _flashMessage(delta.isNegative ? "−10 s" : "+10 s");
    _show();
  }

  void _flashMessage(String text) {
    _flashTimer?.cancel();
    setState(() => _flash = text);
    _flashTimer = Timer(const Duration(milliseconds: 700), () {
      if (mounted) setState(() => _flash = null);
    });
  }

  void _setVolume(double v) {
    final volume = v.clamp(0.0, 1.0);
    _video?.setVolume(volume);
    c.isSpeaker.value = volume > 0;
    if (volume > 0) _lastVolume = volume;
    setState(() => _volume = volume);
    _show();
  }

  void _toggleMute() => _setVolume(_volume > 0 ? 0 : (_lastVolume > 0 ? _lastVolume : 1));

  void _toggleFullscreen() {
    if (widget.fullscreen) {
      WebVideoFullscreen.exit();
    } else {
      WebVideoFullscreen.enter();
    }
    _show();
  }

  KeyEventResult _onKey(FocusNode node, KeyEvent event) {
    if (event is! KeyDownEvent && event is! KeyRepeatEvent) return KeyEventResult.ignored;
    final key = event.logicalKey;
    if (key == LogicalKeyboardKey.space || key == LogicalKeyboardKey.keyK) {
      if (event is KeyDownEvent) _togglePlay();
    } else if (key == LogicalKeyboardKey.arrowLeft || key == LogicalKeyboardKey.keyJ) {
      _seekBy(-_skip);
    } else if (key == LogicalKeyboardKey.arrowRight || key == LogicalKeyboardKey.keyL) {
      _seekBy(_skip);
    } else if (key == LogicalKeyboardKey.arrowUp) {
      _setVolume(_volume + 0.1);
    } else if (key == LogicalKeyboardKey.arrowDown) {
      _setVolume(_volume - 0.1);
    } else if (key == LogicalKeyboardKey.keyM) {
      if (event is KeyDownEvent) _toggleMute();
    } else if (key == LogicalKeyboardKey.keyF) {
      if (event is KeyDownEvent) _toggleFullscreen();
    } else if (key == LogicalKeyboardKey.escape && widget.fullscreen) {
      WebVideoFullscreen.exit();
    } else {
      return KeyEventResult.ignored;
    }
    return KeyEventResult.handled;
  }

  static String _fmt(Duration d) {
    final h = d.inHours;
    final m = d.inMinutes.remainder(60).toString().padLeft(h > 0 ? 2 : 1, '0');
    final s = d.inSeconds.remainder(60).toString().padLeft(2, '0');
    return h > 0 ? "$h:$m:$s" : "$m:$s";
  }

  @override
  Widget build(BuildContext context) {
    if (c.showAd) return const SizedBox.shrink();
    final error = c.playbackError;
    final buffering = (_value?.isBuffering ?? false) || !(_value?.isInitialized ?? false);
    final showAll = _visible || !_isPlaying || error != null;
    final compact = MediaQuery.sizeOf(context).width < 520;

    return Focus(
      focusNode: _focus,
      autofocus: true,
      onKeyEvent: _onKey,
      child: MouseRegion(
        onHover: (_) => _show(),
        onEnter: (_) => _show(),
        onExit: (_) => _scheduleHide(),
        cursor: showAll ? SystemMouseCursors.basic : SystemMouseCursors.none,
        child: Stack(
          fit: StackFit.expand,
          children: [
            // The picture: click plays/pauses (mouse); tap shows/hides the
            // controls and double-tap skips (touch).
            Positioned.fill(
              child: _PictureGestures(
                onMouseClick: () {
                  _focus.requestFocus();
                  _togglePlay();
                },
                onTouchTap: () {
                  _focus.requestFocus();
                  if (_visible && _isPlaying) {
                    setState(() => _visible = false);
                  } else {
                    _show();
                  }
                },
                onDoubleTapLeft: () => _seekBy(-_skip),
                onDoubleTapRight: () => _seekBy(_skip),
              ),
            ),

            // Scrim behind the controls for legibility.
            IgnorePointer(
              child: AnimatedOpacity(
                opacity: showAll ? 1 : 0,
                duration: const Duration(milliseconds: 200),
                child: const DecoratedBox(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [Color(0x99000000), Color(0x00000000), Color(0x00000000), Color(0xB3000000)],
                      stops: [0, 0.25, 0.6, 1],
                    ),
                  ),
                ),
              ),
            ),

            if (error != null)
              Center(child: _ErrorPanel(message: error, onRetry: c.retryPlayback))
            else if (buffering)
              const Center(child: SizedBox(width: 48, height: 48, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 3)))
            else
              Center(
                child: AnimatedOpacity(
                  opacity: showAll ? 1 : 0,
                  duration: const Duration(milliseconds: 200),
                  child: IgnorePointer(
                    ignoring: !showAll,
                    child: _CenterButton(
                      icon: _ended ? Icons.replay_rounded : (_isPlaying ? Icons.pause_rounded : Icons.play_arrow_rounded),
                      label: _ended ? "Replay" : (_isPlaying ? "Pause" : "Play"),
                      size: compact ? 56 : 68,
                      onPressed: _togglePlay,
                    ),
                  ),
                ),
              ),

            if (_flash != null)
              Align(
                alignment: const Alignment(0, -0.45),
                child: IgnorePointer(
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                    decoration: BoxDecoration(color: Colors.black54, borderRadius: BorderRadius.circular(20)),
                    child: Text(_flash!, style: GoogleFonts.urbanist(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w700)),
                  ),
                ),
              ),

            // Top bar: back (fullscreen / phone browsers) and title in fullscreen.
            Positioned(
              top: 0,
              left: 0,
              right: 0,
              child: AnimatedOpacity(
                opacity: showAll ? 1 : 0,
                duration: const Duration(milliseconds: 200),
                child: IgnorePointer(
                  ignoring: !showAll,
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(4, 6, 12, 0),
                    child: Row(
                      children: [
                        if (widget.onBack != null)
                          _IconBtn(icon: Icons.arrow_back_rounded, tooltip: widget.fullscreen ? "Exit full screen" : "Back", onPressed: widget.onBack!),
                        if (widget.fullscreen && (widget.title ?? "").isNotEmpty)
                          Expanded(
                            child: Text(widget.title!,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: GoogleFonts.urbanist(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w700)),
                          ),
                      ],
                    ),
                  ),
                ),
              ),
            ),

            // Bottom bar: seek bar, time, transport, volume, speed, fullscreen.
            Positioned(
              left: 0,
              right: 0,
              bottom: 0,
              child: AnimatedOpacity(
                opacity: showAll && error == null ? 1 : 0,
                duration: const Duration(milliseconds: 200),
                child: IgnorePointer(
                  ignoring: !(showAll && error == null),
                  child: Padding(
                    padding: EdgeInsets.fromLTRB(8, 0, 8, compact ? 2 : 6),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        _seekBar(),
                        Row(
                          children: [
                            _IconBtn(icon: _ended ? Icons.replay_rounded : (_isPlaying ? Icons.pause_rounded : Icons.play_arrow_rounded), tooltip: _isPlaying ? "Pause (k)" : "Play (k)", onPressed: _togglePlay),
                            _IconBtn(icon: Icons.replay_10_rounded, tooltip: "Back 10 seconds (←)", onPressed: () => _seekBy(-_skip)),
                            _IconBtn(icon: Icons.forward_10_rounded, tooltip: "Forward 10 seconds (→)", onPressed: () => _seekBy(_skip)),
                            if (!compact)
                              Obx(() => _IconBtn(
                                    icon: Icons.skip_next_rounded,
                                    tooltip: "Next video",
                                    onPressed: c.isDisableNext.value ? null : c.onNextVideo,
                                  )),
                            _IconBtn(
                              icon: _volume == 0 ? Icons.volume_off_rounded : (_volume < 0.5 ? Icons.volume_down_rounded : Icons.volume_up_rounded),
                              tooltip: _volume == 0 ? "Unmute (m)" : "Mute (m)",
                              onPressed: _toggleMute,
                            ),
                            if (!compact)
                              SizedBox(
                                width: 90,
                                child: SliderTheme(
                                  data: SliderTheme.of(context).copyWith(
                                    trackHeight: 3,
                                    thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 6),
                                    overlayShape: const RoundSliderOverlayShape(overlayRadius: 12),
                                    activeTrackColor: Colors.white,
                                    inactiveTrackColor: Colors.white38,
                                    thumbColor: Colors.white,
                                  ),
                                  child: Semantics(
                                    label: "Volume",
                                    child: Slider(value: _volume, onChanged: _setVolume),
                                  ),
                                ),
                              ),
                            const SizedBox(width: 6),
                            Flexible(
                              child: Text(
                                "${_fmt(_dragValue != null ? Duration(milliseconds: _dragValue!.round()) : _position)} / ${_fmt(_duration)}",
                                maxLines: 1,
                                overflow: TextOverflow.fade,
                                softWrap: false,
                                style: GoogleFonts.urbanist(color: Colors.white, fontSize: compact ? 12 : 14, fontWeight: FontWeight.w600),
                              ),
                            ),
                            const Spacer(),
                            _speedMenu(),
                            _IconBtn(
                              icon: widget.fullscreen ? Icons.fullscreen_exit_rounded : Icons.fullscreen_rounded,
                              tooltip: widget.fullscreen ? "Exit full screen (f)" : "Full screen (f)",
                              onPressed: _toggleFullscreen,
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _seekBar() {
    final total = _duration.inMilliseconds.toDouble();
    final pos = (_dragValue ?? _position.inMilliseconds.toDouble()).clamp(0.0, total <= 0 ? 0.0 : total);
    double buffered = 0;
    for (final r in _value?.buffered ?? const <DurationRange>[]) {
      if (r.end.inMilliseconds > buffered) buffered = r.end.inMilliseconds.toDouble();
    }
    return SizedBox(
      height: 28,
      child: Stack(
        alignment: Alignment.center,
        children: [
          // Buffered range behind the slider track.
          Positioned(
            left: 12,
            right: 12,
            child: LayoutBuilder(
              builder: (context, box) => Align(
                alignment: Alignment.centerLeft,
                child: Container(
                  height: 4,
                  width: total > 0 ? box.maxWidth * (buffered / total).clamp(0.0, 1.0) : 0,
                  decoration: BoxDecoration(color: Colors.white38, borderRadius: BorderRadius.circular(2)),
                ),
              ),
            ),
          ),
          SliderTheme(
            data: SliderTheme.of(context).copyWith(
              trackHeight: 4,
              thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 7),
              overlayShape: const RoundSliderOverlayShape(overlayRadius: 14),
              activeTrackColor: AppColor.primaryColor,
              inactiveTrackColor: Colors.white24,
              thumbColor: Colors.white,
            ),
            child: Semantics(
              label: "Seek",
              value: "${_fmt(Duration(milliseconds: pos.round()))} of ${_fmt(_duration)}",
              child: Slider(
                value: pos.toDouble(),
                min: 0,
                max: total <= 0 ? 1 : total,
                onChangeStart: total <= 0
                    ? null
                    : (v) {
                        _dragging = true;
                        _hideTimer?.cancel();
                      },
                onChanged: total <= 0 ? null : (v) => setState(() => _dragValue = v),
                onChangeEnd: total <= 0
                    ? null
                    : (v) async {
                        final target = Duration(milliseconds: v.round());
                        if (target > _position) c.isVideoSkip = true;
                        await _video?.seekTo(target);
                        if (mounted) {
                          setState(() {
                            _dragging = false;
                            _dragValue = null;
                          });
                        }
                        _show();
                      },
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _speedMenu() {
    return Obx(() {
      final speed = c.speedOptions[c.currentSpeedIndex.value];
      return PopupMenuButton<int>(
        tooltip: "Playback speed",
        color: const Color(0xEE1E1E1E),
        onOpened: () => _hideTimer?.cancel(),
        onCanceled: _scheduleHide,
        onSelected: (i) {
          c.currentSpeedIndex.value = i;
          _video?.setPlaybackSpeed(c.speedOptions[i]);
          _show();
        },
        itemBuilder: (_) => [
          for (int i = 0; i < c.speedOptions.length; i++)
            PopupMenuItem<int>(
              value: i,
              child: Row(children: [
                SizedBox(width: 22, child: i == c.currentSpeedIndex.value ? const Icon(Icons.check, color: Colors.white, size: 18) : null),
                Text(c.speedOptions[i] == 1.0 ? "Normal" : "${c.speedOptions[i]}x", style: GoogleFonts.urbanist(color: Colors.white, fontSize: 15)),
              ]),
            ),
        ],
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 10),
          child: Text(speed == 1.0 ? "1x" : "${speed}x", style: GoogleFonts.urbanist(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w700)),
        ),
      );
    });
  }
}

// Distinguishes mouse clicks from touch taps on the picture.
class _PictureGestures extends StatefulWidget {
  const _PictureGestures({required this.onMouseClick, required this.onTouchTap, required this.onDoubleTapLeft, required this.onDoubleTapRight});

  final VoidCallback onMouseClick;
  final VoidCallback onTouchTap;
  final VoidCallback onDoubleTapLeft;
  final VoidCallback onDoubleTapRight;

  @override
  State<_PictureGestures> createState() => _PictureGesturesState();
}

class _PictureGesturesState extends State<_PictureGestures> {
  PointerDeviceKind? _kind;
  Offset? _downAt;
  DateTime? _lastTouchTap;
  Offset? _lastTouchAt;
  Timer? _singleTap;

  @override
  void dispose() {
    _singleTap?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, box) => Listener(
        behavior: HitTestBehavior.opaque,
        onPointerDown: (e) {
          _kind = e.kind;
          _downAt = e.localPosition;
        },
        onPointerUp: (e) {
          final start = _downAt;
          if (start == null || (e.localPosition - start).distance > 12) return; // a drag, not a tap
          if (_kind == PointerDeviceKind.mouse) {
            if (e.kind == PointerDeviceKind.mouse) widget.onMouseClick();
            return;
          }
          final now = DateTime.now();
          final isDouble = _lastTouchTap != null &&
              now.difference(_lastTouchTap!) < const Duration(milliseconds: 300) &&
              _lastTouchAt != null &&
              (e.localPosition - _lastTouchAt!).distance < 60;
          _lastTouchTap = now;
          _lastTouchAt = e.localPosition;
          if (isDouble) {
            _singleTap?.cancel();
            _lastTouchTap = null;
            if (e.localPosition.dx < box.maxWidth / 2) {
              widget.onDoubleTapLeft();
            } else {
              widget.onDoubleTapRight();
            }
          } else {
            _singleTap?.cancel();
            _singleTap = Timer(const Duration(milliseconds: 260), widget.onTouchTap);
          }
        },
      ),
    );
  }
}

class _IconBtn extends StatelessWidget {
  const _IconBtn({required this.icon, required this.tooltip, required this.onPressed});

  final IconData icon;
  final String tooltip;
  final VoidCallback? onPressed;

  @override
  Widget build(BuildContext context) {
    return IconButton(
      tooltip: tooltip,
      onPressed: onPressed,
      icon: Icon(icon),
      color: Colors.white,
      disabledColor: Colors.white38,
      iconSize: 26,
      padding: const EdgeInsets.all(8),
      constraints: const BoxConstraints(minWidth: 44, minHeight: 44),
    );
  }
}

class _CenterButton extends StatelessWidget {
  const _CenterButton({required this.icon, required this.label, required this.size, required this.onPressed});

  final IconData icon;
  final String label;
  final double size;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      label: label,
      child: Material(
        color: Colors.black54,
        shape: const CircleBorder(),
        child: InkWell(
          customBorder: const CircleBorder(),
          onTap: onPressed,
          child: SizedBox(width: size, height: size, child: Icon(icon, color: Colors.white, size: size * 0.6)),
        ),
      ),
    );
  }
}

class _ErrorPanel extends StatelessWidget {
  const _ErrorPanel({required this.message, required this.onRetry});

  final String message;
  final Future<void> Function() onRetry;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.error_outline_rounded, color: Colors.white, size: 40),
          const SizedBox(height: 10),
          Text(message, textAlign: TextAlign.center, style: GoogleFonts.urbanist(color: Colors.white, fontSize: 15, fontWeight: FontWeight.w600)),
          const SizedBox(height: 14),
          FilledButton.icon(
            style: FilledButton.styleFrom(backgroundColor: AppColor.primaryColor, foregroundColor: Colors.white),
            onPressed: onRetry,
            icon: const Icon(Icons.refresh_rounded),
            label: const Text("Retry"),
          ),
        ],
      ),
    );
  }
}
