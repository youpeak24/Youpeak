import 'package:flutter/foundation.dart';
import 'package:youpeak/pages/admin_settings/admin_settings_api.dart';

class Constant {
  // Build-time config. Override per build with --dart-define, e.g.
  //   flutter build apk --dart-define=API_BASE_URL=https://youpeak.app/ \
  //                      --dart-define=API_SECRET_KEY=xxxxxxxx
  static const String _defaultBaseUrl =
      String.fromEnvironment("API_BASE_URL", defaultValue: "https://youpeak.app/");

  // Bare host (no scheme) for shareable deep links — must match the Android
  // intent-filter host and the iOS applinks: entitlement exactly. Kept
  // separate from [domain], which is the API origin *with* its scheme (used
  // for sockets and image URLs), so the API can move without breaking links.
  static const String appDomain =
      String.fromEnvironment("APP_DOMAIN", defaultValue: "youpeak.app");
  static const String appUrlScheme = "youpeak";

  static const bool _useLocalDev =
      bool.fromEnvironment("USE_LOCAL_DEV", defaultValue: false);

  static String get baseURL {
    if (_useLocalDev) {
      return kIsWeb ? "http://localhost:5001/" : "http://10.0.2.2:5001/";
    }
    return _defaultBaseUrl;
  }

  static String get domain {
    final b = baseURL;
    return b.endsWith("/") ? b.substring(0, b.length - 1) : b;
  }

  static const secretKey =
      String.fromEnvironment("API_SECRET_KEY", defaultValue: "");
  static const folderStructurePath = "YouPeak";

  // >>>>> >>>>> >>>>> Admin Setting Api <<<<< <<<<< <<<<<<
  static const adminSetting = "client/setting";

  // >>>>> >>>>> >>>>> File Upload Api <<<<< <<<<< <<<<<<
  static String fileUpload = "client/file/upload-file";
  static const directUploadUrl = "client/file/direct-upload-url";
  static const channelImage = "$folderStructurePath/userImage";
  static const shortsVideo = "$folderStructurePath/Shorts";
  static const shortsVideoImage = "$folderStructurePath/shortsImage";
  static const normalVideo = "$folderStructurePath/Videos";
  static const normalVideoImage = "$folderStructurePath/videoImage";

  // >>>>> >>>>> >>>>> >>>>> Video Related Api <<<<< <<<<< <<<<<< <<<<<

  // >>>>> >>>>> >>>>> Home Page Api <<<<< <<<<< <<<<<<
  static const homeVideo = "client/video/videosOfHome";

  // >>>>> >>>>> >>>>> Shorts Page Api <<<<< <<<<< <<<<<<
  static const getShortsVideo = "client/video/getShorts";

  // >>>>> >>>>> >>>>> Subscription Page Api <<<<< <<<<< <<<<<<
  static const getSubscribedChannelVideo = "client/userWiseSubscription/videoOfSubscribedChannel";

  // >>>>> >>>>> >>>>> Subscription/Preview Channel Page Api <<<<< <<<<< <<<<<<
  static const channelVideos = "client/user/videosOfChannel";

  // >>>>> >>>>> >>>>> Preview Channel Page HomeTab Api <<<<< <<<<< <<<<<<
  static const channelHome = "client/user/detailsOfChannel";
  static const getPlayListVideos = "client/user/getPlayListVideos";

  // >>>>> >>>>> >>>>> Preview Channel Page PlaylistTab Api <<<<< <<<<< <<<<<<
  static const channelPlayList = "client/user/playListsOfChannel";

  // >>>>> >>>>> >>>>> Search Page Api <<<<< <<<<< <<<<<<
  static const search = "client/video/searchChannelVideoShortsByUser";

  // >>>>> >>>>> >>>>> Normal Video Details Page Api <<<<< <<<<< <<<<<<
  static const getVideoDetail = "client/video/detailsOfVideo";
  static const getRelatedVideo = "client/video/getAllLikeThis";

  // >>>>> >>>>> >>>>> Create Playlist Page Api <<<<< <<<<< <<<<<<
  static const getNormalVideo = "client/video/getVideos";

  // >>>>> >>>>> >>>>> Watch Later Page Api <<<<< <<<<< <<<<<<
  static const watchLater = "client/saveToWatchLater/getSaveToWatchLater";

  // >>>>>>>>>  Log In Related Api <<<<<<<<<<<

  static const userLogin = "client/user/login";
  static const getProfile = "client/user/profile";
  static const checkUser = "client/user/checkUser";
  static const createChannel = "client/user/update";
  static const checkChannelName = "client/video/verifyChannelname";
  static const updateProfile = "client/user/updateProfile";
  static const loginSendOtp = "client/otp/otpLogin";
  static const verificationOtp = "client/otp/verify";
  static const setPassword = "client/user/setPassword";
  static const forgotPasswordSendOtp = "client/otp/create";

  // Video Related Api.......

  static const uploadVideo = "client/video/createVideo";

  static const shareCount = "client/video/shareCount";
  static const likeDislikeVideo = "client/video/likeOrDislikeOfVideo";
  static const likeDislikeComment = "client/videoComment/likeOrDislike";

  static const reportVideo = "client/report/reportToVideo";

  // >>>>> >>>>> >>>>> Grievance Officer Api (IT Rules 2021) <<<<< <<<<< <<<<<<
  static const grievanceOfficer = "client/grievance";
  static const fileGrievance = "client/grievance/file";
  static const trackGrievance = "client/grievance/track";

  static const createWatchHistory = "client/watchHistory/createWatchHistory";
  static const createWatchLater = "client/saveToWatchLater/addVideoToWatchLater";

  static const getSoundList = "client/soundList/getSoundList";

  // >>>>>>>>>  Live1 Related Api <<<<<<<<<<<

  static const createLiveUser = "client/liveUser/live";
  static const getLiveUsers = "client/liveUser/getliveUserList";

  // >>>>>>>>>  Subscribe Related Api <<<<<<<<<<<

  static const getSubscribedChannel = "client/userWiseSubscription/getSubscribedChannel";

  static const subscribeChannel = "client/userWiseSubscription/subscribedUnSubscibed";

  // >>>>>>>>>  Profile Related Api <<<<<<<<<<<

  static const premiumPlan = "client/premiumPlan";
  static const purchasePremiumPlan = "client/premiumPlan/createHistory";
  static const premiumPlanPurchaseHistory = "client/premiumPlan/planHistoryOfUser";

  static const getFAQ = "client/FAQ";
  static const getContact = "client/contact";

  static const channelAbout = "client/user/aboutOfChannel";

  // >>>>>>>>>  Custom Api <<<<<<<<<<<

  static const createPlayList = "client/playlist/newPlayList";
  static const updatePlayList = "client/playlist/updatePlayList";

  static const notification = "client/notification/getNotificationList";
  static const clearNotification = "client/notification/clearNotificationHistory";

  // >>>>>>>>>> Use Live1 Streaming <<<<<<<<<<

  static int get appId => int.tryParse(AdminSettingsApi.adminSettingsModel?.setting?.zegoAppId?.toString() ?? "") ?? 0;
  static String get appSign => AdminSettingsApi.adminSettingsModel?.setting?.zegoAppSignIn ?? "";
  static const serverSecret = '';

  // >>>>>>>>>  Monetization Api <<<<<<<<<<<

  static const monetization = "client/monetizationRequest/getMonetization";
  static const monetizationRequest = "client/monetizationRequest/createMonetizationRequest";
  static const previewMonetization = "client/monetizationRequest/getMonetizationForUser";

  static const withdrawMethod = "client/withdraw/withdrawList";

  static const withDrawRequest = "client/withdrawalRequest/createWithdrawRequest";
  static const withDrawRequestHistory = "client/withdrawalRequest/getWithdrawRequests";

  // >>>>>>>>>  Monetization Api <<<<<<<<<<<

  static const adRewardCoin = "client/adRewardCoin/getAdRewardByUser";
  static const dailyRewardCoin = "client/dailyCoinReward/getDailyRewardCoinByUser";

// >>>>>>>>>  History Api <<<<<<<<<<<

  static const coinHistory = "client/user/retriveCoinHistoryByUser";
  static const buyCoinHistory = "client/premiumPlan/fetchCoinplanHistoryOfUser";
  static const walletHistory = "client/user/fetchWalletHistoryByUser";
  static const getMyCoin = "client/withdrawalRequest/fetchSettingDetails";
  static const convertCoin = "client/withdrawalRequest/coinToAmountConverter";
  static const withdrawHistory = "client/withdrawalRequest/getWithdrawRequests";
  static const referralHistory = "client/user/loadReferralHistoryByUser";
  static const referralCodeApply = "client/user/validateAndApplyReferralCode";

  static const createDailyCheckInRewardHistory = "client/dailyCoinReward/handleDailyCheckInReward";
  static const createAdWatchRewardHistory = "client/user/handleAdWatchReward";

  static const withdrawSetting = "client/withdrawalRequest/fetchSettingDetails";
  static const videoEngagementReward = "client/user/handleEngagementVideoWatchReward";

  // New Api Url

  static const fetchCoinPlan = "client/coinplan/retriveCoinplanByUser";
  static const purchaseCoinPlan = "client/coinplan/createCoinPlanHistory";
  static const unlockPrivateVideo = "client/video/unlockPrivateVideo";

  // >>>>> >>>>> >>>>> Gateway-agnostic Payment Api (Razorpay order + verify) <<<<< <<<<< <<<<<<
  static const paymentCreateOrder = "client/payment/createOrder";
  static const paymentVerify = "client/payment/verify";
  static const paymentStatus = "client/payment/status";

  // >>>>> >>>>> >>>>> Creator VIP Pass Api <<<<< <<<<< <<<<<<
  static const getCreatorTiers = "client/creatorTier/getAvailableTiers";

  // >>>>> >>>>> >>>>> Tasker Starter Pass Api <<<<< <<<<< <<<<<<
  static const getTaskerTiers = "client/taskerTier/getAvailableTiers";

  // >>>>> >>>>> >>>>> Video Promotion Api <<<<< <<<<< <<<<<<
  static const getVideoPromotionPlans = "client/videoPromotion/plans";
  static const getMyVideoPromotions = "client/videoPromotion";

// >>>>> >>>>> >>>>> Comment Page Api <<<<< <<<<< <<<<<<
  static const getAllComment = "client/videoComment/getComments";
  static const createComment = "client/videoComment/createComment";
  static const getAllReply = "client/videoComment/repliesOfVideoComment";
  static const createReply = "client/videoComment/createCommentReply";

  static const editVideo = "client/video/modifyVideo";
  static const deleteVideo = "client/video/deleteVideoRecord";

// >>>>> >>>>> >>>>> Delete Account Api <<<<< <<<<< <<<<<<
  static const deleteAccount = "client/user/deleteUserAccount";

// >>>>> >>>>> >>>>> Delete Account Api <<<<< <<<<< <<<<<<
  static const playListGetWithSearch = "client/video/getVideoList";

  // >>>>> >>>>> Localization Api <<<<< <<<<<
  static const fetchLanguages = "client/translation/harvestActiveLanguages";
  static const fetchLanguageTranslations = "client/translation/harvestTranslation";
  static const fetchLatestLanguageVersion = "client/translation/revealLatestVersion";
}
