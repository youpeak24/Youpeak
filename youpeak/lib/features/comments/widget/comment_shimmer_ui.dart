import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:youpeak/main.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:shimmer/shimmer.dart';

class CommentShimmerUi extends StatelessWidget {
  const CommentShimmerUi({super.key});

  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: isDarkMode.value ? AppColor.secondDarkMode : AppColor.grey_300,
      highlightColor: AppColor.white,
      child: SingleChildScrollView(
        child: Column(
          children: [
            for (int i = 0; i < 10; i++)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10),
                child: Column(
                  children: [
                    const SizedBox(height: 15),
                    Row(
                      children: [
                        Container(
                          margin: const EdgeInsets.only(right: 5),
                          height: 30,
                          width: 30,
                          decoration: const BoxDecoration(color: Colors.grey, shape: BoxShape.circle),
                        ),
                        Expanded(
                          child: Container(
                            margin: const EdgeInsets.only(right: 5),
                            height: 30,
                            decoration: BoxDecoration(color: Colors.grey, borderRadius: BorderRadius.circular(10)),
                          ),
                        ),
                        Expanded(
                          child: Container(
                            height: 30,
                            decoration: BoxDecoration(color: Colors.grey, borderRadius: BorderRadius.circular(10)),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 5),
                    Container(
                      height: 30,
                      width: Get.width,
                      decoration: BoxDecoration(color: Colors.grey, borderRadius: BorderRadius.circular(10)),
                    ),
                    const SizedBox(height: 5),
                    Row(
                      children: [
                        Container(
                          margin: const EdgeInsets.only(right: 5),
                          height: 30,
                          width: 80,
                          decoration: BoxDecoration(color: Colors.grey, borderRadius: BorderRadius.circular(10)),
                        ),
                        Container(
                          margin: const EdgeInsets.only(right: 5),
                          height: 30,
                          width: 80,
                          decoration: BoxDecoration(color: Colors.grey, borderRadius: BorderRadius.circular(10)),
                        ),
                        Container(
                          margin: const EdgeInsets.only(right: 5),
                          height: 30,
                          width: 80,
                          decoration: BoxDecoration(color: Colors.grey, borderRadius: BorderRadius.circular(10)),
                        ),
                      ],
                    )
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }
}
