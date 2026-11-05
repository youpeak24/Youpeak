import 'package:youpeak/core/platform/responsive.dart';
import 'dart:async';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:get/get_rx/src/rx_typedefs/rx_typedefs.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/core/utils/custom_format_number.dart';
import 'package:youpeak/shared/widgets/data_not_found_ui.dart';
import 'package:youpeak/main.dart';
import 'package:youpeak/features/coins/controller/buy_coin_controller.dart';
import 'package:youpeak/features/coins/widget/buy_coin_plan_shimmer.dart';
import 'package:youpeak/features/coins/widget/buy_coin_widget.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:youpeak/core/assets/app_visuals.dart';
import 'package:youpeak/core/constants/app_string.dart';
import 'package:youpeak/core/utils/utils.dart';

class BuyCoinView extends StatelessWidget {
  const BuyCoinView({super.key});

  @override
  Widget build(BuildContext context) {
    final controller = Get.put(BuyCoinController());
    Timer(
      const Duration(milliseconds: 200),
      () {
        SystemChrome.setSystemUIOverlayStyle(
          SystemUiOverlayStyle(
            statusBarBrightness: isDarkMode.value ? Brightness.light : Brightness.dark,
            statusBarColor: AppColor.transparent,
          ),
        );
      },
    );

    final wide = PageWidth.of(context) >= Responsive.inlineActionFrom;
    final payButton = GestureDetector(
      onTap: controller.onClickPayment,
      child: Container(
        height: 55,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: AppColor.primaryColor,
          borderRadius: BorderRadius.circular(30),
        ),
        child: Text(
          AppStrings.payments.tr,
          style: GoogleFonts.urbanist(fontSize: 16, fontWeight: FontWeight.w700, color: AppColor.white),
        ),
      ),
    );

    return Scaffold(
      // The green backdrop is the phone look; beside the sidebar the page
      // sits on the normal page background so it isn't a coloured strip.
      backgroundColor: wide ? null : (isDarkMode.value ? AppColor.mainDark : AppColor.lightPinkBG),
      body: Column(
        children: [
          const BuyCoinAppbarWidget(),
          Expanded(
            child: GetBuilder<BuyCoinController>(
              id: "onGetCoinPlan",
              builder: (controller) => controller.isLoading
                  ? const BuyCoinPlanShimmer()
                  : controller.coinPlans.isEmpty
                      ? DataNotFoundUi(title: AppStrings.coinPlanNotAvailable.tr)
                      : _planScroll(
                          wide: wide,
                          action: payButton,
                          grid: LayoutBuilder(
                            builder: (context, box) => GridView.builder(
                            itemCount: controller.coinPlans.length,
                            padding: wide ? EdgeInsets.zero : const EdgeInsets.all(12),
                            physics: const NeverScrollableScrollPhysics(),
                            shrinkWrap: true,
                            gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                              // 2 on a phone; more as the page widens.
                              crossAxisCount: (box.maxWidth / 230).floor().clamp(2, 4),
                              crossAxisSpacing: 12,
                              mainAxisSpacing: 12,
                              mainAxisExtent: 220,
                            ),
                            itemBuilder: (context, index) {
                              final indexData = controller.coinPlans[index];
                              return GetBuilder<BuyCoinController>(
                                id: "onChangePlan",
                                builder: (controller) => GestureDetector(
                                  onTap: () => controller.onChangePlan(index),
                                  child: Container(
                                    decoration: BoxDecoration(
                                      color: isDarkMode.value ? AppColor.mainDark : AppColor.white,
                                      borderRadius: BorderRadius.circular(20),
                                      border: Border.all(
                                        color: AppColor.lightPink,
                                        width: 1.5,
                                      ),
                                    ),
                                    child: Stack(
                                      clipBehavior: Clip.antiAlias,
                                      alignment: Alignment.center,
                                      children: [
                                        Positioned(
                                          top: -3,
                                          right: -3,
                                          child: Transform.scale(
                                            scale: 1.2,
                                            child: Radio(
                                              fillColor: const WidgetStatePropertyAll(AppColor.primaryColor),
                                              value: index,
                                              groupValue: controller.selectedPlanIndex,
                                              onChanged: (value) => controller.onChangePlan(value ?? 0),
                                            ),
                                          ),
                                        ),
                                        Visibility(
                                          visible: indexData.isPopular ?? false,
                                          child: Positioned(
                                            top: 18,
                                            left: -24,
                                            child: RotationTransition(
                                              turns: const AlwaysStoppedAnimation(-45 / 360),
                                              child: Container(
                                                height: 22,
                                                width: 110,
                                                decoration: const BoxDecoration(color: AppColor.primaryColor),
                                                child: Center(
                                                  child: Text(
                                                    AppStrings.popularPlan.tr,
                                                    style: GoogleFonts.urbanist(fontSize: 11, fontWeight: FontWeight.w700, color: AppColor.white),
                                                  ),
                                                ),
                                              ),
                                            ),
                                          ),
                                        ),
                                        Positioned(
                                          top: 15,
                                          child: Column(
                                            children: [
                                              Image.asset(
                                                AppVisuals.coinPack(
                                                  controller.coinPlans.where((plan) => (plan.coin ?? 0) < (indexData.coin ?? 0)).length,
                                                  controller.coinPlans.length,
                                                ),
                                                width: 70,
                                                height: 70,
                                              ),
                                              8.height,
                                              RichText(
                                                text: TextSpan(
                                                  text: CustomFormatNumber.convert(indexData.coin ?? 0),
                                                  style: GoogleFonts.urbanist(fontSize: 24, fontWeight: FontWeight.w800, color: AppColor.orangeTextColor),
                                                  children: [
                                                    TextSpan(
                                                      text: "/Coins",
                                                      style: GoogleFonts.urbanist(fontSize: 16, fontWeight: FontWeight.w800, color: AppColor.orangeTextColor),
                                                    )
                                                  ],
                                                ),
                                              ),
                                              8.height,
                                              Container(
                                                padding: const EdgeInsets.symmetric(horizontal: 15, vertical: 6),
                                                decoration: BoxDecoration(
                                                  color: isDarkMode.value ? AppColor.lightOrangeBG.withOpacity(0.1) : AppColor.lightOrangeBG,
                                                  borderRadius: BorderRadius.circular(8),
                                                ),
                                                child: Text(
                                                  "+ ${indexData.extraCoin ?? 0} Coin Extra",
                                                  style: GoogleFonts.urbanist(fontSize: 11, fontWeight: FontWeight.w700, color: AppColor.orangeTextColor),
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                        Positioned(
                                          bottom: -1,
                                          left: 0,
                                          right: 0,
                                          child: Container(
                                            height: 50,
                                            alignment: Alignment.center,
                                            decoration: const BoxDecoration(
                                              color: AppColor.primaryColor,
                                              borderRadius: BorderRadius.only(
                                                bottomRight: Radius.circular(18.5),
                                                bottomLeft: Radius.circular(18.5),
                                              ),
                                            ),
                                            child: Text(
                                              "${AppStrings.currencySymbol} ${indexData.amount ?? 0}",
                                              style: GoogleFonts.urbanist(fontSize: 22, fontWeight: FontWeight.w800, color: AppColor.white),
                                            ),
                                          ),
                                        )
                                      ],
                                    ),
                                  ),
                                ),
                              );
                            },
                          )),
                        ),
            ),
          ),
        ],
      ),
      bottomNavigationBar: wide ? null : Padding(padding: const EdgeInsets.all(10), child: payButton),
    );
  }
}

/// Phones: the plans scroll and the Pay button is docked below. Wide pages:
/// the plans sit in a centred column with the Pay button right under them.
Widget _planScroll({required bool wide, required Widget grid, required Widget action}) {
  if (!wide) return SingleChildScrollView(child: grid);
  return AdaptiveScroll(
    maxWidth: 1000,
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        grid,
        const SizedBox(height: 24),
        Center(child: SizedBox(width: 360, child: action)),
      ],
    ),
  );
}
