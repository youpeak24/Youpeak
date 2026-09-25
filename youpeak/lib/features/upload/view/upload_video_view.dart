import 'package:chewie/chewie.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:get/get_rx/src/rx_typedefs/rx_typedefs.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:youpeak/core/utils/custom_country_picker.dart';
import 'package:youpeak/shared/widgets/custom_filled_button.dart';
import 'package:youpeak/core/utils/custom_format_timer.dart';
import 'package:youpeak/core/utils/custom_toast.dart';
import 'package:youpeak/shared/widgets/loader_ui.dart';
import 'package:youpeak/core/storage/database/database.dart';
import 'package:youpeak/main.dart';
import 'package:youpeak/features/profile/api/get_profile_api.dart';
import 'package:youpeak/features/upload/view/audience_page.dart';
import 'package:youpeak/features/upload/view/comments_page.dart';
import 'package:youpeak/features/channel/view/create_channel_view.dart';
import 'package:youpeak/features/upload/view/description_page.dart';
import 'package:youpeak/features/upload/view/set_thumbnail_page.dart';
import 'package:youpeak/features/upload/controller/upload_video_controller.dart';
import 'package:youpeak/features/upload/view/video_charges_view.dart';
import 'package:youpeak/features/upload/view/visibility_page.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:youpeak/core/assets/app_icons.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'package:youpeak/core/constants/app_string.dart';
import 'package:youpeak/core/platform/local_media.dart';

class UploadVideoView extends StatefulWidget {
  const UploadVideoView({
    super.key,
    required this.videoPath,
    required this.loginUserId,
    required this.loginUserChannelId,
    required this.videoType,
  });

  final String videoPath;
  final int videoType;
  final String loginUserId;
  final String loginUserChannelId;

  @override
  State<UploadVideoView> createState() => _UploadVideoViewState();
}

class _UploadVideoViewState extends State<UploadVideoView> {
  final controller = Get.find<UploadVideoController>();

  final List audienceCollection = [
    AppStrings.itsMadeForKids.tr,
    AppStrings.itsMadeFor18Adult.tr,
    AppStrings.itsMadeForBothKids18Adult.tr,
  ];

  final List commentCollection = [
    AppStrings.allowAllComments.tr,
    AppStrings.disableComments.tr,
    AppStrings.holdPotentiallyInappropriateCommentsForReview.tr.replaceAll('\\n', '\n'),
    AppStrings.holdAllCommentsForReview.tr,
  ];

  final List visibilityCollection = [
    {"title": AppStrings.public.tr, "subTitle": AppStrings.anyoneCanSearchForAndView.tr},
    {"title": AppStrings.private.tr, "subTitle": AppStrings.onlyFollowersCanView.tr},
    {"title": AppStrings.unlisted.tr, "subTitle": AppStrings.anyoneWithTheLinkCanView.tr},
  ];

  @override
  void initState() {
    // controller.onCloseEvent();
    controller.initializeVideoPlayer(widget.videoPath);
    controller.onGetThumbnail(widget.videoPath);
    controller.videoTitleController.clear();
    controller.videoDescriptionController.clear();
    controller.hashTagCollection.clear();
    controller.selectCounty.value = "";
    controller.selectDate.value = AppStrings.now.tr;
    super.initState();
  }

  @override
  void dispose() {
    controller.videoPlayerController?.pause();

    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.manual, overlays: [SystemUiOverlay.top, SystemUiOverlay.bottom]);
    return PopScope(
      child: Scaffold(
        bottomNavigationBar: Padding(
          padding: const EdgeInsets.all(10),
          child: CustomFilledButton(
              title: AppStrings.uploadVideo.tr,
              callback: () async {
                AppSettings.showLog("Upload Video On Click");

                if (controller.videoTitleController.text.trim().isEmpty) {
                  CustomToast.show("Title cannot be empty");
                  return;
                }

                if ((Database.isChannel == false || Database.channelId == null) &&
                    (controller.channelName.text.trim().isEmpty || controller.channelDescription.text.trim().isEmpty)) {
                  Get.to(const CreateChannelView());
                } else {
                  // 🔹 Case 1: Visibility = Private (subscriber-only)
                  if (controller.selectVisibility.value == 1) {
                    final subscriptionCost = GetProfileApi.profileModel?.user?.subscriptionCost ?? 0;
                    if (subscriptionCost > 0) {
                      controller.onUploadVideoProcess(widget.videoPath, widget.videoType, widget.loginUserId, widget.loginUserChannelId);
                    } else {
                      CustomToast.show("Please set your subscription price in Subscription Plan settings first.");
                    }
                  }
                  // 🔹 Case 2: Paid video (videoChargeType == 2)
                  else if (controller.videoChargeType.value == 2) {
                    final videoUnlockCost = GetProfileApi.profileModel?.user?.videoUnlockCost ?? 0;
                    if (videoUnlockCost == 0) {
                      CustomToast.show("Warning: Video unlock price not set. Set it in Subscription Plan settings.");
                    }
                    controller.onUploadVideoProcess(widget.videoPath, widget.videoType, widget.loginUserId, widget.loginUserChannelId);
                  }
                  // 🔹 Case 3: Free video — upload directly
                  else {
                    controller.onUploadVideoProcess(widget.videoPath, widget.videoType, widget.loginUserId, widget.loginUserChannelId);
                  }
                }
              }),
        ),
        appBar: AppBar(
          elevation: 0,
          leading: Container(
            padding: const EdgeInsets.only(left: 10),
            child: IconButton(
              icon: Image(
                image: const AssetImage(AppIcons.arrowBack),
                height: 18,
                width: 18,
                color: isDarkMode.value ? AppColor.white : AppColor.black,
              ),
              onPressed: () {
                // controller.onCloseEvent();
                Get.back();
              },
            ),
          ),
          title: Text(
            AppStrings.addDetails.tr,
            style: GoogleFonts.urbanist(fontSize: 18, fontWeight: FontWeight.bold),
          ),
        ),
        body: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 10),
          child: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                widget.videoType == 2
                    ? Container(
                        clipBehavior: Clip.antiAlias,
                        height: 300,
                        width: 200,
                        decoration: BoxDecoration(
                          color: AppColor.transparent,
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Stack(
                          alignment: Alignment.center,
                          children: [
                            GetBuilder<UploadVideoController>(
                              id: "initializeVideoPlayer",
                              builder: (controller) => controller.chewieController != null && (controller.videoPlayerController?.value.isInitialized ?? false)
                                  ? Container(
                                      height: 300,
                                      width: 200,
                                      clipBehavior: Clip.antiAlias,
                                      decoration: BoxDecoration(color: Colors.transparent, borderRadius: BorderRadius.circular(18)),
                                      child: SizedBox.expand(
                                        child: FittedBox(
                                          fit: BoxFit.cover,
                                          child: SizedBox(
                                            width: controller.videoPlayerController?.value.size.width ?? 0,
                                            height: controller.videoPlayerController?.value.size.height ?? 0,
                                            child: Chewie(controller: controller.chewieController!),
                                          ),
                                        ),
                                      ),
                                    )
                                  : const LoaderUi(),
                            ),
                            Center(
                              child: GestureDetector(
                                onTap: () async {
                                  if (controller.isPlaying.value) {
                                    controller.videoPlayerController?.pause();
                                    controller.isPlaying.value = false;
                                    await 20.milliseconds.delay();
                                    controller.isPlaying.value = false;
                                  } else {
                                    controller.videoPlayerController?.play();
                                    controller.isPlaying.value = true;
                                    await 20.milliseconds.delay();
                                    controller.isPlaying.value = true;
                                  }
                                },
                                child: Container(
                                  height: 50,
                                  width: 50,
                                  decoration: const BoxDecoration(color: Colors.transparent, shape: BoxShape.circle),
                                  child: Obx(
                                    () => Center(
                                      child: controller.isPlaying.value ? Image.asset(AppIcons.pause, width: 35, color: AppColor.white) : Image.asset(AppIcons.videoPlay, width: 35, color: AppColor.white),
                                    ),
                                  ),
                                ),
                              ),
                            ),
                            Positioned(
                              bottom: 25,
                              child: GetBuilder<UploadVideoController>(
                                id: "onProgressLine",
                                builder: (controller) => SizedBox(
                                  width: 190,
                                  child: Row(
                                    children: [
                                      Expanded(
                                        child: SliderTheme(
                                          data: SliderTheme.of(context).copyWith(
                                            trackHeight: 6,
                                            trackShape: const RoundedRectSliderTrackShape(),
                                            inactiveTrackColor: Colors.white60,
                                            thumbColor: AppColor.white,
                                            activeTrackColor: AppColor.primaryColor,
                                            thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 10.0),
                                            overlayShape: const RoundSliderOverlayShape(overlayRadius: 15.0),
                                          ),
                                          child: Slider(
                                            value: controller.videoPlayerController?.value.position.inMilliseconds.toDouble() ?? 0,
                                            onChanged: (double value) {
                                              final newPosition = Duration(milliseconds: value.toInt());
                                              controller.videoPlayerController?.seekTo(newPosition);
                                            },
                                            min: 0.0,
                                            max: controller.videoPlayerController?.value.duration.inMilliseconds.toDouble() ?? 0,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                            Positioned(
                              bottom: 16,
                              right: 10,
                              child: SizedBox(
                                width: 200,
                                child: GetBuilder<UploadVideoController>(
                                  id: "onVideoTime",
                                  builder: (controller) => Row(
                                    mainAxisAlignment: MainAxisAlignment.end,
                                    children: [
                                      Text(
                                        CustomFormatTime.convert(controller.videoPlayerController?.value.position.inMilliseconds ?? 0),
                                        style: const TextStyle(color: AppColor.white, fontSize: 10),
                                      ),
                                      Text(
                                        " / ${CustomFormatTime.convert(controller.videoPlayerController?.value.duration.inMilliseconds ?? 0)}",
                                        style: const TextStyle(color: AppColor.white, fontSize: 10),
                                      ),
                                      const SizedBox(width: 10)
                                    ],
                                  ),
                                ),
                              ),
                            )
                          ],
                        ),
                      )
                    : Container(
                        clipBehavior: Clip.antiAlias,
                        height: Get.height / 3.7,
                        width: Get.width,
                        decoration: BoxDecoration(
                          color: AppColor.transparent,
                          borderRadius: BorderRadius.circular(18),
                        ),
                        child: Stack(
                          alignment: Alignment.center,
                          children: [
                            GetBuilder<UploadVideoController>(
                              id: "initializeVideoPlayer",
                              builder: (controller) => controller.chewieController != null && (controller.videoPlayerController?.value.isInitialized ?? false)
                                  ? Container(
                                      height: Get.height / 3.7,
                                      width: Get.width,
                                      clipBehavior: Clip.antiAlias,
                                      decoration: BoxDecoration(borderRadius: BorderRadius.circular(20)),
                                      child: SizedBox.expand(
                                        child: FittedBox(
                                          fit: BoxFit.cover,
                                          child: SizedBox(
                                            width: controller.videoPlayerController?.value.size.width ?? 0,
                                            height: controller.videoPlayerController?.value.size.height ?? 0,
                                            child: Chewie(controller: controller.chewieController!),
                                          ),
                                        ),
                                      ),
                                    )
                                  : const LoaderUi(),
                            ),
                            Center(
                              child: GestureDetector(
                                onTap: () async {
                                  if (controller.isPlaying.value) {
                                    controller.videoPlayerController?.pause();
                                    controller.isPlaying.value = false;
                                    await 20.milliseconds.delay();
                                    controller.isPlaying.value = false;
                                  } else {
                                    controller.videoPlayerController?.play();
                                    controller.isPlaying.value = true;
                                    await 20.milliseconds.delay();
                                    controller.isPlaying.value = true;
                                  }
                                },
                                child: Container(
                                  height: 50,
                                  width: 50,
                                  decoration: const BoxDecoration(color: Colors.transparent, shape: BoxShape.circle),
                                  child: Obx(
                                    () => Center(
                                      child: controller.isPlaying.value ? Image.asset(AppIcons.pause, width: 35, color: AppColor.white) : Image.asset(AppIcons.videoPlay, width: 35, color: AppColor.white),
                                    ),
                                  ),
                                ),
                              ),
                            ),
                            Positioned(
                              bottom: 15,
                              child: GetBuilder<UploadVideoController>(
                                id: "onProgressLine",
                                builder: (controller) => SizedBox(
                                  width: Get.width,
                                  child: Row(
                                    children: [
                                      Expanded(
                                        child: Padding(
                                          padding: const EdgeInsets.symmetric(horizontal: 20),
                                          child: SliderTheme(
                                            data: SliderTheme.of(context).copyWith(
                                              trackHeight: 8,
                                              trackShape: const RoundedRectSliderTrackShape(),
                                              inactiveTrackColor: Colors.white60,
                                              thumbColor: AppColor.white,
                                              activeTrackColor: AppColor.primaryColor,
                                              thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 12.0),
                                            ),
                                            child: Slider(
                                              value: controller.videoPlayerController?.value.position.inMilliseconds.toDouble() ?? 0,
                                              onChanged: (double value) {
                                                final newPosition = Duration(milliseconds: value.toInt());
                                                controller.videoPlayerController?.seekTo(newPosition);
                                              },
                                              min: 0.0,
                                              max: controller.videoPlayerController?.value.duration.inMilliseconds.toDouble() ?? 0,
                                            ),
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                            Positioned(
                              bottom: 10,
                              right: 20,
                              child: SizedBox(
                                width: Get.width,
                                child: GetBuilder<UploadVideoController>(
                                  id: "onVideoTime",
                                  builder: (controller) => Row(
                                    mainAxisAlignment: MainAxisAlignment.end,
                                    children: [
                                      Text(
                                        CustomFormatTime.convert(controller.videoPlayerController?.value.position.inMilliseconds ?? 0),
                                        style: const TextStyle(color: AppColor.white, fontSize: 12),
                                      ),
                                      Text(
                                        " / ${CustomFormatTime.convert(controller.videoPlayerController?.value.duration.inMilliseconds ?? 0)}",
                                        style: const TextStyle(color: AppColor.white, fontSize: 12),
                                      ),
                                      const SizedBox(width: 10)
                                    ],
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                const SizedBox(height: 10),
                Text(AppStrings.addTitle.tr, style: GoogleFonts.urbanist(fontWeight: FontWeight.bold, fontSize: 16)),
                const SizedBox(height: 10),
                TextFormField(
                  controller: controller.videoTitleController,
                  decoration: InputDecoration(
                    isDense: true,
                    filled: true,
                    hintText: AppStrings.yourTitleHere.tr,
                    fillColor: isDarkMode.value ? AppColor.secondDarkMode : AppColor.grey_100,
                    contentPadding: const EdgeInsets.all(15),
                    enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(15), borderSide: BorderSide(color: AppColor.grey_100)),
                    focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(15), borderSide: BorderSide(color: AppColor.grey_100)),
                  ),
                ),
                const SizedBox(height: 10),
                InsertDataView(
                  leading: AppIcons.setThumbnail,
                  title: AppStrings.setThumbnail.tr,
                  subTitle: "",
                  trailing: Row(
                    children: [
                      Container(
                        height: 40,
                        width: 40,
                        clipBehavior: Clip.antiAlias,
                        decoration: BoxDecoration(
                          color: AppColor.grey_100,
                          borderRadius: BorderRadius.circular(5),
                        ),
                        child: Obx(
                          () => controller.thumbnail.value != ""
                              ? LocalMedia.image(controller.thumbnail.value, fit: BoxFit.cover)
                              : Center(
                                  child: Image.asset(
                                    AppIcons.logo,
                                    height: 25,
                                    width: 25,
                                    color: AppColor.grey_300,
                                  ),
                                ),
                        ),
                      ),
                      const SizedBox(width: 5),
                      Image.asset(AppIcons.arrowRight, width: 18, color: isDarkMode.value ? AppColor.white.withOpacity(0.7) : AppColor.black)
                    ],
                  ),
                  callback: () {
                    controller.onStopVideoPlay();
                    Get.to(const SetThumbnailPage());
                  },
                ),
                GetBuilder<UploadVideoController>(
                  id: "onChangeDescription",
                  builder: (controller) => InsertDataView(
                    leading: AppIcons.descriptionIcon,
                    title: AppStrings.addDescription.tr,
                    subTitle: controller.videoDescriptionController.text.trim(),
                    callback: () {
                      controller.onStopVideoPlay();
                      Get.to(const DescriptionPageView());
                    },
                  ),
                ),
                Obx(
                  () => InsertDataView(
                    leading: AppIcons.visibilityIcon,
                    title: AppStrings.visibility.tr,
                    subTitle: visibilityCollection[controller.selectVisibility.value]["title"],
                    callback: () {
                      controller.onStopVideoPlay();
                      Get.to(const VisibilityPageView());
                    },
                  ),
                ),
                Obx(
                  () => InsertDataView(
                    leading: AppIcons.videoCharges,
                    title: "Video Charges",
                    subTitle: controller.videoChargeType.value == 1 ? "Free" : "Paid",
                    callback: () {
                      controller.onStopVideoPlay();
                      Get.to(const VideoChargesView());
                    },
                  ),
                ),
                Obx(
                  () => InsertDataView(
                    leading: AppIcons.audienceIcon,
                    title: AppStrings.selectAudience.tr,
                    subTitle: audienceCollection[controller.selectAudience.value],
                    callback: () {
                      controller.onStopVideoPlay();
                      Get.to(const AudiencePageView());
                    },
                  ),
                ),
                Obx(
                  () => InsertDataView(
                    leading: AppIcons.scheduleIcon,
                    title: AppStrings.schedule.tr,
                    subTitle: controller.selectDate.value,
                    callback: () async {
                      controller.onStopVideoPlay();
                      DateTime? picked = await showDatePicker(
                        context: context,
                        initialDate: DateTime.now(),
                        firstDate: DateTime.now(),
                        lastDate: DateTime(DateTime.now().year + 1),
                        builder: (context, child) => Theme(
                            data: ThemeData.light().copyWith(
                              primaryColor: AppColor.primaryColor,
                              colorScheme: const ColorScheme.light(primary: AppColor.primaryColor),
                              buttonTheme: const ButtonThemeData(textTheme: ButtonTextTheme.primary),
                            ),
                            child: child!),
                      );

                      final currentDate = DateFormat('yyyy-MM-dd').format(DateTime.now());
                      final formatDate = DateFormat('yyyy-MM-dd').format(picked ?? DateTime.now());
                      if (currentDate != formatDate) {
                        controller.selectDate.value = formatDate.toString();
                        controller.scheduleType.value = 1;
                      } else {
                        controller.selectDate.value = AppStrings.now.tr;
                        controller.scheduleType.value = 2;
                      }
                      AppSettings.showLog("Selected Schedule Type => ${controller.scheduleType}");
                    },
                  ),
                ),
                Obx(
                  () => InsertDataView(
                    leading: AppIcons.commentIcon,
                    title: AppStrings.comments.tr,
                    subTitle: commentCollection[controller.selectComments.value],
                    callback: () {
                      controller.onStopVideoPlay();
                      Get.to(const CommentsPageView());
                    },
                  ),
                ),
                Obx(
                  () => InsertDataView(
                    leading: AppIcons.locationIcon,
                    title: AppStrings.location.tr,
                    subTitle: controller.selectCounty.value,
                    callback: () {
                      controller.onStopVideoPlay();

                      CustomCountryPicker.pickCountry(context);
                    },
                  ),
                ),
                const SizedBox(height: 20),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class InsertDataView extends StatelessWidget {
  const InsertDataView({
    super.key,
    required this.leading,
    required this.title,
    this.subTitle,
    this.trailing,
    this.callback,
  });

  final String leading;
  final String title;
  final String? subTitle;
  final Widget? trailing;
  final Callback? callback;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: callback,
      child: Container(
        height: 52,
        color: Colors.transparent,
        child: Center(
          child: Row(children: [
            Image.asset(
              leading,
              width: 28,
              color: isDarkMode.value ? AppColor.white.withOpacity(0.7) : null,
            ),
            const SizedBox(width: 10),
            Expanded(child: Text(title, style: GoogleFonts.urbanist(fontSize: 16, fontWeight: FontWeight.w600))),
            Expanded(child: Align(alignment: Alignment.centerRight, child: Text(subTitle ?? "", maxLines: 1, overflow: TextOverflow.ellipsis, style: GoogleFonts.urbanist(fontSize: 14, color: Colors.grey)))),
            const SizedBox(width: 10),
            trailing ?? Image.asset(AppIcons.arrowRight, width: 18, color: isDarkMode.value ? AppColor.white.withOpacity(0.7) : AppColor.black),
          ]),
        ),
      ),
    );
  }
}
