import 'package:youpeak/core/platform/app_layout.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/main.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:youpeak/core/assets/app_icons.dart';
import 'package:youpeak/shared/widgets/app_icon.dart';
import 'package:youpeak/shared/widgets/app_pressable.dart';
import 'package:youpeak/core/constants/app_string.dart';
import 'package:youpeak/core/utils/utils.dart';

class SubscriptionPlanAppbar extends StatelessWidget {
  const SubscriptionPlanAppbar({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 60,
      width: AppLayout.widthOf(context),
      color: AppColor.transparent,
      margin: EdgeInsets.only(top: MediaQuery.of(context).viewPadding.top),
      padding: const EdgeInsets.symmetric(vertical: 5, horizontal: 10),
      child: Center(
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            AppPressable(
              onTap: () => Get.back(),
              semanticLabel: "Back",
              child: SizedBox(
                height: 48,
                width: 48,
                child: Center(
                  child: Obx(
                    () => AppIcon(
                      AppIcons.arrowBack,
                      size: 22,
                      color: isDarkMode.value ? AppColor.white : AppColor.black,
                    ),
                  ),
                ),
              ),
            ),
            5.width,
            Text(
              AppStrings.manageSubscription.tr,
              style: GoogleFonts.urbanist(fontSize: 20, fontWeight: FontWeight.bold),
            ),
          ],
        ),
      ),
    );
  }
}
