import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:youpeak/shared/widgets/loader_ui.dart';
import 'package:youpeak/main.dart';
import 'package:youpeak/features/channel/controller/your_channel_controller.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:youpeak/shared/widgets/app_icon.dart';
import 'package:youpeak/core/assets/app_icons.dart';
import 'package:youpeak/core/constants/app_string.dart';

class ChannelAboutTabView extends StatelessWidget {
  const ChannelAboutTabView({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: GetBuilder<YourChannelController>(
        id: "onGetChannelAbout",
        builder: (controller) {
          final instagram = controller.channelAboutModel?.aboutOfChannel?.channel?.socialMediaLinks?.instagramLink ?? "";
          final facebook = controller.channelAboutModel?.aboutOfChannel?.channel?.socialMediaLinks?.facebookLink ?? "";
          final twitter = controller.channelAboutModel?.aboutOfChannel?.channel?.socialMediaLinks?.twitterLink ?? "";
          final web = controller.channelAboutModel?.aboutOfChannel?.channel?.socialMediaLinks?.websiteLink ?? "";
          return controller.channelAboutModel == null
              ? const LoaderUi()
              : SingleChildScrollView(
                  physics: const BouncingScrollPhysics(),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        AppStrings.description.tr,
                        style: GoogleFonts.urbanist(fontSize: 18, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 8),
                      Text((controller.channelAboutModel?.aboutOfChannel?.channel?.descriptionOfChannel).toString().trim(), style: GoogleFonts.urbanist()),
                      const SizedBox(height: 8),
                      Text(
                        AppStrings.link.tr,
                        style: GoogleFonts.urbanist(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          const AppIcon.colored(AppIcons.instagram, size: 26),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Text(
                              instagram.trim().isNotEmpty ? instagram : "(Not Included)",
                              style: GoogleFonts.urbanist(color: Colors.blueAccent),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          const AppIcon.colored(AppIcons.facebook, size: 26),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Text(
                              facebook.trim().isNotEmpty ? facebook : "(Not Included)",
                              style: GoogleFonts.urbanist(color: Colors.blueAccent),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          const AppIcon.colored(AppIcons.twitter, size: 26),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Text(
                              twitter.trim().isNotEmpty ? twitter : "(Not Included)",
                              style: GoogleFonts.urbanist(color: Colors.blueAccent),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          const AppIcon.colored(AppIcons.internet, size: 26),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Text(
                              web.trim().isNotEmpty ? web : "(Not Included)",
                              style: GoogleFonts.urbanist(color: Colors.blueAccent),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      Text(AppStrings.moreInfo.tr, style: GoogleFonts.urbanist(fontSize: 18, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Obx(
                            () => AppIcon(
                              AppIcons.location,
                              size: 22,
                              color: isDarkMode.value ? AppColor.mutedTextDark : AppColor.mutedText,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Text(
                              controller.channelAboutModel?.aboutOfChannel?.channel?.country ?? "",
                              style: GoogleFonts.urbanist(),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),
                      Row(
                        children: [
                          Obx(
                            () => AppIcon(
                              AppIcons.help,
                              size: 22,
                              color: isDarkMode.value ? AppColor.mutedTextDark : AppColor.mutedText,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Text(
                              () {
                                final rawDate = controller.channelAboutModel?.aboutOfChannel?.channel?.date ?? "";
                                if (rawDate.isEmpty) return "";
                                try {
                                  final parsed = DateTime.parse(rawDate).toLocal();
                                  return DateFormat('dd MMM yyyy, hh:mm a').format(parsed);
                                } catch (_) {
                                  return rawDate;
                                }
                              }(),
                              style: GoogleFonts.urbanist(),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),
                      Row(
                        children: [
                          Obx(
                            () => AppIcon(
                              AppIcons.timeWatched,
                              size: 22,
                              color: isDarkMode.value ? AppColor.mutedTextDark : AppColor.mutedText,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Text(
                              controller.channelAboutModel?.aboutOfChannel?.totalViewsOfthatChannelVideos.toString() ?? "",
                              style: GoogleFonts.urbanist(),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),
                    ],
                  ).paddingAll(15),
                );
        },
      ),
    );
  }
}
