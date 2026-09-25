import 'dart:async';

import 'package:audioplayers/audioplayers.dart';
import 'package:camera/camera.dart';
import 'package:ffmpeg_kit_flutter_new_min/ffmpeg_kit.dart';
import 'package:get/get.dart';
import 'package:youpeak/core/utils/custom_toast.dart';
import 'package:youpeak/core/utils/custom_video_size.dart';
import 'package:youpeak/core/utils/custom_video_time.dart';
import 'package:youpeak/shared/widgets/loader_ui.dart';
import 'package:youpeak/core/storage/database/database.dart';
import 'package:youpeak/features/bites/api/get_sound_api.dart';
import 'package:youpeak/features/bites/model/get_sound_model.dart';
import 'package:youpeak/features/upload/controller/upload_video_controller.dart';
import 'package:youpeak/features/upload/view/upload_video_view.dart';
import 'package:youpeak/core/services/convert_to_network.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'package:youpeak/core/constants/app_string.dart';
import 'package:path_provider/path_provider.dart';
import 'package:permission_handler/permission_handler.dart';

class CreateShortController extends GetxController {
  final uploadVideoController = Get.find<UploadVideoController>();

  CameraController? cameraController;
  CameraLensDirection cameraLensDirection = CameraLensDirection.front;

  bool isFlashModeOn = false;
  bool isRecordingOn = false;

  //  Do Not Change =>  Min Duration == Recording Duration
  int minDuration = 0;
  int recordingDuration = 0;

  int? selectedSound;
  String? selectedSoundUrl;
  double? selectedSoundTime;

  List<SoundList>? mainSoundList;

  AudioPlayer audioPlayer = AudioPlayer();

  void init() async {
    mainSoundList = null;
    cameraController?.dispose();
    cameraController = null;
    selectedSound = null;
    selectedSoundUrl = null;
    selectedSoundTime = null;
    update(["onInitializeCamera"]);
    await onRequestPermissions();
  }

  void onDispose() {
    cameraController?.dispose();
    cameraController = null;
  }

  Future<void> onRequestPermissions() async {
    final status = await Permission.camera.request();
    if (status.isGranted) {
      onInitializeCamera();
    } else {
      AppSettings.showLog("Please grant camera permission");
    }
  }

  Future<void> onInitializeCamera() async {
    try {
      final cameras = await availableCameras();
      final camera = cameras.firstWhere((camera) => camera.lensDirection == cameraLensDirection, orElse: () => cameras.last);
      cameraController = CameraController(camera, ResolutionPreset.medium);
      await cameraController!.initialize();
      update(["onInitializeCamera"]);
    } catch (e) {
      AppSettings.showLog("Error initializing camera: $e");
    }
  }

  Future<void> onSwitchCamera() async {
    print("flip camera call ::::::::::::::::::");
    if (!isRecordingOn) {
      if (cameraLensDirection == CameraLensDirection.back && cameraController?.value.flashMode == FlashMode.torch) {
        await cameraController?.setFlashMode(FlashMode.off);
        isFlashModeOn = false;
      }
      cameraLensDirection = cameraLensDirection == CameraLensDirection.back ? CameraLensDirection.front : CameraLensDirection.back;
      final cameras = await availableCameras();
      final camera = cameras.firstWhere((camera) => camera.lensDirection == cameraLensDirection);
      cameraController = CameraController(camera, ResolutionPreset.high);
      await cameraController!.initialize();
      update(["onInitializeCamera"]);
    }
  }

  void onChangeFlashMode() async {
    if (cameraController?.value.flashMode == FlashMode.torch) {
      await cameraController?.setFlashMode(FlashMode.off);
      isFlashModeOn = false;
    } else {
      isFlashModeOn = true;
      await cameraController?.setFlashMode(FlashMode.torch);
    }
    update(["onChangeFlashMode"]);
  }

  void onPressRecordingButton() async {
    if (isRecordingOn == false) {
      onStartRecording();
    } else {
      final videoPath = await onStopRecording();

      if (videoPath != null) {
        final videoSize = await CustomVideoSize.onGet(videoPath);
        AppSettings.showLog("Recording Video Size => $videoSize");

        AppSettings.showLog("Video Recording Complete...");
        onUpload(videoPath);
      } else {
        AppSettings.showLog("Video Recording Failed...");
      }
    }
  }

  void onUpload(String videoPath) async {
    if (selectedSoundUrl != null) {
      Get.dialog(barrierDismissible: false, const LoaderUi());
      final removeAudioPath = await onRemoveAudio(videoPath);
      if (removeAudioPath != null) {
        Timer(const Duration(seconds: 10), () async {
          final mergeVideoPath = await onMergeAudioWithVideo(removeAudioPath, selectedSoundUrl!);
          if (mergeVideoPath != null) {
            Timer(const Duration(seconds: 10), () async {
              Get.back(); // Close Loading...
              onCloseEvent();
              Get.back(); // Close Create Shorts Page...
              // Database.isChannel && Database.channelId != null?
              Get.to(
                UploadVideoView(
                  videoPath: mergeVideoPath,
                  loginUserId: Database.loginUserId ?? "",
                  loginUserChannelId: Database.channelId ?? "",
                  videoType: 2,
                ),
              );
              // : CustomToast.show(AppStrings.pleaseCreateChannel.tr);
            });
          } else {
            Get.back();
            AppSettings.showLog("Merge Audio-Video Error !!!");
          }
        });
      } else {
        Get.back();
        AppSettings.showLog("Remove Audio Error !!!");
      }
    } else {
      onCloseEvent();
      Get.back();
      // Database.isChannel && Database.channelId != null
      //     ?
      Get.to(
        UploadVideoView(
          videoPath: videoPath,
          loginUserId: Database.loginUserId ?? "",
          loginUserChannelId: Database.channelId ?? "",
          videoType: 2,
        ),
      );
      // : CustomToast.show(AppStrings.pleaseCreateChannel.tr);
      AppSettings.showLog("Sound Not Selected...");
    }
  }

  void onStartRecording() async {
    try {
      if (cameraController != null && cameraController!.value.isInitialized) {
        Get.dialog(barrierDismissible: false, const LoaderUi());
        await cameraController!.startVideoRecording();
        Get.back();
        if (cameraController!.value.isRecordingVideo) {
          AppSettings.showLog("Video Recording Starting....");
          isRecordingOn = true;
          update(["onPressRecordingButton"]);
          onChangeTimer();
        }
      }
    } catch (e) {
      cameraController?.dispose();
      cameraController = null;
      isRecordingOn = false;
      Get.back();
      update(["onPressRecordingButton"]);
      AppSettings.showLog("Recording Starting Error => $e");
    }
  }

  Future<String?> onStopRecording() async {
    XFile? videoUrl;
    if (Get.currentRoute == "/CreateShortView") {
      try {
        Get.dialog(barrierDismissible: false, const LoaderUi());
        videoUrl = await cameraController!.stopVideoRecording();
        isRecordingOn = false;
        update(["onPressRecordingButton"]);
        AppSettings.showLog("Video Path : ${videoUrl.path}");
        Get.back();
        return videoUrl.path;
      } catch (e) {
        Get.back();
        CustomToast.show(AppStrings.someThingWentWrong.tr);
        AppSettings.showLog("Recording Failed => $e");
        return null;
      }
    } else {
      AppSettings.showLog("User Change Page Routes....");
    }
    return null;
  }

  void onChangeTimer() {
    if (recordingDuration == minDuration) {
      Timer.periodic(const Duration(seconds: 1), (timer) async {
        if (isRecordingOn) {
          if (recordingDuration != 30
              // (selectedSoundTime ?? (AdminSettingsApi.adminSettingsModel?.setting?.durationOfShorts != null ? (AdminSettingsApi.adminSettingsModel!.setting!.durationOfShorts! / 1000) : 30))
              ) {
            recordingDuration++;
            update(["onChangeTimer"]);
          } else {
            timer.cancel();
            recordingDuration = minDuration;
            update(["onChangeTimer"]);
            final videoPath = await onStopRecording();

            if (videoPath != null) {
              final videoSize = await CustomVideoSize.onGet(videoPath);
              AppSettings.showLog("Recording Video Size => $videoSize");

              AppSettings.showLog("Video Recording Complete...");
              onUpload(videoPath);
            } else {
              AppSettings.showLog("Video Recording Failed...");
            }
          }
        } else {
          timer.cancel();
          recordingDuration = minDuration;
          update(["onChangeTimer"]);
        }
      });
    }
  }

  Future<void> onGetSoundList() async {
    if (mainSoundList == null) {
      mainSoundList = await GetSoundApi.callApi() ?? [];
      update(["onGetSoundList"]);
    }
  }

  Future<bool> onCloseEvent() async {
    if (cameraController?.value.flashMode == FlashMode.torch) {
      await cameraController?.setFlashMode(FlashMode.off);
      isFlashModeOn = false;
      update(["onChangeFlashMode"]);
    }
    await Future.delayed(const Duration(milliseconds: 200), () => cameraController?.dispose());
    cameraController = null;
    update(["onInitializeCamera"]);
    AppSettings.showLog("On Close Event Called...");
    return true;
  }

  void onChangeSound(int index) async {
    selectedSound = index;
    update(["onChangeSound"]);
    Get.back();
    selectedSoundUrl = await ConvertToNetwork.convert(mainSoundList![index].soundLink!);

    AppSettings.showLog("Selected Audio Path => $selectedSoundUrl");
    AppSettings.showLog("Selected Audio Path => ${mainSoundList![index].soundImage}");
    if (selectedSoundUrl != "") {
      await audioPlayer.setSourceUrl(selectedSoundUrl!);
      Duration? audioDuration = await audioPlayer.getDuration();
      selectedSoundTime = audioDuration?.inSeconds.toDouble();
    } else {
      selectedSound = null;
      selectedSoundUrl = null;
      selectedSoundTime = null;
      update(["onChangeSound"]);
      CustomToast.show(AppStrings.pleaseSelectOtherSound.tr);
    }
  }

  Future<String?> onRemoveAudio(String videoPath) async {
    final String videoWithoutAudioPath = '${(await getTemporaryDirectory()).path}/RM_${DateTime.now().millisecondsSinceEpoch}.mp4';
    final ffmpegRemoveAudioCommand = '-i $videoPath -c copy -an $videoWithoutAudioPath';
    final sessionRemoveAudio = await FFmpegKit.executeAsync(ffmpegRemoveAudioCommand);
    final returnCodeRemoveAudio = await sessionRemoveAudio.getReturnCode();
    AppSettings.showLog("Remove Audio Path => $videoWithoutAudioPath");
    AppSettings.showLog("Return Code => $returnCodeRemoveAudio");
    return videoWithoutAudioPath;
  }

  Future<String?> onMergeAudioWithVideo(String videoPath, String audioPath) async {
    final String path = '${(await getTemporaryDirectory()).path}/FV_${DateTime.now().millisecondsSinceEpoch}.mp4';

    final videoTime = ((await CustomVideoTime.onGet(videoPath) ?? 0) / 1000);

    if (selectedSoundTime != null && videoTime != 0) {
      AppSettings.showLog("Audio Time => $selectedSoundTime Video Time => $videoTime");

      final minTime = (videoTime < selectedSoundTime!) ? videoTime : selectedSoundTime;

      final command = '-i $videoPath -i $audioPath -t $minTime -c:v copy -c:a aac -strict experimental -map 0:v:0 -map 1:a:0 $path';
      final sessionRemoveAudio = await FFmpegKit.executeAsync(command);
      final returnCodeRemoveAudio = await sessionRemoveAudio.getReturnCode();
      AppSettings.showLog("Merge Video Path => $path");
      AppSettings.showLog("Return Code => $returnCodeRemoveAudio");
      return path;
    } else {
      return null;
    }
  }
}

//
// Future<String?> test(String videoPath, String audioPath) async {
//   final String path = '${(await getTemporaryDirectory()).path}/FV_${DateTime.now().millisecondsSinceEpoch}.mp4';
//
//   final ffmpegCommand = '-i $videoPath -i $audioPath -c:v copy -c:a aac -strict experimental $path';
//
//   await FFmpegKit.executeAsync(ffmpegCommand);
//
//   AppSettings.showLog("Test Video Path => $path");
//
//   return path;
// }
