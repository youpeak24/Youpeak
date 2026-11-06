import 'package:youpeak/core/platform/app_layout.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:shimmer/shimmer.dart';
import 'package:youpeak/core/theme/shimmer_palette.dart';

class NormalVideoShimmerUi extends StatelessWidget {
  const NormalVideoShimmerUi({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      shrinkWrap: true,
      itemCount: 10,
      padding: const EdgeInsets.symmetric(horizontal: 15),
      physics: const NeverScrollableScrollPhysics(),
      itemBuilder: (context, index) => Shimmer.fromColors(
        baseColor: ShimmerPalette.base,
        highlightColor: ShimmerPalette.highlight,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.spaceAround,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Container(
              height: Get.height / 4,
              width: AppLayout.width,
              margin: const EdgeInsets.only(bottom: 5),
              decoration: BoxDecoration(color: AppColor.black, borderRadius: BorderRadius.circular(20)),
            ),
            Row(
              children: [
                Container(
                  height: Get.height / 20,
                  width: Get.height / 20,
                  margin: const EdgeInsets.only(bottom: 5, left: 5),
                  decoration: const BoxDecoration(color: AppColor.black, shape: BoxShape.circle),
                ),
                Expanded(
                  child: Column(
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Container(
                              height: Get.height / 45,
                              margin: const EdgeInsets.only(left: 5, right: 5, bottom: 5),
                              decoration: BoxDecoration(color: AppColor.black, borderRadius: BorderRadius.circular(20)),
                            ),
                          ),
                          Container(
                            height: Get.height / 35,
                            width: Get.height / 35,
                            margin: const EdgeInsets.only(bottom: 3, right: 5),
                            decoration: const BoxDecoration(color: AppColor.black, shape: BoxShape.circle),
                          ),
                        ],
                      ),
                      Row(
                        children: [
                          Expanded(
                            child: Container(
                              height: Get.height / 45,
                              margin: const EdgeInsets.only(left: 5, right: 5, bottom: 7),
                              decoration: BoxDecoration(color: AppColor.black, borderRadius: BorderRadius.circular(20)),
                            ),
                          ),
                        ],
                      ),
                      Row(
                        children: [
                          Container(
                            height: Get.height / 45,
                            width: Get.height / 8,
                            margin: const EdgeInsets.only(left: 5, right: 5, bottom: 5),
                            decoration: BoxDecoration(color: AppColor.black, borderRadius: BorderRadius.circular(20)),
                          ),
                          Container(
                            height: Get.height / 45,
                            width: Get.height / 12,
                            margin: const EdgeInsets.only(bottom: 5, right: 5),
                            decoration: BoxDecoration(color: AppColor.black, borderRadius: BorderRadius.circular(20)),
                          ),
                          Container(
                            height: Get.height / 45,
                            width: Get.height / 12,
                            margin: const EdgeInsets.only(bottom: 5, right: 5),
                            decoration: BoxDecoration(color: AppColor.black, borderRadius: BorderRadius.circular(20)),
                          ),
                        ],
                      ),
                      SizedBox(height: Get.height * 0.01),
                    ],
                  ),
                ),
              ],
            )
          ],
        ),
      ),
    );
  }
}
