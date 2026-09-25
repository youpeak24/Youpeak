import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:youpeak/core/utils/custom_range_picker.dart';
import 'package:youpeak/shared/shimmer/container_shimmer_ui.dart';
import 'package:youpeak/core/storage/database/database.dart';
import 'package:youpeak/main.dart';
import 'package:youpeak/core/settings/admin_settings_api.dart';
import 'package:youpeak/features/bites/view/nav_shorts_details_view.dart';
import 'package:youpeak/features/monetization/api/preview_monetization_api.dart';
import 'package:youpeak/features/monetization/model/preview_monetization_model.dart';
import 'package:youpeak/features/wallet/view/my_wallet_view.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:youpeak/core/assets/app_icons.dart';
import 'package:youpeak/core/assets/app_visuals.dart';
import 'package:youpeak/shared/widgets/preview_image.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'package:youpeak/core/constants/app_string.dart';

class PreviewMonetization extends StatefulWidget {
  const PreviewMonetization({super.key});

  @override
  State<PreviewMonetization> createState() => _PreviewMonetizationState();
}

class _PreviewMonetizationState extends State<PreviewMonetization> {
  RxBool isLoading = false.obs;
  PreviewMonetizationModel? monetization;
  RxString startDate = "All".obs;
  RxString endDate = "All".obs;

  RxString selectedRange = AppStrings.last28Days.tr.obs;

  @override
  void initState() {
    onGetData();
    super.initState();
  }

  void onGetData() async {
    monetization = null;
    isLoading.value = true;

    monetization = await PreviewMonetizationApi.callApi(loginUserId: Database.loginUserId!, startDate: startDate.value, endDate: endDate.value);
    if (monetization != null) {
      isLoading.value = false;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        systemOverlayStyle: const SystemUiOverlayStyle(statusBarColor: Colors.transparent, statusBarBrightness: Brightness.dark),
        backgroundColor: Colors.transparent,
        elevation: 0,
        leadingWidth: 60,
        leading: IconButtonUi(
          callback: () => Get.back(),
          icon: Obx(
            () => Image.asset(AppIcons.arrowBack, height: 20, width: 20, color: isDarkMode.value ? AppColor.white : AppColor.black),
          ),
        ),
        centerTitle: AppSettings.isCenterTitle,
        title: Text(AppStrings.monetization.tr, style: GoogleFonts.urbanist(fontSize: 18, fontWeight: FontWeight.bold)),
        actions: [
          IconButton(
            onPressed: () {
              Get.to(const MyWalletView());
            },
            icon: Image.asset(
              AppIcons.wallet,
              width: 25,
              color: isDarkMode.value ? AppColor.white : AppColor.black,
            ),
          ).paddingOnly(right: 10),
        ],
      ),
      body: Obx(
        () => isLoading.value
            ? Column(
                mainAxisAlignment: MainAxisAlignment.start,
                children: [
                  const ContainerShimmerUi(height: 140, radius: 20).paddingSymmetric(horizontal: 10),
                  const SizedBox(height: 10),
                  const ContainerShimmerUi(height: 40, radius: 25).paddingOnly(left: 10, right: 10),
                  const SizedBox(height: 10),
                  const Row(
                    mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                    children: [
                      ContainerShimmerUi(height: 120, width: 175, radius: 15),
                      ContainerShimmerUi(height: 120, width: 175, radius: 15),
                    ],
                  ),
                  const SizedBox(height: 10),
                  const Row(
                    mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                    children: [
                      ContainerShimmerUi(height: 120, width: 175, radius: 15),
                      ContainerShimmerUi(height: 120, width: 175, radius: 15),
                    ],
                  ),
                  const SizedBox(height: 10),
                  const ContainerShimmerUi(height: 40, radius: 25).paddingOnly(left: 10, right: 150),
                  const SizedBox(height: 10),
                  const ContainerShimmerUi(height: 140, radius: 20).paddingSymmetric(horizontal: 10),
                ],
              )
            : SingleChildScrollView(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const SizedBox(height: 25),
                    Container(
                      height: 102,
                      width: Get.width,
                      padding: const EdgeInsets.only(left: 20),
                      margin: const EdgeInsets.symmetric(horizontal: 10),
                      decoration: BoxDecoration(
                        color: isDarkMode.value ? AppColor.secondDarkMode : AppColor.grey_50,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Row(
                        children: [
                          PreviewProfileImage(
                            size: 65,
                            id: monetization?.monetizationOfChannel?.channel?.channelId ?? "",
                            image: monetization?.monetizationOfChannel?.channel?.image ?? "",
                            fit: BoxFit.cover,
                          ),
                          const SizedBox(width: 15),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Row(
                                children: [
                                  Text(
                                    (monetization?.monetizationOfChannel?.channel?.fullName ?? ""),
                                    style: GoogleFonts.urbanist(fontSize: 18, fontWeight: FontWeight.bold),
                                  ),
                                  Image.asset(
                                    AppIcons.tick,
                                    width: 12,
                                  ).paddingOnly(left: 3, bottom: 5)
                                ],
                              ),
                              Text(
                                (monetization?.monetizationOfChannel?.totalSubscribers ?? 0).toString(),
                                style: GoogleFonts.urbanist(fontSize: 22, color: AppColor.primaryColor, fontWeight: FontWeight.w800),
                              ),
                              Text(
                                AppStrings.totalSubscriber.tr,
                                style: GoogleFonts.urbanist(fontSize: 10, color: AppColor.grey, fontWeight: FontWeight.w600),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 20),
                    Row(
                      children: [
                        Text(
                          AppStrings.channelAnalytics.tr,
                          style: GoogleFonts.urbanist(fontSize: 18, fontWeight: FontWeight.bold),
                        ),
                        const Spacer(),
                        GestureDetector(
                          onTap: () async {
                            DateTimeRange? initialRange;
                            if (startDate.value != "All" && endDate.value != "All") {
                              try {
                                initialRange = DateTimeRange(
                                  start: DateFormat('yyyy-MM-dd').parse(startDate.value),
                                  end: DateFormat('yyyy-MM-dd').parse(endDate.value),
                                );
                              } catch (e) {
                                debugPrint("Error parsing dates: $e");
                              }
                            }

                            DateTimeRange? dateTimeRange = await CustomRangePicker.onPick(context, initialRange: initialRange);

                            if (dateTimeRange != null) {
                              startDate.value = DateFormat('yyyy-MM-dd').format(dateTimeRange.start);
                              endDate.value = DateFormat('yyyy-MM-dd').format(dateTimeRange.end);
                              selectedRange.value = "${DateFormat('dd/MM/yy').format(dateTimeRange.start)} - ${DateFormat('dd/MM/yy').format(dateTimeRange.end)}";
                              onGetData();
                            }
                          },
                          child: Row(
                            children: [
                              Obx(
                                () => Text(
                                  selectedRange.value,
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
                      ],
                    ).paddingSymmetric(horizontal: 10),
                    const SizedBox(height: 20),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                      children: [
                        const SizedBox(width: 10),
                        itemBox(AppStrings.estimatedRevenue.tr,
                            "${AdminSettingsApi.adminSettingsModel?.setting?.currency?.symbol ?? ""} ${monetization?.monetizationOfChannel?.channel?.totalWithdrawableAmount?.toStringAsFixed(2) ?? 0}"),
                        const SizedBox(width: 10),
                        itemBox(AppStrings.subscribes.tr, (monetization?.monetizationOfChannel?.dateWiseotalSubscribers ?? 0).toString()),
                        const SizedBox(width: 10),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                      children: [
                        const SizedBox(width: 10),
                        itemBox(AppStrings.watchTimeHours.tr, (monetization?.monetizationOfChannel?.totalWatchTime?.toStringAsFixed(2) ?? 0).toString()),
                        const SizedBox(width: 10),
                        itemBox(AppStrings.views.tr, (monetization?.monetizationOfChannel?.totalViewsOfthatChannelVideos ?? 0).toString()),
                        const SizedBox(width: 10),
                      ],
                    ),
                    const SizedBox(height: 20),
                    Text(
                      AppStrings.exchangeRate.tr,
                      style: GoogleFonts.urbanist(fontSize: 18, fontWeight: FontWeight.bold),
                    ).paddingOnly(left: 10),
                    const SizedBox(height: 20),
                    Container(
                      height: 100,
                      width: Get.width,
                      margin: const EdgeInsets.symmetric(horizontal: 10),
                      decoration: BoxDecoration(
                        color: isDarkMode.value ? AppColor.secondDarkMode : AppColor.white,
                        borderRadius: BorderRadius.circular(20),
                        boxShadow: [BoxShadow(color: isDarkMode.value ? AppColor.transparent : AppColor.grey_200, blurRadius: 10)],
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceAround,
                        children: [
                          Image.asset(AppVisuals.moneyBag, width: 44, height: 44),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.center,
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text(
                                "1",
                                style: GoogleFonts.urbanist(fontSize: 24, color: AppColor.primaryColor, fontWeight: FontWeight.w800),
                              ),
                              Text(
                                AppStrings.watchHours.tr,
                                style: GoogleFonts.urbanist(fontSize: 12, color: AppColor.grey, fontWeight: FontWeight.w600),
                              ),
                            ],
                          ),
                          Image.asset(AppIcons.arrowDoubleRight, width: 25),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.center,
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              RichText(
                                text: TextSpan(
                                  text: (AdminSettingsApi.adminSettingsModel?.setting?.earningPerHour ?? 0).toString(),
                                  style: GoogleFonts.urbanist(fontSize: 24, color: AppColor.primaryColor, fontWeight: FontWeight.w800),
                                  children: [
                                    TextSpan(
                                        text: AdminSettingsApi.adminSettingsModel?.setting?.currency?.symbol ?? "",
                                        style: GoogleFonts.urbanist(fontSize: 20, color: AppColor.primaryColor, fontWeight: FontWeight.w800)),
                                  ],
                                ),
                              ),
                              Text(
                                AppStrings.earnMoney.tr,
                                style: GoogleFonts.urbanist(fontSize: 12, color: AppColor.grey, fontWeight: FontWeight.w600),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
      ),
    );
  }
}

Widget itemBox(String title, subTitle) {
  return Expanded(
    child: Container(
      height: 110,
      padding: const EdgeInsets.only(left: 20),
      decoration: BoxDecoration(
        color: isDarkMode.value ? AppColor.secondDarkMode : AppColor.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [BoxShadow(color: isDarkMode.value ? AppColor.transparent : AppColor.grey_200, blurRadius: 10)],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(
            title,
            style: GoogleFonts.urbanist(fontSize: 12, color: AppColor.grey, fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 8),
          Text(
            subTitle,
            style: GoogleFonts.urbanist(fontSize: 24, color: AppColor.primaryColor.withOpacity(0.9), fontWeight: FontWeight.w800),
          ),
        ],
      ),
    ),
  );
}
