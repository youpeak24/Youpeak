import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/shared/widgets/data_not_found_ui.dart';
import 'package:youpeak/main.dart';
import 'package:youpeak/features/coins/view/coin_history_view.dart';
import 'package:youpeak/features/wallet/controller/withdraw_history_controller.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:youpeak/core/assets/app_icons.dart';
import 'package:youpeak/core/constants/app_string.dart';

class WithdrawHistoryView extends StatelessWidget {
  const WithdrawHistoryView({super.key});

  @override
  Widget build(BuildContext context) {
    // Always force-reinit so fresh data is shown when the page opens
    Get.delete<WithdrawHistoryController>(force: true);
    final controller = Get.put(WithdrawHistoryController());
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
                  AppStrings.withdrawHistory.tr,
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
                      GetBuilder<WithdrawHistoryController>(
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
              child: GetBuilder<WithdrawHistoryController>(
                id: "onGetWithdrawHistory",
                builder: (controller) => controller.isLoadingHistory
                    ? const HistoryShimmer()
                    : RefreshIndicator(
                        color: AppColor.primaryColor,
                        onRefresh: () async => controller.init(),
                        child: controller.withdrawHistory.isEmpty
                            ? SingleChildScrollView(
                                physics: const AlwaysScrollableScrollPhysics(),
                                child: SizedBox(
                                  height: Get.height * 0.7,
                                  child: Center(
                                    child: DataNotFoundUi(type: EmptyStateType.history, title: AppStrings.withdrawHistoryNotAvailable.tr),
                                  ),
                                ),
                              )
                            : SingleChildScrollView(
                                controller: controller.scrollController,
                                physics: const AlwaysScrollableScrollPhysics(),
                                child: ListView.builder(
                                  itemCount: controller.withdrawHistory.length,
                                  padding: EdgeInsets.zero,
                                  shrinkWrap: true,
                                  physics: const NeverScrollableScrollPhysics(),
                                  itemBuilder: (context, index) {
                                    final indexData = controller.withdrawHistory[index];
                                    return WithdrawItem(
                                      id: indexData.uniqueId ?? "",
                                      title: historyType(indexData.status ?? 0),
                                      amount: "${indexData.requestAmount ?? 0}",
                                      dateTime: indexData.requestDate ?? "",
                                      type: indexData.status ?? 0,
                                    );
                                  },
                                ),
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

String historyType(int type) {
  switch (type) {
    case 1:
      {
        return AppStrings.pending.tr;
      }
    case 2:
      {
        return AppStrings.approved.tr;
      }
    case 3:
      {
        return AppStrings.decline.tr;
      }

    default:
      {
        return "";
      }
  }
}

class WithdrawItem extends StatelessWidget {
  const WithdrawItem({super.key, required this.id, required this.title, required this.amount, required this.dateTime, required this.type});

  final String id;
  final String title;
  final String amount;
  final String dateTime;
  final int type;

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
                amount,
                style: GoogleFonts.urbanist(fontSize: 16, color: AppColor.primaryColor, fontWeight: FontWeight.bold),
              ),
              const Spacer(),
              Text(
                title,
                style: GoogleFonts.urbanist(
                  fontSize: 16,
                  color: type == 1
                      ? AppColor.grey
                      : type == 2
                          ? Colors.green
                          : AppColor.primaryColor,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ],
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
