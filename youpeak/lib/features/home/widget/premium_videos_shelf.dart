import 'package:flutter/material.dart';
import 'package:youpeak/core/assets/app_visuals.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/main.dart';
import 'package:youpeak/features/home/controller/nav_home_controller.dart';
import 'package:youpeak/features/video/view/normal_video_details_view.dart';
import 'package:youpeak/core/theme/app_color.dart';

class PremiumVideosShelf extends StatelessWidget {
  const PremiumVideosShelf({super.key});

  @override
  Widget build(BuildContext context) {
    return GetBuilder<NavHomeController>(
      id: "onGetAllTabVideo",
      builder: (controller) {
        final premiumVideos = controller.allVideos.where((v) => v.videoPrivacyType == 2 || (v.videoUnlockCost != null && v.videoUnlockCost! > 0)).toList();

        if (premiumVideos.isEmpty) {
          return const SizedBox.shrink();
        }

        return Container(
          margin: const EdgeInsets.symmetric(vertical: 10),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 15),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: AppColor.goldVipAccent,
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Image.asset(AppVisuals.vipMedallion, width: 16, height: 16),
                          const SizedBox(width: 3),
                          Text(
                            "VIP",
                            style: GoogleFonts.urbanist(
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                              color: AppColor.black,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      "Premium Exclusive Videos",
                      style: GoogleFonts.urbanist(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: isDarkMode.value ? AppColor.white : AppColor.primaryTextIcons,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 10),
              SizedBox(
                height: 155,
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  physics: const BouncingScrollPhysics(),
                  padding: const EdgeInsets.only(left: 15, right: 5),
                  itemCount: premiumVideos.length,
                  itemBuilder: (context, index) {
                    final video = premiumVideos[index];
                    return GestureDetector(
                      onTap: () {
                        Get.to(() => NormalVideoDetailsView(
                              videoId: video.id ?? "",
                              videoUrl: video.videoUrl ?? "",
                            ));
                      },
                      child: Container(
                        width: 220,
                        margin: const EdgeInsets.only(right: 12),
                        decoration: BoxDecoration(
                          color: isDarkMode.value ? AppColor.darkForestAccent : AppColor.white,
                          borderRadius: BorderRadius.circular(12),
                          boxShadow: [
                            BoxShadow(
                              color: AppColor.black.withValues(alpha: 0.08),
                              blurRadius: 6,
                              offset: const Offset(0, 3),
                            ),
                          ],
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Stack(
                              children: [
                                AspectRatio(
                                  aspectRatio: 16 / 9,
                                  child: ClipRRect(
                                    borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
                                    child: Image.network(
                                      video.videoImage ?? "",
                                      fit: BoxFit.cover,
                                      // web: fall back to <img> if the host sends no CORS headers
                                      webHtmlElementStrategy: WebHtmlElementStrategy.fallback,
                                      errorBuilder: (_, __, ___) => Container(
                                        color: AppColor.secondaryMintGreen,
                                        child: const Icon(Icons.play_circle_fill, color: AppColor.primaryColor, size: 40),
                                      ),
                                    ),
                                  ),
                                ),
                                Positioned(
                                  top: 6,
                                  left: 6,
                                  child: Container(
                                    padding: const EdgeInsets.fromLTRB(3, 2, 6, 2),
                                    decoration: BoxDecoration(
                                      color: AppColor.goldVipAccent,
                                      borderRadius: BorderRadius.circular(4),
                                    ),
                                    child: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        Image.asset(AppVisuals.premiumBadge, width: 14, height: 14),
                                        const SizedBox(width: 2),
                                        Text(
                                          "PREMIUM",
                                          style: GoogleFonts.urbanist(
                                            fontSize: 9,
                                            fontWeight: FontWeight.w900,
                                            color: AppColor.black,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            Padding(
                              padding: const EdgeInsets.all(8.0),
                              child: Text(
                                video.title ?? "",
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: GoogleFonts.urbanist(
                                  fontSize: 13,
                                  fontWeight: FontWeight.bold,
                                  color: isDarkMode.value ? AppColor.white : AppColor.primaryTextIcons,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
