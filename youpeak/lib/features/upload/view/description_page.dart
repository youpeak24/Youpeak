import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/shared/widgets/custom_border_button.dart';
import 'package:youpeak/shared/widgets/custom_filled_button.dart';
import 'package:youpeak/main.dart';
import 'package:youpeak/features/upload/controller/upload_video_controller.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:youpeak/core/assets/app_icons.dart';
import 'package:youpeak/core/constants/app_string.dart';

class DescriptionPageView extends GetView<UploadVideoController> {
  const DescriptionPageView({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      extendBody: true,
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
          AppStrings.videoDescription.tr,
          style: GoogleFonts.urbanist(fontSize: 18, fontWeight: FontWeight.bold),
        ),
      ),
      bottomNavigationBar: Padding(
        padding: const EdgeInsets.all(8.0),
        child: CustomFilledButton(title: AppStrings.apply.tr, callback: () => Get.back()),
      ),
      body: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // const SizedBox(height: 30),
              Text(AppStrings.description.tr, style: GoogleFonts.urbanist(fontWeight: FontWeight.bold, fontSize: 15)),
              const SizedBox(height: 10),
              TextFormField(
                onChanged: (value) => controller.update(["onChangeDescription"]),
                controller: controller.videoDescriptionController,
                maxLines: 10,
                decoration: InputDecoration(
                  isDense: true,
                  filled: true,
                  hintText: AppStrings.yourDescription.tr,
                  fillColor: isDarkMode.value ? AppColor.secondDarkMode : AppColor.grey_100,
                  enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(15), borderSide: BorderSide(color: isDarkMode.value ? AppColor.white.withOpacity(0.4) : AppColor.grey_100)),
                  focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(15), borderSide: const BorderSide(color: AppColor.primaryColor)),
                ),
              ),
              const SizedBox(height: 10),
              Text(AppStrings.hashtag.tr, style: GoogleFonts.urbanist(fontWeight: FontWeight.bold, fontSize: 15)),
              const SizedBox(height: 10),
              TextFormField(
                controller: controller.videoHashtagController,
                onChanged: (value) {
                  if (value.contains(" ")) {
                    if (controller.videoHashtagController.text.trim().isNotEmpty) {
                      controller.hashTagCollection.insert(0, "#${controller.videoHashtagController.text.trim()}");
                      controller.hashTagCollection.refresh();
                      controller.videoHashtagController.clear();
                    }
                  }
                },
                onFieldSubmitted: (value) {
                  if (controller.videoHashtagController.text.isNotEmpty) {
                    controller.hashTagCollection.insert(0, "#${controller.videoHashtagController.text.trim()}");
                    controller.hashTagCollection.refresh();
                    controller.videoHashtagController.clear();
                  }
                },
                decoration: InputDecoration(
                  isDense: true,
                  filled: true,
                  hintText: AppStrings.typeAndEnter.tr,
                  fillColor: isDarkMode.value ? AppColor.secondDarkMode : AppColor.grey_100,
                  enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(15), borderSide: BorderSide(color: isDarkMode.value ? AppColor.white.withOpacity(0.4) : AppColor.grey_100)),
                  focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(15), borderSide: const BorderSide(color: AppColor.primaryColor)),
                ),
              ),
              const SizedBox(height: 10),
              Obx(
                () => Wrap(
                  children: [
                    for (int i = 0; i < controller.hashTagCollection.length; i++)
                      GestureDetector(
                        onTap: () {
                          controller.hashTagCollection.removeAt(i);
                        },
                        child: Stack(
                          children: [
                            Padding(
                              padding: const EdgeInsets.all(8.0),
                              child: CustomBorderButton(title: controller.hashTagCollection[i]),
                            ),
                            Positioned(
                              top: 5,
                              right: 5,
                              child: Container(
                                height: 18,
                                width: 18,
                                decoration: BoxDecoration(
                                    color: isDarkMode.value ? AppColor.secondDarkMode : AppColor.white,
                                    shape: BoxShape.circle,
                                    border: Border.all(color: AppColor.primaryColor)),
                                child: const Center(
                                  child: Icon(
                                    Icons.close,
                                    color: AppColor.primaryColor,
                                    size: 15,
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                      )
                  ],
                ),
              ),
              const SizedBox(height: 50),
            ],
          ),
        ),
      ),
    );
  }
}
