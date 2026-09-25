import 'dart:async';
import 'dart:convert';
import 'dart:developer';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:youpeak/shared/widgets/youpeak_emoji.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/core/utils/custom_format_number.dart';
import 'package:youpeak/core/utils/custom_format_timer.dart';
import 'package:youpeak/core/storage/database/database.dart';
import 'package:youpeak/main.dart';
import 'package:youpeak/features/live/widget/device_orientation.dart';
import 'package:youpeak/features/live/controller/socket_manager_controller.dart';
import 'package:youpeak/features/live/service/zego_cloud_token.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:youpeak/core/config/size_config.dart';
import 'package:youpeak/core/constants/app_constant.dart';
import 'package:youpeak/core/assets/app_icons.dart';
import 'package:youpeak/shared/widgets/preview_image.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'package:youpeak/core/constants/app_string.dart';
import 'package:native_device_orientation/native_device_orientation.dart';
import 'package:wakelock_plus/wakelock_plus.dart';
import 'package:zego_express_engine/zego_express_engine.dart';

class LivePage extends StatefulWidget {
  const LivePage({
    super.key,
    required this.isHost,
    required this.localUserID,
    required this.localUserName,
    required this.roomID,
  });

  final bool isHost;
  final String localUserID;
  final String localUserName;
  final String roomID;

  @override
  State<LivePage> createState() => _LivePageState();
}

class _LivePageState extends State<LivePage> with WidgetsBindingObserver {
  TextEditingController commentController = TextEditingController();

  Widget? hostCameraView;
  int? hostCameraViewID;

  Widget? hostScreenView;
  int? hostScreenViewID;

  bool isCameraEnabled = true;
  bool isSharingScreen = false;
  ZegoScreenCaptureSource? screenSharingSource;

  bool isLandscape = false;

  List<StreamSubscription> subscriptions = [];

  SocketManagerController socketManagerController = Get.put(SocketManagerController());

  @override
  void initState() {
    WakelockPlus.enable();
    onChangeTime();

    startListenEvent();
    loginRoom();
    subscriptions.addAll([
      NativeDeviceOrientationCommunicator().onOrientationChanged().listen((NativeDeviceOrientation orientation) {
        updateAppOrientation(orientation);
      }),
    ]);

    SystemChrome.setSystemUIOverlayStyle(
      const SystemUiOverlayStyle(
        statusBarIconBrightness: Brightness.light,
        statusBarColor: Colors.black,
      ),
    );

    WidgetsBinding.instance.addObserver(this);
    super.initState();
  }

  @override
  void dispose() {
    WakelockPlus.disable();
    isLivePage = false;
    for (var sub in subscriptions) {
      sub.cancel();
    }
    socketManagerController.userWatchCount = 0;
    socketManagerController.mainLiveChats.clear();
    if (widget.isHost == false) {
      stopListenEvent();
    }
    logoutRoom();
    resetAppOrientation();
    if (widget.isHost) {
      var endLiveUser = jsonEncode({
        "liveHistoryId": widget.roomID,
      });
      socket!.emit("endLiveUser", endLiveUser);
    }

    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.paused) {
      Get.back();
    }
  }

  RxInt countTime = 0.obs;
  bool isLivePage = false;

  void sendLiveChat(String text) {
    final data = jsonEncode({
      "name of user": AppSettings.channelName.value,
      "image": AppSettings.profileImage.value,
      "liveChat text": text,
      "liveHistoryId": widget.roomID,
    });

    if (socket != null && socket!.connected) {
      socket!.emit("liveChat", data);
      log("User Chat Emit Success");
    } else {
      log("Socket is not connected.");
    }
  }

  void onChangeTime() {
    isLivePage = true;
    if (widget.isHost) {
      Timer.periodic(const Duration(seconds: 1), (timer) {
        if (isLivePage) {
          countTime++;
        } else {
          timer.cancel();
          countTime.value = 0;
        }
      });
    }
  }

  Widget get screenView => isSharingScreen ? (hostScreenView ?? const SizedBox()) : const SizedBox();

  Widget get cameraView => isCameraEnabled ? (hostCameraView ?? const SizedBox()) : const SizedBox();

  void updateAppOrientation(NativeDeviceOrientation orientation) async {
    if (isLandscape != orientation.isLandscape) {
      isLandscape = orientation.isLandscape;
      debugPrint('updateAppOrientation: ${orientation.name}');
      final videoConfig = await ZegoExpressEngine.instance.getVideoConfig();
      if (isLandscape && (videoConfig.captureWidth > videoConfig.captureHeight)) return;

      final oldValues = {
        'captureWidth': videoConfig.captureWidth,
        'captureHeight': videoConfig.captureHeight,
        'encodeWidth': videoConfig.encodeWidth,
        'encodeHeight': videoConfig.encodeHeight,
      };
      videoConfig
        ..captureHeight = oldValues['captureWidth']!
        ..captureWidth = oldValues['captureHeight']!
        ..encodeHeight = oldValues['encodeWidth']!
        ..encodeWidth = oldValues['encodeHeight']!;
      ZegoExpressEngine.instance.setAppOrientation(orientation.toZegoType);
      ZegoExpressEngine.instance.setVideoConfig(videoConfig);
    }
  }

  void resetAppOrientation() => updateAppOrientation(NativeDeviceOrientation.portraitUp);

  @override
  Widget build(BuildContext context) {
    SystemChrome.setSystemUIOverlayStyle(
      const SystemUiOverlayStyle(
        statusBarIconBrightness: Brightness.light,
        statusBarColor: Colors.transparent,
      ),
    );

    return WillPopScope(
      onWillPop: () async {
        widget.isHost == false
            ? Get.back()
            : Get.bottomSheet(
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
                        width: SizeConfig.blockSizeHorizontal * 12,
                        height: 3,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(60),
                          color: isDarkMode.value ? AppColor.white.withOpacity(0.2) : AppColor.grey_100,
                        ),
                      ),
                      const SizedBox(height: 10),
                      Text(
                        AppStrings.stopLive.tr,
                        style: GoogleFonts.urbanist(
                          fontSize: 22,
                          color: isDarkMode.value ? AppColor.white : AppColor.logOutColor,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 5),
                      const Divider(indent: 30, endIndent: 30),
                      const SizedBox(height: 5),
                      Text(
                        AppStrings.stopLiveDialogText.tr,
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
                                color: AppColor.grey.withOpacity(0.2),
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
                                AppStrings.yesExit.tr,
                                style: GoogleFonts.urbanist(color: AppColor.white, fontWeight: FontWeight.bold, fontSize: 14),
                              ),
                            ),
                            onTap: () => Get.close(2),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              );
        return true;
      },
      child: Scaffold(
        body: SizedBox(
          height: Get.height,
          width: Get.width,
          child: Stack(
            children: [
              SingleChildScrollView(
                child: SizedBox(
                  height: Get.height,
                  width: Get.width,
                  child: cameraView,
                ),
              ),
              Align(
                alignment: Alignment.topCenter,
                child: widget.isHost
                    ? Obx(
                        () => Text(
                          CustomFormatTime.convert(countTime.value * 1000),
                          style: GoogleFonts.urbanist(color: AppColor.white, fontWeight: FontWeight.bold, fontSize: 14),
                        ).paddingOnly(top: 35),
                      )
                    : const Offstage(),
              ),
              Align(
                alignment: Alignment.bottomLeft,
                child: Padding(
                  padding: const EdgeInsets.only(bottom: 118),
                  child: SizedBox(
                    height: Get.height * 0.3,
                    child: SingleChildScrollView(
                      controller: socketManagerController.scrollController,
                      physics: const BouncingScrollPhysics(),
                      child: GetBuilder<SocketManagerController>(
                        id: "onLiveChatListen",
                        builder: (controller) => ListView.builder(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          padding: EdgeInsets.zero,
                          itemCount: controller.mainLiveChats.length,
                          itemBuilder: (context, index) {
                            return ListTile(
                              dense: true,
                              contentPadding: const EdgeInsets.only(left: 20),
                              leading: Container(
                                clipBehavior: Clip.antiAlias,
                                height: 35,
                                width: 35,
                                decoration: const BoxDecoration(shape: BoxShape.circle),
                                child: controller.mainLiveChats[index]["image"] != null
                                    ? Image.network(controller.mainLiveChats[index]["image"], fit: BoxFit.cover)
                                    : Image.asset(AppIcons.profileImage, fit: BoxFit.cover),
                              ),
                              title: Text(
                                controller.mainLiveChats[index]["name of user"] ?? "",
                                style: GoogleFonts.urbanist(fontSize: 15, color: AppColor.white, fontWeight: FontWeight.bold),
                              ),
                              subtitle: SizedBox(
                                width: Get.width / 4,
                                child: EmojiText(
                                  controller.mainLiveChats[index]["liveChat text"] ?? "",
                                  style: GoogleFonts.urbanist(color: AppColor.grey, fontSize: 13),
                                ),
                              ),
                            );
                          },
                        ),
                      ),
                    ),
                  ),
                ),
              ),
              Positioned(
                  top: 30,
                  child: SizedBox(
                    width: Get.width,
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 20),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          GestureDetector(
                            child: widget.isHost
                                ? const Icon(Icons.close, color: AppColor.white, size: 25)
                                : Image.asset(AppIcons.arrowBack, color: AppColor.white, width: 20).paddingOnly(left: 15),
                            onTap: () {
                              widget.isHost == false
                                  ? Get.back()
                                  : Get.bottomSheet(
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
                                              width: SizeConfig.blockSizeHorizontal * 12,
                                              height: 3,
                                              decoration: BoxDecoration(
                                                borderRadius: BorderRadius.circular(60),
                                                color: isDarkMode.value ? AppColor.white.withOpacity(0.2) : AppColor.grey_100,
                                              ),
                                            ),
                                            const SizedBox(height: 10),
                                            Text(
                                              AppStrings.stopLive.tr,
                                              style: GoogleFonts.urbanist(
                                                fontSize: 22,
                                                color: isDarkMode.value ? AppColor.white : AppColor.logOutColor,
                                                fontWeight: FontWeight.bold,
                                              ),
                                            ),
                                            const SizedBox(height: 5),
                                            const Divider(indent: 30, endIndent: 30),
                                            const SizedBox(height: 5),
                                            Text(
                                              AppStrings.stopLiveDialogText.tr,
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
                                                      color: AppColor.grey.withOpacity(0.2),
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
                                                      AppStrings.yesExit.tr,
                                                      style: GoogleFonts.urbanist(color: AppColor.white, fontWeight: FontWeight.bold, fontSize: 14),
                                                    ),
                                                  ),
                                                  onTap: () => Get.close(2),
                                                ),
                                              ],
                                            ),
                                          ],
                                        ),
                                      ),
                                    );
                            },
                          ),
                          Container(
                            height: 28,
                            width: 60,
                            decoration: BoxDecoration(color: AppColor.primaryColor, borderRadius: BorderRadius.circular(20)),
                            child: Center(
                                child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                              children: [
                                const Icon(Icons.visibility, color: AppColor.white),
                                GetBuilder<SocketManagerController>(
                                  builder: (socketManagerController) => Text(
                                    CustomFormatNumber.convert(socketManagerController.userWatchCount).toString(),
                                    style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColor.white),
                                  ).paddingOnly(right: 5),
                                ),
                              ],
                            )),
                          ),
                        ],
                      ),
                    ),
                  )),
              Positioned(
                bottom: 0,
                child: SizedBox(
                  height: Get.height,
                  width: Get.width,
                  child: Align(
                    alignment: Alignment.bottomCenter,
                    child: SingleChildScrollView(
                      child: Container(
                        width: Get.width,
                        height: 118,
                        alignment: Alignment.center,
                        color: AppColor.black.withOpacity(0.5),
                        child: Column(
                          children: [
                            EmojiQuickBar(size: 26, onPick: sendLiveChat),
                            Expanded(
                        child: Row(
                          children: [
                            Expanded(
                              child: Container(
                                decoration: BoxDecoration(
                                  color: AppColor.white,
                                  border: Border.all(color: AppColor.primaryColor),
                                  borderRadius: BorderRadius.circular(15),
                                ),
                                padding: const EdgeInsets.symmetric(vertical: 5),
                                margin: const EdgeInsets.symmetric(horizontal: 20),
                                child: Row(
                                  crossAxisAlignment: CrossAxisAlignment.center,
                                  mainAxisAlignment: MainAxisAlignment.start,
                                  children: [
                                    const SizedBox(width: 15),
                                    Obx(
                                      () => PreviewProfileImage(
                                        size: 40,
                                        id: Database.channelId ?? "",
                                        image: AppSettings.profileImage.value,
                                        fit: BoxFit.cover,
                                      ),
                                    ),
                                    Expanded(
                                      child: TextFormField(
                                        controller: commentController,
                                        style: GoogleFonts.urbanist(color: Colors.black),
                                        keyboardType: TextInputType.multiline,
                                        onFieldSubmitted: (value) {
                                          FocusManager.instance.primaryFocus?.unfocus();
                                          if (commentController.text.isNotEmpty) {
                                            sendLiveChat(commentController.text);
                                            commentController.clear();
                                          }
                                        },
                                        decoration: InputDecoration(
                                          isDense: true,
                                          contentPadding: const EdgeInsets.only(left: 10),
                                          border: InputBorder.none,
                                          hintText: AppStrings.addComments.tr,
                                          hintStyle: GoogleFonts.urbanist(color: Colors.grey, fontSize: 14),
                                        ),
                                      ).paddingSymmetric(horizontal: 20),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                            GestureDetector(
                              onTap: () {
                                if (commentController.text.isNotEmpty) {
                                  FocusManager.instance.primaryFocus?.unfocus();
                                  sendLiveChat(commentController.text);
                                  commentController.clear();
                                }
                              },
                              child: Container(
                                height: 55,
                                width: 55,
                                alignment: Alignment.center,
                                margin: const EdgeInsets.only(right: 15),
                                decoration: BoxDecoration(
                                  color: AppColor.white,
                                  border: Border.all(color: AppColor.primaryColor),
                                  borderRadius: BorderRadius.circular(18),
                                ),
                                child: Image.asset(AppIcons.textSend, width: 22, height: 22),
                              ),
                            ),
                          ],
                        ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
              )
            ],
          ),
        ),
      ),
    );
  }

  Future<ZegoRoomLoginResult> loginRoom() async {
    final user = ZegoUser(widget.localUserID, widget.localUserName);

    final roomID = widget.roomID;

    ZegoRoomConfig roomConfig = ZegoRoomConfig.defaultConfig()..isUserStatusNotify = true;

    if (kIsWeb) {
      roomConfig.token = ZegoTokenUtils.generateToken(Constant.appId, Constant.serverSecret, widget.localUserID);
    }
    return ZegoExpressEngine.instance.loginRoom(roomID, user, config: roomConfig).then((loginRoomResult) async {
      debugPrint('loginRoom: errorCode:${loginRoomResult.errorCode}, extendedData:${loginRoomResult.extendedData}');
      if (loginRoomResult.errorCode == 0) {
        if (widget.isHost) {
          startPreview();
          startPublish();
          log("liveSellingHistoryId :: ${widget.roomID}");
          log("socket null or not :: $socket");
          log("socket connected :: ${socket!.connected}");

          var sellerData = jsonEncode({
            "userId": widget.localUserID,
            "liveHistoryId": widget.roomID,
          });
          if (socket != null && socket!.connected) {
            socket!.emit("liveRoomConnect", sellerData);
          } else {
            log("Socket is not connected.");
          }
        } else {
          socketManagerController.isUserView = true;
          var userData = jsonEncode({
            "userId": widget.localUserID,
            "liveHistoryId": widget.roomID,
          });

          if (socket != null && socket!.connected) {
            log("user add view emit");
            socket!.emit("addView", userData);
          } else {
            log("Socket is not connected.");
          }
        }
      } else {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('loginRoom failed: ${loginRoomResult.errorCode}')));
      }
      return loginRoomResult;
    });
  }

  Future<ZegoRoomLogoutResult> logoutRoom() async {
    stopPreview();
    stopPublish();
    stopScreenSharing();
    if (screenSharingSource != null) ZegoExpressEngine.instance.destroyScreenCaptureSource(screenSharingSource!);
    return await ZegoExpressEngine.instance.logoutRoom(widget.roomID);
  }

  void startListenEvent() {
    ZegoExpressEngine.onRoomUserUpdate = (roomID, updateType, List<ZegoUser> userList) {
      debugPrint('onRoomUserUpdate: roomID: $roomID, updateType: ${updateType.name}, userList: ${userList.map((e) => e.userID)}');
    };
    ZegoExpressEngine.onRoomStreamUpdate = (roomID, updateType, List<ZegoStream> streamList, extendedData) {
      debugPrint('onRoomStreamUpdate: roomID: $roomID, updateType: $updateType, streamList: ${streamList.map((e) => e.streamID)}, extendedData: $extendedData');
      if (updateType == ZegoUpdateType.Add) {
        for (final stream in streamList) {
          startPlayStream(stream.streamID);
        }
      } else {
        for (final stream in streamList) {
          stopPlayStream(stream.streamID);
        }
      }
    };
    ZegoExpressEngine.onRoomStateUpdate = (roomID, state, errorCode, extendedData) {
      debugPrint('onRoomStateUpdate: roomID: $roomID, state: ${state.name}, errorCode: $errorCode, extendedData: $extendedData');
    };

    ZegoExpressEngine.onPublisherStateUpdate = (streamID, state, errorCode, extendedData) {
      debugPrint('onPublisherStateUpdate: streamID: $streamID, state: ${state.name}, errorCode: $errorCode, extendedData: $extendedData');
    };
    ZegoExpressEngine.onPublisherStateUpdate = (streamID, state, errorCode, extendedData) {
      debugPrint('onPublisherStateUpdate: streamID: $streamID, state: ${state.name}, errorCode: $errorCode, extendedData: $extendedData');
    };

    ZegoExpressEngine.onRoomStreamExtraInfoUpdate = (String roomID, List<ZegoStream> streamList) {
      for (ZegoStream stream in streamList) {
        try {
          Map<String, dynamic> extraInfoMap = jsonDecode(stream.extraInfo);
          if (extraInfoMap['isCameraEnabled'] is bool) {
            setState(() {
              isCameraEnabled = extraInfoMap['isCameraEnabled'];
            });
          }
        } catch (e) {
          debugPrint('streamExtraInfo is not json');
        }
      }
    };
    ZegoExpressEngine.onApiCalledResult = (int errorCode, String funcName, String info) {
      if (errorCode != 0) {
        String errorMessage = 'onApiCalledResult, $funcName failed: $errorCode, $info';
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(errorMessage)));
        debugPrint(errorMessage);

        if (funcName == 'startScreenCapture') {
          stopScreenSharing();
        }
      }
    };

    ZegoExpressEngine.onPlayerVideoSizeChanged = (String streamID, int width, int height) {
      String message = 'onPlayerVideoSizeChanged: $streamID, ${width}x$height,isLandScape: ${width > height}';
      debugPrint(message);
    };
  }

  void stopListenEvent() {
    log("Stop listening event called");
    var userData = jsonEncode({
      "userId": widget.localUserID,
      "liveHistoryId": widget.roomID,
    });
    socket?.emit("lessView", userData);

    ZegoExpressEngine.onRoomUserUpdate = null;
    ZegoExpressEngine.onRoomStreamUpdate = null;
    ZegoExpressEngine.onRoomStateUpdate = null;
    ZegoExpressEngine.onPublisherStateUpdate = null;
    ZegoExpressEngine.onApiCalledResult = null;
    ZegoExpressEngine.onPlayerVideoSizeChanged = null;
  }

  Future<void> startScreenSharing() async {
    screenSharingSource ??= (await ZegoExpressEngine.instance.createScreenCaptureSource())!;
    await ZegoExpressEngine.instance.setVideoConfig(
      ZegoVideoConfig.preset(ZegoVideoConfigPreset.Preset720P)..fps = 10,
      channel: ZegoPublishChannel.Aux,
    );
    await ZegoExpressEngine.instance.setVideoSource(ZegoVideoSourceType.ScreenCapture, channel: ZegoPublishChannel.Aux);
    await screenSharingSource!.startCapture();
    String streamID = '${widget.roomID}_${widget.localUserID}_screen';
    await ZegoExpressEngine.instance.startPublishingStream(streamID, channel: ZegoPublishChannel.Aux);
    await ZegoExpressEngine.instance.stopPublishingStream(channel: ZegoPublishChannel.Aux);
    await ZegoExpressEngine.instance.startPublishingStream(streamID, channel: ZegoPublishChannel.Aux);
    setState(() => isSharingScreen = true);

    bool needPreview = false;
    // ignore: dead_code
    if (needPreview && (hostScreenViewID == null)) {
      await ZegoExpressEngine.instance.createCanvasView((viewID) async {
        hostScreenViewID = viewID;
        ZegoCanvas previewCanvas = ZegoCanvas(viewID, viewMode: ZegoViewMode.AspectFit);
        ZegoExpressEngine.instance.startPreview(canvas: previewCanvas, channel: ZegoPublishChannel.Aux);
      }).then((canvasViewWidget) {
        setState(() => hostScreenView = canvasViewWidget);
      });
    }
  }

  Future<void> stopScreenSharing() async {
    await screenSharingSource?.stopCapture();
    await ZegoExpressEngine.instance.stopPreview(channel: ZegoPublishChannel.Aux);
    await ZegoExpressEngine.instance.stopPublishingStream(channel: ZegoPublishChannel.Aux);
    await ZegoExpressEngine.instance.setVideoSource(ZegoVideoSourceType.None, channel: ZegoPublishChannel.Aux);
    if (mounted) setState(() => isSharingScreen = false);
    if (hostScreenViewID != null) {
      await ZegoExpressEngine.instance.destroyCanvasView(hostScreenViewID!);
      if (mounted) {
        setState(() {
          hostScreenViewID = null;
          hostScreenView = null;
        });
      }
    }
  }

  Future<void> startPreview() async {
    // cameraView
    ZegoExpressEngine.instance.enableCamera(true);

    await ZegoExpressEngine.instance.createCanvasView((viewID) {
      hostCameraViewID = viewID;

      ZegoCanvas previewCanvas = ZegoCanvas(viewID, viewMode: ZegoViewMode.AspectFill);
      ZegoExpressEngine.instance.startPreview(canvas: previewCanvas, channel: ZegoPublishChannel.Main);
    }).then((canvasViewWidget) {
      setState(() => hostCameraView = canvasViewWidget);
    });
  }

  Future<void> stopPreview() async {
    ZegoExpressEngine.instance.stopPreview(channel: ZegoPublishChannel.Main);
    if (hostCameraViewID != null) {
      await ZegoExpressEngine.instance.destroyCanvasView(hostCameraViewID!);
      if (mounted) {
        setState(() {
          hostCameraViewID = null;
          hostCameraView = null;
        });
      }
    }
  }

  Future<void> startPublish() async {
    String streamID = '${widget.roomID}_${widget.localUserID}_live';
    return ZegoExpressEngine.instance.startPublishingStream(streamID, channel: ZegoPublishChannel.Main);
  }

  Future<void> stopPublish() async {
    return ZegoExpressEngine.instance.stopPublishingStream();
  }

  Future<void> startPlayStream(String streamID) async {
    // Start to play streams. Set the view for rendering the remote streams.
    bool isScreenSharingStream = streamID.endsWith('_screen');
    await ZegoExpressEngine.instance.createCanvasView((viewID) {
      if (isScreenSharingStream) {
        hostScreenViewID = viewID;
      } else {
        hostCameraViewID = viewID;
      }
      ZegoCanvas canvas = ZegoCanvas(viewID, viewMode: ZegoViewMode.AspectFill);
      ZegoExpressEngine.instance.startPlayingStream(streamID, canvas: canvas);
    }).then((canvasViewWidget) {
      setState(() {
        if (isScreenSharingStream) {
          hostScreenView = canvasViewWidget;
          isSharingScreen = true;
        } else {
          hostCameraView = canvasViewWidget;
        }
      });
    });
  }

  Future<void> stopPlayStream(String streamID) async {
    bool isScreenSharingStream = streamID.endsWith('_screen');

    ZegoExpressEngine.instance.stopPlayingStream(streamID);
    if (isScreenSharingStream) {
      if (hostScreenViewID != null) {
        ZegoExpressEngine.instance.destroyCanvasView(hostScreenViewID!);
        if (mounted) {
          setState(() {
            hostScreenViewID = null;
            hostScreenView = null;
            isSharingScreen = false;
          });
        }
      }
    } else {
      if (hostCameraViewID != null) {
        ZegoExpressEngine.instance.destroyCanvasView(hostCameraViewID!);
        if (mounted) {
          setState(() {
            hostCameraViewID = null;
            hostCameraView = null;
          });
        }
      }
    }
  }
}

class DemoButton extends StatelessWidget {
  const DemoButton({
    super.key,
    required this.onPressed,
    required this.text,
  });

  final VoidCallback? onPressed;
  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(8.0),
      child: SizedBox(
        width: 160,
        height: 50,
        child: ElevatedButton(onPressed: onPressed, child: Text(text)),
      ),
    );
  }
}
