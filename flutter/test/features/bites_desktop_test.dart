import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:youpeak/core/platform/wheel_page_turner.dart';
import 'package:youpeak/features/bites/view/bites_desktop.dart';

void main() {
  group("bitesFrameSize", () {
    test("is 9:16 and fits the available height (1920x1080 beside the sidebar)", () {
      final size = bitesFrameSize(const BoxConstraints(maxWidth: 1687, maxHeight: 1080));
      expect(size.width / size.height, closeTo(9 / 16, 1e-9));
      expect(size.height, lessThanOrEqualTo(1080 - 48));
      expect(size.height, greaterThan(900));
    });

    test("1366x768: height-bound, still leaves room for the action column", () {
      final size = bitesFrameSize(const BoxConstraints(maxWidth: 1133, maxHeight: 768));
      expect(size.height, closeTo(768 - 48, 0.5));
      expect(size.width + bitesActionColumnWidth, lessThan(1133));
    });

    test("very tall windows are capped at a readable width", () {
      final size = bitesFrameSize(const BoxConstraints(maxWidth: 2500, maxHeight: 2400));
      expect(size.width, 560);
    });
  });

  group("bitesVideoFit", () {
    test("portrait sources fill the frame", () {
      expect(bitesVideoFit(const Size(1080, 1920)), BoxFit.cover);
      expect(bitesVideoFit(const Size(720, 960)), BoxFit.cover);
    });

    test("landscape and square sources are letterboxed, not cropped", () {
      expect(bitesVideoFit(const Size(1920, 1080)), BoxFit.contain);
      expect(bitesVideoFit(const Size(1000, 1000)), BoxFit.contain);
    });

    test("unknown size is shown whole", () {
      expect(bitesVideoFit(Size.zero), BoxFit.contain);
    });
  });

  group("WheelGestureGate", () {
    Duration at(int ms) => Duration(milliseconds: 100000 + ms);

    test("one inertial trackpad swipe (events every 16 ms for 1.5 s) turns one page", () {
      final gate = WheelGestureGate();
      var turns = 0;
      for (var ms = 0; ms <= 1500; ms += 16) {
        if (gate.accept(at(ms))) turns++;
      }
      expect(turns, 1);
    });

    test("stalls of up to 300 ms inside one swipe (busy browser) still count as one gesture", () {
      final gate = WheelGestureGate();
      var turns = 0;
      for (final ms in [0, 16, 32, 330, 346, 362, 640, 656, 672, 950]) {
        if (gate.accept(at(ms))) turns++;
      }
      expect(turns, 1);
    });

    test("two separate wheel flicks turn two pages", () {
      final gate = WheelGestureGate();
      expect(gate.accept(at(0)), isTrue);
      expect(gate.accept(at(30)), isFalse);
      expect(gate.accept(at(800)), isTrue);
    });

    test("a new gesture right after a turn waits for the minimum interval", () {
      final gate = WheelGestureGate();
      expect(gate.accept(at(0)), isTrue);
      expect(gate.accept(at(400)), isFalse); // new gesture, but too soon after the turn
      expect(gate.accept(at(1200)), isTrue);
    });
  });

  group("TurnAwareScrollPhysics", () {
    final metrics = FixedScrollMetrics(minScrollExtent: 0, maxScrollExtent: 3000, pixels: 1000, viewportDimension: 1000, axisDirection: AxisDirection.down, devicePixelRatio: 1);

    test("refuses user scrolling only while a turn animates, also under page snapping", () {
      var turning = false;
      final physics = const PageScrollPhysics().applyTo(TurnAwareScrollPhysics(isTurning: () => turning));
      expect(physics.shouldAcceptUserOffset(metrics), isTrue);
      turning = true;
      expect(physics.shouldAcceptUserOffset(metrics), isFalse);
      turning = false;
      expect(physics.shouldAcceptUserOffset(metrics), isTrue);
    });

    test("PageTurnGuard is engaged for the animation and released after it, even on error", () async {
      final guard = PageTurnGuard();
      var during = false;
      await guard.run(() async => during = guard.isTurning);
      expect(during, isTrue);
      expect(guard.isTurning, isFalse);
      await expectLater(guard.run(() async => throw StateError("x")), throwsStateError);
      expect(guard.isTurning, isFalse);
    });
  });
}
