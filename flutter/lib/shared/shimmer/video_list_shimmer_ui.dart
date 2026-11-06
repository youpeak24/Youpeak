import 'package:youpeak/core/platform/app_layout.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:shimmer/shimmer.dart';
import 'package:youpeak/core/theme/shimmer_palette.dart';

class VideoListShimmerUi extends StatelessWidget {
  const VideoListShimmerUi({super.key});

  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: ShimmerPalette.base,
      highlightColor: ShimmerPalette.highlight,
      child: ListView.builder(
        shrinkWrap: true,
        itemCount: 15,
        padding: const EdgeInsets.symmetric(horizontal: 15),
        itemBuilder: (context, index) => Padding(
          padding: const EdgeInsets.only(bottom: 10),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Container(
                height: AppLayout.width / 4,
                width: AppLayout.width / 2.3,
                decoration: BoxDecoration(color: AppColor.black, borderRadius: BorderRadius.circular(20)),
              ),
              SizedBox(width: AppLayout.width * 0.02),
              Expanded(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      height: Get.height / 50,
                      margin: const EdgeInsets.only(bottom: 5),
                      decoration: BoxDecoration(color: AppColor.black, borderRadius: BorderRadius.circular(20)),
                    ),
                    Container(
                      height: Get.height / 50,
                      margin: const EdgeInsets.only(bottom: 5),
                      decoration: BoxDecoration(color: AppColor.black, borderRadius: BorderRadius.circular(20)),
                    ),
                    Container(
                      height: Get.height / 50,
                      width: AppLayout.width / 3,
                      margin: const EdgeInsets.only(bottom: 5),
                      decoration: BoxDecoration(color: AppColor.black, borderRadius: BorderRadius.circular(20)),
                    ),
                    Container(
                      height: Get.height / 50,
                      width: AppLayout.width / 4,
                      margin: const EdgeInsets.only(bottom: 5),
                      decoration: BoxDecoration(color: AppColor.black, borderRadius: BorderRadius.circular(20)),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
