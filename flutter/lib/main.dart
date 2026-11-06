import 'package:youpeak/features/video/view/normal_video_details_view.dart';
import 'dart:async';
import 'dart:developer';
import 'dart:io';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:youpeak/core/config/local_emulators.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_crashlytics/firebase_crashlytics.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:youpeak/firebase_options.dart';
import 'package:floating/floating.dart';
import 'package:youpeak/core/config/build_config.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:youpeak/core/assets/app_visuals.dart';
import 'package:flutter/services.dart';
import 'package:flutter_branch_sdk/flutter_branch_sdk.dart';
import 'package:flutter_stripe/flutter_stripe.dart';
import 'package:get/get.dart';
import 'package:get_storage/get_storage.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:google_mobile_ads/google_mobile_ads.dart';
import 'package:in_app_purchase/in_app_purchase.dart';
import 'package:youpeak/core/ads/load_multiple_ads.dart';
import 'package:youpeak/core/utils/custom_check_internet.dart';
import 'package:youpeak/core/utils/custom_watch_time.dart';
import 'package:youpeak/core/storage/database/database.dart';
import 'package:youpeak/core/deep_link/services/deep_link_services.dart';
import 'package:youpeak/core/localization/locale_constant.dart';
import 'package:youpeak/core/localization/localization_service.dart';
import 'package:youpeak/core/localization/localizations_delegate.dart';
import 'package:youpeak/core/notification/local_notification_services.dart';
import 'package:youpeak/core/settings/admin_settings_api.dart';
import 'package:youpeak/features/profile/api/get_profile_api.dart';
import 'package:youpeak/features/home/controller/nav_home_controller.dart';
import 'package:youpeak/features/bites/controller/nav_shorts_controller.dart';
import 'package:youpeak/features/rewards/controller/earn_reward_controller.dart';
import 'package:youpeak/features/splash/view/splash_screen_view.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:youpeak/core/config/size_config.dart';
import 'package:youpeak/core/constants/app_constant.dart';
import 'package:youpeak/core/storage/prefrens.dart';
import 'package:youpeak/core/services/permission_handler.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'package:youpeak/core/constants/app_string.dart';
import 'package:youpeak/core/theme/theme_services.dart';
import 'package:youpeak/core/theme/theme_view.dart';
import 'package:mobile_device_identifier/mobile_device_identifier.dart';
import 'package:zego_express_engine/zego_express_engine.dart';
import 'package:youpeak/core/platform/platform_info.dart';
import 'package:youpeak/core/platform/app_layout.dart';
import 'package:youpeak/core/platform/shell_route_widths.dart';
import 'package:youpeak/core/security/presentation/task_lock_gate.dart';
import 'package:youpeak/features/tiers/view/tasker_tier_view.dart';
import 'package:youpeak/features/upload/view/upload_video_view.dart';
import 'package:youpeak/features/video_promotion/view/promote_flow_view.dart';
import 'package:youpeak/features/video_promotion/view/promote_video_view.dart';
import 'package:youpeak/features/video_promotion/view/promotion_campaign_view.dart';
import 'package:youpeak/core/platform/browser_url.dart';
import 'package:youpeak/features/main/view/main_home_view.dart';
import 'package:youpeak/features/main/view/wide_side_nav.dart';
import 'package:youpeak/features/search/view/search_view.dart';
import 'package:youpeak/features/notifications/view/notification_view.dart';
import 'package:youpeak/features/profile/view/profile_view.dart';
import 'package:youpeak/features/tasker/presentation/tasker_dashboard_view.dart';
import 'package:youpeak/features/library/view/history_view.dart';
import 'package:youpeak/features/library/view/watch_later_view.dart';
import 'package:youpeak/features/library/view/your_video_page.dart';
import 'package:youpeak/features/library/view/download_view.dart';
import 'package:youpeak/features/channel/view/get_playList_page.dart';
import 'package:youpeak/features/video/view/shorts_video_details_view.dart';
import 'package:youpeak/features/channel/view/preview_playlist_view.dart';
import 'package:youpeak/features/channel/view/your_channel_view.dart';
import 'package:youpeak/features/subscriptions/view/subscribed_channel_view.dart';
import 'package:youpeak/features/settings/view/settings_view.dart';
import 'package:youpeak/features/help_center/view/help_center_view.dart';
import 'package:youpeak/features/bites/view/preview_shorts_view.dart';
import 'package:youpeak/features/bites/view/create_short_view.dart';
import 'package:youpeak/features/live/view/go_live_view.dart';
import 'package:youpeak/features/live/view/live_view.dart';
import 'package:youpeak/features/access_gate/presentation/activation_lock_view.dart';
import 'package:youpeak/features/auth/view/fill_profile_view.dart';
import 'package:youpeak/features/auth/view/create_new_password_view.dart';
import 'package:youpeak/features/auth/view/forgot_password_otp_view.dart';
import 'package:youpeak/features/auth/view/forget_password_view.dart';
import 'package:youpeak/features/auth/view/sign_up_otp_view.dart';
import 'package:youpeak/features/auth/view/sign_up_view.dart';
import 'package:youpeak/features/auth/phone/presentation/phone_login_view.dart';
import 'package:youpeak/features/auth/view/login_view.dart';
import 'package:youpeak/features/auth/view/lets_you_in_view.dart';
import 'package:youpeak/features/onboarding/view/on_boarding_view.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:youpeak/core/providers/app_provider_container.dart';
import 'package:youpeak/core/security/security_service.dart';
import 'package:youpeak/core/system_config/presentation/system_configs_provider.dart';

RxBool isDarkMode = false.obs;

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  if (BuildConfig.buildId.isNotEmpty) {
    log("YouPeak build: ${BuildConfig.buildId}");
  }

  // A release build made without its production configuration (no client key,
  // wrong API origin, local-dev switches) must not start: it would only fail
  // later as rejected requests. Debug runs are not affected.
  final configProblems = BuildConfig.releaseProblems();
  if (configProblems.isNotEmpty) {
    runApp(BuildConfigErrorApp(problems: configProblems));
    return;
  }

  await GetStorage.init();

  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );

  // Development only: the local Firebase emulators (see
  // core/config/local_emulators.dart). Unset in real builds, and ignored
  // unless both the emulator and the API are on this machine.
  final authEmulator = localEmulator(const String.fromEnvironment("AUTH_EMULATOR"), apiBaseUrl: Constant.baseURL);
  if (authEmulator != null) {
    await FirebaseAuth.instance.useAuthEmulator(authEmulator.host, authEmulator.port);
  }
  // The app's one Firestore listener (system_configs), so a local run never
  // reads the real project.
  final firestoreEmulator = localEmulator(const String.fromEnvironment("FIRESTORE_EMULATOR"), apiBaseUrl: Constant.baseURL);
  if (firestoreEmulator != null) {
    FirebaseFirestore.instance.useFirestoreEmulator(firestoreEmulator.host, firestoreEmulator.port);
  }

  await Preference().instance();
  Get.put(LocalizationService());
  await Get.find<LocalizationService>().init();

  // Crashlytics, Branch, AdMob, local notifications, runtime permissions,
  // Zego and Stripe have no browser implementation; the web app skips them.
  if (!kIsWeb) {
    FlutterError.onError = (errorDetails) {
      FirebaseCrashlytics.instance.recordFlutterFatalError(errorDetails);
    };

    PlatformDispatcher.instance.onError = (error, stack) {
      FirebaseCrashlytics.instance.recordError(error, stack, fatal: true);
      return true;
    };

    await SystemChrome.setPreferredOrientations([
      DeviceOrientation.portraitUp,
      DeviceOrientation.portraitDown,
    ]);
  }

  // Non-blocking background initializations
  CustomCheckInternet.onCheck();
  DeepLinkServices.onInitDeepLinks();
  CustomWatchTime.init();
  if (!kIsWeb) {
    onInitializeBranchIo();
    MobileAds.instance.initialize();
    PermissionHandler.requestPermission();
    LocalNotificationServices.initNotification();
    NotificationServices().firebaseInit();
    createEngine();
    stripeInit();
  }

  // Live admin config (Firestore system_configs/*) and the Tasker anti-fraud
  // checks start with the app, so every screen reads current values.
  appProviderContainer.read(systemConfigsProvider);
  appProviderContainer.read(securityServiceProvider);

  if (kIsWeb) {
    configureBrowserUrl();
    registerWideRoutes();
  }

  runApp(UncontrolledProviderScope(container: appProviderContainer, child: const MyApp()));
}

class MyApp extends StatefulWidget {
  const MyApp({super.key});

  static final StreamController purchaseStreamController = StreamController<PurchaseDetails>.broadcast();

  @override
  State<MyApp> createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> with WidgetsBindingObserver {
  final Connectivity connectivity = Connectivity();
  late StreamSubscription<ConnectivityResult> subscription;
  Timer? timer;
  bool dialogShowing = false;
  final controller = Get.put(EarnRewardController());

  @override
  void initState() {
    WidgetsBinding.instance.addObserver(this);
    controller.onOpenApp();
    // Listen to connectivity changes
    subscription = connectivity.onConnectivityChanged.listen((result) {
      checkInternetWithPing();
    });

    // ✅ Periodically check internet (every 5 seconds)
    timer = Timer.periodic(const Duration(seconds: 5), (_) {
      checkInternetWithPing();
    });

    super.initState();
  }

  Future<void> checkInternetWithPing() async {
    bool hasInternet = await hasRealInternet();

    if (!hasInternet && !dialogShowing) {
      _showNoInternetDialog();
    } else if (hasInternet && dialogShowing) {
      if (Get.isDialogOpen ?? false) {
        Get.back(); // close dialog
      }
      dialogShowing = false;
    }
  }

  Future<bool> hasRealInternet() async {
    // Browsers can't do raw DNS lookups; they report connectivity directly.
    if (kIsWeb) {
      return await connectivity.checkConnectivity() != ConnectivityResult.none;
    }
    try {
      final result = await InternetAddress.lookup('google.com').timeout(const Duration(seconds: 3));
      return result.isNotEmpty && result[0].rawAddress.isNotEmpty;
    } catch (_) {
      return false;
    }
  }

  void _showNoInternetDialog() {
    dialogShowing = true;

    Get.dialog(
      Dialog(
        backgroundColor: isDarkMode.value ? AppColor.secondDarkMode : AppColor.white,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(40),
        ),
        child: Container(
          padding: EdgeInsets.only(
            left: SizeConfig.blockSizeHorizontal * 2,
            right: SizeConfig.blockSizeHorizontal * 2,
            top: 5,
            bottom: 10,
          ),
          decoration: BoxDecoration(
            color: isDarkMode.value ? AppColor.secondDarkMode : AppColor.white,
            borderRadius: BorderRadius.circular(20),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min, // 👈 important for dialog size
            children: [
              Container(
                width: 30,
                height: 3,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(60),
                  color: isDarkMode.value ? AppColor.white.withAlpha(51) : AppColor.grey_200,
                ),
              ),
              const SizedBox(height: 5),
              Image.asset(AppVisuals.offline, height: 120),
              Text(
                AppStrings.noInternetConnection.tr,
                style: GoogleFonts.urbanist(
                  fontSize: 22,
                  color: isDarkMode.value ? AppColor.white : AppColor.logOutColor,
                  fontWeight: FontWeight.bold,
                ),
              ),
              Divider(indent: 30, color: AppColor.grey_200, endIndent: 30),
              const SizedBox(height: 5),
              Align(
                alignment: Alignment.center,
                child: Text(
                  AppStrings.pleaseCheckYourInternetAndTryAgain.tr,
                  style: GoogleFonts.urbanist(
                    fontSize: 18,
                    color: isDarkMode.value ? AppColor.white : AppColor.logOutColor,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              const SizedBox(height: 20),
              Align(
                alignment: Alignment.bottomRight,
                child: GestureDetector(
                  onTap: () async {
                    final hasInternet = await hasRealInternet();
                    if (hasInternet) {
                      if (Get.isDialogOpen ?? false) {
                        Get.back();
                      }
                      dialogShowing = false;
                    }
                  },
                  child: Container(
                    height: 45,
                    width: 120,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(20),
                      color: AppColor.primaryColor,
                    ),
                    child: Text(
                      AppStrings.retry.tr,
                      style: GoogleFonts.urbanist(
                        color: AppColor.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 14,
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
      barrierDismissible: false,
    );
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    subscription.cancel();
    timer?.cancel();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) async {
    if (state == AppLifecycleState.resumed) {
      CustomWatchTime.isAppOn = true;
      CustomWatchTime.init();
      AppSettings.showLog("User Back To App...");
      controller.onOpenApp();
    }
    if (state == AppLifecycleState.paused) {
      CustomWatchTime.isAppOn = false;
      AppSettings.showLog("User Try To Exit...");

      if (!kIsWeb && Get.currentRoute == "/$NormalVideoDetailsView" && await Floating().isPipAvailable) {
        Floating().enable(
          const ImmediatePiP(aspectRatio: Rational(16, 9)),
        );
      } else {
        controller.onCloseApp();
      }
    }
  }

  @override
  void didChangeDependencies() {
    getLocale().then((locale) {
      setState(() {
        log("didChangeDependencies Preference Revoked${locale.languageCode}");
        log("didChangeDependencies GET LOCALE Revoked${Get.locale?.languageCode}");
        Get.updateLocale(locale);
      });
    });
    super.didChangeDependencies();
  }

  @override
  Widget build(BuildContext context) {
    SystemChrome.setSystemUIOverlayStyle(
      SystemUiOverlayStyle(
        statusBarIconBrightness: isDarkMode.value ? Brightness.light : Brightness.dark,
        statusBarColor: isDarkMode.value ? AppColor.secondDarkMode : Colors.white,
        systemNavigationBarDividerColor: isDarkMode.value ? AppColor.transparent : AppColor.white,
        systemNavigationBarColor: isDarkMode.value ? AppColor.mainDark : AppColor.white,
        systemNavigationBarIconBrightness: isDarkMode.value ? Brightness.light : Brightness.dark,
      ),
    );
    return SafeArea(
      top: false,
      child: GetMaterialApp(
        // Browser tab / task switcher name. A brand name, not translated (the
        // translations load after this is read, so `.tr` showed "appName").
        title: "YouPeak",
        themeMode: ThemeService().theme,
        theme: Themes.light,
        darkTheme: Themes.dark,
        debugShowCheckedModeBanner: false,
        // Web: every page passes through AdaptivePageTransition, which keeps
        // the phone layouts in a centered column on wide windows.
        customTransition: kIsWeb ? AdaptivePageTransition() : null,
        // Let a mouse drag scroll lists and swipe pages (Bites, carousels)
        // in the browser, as a finger does on the phone.
        scrollBehavior: const MaterialScrollBehavior().copyWith(dragDevices: PointerDeviceKind.values.toSet()),
        home: const SplashScreenView(),
        translations: AppLanguages(),
        locale: Locale(Database.selectedLanguage, Database.languageCountryCode),
        fallbackLocale: const Locale(AppSettings.languageEn, AppSettings.countryCodeEn),
        builder: (context, child) {
          final mediaQuery = MediaQuery.of(context);

          // Only apply SafeArea for non-iOS devices
          if (PlatformInfo.isIOS) {
            return child ?? const SizedBox();
          } else {
            // The phone layouts were tuned at 0.8 text scale. In a desktop
            // browser window that made every label ~10 px; there the pages
            // sit in wider columns, so text renders at its designed size.
            final desktopWeb = kIsWeb && mediaQuery.size.width >= AppLayout.wideBreakpoint;
            return MediaQuery(
              data: mediaQuery.copyWith(textScaler: TextScaler.linear(desktopWeb ? 1.0 : 0.8)),
              child: Container(
                color: Colors.white,
                child: SafeArea(
                  top: false, // allow fullscreen at top
                  bottom: false, // prevent going under bottom bar
                  child: child ?? const SizedBox(),
                ),
              ),
            );
          }
        },
      ),
    );
  }
}

// Pages with their own desktop layout; every other page is shown in the
// centered page column on wide browser windows (see AppLayout). Sign-in
// and onboarding pages get the brand gradient beside that column.
void registerWideRoutes() {
  AppLayout.registerWideRoute(MainHomePageView);
  AppLayout.registerWideRoute(NormalVideoDetailsView);

  // Every page a signed-in person opens keeps the desktop navigation
  // (AppLayout.shellWidthFor). Pages with a desktop arrangement are listed
  // with the width that suits them; the rest keep their phone layout in a
  // column beside the sidebar.
  AppLayout.shellBuilder = buildDesktopShell;
  AppLayout.shellAvailable = () => (Database.loginUserId ?? "").isNotEmpty;
  // The video page keeps the sidebar on desktop and lays out its own
  // player + details + related columns in whatever width is left.
  AppLayout.registerShellRoute(NormalVideoDetailsView, maxContentWidth: double.infinity);
  AppLayout.registerShellRoute(SearchView, maxContentWidth: 1200);
  AppLayout.registerShellRoute(NotificationPageView, maxContentWidth: 760);
  AppLayout.registerShellRoute(ProfileView, maxContentWidth: 1120);
  AppLayout.registerShellRoute(TaskerDashboardView, maxContentWidth: 1180);
  // Earn Rewards (opened through the task-lock gate, so its route is the
  // gate's; the lock page itself stays a centered 520-px card).
  AppLayout.registerShellRoute(TaskLockGate, maxContentWidth: 1180);
  AppLayout.registerShellRoute(TaskerTierView, maxContentWidth: 1280);
  // Upload: preview beside the details form.
  AppLayout.registerShellRoute(UploadVideoView, maxContentWidth: 1200);
  // Video promotion: plans grid, the buy flow with its order summary beside
  // it, and a campaign's delivery + history side by side.
  AppLayout.registerShellRoute(PromoteVideoView, maxContentWidth: 1120);
  AppLayout.registerShellRoute(PromoteFlowView, maxContentWidth: 1200);
  AppLayout.registerShellRoute(PromotionCampaignView, maxContentWidth: 1000);
  // Library and channel lists: a desktop-width column of the same row cards
  // (thumbnail beside the title, as on a desktop video site); the rows keep
  // their phone-sized thumbnails, so nothing is stretched.
  for (final page in [
    HistoryPageView,
    WatchLaterView,
    YourVideoPageView,
    DownloadView,
    GetPlaylistPage,
    PreviewPlaylistView,
    SubscribedChannelView,
    YourChannelView,
  ]) {
    AppLayout.registerShellRoute(page, maxContentWidth: 960);
  }
  // Lists of settings and help topics read best a little wider than a phone.
  for (final page in [SettingsView, HelpCenterView]) {
    AppLayout.registerShellRoute(page, maxContentWidth: 760);
  }
  // The secondary pages (wallet, coins, plans, monetization, settings,
  // forms, upload steps) each get a content width of their own.
  registerSecondaryPageWidths();

  // Camera, live and the full-screen Bites player use the whole window.
  for (final page in [ShortsVideoDetailsView, PreviewShortsView, CreateShortView, GoLiveView, LivePage]) {
    AppLayout.registerFullscreenRoute(page);
  }

  for (final page in [
    OnBoardIngScreen,
    LetsYouInView,
    LoginView,
    PhoneLoginView,
    SignUpView,
    SignUpOtpView,
    ForgotPasswordView,
    ForgotPasswordOtpView,
    CreateNewPasswordView,
    FillProfileView,
    ActivationLockView,
  ]) {
    AppLayout.registerBrandedRoute(page);
  }
}

Future<void> createEngine() async {
  try {
    if (CustomCheckInternet.isConnect.value) {
      await ZegoExpressEngine.createEngineWithProfile(ZegoEngineProfile(
        Constant.appId,
        ZegoScenario.Broadcast,
        appSign: kIsWeb ? null : Constant.appSign,
      ));
    }
  } catch (e) {
    print("createEngine error => $e");
  }
}

Future<void> stripeInit() async {
  if (CustomCheckInternet.isConnect.value) {
    Stripe.publishableKey = AppStrings.stripeTestPublicKey;
    // await Stripe.instance.applySettings();
    // InAppPurchaseAndroidPlatformAddition.enablePendingPurchases();
  }
}

Future<void> onConnectInternet() async {
  await AdminSettingsApi.callApi();
  if (Database.loginUserId != null) await GetProfileApi.callApi(Database.loginUserId!);
  if (!kIsWeb) {
    await MobileAds.instance.initialize();
    LoadMultipleAds.init();
    await stripeInit();
  }

  if (Database.loginUserId != null) {
    final shortsController = Get.put(NavShortsController());
    final navHomeController = Get.put(NavHomeController());
    navHomeController.init();
    shortsController.init();
  }

  if (GetProfileApi.profileModel?.user != null && AdminSettingsApi.adminSettingsModel?.setting != null) {
    AppSettings.isAvailableProfileData.value = true;
    Get.back();
  } else {
    AppSettings.isAvailableProfileData.value = false;
  }
}
// >>>>> Login Details <<<<<

// F-1 G-2 A-3. E-4
Future<void> onInitializeBranchIo() async {
  try {
    await FlutterBranchSdk.init().then((value) {
      // FlutterBranchSdk.validateSDKIntegration();
    });
  } catch (e) {
    AppSettings.showLog("Initialize Branch Io Failed !! => $e");
  }
}
