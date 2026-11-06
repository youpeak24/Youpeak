import 'package:youpeak/shared/dialogs/app_sheet.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/core/utils/custom_format_timer.dart';
import 'package:youpeak/shared/widgets/loader_ui.dart';
import 'package:youpeak/main.dart';
import 'package:youpeak/features/bites/controller/create_short_controller.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:youpeak/shared/widgets/preview_image.dart';
import 'package:youpeak/core/constants/app_string.dart';

class AddSoundBottomSheet {
  static void show() {
    AppSheet.show(
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.only(topLeft: Radius.circular(25), topRight: Radius.circular(25)),
      ),
      backgroundColor: isDarkMode.value ? AppColor.secondDarkMode : AppColor.white,
      SizedBox(
        height: Get.height / 1.5,
        child: Column(
          children: [
            const SizedBox(height: 15),
            Text(AppStrings.addSound.tr, style: GoogleFonts.urbanist(fontWeight: FontWeight.bold, fontSize: 16)),
            const Divider(indent: 50, endIndent: 50),
            const SizedBox(height: 25),
            Expanded(
              child: GetBuilder<CreateShortController>(
                id: "onGetSoundList",
                builder: (controller) => controller.mainSoundList == null
                    ? const LoaderUi()
                    : controller.mainSoundList!.isEmpty
                        ? const Center(child: Text("No Sound Found"))
                        : SingleChildScrollView(
                            physics: const BouncingScrollPhysics(),
                            child: ListView.builder(
                              shrinkWrap: true,
                              physics: const NeverScrollableScrollPhysics(),
                              padding: const EdgeInsets.symmetric(horizontal: 10),
                              itemCount: controller.mainSoundList?.length,
                              itemBuilder: (context, index) => Padding(
                                padding: const EdgeInsets.only(bottom: 10),
                                child: GestureDetector(
                                  onTap: () async => controller.onChangeSound(index),
                                  child: Row(
                                    children: [
                                      Container(
                                          height: 60,
                                          width: 60,
                                          clipBehavior: Clip.antiAlias,
                                          decoration: BoxDecoration(borderRadius: BorderRadius.circular(15)),
                                          child: PreviewVideoImage(
                                            videoId: controller.mainSoundList![index].id!,
                                            videoImage: controller.mainSoundList![index].soundImage!,
                                          )),
                                      const SizedBox(width: 10),
                                      Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            controller.mainSoundList![index].soundTitle!,
                                            style: GoogleFonts.urbanist(fontSize: 14, fontWeight: FontWeight.bold),
                                          ),
                                          const SizedBox(height: 3),
                                          Text(
                                            controller.mainSoundList![index].singerName!,
                                            style: GoogleFonts.urbanist(fontSize: 12, color: AppColor.grey),
                                          ),
                                          const SizedBox(height: 3),
                                          Text(
                                            CustomFormatTime.convert(controller.mainSoundList![index].soundTime!),
                                            style: GoogleFonts.urbanist(fontSize: 12, color: AppColor.grey),
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                          ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
