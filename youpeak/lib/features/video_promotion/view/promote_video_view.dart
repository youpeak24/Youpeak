import 'package:flutter/material.dart';
import 'package:youpeak/shared/widgets/app_artwork.dart';
import 'package:youpeak/core/assets/app_visuals.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/core/utils/custom_toast.dart';
import 'package:youpeak/shared/widgets/loader_ui.dart';
import 'package:youpeak/core/storage/database/database.dart';
import 'package:youpeak/main.dart';
import 'package:youpeak/features/profile/api/get_profile_api.dart';
import 'package:youpeak/core/payment/razor_pay_view.dart';
import 'package:youpeak/features/video_promotion/api/video_promotion_api.dart';
import 'package:youpeak/features/channel/api/channel_home_api.dart';
import 'package:youpeak/features/channel/model/channel_home_model.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:youpeak/core/payment/payment_api.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'package:youpeak/core/constants/app_string.dart';

// Estimated-reach copy from the rate card (DOC-20260826-WA0214) — display
// only, not tracked/guaranteed server-side, same as the doc itself frames it.
const Map<String, String> _kPlanImpressionRanges = {
  "Starter Plan": "2,000 – 2,500 impressions",
  "Basic Plan": "3,000 – 3,500 impressions",
  "Pro Starter": "3,000 – 5,000 impressions",
  "Boost Plan": "3,000 – 8,000 impressions",
  "Weekly Mega": "50,000 – 75,000 impressions",
  "Monthly Pro": "200,000 – 250,000 impressions",
};

class PromoteVideoView extends StatefulWidget {
  const PromoteVideoView({super.key});

  @override
  State<PromoteVideoView> createState() => _PromoteVideoViewState();
}

class _PromoteVideoViewState extends State<PromoteVideoView> {
  bool isLoading = true;
  List<Map<String, dynamic>> campaigns = [];
  List<Map<String, dynamic>> plans = [];
  bool isPurchasing = false;
  final RazorPayService _razorPayService = RazorPayService();

  @override
  void initState() {
    super.initState();
    loadAll();
  }

  @override
  void dispose() {
    _razorPayService.dispose();
    super.dispose();
  }

  Future<void> loadAll() async {
    setState(() => isLoading = true);
    final results = await Future.wait([
      VideoPromotionApi.getMyCampaigns(),
      VideoPromotionApi.getPlans(),
    ]);
    if (!mounted) return;
    final campaignsResult = results[0];
    final plansResult = results[1];
    setState(() {
      isLoading = false;
      campaigns = campaignsResult["status"] == true
          ? List<Map<String, dynamic>>.from((campaignsResult["campaigns"] as List? ?? []).map((e) => Map<String, dynamic>.from(e)))
          : [];
      plans = plansResult["status"] == true
          ? List<Map<String, dynamic>>.from((plansResult["plans"] as List? ?? []).map((e) => Map<String, dynamic>.from(e)))
          : [];
    });
  }

  Future<void> openVideoPicker() async {
    if (plans.isEmpty) {
      CustomToast.show(AppStrings.someThingWentWrong.tr);
      return;
    }
    Get.dialog(const LoaderUi(), barrierDismissible: false);
    final result = await ChannelHomeApi.callApi(Database.loginUserId ?? "", Database.channelId ?? "");
    if (Get.isDialogOpen == true) Get.back();
    if (!mounted) return;

    final videos = result?.detailsOfChannel ?? <DetailsOfChannel>[];
    if (videos.isEmpty) {
      CustomToast.show(AppStrings.noVideosToPromote.tr);
      return;
    }

    Get.bottomSheet(
      Obx(
        () => _PickerSheet(
          title: AppStrings.selectVideoToPromote.tr,
          isDarkMode: isDarkMode.value,
          itemCount: videos.length,
          itemBuilder: (i) {
            final v = videos[i];
            return ListTile(
              leading: ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: Image.network(v.videoImage ?? "", width: 56, height: 40, fit: BoxFit.cover,
                    errorBuilder: (c, e, s) => Container(width: 56, height: 40, color: AppColor.grey_200)),
              ),
              title: Text(v.title ?? "", maxLines: 1, overflow: TextOverflow.ellipsis, style: GoogleFonts.urbanist(fontSize: 14, fontWeight: FontWeight.w600)),
              onTap: () {
                Get.back();
                openPlanPicker(videoId: v.id ?? "", videoTitle: v.title ?? "");
              },
            );
          },
        ),
      ),
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.only(topLeft: Radius.circular(25), topRight: Radius.circular(25))),
    );
  }

  void openPlanPicker({required String videoId, required String videoTitle}) {
    Get.bottomSheet(
      Obx(
        () => _PickerSheet(
          title: AppStrings.selectAPlan.tr,
          isDarkMode: isDarkMode.value,
          itemCount: plans.length,
          itemBuilder: (i) {
            final p = plans[i];
            final planName = p["planName"]?.toString() ?? "";
            final price = (p["priceINR"] as num?)?.toStringAsFixed(0) ?? "0";
            final days = p["durationDays"]?.toString() ?? "";
            return ListTile(
              title: Text(planName, style: GoogleFonts.urbanist(fontSize: 15, fontWeight: FontWeight.bold)),
              subtitle: Text(
                "$days ${AppStrings.daysLabel.tr} • ${_kPlanImpressionRanges[planName] ?? ""}",
                style: GoogleFonts.urbanist(fontSize: 12, color: AppColor.grey),
              ),
              trailing: Text("${AppStrings.currencySymbol} $price", style: GoogleFonts.urbanist(fontSize: 16, fontWeight: FontWeight.w800, color: AppColor.primaryColor)),
              onTap: () {
                Get.back();
                purchasePromotion(videoId: videoId, planName: planName);
              },
            );
          },
        ),
      ),
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.only(topLeft: Radius.circular(25), topRight: Radius.circular(25))),
    );
  }

  Future<void> purchasePromotion({required String videoId, required String planName}) async {
    if (isPurchasing) return;
    setState(() => isPurchasing = true);
    final order = await PaymentApi.createOrder(purpose: "video_promotion", videoId: videoId, planName: planName);
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
          CustomToast.show(AppStrings.promotionActivated.tr);
          await loadAll();
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

  Color statusColor(String status) {
    switch (status) {
      case "active":
        return AppColor.primaryColor;
      case "rejected":
        return Colors.redAccent;
      case "expired":
        return AppColor.grey;
      default:
        return Colors.orange;
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
          child: Obx(() => Icon(Icons.arrow_back, color: isDarkMode.value ? AppColor.white : AppColor.black).paddingOnly(left: 15)),
          onTap: () => Get.back(),
        ),
        leadingWidth: 33,
        title: Text(AppStrings.videoPromotionTitle.tr, style: GoogleFonts.urbanist(fontSize: 18, fontWeight: FontWeight.bold)),
        centerTitle: AppSettings.isCenterTitle,
      ),
      body: isLoading
          ? const LoaderUi()
          : RefreshIndicator(
              onRefresh: loadAll,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: Obx(
                    () => Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const FeatureArtwork(asset: AppVisuals.promoteHero),
                        GestureDetector(
                          onTap: isPurchasing ? null : openVideoPicker,
                          child: Container(
                            height: 48,
                            alignment: Alignment.center,
                            decoration: BoxDecoration(color: AppColor.primaryColor, borderRadius: BorderRadius.circular(99)),
                            child: isPurchasing
                                ? const SizedBox(height: 22, width: 22, child: CircularProgressIndicator(strokeWidth: 2, color: AppColor.white))
                                : Text(AppStrings.promoteAVideo.tr, style: GoogleFonts.urbanist(color: AppColor.white, fontWeight: FontWeight.bold, fontSize: 16)),
                          ),
                        ),
                        const SizedBox(height: 24),
                        Text(AppStrings.myPromotionsLabel.tr, style: GoogleFonts.urbanist(fontSize: 16, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 10),
                        if (campaigns.isEmpty)
                          Container(
                            padding: const EdgeInsets.all(20),
                            decoration: BoxDecoration(
                              color: isDarkMode.value ? AppColor.secondDarkMode : AppColor.white,
                              borderRadius: BorderRadius.circular(16),
                              boxShadow: [BoxShadow(color: isDarkMode.value ? AppColor.transparent : AppColor.grey_200, blurRadius: 10)],
                            ),
                            child: Center(child: Text(AppStrings.noPromotionsYet.tr, style: GoogleFonts.urbanist(fontSize: 13, color: AppColor.grey))),
                          )
                        else
                          for (final c in campaigns) _campaignTile(c),
                        const SizedBox(height: 20),
                      ],
                    ),
                  ),
                ),
              ),
            ),
    );
  }

  Widget _campaignTile(Map<String, dynamic> c) {
    final status = c["status"]?.toString() ?? "";
    final videoData = c["videoId"];
    final title = videoData is Map ? (videoData["title"]?.toString() ?? "") : "";
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: isDarkMode.value ? AppColor.secondDarkMode : AppColor.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [BoxShadow(color: isDarkMode.value ? AppColor.transparent : AppColor.grey_200, blurRadius: 10)],
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title.isEmpty ? (c["planName"]?.toString() ?? "") : title, maxLines: 1, overflow: TextOverflow.ellipsis, style: GoogleFonts.urbanist(fontSize: 14, fontWeight: FontWeight.w600)),
                const SizedBox(height: 2),
                Text("${c["planName"] ?? ""} • ${AppStrings.currencySymbol} ${(c["planPriceINR"] as num?)?.toStringAsFixed(0) ?? ""}", style: GoogleFonts.urbanist(fontSize: 12, color: AppColor.grey)),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
            decoration: BoxDecoration(color: statusColor(status).withOpacity(0.12), borderRadius: BorderRadius.circular(99)),
            child: Text(status.toUpperCase(), style: GoogleFonts.urbanist(fontSize: 11, fontWeight: FontWeight.w700, color: statusColor(status))),
          ),
        ],
      ),
    );
  }
}

class _PickerSheet extends StatelessWidget {
  final String title;
  final bool isDarkMode;
  final int itemCount;
  final Widget Function(int index) itemBuilder;

  const _PickerSheet({required this.title, required this.isDarkMode, required this.itemCount, required this.itemBuilder});

  @override
  Widget build(BuildContext context) {
    return Container(
      constraints: BoxConstraints(maxHeight: MediaQuery.of(context).size.height * 0.6),
      decoration: BoxDecoration(
        color: isDarkMode ? AppColor.secondDarkMode : AppColor.white,
        borderRadius: const BorderRadius.only(topLeft: Radius.circular(25), topRight: Radius.circular(25)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const SizedBox(height: 12),
          Container(width: 30, height: 3, decoration: BoxDecoration(borderRadius: BorderRadius.circular(60), color: AppColor.grey_300)),
          const SizedBox(height: 10),
          Text(title, style: GoogleFonts.urbanist(fontSize: 16, fontWeight: FontWeight.bold)),
          const Divider(),
          Flexible(
            child: ListView.builder(
              shrinkWrap: true,
              itemCount: itemCount,
              itemBuilder: (context, i) => itemBuilder(i),
            ),
          ),
          const SizedBox(height: 10),
        ],
      ),
    );
  }
}
