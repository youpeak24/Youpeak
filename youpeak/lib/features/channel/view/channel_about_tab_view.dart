import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:youpeak/shared/widgets/loader_ui.dart';
import 'package:youpeak/main.dart';
import 'package:youpeak/features/channel/controller/your_channel_controller.dart';
import 'package:youpeak/core/theme/app_color.dart';
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
          final media = controller.channelAboutModel?.aboutOfChannel?.channel?.socialMediaLinks;

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
                          const SizedBox(height: 30, width: 30, child: Image(image: AssetImage(AppIcons.instagram))),
                          const SizedBox(width: 10),
                          Text(instagram.trim().isNotEmpty ? instagram : "(Not Included)", style: GoogleFonts.urbanist(color: Colors.blueAccent)),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          const SizedBox(height: 30, width: 30, child: Image(image: AssetImage(AppIcons.facebook))),
                          const SizedBox(width: 10),
                          Text(facebook.trim().isNotEmpty ? facebook : "(Not Included)", style: GoogleFonts.urbanist(color: Colors.blueAccent)),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          const SizedBox(height: 30, width: 30, child: Image(image: AssetImage(AppIcons.twitter))),
                          const SizedBox(width: 10),
                          Text(twitter.trim().isNotEmpty ? twitter : "(Not Included)", style: GoogleFonts.urbanist(color: Colors.blueAccent)),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          const SizedBox(height: 30, width: 30, child: Image(image: AssetImage(AppIcons.internet))),
                          const SizedBox(width: 10),
                          Text(web.trim().isNotEmpty ? web : "(Not Included)", style: GoogleFonts.urbanist(color: Colors.blueAccent)),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text(AppStrings.moreInfo.tr, style: GoogleFonts.urbanist(fontSize: 18, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          SizedBox(
                              height: 30,
                              width: 30,
                              child: Image(
                                image: const AssetImage(AppIcons.location),
                                color: isDarkMode.value ? AppColor.white.withOpacity(0.7) : null,
                              )),
                          const SizedBox(width: 10),
                          Text(
                            controller.channelAboutModel?.aboutOfChannel?.channel?.country ?? "",
                            style: GoogleFonts.urbanist(),
                          ),
                        ],
                      ),
                      const SizedBox(height: 7),
                      Row(
                        children: [
                          SizedBox(
                              height: 30,
                              width: 30,
                              child: Image(
                                image: const AssetImage(AppIcons.help),
                                color: isDarkMode.value ? AppColor.white.withOpacity(0.7) : null,
                              )),
                          const SizedBox(width: 10),
                          Text(
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
                          ),
                        ],
                      ),
                      const SizedBox(height: 7),
                      Row(
                        children: [
                          SizedBox(
                              height: 30,
                              width: 30,
                              child: Image(
                                image: const AssetImage(AppIcons.timeWatched),
                                color: isDarkMode.value ? AppColor.white.withOpacity(0.7) : null,
                              )),
                          const SizedBox(width: 10),
                          Text(controller.channelAboutModel?.aboutOfChannel?.totalViewsOfthatChannelVideos.toString() ?? "", style: GoogleFonts.urbanist()),
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
