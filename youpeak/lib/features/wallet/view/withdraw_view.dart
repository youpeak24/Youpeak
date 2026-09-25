import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:get/get_rx/src/rx_typedefs/rx_typedefs.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/core/utils/custom_toast.dart';
import 'package:youpeak/shared/widgets/loader_ui.dart';
import 'package:youpeak/core/storage/database/database.dart';
import 'package:youpeak/main.dart';
import 'package:youpeak/core/settings/admin_settings_api.dart';
import 'package:youpeak/features/wallet/view/withdraw_history_view.dart';
import 'package:youpeak/features/wallet/api/with_draw_list_api.dart';
import 'package:youpeak/features/wallet/model/with_draw_list_model.dart';
import 'package:youpeak/features/wallet/api/with_draw_request_api.dart';
import 'package:youpeak/features/wallet/model/with_draw_request_model.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:youpeak/features/notifications/model/notification_model.dart' as model;
import 'package:youpeak/core/notification/local_notification_storage.dart';
import 'dart:math';
import 'package:youpeak/core/assets/app_icons.dart';
import 'package:youpeak/core/assets/app_visuals.dart';
import 'package:youpeak/shared/widgets/preview_image.dart';
import 'package:youpeak/core/constants/app_string.dart';
import 'package:youpeak/features/wallet/controller/withdraw_history_controller.dart';
import 'package:intl/intl.dart';

class WithdrawView extends StatefulWidget {
  const WithdrawView({super.key, required this.balance});
  final double balance;

  @override
  State<WithdrawView> createState() => _WithdrawViewState();
}

class _WithdrawViewState extends State<WithdrawView> {
  WithDrawListModel? withDrawListModel;

  RxBool isShowPayments = false.obs;
  RxBool isAllowTerms = false.obs;
  RxString selectedPayment = "".obs;

  RxInt selectedPaymentIndex = 0.obs;

  WithDrawRequestModel? withDrawRequestModel;

  RxList<WithdrawMethod>? paymentList;

  TextEditingController amountController = TextEditingController();
  TextEditingController detailsController = TextEditingController();

  @override
  void initState() {
    onGetPayments();
    super.initState();
  }

  RxList<TextEditingController> paymentDetailsController = <TextEditingController>[].obs;

  void onGetPayments() async {
    withDrawListModel = await WithDrawListApi.callApi();
    paymentList = null;
    paymentList = <WithdrawMethod>[].obs;
    paymentList?.addAll(withDrawListModel?.withdrawMethod ?? []);
  }

  @override
  Widget build(BuildContext context) {
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
                  AppStrings.withdraw.tr,
                  style: GoogleFonts.urbanist(
                    fontSize: 19,
                    color: isDarkMode.value ? AppColor.white : AppColor.black,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              const Spacer(),
              GestureDetector(
                onTap: () => Get.to(const WithdrawHistoryView()),
                child: Container(
                  height: 40,
                  width: 40,
                  alignment: Alignment.center,
                  decoration: const BoxDecoration(color: Colors.transparent, shape: BoxShape.circle),
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
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 10),
            Center(
              child: Image.asset(
                AppIcons.monetizationWithdraw,
                height: 200,
                width: Get.width,
              ).paddingSymmetric(horizontal: 15),
            ),
            const SizedBox(height: 10),
            Container(
              height: 50,
              width: Get.width,
              color: isDarkMode.value ? AppColor.secondDarkMode : AppColor.grey_100,
              child: Row(
                children: [
                  Text(
                    AppStrings.availableBalance.tr,
                    style: GoogleFonts.urbanist(fontSize: 16, color: AppColor.primaryColor, fontWeight: FontWeight.w600),
                  ),
                  const Spacer(),
                  Text(
                    "${AppStrings.currencySymbol} ${widget.balance.toStringAsFixed(2)}",
                    style: GoogleFonts.urbanist(fontSize: 18, color: AppColor.primaryColor, fontWeight: FontWeight.w800),
                  ),
                ],
              ).paddingSymmetric(horizontal: 15),
            ),
            const SizedBox(height: 15),
            Text(
              AppStrings.withdrawal.tr,
              style: GoogleFonts.urbanist(fontSize: 18, fontWeight: FontWeight.w600),
            ).paddingSymmetric(horizontal: 15),
            const SizedBox(height: 10),
            Container(
              height: 55,
              width: MediaQuery.of(context).size.width,
              padding: const EdgeInsets.only(left: 20),
              margin: const EdgeInsets.symmetric(horizontal: 15),
              decoration: BoxDecoration(
                color: isDarkMode.value ? AppColor.secondDarkMode : AppColor.white,
                borderRadius: BorderRadius.circular(10),
                boxShadow: [BoxShadow(color: isDarkMode.value ? AppColor.transparent : AppColor.grey_200, blurRadius: 10)],
              ),
              child: Center(
                child: TextFormField(
                  keyboardType: TextInputType.number,
                  controller: amountController,
                  cursorColor: AppColor.grey,
                  inputFormatters: [
                    LengthLimitingTextInputFormatter(10),
                  ],
                  style: GoogleFonts.urbanist(fontSize: 14, fontWeight: FontWeight.w600),
                  decoration: InputDecoration(
                      hintText: AppStrings.enterWithdrawalAmount.tr,
                      hintStyle: GoogleFonts.urbanist(fontSize: 14, color: AppColor.grey, fontWeight: FontWeight.w600),
                      border: InputBorder.none),
                ),
              ),
            ),
            const SizedBox(height: 10),
            Align(
              alignment: Alignment.centerRight,
              child: Text(
                "*${AppStrings.minimumWithdraw.tr} ${AppStrings.currencySymbol} ${(AdminSettingsApi.adminSettingsModel?.setting?.minWithdrawalRequestedAmount ?? 1)}",
                style: GoogleFonts.urbanist(fontSize: 12, color: AppColor.primaryColor, fontWeight: FontWeight.w600),
              ).paddingSymmetric(horizontal: 15),
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                Image.asset(AppVisuals.withdrawBank, width: 32, height: 32),
                const SizedBox(width: 8),
                Text(
                  AppStrings.selectPaymentGateway.tr,
                  style: GoogleFonts.urbanist(fontSize: 18, fontWeight: FontWeight.w600),
                ),
              ],
            ).paddingSymmetric(horizontal: 15),
            const SizedBox(height: 10),
            GestureDetector(
              onTap: () => isShowPayments.value = !isShowPayments.value,
              child: Container(
                height: 55,
                width: MediaQuery.of(context).size.width,
                padding: const EdgeInsets.symmetric(horizontal: 20),
                margin: const EdgeInsets.symmetric(horizontal: 15),
                decoration: BoxDecoration(
                  color: isDarkMode.value ? AppColor.secondDarkMode : AppColor.white,
                  borderRadius: BorderRadius.circular(10),
                  boxShadow: [BoxShadow(color: isDarkMode.value ? AppColor.transparent : AppColor.grey_200, blurRadius: 10)],
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.start,
                  children: [
                    Obx(
                      () => selectedPayment.value == ""
                          ? const Offstage()
                          : PreviewProfileImage(
                              size: 40,
                              id: paymentList?[selectedPaymentIndex.value].id ?? "",
                              image: paymentList?[selectedPaymentIndex.value].image ?? "",
                              fit: BoxFit.contain,
                            ).paddingOnly(left: 0, right: 15),
                    ),
                    Obx(
                      () => Text(
                        selectedPayment.value == "" ? AppStrings.selectPaymentGateway.tr : selectedPayment.value,
                        style: GoogleFonts.urbanist(
                            fontSize: selectedPayment.value == "" ? 14 : 16,
                            color: selectedPayment.value == "" ? AppColor.grey : null,
                            fontWeight: FontWeight.w600),
                      ),
                    ),
                    const Spacer(),
                    Image.asset(AppIcons.downArrowBold, color: isDarkMode.value ? AppColor.white : AppColor.black, width: 25)
                  ],
                ),
              ),
            ),
            const SizedBox(height: 10),
            Obx(
              () => isShowPayments.value
                  // () => true
                  ? Column(
                      children: [
                        for (int i = 0; i < (paymentList?.length ?? 0); i++)
                          paymentOption(
                            paymentList![i].image!,
                            paymentList![i].id!,
                            paymentList![i].name!,
                            selectedPayment.value,
                            () {
                              selectedPayment.value = paymentList![i].name!;
                              paymentDetailsController.value =
                                  List<TextEditingController>.generate(paymentList![i].details?.length ?? 0, (counter) => TextEditingController());
                              isShowPayments.value = false;
                              selectedPaymentIndex.value = i;
                            },
                          ),
                      ],
                    )
                  : const Offstage(),
            ),
            const SizedBox(height: 10),
            Obx(
              () => selectedPayment.value == ""
                  ? const Offstage()
                  : Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          AppStrings.enterDetails.tr,
                          style: GoogleFonts.urbanist(fontSize: 18, fontWeight: FontWeight.w600),
                        ).paddingSymmetric(horizontal: 15),
                        const SizedBox(height: 10),
                        Obx(
                          () => Column(
                            children: [
                              for (int i = 0; i < paymentList![selectedPaymentIndex.value].details!.length; i++)
                                Container(
                                  height: 55,
                                  width: MediaQuery.of(context).size.width,
                                  padding: const EdgeInsets.only(left: 20),
                                  margin: const EdgeInsets.symmetric(horizontal: 15),
                                  decoration: BoxDecoration(
                                    color: isDarkMode.value ? AppColor.secondDarkMode : AppColor.white,
                                    borderRadius: BorderRadius.circular(10),
                                    boxShadow: [BoxShadow(color: isDarkMode.value ? AppColor.transparent : AppColor.grey_200, blurRadius: 10)],
                                  ),
                                  child: TextFormField(
                                    controller: paymentDetailsController[i],
                                    cursorColor: AppColor.grey,
                                    style: GoogleFonts.urbanist(fontSize: 14, fontWeight: FontWeight.w600),
                                    decoration: InputDecoration(
                                      // hintText: paymentList![selectedPaymentIndex.value].details,
                                      hintText: paymentList![selectedPaymentIndex.value].details?[i],
                                      hintStyle: GoogleFonts.urbanist(fontSize: 14, color: AppColor.grey, fontWeight: FontWeight.w600),
                                      border: InputBorder.none,
                                    ),
                                  ),
                                ).paddingOnly(bottom: 10),
                            ],
                          ),
                        ),
                        // const SizedBox(height: 5),
                        // Align(
                        //   alignment: Alignment.centerRight,
                        //   child: Text(
                        //     "Ex. Phone No : 9876543210",
                        //     style: GoogleFonts.urbanist(fontSize: 10, color: AppColors.primaryColor, fontWeight: FontWeight.w600),
                        //   ),
                        // ).paddingOnly(right: 15),
                      ],
                    ),
            ),
            const SizedBox(height: 10),
          ],
        ),
      ),
      bottomNavigationBar: GestureDetector(
        onTap: () {
          bool isDetailsNotEmpty = false;
          for (int i = 0; i < paymentDetailsController.length; i++) {
            if (paymentDetailsController[i].text.isEmpty) {
              isDetailsNotEmpty = false;
            } else {
              isDetailsNotEmpty = true;
            }
          }

          if (selectedPayment.value != "" && amountController.text.isNotEmpty && isDetailsNotEmpty) {
            if ((AdminSettingsApi.adminSettingsModel?.setting?.minWithdrawalRequestedAmount ?? 1) > int.parse(amountController.text) ||
                widget.balance < int.parse(amountController.text)) {
              CustomToast.show(AppStrings.pleaseEnterCorrectAmount.tr);
            } else {
              Get.defaultDialog(
                title: AppStrings.confirmWithdraw.tr,
                titleStyle: GoogleFonts.urbanist(fontSize: 20, color: AppColor.primaryColor, fontWeight: FontWeight.bold),
                titlePadding: const EdgeInsets.only(top: 15),
                backgroundColor: isDarkMode.value ? AppColor.secondDarkMode : AppColor.white,
                contentPadding: const EdgeInsets.all(0),
                radius: 30,
                content: Container(
                  height: 265,
                  width: Get.width,
                  decoration: const BoxDecoration(color: Colors.transparent),
                  child: SingleChildScrollView(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisAlignment: MainAxisAlignment.start,
                      children: [
                        const SizedBox(height: 10),
                        Center(
                          child: PreviewProfileImage(
                            size: 80,
                            id: paymentList?[selectedPaymentIndex.value].id ?? "",
                            image: paymentList?[selectedPaymentIndex.value].image ?? "",
                            fit: BoxFit.contain,
                          ),
                        ),
                        // const SizedBox(height: 15),
                        // Center(
                        //   child: Text(
                        //     "+91 992555 55299",
                        //     textAlign: TextAlign.center,
                        //     style: GoogleFonts.urbanist(fontWeight: FontWeight.bold, fontSize: 18),
                        //   ),
                        // ),
                        const SizedBox(height: 10),
                        Text(
                          AppStrings.withdrawDialogText.tr,
                          textAlign: TextAlign.center,
                          style: GoogleFonts.urbanist(
                            fontWeight: FontWeight.w500,
                            fontSize: 12,
                          ),
                        ).paddingSymmetric(horizontal: 15),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Obx(
                              () => Checkbox(
                                value: isAllowTerms.value,
                                onChanged: (value) => isAllowTerms.value = value!,
                                fillColor: WidgetStatePropertyAll(isAllowTerms.value ? AppColor.primaryColor : AppColor.transparent),
                                side: const BorderSide(color: AppColor.primaryColor, width: 2),
                              ),
                            ),
                            SizedBox(
                              width: Get.width / 1.9,
                              child: Text(
                                AppStrings.acceptTermsCondition.tr,
                                textAlign: TextAlign.center,
                                style: GoogleFonts.urbanist(fontWeight: FontWeight.bold, fontSize: 13),
                              ),
                            ),
                          ],
                        ),
                        GestureDetector(
                          onTap: () async {
                            if (isAllowTerms.value) {
                              Get.back();
                              isAllowTerms.value = false;

                              Get.dialog(const LoaderUi(), barrierDismissible: false);

                              List<String> details = [];

                              for (int i = 0; i < paymentList![selectedPaymentIndex.value].details!.length; i++) {
                                details.add("${paymentList![selectedPaymentIndex.value].details![i]}:${paymentDetailsController[i].text}");
                              }
                              await 1.seconds.delay();

                              withDrawRequestModel = await WithDrawRequestApi.callApi(
                                loginUserId: Database.loginUserId!,
                                amount: amountController.text,
                                paymentGateway: selectedPayment.value,
                                paymentDetails: details,
                              );
                              Get.back();
                              if (withDrawRequestModel != null && (withDrawRequestModel?.status ?? false)) {
                                final apiMessage = withDrawRequestModel?.message ?? "";
                                if (apiMessage.toLowerCase().contains("finally, withdrawal request send to admin") ||
                                    apiMessage.toLowerCase().contains("request send to admin")) {
                                  CustomToast.show(AppStrings.requestSendToAdmin.tr);
                                  final withdrawNotification = model.Notification(
                                    id: Random.secure().nextInt(10000).toString(),
                                    title: "Withdrawal Requested",
                                    message: "Your withdrawal request of ${AppStrings.currencySymbol} ${amountController.text} has been sent to admin.",
                                    time: DateFormat('dd-MM-yyyy, hh:mm a').format(DateTime.now()),
                                  );
                                  LocalNotificationStorage.saveNotification(withdrawNotification);
                                  // Instantly refresh history if controller is already open
                                  if (Get.isRegistered<WithdrawHistoryController>()) {
                                    Get.find<WithdrawHistoryController>().init();
                                  }
                                } else if (apiMessage.toLowerCase().contains("already send by you to admin")) {
                                  CustomToast.show(AppStrings.requestAlreadySendToAdmin.tr);
                                } else {
                                  CustomToast.show(withDrawRequestModel?.message ?? AppStrings.someThingWentWrong.tr);
                                }
                                Get.back();
                              } else {
                                CustomToast.show(AppStrings.someThingWentWrong.tr);
                              }
                            } else {
                              CustomToast.show(AppStrings.pleaseAcceptTermsAndCondition.tr);
                            }
                          },
                          child: Container(
                            height: 48,
                            width: Get.width,
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
                        ).paddingSymmetric(horizontal: 20),
                      ],
                    ),
                  ),
                ),
              );
            }
          } else {
            CustomToast.show(AppStrings.pleaseFillUpDetails.tr);
          }
        },
        child: Container(
          height: 48,
          width: MediaQuery.of(context).size.width,
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
      ).paddingAll(15),
    );
  }
}

Widget paymentOption(String icon, String id, String name, String selectedPayment, Callback callback) {
  return GestureDetector(
    onTap: callback,
    child: Container(
      height: 55,
      width: Get.width,
      decoration: BoxDecoration(
        color: isDarkMode.value ? AppColor.secondDarkMode : AppColor.white,
        borderRadius: BorderRadius.circular(10),
        boxShadow: [BoxShadow(color: isDarkMode.value ? AppColor.transparent : AppColor.grey_200, blurRadius: 10)],
      ),
      padding: const EdgeInsets.symmetric(horizontal: 10),
      margin: const EdgeInsets.symmetric(horizontal: 15),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          PreviewProfileImage(
            size: 45,
            id: id,
            image: icon,
            fit: BoxFit.contain,
          ).paddingOnly(left: 10, right: 15),
          Text(
            name,
            style: GoogleFonts.urbanist(fontSize: 16, fontWeight: FontWeight.bold),
          ),
          const Spacer(),
          Radio(
            value: name,
            groupValue: selectedPayment,
            onChanged: (value) {
              callback();
            },
            fillColor: const WidgetStatePropertyAll(AppColor.primaryColor),
          ),
        ],
      ),
    ),
  ).paddingOnly(bottom: 10);
}
