import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:youpeak/main.dart';

// Desktop-browser Bites, laid out like a desktop reels feed: one portrait
// 9:16 player centered in the space beside the sidebar, sized from the
// available height, with the actions in a column beside it.

// Room kept for the action column (button + gap) beside the player.
const double bitesActionColumnWidth = 84;
const double _gap = 20;
const double _verticalPadding = 24;
const double _maxFrameWidth = 560;
const double _minFrameWidth = 220;

// The 9:16 player size that fits [constraints]: as tall as the space allows
// (less padding), never wider than [_maxFrameWidth], and narrow enough to
// leave the action column beside it.
Size bitesFrameSize(BoxConstraints constraints) {
  final byHeight = math.max(0.0, constraints.maxHeight - 2 * _verticalPadding) * 9 / 16;
  final byWidth = constraints.maxWidth - bitesActionColumnWidth - _gap - 2 * _verticalPadding;
  final width = math.max(_minFrameWidth, math.min(math.min(byHeight, byWidth), _maxFrameWidth));
  return Size(width, width * 16 / 9);
}

// How a source video fills the 9:16 player. Portrait sources (up to 4:5)
// cover the frame, so a 9:16 or 3:4 video fills it with at most a slight
// crop. Square and landscape sources are shown whole (letterboxed): covering
// would crop a 16:9 video to a sliver of its middle.
BoxFit bitesVideoFit(Size source) {
  if (source.width <= 0 || source.height <= 0) return BoxFit.contain;
  return source.width / source.height > 0.8 ? BoxFit.contain : BoxFit.cover;
}

// The page around one Bite: player frame and action column, centered on the
// page background.
class BitesDesktopStage extends StatelessWidget {
  const BitesDesktopStage({super.key, required this.frame, this.actions});

  final Widget frame;
  final Widget? actions;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final size = bitesFrameSize(constraints);
        return Obx(
          () => ColoredBox(
            color: isDarkMode.value ? AppColor.mainDark : AppColor.white,
            child: Center(
              child: Row(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  SizedBox(
                    width: size.width,
                    height: size.height,
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(16),
                      child: ColoredBox(color: Colors.black, child: frame),
                    ),
                  ),
                  const SizedBox(width: _gap),
                  SizedBox(width: bitesActionColumnWidth - _gap, child: actions ?? const SizedBox.shrink()),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}

// Loading placeholder in the player's place.
class BitesDesktopLoading extends StatelessWidget {
  const BitesDesktopLoading({super.key});

  @override
  Widget build(BuildContext context) {
    return const BitesDesktopStage(
      frame: Center(child: CircularProgressIndicator(color: AppColor.white, strokeWidth: 3)),
    );
  }
}

// One round action beside the player (like, comment, share, ...).
class BitesDesktopAction extends StatelessWidget {
  const BitesDesktopAction({super.key, required this.icon, required this.tooltip, required this.onTap, this.count, this.active = false});

  final Widget Function(Color color) icon;
  final String tooltip;
  final VoidCallback onTap;
  final String? count;
  final bool active;

  @override
  Widget build(BuildContext context) {
    final dark = isDarkMode.value;
    final color = active ? AppColor.primaryColor : (dark ? AppColor.white : AppColor.primaryTextIcons);
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Tooltip(
            message: tooltip,
            child: Material(
              color: dark ? Colors.white12 : AppColor.grey_100,
              shape: const CircleBorder(),
              child: InkWell(
                customBorder: const CircleBorder(),
                onTap: onTap,
                child: SizedBox(width: 48, height: 48, child: Center(child: icon(color))),
              ),
            ),
          ),
          if (count != null) ...[
            const SizedBox(height: 4),
            Text(count!, style: GoogleFonts.urbanist(fontSize: 13, fontWeight: FontWeight.w700, color: dark ? AppColor.white : AppColor.primaryTextIcons)),
          ],
        ],
      ),
    );
  }
}

// A small round control on the player (play/pause, sound).
class BitesFrameButton extends StatelessWidget {
  const BitesFrameButton({super.key, required this.icon, required this.tooltip, required this.onTap});

  final IconData icon;
  final String tooltip;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Tooltip(
      message: tooltip.tr,
      child: Material(
        color: Colors.black.withAlpha(110),
        shape: const CircleBorder(),
        child: InkWell(
          customBorder: const CircleBorder(),
          onTap: onTap,
          child: SizedBox(width: 40, height: 40, child: Icon(icon, color: Colors.white, size: 22)),
        ),
      ),
    );
  }
}
