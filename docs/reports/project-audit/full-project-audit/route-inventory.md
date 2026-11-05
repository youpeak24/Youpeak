# Route inventory (static analysis of functions/backend/routes)

Every route is also served under the `/api` prefix. Admin routes inherit `AdminMiddleware` (JWT + DB admin lookup + role allow-list) and `CheckScope` from `routes/admin/index.js` unless noted. `checkAccess` = shared public app key only. `bindAppUser` / `requireAppUser` = Firebase ID token. `optionalAppUser` = token optional; without it `userId` is stripped.

| Method | Path | Middleware chain | Handler | Auth level |
|---|---|---|---|---|
| POST | /admin/admin/create | — | AdminController.create | NONE (route-level) |
| POST | /admin/admin/forgotPassword | — | AdminController.forgotPassword | NONE (route-level) |
| POST | /admin/admin/login | — | AdminController.login | NONE (route-level) |
| GET | /admin/admin/profile | AdminMiddleware | AdminController.getProfile | admin JWT |
| POST | /admin/admin/setPassword | AdminMiddleware | AdminController.setPassword | admin JWT |
| PATCH | /admin/admin/update | AdminMiddleware | AdminController.update | admin JWT |
| PATCH | /admin/admin/updatePassword | AdminMiddleware | AdminController.updatePassword | admin JWT |
| DELETE | /admin/adRewardCoin/deleteAdReward | AdminMiddleware → CheckScope → checkAccessWithSecretKey | adRewardCoinController.deleteAdReward | admin JWT |
| GET | /admin/adRewardCoin/getAdReward | AdminMiddleware → CheckScope → checkAccessWithSecretKey | adRewardCoinController.getAdReward | admin JWT |
| POST | /admin/adRewardCoin/storeAdReward | AdminMiddleware → CheckScope → checkAccessWithSecretKey | adRewardCoinController.storeAdReward | admin JWT |
| PATCH | /admin/adRewardCoin/updateAdReward | AdminMiddleware → CheckScope → checkAccessWithSecretKey | adRewardCoinController.updateAdReward | admin JWT |
| GET | /admin/advertise/ | AdminMiddleware → CheckScope → checkAccessWithSecretKey | advertiseController.get | admin JWT |
| POST | /admin/advertise/create | AdminMiddleware → CheckScope → checkAccessWithSecretKey | advertiseController.store | admin JWT |
| PATCH | /admin/advertise/handleSwitchForAd | AdminMiddleware → CheckScope → checkAccessWithSecretKey | advertiseController.handleSwitchForAd | admin JWT |
| PATCH | /admin/advertise/update | AdminMiddleware → CheckScope → checkAccessWithSecretKey | advertiseController.update | admin JWT |
| DELETE | /admin/agency/delete | AdminMiddleware → CheckScope | AgencyController.remove | admin JWT |
| GET | /admin/agency/detail | AdminMiddleware → CheckScope | AgencyController.detail | admin JWT |
| GET | /admin/agency/getAgencies | AdminMiddleware → CheckScope | AgencyController.getAgencies | admin JWT |
| GET | /admin/agency/referrals | AdminMiddleware → CheckScope | AgencyController.referrals | admin JWT |
| POST | /admin/agency/store | AdminMiddleware → CheckScope | AgencyController.store | admin JWT |
| PATCH | /admin/agency/toggleStatus | AdminMiddleware → CheckScope | AgencyController.toggleStatus | admin JWT |
| PATCH | /admin/agency/update | AdminMiddleware → CheckScope | AgencyController.update | admin JWT |
| GET | /admin/agencyReport/getAgencyReport | AdminMiddleware → CheckScope | AgencyReportController.getAgencyReport | admin JWT |
| GET | /admin/agencyReport/getDigitalPartners | AdminMiddleware → CheckScope | AgencyReportController.getDigitalPartners | admin JWT |
| DELETE | /admin/coinplan/delete | AdminMiddleware → CheckScope → checkAccessWithSecretKey | coinplanController.delete | admin JWT |
| GET | /admin/coinplan/fetchCoinplan | AdminMiddleware → CheckScope → checkAccessWithSecretKey | coinplanController.fetchCoinplan | admin JWT |
| PATCH | /admin/coinplan/handleisActiveSwitch | AdminMiddleware → CheckScope → checkAccessWithSecretKey | coinplanController.handleisActiveSwitch | admin JWT |
| PATCH | /admin/coinplan/handleisPopularSwitch | AdminMiddleware → CheckScope → checkAccessWithSecretKey | coinplanController.handleisPopularSwitch | admin JWT |
| GET | /admin/coinplan/retrieveUserCoinplanRecords | AdminMiddleware → CheckScope → checkAccessWithSecretKey | coinplanController.retrieveUserCoinplanRecords | admin JWT |
| POST | /admin/coinplan/store | AdminMiddleware → CheckScope → checkAccessWithSecretKey | coinplanController.store | admin JWT |
| PATCH | /admin/coinplan/update | AdminMiddleware → CheckScope → checkAccessWithSecretKey | coinplanController.update | admin JWT |
| GET | /admin/commission/getCommissions | AdminMiddleware → CheckScope | CommissionController.getCommissions | admin JWT |
| POST | /admin/commission/updatePayoutStatus | AdminMiddleware → CheckScope | CommissionController.updatePayoutStatus | admin JWT |
| PATCH | /admin/commission/verify | AdminMiddleware → CheckScope | CommissionController.verify | admin JWT |
| GET | /admin/contact/ | AdminMiddleware → CheckScope → checkAccessWithSecretKey | contactController.get | admin JWT |
| POST | /admin/contact/create | AdminMiddleware → CheckScope → checkAccessWithSecretKey | contactController.store | admin JWT |
| DELETE | /admin/contact/delete | AdminMiddleware → CheckScope → checkAccessWithSecretKey | contactController.destroy | admin JWT |
| PATCH | /admin/contact/update | AdminMiddleware → CheckScope → checkAccessWithSecretKey | contactController.update | admin JWT |
| GET | /admin/contentModeration/keywords | AdminMiddleware → CheckScope → checkAccess | contentModerationController.getKeywords | admin JWT |
| POST | /admin/contentModeration/keywords/add | AdminMiddleware → CheckScope → checkAccess | contentModerationController.addKeyword | admin JWT |
| DELETE | /admin/contentModeration/keywords/delete | AdminMiddleware → CheckScope → checkAccess | contentModerationController.deleteKeyword | admin JWT |
| POST | /admin/contentModeration/moderate | AdminMiddleware → CheckScope → checkAccess | contentModerationController.moderateVideo | admin JWT |
| GET | /admin/contentModeration/queue | AdminMiddleware → CheckScope → checkAccess | contentModerationController.getModerationQueue | admin JWT |
| POST | /admin/contentModeration/rescreen | AdminMiddleware → CheckScope → checkAccess | contentModerationController.rescreenVideo | admin JWT |
| POST | /admin/copyrightModeration/action | AdminMiddleware → CheckScope → checkAccess | copyrightModerationController.actionOnFlaggedContent | admin JWT |
| GET | /admin/copyrightModeration/flagged | AdminMiddleware → CheckScope → checkAccess | copyrightModerationController.getFlaggedContent | admin JWT |
| POST | /admin/copyrightModeration/manualFlag | AdminMiddleware → CheckScope → checkAccess | copyrightModerationController.manualFlag | admin JWT |
| POST | /admin/creatorFunding/forceCancel | AdminMiddleware → CheckScope | creatorFunding.forceCancel | admin JWT |
| GET | /admin/creatorFunding/list | AdminMiddleware → CheckScope | creatorFunding.list | admin JWT |
| GET | /admin/currency/ | AdminMiddleware → CheckScope → checkAccessWithSecretKey | currencyController.get | admin JWT |
| POST | /admin/currency/create | AdminMiddleware → CheckScope → checkAccessWithSecretKey | currencyController.store | admin JWT |
| PATCH | /admin/currency/default | AdminMiddleware → CheckScope → checkAccessWithSecretKey | currencyController.defaultCurrency | admin JWT |
| DELETE | /admin/currency/delete | AdminMiddleware → CheckScope → checkAccessWithSecretKey | currencyController.destroy | admin JWT |
| GET | /admin/currency/getDefault | AdminMiddleware → CheckScope → checkAccessWithSecretKey | currencyController.getDefault | admin JWT |
| PATCH | /admin/currency/update | AdminMiddleware → CheckScope → checkAccessWithSecretKey | currencyController.update | admin JWT |
| DELETE | /admin/dailyRewardCoin/deleteDailyReward | AdminMiddleware → CheckScope → checkAccessWithSecretKey | dailyRewardCoinController.deleteDailyReward | admin JWT |
| GET | /admin/dailyRewardCoin/getDailyReward | AdminMiddleware → CheckScope → checkAccessWithSecretKey | dailyRewardCoinController.getDailyReward | admin JWT |
| POST | /admin/dailyRewardCoin/storeDailyReward | AdminMiddleware → CheckScope → checkAccessWithSecretKey | dailyRewardCoinController.storeDailyReward | admin JWT |
| PATCH | /admin/dailyRewardCoin/updateDailyReward | AdminMiddleware → CheckScope → checkAccessWithSecretKey | dailyRewardCoinController.updateDailyReward | admin JWT |
| GET | /admin/dashboard/chartAnalytic | AdminMiddleware → CheckScope → checkAccessWithSecretKey | dashboardController.chartAnalytic | admin JWT |
| GET | /admin/dashboard/chartAnalyticOfactiveInactiveUser | AdminMiddleware → CheckScope → checkAccessWithSecretKey | dashboardController.chartAnalyticOfactiveInactiveUser | admin JWT |
| GET | /admin/dashboard/dashboardCount | AdminMiddleware → CheckScope → checkAccessWithSecretKey | dashboardController.dashboardCount | admin JWT |
| PATCH | /admin/digitalPartner/assignAgency | AdminMiddleware → CheckScope | digitalPartner.assignAgency | admin JWT |
| GET | /admin/digitalPartner/detail | AdminMiddleware → CheckScope | digitalPartner.detail | admin JWT |
| GET | /admin/digitalPartner/list | AdminMiddleware → CheckScope | digitalPartner.list | admin JWT |
| POST | /admin/digitalPartner/regeneratePassword | AdminMiddleware → CheckScope | digitalPartner.regeneratePassword | admin JWT |
| GET | /admin/digitalPartner/report | AdminMiddleware → CheckScope | digitalPartner.report | admin JWT |
| PATCH | /admin/digitalPartner/status | AdminMiddleware → CheckScope | digitalPartner.setStatus | admin JWT |
| GET | /admin/FAQ/ | AdminMiddleware → CheckScope → checkAccessWithSecretKey | FAQController.get | admin JWT |
| POST | /admin/FAQ/create | AdminMiddleware → CheckScope → checkAccessWithSecretKey | FAQController.store | admin JWT |
| DELETE | /admin/FAQ/delete | AdminMiddleware → CheckScope → checkAccessWithSecretKey | FAQController.destroy | admin JWT |
| PATCH | /admin/FAQ/update | AdminMiddleware → CheckScope → checkAccessWithSecretKey | FAQController.update | admin JWT |
| POST | /admin/file/cloudflare-stream-url | checkAccess → AdminMiddleware → CheckScope | files.getCloudflareStreamUploadUrl | admin JWT |
| POST | /admin/file/direct-upload-url | checkAccess → AdminMiddleware → CheckScope | files.getDirectUploadUrl | admin JWT |
| POST | /admin/file/upload-file | checkAccess → AdminMiddleware → CheckScope → upload | files.uploadContent | admin JWT |
| GET | /admin/franchisePortal/dashboard | AdminMiddleware → CheckScope | franchisePortal.dashboard | admin JWT |
| GET | /admin/franchisePortal/partners | AdminMiddleware → CheckScope | franchisePortal.listPartners | admin JWT |
| POST | /admin/franchisePortal/partners/create | AdminMiddleware → CheckScope | franchisePortal.createPartner | admin JWT |
| GET | /admin/franchisePortal/partners/detail | AdminMiddleware → CheckScope | franchisePortal.partnerDetail | admin JWT |
| DELETE | /admin/franchisePortal/partners/remove | AdminMiddleware → CheckScope | franchisePortal.removePartner | admin JWT |
| PATCH | /admin/franchisePortal/partners/status | AdminMiddleware → CheckScope | franchisePortal.setPartnerStatus | admin JWT |
| PATCH | /admin/franchisePortal/partners/update | AdminMiddleware → CheckScope | franchisePortal.updatePartner | admin JWT |
| GET | /admin/franchisePortal/referrals | AdminMiddleware → CheckScope | franchisePortal.referrals | admin JWT |
| GET | /admin/fraud/getAlerts | AdminMiddleware → CheckScope | FraudController.getAlerts | admin JWT |
| POST | /admin/fraud/toggleUserRestriction | AdminMiddleware → CheckScope | FraudController.toggleUserRestriction | admin JWT |
| GET | /admin/grievance/list | AdminMiddleware → CheckScope | grievance.adminList | admin JWT |
| POST | /admin/grievance/resolve | AdminMiddleware → CheckScope | grievance.adminResolve | admin JWT |
| GET | /admin/language/ | checkAccessWithSecretKey → AdminMiddleware → CheckScope | languageController.harvestLanguages | admin JWT |
| POST | /admin/language/create | checkAccessWithSecretKey → AdminMiddleware → CheckScope | languageController.forgeLanguage | admin JWT |
| DELETE | /admin/language/delete | checkAccessWithSecretKey → AdminMiddleware → CheckScope | languageController.obliterateLanguage | admin JWT |
| POST | /admin/language/forgeLanguage | checkAccessWithSecretKey → AdminMiddleware → CheckScope | languageController.forgeLanguage | admin JWT |
| GET | /admin/language/get | checkAccessWithSecretKey → AdminMiddleware → CheckScope | languageController.harvestLanguages | admin JWT |
| GET | /admin/language/harvestLanguage | checkAccessWithSecretKey → AdminMiddleware → CheckScope | languageController.harvestLanguage | admin JWT |
| GET | /admin/language/harvestLanguages | checkAccessWithSecretKey → AdminMiddleware → CheckScope | languageController.harvestLanguages | admin JWT |
| DELETE | /admin/language/obliterateLanguage | checkAccessWithSecretKey → AdminMiddleware → CheckScope | languageController.obliterateLanguage | admin JWT |
| PATCH | /admin/language/refineLanguage | checkAccessWithSecretKey → AdminMiddleware → CheckScope | languageController.refineLanguage | admin JWT |
| PATCH | /admin/language/shiftLanguageState | checkAccessWithSecretKey → AdminMiddleware → CheckScope | languageController.shiftLanguageState | admin JWT |
| PATCH | /admin/language/update | checkAccessWithSecretKey → AdminMiddleware → CheckScope | languageController.refineLanguage | admin JWT |
| POST | /admin/localBusinessAd/approve | AdminMiddleware → CheckScope | localBusinessAd.approve | admin JWT |
| GET | /admin/localBusinessAd/list | AdminMiddleware → CheckScope | localBusinessAd.list | admin JWT |
| POST | /admin/localBusinessAd/reject | AdminMiddleware → CheckScope | localBusinessAd.reject | admin JWT |
| GET | /admin/login/ | — | LoginController.get | NONE (route-level) |
| GET | /admin/mediaAudit/report | AdminMiddleware → CheckScope | mediaAudit.report | admin JWT |
| GET | /admin/membershipTier/defaults | AdminMiddleware → CheckScope | MembershipTierController.defaults | admin JWT |
| DELETE | /admin/membershipTier/destroy | AdminMiddleware → CheckScope | MembershipTierController.destroy | admin JWT |
| GET | /admin/membershipTier/getTiers | AdminMiddleware → CheckScope | MembershipTierController.getTiers | admin JWT |
| POST | /admin/membershipTier/seedDefaults | AdminMiddleware → CheckScope | MembershipTierController.seedDefaults | admin JWT |
| POST | /admin/membershipTier/store | AdminMiddleware → CheckScope | MembershipTierController.store | admin JWT |
| GET | /admin/monetizationRequest/getAllMonetizationRequests | AdminMiddleware → CheckScope → checkAccessWithSecretKey | MonetizationRequestController.getAllMonetizationRequests | admin JWT |
| PATCH | /admin/monetizationRequest/handleMonetizationRequest | AdminMiddleware → CheckScope → checkAccessWithSecretKey | MonetizationRequestController.handleMonetizationRequest | admin JWT |
| GET | /admin/partnerPortal/dashboard | AdminMiddleware → CheckScope | partnerPortal.getDashboard | admin JWT |
| GET | /admin/partnerPortal/localBusinessAd/myAds | AdminMiddleware → CheckScope | partnerPortal.getMyLocalBusinessAds | admin JWT |
| POST | /admin/partnerPortal/localBusinessAd/submit | AdminMiddleware → CheckScope | partnerPortal.submitLocalBusinessAd | admin JWT |
| GET | /admin/partnerPortal/wallet | AdminMiddleware → CheckScope | partnerPortal.getWallet | admin JWT |
| POST | /admin/partnerPortal/wallet/convert | AdminMiddleware → CheckScope | partnerPortal.convertCoins | admin JWT |
| POST | /admin/partnerPortal/wallet/withdraw | AdminMiddleware → CheckScope | partnerPortal.requestWithdrawal | admin JWT |
| GET | /admin/payment/list | AdminMiddleware → CheckScope | paymentController.adminList | admin JWT |
| POST | /admin/payment/markPaid | AdminMiddleware → CheckScope | paymentController.adminMarkPaid | admin JWT |
| GET | /admin/payment/reconcile | AdminMiddleware → CheckScope | paymentController.adminReconcile | admin JWT |
| POST | /admin/payment/reconcile | AdminMiddleware → CheckScope | paymentController.adminReconcile | admin JWT |
| GET | /admin/platformConfig/ | AdminMiddleware → CheckScope → checkAccess | platformConfigController.getAll | admin JWT |
| PATCH | /admin/platformConfig/:section | AdminMiddleware → CheckScope → checkAccess | platformConfigController.save | admin JWT |
| GET | /admin/platformConfig/history | AdminMiddleware → CheckScope → checkAccess | platformConfigController.history | admin JWT |
| GET | /admin/premiumPlan/ | AdminMiddleware → CheckScope → checkAccessWithSecretKey | premiumPlanController.index | admin JWT |
| POST | /admin/premiumPlan/create | AdminMiddleware → CheckScope → checkAccessWithSecretKey | premiumPlanController.store | admin JWT |
| DELETE | /admin/premiumPlan/delete | AdminMiddleware → CheckScope → checkAccessWithSecretKey | premiumPlanController.destroy | admin JWT |
| GET | /admin/premiumPlan/fetchPremiumPlanRecords | AdminMiddleware → CheckScope → checkAccessWithSecretKey | premiumPlanController.fetchPremiumPlanRecords | admin JWT |
| GET | /admin/premiumPlan/getpremiumPlanHistory | AdminMiddleware → CheckScope → checkAccessWithSecretKey | premiumPlanController.getpremiumPlanHistory | admin JWT |
| PATCH | /admin/premiumPlan/handleisActive | AdminMiddleware → CheckScope → checkAccessWithSecretKey | premiumPlanController.handleisActive | admin JWT |
| PATCH | /admin/premiumPlan/update | AdminMiddleware → CheckScope → checkAccessWithSecretKey | premiumPlanController.update | admin JWT |
| GET | /admin/referral/getLeaderboard | AdminMiddleware → CheckScope | ReferralController.getLeaderboard | admin JWT |
| GET | /admin/referral/getReferralLogs | AdminMiddleware → CheckScope | ReferralController.getReferralLogs | admin JWT |
| DELETE | /admin/report/deleteVideoReport | AdminMiddleware → CheckScope → checkAccessWithSecretKey | ReportController.deleteVideoReport | admin JWT |
| GET | /admin/report/getReports | AdminMiddleware → CheckScope → checkAccessWithSecretKey | ReportController.getReports | admin JWT |
| GET | /admin/setting/ | AdminMiddleware → CheckScope → checkAccessWithSecretKey | settingController.index | admin JWT |
| POST | /admin/setting/applyEconomyDefaults | AdminMiddleware → CheckScope → AdminMiddleware → checkAccessWithSecretKey | settingController.applyEconomyDefaults | admin JWT |
| PATCH | /admin/setting/handleSwitch | AdminMiddleware → CheckScope → AdminMiddleware → checkAccessWithSecretKey | settingController.handleSwitch | admin JWT |
| POST | /admin/setting/publishSystemConfigs | AdminMiddleware → CheckScope → AdminMiddleware → checkAccessWithSecretKey | settingController.publishSystemConfigs | admin JWT |
| GET | /admin/setting/retrieveLinks | AdminMiddleware → CheckScope | settingController.retrieveLinks | admin JWT |
| PATCH | /admin/setting/switchStorageOption | AdminMiddleware → CheckScope → AdminMiddleware → checkAccessWithSecretKey | settingController.switchStorageOption | admin JWT |
| PATCH | /admin/setting/update | AdminMiddleware → CheckScope → AdminMiddleware → checkAccessWithSecretKey | settingController.update | admin JWT |
| PATCH | /admin/setting/updateWatermarkSetting | AdminMiddleware → CheckScope → AdminMiddleware → checkAccessWithSecretKey | settingController.updateWatermarkSetting | admin JWT |
| GET | /admin/soundCategory/ | AdminMiddleware → CheckScope → checkAccessWithSecretKey | soundCategoryController.get | admin JWT |
| POST | /admin/soundCategory/create | AdminMiddleware → CheckScope → checkAccessWithSecretKey | soundCategoryController.create | admin JWT |
| DELETE | /admin/soundCategory/delete | AdminMiddleware → CheckScope → checkAccessWithSecretKey | soundCategoryController.destroy | admin JWT |
| PATCH | /admin/soundCategory/update | AdminMiddleware → CheckScope → checkAccessWithSecretKey | soundCategoryController.update | admin JWT |
| POST | /admin/soundList/createSoundList | AdminMiddleware → CheckScope → checkAccessWithSecretKey | soundListController.createSoundList | admin JWT |
| DELETE | /admin/soundList/deleteSoundList | AdminMiddleware → CheckScope → checkAccessWithSecretKey | soundListController.deleteSoundList | admin JWT |
| GET | /admin/soundList/getSoundList | AdminMiddleware → CheckScope → checkAccessWithSecretKey | soundListController.getSoundList | admin JWT |
| PATCH | /admin/soundList/updateSoundList | AdminMiddleware → CheckScope → checkAccessWithSecretKey | soundListController.updateSoundList | admin JWT |
| GET | /admin/translation/extractTranslationsCSV | checkAccessWithSecretKey → AdminMiddleware → CheckScope | localizationController.extractTranslationsCSV | admin JWT |
| GET | /admin/translation/harvestTranslations | checkAccessWithSecretKey → AdminMiddleware → CheckScope | localizationController.harvestTranslations | admin JWT |
| POST | /admin/translation/infuseTranslations | checkAccessWithSecretKey → AdminMiddleware → CheckScope → upload.single("file") | localizationController.infuseTranslations | admin JWT |
| PATCH | /admin/translation/refineTranslations | checkAccessWithSecretKey → AdminMiddleware → CheckScope | localizationController.refineTranslations | admin JWT |
| GET | /admin/user/channelsOfUser | AdminMiddleware → CheckScope → checkAccessWithSecretKey | UserController.channelsOfUser | admin JWT |
| PATCH | /admin/user/deleteChannelByAdmin | AdminMiddleware → CheckScope → checkAccessWithSecretKey | UserController.deleteChannelByAdmin | admin JWT |
| DELETE | /admin/user/deleteUsers | AdminMiddleware → CheckScope → checkAccessWithSecretKey | UserController.deleteUsers | admin JWT |
| POST | /admin/user/fakeUser | AdminMiddleware → CheckScope → checkAccessWithSecretKey | UserController.fakeUser | admin JWT |
| GET | /admin/user/fetchUserCoinVipHistory | AdminMiddleware → CheckScope → checkAccessWithSecretKey | UserController.fetchUserCoinVipHistory | admin JWT |
| GET | /admin/user/getProfile | AdminMiddleware → CheckScope → checkAccessWithSecretKey | UserController.getProfile | admin JWT |
| GET | /admin/user/getUsers | AdminMiddleware → CheckScope → checkAccessWithSecretKey | UserController.getUsers | admin JWT |
| GET | /admin/user/getUsersAddByAdminForChannel | AdminMiddleware → CheckScope → checkAccessWithSecretKey | UserController.getUsersAddByAdminForChannel | admin JWT |
| PATCH | /admin/user/isActive | AdminMiddleware → CheckScope → checkAccessWithSecretKey | UserController.isActive | admin JWT |
| PATCH | /admin/user/isBlock | AdminMiddleware → CheckScope → checkAccessWithSecretKey | UserController.isBlock | admin JWT |
| POST | /admin/user/paymentWebhook | AdminMiddleware → CheckScope | UserController.paymentWebhook | admin JWT |
| PATCH | /admin/user/togglePaymentStatus | AdminMiddleware → CheckScope → checkAccessWithSecretKey | UserController.togglePaymentStatus | admin JWT |
| PATCH | /admin/user/updatePassword | AdminMiddleware → CheckScope → checkAccessWithSecretKey | UserController.updatePassword | admin JWT |
| PATCH | /admin/user/updateUser | AdminMiddleware → CheckScope → checkAccessWithSecretKey | UserController.updateUser | admin JWT |
| DELETE | /admin/video/deleteVideo | AdminMiddleware → CheckScope → checkAccessWithSecretKey | videoController.deleteVideo | admin JWT |
| PATCH | /admin/video/updateVideo | AdminMiddleware → CheckScope → checkAccessWithSecretKey | videoController.updateVideo | admin JWT |
| POST | /admin/video/uploadVideo | AdminMiddleware → CheckScope → checkAccessWithSecretKey | videoController.uploadVideo | admin JWT |
| GET | /admin/video/videosOrShorts | AdminMiddleware → CheckScope → checkAccessWithSecretKey | videoController.videosOrShorts | admin JWT |
| GET | /admin/videoComment/commentsOfVideos | AdminMiddleware → CheckScope → checkAccessWithSecretKey | VideoCommentController.commentsOfVideos | admin JWT |
| DELETE | /admin/videoComment/deleteVideoComment | AdminMiddleware → CheckScope → checkAccessWithSecretKey | VideoCommentController.deleteVideoComment | admin JWT |
| GET | /admin/videoComment/getComment | AdminMiddleware → CheckScope → checkAccessWithSecretKey | VideoCommentController.getComment | admin JWT |
| GET | /admin/videoPromotion/index | AdminMiddleware → CheckScope → checkAccess | videoPromotionController.index | admin JWT |
| POST | /admin/videoPromotion/updateStatus | AdminMiddleware → CheckScope → checkAccess | videoPromotionController.updateCampaignStatus | admin JWT |
| GET | /admin/withdraw/ | AdminMiddleware → CheckScope → checkAccessWithSecretKey | WithdrawController.get | admin JWT |
| POST | /admin/withdraw/create | AdminMiddleware → CheckScope → checkAccessWithSecretKey | WithdrawController.store | admin JWT |
| DELETE | /admin/withdraw/delete | AdminMiddleware → CheckScope → checkAccessWithSecretKey | WithdrawController.delete | admin JWT |
| PATCH | /admin/withdraw/handleSwitch | AdminMiddleware → CheckScope → checkAccessWithSecretKey | WithdrawController.handleSwitch | admin JWT |
| PATCH | /admin/withdraw/update | AdminMiddleware → CheckScope → checkAccessWithSecretKey | WithdrawController.update | admin JWT |
| GET | /admin/withDrawalRequest/ | AdminMiddleware → CheckScope → checkAccessWithSecretKey | WithdrawalRequestController.index | admin JWT |
| PATCH | /admin/withDrawalRequest/accept | AdminMiddleware → CheckScope → checkAccessWithSecretKey | WithdrawalRequestController.acceptWithdrawalRequest | admin JWT |
| PATCH | /admin/withDrawalRequest/decline | AdminMiddleware → CheckScope → checkAccessWithSecretKey | WithdrawalRequestController.declineWithdrawalRequest | admin JWT |
| GET | /client/adRewardCoin/getAdRewardByUser | withholdLockedPlayback(response wrapper) → bindAppUser | adRewardCoinController.getAdRewardByUser | user token |
| POST | /client/coinplan/createCoinPlanHistory | withholdLockedPlayback(response wrapper) → bindAppUser | coinplanController.createCoinPlanHistory | user token |
| POST | /client/coinplan/handleStripePayment | withholdLockedPlayback(response wrapper) → bindAppUser | coinplanController.handleStripePayment | user token |
| POST | /client/coinplan/processRazorpayPayment | withholdLockedPlayback(response wrapper) → bindAppUser | coinplanController.processRazorpayPayment | user token |
| GET | /client/coinplan/retriveCoinplanByUser | withholdLockedPlayback(response wrapper) → optionalAppUser | coinplanController.retriveCoinplanByUser | key + optional token |
| GET | /client/contact/ | withholdLockedPlayback(response wrapper) → checkAccessWithSecretKey | contactController.get | shared key only |
| POST | /client/creatorFunding/cancelCampaign | withholdLockedPlayback(response wrapper) → bindAppUser | creatorFunding.cancelCampaign | user token |
| POST | /client/creatorFunding/createCampaign | withholdLockedPlayback(response wrapper) → bindAppUser | creatorFunding.createCampaign | user token |
| GET | /client/creatorFunding/eligibility | withholdLockedPlayback(response wrapper) → bindAppUser | creatorFunding.getEligibility | user token |
| GET | /client/creatorFunding/getActiveCampaigns | withholdLockedPlayback(response wrapper) → optionalAppUser | creatorFunding.getActiveCampaigns | key + optional token |
| GET | /client/creatorFunding/getCampaignDetails | withholdLockedPlayback(response wrapper) → optionalAppUser | creatorFunding.getCampaignDetails | key + optional token |
| GET | /client/creatorFunding/getMyBackings | withholdLockedPlayback(response wrapper) → bindAppUser | creatorFunding.getMyBackings | user token |
| GET | /client/creatorFunding/getMyCampaigns | withholdLockedPlayback(response wrapper) → bindAppUser | creatorFunding.getMyCampaigns | user token |
| GET | /client/creatorTier/getAvailableTiers | withholdLockedPlayback(response wrapper) → optionalAppUser | creatorTierController.getAvailableCreatorTiers | key + optional token |
| POST | /client/creatorTier/upgradeTier | withholdLockedPlayback(response wrapper) → bindAppUser | creatorTierController.upgradeCreatorTier | user token |
| GET | /client/dailyCoinReward/getDailyRewardCoinByUser | withholdLockedPlayback(response wrapper) → bindAppUser | dailyRewardCoinController.getDailyRewardCoinByUser | user token |
| PATCH | /client/dailyCoinReward/handleDailyCheckInReward | withholdLockedPlayback(response wrapper) → bindAppUser | dailyRewardCoinController.handleDailyCheckInReward | user token |
| GET | /client/FAQ/ | withholdLockedPlayback(response wrapper) → checkAccessWithSecretKey | FAQController.get | shared key only |
| POST | /client/file/direct-upload-url | requireAppUser → withholdLockedPlayback(response wrapper) | files.getDirectUploadUrl | user token |
| GET | /client/file/stream-upload-url | requireAppUser → withholdLockedPlayback(response wrapper) | files.getStreamUploadUrl | user token |
| POST | /client/file/stream-upload-url | requireAppUser → withholdLockedPlayback(response wrapper) | files.getStreamUploadUrl | user token |
| PUT | /client/file/upload-file | requireAppUser → withholdLockedPlayback(response wrapper) → upload | files.uploadContent | user token |
| GET | /client/grievance/ | withholdLockedPlayback(response wrapper) | grievance.getOfficer | NONE (route-level) |
| POST | /client/grievance/file | withholdLockedPlayback(response wrapper) → optionalAppUser | grievance.fileGrievance | key + optional token |
| GET | /client/grievance/track | withholdLockedPlayback(response wrapper) → optionalAppUser | grievance.trackGrievance | key + optional token |
| POST | /client/liveUser/generateZegoAuthToken | withholdLockedPlayback(response wrapper) → bindAppUser | liveUserController.generateZegoAuthToken | user token |
| GET | /client/liveUser/getliveUserList | withholdLockedPlayback(response wrapper) → optionalAppUser | liveUserController.getliveUserList | key + optional token |
| POST | /client/liveUser/live | withholdLockedPlayback(response wrapper) → bindAppUser | liveUserController.liveUser | user token |
| GET | /client/localBusinessAd/getActiveAdsForRegion | withholdLockedPlayback(response wrapper) → optionalAppUser | localBusinessAd.getActiveAdsForRegion | key + optional token |
| GET | /client/localBusinessAd/getMyAds | withholdLockedPlayback(response wrapper) → bindAppUser | localBusinessAd.getMyAds | user token |
| POST | /client/localBusinessAd/recordClick | withholdLockedPlayback(response wrapper) → optionalAppUser | localBusinessAd.recordClick | key + optional token |
| POST | /client/localBusinessAd/recordImpression | withholdLockedPlayback(response wrapper) → optionalAppUser | localBusinessAd.recordImpression | key + optional token |
| POST | /client/localBusinessAd/submit | withholdLockedPlayback(response wrapper) → bindAppUser | localBusinessAd.submit | user token |
| POST | /client/monetizationRequest/createMonetizationRequest | withholdLockedPlayback(response wrapper) → bindAppUser | MonetizationRequestController.createMonetizationRequest | user token |
| GET | /client/monetizationRequest/getMonetization | withholdLockedPlayback(response wrapper) → bindAppUser | MonetizationRequestController.getMonetization | user token |
| GET | /client/monetizationRequest/getMonetizationForUser | withholdLockedPlayback(response wrapper) → bindAppUser | MonetizationRequestController.getMonetizationForUser | user token |
| DELETE | /client/notification/clearNotificationHistory | withholdLockedPlayback(response wrapper) → bindAppUser | NotificationController.clearNotificationHistory | user token |
| GET | /client/notification/getNotificationList | withholdLockedPlayback(response wrapper) → bindAppUser | NotificationController.getNotificationList | user token |
| POST | /client/otp/create | withholdLockedPlayback(response wrapper) → checkAccessWithSecretKey | OTPController.store | shared key only |
| POST | /client/otp/otplogin | withholdLockedPlayback(response wrapper) → checkAccessWithSecretKey | OTPController.otplogin | shared key only |
| POST | /client/otp/verify | withholdLockedPlayback(response wrapper) → checkAccessWithSecretKey | OTPController.verify | shared key only |
| GET | /client/partner/dashboard | withholdLockedPlayback(response wrapper) → bindAppUser | partnerController.getDashboard | user token |
| POST | /client/partner/upgrade | withholdLockedPlayback(response wrapper) → bindAppUser | partnerController.upgrade | user token |
| POST | /client/payment/createOrder | withholdLockedPlayback(response wrapper) → bindAppUser | paymentController.createOrder | user token |
| GET | /client/payment/status | withholdLockedPlayback(response wrapper) → checkAccess | paymentController.status | shared key only |
| POST | /client/payment/verify | withholdLockedPlayback(response wrapper) → checkAccess | paymentController.verify | shared key only |
| POST | /client/payout/request | withholdLockedPlayback(response wrapper) → requireAppUser | payoutController.requestPayout | user token |
| POST | /client/peakBoost/ | withholdLockedPlayback(response wrapper) → requireAppUser | peakBoostController.boost | user token |
| DELETE | /client/playbackSession/clearAllWatchHistory | withholdLockedPlayback(response wrapper) → bindAppUser | playbackSessionController.clearAllWatchHistory | user token |
| GET | /client/playbackSession/getMyWatchHistory | withholdLockedPlayback(response wrapper) → bindAppUser | playbackSessionController.getMyWatchHistory | user token |
| POST | /client/playbackSession/syncPlayback | withholdLockedPlayback(response wrapper) → bindAppUser | playbackSessionController.syncPlayback | user token |
| DELETE | /client/playlist/deletePlayList | withholdLockedPlayback(response wrapper) → bindAppUser | PlayListController.deletePlayList | user token |
| POST | /client/playlist/newPlayList | withholdLockedPlayback(response wrapper) → bindAppUser | PlayListController.newPlayList | user token |
| PATCH | /client/playlist/updatePlayList | withholdLockedPlayback(response wrapper) → bindAppUser | PlayListController.updatePlayList | user token |
| GET | /client/premiumPlan/ | withholdLockedPlayback(response wrapper) → optionalAppUser | premiumPlanController.index | key + optional token |
| POST | /client/premiumPlan/createHistory | withholdLockedPlayback(response wrapper) → bindAppUser | premiumPlanController.createHistory | user token |
| GET | /client/premiumPlan/fetchCoinplanHistoryOfUser | withholdLockedPlayback(response wrapper) → bindAppUser | premiumPlanController.fetchCoinplanHistoryOfUser | user token |
| POST | /client/premiumPlan/handleStripePaymentForPremiumPlan | withholdLockedPlayback(response wrapper) → bindAppUser | premiumPlanController.handleStripePaymentForPremiumPlan | user token |
| GET | /client/premiumPlan/planHistoryOfUser | withholdLockedPlayback(response wrapper) → bindAppUser | premiumPlanController.planHistoryOfUser | user token |
| POST | /client/report/reportToVideo | withholdLockedPlayback(response wrapper) → bindAppUser | ReportController.reportToVideo | user token |
| POST | /client/saveToWatchLater/addVideoToWatchLater | withholdLockedPlayback(response wrapper) → bindAppUser | SaveToWatchController.addVideoToWatchLater | user token |
| GET | /client/saveToWatchLater/getSaveToWatchLater | withholdLockedPlayback(response wrapper) → bindAppUser | SaveToWatchController.getSaveToWatchLater | user token |
| POST | /client/security/attest | withholdLockedPlayback(response wrapper) → requireAppUser | securityController.attest | user token |
| GET | /client/setting/ | withholdLockedPlayback(response wrapper) → checkAccessWithSecretKey | settingController.get | shared key only |
| GET | /client/soundList/getSoundList | withholdLockedPlayback(response wrapper) → checkAccessWithSecretKey | soundListController.getSoundList | shared key only |
| GET | /client/tasker/dashboard | withholdLockedPlayback(response wrapper) → requireAppUser | taskerController.dashboard | user token |
| GET | /client/taskerTier/getAvailableTiers | withholdLockedPlayback(response wrapper) → optionalAppUser | taskerTierController.getAvailableTaskerTiers | key + optional token |
| GET | /client/translation/harvestActiveLanguages | checkAccessWithSecretKey → withholdLockedPlayback(response wrapper) | translationController.harvestActiveLanguages | shared key only |
| GET | /client/translation/harvestAllTranslations | checkAccessWithSecretKey → withholdLockedPlayback(response wrapper) | translationController.harvestAllTranslations | shared key only |
| GET | /client/translation/harvestTranslation | checkAccessWithSecretKey → withholdLockedPlayback(response wrapper) | translationController.harvestTranslation | shared key only |
| GET | /client/translation/revealLatestVersion | checkAccessWithSecretKey → withholdLockedPlayback(response wrapper) | translationController.revealLatestVersion | shared key only |
| GET | /client/user/aboutOfChannel | withholdLockedPlayback(response wrapper) → optionalAppUser | UserController.aboutOfChannel | key + optional token |
| POST | /client/user/checkUser | withholdLockedPlayback(response wrapper) → checkAccessWithSecretKey | FirestoreUserCtrl.checkUser | shared key only |
| DELETE | /client/user/deleteUserAccount | withholdLockedPlayback(response wrapper) → bindAppUser | UserController.deleteUserAccount | user token |
| GET | /client/user/detailsOfChannel | withholdLockedPlayback(response wrapper) → optionalAppUser | UserController.detailsOfChannel | key + optional token |
| GET | /client/user/fetchWalletHistoryByUser | withholdLockedPlayback(response wrapper) → bindAppUser | UserController.fetchWalletHistoryByUser | user token |
| GET | /client/user/getPlayListVideos | withholdLockedPlayback(response wrapper) → optionalAppUser | UserController.getPlayListVideos | key + optional token |
| PATCH | /client/user/handleAdWatchReward | withholdLockedPlayback(response wrapper) → bindAppUser | UserController.handleAdWatchReward | user token |
| PATCH | /client/user/handleEngagementVideoWatchReward | withholdLockedPlayback(response wrapper) → bindAppUser | UserController.handleEngagementVideoWatchReward | user token |
| GET | /client/user/loadReferralHistoryByUser | withholdLockedPlayback(response wrapper) → bindAppUser | UserController.loadReferralHistoryByUser | user token |
| POST | /client/user/login | withholdLockedPlayback(response wrapper) → checkAccessWithSecretKey | FirestoreUserCtrl.store | shared key only |
| GET | /client/user/playListsOfChannel | withholdLockedPlayback(response wrapper) → optionalAppUser | UserController.playListsOfChannel | key + optional token |
| GET | /client/user/profile | withholdLockedPlayback(response wrapper) → bindAppUser | FirestoreUserCtrl.getProfile | user token |
| GET | /client/user/retriveCoinHistoryByUser | withholdLockedPlayback(response wrapper) → bindAppUser | UserController.retriveCoinHistoryByUser | user token |
| POST | /client/user/searchChannel | withholdLockedPlayback(response wrapper) → optionalAppUser | UserController.searchChannel | key + optional token |
| POST | /client/user/setPassword | withholdLockedPlayback(response wrapper) → checkAccessWithSecretKey | UserController.setPassword | shared key only |
| PATCH | /client/user/update | withholdLockedPlayback(response wrapper) → bindAppUser | UserController.update | user token |
| PATCH | /client/user/updatePassword | withholdLockedPlayback(response wrapper) → bindAppUser | UserController.updatePassword | user token |
| PATCH | /client/user/updateProfile | withholdLockedPlayback(response wrapper) → bindAppUser | FirestoreUserCtrl.updateProfile | user token |
| PATCH | /client/user/validateAndApplyReferralCode | withholdLockedPlayback(response wrapper) → bindAppUser | UserController.validateAndApplyReferralCode | user token |
| GET | /client/user/videosOfChannel | withholdLockedPlayback(response wrapper) → optionalAppUser | UserController.videosOfChannel | key + optional token |
| POST | /client/userTaskReward/adWatch | withholdLockedPlayback(response wrapper) → bindAppUser | userTaskRewardController.rewardAdWatch | user token |
| POST | /client/userTaskReward/comment | withholdLockedPlayback(response wrapper) → bindAppUser | userTaskRewardController.rewardVideoComment | user token |
| POST | /client/userTaskReward/like | withholdLockedPlayback(response wrapper) → bindAppUser | userTaskRewardController.rewardVideoLike | user token |
| GET | /client/userTaskReward/status | withholdLockedPlayback(response wrapper) → bindAppUser | userTaskRewardController.getDailyEarningStatus | user token |
| POST | /client/userTaskReward/watchTimeMilestone | withholdLockedPlayback(response wrapper) → bindAppUser | userTaskRewardController.checkWatchTimeMilestone | user token |
| POST | /client/userWiseDownload/downloadVideoHistory | withholdLockedPlayback(response wrapper) → bindAppUser | UserWiseDownloadController.downloadVideoHistory | user token |
| GET | /client/userWiseDownload/getdownloadVideoHistory | withholdLockedPlayback(response wrapper) → bindAppUser | UserWiseDownloadController.getdownloadVideoHistory | user token |
| GET | /client/userWiseSubscription/getSubscribedChannel | withholdLockedPlayback(response wrapper) → bindAppUser | userWiseSubscriptionController.getSubscribedChannel | user token |
| POST | /client/userWiseSubscription/subscribedUnSubscibed | withholdLockedPlayback(response wrapper) → bindAppUser | userWiseSubscriptionController.subscribedUnSubscibed | user token |
| GET | /client/userWiseSubscription/videoOfSubscribedChannel | withholdLockedPlayback(response wrapper) → bindAppUser | userWiseSubscriptionController.videoOfSubscribedChannel | user token |
| GET | /client/video/channeldetailsOfShorts | withholdLockedPlayback(response wrapper) → optionalAppUser | videoController.channeldetailsOfShorts | key + optional token |
| DELETE | /client/video/clearAllSearchHistory | withholdLockedPlayback(response wrapper) → bindAppUser | videoController.clearAllSearchHistory | user token |
| POST | /client/video/createVideo | withholdLockedPlayback(response wrapper) → requireAppUser → bindUser | videoController.createVideo | user token |
| DELETE | /client/video/deleteVideoRecord | withholdLockedPlayback(response wrapper) → requireAppUser → bindUser → requireOwner | videoController.deleteVideoRecord | user token |
| GET | /client/video/detailsOfVideo | withholdLockedPlayback(response wrapper) → optionalAppUser | videoController.detailsOfVideo | key + optional token |
| GET | /client/video/getAllLikeThis | withholdLockedPlayback(response wrapper) → optionalAppUser | videoController.getAllLikeThis | key + optional token |
| GET | /client/video/getShorts | withholdLockedPlayback(response wrapper) → optionalAppUser | videoController.getShorts | key + optional token |
| GET | /client/video/getTopViewedVideos | withholdLockedPlayback(response wrapper) → bindAppUser | videoController.getTopViewedVideos | user token |
| GET | /client/video/getUserVideos | withholdLockedPlayback(response wrapper) → bindAppUser | videoController.getUserVideos | user token |
| GET | /client/video/getVideoList | withholdLockedPlayback(response wrapper) → optionalAppUser | videoController.getVideoList | key + optional token |
| GET | /client/video/getVideos | withholdLockedPlayback(response wrapper) → optionalAppUser | videoController.getVideos | key + optional token |
| POST | /client/video/likeOrDislikeOfVideo | withholdLockedPlayback(response wrapper) → bindAppUser | videoController.likeOrDislikeOfVideo | user token |
| PATCH | /client/video/modifyVideo | withholdLockedPlayback(response wrapper) → requireAppUser → bindUser → requireOwner | videoController.modifyVideo | user token |
| POST | /client/video/search | withholdLockedPlayback(response wrapper) → optionalAppUser | videoController.search | key + optional token |
| POST | /client/video/searchChannelVideoShortsByUser | withholdLockedPlayback(response wrapper) → optionalAppUser | videoController.searchChannelVideoShortsByUser | key + optional token |
| GET | /client/video/searchData | withholdLockedPlayback(response wrapper) → bindAppUser | videoController.searchData | user token |
| POST | /client/video/searchShorts | withholdLockedPlayback(response wrapper) → optionalAppUser | videoController.searchShorts | key + optional token |
| POST | /client/video/shareCount | withholdLockedPlayback(response wrapper) → optionalAppUser | videoController.shareCount | key + optional token |
| GET | /client/video/shortsOfUser | withholdLockedPlayback(response wrapper) → optionalAppUser | videoController.shortsOfUser | key + optional token |
| GET | /client/video/streamStatus | withholdLockedPlayback(response wrapper) → checkAccessWithSecretKey | videoController.getStreamStatus | shared key only |
| POST | /client/video/unlockPrivateVideo | withholdLockedPlayback(response wrapper) → bindAppUser | videoController.unlockPrivateVideo | user token |
| GET | /client/video/verifyChannelname | withholdLockedPlayback(response wrapper) → checkAccessWithSecretKey | videoController.verifyChannelname | shared key only |
| GET | /client/video/videosOfHome | withholdLockedPlayback(response wrapper) → optionalAppUser | videoController.videosOfHome | key + optional token |
| POST | /client/videoComment/createComment | withholdLockedPlayback(response wrapper) → checkAccessWithSecretKey → bindAppUser | VideoCommentController.createComment | user token |
| POST | /client/videoComment/createCommentReply | withholdLockedPlayback(response wrapper) → checkAccessWithSecretKey → bindAppUser | VideoCommentController.createCommentReply | user token |
| GET | /client/videoComment/getComments | withholdLockedPlayback(response wrapper) → optionalAppUser | VideoCommentController.getComments | key + optional token |
| POST | /client/videoComment/likeOrDislike | withholdLockedPlayback(response wrapper) → checkAccessWithSecretKey → bindAppUser | VideoCommentController.likeOrDislike | user token |
| GET | /client/videoComment/repliesOfVideoComment | withholdLockedPlayback(response wrapper) → optionalAppUser | VideoCommentController.repliesOfVideoComment | key + optional token |
| GET | /client/videoPromotion/ | withholdLockedPlayback(response wrapper) → bindAppUser | videoPromotionController.getUserCampaigns | user token |
| GET | /client/videoPromotion/plans | withholdLockedPlayback(response wrapper) → checkAccess | videoPromotionController.getPlans | shared key only |
| POST | /client/watch/heartbeat | withholdLockedPlayback(response wrapper) → requireAppUser | watchSessionController.heartbeat | user token |
| POST | /client/watchHistory/createWatchHistory | withholdLockedPlayback(response wrapper) → bindAppUser | watchHistoryController.createWatchHistory | user token |
| GET | /client/watchHistory/getWatchHistory | withholdLockedPlayback(response wrapper) → bindAppUser | watchHistoryController.getWatchHistory | user token |
| GET | /client/watchHistory/weeklyViewsAnalytics | withholdLockedPlayback(response wrapper) → bindAppUser | watchHistoryController.weeklyViewsAnalytics | user token |
| GET | /client/withdraw/withdrawList | withholdLockedPlayback(response wrapper) → checkAccessWithSecretKey | WithdrawController.withdrawList | shared key only |
| GET | /client/withdrawalRequest/coinToAmountConverter | withholdLockedPlayback(response wrapper) → bindAppUser | WithdrawalRequestController.coinToAmountConverter | user token |
| POST | /client/withdrawalRequest/createWithdrawRequest | withholdLockedPlayback(response wrapper) → bindAppUser | WithdrawalRequestController.createWithdrawRequest | user token |
| GET | /client/withdrawalRequest/fetchSettingDetails | withholdLockedPlayback(response wrapper) → bindAppUser | WithdrawalRequestController.fetchSettingDetails | user token |
| GET | /client/withdrawalRequest/getWithdrawRequests | withholdLockedPlayback(response wrapper) → bindAppUser | WithdrawalRequestController.getWithdrawRequests | user token |
| GET | /cron/daily | — | cronController.daily | NONE (route-level) |
| POST | /cron/daily | — | cronController.daily | NONE (route-level) |
| POST | /internal/fingerprint/ingest | — | copyrightModeration.ingestFingerprint | NONE (route-level) |
| GET | /internal/fingerprint/queue | — | copyrightModeration.fingerprintQueue | NONE (route-level) |
| POST | /payment/webhook | — | paymentController.webhook | NONE (route-level) |
| POST | /payment/webhook/:gateway | — | paymentController.webhook | NONE (route-level) |
| POST | /stream/webhook | — | videoController.streamWebhook | NONE (route-level) |
## Admin API routes with no caller in the admin SPA (static string match, about 50 of 185; approximate — see AFE-17)
POST /admin/advertise/create · DELETE /admin/coinplan/delete · GET /admin/coinplan/retrieveUserCoinplanRecords · contact (GET /, POST create, DELETE delete, PATCH update) · POST /admin/contentModeration/rescreen · POST /admin/copyrightModeration/manualFlag · POST /admin/creatorFunding/forceCancel · GET /admin/creatorFunding/list · FAQ (GET /, create, delete, update) · POST /admin/file/cloudflare-stream-url · GET /admin/grievance/list · POST /admin/grievance/resolve · language (13 routes: list/create/delete/get/forge/harvest/harvests/obliterate/refine/shiftState/update) · localBusinessAd (list, approve, reject) · GET /admin/login/ · GET /admin/mediaAudit/report · POST /admin/membershipTier/seedDefaults · payment (list, markPaid, reconcile GET+POST) · GET /admin/premiumPlan/fetchPremiumPlanRecords · POST /admin/setting/applyEconomyDefaults · POST /admin/setting/publishSystemConfigs · translation (extractCSV, harvest, infuse, refine) · PATCH /admin/user/isActive · POST /admin/user/paymentWebhook · GET /admin/videoComment/commentsOfVideos · GET /admin/videoComment/getComment
