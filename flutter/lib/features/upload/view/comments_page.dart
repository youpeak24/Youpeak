import 'package:youpeak/core/platform/responsive.dart';
import 'package:youpeak/shared/widgets/option_tile.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/shared/widgets/basic_button.dart';
import 'package:youpeak/shared/widgets/custom_filled_button.dart';
import 'package:youpeak/features/upload/controller/upload_video_controller.dart';
import 'package:youpeak/core/constants/app_string.dart';

class CommentsPageView extends GetView<UploadVideoController> {
  const CommentsPageView({super.key});

  @override
  Widget build(BuildContext context) {
    final List commentCollection = [
      AppStrings.allowAllComments.tr,
      AppStrings.disableComments.tr,
      AppStrings.holdPotentiallyInappropriateCommentsForReview.tr.replaceAll('\\n', '\n'),
      AppStrings.holdAllCommentsForReview.tr,
    ];

    return Scaffold(
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          BasicAppBar(title: AppStrings.comments.tr),
          const SizedBox(height: 12),
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 8),
            child: Text(AppStrings.commentText.tr, style: GoogleFonts.urbanist(fontWeight: FontWeight.w800, fontSize: 16)),
          ),
          Obx(
            () => Column(
              children: [
                for (int i = 0; i < 4; i++)
                  OptionTile(
                    title: commentCollection[i],
                    selected: controller.selectComments.value == i,
                    onTap: () => controller.selectComments.value = i,
                  ),
              ],
            ),
          ),
          // Phones pin Apply to the bottom; on a wide page it sits under the options.
          if (PageWidth.of(context) < Responsive.inlineActionFrom) const Expanded(child: Offstage()) else const SizedBox(height: 24),
          ActionWidth(
            child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 10),
            child: CustomFilledButton(title: AppStrings.apply.tr, callback: () => Get.back()),
          )),
          const SizedBox(height: 10),
        ],
      ),
    );
  }
}
