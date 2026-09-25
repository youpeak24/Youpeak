import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:get/get_rx/src/rx_typedefs/rx_typedefs.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/main.dart';
import 'package:youpeak/features/coins/view/buy_coin_view.dart';
import 'package:youpeak/features/coins/api/get_my_coin_api.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:youpeak/core/utils/utils.dart';
import 'package:youpeak/core/platform/platform_info.dart';

class UnlockPremiumVideoBottomSheet {
  static void onShow({required String coin, required Callback callback}) {
    Get.bottomSheet(
      elevation: 0,
      backgroundColor: isDarkMode.value ? AppColor.secondDarkMode : AppColor.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.only(
          topRight: Radius.circular(40),
          topLeft: Radius.circular(40),
        ),
      ),
      SizedBox(
        height: PlatformInfo.isAndroidOrWeb ? 225 : 310,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.start,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            10.height,
            Container(
              width: 40,
              height: 3,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(60),
                color: AppColor.grey_300,
              ),
            ),
            15.height,
            Text(
              "Unlock",
              style: GoogleFonts.urbanist(
                fontSize: 20,
                fontWeight: FontWeight.w700,
                color: AppColor.primaryColor,
              ),
            ),
            8.height,
            Divider(indent: 25, endIndent: 25, color: AppColor.grey_200),
            Expanded(
              child: SingleChildScrollView(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 15),
                  child: Column(
                    children: [
                      const SizedBox(height: 8),
                      Text(
                        "Confirm you want to unlock this post using $coin/Coins",
                        style: GoogleFonts.urbanist(
                          fontSize: 18,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      14.height,
                      Row(
                        children: [
                          Expanded(
                            child: GestureDetector(
                              onTap: Get.back,
                              child: Container(
                                height: 55,
                                alignment: Alignment.center,
                                decoration: BoxDecoration(
                                  color: AppColor.lightPinkBG,
                                  borderRadius: BorderRadius.circular(100),
                                ),
                                child: Text(
                                  "Cancel",
                                  textAlign: TextAlign.center,
                                  style: GoogleFonts.urbanist(
                                    fontWeight: FontWeight.w700,
                                    fontSize: 16,
                                    color: AppColor.primaryColor,
                                  ),
                                ),
                              ),
                            ),
                          ),
                          15.width,
                          Expanded(
                            child: GestureDetector(
                              onTap: () {
                                if ((GetMyCoinApi.getMyCoinModel?.data?.coin ?? 0) >= (int.parse(coin))) {
                                  callback();
                                } else {
                                  Get.back();
                                  Get.to(const BuyCoinView());
                                }
                              },
                              child: Container(
                                height: 55,
                                alignment: Alignment.center,
                                decoration: BoxDecoration(
                                  color: AppColor.primaryColor,
                                  borderRadius: BorderRadius.circular(100),
                                ),
                                child: Text(
                                  "Confirm",
                                  textAlign: TextAlign.center,
                                  style: GoogleFonts.urbanist(
                                    fontWeight: FontWeight.w700,
                                    fontSize: 16,
                                    color: AppColor.white,
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),
                    ],
                  ),
                ),
              ),
            ),
            PlatformInfo.isAndroidOrWeb ? const Offstage() : const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }
}
