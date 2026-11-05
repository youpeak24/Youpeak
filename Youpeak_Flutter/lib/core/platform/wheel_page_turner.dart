import 'package:flutter/foundation.dart';
import 'package:flutter/gestures.dart';
import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';

// Desktop-browser paging for the full-screen Bites players. A PageView
// scrolls by the mouse wheel's pixel delta, so a wheel turn used to leave
// the player stopped between two videos; here one wheel gesture (or the
// Up/Down arrow keys) turns exactly one page. Phones are unaffected.
//
// Wrap each page's content in [WheelPageTurner] (it must sit below the
// PageView to take the wheel event before the PageView does) and the
// PageView itself in [PageKeyTurner].
class WheelPageTurner extends StatelessWidget {
  const WheelPageTurner({super.key, required this.onNext, required this.onPrevious, required this.child});

  final VoidCallback onNext;
  final VoidCallback onPrevious;
  final Widget child;

  // Shared by every page, since the gesture continues across the turn.
  static final _gate = WheelGestureGate();

  @override
  Widget build(BuildContext context) {
    if (!kIsWeb) return child;
    return Listener(
      onPointerSignal: (event) {
        if (event is! PointerScrollEvent) return;
        GestureBinding.instance.pointerSignalResolver.register(event, (resolved) {
          final dy = (resolved as PointerScrollEvent).scrollDelta.dy;
          if (dy.abs() < 1) return;
          if (!_gate.accept(resolved.timeStamp)) return;
          dy > 0 ? onNext() : onPrevious();
        });
      },
      child: child,
    );
  }
}

// Scroll physics for a page view turned by [WheelPageTurner]: while a turn is
// animating ([isTurning]), user scroll offsets are refused. During that
// animation Flutter ignores pointers inside the pages, so the rest of a
// trackpad swipe skipped WheelPageTurner, reached the page view itself,
// cancelled the turn and snapped back to the page it started from.
class TurnAwareScrollPhysics extends ScrollPhysics {
  const TurnAwareScrollPhysics({required this.isTurning, super.parent});

  final bool Function() isTurning;

  @override
  TurnAwareScrollPhysics applyTo(ScrollPhysics? ancestor) => TurnAwareScrollPhysics(isTurning: isTurning, parent: buildParent(ancestor));

  @override
  bool shouldAcceptUserOffset(ScrollMetrics position) => !isTurning() && super.shouldAcceptUserOffset(position);
}

// Runs a page-turn animation with [TurnAwareScrollPhysics] engaged.
class PageTurnGuard {
  bool _turning = false;

  bool get isTurning => _turning;

  Future<void> run(Future<void> Function() animate) async {
    _turning = true;
    try {
      await animate();
    } finally {
      _turning = false;
    }
  }
}

// Decides which wheel/trackpad events turn a page: only the first event of a
// gesture, a gesture being a run of events with no gap longer than [quiet].
// A trackpad's inertial scroll keeps sending events for a second or more;
// with a fixed time window that used to turn a second page mid-swipe. Two
// turns are also never closer than [minInterval].
//
// Times are the input events' own timestamps, not the time they are handled:
// while a page turn and video start-up keep the browser busy, events queue up
// and would otherwise look like a pause between two gestures.
class WheelGestureGate {
  WheelGestureGate({this.quiet = const Duration(milliseconds: 350), this.minInterval = const Duration(milliseconds: 600)});

  final Duration quiet;
  final Duration minInterval;

  Duration? _lastEvent;
  Duration? _lastTurn;

  bool accept(Duration timeStamp) {
    final newGesture = _lastEvent == null || timeStamp - _lastEvent! > quiet;
    _lastEvent = timeStamp;
    if (!newGesture) return false;
    if (_lastTurn != null && timeStamp - _lastTurn! < minInterval) return false;
    _lastTurn = timeStamp;
    return true;
  }
}

// Takes keyboard focus when the pages appear and whenever they are clicked:
// `autofocus` alone does nothing when something else (e.g. the sidebar tile
// that opened Bites) already has focus, so the arrow keys used to be dead
// until the user clicked into the player.
class PageKeyTurner extends StatefulWidget {
  const PageKeyTurner({super.key, required this.onNext, required this.onPrevious, required this.child});

  final VoidCallback onNext;
  final VoidCallback onPrevious;
  final Widget child;

  @override
  State<PageKeyTurner> createState() => _PageKeyTurnerState();
}

class _PageKeyTurnerState extends State<PageKeyTurner> {
  final _focusNode = FocusNode(debugLabel: "PageKeyTurner");

  @override
  void initState() {
    super.initState();
    if (kIsWeb) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) _focusNode.requestFocus();
      });
    }
  }

  @override
  void dispose() {
    _focusNode.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (!kIsWeb) return widget.child;
    return CallbackShortcuts(
      bindings: {
        const SingleActivator(LogicalKeyboardKey.arrowDown): widget.onNext,
        const SingleActivator(LogicalKeyboardKey.pageDown): widget.onNext,
        const SingleActivator(LogicalKeyboardKey.arrowUp): widget.onPrevious,
        const SingleActivator(LogicalKeyboardKey.pageUp): widget.onPrevious,
      },
      child: Focus(
        focusNode: _focusNode,
        autofocus: true,
        child: Listener(
          behavior: HitTestBehavior.translucent,
          onPointerDown: (_) {
            if (!_focusNode.hasFocus) _focusNode.requestFocus();
          },
          child: widget.child,
        ),
      ),
    );
  }
}
