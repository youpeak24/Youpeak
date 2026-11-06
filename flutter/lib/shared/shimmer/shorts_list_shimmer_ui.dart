import 'package:flutter/material.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:shimmer/shimmer.dart';
import 'package:youpeak/core/theme/shimmer_palette.dart';

class ShortsListShimmerUi extends StatelessWidget {
  const ShortsListShimmerUi({super.key});

  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: ShimmerPalette.base,
      highlightColor: ShimmerPalette.highlight,
      child: GridView.builder(
        shrinkWrap: true,
        itemCount: 16,
        padding: const EdgeInsets.all(15),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 2, crossAxisSpacing: 5, mainAxisSpacing: 5, mainAxisExtent: 250),
        itemBuilder: (context, index) => Container(
          height: 250,
          decoration: BoxDecoration(color: AppColor.black, borderRadius: BorderRadius.circular(20)),
        ),
      ),
    );
  }
}
