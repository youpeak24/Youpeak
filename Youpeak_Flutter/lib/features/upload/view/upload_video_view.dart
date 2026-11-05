import 'package:youpeak/core/platform/responsive.dart';
import 'package:chewie/chewie.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:get/get_rx/src/rx_typedefs/rx_typedefs.dart';
import 'package:google_fonts/google_fonts.dart';
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
import 'package:youpeak/features/channel/data/channel_lookup.dart';
import 'package:youpeak/core/network/api_problem.dart';
import 'package:youpeak/features/upload/view/description_page.dart';
import 'package:youpeak/features/upload/view/set_thumbnail_page.dart';
import 'package:youpeak/features/upload/controller/upload_video_controller.dart';
import 'package:youpeak/features/upload/view/video_charges_view.dart';
import 'package:youpeak/features/upload/view/visibility_page.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:youpeak/shared/widgets/app_icon.dart';
import 'package:youpeak/shared/widgets/app_pressable.dart';
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
    {"title": AppStrings.private.tr, "subTitle": "Only you can view it"},
    {"title": AppStrings.unlisted.tr, "subTitle": AppStrings.anyoneWithTheLinkCanView.tr},
  ];

  /// A channel check is in flight: a second tap must not start another one
  /// (or two uploads).
  bool _checkingChannel = false;

  Future<void> _submit() async {
    if (_checkingChannel) return;
    AppSettings.showLog("Upload Video On Click");

    if (controller.videoTitleController.text.trim().isEmpty) {
      CustomToast.show("Title cannot be empty");
      return;
    }
    if (controller.videoTitleController.text.trim().length > 100) {
      CustomToast.show("Titles can be at most 100 characters.");
      return;
    }
    // A paid video needs the channel's unlock price, or nobody could unlock it.
    // (Private = only you; no price needed.)
    if (controller.videoChargeType.value == 2 && (GetProfileApi.profileModel?.user?.videoUnlockCost ?? 0) <= 0) {
      CustomToast.show("Set your video unlock price in Subscription Plan before publishing a paid video.", long: true);
      return;
    }
    if (controller.scheduleType.value == 1 && !controller.scheduleIsValid()) {
      CustomToast.show("Pick a schedule time at least 5 minutes from now.", long: true);
      return;
    }

    // Ask the server who owns a channel; the copy cached on the phone can be
    // stale. A failed check is reported as such — it is never treated as "no
    // channel", which would send an owner to the creation form.
    setState(() => _checkingChannel = true);
    ChannelLookup lookup;
    try {
      lookup = await controller.resolveChannel();
    } finally {
      if (mounted) setState(() => _checkingChannel = false);
    }
    if (!mounted) return;

    final userId = Database.loginUserId ?? widget.loginUserId;
    switch (lookup) {
      case ChannelFound(:final channelId):
        controller.onUploadVideoProcess(widget.videoPath, widget.videoType, userId, channelId);
      case NoChannel():
        if (controller.channelName.text.trim().isEmpty || controller.channelDescription.text.trim().isEmpty) {
          // The intended creation flow; the video details stay on this form.
          Get.to(const CreateChannelView());
        } else {
          // The server creates the channel with this first upload.
          controller.onUploadVideoProcess(widget.videoPath, widget.videoType, userId, "");
        }
      case ChannelAuthRequired(:final expired):
        await _showLookupProblem(ApiProblem(expired ? ApiProblemKind.sessionExpired : ApiProblemKind.noSession));
      case ChannelDenied(:final problem):
        await _showLookupProblem(problem);
      case ChannelUnavailable(:final problem):
        await _showLookupProblem(problem);
    }
  }

  Future<void> _showLookupProblem(ApiProblem problem) async {
    final blocked = problem.kind == ApiProblemKind.blocked || problem.kind == ApiProblemKind.forbidden;
    final title = problem.needsSignIn
        ? "Sign in again"
        : blocked
            ? "Can't upload with this account"
            : "Couldn't check your channel";
    final retry = await Get.dialog<bool>(
      AlertDialog(
        title: Text(title),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(problem.message(what: "uploading")),
            const SizedBox(height: 10),
            Text(
              problem.needsSignIn
                  ? "Signing in again clears this form. Choose Cancel to keep it open."
                  : problem.canRetry
                      ? "Your video and its details are kept. Nothing was uploaded."
                      : "Nothing was uploaded.",
              style: const TextStyle(fontSize: 13),
            ),
            const SizedBox(height: 8),
            Text(problem.diagnostic, style: const TextStyle(fontSize: 11, color: Colors.grey)),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Get.back(result: false), child: Text(problem.canRetry || problem.needsSignIn ? "Cancel" : "Close")),
          if (problem.needsSignIn)
            FilledButton(
              onPressed: () {
                Get.back(result: false);
                Database.logOut();
              },
              child: const Text("Sign in again"),
            )
          else if (problem.canRetry)
            FilledButton(onPressed: () => Get.back(result: true), child: const Text("Retry")),
        ],
      ),
    );
    if (retry == true && mounted) await _submit();
  }

  @override
  void initState() {
    // controller.onCloseEvent();
    controller.initializeVideoPlayer(widget.videoPath);
    controller.onGetThumbnail(widget.videoPath);
    controller.videoTitleController.clear();
    controller.videoDescriptionController.clear();
    controller.hashTagCollection.clear();
    controller.selectCounty.value = "";
    controller.resetUploadOptions();
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
    // Wide: Upload sits under the form it submits. Phones: docked to the bottom.
    final dockedUpload = PageWidth.of(context) < 900;
    final uploadButton = CustomFilledButton(title: _checkingChannel ? "Checking your channel…" : AppStrings.uploadVideo.tr, callback: _submit);
    return PopScope(
      child: Scaffold(
        bottomNavigationBar: dockedUpload ? Padding(padding: const EdgeInsets.all(10), child: uploadButton) : null,
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
        body: LayoutBuilder(builder: (context, box) {
          // Desktop: the preview beside the form; phone: one column.
          final wide = box.maxWidth >= 900;
          final previewHeight = wide ? 270.0 : Get.height / 3.7;
          final Widget livePreview = widget.videoType == 2
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
                                          fit: BoxFit.contain,
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
                        height: previewHeight,
                        width: double.infinity,
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
                                      height: previewHeight,
                                      width: double.infinity,
                                      clipBehavior: Clip.antiAlias,
                                      decoration: BoxDecoration(borderRadius: BorderRadius.circular(20)),
                                      child: SizedBox.expand(
                                        child: FittedBox(
                                          fit: BoxFit.contain,
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
                            // left/right: a Positioned child is otherwise unbounded in width,
                            // which an infinite-width SizedBox cannot lay out in.
                            Positioned(
                              bottom: 15,
                              left: 0,
                              right: 0,
                              child: GetBuilder<UploadVideoController>(
                                id: "onProgressLine",
                                builder: (controller) => SizedBox(
                                  width: double.infinity,
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
                              left: 0,
                              right: 20,
                              child: SizedBox(
                                width: double.infinity,
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
                      );
          // The preview is optional: if this phone can't play the file, say so
          // and keep the form usable instead of leaving the screen.
          final Widget preview = Obx(() => controller.previewUnavailable.value
              ? _PreviewUnavailable(height: widget.videoType == 2 ? 300 : previewHeight, width: widget.videoType == 2 ? 200 : double.infinity)
              : livePreview);
          final fields = <Widget>[
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
                          color: isDarkMode.value ? AppColor.darkElevated : AppColor.grey_100,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Obx(
                          () => controller.thumbnail.value != ""
                              ? LocalMedia.image(controller.thumbnail.value, fit: BoxFit.cover)
                              : Center(
                                  child: AppIcon(
                                    AppIcons.logo,
                                    size: 22,
                                    color: isDarkMode.value ? AppColor.white.withValues(alpha: 0.3) : AppColor.grey_300,
                                  ),
                                ),
                        ),
                      ),
                      const SizedBox(width: 4),
                      Icon(Icons.chevron_right_rounded, size: 24, color: isDarkMode.value ? AppColor.mutedTextDark : AppColor.mutedText),
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
                    trailing: controller.scheduleType.value == 1
                        ? IconButton(
                            tooltip: "Publish now instead",
                            icon: const Icon(Icons.close_rounded, size: 20),
                            onPressed: controller.clearSchedule,
                          )
                        : null,
                    callback: () async {
                      controller.onStopVideoPlay();
                      final now = DateTime.now();
                      final day = await showDatePicker(
                        context: context,
                        initialDate: controller.scheduleAt ?? now,
                        firstDate: now,
                        lastDate: DateTime(now.year + 1, now.month, now.day),
                      );
                      if (day == null || !context.mounted) return;
                      final time = await showTimePicker(
                        context: context,
                        initialTime: TimeOfDay.fromDateTime((controller.scheduleAt ?? now).add(const Duration(hours: 1))),
                      );
                      if (time == null) return;
                      final at = DateTime(day.year, day.month, day.day, time.hour, time.minute);
                      if (at.isBefore(DateTime.now().add(const Duration(minutes: 5)))) {
                        CustomToast.show("Pick a time at least 5 minutes from now.");
                        return;
                      }
                      controller.setSchedule(at);
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
          ];
          if (!wide) {
            return Padding(
              padding: const EdgeInsets.symmetric(horizontal: 10),
              child: SingleChildScrollView(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [preview, ...fields]),
              ),
            );
          }
          return SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(28, 12, 28, 28),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SizedBox(
                  width: 480,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Center(child: preview),
                      const SizedBox(height: 12),
                      Text(
                        "Preview. Choose a thumbnail, who can watch, the price and when it goes live, then upload. You can keep using YouPeak while it uploads.",
                        style: GoogleFonts.urbanist(fontSize: 14, color: Colors.grey, height: 1.4),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 32),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [...fields, Align(alignment: Alignment.centerLeft, child: SizedBox(width: 360, child: uploadButton))],
                  ),
                ),
              ],
            ),
          );
        }),
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
    final dark = isDarkMode.value;
    final muted = dark ? AppColor.mutedTextDark : AppColor.mutedText;
    return AppPressable(
      onTap: callback,
      pressedScale: 0.99,
      semanticLabel: subTitle == null || subTitle!.isEmpty ? title : "$title, $subTitle",
      child: Container(
        constraints: const BoxConstraints(minHeight: 56),
        padding: const EdgeInsets.symmetric(vertical: 6),
        child: Row(
          children: [
            Container(
              height: 40,
              width: 40,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(12),
                color: dark ? AppColor.white.withValues(alpha: 0.08) : AppColor.secondaryMintGreen,
              ),
              child: Center(child: AppIcon(leading, size: 22, color: dark ? AppColor.white : AppColor.darkForestAccent)),
            ),
            const SizedBox(width: 12),
            Expanded(
              flex: 5,
              child: Text(title, maxLines: 2, overflow: TextOverflow.ellipsis, style: GoogleFonts.urbanist(fontSize: 16, fontWeight: FontWeight.w700)),
            ),
            const SizedBox(width: 8),
            Expanded(
              flex: 4,
              child: Align(
                alignment: Alignment.centerRight,
                child: Text(
                  subTitle ?? "",
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: GoogleFonts.urbanist(fontSize: 14, fontWeight: FontWeight.w600, color: muted),
                ),
              ),
            ),
            const SizedBox(width: 4),
            trailing ?? Icon(Icons.chevron_right_rounded, size: 24, color: muted),
          ],
        ),
      ),
    );
  }
}

/// Shown in place of the preview when this phone can't play the picked file.
class _PreviewUnavailable extends StatelessWidget {
  const _PreviewUnavailable({required this.height, required this.width});

  final double height;
  final double width;

  @override
  Widget build(BuildContext context) => Container(
        height: height,
        width: width,
        alignment: Alignment.center,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(color: isDarkMode.value ? AppColor.darkElevated : AppColor.grey_200, borderRadius: BorderRadius.circular(18)),
        child: const Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.videocam_off_outlined, size: 36, color: AppColor.grey),
            SizedBox(height: 8),
            Text(
              "Preview isn't available for this video on this phone. You can still upload it.",
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 13),
            ),
          ],
        ),
      );
}
