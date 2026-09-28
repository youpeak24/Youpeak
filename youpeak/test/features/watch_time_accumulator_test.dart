import 'package:flutter_test/flutter_test.dart';
import 'package:youpeak/features/watch_tracking/domain/watch_time_accumulator.dart';

void main() {
  final t0 = DateTime(2026, 9, 27, 12);

  PlaybackSample at(
    int second, {
    int? positionMs,
    bool playing = true,
    bool buffering = false,
    double volume = 1,
    double speed = 1,
    bool foreground = true,
  }) =>
      PlaybackSample(
        at: t0.add(Duration(seconds: second)),
        position: Duration(milliseconds: positionMs ?? (second * 1000 * speed).round()),
        isPlaying: playing,
        isBuffering: buffering,
        volume: volume,
        speed: speed,
        foreground: foreground,
      );

  test("counts normal playback second by second", () {
    final a = WatchTimeAccumulator();
    for (var s = 0; s <= 10; s++) {
      a.add(at(s));
    }
    expect(a.pendingSeconds, 10);
    expect(a.take(), 10);
    expect(a.pendingSeconds, 0);
  });

  test("the first sample only sets the baseline", () {
    final a = WatchTimeAccumulator()..add(at(0));
    expect(a.pendingSeconds, 0);
  });

  test("muted, paused, buffering, background and >2x don't count", () {
    final cases = <WatchRejection, PlaybackSample>{
      WatchRejection.muted: at(1, volume: 0),
      WatchRejection.paused: at(1, playing: false),
      WatchRejection.buffering: at(1, buffering: true),
      WatchRejection.background: at(1, foreground: false),
      WatchRejection.fastPlayback: at(1, speed: 2.5),
    };
    cases.forEach((reason, sample) {
      final a = WatchTimeAccumulator()..add(at(0))..add(sample);
      expect(a.pendingSeconds, 0, reason: reason.name);
      expect(a.lastRejection, reason);
    });
  });

  test("2x is allowed (the limit is > 2x)", () {
    final a = WatchTimeAccumulator()
      ..add(at(0, speed: 2))
      ..add(at(1, speed: 2));
    expect(a.pendingSeconds, 1);
  });

  test("skipping ahead or looping back doesn't count that interval", () {
    final skip = WatchTimeAccumulator()
      ..add(at(0))
      ..add(at(1, positionMs: 60000));
    expect(skip.lastRejection, WatchRejection.seek);
    expect(skip.pendingSeconds, 0);

    final loop = WatchTimeAccumulator()
      ..add(at(0, positionMs: 29000))
      ..add(at(1, positionMs: 0)) // short restarted
      ..add(at(2, positionMs: 1000));
    expect(loop.pendingSeconds, 1); // only the second after the restart
  });

  test("a long gap (app suspended) counts at most 2 seconds", () {
    final a = WatchTimeAccumulator()
      ..add(at(0))
      ..add(at(30, positionMs: 30000));
    expect(a.pendingSeconds, WatchTimeAccumulator.maxIntervalSeconds);
  });

  test("restore puts back undelivered seconds", () {
    final a = WatchTimeAccumulator()..restore(7.5);
    expect(a.take(), 7.5);
    a.restore(-3);
    expect(a.pendingSeconds, 0);
  });
}
