import 'package:youpeak/core/platform/app_layout.dart';
import 'package:flutter/material.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:shimmer/shimmer.dart';
import 'package:youpeak/core/theme/shimmer_palette.dart';

class ContainerShimmerUi extends StatelessWidget {
  const ContainerShimmerUi({super.key, required this.height, this.radius, this.width});
  final double height;

  final double? radius;
  final double? width;

  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: ShimmerPalette.base,
      highlightColor: ShimmerPalette.highlight,
      child: Container(
        height: height,
        width: width ?? AppLayout.widthOf(context),
        margin: const EdgeInsets.all(2),
        decoration: BoxDecoration(color: AppColor.black, borderRadius: BorderRadius.circular(radius ?? 100)),
      ),
    );
  }
}
