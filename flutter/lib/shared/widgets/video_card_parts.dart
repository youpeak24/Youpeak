import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/core/theme/app_color.dart';

/// Pieces shared by every video card (feed, related, shorts shelf), so the
/// thumbnail overlays look the same wherever a video appears.

/// Dark pill with the running time, bottom-right of a thumbnail.
class DurationBadge extends StatelessWidget {
  const DurationBadge({super.key, required this.text, this.fontSize = 11.5});

  final String text;
  final double fontSize;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(8),
        color: const Color(0xCC000000), // 80% black, readable on any thumbnail (Spec 2.E: >= 75%)
      ),
      child: Text(
        text,
        style: GoogleFonts.urbanist(
          color: AppColor.white,
          fontSize: fontSize,
          fontWeight: FontWeight.w700,
          fontFeatures: const [FontFeature.tabularFigures()],
        ),
      ),
    );
  }
}

/// Soft dark gradient along the bottom of a thumbnail so overlaid text and
/// badges stay legible on bright images.
class ThumbnailScrim extends StatelessWidget {
  const ThumbnailScrim({super.key, this.height = 90, this.strength = 0.55});

  final double height;
  final double strength;

  @override
  Widget build(BuildContext context) {
    return Positioned(
      left: 0,
      right: 0,
      bottom: 0,
      height: height,
      child: IgnorePointer(
        child: DecoratedBox(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [Colors.transparent, Colors.black.withValues(alpha: strength)],
            ),
          ),
        ),
      ),
    );
  }
}

/// Two-tone meta line: channel in a heavier weight, then views and age.
/// e.g. "YouPeak Studio · 1.2K views · 3 days ago".
class VideoMetaText extends StatelessWidget {
  const VideoMetaText({super.key, required this.channel, required this.views, this.age, required this.dark, this.fontSize = 12.5});

  final String channel;
  final String views;
  final String? age;
  final bool dark;
  final double fontSize;

  @override
  Widget build(BuildContext context) {
    final muted = dark ? AppColor.mutedTextDark : AppColor.mutedText;
    final tail = [views, if (age != null && age!.trim().isNotEmpty) age!.trim()].join(' · ');
    final channelStyle = GoogleFonts.urbanist(fontSize: fontSize, fontWeight: FontWeight.w700, color: muted);
    final tailStyle = GoogleFonts.urbanist(fontSize: fontSize, fontWeight: FontWeight.w500, color: muted);

    if (channel.isEmpty) {
      return Text(tail, maxLines: 1, overflow: TextOverflow.ellipsis, style: tailStyle);
    }

    // The channel name gives way first: a long name is shortened so the view
    // count and age stay readable, as long as they fit in the row at all.
    return LayoutBuilder(
      builder: (context, constraints) {
        final painter = TextPainter(
          text: TextSpan(text: ' · $tail', style: tailStyle),
          maxLines: 1,
          textDirection: Directionality.of(context),
          textScaler: MediaQuery.textScalerOf(context),
        )..layout();
        final tailFits = constraints.hasBoundedWidth && painter.width <= constraints.maxWidth * 0.8;
        if (!tailFits) {
          return Text.rich(
            TextSpan(children: [
              TextSpan(text: channel, style: channelStyle),
              TextSpan(text: ' · $tail', style: tailStyle),
            ]),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          );
        }
        return Row(
          children: [
            Flexible(child: Text(channel, maxLines: 1, overflow: TextOverflow.ellipsis, style: channelStyle)),
            Text(' · $tail', maxLines: 1, style: tailStyle),
          ],
        );
      },
    );
  }
}
