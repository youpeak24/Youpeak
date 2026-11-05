import 'package:flutter/material.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:youpeak/core/assets/app_visuals.dart';

/// Consistent rendering for decorative, full-colour app artwork.
class AppArtwork extends StatelessWidget {
  const AppArtwork({
    super.key,
    required this.asset,
    this.width,
    this.height = 160,
    this.fit = BoxFit.contain,
    this.semanticLabel,
  });

  final String asset;
  final double? width;
  final double height;
  final BoxFit fit;
  final String? semanticLabel;

  @override
  Widget build(BuildContext context) => Image.asset(
        asset,
        width: width,
        height: height,
        fit: fit,
        // Decode at the size it is drawn (the sources are up to 640 px).
        cacheHeight: (height * MediaQuery.devicePixelRatioOf(context)).ceil(),
        filterQuality: FilterQuality.medium,
        semanticLabel: semanticLabel,
        excludeFromSemantics: semanticLabel == null,
      );
}

/// A compact hero surface that leaves the page's controls in view.
class FeatureArtwork extends StatelessWidget {
  const FeatureArtwork({super.key, required this.asset, this.height = 144});

  final String asset;
  final double height;

  @override
  Widget build(BuildContext context) => Container(
        width: double.infinity,
        height: height,
        margin: const EdgeInsets.only(top: 8, bottom: 20),
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: AppColor.primaryColor.withValues(alpha: 0.06),
          borderRadius: BorderRadius.circular(24),
        ),
        child: AppArtwork(asset: asset, height: height - 16),
      );
}

/// Illustration with a decorative burst (confetti by default) behind it.
class SuccessArtwork extends StatelessWidget {
  const SuccessArtwork({super.key, required this.asset, this.size = 180, this.burst = AppVisuals.confetti});

  final String asset;
  final double size;
  final String burst;

  @override
  Widget build(BuildContext context) => SizedBox(
        height: size,
        width: size * 1.4,
        child: Stack(
          alignment: Alignment.center,
          children: [
            Positioned(top: 0, child: AppArtwork(asset: burst, height: size * 0.8)),
            AppArtwork(asset: asset, height: size),
          ],
        ),
      );
}
