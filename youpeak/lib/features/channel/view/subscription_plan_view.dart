import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/main.dart';
import 'package:youpeak/features/channel/controller/subscription_plan_controller.dart';
import 'package:youpeak/features/channel/widget/subscription_plan_widget.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:youpeak/core/constants/app_string.dart';

class SubscriptionPlanView extends StatelessWidget {
  const SubscriptionPlanView({super.key});

  @override
  Widget build(BuildContext context) {
    final controller = Get.put(SubscriptionPlanController());
    return Scaffold(
      body: Column(
        children: [
          const SubscriptionPlanAppbar(),
          Expanded(
              child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 15),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 10),
                Text(
                  AppStrings.subscriptionPlanCoin.tr,
                  style: GoogleFonts.urbanist(fontSize: 18, color: isDarkMode.value ? AppColor.white : AppColor.black, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 10),
                Container(
                  height: 60,
                  width: MediaQuery.of(context).size.width,
                  padding: const EdgeInsets.only(left: 20),
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: isDarkMode.value ? AppColor.secondDarkMode : AppColor.lightGreyBG,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: GetBuilder<SubscriptionPlanController>(
                          id: "onClickAll",
                          builder: (controller) => TextFormField(
                            controller: controller.subscribeController,
                            cursorColor: AppColor.grey,
                            keyboardType: TextInputType.number,
                            inputFormatters: [FilteringTextInputFormatter.digitsOnly, LengthLimitingTextInputFormatter(10)],
                            style: GoogleFonts.urbanist(fontSize: 15, fontWeight: FontWeight.w700),
                            decoration: InputDecoration(
                              hintText: AppStrings.enterWithdrawalCoin.tr,
                              hintStyle: GoogleFonts.urbanist(fontSize: 14, color: AppColor.grey, fontWeight: FontWeight.w600),
                              border: InputBorder.none,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
                Text(
                  AppStrings.unlockVideoCoin.tr,
                  style: GoogleFonts.urbanist(fontSize: 18, color: isDarkMode.value ? AppColor.white : AppColor.black, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 10),
                Container(
                  height: 60,
                  width: MediaQuery.of(context).size.width,
                  padding: const EdgeInsets.only(left: 20),
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: isDarkMode.value ? AppColor.secondDarkMode : AppColor.lightGreyBG,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: GetBuilder<SubscriptionPlanController>(
                          id: "onClickAll",
                          builder: (controller) => TextFormField(
                            controller: controller.videoController,
                            cursorColor: AppColor.grey,
                            keyboardType: TextInputType.number,
                            inputFormatters: [FilteringTextInputFormatter.digitsOnly, LengthLimitingTextInputFormatter(10)],
                            style: GoogleFonts.urbanist(fontSize: 15, fontWeight: FontWeight.w700),
                            decoration: InputDecoration(
                              hintText: AppStrings.enterWithdrawalCoin.tr,
                              hintStyle: GoogleFonts.urbanist(fontSize: 14, color: AppColor.grey, fontWeight: FontWeight.w600),
                              border: InputBorder.none,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ))
        ],
      ),
      bottomNavigationBar: GestureDetector(
        onTap: controller.onClickSubmit,
        child: Container(
          height: 55,
          width: Get.width,
          alignment: Alignment.center,
          margin: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: AppColor.primaryColor,
            borderRadius: BorderRadius.circular(30),
          ),
          child: Text(
            AppStrings.submit.tr,
            style: GoogleFonts.urbanist(fontSize: 16, fontWeight: FontWeight.w700, color: AppColor.white),
          ),
        ),
      ),
    );
  }
}
