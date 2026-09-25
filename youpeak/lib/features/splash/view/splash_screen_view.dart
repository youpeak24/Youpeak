import 'dart:async';
import 'dart:developer';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_spinkit/flutter_spinkit.dart';
import 'package:get/get.dart';
import 'package:youpeak/shared/dialogs/force_update_dialog.dart';
import 'package:youpeak/shared/dialogs/blocked_user_dialog.dart';
import 'package:youpeak/core/storage/database/database.dart';
import 'package:youpeak/main.dart';
import 'package:youpeak/core/settings/admin_settings_api.dart';
import 'package:youpeak/features/profile/api/get_profile_api.dart';
import 'package:youpeak/features/auth/view/lets_you_in_view.dart';
import 'package:youpeak/features/auth/view/login_view.dart';
import 'package:youpeak/core/utils/custom_check_internet.dart';
import 'package:youpeak/features/main/view/main_home_view.dart';
import 'package:youpeak/features/live/widget/device_orientation.dart';
import 'package:youpeak/features/library/view/download_view.dart';
import 'package:youpeak/features/onboarding/view/on_boarding_view.dart';
import 'package:youpeak/core/services/branch_io_services.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:youpeak/core/config/size_config.dart';
import 'package:youpeak/core/assets/app_icons.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'package:youpeak/core/constants/app_string.dart';
import 'package:youpeak/core/theme/app_style.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:quick_actions/quick_actions.dart';

import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:mobile_device_identifier/mobile_device_identifier.dart';

class SplashScreenView extends StatefulWidget {
  const SplashScreenView({super.key});

  @override
  State<SplashScreenView> createState() => _SplashScreenViewState();
}

class _SplashScreenViewState extends State<SplashScreenView> {
  final quickAction = const QuickActions();

  @override
  void initState() {
    super.initState();
    initApp();
  }

  Future<void> initApp() async {
    try {
      final deviceId = await MobileDeviceIdentifier().getDeviceId().timeout(
        const Duration(seconds: 3),
        onTimeout: () => "",
      );
      final fcmToken = await FirebaseMessaging.instance.getToken().timeout(
        const Duration(seconds: 3),
        onTimeout: () => "",
      );

      if (deviceId != null && fcmToken != null) {
        await Database().init(deviceId, fcmToken);
      }

      await Future.wait([
        AdminSettingsApi.callApi().timeout(const Duration(seconds: 4), onTimeout: () => null),
        if (Database.loginUserId != null)
          GetProfileApi.callApi(Database.loginUserId!).timeout(const Duration(seconds: 4), onTimeout: () => null),
      ]);
    } catch (e) {
      log("Splash init error: $e");
    }

    checkForceUpdate();
  }

  Future<void> checkForceUpdate() async {
    final packageInfo = await PackageInfo.fromPlatform();
    final currentVersion = packageInfo.version;
    log("Current version ==> ${packageInfo.version}");

    final latestVersion = Platform.isIOS
        ? AdminSettingsApi.adminSettingsModel?.setting?.iosAppVersion ?? ""
        : AdminSettingsApi.adminSettingsModel?.setting?.androidAppVersion ?? "";

    log("Latest version ==> $latestVersion");
    if (latestVersion.isEmpty) {
      log("⚠️ Latest version missing from API");
      splashScreen();
      return;
    }
    if (isUpdateRequired(currentVersion, latestVersion)) {
      Get.dialog(
        const ForceUpdateDialog(),
        barrierDismissible: false,
      );
    } else {
      splashScreen();
    }
  }

  bool isUpdateRequired(String current, String latest) {
    final currentParts = current.split('.').map(int.parse).toList();
    final latestParts = latest.split('.').map(int.parse).toList();

    for (int i = 0; i < latestParts.length; i++) {
      if (currentParts[i] < latestParts[i]) return true;
      if (currentParts[i] > latestParts[i]) return false;
    }
    return false;
  }

  void splashScreen() {
    print(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
    Timer(
      const Duration(milliseconds: 500),
      () {
        print("Database.isNewUser:::::::::::::::::::${Database.isNewUser}");
        BranchIoServices.onListenBranchIoLinks();
        if (Database.isNewUser) {
          print("isnew user >>>>>>>>>>>>>>>");
          if (Database.isOnBoarding) {
            Get.off(() => const LetsYouInView());
          } else {
            Get.off(() => const OnBoardIngScreen());
          }
        } else {
          if (Database.loginUserId != null) {
            if (!CustomCheckInternet.isConnect.value) {
              print("No internet — navigating to DownloadView...");
              Get.offAll(() => const DownloadView());
            } else if (GetProfileApi.profileModel?.user == null) {
              print("User profile null or deleted — redirecting to login...");
              Database.logOut();
              Get.offAll(() => const LoginView());
            } else if (GetProfileApi.profileModel!.user!.isBlock == true) {
              Get.dialog(const BlockedUserDialog(), barrierDismissible: false);
            } else {
              Get.offAll(() => const MainHomePageView());
            }
          } else {
            print("splash log out >>>>>>>>>>>>>>>>>>>");
            Database.logOut();
            Get.offAll(() => const LoginView());
          }
        }
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    Timer(const Duration(milliseconds: 150), () {
      SystemChrome.setSystemUIOverlayStyle(
        SystemUiOverlayStyle(
          statusBarIconBrightness: Brightness.light,
          statusBarColor: Colors.transparent,
          systemNavigationBarIconBrightness: isDarkMode.value ? Brightness.dark : Brightness.light,
        ),
      );
    });
    AppSettings.showLog("Screen Height => ${Get.height}  Screen Width => ${Get.width}");
    SizeConfig().init(context);
    return Scaffold(
      backgroundColor: isDarkMode.value ? AppColor.mainDark : null,
      body: Stack(
        clipBehavior: Clip.none,
        children: [
          // Forest Green gradient background — YouPeak Spec v3.0
          Container(
            height: Get.height,
            width: Get.width,
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  Color(0xFF0F3B20), // Deep forest green
                  Color(0xFF1E4D2B), // Dark forest accent
                  Color(0xFF0A7A44), // Primary Forest Green
                  Color(0xFF129B57), // Vibrant forest green
                ],
                stops: [0.0, 0.30, 0.65, 1.0],
              ),
            ),
          ),
          const Positioned(
            bottom: 50,
            right: 0,
            left: 0,
            child: Center(child: SpinKitCircle(color: AppColor.secondaryMintGreen, size: 60)),
          ),
          Positioned(
            top: 210,
            right: 0,
            left: 0,
            child: Center(
                child: Column(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(22),
                  child: Image.asset(
                    AppIcons.appLogo,
                    width: 84,
                    height: 84,
                    fit: BoxFit.cover,
                  ),
                ).paddingOnly(bottom: 8),
                Text(AppStrings.appName.tr, style: splashTitleStyle),
              ],
            )),
          ),
        ],
      ),
    );
  }
}
