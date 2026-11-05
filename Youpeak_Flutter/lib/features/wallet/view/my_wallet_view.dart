import 'package:youpeak/core/platform/responsive.dart';
import 'package:youpeak/core/platform/app_layout.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/core/utils/custom_format_number.dart';
import 'package:youpeak/shared/widgets/data_not_found_ui.dart';
import 'package:youpeak/main.dart';
import 'package:youpeak/features/coins/view/coin_history_view.dart';
import 'package:youpeak/features/wallet/controller/my_wallet_controller.dart';
import 'package:youpeak/features/wallet/view/withdraw_view.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:youpeak/core/assets/app_icons.dart';
import 'package:youpeak/core/assets/app_visuals.dart';
import 'package:youpeak/core/constants/app_string.dart';

class MyWalletView extends StatelessWidget {
  const MyWalletView({super.key});

  @override
  Widget build(BuildContext context) {
    final controller = Get.put(MyWalletController());
    final wide = PageWidth.of(context) >= Responsive.splitFrom;

    final withdraw = GestureDetector(
      onTap: () async {
        Get.to(WithdrawView(balance: controller.myBalance.toDouble()));
      },
      child: Container(
        height: 55,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: AppColor.primaryColor,
          borderRadius: BorderRadius.circular(100),
        ),
        child: Text(
          AppStrings.withdraw.tr,
          textAlign: TextAlign.center,
          style: GoogleFonts.urbanist(
            fontWeight: FontWeight.w600,
            fontSize: 16,
            color: AppColor.white,
          ),
        ),
      ),
    );

    final history = _WalletHistory(controller: controller);

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
                  AppStrings.myWallet.tr,
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
      // Wide: the balance and its Withdraw action stay together in a left
      // column, the history fills the rest. Phones: stacked, action docked.
      body: wide
          ? Padding(
              padding: EdgeInsets.fromLTRB(Responsive.gutter(PageWidth.of(context)), 8, Responsive.gutter(PageWidth.of(context)), 24),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  SizedBox(
                    width: 360,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        const _BalanceCard(),
                        const SizedBox(height: 16),
                        withdraw,
                      ],
                    ),
                  ),
                  const SizedBox(width: 32),
                  Expanded(child: SurfaceCard(padding: const EdgeInsets.fromLTRB(24, 20, 24, 8), child: history)),
                ],
              ),
            )
          : Padding(
              padding: const EdgeInsets.symmetric(horizontal: 15),
              child: Column(
                children: [
                  const SizedBox(height: 10),
                  const _BalanceCard(),
                  const SizedBox(height: 20),
                  Expanded(child: history),
                ],
              ),
            ),
      bottomNavigationBar: wide ? null : Padding(padding: const EdgeInsets.all(15), child: withdraw),
    );
  }
}

class _BalanceCard extends StatelessWidget {
  const _BalanceCard();

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 135,
      padding: const EdgeInsets.only(left: 20, right: 12, top: 10, bottom: 10),
      decoration: BoxDecoration(
        gradient: AppColor.pinkLinearGradient,
        borderRadius: BorderRadius.circular(25),
        boxShadow: [
          BoxShadow(
            color: AppColor.primaryColor.withValues(alpha: 0.35),
            blurRadius: 16,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                Text(
                  AppStrings.myBalance.tr,
                  style: GoogleFonts.urbanist(fontSize: 16, color: AppColor.white, fontWeight: FontWeight.bold),
                ),
                GetBuilder<MyWalletController>(
                  id: "onGetWalletHistory",
                  builder: (controller) => FittedBox(
                    fit: BoxFit.scaleDown,
                    alignment: Alignment.centerLeft,
                    child: Text(
                      "${AppStrings.currencySymbol} ${controller.myBalance ?? 0}",
                      style: GoogleFonts.urbanist(fontSize: 34, color: AppColor.white, fontWeight: FontWeight.w900),
                    ),
                  ),
                ),
              ],
            ),
          ),
          Image.asset(AppVisuals.wallet, width: 96, height: 96),
        ],
      ),
    );
  }
}

class _WalletHistory extends StatelessWidget {
  const _WalletHistory({required this.controller});

  final MyWalletController controller;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
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
                  GetBuilder<MyWalletController>(
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
              child: Image.asset(
                AppIcons.clear,
                color: AppColor.primaryColor,
                height: 18,
              ),
            ),
            const SizedBox(width: 10),
          ],
        ),
        const SizedBox(height: 10),
        Expanded(
          child: GetBuilder<MyWalletController>(
            id: "onGetWalletHistory",
            builder: (controller) => controller.isLoadingHistory
                ? const HistoryShimmer()
                : RefreshIndicator(
                    color: AppColor.primaryColor,
                    onRefresh: () async {
                      controller.init();
                    },
                    child: controller.walletHistory.isEmpty
                        ? SingleChildScrollView(
                            physics: const AlwaysScrollableScrollPhysics(),
                            child: SizedBox(
                              height: Get.height * 0.5,
                              child: Center(
                                child: DataNotFoundUi(type: EmptyStateType.history, title: AppStrings.noEarningTransactionsRecorded.tr),
                              ),
                            ),
                          )
                        : SingleChildScrollView(
                            physics: const AlwaysScrollableScrollPhysics(),
                            child: ListView.builder(
                              itemCount: controller.walletHistory.length,
                              padding: EdgeInsets.zero,
                              shrinkWrap: true,
                              physics: const NeverScrollableScrollPhysics(),
                              itemBuilder: (context, index) {
                                final indexData = controller.walletHistory[index];
                                return WalletItem(
                                  id: indexData.uniqueId ?? "",
                                  title: historyType(int.parse((indexData.type ?? 0).toString())),
                                  coin: CustomFormatNumber.convert(int.parse((indexData.coin ?? 0).toString())),
                                  dateTime: indexData.date ?? "",
                                  amount: "+ ${indexData.amount}",
                                );
                              },
                            ),
                          ),
                  ),
          ),
        ),
      ],
    );
  }
}

String historyType(int type) {
  switch (type) {
    case 1:
      {
        return AppStrings.monetization.tr;
      }
    case 2:
      {
        return AppStrings.withdrawCoin.tr;
      }

    default:
      {
        return "";
      }
  }
}

class WalletItem extends StatelessWidget {
  const WalletItem({super.key, required this.id, required this.title, required this.coin, required this.dateTime, required this.amount});

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
                    Image.asset(width: 18, AppIcons.coin),
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
                        color: Colors.green,
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
