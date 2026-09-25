import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/shared/widgets/custom_filled_button.dart';
import 'package:youpeak/shared/widgets/loader_ui.dart';
import 'package:youpeak/core/storage/database/database.dart';
import 'package:youpeak/main.dart';
import 'package:youpeak/features/edit_video/controller/edit_video_controller.dart';
import 'package:youpeak/features/channel/model/get_channel_video_model.dart';
import 'package:youpeak/features/video/model/video_details_model.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:youpeak/core/assets/app_icons.dart';
import 'package:youpeak/shared/widgets/preview_image.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'package:youpeak/core/constants/app_string.dart';
import 'package:youpeak/core/utils/utils.dart';

class EditVideoView extends StatelessWidget {
  const EditVideoView({super.key, required this.videoId, required this.videoType});

  final String videoId;
  final int videoType;

  @override
  Widget build(BuildContext context) {
    final controller = Get.put(EditVideoController());
    controller.init(videoId: videoId, videoType: videoType);
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
            onPressed: () {
              Get.back();
            },
          ),
        ),
        title: Text(
          AppStrings.editVideo.tr,
          style: GoogleFonts.urbanist(fontSize: 18, fontWeight: FontWeight.bold),
        ),
      ),
      body: GetBuilder<EditVideoController>(
        id: "onLoading",
        builder: (controller) => controller.isLoadingVideoDetails
            ? const LoaderUi()
            : Stack(
                children: [
                  SizedBox(
                    height: Get.height,
                    width: Get.width,
                    child: SingleChildScrollView(
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 15),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Container(
                              height: 200,
                              width: controller.videoDetailsModel?.detailsOfVideo?.videoType == 1 ? Get.width : 150,
                              clipBehavior: Clip.antiAlias,
                              decoration: BoxDecoration(
                                color: isDarkMode.value ? AppColor.secondDarkMode : AppColor.grey_100,
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: PreviewNetworkImage(
                                image: controller.videoDetailsModel?.detailsOfVideo?.videoImage ?? "",
                                id: controller.videoDetailsModel?.detailsOfVideo?.id ?? "",
                                fit: BoxFit.cover,
                              ),
                            ),
                            15.height,
                            Text(AppStrings.addTitle.tr, style: GoogleFonts.urbanist(fontWeight: FontWeight.bold, fontSize: 16)),
                            const SizedBox(height: 10),
                            TextFormField(
                              controller: controller.titleController,
                              decoration: InputDecoration(
                                isDense: true,
                                filled: true,
                                hintText: AppStrings.yourTitleHere.tr,
                                fillColor: isDarkMode.value ? AppColor.secondDarkMode : AppColor.grey_100,
                                contentPadding: const EdgeInsets.all(15),
                                enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(15), borderSide: BorderSide(color: AppColor.grey_100)),
                                focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(15), borderSide: BorderSide(color: AppColor.grey_100)),
                              ),
                            ),
                            15.height,
                            Text(AppStrings.description.tr, style: GoogleFonts.urbanist(fontWeight: FontWeight.bold, fontSize: 16)),
                            const SizedBox(height: 10),
                            TextFormField(
                              controller: controller.descriptionController,
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
                            15.height,
                          ],
                        ),
                      ),
                    ),
                  ),
                  Visibility(
                    visible: controller.isLoading,
                    child: Container(
                      height: Get.height,
                      width: Get.width,
                      color: AppColor.transparent,
                      child: const LoaderUi(),
                    ),
                  ),
                ],
              ),
      ),
      bottomNavigationBar: Padding(
        padding: const EdgeInsets.all(10),
        child: CustomFilledButton(
          title: AppStrings.submit.tr,
          callback: controller.onEditVideo,
        ),
      ),
    );
  }
}
