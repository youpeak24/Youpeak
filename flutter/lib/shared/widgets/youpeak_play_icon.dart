import 'package:flutter/material.dart';
import 'package:youpeak/core/theme/app_color.dart';

/// The YouPeak play mark: a Forest Green (#0A7A44) rounded tile with a white
/// play triangle. Used for the Shorts shelf instead of a generic icon, and
/// drawn in code so it stays crisp at every size.
class YoupeakPlayIcon extends StatelessWidget {
  const YoupeakPlayIcon({super.key, this.size = 24, this.color = AppColor.primaryColor, this.semanticLabel});

  final double size;
  final Color color;
  final String? semanticLabel;

  @override
  Widget build(BuildContext context) => Semantics(
        label: semanticLabel,
        excludeSemantics: semanticLabel == null,
        child: CustomPaint(size: Size.square(size), painter: _PlayMarkPainter(color)),
      );
}

class _PlayMarkPainter extends CustomPainter {
  const _PlayMarkPainter(this.color);

  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    final s = size.shortestSide;
    final tile = RRect.fromRectAndRadius(Offset.zero & Size.square(s), Radius.circular(s * 0.26));
    canvas.drawRRect(tile, Paint()..color = color);

    // Optically centred triangle (nudged right), softened corners.
    final triangle = Path()
      ..moveTo(s * 0.38, s * 0.28)
      ..lineTo(s * 0.74, s * 0.50)
      ..lineTo(s * 0.38, s * 0.72)
      ..close();
    canvas.drawPath(
      triangle,
      Paint()
        ..color = Colors.white
        ..style = PaintingStyle.fill
        ..strokeJoin = StrokeJoin.round,
    );
    canvas.drawPath(
      triangle,
      Paint()
        ..color = Colors.white
        ..style = PaintingStyle.stroke
        ..strokeWidth = s * 0.06
        ..strokeJoin = StrokeJoin.round,
    );
  }

  @override
  bool shouldRepaint(_PlayMarkPainter old) => old.color != color;
}
