import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/custom/custom_method/custom_toast.dart';
import 'package:youpeak/custom/custom_ui/loader_ui.dart';
import 'package:youpeak/database/database.dart';
import 'package:youpeak/main.dart';
import 'package:youpeak/pages/login_related_page/fill_profile_page/get_profile_api.dart';
import 'package:youpeak/pages/profile_page/payment_page/razor_pay/razor_pay_view.dart';
import 'package:youpeak/pages/profile_page/tasker_tier_page/tasker_tier_api.dart';
import 'package:youpeak/utils/colors/app_color.dart';
import 'package:youpeak/utils/icons/app_icons.dart';
import 'package:youpeak/utils/icons/app_visuals.dart';
import 'package:youpeak/custom/custom_ui/app_artwork.dart';
import 'package:youpeak/utils/payment/payment_api.dart';
import 'package:youpeak/utils/settings/app_settings.dart';
import 'package:youpeak/utils/string/app_string.dart';

// Tasker Starter Pass — any Tasker can buy any paid tier directly (a paid
// instant-skip alongside the free, watch-hour-based progression), so unlike
// Creator VIP Pass there's no eligibility gate here.
class TaskerTierView extends StatefulWidget {
  const TaskerTierView({super.key});

  @override
  State<TaskerTierView> createState() => _TaskerTierViewState();
}

class _TaskerTierViewState extends State<TaskerTierView> {
  bool isLoading = true;
  List<Map<String, dynamic>> tiers = [];
  int totalWatchMinutes = 0;
  String? purchasingTierId;
  final RazorPayService _razorPayService = RazorPayService();

  @override
  void initState() {
    super.initState();
    loadTiers();
  }

  @override
  void dispose() {
    _razorPayService.dispose();
    super.dispose();
  }

  Future<void> loadTiers() async {
    setState(() => isLoading = true);
    final result = await TaskerTierApi.getAvailableTiers();
    if (!mounted) return;
    setState(() {
      isLoading = false;
      if (result["status"] == true) {
        tiers = List<Map<String, dynamic>>.from((result["tiers"] as List? ?? []).map((t) => Map<String, dynamic>.from(t)));
        totalWatchMinutes = (result["totalWatchTime"] as num?)?.toInt() ?? 0;
      }
    });
  }

  Future<void> onUpgrade(Map<String, dynamic> tier) async {
    final tierId = (tier["_id"] ?? tier["id"])?.toString();
    if (tierId == null || purchasingTierId != null) return;
    setState(() => purchasingTierId = tierId);

    final order = await PaymentApi.createOrder(purpose: "tier_upgrade", tierId: tierId);
    if (!mounted) return;
    setState(() => purchasingTierId = null);

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
          CustomToast.celebrate(AppStrings.tierUpgradeSuccess.tr, AppVisuals.partyPopper);
          await loadTiers();
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

  BoxDecoration cardDecoration({bool highlighted = false}) => BoxDecoration(
        color: isDarkMode.value ? AppColor.secondDarkMode : AppColor.white,
        borderRadius: BorderRadius.circular(16),
        border: highlighted ? Border.all(color: AppColor.primaryColor, width: 1.5) : null,
        boxShadow: [BoxShadow(color: isDarkMode.value ? AppColor.transparent : AppColor.grey_200, blurRadius: 10)],
      );

  @override
  Widget build(BuildContext context) {
    final watchHours = totalWatchMinutes / 60;
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
        title: Text(AppStrings.starterPass.tr, style: GoogleFonts.urbanist(fontSize: 18, fontWeight: FontWeight.bold)),
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
                      const FeatureArtwork(asset: AppVisuals.taskerHero),
                      Text(AppStrings.starterPassSubtitle.tr, style: GoogleFonts.urbanist(fontSize: 13, color: AppColor.grey)),
                      const SizedBox(height: 12),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                        decoration: cardDecoration(),
                        child: Row(
                          children: [
                            Image.asset(AppIcons.timeCircle, width: 20, height: 20),
                            const SizedBox(width: 10),
                            Text(AppStrings.lifetimeWatchHours.tr, style: GoogleFonts.urbanist(fontSize: 14, fontWeight: FontWeight.w600)),
                            const Spacer(),
                            Text(
                              "${watchHours.toStringAsFixed(1)} hrs",
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
    final adLimit = (tier["dailyAdLimit"] as num?)?.toInt() ?? 0;
    final likeLimit = (tier["dailyLikeLimit"] as num?)?.toInt() ?? 0;
    final commentLimit = (tier["dailyCommentLimit"] as num?)?.toInt() ?? 0;
    final earnCapCoins = (tier["dailyEarningCapInCoins"] as num?)?.toInt() ?? 0;
    final earnCapInr = (tier["dailyEarningCapInINR"] as num?)?.toDouble() ?? 0;
    final adCredits = (tier["adCreditsGranted"] as num?)?.toInt() ?? 0;
    final isCurrent = tier["isCurrentTier"] == true;
    final isPurchasing = purchasingTierId == tierId;

    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.all(18),
      decoration: cardDecoration(highlighted: isCurrent),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Image.asset(AppVisuals.taskerTier(name), width: 44, height: 44),
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
            price > 0 ? "${AppStrings.currencySymbol} ${price.toStringAsFixed(0)}" : AppStrings.freePass.tr,
            style: GoogleFonts.urbanist(fontSize: 20, fontWeight: FontWeight.w800, color: AppColor.primaryColor),
          ),
          const SizedBox(height: 12),
          statRow(AppStrings.dailyAdLimit.tr, "$adLimit"),
          statRow(AppStrings.dailyLikeLimit.tr, "$likeLimit"),
          statRow(AppStrings.dailyCommentLimit.tr, "$commentLimit"),
          statRow(AppStrings.dailyEarningCap.tr, "$earnCapCoins coins (${AppStrings.currencySymbol} ${earnCapInr.toStringAsFixed(2)})"),
          if (adCredits > 0) statRow(AppStrings.adCreditsGranted.tr, "$adCredits"),
          const SizedBox(height: 14),
          if (!isCurrent && price > 0)
            GestureDetector(
              onTap: isPurchasing ? null : () => onUpgrade(tier),
              child: Container(
                height: 44,
                alignment: Alignment.center,
                decoration: BoxDecoration(color: AppColor.primaryColor, borderRadius: BorderRadius.circular(99)),
                child: isPurchasing
                    ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: AppColor.white))
                    : Text(AppStrings.upgradeNow.tr, style: GoogleFonts.urbanist(fontSize: 14, fontWeight: FontWeight.bold, color: AppColor.white)),
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
