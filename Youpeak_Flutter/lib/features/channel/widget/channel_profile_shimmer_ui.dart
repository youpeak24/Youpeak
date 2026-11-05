import 'package:youpeak/core/platform/app_layout.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:shimmer/shimmer.dart';
import 'package:youpeak/core/theme/shimmer_palette.dart';

class ChannelProfileShimmerUi extends StatelessWidget {
  const ChannelProfileShimmerUi({super.key});

  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: ShimmerPalette.base,
      highlightColor: ShimmerPalette.highlight,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Container(
            height: Get.height / 8,
            width: Get.height / 8,
            margin: const EdgeInsets.only(bottom: 10),
            decoration: const BoxDecoration(color: AppColor.black, shape: BoxShape.circle),
          ),
          Container(
            height: Get.height / 45,
            width: AppLayout.width / 2,
            margin: const EdgeInsets.only(bottom: 5),
            decoration: BoxDecoration(color: AppColor.black, borderRadius: BorderRadius.circular(20)),
          ),
          Container(
            height: Get.height / 45,
            width: AppLayout.width / 2,
            margin: const EdgeInsets.only(bottom: 10),
            decoration: BoxDecoration(color: AppColor.black, borderRadius: BorderRadius.circular(20)),
          ),
          Container(
            height: Get.height / 25,
            width: AppLayout.width / 2.5,
            margin: const EdgeInsets.only(bottom: 5),
            decoration: BoxDecoration(color: AppColor.black, borderRadius: BorderRadius.circular(20)),
          ),
        ],
      ),
    );
  }
}
