import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/custom/custom_ui/data_not_found_ui.dart';
import 'package:youpeak/main.dart';
import 'package:youpeak/pages/profile_page/coin_history_page/coin_history_view.dart';
import 'package:youpeak/pages/profile_page/referral_history_page/referral_history_controller.dart';
import 'package:youpeak/utils/colors/app_color.dart';
import 'package:youpeak/utils/icons/app_icons.dart';
import 'package:youpeak/utils/string/app_string.dart';

class ReferralHistoryView extends StatelessWidget {
  const ReferralHistoryView({super.key});

  @override
  Widget build(BuildContext context) {
    final controller = Get.put(ReferralHistoryController());
    return Scaffold(
      appBar: PreferredSize(
        preferredSize: Size.fromHeight(MediaQuery.of(context).viewPadding.top + 60),
        child: Container(
          padding: EdgeInsets.only(top: MediaQuery.of(context).viewPadding.top, left: 15, right: 15),
          height: MediaQuery.of(context).viewPadding.top + 60,
          width: Get.width,
          color: AppColor.transparent,
          child: Row(
            children: [
              GestureDetector(
                onTap: Get.back,
                child: Container(
                  height: 40,
                  width: 40,
                  alignment: Alignment.center,
                  decoration: const BoxDecoration(color: Colors.transparent, shape: BoxShape.circle),
                  child: Obx(
                    () => Image.asset(
                      AppIcons.arrowBack,
                      color: isDarkMode.value ? AppColor.white : AppColor.black,
                      width: 23,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Obx(
                () => Text(
                  AppStrings.referralHistory.tr,
                  style: GoogleFonts.urbanist(
                    fontSize: 19,
                    color: isDarkMode.value ? AppColor.white : AppColor.black,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
      body: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 15),
        child: Column(
          children: [
            const SizedBox(height: 10),
            Row(
              children: [
                Text(
                  AppStrings.history.tr,
                  style: GoogleFonts.urbanist(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                const Spacer(),
                GestureDetector(
                  onTap: () => controller.onChangeDateRange(context),
                  child: Row(
                    children: [
                      GetBuilder<ReferralHistoryController>(
                        id: "onChangeDateRange",
                        builder: (controller) => Text(
                          controller.selectDateRange,
                          style: GoogleFonts.urbanist(fontSize: 12, color: AppColor.primaryColor, fontWeight: FontWeight.bold),
                        ),
                      ),
                      Image.asset(
                        AppIcons.downArrowBold,
                        width: 20,
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 7),
                GestureDetector(
                  onTap: () {
                    controller.startDate = "All";
                    controller.endDate = "All";
                    controller.selectDateRange = "All";
                    controller.update(["onChangeDateRange"]);
                    controller.init();
                  },
                  child: Container(
                      // decoration: BoxDecoration(
                      //   shape: BoxShape.circle,
                      //   color: AppColor.primaryColor.withValues(alpha: 0.1),
                      //   border: Border.all(color: AppColor.primaryColor),
                      // ),
                      child: Image.asset(
                    AppIcons.clear,
                    color: AppColor.primaryColor,
                    height: 18,
                  )),
                ),
                const SizedBox(width: 10),
              ],
            ),
            const SizedBox(height: 10),
            Expanded(
              child: GetBuilder<ReferralHistoryController>(
                id: "onGetReferralHistory",
                builder: (controller) => controller.isLoadingHistory
                    ? const HistoryShimmer()
                    : controller.referralHistory.isEmpty
                        ? DataNotFoundUi(type: EmptyStateType.history, title: AppStrings.coinHistoryNotAvailable.tr)
                        : SingleChildScrollView(
                            child: ListView.builder(
                              itemCount: controller.referralHistory.length,
                              padding: EdgeInsets.zero,
                              shrinkWrap: true,
                              physics: const NeverScrollableScrollPhysics(),
                              itemBuilder: (context, index) {
                                final indexData = controller.referralHistory[index];
                                return ReferralHistoryItem(
                                  subTitle: indexData.userId?.nickName ?? "",
                                  title: indexData.userId?.fullName ?? "",
                                  coin: "+ ${indexData.coin ?? 0}",
                                  dateTime: indexData.date ?? "",
                                );
                              },
                            ),
                          ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class ReferralHistoryItem extends StatelessWidget {
  const ReferralHistoryItem({super.key, required this.subTitle, required this.title, required this.coin, required this.dateTime});

  final String subTitle;
  final String title;
  final String coin;
  final String dateTime;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 75,
      width: Get.width,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Row(
            children: [
              Text(
                title,
                style: GoogleFonts.urbanist(fontSize: 16, color: AppColor.primaryColor, fontWeight: FontWeight.bold),
              ),
              const Spacer(),
              Text(
                coin,
                style: GoogleFonts.urbanist(
                  fontSize: 16,
                  color: Colors.green,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(width: 3),
              Image.asset(width: 18, AppIcons.coin),
            ],
          ),
          const SizedBox(height: 3),
          Row(
            children: [
              Text(
                subTitle,
                style: GoogleFonts.urbanist(fontSize: 12, color: AppColor.grey, fontWeight: FontWeight.w600),
              ),
              const Spacer(),
              Image.asset(
                width: 16,
                AppIcons.timeCircle,
                color: AppColor.grey,
              ),
              const SizedBox(width: 3),
              Text(
                dateTime,
                style: GoogleFonts.urbanist(fontSize: 10.3, color: AppColor.grey, fontWeight: FontWeight.w600),
              ),
            ],
          ),
          const SizedBox(height: 3),
          Divider(color: AppColor.grey_200),
        ],
      ),
    );
  }
}
