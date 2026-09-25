import 'package:flutter/material.dart';
import 'package:youpeak/shared/widgets/app_artwork.dart';
import 'package:youpeak/core/assets/app_visuals.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/shared/widgets/custom_filled_button.dart';
import 'package:youpeak/shared/widgets/data_not_found_ui.dart';
import 'package:youpeak/shared/shimmer/container_shimmer_ui.dart';
import 'package:youpeak/main.dart';
import 'package:youpeak/features/premium/view/payments_view.dart';
import 'package:youpeak/features/premium/controller/premium_plan_controller.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:youpeak/core/config/size_config.dart';
import 'package:youpeak/core/assets/app_icons.dart';
import 'package:youpeak/core/constants/app_string.dart';

class PremiumPlanView extends StatelessWidget {
  PremiumPlanView({super.key});

  final controller = Get.put(PremiumPlanController());

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        elevation: 0,
        backgroundColor: Colors.transparent,
        leadingWidth: 38,
        leading: GestureDetector(
          onTap: () => Get.back(),
          child: Padding(
            padding: const EdgeInsets.only(left: 20),
            child: Image.asset(AppIcons.arrowBack, color: isDarkMode.value ? AppColor.white : AppColor.black),
          ),
        ),
        // centerTitle: AppSettings.isCenterTitle,
        // title: Text(AppStrings.premiumPlan.tr, style: profileTitleStyle),
      ),
      body: SingleChildScrollView(
        physics: const BouncingScrollPhysics(),
        child: GetBuilder<PremiumPlanController>(
          id: "onGetPremiumPlan",
          builder: (controller) => controller.mainPremiumPlans == null
              ? Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: Column(
                    children: [
                      for (int i = 0; i < 10; i++) const ContainerShimmerUi(height: 225, radius: 30).paddingOnly(bottom: 10),
                    ],
                  ),
                )
              : (controller.mainPremiumPlans!.isEmpty)
                  ? DataNotFoundUi(title: AppStrings.premiumPlanNotAvailable.tr)
                  : Column(
                      children: [
                        const SuccessArtwork(asset: AppVisuals.premiumHero, size: 150, burst: AppVisuals.sparkles),
                        SizedBox(
                          width: Get.width / 1.1,
                          child: Text(
                            // AppStrings.subscribeToPremium.tr,
                            AppStrings.getPremiumPlanText.tr.replaceAll('\\n', '\n'),
                            textAlign: TextAlign.center,
                            style: GoogleFonts.urbanist(
                              color: isDarkMode.value ? Colors.white : AppColor.primaryColor,
                              fontSize: 26,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ),
                        const SizedBox(height: 5),
                        SizedBox(
                          width: SizeConfig.screenWidth / 1.5,
                          child: Text(
                            textAlign: TextAlign.center,
                            AppStrings.subscribeNote.tr,
                            style: GoogleFonts.urbanist(fontSize: 15, fontWeight: FontWeight.w500),
                          ),
                        ),
                        const SizedBox(height: 15),
                        ListView.builder(
                          padding: const EdgeInsets.symmetric(horizontal: 20),
                          itemCount: controller.mainPremiumPlans?.length,
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          itemBuilder: (context, index) {
                            return GestureDetector(
                              onTap: () => Get.to(
                                PaymentView(
                                  amount: controller.mainPremiumPlans![index].amount!.toDouble(),
                                  premiumPlanId: controller.mainPremiumPlans![index].id!,
                                  productKey: controller.mainPremiumPlans![index].productKey!,
                                ),
                              ),
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
                                margin: const EdgeInsets.only(bottom: 18),
                                decoration: BoxDecoration(
                                  borderRadius: BorderRadius.circular(32),
                                  border: Border.all(width: 1, color: AppColor.lightPink),
                                ),
                                child: Column(
                                  children: [
                                    Image.asset(AppIcons.adRound, width: 90),
                                    const SizedBox(height: 6),
                                    RichText(
                                      text: TextSpan(
                                        text: "\$${controller.mainPremiumPlans![index].amount}",
                                        style: GoogleFonts.urbanist(color: isDarkMode.value ? AppColor.white : AppColor.primaryColor, fontSize: 34, fontWeight: FontWeight.w800),
                                        children: [
                                          TextSpan(
                                              text: " / ${controller.mainPremiumPlans?[index].validity} ${controller.mainPremiumPlans?[index].validityType}",
                                              style: GoogleFonts.urbanist(
                                                fontWeight: FontWeight.w600,
                                                fontSize: 18,
                                                color: isDarkMode.value ? AppColor.grey : AppColor.lightPink,
                                              )),
                                        ],
                                      ),
                                    ),
                                    const SizedBox(height: 6),
                                    Padding(
                                      padding: const EdgeInsets.symmetric(horizontal: 15),
                                      child: Column(
                                        children: [
                                          for (int i = 0; i < int.parse((controller.mainPremiumPlans?[index].planBenefit!.length ?? 0).toString()); i++)
                                            Row(
                                              children: [
                                                const ImageIcon(AssetImage(AppIcons.done), color: AppColor.lightPink, size: 20),
                                                const SizedBox(width: 20),
                                                Expanded(
                                                  child: Text(
                                                    // "Watch all you want. Ad-free.",
                                                    controller.mainPremiumPlans![index].planBenefit![i].toString(),
                                                    overflow: TextOverflow.fade,
                                                    maxLines: 1,
                                                    style: GoogleFonts.urbanist(fontSize: 15, fontWeight: FontWeight.w500, color: isDarkMode.value ? AppColor.white : AppColor.black),
                                                  ),
                                                ),
                                              ],
                                            ),
                                          // const SizedBox(height: 6),
                                          // Row(
                                          //   children: [
                                          //     const ImageIcon(AssetImage(AppIcons.done), color: AppColors.lightPink, size: 20),
                                          //     const SizedBox(width: 20),
                                          //     Expanded(
                                          //       child: Text(
                                          //         "Download Unlimited Video In Full HD.",
                                          //         maxLines: 1,
                                          //         overflow: TextOverflow.fade,
                                          //         // controller.mainPremiumPlans![index].planBenefit![i].toString(),
                                          //         style: GoogleFonts.urbanist(fontSize: 15, fontWeight: FontWeight.w500, color: isDarkMode.value ? AppColors.white : AppColors.black),
                                          //       ),
                                          //     ),
                                          //   ],
                                          // ),
                                        ],
                                      ),
                                    ),
                                    const SizedBox(height: 3),
                                    Divider(color: AppColor.grey_200, indent: 10, endIndent: 10),
                                    const SizedBox(height: 6),
                                    CustomFilledButton(
                                      callback: () => Get.to(
                                        PaymentView(
                                          amount: controller.mainPremiumPlans![index].amount!.toDouble(),
                                          premiumPlanId: controller.mainPremiumPlans![index].id!,
                                          productKey: controller.mainPremiumPlans![index].productKey!,
                                        ),
                                      ),
                                      title: 'Buy Now',
                                    ),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
                      ],
                    ),
        ),
      ),
    );
  }
}

// Text(
//   "BLOCK THESE ADS",
//   style: GoogleFonts.urbanist(fontWeight: FontWeight.w900, fontSize: 18, color: AppColors.primaryColor),
// ),
// const SizedBox(height: 2),

// Padding(
//   padding: EdgeInsets.only(left: SizeConfig.blockSizeHorizontal * 6),
//   child: Column(
//     children: [
//       for (int i = 0; i < int.parse((controller.mainPremiumPlans?[index].planBenefit!.length ?? 0).toString()); i++)
//         Row(
//           children: [
//             const ImageIcon(AssetImage(AppIcons.done), color: AppColors.lightPink, size: 20),
//             const SizedBox(width: 20),
//             Text(
//               controller.mainPremiumPlans![index].planBenefit![i].toString(),
//               style: GoogleFonts.urbanist(fontSize: 14, color: isDarkMode.value ? AppColors.white : AppColors.black),
//             ),
//           ],
//         ).paddingOnly(bottom: 3),
//     ],
//   ),
// ),

// Text("Watch all you want. Ad-free.",
//     style: GoogleFonts.urbanist(
//       fontSize: 16,
//       color: isDarkMode.value ? AppColors.white : AppColors.black,
//     )),
