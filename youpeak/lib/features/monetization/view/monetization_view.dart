import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/core/utils/custom_toast.dart';
import 'package:youpeak/shared/widgets/loader_ui.dart';
import 'package:youpeak/shared/shimmer/container_shimmer_ui.dart';
import 'package:youpeak/core/storage/database/database.dart';
import 'package:youpeak/main.dart';
import 'package:youpeak/features/profile/api/get_profile_api.dart';
import 'package:youpeak/features/bites/view/nav_shorts_details_view.dart';
import 'package:youpeak/features/monetization/api/monetization_api.dart';
import 'package:youpeak/features/monetization/model/monetization_model.dart';
import 'package:youpeak/features/monetization/api/monetization_request_api.dart';
import 'package:youpeak/features/monetization/model/monetization_request_model.dart';
import 'package:youpeak/features/monetization/view/preview_monetization.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:youpeak/core/assets/app_icons.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'package:youpeak/core/constants/app_string.dart';
import 'package:percent_indicator/percent_indicator.dart';

class MonetizationView extends StatefulWidget {
  const MonetizationView({super.key});

  @override
  State<MonetizationView> createState() => _MonetizationViewState();
}

class _MonetizationViewState extends State<MonetizationView> {
  MonetizationModel? _monetizationModel;
  MonetizationRequestModel? _monetizationRequestModel;
  RxBool isLoading = false.obs;

  double watchTimePercentage() {
    final data = _monetizationModel?.dataOfMonetization;

    if (data == null) return 0.0;

    final totalWatchTime = double.tryParse(data.totalWatchTime ?? "0") ?? 0.0;

    final minWatchTime = data.minWatchTime ?? 1;

    if (minWatchTime == 0) return 0.0;

    final percentage = totalWatchTime / minWatchTime;

    return percentage.clamp(0.0, 1.0);
  }

  double subscriberPercentage() {
    final num = (_monetizationModel?.dataOfMonetization?.totalSubscribers ?? 0) / (_monetizationModel?.dataOfMonetization?.minSubScriber ?? 1);
    return num <= 1.0 ? num : 1.0;
  }

  void onGetMonetization() async {
    AppSettings.showLog(Database.loginUserId!);
    _monetizationModel = null;
    isLoading.value = true;
    if (Database.loginUserId != null) {
      _monetizationModel = await MonetizationApi.callApi(Database.loginUserId!);
    }
    if (_monetizationModel != null) {
      isLoading.value = false;
    }
  }

  @override
  void initState() {
    onGetMonetization();
    print("GetProfileApi.profileModel?.user?.isMonetization${GetProfileApi.profileModel?.user?.isMonetization}");
    super.initState();
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
      ),
      body: SingleChildScrollView(
        child: Obx(
          () => isLoading.value
              ? Column(
                  mainAxisAlignment: MainAxisAlignment.start,
                  children: [
                    const ContainerShimmerUi(height: 230, radius: 20),
                    const SizedBox(height: 30),
                    const ContainerShimmerUi(height: 40, radius: 20).paddingOnly(right: 100),
                    const SizedBox(height: 5),
                    // ContainerShimmerUi(height: 100, radius: 20),
                    const ContainerShimmerUi(height: 15, radius: 20).paddingOnly(right: 15),
                    const ContainerShimmerUi(height: 15, radius: 20).paddingOnly(right: 20),
                    const ContainerShimmerUi(height: 15, radius: 20).paddingOnly(right: 25),

                    const SizedBox(height: 30),
                    const ContainerShimmerUi(height: 230, radius: 20),
                    const SizedBox(height: 25),
                    const ContainerShimmerUi(height: 48, radius: 30),
                    const SizedBox(height: 20),
                  ],
                ).paddingSymmetric(horizontal: 15)
              : Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const SizedBox(height: 25),
                    Center(
                      child: Image.asset(
                        AppIcons.monetizationImage,
                        height: 250,
                        width: Get.width,
                      ).paddingSymmetric(horizontal: 15),
                    ),
                    const SizedBox(height: 10),
                    Text(
                      "Hello, ${GetProfileApi.profileModel?.user?.fullName ?? ""}",
                      style: GoogleFonts.urbanist(fontSize: 18, fontWeight: FontWeight.bold),
                    ).paddingSymmetric(horizontal: 15, vertical: 3),
                    Text(
                      AppStrings.monetizationParagraph.tr,
                      style: GoogleFonts.urbanist(fontSize: 12, fontWeight: FontWeight.w500),
                    ).paddingSymmetric(horizontal: 15),
                    const SizedBox(height: 20),
                    Obx(
                      () => Container(
                        height: 200,
                        width: Get.width,
                        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                        margin: const EdgeInsets.symmetric(horizontal: 15),
                        decoration: BoxDecoration(
                            color: isDarkMode.value ? AppColor.secondDarkMode : AppColor.white,
                            borderRadius: BorderRadius.circular(20),
                            boxShadow: [BoxShadow(color: isDarkMode.value ? AppColor.transparent : AppColor.grey_200, blurRadius: 1.5)]),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                          children: [
                            Text(
                              AppStrings.minimumWatchTime.tr,
                              style: GoogleFonts.urbanist(fontSize: 14, color: AppColor.primaryColor.withOpacity(0.8), fontWeight: FontWeight.w600),
                            ).paddingOnly(left: 10),
                            LinearPercentIndicator(
                              lineHeight: 10.0,
                              percent: watchTimePercentage(),
                              animation: true,
                              barRadius: const Radius.circular(10),
                              backgroundColor: AppColor.grey_200,
                              progressColor: AppColor.primaryColor,
                            ),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.end,
                              children: [
                                Text(
                                  "${_monetizationModel?.dataOfMonetization?.totalWatchTime} Hr / ${_monetizationModel?.dataOfMonetization?.minWatchTime} Hr",
                                  style: GoogleFonts.urbanist(fontSize: 12, color: AppColor.primaryColor.withOpacity(0.8), fontWeight: FontWeight.bold),
                                ).paddingOnly(right: 10),
                              ],
                            ),
                            Text(
                              AppStrings.minimumSubscriber.tr,
                              style: GoogleFonts.urbanist(fontSize: 14, color: AppColor.primaryColor.withOpacity(0.8), fontWeight: FontWeight.w600),
                            ).paddingOnly(left: 10),
                            LinearPercentIndicator(
                              lineHeight: 10.0,
                              percent: subscriberPercentage(),
                              animation: true,
                              barRadius: const Radius.circular(10),
                              backgroundColor: AppColor.grey_200,
                              progressColor: AppColor.primaryColor,
                            ),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.end,
                              children: [
                                Text(
                                  "${_monetizationModel?.dataOfMonetization?.totalSubscribers} / ${_monetizationModel?.dataOfMonetization?.minSubScriber}",
                                  style: GoogleFonts.urbanist(fontSize: 12, color: AppColor.primaryColor.withOpacity(0.8), fontWeight: FontWeight.bold),
                                ).paddingOnly(right: 10),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
        ),
      ),
      bottomNavigationBar: (GetProfileApi.profileModel?.user?.isMonetization ?? false)
          ? const SizedBox()
          : Obx(
              () => isLoading.value
                  ? const Offstage()
                  : GestureDetector(
                      onTap: () async {
                        if ((_monetizationModel?.dataOfMonetization?.isMonetization ?? false)) {
                          Get.dialog(const LoaderUi(color: AppColor.white), barrierDismissible: false);
                          _monetizationRequestModel = await MonetizationRequestApi.callApi(Database.loginUserId!);
                          Get.back();
                          if (_monetizationRequestModel != null) {
                            if (_monetizationRequestModel?.monetizationRequest?.status == 1) {
                              CustomToast.show(AppStrings.requestSendToAdmin.tr);
                            } else if (_monetizationRequestModel?.monetizationRequest?.status == 3) {
                              CustomToast.show(AppStrings.requestDeclineByAdmin.tr);
                            } else if (_monetizationRequestModel?.monetizationRequest?.status == 2) {
                              Get.to(const PreviewMonetization());
                            } else {
                              CustomToast.show(AppStrings.someThingWentWrong.tr);
                            }
                          } else {
                            CustomToast.show(AppStrings.someThingWentWrong.tr);
                          }
                        } else {
                          CustomToast.show(AppStrings.monetizationPendingText.tr);
                        }
                      },
                      child: Container(
                        height: 48,
                        width: MediaQuery.of(context).size.width,
                        alignment: Alignment.center,
                        decoration: BoxDecoration(
                          color: (_monetizationModel?.dataOfMonetization?.isMonetization ?? false) ? AppColor.primaryColor : AppColor.primaryColor.withOpacity(0.15),
                          borderRadius: BorderRadius.circular(100),
                        ),
                        child: Text(
                          AppStrings.monetization.tr,
                          textAlign: TextAlign.center,
                          style: GoogleFonts.urbanist(
                            fontWeight: FontWeight.w600,
                            fontSize: 16,
                            color: (_monetizationModel?.dataOfMonetization?.isMonetization ?? false) ? AppColor.white : AppColor.primaryColor,
                          ),
                        ),
                      ),
                    ).paddingAll(15),
            ),
    );
  }
}
