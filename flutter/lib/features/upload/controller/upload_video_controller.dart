import 'dart:io';

import 'package:chewie/chewie.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:intl/intl.dart';
import 'package:image_picker/image_picker.dart';
import 'package:youpeak/core/utils/custom_check_internet.dart';
import 'package:youpeak/core/platform/media_duration.dart';
import 'package:youpeak/features/channel/data/channel_lookup.dart';
import 'package:youpeak/core/utils/custom_toast.dart';
import 'package:youpeak/shared/widgets/loader_ui.dart';
import 'package:youpeak/core/storage/database/database.dart';
import 'package:youpeak/core/notification/local_notification_services.dart';
import 'package:youpeak/core/assets/app_visuals.dart';
import 'package:youpeak/core/constants/app_constant.dart';
import 'package:youpeak/core/file_upload/direct_upload_video_api.dart';
import 'package:youpeak/core/file_upload/upload_models.dart';
import 'package:youpeak/core/network/app_api_client.dart';
import 'package:youpeak/core/file_upload/convert_video_image_api.dart';
import 'package:youpeak/features/profile/api/get_profile_api.dart';
import 'package:youpeak/features/upload/api/upload_video_api.dart';
import 'package:youpeak/features/library/controller/nav_library_controller.dart';
import 'package:youpeak/features/library/view/your_video_page.dart';
import 'package:youpeak/features/channel/api/get_channel_video_api.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'package:youpeak/core/constants/app_string.dart';
import 'package:path_provider/path_provider.dart';
import 'package:video_player/video_player.dart';
import 'package:video_thumbnail/video_thumbnail.dart';
import 'package:youpeak/core/platform/local_media.dart';
import 'package:youpeak/core/platform/video_frame.dart';

class UploadVideoController extends GetxController {
  final libraryController = Get.put(NavLibraryPageController());

  TextEditingController videoTitleController = TextEditingController();
  TextEditingController videoDescriptionController = TextEditingController();
  TextEditingController videoHashtagController = TextEditingController();

  TextEditingController channelName = TextEditingController(); // This is Use to Create Channel...
  TextEditingController channelDescription = TextEditingController(); // This is Use to Create Channel...

  RxList hashTagCollection = [].obs;

  RxInt selectVisibility = 0.obs;

  RxInt selectAudience = 0.obs;

  RxInt videoChargeType = 1.obs;

  RxString selectDate = AppStrings.now.tr.obs;

  RxInt scheduleType = 2.obs; // [1 - Selected Data  2 - Now]

  RxInt selectComments = 0.obs;

  // When a scheduled video goes live (device-local time; sent as UTC).
  DateTime? scheduleAt;

  /// Every upload starts from the defaults: Public, Free, all audiences,
  /// comments allowed, published now. (This controller lives as long as the
  /// main screen, so the previous upload's choices used to carry over —
  /// e.g. a later upload silently staying "Paid".)
  void resetUploadOptions() {
    selectVisibility.value = 0;
    selectAudience.value = 0;
    videoChargeType.value = 1;
    selectComments.value = 0;
    clearSchedule();
  }

  void setSchedule(DateTime at) {
    scheduleAt = at;
    scheduleType.value = 1;
    final zone = at.timeZoneName;
    selectDate.value = "${DateFormat("d MMM yyyy, h:mm a").format(at)}${zone.isNotEmpty ? " ($zone)" : ""}";
  }

  void clearSchedule() {
    scheduleAt = null;
    scheduleType.value = 2;
    selectDate.value = AppStrings.now.tr;
  }

  bool scheduleIsValid() => scheduleAt != null && scheduleAt!.isAfter(DateTime.now().add(const Duration(minutes: 5)));

  RxString thumbnail = "".obs;

  void onGetThumbnail(String videoPath) async {
    thumbnail.value = "";
    if (kIsWeb) {
      // video_thumbnail is native-only; the browser grabs a frame itself.
      final frame = await captureVideoFrame(videoPath);
      if (frame != null) thumbnail.value = LocalMedia.remember(XFile(frame, name: "thumbnail.jpg", mimeType: "image/jpeg"));
      return;
    }
    try {
      final videoThumbnail = await VideoThumbnail.thumbnailFile(
        video: videoPath,
        thumbnailPath: (await getTemporaryDirectory()).path,
        imageFormat: ImageFormat.JPEG,
        timeMs: -1,
        maxHeight: 400,
        quality: 100,
      );
      if (videoThumbnail != null) {
        thumbnail.value = videoThumbnail;
      }
    } catch (e) {
      debugPrint("Get Thumbnail Error !! => $e");
    }
  }

  Future<void> pickImage() async {
    try {
      Get.dialog(const LoaderUi(color: AppColor.white), barrierDismissible: false);
      // Bounded size: the thumbnail travels in one API request (4 MB limit).
      final image = await ImagePicker().pickImage(source: ImageSource.gallery, maxWidth: 1280, maxHeight: 1280, imageQuality: 85);
      if (image != null) {
        AppSettings.showLog("Pick Image Path => ${image.path}");
        thumbnail.value = LocalMedia.remember(image);
        Get.back();
      } else {
        Get.back();
      }
    } catch (e) {
      Get.back();
      AppSettings.showLog("Image Picker Error => $e");
    }
  }

  RxString selectCounty = "".obs;
  double latitude = 0.0;
  double longitude = 0.0;

  VideoPlayerController? videoPlayerController;
  ChewieController? chewieController;
  RxInt videoTime = 0.obs;
  RxBool isPlaying = false.obs;

  /// The in-form preview couldn't be started for this file on this device
  /// (an unsupported codec, a decoder limit, …). The upload itself doesn't
  /// need the preview, so the form stays and the video can still be published.
  final RxBool previewUnavailable = false.obs;

  /// Who owns a channel, from the server's record (replaceable in tests).
  ChannelLookupService channelLookup = ChannelLookupService();

  Future<ChannelLookup> resolveChannel() => channelLookup.lookupOwn();

  Future<void> initializeVideoPlayer(String videoUrl) async {
    previewUnavailable.value = false;
    videoTime.value = 0;
    videoPlayerController = LocalMedia.videoController(videoUrl);
    try {
      await videoPlayerController?.initialize();

      if (videoPlayerController?.value.isInitialized ?? false) {
        videoTime.value = videoPlayerController!.value.duration.inSeconds;

        chewieController = ChewieController(
          videoPlayerController: videoPlayerController!,
          autoPlay: false,
          looping: false,
          allowedScreenSleep: false,
          allowMuting: false,
          showControlsOnInitialize: false,
          showControls: false,
        );

        update(["initializeVideoPlayer"]);

        if (videoPlayerController!.value.isInitialized) {
          update(["onProgressLine", "onVideoTime"]);
        }

        videoPlayerController?.addListener(() {
          if (videoPlayerController!.value.position >= videoPlayerController!.value.duration) {
            isPlaying.value = false;
          }
          if (videoPlayerController!.value.isInitialized) {
            update(["onProgressLine", "onVideoTime"]);
          }
        });
      }
    } catch (e) {
      AppSettings.showLog("Video preview failed => ${e.runtimeType}");
    }

    if (!(videoPlayerController?.value.isInitialized ?? false)) {
      // No preview. Keep the form (and the user's work) and read the length
      // another way: the server needs it to publish.
      chewieController?.dispose();
      chewieController = null;
      videoPlayerController?.dispose();
      videoPlayerController = null;
      previewUnavailable.value = true;
      update(["initializeVideoPlayer"]);
      final seconds = await probeDurationSeconds(videoUrl);
      if (seconds != null && seconds > 0) videoTime.value = seconds;
      CustomToast.show(
        videoTime.value > 0
            ? "A preview isn't available for this video on this phone, but you can still upload it."
            : "This phone can't read this video. Choose a different video (MP4 works best).",
        long: true,
      );
    }
  }

  void onStopVideoPlay() {
    if (isPlaying.value) {
      isPlaying.value = false;
      videoPlayerController?.pause();
    }
  }

  /// The last upload that failed (not cancelled), kept so the banner's Retry
  /// can run it again without the form: everything it needs is in the request,
  /// and the picked file is still where the picker put it.
  UploadRequest? failedUpload;

  Future<void> onUploadVideoProcess(String videoPath, int videoType, String loginUserId, String loginUserChannelId) async {
    // Use => Check value is empty or not...
    if (videoTitleController.text.trim().isEmpty) {
      CustomToast.show(AppStrings.pleaseEnterVideoTitle.tr);
      return;
    }
    if (!CustomCheckInternet.isConnect.value) {
      CustomToast.show(AppStrings.connectionIssue.tr);
      AppSettings.showLog("Internet Connection Failed !!!");
      return;
    }
    // A second tap (or a second tab's worth of clicks) must not start a second
    // upload of the same video.
    if (AppSettings.isUploading.value) {
      CustomToast.show("Already video upload running !!");
      return;
    }
    if (videoTime.value <= 0) {
      // YouPeak needs the length to publish. Stay on the form.
      CustomToast.show("Couldn't read this video's length. Choose a different video (MP4 works best).", long: true);
      return;
    }
    if (thumbnail.value.isEmpty) {
      // Stay on the form: the thumbnail is still being prepared or must be chosen.
      CustomToast.show("The thumbnail isn't ready yet. Wait a moment or choose one.");
      return;
    }

    final request = UploadRequest(
      videoPath: videoPath,
      thumbnailPath: thumbnail.value,
      isNormalVideo: videoType == 1,
      title: videoTitleController.text.trim(),
      description: videoDescriptionController.text,
      hashTag: List.of(hashTagCollection),
      videoType: videoType,
      videoTime: videoTime.value,
      visibilityType: selectVisibility.value,
      audienceType: selectAudience.value,
      commentType: selectComments.value,
      scheduleType: scheduleType.value,
      // ISO 8601 in UTC: the server keeps it hidden until then (an unzoned
      // date used to be read as midnight UTC).
      scheduleTime: scheduleType.value == 1 && scheduleAt != null ? scheduleAt!.toUtc().toIso8601String() : "",
      location: selectCounty.value,
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      loginUserId: loginUserId,
      loginChannelId: loginUserChannelId,
      channelName: channelName.text,
      channelDescription: channelDescription.text,
      videoPrivacyType: videoChargeType.value,
    );

    Get.back();
    onStopVideoPlay();
    CustomToast.show(AppStrings.videoUploading.tr);
    await runUpload(request);
  }

  /// Runs the whole upload: video to Cloudflare, thumbnail, then publishing.
  /// Never throws; a failure is reported to the user and kept for Retry.
  Future<void> runUpload(UploadRequest request) async {
    if (AppSettings.isUploading.value) return;
    failedUpload = null;
    final job = UploadCancelToken();
    AppSettings.uploadError.value = "";
    AppSettings.uploadCancel.value = job;
    AppSettings.uploadProgress.value = -1;
    AppSettings.uploadStatus.value = "Preparing upload…";
    AppSettings.isUploading.value = true;
    AppSettings.showLog("Video Path => ${request.videoPath}");

    String? videoUrl;
    String? thumbnailUrl;
    var published = false;
    try {
      videoUrl = await DirectUploadVideoApi.upload(
        request.videoPath,
        request.isNormalVideo,
        cancel: job,
        onProgress: (fraction) => AppSettings.uploadProgress.value = fraction,
        onStatus: (status) {
          AppSettings.uploadStatus.value = status;
          if (!status.startsWith("Uploading")) AppSettings.uploadProgress.value = -1;
        },
      );
      job.throwIfCancelled();

      AppSettings.uploadProgress.value = -1;
      AppSettings.uploadStatus.value = "Saving thumbnail…";
      thumbnailUrl = await ConvertVideoImageApi.upload(request.thumbnailPath, request.isNormalVideo, cancel: job);
      job.throwIfCancelled();

      AppSettings.uploadStatus.value = "Publishing…";
      await UploadVideoApi.publish(
        title: request.title,
        description: request.description,
        hashTag: request.hashTag,
        videoType: request.videoType,
        videoTime: request.videoTime,
        visibilityType: request.visibilityType,
        audienceType: request.audienceType,
        commentType: request.commentType,
        scheduleType: request.scheduleType,
        scheduleTime: request.scheduleTime,
        location: request.location,
        latitude: request.latitude,
        longitude: request.longitude,
        loginUserId: request.loginUserId,
        loginChannelId: request.loginChannelId,
        videoUrl: videoUrl,
        videoImage: thumbnailUrl,
        channelName: request.channelName,
        channelDescription: request.channelDescription,
        videoPrivacyType: request.videoPrivacyType,
        cancel: job,
      );
      published = true;

      CustomToast.celebrate(AppStrings.videoUploadSuccessfully.tr, AppVisuals.uploadDone);
      sendNotification("Upload Success", request.title);
      onDeleteDirectory();
      if (Database.isChannel == false || Database.channelId == null) {
        await GetProfileApi.callApi(Database.loginUserId ?? "");
      }
    } on UploadFailure catch (failure) {
      AppSettings.showLog("Upload stopped => $failure");
      if (!published) await _abandon(videoUrl, thumbnailUrl);
      if (failure.code == "CANCELLED") {
        CustomToast.show("Upload cancelled.");
        onDeleteDirectory();
      } else {
        failedUpload = request;
        AppSettings.uploadError.value = failure.userMessage;
        CustomToast.show(failure.userMessage, long: true);
        sendNotification("Upload Failed !!", request.title);
      }
    } catch (e) {
      // Not one of ours: a programming error or a platform failure. Say so
      // rather than blaming the network, and keep the details for the log.
      AppSettings.showLog("Upload crashed => ${e.runtimeType}");
      if (!published) await _abandon(videoUrl, thumbnailUrl);
      failedUpload = request;
      AppSettings.uploadError.value = "Something unexpected stopped the upload. Please try again.";
      CustomToast.show(AppSettings.uploadError.value, long: true);
    } finally {
      AppSettings.isUploading.value = false;
      AppSettings.uploadCancel.value = null;
      AppSettings.uploadProgress.value = -1;
      AppSettings.uploadStatus.value = "";
    }
  }

  /// Retry from the failure banner.
  Future<void> retryFailedUpload() async {
    final request = failedUpload;
    if (request == null) return;
    await runUpload(request);
  }

  /// Dismiss the failure banner; the picked file is no longer needed.
  void dismissFailedUpload() {
    failedUpload = null;
    AppSettings.uploadError.value = "";
    onDeleteDirectory();
  }

  /// Best effort: ask the server to delete files from an upload that will
  /// never be published (it only deletes unused uploads that belong to this
  /// user, so it cannot touch a video that did get published). Whatever is
  /// missed here is removed by the server's daily cleanup of expired uploads.
  Future<void> _abandon(String? videoUrl, String? thumbnailUrl) async {
    if (videoUrl == null && thumbnailUrl == null) return;
    try {
      await AppApiClient().post(Constant.abandonUpload, {
        if (videoUrl != null) "videoUrl": videoUrl,
        if (thumbnailUrl != null) "imageUrl": thumbnailUrl,
      });
    } catch (e) {
      AppSettings.showLog("Abandon upload failed => ${e.runtimeType}");
    }
  }

  void sendNotification(String title, String body) {
    LocalNotificationServices.onSendNotification(
      title,
      body,
      () {
        GetChannelVideoApiClass.startPagination[0] = 0;
        GetChannelVideoApiClass.startPagination[1] = 0;
        libraryController.mainChannelVideos[0] = null;
        libraryController.mainChannelVideos[1] = null;
        libraryController.typeWiseGetChannelVideo(0);
        Get.to(() => const YourVideoPageView());
      },
    );
  }

  Future<void> onDeleteDirectory() async {
    if (kIsWeb) return; // browser uploads leave no temp files behind
    Directory tempDir = await getTemporaryDirectory();

    if (await tempDir.exists()) {
      try {
        await tempDir.delete(recursive: true);
        debugPrint('Temporary directory removed successfully');
      } catch (e) {
        debugPrint('Error while removing temporary directory: $e');
      }
    } else {
      debugPrint('Temporary directory does not exist');
    }
  }
}

/// Everything needed to (re)run one upload, captured when the user taps Upload.
class UploadRequest {
  UploadRequest({
    required this.videoPath,
    required this.thumbnailPath,
    required this.isNormalVideo,
    required this.title,
    required this.description,
    required this.hashTag,
    required this.videoType,
    required this.videoTime,
    required this.visibilityType,
    required this.audienceType,
    required this.commentType,
    required this.scheduleType,
    required this.scheduleTime,
    required this.location,
    required this.latitude,
    required this.longitude,
    required this.loginUserId,
    required this.loginChannelId,
    required this.channelName,
    required this.channelDescription,
    required this.videoPrivacyType,
  });

  final String videoPath;
  final String thumbnailPath;
  final bool isNormalVideo;
  final String title;
  final String description;
  final List hashTag;
  final int videoType;
  final int videoTime;
  final int visibilityType;
  final int audienceType;
  final int commentType;
  final int scheduleType;
  final String scheduleTime;
  final String location;
  final String latitude;
  final String longitude;
  final String loginUserId;
  final String loginChannelId;
  final String channelName;
  final String channelDescription;
  final int videoPrivacyType;
}

// This is Upload Variable

// String upTitle = "";
// String upDescription = "";
// String upCountry = "";
// List upHashTag = [];
// int upVisibilityType = 0;
// int upAudienceType = 0;
// int upCommentType = 0;
// int upScheduleType = 0;
// int upVideoTime = 0;

// upVideoTime = videoTime.value;
// upTitle = videoTitleController.text;
// upDescription = videoDescriptionController.text;
// upHashTag = hashTagCollection;
// upVisibilityType = selectVisibility.value;
// upAudienceType = selectAudience.value;
// upCommentType = selectComments.value;
// upScheduleType = scheduleType.value;
// upCountry = selectCounty.value;

// final videoTime = await CustomVideoTime.onGet(videoPath);

// final videoSize = await CustomVideoSize.onGet(videoPath);

//
// if (videoTime != null && videoSize != null) {
//   final videoThumbnail = await CustomGetThumbnail.onGet(videoPath, videoType);

// Compress Video
// if ((videoTime <= 180000 && videoSize >= 10) || videoType == 2) {
//   final compressVideoPath = await CustomVideoCompress.onCompress(videoPath);
//   if (compressVideoPath != null) {
//     final videoSize = await CustomVideoSize.onGet(compressVideoPath);
//     AppSettings.showLog("Final Upload Video Size => $videoSize");
//     final videoUrl = await ConvertVideoApi.callApi(compressVideoPath, videoType == 1 ? true : false);
//     if (videoUrl != null) {
//       await onCallUploadApi(
//           videoUrl: videoUrl, videoThumbnail: videoThumbnail, videoTime: videoTime, videoType: videoType, loginUserId: loginUserId, loginUserChannelId: loginUserChannelId);
//     } else {
//       AppSettings.showLog("Convert Video Failed !!!");
//       CustomToast.show("Some Thing Went Wrong Please Try Again");
//     }
//   } else {
//     AppSettings.showLog("Compress Video Failed !!!");
//     CustomToast.show("Some Thing Went Wrong Please Try Again");
//   }
// }
// WithOut Compress Video
// else {
// AppSettings.showLog("Selected Video Not Compress");
// final videoSize = await CustomVideoSize.onGet(videoPath);
// AppSettings.showLog("Final Upload Video Size => $videoSize");

//
// chewieController?.dispose();
// chewieController = null;
// videoPlayerController.dispose();

// else {
//   AppSettings.showLog("Get Video Time Failed !!!");
//   CustomToast.show(AppStrings.someThingWentWrong.tr);
// }

// AppSettings.isUploading.value = false;

// void onCloseEvent() {
//   onStopVideoPlay();
//   chewieController?.dispose();
//   chewieController = null;
//   update(["initializeVideoPlayer"]);
//
//   videoTitleController.clear();
//   videoDescriptionController.clear();
//   hashTagCollection.clear();
//   selectCounty.value = "";
// }

// int? convertedVideoTime;
// String? convertedVideoUrl;
// String? convertedVideoImage;

// RxInt selectAgeRestriction = 0.obs;
// final List ageRestrictionCollection = [
//   "Yes, restrict my video to viewers over 18",
//   "No, don’t restrict my video to viewers over 18",
// ];
