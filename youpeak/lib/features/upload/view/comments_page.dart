import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/shared/widgets/basic_button.dart';
import 'package:youpeak/shared/widgets/custom_filled_button.dart';
import 'package:youpeak/features/upload/controller/upload_video_controller.dart';
import 'package:youpeak/core/theme/app_color.dart';
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
          const SizedBox(height: 20),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 10),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(AppStrings.commentText.tr, style: GoogleFonts.urbanist(fontWeight: FontWeight.bold, fontSize: 16)),
                const SizedBox(height: 10),
                for (int i = 0; i < 4; i++)
                  Row(
                    children: [
                      Obx(() => Radio(fillColor: const WidgetStatePropertyAll(AppColor.primaryColor), value: i, groupValue: controller.selectComments.value, onChanged: (value) => controller.selectComments.value = value!)),
                      Expanded(child: Text(commentCollection[i], overflow: TextOverflow.ellipsis, maxLines: 1, style: GoogleFonts.urbanist(fontWeight: FontWeight.bold, fontSize: 14))),
                    ],
                  ),
              ],
            ),
          ),
          const Expanded(child: Offstage()),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 10),
            child: CustomFilledButton(title: AppStrings.apply.tr, callback: () => Get.back()),
          ),
          const SizedBox(height: 10),
        ],
      ),
    );
  }
}
