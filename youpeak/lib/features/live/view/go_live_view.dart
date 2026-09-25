import 'dart:async';

import 'package:camera/camera.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/shared/widgets/loader_ui.dart';
import 'package:youpeak/core/storage/database/database.dart';
import 'package:youpeak/main.dart';
import 'package:youpeak/features/live/api/create_live_user_api.dart';
import 'package:youpeak/features/live/controller/go_live_controller.dart';
import 'package:youpeak/features/live/view/add_thumbnail_view.dart';
import 'package:youpeak/features/live/view/live_view.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:youpeak/core/assets/app_icons.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'package:youpeak/core/constants/app_string.dart';
import 'package:youpeak/core/utils/utils.dart';
import 'package:youpeak/core/platform/platform_info.dart';

class GoLiveView extends StatefulWidget {
  const GoLiveView({super.key});

  @override
  State<GoLiveView> createState() => _GoLiveViewState();
}

class _GoLiveViewState extends State<GoLiveView> {
  final controller = Get.put(GoLiveController());

  @override
  void dispose() {
    controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    Timer(const Duration(milliseconds: 300), () {
      SystemChrome.setSystemUIOverlayStyle(
        const SystemUiOverlayStyle(
          statusBarIconBrightness: Brightness.light,
          statusBarColor: Colors.transparent,
          systemNavigationBarDividerColor: Colors.black,
          systemNavigationBarColor: Colors.black,
        ),
      );
    });
    return GetBuilder<GoLiveController>(
      id: "onInitializeCamera",
      builder: (controller) {
        return PopScope(
          onPopInvoked: (didPop) {
            controller.cameraController?.dispose();
            controller.cameraController = null;
          },
          child: Scaffold(
            body: SizedBox(
              height: Get.height,
              width: Get.width,
              child: Stack(
                children: [
                  GetBuilder<GoLiveController>(
                    id: "onInitializeCamera",
                    builder: (controller) {
                      if (controller.cameraController != null && (controller.cameraController?.value.isInitialized ?? false)) {
                        final mediaSize = MediaQuery.of(context).size;
                        final scale = 1 / (controller.cameraController!.value.aspectRatio * mediaSize.aspectRatio);
                        return ClipRect(
                          clipper: _MediaSizeClipper(mediaSize),
                          child: Transform.scale(
                            scale: scale,
                            alignment: Alignment.topCenter,
                            child: CameraPreview(controller.cameraController!),
                          ),
                        );
                      } else {
                        return const LoaderUi();
                      }
                    },
                  ),
                  Positioned(
                    top: PlatformInfo.isAndroidOrWeb ? 35 : 45,
                    left: 20,
                    child: SizedBox(
                      width: Get.width / 1.15,
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          IconButton(
                            icon: const Image(
                              image: AssetImage(AppIcons.arrowBack),
                              height: 18,
                              width: 18,
                              color: AppColor.white,
                            ),
                            onPressed: () {
                              controller.cameraController?.dispose();
                              controller.cameraController = null;
                              Get.back();
                            },
                          ),
                          GestureDetector(
                            onTap: () => controller.onSwitchCamera(),
                            child: const ImageIcon(AssetImage(AppIcons.flipCamera), color: AppColor.white, size: 25),
                          ),
                        ],
                      ),
                    ),
                  ),
                  Positioned(
                    bottom: PlatformInfo.isAndroidOrWeb ? 20 : 30,
                    child: SizedBox(
                      width: Get.width,
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 20),
                        child: GestureDetector(
                          onTap: () async {
                            Get.bottomSheet(
                              elevation: 0,
                              backgroundColor: isDarkMode.value ? AppColor.secondDarkMode : AppColor.white,
                              shape: const RoundedRectangleBorder(
                                borderRadius: BorderRadius.only(
                                  topRight: Radius.circular(40),
                                  topLeft: Radius.circular(40),
                                ),
                              ),
                              SizedBox(
                                height: PlatformInfo.isAndroidOrWeb ? 290 : 310,
                                child: Column(
                                  mainAxisAlignment: MainAxisAlignment.start,
                                  crossAxisAlignment: CrossAxisAlignment.center,
                                  children: [
                                    10.height,
                                    Container(
                                      width: 40,
                                      height: 3,
                                      decoration: BoxDecoration(
                                        borderRadius: BorderRadius.circular(60),
                                        color: AppColor.grey_300,
                                      ),
                                    ),
                                    15.height,
                                    Text(
                                      AppStrings.setVisibility.tr,
                                      style: GoogleFonts.urbanist(
                                        fontSize: 18,
                                        fontWeight: FontWeight.w700,
                                      ),
                                    ),
                                    8.height,
                                    Divider(indent: 25, endIndent: 25, color: AppColor.grey_200),
                                    Expanded(
                                      child: SingleChildScrollView(
                                        child: Padding(
                                          padding: const EdgeInsets.symmetric(horizontal: 15),
                                          child: Column(
                                            children: [
                                              const SizedBox(height: 12),
                                              GestureDetector(
                                                onTap: () => controller.isPrivateLive.value = false,
                                                child: Container(
                                                  width: Get.width,
                                                  color: Colors.transparent,
                                                  child: Row(
                                                    children: [
                                                      Obx(() => CustomRadioButtonUi(value: controller.isPrivateLive.value == false)),
                                                      15.width,
                                                      Expanded(
                                                        child: Column(
                                                          crossAxisAlignment: CrossAxisAlignment.start,
                                                          children: [
                                                            Text(
                                                              AppStrings.public.tr,
                                                              overflow: TextOverflow.ellipsis,
                                                              maxLines: 1,
                                                              style: GoogleFonts.urbanist(
                                                                fontWeight: FontWeight.bold,
                                                                fontSize: 16,
                                                              ),
                                                            ),
                                                            Text(
                                                              AppStrings.anyoneCanSearchForAndView.tr,
                                                              overflow: TextOverflow.ellipsis,
                                                              maxLines: 1,
                                                              style: GoogleFonts.urbanist(
                                                                fontSize: 14,
                                                                fontWeight: FontWeight.w500,
                                                                color: AppColor.grey_400,
                                                              ),
                                                            ),
                                                          ],
                                                        ),
                                                      ),
                                                    ],
                                                  ),
                                                ),
                                              ),
                                              20.height,
                                              GestureDetector(
                                                onTap: () => controller.isPrivateLive.value = true,
                                                child: Container(
                                                  color: AppColor.transparent,
                                                  child: Row(
                                                    children: [
                                                      Obx(() => CustomRadioButtonUi(value: controller.isPrivateLive.value == true)),
                                                      15.width,
                                                      Expanded(
                                                        child: Column(
                                                          crossAxisAlignment: CrossAxisAlignment.start,
                                                          children: [
                                                            Text(
                                                              AppStrings.private.tr,
                                                              overflow: TextOverflow.ellipsis,
                                                              maxLines: 1,
                                                              style: GoogleFonts.urbanist(
                                                                fontWeight: FontWeight.bold,
                                                                fontSize: 16,
                                                              ),
                                                            ),
                                                            Text(
                                                              AppStrings.onlyFollowersCanView.tr,
                                                              overflow: TextOverflow.ellipsis,
                                                              maxLines: 1,
                                                              style: GoogleFonts.urbanist(
                                                                fontSize: 14,
                                                                fontWeight: FontWeight.w500,
                                                                color: AppColor.grey_400,
                                                              ),
                                                            ),
                                                          ],
                                                        ),
                                                      ),
                                                    ],
                                                  ),
                                                ),
                                              ),
                                              20.height,
                                              GestureDetector(
                                                onTap: () async {
                                                  if (controller.isPrivateLive.value) {
                                                    Get.dialog(const LoaderUi(color: AppColor.white), barrierDismissible: false);
                                                    final liveHistoryId = await CreateLiveUserApi.callApi(
                                                      loginUserId: Database.loginUserId ?? "",
                                                      liveType: 2,
                                                      thumbnail: "",
                                                      title: "",
                                                    );
                                                    Get.back();
                                                    if (liveHistoryId != null) {
                                                      AppSettings.showLog("liveHistoryId => $liveHistoryId");
                                                      Get.close(2);
                                                      // Get.to(const StreamingView());

                                                      Get.to(
                                                        () => LivePage(
                                                          isHost: true,
                                                          localUserID: Database.loginUserId!,
                                                          localUserName: "Seller",
                                                          roomID: liveHistoryId,
                                                        ),
                                                      );
                                                    }
                                                  } else {
                                                    Get.close(2);
                                                    Get.to(const AddThumbnailView());
                                                  }
                                                },
                                                child: Container(
                                                  height: 55,
                                                  width: Get.width,
                                                  alignment: Alignment.center,
                                                  decoration: BoxDecoration(
                                                    color: AppColor.primaryColor,
                                                    borderRadius: BorderRadius.circular(100),
                                                  ),
                                                  child: Row(
                                                    mainAxisAlignment: MainAxisAlignment.center,
                                                    children: [
                                                      Image.asset(AppIcons.video, color: AppColor.white, height: 25, width: 25),
                                                      SizedBox(width: Get.width * 0.02),
                                                      Text(
                                                        AppStrings.goLiveNow.tr,
                                                        textAlign: TextAlign.center,
                                                        style: GoogleFonts.urbanist(
                                                          fontWeight: FontWeight.w700,
                                                          fontSize: 16,
                                                          color: AppColor.white,
                                                        ),
                                                      ),
                                                    ],
                                                  ),
                                                ),
                                              ),
                                              const SizedBox(height: 10),
                                            ],
                                          ),
                                        ),
                                      ),
                                    ),
                                    PlatformInfo.isAndroidOrWeb ? const Offstage() : const SizedBox(height: 20),
                                  ],
                                ),
                              ),
                            );
                          },
                          child: Container(
                            height: 55,
                            width: Get.width,
                            alignment: Alignment.center,
                            decoration: BoxDecoration(
                              color: AppColor.primaryColor,
                              borderRadius: BorderRadius.circular(100),
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Image.asset(AppIcons.video, color: AppColor.white, height: 25, width: 25),
                                SizedBox(width: Get.width * 0.02),
                                Text(
                                  AppStrings.goLiveNow.tr,
                                  textAlign: TextAlign.center,
                                  style: GoogleFonts.urbanist(
                                    fontWeight: FontWeight.w700,
                                    fontSize: 16,
                                    color: AppColor.white,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}

class _MediaSizeClipper extends CustomClipper<Rect> {
  final Size mediaSize;
  const _MediaSizeClipper(this.mediaSize);
  @override
  Rect getClip(Size size) {
    return Rect.fromLTWH(0, 0, mediaSize.width, mediaSize.height);
  }

  @override
  bool shouldReclip(CustomClipper<Rect> oldClipper) {
    return true;
  }
}

class CustomRadioButtonUi extends StatelessWidget {
  const CustomRadioButtonUi({super.key, required this.value});

  final bool value;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 22,
      width: 22,
      padding: const EdgeInsets.all(2.5),
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: AppColor.transparent,
        border: Border.all(color: AppColor.primaryColor, width: 2.5),
      ),
      child: Visibility(
        visible: value,
        child: Container(
          height: 22,
          width: 22,
          decoration: const BoxDecoration(
            shape: BoxShape.circle,
            color: AppColor.primaryColor,
          ),
        ),
      ),
    );
  }
}
