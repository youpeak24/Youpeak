# Coverage ledger (generated from ledger.json by gen-ledger-md.cjs)

Scope: git-visible, application-owned source and configuration (tracked + untracked, not ignored) — **1047 files, 177,861 lines**.
Statuses:
- **reviewed** — read in full (directly or through a condensed dump with imports/blank lines/log lines stripped) and assessed;
- **partial** — only the relevant sections were read (noted per file);
- **scan-only** — *not read line by line*: analyzed by the Dart analyzer / build / executed tests, by pattern scans (greps, metrics) and, for admin pages, rendered in the 184-view responsive sweep. These files are **unreviewed for logic defects** and are an explicit gap.

| Area | Files | Lines | reviewed (files / lines) | partial (files / lines) | scan-only (files / lines) | reviewed+partial share of lines |
|---|---|---|---|---|---|---|
| Admin SPA (React) | 207 | 44,663 | 15 / 1,657 | 12 / 9,500 | 180 / 33,506 | 25% |
| Backend API / worker (functions, api, worker) | 282 | 33,710 | 273 / 26,779 | 7 / 6,927 | 2 / 4 | 100% |
| Flutter app (consumer web + Android/iOS) | 505 | 93,025 | 149 / 14,078 | 5 / 1,539 | 351 / 77,408 | 16.8% |
| Repository tests | 19 | 1,860 | 0 / 0 | 17 / 1,849 | 2 / 11 | 99.4% |
| Root config, rules and docs | 17 | 2,752 | 16 / 2,404 | 1 / 348 | 0 / 0 | 100% |
| Scripts, seed data, local stack | 17 | 1,851 | 7 / 388 | 10 / 1,463 | 0 / 0 | 100% |
| **Total** | **1047** | **177,861** | **460 / 45,306** | **52 / 21,626** | **535 / 110,929** | **37.6%** |

Reviewed alone (excluding partial): 25.5% of lines. Backend "partial" is dominated by `client/video.controller.js` (~5,000 lines of near-duplicate feed pipelines that were skimmed, not read line by line).

## Exclusions (git-visible files not in the ledger): 3935

| Category | Files | Reason |
|---|---|---|
| reports/ (earlier reports and this audit's own output) | 3315 | generated, binary, vendored or not application source |
| binary assets (images, fonts, media) | 386 | generated, binary, vendored or not application source |
| Flutter native-platform runner/generated files (icons, gradle wrapper, xcode project, registrants) | 197 | generated, binary, vendored or not application source |
| JSON data/config (seed data, i18n JSON, manifests) | 31 | generated, binary, vendored or not application source |
| lockfiles | 6 | generated, binary, vendored or not application source |

Also never opened or listed: `node_modules/`, `admin/frontend/build/` (generated; rebuilt during the audit; git-ignored), `.dart_tool/`, emulator data, `functions/backend/serviceAccountKey.json`, `functions/backend/.env` and the root `serviceAccountKey.json` (ignored credential files — only equality of values with committed history was tested, nothing printed).

## Per-file ledger

| File | Lines | Status | Note |
|---|---|---|---|
| .env.example | 78 | reviewed | read in full; see findings-draft |
| .firebaserc | 0 | reviewed | read in full; see findings-draft |
| .gitignore | 49 | reviewed | read in full; see findings-draft |
| .vercelignore | 32 | reviewed | read in full |
| admin/frontend/.gitignore | 23 | scan-only | scan-only: pattern greps + rendered in the sweep; not read line by line |
| admin/frontend/documentation.txt | 160 | scan-only | scan-only: pattern greps + rendered in the sweep; not read line by line |
| admin/frontend/package.json | 105 | reviewed | read in full; see findings-draft-10 |
| admin/frontend/public/index.html | 60 | scan-only | scan-only: pattern greps + rendered in the sweep; not read line by line |
| admin/frontend/public/manifest.json | 26 | scan-only | scan-only: pattern greps + rendered in the sweep; not read line by line |
| admin/frontend/public/robots.txt | 4 | scan-only | scan-only: pattern greps + rendered in the sweep; not read line by line |
| admin/frontend/README.md | 86 | scan-only | scan-only: pattern greps + rendered in the sweep; not read line by line |
| admin/frontend/src/App.css | 22 | partial | styles exercised by the 184-view responsive sweep; CSS not read line by line |
| admin/frontend/src/App.js | 74 | reviewed | read in full; see findings-draft-10 |
| admin/frontend/src/assets/css/custom.css | 1883 | partial | styles exercised by the 184-view responsive sweep; CSS not read line by line |
| admin/frontend/src/assets/css/dateRange.css | 442 | partial | styles exercised by the 184-view responsive sweep; CSS not read line by line |
| admin/frontend/src/assets/css/default.css | 315 | partial | styles exercised by the 184-view responsive sweep; CSS not read line by line |
| admin/frontend/src/assets/css/responsive.css | 486 | partial | styles exercised by the 184-view responsive sweep; CSS not read line by line |
| admin/frontend/src/assets/css/setting.css | 1134 | partial | styles exercised by the 184-view responsive sweep; CSS not read line by line |
| admin/frontend/src/assets/css/style.css | 2905 | partial | styles exercised by the 184-view responsive sweep; CSS not read line by line |
| admin/frontend/src/assets/css/variables.css | 28 | partial | styles exercised by the 184-view responsive sweep; CSS not read line by line |
| admin/frontend/src/assets/js/custom.js | 18 | scan-only | scan-only: pattern greps + rendered in the sweep; not read line by line |
| admin/frontend/src/common/HandleVideo.jsx | 55 | scan-only | scan-only: pattern greps + rendered in the sweep; not read line by line |
| admin/frontend/src/common/ImageFallback.jsx | 58 | scan-only | scan-only: pattern greps + rendered in the sweep; not read line by line |
| admin/frontend/src/Component/dialogue/AddDailyReward.js | 183 | scan-only | scan-only: pattern greps + rendered in the sweep; not read line by line |
| admin/frontend/src/Component/dialogue/AddReward.js | 210 | scan-only | scan-only: pattern greps + rendered in the sweep; not read line by line |
| admin/frontend/src/Component/dialogue/CreateChannel.js | 219 | scan-only | scan-only: pattern greps + rendered in the sweep; not read line by line |
| admin/frontend/src/Component/dialogue/CreatePlan.js | 282 | scan-only | scan-only: pattern greps + rendered in the sweep; not read line by line |
| admin/frontend/src/Component/dialogue/CreatePremiumPlan.js | 300 | scan-only | scan-only: pattern greps + rendered in the sweep; not read line by line |
| admin/frontend/src/Component/dialogue/NewFakeUser.js | 776 | scan-only | scan-only: pattern greps + rendered in the sweep; not read line by line |
| admin/frontend/src/Component/dialogue/NewShortAdd.js | 1377 | scan-only | scan-only: pattern greps + rendered in the sweep; not read line by line |
| admin/frontend/src/Component/dialogue/NewVideoAdd.js | 1343 | scan-only | scan-only: pattern greps + rendered in the sweep; not read line by line |
| admin/frontend/src/Component/dialogue/PaymentRestrictionsDialog.jsx | 104 | scan-only | scan-only: pattern greps + rendered in the sweep; not read line by line |
| admin/frontend/src/Component/dialogue/ShowVideo.js | 42 | scan-only | scan-only: pattern greps + rendered in the sweep; not read line by line |
| admin/frontend/src/Component/dialogue/SoundAdd.js | 539 | scan-only | scan-only: pattern greps + rendered in the sweep; not read line by line |
| admin/frontend/src/Component/dialogue/SoundCategoryAdd.js | 231 | scan-only | scan-only: pattern greps + rendered in the sweep; not read line by line |
| admin/frontend/src/Component/dialogue/WithdrawItemAdd.js | 264 | scan-only | scan-only: pattern greps + rendered in the sweep; not read line by line |
| admin/frontend/src/Component/extra/Button.js | 19 | scan-only | scan-only: pattern greps + rendered in the sweep; not read line by line |
| admin/frontend/src/Component/extra/infoContent.js | 549 | scan-only | scan-only: pattern greps + rendered in the sweep; not read line by line |
| admin/frontend/src/Component/extra/InfoTooltip.jsx | 52 | scan-only | scan-only: pattern greps + rendered in the sweep; not read line by line |
| admin/frontend/src/Component/extra/Input.js | 130 | scan-only | scan-only: pattern greps + rendered in the sweep; not read line by line |
| admin/frontend/src/Component/extra/Loader.js | 27 | scan-only | scan-only: pattern greps + rendered in the sweep; not read line by line |
| admin/frontend/src/Component/extra/MultiButton.js | 57 | scan-only | scan-only: pattern greps + rendered in the sweep; not read line by line |
| admin/frontend/src/Component/extra/Navigator.js | 72 | scan-only | scan-only: pattern greps + rendered in the sweep; not read line by line |
| admin/frontend/src/Component/extra/Pagination.js | 91 | scan-only | scan-only: pattern greps + rendered in the sweep; not read line by line |
| admin/frontend/src/Component/extra/Searching.js | 273 | scan-only | scan-only: pattern greps + rendered in the sweep; not read line by line |
| admin/frontend/src/Component/extra/Selector.js | 79 | scan-only | scan-only: pattern greps + rendered in the sweep; not read line by line |
| admin/frontend/src/Component/extra/ShowMoreText.js | 33 | scan-only | scan-only: pattern greps + rendered in the sweep; not read line by line |
| admin/frontend/src/Component/extra/SmallLoader.js | 65 | scan-only | scan-only: pattern greps + rendered in the sweep; not read line by line |
| admin/frontend/src/Component/extra/Table.js | 151 | scan-only | scan-only: pattern greps + rendered in the sweep; not read line by line |
| admin/frontend/src/Component/extra/Title.js | 145 | scan-only | scan-only: pattern greps + rendered in the sweep; not read line by line |
| admin/frontend/src/Component/extra/ToggleSwitch.js | 25 | scan-only | scan-only: pattern greps + rendered in the sweep; not read line by line |
| admin/frontend/src/Component/extra/UniqueIdCopy.jsx | 87 | scan-only | scan-only: pattern greps + rendered in the sweep; not read line by line |
| admin/frontend/src/Component/Pages/Admin.js | 168 | reviewed | read in full; see findings-draft-10 |
| admin/frontend/src/Component/Pages/Agency/AgencyDashboard.js | 113 | scan-only | scan-only for source; page rendered at 4 widths for every route a role may open (cdp-admin sweep, demo data); not read line by line |
| admin/frontend/src/Component/Pages/Agency/AgencyDetail.js | 303 | scan-only | scan-only for source; page rendered at 4 widths for every route a role may open (cdp-admin sweep, demo data); not read line by line |
| admin/frontend/src/Component/Pages/Agency/AgencyList.js | 184 | scan-only | scan-only for source; page rendered at 4 widths for every route a role may open (cdp-admin sweep, demo data); not read line by line |
| admin/frontend/src/Component/Pages/Channel/ChannelPage.js | 62 | scan-only | scan-only for source; page rendered at 4 widths for every route a role may open (cdp-admin sweep, demo data); not read line by line |
| admin/frontend/src/Component/Pages/Channel/FakeChannel.js | 247 | scan-only | scan-only for source; page rendered at 4 widths for every route a role may open (cdp-admin sweep, demo data); not read line by line |
| admin/frontend/src/Component/Pages/Channel/UserChannel.js | 237 | scan-only | scan-only for source; page rendered at 4 widths for every route a role may open (cdp-admin sweep, demo data); not read line by line |
| admin/frontend/src/Component/Pages/Coin/CoinPlan.js | 297 | scan-only | scan-only for source; page rendered at 4 widths for every route a role may open (cdp-admin sweep, demo data); not read line by line |
| admin/frontend/src/Component/Pages/dashboard/Dashboard.js | 463 | scan-only | scan-only for source; page rendered at 4 widths for every route a role may open (cdp-admin sweep, demo data); not read line by line |
| admin/frontend/src/Component/Pages/DigitalPartner/DigitalPartnerReports.js | 303 | scan-only | scan-only for source; page rendered at 4 widths for every route a role may open (cdp-admin sweep, demo data); not read line by line |
| admin/frontend/src/Component/Pages/DigitalPartner/ManageDigitalPartner.js | 163 | scan-only | scan-only for source; page rendered at 4 widths for every route a role may open (cdp-admin sweep, demo data); not read line by line |
| admin/frontend/src/Component/Pages/DigitalPartner/PartnerDashboard.js | 62 | scan-only | scan-only for source; page rendered at 4 widths for every route a role may open (cdp-admin sweep, demo data); not read line by line |
| admin/frontend/src/Component/Pages/DigitalPartner/PartnerDetail.js | 215 | scan-only | scan-only for source; page rendered at 4 widths for every route a role may open (cdp-admin sweep, demo data); not read line by line |
| admin/frontend/src/Component/Pages/DigitalPartner/PartnerLocalBusinessAds.js | 247 | scan-only | scan-only for source; page rendered at 4 widths for every route a role may open (cdp-admin sweep, demo data); not read line by line |
| admin/frontend/src/Component/Pages/DigitalPartner/PartnerPortalPages.js | 110 | reviewed | read in full; see findings-draft-10 |
| admin/frontend/src/Component/Pages/Earnings/AdminEarnings.js | 297 | scan-only | scan-only for source; page rendered at 4 widths for every route a role may open (cdp-admin sweep, demo data); not read line by line |
| admin/frontend/src/Component/Pages/Earnings/AllPlanEarnings.js | 317 | scan-only | scan-only for source; page rendered at 4 widths for every route a role may open (cdp-admin sweep, demo data); not read line by line |
| admin/frontend/src/Component/Pages/Earnings/CoinPlanEarnings.js | 327 | scan-only | scan-only for source; page rendered at 4 widths for every route a role may open (cdp-admin sweep, demo data); not read line by line |
| admin/frontend/src/Component/Pages/Earnings/CoinPlanHistory.js | 182 | scan-only | scan-only for source; page rendered at 4 widths for every route a role may open (cdp-admin sweep, demo data); not read line by line |
| admin/frontend/src/Component/Pages/Earnings/MainEarnings.js | 91 | scan-only | scan-only for source; page rendered at 4 widths for every route a role may open (cdp-admin sweep, demo data); not read line by line |
| admin/frontend/src/Component/Pages/ForgotPassword.js | 106 | scan-only | scan-only for source; page rendered at 4 widths for every route a role may open (cdp-admin sweep, demo data); not read line by line |
| admin/frontend/src/Component/Pages/Franchise/FranchisePartners.js | 167 | reviewed | read in full; see findings-draft-10 |
| admin/frontend/src/Component/Pages/Franchise/FranchiseReferrals.js | 79 | scan-only | scan-only for source; page rendered at 4 widths for every route a role may open (cdp-admin sweep, demo data); not read line by line |
| admin/frontend/src/Component/Pages/Fraud/FraudManagement.js | 122 | scan-only | scan-only for source; page rendered at 4 widths for every route a role may open (cdp-admin sweep, demo data); not read line by line |
| admin/frontend/src/Component/Pages/Login.js | 261 | scan-only | scan-only for source; page rendered at 4 widths for every route a role may open (cdp-admin sweep, demo data); not read line by line |
| admin/frontend/src/Component/Pages/MembershipTier/TierManagement.js | 356 | scan-only | scan-only for source; page rendered at 4 widths for every route a role may open (cdp-admin sweep, demo data); not read line by line |
| admin/frontend/src/Component/Pages/Moderation/ActionDialog.js | 76 | scan-only | scan-only for source; page rendered at 4 widths for every route a role may open (cdp-admin sweep, demo data); not read line by line |
| admin/frontend/src/Component/Pages/Moderation/DuplicateScreening.js | 165 | scan-only | scan-only for source; page rendered at 4 widths for every route a role may open (cdp-admin sweep, demo data); not read line by line |
| admin/frontend/src/Component/Pages/Moderation/ModerationQueue.js | 289 | scan-only | scan-only for source; page rendered at 4 widths for every route a role may open (cdp-admin sweep, demo data); not read line by line |
| admin/frontend/src/Component/Pages/MonetizationRequest/AcceptedRequest.js | 211 | scan-only | scan-only for source; page rendered at 4 widths for every route a role may open (cdp-admin sweep, demo data); not read line by line |
| admin/frontend/src/Component/Pages/MonetizationRequest/AcceptRequestDialog.js | 84 | scan-only | scan-only for source; page rendered at 4 widths for every route a role may open (cdp-admin sweep, demo data); not read line by line |
| admin/frontend/src/Component/Pages/MonetizationRequest/DeclinedRequest.js | 210 | scan-only | scan-only for source; page rendered at 4 widths for every route a role may open (cdp-admin sweep, demo data); not read line by line |
| admin/frontend/src/Component/Pages/MonetizationRequest/ManageMonetization.js | 72 | scan-only | scan-only for source; page rendered at 4 widths for every route a role may open (cdp-admin sweep, demo data); not read line by line |
| admin/frontend/src/Component/Pages/MonetizationRequest/PendingRequest.js | 268 | scan-only | scan-only for source; page rendered at 4 widths for every route a role may open (cdp-admin sweep, demo data); not read line by line |
| admin/frontend/src/Component/Pages/MonetizationRequest/Reason.js | 126 | scan-only | scan-only for source; page rendered at 4 widths for every route a role may open (cdp-admin sweep, demo data); not read line by line |
| admin/frontend/src/Component/Pages/Navbar.js | 200 | scan-only | scan-only for source; page rendered at 4 widths for every route a role may open (cdp-admin sweep, demo data); not read line by line |
| admin/frontend/src/Component/Pages/PartnerNetwork/FranchiseFormModal.js | 171 | scan-only | scan-only for source; page rendered at 4 widths for every route a role may open (cdp-admin sweep, demo data); not read line by line |
| admin/frontend/src/Component/Pages/PartnerNetwork/networkUi.js | 239 | scan-only | scan-only for source; page rendered at 4 widths for every route a role may open (cdp-admin sweep, demo data); not read line by line |
| admin/frontend/src/Component/Pages/PartnerNetwork/PartnerFormModal.js | 160 | scan-only | scan-only for source; page rendered at 4 widths for every route a role may open (cdp-admin sweep, demo data); not read line by line |
| admin/frontend/src/Component/Pages/PartnerNetwork/PartnerWallet.js | 222 | reviewed | read in full; see findings-draft-10 |
| admin/frontend/src/Component/Pages/PartnerNetwork/ReferralShareCard.js | 69 | scan-only | scan-only for source; page rendered at 4 widths for every route a role may open (cdp-admin sweep, demo data); not read line by line |
| admin/frontend/src/Component/Pages/PlatformConfig/configApi.js | 20 | scan-only | scan-only for source; page rendered at 4 widths for every route a role may open (cdp-admin sweep, demo data); not read line by line |
| admin/frontend/src/Component/Pages/PlatformConfig/configSchema.js | 180 | scan-only | scan-only for source; page rendered at 4 widths for every route a role may open (cdp-admin sweep, demo data); not read line by line |
| admin/frontend/src/Component/Pages/PlatformConfig/ConfigSectionForm.js | 311 | scan-only | scan-only for source; page rendered at 4 widths for every route a role may open (cdp-admin sweep, demo data); not read line by line |
| admin/frontend/src/Component/Pages/PlatformConfig/format.js | 16 | scan-only | scan-only for source; page rendered at 4 widths for every route a role may open (cdp-admin sweep, demo data); not read line by line |
| admin/frontend/src/Component/Pages/PlatformConfig/platformConfig.css | 76 | partial | styles exercised by the 184-view responsive sweep; CSS not read line by line |
| admin/frontend/src/Component/Pages/PlatformConfig/PlatformConfigPages.js | 136 | scan-only | scan-only for source; page rendered at 4 widths for every route a role may open (cdp-admin sweep, demo data); not read line by line |
| admin/frontend/src/Component/Pages/PlatformConfig/TierTable.js | 235 | scan-only | scan-only for source; page rendered at 4 widths for every route a role may open (cdp-admin sweep, demo data); not read line by line |
| admin/frontend/src/Component/Pages/PremiumPlan/PremiumPlan.js | 296 | scan-only | scan-only for source; page rendered at 4 widths for every route a role may open (cdp-admin sweep, demo data); not read line by line |
| admin/frontend/src/Component/Pages/Profile.js | 410 | scan-only | scan-only for source; page rendered at 4 widths for every route a role may open (cdp-admin sweep, demo data); not read line by line |
| admin/frontend/src/Component/Pages/Referral/ReferralManagement.js | 189 | scan-only | scan-only for source; page rendered at 4 widths for every route a role may open (cdp-admin sweep, demo data); not read line by line |
| admin/frontend/src/Component/Pages/Registration.js | 241 | scan-only | scan-only for source; page rendered at 4 widths for every route a role may open (cdp-admin sweep, demo data); not read line by line |
| admin/frontend/src/Component/Pages/Report/ManageReport.js | 67 | scan-only | scan-only for source; page rendered at 4 widths for every route a role may open (cdp-admin sweep, demo data); not read line by line |
| admin/frontend/src/Component/Pages/Report/ShortReport.js | 374 | scan-only | scan-only for source; page rendered at 4 widths for every route a role may open (cdp-admin sweep, demo data); not read line by line |
| admin/frontend/src/Component/Pages/Report/VideoReport.js | 372 | scan-only | scan-only for source; page rendered at 4 widths for every route a role may open (cdp-admin sweep, demo data); not read line by line |
| admin/frontend/src/Component/Pages/Reports/AgencyReports.js | 190 | scan-only | scan-only for source; page rendered at 4 widths for every route a role may open (cdp-admin sweep, demo data); not read line by line |
| admin/frontend/src/Component/Pages/RewardSetting/AdsCoinRewardSetting.js | 298 | scan-only | scan-only for source; page rendered at 4 widths for every route a role may open (cdp-admin sweep, demo data); not read line by line |
| admin/frontend/src/Component/Pages/RewardSetting/DailyRewardSetting.js | 192 | scan-only | scan-only for source; page rendered at 4 widths for every route a role may open (cdp-admin sweep, demo data); not read line by line |
| admin/frontend/src/Component/Pages/RewardSetting/EngagementSetting.js | 159 | scan-only | scan-only for source; page rendered at 4 widths for every route a role may open (cdp-admin sweep, demo data); not read line by line |
| admin/frontend/src/Component/Pages/RewardSetting/LoginRewardSetting.js | 98 | scan-only | scan-only for source; page rendered at 4 widths for every route a role may open (cdp-admin sweep, demo data); not read line by line |
| admin/frontend/src/Component/Pages/RewardSetting/ManageReward.js | 42 | scan-only | scan-only for source; page rendered at 4 widths for every route a role may open (cdp-admin sweep, demo data); not read line by line |
| admin/frontend/src/Component/Pages/RewardSetting/RefralBonus.js | 117 | scan-only | scan-only for source; page rendered at 4 widths for every route a role may open (cdp-admin sweep, demo data); not read line by line |
| admin/frontend/src/Component/Pages/SetPassword.js | 123 | scan-only | scan-only for source; page rendered at 4 widths for every route a role may open (cdp-admin sweep, demo data); not read line by line |
| admin/frontend/src/Component/Pages/Setting/AppSetting.js | 1088 | scan-only | scan-only for source; page rendered at 4 widths for every route a role may open (cdp-admin sweep, demo data); not read line by line |
| admin/frontend/src/Component/Pages/Setting/ManageSetting.js | 173 | scan-only | scan-only for source; page rendered at 4 widths for every route a role may open (cdp-admin sweep, demo data); not read line by line |
| admin/frontend/src/Component/Pages/Setting/MonetizationSetting.js | 800 | scan-only | scan-only for source; page rendered at 4 widths for every route a role may open (cdp-admin sweep, demo data); not read line by line |
| admin/frontend/src/Component/Pages/Setting/PaymentGatewaySetting.js | 454 | scan-only | scan-only for source; page rendered at 4 widths for every route a role may open (cdp-admin sweep, demo data); not read line by line |
| admin/frontend/src/Component/Pages/Setting/PaymentSetting.js | 904 | scan-only | scan-only for source; page rendered at 4 widths for every route a role may open (cdp-admin sweep, demo data); not read line by line |
| admin/frontend/src/Component/Pages/Setting/StorageSettingPage.js | 498 | scan-only | scan-only for source; page rendered at 4 widths for every route a role may open (cdp-admin sweep, demo data); not read line by line |
| admin/frontend/src/Component/Pages/Share/share.module.css | 376 | partial | styles exercised by the 184-view responsive sweep; CSS not read line by line |
| admin/frontend/src/Component/Pages/Share/SharePage.js | 152 | scan-only | scan-only for source; page rendered at 4 widths for every route a role may open (cdp-admin sweep, demo data); not read line by line |
| admin/frontend/src/Component/Pages/Shorts/ManageShorts.js | 519 | scan-only | scan-only for source; page rendered at 4 widths for every route a role may open (cdp-admin sweep, demo data); not read line by line |
| admin/frontend/src/Component/Pages/Shorts/ShortComment.js | 346 | scan-only | scan-only for source; page rendered at 4 widths for every route a role may open (cdp-admin sweep, demo data); not read line by line |
| admin/frontend/src/Component/Pages/Shorts/ShortsPage.js | 78 | scan-only | scan-only for source; page rendered at 4 widths for every route a role may open (cdp-admin sweep, demo data); not read line by line |
| admin/frontend/src/Component/Pages/Sidebar.js | 328 | partial | greped for risky patterns only |
| admin/frontend/src/Component/Pages/Sound/SoundCategory.js | 346 | scan-only | scan-only for source; page rendered at 4 widths for every route a role may open (cdp-admin sweep, demo data); not read line by line |
| admin/frontend/src/Component/Pages/Sound/SoundList.js | 379 | scan-only | scan-only for source; page rendered at 4 widths for every route a role may open (cdp-admin sweep, demo data); not read line by line |
| admin/frontend/src/Component/Pages/Sound/SoundPage.js | 43 | scan-only | scan-only for source; page rendered at 4 widths for every route a role may open (cdp-admin sweep, demo data); not read line by line |
| admin/frontend/src/Component/Pages/Updatecode.js | 147 | scan-only | scan-only for source; page rendered at 4 widths for every route a role may open (cdp-admin sweep, demo data); not read line by line |
| admin/frontend/src/Component/Pages/UserPage/AvatarSetting.js | 127 | scan-only | scan-only for source; page rendered at 4 widths for every route a role may open (cdp-admin sweep, demo data); not read line by line |
| admin/frontend/src/Component/Pages/UserPage/FakeUser.js | 515 | scan-only | scan-only for source; page rendered at 4 widths for every route a role may open (cdp-admin sweep, demo data); not read line by line |
| admin/frontend/src/Component/Pages/UserPage/ManageUser.js | 491 | scan-only | scan-only for source; page rendered at 4 widths for every route a role may open (cdp-admin sweep, demo data); not read line by line |
| admin/frontend/src/Component/Pages/UserPage/PasswordSetting.js | 185 | scan-only | scan-only for source; page rendered at 4 widths for every route a role may open (cdp-admin sweep, demo data); not read line by line |
| admin/frontend/src/Component/Pages/UserPage/User.js | 88 | scan-only | scan-only for source; page rendered at 4 widths for every route a role may open (cdp-admin sweep, demo data); not read line by line |
| admin/frontend/src/Component/Pages/UserPage/UserProfileSetting.js | 657 | scan-only | scan-only for source; page rendered at 4 widths for every route a role may open (cdp-admin sweep, demo data); not read line by line |
| admin/frontend/src/Component/Pages/UserPage/UserSetting.js | 96 | scan-only | scan-only for source; page rendered at 4 widths for every route a role may open (cdp-admin sweep, demo data); not read line by line |
| admin/frontend/src/Component/Pages/VideoPage/ManageVideo.js | 573 | scan-only | scan-only for source; page rendered at 4 widths for every route a role may open (cdp-admin sweep, demo data); not read line by line |
| admin/frontend/src/Component/Pages/VideoPage/VideoComments.js | 363 | scan-only | scan-only for source; page rendered at 4 widths for every route a role may open (cdp-admin sweep, demo data); not read line by line |
| admin/frontend/src/Component/Pages/VideoPage/VideoPage.js | 73 | scan-only | scan-only for source; page rendered at 4 widths for every route a role may open (cdp-admin sweep, demo data); not read line by line |
| admin/frontend/src/Component/Pages/VideoPromotion/ManageVideoPromotion.js | 167 | scan-only | scan-only for source; page rendered at 4 widths for every route a role may open (cdp-admin sweep, demo data); not read line by line |
| admin/frontend/src/Component/Pages/WithDrawRequest/AcceptedRequest.js | 266 | scan-only | scan-only for source; page rendered at 4 widths for every route a role may open (cdp-admin sweep, demo data); not read line by line |
| admin/frontend/src/Component/Pages/WithDrawRequest/DeclinedRequest.js | 290 | scan-only | scan-only for source; page rendered at 4 widths for every route a role may open (cdp-admin sweep, demo data); not read line by line |
| admin/frontend/src/Component/Pages/WithDrawRequest/InfoDialog.js | 113 | scan-only | scan-only for source; page rendered at 4 widths for every route a role may open (cdp-admin sweep, demo data); not read line by line |
| admin/frontend/src/Component/Pages/WithDrawRequest/ManageWithDraw.js | 80 | scan-only | scan-only for source; page rendered at 4 widths for every route a role may open (cdp-admin sweep, demo data); not read line by line |
| admin/frontend/src/Component/Pages/WithDrawRequest/Reason.js | 132 | scan-only | scan-only for source; page rendered at 4 widths for every route a role may open (cdp-admin sweep, demo data); not read line by line |
| admin/frontend/src/Component/Pages/WithDrawRequest/ReasonViewDialog.js | 80 | scan-only | scan-only for source; page rendered at 4 widths for every route a role may open (cdp-admin sweep, demo data); not read line by line |
| admin/frontend/src/Component/Pages/WithDrawRequest/WithDrawDetails.js | 152 | reviewed | read in full; see findings-draft-10 |
| admin/frontend/src/Component/Pages/WithDrawRequest/WithDrawRequest.js | 336 | reviewed | read in full; see findings-draft-10 |
| admin/frontend/src/Component/store/admin/admin.action.js | 285 | scan-only | scan-only: redux actions/reducers; pattern greps (catch handlers, toasts); exercised through the 184-view role sweep on the demo stack |
| admin/frontend/src/Component/store/admin/admin.reducer.js | 135 | scan-only | scan-only: redux actions/reducers; pattern greps (catch handlers, toasts); exercised through the 184-view role sweep on the demo stack |
| admin/frontend/src/Component/store/admin/admin.type.js | 19 | scan-only | scan-only: redux actions/reducers; pattern greps (catch handlers, toasts); exercised through the 184-view role sweep on the demo stack |
| admin/frontend/src/Component/store/coinPlan/coinPlan.action.js | 102 | scan-only | scan-only: redux actions/reducers; pattern greps (catch handlers, toasts); exercised through the 184-view role sweep on the demo stack |
| admin/frontend/src/Component/store/coinPlan/coinPlan.reducer.js | 66 | scan-only | scan-only: redux actions/reducers; pattern greps (catch handlers, toasts); exercised through the 184-view role sweep on the demo stack |
| admin/frontend/src/Component/store/coinPlan/coinPlan.type.js | 10 | scan-only | scan-only: redux actions/reducers; pattern greps (catch handlers, toasts); exercised through the 184-view role sweep on the demo stack |
| admin/frontend/src/Component/store/currency/currency.action.js | 91 | scan-only | scan-only: redux actions/reducers; pattern greps (catch handlers, toasts); exercised through the 184-view role sweep on the demo stack |
| admin/frontend/src/Component/store/currency/currency.reducer.js | 53 | scan-only | scan-only: redux actions/reducers; pattern greps (catch handlers, toasts); exercised through the 184-view role sweep on the demo stack |
| admin/frontend/src/Component/store/currency/currency.type.js | 8 | scan-only | scan-only: redux actions/reducers; pattern greps (catch handlers, toasts); exercised through the 184-view role sweep on the demo stack |
| admin/frontend/src/Component/store/dashboard/dashboard.action.js | 123 | scan-only | scan-only: redux actions/reducers; pattern greps (catch handlers, toasts); exercised through the 184-view role sweep on the demo stack |
| admin/frontend/src/Component/store/dashboard/dashboard.reducer.js | 67 | scan-only | scan-only: redux actions/reducers; pattern greps (catch handlers, toasts); exercised through the 184-view role sweep on the demo stack |
| admin/frontend/src/Component/store/dashboard/dashboard.type.js | 15 | scan-only | scan-only: redux actions/reducers; pattern greps (catch handlers, toasts); exercised through the 184-view role sweep on the demo stack |
| admin/frontend/src/Component/store/dialogue/dialogue.reducer.js | 81 | scan-only | scan-only: redux actions/reducers; pattern greps (catch handlers, toasts); exercised through the 184-view role sweep on the demo stack |
| admin/frontend/src/Component/store/dialogue/dialogue.type.js | 12 | scan-only | scan-only: redux actions/reducers; pattern greps (catch handlers, toasts); exercised through the 184-view role sweep on the demo stack |
| admin/frontend/src/Component/store/index.js | 33 | scan-only | scan-only: redux actions/reducers; pattern greps (catch handlers, toasts); exercised through the 184-view role sweep on the demo stack |
| admin/frontend/src/Component/store/monetization/monetization.action.js | 44 | scan-only | scan-only: redux actions/reducers; pattern greps (catch handlers, toasts); exercised through the 184-view role sweep on the demo stack |
| admin/frontend/src/Component/store/monetization/monetization.reducer.js | 33 | scan-only | scan-only: redux actions/reducers; pattern greps (catch handlers, toasts); exercised through the 184-view role sweep on the demo stack |
| admin/frontend/src/Component/store/monetization/monetization.type.js | 2 | scan-only | scan-only: redux actions/reducers; pattern greps (catch handlers, toasts); exercised through the 184-view role sweep on the demo stack |
| admin/frontend/src/Component/store/premiumPlan/premiumPlan.action.js | 92 | scan-only | scan-only: redux actions/reducers; pattern greps (catch handlers, toasts); exercised through the 184-view role sweep on the demo stack |
| admin/frontend/src/Component/store/premiumPlan/premiumPlan.reducer.js | 57 | scan-only | scan-only: redux actions/reducers; pattern greps (catch handlers, toasts); exercised through the 184-view role sweep on the demo stack |
| admin/frontend/src/Component/store/premiumPlan/premiumPlan.type.js | 9 | scan-only | scan-only: redux actions/reducers; pattern greps (catch handlers, toasts); exercised through the 184-view role sweep on the demo stack |
| admin/frontend/src/Component/store/Provider.js | 16 | scan-only | scan-only: redux actions/reducers; pattern greps (catch handlers, toasts); exercised through the 184-view role sweep on the demo stack |
| admin/frontend/src/Component/store/report/report.action.js | 32 | scan-only | scan-only: redux actions/reducers; pattern greps (catch handlers, toasts); exercised through the 184-view role sweep on the demo stack |
| admin/frontend/src/Component/store/report/report.reducer.js | 34 | scan-only | scan-only: redux actions/reducers; pattern greps (catch handlers, toasts); exercised through the 184-view role sweep on the demo stack |
| admin/frontend/src/Component/store/report/report.type.js | 4 | scan-only | scan-only: redux actions/reducers; pattern greps (catch handlers, toasts); exercised through the 184-view role sweep on the demo stack |
| admin/frontend/src/Component/store/setting/setting.action.js | 350 | scan-only | scan-only: redux actions/reducers; pattern greps (catch handlers, toasts); exercised through the 184-view role sweep on the demo stack |
| admin/frontend/src/Component/store/setting/setting.reducer.js | 183 | scan-only | scan-only: redux actions/reducers; pattern greps (catch handlers, toasts); exercised through the 184-view role sweep on the demo stack |
| admin/frontend/src/Component/store/setting/setting.type.js | 30 | scan-only | scan-only: redux actions/reducers; pattern greps (catch handlers, toasts); exercised through the 184-view role sweep on the demo stack |
| admin/frontend/src/Component/store/shorts/shorts.action.js | 97 | scan-only | scan-only: redux actions/reducers; pattern greps (catch handlers, toasts); exercised through the 184-view role sweep on the demo stack |
| admin/frontend/src/Component/store/shorts/shorts.reducer.js | 62 | scan-only | scan-only: redux actions/reducers; pattern greps (catch handlers, toasts); exercised through the 184-view role sweep on the demo stack |
| admin/frontend/src/Component/store/shorts/shorts.type.js | 5 | scan-only | scan-only: redux actions/reducers; pattern greps (catch handlers, toasts); exercised through the 184-view role sweep on the demo stack |
| admin/frontend/src/Component/store/sound/sound.action.js | 142 | scan-only | scan-only: redux actions/reducers; pattern greps (catch handlers, toasts); exercised through the 184-view role sweep on the demo stack |
| admin/frontend/src/Component/store/sound/sound.reducer.js | 100 | scan-only | scan-only: redux actions/reducers; pattern greps (catch handlers, toasts); exercised through the 184-view role sweep on the demo stack |
| admin/frontend/src/Component/store/sound/sound.type.js | 9 | scan-only | scan-only: redux actions/reducers; pattern greps (catch handlers, toasts); exercised through the 184-view role sweep on the demo stack |
| admin/frontend/src/Component/store/user/user.action.js | 273 | scan-only | scan-only: redux actions/reducers; pattern greps (catch handlers, toasts); exercised through the 184-view role sweep on the demo stack |
| admin/frontend/src/Component/store/user/user.reducer.js | 202 | scan-only | scan-only: redux actions/reducers; pattern greps (catch handlers, toasts); exercised through the 184-view role sweep on the demo stack |
| admin/frontend/src/Component/store/user/user.type.js | 51 | scan-only | scan-only: redux actions/reducers; pattern greps (catch handlers, toasts); exercised through the 184-view role sweep on the demo stack |
| admin/frontend/src/Component/store/video/video.action.js | 155 | scan-only | scan-only: redux actions/reducers; pattern greps (catch handlers, toasts); exercised through the 184-view role sweep on the demo stack |
| admin/frontend/src/Component/store/video/video.reducer.js | 84 | scan-only | scan-only: redux actions/reducers; pattern greps (catch handlers, toasts); exercised through the 184-view role sweep on the demo stack |
| admin/frontend/src/Component/store/video/video.type.js | 13 | scan-only | scan-only: redux actions/reducers; pattern greps (catch handlers, toasts); exercised through the 184-view role sweep on the demo stack |
| admin/frontend/src/Component/store/withdraw/withdraw.action.js | 60 | reviewed | read in full; see findings-draft-10 |
| admin/frontend/src/Component/store/withdraw/withdraw.reducer.js | 40 | scan-only | scan-only: redux actions/reducers; pattern greps (catch handlers, toasts); exercised through the 184-view role sweep on the demo stack |
| admin/frontend/src/Component/store/withdraw/withdraw.type.js | 3 | scan-only | scan-only: redux actions/reducers; pattern greps (catch handlers, toasts); exercised through the 184-view role sweep on the demo stack |
| admin/frontend/src/index.css | 1505 | partial | styles exercised by the 184-view responsive sweep; CSS not read line by line |
| admin/frontend/src/index.js | 72 | scan-only | scan-only: pattern greps + rendered in the sweep; not read line by line |
| admin/frontend/src/reportWebVitals.js | 14 | scan-only | scan-only: pattern greps + rendered in the sweep; not read line by line |
| admin/frontend/src/setupTests.js | 6 | scan-only | scan-only: pattern greps + rendered in the sweep; not read line by line |
| admin/frontend/src/util/Alert.js | 33 | scan-only | scan-only: pattern greps + rendered in the sweep; not read line by line |
| admin/frontend/src/util/api.js | 107 | reviewed | read in full; see findings-draft-10 |
| admin/frontend/src/util/apiError.js | 28 | scan-only | scan-only: pattern greps + rendered in the sweep; not read line by line |
| admin/frontend/src/util/apiError.test.js | 26 | scan-only | scan-only: pattern greps + rendered in the sweep; not read line by line |
| admin/frontend/src/util/AwsFunction.js | 65 | reviewed | read in full; see findings-draft-10 |
| admin/frontend/src/util/AxiosInterceptor.js | 37 | reviewed | read in full; see findings-draft-10 |
| admin/frontend/src/util/config.js | 19 | reviewed | read in full; see findings-draft-10 |
| admin/frontend/src/util/paymentGateways.js | 12 | scan-only | scan-only: pattern greps + rendered in the sweep; not read line by line |
| admin/frontend/src/util/PrivateRoute.js | 15 | reviewed | read in full; see findings-draft-10 |
| admin/frontend/src/util/setAuth.js | 20 | reviewed | read in full; see findings-draft-10 |
| admin/frontend/src/util/shareDestination.js | 74 | scan-only | scan-only: pattern greps + rendered in the sweep; not read line by line |
| admin/frontend/src/util/toast.js | 31 | scan-only | scan-only: pattern greps + rendered in the sweep; not read line by line |
| admin/frontend/src/util/useTableParams.js | 85 | scan-only | scan-only: pattern greps + rendered in the sweep; not read line by line |
| admin/frontend/src/util/useTabSelectWithClearSearch.js | 25 | scan-only | scan-only: pattern greps + rendered in the sweep; not read line by line |
| api/index.js | 23 | reviewed | read in full; see findings-draft |
| COMPLETE_PROJECT_TESTING_AUDIT_REPORT.txt | 523 | reviewed | earlier-audit/context document; skimmed for claims, not a defect source |
| DB/enrich_videos_db.js | 53 | partial | head read (imports Firestore service directly, no guard) |
| DB/execute_import.js | 63 | reviewed | data-import script read; no environment guard (SCR-1) |
| DB/execute_non_video_import.js | 56 | partial | head read (imports Firestore service directly, no guard) |
| DB/execute_video_import.js | 56 | partial | head read (imports Firestore service directly, no guard) |
| DB/fix_video_urls.js | 57 | reviewed | data-import script read; no environment guard (SCR-1) |
| DB/fix_videos.js | 32 | reviewed | data-import script read; no environment guard (SCR-1) |
| DEPLOYMENT.md | 113 | reviewed | read in full; see findings-draft |
| firebase.json | 10 | reviewed | read in full; see findings-draft |
| firestore.indexes.json | 5 | reviewed | read in full |
| firestore.rules | 26 | reviewed | read in full; see findings-draft |
| functions/backend/.gitignore | 3 | scan-only | scan-only: not read line by line |
| functions/backend/checkAccess.js | 20 | reviewed | read in full; see findings-draft |
| functions/backend/controllers/admin/admin.controller.js | 275 | reviewed | read line-by-line; findings in findings-draft*.md |
| functions/backend/controllers/admin/adRewardCoin.controoler.js | 131 | reviewed | read in full; findings-draft-15 |
| functions/backend/controllers/admin/advertise.controller.js | 125 | reviewed | read in full; findings-draft-15 |
| functions/backend/controllers/admin/agency.controller.js | 340 | reviewed | read line-by-line; findings in findings-draft*.md |
| functions/backend/controllers/admin/agencyReport.controller.js | 119 | reviewed | read line-by-line; findings in findings-draft*.md |
| functions/backend/controllers/admin/coinplan.controller.js | 179 | reviewed | read line-by-line; findings in findings-draft*.md |
| functions/backend/controllers/admin/commission.controller.js | 155 | reviewed | read line-by-line; findings in findings-draft*.md |
| functions/backend/controllers/admin/contact.controller.js | 111 | partial | skimmed for authz/obvious defects (CRUD template, admin-only); not read line by line |
| functions/backend/controllers/admin/contentModeration.controller.js | 143 | reviewed | read line-by-line; findings in findings-draft*.md |
| functions/backend/controllers/admin/copyrightModeration.controller.js | 146 | reviewed | read line-by-line; findings in findings-draft*.md |
| functions/backend/controllers/admin/creatorFunding.controller.js | 59 | reviewed | read line-by-line; findings in findings-draft*.md |
| functions/backend/controllers/admin/currencyController.js | 190 | reviewed | read in full; findings-draft-15 |
| functions/backend/controllers/admin/dailyRewardCoin.controller.js | 108 | reviewed | read in full; findings-draft-15 |
| functions/backend/controllers/admin/dashboard.controller.js | 162 | reviewed | read line-by-line; findings in findings-draft*.md |
| functions/backend/controllers/admin/digitalPartner.controller.js | 243 | reviewed | read line-by-line; findings in findings-draft*.md |
| functions/backend/controllers/admin/FAQ.controller.js | 83 | reviewed | read in full; findings-draft-15 |
| functions/backend/controllers/admin/file.controller.js | 8 | reviewed | read line-by-line; findings in findings-draft*.md |
| functions/backend/controllers/admin/franchisePortal.controller.js | 163 | reviewed | read line-by-line; findings in findings-draft*.md |
| functions/backend/controllers/admin/fraud.controller.js | 44 | reviewed | read line-by-line; findings in findings-draft*.md |
| functions/backend/controllers/admin/language.controller.js | 166 | partial | skimmed for authz/obvious defects (CRUD template, admin-only); not read line by line |
| functions/backend/controllers/admin/localBusinessAd.controller.js | 144 | reviewed | read line-by-line; findings in findings-draft*.md |
| functions/backend/controllers/admin/login.controller.js | 16 | reviewed | read line-by-line; findings in findings-draft*.md |
| functions/backend/controllers/admin/mediaAudit.controller.js | 62 | reviewed | read line-by-line; findings in findings-draft*.md |
| functions/backend/controllers/admin/membershipTier.controller.js | 158 | reviewed | read line-by-line; findings in findings-draft*.md |
| functions/backend/controllers/admin/monetizationRequest.controller.js | 232 | reviewed | read line-by-line; findings in findings-draft*.md |
| functions/backend/controllers/admin/partnerPortal.controller.js | 198 | reviewed | read line-by-line; findings in findings-draft*.md |
| functions/backend/controllers/admin/platformConfig.controller.js | 61 | reviewed | read line-by-line; findings in findings-draft*.md |
| functions/backend/controllers/admin/premiumPlan.controller.js | 330 | reviewed | read in full; findings-draft-15 |
| functions/backend/controllers/admin/referral.controller.js | 39 | reviewed | read line-by-line; findings in findings-draft*.md |
| functions/backend/controllers/admin/report.controller.js | 223 | reviewed | read in full; findings-draft-15 |
| functions/backend/controllers/admin/setting.controller.js | 142 | reviewed | read line-by-line; findings in findings-draft*.md |
| functions/backend/controllers/admin/soundCategory.controller.js | 197 | partial | skimmed for authz/obvious defects (CRUD template, admin-only); not read line by line |
| functions/backend/controllers/admin/soundList.controller.js | 242 | partial | skimmed for authz/obvious defects (CRUD template, admin-only); not read line by line |
| functions/backend/controllers/admin/translation.controller.js | 562 | partial | skimmed for authz/obvious defects (CRUD template, admin-only); not read line by line |
| functions/backend/controllers/admin/user.controller.js | 453 | reviewed | read line-by-line; findings in findings-draft*.md |
| functions/backend/controllers/admin/video.controller.js | 207 | reviewed | read line-by-line; findings in findings-draft*.md |
| functions/backend/controllers/admin/videoComment.controller.js | 281 | partial | skimmed for authz/obvious defects (CRUD template, admin-only); not read line by line |
| functions/backend/controllers/admin/videoPromotion.controller.js | 90 | reviewed | read line-by-line; findings in findings-draft*.md |
| functions/backend/controllers/admin/withdraw.controller.js | 145 | reviewed | read line-by-line; findings in findings-draft*.md |
| functions/backend/controllers/admin/withDrawalRequest.controller.js | 304 | reviewed | read line-by-line; findings in findings-draft*.md |
| functions/backend/controllers/client/adRewardCoin.controller.js | 49 | reviewed | read in full; findings-draft-15 |
| functions/backend/controllers/client/coinplan.controller.js | 376 | reviewed | read line-by-line; findings in findings-draft*.md |
| functions/backend/controllers/client/contact.controller.js | 13 | reviewed | read in full; findings-draft-15 |
| functions/backend/controllers/client/creatorFunding.controller.js | 279 | reviewed | read line-by-line; findings in findings-draft*.md |
| functions/backend/controllers/client/creatorTier.controller.js | 135 | reviewed | read line-by-line; findings in findings-draft*.md |
| functions/backend/controllers/client/dailyRewardCoin.controller.js | 203 | reviewed | read line-by-line; findings in findings-draft*.md |
| functions/backend/controllers/client/FAQ.controller.js | 14 | reviewed | read in full; findings-draft-15 |
| functions/backend/controllers/client/file.controller.js | 79 | reviewed | read line-by-line; findings in findings-draft*.md |
| functions/backend/controllers/client/grievance.controller.js | 149 | reviewed | read line-by-line; findings in findings-draft*.md |
| functions/backend/controllers/client/liveUser.controller.js | 338 | reviewed | read in full; findings-draft-15 |
| functions/backend/controllers/client/localBusinessAd.controller.js | 128 | reviewed | read line-by-line; findings in findings-draft*.md |
| functions/backend/controllers/client/mediaDelivery.controller.js | 22 | reviewed | read line-by-line; findings in findings-draft*.md |
| functions/backend/controllers/client/monetizationRequest.controller.js | 288 | reviewed | read line-by-line; findings in findings-draft*.md |
| functions/backend/controllers/client/notification.controller.js | 163 | reviewed | read line-by-line; findings in findings-draft*.md |
| functions/backend/controllers/client/otp.controller.js | 295 | reviewed | read line-by-line; findings in findings-draft*.md |
| functions/backend/controllers/client/partner.controller.js | 133 | reviewed | read line-by-line; findings in findings-draft*.md |
| functions/backend/controllers/client/payment.controller.js | 688 | reviewed | read line-by-line; findings in findings-draft*.md |
| functions/backend/controllers/client/payout.controller.js | 142 | reviewed | read line-by-line; findings in findings-draft*.md |
| functions/backend/controllers/client/peakBoost.controller.js | 170 | reviewed | read line-by-line; findings in findings-draft*.md |
| functions/backend/controllers/client/playbackSession.controller.js | 310 | reviewed | read line-by-line; findings in findings-draft*.md |
| functions/backend/controllers/client/playLIst.controller.js | 184 | reviewed | read in full; findings-draft-15 |
| functions/backend/controllers/client/premiumPlan.controller.js | 440 | reviewed | read line-by-line; findings in findings-draft*.md |
| functions/backend/controllers/client/report.controller.js | 73 | reviewed | read line-by-line; findings in findings-draft*.md |
| functions/backend/controllers/client/saveToWatchLater.controller.js | 288 | reviewed | read in full; findings-draft-15 |
| functions/backend/controllers/client/security.controller.js | 28 | reviewed | read line-by-line; findings in findings-draft*.md |
| functions/backend/controllers/client/setting.controller.js | 78 | reviewed | read line-by-line; findings in findings-draft*.md |
| functions/backend/controllers/client/soundList.controller.js | 26 | reviewed | read in full; findings-draft-15 |
| functions/backend/controllers/client/tasker.controller.js | 175 | reviewed | read line-by-line; findings in findings-draft*.md |
| functions/backend/controllers/client/taskerTier.controller.js | 33 | reviewed | read line-by-line; findings in findings-draft*.md |
| functions/backend/controllers/client/translation.controller.js | 106 | reviewed | read in full; findings-draft-15 |
| functions/backend/controllers/client/user.controller.js | 493 | reviewed | read line-by-line; findings in findings-draft*.md |
| functions/backend/controllers/client/userFirestore.controller.js | 518 | reviewed | read line-by-line; findings in findings-draft*.md |
| functions/backend/controllers/client/userTaskReward.controller.js | 208 | reviewed | read line-by-line; findings in findings-draft*.md |
| functions/backend/controllers/client/userWiseDownload.controller.js | 198 | reviewed | read in full; findings-draft-15 |
| functions/backend/controllers/client/userWiseSubscription.controller.js | 560 | reviewed | read line-by-line; findings in findings-draft*.md |
| functions/backend/controllers/client/video.controller.js | 5368 | partial | read 1-2300, 2714-3400, 3358-3620, 3772-3880, 4520-5368 of 5368; ~2,000 lines of duplicated feed/search pipelines skimmed |
| functions/backend/controllers/client/videoComment.controller.js | 685 | reviewed | read line-by-line; findings in findings-draft*.md |
| functions/backend/controllers/client/videoPromotion.controller.js | 51 | reviewed | read line-by-line; findings in findings-draft*.md |
| functions/backend/controllers/client/watchHistory.controller.js | 391 | reviewed | read line-by-line; findings in findings-draft*.md |
| functions/backend/controllers/client/watchSession.controller.js | 93 | reviewed | read line-by-line; findings in findings-draft*.md |
| functions/backend/controllers/client/withdraw.controller.js | 20 | reviewed | read in full; findings-draft-15 |
| functions/backend/controllers/client/withDrawalRequest.controller.js | 400 | reviewed | read line-by-line; findings in findings-draft*.md |
| functions/backend/controllers/cron.controller.js | 100 | reviewed | read line-by-line; findings in findings-draft*.md |
| functions/backend/index.js | 176 | reviewed | read in full; see findings-draft |
| functions/backend/middleware/admin.middleware.js | 117 | reviewed | read in full; see findings-draft |
| functions/backend/middleware/appUser.middleware.js | 59 | reviewed | read in full; see findings-draft |
| functions/backend/middleware/bindAppUser.middleware.js | 33 | reviewed | read in full; see findings-draft |
| functions/backend/middleware/checkScope.middleware.js | 33 | reviewed | read in full; see findings-draft |
| functions/backend/middleware/optionalAppUser.middleware.js | 31 | reviewed | read in full; see findings-draft |
| functions/backend/middleware/withholdLockedPlayback.js | 79 | reviewed | read in full; see findings-draft |
| functions/backend/models/admin.model.js | 36 | reviewed | read in full (schemas); TTL/unique indexes are no-ops in shim |
| functions/backend/models/adRewardCoin.model.js | 18 | reviewed | read in full (schemas); TTL/unique indexes are no-ops in shim |
| functions/backend/models/advertise.model.js | 35 | reviewed | read in full (schemas); TTL/unique indexes are no-ops in shim |
| functions/backend/models/checkIn.model.js | 24 | reviewed | read in full (schemas); TTL/unique indexes are no-ops in shim |
| functions/backend/models/coinplan.model.js | 23 | reviewed | read in full (schemas); TTL/unique indexes are no-ops in shim |
| functions/backend/models/coinplanHistory.model.js | 22 | reviewed | read in full (schemas); TTL/unique indexes are no-ops in shim |
| functions/backend/models/contact.model.js | 16 | reviewed | read in full (schemas); TTL/unique indexes are no-ops in shim |
| functions/backend/models/dailyRewardCoin.model.js | 17 | reviewed | read in full (schemas); TTL/unique indexes are no-ops in shim |
| functions/backend/models/FAQ.model.js | 16 | reviewed | read in full (schemas); TTL/unique indexes are no-ops in shim |
| functions/backend/models/fraudAlert.model.js | 37 | reviewed | read in full (schemas); TTL/unique indexes are no-ops in shim |
| functions/backend/models/history.model.js | 35 | reviewed | read in full (schemas); TTL/unique indexes are no-ops in shim |
| functions/backend/models/keywordBlacklist.model.js | 21 | reviewed | read in full (schemas); TTL/unique indexes are no-ops in shim |
| functions/backend/models/language.model.js | 22 | reviewed | read in full (schemas); TTL/unique indexes are no-ops in shim |
| functions/backend/models/likeHistoryOfVideo.model.js | 21 | reviewed | read in full (schemas); TTL/unique indexes are no-ops in shim |
| functions/backend/models/likeHistoryOfVideoComment.model.js | 20 | reviewed | read in full (schemas); TTL/unique indexes are no-ops in shim |
| functions/backend/models/liveHistory.model.js | 21 | reviewed | read in full (schemas); TTL/unique indexes are no-ops in shim |
| functions/backend/models/liveUser.model.js | 32 | reviewed | read in full (schemas); TTL/unique indexes are no-ops in shim |
| functions/backend/models/localBusinessAd.model.js | 44 | reviewed | read in full (schemas); TTL/unique indexes are no-ops in shim |
| functions/backend/models/membershipTier.model.js | 46 | reviewed | read in full (schemas); TTL/unique indexes are no-ops in shim |
| functions/backend/models/monetizationRequest.model.js | 28 | reviewed | read in full (schemas); TTL/unique indexes are no-ops in shim |
| functions/backend/models/notification.model.js | 23 | reviewed | read in full (schemas); TTL/unique indexes are no-ops in shim |
| functions/backend/models/otp.model.js | 22 | reviewed | read in full (schemas); TTL/unique indexes are no-ops in shim |
| functions/backend/models/playbackSession.model.js | 23 | reviewed | read in full (schemas); TTL/unique indexes are no-ops in shim |
| functions/backend/models/playList.model.js | 25 | reviewed | read in full (schemas); TTL/unique indexes are no-ops in shim |
| functions/backend/models/premiumPlan.model.js | 19 | reviewed | read in full (schemas); TTL/unique indexes are no-ops in shim |
| functions/backend/models/premiumPlanHistory.model.js | 27 | reviewed | read in full (schemas); TTL/unique indexes are no-ops in shim |
| functions/backend/models/referralHistory.model.js | 52 | reviewed | read in full (schemas); TTL/unique indexes are no-ops in shim |
| functions/backend/models/report.model.js | 23 | reviewed | read in full (schemas); TTL/unique indexes are no-ops in shim |
| functions/backend/models/saveToWatchLater.model.js | 20 | reviewed | read in full (schemas); TTL/unique indexes are no-ops in shim |
| functions/backend/models/searchHistory.model.js | 23 | reviewed | read in full (schemas); TTL/unique indexes are no-ops in shim |
| functions/backend/models/soundCategory.model.js | 18 | reviewed | read in full (schemas); TTL/unique indexes are no-ops in shim |
| functions/backend/models/soundsList.model.js | 21 | reviewed | read in full (schemas); TTL/unique indexes are no-ops in shim |
| functions/backend/models/translation.model.js | 38 | reviewed | read in full (schemas); TTL/unique indexes are no-ops in shim |
| functions/backend/models/user.model.js | 150 | reviewed | read in full (schemas); TTL/unique indexes are no-ops in shim |
| functions/backend/models/userWiseDownload.model.js | 18 | reviewed | read in full (schemas); TTL/unique indexes are no-ops in shim |
| functions/backend/models/userWiseSubscription.model.js | 22 | reviewed | read in full (schemas); TTL/unique indexes are no-ops in shim |
| functions/backend/models/video.model.js | 79 | reviewed | read in full (schemas); TTL/unique indexes are no-ops in shim |
| functions/backend/models/videoComment.model.js | 27 | reviewed | read in full (schemas); TTL/unique indexes are no-ops in shim |
| functions/backend/models/videoUnlock.model.js | 20 | reviewed | read in full (schemas); TTL/unique indexes are no-ops in shim |
| functions/backend/models/walletHistory.model.js | 25 | reviewed | read in full (schemas); TTL/unique indexes are no-ops in shim |
| functions/backend/models/watchHistory.model.js | 25 | reviewed | read in full (schemas); TTL/unique indexes are no-ops in shim |
| functions/backend/models/withdraw.model.js | 19 | reviewed | read in full (schemas); TTL/unique indexes are no-ops in shim |
| functions/backend/models/withDrawRequest.model.js | 35 | reviewed | read in full (schemas); TTL/unique indexes are no-ops in shim |
| functions/backend/README.md | 1 | scan-only | scan-only: not read line by line |
| functions/backend/routes/admin/admin.route.js | 19 | reviewed | parsed + inventoried statically (route-inventory.md); spot-read |
| functions/backend/routes/admin/adRewardCoin.route.js | 19 | reviewed | parsed + inventoried statically (route-inventory.md); spot-read |
| functions/backend/routes/admin/advertise.route.js | 23 | reviewed | parsed + inventoried statically (route-inventory.md); spot-read |
| functions/backend/routes/admin/agency.route.js | 15 | reviewed | parsed + inventoried statically (route-inventory.md); spot-read |
| functions/backend/routes/admin/agencyReport.route.js | 10 | reviewed | parsed + inventoried statically (route-inventory.md); spot-read |
| functions/backend/routes/admin/coinplan.route.js | 36 | reviewed | parsed + inventoried statically (route-inventory.md); spot-read |
| functions/backend/routes/admin/commission.route.js | 11 | reviewed | parsed + inventoried statically (route-inventory.md); spot-read |
| functions/backend/routes/admin/contact.route.js | 24 | reviewed | parsed + inventoried statically (route-inventory.md); spot-read |
| functions/backend/routes/admin/contentModeration.route.js | 17 | reviewed | parsed + inventoried statically (route-inventory.md); spot-read |
| functions/backend/routes/admin/copyrightModeration.route.js | 11 | reviewed | parsed + inventoried statically (route-inventory.md); spot-read |
| functions/backend/routes/admin/creatorFunding.route.js | 9 | reviewed | parsed + inventoried statically (route-inventory.md); spot-read |
| functions/backend/routes/admin/currency.route.js | 18 | reviewed | parsed + inventoried statically (route-inventory.md); spot-read |
| functions/backend/routes/admin/dailyRewardCoin.route.js | 19 | reviewed | parsed + inventoried statically (route-inventory.md); spot-read |
| functions/backend/routes/admin/dashboard.route.js | 20 | reviewed | parsed + inventoried statically (route-inventory.md); spot-read |
| functions/backend/routes/admin/digitalPartner.route.js | 13 | reviewed | parsed + inventoried statically (route-inventory.md); spot-read |
| functions/backend/routes/admin/FAQ.route.js | 23 | reviewed | parsed + inventoried statically (route-inventory.md); spot-read |
| functions/backend/routes/admin/file.route.js | 11 | reviewed | parsed + inventoried statically (route-inventory.md); spot-read |
| functions/backend/routes/admin/franchisePortal.route.js | 16 | reviewed | parsed + inventoried statically (route-inventory.md); spot-read |
| functions/backend/routes/admin/fraud.route.js | 10 | reviewed | parsed + inventoried statically (route-inventory.md); spot-read |
| functions/backend/routes/admin/grievance.route.js | 9 | reviewed | parsed + inventoried statically (route-inventory.md); spot-read |
| functions/backend/routes/admin/index.js | 97 | reviewed | parsed + inventoried statically (route-inventory.md); spot-read |
| functions/backend/routes/admin/language.route.js | 36 | reviewed | parsed + inventoried statically (route-inventory.md); spot-read |
| functions/backend/routes/admin/localBusinessAd.route.js | 10 | reviewed | parsed + inventoried statically (route-inventory.md); spot-read |
| functions/backend/routes/admin/login.route.js | 10 | reviewed | parsed + inventoried statically (route-inventory.md); spot-read |
| functions/backend/routes/admin/mediaAudit.route.js | 9 | reviewed | parsed + inventoried statically (route-inventory.md); spot-read |
| functions/backend/routes/admin/membershipTier.route.js | 13 | reviewed | parsed + inventoried statically (route-inventory.md); spot-read |
| functions/backend/routes/admin/monetizationRequest.route.js | 15 | reviewed | parsed + inventoried statically (route-inventory.md); spot-read |
| functions/backend/routes/admin/partnerPortal.route.js | 13 | reviewed | parsed + inventoried statically (route-inventory.md); spot-read |
| functions/backend/routes/admin/payment.route.js | 12 | reviewed | parsed + inventoried statically (route-inventory.md); spot-read |
| functions/backend/routes/admin/platformConfig.route.js | 11 | reviewed | parsed + inventoried statically (route-inventory.md); spot-read |
| functions/backend/routes/admin/premiumPlan.route.js | 33 | reviewed | parsed + inventoried statically (route-inventory.md); spot-read |
| functions/backend/routes/admin/referral.route.js | 10 | reviewed | parsed + inventoried statically (route-inventory.md); spot-read |
| functions/backend/routes/admin/report.route.js | 17 | reviewed | parsed + inventoried statically (route-inventory.md); spot-read |
| functions/backend/routes/admin/setting.route.js | 37 | reviewed | parsed + inventoried statically (route-inventory.md); spot-read |
| functions/backend/routes/admin/soundCategory.route.js | 23 | reviewed | parsed + inventoried statically (route-inventory.md); spot-read |
| functions/backend/routes/admin/soundList.route.js | 23 | reviewed | parsed + inventoried statically (route-inventory.md); spot-read |
| functions/backend/routes/admin/translation.route.js | 28 | reviewed | parsed + inventoried statically (route-inventory.md); spot-read |
| functions/backend/routes/admin/user.route.js | 55 | reviewed | parsed + inventoried statically (route-inventory.md); spot-read |
| functions/backend/routes/admin/video.route.js | 23 | reviewed | parsed + inventoried statically (route-inventory.md); spot-read |
| functions/backend/routes/admin/videoComment.route.js | 20 | reviewed | parsed + inventoried statically (route-inventory.md); spot-read |
| functions/backend/routes/admin/videoPromotion.route.js | 10 | reviewed | parsed + inventoried statically (route-inventory.md); spot-read |
| functions/backend/routes/admin/withdraw.route.js | 26 | reviewed | parsed + inventoried statically (route-inventory.md); spot-read |
| functions/backend/routes/admin/withDrawalRequest.route.js | 15 | reviewed | parsed + inventoried statically (route-inventory.md); spot-read |
| functions/backend/routes/client/adRewardCoin.route.js | 15 | reviewed | parsed + inventoried statically (route-inventory.md); spot-read |
| functions/backend/routes/client/coinplan.route.js | 25 | reviewed | parsed + inventoried statically (route-inventory.md); spot-read |
| functions/backend/routes/client/contact.route.js | 15 | reviewed | parsed + inventoried statically (route-inventory.md); spot-read |
| functions/backend/routes/client/creatorFunding.route.js | 17 | reviewed | parsed + inventoried statically (route-inventory.md); spot-read |
| functions/backend/routes/client/creatorTier.route.js | 12 | reviewed | parsed + inventoried statically (route-inventory.md); spot-read |
| functions/backend/routes/client/dailyRewardCoin.route.js | 18 | reviewed | parsed + inventoried statically (route-inventory.md); spot-read |
| functions/backend/routes/client/FAQ.route.js | 14 | reviewed | parsed + inventoried statically (route-inventory.md); spot-read |
| functions/backend/routes/client/file.route.js | 12 | reviewed | parsed + inventoried statically (route-inventory.md); spot-read |
| functions/backend/routes/client/grievance.route.js | 14 | reviewed | parsed + inventoried statically (route-inventory.md); spot-read |
| functions/backend/routes/client/index.js | 93 | reviewed | parsed + inventoried statically (route-inventory.md); spot-read |
| functions/backend/routes/client/liveUser.route.js | 22 | reviewed | parsed + inventoried statically (route-inventory.md); spot-read |
| functions/backend/routes/client/localBusinessAd.route.js | 15 | reviewed | parsed + inventoried statically (route-inventory.md); spot-read |
| functions/backend/routes/client/monetizationRequest.route.js | 19 | reviewed | parsed + inventoried statically (route-inventory.md); spot-read |
| functions/backend/routes/client/notification.route.js | 18 | reviewed | parsed + inventoried statically (route-inventory.md); spot-read |
| functions/backend/routes/client/otp.route.js | 20 | reviewed | parsed + inventoried statically (route-inventory.md); spot-read |
| functions/backend/routes/client/partner.route.js | 13 | reviewed | parsed + inventoried statically (route-inventory.md); spot-read |
| functions/backend/routes/client/payment.route.js | 12 | reviewed | parsed + inventoried statically (route-inventory.md); spot-read |
| functions/backend/routes/client/payout.route.js | 12 | reviewed | parsed + inventoried statically (route-inventory.md); spot-read |
| functions/backend/routes/client/peakBoost.route.js | 12 | reviewed | parsed + inventoried statically (route-inventory.md); spot-read |
| functions/backend/routes/client/playbackSession.route.js | 21 | reviewed | parsed + inventoried statically (route-inventory.md); spot-read |
| functions/backend/routes/client/playList.route.js | 21 | reviewed | parsed + inventoried statically (route-inventory.md); spot-read |
| functions/backend/routes/client/premiumPlan.route.js | 29 | reviewed | parsed + inventoried statically (route-inventory.md); spot-read |
| functions/backend/routes/client/report.route.js | 15 | reviewed | parsed + inventoried statically (route-inventory.md); spot-read |
| functions/backend/routes/client/saveToWatchLater.route.js | 18 | reviewed | parsed + inventoried statically (route-inventory.md); spot-read |
| functions/backend/routes/client/security.route.js | 12 | reviewed | parsed + inventoried statically (route-inventory.md); spot-read |
| functions/backend/routes/client/setting.route.js | 14 | reviewed | parsed + inventoried statically (route-inventory.md); spot-read |
| functions/backend/routes/client/soundList.route.js | 14 | reviewed | parsed + inventoried statically (route-inventory.md); spot-read |
| functions/backend/routes/client/tasker.route.js | 12 | reviewed | parsed + inventoried statically (route-inventory.md); spot-read |
| functions/backend/routes/client/taskerTier.route.js | 10 | reviewed | parsed + inventoried statically (route-inventory.md); spot-read |
| functions/backend/routes/client/translation.route.js | 21 | reviewed | parsed + inventoried statically (route-inventory.md); spot-read |
| functions/backend/routes/client/user.route.js | 76 | reviewed | parsed + inventoried statically (route-inventory.md); spot-read |
| functions/backend/routes/client/userTaskReward.route.js | 15 | reviewed | parsed + inventoried statically (route-inventory.md); spot-read |
| functions/backend/routes/client/userWiseDownload.route.js | 18 | reviewed | parsed + inventoried statically (route-inventory.md); spot-read |
| functions/backend/routes/client/userWiseSubscription.route.js | 21 | reviewed | parsed + inventoried statically (route-inventory.md); spot-read |
| functions/backend/routes/client/video.route.js | 96 | reviewed | parsed + inventoried statically (route-inventory.md); spot-read |
| functions/backend/routes/client/videoComment.route.js | 32 | reviewed | parsed + inventoried statically (route-inventory.md); spot-read |
| functions/backend/routes/client/videoPromotion.route.js | 11 | reviewed | parsed + inventoried statically (route-inventory.md); spot-read |
| functions/backend/routes/client/watch.route.js | 12 | reviewed | parsed + inventoried statically (route-inventory.md); spot-read |
| functions/backend/routes/client/watchHistory.route.js | 21 | reviewed | parsed + inventoried statically (route-inventory.md); spot-read |
| functions/backend/routes/client/withdraw.route.js | 14 | reviewed | parsed + inventoried statically (route-inventory.md); spot-read |
| functions/backend/routes/client/withdrawalRequest.route.js | 22 | reviewed | parsed + inventoried statically (route-inventory.md); spot-read |
| functions/backend/routes/cron.route.js | 10 | reviewed | parsed + inventoried statically (route-inventory.md); spot-read |
| functions/backend/routes/index.js | 31 | reviewed | parsed + inventoried statically (route-inventory.md); spot-read |
| functions/backend/routes/internal.route.js | 11 | reviewed | parsed + inventoried statically (route-inventory.md); spot-read |
| functions/backend/routes/payment.route.js | 11 | reviewed | parsed + inventoried statically (route-inventory.md); spot-read |
| functions/backend/routes/stream.route.js | 10 | reviewed | parsed + inventoried statically (route-inventory.md); spot-read |
| functions/backend/server.js | 116 | reviewed | read in full; see findings-draft |
| functions/backend/setting.js | 285 | reviewed | read in full; see findings-draft |
| functions/backend/socket.js | 198 | reviewed | read in full; see findings-draft |
| functions/backend/types/constant.js | 104 | reviewed | read in full; see findings-draft |
| functions/backend/types/tiers.js | 133 | reviewed | read in full; see findings-draft |
| functions/backend/util/accessGate.js | 44 | reviewed | read in full; see findings-draft |
| functions/backend/util/cloudflareStorage.service.js | 168 | reviewed | read in full; see findings-draft |
| functions/backend/util/connection.js | 5 | reviewed | read in full; see findings-draft |
| functions/backend/util/copyright.service.js | 149 | reviewed | read in full; see findings-draft |
| functions/backend/util/creatorFunding.service.js | 125 | reviewed | read in full; see findings-draft |
| functions/backend/util/creatorPass.js | 134 | reviewed | read in full; see findings-draft |
| functions/backend/util/csvParser.js | 15 | reviewed | read in full; see findings-draft |
| functions/backend/util/digitalPartner.service.js | 165 | reviewed | read in full; see findings-draft |
| functions/backend/util/firebaseAdmin.js | 74 | reviewed | read in full; see findings-draft |
| functions/backend/util/firebaseSync.service.js | 64 | reviewed | read in full; see findings-draft |
| functions/backend/util/firestoreDb.service.js | 731 | reviewed | read in full; see findings-draft |
| functions/backend/util/fraudDetection.service.js | 65 | reviewed | read in full; see findings-draft |
| functions/backend/util/generateHistoryUniqueId.js | 23 | reviewed | read in full; see findings-draft |
| functions/backend/util/generateReferralCode.js | 11 | reviewed | read in full; see findings-draft |
| functions/backend/util/generateUniqueId.js | 24 | reviewed | read in full; see findings-draft |
| functions/backend/util/generateUniqueVideoId.js | 18 | reviewed | read in full; see findings-draft |
| functions/backend/util/geofence.service.js | 67 | reviewed | read in full; see findings-draft |
| functions/backend/util/imageStorage.service.js | 78 | reviewed | read in full; see findings-draft |
| functions/backend/util/loadSettings.js | 58 | reviewed | read in full; see findings-draft |
| functions/backend/util/localServerGuard.js | 63 | reviewed | read in full; see findings-draft |
| functions/backend/util/mediaPolicy.js | 42 | reviewed | read in full; see findings-draft |
| functions/backend/util/moderation.service.js | 131 | reviewed | read in full; see findings-draft |
| functions/backend/util/mongooseShim.js | 918 | reviewed | read in full; see findings-draft |
| functions/backend/util/partnerNetwork.service.js | 529 | reviewed | read in full; see findings-draft |
| functions/backend/util/payment.service.js | 131 | reviewed | read in full; see findings-draft |
| functions/backend/util/payoutHold.js | 27 | reviewed | read in full; see findings-draft |
| functions/backend/util/platformConfig.js | 476 | reviewed | read in full; see findings-draft |
| functions/backend/util/privateKey.js | 3 | reviewed | read in full; see findings-draft |
| functions/backend/util/referral.service.js | 461 | reviewed | read in full; see findings-draft |
| functions/backend/util/revenueCommission.service.js | 80 | reviewed | read in full; see findings-draft |
| functions/backend/util/revenueSplit.service.js | 267 | reviewed | read in full; see findings-draft |
| functions/backend/util/rewardEngine.js | 580 | reviewed | read in full; see findings-draft |
| functions/backend/util/safeUser.js | 18 | reviewed | read in full; see findings-draft |
| functions/backend/util/scheduler.js | 8 | reviewed | read in full; see findings-draft |
| functions/backend/util/storageHelper.js | 120 | reviewed | read in full; see findings-draft |
| functions/backend/util/systemConfig.service.js | 228 | reviewed | read in full; see findings-draft |
| functions/backend/util/taskSecurity.service.js | 225 | reviewed | read in full; see findings-draft |
| functions/backend/util/uploadGrants.js | 96 | reviewed | read in full; see findings-draft |
| functions/backend/util/uploadMiddleware.js | 24 | reviewed | read in full; see findings-draft |
| functions/backend/util/validateEnv.js | 34 | reviewed | read in full; see findings-draft |
| functions/backend/util/versionUtils.js | 30 | reviewed | read in full; see findings-draft |
| functions/backend/util/videoPipeline.service.js | 181 | reviewed | read in full; see findings-draft |
| functions/backend/util/videoVisibility.js | 90 | reviewed | read in full; see findings-draft |
| functions/backend/util/vpnDetection.service.js | 77 | reviewed | read in full; see findings-draft |
| functions/backend/util/watchLedger.service.js | 201 | reviewed | read in full; see findings-draft |
| functions/backend/util/withdrawalLedger.js | 143 | reviewed | read in full; see findings-draft |
| functions/backend/util/zegoAssistant.js | 114 | reviewed | read in full; see findings-draft |
| functions/index.js | 79 | reviewed | read in full; see findings-draft |
| functions/package.json | 45 | reviewed | read in full; see findings-draft |
| HANDOVER.md | 348 | partial | read the relevant sections only (signing, ids, deps via grep) |
| local-dev/config.js | 40 | partial | read excerpts (ports, accounts, launch env); demo-only |
| local-dev/firebase.json | 14 | partial | read excerpts (ports, accounts, launch env); demo-only |
| local-dev/firestore.rules | 11 | partial | read excerpts (ports, accounts, launch env); demo-only |
| local-dev/README.md | 82 | reviewed | read in full; findings-draft-15 |
| local-dev/seed.js | 268 | partial | read excerpts (ports, accounts, launch env); demo-only |
| local-dev/start.js | 268 | partial | read excerpts (ports, accounts, launch env); demo-only |
| package.json | 44 | reviewed | read in full; see findings-draft |
| scripts/audit-source.cjs | 36 | reviewed | read in full |
| scripts/build-consumer-apk.ps1 | 58 | reviewed | read in full (build script; refuses private keys; requires key.properties) |
| scripts/build-consumer-web.ps1 | 60 | reviewed | read in full (build script; refuses private keys; requires key.properties) |
| scripts/generate_branding_assets.py | 331 | partial | build-time asset generators (python), not runtime; skimmed header only |
| scripts/generate_verification_visuals.py | 366 | partial | build-time asset generators (python), not runtime; skimmed header only |
| storage.rules | 21 | reviewed | read in full; see findings-draft |
| tests/api-liveness.test.cjs | 29 | partial | check titles/intent read via grep (115 checks pass); source not read line by line |
| tests/emulator/.gitignore | 2 | scan-only | scan-only: not read line by line |
| tests/emulator/firebase.json | 9 | scan-only | scan-only: not read line by line |
| tests/emulator/harness.cjs | 140 | partial | check titles/intent read via grep (115 checks pass); source not read line by line |
| tests/emulator/run.cjs | 29 | partial | check titles/intent read via grep (115 checks pass); source not read line by line |
| tests/emulator/suites/01-phase1.cjs | 236 | partial | check titles/intent read via grep (115 checks pass); source not read line by line |
| tests/emulator/suites/02-phase2.cjs | 182 | partial | check titles/intent read via grep (115 checks pass); source not read line by line |
| tests/emulator/suites/03-privacy-auth.cjs | 158 | partial | check titles/intent read via grep (115 checks pass); source not read line by line |
| tests/emulator/suites/04-peakboost.cjs | 127 | partial | check titles/intent read via grep (115 checks pass); source not read line by line |
| tests/emulator/suites/05-payments.cjs | 168 | partial | check titles/intent read via grep (115 checks pass); source not read line by line |
| tests/emulator/suites/06-withdrawals.cjs | 96 | partial | check titles/intent read via grep (115 checks pass); source not read line by line |
| tests/emulator/suites/07-rewards.cjs | 87 | partial | check titles/intent read via grep (115 checks pass); source not read line by line |
| tests/emulator/suites/08-media.cjs | 83 | partial | check titles/intent read via grep (115 checks pass); source not read line by line |
| tests/emulator/suites/09-requirements.cjs | 55 | partial | check titles/intent read via grep (115 checks pass); source not read line by line |
| tests/emulator/suites/10-web-tasking.cjs | 188 | partial | check titles/intent read via grep (115 checks pass); source not read line by line |
| tests/helpers/loadModule.cjs | 19 | partial | check titles/intent read via grep (115 checks pass); source not read line by line |
| tests/localServerGuard.test.cjs | 39 | partial | check titles/intent read via grep (115 checks pass); source not read line by line |
| tests/media.test.cjs | 140 | partial | check titles/intent read via grep (115 checks pass); source not read line by line |
| tests/webhooks.test.cjs | 73 | partial | check titles/intent read via grep (115 checks pass); source not read line by line |
| vercel.json | 39 | reviewed | read in full; see findings-draft |
| worker/fingerprintWorker.js | 155 | reviewed | read in full; findings-draft-15 |
| worker/README.md | 36 | reviewed | read in full; findings-draft-15 |
| YOUPEAK_AUDIT_FIX_LOG.txt | 206 | reviewed | earlier-audit/context document; skimmed for claims, not a defect source |
| YOUPEAK_FULL_PROJECT_AUDIT.txt | 567 | reviewed | earlier-audit/context document; skimmed for claims, not a defect source |
| YOUPEAK_PHASE2_REMEDIATION_REPORT.txt | 461 | reviewed | earlier-audit/context document; skimmed for claims, not a defect source |
| YOUPEAK_REQUIREMENTS_MATRIX.txt | 230 | reviewed | earlier-audit/context document; skimmed for claims, not a defect source |
| youpeak/.gitignore | 47 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/.metadata | 46 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/analysis_options.yaml | 30 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/android/.gitignore | 14 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/android/app/build.gradle | 118 | partial | read the relevant sections only (signing, ids, deps via grep) |
| youpeak/android/app/src/main/AndroidManifest.xml | 177 | reviewed | read in full |
| youpeak/design/prompt_inventory.md | 1473 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/design/tools/export_reaction_asset.cjs | 40 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/design/tools/generate-glyphs.cjs | 279 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/devtools_options.yaml | 2 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/firebase.json | 1 | reviewed | read in full |
| youpeak/ios/.gitignore | 35 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/ios/Runner/Assets.xcassets/LaunchImage.imageset/README.md | 5 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/ios/Runner/Info.plist | 110 | reviewed | read in full |
| youpeak/lib/core/ads/google_ad_helper.dart | 59 | reviewed | read in full (ads helpers, constants, config) |
| youpeak/lib/core/ads/google_full_native_ad.dart | 87 | reviewed | read in full (ads helpers, constants, config) |
| youpeak/lib/core/ads/google_large_native_ad.dart | 76 | reviewed | read in full (ads helpers, constants, config) |
| youpeak/lib/core/ads/google_reward_ad.dart | 71 | reviewed | read in full; see findings-draft-11 |
| youpeak/lib/core/ads/google_small_native_ad.dart | 76 | reviewed | read in full (ads helpers, constants, config) |
| youpeak/lib/core/ads/google_video_ad.dart | 1039 | reviewed | read in full (ads helpers, constants, config) |
| youpeak/lib/core/ads/load_multiple_ads.dart | 87 | reviewed | read in full (ads helpers, constants, config) |
| youpeak/lib/core/assets/app_icons.dart | 257 | reviewed | read in full (ads helpers, constants, config) |
| youpeak/lib/core/assets/app_visuals.dart | 132 | reviewed | read in full (ads helpers, constants, config) |
| youpeak/lib/core/config/local_emulators.dart | 36 | reviewed | read in full (ads helpers, constants, config) |
| youpeak/lib/core/config/size_config.dart | 21 | reviewed | read in full (ads helpers, constants, config) |
| youpeak/lib/core/constants/app_constant.dart | 229 | reviewed | read in full (ads helpers, constants, config) |
| youpeak/lib/core/constants/app_string.dart | 538 | partial | first ~1,200 lines read (string keys); rest is constants |
| youpeak/lib/core/deep_link/config/easy_deep_link_config.dart | 21 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/lib/core/deep_link/config/easy_deep_link_manager.dart | 95 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/lib/core/deep_link/config/easy_deep_links.dart | 26 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/lib/core/deep_link/referral_link.dart | 47 | reviewed | read in full; see findings-draft-11 |
| youpeak/lib/core/deep_link/services/deep_link_services.dart | 126 | reviewed | read in full; see findings-draft-11 |
| youpeak/lib/core/deep_link/share_manager/pure_flutter_share_service.dart | 88 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/lib/core/deep_link/share_manager/share_card_generator.dart | 173 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/lib/core/deep_link/share_manager/share_manager.dart | 64 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/lib/core/file_upload/convert_channel_image_api.dart | 44 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/lib/core/file_upload/convert_video_api.dart | 8 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/lib/core/file_upload/convert_video_image_api.dart | 48 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/lib/core/file_upload/direct_upload_video_api.dart | 61 | reviewed | read in full; findings-draft-12/13 |
| youpeak/lib/core/file_upload/file_upload_model.dart | 47 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/lib/core/localization/languages/language_ar.dart | 399 | scan-only | scan-only: key coverage and English-identical analysis by i18n-coverage.cjs (122 missing keys per language); translations not linguistically reviewed |
| youpeak/lib/core/localization/languages/language_bn.dart | 404 | scan-only | scan-only: key coverage and English-identical analysis by i18n-coverage.cjs (122 missing keys per language); translations not linguistically reviewed |
| youpeak/lib/core/localization/languages/language_de.dart | 434 | scan-only | scan-only: key coverage and English-identical analysis by i18n-coverage.cjs (122 missing keys per language); translations not linguistically reviewed |
| youpeak/lib/core/localization/languages/language_en.dart | 515 | scan-only | scan-only: key coverage and English-identical analysis by i18n-coverage.cjs (122 missing keys per language); translations not linguistically reviewed |
| youpeak/lib/core/localization/languages/language_es.dart | 404 | scan-only | scan-only: key coverage and English-identical analysis by i18n-coverage.cjs (122 missing keys per language); translations not linguistically reviewed |
| youpeak/lib/core/localization/languages/language_fr.dart | 404 | scan-only | scan-only: key coverage and English-identical analysis by i18n-coverage.cjs (122 missing keys per language); translations not linguistically reviewed |
| youpeak/lib/core/localization/languages/language_hi.dart | 404 | scan-only | scan-only: key coverage and English-identical analysis by i18n-coverage.cjs (122 missing keys per language); translations not linguistically reviewed |
| youpeak/lib/core/localization/languages/language_id.dart | 404 | scan-only | scan-only: key coverage and English-identical analysis by i18n-coverage.cjs (122 missing keys per language); translations not linguistically reviewed |
| youpeak/lib/core/localization/languages/language_it.dart | 404 | scan-only | scan-only: key coverage and English-identical analysis by i18n-coverage.cjs (122 missing keys per language); translations not linguistically reviewed |
| youpeak/lib/core/localization/languages/language_ja.dart | 400 | scan-only | scan-only: key coverage and English-identical analysis by i18n-coverage.cjs (122 missing keys per language); translations not linguistically reviewed |
| youpeak/lib/core/localization/languages/language_ko.dart | 400 | scan-only | scan-only: key coverage and English-identical analysis by i18n-coverage.cjs (122 missing keys per language); translations not linguistically reviewed |
| youpeak/lib/core/localization/languages/language_mr.dart | 404 | scan-only | scan-only: key coverage and English-identical analysis by i18n-coverage.cjs (122 missing keys per language); translations not linguistically reviewed |
| youpeak/lib/core/localization/languages/language_pt.dart | 404 | scan-only | scan-only: key coverage and English-identical analysis by i18n-coverage.cjs (122 missing keys per language); translations not linguistically reviewed |
| youpeak/lib/core/localization/languages/language_ru.dart | 404 | scan-only | scan-only: key coverage and English-identical analysis by i18n-coverage.cjs (122 missing keys per language); translations not linguistically reviewed |
| youpeak/lib/core/localization/languages/language_sw.dart | 404 | scan-only | scan-only: key coverage and English-identical analysis by i18n-coverage.cjs (122 missing keys per language); translations not linguistically reviewed |
| youpeak/lib/core/localization/languages/language_ta.dart | 405 | scan-only | scan-only: key coverage and English-identical analysis by i18n-coverage.cjs (122 missing keys per language); translations not linguistically reviewed |
| youpeak/lib/core/localization/languages/language_te.dart | 404 | scan-only | scan-only: key coverage and English-identical analysis by i18n-coverage.cjs (122 missing keys per language); translations not linguistically reviewed |
| youpeak/lib/core/localization/languages/language_tr.dart | 404 | scan-only | scan-only: key coverage and English-identical analysis by i18n-coverage.cjs (122 missing keys per language); translations not linguistically reviewed |
| youpeak/lib/core/localization/languages/language_ur.dart | 404 | scan-only | scan-only: key coverage and English-identical analysis by i18n-coverage.cjs (122 missing keys per language); translations not linguistically reviewed |
| youpeak/lib/core/localization/languages/language_zh_cn.dart | 399 | scan-only | scan-only: key coverage and English-identical analysis by i18n-coverage.cjs (122 missing keys per language); translations not linguistically reviewed |
| youpeak/lib/core/localization/locale_constant.dart | 17 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/lib/core/localization/localization_service.dart | 286 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/lib/core/localization/localizations_delegate.dart | 172 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/lib/core/localization/models/language_info.dart | 31 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/lib/core/localization/models/language_model.dart | 65 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/lib/core/localization/models/localization_version.dart | 31 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/lib/core/membership/membership_portal.dart | 39 | reviewed | read in full; findings-draft-12/13 |
| youpeak/lib/core/network/app_api_client.dart | 102 | reviewed | read in full; see findings-draft-11 |
| youpeak/lib/core/network/app_session.dart | 80 | reviewed | read in full; see findings-draft-11 |
| youpeak/lib/core/notification/local_notification_services.dart | 138 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/lib/core/notification/local_notification_storage.dart | 41 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/lib/core/payment/in_app_purchase/iap_callback.dart | 12 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/lib/core/payment/in_app_purchase/iap_receipt_data.dart | 262 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/lib/core/payment/in_app_purchase/in_app_purchase_helper.dart | 428 | partial | read the purchase/restore/verify sections (IAP-1) |
| youpeak/lib/core/payment/payment_api.dart | 77 | reviewed | read in full; see findings-draft-11 |
| youpeak/lib/core/payment/razorpay/razorpay_service_mobile.dart | 58 | reviewed | read in full; findings-draft-12/13 |
| youpeak/lib/core/payment/razorpay/razorpay_service_web.dart | 122 | reviewed | read in full; see findings-draft-11 |
| youpeak/lib/core/payment/razorpay/razorpay_service.dart | 6 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/lib/core/payment/razorpay/razorpay_success.dart | 10 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/lib/core/platform/app_layout.dart | 571 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/lib/core/platform/browser_download_stub.dart | 3 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/lib/core/platform/browser_download_web.dart | 43 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/lib/core/platform/browser_download.dart | 4 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/lib/core/platform/browser_fullscreen_stub.dart | 6 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/lib/core/platform/browser_fullscreen_web.dart | 27 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/lib/core/platform/browser_fullscreen.dart | 4 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/lib/core/platform/browser_url_stub.dart | 2 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/lib/core/platform/browser_url_web.dart | 21 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/lib/core/platform/browser_url.dart | 3 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/lib/core/platform/device_identity.dart | 24 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/lib/core/platform/local_media.dart | 70 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/lib/core/platform/platform_info.dart | 22 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/lib/core/platform/platform_pip_switcher.dart | 18 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/lib/core/platform/video_frame_stub.dart | 3 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/lib/core/platform/video_frame_web.dart | 68 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/lib/core/platform/video_frame.dart | 6 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/lib/core/platform/web_video_fullscreen.dart | 31 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/lib/core/platform/wheel_page_turner.dart | 161 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/lib/core/providers/app_provider_container.dart | 10 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/lib/core/security/data/device_signal_collector.dart | 114 | reviewed | read via condensed dump of all Flutter API/data files (83); see findings-draft-11/13/16/17 |
| youpeak/lib/core/security/data/root_detector.dart | 89 | reviewed | read via condensed dump of all Flutter API/data files (83); see findings-draft-11/13/16/17 |
| youpeak/lib/core/security/domain/security_signals.dart | 202 | reviewed | read in full; see findings-draft-11 |
| youpeak/lib/core/security/presentation/task_lock_gate.dart | 241 | scan-only | scan-only: UI; analyzer + pattern greps (force-unwraps, swallowed errors, semantics, hard-coded English); deployed/web screens exercised only for onboarding/login |
| youpeak/lib/core/security/security_service.dart | 151 | reviewed | read in full; see findings-draft-11 |
| youpeak/lib/core/services/branch_io_services.dart | 127 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/lib/core/services/convert_to_network.dart | 47 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/lib/core/services/permission_handler.dart | 17 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/lib/core/services/permission_service.dart | 44 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/lib/core/settings/admin_settings_api.dart | 38 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/lib/core/settings/admin_settings_model.dart | 417 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/lib/core/settings/app_settings.dart | 147 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/lib/core/storage/database/database.dart | 224 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/lib/core/storage/database/download_history_database.dart | 47 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/lib/core/storage/database/search_history_database.dart | 32 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/lib/core/storage/database/watch_history_database.dart | 47 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/lib/core/storage/prefrens.dart | 105 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/lib/core/system_config/data/system_config_repository.dart | 53 | reviewed | read via condensed dump of all Flutter API/data files (83); see findings-draft-11/13/16/17 |
| youpeak/lib/core/system_config/domain/system_configs.dart | 438 | reviewed | read in full; findings-draft-12/13 |
| youpeak/lib/core/system_config/presentation/system_configs_provider.dart | 50 | scan-only | scan-only: UI; analyzer + pattern greps (force-unwraps, swallowed errors, semantics, hard-coded English); deployed/web screens exercised only for onboarding/login |
| youpeak/lib/core/theme/app_color.dart | 69 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/lib/core/theme/app_style.dart | 162 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/lib/core/theme/theme_services.dart | 47 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/lib/core/theme/theme_view.dart | 61 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/lib/core/utils/custom_address_to_code_converter.dart | 27 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/lib/core/utils/custom_check_internet.dart | 30 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/lib/core/utils/custom_country_picker.dart | 49 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/lib/core/utils/custom_download.dart | 59 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/lib/core/utils/custom_format_date_to_day.dart | 18 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/lib/core/utils/custom_format_date.dart | 9 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/lib/core/utils/custom_format_number.dart | 23 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/lib/core/utils/custom_format_timer.dart | 31 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/lib/core/utils/custom_get_current_week_date.dart | 30 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/lib/core/utils/custom_image_picker.dart | 26 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/lib/core/utils/custom_range_picker.dart | 32 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/lib/core/utils/custom_toast.dart | 41 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/lib/core/utils/custom_video_picker.dart | 59 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/lib/core/utils/custom_video_size.dart | 9 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/lib/core/utils/custom_video_time.dart | 26 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/lib/core/utils/custom_watch_time.dart | 99 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/lib/core/utils/money_format.dart | 23 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/lib/core/utils/utils.dart | 14 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/lib/features/access_gate/presentation/activation_lock_view.dart | 122 | reviewed | read in full; findings-draft-12/13 |
| youpeak/lib/features/auth/api/forgot_password_send_otp_api.dart | 35 | reviewed | read via condensed dump of all Flutter API/data files (83); see findings-draft-11/13/16/17 |
| youpeak/lib/features/auth/api/login_api.dart | 35 | reviewed | read via condensed dump of all Flutter API/data files (83); see findings-draft-11/13/16/17 |
| youpeak/lib/features/auth/api/set_password_api.dart | 43 | reviewed | read via condensed dump of all Flutter API/data files (83); see findings-draft-11/13/16/17 |
| youpeak/lib/features/auth/api/sign_up_api.dart | 67 | reviewed | read via condensed dump of all Flutter API/data files (83); see findings-draft-11/13/16/17 |
| youpeak/lib/features/auth/api/sign_up_send_otp_api.dart | 36 | reviewed | read via condensed dump of all Flutter API/data files (83); see findings-draft-11/13/16/17 |
| youpeak/lib/features/auth/api/verification_otp_api.dart | 41 | reviewed | read via condensed dump of all Flutter API/data files (83); see findings-draft-11/13/16/17 |
| youpeak/lib/features/auth/model/login_model.dart | 48 | scan-only | scan-only: JSON model classes; covered by dart analyzer (0 errors) and sampled unit tests; not read line by line |
| youpeak/lib/features/auth/model/sign_up_model.dart | 359 | scan-only | scan-only: JSON model classes; covered by dart analyzer (0 errors) and sampled unit tests; not read line by line |
| youpeak/lib/features/auth/phone/data/phone_auth_service.dart | 122 | reviewed | read via condensed dump of all Flutter API/data files (83); see findings-draft-11/13/16/17 |
| youpeak/lib/features/auth/phone/data/phone_login_repository.dart | 46 | reviewed | read via condensed dump of all Flutter API/data files (83); see findings-draft-11/13/16/17 |
| youpeak/lib/features/auth/phone/presentation/phone_login_view.dart | 244 | scan-only | scan-only: UI; analyzer + pattern greps (force-unwraps, swallowed errors, semantics, hard-coded English); deployed/web screens exercised only for onboarding/login |
| youpeak/lib/features/auth/service/google_login.dart | 74 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/lib/features/auth/service/google_sign_in_flow.dart | 109 | reviewed | read in full; see findings-draft-11 |
| youpeak/lib/features/auth/service/post_login_router.dart | 33 | reviewed | read in full; see findings-draft-11 |
| youpeak/lib/features/auth/view/create_new_password_view.dart | 162 | scan-only | scan-only: UI; analyzer + pattern greps (force-unwraps, swallowed errors, semantics, hard-coded English); deployed/web screens exercised only for onboarding/login |
| youpeak/lib/features/auth/view/fill_profile_view.dart | 488 | scan-only | scan-only: UI; analyzer + pattern greps (force-unwraps, swallowed errors, semantics, hard-coded English); deployed/web screens exercised only for onboarding/login |
| youpeak/lib/features/auth/view/forget_password_view.dart | 344 | scan-only | scan-only: UI; analyzer + pattern greps (force-unwraps, swallowed errors, semantics, hard-coded English); deployed/web screens exercised only for onboarding/login |
| youpeak/lib/features/auth/view/forgot_password_otp_view.dart | 155 | scan-only | scan-only: UI; analyzer + pattern greps (force-unwraps, swallowed errors, semantics, hard-coded English); deployed/web screens exercised only for onboarding/login |
| youpeak/lib/features/auth/view/lets_you_in_view.dart | 341 | scan-only | scan-only: UI; analyzer + pattern greps (force-unwraps, swallowed errors, semantics, hard-coded English); deployed/web screens exercised only for onboarding/login |
| youpeak/lib/features/auth/view/login_view.dart | 486 | scan-only | scan-only: UI; analyzer + pattern greps (force-unwraps, swallowed errors, semantics, hard-coded English); deployed/web screens exercised only for onboarding/login |
| youpeak/lib/features/auth/view/sign_up_otp_view.dart | 160 | scan-only | scan-only: UI; analyzer + pattern greps (force-unwraps, swallowed errors, semantics, hard-coded English); deployed/web screens exercised only for onboarding/login |
| youpeak/lib/features/auth/view/sign_up_view.dart | 444 | scan-only | scan-only: UI; analyzer + pattern greps (force-unwraps, swallowed errors, semantics, hard-coded English); deployed/web screens exercised only for onboarding/login |
| youpeak/lib/features/bites/api/get_shorts_video_api.dart | 43 | reviewed | read via condensed dump of all Flutter API/data files (83); see findings-draft-11/13/16/17 |
| youpeak/lib/features/bites/api/get_sound_api.dart | 39 | reviewed | read via condensed dump of all Flutter API/data files (83); see findings-draft-11/13/16/17 |
| youpeak/lib/features/bites/api/preview_shorts_api.dart | 77 | reviewed | read via condensed dump of all Flutter API/data files (83); see findings-draft-11/13/16/17 |
| youpeak/lib/features/bites/controller/create_short_controller.dart | 345 | reviewed | read via condensed dump (imports/logs stripped); see findings-draft-11/13/15/16/17 |
| youpeak/lib/features/bites/controller/nav_shorts_controller.dart | 159 | reviewed | read via condensed dump (imports/logs stripped); see findings-draft-11/13/15/16/17 |
| youpeak/lib/features/bites/controller/preview_shorts_controller.dart | 92 | reviewed | read via condensed dump (imports/logs stripped); see findings-draft-11/13/15/16/17 |
| youpeak/lib/features/bites/model/get_shorts_video_model.dart | 150 | scan-only | scan-only: JSON model classes; covered by dart analyzer (0 errors) and sampled unit tests; not read line by line |
| youpeak/lib/features/bites/model/get_sound_model.dart | 194 | scan-only | scan-only: JSON model classes; covered by dart analyzer (0 errors) and sampled unit tests; not read line by line |
| youpeak/lib/features/bites/view/bites_desktop.dart | 157 | scan-only | scan-only: UI; analyzer + pattern greps (force-unwraps, swallowed errors, semantics, hard-coded English); deployed/web screens exercised only for onboarding/login |
| youpeak/lib/features/bites/view/create_short_view.dart | 357 | scan-only | scan-only: UI; analyzer + pattern greps (force-unwraps, swallowed errors, semantics, hard-coded English); deployed/web screens exercised only for onboarding/login |
| youpeak/lib/features/bites/view/nav_shorts_details_view.dart | 1300 | scan-only | scan-only: UI; analyzer + pattern greps (force-unwraps, swallowed errors, semantics, hard-coded English); deployed/web screens exercised only for onboarding/login |
| youpeak/lib/features/bites/view/nav_shorts_view.dart | 141 | scan-only | scan-only: UI; analyzer + pattern greps (force-unwraps, swallowed errors, semantics, hard-coded English); deployed/web screens exercised only for onboarding/login |
| youpeak/lib/features/bites/view/preview_shorts_video.dart | 874 | scan-only | scan-only: UI; analyzer + pattern greps (force-unwraps, swallowed errors, semantics, hard-coded English); deployed/web screens exercised only for onboarding/login |
| youpeak/lib/features/bites/view/preview_shorts_view.dart | 92 | scan-only | scan-only: UI; analyzer + pattern greps (force-unwraps, swallowed errors, semantics, hard-coded English); deployed/web screens exercised only for onboarding/login |
| youpeak/lib/features/bites/widget/add_sound_bottom_sheet.dart | 91 | scan-only | scan-only: UI; analyzer + pattern greps (force-unwraps, swallowed errors, semantics, hard-coded English); deployed/web screens exercised only for onboarding/login |
| youpeak/lib/features/channel/api/channel_about_api.dart | 35 | reviewed | read via condensed dump of all Flutter API/data files (83); see findings-draft-11/13/16/17 |
| youpeak/lib/features/channel/api/channel_home_api.dart | 81 | reviewed | read via condensed dump of all Flutter API/data files (83); see findings-draft-11/13/16/17 |
| youpeak/lib/features/channel/api/channel_playlist_api.dart | 44 | reviewed | read via condensed dump of all Flutter API/data files (83); see findings-draft-11/13/16/17 |
| youpeak/lib/features/channel/api/check_channel_name_api.dart | 46 | reviewed | read via condensed dump of all Flutter API/data files (83); see findings-draft-11/13/16/17 |
| youpeak/lib/features/channel/api/create_channel_api.dart | 51 | reviewed | read via condensed dump of all Flutter API/data files (83); see findings-draft-11/13/16/17 |
| youpeak/lib/features/channel/api/edit_subscription_plan_api.dart | 42 | reviewed | read via condensed dump of all Flutter API/data files (83); see findings-draft-11/13/16/17 |
| youpeak/lib/features/channel/api/get_channel_video_api.dart | 51 | reviewed | read via condensed dump of all Flutter API/data files (83); see findings-draft-11/13/16/17 |
| youpeak/lib/features/channel/controller/get_play_list_controller.dart | 117 | reviewed | read via condensed dump (imports/logs stripped); see findings-draft-11/13/15/16/17 |
| youpeak/lib/features/channel/controller/preview_play_list_controller.dart | 58 | reviewed | read via condensed dump (imports/logs stripped); see findings-draft-11/13/15/16/17 |
| youpeak/lib/features/channel/controller/subscription_plan_controller.dart | 71 | reviewed | read via condensed dump (imports/logs stripped); see findings-draft-11/13/15/16/17 |
| youpeak/lib/features/channel/controller/your_channel_controller.dart | 464 | reviewed | read via condensed dump (imports/logs stripped); see findings-draft-11/13/15/16/17 |
| youpeak/lib/features/channel/model/channel_about_model.dart | 220 | scan-only | scan-only: JSON model classes; covered by dart analyzer (0 errors) and sampled unit tests; not read line by line |
| youpeak/lib/features/channel/model/channel_home_model.dart | 141 | scan-only | scan-only: JSON model classes; covered by dart analyzer (0 errors) and sampled unit tests; not read line by line |
| youpeak/lib/features/channel/model/channel_playlist_model.dart | 96 | scan-only | scan-only: JSON model classes; covered by dart analyzer (0 errors) and sampled unit tests; not read line by line |
| youpeak/lib/features/channel/model/get_channel_video_model.dart | 102 | scan-only | scan-only: JSON model classes; covered by dart analyzer (0 errors) and sampled unit tests; not read line by line |
| youpeak/lib/features/channel/model/get_play_list_model.dart | 114 | scan-only | scan-only: JSON model classes; covered by dart analyzer (0 errors) and sampled unit tests; not read line by line |
| youpeak/lib/features/channel/view/channel_about_tab_view.dart | 148 | scan-only | scan-only: UI; analyzer + pattern greps (force-unwraps, swallowed errors, semantics, hard-coded English); deployed/web screens exercised only for onboarding/login |
| youpeak/lib/features/channel/view/channel_home_tab_view.dart | 497 | scan-only | scan-only: UI; analyzer + pattern greps (force-unwraps, swallowed errors, semantics, hard-coded English); deployed/web screens exercised only for onboarding/login |
| youpeak/lib/features/channel/view/channel_playlist_tab_view.dart | 164 | scan-only | scan-only: UI; analyzer + pattern greps (force-unwraps, swallowed errors, semantics, hard-coded English); deployed/web screens exercised only for onboarding/login |
| youpeak/lib/features/channel/view/channel_video_tab_view.dart | 273 | scan-only | scan-only: UI; analyzer + pattern greps (force-unwraps, swallowed errors, semantics, hard-coded English); deployed/web screens exercised only for onboarding/login |
| youpeak/lib/features/channel/view/create_channel_screen.dart | 243 | scan-only | scan-only: UI; analyzer + pattern greps (force-unwraps, swallowed errors, semantics, hard-coded English); deployed/web screens exercised only for onboarding/login |
| youpeak/lib/features/channel/view/create_channel_view.dart | 225 | scan-only | scan-only: UI; analyzer + pattern greps (force-unwraps, swallowed errors, semantics, hard-coded English); deployed/web screens exercised only for onboarding/login |
| youpeak/lib/features/channel/view/get_playList_page.dart | 184 | scan-only | scan-only: UI; analyzer + pattern greps (force-unwraps, swallowed errors, semantics, hard-coded English); deployed/web screens exercised only for onboarding/login |
| youpeak/lib/features/channel/view/preview_playlist_view.dart | 362 | scan-only | scan-only: UI; analyzer + pattern greps (force-unwraps, swallowed errors, semantics, hard-coded English); deployed/web screens exercised only for onboarding/login |
| youpeak/lib/features/channel/view/subscription_plan_view.dart | 127 | scan-only | scan-only: UI; analyzer + pattern greps (force-unwraps, swallowed errors, semantics, hard-coded English); deployed/web screens exercised only for onboarding/login |
| youpeak/lib/features/channel/view/your_channel_view.dart | 640 | scan-only | scan-only: UI; analyzer + pattern greps (force-unwraps, swallowed errors, semantics, hard-coded English); deployed/web screens exercised only for onboarding/login |
| youpeak/lib/features/channel/widget/channel_profile_shimmer_ui.dart | 49 | scan-only | scan-only: UI; analyzer + pattern greps (force-unwraps, swallowed errors, semantics, hard-coded English); deployed/web screens exercised only for onboarding/login |
| youpeak/lib/features/channel/widget/subscription_plan_widget.dart | 50 | scan-only | scan-only: UI; analyzer + pattern greps (force-unwraps, swallowed errors, semantics, hard-coded English); deployed/web screens exercised only for onboarding/login |
| youpeak/lib/features/coins/api/convert_coin_api.dart | 34 | reviewed | read via condensed dump of all Flutter API/data files (83); see findings-draft-11/13/16/17 |
| youpeak/lib/features/coins/api/fetch_buy_coin_history_api.dart | 45 | reviewed | read via condensed dump of all Flutter API/data files (83); see findings-draft-11/13/16/17 |
| youpeak/lib/features/coins/api/fetch_coin_plan_api.dart | 35 | reviewed | read via condensed dump of all Flutter API/data files (83); see findings-draft-11/13/16/17 |
| youpeak/lib/features/coins/api/get_coin_history_api.dart | 41 | reviewed | read via condensed dump of all Flutter API/data files (83); see findings-draft-11/13/16/17 |
| youpeak/lib/features/coins/api/get_my_coin_api.dart | 36 | reviewed | read via condensed dump of all Flutter API/data files (83); see findings-draft-11/13/16/17 |
| youpeak/lib/features/coins/api/purchase_coin_plan_api.dart | 46 | reviewed | read via condensed dump of all Flutter API/data files (83); see findings-draft-11/13/16/17 |
| youpeak/lib/features/coins/controller/buy_coin_controller.dart | 60 | reviewed | read via condensed dump (imports/logs stripped); see findings-draft-11/13/15/16/17 |
| youpeak/lib/features/coins/controller/buy_coin_history_controller.dart | 91 | reviewed | read via condensed dump (imports/logs stripped); see findings-draft-11/13/15/16/17 |
| youpeak/lib/features/coins/controller/coin_history_controller.dart | 66 | reviewed | read via condensed dump (imports/logs stripped); see findings-draft-11/13/15/16/17 |
| youpeak/lib/features/coins/controller/convert_coin_controller.dart | 104 | reviewed | read in full; see findings-draft-11 |
| youpeak/lib/features/coins/model/convert_coin_model.dart | 47 | scan-only | scan-only: JSON model classes; covered by dart analyzer (0 errors) and sampled unit tests; not read line by line |
| youpeak/lib/features/coins/model/fetch_buy_coin_history_model.dart | 129 | scan-only | scan-only: JSON model classes; covered by dart analyzer (0 errors) and sampled unit tests; not read line by line |
| youpeak/lib/features/coins/model/fetch_coin_plan_model.dart | 155 | scan-only | scan-only: JSON model classes; covered by dart analyzer (0 errors) and sampled unit tests; not read line by line |
| youpeak/lib/features/coins/model/get_coin_history_model.dart | 94 | scan-only | scan-only: JSON model classes; covered by dart analyzer (0 errors) and sampled unit tests; not read line by line |
| youpeak/lib/features/coins/model/get_my_coin_model.dart | 110 | scan-only | scan-only: JSON model classes; covered by dart analyzer (0 errors) and sampled unit tests; not read line by line |
| youpeak/lib/features/coins/model/purchase_coin_plan_model.dart | 39 | scan-only | scan-only: JSON model classes; covered by dart analyzer (0 errors) and sampled unit tests; not read line by line |
| youpeak/lib/features/coins/view/buy_coin_history_view.dart | 311 | scan-only | scan-only: UI; analyzer + pattern greps (force-unwraps, swallowed errors, semantics, hard-coded English); deployed/web screens exercised only for onboarding/login |
| youpeak/lib/features/coins/view/buy_coin_view.dart | 206 | scan-only | scan-only: UI; analyzer + pattern greps (force-unwraps, swallowed errors, semantics, hard-coded English); deployed/web screens exercised only for onboarding/login |
| youpeak/lib/features/coins/view/coin_history_view.dart | 362 | scan-only | scan-only: UI; analyzer + pattern greps (force-unwraps, swallowed errors, semantics, hard-coded English); deployed/web screens exercised only for onboarding/login |
| youpeak/lib/features/coins/view/convert_coin_view.dart | 518 | scan-only | scan-only: UI; analyzer + pattern greps (force-unwraps, swallowed errors, semantics, hard-coded English); deployed/web screens exercised only for onboarding/login |
| youpeak/lib/features/coins/widget/buy_coin_plan_shimmer.dart | 39 | scan-only | scan-only: UI; analyzer + pattern greps (force-unwraps, swallowed errors, semantics, hard-coded English); deployed/web screens exercised only for onboarding/login |
| youpeak/lib/features/coins/widget/buy_coin_widget.dart | 67 | scan-only | scan-only: UI; analyzer + pattern greps (force-unwraps, swallowed errors, semantics, hard-coded English); deployed/web screens exercised only for onboarding/login |
| youpeak/lib/features/coins/widget/coin_payment_view.dart | 282 | reviewed | read in full; findings-draft-12/13 |
| youpeak/lib/features/coins/widget/convert_coin_shimmer_ui.dart | 108 | scan-only | scan-only: UI; analyzer + pattern greps (force-unwraps, swallowed errors, semantics, hard-coded English); deployed/web screens exercised only for onboarding/login |
| youpeak/lib/features/coins/widget/withdrawal_done_dialog.dart | 97 | scan-only | scan-only: UI; analyzer + pattern greps (force-unwraps, swallowed errors, semantics, hard-coded English); deployed/web screens exercised only for onboarding/login |
| youpeak/lib/features/comments/api/create_comment_api.dart | 35 | reviewed | read via condensed dump of all Flutter API/data files (83); see findings-draft-11/13/16/17 |
| youpeak/lib/features/comments/api/create_reply_api.dart | 30 | reviewed | read via condensed dump of all Flutter API/data files (83); see findings-draft-11/13/16/17 |
| youpeak/lib/features/comments/api/get_all_comment_api.dart | 83 | reviewed | read via condensed dump of all Flutter API/data files (83); see findings-draft-11/13/16/17 |
| youpeak/lib/features/comments/api/get_all_reply_api.dart | 47 | reviewed | read via condensed dump of all Flutter API/data files (83); see findings-draft-11/13/16/17 |
| youpeak/lib/features/comments/api/like_dislike_comment_api.dart | 58 | reviewed | read via condensed dump of all Flutter API/data files (83); see findings-draft-11/13/16/17 |
| youpeak/lib/features/comments/controller/comment_controller.dart | 369 | reviewed | read via condensed dump (imports/logs stripped); see findings-draft-11/13/15/16/17 |
| youpeak/lib/features/comments/controller/reply_controller.dart | 237 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/lib/features/comments/model/get_all_comment_model.dart | 210 | scan-only | scan-only: JSON model classes; covered by dart analyzer (0 errors) and sampled unit tests; not read line by line |
| youpeak/lib/features/comments/model/get_all_reply_model.dart | 370 | scan-only | scan-only: JSON model classes; covered by dart analyzer (0 errors) and sampled unit tests; not read line by line |
| youpeak/lib/features/comments/widget/comment_bottom_sheet.dart | 404 | scan-only | scan-only: UI; analyzer + pattern greps (force-unwraps, swallowed errors, semantics, hard-coded English); deployed/web screens exercised only for onboarding/login |
| youpeak/lib/features/comments/widget/comment_shimmer_ui.dart | 86 | scan-only | scan-only: UI; analyzer + pattern greps (force-unwraps, swallowed errors, semantics, hard-coded English); deployed/web screens exercised only for onboarding/login |
| youpeak/lib/features/comments/widget/reply_bottom_sheet.dart | 407 | scan-only | scan-only: UI; analyzer + pattern greps (force-unwraps, swallowed errors, semantics, hard-coded English); deployed/web screens exercised only for onboarding/login |
| youpeak/lib/features/edit_video/api/edit_video_api.dart | 40 | reviewed | read via condensed dump of all Flutter API/data files (83); see findings-draft-11/13/16/17 |
| youpeak/lib/features/edit_video/controller/edit_video_controller.dart | 58 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/lib/features/edit_video/view/edit_video_view.dart | 139 | scan-only | scan-only: UI; analyzer + pattern greps (force-unwraps, swallowed errors, semantics, hard-coded English); deployed/web screens exercised only for onboarding/login |
| youpeak/lib/features/help_center/api/get_contact_api.dart | 39 | reviewed | read via condensed dump of all Flutter API/data files (83); see findings-draft-11/13/16/17 |
| youpeak/lib/features/help_center/api/get_faq_api.dart | 39 | reviewed | read via condensed dump of all Flutter API/data files (83); see findings-draft-11/13/16/17 |
| youpeak/lib/features/help_center/controller/help_center_controller.dart | 36 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/lib/features/help_center/model/get_contact_model.dart | 123 | scan-only | scan-only: JSON model classes; covered by dart analyzer (0 errors) and sampled unit tests; not read line by line |
| youpeak/lib/features/help_center/model/get_faq_model.dart | 123 | scan-only | scan-only: JSON model classes; covered by dart analyzer (0 errors) and sampled unit tests; not read line by line |
| youpeak/lib/features/help_center/view/help_center_view.dart | 186 | scan-only | scan-only: UI; analyzer + pattern greps (force-unwraps, swallowed errors, semantics, hard-coded English); deployed/web screens exercised only for onboarding/login |
| youpeak/lib/features/home/api/fetch_all_video_api.dart | 41 | reviewed | read via condensed dump of all Flutter API/data files (83); see findings-draft-11/13/16/17 |
| youpeak/lib/features/home/api/fetch_new_video_api.dart | 40 | reviewed | read via condensed dump of all Flutter API/data files (83); see findings-draft-11/13/16/17 |
| youpeak/lib/features/home/api/fetch_popular_video_api.dart | 40 | reviewed | read via condensed dump of all Flutter API/data files (83); see findings-draft-11/13/16/17 |
| youpeak/lib/features/home/api/fetch_public_live_api.dart | 42 | reviewed | read via condensed dump of all Flutter API/data files (83); see findings-draft-11/13/16/17 |
| youpeak/lib/features/home/controller/nav_home_controller.dart | 451 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/lib/features/home/model/fetch_all_video_model.dart | 271 | scan-only | scan-only: JSON model classes; covered by dart analyzer (0 errors) and sampled unit tests; not read line by line |
| youpeak/lib/features/home/model/fetch_new_video_model.dart | 284 | scan-only | scan-only: JSON model classes; covered by dart analyzer (0 errors) and sampled unit tests; not read line by line |
| youpeak/lib/features/home/model/fetch_popular_video_model.dart | 271 | scan-only | scan-only: JSON model classes; covered by dart analyzer (0 errors) and sampled unit tests; not read line by line |
| youpeak/lib/features/home/model/fetch_public_live_model.dart | 72 | scan-only | scan-only: JSON model classes; covered by dart analyzer (0 errors) and sampled unit tests; not read line by line |
| youpeak/lib/features/home/view/nav_home_page.dart | 306 | scan-only | scan-only: UI; analyzer + pattern greps (force-unwraps, swallowed errors, semantics, hard-coded English); deployed/web screens exercised only for onboarding/login |
| youpeak/lib/features/home/widget/nav_home_widget.dart | 793 | scan-only | scan-only: UI; analyzer + pattern greps (force-unwraps, swallowed errors, semantics, hard-coded English); deployed/web screens exercised only for onboarding/login |
| youpeak/lib/features/home/widget/premium_videos_shelf.dart | 174 | scan-only | scan-only: UI; analyzer + pattern greps (force-unwraps, swallowed errors, semantics, hard-coded English); deployed/web screens exercised only for onboarding/login |
| youpeak/lib/features/library/api/create_watch_history_api.dart | 37 | reviewed | read via condensed dump of all Flutter API/data files (83); see findings-draft-11/13/16/17 |
| youpeak/lib/features/library/api/create_watch_later_api.dart | 60 | reviewed | read via condensed dump of all Flutter API/data files (83); see findings-draft-11/13/16/17 |
| youpeak/lib/features/library/api/delete_video_api.dart | 35 | reviewed | read via condensed dump of all Flutter API/data files (83); see findings-draft-11/13/16/17 |
| youpeak/lib/features/library/api/watch_later_api.dart | 40 | reviewed | read via condensed dump of all Flutter API/data files (83); see findings-draft-11/13/16/17 |
| youpeak/lib/features/library/controller/nav_library_controller.dart | 220 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/lib/features/library/model/save_to_watch_later_model.dart | 34 | scan-only | scan-only: JSON model classes; covered by dart analyzer (0 errors) and sampled unit tests; not read line by line |
| youpeak/lib/features/library/model/watch_later_model.dart | 98 | scan-only | scan-only: JSON model classes; covered by dart analyzer (0 errors) and sampled unit tests; not read line by line |
| youpeak/lib/features/library/view/download_view.dart | 578 | scan-only | scan-only: UI; analyzer + pattern greps (force-unwraps, swallowed errors, semantics, hard-coded English); deployed/web screens exercised only for onboarding/login |
| youpeak/lib/features/library/view/history_view.dart | 197 | scan-only | scan-only: UI; analyzer + pattern greps (force-unwraps, swallowed errors, semantics, hard-coded English); deployed/web screens exercised only for onboarding/login |
| youpeak/lib/features/library/view/nav_library_page.dart | 666 | scan-only | scan-only: UI; analyzer + pattern greps (force-unwraps, swallowed errors, semantics, hard-coded English); deployed/web screens exercised only for onboarding/login |
| youpeak/lib/features/library/view/preview_normal_video.dart | 381 | scan-only | scan-only: UI; analyzer + pattern greps (force-unwraps, swallowed errors, semantics, hard-coded English); deployed/web screens exercised only for onboarding/login |
| youpeak/lib/features/library/view/watch_later_view.dart | 423 | scan-only | scan-only: UI; analyzer + pattern greps (force-unwraps, swallowed errors, semantics, hard-coded English); deployed/web screens exercised only for onboarding/login |
| youpeak/lib/features/library/view/your_video_page.dart | 489 | scan-only | scan-only: UI; analyzer + pattern greps (force-unwraps, swallowed errors, semantics, hard-coded English); deployed/web screens exercised only for onboarding/login |
| youpeak/lib/features/library/widget/delete_video_bottom_sheet.dart | 108 | scan-only | scan-only: UI; analyzer + pattern greps (force-unwraps, swallowed errors, semantics, hard-coded English); deployed/web screens exercised only for onboarding/login |
| youpeak/lib/features/library/widget/more_option_bottom_sheet.dart | 68 | scan-only | scan-only: UI; analyzer + pattern greps (force-unwraps, swallowed errors, semantics, hard-coded English); deployed/web screens exercised only for onboarding/login |
| youpeak/lib/features/live/api/create_live_user_api.dart | 45 | reviewed | read via condensed dump of all Flutter API/data files (83); see findings-draft-11/13/16/17 |
| youpeak/lib/features/live/api/get_live_users_api.dart | 62 | reviewed | read via condensed dump of all Flutter API/data files (83); see findings-draft-11/13/16/17 |
| youpeak/lib/features/live/controller/add_thumbnail_controller.dart | 58 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/lib/features/live/controller/go_live_controller.dart | 94 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/lib/features/live/controller/socket_manager_controller.dart | 112 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/lib/features/live/model/create_live_user_model.dart | 134 | scan-only | scan-only: JSON model classes; covered by dart analyzer (0 errors) and sampled unit tests; not read line by line |
| youpeak/lib/features/live/model/get_live_users_model.dart | 139 | scan-only | scan-only: JSON model classes; covered by dart analyzer (0 errors) and sampled unit tests; not read line by line |
| youpeak/lib/features/live/service/zego_cloud_token.dart | 113 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/lib/features/live/view/add_thumbnail_view.dart | 124 | scan-only | scan-only: UI; analyzer + pattern greps (force-unwraps, swallowed errors, semantics, hard-coded English); deployed/web screens exercised only for onboarding/login |
| youpeak/lib/features/live/view/go_live_view.dart | 392 | scan-only | scan-only: UI; analyzer + pattern greps (force-unwraps, swallowed errors, semantics, hard-coded English); deployed/web screens exercised only for onboarding/login |
| youpeak/lib/features/live/view/live_view.dart | 914 | scan-only | scan-only: UI; analyzer + pattern greps (force-unwraps, swallowed errors, semantics, hard-coded English); deployed/web screens exercised only for onboarding/login |
| youpeak/lib/features/live/widget/device_orientation.dart | 22 | scan-only | scan-only: UI; analyzer + pattern greps (force-unwraps, swallowed errors, semantics, hard-coded English); deployed/web screens exercised only for onboarding/login |
| youpeak/lib/features/main/view/main_home_view.dart | 616 | scan-only | scan-only: UI; analyzer + pattern greps (force-unwraps, swallowed errors, semantics, hard-coded English); deployed/web screens exercised only for onboarding/login |
| youpeak/lib/features/main/view/wide_side_nav.dart | 424 | scan-only | scan-only: UI; analyzer + pattern greps (force-unwraps, swallowed errors, semantics, hard-coded English); deployed/web screens exercised only for onboarding/login |
| youpeak/lib/features/monetization/api/monetization_api.dart | 36 | reviewed | read via condensed dump of all Flutter API/data files (83); see findings-draft-11/13/16/17 |
| youpeak/lib/features/monetization/api/monetization_request_api.dart | 34 | reviewed | read via condensed dump of all Flutter API/data files (83); see findings-draft-11/13/16/17 |
| youpeak/lib/features/monetization/api/preview_monetization_api.dart | 29 | reviewed | read via condensed dump of all Flutter API/data files (83); see findings-draft-11/13/16/17 |
| youpeak/lib/features/monetization/api/video_engagement_reward_api.dart | 32 | reviewed | read via condensed dump of all Flutter API/data files (83); see findings-draft-11/13/16/17 |
| youpeak/lib/features/monetization/model/monetization_model.dart | 110 | scan-only | scan-only: JSON model classes; covered by dart analyzer (0 errors) and sampled unit tests; not read line by line |
| youpeak/lib/features/monetization/model/monetization_request_model.dart | 142 | scan-only | scan-only: JSON model classes; covered by dart analyzer (0 errors) and sampled unit tests; not read line by line |
| youpeak/lib/features/monetization/model/preview_monetization_model.dart | 173 | scan-only | scan-only: JSON model classes; covered by dart analyzer (0 errors) and sampled unit tests; not read line by line |
| youpeak/lib/features/monetization/model/video_engagement_reward_model.dart | 532 | scan-only | scan-only: JSON model classes; covered by dart analyzer (0 errors) and sampled unit tests; not read line by line |
| youpeak/lib/features/monetization/view/content_engagement_view.dart | 230 | scan-only | scan-only: UI; analyzer + pattern greps (force-unwraps, swallowed errors, semantics, hard-coded English); deployed/web screens exercised only for onboarding/login |
| youpeak/lib/features/monetization/view/monetization_view.dart | 251 | scan-only | scan-only: UI; analyzer + pattern greps (force-unwraps, swallowed errors, semantics, hard-coded English); deployed/web screens exercised only for onboarding/login |
| youpeak/lib/features/monetization/view/preview_monetization.dart | 330 | scan-only | scan-only: UI; analyzer + pattern greps (force-unwraps, swallowed errors, semantics, hard-coded English); deployed/web screens exercised only for onboarding/login |
| youpeak/lib/features/monetization/view/time_watch_view.dart | 172 | scan-only | scan-only: UI; analyzer + pattern greps (force-unwraps, swallowed errors, semantics, hard-coded English); deployed/web screens exercised only for onboarding/login |
| youpeak/lib/features/notifications/api/clear_notification_api.dart | 39 | reviewed | read via condensed dump of all Flutter API/data files (83); see findings-draft-11/13/16/17 |
| youpeak/lib/features/notifications/api/notification_api.dart | 64 | reviewed | read via condensed dump of all Flutter API/data files (83); see findings-draft-11/13/16/17 |
| youpeak/lib/features/notifications/controller/notification_controller.dart | 65 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/lib/features/notifications/model/notification_model.dart | 155 | scan-only | scan-only: JSON model classes; covered by dart analyzer (0 errors) and sampled unit tests; not read line by line |
| youpeak/lib/features/notifications/view/notification_view.dart | 431 | scan-only | scan-only: UI; analyzer + pattern greps (force-unwraps, swallowed errors, semantics, hard-coded English); deployed/web screens exercised only for onboarding/login |
| youpeak/lib/features/onboarding/view/on_boarding_view.dart | 264 | scan-only | scan-only: UI; analyzer + pattern greps (force-unwraps, swallowed errors, semantics, hard-coded English); deployed/web screens exercised only for onboarding/login |
| youpeak/lib/features/payout/data/payout_repository.dart | 16 | reviewed | read via condensed dump of all Flutter API/data files (83); see findings-draft-11/13/16/17 |
| youpeak/lib/features/payout/domain/payout_rules.dart | 99 | reviewed | read in full; see findings-draft-11 |
| youpeak/lib/features/payout/presentation/withdrawal_modal.dart | 308 | reviewed | read in full; see findings-draft-11 |
| youpeak/lib/features/peak_boost/data/peak_boost_repository.dart | 17 | reviewed | read via condensed dump of all Flutter API/data files (83); see findings-draft-11/13/16/17 |
| youpeak/lib/features/peak_boost/domain/peak_boost.dart | 69 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/lib/features/peak_boost/presentation/boost_toast.dart | 92 | scan-only | scan-only: UI; analyzer + pattern greps (force-unwraps, swallowed errors, semantics, hard-coded English); deployed/web screens exercised only for onboarding/login |
| youpeak/lib/features/peak_boost/presentation/peak_boost_bottom_sheet.dart | 361 | reviewed | read in full; findings-draft-12/13 |
| youpeak/lib/features/peak_boost/presentation/peak_boost_button.dart | 64 | scan-only | scan-only: UI; analyzer + pattern greps (force-unwraps, swallowed errors, semantics, hard-coded English); deployed/web screens exercised only for onboarding/login |
| youpeak/lib/features/player/presentation/adaptive_hls_player_widget.dart | 316 | scan-only | scan-only: UI; analyzer + pattern greps (force-unwraps, swallowed errors, semantics, hard-coded English); deployed/web screens exercised only for onboarding/login |
| youpeak/lib/features/playlist/api/add_into_play_list_api.dart | 96 | reviewed | read via condensed dump of all Flutter API/data files (83); see findings-draft-11/13/16/17 |
| youpeak/lib/features/playlist/api/create_play_list_api.dart | 38 | reviewed | read via condensed dump of all Flutter API/data files (83); see findings-draft-11/13/16/17 |
| youpeak/lib/features/playlist/api/fetch_normal_video_api.dart | 43 | reviewed | read via condensed dump of all Flutter API/data files (83); see findings-draft-11/13/16/17 |
| youpeak/lib/features/playlist/api/play_list_get_with_search_api.dart | 44 | reviewed | read via condensed dump of all Flutter API/data files (83); see findings-draft-11/13/16/17 |
| youpeak/lib/features/playlist/controller/create_playlist_controller.dart | 144 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/lib/features/playlist/model/fetch_normal_video_model.dart | 122 | scan-only | scan-only: JSON model classes; covered by dart analyzer (0 errors) and sampled unit tests; not read line by line |
| youpeak/lib/features/playlist/model/get_playList_with_serach_response_model.dart | 106 | scan-only | scan-only: JSON model classes; covered by dart analyzer (0 errors) and sampled unit tests; not read line by line |
| youpeak/lib/features/playlist/view/create_playlist_view.dart | 302 | scan-only | scan-only: UI; analyzer + pattern greps (force-unwraps, swallowed errors, semantics, hard-coded English); deployed/web screens exercised only for onboarding/login |
| youpeak/lib/features/playlist/widget/add_into_playlist.dart | 144 | scan-only | scan-only: UI; analyzer + pattern greps (force-unwraps, swallowed errors, semantics, hard-coded English); deployed/web screens exercised only for onboarding/login |
| youpeak/lib/features/premium/api/get_premium_plan_api.dart | 39 | reviewed | read via condensed dump of all Flutter API/data files (83); see findings-draft-11/13/16/17 |
| youpeak/lib/features/premium/api/get_premium_purchase_history_api.dart | 63 | reviewed | read via condensed dump of all Flutter API/data files (83); see findings-draft-11/13/16/17 |
| youpeak/lib/features/premium/controller/premium_plan_controller.dart | 21 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/lib/features/premium/model/get_premium_plan_model.dart | 147 | scan-only | scan-only: JSON model classes; covered by dart analyzer (0 errors) and sampled unit tests; not read line by line |
| youpeak/lib/features/premium/model/get_premium_plan_purchase_history_model.dart | 321 | scan-only | scan-only: JSON model classes; covered by dart analyzer (0 errors) and sampled unit tests; not read line by line |
| youpeak/lib/features/premium/view/payments_view.dart | 263 | partial | read the payment/verify section only |
| youpeak/lib/features/premium/view/premium_plan_purchase_history_view.dart | 133 | scan-only | scan-only: UI; analyzer + pattern greps (force-unwraps, swallowed errors, semantics, hard-coded English); deployed/web screens exercised only for onboarding/login |
| youpeak/lib/features/premium/view/premium_plan_view.dart | 218 | scan-only | scan-only: UI; analyzer + pattern greps (force-unwraps, swallowed errors, semantics, hard-coded English); deployed/web screens exercised only for onboarding/login |
| youpeak/lib/features/premium/view/purchase_plan_view.dart | 177 | scan-only | scan-only: UI; analyzer + pattern greps (force-unwraps, swallowed errors, semantics, hard-coded English); deployed/web screens exercised only for onboarding/login |
| youpeak/lib/features/profile/api/delete_account_api.dart | 33 | reviewed | read via condensed dump of all Flutter API/data files (83); see findings-draft-11/13/16/17 |
| youpeak/lib/features/profile/api/edit_profile_api.dart | 83 | reviewed | read via condensed dump of all Flutter API/data files (83); see findings-draft-11/13/16/17 |
| youpeak/lib/features/profile/api/get_profile_api.dart | 66 | reviewed | read via condensed dump of all Flutter API/data files (83); see findings-draft-11/13/16/17 |
| youpeak/lib/features/profile/controller/profile_controller.dart | 87 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/lib/features/profile/model/get_profile_model.dart | 682 | scan-only | scan-only: JSON model classes; covered by dart analyzer (0 errors) and sampled unit tests; not read line by line |
| youpeak/lib/features/profile/view/edit_profile.dart | 784 | scan-only | scan-only: UI; analyzer + pattern greps (force-unwraps, swallowed errors, semantics, hard-coded English); deployed/web screens exercised only for onboarding/login |
| youpeak/lib/features/profile/view/profile_view.dart | 782 | scan-only | scan-only: UI; analyzer + pattern greps (force-unwraps, swallowed errors, semantics, hard-coded English); deployed/web screens exercised only for onboarding/login |
| youpeak/lib/features/referral/api/get_referral_history_api.dart | 38 | reviewed | read via condensed dump of all Flutter API/data files (83); see findings-draft-11/13/16/17 |
| youpeak/lib/features/referral/api/referral_code_apply_api.dart | 37 | reviewed | read via condensed dump of all Flutter API/data files (83); see findings-draft-11/13/16/17 |
| youpeak/lib/features/referral/controller/referral_history_controller.dart | 66 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/lib/features/referral/model/get_referral_history_model.dart | 90 | scan-only | scan-only: JSON model classes; covered by dart analyzer (0 errors) and sampled unit tests; not read line by line |
| youpeak/lib/features/referral/model/referral_code_apply_model.dart | 39 | scan-only | scan-only: JSON model classes; covered by dart analyzer (0 errors) and sampled unit tests; not read line by line |
| youpeak/lib/features/referral/view/referral_history_view.dart | 210 | scan-only | scan-only: UI; analyzer + pattern greps (force-unwraps, swallowed errors, semantics, hard-coded English); deployed/web screens exercised only for onboarding/login |
| youpeak/lib/features/referral/view/referral_program_view.dart | 241 | reviewed | read in full; findings-draft-12/13 |
| youpeak/lib/features/report/api/report_video_api.dart | 40 | reviewed | read via condensed dump of all Flutter API/data files (83); see findings-draft-11/13/16/17 |
| youpeak/lib/features/report/view/custom_channel_report_view.dart | 129 | scan-only | scan-only: UI; analyzer + pattern greps (force-unwraps, swallowed errors, semantics, hard-coded English); deployed/web screens exercised only for onboarding/login |
| youpeak/lib/features/report/view/custom_report_view.dart | 175 | scan-only | scan-only: UI; analyzer + pattern greps (force-unwraps, swallowed errors, semantics, hard-coded English); deployed/web screens exercised only for onboarding/login |
| youpeak/lib/features/rewards/api/earn_coin_from_check_in_api.dart | 33 | reviewed | read via condensed dump of all Flutter API/data files (83); see findings-draft-11/13/16/17 |
| youpeak/lib/features/rewards/api/earn_coin_from_watch_ad_api.dart | 35 | reviewed | read via condensed dump of all Flutter API/data files (83); see findings-draft-11/13/16/17 |
| youpeak/lib/features/rewards/api/get_ad_reward_api.dart | 64 | reviewed | read via condensed dump of all Flutter API/data files (83); see findings-draft-11/13/16/17 |
| youpeak/lib/features/rewards/api/get_daily_reward_api.dart | 36 | reviewed | read via condensed dump of all Flutter API/data files (83); see findings-draft-11/13/16/17 |
| youpeak/lib/features/rewards/controller/earn_reward_controller.dart | 304 | reviewed | read in full; see findings-draft-11 |
| youpeak/lib/features/rewards/model/earn_coin_from_check_in_model.dart | 75 | scan-only | scan-only: JSON model classes; covered by dart analyzer (0 errors) and sampled unit tests; not read line by line |
| youpeak/lib/features/rewards/model/earn_coin_from_watch_ad_model.dart | 547 | scan-only | scan-only: JSON model classes; covered by dart analyzer (0 errors) and sampled unit tests; not read line by line |
| youpeak/lib/features/rewards/model/get_ad_reward_model.dart | 156 | scan-only | scan-only: JSON model classes; covered by dart analyzer (0 errors) and sampled unit tests; not read line by line |
| youpeak/lib/features/rewards/model/get_daily_reward_model.dart | 123 | scan-only | scan-only: JSON model classes; covered by dart analyzer (0 errors) and sampled unit tests; not read line by line |
| youpeak/lib/features/rewards/view/earn_reward_view.dart | 949 | scan-only | scan-only: UI; analyzer + pattern greps (force-unwraps, swallowed errors, semantics, hard-coded English); deployed/web screens exercised only for onboarding/login |
| youpeak/lib/features/rewards/widget/check_in_done_dialog.dart | 97 | scan-only | scan-only: UI; analyzer + pattern greps (force-unwraps, swallowed errors, semantics, hard-coded English); deployed/web screens exercised only for onboarding/login |
| youpeak/lib/features/rewards/widget/earn_reward_shimmer_ui.dart | 59 | scan-only | scan-only: UI; analyzer + pattern greps (force-unwraps, swallowed errors, semantics, hard-coded English); deployed/web screens exercised only for onboarding/login |
| youpeak/lib/features/search/api/search_api.dart | 55 | reviewed | read via condensed dump of all Flutter API/data files (83); see findings-draft-11/13/16/17 |
| youpeak/lib/features/search/controller/search_controller.dart | 378 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/lib/features/search/model/search_model.dart | 836 | scan-only | scan-only: JSON model classes; covered by dart analyzer (0 errors) and sampled unit tests; not read line by line |
| youpeak/lib/features/search/view/search_view.dart | 979 | scan-only | scan-only: UI; analyzer + pattern greps (force-unwraps, swallowed errors, semantics, hard-coded English); deployed/web screens exercised only for onboarding/login |
| youpeak/lib/features/settings/api/fetch_language_api.dart | 38 | reviewed | read via condensed dump of all Flutter API/data files (83); see findings-draft-11/13/16/17 |
| youpeak/lib/features/settings/api/grievance_api.dart | 88 | reviewed | read via condensed dump of all Flutter API/data files (83); see findings-draft-11/13/16/17 |
| youpeak/lib/features/settings/model/fetch_language_model.dart | 40 | scan-only | scan-only: JSON model classes; covered by dart analyzer (0 errors) and sampled unit tests; not read line by line |
| youpeak/lib/features/settings/view/grievance_view.dart | 350 | scan-only | scan-only: UI; analyzer + pattern greps (force-unwraps, swallowed errors, semantics, hard-coded English); deployed/web screens exercised only for onboarding/login |
| youpeak/lib/features/settings/view/language_view.dart | 167 | scan-only | scan-only: UI; analyzer + pattern greps (force-unwraps, swallowed errors, semantics, hard-coded English); deployed/web screens exercised only for onboarding/login |
| youpeak/lib/features/settings/view/privacy_policy_web_view.dart | 96 | scan-only | scan-only: UI; analyzer + pattern greps (force-unwraps, swallowed errors, semantics, hard-coded English); deployed/web screens exercised only for onboarding/login |
| youpeak/lib/features/settings/view/settings_view.dart | 281 | scan-only | scan-only: UI; analyzer + pattern greps (force-unwraps, swallowed errors, semantics, hard-coded English); deployed/web screens exercised only for onboarding/login |
| youpeak/lib/features/splash/view/splash_screen_view.dart | 256 | scan-only | scan-only: UI; analyzer + pattern greps (force-unwraps, swallowed errors, semantics, hard-coded English); deployed/web screens exercised only for onboarding/login |
| youpeak/lib/features/subscriptions/api/get_subscribed_channel_api.dart | 48 | reviewed | read via condensed dump of all Flutter API/data files (83); see findings-draft-11/13/16/17 |
| youpeak/lib/features/subscriptions/api/get_subscribed_channel_video_api.dart | 48 | reviewed | read via condensed dump of all Flutter API/data files (83); see findings-draft-11/13/16/17 |
| youpeak/lib/features/subscriptions/api/subscribe_channel_api.dart | 36 | reviewed | read via condensed dump of all Flutter API/data files (83); see findings-draft-11/13/16/17 |
| youpeak/lib/features/subscriptions/controller/nav_subscription_controller.dart | 298 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/lib/features/subscriptions/model/get_subscribed_channel_model.dart | 108 | scan-only | scan-only: JSON model classes; covered by dart analyzer (0 errors) and sampled unit tests; not read line by line |
| youpeak/lib/features/subscriptions/model/get_subscribed_channel_video_model.dart | 110 | scan-only | scan-only: JSON model classes; covered by dart analyzer (0 errors) and sampled unit tests; not read line by line |
| youpeak/lib/features/subscriptions/view/nav_subscription_view.dart | 1506 | scan-only | scan-only: UI; analyzer + pattern greps (force-unwraps, swallowed errors, semantics, hard-coded English); deployed/web screens exercised only for onboarding/login |
| youpeak/lib/features/subscriptions/view/subscribed_channel_view.dart | 132 | scan-only | scan-only: UI; analyzer + pattern greps (force-unwraps, swallowed errors, semantics, hard-coded English); deployed/web screens exercised only for onboarding/login |
| youpeak/lib/features/tasker/data/tasker_repository.dart | 14 | reviewed | read via condensed dump of all Flutter API/data files (83); see findings-draft-11/13/16/17 |
| youpeak/lib/features/tasker/domain/tasker_dashboard.dart | 284 | reviewed | read in full; findings-draft-12/13 |
| youpeak/lib/features/tasker/presentation/tasker_dashboard_provider.dart | 27 | scan-only | scan-only: UI; analyzer + pattern greps (force-unwraps, swallowed errors, semantics, hard-coded English); deployed/web screens exercised only for onboarding/login |
| youpeak/lib/features/tasker/presentation/tasker_dashboard_view.dart | 538 | scan-only | scan-only: UI; analyzer + pattern greps (force-unwraps, swallowed errors, semantics, hard-coded English); deployed/web screens exercised only for onboarding/login |
| youpeak/lib/features/tiers/api/creator_tier_api.dart | 29 | reviewed | read via condensed dump of all Flutter API/data files (83); see findings-draft-11/13/16/17 |
| youpeak/lib/features/tiers/api/tasker_tier_api.dart | 30 | reviewed | read via condensed dump of all Flutter API/data files (83); see findings-draft-11/13/16/17 |
| youpeak/lib/features/tiers/view/creator_tier_view.dart | 219 | scan-only | scan-only: UI; analyzer + pattern greps (force-unwraps, swallowed errors, semantics, hard-coded English); deployed/web screens exercised only for onboarding/login |
| youpeak/lib/features/tiers/view/tasker_tier_view.dart | 208 | scan-only | scan-only: UI; analyzer + pattern greps (force-unwraps, swallowed errors, semantics, hard-coded English); deployed/web screens exercised only for onboarding/login |
| youpeak/lib/features/upload/api/upload_video_api.dart | 122 | reviewed | read via condensed dump of all Flutter API/data files (83); see findings-draft-11/13/16/17 |
| youpeak/lib/features/upload/controller/upload_video_controller.dart | 366 | reviewed | read in full; see findings-draft-11 |
| youpeak/lib/features/upload/model/upload_video_model.dart | 374 | scan-only | scan-only: JSON model classes; covered by dart analyzer (0 errors) and sampled unit tests; not read line by line |
| youpeak/lib/features/upload/view/audience_page.dart | 97 | scan-only | scan-only: UI; analyzer + pattern greps (force-unwraps, swallowed errors, semantics, hard-coded English); deployed/web screens exercised only for onboarding/login |
| youpeak/lib/features/upload/view/comments_page.dart | 56 | scan-only | scan-only: UI; analyzer + pattern greps (force-unwraps, swallowed errors, semantics, hard-coded English); deployed/web screens exercised only for onboarding/login |
| youpeak/lib/features/upload/view/description_page.dart | 144 | scan-only | scan-only: UI; analyzer + pattern greps (force-unwraps, swallowed errors, semantics, hard-coded English); deployed/web screens exercised only for onboarding/login |
| youpeak/lib/features/upload/view/set_thumbnail_page.dart | 107 | scan-only | scan-only: UI; analyzer + pattern greps (force-unwraps, swallowed errors, semantics, hard-coded English); deployed/web screens exercised only for onboarding/login |
| youpeak/lib/features/upload/view/upload_video_view.dart | 614 | scan-only | scan-only: UI; analyzer + pattern greps (force-unwraps, swallowed errors, semantics, hard-coded English); deployed/web screens exercised only for onboarding/login |
| youpeak/lib/features/upload/view/video_charges_view.dart | 191 | scan-only | scan-only: UI; analyzer + pattern greps (force-unwraps, swallowed errors, semantics, hard-coded English); deployed/web screens exercised only for onboarding/login |
| youpeak/lib/features/upload/view/visibility_page.dart | 99 | scan-only | scan-only: UI; analyzer + pattern greps (force-unwraps, swallowed errors, semantics, hard-coded English); deployed/web screens exercised only for onboarding/login |
| youpeak/lib/features/video_promotion/api/video_promotion_api.dart | 50 | reviewed | read via condensed dump of all Flutter API/data files (83); see findings-draft-11/13/16/17 |
| youpeak/lib/features/video_promotion/view/promote_video_view.dart | 344 | reviewed | read in full; findings-draft-12/13 |
| youpeak/lib/features/video/api/get_related_video_api.dart | 37 | reviewed | read via condensed dump of all Flutter API/data files (83); see findings-draft-11/13/16/17 |
| youpeak/lib/features/video/api/like_dislike_api.dart | 52 | reviewed | read via condensed dump of all Flutter API/data files (83); see findings-draft-11/13/16/17 |
| youpeak/lib/features/video/api/share_count_api.dart | 27 | reviewed | read via condensed dump of all Flutter API/data files (83); see findings-draft-11/13/16/17 |
| youpeak/lib/features/video/api/unlock_private_video_api.dart | 36 | reviewed | read via condensed dump of all Flutter API/data files (83); see findings-draft-11/13/16/17 |
| youpeak/lib/features/video/api/video_details_api.dart | 35 | reviewed | read via condensed dump of all Flutter API/data files (83); see findings-draft-11/13/16/17 |
| youpeak/lib/features/video/controller/normal_video_details_controller.dart | 814 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/lib/features/video/model/get_related_video_model.dart | 127 | scan-only | scan-only: JSON model classes; covered by dart analyzer (0 errors) and sampled unit tests; not read line by line |
| youpeak/lib/features/video/model/more_information_model.dart | 28 | scan-only | scan-only: JSON model classes; covered by dart analyzer (0 errors) and sampled unit tests; not read line by line |
| youpeak/lib/features/video/model/unlock_private_video_model.dart | 53 | scan-only | scan-only: JSON model classes; covered by dart analyzer (0 errors) and sampled unit tests; not read line by line |
| youpeak/lib/features/video/model/video_details_model.dart | 153 | scan-only | scan-only: JSON model classes; covered by dart analyzer (0 errors) and sampled unit tests; not read line by line |
| youpeak/lib/features/video/view/normal_video_details_view.dart | 2984 | scan-only | scan-only: UI; analyzer + pattern greps (force-unwraps, swallowed errors, semantics, hard-coded English); deployed/web screens exercised only for onboarding/login |
| youpeak/lib/features/video/view/shorts_video_details_view.dart | 881 | scan-only | scan-only: UI; analyzer + pattern greps (force-unwraps, swallowed errors, semantics, hard-coded English); deployed/web screens exercised only for onboarding/login |
| youpeak/lib/features/video/widget/more_information_bottom_sheet.dart | 213 | scan-only | scan-only: UI; analyzer + pattern greps (force-unwraps, swallowed errors, semantics, hard-coded English); deployed/web screens exercised only for onboarding/login |
| youpeak/lib/features/video/widget/video_description_bottom_sheet.dart | 159 | scan-only | scan-only: UI; analyzer + pattern greps (force-unwraps, swallowed errors, semantics, hard-coded English); deployed/web screens exercised only for onboarding/login |
| youpeak/lib/features/video/widget/video_details_shimmer_ui.dart | 133 | scan-only | scan-only: UI; analyzer + pattern greps (force-unwraps, swallowed errors, semantics, hard-coded English); deployed/web screens exercised only for onboarding/login |
| youpeak/lib/features/wallet/api/get_wallet_history_api.dart | 75 | reviewed | read via condensed dump of all Flutter API/data files (83); see findings-draft-11/13/16/17 |
| youpeak/lib/features/wallet/api/get_withdraw_history_api.dart | 44 | reviewed | read via condensed dump of all Flutter API/data files (83); see findings-draft-11/13/16/17 |
| youpeak/lib/features/wallet/api/with_draw_list_api.dart | 34 | reviewed | read via condensed dump of all Flutter API/data files (83); see findings-draft-11/13/16/17 |
| youpeak/lib/features/wallet/api/with_draw_request_api.dart | 50 | reviewed | read via condensed dump of all Flutter API/data files (83); see findings-draft-11/13/16/17 |
| youpeak/lib/features/wallet/api/withdraw_setting_api.dart | 34 | reviewed | read via condensed dump of all Flutter API/data files (83); see findings-draft-11/13/16/17 |
| youpeak/lib/features/wallet/controller/my_wallet_controller.dart | 96 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/lib/features/wallet/controller/withdraw_history_controller.dart | 95 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/lib/features/wallet/model/get_wallet_history_model.dart | 155 | scan-only | scan-only: JSON model classes; covered by dart analyzer (0 errors) and sampled unit tests; not read line by line |
| youpeak/lib/features/wallet/model/get_withdraw_history_model.dart | 195 | scan-only | scan-only: JSON model classes; covered by dart analyzer (0 errors) and sampled unit tests; not read line by line |
| youpeak/lib/features/wallet/model/with_draw_list_model.dart | 121 | scan-only | scan-only: JSON model classes; covered by dart analyzer (0 errors) and sampled unit tests; not read line by line |
| youpeak/lib/features/wallet/model/with_draw_request_model.dart | 190 | scan-only | scan-only: JSON model classes; covered by dart analyzer (0 errors) and sampled unit tests; not read line by line |
| youpeak/lib/features/wallet/model/withdraw_setting_model.dart | 205 | scan-only | scan-only: JSON model classes; covered by dart analyzer (0 errors) and sampled unit tests; not read line by line |
| youpeak/lib/features/wallet/view/my_wallet_view.dart | 338 | scan-only | scan-only: UI; analyzer + pattern greps (force-unwraps, swallowed errors, semantics, hard-coded English); deployed/web screens exercised only for onboarding/login |
| youpeak/lib/features/wallet/view/withdraw_history_view.dart | 258 | scan-only | scan-only: UI; analyzer + pattern greps (force-unwraps, swallowed errors, semantics, hard-coded English); deployed/web screens exercised only for onboarding/login |
| youpeak/lib/features/wallet/view/withdraw_view.dart | 552 | scan-only | scan-only: UI; analyzer + pattern greps (force-unwraps, swallowed errors, semantics, hard-coded English); deployed/web screens exercised only for onboarding/login |
| youpeak/lib/features/watch_tracking/data/heartbeat_api.dart | 63 | reviewed | read via condensed dump of all Flutter API/data files (83); see findings-draft-11/13/16/17 |
| youpeak/lib/features/watch_tracking/domain/watch_time_accumulator.dart | 88 | reviewed | read in full; findings-draft-12/13 |
| youpeak/lib/features/watch_tracking/presentation/watch_heartbeat_tracker.dart | 154 | reviewed | read in full; see findings-draft-11 |
| youpeak/lib/firebase_options.dart | 89 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/lib/main.dart | 534 | reviewed | read in full; findings-draft-12/13 |
| youpeak/lib/shared/dialogs/app_exit_dialog.dart | 182 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/lib/shared/dialogs/blocked_user_dialog.dart | 152 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/lib/shared/dialogs/custom_dialog.dart | 39 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/lib/shared/dialogs/force_update_dialog.dart | 202 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/lib/shared/shimmer/container_shimmer_ui.dart | 29 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/lib/shared/shimmer/normal_video_shimmer_ui.dart | 104 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/lib/shared/shimmer/shorts_list_shimmer_ui.dart | 27 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/lib/shared/shimmer/shorts_video_shimmer_ui.dart | 98 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/lib/shared/shimmer/video_list_shimmer_ui.dart | 69 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/lib/shared/views/network_issue_view.dart | 56 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/lib/shared/widgets/adaptive_video_list.dart | 88 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/lib/shared/widgets/app_artwork.dart | 76 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/lib/shared/widgets/basic_button.dart | 413 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/lib/shared/widgets/common_share.dart | 71 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/lib/shared/widgets/custom_border_button.dart | 37 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/lib/shared/widgets/custom_box_button.dart | 29 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/lib/shared/widgets/custom_filled_button.dart | 39 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/lib/shared/widgets/custom_text_field.dart | 95 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/lib/shared/widgets/data_not_found_ui.dart | 66 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/lib/shared/widgets/loader_ui.dart | 17 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/lib/shared/widgets/normal_video_ui.dart | 375 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/lib/shared/widgets/premium_plan_dialog.dart | 132 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/lib/shared/widgets/preview_image.dart | 123 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/lib/shared/widgets/short_video_ui.dart | 283 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/lib/shared/widgets/small_video_widget.dart | 143 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/lib/shared/widgets/subscribe_premium_channel_bottom_sheet.dart | 134 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/lib/shared/widgets/subscribed_success_dialog.dart | 98 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/lib/shared/widgets/unlock_premium_video_bottom_sheet.dart | 133 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/lib/shared/widgets/youpeak_emoji.dart | 134 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/lib/shared/widgets/youpeak_play_icon.dart | 59 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/linux/.gitignore | 2 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/linux/CMakeLists.txt | 139 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/linux/flutter/CMakeLists.txt | 89 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/macos/.gitignore | 8 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/pubspec.yaml | 192 | partial | read the relevant sections only (signing, ids, deps via grep) |
| youpeak/README.md | 20 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/test/core/app_api_client_test.dart | 114 | scan-only | scan-only: executed by `flutter test` (107 pass); source not read line by line |
| youpeak/test/core/desktop_shell_layout_test.dart | 105 | scan-only | scan-only: executed by `flutter test` (107 pass); source not read line by line |
| youpeak/test/core/local_emulators_test.dart | 32 | scan-only | scan-only: executed by `flutter test` (107 pass); source not read line by line |
| youpeak/test/core/security_signals_test.dart | 154 | scan-only | scan-only: executed by `flutter test` (107 pass); source not read line by line |
| youpeak/test/core/system_configs_test.dart | 109 | scan-only | scan-only: executed by `flutter test` (107 pass); source not read line by line |
| youpeak/test/features/bites_desktop_test.dart | 103 | scan-only | scan-only: executed by `flutter test` (107 pass); source not read line by line |
| youpeak/test/features/domain_rules_test.dart | 158 | scan-only | scan-only: executed by `flutter test` (107 pass); source not read line by line |
| youpeak/test/features/google_sign_in_flow_test.dart | 33 | scan-only | scan-only: executed by `flutter test` (107 pass); source not read line by line |
| youpeak/test/features/sign_up_model_test.dart | 38 | scan-only | scan-only: executed by `flutter test` (107 pass); source not read line by line |
| youpeak/test/features/tasker_dashboard_state_test.dart | 44 | scan-only | scan-only: executed by `flutter test` (107 pass); source not read line by line |
| youpeak/test/features/watch_time_accumulator_test.dart | 91 | scan-only | scan-only: executed by `flutter test` (107 pass); source not read line by line |
| youpeak/test/support/fakes.dart | 89 | scan-only | scan-only: executed by `flutter test` (107 pass); source not read line by line |
| youpeak/test/widget_test.dart | 45 | scan-only | scan-only: executed by `flutter test` (107 pass); source not read line by line |
| youpeak/test/widgets/feature_widgets_test.dart | 349 | scan-only | scan-only: executed by `flutter test` (107 pass); source not read line by line |
| youpeak/test/youpeak_emoji_test.dart | 32 | scan-only | scan-only: executed by `flutter test` (107 pass); source not read line by line |
| youpeak/web/.well-known/assetlinks.json | 13 | reviewed | read in full |
| youpeak/web/flutter_bootstrap.js | 19 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/web/index.html | 89 | reviewed | read in full |
| youpeak/web/js/hls.min.js | 5 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/web/manifest.json | 38 | reviewed | read in full |
| youpeak/web/vercel.json | 12 | reviewed | read in full |
| youpeak/windows/.gitignore | 18 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/windows/CMakeLists.txt | 102 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/windows/flutter/CMakeLists.txt | 110 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/windows/runner/CMakeLists.txt | 41 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
| youpeak/YOUPEAK_IMAGE_PROMPTS.txt | 6058 | scan-only | scan-only: analyzer + pattern greps; not read line by line |
