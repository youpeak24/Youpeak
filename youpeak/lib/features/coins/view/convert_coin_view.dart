import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/core/utils/custom_format_number.dart';
import 'package:youpeak/features/coins/widget/convert_coin_shimmer_ui.dart';
import 'package:youpeak/main.dart';
import 'package:youpeak/features/coins/view/buy_coin_view.dart';
import 'package:youpeak/features/live/widget/device_orientation.dart';
import 'package:youpeak/features/coins/controller/convert_coin_controller.dart';
import 'package:youpeak/features/coins/view/coin_history_view.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:youpeak/core/assets/app_icons.dart';
import 'package:youpeak/core/constants/app_string.dart';
import 'package:youpeak/core/utils/utils.dart';

class ConvertCoinView extends StatelessWidget {
  const ConvertCoinView({super.key});

  @override
  Widget build(BuildContext context) {
    final controller = Get.put(ConvertCoinController());

    return Scaffold(
      appBar: PreferredSize(
        preferredSize:
            Size.fromHeight(MediaQuery.of(context).viewPadding.top + 60),
        child: Container(
          padding: EdgeInsets.only(
              top: MediaQuery.of(context).viewPadding.top, left: 15, right: 15),
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
                  decoration: const BoxDecoration(
                      color: Colors.transparent, shape: BoxShape.circle),
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
                  AppStrings.convertCoin.tr,
                  style: GoogleFonts.urbanist(
                    fontSize: 19,
                    color: isDarkMode.value ? AppColor.white : AppColor.black,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              const Spacer(),
              GestureDetector(
                onTap: () => Get.to(const CoinHistoryView()),
                child: Container(
                  height: 40,
                  width: 40,
                  alignment: Alignment.center,
                  decoration: const BoxDecoration(
                      color: Colors.transparent, shape: BoxShape.circle),
                  child: Obx(
                    () => Image.asset(
                      AppIcons.historyIcon,
                      color: isDarkMode.value ? AppColor.white : AppColor.black,
                      width: 23,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
      body: GetBuilder<ConvertCoinController>(
        id: "onGetMyCoin",
        builder: (controller) => controller.isLoadingCoin
            ? const ConvertCoinShimmerUi()
            : Column(
                children: [
                  Expanded(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 15),
                      child: RefreshIndicator(
                        onRefresh: () async => await controller.init(),
                        child: SingleChildScrollView(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Container(
                                height: 135,
                                width: Get.width,
                                padding: const EdgeInsets.only(
                                    left: 20, top: 10, bottom: 10),
                                margin:
                                    const EdgeInsets.only(top: 10, bottom: 20),
                                decoration: BoxDecoration(
                                  borderRadius: BorderRadius.circular(25),
                                  image: const DecorationImage(
                                      image:
                                          AssetImage(AppIcons.convertCoinImage),
                                      fit: BoxFit.cover),
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  mainAxisAlignment:
                                      MainAxisAlignment.spaceEvenly,
                                  children: [
                                    Text(
                                      AppStrings.myCoinBalance.tr,
                                      style: GoogleFonts.urbanist(
                                          fontSize: 16,
                                          color: AppColor.white,
                                          fontWeight: FontWeight.w800),
                                    ),
                                    Row(
                                      children: [
                                        Text(
                                          CustomFormatNumber.convert(controller
                                                  .getMyCoinModel?.data?.coin ??
                                              0),
                                          style: GoogleFonts.urbanist(
                                              fontSize: 34,
                                              color: AppColor.white,
                                              fontWeight: FontWeight.w900),
                                        ),
                                        Text(
                                          " / ${AppStrings.coins.tr}",
                                          style: GoogleFonts.urbanist(
                                              fontSize: 18,
                                              color: AppColor.white,
                                              fontWeight: FontWeight.w700),
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                              Row(
                                children: [
                                  Expanded(
                                    child: GestureDetector(
                                      onTap: () =>
                                          Get.to(const CoinHistoryView()),
                                      child: Container(
                                        height: 50,
                                        width: Get.width,
                                        alignment: Alignment.center,
                                        decoration: BoxDecoration(
                                          color: AppColor.transparent,
                                          border: Border.all(
                                              color: AppColor.primaryColor,
                                              width: 1.5),
                                          borderRadius:
                                              BorderRadius.circular(10),
                                        ),
                                        child: Text(
                                          AppStrings.history.tr,
                                          style: GoogleFonts.urbanist(
                                              fontSize: 16,
                                              color: AppColor.primaryColor,
                                              fontWeight: FontWeight.bold),
                                        ),
                                      ),
                                    ),
                                  ),
                                  15.width,
                                  Expanded(
                                    child: GestureDetector(
                                      onTap: () {
                                        Get.to(const BuyCoinView())?.then(
                                          (value) {
                                            controller.onGetMyCoin();
                                          },
                                        );
                                      },
                                      child: Container(
                                        height: 50,
                                        width: Get.width,
                                        alignment: Alignment.center,
                                        decoration: BoxDecoration(
                                          color: AppColor.primaryColor,
                                          borderRadius:
                                              BorderRadius.circular(10),
                                        ),
                                        child: Text(
                                          AppStrings.buyCoin.tr,
                                          style: GoogleFonts.urbanist(
                                              fontSize: 16,
                                              color: AppColor.white,
                                              fontWeight: FontWeight.bold),
                                        ),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              15.height,
                              Divider(color: AppColor.grey_100),
                              10.height,
                              Text(
                                AppStrings.coinExchangeRate.tr,
                                style: GoogleFonts.urbanist(
                                    fontSize: 18,
                                    color: isDarkMode.value
                                        ? AppColor.white
                                        : AppColor.black,
                                    fontWeight: FontWeight.bold),
                              ),
                              const SizedBox(height: 20),
                              Container(
                                height: 100,
                                width: Get.width,
                                decoration: BoxDecoration(
                                  color: isDarkMode.value
                                      ? AppColor.secondDarkMode
                                      : AppColor.white,
                                  borderRadius: BorderRadius.circular(20),
                                  boxShadow: [
                                    BoxShadow(
                                        color: isDarkMode.value
                                            ? AppColor.transparent
                                            : AppColor.grey_200,
                                        blurRadius: 10)
                                  ],
                                ),
                                child: Row(
                                  mainAxisAlignment:
                                      MainAxisAlignment.spaceAround,
                                  children: [
                                    Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.center,
                                      mainAxisAlignment:
                                          MainAxisAlignment.center,
                                      children: [
                                        SizedBox(
                                          height: 35,
                                          child: RichText(
                                            text: TextSpan(
                                              text: CustomFormatNumber.convert(
                                                  controller
                                                          .getMyCoinModel
                                                          ?.data
                                                          ?.minCoinForCashOut ??
                                                      0),
                                              style: GoogleFonts.urbanist(
                                                  fontSize: 24,
                                                  color: AppColor.primaryColor,
                                                  fontWeight: FontWeight.w800),
                                              children: [
                                                TextSpan(
                                                    text:
                                                        " / ${AppStrings.coins.tr}",
                                                    style: GoogleFonts.urbanist(
                                                        fontSize: 12,
                                                        color: AppColor
                                                            .primaryColor,
                                                        fontWeight:
                                                            FontWeight.w700)),
                                              ],
                                            ),
                                          ),
                                        ),
                                        Text(
                                          AppStrings.totalCoins.tr,
                                          style: GoogleFonts.urbanist(
                                              fontSize: 12,
                                              color: AppColor.grey,
                                              fontWeight: FontWeight.w600),
                                        ),
                                      ],
                                    ),
                                    Image.asset(AppIcons.arrowDoubleRight,
                                        width: 25),
                                    Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.center,
                                      mainAxisAlignment:
                                          MainAxisAlignment.center,
                                      children: [
                                        SizedBox(
                                          height: 35,
                                          child: Text(
                                            "1 ${AppStrings.currencySymbol}",
                                            // NOTE => *** This Value is Fix Do Not Change ***
                                            style: GoogleFonts.urbanist(
                                                fontSize: 24,
                                                color: AppColor.primaryColor,
                                                fontWeight: FontWeight.w800),
                                          ),
                                        ),
                                        Text(
                                          "Earn ${AppStrings.currencyCode}",
                                          style: GoogleFonts.urbanist(
                                              fontSize: 12,
                                              color: AppColor.grey,
                                              fontWeight: FontWeight.w600),
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(height: 5),
                              Align(
                                alignment: Alignment.centerRight,
                                child: Text(
                                  "*${AppStrings.minimumWithdraw.tr} ${controller.getMyCoinModel?.data?.minConvertCoin ?? 0} ${AppStrings.coin.tr}",
                                  style: GoogleFonts.urbanist(
                                      fontSize: 12,
                                      color: AppColor.primaryColor,
                                      fontWeight: FontWeight.w600),
                                ),
                              ),
                              const SizedBox(height: 20),
                              Text(
                                AppStrings.withdrawCoin.tr,
                                style: GoogleFonts.urbanist(
                                    fontSize: 18,
                                    color: isDarkMode.value
                                        ? AppColor.white
                                        : AppColor.black,
                                    fontWeight: FontWeight.bold),
                              ),
                              const SizedBox(height: 20),
                              Container(
                                height: 60,
                                width: MediaQuery.of(context).size.width,
                                padding: const EdgeInsets.only(left: 20),
                                alignment: Alignment.center,
                                // margin: const EdgeInsets.symmetric(horizontal: 15),
                                decoration: BoxDecoration(
                                  color: isDarkMode.value
                                      ? AppColor.secondDarkMode
                                      : AppColor.white,
                                  borderRadius: BorderRadius.circular(12),
                                  boxShadow: [
                                    BoxShadow(
                                        color: isDarkMode.value
                                            ? AppColor.transparent
                                            : AppColor.grey_200,
                                        blurRadius: 10)
                                  ],
                                ),
                                child: Row(
                                  children: [
                                    Expanded(
                                      child: GetBuilder<ConvertCoinController>(
                                        id: "onClickAll",
                                        builder: (controller) => TextFormField(
                                          controller: controller.coinController,
                                          cursorColor: AppColor.grey,
                                          keyboardType: TextInputType.number,
                                          inputFormatters: [
                                            FilteringTextInputFormatter
                                                .digitsOnly,
                                            LengthLimitingTextInputFormatter(10)
                                          ],
                                          style: GoogleFonts.urbanist(
                                              fontSize: 15,
                                              fontWeight: FontWeight.w700),
                                          onChanged: (value) => controller
                                              .onConvertCoinToAmount(),
                                          decoration: InputDecoration(
                                            hintText: AppStrings
                                                .enterWithdrawalCoin.tr,
                                            hintStyle: GoogleFonts.urbanist(
                                                fontSize: 14,
                                                color: AppColor.grey,
                                                fontWeight: FontWeight.w600),
                                            border: InputBorder.none,
                                          ),
                                        ),
                                      ),
                                    ),
                                    GestureDetector(
                                      onTap: () {
                                        if ((controller.getMyCoinModel?.data
                                                    ?.coin ??
                                                0) >=
                                            (controller.getMyCoinModel?.data
                                                    ?.minConvertCoin ??
                                                0)) {
                                          controller.onClickAll();
                                        }
                                      },
                                      child: Container(
                                        height: 40,
                                        width: 64,
                                        alignment: Alignment.center,
                                        margin: const EdgeInsets.symmetric(
                                            horizontal: 12),
                                        decoration: BoxDecoration(
                                          color: ((controller.getMyCoinModel
                                                          ?.data?.coin ??
                                                      0) <
                                                  (controller
                                                          .getMyCoinModel
                                                          ?.data
                                                          ?.minConvertCoin ??
                                                      0))
                                              ? AppColor.grey
                                              : isDarkMode.value
                                                  ? AppColor.primaryColor
                                                  : AppColor.primaryColor,
                                          borderRadius:
                                              BorderRadius.circular(12),
                                        ),
                                        child: Text(
                                          AppStrings.all.tr,
                                          style: GoogleFonts.urbanist(
                                              fontSize: 18,
                                              color: AppColor.white,
                                              fontWeight: FontWeight.w600),
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(height: 20),
                              Text(
                                AppStrings.amount.tr,
                                style: GoogleFonts.urbanist(
                                    fontSize: 18,
                                    color: isDarkMode.value
                                        ? AppColor.white
                                        : AppColor.black,
                                    fontWeight: FontWeight.bold),
                              ),
                              const SizedBox(height: 20),
                              Container(
                                height: 60,
                                width: MediaQuery.of(context).size.width,
                                padding: const EdgeInsets.only(left: 20),
                                alignment: Alignment.centerLeft,
                                decoration: BoxDecoration(
                                  color: isDarkMode.value
                                      ? AppColor.secondDarkMode
                                      : AppColor.white,
                                  borderRadius: BorderRadius.circular(12),
                                  boxShadow: [
                                    BoxShadow(
                                        color: isDarkMode.value
                                            ? AppColor.transparent
                                            : AppColor.grey_200,
                                        blurRadius: 10)
                                  ],
                                ),
                                child: GetBuilder<ConvertCoinController>(
                                  id: "onConvertCoinToAmount",
                                  builder: (controller) => Text(
                                    "${controller.convertedAmount} ${AppStrings.currencySymbol}",
                                    style: GoogleFonts.urbanist(
                                        fontSize: 16,
                                        color: isDarkMode.value
                                            ? AppColor.grey
                                            : AppColor.grey,
                                        fontWeight: FontWeight.w700),
                                  ),
                                ),
                              ),
                              const SizedBox(height: 20),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),
                  Obx(
                    () => GestureDetector(
                      child: GestureDetector(
                        onTap: () {
                          controller.onClickWithdraw(context);
                        },
                        child: Container(
                          height: 55,
                          width: MediaQuery.of(context).size.width,
                          alignment: Alignment.center,
                          margin: const EdgeInsets.all(15),
                          decoration: BoxDecoration(
                            color: controller.isEnableWithdrawButton.value
                                ? AppColor.primaryColor
                                : AppColor.grey.withOpacity(0.6),
                            borderRadius: BorderRadius.circular(100),
                          ),
                          child: Text(
                            AppStrings.withdrawToWallet.tr,
                            textAlign: TextAlign.center,
                            style: GoogleFonts.urbanist(
                              fontWeight: FontWeight.w700,
                              fontSize: 16,
                              color: AppColor.white,
                            ),
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
