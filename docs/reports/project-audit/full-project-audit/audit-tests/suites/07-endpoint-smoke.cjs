// AUDIT: functional smoke of client/admin read endpoints against seeded data (emulator).
// PASS = HTTP 200, answered in time, JSON status !== false.  FAIL lines are the observed defect.
"use strict";
const jwt = require("jsonwebtoken");

module.exports = async (h, check, assert) => {
  const { set, seedUser, idToken } = h;
  const now = new Date().toISOString();
  const adm = async (id, role = "SUPER_ADMIN", extra = {}) => {
    await set("admins", id, { name: id, email: `${id}@t.local`, role, isActive: true, ...extra });
    return jwt.sign({ _id: id, role }, "test-jwt", { expiresIn: "1h" });
  };

  // seed a small connected data set
  await seedUser("sm_viewer", { fullName: "Smoke Viewer", isChannel: false });
  await seedUser("sm_creator", { fullName: "Smoke Creator", isChannel: true, channelId: "sm_creator", channelType: 1, subscriptionCost: 10, videoUnlockCost: 10, isMonetization: true });
  const vbase = { userId: "sm_creator", channelId: "sm_creator", isActive: true, scheduleType: 2, visibilityType: 1, videoPrivacyType: 1, uniqueVideoId: "UV1", createdAt: now, videoTime: 120, like: 0, dislike: 0, videoImage: "https://x/y.jpg", videoUrl: "https://x/v.mp4", title: "Smoke video", description: "d", hashTag: ["a"] };
  await set("videos", "sm_v1", { ...vbase, videoType: 1 });
  await set("videos", "sm_s1", { ...vbase, videoType: 2, uniqueVideoId: "UV2", title: "Smoke short" });
  const VC = h.req("models/videoComment.model");
  const cm = await VC.create({ userId: "sm_viewer", videoId: "sm_v1", channelId: "sm_creator", videoType: 1, commentText: "nice" });
  await VC.create({ userId: "sm_creator", videoId: "sm_v1", recursiveCommentId: String(cm._id), commentText: "reply" });
  await h.req("models/saveToWatchLater.model").create({ userId: "sm_viewer", videoId: "sm_v1" });
  await h.req("models/userWiseDownload.model").create({ userId: "sm_viewer", videoId: "sm_v1" });
  await h.req("models/playList.model").create({ userId: "sm_viewer", channelId: "sm_creator", playListName: "pl", playListType: 2, videoId: ["sm_v1"] });
  await h.req("models/notification.model").create({ userId: "sm_viewer", title: "n", message: "m" });
  await h.req("models/watchHistory.model").create({ userId: "sm_viewer", videoId: "sm_v1", videoUserId: "sm_creator", videoChannelId: "sm_creator", totalWatchTime: 60 });
  await h.req("models/userWiseSubscription.model").create({ userId: "sm_viewer", channelId: "sm_creator" });
  await set("withDrawRequests", "sm_wd", { userId: "sm_viewer", requestAmount: 100, status: 1, createdAt: now });
  await set("reports", "sm_rp", { userId: "sm_viewer", videoId: "sm_v1", videoType: 1, reportType: 1, createdAt: now });
  await set("agencies", "sm_ag", { name: "SM", state: "TN", district: "Trichy", isActive: true });
  const tokV = await idToken("sm_viewer");
  const A = await adm("sm_super");

  const client = [
    ["FAQ", "GET", "/client/FAQ"], ["contact", "GET", "/client/contact"], ["setting", "GET", "/client/setting"],
    ["soundList", "GET", "/client/soundList/getSoundList?start=1&limit=5"], ["withdrawList", "GET", "/client/withdraw/withdrawList"],
    ["premiumPlan", "GET", "/client/premiumPlan"], ["coinplan", "GET", "/client/coinplan/retriveCoinplanByUser"],
    ["taskerTiers", "GET", "/client/taskerTier/getAvailableTiers"], ["creatorTiers", "GET", "/client/creatorTier/getAvailableTiers"],
    ["grievanceOfficer", "GET", "/client/grievance"], ["translationVersion", "GET", "/client/translation/revealLatestVersion"],
    ["activeLanguages", "GET", "/client/translation/harvestActiveLanguages"],
    ["profile", "GET", "/client/user/profile"], ["detailsOfChannel", "GET", "/client/user/detailsOfChannel?channelId=sm_creator&start=1&limit=5"],
    ["videosOfChannel", "GET", "/client/user/videosOfChannel?channelId=sm_creator"], ["playListsOfChannel", "GET", "/client/user/playListsOfChannel?channelId=sm_viewer"],
    ["referralHistory", "GET", "/client/user/loadReferralHistoryByUser"], ["coinHistory", "GET", "/client/user/retriveCoinHistoryByUser"], ["walletHistory", "GET", "/client/user/fetchWalletHistoryByUser"],
    ["getShorts", "GET", "/client/video/getShorts"], ["getVideos", "GET", "/client/video/getVideos"],
    ["videosOfHome-all", "GET", "/client/video/videosOfHome?type=all&start=1&limit=10"],
    ["videosOfHome-new", "GET", "/client/video/videosOfHome?type=new&start=1&limit=10"],
    ["videosOfHome-popular", "GET", "/client/video/videosOfHome?type=popular&start=1&limit=10"],
    ["detailsOfVideo", "GET", "/client/video/detailsOfVideo?videoId=sm_v1&videoType=1"],
    ["search", "POST", "/client/video/search", { searchString: "Smoke" }],
    ["searchShorts", "POST", "/client/video/searchShorts", { searchString: "Smoke" }],
    ["searchChannelVideoShortsByUser", "POST", "/client/video/searchChannelVideoShortsByUser?searchString=Smoke&type=all", {}],
    ["searchData", "GET", "/client/video/searchData"], ["getTopViewedVideos", "GET", "/client/video/getTopViewedVideos"],
    ["getVideoList", "GET", "/client/video/getVideoList"], ["getUserVideos", "GET", "/client/video/getUserVideos"],
    ["getAllLikeThis", "GET", "/client/video/getAllLikeThis?videoId=sm_v1"],
    ["getComments", "GET", "/client/videoComment/getComments?videoId=sm_v1&commentType=newest"],
    ["repliesOfVideoComment", "GET", `/client/videoComment/repliesOfVideoComment?videoId=sm_v1&recursiveCommentId=${cm._id}`],
    ["getWatchHistory", "GET", "/client/watchHistory/getWatchHistory"],
    ["weeklyViewsAnalytics", "GET", "/client/watchHistory/weeklyViewsAnalytics?userId=sm_creator&startDate=2020-01-01&endDate=2030-01-01"],
    ["getMyWatchHistory", "GET", "/client/playbackSession/getMyWatchHistory"], ["getSaveToWatchLater", "GET", "/client/saveToWatchLater/getSaveToWatchLater"],
    ["getdownloadVideoHistory", "GET", "/client/userWiseDownload/getdownloadVideoHistory"], ["getSubscribedChannel", "GET", "/client/userWiseSubscription/getSubscribedChannel"],
    ["videoOfSubscribedChannel", "GET", "/client/userWiseSubscription/videoOfSubscribedChannel?type=all"], ["getNotificationList", "GET", "/client/notification/getNotificationList"],
    ["taskerDashboard", "GET", "/client/tasker/dashboard"], ["taskStatus", "GET", "/client/userTaskReward/status"],
    ["dailyRewardCoin", "GET", "/client/dailyCoinReward/getDailyRewardCoinByUser"], ["fetchSettingDetails", "GET", "/client/withdrawalRequest/fetchSettingDetails"],
    ["getWithdrawRequests", "GET", "/client/withdrawalRequest/getWithdrawRequests?startDate=All&endDate=All"],
    ["getMonetization", "GET", "/client/monetizationRequest/getMonetization"],
    ["getMonetizationForUser", "GET", "/client/monetizationRequest/getMonetizationForUser?startDate=All&endDate=All"],
    ["partnerDashboard", "GET", "/client/partner/dashboard"], ["fundingEligibility", "GET", "/client/creatorFunding/eligibility"],
    ["activeCampaigns", "GET", "/client/creatorFunding/getActiveCampaigns"], ["liveUserList", "GET", "/client/liveUser/getliveUserList"],
    ["promotionPlans", "GET", "/client/videoPromotion/plans"], ["adRewardByUser", "GET", "/client/adRewardCoin/getAdRewardByUser"],
    ["localAds", "GET", "/client/localBusinessAd/getActiveAdsForRegion"], ["planHistoryOfUser", "GET", "/client/premiumPlan/planHistoryOfUser"],
    ["fetchCoinplanHistory", "GET", "/client/premiumPlan/fetchCoinplanHistoryOfUser?startDate=All&endDate=All"],
  ];
  for (const [name, method, path, body] of client) {
    await check(`C-${name}`, `${method} ${path.split("?")[0]} answers with status:true`, async () => {
      const ctl = new AbortController();
      const t = setTimeout(() => ctl.abort(), 8000);
      let r; let j = {};
      try {
        r = await fetch(h.base + path, { method, headers: { key: "test-app-key", authorization: `Bearer ${tokV}`, "content-type": "application/json" }, body: body ? JSON.stringify({ userId: "sm_viewer", ...body }) : undefined, signal: ctl.signal });
        try { j = await r.json(); } catch (_) { /* not json */ }
      } catch (e) { clearTimeout(t); assert.fail("no response within 8 s (request hangs)"); }
      clearTimeout(t);
      assert.ok(r.status === 200 && j.status !== false, `HTTP ${r.status}; status=${j.status}; message="${String(j.message || j.error || "").slice(0, 140)}"`);
    });
  }

  const admin = [
    ["dashboardCount", "/admin/dashboard/dashboardCount?startDate=All&endDate=All"], ["chartAnalytic", "/admin/dashboard/chartAnalytic?type=User&startDate=All&endDate=All"],
    ["getUsers", "/admin/user/getUsers?start=1&limit=10"], ["channelsOfUser", "/admin/user/channelsOfUser?start=1&limit=10"],
    ["videosOrShorts", "/admin/video/videosOrShorts?start=1&limit=10&videoType=1"], ["getComment", "/admin/videoComment/getComment?videoId=sm_v1&start=1&limit=10"],
    ["commentsOfVideos", "/admin/videoComment/commentsOfVideos?start=1&limit=10&startDate=All&endDate=All&videoType=1"],
    ["getReports", "/admin/report/getReports?videoType=1&start=1&limit=10&startDate=All&endDate=All"],
    ["withDrawalRequest", "/admin/withDrawalRequest?startDate=All&endDate=All&type=All"],
    ["monetizationRequests", "/admin/monetizationRequest/getAllMonetizationRequests?startDate=All&endDate=All&type=All"],
    ["premiumPlans", "/admin/premiumPlan/"], ["premiumHistory", "/admin/premiumPlan/getpremiumPlanHistory?startDate=All&endDate=All&start=1&limit=10"],
    ["soundList", "/admin/soundList/getSoundList?start=1&limit=10"], ["soundCategory", "/admin/soundCategory/"], ["coinplan", "/admin/coinplan/fetchCoinplan"],
    ["language", "/admin/language/harvestLanguages"], ["translations", "/admin/translation/harvestTranslations?languageCode=en"], ["settings", "/admin/setting/"],
    ["platformConfig", "/admin/platformConfig/"], ["tiers", "/admin/membershipTier/getTiers"], ["agencies", "/admin/agency/getAgencies"],
    ["commissions", "/admin/commission/getCommissions"], ["agencyReport", "/admin/agencyReport/getAgencyReport"],
    ["digitalPartnerList", "/admin/digitalPartner/list"], ["digitalPartnerReport", "/admin/digitalPartner/report"],
    ["payments", "/admin/payment/list"], ["reconcile", "/admin/payment/reconcile"], ["fraud", "/admin/fraud/getAlerts"],
    ["referralLogs", "/admin/referral/getReferralLogs"], ["leaderboard", "/admin/referral/getLeaderboard"],
    ["moderationQueue", "/admin/contentModeration/queue"], ["copyrightFlagged", "/admin/copyrightModeration/flagged"],
    ["grievances", "/admin/grievance/list"], ["localBusinessAds", "/admin/localBusinessAd/list"], ["videoPromotions", "/admin/videoPromotion/index"],
    ["creatorFunding", "/admin/creatorFunding/list"], ["mediaAudit", "/admin/mediaAudit/report"], ["currency", "/admin/currency/"],
    ["withdrawMethods", "/admin/withdraw/"], ["adRewardCoin", "/admin/adRewardCoin/getAdReward"], ["dailyReward", "/admin/dailyRewardCoin/getDailyReward"],
    ["faq", "/admin/FAQ/"], ["contact", "/admin/contact/"], ["advertise", "/admin/advertise/"],
    ["userCoinVipHistory", "/admin/user/fetchUserCoinVipHistory?start=1&limit=10"],
  ];
  for (const [name, path] of admin) {
    await check(`A-${name}`, `GET ${path.split("?")[0]} (super admin) answers with status:true`, async () => {
      const ctl = new AbortController();
      const t = setTimeout(() => ctl.abort(), 8000);
      let r; let j = {};
      try {
        r = await fetch(h.base + path, { headers: { key: "test-app-key", authorization: A }, signal: ctl.signal });
        try { j = await r.json(); } catch (_) { /* not json */ }
      } catch (e) { clearTimeout(t); assert.fail("no response within 8 s (request hangs)"); }
      clearTimeout(t);
      assert.ok(r.status === 200 && j.status !== false, `HTTP ${r.status}; status=${j.status}; message="${String(j.message || j.error || "").slice(0, 140)}"`);
    });
  }
};
