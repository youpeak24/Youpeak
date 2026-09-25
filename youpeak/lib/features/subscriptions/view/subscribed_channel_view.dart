import 'package:flutter/material.dart';
import 'package:youpeak/core/assets/app_visuals.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/shared/widgets/data_not_found_ui.dart';
import 'package:youpeak/shared/widgets/loader_ui.dart';
import 'package:youpeak/core/storage/database/database.dart';
import 'package:youpeak/main.dart';
import 'package:youpeak/features/live/api/get_live_users_api.dart';
import 'package:youpeak/features/live/view/live_view.dart';
import 'package:youpeak/features/bites/view/nav_shorts_details_view.dart';
import 'package:youpeak/features/subscriptions/controller/nav_subscription_controller.dart';
import 'package:youpeak/features/channel/view/your_channel_view.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:youpeak/core/assets/app_icons.dart';
import 'package:youpeak/shared/widgets/preview_image.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'package:youpeak/core/constants/app_string.dart';

class SubscribedChannelView extends GetView<NavSubscriptionPageController> {
  const SubscribedChannelView({super.key, required this.loginUserId});

  final String loginUserId;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        elevation: 0,
        centerTitle: AppSettings.isCenterTitle,
        leadingWidth: 60,
        leading: IconButtonUi(
          callback: () => Get.back(),
          icon: Obx(
            () => Image.asset(AppIcons.arrowBack, height: 20, width: 20, color: isDarkMode.value ? AppColor.white : AppColor.black),
          ),
        ),
        title: Text(
          "${AppStrings.channelList.tr} (${controller.mainSubscribedChannels?.length ?? 0})",
          style: GoogleFonts.urbanist(
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
      body: controller.mainSubscribedChannels == null
          ? const LoaderUi()
          : controller.mainSubscribedChannels!.isEmpty
              ? const DataNotFoundUi(type: EmptyStateType.subscriptions)
              : SingleChildScrollView(
                  child: ListView.builder(
                    shrinkWrap: true,
                    itemCount: controller.mainSubscribedChannels!.length,
                    itemBuilder: (context, index) {
                      return GestureDetector(
                        onTap: () {
                          if (GetLiveUsersApi.isLive(controller.mainSubscribedChannels![index].channelId!)) {
                            Get.to(
                              () => LivePage(
                                isHost: false,
                                localUserID: Database.loginUserId ?? "",
                                localUserName: AppSettings.channelName.value,
                                roomID: GetLiveUsersApi.roomId(controller.mainSubscribedChannels![index].channelId!),
                              ),
                            )?.then(
                              (value) => Get.to(
                                YourChannelView(
                                  loginUserId: loginUserId,
                                  channelId: controller.mainSubscribedChannels![index].channelId!,
                                ),
                              ),
                            );
                          } else {
                            Get.to(
                              YourChannelView(
                                loginUserId: loginUserId,
                                channelId: controller.mainSubscribedChannels![index].channelId!,
                              ),
                            );
                          }
                        },
                        onDoubleTap: () => Get.to(
                          YourChannelView(
                            loginUserId: loginUserId,
                            channelId: controller.mainSubscribedChannels![index].channelId!,
                          ),
                        ),
                        child: ListTile(
                          leading: Container(
                            height: 50,
                            width: 50,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              border: Border.all(color: controller.selectedChannel == index ? AppColor.primaryColor : Colors.transparent, width: 2),
                            ),
                            child: PreviewProfileImage(
                              size: 50,
                              id: controller.mainSubscribedChannels![index].channelId ?? "",
                              image: controller.mainSubscribedChannels![index].channelImage ?? "",
                              fit: BoxFit.cover,
                            ),
                          ),
                          title: Text(
                            controller.mainSubscribedChannels![index].channelName.toString(),
                            style: GoogleFonts.urbanist(fontWeight: FontWeight.bold),
                          ),
                          trailing: GetLiveUsersApi.isLive(controller.mainSubscribedChannels![index].channelId!)
                              ? Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Image.asset(AppVisuals.liveBadge, width: 16, height: 16),
                                    const SizedBox(width: 4),
                                    Text(
                                      "Live",
                                      style: GoogleFonts.urbanist(
                                        fontSize: 16,
                                        fontWeight: FontWeight.bold,
                                        color: AppColor.primaryColor,
                                      ),
                                    ),
                                  ],
                                )
                              : null,
                        ),
                      );
                    },
                  ),
                ),
    );
  }
}
