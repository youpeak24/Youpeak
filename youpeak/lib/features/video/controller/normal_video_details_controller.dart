import 'dart:async';
import 'dart:developer';

import 'package:chewie/chewie.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/widgets.dart';
import 'package:get/get.dart';
import 'package:youpeak/core/ads/google_video_ad.dart';
import 'package:youpeak/core/storage/database/database.dart';
import 'package:youpeak/core/storage/database/watch_history_database.dart';
import 'package:youpeak/features/library/api/create_watch_history_api.dart';
import 'package:youpeak/features/watch_tracking/presentation/watch_heartbeat_tracker.dart';
import 'package:youpeak/features/channel/controller/preview_play_list_controller.dart';
import 'package:youpeak/features/channel/controller/your_channel_controller.dart';
import 'package:youpeak/features/video/api/get_related_video_api.dart';
import 'package:youpeak/features/video/model/get_related_video_model.dart';
import 'package:youpeak/features/video/api/video_details_api.dart';
import 'package:youpeak/features/video/model/video_details_model.dart';
import 'package:youpeak/core/services/convert_to_network.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'package:youpeak/core/utils/utils.dart';
import 'package:video_player/video_player.dart';
import 'package:youpeak/core/platform/local_media.dart';

class NormalVideoDetailsController extends GetxController {
  final yourChannelController = Get.find<YourChannelController>();
  final previewPlayListController = Get.put(PreviewPlayListController());

  TextEditingController commentController = TextEditingController();
  ScrollController scrollController = ScrollController();

  GetRelatedVideoModel? _getRelatedVideoModel;
  VideoDetailsModel? videoDetailsModel;

  VideoPlayerController? videoPlayerController;
  ChewieController? chewieController;

  List<Data>? mainRelatedVideos;

  int selectedWatchedVideo = 0;
  List<WatchedVideoModel> mainWatchedVideos = [];

  String videoId = "";

  RxBool isLike = false.obs;
  RxBool isDisLike = false.obs;
  RxBool isSubscribe = false.obs;
  RxBool isSave = false.obs;
  RxMap customChanges = {"like": 0, "disLike": 0, "comment": 0, "share": 0}.obs;

  RxBool isDisableNext = false.obs;
  RxBool isDisablePrevious = false.obs;

  bool isVideoLoading = false;
  bool isShowVideoControls = false;
  RxBool isVideoDetailsLoading = true.obs;
  bool hasShownPrerollAd = false;
  RxBool isDownloading = false.obs;

  RxBool isLoop = false.obs;
  RxBool isSpeaker = true.obs;
  RxInt currentSpeedIndex = 2.obs;
  final List<double> speedOptions = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];

  // Video Engagement Reward...
  bool isVideoSkip = false;
  bool isGetVideoRewardCoin = false;

  // Reports genuine viewing to the server's watch-time ledger every ~10 s.
  WatchHeartbeatTracker? watchTracker;
  bool _wasPlaying = false;
  bool isHistoryCreated = false;

  // Dynamic Ad Variables - આ બદલાયું છે
  bool showAd = false;
  bool isAdLoading = false;
  bool isVideoReady = false;
  bool hasShownMidrollAd = false;
  Duration pausedPosition = Duration.zero;
  bool wasPlayingBeforeAd = false;
  int adShowCount = 0;
  Widget? adWidget;
  Widget? preRollAdWidget;
  Widget? midRollAdWidget;
  List<int> adTimings = [];
  int totalAdsToShow = 2;
  int minAdInterval = 30;

  @override
  void onInit() {
    super.onInit();
    _preloadAds();
  }

  void _preloadAds() {
    if (!AppSettings.isShowAds) return;

    AppSettings.showLog("🔄 Pre-loading ads...");

    // Pre-roll ad load કરો
    preRollAdWidget = VideoAdServices.createAdWidget(
      onAdStartedCallback: onPreRollAdStarted,
      onAdCompletedCallback: onPreRollAdCompleted,
      onAdFailedCallback: onPreRollAdFailed,
    );

    // Mid-roll ad load કરો
    midRollAdWidget = VideoAdServices.createAdWidget(
      onAdStartedCallback: onMidRollAdStarted,
      onAdCompletedCallback: onMidRollAdCompleted,
      onAdFailedCallback: onMidRollAdFailed,
    );

    AppSettings.showLog("✅ Ads pre-loaded successfully");
  }

  void _initAdSystem() {
    if (!AppSettings.isShowAds) return;
    if (adWidget != null) return;

    adWidget = VideoAdServices.createAdWidget(
      onAdStartedCallback: onAdStarted,
      onAdCompletedCallback: onAdCompleted,
      onAdFailedCallback: onAdFailed,
    );
  }

  void _showPrerollAd() async {
    if (!AppSettings.isShowAds) {
      hasShownPrerollAd = true;
      Future.delayed(const Duration(milliseconds: 300), () {
        videoPlayerController?.play();
        update(['adComplete', 'onVideoPlayPause']);
      });
      return;
    }

    if (hasShownPrerollAd || showAd) return;

    AppSettings.showLog("🎬 Showing pre-roll ad (pre-loaded)");

    hasShownPrerollAd = true;
    showAd = true;
    isAdLoading = false; // ✅ No loading - already loaded!

    update([
      "adComplete",
      "onVideoPlayPause",
      "onShowControls",
      "onProgressLine",
    ]);
  }

  void onAdCompleted() {
    log('✅ Ad completed');

    showAd = false;
    isAdLoading = false;

    if (!hasShownPrerollAd || (hasShownPrerollAd && adShowCount == 0)) {
      // Pre-roll ad complete - start video
      AppSettings.showLog("Pre-roll ad completed, starting video");
      hasShownPrerollAd = true;
      Future.delayed(const Duration(milliseconds: 300), () {
        videoPlayerController?.play();
        update(['adComplete', 'onVideoPlayPause']);
      });
    } else {
      // Mid-roll ad complete - resume video
      AppSettings.showLog("Mid-roll ad completed, resuming video");
      if (videoPlayerController != null) {
        videoPlayerController!.seekTo(pausedPosition);

        if (wasPlayingBeforeAd) {
          Future.delayed(const Duration(milliseconds: 300), () {
            videoPlayerController?.play();
            update(['adComplete', 'onVideoPlayPause']);
          });
        }
      }
    }
  }

  Future<void> init(String videoId, String videoUrl) async {
    this.videoId = videoId;
    onGetRelatedVideos(videoId);
    onGetVideoDetails(videoId);

    await initializeVideoPlayer(videoId, videoUrl);
  }

  void _calculateAdTimings() {
    if (!AppSettings.isShowAds || videoPlayerController == null || !videoPlayerController!.value.isInitialized) {
      adTimings = [];
      return;
    }

    int totalVideoSeconds = videoPlayerController!.value.duration.inSeconds;
    adTimings.clear();

    AppSettings.showLog("Video total duration: $totalVideoSeconds seconds");

    if (totalVideoSeconds < 60) {
      adTimings = [];
      AppSettings.showLog("Video too short - No ads");
    } else {
      int firstAd = totalVideoSeconds ~/ 3;
      int secondAd = (totalVideoSeconds * 2) ~/ 3;

      if (firstAd < minAdInterval) firstAd = minAdInterval;
      if (secondAd - firstAd < minAdInterval) secondAd = firstAd + minAdInterval;

      if (totalVideoSeconds - secondAd < 30) {
        secondAd = totalVideoSeconds - 30;
        if (secondAd <= firstAd) {
          adTimings = [firstAd];
          AppSettings.showLog("Only 1 ad possible at: $adTimings");
        } else {
          adTimings = [firstAd, secondAd];
          AppSettings.showLog("2 ads scheduled at: $adTimings");
        }
      } else {
        adTimings = [firstAd, secondAd];
        AppSettings.showLog("2 ads scheduled at: $adTimings");
      }
    }

    adShowCount = 0;
    totalAdsToShow = adTimings.length;
  }

  bool shouldShowAdCountdown() {
    if (showAd || videoPlayerController == null || adShowCount >= adTimings.length) return false;

    int currentSeconds = videoPlayerController!.value.position.inSeconds;
    int nextAdTime = adTimings[adShowCount];

    return currentSeconds >= (nextAdTime - 10) && currentSeconds < nextAdTime;
  }

  int getSecondsUntilNextAd() {
    if (videoPlayerController == null || adShowCount >= adTimings.length) return 0;

    int currentSeconds = videoPlayerController!.value.position.inSeconds;
    int nextAdTime = adTimings[adShowCount];

    return nextAdTime - currentSeconds;
  }

  void onGetPlayListVideos() {
    if (previewPlayListController.getPlayListVideo == null || previewPlayListController.getPlayListVideo!.isEmpty) return;

    mainWatchedVideos.clear();

    for (int i = previewPlayListController.selectedPlayListVideo + 1; i < previewPlayListController.getPlayListVideo!.length; i++) {
      final item = previewPlayListController.getPlayListVideo![i];

      mainWatchedVideos.add(
        WatchedVideoModel(
          videoId: item.id ?? "",
          videoUrl: item.videoImage ?? "",
        ),
      );
    }

    AppSettings.showLog("Main Watched Videos Length => ${mainWatchedVideos.length}");
  }

  Future<void> onGetRelatedVideos(String videoId) async {
    mainRelatedVideos = null;
    _getRelatedVideoModel = await GetRelatedVideoApi.callApi(loginUserId: Database.loginUserId ?? "", videoId: videoId);

    if (_getRelatedVideoModel != null) {
      mainRelatedVideos = _getRelatedVideoModel?.data ?? [];
    }
    AppSettings.showLog("Playing Related Video Length => ${mainRelatedVideos?.length}");

    mainRelatedVideos?.shuffle();

    update(["onGetRelatedVideos"]);

    if (mainRelatedVideos?.isEmpty ?? true && mainWatchedVideos.length == 1) {
      isDisableNext(true);
    }

    try {
      scrollController.animateTo(0, duration: const Duration(milliseconds: 10), curve: Curves.ease);
    } catch (e) {
      log("Scrolling Failed");
    }
  }

  Future<void> onGetVideoDetails(String videoId) async {
    isVideoDetailsLoading.value = true;

    videoDetailsModel = null;

    videoDetailsModel = await VideoDetailsApi.callApi(Database.loginUserId ?? "", videoId, 1);
    if (videoDetailsModel != null) {
      isLike.value = videoDetailsModel?.detailsOfVideo?.isLike ?? false;
      isDisLike.value = videoDetailsModel?.detailsOfVideo?.isDislike ?? false;
      isSubscribe.value = videoDetailsModel?.detailsOfVideo?.isSubscribed ?? false;
      isSave.value = videoDetailsModel?.detailsOfVideo?.isSaveToWatchLater ?? false;

      customChanges["like"] = videoDetailsModel?.detailsOfVideo?.like ?? 0;
      customChanges["disLike"] = videoDetailsModel?.detailsOfVideo?.dislike ?? 0;
      customChanges["comment"] = videoDetailsModel?.detailsOfVideo?.totalComments ?? 0;
      customChanges["subscribe"] = videoDetailsModel?.detailsOfVideo?.totalSubscribers ?? 0;

      isVideoDetailsLoading.value = false;

      createWatchHistory();
    }
  }

  Future<void> onCreateHistory() async {
    if (isHistoryCreated) return; // Prevent multiple calls
    if (videoPlayerController == null || videoDetailsModel?.detailsOfVideo == null) return;

    final position = videoPlayerController!.value.position;
    final duration = videoPlayerController!.value.duration;

    if (duration.inSeconds == 0) return;

    double watchedPercent = position.inSeconds / duration.inSeconds;

    AppSettings.showLog("Watched % => ${watchedPercent * 100}");

    // 🔴 Only allow if user watched at least 40%
    if (watchedPercent < 0.4) {
      AppSettings.showLog("videoPlayerController!.value.position${videoPlayerController!.value.position.inSeconds}");
      AppSettings.showLog("videoPlayerController!.value.position${videoPlayerController!.value.position.inMinutes}");

      AppSettings.showLog("❌ Video watched less than 40% – history not created");
      return;
    }

    if (isVideoSkip == false) {
      final watchTime = position.inSeconds;
      AppSettings.showLog("videoPlayerController!.value.position${watchTime}");
      AppSettings.showLog("videoPlayerController!.value.position${position.inSeconds}");

      if (Database.loginUserId != null && Database.loginUserId!.isNotEmpty && videoDetailsModel?.detailsOfVideo?.id != null) {
        await CreateWatchHistoryApi.callApi(
          loginUserId: Database.loginUserId!,
          videoId: videoDetailsModel?.detailsOfVideo?.id ?? "",
          videoChannelId: videoDetailsModel?.detailsOfVideo?.channelId ?? "",
          videoUserId: videoDetailsModel?.detailsOfVideo?.userId ?? "",
          watchTimeInMinute: watchTime,
        );

        isHistoryCreated = true;
        AppSettings.showLog("✅ Video watched >= 40% – history created");
      }
    }
  }

  void onToggleVolume() {
    if (isSpeaker.value) {
      isSpeaker.value = false;
      videoPlayerController?.setVolume(0);
    } else {
      videoPlayerController?.setVolume(100);
      isSpeaker.value = true;
    }
  }

  Future<void> initializeVideoPlayer(String videoId, String videoUrl) async {
    try {
      isVideoSkip = false;
      isGetVideoRewardCoin = false;
      _wasPlaying = false;
      isHistoryCreated = false;
      hasShownMidrollAd = false;
      hasShownPrerollAd = false;
      showAd = false;
      isAdLoading = false;
      wasPlayingBeforeAd = false;
      String? cachedPath = Database.onGetVideoUrl(videoId);
      String videoPath = "";
      if (ConvertToNetwork.isValidVideoUrl(cachedPath)) {
        videoPath = cachedPath!;
      } else {
        videoPath = await ConvertToNetwork.convert(videoUrl);
      }

      if (videoPath.isEmpty) {
        AppSettings.showLog("❌ Invalid or empty video URL for videoId: $videoId");
        return;
      }

      if (videoPath.startsWith('http://') || videoPath.startsWith('https://')) {
        videoPlayerController = VideoPlayerController.networkUrl(Uri.parse(videoPath));
      } else {
        videoPlayerController = LocalMedia.videoController(videoPath);
      }

      await videoPlayerController?.initialize();

      if (videoPlayerController != null && (videoPlayerController?.value.isInitialized ?? false)) {
        if (Database.onGetVideoUrl(videoId) == null) {
          Database.onSetVideoUrl(videoId, videoPath);
        }

        _calculateAdTimings();
        _initAdSystem();

        watchTracker?.detach();
        watchTracker = WatchHeartbeatTracker(videoId: videoId)..attach(videoPlayerController!);

        chewieController = ChewieController(
          videoPlayerController: videoPlayerController!,
          autoPlay: false,
          looping: isLoop.value,
          allowedScreenSleep: false,
          allowMuting: false,
          showControlsOnInitialize: false,
          showControls: false,
        );

        videoPlayerController?.addListener(() async {
          if (Get.currentRoute != "/NormalVideoDetailsView") {
            videoPlayerController?.pause();
            AppSettings.showLog("Video Playing Routes Changes...");
          }

          if ((videoPlayerController?.value.isInitialized ?? false)) {
            bool isCurrentlyPlaying = videoPlayerController!.value.isPlaying;

            if (_wasPlaying && !isCurrentlyPlaying) {
              onCreateHistory();
            }
            _wasPlaying = isCurrentlyPlaying;

            if (videoPlayerController!.value.isBuffering) {
              if (isVideoLoading == false) {
                isVideoLoading = true;
                update(["onLoading"]);
              }
            } else {
              if (isVideoLoading == true) {
                isVideoLoading = false;
                update(["onLoading"]);
              }
            }

            update(["onProgressLine", "onVideoTime", "onVideoPlayPause", "adComplete"]);

            _checkMidrollAdTiming();

            if (videoPlayerController!.value.position >= videoPlayerController!.value.duration) {
              AppSettings.showLog("Playing Video Complete...");

              // Watch time is reported continuously by watchTracker (the old
              // completion call sent the video's length, not time watched).
              isGetVideoRewardCoin = true;

              // onCreateHistory();
              if (AppSettings.isAutoPlayVideo.value) {
                if ((mainRelatedVideos?.isNotEmpty ?? false) && mainWatchedVideos.length != 1) {
                  isDisablePrevious(false);
                }

                selectedWatchedVideo++;

                if (selectedWatchedVideo < mainWatchedVideos.length) {
                  onDisposeVideoPlayer();
                  init(mainWatchedVideos[selectedWatchedVideo].videoId, mainWatchedVideos[selectedWatchedVideo].videoUrl);
                } else if (mainRelatedVideos?.isNotEmpty ?? false) {
                  // onCreateHistory();
                  onDisposeVideoPlayer();
                  isDisablePrevious(false);
                  mainWatchedVideos.insert(selectedWatchedVideo, WatchedVideoModel(videoId: mainRelatedVideos![0].id!, videoUrl: mainRelatedVideos![0].videoUrl!));
                  init(mainRelatedVideos![0].id!, mainRelatedVideos![0].videoUrl!);
                  mainRelatedVideos = null;
                  update(["onGetRelatedVideos"]);
                } else {
                  isDisableNext(true);
                }
              }
            }
          }
        });

        if (isSpeaker.value == false) {
          videoPlayerController?.setVolume(0);
        }

        isVideoReady = true;
        _showPrerollAd();
      }

      update(["onVideoInitialize"]);
    } catch (e) {
      AppSettings.showLog("Normal Video Initialization Failed => $e");
      onDisposeVideoPlayer();
    }
  }

  void _checkMidrollAdTiming() {
    if (!AppSettings.isShowAds) return;
    if (!showAd && videoPlayerController != null && videoPlayerController!.value.isPlaying && adShowCount < adTimings.length) {
      int currentSeconds = videoPlayerController!.value.position.inSeconds;
      int targetTime = adTimings[adShowCount];

      if (currentSeconds >= targetTime) {
        _showMidrollAd();
      }
    }
  }

  void _showMidrollAd() async {
    if (!AppSettings.isShowAds || showAd) return;

    AppSettings.showLog("🎬 Showing mid-roll ad ${adShowCount + 1}/${adTimings.length}");

    wasPlayingBeforeAd = videoPlayerController?.value.isPlaying ?? false;
    pausedPosition = videoPlayerController!.value.position;

    Future.delayed(const Duration(milliseconds: 100), () async {
      try {
        await videoPlayerController?.pause();
      } catch (e) {
        Utils.showLog("Pause failed: $e");
      }
    });

    showAd = true;
    isAdLoading = false;
    adShowCount++;

    update([
      "adComplete",
      "onVideoPlayPause",
      "onShowControls",
      "onProgressLine",
    ]);
  }

  void onPreRollAdStarted() {
    isAdLoading = false;
    AppSettings.showLog("✅ Pre-roll ad started");
    update(['adComplete', 'onVideoPlayPause']);
  }

  void onPreRollAdCompleted() {
    log('✅ Pre-roll ad completed, starting video');
    showAd = false;
    isAdLoading = false;

    Future.delayed(const Duration(milliseconds: 200), () {
      videoPlayerController?.play();
      update(['adComplete', 'onVideoPlayPause']);
    });
  }

  void onPreRollAdFailed() {
    AppSettings.showLog("❌ Pre-roll ad failed, starting video");
    showAd = false;
    isAdLoading = false;

    Future.delayed(const Duration(milliseconds: 200), () {
      videoPlayerController?.play();
      update(['adComplete', 'onVideoPlayPause']);
    });
  }

  // ✅ Mid-roll Ad Callbacks
  void onMidRollAdStarted() {
    isAdLoading = false;
    AppSettings.showLog("✅ Mid-roll ad started");
    update(['adComplete', 'onVideoPlayPause']);
  }

  void onMidRollAdCompleted() {
    log('✅ Mid-roll ad completed, resuming video');
    showAd = false;
    isAdLoading = false;

    if (videoPlayerController != null) {
      videoPlayerController!.seekTo(pausedPosition);

      if (wasPlayingBeforeAd) {
        Future.delayed(const Duration(milliseconds: 200), () {
          videoPlayerController?.play();
          update(['adComplete', 'onVideoPlayPause']);
        });
      }
    }
  }

  void onMidRollAdFailed() {
    AppSettings.showLog("❌ Mid-roll ad failed, resuming video");
    showAd = false;
    isAdLoading = false;
    adShowCount--;

    if (videoPlayerController != null) {
      videoPlayerController!.seekTo(pausedPosition);
      if (wasPlayingBeforeAd) {
        Future.delayed(const Duration(milliseconds: 200), () {
          videoPlayerController?.play();
          update(['adComplete', 'onVideoPlayPause']);
        });
      }
    }
  }

  void onAdStarted() {
    isAdLoading = false;
    AppSettings.showLog("Ad started playing, hiding loader");
    update(['adComplete', 'onVideoPlayPause']);
  }

  void onAdFailed() {
    AppSettings.showLog("Ad failed to load, resuming video");
    showAd = false;
    isAdLoading = false;
    adShowCount--;

    if (videoPlayerController != null) {
      videoPlayerController!.seekTo(pausedPosition);
      if (wasPlayingBeforeAd) {
        Future.delayed(const Duration(milliseconds: 300), () {
          videoPlayerController?.play();
        });
      }
    }

    update(['adComplete', 'onVideoPlayPause']);
  }

  void onAdCompleted1() {
    log('Mid-roll ad completed, resuming video...');

    showAd = false;
    isAdLoading = false;

    if (videoPlayerController != null) {
      videoPlayerController!.seekTo(pausedPosition);

      if (wasPlayingBeforeAd) {
        Future.delayed(const Duration(milliseconds: 300), () {
          videoPlayerController?.play();
          update(['adComplete', 'onVideoPlayPause']);
        });
      }
    }
  }

  void onChangeVideoLoading() {
    isVideoLoading = !isVideoLoading;
    update(["onChangeVideoLoading"]);
  }

  void onDisposeVideoPlayer() {
    watchTracker?.detach();
    watchTracker = null;
    videoPlayerController?.dispose();
    chewieController?.dispose();
    chewieController = null;
    showAd = false;
    hasShownPrerollAd = false;
    adWidget = null;
    isAdLoading = false;
    hasShownMidrollAd = false;
    wasPlayingBeforeAd = false;
    adShowCount = 0;
    adTimings.clear();
    update(["onVideoInitialize", "adComplete"]);
  }

  void onNextVideo() {
    isDisablePrevious(false);

    selectedWatchedVideo++;

    if (selectedWatchedVideo != mainWatchedVideos.length) {
      onDisposeVideoPlayer();
      onCreateHistory();
      init(mainWatchedVideos[selectedWatchedVideo].videoId, mainWatchedVideos[selectedWatchedVideo].videoUrl);
    } else if (mainRelatedVideos?.isNotEmpty ?? false) {
      onCreateHistory();
      onDisposeVideoPlayer();
      isDisablePrevious(false);
      mainWatchedVideos.insert(selectedWatchedVideo, WatchedVideoModel(videoId: mainRelatedVideos![0].id!, videoUrl: mainRelatedVideos![0].videoUrl!));
      init(mainRelatedVideos![0].id!, mainRelatedVideos![0].videoUrl!);
      mainRelatedVideos = null;
      update(["onGetRelatedVideos"]);
    } else {
      isDisableNext(true);
    }
  }

  void onPreviousVideo() async {
    isDisableNext(false);

    selectedWatchedVideo--;
    if (selectedWatchedVideo >= 0) {
      onDisposeVideoPlayer();
      init(mainWatchedVideos[selectedWatchedVideo].videoId, mainWatchedVideos[selectedWatchedVideo].videoUrl);
    }
    if (selectedWatchedVideo == 0) {
      isDisablePrevious(true);
    }
  }

  Future<void> onChangeLoop() async {
    if (videoPlayerController != null) {
      chewieController = null;

      chewieController = ChewieController(
        videoPlayerController: videoPlayerController!,
        looping: isLoop.value,
        allowedScreenSleep: false,
        allowMuting: false,
        showControlsOnInitialize: false,
        showControls: false,
      );
      update(["onVideoInitialize"]);
    }
  }

  void createWatchHistory() async {
    if (AppSettings.isCreateHistory.value) {
      AppSettings.showLog("Create Watch History Method Called");
      bool isAvailable = false;
      for (int index = 0; index < WatchHistory.mainWatchHistory.length; index++) {
        if (WatchHistory.mainWatchHistory[index]["videoId"] == videoDetailsModel!.detailsOfVideo!.id) {
          AppSettings.showLog("Replace Watch History");
          WatchHistory.mainWatchHistory.insert(0, WatchHistory.mainWatchHistory.removeAt(index));
          isAvailable = true;
          break;
        } else {
          AppSettings.showLog("Not Match");
        }
      }
      if (isAvailable == false) {
        AppSettings.showLog("Create New Watch History");
        WatchHistory.mainWatchHistory.insert(
          0,
          {
            "id": DateTime.now().millisecondsSinceEpoch,
            "videoId": videoDetailsModel!.detailsOfVideo!.id,
            "videoTitle": videoDetailsModel!.detailsOfVideo!.title,
            "videoType": videoDetailsModel!.detailsOfVideo!.videoType,
            "videoTime": videoDetailsModel!.detailsOfVideo!.videoTime,
            "videoUrl": videoDetailsModel!.detailsOfVideo!.videoUrl,
            "videoImage": videoDetailsModel!.detailsOfVideo!.videoImage,
            "views": videoDetailsModel!.detailsOfVideo!.views,
            "channelName": videoDetailsModel!.detailsOfVideo!.channelName,
          },
        );
      }
      WatchHistory.onSet();
    }
  }

  void showVideoControls() {
    if (showAd) return;

    isShowVideoControls = !isShowVideoControls;
    update(["onShowControls"]);
  }

  Future<void> forwardSkipVideo() async {
    if (showAd || videoPlayerController == null) return;

    final currentPosition = videoPlayerController!.value.position;
    final maxDuration = videoPlayerController!.value.duration;
    final targetPosition = currentPosition + const Duration(seconds: 10);

    if (targetPosition > maxDuration) {
      await videoPlayerController!.seekTo(maxDuration);
    } else {
      await videoPlayerController!.seekTo(targetPosition);
    }
    isVideoSkip = true;
  }

  Future<void> backwardSkipVideo() async {
    if (showAd || videoPlayerController == null) return;

    final currentPosition = videoPlayerController!.value.position;
    final targetPosition = currentPosition - const Duration(seconds: 10);

    if (targetPosition < Duration.zero) {
      await videoPlayerController!.seekTo(Duration.zero);
    } else {
      await videoPlayerController!.seekTo(targetPosition);
    }
  }

  @override
  void onClose() {
    watchTracker?.detach();
    watchTracker = null;
    videoPlayerController?.dispose();
    chewieController?.dispose();
    VideoAdServices.dispose();
    preRollAdWidget = null;
    midRollAdWidget = null;
    super.onClose();
  }
}

class WatchedVideoModel {
  final String videoId;
  final String videoUrl;

  WatchedVideoModel({required this.videoId, required this.videoUrl});
}
