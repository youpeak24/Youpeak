import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:youpeak/shared/widgets/data_not_found_ui.dart';
import 'package:youpeak/shared/widgets/loader_ui.dart';
import 'package:youpeak/main.dart';
import 'package:youpeak/core/settings/admin_settings_api.dart';
import 'package:youpeak/features/profile/controller/profile_controller.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:youpeak/core/config/size_config.dart';
import 'package:youpeak/core/assets/app_icons.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'package:youpeak/core/constants/app_string.dart';

class PremiumPlanPurchaseHistoryView extends StatelessWidget {
  const PremiumPlanPurchaseHistoryView({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        systemOverlayStyle: const SystemUiOverlayStyle(statusBarColor: Colors.transparent, statusBarBrightness: Brightness.dark),
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: GestureDetector(
            child: Image.asset(AppIcons.arrowBack, color: isDarkMode.value ? AppColor.white : AppColor.black).paddingOnly(left: 15),
            onTap: () => Get.back()),
        leadingWidth: 33,
        centerTitle: AppSettings.isCenterTitle,
        title: Text(AppStrings.paymentsHistory.tr, style: GoogleFonts.urbanist(fontSize: 18, fontWeight: FontWeight.bold)),
      ),
      body: GetBuilder<ProfileController>(
        id: "onGetPurchaseHistory",
        builder: (controller) => controller.isLoading
            ? const LoaderUi()
            : controller.premiumPurchaseHistory.isEmpty
                ? DataNotFoundUi(type: EmptyStateType.history, title: AppStrings.paymentHistoryNotAvailable.tr)
                : ListView.builder(
                    controller: controller.scrollController,
                    padding: const EdgeInsets.symmetric(horizontal: 25, vertical: 10),
                    itemCount: controller.premiumPurchaseHistory.length + (controller.isPaginationLoading ? 1 : 0),
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemBuilder: (context, index) {
                      if (index == controller.premiumPurchaseHistory.length) {
                        return const Padding(
                          padding: EdgeInsets.all(15),
                          child: Center(
                              child: CircularProgressIndicator(
                            color: AppColor.primaryColor,
                          )),
                        );
                      }

                      return Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 15),
                        margin: const EdgeInsets.only(bottom: 20),
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(32),
                          border: Border.all(width: 1, color: AppColor.lightPink),
                        ),
                        child: Column(
                          children: [
                            Image.asset(AppIcons.adRound, width: 92),
                            const SizedBox(height: 5),
                            RichText(
                              text: TextSpan(
                                text:
                                    "${AdminSettingsApi.adminSettingsModel?.setting?.currency?.symbol ?? ""}${controller.premiumPurchaseHistory[index].amount}",
                                style: GoogleFonts.urbanist(color: AppColor.primaryColor, fontSize: 34, fontWeight: FontWeight.bold),
                                children: [
                                  TextSpan(
                                      text:
                                          " / ${controller.premiumPurchaseHistory?[index].validity} ${controller.premiumPurchaseHistory?[index].validityType}",
                                      style: GoogleFonts.urbanist(
                                        fontSize: 18,
                                        color: AppColor.lightPink,
                                      )),
                                ],
                              ),
                            ),
                            const SizedBox(height: 5),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Text(
                                  DateFormat('dd/MM/yyyy')
                                      .format(DateTime.parse(controller.premiumPurchaseHistory?[index].planStartDate ?? DateTime.now().toString())),
                                  style: GoogleFonts.urbanist(
                                    fontSize: 18,
                                  ),
                                ),
                                Text(
                                    " - ${DateFormat('dd/MM/yyyy').format(DateTime.parse(controller.premiumPurchaseHistory?[index].planEndDate ?? DateTime.now().toString()))}",
                                    style: GoogleFonts.urbanist(fontSize: 18, color: AppColor.primaryColor, fontWeight: FontWeight.bold)),
                              ],
                            ),
                            Divider(color: AppColor.grey_300, indent: 20, endIndent: 20),
                            const SizedBox(height: 5),
                            Padding(
                              padding: EdgeInsets.only(left: SizeConfig.blockSizeHorizontal * 6),
                              child: Column(
                                children: [
                                  for (int i = 0; i < int.parse((controller.premiumPurchaseHistory?[index].planBenefit!.length ?? 0).toString()); i++)
                                    Row(
                                      children: [
                                        const ImageIcon(AssetImage(AppIcons.done), color: AppColor.lightPink, size: 20),
                                        const SizedBox(width: 20),
                                        Text(
                                          controller.premiumPurchaseHistory[index].planBenefit![i].toString(),
                                          style: GoogleFonts.urbanist(
                                            fontSize: 15,
                                            fontWeight: FontWeight.w500,
                                            color: isDarkMode.value ? AppColor.white : AppColor.black,
                                          ),
                                        ),
                                      ],
                                    ).paddingOnly(bottom: 3),
                                ],
                              ),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
      ),
    );
  }
}
