import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:in_app_purchase/in_app_purchase.dart';
import 'package:youpeak/custom/custom_method/custom_filled_button.dart';
import 'package:youpeak/custom/custom_method/custom_toast.dart';
import 'package:youpeak/custom/custom_ui/loader_ui.dart';
import 'package:youpeak/database/database.dart';
import 'package:youpeak/main.dart';
import 'package:youpeak/pages/admin_settings/admin_settings_api.dart';
import 'package:youpeak/pages/login_related_page/fill_profile_page/get_profile_api.dart';
import 'package:youpeak/pages/profile_page/payment_page/in_app_purchase/iap_callback.dart';
import 'package:youpeak/pages/profile_page/payment_page/in_app_purchase/in_app_purchase_helper.dart';
import 'package:youpeak/pages/profile_page/payment_page/razor_pay/razor_pay_view.dart';
import 'package:youpeak/utils/colors/app_color.dart';
import 'package:youpeak/utils/config/size_config.dart';
import 'package:youpeak/utils/icons/app_icons.dart';
import 'package:youpeak/utils/payment/payment_api.dart';
import 'package:youpeak/utils/settings/app_settings.dart';
import 'package:youpeak/utils/string/app_string.dart';
import 'package:youpeak/utils/style/app_style.dart';
import 'package:youpeak/utils/utils.dart';

class PaymentView extends StatefulWidget {
  const PaymentView({super.key, required this.amount, required this.premiumPlanId, required this.productKey});
  final double amount;
  final String premiumPlanId;
  final String productKey;

  @override
  State<PaymentView> createState() => _PaymentViewState();
}

class _PaymentViewState extends State<PaymentView> implements IAPCallback {
  Map<String, PurchaseDetails>? purchases;
  bool isClicked = false;
  final RazorPayService _razorPayService = RazorPayService();

  @override
  void initState() {
    InAppPurchaseHelper().getAlreadyPurchaseItems(this);
    purchases = InAppPurchaseHelper().getPurchases();
    InAppPurchaseHelper().clearTransactions();

    super.initState();
  }

  @override
  void dispose() {
    _razorPayService.dispose();
    super.dispose();
  }

  Future<void> onRazorpayPurchase() async {
    if (isClicked) return;
    setState(() => isClicked = true);
    final order = await PaymentApi.createOrder(purpose: "premium_plan", premiumPlanId: widget.premiumPlanId);
    if (!mounted) return;
    setState(() => isClicked = false);

    if (order["status"] != true || order["checkout"] == null) {
      CustomToast.show(order["message"]?.toString() ?? AppStrings.someThingWentWrong.tr);
      return;
    }

    final checkout = Map<String, dynamic>.from(order["checkout"]);
    _razorPayService.openCheckout(
      checkout: checkout,
      appName: AppStrings.appName.tr,
      email: GetProfileApi.profileModel?.user?.email,
      contact: GetProfileApi.profileModel?.user?.mobileNumber,
      onSuccess: (response) async {
        if (!mounted) return;
        Get.dialog(const LoaderUi(), barrierDismissible: false);
        final verify = await PaymentApi.verify(
          orderId: response.orderId ?? "",
          paymentId: response.paymentId ?? "",
          signature: response.signature ?? "",
        );
        if (Get.isDialogOpen == true) Get.back();
        if (verify["status"] == true) {
          await GetProfileApi.callApi(Database.loginUserId ?? "");
          CustomToast.show("Premium Plan Purchase Success");
          Get.back();
        } else {
          CustomToast.show(verify["message"]?.toString() ?? AppStrings.someThingWentWrong.tr);
        }
      },
      onError: (message) {
        if (!mounted) return;
        CustomToast.show(message);
      },
    );
  }

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
        title: Text(AppStrings.payments.tr, style: GoogleFonts.urbanist(fontSize: 18, fontWeight: FontWeight.bold)),
      ),
      bottomNavigationBar: CustomFilledButton(
        title: AppStrings.continueString.tr,
        callback: () async {
          Utils.showLog("IS Clicked ==> $isClicked ");
          if (isClicked) {
            return;
          }
          if (AppSettings.paymentType.value.isEmpty) {
            AppSettings.showLog("Please Select Payment Type");
            CustomToast.show("Please select payment type");
            return;
          }
          if (AppSettings.paymentType.value == AppStrings.razorPay.tr) {
            await onRazorpayPurchase();
          } else {
            CustomToast.show(AppStrings.paymentMethodComingSoon.tr);
          }
        },
      ).paddingAll(20),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SizedBox(height: SizeConfig.blockSizeVertical * 2),
            Text(
              AppStrings.paymentNote.tr,
              style: GoogleFonts.urbanist(fontSize: 14, fontWeight: FontWeight.w500),
            ).paddingOnly(left: 20),
            SizedBox(height: SizeConfig.blockSizeVertical * 2),
            ((Platform.isAndroid && AdminSettingsApi.adminSettingsModel?.setting?.razorPaySwitch == true) ||
                    (Platform.isIOS && AdminSettingsApi.adminSettingsModel?.setting?.razorpayIosEnabled == true))
                ? PaymentItemView(
                    title: AppStrings.razorPay.tr,
                    leading: AppIcons.razorPay,
                    iconSize: 40,
                  )
                : const Offstage(),
            ((AdminSettingsApi.adminSettingsModel?.setting!.googlePlaySwitch ?? false) && Platform.isAndroid)
                ? PaymentItemView(
                    title: AppStrings.googlePay.tr,
                    leading: AppIcons.googleLogo,
                    iconSize: 25,
                  )
                : const Offstage(),
            ((AdminSettingsApi.adminSettingsModel?.setting!.googlePlaySwitch ?? false) && Platform.isIOS)
                ? PaymentItemView(
                    title: AppStrings.applePay.tr,
                    leading: AppIcons.appleLogo,
                    iconSize: 25,
                  )
                : const Offstage(),
            ((Platform.isAndroid && AdminSettingsApi.adminSettingsModel?.setting?.stripeSwitch == true) ||
                    (Platform.isIOS && AdminSettingsApi.adminSettingsModel?.setting?.stripeIosEnabled == true))
                ? PaymentItemView(
                    title: AppStrings.stripe.tr,
                    leading: AppIcons.stripe,
                    iconSize: 45,
                  )
                : const Offstage(),
            ((Platform.isAndroid && AdminSettingsApi.adminSettingsModel?.setting?.flutterWaveSwitch == true) ||
                    (Platform.isIOS && AdminSettingsApi.adminSettingsModel?.setting?.flutterwaveIosEnabled == true))
                ? PaymentItemView(
                    title: AppStrings.flutterWave.tr,
                    leading: AppIcons.flutterWaveIcon,
                    iconSize: 45,
                  )
                : const Offstage(),
            ((Platform.isAndroid && AdminSettingsApi.adminSettingsModel?.setting?.paypalAndroidEnabled == true) ||
                    (Platform.isIOS && AdminSettingsApi.adminSettingsModel?.setting?.paypalIosEnabled == true))
                ? PaymentItemView(
                    title: AppStrings.payPal.tr,
                    leading: AppIcons.paypal,
                    iconSize: 45,
                  )
                : const Offstage(),
            ((Platform.isAndroid && AdminSettingsApi.adminSettingsModel?.setting?.paystackAndroidEnabled == true) ||
                    (Platform.isIOS && AdminSettingsApi.adminSettingsModel?.setting?.paystackIosEnabled == true))
                ? PaymentItemView(
                    title: AppStrings.payStack.tr,
                    leading: AppIcons.payStackIcon,
                    iconSize: 45,
                  )
                : const Offstage(),
            ((Platform.isAndroid && AdminSettingsApi.adminSettingsModel?.setting?.cashfreeAndroidEnabled == true) ||
                    (Platform.isIOS && AdminSettingsApi.adminSettingsModel?.setting?.cashfreeIosEnabled == true))
                ? PaymentItemView(
                    title: AppStrings.cashFree.tr,
                    leading: AppIcons.cashFreeIcon,
                    iconSize: 45,
                  )
                : const Offstage(),
          ],
        ),
      ),
    );
  }

  @override
  void onBillingError(error) {}

  @override
  void onLoaded(bool initialized) {}

  @override
  void onPending(PurchaseDetails product) {}

  @override
  void onSuccessPurchase(PurchaseDetails product) {}
}

class PaymentItemView extends StatelessWidget {
  const PaymentItemView({super.key, required this.title, required this.leading, required this.iconSize});

  final String title;
  final String leading;
  final double iconSize;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => AppSettings.paymentType(title),
      child: Container(
        height: 65,
        width: Get.width,
        margin: const EdgeInsets.only(bottom: 20, left: 20, right: 20),
        decoration: BoxDecoration(
          color: isDarkMode.value ? AppColor.secondDarkMode : AppColor.grey_100,
          borderRadius: BorderRadius.circular(12),
        ),
        alignment: Alignment.center,
        child: ListTile(
          leading: SizedBox(width: 50, child: Center(child: Image(image: AssetImage(leading), height: iconSize, width: iconSize))),
          title: Text(title, style: paymentNameStyle),
          trailing: Obx(
            () => Radio(
              fillColor: WidgetStateColor.resolveWith((states) => AppColor.primaryColor),
              activeColor: AppColor.primaryColor,
              value: title,
              groupValue: AppSettings.paymentType.value,
              onChanged: (value) => AppSettings.paymentType(value),
            ),
          ),
        ),
      ),
    );
  }
}
