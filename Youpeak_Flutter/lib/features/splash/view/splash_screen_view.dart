import 'package:youpeak/core/platform/app_layout.dart';
import 'dart:async';
import 'dart:developer';

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:get/get.dart';
import 'package:youpeak/shared/dialogs/force_update_dialog.dart';
import 'package:youpeak/shared/dialogs/blocked_user_dialog.dart';
import 'package:youpeak/core/storage/database/database.dart';
import 'package:youpeak/main.dart';
import 'package:youpeak/core/settings/admin_settings_api.dart';
import 'package:youpeak/features/profile/api/get_profile_api.dart';
import 'package:youpeak/features/splash/splash_session_policy.dart';
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
import 'package:youpeak/core/platform/device_identity.dart';
import 'package:youpeak/core/platform/platform_info.dart';
import 'package:youpeak/core/network/app_session.dart';
import 'package:youpeak/core/utils/custom_toast.dart';
import 'package:youpeak/features/access_gate/presentation/activation_lock_view.dart';

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
      final deviceId = await DeviceIdentity.get().timeout(
        const Duration(seconds: 3),
        onTimeout: () => "",
      );
      // Web push needs a service worker + VAPID key that aren't set up, so
      // the web app registers without an FCM token (as a denied-permission
      // phone would).
      final fcmToken = PlatformInfo.isWeb
          ? ""
          : await FirebaseMessaging.instance.getToken().timeout(
                const Duration(seconds: 3),
                onTimeout: () => "",
              );

      if (deviceId != null && fcmToken != null) {
        await Database().init(deviceId, fcmToken);
      }

      await Future.wait([
        AppSession.ready(),
        AdminSettingsApi.callApi()
            .timeout(const Duration(seconds: 4), onTimeout: () => null),
        if (Database.loginUserId != null)
          GetProfileApi.callApi(Database.loginUserId!)
              .timeout(const Duration(seconds: 4), onTimeout: () => null),
      ]);
    } catch (e) {
      log("Splash init error: $e");
    }

    checkForceUpdate();
  }

  Future<void> checkForceUpdate() async {
    // Every page load already runs the latest deployed web build.
    if (PlatformInfo.isWeb) {
      splashScreen();
      return;
    }
    final packageInfo = await PackageInfo.fromPlatform();
    final currentVersion = packageInfo.version;
    log("Current version ==> ${packageInfo.version}");

    final latestVersion = PlatformInfo.isIOS
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

  /// The profile couldn't be loaded for a transient reason. The user stays
  /// signed in; they can retry or sign out themselves.
  void _showProfileRetry() {
    final problem = GetProfileApi.lastProblem;
    Get.dialog(
      PopScope(
        canPop: false,
        child: AlertDialog(
          title: const Text("Couldn't load your account"),
          content: Text(
            "${problem?.message(what: 'your account') ?? 'YouPeak took too long to answer. Check your connection and try again.'}\n\nYou're still signed in.",
          ),
          actions: [
            TextButton(
              onPressed: () {
                Get.back();
                Database.logOut();
              },
              child: const Text("Sign out"),
            ),
            FilledButton(
              onPressed: () async {
                Get.back();
                final id = Database.loginUserId;
                if (id != null) await GetProfileApi.callApi(id);
                splashScreen();
              },
              child: const Text("Retry"),
            ),
          ],
        ),
      ),
      barrierDismissible: false,
    );
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
            // Offline, the phone app falls back to downloaded videos; the web
            // app has no downloads, so it carries on and shows its offline dialog.
            if (!CustomCheckInternet.isConnect.value && !PlatformInfo.isWeb) {
              print("No internet — navigating to DownloadView...");
              Get.offAll(() => const DownloadView());
            } else if (GetProfileApi.profileModel?.user == null) {
              // Sign out only when the server says the account can't continue.
              // A slow or dropped connection used to land here too and wiped
              // the local data (downloads, preferences) of a signed-in user.
              switch (decideSplashStart(GetProfileApi.lastProblem)) {
                case SplashStart.signOut:
                  print("Account gone or session invalid — redirecting to login...");
                  Database.logOut();
                  Get.offAll(() => const LoginView());
                case SplashStart.blocked:
                  Get.dialog(const BlockedUserDialog(), barrierDismissible: false);
                case SplashStart.retry:
                  _showProfileRetry();
              }
            } else if (GetProfileApi.profileModel!.user!.isBlock == true) {
              Get.dialog(const BlockedUserDialog(), barrierDismissible: false);
            } else if (!AppSession.isEstablished) {
              // Logged in before the per-user API session existed (or it was
              // cleared): one fresh sign-in gives earning, boosts and
              // withdrawals a verified session.
              CustomToast.show("Please sign in again to keep earning.");
              Database.logOut();
            } else if (GetProfileApi.accessGate?["locked"] == true) {
              final gate = GetProfileApi.accessGate!;
              Get.offAll(() => ActivationLockView(
                    activationUrl: (gate["activationUrl"] as String?) ??
                        "https://youpeak.in",
                    reason: gate["reason"] as String?,
                  ));
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
          systemNavigationBarIconBrightness:
              isDarkMode.value ? Brightness.dark : Brightness.light,
        ),
      );
    });
    AppSettings.showLog(
        "Screen Height => ${Get.height}  Screen Width => ${AppLayout.width}");
    SizeConfig().init(context);
    return Scaffold(
      backgroundColor: const Color(0xFF0A6F6B),
      body: Container(
        width: double.infinity,
        height: double.infinity,
        // Brand gradient (green -> teal -> blue, from the logo), deepened. The splash is
        // the app's root route and is not wrapped by AppPageFrame, so it
        // covers the whole viewport itself.
        decoration: const BoxDecoration(gradient: AppColor.brandDeepGradient),
        child: Stack(
          children: [
            // Soft light behind the mark.
            Positioned.fill(
              child: IgnorePointer(
                child: DecoratedBox(
                  decoration: BoxDecoration(
                    gradient: RadialGradient(
                      center: const Alignment(0, -0.18),
                      radius: 0.75,
                      colors: [
                        AppColor.white.withValues(alpha: 0.16),
                        AppColor.white.withValues(alpha: 0),
                      ],
                    ),
                  ),
                ),
              ),
            ),
            Center(
              child: TweenAnimationBuilder<double>(
                tween: Tween(begin: 0, end: 1),
                duration: const Duration(milliseconds: 700),
                curve: Curves.easeOutCubic,
                builder: (context, t, child) => Opacity(
                  opacity: t,
                  child: Transform.translate(offset: Offset(0, (1 - t) * 14), child: Transform.scale(scale: 0.92 + 0.08 * t, child: child)),
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(28),
                        boxShadow: [
                          BoxShadow(color: Colors.black.withValues(alpha: 0.28), blurRadius: 30, offset: const Offset(0, 14)),
                        ],
                      ),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(28),
                        child: Image.asset(AppIcons.appLogo, width: 96, height: 96, fit: BoxFit.cover),
                      ),
                    ),
                    const SizedBox(height: 22),
                    Text(AppStrings.appName.tr, style: splashTitleStyle.copyWith(letterSpacing: -0.5)),
                    const SizedBox(height: 8),
                    Text(
                      "Watch. Create. Reach your peak.",
                      style: GoogleFonts.urbanist(
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                        letterSpacing: 0.3,
                        color: AppColor.white.withValues(alpha: 0.82),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            Positioned(
              bottom: 56,
              left: 0,
              right: 0,
              child: Center(
                child: SizedBox(
                  height: 28,
                  width: 28,
                  child: CircularProgressIndicator(
                    strokeWidth: 3,
                    strokeCap: StrokeCap.round,
                    color: AppColor.secondaryMintGreen,
                    backgroundColor: AppColor.white.withValues(alpha: 0.18),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
