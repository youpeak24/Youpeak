import 'package:youpeak/shared/dialogs/app_sheet.dart';
import 'package:youpeak/core/platform/app_layout.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shimmer/shimmer.dart';
import 'package:youpeak/shared/widgets/data_not_found_ui.dart';
import 'package:youpeak/shared/widgets/loader_ui.dart';
import 'package:youpeak/core/storage/database/database.dart';
import 'package:youpeak/main.dart';
import 'package:youpeak/features/bites/view/nav_shorts_details_view.dart';
import 'package:youpeak/features/notifications/model/notification_model.dart' as nm;
import 'package:youpeak/features/video/view/normal_video_details_view.dart';
import 'package:youpeak/features/video/view/shorts_video_details_view.dart';
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
import 'package:youpeak/core/theme/shimmer_palette.dart';

class NotificationPageView extends StatefulWidget {
  const NotificationPageView({super.key});

  @override
  State<NotificationPageView> createState() => _NotificationPageViewState();
}

class _NotificationPageViewState extends State<NotificationPageView> {
  NotificationController get controller => Get.find<NotificationController>();
  final ScrollController scrollController = ScrollController();

  // Loaded once when the page opens (this ran on every rebuild before -
  // e.g. each browser window resize refetched page 1).
  @override
  void initState() {
    super.initState();
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
  }

  @override
  void dispose() {
    scrollController.dispose();
    super.dispose();
  }

  // Opening a notification marks it read and goes to its video (the video
  // page checks access itself and says so if it is gone or private now).
  void _open(NotificationController controller, nm.Notification n) {
    controller.markRead(n);
    final videoId = n.videoId ?? "";
    if (videoId.isEmpty || videoId == "null") return;
    if (n.videoType == 2) {
      Get.to(() => ShortsVideoDetailsView(videoId: videoId, videoUrl: ""));
    } else {
      Get.to(() => NormalVideoDetailsView(videoId: videoId, videoUrl: ""));
    }
  }

  @override
  Widget build(BuildContext context) {
    final wide = AppLayout.isWideWeb;
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
        title: GetBuilder<NotificationController>(
          id: "onGetNotification",
          builder: (controller) => Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(AppStrings.notification.tr, style: GoogleFonts.urbanist(fontSize: wide ? 22 : 19, fontWeight: FontWeight.bold)),
              if (controller.unreadCount > 0) ...[
                const SizedBox(width: 10),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 3),
                  decoration: BoxDecoration(color: AppColor.primaryColor, borderRadius: BorderRadius.circular(20)),
                  child: Text("${controller.unreadCount} new", style: GoogleFonts.urbanist(fontSize: 12, color: AppColor.white, fontWeight: FontWeight.w700)),
                ),
              ],
            ],
          ),
        ),
        actions: [
          GetBuilder<NotificationController>(
            id: "onGetNotification",
            builder: (controller) => controller.unreadCount > 0
                ? TextButton(
                    onPressed: controller.markAllRead,
                    child: Text("Mark all read", style: GoogleFonts.urbanist(fontSize: 15, fontWeight: FontWeight.w600)),
                  )
                : const Offstage(),
          ),
          GetBuilder<NotificationController>(
            id: "onGetNotification",
            builder: (controller) => (controller.mainNotifications == null || (controller.mainNotifications?.isEmpty ?? true))
                ? const Offstage()
                : IconButton(
                    icon: Text(AppStrings.clearAll.tr, style: GoogleFonts.urbanist(fontSize: 16, fontWeight: FontWeight.w600)),
                    onPressed: () {
                      AppSheet.show(
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
                child: controller.mainNotifications!.isEmpty && controller.loadError != null
                    ? _NotificationLoadErrorUi(error: controller.loadError!, onRetry: controller.onGetNotification)
                    : controller.mainNotifications!.isEmpty
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
                            final n = controller.mainNotifications![index];
                            return _NotificationTile(
                              notification: n,
                              onTap: () => _open(controller, n),
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

class _NotificationTile extends StatelessWidget {
  const _NotificationTile({required this.notification, required this.onTap});

  final nm.Notification notification;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final n = notification;
    final wide = AppLayout.isWideWeb;
    final hasThumb = n.videoImage != null && n.videoImage!.isNotEmpty && n.videoImage != "null" && n.videoImage != "undefined";
    final unread = !n.isRead;
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Material(
        color: unread ? AppColor.primaryColor.withValues(alpha: 0.06) : Colors.transparent,
        borderRadius: BorderRadius.circular(14),
        child: InkWell(
          borderRadius: BorderRadius.circular(14),
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SizedBox(
                  width: 10,
                  child: unread
                      ? Padding(
                          padding: const EdgeInsets.only(top: 16),
                          child: Container(width: 8, height: 8, decoration: const BoxDecoration(color: AppColor.primaryColor, shape: BoxShape.circle)),
                        )
                      : null,
                ),
                const SizedBox(width: 6),
                NotificationAvatar(id: n.id ?? "", image: n.channelImage, typeArt: AppVisuals.notification(n.title, n.message)),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if ((n.title ?? "").isNotEmpty)
                        Text(n.title!,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: GoogleFonts.urbanist(fontSize: wide ? 16 : 15, fontWeight: unread ? FontWeight.w800 : FontWeight.w600)),
                      Text(n.message ?? "",
                          maxLines: 3,
                          overflow: TextOverflow.ellipsis,
                          style: GoogleFonts.urbanist(fontSize: wide ? 15 : 14, height: 1.35, fontWeight: unread ? FontWeight.w600 : FontWeight.w400)),
                      const SizedBox(height: 4),
                      Text(_when(n), style: GoogleFonts.urbanist(fontSize: 13, color: AppColor.grey)),
                    ],
                  ),
                ),
                if (hasThumb) ...[
                  const SizedBox(width: 12),
                  Container(
                    clipBehavior: Clip.hardEdge,
                    height: wide ? 80 : 64,
                    width: wide ? 142 : 112,
                    decoration: BoxDecoration(color: isDarkMode.value ? AppColor.secondDarkMode : AppColor.grey_200, borderRadius: BorderRadius.circular(12)),
                    child: PreviewVideoImage(videoId: n.videoId ?? "", videoImage: n.videoImage ?? ""),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }

  // The server's relative time, else one computed from the timestamp.
  static String _when(nm.Notification n) {
    final t = (n.time ?? "").trim();
    if (t.isNotEmpty && t != "null" && !t.startsWith("hours")) return t;
    final at = DateTime.tryParse(n.createdAt ?? "");
    if (at == null) return "";
    final d = DateTime.now().difference(at.toLocal());
    if (d.inMinutes < 1) return "Just now";
    if (d.inMinutes < 60) return "${d.inMinutes} min ago";
    if (d.inHours < 24) return "${d.inHours} h ago";
    return "${d.inDays} d ago";
  }
}

// The server's notifications couldn't be loaded: ask the user to sign in again
// when the session is missing or expired, otherwise offer a retry. (An empty
// inbox is shown by DataNotFoundUi instead.)
class _NotificationLoadErrorUi extends StatelessWidget {
  const _NotificationLoadErrorUi({required this.error, required this.onRetry});

  final NotificationLoadError error;
  final Future<void> Function() onRetry;

  @override
  Widget build(BuildContext context) {
    final needsSignIn = error == NotificationLoadError.signInRequired;
    return LayoutBuilder(
      builder: (context, constraints) => SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        child: ConstrainedBox(
          constraints: BoxConstraints(minHeight: constraints.maxHeight),
          child: Center(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(needsSignIn ? Icons.lock_person_rounded : Icons.cloud_off_rounded, size: 48, color: AppColor.grey),
                  const SizedBox(height: 14),
                  Text(
                    (needsSignIn ? AppStrings.signInAgainToContinue : AppStrings.notificationsLoadFailed).tr,
                    textAlign: TextAlign.center,
                    style: GoogleFonts.urbanist(fontSize: 16, fontWeight: FontWeight.w600, height: 1.4),
                  ),
                  const SizedBox(height: 18),
                  FilledButton(
                    style: FilledButton.styleFrom(backgroundColor: AppColor.primaryColor),
                    onPressed: needsSignIn ? Database.logOut : onRetry,
                    child: Text((needsSignIn ? AppStrings.signIN : AppStrings.retry).tr, style: GoogleFonts.urbanist(fontWeight: FontWeight.bold)),
                  ),
                ],
              ),
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
      baseColor: ShimmerPalette.base,
      highlightColor: ShimmerPalette.highlight,
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
