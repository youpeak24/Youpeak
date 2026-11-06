import 'package:youpeak/core/platform/responsive.dart';
import 'package:youpeak/core/platform/app_layout.dart';
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
    final wide = PageWidth.of(context) >= Responsive.splitFrom;
    final inline = PageWidth.of(context) >= Responsive.inlineActionFrom;
    final submit = CustomFilledButton(
      title: AppStrings.submit.tr,
      callback: controller.onEditVideo,
    );
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
        builder: (controller) {
          if (controller.isLoadingVideoDetails) return const LoaderUi();

          // A landscape video previews at 16:9-ish, a short is a narrow tile.
          final isLandscape = controller.videoDetailsModel?.detailsOfVideo?.videoType == 1;
          final preview = Container(
            height: 200,
            width: isLandscape ? (wide ? 340 : AppLayout.widthOf(context)) : 150,
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
          );
          final form = <Widget>[
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
          ];

          return Stack(
            children: [
              // Wide: the preview beside the form, Submit under the form.
              // Phones: the preview above the form, Submit docked below.
              if (wide)
                AdaptiveScroll(
                  maxWidth: 900,
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      SizedBox(width: 340, child: preview),
                      const SizedBox(width: 32),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [...form, Align(alignment: Alignment.centerLeft, child: SizedBox(width: 360, child: submit))],
                        ),
                      ),
                    ],
                  ),
                )
              else
                SizedBox(
                  height: Get.height,
                  width: AppLayout.widthOf(context),
                  child: SingleChildScrollView(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 15),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          preview,
                          15.height,
                          ...form,
                          // Between a phone and a split layout Submit still sits under the form.
                          if (inline) Align(alignment: Alignment.centerLeft, child: SizedBox(width: 360, child: submit)),
                        ],
                      ),
                    ),
                  ),
                ),
              Visibility(
                visible: controller.isLoading,
                child: Container(
                  height: Get.height,
                  width: AppLayout.widthOf(context),
                  color: AppColor.transparent,
                  child: const LoaderUi(),
                ),
              ),
            ],
          );
        },
      ),
      bottomNavigationBar: inline ? null : Padding(padding: const EdgeInsets.all(10), child: submit),
    );
  }
}
