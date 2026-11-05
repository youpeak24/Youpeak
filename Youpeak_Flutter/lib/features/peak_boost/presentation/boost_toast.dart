import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/core/theme/app_color.dart';

/// Floating in-video toast ("Asha boosted 500 Coins!") shown for 3 seconds
/// over the top of the screen, where the player sits.
void showBoostToast(BuildContext context, String text, {Duration duration = const Duration(seconds: 3)}) {
  final overlay = Overlay.maybeOf(context, rootOverlay: true);
  if (overlay == null) return;
  late final OverlayEntry entry;
  entry = OverlayEntry(builder: (_) => _BoostToast(text: text, duration: duration, onDone: () => entry.remove()));
  overlay.insert(entry);
}

class _BoostToast extends StatefulWidget {
  const _BoostToast({required this.text, required this.duration, required this.onDone});

  final String text;
  final Duration duration;
  final VoidCallback onDone;

  @override
  State<_BoostToast> createState() => _BoostToastState();
}

class _BoostToastState extends State<_BoostToast> with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(vsync: this, duration: const Duration(milliseconds: 250));

  @override
  void initState() {
    super.initState();
    _c.forward();
    Future.delayed(widget.duration, () async {
      if (!mounted) return;
      await _c.reverse();
      widget.onDone();
    });
  }

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final top = MediaQuery.paddingOf(context).top + 56;
    return Positioned(
      top: top,
      left: 24,
      right: 24,
      child: IgnorePointer(
        child: FadeTransition(
          opacity: _c,
          child: SlideTransition(
            position: Tween(begin: const Offset(0, -0.4), end: Offset.zero).animate(CurvedAnimation(parent: _c, curve: Curves.easeOutBack)),
            child: Center(
              child: Semantics(
                liveRegion: true,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                  decoration: BoxDecoration(
                    gradient: AppColor.peakBoostGradient,
                    borderRadius: BorderRadius.circular(24),
                    boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.3), blurRadius: 12, offset: const Offset(0, 4))],
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.rocket_launch_rounded, color: AppColor.coinGold, size: 20),
                      const SizedBox(width: 8),
                      Flexible(
                        child: Text(
                          widget.text,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: GoogleFonts.urbanist(color: AppColor.white, fontSize: 15, fontWeight: FontWeight.w800, decoration: TextDecoration.none),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
