import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/custom/custom_method/custom_toast.dart';
import 'package:youpeak/custom/custom_ui/loader_ui.dart';
import 'package:youpeak/main.dart';
import 'package:youpeak/pages/login_related_page/fill_profile_page/get_profile_api.dart';
import 'package:youpeak/pages/profile_page/payment_page/razor_pay/razor_pay_view.dart';
import 'package:youpeak/pages/profile_page/digital_partner_page/digital_partner_api.dart';
import 'package:youpeak/utils/colors/app_color.dart';
import 'package:youpeak/utils/icons/app_icons.dart';
import 'package:youpeak/utils/payment/payment_api.dart';
import 'package:youpeak/utils/settings/app_settings.dart';
import 'package:youpeak/utils/string/app_string.dart';

// Digital Partner Program — one-time license unlocking an ad-credits wallet
// and referral commissions (10% of onboarded creators' earnings, 20% of
// onboarded taskers' earnings — both already live via the shared referral
// mechanism; 50% of local-business-ad revenue once that feature exists).
class DigitalPartnerView extends StatefulWidget {
  const DigitalPartnerView({super.key});

  @override
  State<DigitalPartnerView> createState() => _DigitalPartnerViewState();
}

class _DigitalPartnerViewState extends State<DigitalPartnerView> {
  bool isLoading = true;
  Map<String, dynamic>? dashboard;
  bool isPurchasing = false;
  final RazorPayService _razorPayService = RazorPayService();

  @override
  void initState() {
    super.initState();
    loadDashboard();
  }

  @override
  void dispose() {
    _razorPayService.dispose();
    super.dispose();
  }

  Future<void> loadDashboard() async {
    setState(() => isLoading = true);
    final result = await DigitalPartnerApi.getDashboard();
    if (!mounted) return;
    setState(() {
      isLoading = false;
      dashboard = result["status"] == true ? result : null;
    });
  }

  Future<void> onBecomePartner() async {
    if (isPurchasing) return;
    setState(() => isPurchasing = true);
    final order = await PaymentApi.createOrder(purpose: "digital_partner_license");
    if (!mounted) return;
    setState(() => isPurchasing = false);

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
          CustomToast.show(AppStrings.digitalPartnerActivated.tr);
          await loadDashboard();
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

  BoxDecoration cardDecoration() => BoxDecoration(
        color: isDarkMode.value ? AppColor.secondDarkMode : AppColor.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [BoxShadow(color: isDarkMode.value ? AppColor.transparent : AppColor.grey_200, blurRadius: 10)],
      );

  String formatDate(String? iso) {
    if (iso == null) return "-";
    final dt = DateTime.tryParse(iso);
    if (dt == null) return iso;
    return "${dt.day.toString().padLeft(2, '0')}-${dt.month.toString().padLeft(2, '0')}-${dt.year}";
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        systemOverlayStyle: const SystemUiOverlayStyle(statusBarColor: Colors.transparent, statusBarBrightness: Brightness.dark),
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: GestureDetector(
          child: Obx(() => Image.asset(AppIcons.arrowBack, color: isDarkMode.value ? AppColor.white : AppColor.black).paddingOnly(left: 15)),
          onTap: () => Get.back(),
        ),
        leadingWidth: 33,
        title: Text(AppStrings.digitalPartnerProgram.tr, style: GoogleFonts.urbanist(fontSize: 18, fontWeight: FontWeight.bold)),
        centerTitle: AppSettings.isCenterTitle,
      ),
      body: isLoading
          ? const LoaderUi()
          : dashboard == null
              ? Center(child: Text(AppStrings.someThingWentWrong.tr, style: GoogleFonts.urbanist(fontSize: 14, color: AppColor.grey)))
              : (dashboard!["isDigitalPartner"] == true ? activeDashboard() : promoView()),
    );
  }

  Widget promoView() {
    final feeInr = (dashboard!["licenseFeeInr"] as num?)?.toDouble() ?? 25000;
    return SingleChildScrollView(
      physics: const BouncingScrollPhysics(),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20),
        child: Obx(
          () => Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 10),
              Text(AppStrings.digitalPartnerSubtitle.tr, style: GoogleFonts.urbanist(fontSize: 13, color: AppColor.grey)),
              const SizedBox(height: 20),
              Container(
                padding: const EdgeInsets.all(20),
                decoration: cardDecoration(),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Image.asset(AppIcons.wallet, width: 40, height: 40),
                    const SizedBox(height: 12),
                    Text(
                      "${AppStrings.currencySymbol} ${feeInr.toStringAsFixed(0)}",
                      style: GoogleFonts.urbanist(fontSize: 26, fontWeight: FontWeight.w800, color: AppColor.primaryColor),
                    ),
                    Text(AppStrings.oneTimeLicenseFee.tr, style: GoogleFonts.urbanist(fontSize: 13, color: AppColor.grey)),
                    const SizedBox(height: 16),
                    benefitRow(Icons.account_balance_wallet_outlined, AppStrings.benefitAdCredits.tr),
                    benefitRow(Icons.person_add_alt_1_outlined, AppStrings.benefitCreatorCommission.tr),
                    benefitRow(Icons.emoji_events_outlined, AppStrings.benefitTaskerCommission.tr),
                    benefitRow(Icons.storefront_outlined, AppStrings.benefitLocalAdsCommission.tr),
                  ],
                ),
              ),
              const SizedBox(height: 20),
              GestureDetector(
                onTap: isPurchasing ? null : onBecomePartner,
                child: Container(
                  height: 48,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(color: AppColor.primaryColor, borderRadius: BorderRadius.circular(99)),
                  child: isPurchasing
                      ? const SizedBox(height: 22, width: 22, child: CircularProgressIndicator(strokeWidth: 2, color: AppColor.white))
                      : Text(AppStrings.becomeDigitalPartner.tr, style: GoogleFonts.urbanist(color: AppColor.white, fontWeight: FontWeight.bold, fontSize: 16)),
                ),
              ),
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }

  Widget benefitRow(IconData icon, String text) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 5),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, size: 18, color: AppColor.primaryColor),
            const SizedBox(width: 10),
            Expanded(child: Text(text, style: GoogleFonts.urbanist(fontSize: 13, fontWeight: FontWeight.w500))),
          ],
        ),
      );

  Widget activeDashboard() {
    final wallet = Map<String, dynamic>.from(dashboard!["wallet"] ?? {});
    final referrals = Map<String, dynamic>.from(dashboard!["referrals"] ?? {});
    final license = Map<String, dynamic>.from(dashboard!["license"] ?? {});
    final recentReferrals = List<Map<String, dynamic>>.from((dashboard!["recentReferrals"] as List? ?? []).map((r) => Map<String, dynamic>.from(r)));
    final status = dashboard!["partnerStatus"]?.toString() ?? "ACTIVE";

    return RefreshIndicator(
      onRefresh: loadDashboard,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Obx(
            () => Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 10),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: (status == "ACTIVE" ? AppColor.primaryColor : AppColor.grey).withOpacity(0.12),
                    borderRadius: BorderRadius.circular(99),
                  ),
                  child: Text(status, style: GoogleFonts.urbanist(fontSize: 12, fontWeight: FontWeight.w700, color: status == "ACTIVE" ? AppColor.primaryColor : AppColor.grey)),
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(child: statCard(AppStrings.adCreditsBalance.tr, "${AppStrings.currencySymbol} ${(wallet["adCreditsBalance"] as num? ?? 0).toStringAsFixed(0)}")),
                    const SizedBox(width: 12),
                    Expanded(child: statCard(AppStrings.coinBalance.tr, "${wallet["coinBalance"] ?? 0}")),
                  ],
                ),
                const SizedBox(height: 20),
                Text(AppStrings.referralPerformance.tr, style: GoogleFonts.urbanist(fontSize: 16, fontWeight: FontWeight.bold)),
                const SizedBox(height: 10),
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: cardDecoration(),
                  child: Column(
                    children: [
                      statRow(AppStrings.totalReferrals.tr, "${referrals["total"] ?? 0}"),
                      statRow(AppStrings.awaitingWatchTime.tr, "${referrals["awaitingWatchTimeMilestone"] ?? 0}"),
                      statRow(AppStrings.completedBothStages.tr, "${referrals["completedBothStages"] ?? 0}"),
                      statRow(AppStrings.flaggedReferrals.tr, "${referrals["flagged"] ?? 0}"),
                      statRow(AppStrings.totalEarnings.tr, "${AppStrings.currencySymbol} ${(referrals["totalEarningsInr"] as num? ?? 0).toStringAsFixed(2)}"),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
                Text(AppStrings.licenseDetails.tr, style: GoogleFonts.urbanist(fontSize: 16, fontWeight: FontWeight.bold)),
                const SizedBox(height: 10),
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: cardDecoration(),
                  child: Column(
                    children: [
                      statRow(AppStrings.licenseFeePaid.tr, "${AppStrings.currencySymbol} ${(license["feePaidInr"] as num? ?? 0).toStringAsFixed(0)}"),
                      statRow(AppStrings.activatedOn.tr, formatDate(license["activatedAt"]?.toString())),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
                Text(AppStrings.recentReferralsLabel.tr, style: GoogleFonts.urbanist(fontSize: 16, fontWeight: FontWeight.bold)),
                const SizedBox(height: 10),
                if (recentReferrals.isEmpty)
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: cardDecoration(),
                    child: Center(child: Text(AppStrings.noReferralsYet.tr, style: GoogleFonts.urbanist(fontSize: 13, color: AppColor.grey))),
                  )
                else
                  for (final r in recentReferrals) referralTile(r),
                const SizedBox(height: 20),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget statCard(String label, String value) => Container(
        padding: const EdgeInsets.all(16),
        decoration: cardDecoration(),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: GoogleFonts.urbanist(fontSize: 12, color: AppColor.grey)),
            const SizedBox(height: 6),
            Text(value, style: GoogleFonts.urbanist(fontSize: 18, fontWeight: FontWeight.bold, color: AppColor.primaryColor)),
          ],
        ),
      );

  Widget statRow(String label, String value) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 4),
        child: Row(
          children: [
            Text(label, style: GoogleFonts.urbanist(fontSize: 13, color: AppColor.grey)),
            const Spacer(),
            Text(value, style: GoogleFonts.urbanist(fontSize: 13, fontWeight: FontWeight.w600)),
          ],
        ),
      );

  Widget referralTile(Map<String, dynamic> r) {
    final stage2 = r["stage2Completed"] == true;
    final stage1 = r["stage1Completed"] == true;
    final label = stage2 ? AppStrings.completedBothStages.tr : (stage1 ? AppStrings.awaitingWatchTime.tr : "-");
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: cardDecoration(),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(r["referredUserName"]?.toString() ?? "Youpeak User", style: GoogleFonts.urbanist(fontSize: 14, fontWeight: FontWeight.w600)),
                Text(formatDate(r["createdAt"]?.toString()), style: GoogleFonts.urbanist(fontSize: 11, color: AppColor.grey)),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
            decoration: BoxDecoration(color: (stage2 ? AppColor.primaryColor : AppColor.grey).withOpacity(0.12), borderRadius: BorderRadius.circular(99)),
            child: Text(label, style: GoogleFonts.urbanist(fontSize: 11, fontWeight: FontWeight.w700, color: stage2 ? AppColor.primaryColor : AppColor.grey)),
          ),
        ],
      ),
    );
  }
}
