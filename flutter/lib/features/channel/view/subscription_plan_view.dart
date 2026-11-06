import 'package:youpeak/core/platform/responsive.dart';
import 'package:youpeak/core/platform/app_layout.dart';
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
    final wide = PageWidth.of(context) >= Responsive.inlineActionFrom;

    Widget label(String text) => Text(
          text,
          style: GoogleFonts.urbanist(fontSize: 18, color: isDarkMode.value ? AppColor.white : AppColor.black, fontWeight: FontWeight.bold),
        );

    Widget field(TextEditingController Function(SubscriptionPlanController) pick) => Container(
          height: 60,
          padding: const EdgeInsets.only(left: 20),
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: isDarkMode.value ? AppColor.secondDarkMode : AppColor.lightGreyBG,
            borderRadius: BorderRadius.circular(12),
          ),
          child: GetBuilder<SubscriptionPlanController>(
            id: "onClickAll",
            builder: (controller) => TextFormField(
              controller: pick(controller),
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
        );

    final subscribePrice = Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [label(AppStrings.subscriptionPlanCoin.tr), const SizedBox(height: 10), field((c) => c.subscribeController)],
    );
    final unlockPrice = Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [label(AppStrings.unlockVideoCoin.tr), const SizedBox(height: 10), field((c) => c.videoController)],
    );

    final submit = GestureDetector(
      onTap: controller.onClickSubmit,
      child: Container(
        height: 55,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: AppColor.primaryColor,
          borderRadius: BorderRadius.circular(30),
        ),
        child: Text(
          AppStrings.submit.tr,
          style: GoogleFonts.urbanist(fontSize: 16, fontWeight: FontWeight.w700, color: AppColor.white),
        ),
      ),
    );

    return Scaffold(
      body: Column(
        children: [
          const SubscriptionPlanAppbar(),
          Expanded(
            // Wide: the two prices side by side with Submit right under them.
            // Phones: stacked, Submit docked to the bottom.
            child: wide
                ? AdaptiveScroll(
                    maxWidth: 860,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Expanded(child: subscribePrice),
                            const SizedBox(width: 24),
                            Expanded(child: unlockPrice),
                          ],
                        ),
                        const SizedBox(height: 28),
                        Align(alignment: Alignment.centerLeft, child: SizedBox(width: 360, child: submit)),
                      ],
                    ),
                  )
                : Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 15),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        const SizedBox(height: 10),
                        subscribePrice,
                        const SizedBox(height: 20),
                        unlockPrice,
                      ],
                    ),
                  ),
          ),
        ],
      ),
      bottomNavigationBar: wide ? null : Padding(padding: const EdgeInsets.all(10), child: submit),
    );
  }
}
