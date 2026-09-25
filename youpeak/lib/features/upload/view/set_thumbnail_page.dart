import 'dart:io';

import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/shared/widgets/custom_filled_button.dart';
import 'package:youpeak/main.dart';
import 'package:youpeak/features/upload/controller/upload_video_controller.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:youpeak/core/assets/app_icons.dart';
import 'package:youpeak/core/constants/app_string.dart';

class SetThumbnailPage extends GetView<UploadVideoController> {
  const SetThumbnailPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        elevation: 0,
        leading: Container(
          padding: const EdgeInsets.only(left: 10),
          child: IconButton(
            icon: Image(
              image: const AssetImage(AppIcons.arrowBack),
              height: 18,
              width: 18,
              color: isDarkMode.value ? AppColor.white : AppColor.black,
            ),
            onPressed: () => Get.back(),
          ),
        ),
        title: Text(
          AppStrings.setThumbnail.tr,
          style: GoogleFonts.urbanist(fontSize: 18, fontWeight: FontWeight.bold),
        ),
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 10),
          child: Column(
            children: [
              Container(
                clipBehavior: Clip.hardEdge,
                height: Get.height / 3.7,
                width: Get.width,
                decoration: BoxDecoration(
                  color: AppColor.grey_100,
                  borderRadius: BorderRadius.circular(19),
                ),
                child: Obx(
                  () => controller.thumbnail.value != ""
                      ? Image.file(
                          File(controller.thumbnail.value),
                          fit: BoxFit.cover,
                        )
                      : Center(
                          child: Image.asset(
                            AppIcons.logo,
                            height: 60,
                            width: 60,
                            color: AppColor.grey_300,
                          ),
                        ),
                ),
              ),
              const SizedBox(height: 10),
              GestureDetector(
                onTap: () async {
                  await controller.pickImage();
                },
                child: Container(
                  height: 52,
                  padding: const EdgeInsets.symmetric(horizontal: 15),
                  decoration: BoxDecoration(
                    color: isDarkMode.value ? AppColor.secondDarkMode : AppColor.grey_100,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Center(
                    child: Row(children: [
                      Image.asset(
                        AppIcons.setThumbnail,
                        width: 28,
                        color: isDarkMode.value ? AppColor.white.withOpacity(0.7) : null,
                      ),
                      const SizedBox(width: 10),
                      Expanded(child: Text(AppStrings.setNewThumbnail.tr, style: GoogleFonts.urbanist(fontSize: 16, fontWeight: FontWeight.w600))),
                      SizedBox(
                          width: 120,
                          child: Align(
                              alignment: Alignment.centerRight,
                              child: Text("", maxLines: 1, overflow: TextOverflow.ellipsis, style: GoogleFonts.urbanist(fontSize: 12, color: Colors.grey)))),
                      const SizedBox(width: 10),
                      Image.asset(AppIcons.arrowRight, width: 18, color: isDarkMode.value ? AppColor.white.withOpacity(0.7) : AppColor.black),
                    ]),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
      bottomNavigationBar: CustomFilledButton(
        title: AppStrings.apply.tr,
        callback: () => Get.back(),
      ).paddingAll(10),
    );
  }
}
