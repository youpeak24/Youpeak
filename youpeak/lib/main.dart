import 'dart:async';
import 'dart:developer';
import 'dart:io';

import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_crashlytics/firebase_crashlytics.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:youpeak/firebase_options.dart';
import 'package:floating/floating.dart';
import 'package:flutter/foundation.dart';
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
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:youpeak/core/providers/app_provider_container.dart';
import 'package:youpeak/core/security/security_service.dart';
import 'package:youpeak/core/system_config/presentation/system_configs_provider.dart';

RxBool isDarkMode = false.obs;

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await GetStorage.init();

  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );

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

      if (!kIsWeb && Get.currentRoute == "/NormalVideoDetailsView" && await Floating().isPipAvailable) {
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
        title: AppStrings.appName.tr,
        themeMode: ThemeService().theme,
        theme: Themes.light,
        darkTheme: Themes.dark,
        debugShowCheckedModeBanner: false,
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
            return MediaQuery(
              data: MediaQuery.of(context).copyWith(textScaler: const TextScaler.linear(0.8)),
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
