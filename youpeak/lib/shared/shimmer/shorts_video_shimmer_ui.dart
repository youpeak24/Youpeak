import 'package:flutter/material.dart';
import 'package:youpeak/main.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:youpeak/core/assets/app_icons.dart';
import 'package:shimmer/shimmer.dart';

class ShortVideoShimmerUi extends StatelessWidget {
  const ShortVideoShimmerUi({super.key, this.isNotBack});

  final bool? isNotBack;

  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: isDarkMode.value ? AppColor.secondDarkMode : AppColor.grey_300,
      highlightColor: AppColor.white,
      child: Stack(
        children: [
          Center(child: Image.asset(AppIcons.logo, color: AppColor.black, width: 75)),
          Positioned(
              top: 40,
              child: SizedBox(
                width: MediaQuery.of(context).size.width,
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: Row(
                    children: [
                      isNotBack == null
                          ? Container(
                              height: 30,
                              width: 30,
                              margin: const EdgeInsets.only(right: 10),
                              decoration: const BoxDecoration(color: AppColor.black, shape: BoxShape.circle),
                            )
                          : const Offstage(),
                      const Spacer(),
                      for (int i = 0; i < 2; i++)
                        Container(
                          height: 30,
                          width: 30,
                          margin: const EdgeInsets.only(left: 10),
                          decoration: const BoxDecoration(color: AppColor.black, shape: BoxShape.circle),
                        ),
                    ],
                  ),
                ),
              )),
          Positioned(
              right: 20,
              bottom: 20,
              child: Column(
                children: [
                  for (int i = 0; i < 5; i++)
                    Container(
                      height: 40,
                      width: 40,
                      margin: const EdgeInsets.only(top: 10),
                      decoration: const BoxDecoration(color: AppColor.black, shape: BoxShape.circle),
                    ),
                ],
              )),
          Positioned(
            bottom: 10,
            child: Column(
              children: [
                for (int i = 0; i < 3; i++)
                  Container(
                    height: 15,
                    width: 200,
                    margin: const EdgeInsets.only(left: 20, bottom: 5),
                    decoration: BoxDecoration(color: AppColor.black, borderRadius: BorderRadius.circular(20)),
                  ),
                const SizedBox(height: 20),
                Row(
                  children: [
                    Container(
                      height: 40,
                      width: 40,
                      margin: const EdgeInsets.only(left: 15, bottom: 5),
                      decoration: const BoxDecoration(color: AppColor.black, shape: BoxShape.circle),
                    ),
                    Container(
                      height: 20,
                      width: 150,
                      margin: const EdgeInsets.only(left: 15, bottom: 5),
                      decoration: BoxDecoration(color: AppColor.black, borderRadius: BorderRadius.circular(20)),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
