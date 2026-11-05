import 'package:youpeak/shared/widgets/app_icon.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:youpeak/core/payment/payment_api.dart';
import 'package:youpeak/core/payment/razorpay/razorpay_service.dart';
import 'package:youpeak/core/platform/platform_info.dart';
import 'package:youpeak/core/storage/database/database.dart';
import 'package:youpeak/core/utils/custom_toast.dart';
import 'package:youpeak/features/profile/api/get_profile_api.dart';
import 'package:youpeak/shared/widgets/loader_ui.dart';
import 'package:youpeak/main.dart';
import 'package:youpeak/features/tiers/api/tasker_tier_api.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:youpeak/core/assets/app_icons.dart';
import 'package:youpeak/core/assets/app_visuals.dart';
import 'package:youpeak/shared/widgets/app_artwork.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'package:youpeak/core/constants/app_string.dart';
import 'package:youpeak/core/membership/membership_portal.dart';

// Prices and caps here are in rupees (the tiers are priced in INR and paid
// through Razorpay in INR), whatever display currency the admin picked.
//
// Tasker Starter Pass — a level is reached EITHER by buying its pass OR for
// free with cumulative lifetime watch hours (checked by the server on every
// credited watch heartbeat). Prices, limits and Ad Credits come from the
// server's tier configuration (membershipTiers), never from the app.
//
// Buying: in the web app, the same server-verified checkout the website uses
// for coins (createOrder → Razorpay → verify; the server activates the level
// only for a verified, captured payment of that exact order, once). The
// phone app sends the buyer to the membership portal (store-billing rules).
class TaskerTierView extends StatefulWidget {
  const TaskerTierView({super.key});

  @override
  State<TaskerTierView> createState() => _TaskerTierViewState();
}

class _TaskerTierViewState extends State<TaskerTierView> {
  bool isLoading = true;
  String? loadError;
  List<Map<String, dynamic>> tiers = [];
  int totalWatchMinutes = 0;
  int currentLevel = 1;
  String? purchasingTierId;
  String? notice; // e.g. "confirming your payment"
  final RazorPayService _razorPay = RazorPayService();

  static final _inr = NumberFormat.decimalPattern("en_IN");

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
    setState(() {
      isLoading = true;
      loadError = null;
    });
    final result = await TaskerTierApi.getAvailableTiers();
    if (!mounted) return;
    setState(() {
      isLoading = false;
      if (result["status"] == true) {
        tiers = List<Map<String, dynamic>>.from((result["tiers"] as List? ?? []).map((t) => Map<String, dynamic>.from(t)));
        tiers.sort((a, b) => ((a["level"] as num?) ?? 0).compareTo((b["level"] as num?) ?? 0));
        totalWatchMinutes = (result["totalWatchTime"] as num?)?.toInt() ?? 0;
        currentLevel = (result["currentLevel"] as num?)?.toInt() ?? (tiers.firstWhereOrNull((t) => t["isCurrentTier"] == true)?["level"] as num?)?.toInt() ?? 1;
      } else {
        loadError = result["message"]?.toString() ?? "We couldn't load the passes.";
      }
    });
  }

  Future<void> onUpgrade(Map<String, dynamic> tier) async {
    final tierId = (tier["_id"] ?? tier["id"])?.toString();
    if (tierId == null || purchasingTierId != null) return;
    setState(() {
      purchasingTierId = tierId;
      notice = null;
    });
    try {
      if (!PlatformInfo.isWeb) {
        // Store compliance: passes are bought on the membership portal.
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
          if (verify["status"] == true) {
            CustomToast.show("${tier["tierName"] ?? "Pass"} is active.");
          } else {
            // Paid but not confirmed yet (e.g. a dropped connection): the
            // payment webhook activates it; nothing is charged twice.
            setState(() => notice = "We're confirming your payment. Your new level will show here shortly — you won't be charged again.");
          }
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
        title: Text(AppStrings.starterPass.tr, style: GoogleFonts.urbanist(fontSize: 20, fontWeight: FontWeight.bold)),
        centerTitle: AppSettings.isCenterTitle,
      ),
      body: isLoading
          ? const LoaderUi()
          : loadError != null
              ? _ErrorBox(message: loadError!, onRetry: loadTiers)
              : LayoutBuilder(builder: (context, box) {
                  final wide = box.maxWidth >= 760;
                  return RefreshIndicator(
                    color: AppColor.primaryColor,
                    onRefresh: loadTiers,
                    child: ListView(
                      physics: const AlwaysScrollableScrollPhysics(),
                      padding: EdgeInsets.symmetric(horizontal: wide ? 28 : 20, vertical: 12),
                      children: [
                        if (!wide) const FeatureArtwork(asset: AppVisuals.taskerHero),
                        Text(AppStrings.starterPassSubtitle.tr, style: GoogleFonts.urbanist(fontSize: wide ? 16 : 13, color: AppColor.grey)),
                        const SizedBox(height: 14),
                        _ProgressCard(watchHours: totalWatchMinutes / 60, next: tiers.firstWhereOrNull((t) => ((t["level"] as num?) ?? 0) == currentLevel + 1), wide: wide),
                        if (notice != null) ...[
                          const SizedBox(height: 12),
                          _Notice(text: notice!),
                        ],
                        const SizedBox(height: 12),
                        _InfoNote(wide: wide),
                        const SizedBox(height: 18),
                        if (wide)
                          Wrap(
                            spacing: 16,
                            runSpacing: 16,
                            children: [
                              for (final t in tiers)
                                SizedBox(width: _cardWidth(box.maxWidth - 56), child: tierCard(t)),
                            ],
                          )
                        else
                          for (final t in tiers) Padding(padding: const EdgeInsets.only(bottom: 14), child: tierCard(t)),
                        const SizedBox(height: 24),
                      ],
                    ),
                  );
                }),
    );
  }

  double _cardWidth(double available) {
    final columns = (available / 300).floor().clamp(1, 5);
    return (available - 16 * (columns - 1)) / columns;
  }

  BoxDecoration cardDecoration({bool highlighted = false}) => BoxDecoration(
        color: isDarkMode.value ? AppColor.secondDarkMode : AppColor.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: highlighted ? AppColor.primaryColor : (isDarkMode.value ? Colors.white12 : const Color(0xFFE6E9E7)), width: highlighted ? 2 : 1),
        boxShadow: [BoxShadow(color: isDarkMode.value ? AppColor.transparent : AppColor.grey_200, blurRadius: 10)],
      );

  Widget tierCard(Map<String, dynamic> tier) {
    final tierId = (tier["_id"] ?? tier["id"])?.toString() ?? "";
    final name = tier["tierName"]?.toString() ?? "";
    final level = (tier["level"] as num?)?.toInt() ?? 1;
    final price = (tier["membershipPrice"] as num?)?.toDouble() ?? 0;
    final adLimit = (tier["dailyAdLimit"] as num?)?.toInt() ?? 0;
    final likeLimit = (tier["dailyLikeLimit"] as num?)?.toInt() ?? 0;
    final commentLimit = (tier["dailyCommentLimit"] as num?)?.toInt() ?? 0;
    final earnCapCoins = (tier["dailyEarningCapInCoins"] as num?)?.toInt() ?? 0;
    final earnCapInr = (tier["dailyEarningCapInINR"] as num?)?.toDouble() ?? 0;
    final adCredits = (tier["adCreditsGranted"] as num?)?.toInt() ?? 0;
    final hours = (tier["watchHoursToUpgrade"] as num?)?.toInt() ?? 0;
    final isCurrent = tier["isCurrentTier"] == true || level == currentLevel;
    final isIncluded = tier["isIncluded"] == true || level < currentLevel;
    final canPurchase = tier["canPurchase"] == true || (level > currentLevel && price > 0);
    final isPurchasing = purchasingTierId == tierId;
    final hoursLeft = (tier["watchHoursRemaining"] as num?)?.toDouble();

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: cardDecoration(highlighted: isCurrent),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Image.asset(AppVisuals.taskerTier(name), width: 44, height: 44),
              const SizedBox(width: 12),
              Expanded(child: Text(name, style: GoogleFonts.urbanist(fontSize: 18, fontWeight: FontWeight.bold))),
              if (isCurrent)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(color: AppColor.primaryColor.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(99)),
                  child: Text(AppStrings.currentTier.tr, style: GoogleFonts.urbanist(fontSize: 12, fontWeight: FontWeight.w700, color: AppColor.primaryColor)),
                ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            price > 0 ? "₹ ${_inr.format(price)}" : AppStrings.freePass.tr,
            style: GoogleFonts.urbanist(fontSize: 24, fontWeight: FontWeight.w800, color: AppColor.primaryColor),
          ),
          if (hours > 0)
            Text("or free at $hours lifetime watch hours", style: GoogleFonts.urbanist(fontSize: 13, color: AppColor.grey)),
          const SizedBox(height: 12),
          statRow(AppStrings.dailyEarningCap.tr, "${_inr.format(earnCapCoins)} coins (₹ ${earnCapInr.toStringAsFixed(2)})"),
          statRow(AppStrings.dailyLikeLimit.tr, "$likeLimit"),
          statRow(AppStrings.dailyCommentLimit.tr, "$commentLimit"),
          statRow("${AppStrings.dailyAdLimit.tr} (app only)", "$adLimit"),
          if (adCredits > 0) statRow(AppStrings.adCreditsGranted.tr, _inr.format(adCredits)),
          const SizedBox(height: 14),
          if (isCurrent)
            _StateLine(icon: Icons.check_circle_rounded, text: "This is your level")
          else if (isIncluded)
            _StateLine(icon: Icons.done_all_rounded, text: "Included in your current level")
          else if (canPurchase)
            SizedBox(
              width: double.infinity,
              height: 46,
              child: FilledButton(
                style: FilledButton.styleFrom(backgroundColor: AppColor.primaryColor, shape: const StadiumBorder()),
                onPressed: isPurchasing || purchasingTierId != null ? null : () => onUpgrade(tier),
                child: isPurchasing
                    ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: AppColor.white))
                    : Text("${AppStrings.upgradeNow.tr} · ₹ ${_inr.format(price)}",
                        style: GoogleFonts.urbanist(fontSize: 15, fontWeight: FontWeight.bold)),
              ),
            ),
          if (!isCurrent && !isIncluded && hoursLeft != null && hoursLeft > 0)
            Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Text("${hoursLeft.toStringAsFixed(1)} more watch hours to unlock it free",
                  style: GoogleFonts.urbanist(fontSize: 13, color: AppColor.grey)),
            ),
        ],
      ),
    );
  }

  Widget statRow(String label, String value) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 4),
        child: Row(
          children: [
            Expanded(child: Text(label, style: GoogleFonts.urbanist(fontSize: 14, color: AppColor.grey))),
            Text(value, style: GoogleFonts.urbanist(fontSize: 14, fontWeight: FontWeight.w700)),
          ],
        ),
      );
}

class _ProgressCard extends StatelessWidget {
  const _ProgressCard({required this.watchHours, required this.next, required this.wide});

  final double watchHours;
  final Map<String, dynamic>? next;
  final bool wide;

  @override
  Widget build(BuildContext context) {
    final target = (next?["watchHoursToUpgrade"] as num?)?.toDouble() ?? 0;
    final progress = target > 0 ? (watchHours / target).clamp(0.0, 1.0) : 1.0;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDarkMode.value ? AppColor.secondDarkMode : AppColor.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: isDarkMode.value ? Colors.white12 : const Color(0xFFE6E9E7)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Image.asset(AppIcons.timeCircle, width: 22, height: 22),
              const SizedBox(width: 10),
              Expanded(child: Text(AppStrings.lifetimeWatchHours.tr, style: GoogleFonts.urbanist(fontSize: wide ? 16 : 14, fontWeight: FontWeight.w700))),
              Text(target > 0 ? "${watchHours.toStringAsFixed(1)} / ${target.toStringAsFixed(0)} hrs" : "${watchHours.toStringAsFixed(1)} hrs",
                  style: GoogleFonts.urbanist(fontSize: wide ? 18 : 16, fontWeight: FontWeight.bold, color: AppColor.primaryColor)),
            ],
          ),
          if (target > 0) ...[
            const SizedBox(height: 10),
            ClipRRect(
              borderRadius: BorderRadius.circular(6),
              child: LinearProgressIndicator(value: progress, minHeight: 8, backgroundColor: AppColor.primaryColor.withValues(alpha: 0.12), color: AppColor.primaryColor),
            ),
            const SizedBox(height: 6),
            Text("Free upgrade to ${next?["tierName"] ?? "the next level"} at ${target.toStringAsFixed(0)} lifetime hours. Hours never reset.",
                style: GoogleFonts.urbanist(fontSize: 13, color: AppColor.grey)),
          ],
        ],
      ),
    );
  }
}

class _InfoNote extends StatelessWidget {
  const _InfoNote({required this.wide});

  final bool wide;

  @override
  Widget build(BuildContext context) {
    return Text(
      "A level unlocks when you buy its pass OR reach its watch hours — either one is enough. "
      "Rewarded video ads are available in the mobile app; check-in, likes, comments and watch time also earn on the web.",
      style: GoogleFonts.urbanist(fontSize: wide ? 14 : 13, height: 1.45, color: AppColor.grey),
    );
  }
}

class _StateLine extends StatelessWidget {
  const _StateLine({required this.icon, required this.text});

  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) {
    return Row(children: [
      Icon(icon, color: AppColor.primaryColor, size: 20),
      const SizedBox(width: 8),
      Text(text, style: GoogleFonts.urbanist(fontSize: 14, fontWeight: FontWeight.w700, color: AppColor.primaryColor)),
    ]);
  }
}

class _Notice extends StatelessWidget {
  const _Notice({required this.text});

  final String text;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(color: AppColor.goldVipAccent.withValues(alpha: 0.18), borderRadius: BorderRadius.circular(12)),
      child: Row(children: [
        const AppIcon(AppIcons.extraPending, size: 24),
        const SizedBox(width: 8),
        Expanded(child: Text(text, style: GoogleFonts.urbanist(fontSize: 14, fontWeight: FontWeight.w600))),
      ]),
    );
  }
}

class _ErrorBox extends StatelessWidget {
  const _ErrorBox({required this.message, required this.onRetry});

  final String message;
  final Future<void> Function() onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          const Icon(Icons.cloud_off_rounded, size: 40, color: Colors.grey),
          const SizedBox(height: 10),
          Text(message, textAlign: TextAlign.center, style: GoogleFonts.urbanist(fontSize: 15)),
          const SizedBox(height: 12),
          OutlinedButton.icon(onPressed: onRetry, icon: const AppIcon(AppIcons.extraRetry, size: 20), label: const Text("Retry")),
        ]),
      ),
    );
  }
}
