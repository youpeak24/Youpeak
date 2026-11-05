import 'package:youpeak/core/platform/responsive.dart';
import 'package:youpeak/core/platform/app_layout.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/core/utils/custom_format_number.dart';
import 'package:youpeak/shared/widgets/data_not_found_ui.dart';
import 'package:youpeak/main.dart';
import 'package:youpeak/features/coins/api/fetch_buy_coin_history_api.dart';
import 'package:youpeak/features/coins/controller/buy_coin_history_controller.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:youpeak/core/assets/app_icons.dart';
import 'package:youpeak/core/constants/app_string.dart';
import 'package:shimmer/shimmer.dart';
import 'package:youpeak/core/theme/shimmer_palette.dart';

class BuyCoinHistoryView extends StatelessWidget {
  const BuyCoinHistoryView({super.key});

  @override
  Widget build(BuildContext context) {
    final controller = Get.put(BuyCoinHistoryController());
    return Scaffold(
      bottomNavigationBar: Obx(
        () => Visibility(
          visible: controller.isPaginationLoading.value,
          child: LinearProgressIndicator(color: AppColor.primaryColor, backgroundColor: AppColor.grey_300),
        ),
      ),
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
                      GetBuilder<BuyCoinHistoryController>(
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
                    FetchBuyCoinHistoryApi.startPagination = 0;
                    controller.onGetCoinHistory();
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
              child: GetBuilder<BuyCoinHistoryController>(
                id: "onGetCoinHistory",
                builder: (controller) => controller.isLoading
                    ? const HistoryShimmer()
                    : controller.coinHistory.isEmpty
                        ? DataNotFoundUi(type: EmptyStateType.history, title: AppStrings.coinHistoryNotAvailable.tr)
                        : SingleChildScrollView(
                            controller: controller.scrollController,
                            physics: const BouncingScrollPhysics(),
                            child: ListView.builder(
                              itemCount: controller.coinHistory.length,
                              padding: EdgeInsets.zero,
                              shrinkWrap: true,
                              physics: const NeverScrollableScrollPhysics(),
                              itemBuilder: (context, index) {
                                final indexData = controller.coinHistory[index];
                                return CoinHistoryItem(
                                  amount: "- ${CustomFormatNumber.convert(indexData.amount ?? 0)}${AppStrings.currencySymbol}",
                                  id: indexData.uniqueId ?? "",
                                  title: indexData.paymentGateway ?? "",
                                  coin: CustomFormatNumber.convert(indexData.coin ?? 0),
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
      ),
    );
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
  const CoinHistoryItem({super.key, required this.id, required this.title, required this.coin, required this.dateTime, required this.amount});

  final String id;
  final String title;
  final String coin;
  final String amount;
  final String dateTime;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 75,
      width: AppLayout.widthOf(context),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          SizedBox(
            width: AppLayout.widthOf(context),
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    title,
                    style: GoogleFonts.urbanist(fontSize: 16, color: AppColor.primaryColor, fontWeight: FontWeight.bold),
                  ),
                ),
                Row(
                  children: [
                    Image.asset(AppIcons.coin, width: 18),
                    const SizedBox(width: 3),
                    Text(
                      coin,
                      style: GoogleFonts.urbanist(
                        fontSize: 16,
                        color: AppColor.primaryColor,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ],
                ),
                Expanded(
                  child: Align(
                    alignment: Alignment.centerRight,
                    child: Text(
                      amount,
                      style: GoogleFonts.urbanist(
                        fontSize: 16,
                        color: Colors.red,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 3),
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
