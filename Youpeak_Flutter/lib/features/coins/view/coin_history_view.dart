import 'package:youpeak/core/platform/responsive.dart';
import 'package:youpeak/core/platform/app_layout.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/shared/widgets/data_not_found_ui.dart';
import 'package:youpeak/main.dart';
import 'package:youpeak/features/coins/controller/coin_history_controller.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:youpeak/core/assets/app_icons.dart';
import 'package:youpeak/core/constants/app_string.dart';
import 'package:shimmer/shimmer.dart';
import 'package:youpeak/core/theme/shimmer_palette.dart';

class CoinHistoryView extends StatelessWidget {
  const CoinHistoryView({super.key});

  @override
  Widget build(BuildContext context) {
    final controller = Get.put(CoinHistoryController());
    return Scaffold(
      appBar: PreferredSize(
        preferredSize: Size.fromHeight(MediaQuery.of(context).viewPadding.top + 60),
        child: Container(
          padding: EdgeInsets.only(top: MediaQuery.of(context).viewPadding.top, left: 15, right: 15),
          height: MediaQuery.of(context).viewPadding.top + 60,
          width: AppLayout.widthOf(context),
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
                  AppStrings.coinHistory.tr,
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
      body: CardOnWide(
        child: Padding(
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
                      GetBuilder<CoinHistoryController>(
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
              child: GetBuilder<CoinHistoryController>(
                id: "onGetConvertedCoinHistory",
                builder: (controller) => controller.isLoadingHistory
                    ? const HistoryShimmer()
                    : controller.convertedCoinHistory.isEmpty
                        ? DataNotFoundUi(type: EmptyStateType.history, title: AppStrings.coinHistoryNotAvailable.tr)
                        : SingleChildScrollView(
                            child: ListView.builder(
                              itemCount: controller.convertedCoinHistory.length,
                              padding: EdgeInsets.zero,
                              shrinkWrap: true,
                              physics: const NeverScrollableScrollPhysics(),
                              itemBuilder: (context, index) {
                                final indexData = controller.convertedCoinHistory[index];
                                return CoinHistoryItem(
                                  type: indexData.type ?? 0,
                                  channelName: indexData.channelName ?? "",
                                  videoName: indexData.videoName ?? "",
                                  id: indexData.uniqueId ?? "",
                                  title: historyType(indexData.type ?? 0),
                                  coin: "${indexData.coin ?? 0}",
                                  dateTime: indexData.date ?? "",
                                  isIncome: indexData.isIncome ?? false,
                                );
                              },
                            ),
                          ),
              ),
            ),
          ],
        ),
      ),
      ),
    );
  }
}

String historyType(num type) {
  switch (type) {
    case 1:
      {
        return AppStrings.dailyCheckIn.tr;
      }
    case 2:
      {
        return AppStrings.dailyTask.tr;
      }
    case 3:
      {
        return AppStrings.loginBonus.tr;
      }
    case 4:
      {
        return AppStrings.referralBonus.tr;
      }
    case 5:
      {
        return AppStrings.engWatchVideoBonus.tr;
      }
    case 6:
      {
        return AppStrings.engCommentVideoBonus.tr;
      }
    case 7:
      {
        return AppStrings.engLikeVideoBonus.tr;
      }
    case 8:
      {
        return AppStrings.purchaseCoinPlan.tr;
      }
    case 9:
      {
        return AppStrings.unlockPrivateVideo.tr;
      }
    case 10:
      {
        return AppStrings.subscribePrivateChannel.tr;
      }
    case 21: // Peak Boost sent (backend peakBoost.controller.js)
      {
        return "Peak Boost";
      }
    default:
      {
        return "";
      }
  }
}

class HistoryShimmer extends StatelessWidget {
  const HistoryShimmer({super.key});

  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: ShimmerPalette.base,
      highlightColor: ShimmerPalette.highlight,
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            for (int i = 0; i < 15; i++)
              Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: Column(
                  children: [
                    SizedBox(
                      width: AppLayout.widthOf(context),
                      child: Row(
                        children: [
                          Container(
                            height: 25,
                            width: 200,
                            margin: const EdgeInsets.all(2),
                            decoration: BoxDecoration(color: AppColor.black, borderRadius: BorderRadius.circular(5)),
                          ),
                          const Spacer(),
                          Container(
                            height: 25,
                            width: 100,
                            margin: const EdgeInsets.all(2),
                            decoration: BoxDecoration(color: AppColor.black, borderRadius: BorderRadius.circular(5)),
                          ),
                        ],
                      ),
                    ),
                    SizedBox(
                      width: AppLayout.widthOf(context),
                      child: Row(
                        children: [
                          Container(
                            height: 25,
                            width: 100,
                            margin: const EdgeInsets.all(2),
                            decoration: BoxDecoration(color: AppColor.black, borderRadius: BorderRadius.circular(5)),
                          ),
                          const Spacer(),
                          Container(
                            height: 25,
                            width: 150,
                            margin: const EdgeInsets.all(2),
                            decoration: BoxDecoration(color: AppColor.black, borderRadius: BorderRadius.circular(5)),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class CoinHistoryItem extends StatelessWidget {
  const CoinHistoryItem(
      {super.key,
      required this.id,
      required this.title,
      required this.coin,
      required this.dateTime,
      required this.isIncome,
      required this.channelName,
      required this.videoName,
      required this.type});

  final String id;
  final String title;
  final String channelName;
  final String videoName;
  final String coin;
  final String dateTime;
  final bool isIncome;
  final num type;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      // height: 80,
      width: AppLayout.widthOf(context),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
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
                isIncome ? "+ $coin" : "- $coin",
                style: GoogleFonts.urbanist(
                  fontSize: 16,
                  color: isIncome ? Colors.green : Colors.red,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ],
          ),
          const SizedBox(height: 2),
          type == 10
              ? Text(
                  channelName,
                  style: GoogleFonts.urbanist(
                    fontSize: 13,
                    color: AppColor.grey,
                    fontWeight: FontWeight.w600,
                  ),
                )
              : type == 9
                  ? Text(
                      videoName,
                      style: GoogleFonts.urbanist(
                        fontSize: 13,
                        color: AppColor.grey,
                        fontWeight: FontWeight.w600,
                      ),
                    )
                  : const SizedBox(),
          const SizedBox(height: 2),
          Row(
            children: [
              Text(
                "ID : $id",
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
