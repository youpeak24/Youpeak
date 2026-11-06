import 'package:flutter/material.dart';

/// One way to draw a registry glyph (`AppIcons.*`).
///
/// * Glyphs are black-on-transparent artwork meant to be tinted: [AppIcon]
///   tints with [color], else the ambient [IconTheme] colour, so a glyph follows
///   light/dark and selected/unselected states like a font icon does.
/// * Full-colour artwork (`AppVisuals.*`, badges, illustrations) must not be
///   tinted: use [AppIcon.colored].
///
/// The box is always [size] x [size] so rows align regardless of how a glyph is
/// padded inside its canvas. Images are decoded at the size they are drawn at
/// (the source PNGs are 128 px; a 24 dp icon is not decoded at 128).
///
/// Pass [semanticLabel] for an icon that stands alone; leave it null when the
/// icon is decorative next to a text label (it is then hidden from screen readers).
class AppIcon extends StatelessWidget {
  const AppIcon(
    this.asset, {
    super.key,
    this.size = 24,
    this.color,
    this.semanticLabel,
  }) : tinted = true;

  const AppIcon.colored(
    this.asset, {
    super.key,
    this.size = 24,
    this.semanticLabel,
  })  : color = null,
        tinted = false;

  final String asset;
  final double size;
  final Color? color;
  final String? semanticLabel;
  final bool tinted;

  @override
  Widget build(BuildContext context) {
    final dpr = MediaQuery.devicePixelRatioOf(context);
    final tint = tinted ? (color ?? IconTheme.of(context).color ?? DefaultTextStyle.of(context).style.color) : null;
    Widget image = Image.asset(
      asset,
      width: size,
      height: size,
      fit: BoxFit.contain,
      color: tint,
      colorBlendMode: tint == null ? null : BlendMode.srcIn,
      cacheWidth: (size * dpr).ceil(),
      filterQuality: FilterQuality.medium,
      gaplessPlayback: true,
      excludeFromSemantics: true,
    );
    image = SizedBox(width: size, height: size, child: image);
    if (semanticLabel == null) return ExcludeSemantics(child: image);
    return Semantics(label: semanticLabel, image: true, child: image);
  }
}
