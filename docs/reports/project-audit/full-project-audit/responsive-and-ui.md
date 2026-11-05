# Responsive, accessibility and UI-state checks

Evidence labels: **[D]** real deployed site (GET/navigation only, no login, no form submit); **[E]** local emulator/demo stack (admin dev server :3055 → demo backend :5055 with demo data from `local-dev/seed.js`); **[S]** static.
Viewports (real emulation through the DevTools protocol, not window resizing): 1920×1080, 1366×768, 768×1024, 390×844 (mobile flag on for ≤ 700 px).
Tooling: `audit-tests/cdp-shots.cjs`, `cdp-flow.cjs`, `cdp-admin.cjs`, `cdp-admin-states.cjs` (headless Microsoft Edge 154). Screenshots are under `screenshots/`.

## 1. Deployed sites [D]

| Page | 1920 | 1366 | 768 | 390 | Notes |
|---|---|---|---|---|---|
| admin.youpeak.app sign-in | ok | ok | ok | ok | no horizontal overflow at any width; empty `<title>`; password field not in a `<form>`; third-party scripts without SRI (AFE-18) |
| www.youpeak.app onboarding → "Let's you in" | ok | ok | ok | ok | split brand layout ≥ 1366 px, phone column ≤ 768 px; no overflow; no console errors; semantics tree empty until activated (A11Y-1) |
| www.youpeak.app/privacy, /terms (390 px) | – | – | – | shows sign-in | deep links render the sign-in screen, no policy text (DL-2) |

Screenshots: `admin-login-{1920,1366,768,390}.png`, `consumer-home-*.png`, `consumer-onboarding-*-step{1,2,3}.png`, `consumer-deeplink-{privacy,terms}-390.png`. Raw data: `admin-login-report.json`, `consumer-home-report.json`, `consumer-flow-report.json`.
Not testable without credentials or a device (**BLOCKED**): signed-in consumer screens on the deployed web app, admin screens on the deployed admin, Android/iOS screens, TalkBack/VoiceOver.

## 2. Admin panel sweep on the demo stack [E]

### Super Admin — 33 routes × 4 widths = 132 views; problem signals: 1

| Route | Heading | chars @1366 | unlabelled controls @1366 |
|---|---|---|---|
| /admin/mainDashboard | 7 | 874 | 1 |
| /admin/agency | District Franchises | 1060 | 1 |
| /admin/agencyReports | Franchise Reports | 1218 | 1 |
| /admin/manageDigitalPartner | Digital Partners | 1206 | 1 |
| /admin/digitalPartnerReports | Digital Partner Reports | 1338 | 3 |
| /admin/videoPromotions | Video Promotion Campaigns | 773 | 1 |
| /admin/membershipTiers | User Membership Tiers & Ad Credit Caps | 3008 | 1 |
| /admin/fraudManagement | Fraud & Suspicious Account Monitoring | 767 | 1 |
| /admin/referralManagement | Referral Management & Leaderboard | 1244 | 1 |
| /admin/moderationQueue | Content Moderation | 823 | 1 |
| /admin/duplicateScreening | Duplicate Screening | 857 | 1 |
| /admin/config/tasker | Tasker Tiers & Rewards | 2375 | 14 |
| /admin/config/creatorPasses | Creator VIP Passes | 1410 | 1 |
| /admin/config/partnerProgram | Partner Program & Milestones | 1656 | 17 |
| /admin/config/boost | Peak Boost & Promotions | 1535 | 35 |
| /admin/config/payouts | Payout Policy | 1485 | 5 |
| /admin/config/safety | Moderation & Anti-Fraud Settings | 2068 | 11 |
| /admin/config/adCredits | Ad Credit Packs | 1039 | 20 |
| /admin/userTable | User | 1514 | 9 |
| /admin/videos | Manage & Edit Video | 1156 | 8 |
| /admin/shorts | Manage Bite | 1278 | 11 |
| /admin/channel | User Channel | 929 | 3 |
| /admin/sound | Sound List | 743 | 2 |
| /admin/settingPage | Setting | 1386 | 11 |
| /admin/profile | Profile Details | 753 | 1 |
| /admin/allreport | Short Report | 773 | 2 |
| /admin/premiumPlanTable | Premium Plan | 740 | 1 |
| /admin/coinPlanTable | Coin Plan | 708 | 1 |
| /admin/coinplanhistory | Coin Plan Purchase History | 719 | 1 |
| /admin/withdrawRequest | Withdrawal Request | 785 | 1 |
| /admin/reward | Ads Coin Reward | 823 | 1 |
| /admin/allmonetizationRequest | Monetization Request | 766 | 1 |
| /admin/adminEarnings | All Plan Earning | 853 | 1 |

### District Franchise (AGENCY_ADMIN) — 6 routes × 4 widths = 24 views; problem signals: 0

| Route | Heading | chars @1366 | unlabelled controls @1366 |
|---|---|---|---|
| /admin/agencyDashboard | Trichy District Agency | 1295 | 1 |
| /admin/franchisePartners | Digital Partners | 645 | 1 |
| /admin/franchiseReferrals | Referrals | 866 | 1 |
| /admin/agencyReports | Franchise Reports | 714 | 1 |
| /admin/digitalPartnerReports | Digital Partner Reports | 893 | 3 |
| /admin/profile | Profile Details | 314 | 1 |

### Digital Partner (DIGITAL_PARTNER_ADMIN) — 7 routes × 4 widths = 28 views; problem signals: 0

| Route | Heading | chars @1366 | unlabelled controls @1366 |
|---|---|---|---|
| /admin/partnerDashboard | Welcome, Trichy Digital Partner | 1233 | 1 |
| /admin/partnerReferrals | Your referrals | 565 | 1 |
| /admin/partnerRewards | Reward history | 253 | 1 |
| /admin/partnerWallet | Wallet | 389 | 1 |
| /admin/partnerLocalBusinessAds | Local Business Ads | 571 | 2 |
| /admin/digitalPartnerReports | My Partner Report | 551 | 3 |
| /admin/profile | Profile Details | 315 | 1 |

**Totals:** 184 role/route/width views, 1 with an overflow, exception, HTTP ≥ 400, redirect or blank-page signal. (Demo data is small, so empty-state rendering is exercised more than dense-table behaviour; very long names, thousands of rows and slow networks were not tested.)

## 3. Navigation and state checks (demo stack) [E]

| Check | Result |
|---|---|
| Franchise login opens `/admin/userTable` (super-admin page) by URL | redirected to `/admin/agencyDashboard` before any API call |
| Franchise login opens an unknown admin URL | redirected to `/admin/agencyDashboard` |
| Super Admin opens an unknown admin URL | stays on `/admin/doesNotExist` with an **empty content area** (AFE-19) |
| Browser Back after two page changes | returns to `/admin/franchisePartners` |
| Offline (network emulation) on the franchise dashboard | shows "Dashboard unavailable. Couldn't load your…" (graceful) |
| Invalid/expired JWT after reload | session cleared, `/login` |
| Reload on a deep page (partner wallet) | stays logged in, same page (`Wallet`) |

## 4. Visual defects seen
- Dashboard "Total User Activity" donut is wider than its card at 1366 px and clipped on the right (`admin-super/mainDashboard-1366.jpg`); fine at 1920/768/390 (AFE-20).
- Dashboard line chart: categorical x-axis with unequal date gaps drawn equidistant, Bézier smoothing between sparse points, no y-axis labels (AFE-20).
- Withdrawal table on a 390 px phone: columns are clipped inside a horizontal scroller (no visible scroll affordance); in the screenshot taken 3.2 s after navigation the table still showed the loading bar and no empty-state text, whereas at 1366 px the same page showed "No data found" (possibly timing; not re-measured) (`admin-super/withdrawRequest-390.jpg`).
- Commission status cell renders "Paid —" (stray dash) on the franchise dashboard.

## 5. Not covered
Colour contrast and keyboard focus order (not measured); dark theme; RTL languages; the consumer app on Android/iOS; the signed-in consumer web screens on the deployed site; admin on the deployed site; printing/export.
