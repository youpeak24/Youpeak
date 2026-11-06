import 'dart:math' as math;

/// One look at the player (taken about once a second).
class PlaybackSample {
  const PlaybackSample({
    required this.at,
    required this.position,
    required this.isPlaying,
    required this.isBuffering,
    required this.volume,
    required this.speed,
    required this.foreground,
  });

  final DateTime at;
  final Duration position;
  final bool isPlaying;
  final bool isBuffering;
  final double volume;
  final double speed;

  /// The app is on screen (not backgrounded, screen not off).
  final bool foreground;
}

/// Why an interval between two samples didn't count as watch time.
enum WatchRejection { paused, buffering, muted, fastPlayback, background, seek, stalled }

/// Adds up genuine viewing seconds between samples.
///
/// An interval counts only if, at both ends, the video was playing (not
/// buffering) with sound on, at ≤ 2x speed, with the app in the foreground,
/// and the position moved about as far as the clock did — a forward jump
/// (skip / scrub) or a backward jump (seek back, loop restart) doesn't count,
/// and neither does a position that stands still while the player still
/// says "playing" (a browser can pause the media element itself — media
/// keys, the browser's media controls — without the player noticing).
/// The server re-checks the flags and caps credit at wall-clock time anyway;
/// this keeps honest clients from even asking for time that isn't real.
class WatchTimeAccumulator {
  static const double maxSpeed = 2.0;

  /// Longest single interval counted — longer gaps mean the sampler was
  /// paused (app suspended), and nobody can vouch for that time.
  static const double maxIntervalSeconds = 2.0;

  PlaybackSample? _last;
  double _pending = 0;
  WatchRejection? lastRejection;

  double get pendingSeconds => _pending;

  void add(PlaybackSample sample) {
    final prev = _last;
    _last = sample;
    if (prev == null) return;
    final dt = sample.at.difference(prev.at).inMilliseconds / 1000.0;
    if (dt <= 0) return;
    lastRejection = _rejection(prev, sample, dt);
    if (lastRejection == null) _pending += math.min(dt, maxIntervalSeconds);
  }

  WatchRejection? _rejection(PlaybackSample prev, PlaybackSample s, double dt) {
    if (!prev.foreground || !s.foreground) return WatchRejection.background;
    if (!prev.isPlaying || !s.isPlaying) return WatchRejection.paused;
    if (s.isBuffering) return WatchRejection.buffering;
    if (prev.volume <= 0 || s.volume <= 0) return WatchRejection.muted;
    if (prev.speed > maxSpeed || s.speed > maxSpeed) return WatchRejection.fastPlayback;
    final advanced = (s.position - prev.position).inMilliseconds / 1000.0;
    if (advanced > dt * math.max(s.speed, 1.0) + 1.5 || advanced < -0.5) return WatchRejection.seek;
    if (advanced < dt * math.min(s.speed, 1.0) * 0.5) return WatchRejection.stalled;
    return null;
  }

  /// The seconds counted since the last call, and reset.
  double take() {
    final v = _pending;
    _pending = 0;
    return v;
  }

  /// Put back seconds a failed heartbeat couldn't deliver.
  void restore(double seconds) => _pending += math.max(0, seconds);

  /// Forget the previous sample (e.g. after a new video is loaded).
  void reset() {
    _last = null;
    _pending = 0;
    lastRejection = null;
  }
}
