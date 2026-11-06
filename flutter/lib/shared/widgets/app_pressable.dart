import 'package:flutter/material.dart';
import 'package:youpeak/core/theme/app_tokens.dart';

/// Tap target with press feedback: the child eases down a few percent while a
/// finger is on it and springs back on release, optionally with a light haptic.
/// Replaces the bare `GestureDetector` that left taps feeling dead.
///
/// With `onTap == null` the child is shown unchanged and is not interactive.
class AppPressable extends StatefulWidget {
  const AppPressable({
    super.key,
    required this.child,
    this.onTap,
    this.onLongPress,
    this.pressedScale = 0.97,
    this.haptic = false,
    this.semanticLabel,
    this.behavior = HitTestBehavior.opaque,
  });

  final Widget child;
  final VoidCallback? onTap;
  final VoidCallback? onLongPress;
  final double pressedScale;
  final bool haptic;
  final String? semanticLabel;
  final HitTestBehavior behavior;

  @override
  State<AppPressable> createState() => _AppPressableState();
}

class _AppPressableState extends State<AppPressable> {
  bool _down = false;

  void _set(bool value) {
    if (_down != value && mounted) setState(() => _down = value);
  }

  @override
  Widget build(BuildContext context) {
    final enabled = widget.onTap != null || widget.onLongPress != null;
    if (!enabled) return widget.child;

    Widget result = GestureDetector(
      behavior: widget.behavior,
      onTapDown: (_) => _set(true),
      onTapUp: (_) => _set(false),
      onTapCancel: () => _set(false),
      onTap: widget.onTap == null
          ? null
          : () {
              if (widget.haptic) AppHaptics.tap();
              widget.onTap!();
            },
      onLongPress: widget.onLongPress,
      child: AnimatedScale(
        scale: _down ? widget.pressedScale : 1,
        duration: AppMotion.of(context, AppMotion.fast),
        curve: AppMotion.curve,
        child: widget.child,
      ),
    );

    result = MouseRegion(cursor: SystemMouseCursors.click, child: result);
    if (widget.semanticLabel != null) {
      result = Semantics(button: true, label: widget.semanticLabel, excludeSemantics: true, child: result);
    }
    return result;
  }
}
