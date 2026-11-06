import 'package:youpeak/core/platform/responsive.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/core/platform/app_layout.dart';
import 'package:youpeak/shared/widgets/app_icon.dart';
import 'package:youpeak/shared/widgets/app_pressable.dart';
import 'package:youpeak/shared/widgets/basic_button.dart';
import 'package:youpeak/shared/widgets/custom_filled_button.dart';
import 'package:youpeak/main.dart' show isDarkMode;
import 'package:youpeak/features/upload/controller/upload_video_controller.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:youpeak/core/theme/app_tokens.dart';
import 'package:youpeak/core/assets/app_icons.dart';
import 'package:youpeak/core/constants/app_string.dart';
import 'package:youpeak/core/platform/local_media.dart';

class SetThumbnailPage extends GetView<UploadVideoController> {
  const SetThumbnailPage({super.key});

  @override
  Widget build(BuildContext context) {
    final dark = isDarkMode.value;
    final wide = PageWidth.of(context) >= Responsive.inlineActionFrom;
    return Scaffold(
      body: Column(
        children: [
          BasicAppBar(title: AppStrings.setThumbnail.tr),
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              child: Column(
                children: [
                  Container(
                    clipBehavior: Clip.antiAlias,
                    height: wide ? 360 : Get.height / 3.7,
                    width: AppLayout.widthOf(context),
                    decoration: BoxDecoration(
                      color: dark ? AppColor.darkElevated : AppColor.grey_100,
                      borderRadius: BorderRadius.circular(AppRadius.card),
                    ),
                    child: Obx(
                      () => controller.thumbnail.value != ""
                          ? LocalMedia.image(controller.thumbnail.value, fit: BoxFit.cover)
                          : Center(
                              child: AppIcon(
                                AppIcons.logo,
                                size: 56,
                                color: dark ? AppColor.white.withValues(alpha: 0.25) : AppColor.grey_300,
                              ),
                            ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  AppPressable(
                    onTap: () async => await controller.pickImage(),
                    pressedScale: 0.985,
                    semanticLabel: AppStrings.setNewThumbnail.tr,
                    child: Container(
                      height: 56,
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      decoration: BoxDecoration(
                        color: dark ? AppColor.secondDarkMode : AppColor.grey_100,
                        borderRadius: BorderRadius.circular(AppRadius.card),
                      ),
                      child: Row(
                        children: [
                          Container(
                            height: 38,
                            width: 38,
                            decoration: BoxDecoration(
                              color: dark ? AppColor.white.withValues(alpha: 0.08) : AppColor.secondaryMintGreen,
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Center(
                              child: AppIcon(
                                AppIcons.setThumbnail,
                                size: 22,
                                color: dark ? AppColor.white : AppColor.darkForestAccent,
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Text(
                              AppStrings.setNewThumbnail.tr,
                              style: GoogleFonts.urbanist(fontSize: 16, fontWeight: FontWeight.w700),
                            ),
                          ),
                          Icon(
                            Icons.chevron_right_rounded,
                            size: 24,
                            color: dark ? AppColor.mutedTextDark : AppColor.mutedText,
                          ),
                        ],
                      ),
                    ),
                  ),
                  // Wide pages keep Apply under the preview; phones dock it below.
                  if (wide) ...[
                    const SizedBox(height: 20),
                    ActionWidth(child: CustomFilledButton(title: AppStrings.apply.tr, callback: () => Get.back())),
                  ],
                ],
              ),
            ),
          ),
          if (!wide)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              child: CustomFilledButton(
                title: AppStrings.apply.tr,
                callback: () => Get.back(),
              ),
            ),
        ],
      ),
    );
  }
}
