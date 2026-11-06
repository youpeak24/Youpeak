import 'package:youpeak/core/platform/app_layout.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/main.dart';
import 'package:youpeak/features/coins/view/buy_coin_history_view.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:youpeak/core/assets/app_icons.dart';
import 'package:youpeak/core/constants/app_string.dart';
import 'package:youpeak/core/utils/utils.dart';

class BuyCoinAppbarWidget extends StatelessWidget {
  const BuyCoinAppbarWidget({super.key});

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
                child: Obx(() => Image.asset(AppIcons.arrowBack, color: isDarkMode.value ? AppColor.white : AppColor.black, width: 22)),
              ),
            ),
            5.width,
            Obx(
              () => Text(
                AppStrings.buyCoins.tr,
                style: GoogleFonts.urbanist(fontSize: 20, color: isDarkMode.value ? AppColor.white : AppColor.black, fontWeight: FontWeight.bold),
              ),
            ),
            Spacer(),
            GestureDetector(
              onTap: () => Get.to(BuyCoinHistoryView()),
              child: Container(
                height: 50,
                width: 50,
                alignment: Alignment.center,
                decoration: const BoxDecoration(
                  color: AppColor.transparent,
                  shape: BoxShape.circle,
                ),
                child: Obx(() => Image.asset(AppIcons.historyIcon, color: isDarkMode.value ? AppColor.white : AppColor.black, width: 23)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
