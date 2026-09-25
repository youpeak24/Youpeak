import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shimmer/shimmer.dart';
import 'package:youpeak/shared/widgets/data_not_found_ui.dart';
import 'package:youpeak/shared/widgets/loader_ui.dart';
import 'package:youpeak/core/storage/database/database.dart';
import 'package:youpeak/main.dart';
import 'package:youpeak/features/bites/view/nav_shorts_details_view.dart';
import 'package:youpeak/features/notifications/api/clear_notification_api.dart';
import 'package:youpeak/features/notifications/api/notification_api.dart';
import 'package:youpeak/features/notifications/controller/notification_controller.dart';
import 'package:youpeak/core/notification/local_notification_storage.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:youpeak/core/config/size_config.dart';
import 'package:youpeak/core/assets/app_icons.dart';
import 'package:youpeak/core/assets/app_visuals.dart';
import 'package:youpeak/shared/widgets/preview_image.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'package:youpeak/core/constants/app_string.dart';

class NotificationPageView extends GetView<NotificationController> {
  const NotificationPageView({super.key});

  @override
  Widget build(BuildContext context) {
    final ScrollController scrollController = ScrollController();

    scrollController.addListener(() {
      final maxScroll = scrollController.position.maxScrollExtent;
      final currentScroll = scrollController.position.pixels;
      const threshold = 200.0;

      if (currentScroll >= maxScroll - threshold) {
        controller.loadMoreNotifications();
      }
    });

    NotificationApiClass.startPagination = 1;
    controller.onGetNotification();

    return Scaffold(
      appBar: AppBar(
        leadingWidth: 60,
        leading: IconButtonUi(
          callback: () => Get.back(),
          icon: Obx(
            () => Image.asset(AppIcons.arrowBack, height: 20, width: 20, color: isDarkMode.value ? AppColor.white : AppColor.black),
          ),
        ),
        elevation: 0,
        centerTitle: AppSettings.isCenterTitle,
        title: Text(
          AppStrings.notification.tr,
          style: GoogleFonts.urbanist(fontSize: 19, fontWeight: FontWeight.bold),
        ),
        actions: [
          GetBuilder<NotificationController>(
            id: "onGetNotification",
            builder: (controller) => (controller.mainNotifications == null || (controller.mainNotifications?.isEmpty ?? true))
                ? const Offstage()
                : IconButton(
                    icon: Text(AppStrings.clearAll.tr, style: GoogleFonts.urbanist(fontSize: 16, fontWeight: FontWeight.w600)),
                    onPressed: () {
                      Get.bottomSheet(
                        backgroundColor: isDarkMode.value ? AppColor.secondDarkMode : AppColor.white,
                        shape: const RoundedRectangleBorder(
                          borderRadius: BorderRadius.only(
                            topRight: Radius.circular(40),
                            topLeft: Radius.circular(40),
                          ),
                        ),
                        Container(
                          padding: EdgeInsets.only(
                            left: SizeConfig.blockSizeHorizontal * 3,
                            right: SizeConfig.blockSizeHorizontal * 3,
                          ),
                          height: 180,
                          decoration: BoxDecoration(
                            color: isDarkMode.value ? AppColor.secondDarkMode : AppColor.white,
                            borderRadius: const BorderRadius.only(topRight: Radius.circular(40), topLeft: Radius.circular(40)),
                          ),
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.start,
                            children: [
                              const SizedBox(height: 10),
                              Container(
                                width: 30,
                                height: 3,
                                decoration: BoxDecoration(
                                  borderRadius: BorderRadius.circular(60),
                                  color: isDarkMode.value ? AppColor.white.withOpacity(0.2) : AppColor.grey_200,
                                ),
                              ),
                              const SizedBox(height: 10),
                              Text(
                                AppStrings.clear.tr,
                                style: GoogleFonts.urbanist(
                                  fontSize: 22,
                                  color: isDarkMode.value ? AppColor.white : AppColor.logOutColor,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const SizedBox(height: 5),
                              Divider(indent: 30, color: AppColor.grey_200, endIndent: 30),
                              const SizedBox(height: 5),
                              Text(
                                AppStrings.clearNotificationText.tr,
                                style: GoogleFonts.urbanist(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const SizedBox(height: 15),
                              Row(
                                crossAxisAlignment: CrossAxisAlignment.center,
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  GestureDetector(
                                    onTap: () => Get.back(),
                                    child: Container(
                                      height: 45,
                                      width: 130,
                                      alignment: Alignment.center,
                                      decoration: BoxDecoration(
                                        borderRadius: BorderRadius.circular(30),
                                        color: AppColor.primaryColor.withOpacity(0.2),
                                      ),
                                      child: Text(
                                        AppStrings.cancel.tr,
                                        style: GoogleFonts.urbanist(
                                          fontWeight: FontWeight.bold,
                                          fontSize: 14,
                                          color: AppColor.primaryColor,
                                        ),
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 10),
                                  GestureDetector(
                                    child: Container(
                                      height: 45,
                                      width: 130,
                                      alignment: Alignment.center,
                                      decoration: BoxDecoration(borderRadius: BorderRadius.circular(100), color: AppColor.primaryColor),
                                      child: Text(
                                        AppStrings.yesClear.tr,
                                        style: GoogleFonts.urbanist(color: AppColor.white, fontWeight: FontWeight.bold, fontSize: 14),
                                      ),
                                    ),
                                    onTap: () async {
                                      Get.back();
                                      Get.dialog(const LoaderUi(), barrierDismissible: false);
                                      final response = await ClearNotificationApi.callApi(loginUserId: Database.loginUserId!);
                                      if (response) {
                                        controller.mainNotifications?.clear();
                                        await LocalNotificationStorage.clearAll();
                                        controller.update(["onGetNotification"]);
                                      }
                                      Get.back();
                                    },
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
          ),
          SizedBox(width: SizeConfig.blockSizeHorizontal * 3),
        ],
      ),
      body: GetBuilder<NotificationController>(
        id: "onGetNotification",
        builder: (controller) => controller.mainNotifications == null
            ? const NotificationShimmer()
            : RefreshIndicator(
                color: AppColor.primaryColor,
                onRefresh: () async {
                  await controller.onGetNotification();
                },
                child: controller.mainNotifications!.isEmpty
                    ? SingleChildScrollView(
                        physics: const AlwaysScrollableScrollPhysics(),
                        child: SizedBox(
                          height: Get.height * 0.8,
                          child: Center(
                            child: DataNotFoundUi(type: EmptyStateType.notifications, title: AppStrings.notificationNotAvailable.tr),
                          ),
                        ),
                      )
                    : SingleChildScrollView(
                        controller: scrollController,
                        physics: const AlwaysScrollableScrollPhysics(),
                        child: Column(
                          children: [
                            ListView.builder(
                          padding: const EdgeInsets.all(10),
                          shrinkWrap: true,
                          scrollDirection: Axis.vertical,
                          physics: const NeverScrollableScrollPhysics(),
                          itemCount: controller.mainNotifications!.length,
                          itemBuilder: (context, index) {
                            return Column(
                              children: [
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    NotificationAvatar(
                                      id: controller.mainNotifications![index].id ?? "",
                                      image: controller.mainNotifications![index].channelImage,
                                      typeArt: AppVisuals.notification(
                                        controller.mainNotifications![index].title,
                                        controller.mainNotifications![index].message,
                                      ),
                                    ),
                                    SizedBox(width: Get.width * 0.03),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            controller.mainNotifications![index].message.toString(),
                                            style: GoogleFonts.urbanist(fontSize: 15, fontWeight: FontWeight.bold),
                                            overflow: TextOverflow.ellipsis,
                                            maxLines: 3,
                                          ),
                                          SizedBox(height: SizeConfig.blockSizeVertical * 0.5),
                                          Text(
                                            controller.mainNotifications![index].time.toString(),
                                            style: GoogleFonts.urbanist(fontSize: 12, color: AppColor.grey),
                                          ),
                                        ],
                                      ),
                                    ),
                                    if (controller.mainNotifications![index].videoImage != null &&
                                        controller.mainNotifications![index].videoImage!.isNotEmpty &&
                                        controller.mainNotifications![index].videoImage != "null" &&
                                        controller.mainNotifications![index].videoImage != "undefined") ...[
                                      SizedBox(width: Get.width * 0.01),
                                      Container(
                                        clipBehavior: Clip.hardEdge,
                                        height: 70,
                                        width: 110,
                                        decoration: BoxDecoration(
                                            color: isDarkMode.value ? AppColor.secondDarkMode : AppColor.grey_400,
                                            borderRadius: BorderRadius.circular(15)),
                                        child: PreviewVideoImage(
                                          videoId: controller.mainNotifications![index].videoId ?? "",
                                          videoImage: controller.mainNotifications![index].videoImage ?? "",
                                        ),
                                      ),
                                    ],
                                  ],
                                ),
                                SizedBox(height: SizeConfig.blockSizeVertical * 2),
                              ],
                            );
                          },
                        ),
                        GetBuilder<NotificationController>(
                          id: "onChangeLoadMore",
                          builder: (ctrl) => ctrl.isLoadingMore
                              ? const Padding(
                                  padding: EdgeInsets.all(16),
                                  child: Center(
                                      child: CircularProgressIndicator(
                                    color: AppColor.primaryColor,
                                  )),
                                )
                              : const SizedBox.shrink(),
                        ),
                      ],
                    ),
                  ),
              ),
      ),
    );
  }
}

class NotificationShimmer extends StatelessWidget {
  const NotificationShimmer({super.key});

  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: isDarkMode.value ? AppColor.secondDarkMode : AppColor.grey_300,
      highlightColor: AppColor.white,
      child: SingleChildScrollView(
        physics: const NeverScrollableScrollPhysics(),
        child: Padding(
          padding: const EdgeInsets.all(10),
          child: Column(
            children: [
              for (int i = 0; i < 10; i++)
                Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceAround,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          height: 37,
                          width: 37,
                          decoration: const BoxDecoration(color: Colors.black, shape: BoxShape.circle),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Container(
                                height: 15,
                                width: double.infinity,
                                decoration: BoxDecoration(color: Colors.black, borderRadius: BorderRadius.circular(5)),
                              ),
                              const SizedBox(height: 5),
                              Container(
                                height: 15,
                                width: 150,
                                decoration: BoxDecoration(color: Colors.black, borderRadius: BorderRadius.circular(5)),
                              ),
                              const SizedBox(height: 5),
                              Container(
                                height: 12,
                                width: 80,
                                decoration: BoxDecoration(color: Colors.black, borderRadius: BorderRadius.circular(5)),
                              ),
                            ],
                          ),
                        ),

                      ],
                    ),
                    const SizedBox(height: 20),
                  ],
                ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Sender avatar with a type badge in the corner; the type artwork stands in
/// for system notifications that have no sender image.
class NotificationAvatar extends StatelessWidget {
  const NotificationAvatar({super.key, required this.id, required this.image, required this.typeArt});

  final String id;
  final String? image;
  final String typeArt;

  bool get _hasImage => image != null && image!.isNotEmpty && image != "null" && image != "undefined";

  @override
  Widget build(BuildContext context) {
    if (!_hasImage) return Image.asset(typeArt, height: 44, width: 44);
    return SizedBox(
      height: 44,
      width: 44,
      child: Stack(
        children: [
          Container(
            clipBehavior: Clip.hardEdge,
            height: 40,
            width: 40,
            decoration: const BoxDecoration(shape: BoxShape.circle),
            child: PreviewNetworkImage(image: image!, id: id, fit: BoxFit.contain),
          ),
          Positioned(right: 0, bottom: 0, child: Image.asset(typeArt, height: 20, width: 20)),
        ],
      ),
    );
  }
}
