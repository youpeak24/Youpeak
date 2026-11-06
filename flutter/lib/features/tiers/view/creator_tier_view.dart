import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/shared/widgets/loader_ui.dart';
import 'package:youpeak/main.dart';
import 'package:youpeak/features/tiers/api/creator_tier_api.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:youpeak/core/assets/app_icons.dart';
import 'package:youpeak/core/assets/app_visuals.dart';
import 'package:youpeak/shared/widgets/app_artwork.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'package:youpeak/core/constants/app_string.dart';
import 'package:youpeak/core/membership/membership_portal.dart';
import 'package:youpeak/core/payment/payment_api.dart';
import 'package:youpeak/core/payment/razorpay/razorpay_service.dart';
import 'package:youpeak/core/platform/platform_info.dart';
import 'package:youpeak/core/storage/database/database.dart';
import 'package:youpeak/core/utils/custom_toast.dart';
import 'package:youpeak/features/profile/api/get_profile_api.dart';

// Creator VIP Pass — subscriber-gated ad-revenue-share upgrade.
class CreatorTierView extends StatefulWidget {
  const CreatorTierView({super.key});

  @override
  State<CreatorTierView> createState() => _CreatorTierViewState();
}

class _CreatorTierViewState extends State<CreatorTierView> {
  bool isLoading = true;
  List<Map<String, dynamic>> tiers = [];
  int userSubscribers = 0;
  String? purchasingTierId;
  final RazorPayService _razorPay = RazorPayService();

  @override
  void initState() {
    super.initState();
    loadTiers();
  }

  @override
  void dispose() {
    _razorPay.dispose();
    super.dispose();
  }

  Future<void> loadTiers() async {
    setState(() => isLoading = true);
    final result = await CreatorTierApi.getAvailableTiers();
    if (!mounted) return;
    setState(() {
      isLoading = false;
      if (result["status"] == true) {
        tiers = List<Map<String, dynamic>>.from((result["tiers"] as List? ?? []).map((t) => Map<String, dynamic>.from(t)));
        userSubscribers = (result["userSubscribers"] as num?)?.toInt() ?? 0;
      }
    });
  }

  // Store compliance: the Android / iOS apps never take the payment — the pass
  // is bought on the web portal. The web app (the portal itself) pays with
  // Razorpay directly: server-priced order -> checkout -> signature verify.
  // The tier shows up here once the payment is confirmed.
  Future<void> onUpgrade(Map<String, dynamic> tier) async {
    final tierId = (tier["_id"] ?? tier["id"])?.toString();
    if (tierId == null || purchasingTierId != null) return;
    setState(() => purchasingTierId = tierId);
    try {
      if (!PlatformInfo.isWeb) {
        await MembershipPortal.open(plan: tierId);
        return;
      }
      final order = await PaymentApi.createOrder(purpose: "tier_upgrade", tierId: tierId);
      if (!mounted) return;
      if (order["status"] != true || order["checkout"] == null) {
        CustomToast.show(order["message"]?.toString() ?? "Payment couldn't be started. Please try again.");
        return;
      }
      _razorPay.openCheckout(
        checkout: Map<String, dynamic>.from(order["checkout"]),
        appName: "YouPeak",
        email: GetProfileApi.profileModel?.user?.email,
        contact: GetProfileApi.profileModel?.user?.mobileNumber,
        onSuccess: (response) async {
          if (!mounted) return;
          Get.dialog(const LoaderUi(), barrierDismissible: false);
          final verify = await PaymentApi.verify(orderId: response.orderId ?? "", paymentId: response.paymentId ?? "", signature: response.signature ?? "");
          if (Get.isDialogOpen == true) Get.back();
          if (!mounted) return;
          CustomToast.show(verify["status"] == true
              ? "${tier["tierName"] ?? "Pass"} is active."
              : "We're confirming your payment. Your pass will show here shortly — you won't be charged again.");
          await GetProfileApi.callApi(Database.loginUserId ?? "");
          await loadTiers();
        },
        onError: (message) {
          if (!mounted) return;
          CustomToast.show(message.isEmpty ? "Payment cancelled — nothing was charged." : message);
        },
      );
    } finally {
      if (mounted) setState(() => purchasingTierId = null);
    }
  }

  BoxDecoration cardDecoration({bool highlighted = false}) => BoxDecoration(
        color: isDarkMode.value ? AppColor.secondDarkMode : AppColor.white,
        borderRadius: BorderRadius.circular(16),
        border: highlighted ? Border.all(color: AppColor.primaryColor, width: 1.5) : null,
        boxShadow: [BoxShadow(color: isDarkMode.value ? AppColor.transparent : AppColor.grey_200, blurRadius: 10)],
      );

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
        title: Text(AppStrings.creatorVipPass.tr, style: GoogleFonts.urbanist(fontSize: 18, fontWeight: FontWeight.bold)),
        centerTitle: AppSettings.isCenterTitle,
      ),
      body: isLoading
          ? const LoaderUi()
          : SingleChildScrollView(
              physics: const BouncingScrollPhysics(),
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Obx(
                  () => Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const FeatureArtwork(asset: AppVisuals.creatorHero),
                      Text(AppStrings.creatorVipPassSubtitle.tr, style: GoogleFonts.urbanist(fontSize: 13, color: AppColor.grey)),
                      const SizedBox(height: 12),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                        decoration: cardDecoration(),
                        child: Row(
                          children: [
                            Image.asset(AppIcons.king, width: 22, height: 22),
                            const SizedBox(width: 10),
                            Text(AppStrings.yourSubscribers.tr, style: GoogleFonts.urbanist(fontSize: 14, fontWeight: FontWeight.w600)),
                            const Spacer(),
                            Text(
                              "$userSubscribers",
                              style: GoogleFonts.urbanist(fontSize: 16, fontWeight: FontWeight.bold, color: AppColor.primaryColor),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 20),
                      for (final tier in tiers) tierCard(tier),
                      const SizedBox(height: 20),
                    ],
                  ),
                ),
              ),
            ),
    );
  }

  Widget tierCard(Map<String, dynamic> tier) {
    final tierId = (tier["_id"] ?? tier["id"])?.toString() ?? "";
    final name = tier["tierName"]?.toString() ?? "";
    final price = (tier["membershipPrice"] as num?)?.toDouble() ?? 0;
    final minSubs = (tier["minSubscribersRequired"] as num?)?.toInt() ?? 0;
    final maxSubs = (tier["maxSubscribers"] as num?)?.toInt();
    final creatorPct = (tier["creatorRevenueSharePercentage"] as num?)?.toInt() ?? 0;
    final companyPct = (tier["companyRevenueSharePercentage"] as num?)?.toInt() ?? 0;
    final maxPerVideo = (tier["maxEarningPerVideoInINR"] as num?)?.toDouble() ?? 0;
    final isEligible = tier["isEligible"] == true;
    final isCurrent = tier["isCurrentTier"] == true;
    final isPurchasing = purchasingTierId == tierId;

    final subsRange = maxSubs == null
        ? "$minSubs+"
        : "$minSubs - $maxSubs";

    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.all(18),
      decoration: cardDecoration(highlighted: isCurrent),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Image.asset(AppVisuals.creatorTier(name), width: 44, height: 44),
              const SizedBox(width: 12),
              Expanded(
                child: Text(name, style: GoogleFonts.urbanist(fontSize: 17, fontWeight: FontWeight.bold)),
              ),
              if (isCurrent)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(color: AppColor.primaryColor.withOpacity(0.15), borderRadius: BorderRadius.circular(99)),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Image.asset(AppVisuals.medal, width: 14, height: 14),
                      const SizedBox(width: 3),
                      Text(AppStrings.currentTier.tr, style: GoogleFonts.urbanist(fontSize: 11, fontWeight: FontWeight.w700, color: AppColor.primaryColor)),
                    ],
                  ),
                ),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            price > 0 ? "${AppStrings.currencySymbol} ${price.toStringAsFixed(0)}/mo" : AppStrings.freePass.tr,
            style: GoogleFonts.urbanist(fontSize: 20, fontWeight: FontWeight.w800, color: AppColor.primaryColor),
          ),
          const SizedBox(height: 12),
          statRow(AppStrings.yourSubscribers.tr, subsRange),
          statRow(AppStrings.adRevenueShare.tr, "$creatorPct% / $companyPct%"),
          statRow(AppStrings.maxPerVideo.tr, "${AppStrings.currencySymbol} ${maxPerVideo.toStringAsFixed(0)}"),
          const SizedBox(height: 14),
          if (!isCurrent)
            GestureDetector(
              onTap: (isEligible && price > 0 && !isPurchasing) ? () => onUpgrade(tier) : null,
              child: Container(
                height: 44,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: (isEligible && price > 0) ? AppColor.primaryColor : AppColor.grey_200,
                  borderRadius: BorderRadius.circular(99),
                ),
                child: isPurchasing
                    ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: AppColor.white))
                    : Text(
                        isEligible
                            ? (price > 0 ? AppStrings.upgradeNow.tr : "")
                            : "${minSubs - userSubscribers} ${AppStrings.subscribersNeeded.tr}",
                        style: GoogleFonts.urbanist(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          color: (isEligible && price > 0) ? AppColor.white : AppColor.grey,
                        ),
                      ),
              ),
            ),
        ],
      ),
    );
  }

  Widget statRow(String label, String value) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 3),
        child: Row(
          children: [
            Text(label, style: GoogleFonts.urbanist(fontSize: 13, color: AppColor.grey)),
            const Spacer(),
            Text(value, style: GoogleFonts.urbanist(fontSize: 13, fontWeight: FontWeight.w600)),
          ],
        ),
      );
}
