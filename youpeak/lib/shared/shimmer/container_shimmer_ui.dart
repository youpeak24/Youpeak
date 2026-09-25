import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:youpeak/main.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:shimmer/shimmer.dart';

class ContainerShimmerUi extends StatelessWidget {
  const ContainerShimmerUi({super.key, required this.height, this.radius, this.width});
  final double height;

  final double? radius;
  final double? width;

  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: isDarkMode.value ? AppColor.secondDarkMode : AppColor.grey_300,
      highlightColor: AppColor.white,
      child: Container(
        height: height,
        width: width ?? Get.width,
        margin: const EdgeInsets.all(2),
        decoration: BoxDecoration(color: AppColor.black, borderRadius: BorderRadius.circular(radius ?? 100)),
      ),
    );
  }
}
