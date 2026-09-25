import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/main.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:youpeak/core/assets/app_icons.dart';
import 'package:youpeak/core/constants/app_string.dart';
import 'package:youpeak/core/utils/utils.dart';

class SubscriptionPlanAppbar extends StatelessWidget {
  const SubscriptionPlanAppbar({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 60,
      width: Get.width,
      color: AppColor.transparent,
      margin: EdgeInsets.only(top: MediaQuery.of(context).viewPadding.top),
      padding: const EdgeInsets.symmetric(vertical: 5, horizontal: 10),
      child: Center(
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            GestureDetector(
              onTap: () => Get.back(),
              child: Container(
                height: 50,
                width: 50,
                alignment: Alignment.center,
                decoration: const BoxDecoration(
                  color: AppColor.transparent,
                  shape: BoxShape.circle,
                ),
                child: Image.asset(AppIcons.arrowBack, color: isDarkMode.value ? AppColor.white : AppColor.black, width: 22),
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
