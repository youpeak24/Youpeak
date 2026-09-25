import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/main.dart';
import 'package:youpeak/features/auth/view/fill_profile_view.dart';
import 'package:youpeak/features/live/controller/add_thumbnail_controller.dart';
import 'package:youpeak/features/bites/view/nav_shorts_details_view.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:youpeak/core/assets/app_icons.dart';
import 'package:youpeak/core/assets/app_visuals.dart';
import 'package:youpeak/shared/widgets/app_artwork.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'package:youpeak/core/constants/app_string.dart';
import 'package:youpeak/core/utils/utils.dart';
import 'package:youpeak/core/platform/local_media.dart';

class AddThumbnailView extends StatelessWidget {
  const AddThumbnailView({super.key});

  @override
  Widget build(BuildContext context) {
    final controller = Get.put(AddThumbnailController());
    return Scaffold(
      appBar: AppBar(
        elevation: 0,
        backgroundColor: Colors.transparent,
        systemOverlayStyle: SystemUiOverlayStyle(statusBarColor: Colors.transparent, statusBarIconBrightness: isDarkMode.value ? Brightness.light : Brightness.dark),
        leading: IconButtonUi(
            callback: () => Get.back(), icon: Image.asset(AppIcons.arrowBack, color: isDarkMode.value ? AppColor.white : AppColor.black).paddingOnly(left: 15, right: 20)),
        leadingWidth: 55,
        centerTitle: AppSettings.isCenterTitle,
        title: Text(AppStrings.addThumbnail.tr, style: GoogleFonts.urbanist(fontSize: 18, fontWeight: FontWeight.bold)),
      ),
      body: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 15),
        // Scrollable so the hero never overflows once the keyboard opens for the title.
        child: SingleChildScrollView(
          child: Column(
          children: [
            const FeatureArtwork(asset: AppVisuals.liveHero),
            Row(
              children: [
                GestureDetector(
                  onTap: () => chooseImageBottomSheet(),
                  child: Container(
                    height: 170,
                    width: 120,
                    alignment: Alignment.center,
                    clipBehavior: Clip.antiAlias,
                    decoration: BoxDecoration(
                      color: isDarkMode.value ? AppColor.secondDarkMode : AppColor.grey_100,
                      borderRadius: BorderRadius.circular(15),
                    ),
                    child: Obx(
                      () => AppSettings.pickImagePath.value == ""
                          ? Image.asset(
                              AppIcons.plus,
                              width: 50,
                              color: AppColor.grey_400,
                            )
                          : LocalMedia.image(AppSettings.pickImagePath.value, height: 170, width: 120, fit: BoxFit.cover),
                    ),
                  ),
                ),
                15.width,
                Expanded(
                  child: Container(
                    height: 170,
                    padding: const EdgeInsets.symmetric(horizontal: 15),
                    decoration: BoxDecoration(
                      color: isDarkMode.value ? AppColor.secondDarkMode : AppColor.grey_100,
                      borderRadius: BorderRadius.circular(15),
                    ),
                    child: TextFormField(
                      controller: controller.titleController,
                      decoration: InputDecoration(
                        border: InputBorder.none,
                        hintText: AppStrings.titleHere.tr,
                        hintStyle: GoogleFonts.urbanist(fontSize: 14, color: AppColor.grey, fontWeight: FontWeight.w500),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
        ),
      ),
      bottomNavigationBar: GestureDetector(
        onTap: controller.onGoLive,
        child: Container(
          height: 55,
          width: Get.width,
          margin: const EdgeInsets.all(15),
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: AppColor.primaryColor,
            borderRadius: BorderRadius.circular(100),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Image.asset(AppIcons.video, color: AppColor.white, height: 25, width: 25),
              SizedBox(width: Get.width * 0.02),
              Text(
                AppStrings.goLiveNow.tr,
                textAlign: TextAlign.center,
                style: GoogleFonts.urbanist(
                  fontWeight: FontWeight.w700,
                  fontSize: 16,
                  color: AppColor.white,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
