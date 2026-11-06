// import 'dart:async';
// import 'dart:developer';
//
// import 'package:flutter/material.dart';
// import 'package:interactive_media_ads/interactive_media_ads.dart';
// import 'package:Live1/ads/google_ads/google_ad_helper.dart';
//
// class VideoAdServices {
//   static bool isLoadingVideoAd = false;
//   static bool isAdReady = false;
//   static bool isAdPlaying = false;
//   static bool isAdCompleted = false;
//
//   static AdDisplayContainer? adDisplayContainer;
//   static AdsManager? _adsManager;
//   static AdsLoader? _adsLoader;
//   static bool _isInitialized = false;
//
//   static VoidCallback? onAdCompleted;
//   static VoidCallback? onAdStarted;
//   static VoidCallback? onAdFailed;
//
//   static void initialize({
//     VoidCallback? onAdCompletedCallback,
//     VoidCallback? onAdStartedCallback,
//     VoidCallback? onAdFailedCallback,
//   }) {
//     if (_isInitialized) return;
//
//     isLoadingVideoAd = false;
//     isAdReady = false;
//     isAdPlaying = false;
//     isAdCompleted = false;
//     adDisplayContainer = null;
//     _adsManager = null;
//     _adsLoader = null;
//
//     onAdCompleted = onAdCompletedCallback;
//     onAdStarted = onAdStartedCallback;
//     onAdFailed = onAdFailedCallback;
//
//     _isInitialized = true;
//     log("VideoAdServices: Initialized successfully");
//   }
//
//   static void dispose() {
//     _adsManager?.destroy();
//     _adsLoader = null;
//     adDisplayContainer = null;
//     _adsManager = null;
//
//     isLoadingVideoAd = false;
//     isAdReady = false;
//     isAdPlaying = false;
//     isAdCompleted = false;
//
//     onAdCompleted = null;
//     onAdStarted = null;
//     onAdFailed = null;
//     _isInitialized = false;
//
//     log("VideoAdServices: Disposed successfully");
//   }
//
//   static Widget createAdWidget({
//     VoidCallback? onAdCompletedCallback,
//     VoidCallback? onAdStartedCallback,
//     VoidCallback? onAdFailedCallback,
//   }) {
//     initialize(
//       onAdCompletedCallback: onAdCompletedCallback,
//       onAdStartedCallback: onAdStartedCallback,
//       onAdFailedCallback: onAdFailedCallback,
//     );
//
//     return AdDisplayContainer(
//       onContainerAdded: (AdDisplayContainer container) {
//         log('VideoAdServices: AdDisplayContainer added');
//         adDisplayContainer = container;
//         _loadAds(container);
//       },
//     );
//   }
//
//   static void _loadAds(AdDisplayContainer container) {
//     if (isLoadingVideoAd) {
//       log('VideoAdServices: Already loading ads, skipping...');
//       return;
//     }
//
//     isLoadingVideoAd = true;
//     isAdReady = false;
//     isAdCompleted = false;
//
//     log('VideoAdServices: Starting to load ads...');
//
//     _adsLoader = AdsLoader(
//       container: container,
//       onAdsLoaded: (OnAdsLoadedData data) {
//         log('VideoAdServices: Ads loaded successfully');
//         _adsManager = data.manager;
//         _setupAdsManager(data.manager);
//         isLoadingVideoAd = false;
//         isAdReady = true;
//       },
//       onAdsLoadError: (AdsLoadErrorData data) {
//         log('VideoAdServices: Ads load error: ${data.error.message}');
//         isLoadingVideoAd = false;
//         isAdReady = false;
//
//         // Call onAdFailed callback when ads fail to load
//         onAdFailed?.call();
//
//         _handleAdComplete();
//
//         Timer(const Duration(seconds: 3), () {
//           log('VideoAdServices: Retrying ad load...');
//           _loadAds(container);
//         });
//       },
//     );
//
//     _requestAds();
//   }
//
//   static void _setupAdsManager(AdsManager manager) {
//     manager.setAdsManagerDelegate(
//       AdsManagerDelegate(
//         onAdEvent: (AdEvent event) {
//           log('VideoAdServices AdEvent: ${event.type}');
//
//           switch (event.type) {
//             case AdEventType.loaded:
//               log('VideoAdServices: Ad loaded, starting playback');
//               isAdPlaying = true;
//               manager.start();
//               break;
//
//             case AdEventType.started:
//               log('VideoAdServices: Ad started playing');
//               isAdPlaying = true;
//               // Call onAdStarted callback when ad actually starts
//               onAdStarted?.call();
//               break;
//
//             case AdEventType.allAdsCompleted:
//               log('VideoAdServices: All ads completed');
//               _handleAdComplete();
//               break;
//
//             case AdEventType.clicked:
//               log('VideoAdServices: Ad clicked');
//               break;
//
//             case AdEventType.complete:
//               log('VideoAdServices: Single ad completed');
//               break;
//
//             case AdEventType.skipped:
//               log('VideoAdServices: Ad skipped');
//               _handleAdComplete();
//               break;
//
//             default:
//               log('VideoAdServices: Unknown ad event: ${event.type}');
//           }
//         },
//         onAdErrorEvent: (AdErrorEvent event) {
//           log('VideoAdServices AdError: ${event.error.message}');
//           isLoadingVideoAd = false;
//           isAdReady = false;
//           isAdPlaying = false;
//
//           // Call onAdFailed callback on ad error
//           onAdFailed?.call();
//
//           _handleAdComplete();
//           _cleanupAdsManager();
//         },
//       ),
//     );
//
//     manager.init(
//       settings: AdsRenderingSettings(
//         enablePreloading: true,
//         playAdsAfterTime: const Duration(microseconds: 0),
//       ),
//     );
//   }
//
//   static void _handleAdComplete() {
//     log('VideoAdServices: Handling ad completion');
//     isAdPlaying = false;
//     isAdCompleted = true;
//     onAdCompleted?.call();
//     _cleanupAdsManager();
//   }
//
//   static Future<void> _requestAds() async {
//     if (_adsLoader == null) {
//       log('VideoAdServices: AdsLoader is null, cannot request ads');
//       return;
//     }
//
//     try {
//       log('VideoAdServices: Requesting ads from server...');
//       await _adsLoader!.requestAds(
//         AdsRequest(
//           adTagUrl: GoogleAdHelper.googleVideoAd,
//           contentProgressProvider: ContentProgressProvider(),
//         ),
//       );
//     } catch (e) {
//       log('VideoAdServices: Error requesting ads: $e');
//       isLoadingVideoAd = false;
//       isAdReady = false;
//
//       // Call onAdFailed callback on request error
//       onAdFailed?.call();
//
//       _handleAdComplete();
//     }
//   }
//
//   static void _cleanupAdsManager() {
//     _adsManager?.destroy();
//     _adsManager = null;
//     isAdReady = false;
//   }
//
//   static bool get areAdsReady => isAdReady && _adsManager != null;
//   static bool get isLoading => isLoadingVideoAd;
//   static bool get isPlayingAd => isAdPlaying;
//   static bool get hasAdCompleted => isAdCompleted;
//
//   // static void playAds() {
//   //   if (areAdsReady) {
//   //     log('VideoAdServices: Starting ad playback');
//   //     isAdPlaying = true;
//   //     _adsManager?.start();
//   //   } else {
//   //     log('VideoAdServices: Ads not ready for playback');
//   //   }
//   // }
//   //
//   // static void pauseAds() {
//   //   _adsManager?.pause();
//   //   log('VideoAdServices: Ads paused');
//   // }
//   //
//   // static void resumeAds() {
//   //   _adsManager?.resume();
//   //   log('VideoAdServices: Ads resumed');
//   // }
//   //
//   // static void skipAd() {
//   //   _adsManager?.skip();
//   //   log('VideoAdServices: Ad skipped');
//   // }
//
//   static void playAds() {
//     if (!areAdsReady) {
//       log('VideoAdServices: Ads not ready for playback');
//       return;
//     }
//     try {
//       log('VideoAdServices: Starting ad playback');
//       isAdPlaying = true;
//       _adsManager?.start();
//     } catch (e, s) {
//       log('VideoAdServices: Error starting ads: $e\n$s');
//       _handleAdComplete();
//     }
//   }
//
//   static void pauseAds() {
//     try {
//       _adsManager?.pause();
//       log('VideoAdServices: Ads paused');
//     } catch (e, s) {
//       log('VideoAdServices: Error pausing ads: $e\n$s');
//     }
//   }
//
//   static void resumeAds() {
//     try {
//       _adsManager?.resume();
//       log('VideoAdServices: Ads resumed');
//     } catch (e, s) {
//       log('VideoAdServices: Error resuming ads: $e\n$s');
//     }
//   }
//
//   static void skipAd() {
//     try {
//       _adsManager?.skip();
//       log('VideoAdServices: Ad skipped');
//     } catch (e, s) {
//       log('VideoAdServices: Error skipping ads: $e\n$s');
//     }
//   }
// }
//
// ///
//
// // class AdPreloader {
// //   static final AdPreloader _instance = AdPreloader._internal();
// //   factory AdPreloader() => _instance;
// //   AdPreloader._internal();
// //
// //   AdsLoader? _preloadedAdsLoader;
// //   AdsManager? _preloadedAdsManager;
// //   bool _isPreloading = false;
// //   bool _isPreloaded = false;
// //
// //   static const String _preRollAdTagUrl =
// //       'https://pubads.g.doubleclick.net/gampad/ads?iu=/21775744923/external/single_preroll_skippable&sz=640x480&ciu_szs=300x250%2C728x90&gdfp_req=1&output=vast&unviewed_position_start=1&env=vp&impl=s&correlator=';
// //
// //   // Preload ads in the background (call this from your home page)
// //   Future<void> preloadAds() async {
// //     if (_isPreloading || _isPreloaded) return;
// //
// //     _isPreloading = true;
// //     log('VideoAdServicesStarting ad preloading...');
// //
// //     try {
// //       log('VideoAdServicesenter in try======================');
// //       final tempContainer = AdDisplayContainer(
// //         onContainerAdded: (AdDisplayContainer container) {
// //           log('VideoAdServicesAdDisplayContainer added successfully');
// //           _preloadedAdsLoader = AdsLoader(
// //             container: container,
// //             onAdsLoaded: (OnAdsLoadedData data) {
// //               log('VideoAdServicesAds preloaded successfully');
// //               _preloadedAdsManager = data.manager;
// //               _isPreloaded = true;
// //               _isPreloading = false;
// //
// //               try {
// //                 data.manager.init(settings: AdsRenderingSettings(enablePreloading: true));
// //                 log('VideoAdServicesAds Manager initialized successfully');
// //               } catch (e) {
// //                 log('VideoAdServicesError initializing Ads Manager: $e');
// //               }
// //             },
// //             onAdsLoadError: (AdsLoadErrorData data) {
// //               log('VideoAdServicesAd preload failed: ${data.error.message}');
// //               _isPreloading = false;
// //             },
// //           );
// //
// //           _preloadedAdsLoader!.requestAds(AdsRequest(adTagUrl: _preRollAdTagUrl, contentProgressProvider: ContentProgressProvider()));
// //         },
// //       );
// //
// //       log('VideoAdServicesRequesting ads for preloading...');
// //     } catch (e) {
// //       log('VideoAdServicesError during ad preloading: $e');
// //       _isPreloading = false;
// //     }
// //   }
// //
// //   // Get preloaded ads manager
// //   AdsManager? getPreloadedAdsManager() {
// //     return _isPreloaded ? _preloadedAdsManager : null;
// //   }
// //
// //   bool get isPreloaded => _isPreloaded;
// //
// //   void clearPreloadedAds() {
// //     _preloadedAdsManager?.destroy();
// //     _preloadedAdsManager = null;
// //     _preloadedAdsLoader = null;
// //     _isPreloaded = false;
// //     _isPreloading = false;
// //   }
// // }
// //
// // RxBool isLoadingVideoAd = false.obs;
// //
// // Widget? videoAdWidget;
// //
// // class GoogleVideoAd extends StatefulWidget {
// //   final Function()? onAdCompleted;
// //   final Widget? viewWidget;
// //   RxBool? isLoadingAds;
// //
// //   GoogleVideoAd({super.key, this.onAdCompleted, this.viewWidget, this.isLoadingAds});
// //
// //   @override
// //   State<GoogleVideoAd> createState() => _GoogleVideoAdState();
// // }
// //
// // class _GoogleVideoAdState extends State<GoogleVideoAd> with WidgetsBindingObserver {
// //   static const String _preRollAdTagUrl =
// //       'https://pubads.g.doubleclick.net/gampad/ads?iu=/21775744923/external/single_preroll_skippable&sz=640x480&ciu_szs=300x250%2C728x90&gdfp_req=1&output=vast&unviewed_position_start=1&env=vp&impl=s&correlator=';
// //
// //   AppLifecycleState _lastLifecycleState = AppLifecycleState.resumed;
// //
// //   bool _adPlaybackComplete = false;
// //
// //   void _handleAdCompleted() {
// //     log('VideoAdServicesAd playback completed, calling callback');
// //     if (widget.onAdCompleted != null) {
// //       widget.onAdCompleted!();
// //     }
// //   }
// //
// //   @override
// //   void initState() {
// //     super.initState();
// //     WidgetsBinding.instance.addObserver(this);
// //
// //     isLoadingVideoAd.value = true;
// //   }
// //
// //   Future<void> _requestAds(AdDisplayContainer container) {
// //     log('VideoAdServicesRequesting ads...');
// //     return _adsLoader.requestAds(
// //       AdsRequest(
// //         adTagUrl: GoogleAdHelper.googleVideoAd,
// //         contentProgressProvider: ContentProgressProvider(),
// //       ),
// //     );
// //   }
// //
// //   @override
// //   void didChangeAppLifecycleState(AppLifecycleState state) {
// //     switch (state) {
// //       case AppLifecycleState.resumed:
// //         _adsManager?.resume();
// //         break;
// //       case AppLifecycleState.inactive:
// //         if (_lastLifecycleState == AppLifecycleState.resumed) {
// //           _adsManager?.pause();
// //         }
// //         break;
// //       default:
// //         break;
// //     }
// //     _lastLifecycleState = state;
// //   }
// //
// //   @override
// //   void dispose() {
// //     super.dispose();
// //
// //     WidgetsBinding.instance.removeObserver(this);
// //   }
// //
// //   @override
// //   Widget build(BuildContext context) {
// //     return Offstage();
// //   }
// // }
//
// //----------------------------------------------------------------------------------------------------------------------------------------------------------
// //
// // import 'dart:async';
// // import 'package:flutter/material.dart';
// // import 'package:flutter_spinkit/flutter_spinkit.dart';
// // import 'package:get/get.dart';
// // import 'package:interactive_media_ads/interactive_media_ads.dart';
// // import 'package:Live1/ads/google_ads/google_ad_helper.dart';
// // import 'package:Live1/utils/colors/app_color.dart';
// //
// // // class AdPreloader {
// // //   static final AdPreloader _instance = AdPreloader._internal();
// // //   factory AdPreloader() => _instance;
// // //   AdPreloader._internal();
// // //
// // //   AdsLoader? _preloadedAdsLoader;
// // //   AdsManager? _preloadedAdsManager;
// // //   bool _isPreloading = false;
// // //   bool _isPreloaded = false;
// // //
// // //   static const String _preRollAdTagUrl =
// // //       'https://pubads.g.doubleclick.net/gampad/ads?iu=/21775744923/external/single_preroll_skippable&sz=640x480&ciu_szs=300x250%2C728x90&gdfp_req=1&output=vast&unviewed_position_start=1&env=vp&impl=s&correlator=';
// // //
// // //   // Preload ads in the background (call this from your home page)
// // //   Future<void> preloadAds() async {
// // //     if (_isPreloading || _isPreloaded) return;
// // //
// // //     _isPreloading = true;
// // //     debugPrint('Starting ad preloading...');
// // //
// // //     try {
// // //       debugPrint('enter in try======================');
// // //       final tempContainer = AdDisplayContainer(
// // //         onContainerAdded: (AdDisplayContainer container) {
// // //           debugPrint('AdDisplayContainer added successfully');
// // //           _preloadedAdsLoader = AdsLoader(
// // //             container: container,
// // //             onAdsLoaded: (OnAdsLoadedData data) {
// // //               debugPrint('Ads preloaded successfully');
// // //               _preloadedAdsManager = data.manager;
// // //               _isPreloaded = true;
// // //               _isPreloading = false;
// // //
// // //               try {
// // //                 data.manager.init(settings: AdsRenderingSettings(enablePreloading: true));
// // //                 debugPrint('Ads Manager initialized successfully');
// // //               } catch (e) {
// // //                 debugPrint('Error initializing Ads Manager: $e');
// // //               }
// // //             },
// // //             onAdsLoadError: (AdsLoadErrorData data) {
// // //               debugPrint('Ad preload failed: ${data.error.message}');
// // //               _isPreloading = false;
// // //             },
// // //           );
// // //
// // //           _preloadedAdsLoader!.requestAds(AdsRequest(adTagUrl: _preRollAdTagUrl, contentProgressProvider: ContentProgressProvider()));
// // //         },
// // //       );
// // //
// // //       debugPrint('Requesting ads for preloading...');
// // //     } catch (e) {
// // //       debugPrint('Error during ad preloading: $e');
// // //       _isPreloading = false;
// // //     }
// // //   }
// // //
// // //   // Get preloaded ads manager
// // //   AdsManager? getPreloadedAdsManager() {
// // //     return _isPreloaded ? _preloadedAdsManager : null;
// // //   }
// // //
// // //   bool get isPreloaded => _isPreloaded;
// // //
// // //   void clearPreloadedAds() {
// // //     _preloadedAdsManager?.destroy();
// // //     _preloadedAdsManager = null;
// // //     _preloadedAdsLoader = null;
// // //     _isPreloaded = false;
// // //     _isPreloading = false;
// // //   }
// // // }
// //
// // RxBool isLoadingVideoAd = false.obs;
// //
// // Widget? videoAdWidget;
// //
// // class GoogleVideoAd extends StatefulWidget {
// //   final Function()? onAdCompleted;
// //   final Widget? viewWidget;
// //   RxBool? isLoadingAds;
// //
// //   GoogleVideoAd({super.key, this.onAdCompleted, this.viewWidget, this.isLoadingAds});
// //
// //   @override
// //   State<GoogleVideoAd> createState() => _GoogleVideoAdState();
// // }
// //
// // class _GoogleVideoAdState extends State<GoogleVideoAd> with WidgetsBindingObserver {
// //   static const String _preRollAdTagUrl =
// //       'https://pubads.g.doubleclick.net/gampad/ads?iu=/21775744923/external/single_preroll_skippable&sz=640x480&ciu_szs=300x250%2C728x90&gdfp_req=1&output=vast&unviewed_position_start=1&env=vp&impl=s&correlator=';
// //
// //   AppLifecycleState _lastLifecycleState = AppLifecycleState.resumed;
// //
// //   bool _adPlaybackComplete = false;
// //
// //   void _handleAdCompleted() {
// //     debugPrint('Ad playback completed, calling callback');
// //     if (widget.onAdCompleted != null) {
// //       widget.onAdCompleted!();
// //     }
// //   }
// //
// //   @override
// //   void initState() {
// //     super.initState();
// //     WidgetsBinding.instance.addObserver(this);
// //
// //     isLoadingVideoAd.value = true;
// //   }
// //
// //   Future<void> _requestAds(AdDisplayContainer container) {
// //     debugPrint('Requesting ads...');
// //     return _adsLoader.requestAds(
// //       AdsRequest(
// //         adTagUrl: GoogleAdHelper.googleVideoAd,
// //         contentProgressProvider: ContentProgressProvider(),
// //       ),
// //     );
// //   }
// //
// //   @override
// //   void didChangeAppLifecycleState(AppLifecycleState state) {
// //     switch (state) {
// //       case AppLifecycleState.resumed:
// //         _adsManager?.resume();
// //         break;
// //       case AppLifecycleState.inactive:
// //         if (_lastLifecycleState == AppLifecycleState.resumed) {
// //           _adsManager?.pause();
// //         }
// //         break;
// //       default:
// //         break;
// //     }
// //     _lastLifecycleState = state;
// //   }
// //
// //   @override
// //   void dispose() {
// //     super.dispose();
// //     _adsManager?.destroy();
// //     WidgetsBinding.instance.removeObserver(this);
// //   }
// //
// //   @override
// //   Widget build(BuildContext context) {
// //     return Offstage();
// //   }
// // }
// //
// // class VideoAdServices {
// //   static void onLoadAd() async {
// //     videoAdWidget = AdDisplayContainer(
// //       onContainerAdded: (AdDisplayContainer container) {
// //         debugPrint('📦 AdDisplayContainer added');
// //
// //         debugPrint('⏳ No preloaded ads available, loading ads normally');
// //
// //         isLoadingVideoAd.value = true;
// //
// //         print("**** Change Loading => $isLoadingVideoAd");
// //
// //         _adsLoader = AdsLoader(
// //           container: container,
// //           onAdsLoaded: (OnAdsLoadedData data) {
// //             debugPrint('✅ Ads loaded: ${data.manager}');
// //             _adsManager = data.manager;
// //             _setupAdsManager(data.manager);
// //             isLoadingVideoAd.value = false;
// //             print("**** Change Loading => $isLoadingVideoAd");
// //           },
// //           onAdsLoadError: (AdsLoadErrorData data) {
// //             debugPrint('❌ Ads load error: ${data.error.message}');
// //             setState(() {
// //               widget.isLoadingAds = false.obs;
// //             });
// //             _handleAdCompleted();
// //             isLoadingVideoAd.value = true;
// //             print("**** Change Loading => $isLoadingVideoAd");
// //           },
// //         );
// //
// //         _requestAds(container);
// //       },
// //     );
// //   }
// //
// //   static AdsManager? _adsManager;
// //
// //   static late final AdsLoader _adsLoader;
// //
// //   void _setupAdsManager(AdsManager manager) {
// //     manager.setAdsManagerDelegate(
// //       AdsManagerDelegate(
// //         onAdEvent: (AdEvent event) {
// //           debugPrint('OnAdEvent: ${event.type} => ${event.adData}');
// //           switch (event.type) {
// //             case AdEventType.loaded:
// //               debugPrint('Ad loaded and starting.');
// //               setState(() {
// //                 widget.isLoadingAds = false.obs; // Hide loader when ad is loaded
// //               });
// //               if (!_adPlaybackComplete) {
// //                 manager.start();
// //               }
// //               break;
// //             case AdEventType.started:
// //               debugPrint('Ad started playing.');
// //               setState(() {
// //                 widget.isLoadingAds = false.obs; // Ensure loader is hidden when ad starts
// //               });
// //               break;
// //             case AdEventType.contentPauseRequested:
// //               debugPrint('Content pause requested - Ad starting');
// //               setState(() {
// //                 widget.isLoadingAds = false.obs; // Hide loader when ad actually starts
// //               });
// //               break;
// //             case AdEventType.contentResumeRequested:
// //               debugPrint('Content resume requested - Ad finished');
// //               _adPlaybackComplete = true;
// //               _handleAdCompleted();
// //               break;
// //             case AdEventType.allAdsCompleted:
// //               debugPrint('All ads completed.');
// //               _adPlaybackComplete = true;
// //               manager.destroy();
// //               _adsManager = null;
// //               // Clear preloaded ads after use
// //               // AdPreloader().clearPreloadedAds();
// //               _handleAdCompleted();
// //               break;
// //             case AdEventType.clicked:
// //               debugPrint('Ad clicked.');
// //               break;
// //             case AdEventType.complete:
// //               debugPrint('Ad completed.');
// //               break;
// //             default:
// //               debugPrint('Unknown ad event: ${event.type}');
// //           }
// //         },
// //         onAdErrorEvent: (AdErrorEvent event) {
// //           debugPrint('AdErrorEvent: ${event.error.message}');
// //           setState(() {
// //             widget.isLoadingAds = false.obs;
// //           });
// //           _adPlaybackComplete = true;
// //           _handleAdCompleted();
// //         },
// //       ),
// //     );
// //
// //     manager.init(settings: AdsRenderingSettings(enablePreloading: true));
// //   }
// // }
// //

import 'dart:async';
import 'dart:developer';

import 'package:flutter/material.dart';
import 'package:interactive_media_ads/interactive_media_ads.dart';
import 'package:youpeak/core/ads/google_ad_helper.dart';
import 'package:youpeak/core/settings/app_settings.dart';

class VideoAdServices {
  static bool isLoadingVideoAd = false;
  static bool isAdReady = false;
  static bool isAdPlaying = false;
  static bool isAdCompleted = false;
  static bool get isShowAds => AppSettings.isShowAds;

  static AdDisplayContainer? adDisplayContainer;
  static AdsManager? _adsManager;
  static AdsLoader? _adsLoader;
  static bool _isInitialized = false;
  static _AdLifecycleObserver? _lifecycleObserver;

  static VoidCallback? onAdCompleted;
  static VoidCallback? onAdStarted;
  static VoidCallback? onAdFailed;

  static void initialize({
    VoidCallback? onAdCompletedCallback,
    VoidCallback? onAdStartedCallback,
    VoidCallback? onAdFailedCallback,
  }) {
    if (_isInitialized) return;

    isLoadingVideoAd = false;
    isAdReady = false;
    isAdPlaying = false;
    isAdCompleted = false;
    adDisplayContainer = null;
    _adsManager = null;
    _adsLoader = null;

    onAdCompleted = onAdCompletedCallback;
    onAdStarted = onAdStartedCallback;
    onAdFailed = onAdFailedCallback;

    if (_lifecycleObserver == null) {
      _lifecycleObserver = _AdLifecycleObserver();
      WidgetsBinding.instance.addObserver(_lifecycleObserver!);
    }

    _isInitialized = true;
    log("VideoAdServices: Initialized successfully");
  }

  static void dispose() {
    _adsManager?.destroy();
    _adsLoader = null;
    adDisplayContainer = null;
    _adsManager = null;

    if (_lifecycleObserver != null) {
      WidgetsBinding.instance.removeObserver(_lifecycleObserver!);
      _lifecycleObserver = null;
    }

    isLoadingVideoAd = false;
    isAdReady = false;
    isAdPlaying = false;
    isAdCompleted = false;

    onAdCompleted = null;
    onAdStarted = null;
    onAdFailed = null;
    _isInitialized = false;

    log("VideoAdServices: Disposed successfully");
  }

  static Widget createAdWidget({
    VoidCallback? onAdCompletedCallback,
    VoidCallback? onAdStartedCallback,
    VoidCallback? onAdFailedCallback,
  }) {
    initialize(
      onAdCompletedCallback: onAdCompletedCallback,
      onAdStartedCallback: onAdStartedCallback,
      onAdFailedCallback: onAdFailedCallback,
    );

    if (isShowAds == false) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        onAdCompletedCallback?.call();
      });
      return const SizedBox();
    }

    return AdDisplayContainer(
      onContainerAdded: (AdDisplayContainer container) {
        log('VideoAdServices: AdDisplayContainer added');
        adDisplayContainer = container;
        _loadAds(container);
      },
    );
  }

  static void _loadAds(AdDisplayContainer container) {
    if (!isShowAds) {
      log('VideoAdServices: Ads are disabled, skipping load');
      return;
    }

    if (isLoadingVideoAd) {
      log('VideoAdServices: Already loading ads, skipping...');
      return;
    }

    isLoadingVideoAd = true;
    isAdReady = false;
    isAdCompleted = false;

    log('VideoAdServices: Starting to load ads...');

    _adsLoader = AdsLoader(
      container: container,
      onAdsLoaded: (OnAdsLoadedData data) {
        log('VideoAdServices: Ads loaded successfully');
        _adsManager = data.manager;
        _setupAdsManager(data.manager);
        isLoadingVideoAd = false;
        isAdReady = true;
      },
      onAdsLoadError: (data) {
        log("Ad Load Failed: ${data.error.message}");

        isLoadingVideoAd = false;
        isAdReady = false;

        onAdFailed?.call();
        _cleanupAdsManager();
      },
    );

    _requestAds();
  }

  static void _setupAdsManager(AdsManager manager) {
    manager.setAdsManagerDelegate(
      AdsManagerDelegate(
        onAdEvent: (AdEvent event) {
          log('VideoAdServices AdEvent: ${event.type}');

          switch (event.type) {
            case AdEventType.loaded:
              log('VideoAdServices: Ad loaded, starting playback');
              isAdPlaying = true;
              manager.start();
              break;

            case AdEventType.started:
              log('VideoAdServices: Ad started playing');
              isAdPlaying = true;
              // Call onAdStarted callback when ad actually starts
              onAdStarted?.call();
              break;

            case AdEventType.allAdsCompleted:
              log('VideoAdServices: All ads completed');
              _handleAdComplete();
              break;

            case AdEventType.clicked:
              log('VideoAdServices: Ad clicked');
              break;

            case AdEventType.complete:
              log('VideoAdServices: Single ad completed');
              break;

            case AdEventType.skipped:
              log('VideoAdServices: Ad skipped');
              _handleAdComplete();
              break;

            default:
              log('VideoAdServices: Unknown ad event: ${event.type}');
          }
        },
        onAdErrorEvent: (AdErrorEvent event) {
          log('VideoAdServices AdError: ${event.error.message}');
          isLoadingVideoAd = false;
          isAdReady = false;
          isAdPlaying = false;

          onAdFailed?.call();

          _handleAdComplete();
          _cleanupAdsManager();
        },
      ),
    );

    manager.init(
      settings: AdsRenderingSettings(
        enablePreloading: true,
        playAdsAfterTime: const Duration(microseconds: 0),
      ),
    );
  }

  static void _handleAdComplete() {
    log('VideoAdServices: Handling ad completion');
    isAdPlaying = false;
    isAdCompleted = true;
    onAdCompleted?.call();
    _cleanupAdsManager();
  }

  static Future<void> _requestAds() async {
    if (_adsLoader == null) {
      log('VideoAdServices: AdsLoader is null, cannot request ads');
      return;
    }

    try {
      log('VideoAdServices: Requesting ads from server...');
      await _adsLoader!.requestAds(
        AdsRequest(
          // adTagUrl: "https://pubads.g.doubleclick.net/gampad/ads?iu=/21775744923/external/single_preroll_skippable&sz=640x480&ciu_szs=300x250%2C728x90&gdfp_req=1&output=vast&unviewed_position_start=1&env=vp&impl=s&correlator=",
          adTagUrl: GoogleAdHelper.googleVideoAd,
          contentProgressProvider: ContentProgressProvider(),
        ),
      );
    } catch (e) {
      log('VideoAdServices: Error requesting ads: $e');
      isLoadingVideoAd = false;
      isAdReady = false;

      onAdFailed?.call();

      _handleAdComplete();
    }
  }

  static void _cleanupAdsManager() {
    _adsManager?.destroy();
    _adsManager = null;
    isAdReady = false;
  }

  static bool get areAdsReady => isAdReady && _adsManager != null;
  static bool get isLoading => isLoadingVideoAd;
  static bool get isPlayingAd => isAdPlaying;
  static bool get hasAdCompleted => isAdCompleted;

  static void playAds() {
    if (!isShowAds) {
      log('VideoAdServices: Ads are disabled, skipping playback');
      return;
    }

    if (!areAdsReady) {
      log('VideoAdServices: Ads not ready for playback');
      return;
    }
    try {
      log('VideoAdServices: Starting ad playback');
      isAdPlaying = true;
      _adsManager?.start();
    } catch (e, s) {
      log('VideoAdServices: Error starting ads: $e\n$s');
      _handleAdComplete();
    }
  }

  static void pauseAds() {
    try {
      _adsManager?.pause();
      log('VideoAdServices: Ads paused');
    } catch (e, s) {
      log('VideoAdServices: Error pausing ads: $e\n$s');
    }
  }

  static void resumeAds() {
    try {
      _adsManager?.resume();
      log('VideoAdServices: Ads resumed');
    } catch (e, s) {
      log('VideoAdServices: Error resuming ads: $e\n$s');
    }
  }

  static void skipAd() {
    try {
      _adsManager?.skip();
      log('VideoAdServices: Ad skipped');
    } catch (e, s) {
      log('VideoAdServices: Error skipping ads: $e\n$s');
    }
  }
}

class _AdLifecycleObserver extends WidgetsBindingObserver {
  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      log('VideoAdServices: App resumed. Resuming ad if it was playing.');
      VideoAdServices.resumeAds();
    } else if (state == AppLifecycleState.inactive || state == AppLifecycleState.paused) {
      log('VideoAdServices: App inactive/paused. Pausing ad.');
      VideoAdServices.pauseAds();
    }
  }
}
