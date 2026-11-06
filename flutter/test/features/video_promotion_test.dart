import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/core/network/app_api_client.dart';
import 'package:youpeak/core/settings/admin_settings_api.dart';
import 'package:youpeak/core/settings/admin_settings_model.dart';
import 'package:youpeak/features/peak_boost/domain/peak_boost.dart';
import 'package:youpeak/features/video_promotion/data/promotion_models.dart';
import 'package:youpeak/features/video_promotion/data/promotion_repository.dart';
import 'package:youpeak/features/video_promotion/view/promote_flow_view.dart';
import 'package:youpeak/features/video_promotion/view/promote_video_view.dart';
import 'package:youpeak/features/video_promotion/view/promotion_campaign_view.dart';

// The server's /client/videoPromotion/plans reply for the rate card (DOC-20260826-WA0214).
final _plansJson = [
  {"id": "starter_plan", "name": "Starter Plan", "priceINR": 49, "currency": "INR", "impressionsMin": 2000, "impressionsMax": 2500, "durationDays": 1, "targeting": "Global", "category": "Daily", "costPer1kLow": 19.6, "costPer1kHigh": 24.5},
  {"id": "basic_plan", "name": "Basic Plan", "priceINR": 99, "impressionsMin": 3000, "impressionsMax": 3500, "durationDays": 2, "targeting": "Global", "category": "Daily", "costPer1kLow": 28.29, "costPer1kHigh": 33},
  {"id": "pro_starter", "name": "Pro Starter", "priceINR": 199, "impressionsMin": 3000, "impressionsMax": 5000, "durationDays": 2, "targeting": "Global", "category": "Daily", "costPer1kLow": 39.8, "costPer1kHigh": 66.33},
  {"id": "boost_plan", "name": "Boost Plan", "priceINR": 249, "impressionsMin": 3000, "impressionsMax": 8000, "durationDays": 4, "targeting": "Global", "category": "Daily", "costPer1kLow": 31.13, "costPer1kHigh": 83},
  {"id": "weekly_mega_plan", "name": "Weekly Mega Plan", "priceINR": 1000, "impressionsMin": 50000, "impressionsMax": 75000, "durationDays": 7, "targeting": "Global", "category": "Weekly", "costPer1kLow": 13.33, "costPer1kHigh": 20},
  {"id": "monthly_pro_plan", "name": "Monthly Pro Plan", "priceINR": 3000, "impressionsMin": 200000, "impressionsMax": 250000, "durationDays": 30, "targeting": "Global", "category": "Monthly", "costPer1kLow": 12, "costPer1kHigh": 15},
];

final _campaignJson = {
  "_id": "promo_ptxn_1",
  "videoId": "v1",
  "video": {"_id": "v1", "title": "My trek vlog", "videoImage": ""},
  "plan": {"id": "weekly_mega_plan", "name": "Weekly Mega Plan", "priceINR": 1000, "impressionsMin": 50000, "impressionsMax": 75000, "durationDays": 7, "targeting": "Global"},
  "planName": "Weekly Mega Plan",
  "planPriceINR": 1000,
  "status": "active",
  "startedAt": "2026-10-08T10:00:00.000Z",
  "expiresAt": "2026-10-15T10:00:00.000Z",
  "impressionsDelivered": 1234,
  "impressionsTargetMin": 50000,
  "impressionsTargetMax": 75000,
  "createdAt": "2026-10-08T09:59:00.000Z",
};

class _FakePromoRepo extends PromotionRepository {
  _FakePromoRepo({this.failFirstLoad = false}) : super(AppApiClient());

  bool failFirstLoad;
  int planLoads = 0;

  @override
  Future<List<PromotionPlan>> plans() async {
    planLoads++;
    if (failFirstLoad) {
      failFirstLoad = false;
      throw const ApiException("NETWORK_ERROR", "Couldn't reach YouPeak. Check your connection and try again.");
    }
    return _plansJson.map(PromotionPlan.fromJson).toList();
  }

  @override
  Future<List<PromotionCampaign>> myCampaigns() async => [PromotionCampaign.fromJson(_campaignJson)];

  @override
  Future<List<PromotableVideo>> eligibleVideos() async => [
        PromotableVideo.fromJson({"_id": "bite1", "title": "A Bite", "eligible": false, "reason": "Only normal videos can be promoted (not Bites)."}),
        PromotableVideo.fromJson({"_id": "v1", "title": "My trek vlog", "eligible": true}),
      ];

  @override
  Future<(PromotionCampaign, List<CampaignEvent>)> campaign(String id) async =>
      (PromotionCampaign.fromJson(_campaignJson), [CampaignEvent.fromJson({"type": "activated", "at": "2026-10-08T10:00:00.000Z", "by": "payment"})]);
}

Future<void> _pump(WidgetTester tester, Widget page, _FakePromoRepo repo, {Size size = const Size(390, 844)}) async {
  tester.view.physicalSize = size * 2;
  tester.view.devicePixelRatio = 2;
  addTearDown(tester.view.reset);
  await tester.pumpWidget(ProviderScope(
    overrides: [promotionRepositoryProvider.overrideWithValue(repo)],
    child: GetMaterialApp(home: page),
  ));
  await tester.pump();
  await tester.pump();
}

void main() {
  setUpAll(() => GoogleFonts.config.allowRuntimeFetching = false);

  group("promotion models", () {
    test("plans parse from the server catalogue; labels use Indian grouping and say 'est.'", () {
      final plans = _plansJson.map(PromotionPlan.fromJson).toList();
      expect(plans.map((p) => p.id), ["starter_plan", "basic_plan", "pro_starter", "boost_plan", "weekly_mega_plan", "monthly_pro_plan"]);
      expect(plans.first.priceLabel, "₹49");
      expect(plans.first.impressionsLabel, "2,000 – 2,500");
      expect(plans.first.costPer1kLabel, "₹19.60 – ₹24.50");
      expect(plans.last.impressionsLabel, "2,00,000 – 2,50,000");
      expect(plans.last.costPer1kLabel, "₹12 – ₹15");
      expect(plans.last.priceLabel, "₹3,000");
      expect(plans[4].durationText, "7 days");
      expect(plans.first.durationText, "1 day");
    });

    test("30-day comparison matches the rate card and is a range, not a fixed multiplier", () {
      final cmp = PlanComparison.from(_plansJson.map(PromotionPlan.fromJson).toList())!;
      expect(cmp.daily.id, "starter_plan");
      expect(cmp.monthly.id, "monthly_pro_plan");
      expect(cmp.dailyTotal, 1470);
      expect(cmp.dailyImpressionsMin, 60000);
      expect(cmp.dailyImpressionsMax, 75000);
      expect(cmp.ratioLowToLow, closeTo(3.33, 0.01));
      expect(cmp.ratioLow, closeTo(2.67, 0.01));
      expect(cmp.ratioHigh, closeTo(4.17, 0.01));
      expect(PlanComparison.from(const []), isNull);
    });

    test("campaigns show the plan as bought, real counts and statuses", () {
      final c = PromotionCampaign.fromJson(_campaignJson);
      expect(c.planName, "Weekly Mega Plan");
      expect(c.priceInr, 1000);
      expect(c.impressionsDelivered, 1234);
      expect(c.estimateLabel, "50,000 – 75,000");
      expect(c.status, CampaignStatus.active);
      // Older rows: no snapshot, old plan name.
      final legacy = PromotionCampaign.fromJson({"_id": "x", "videoId": "v", "planName": "Weekly Mega", "planPriceINR": 1000, "status": "expired", "impressionsTargetMin": 50000, "impressionsTargetMax": 75000});
      expect(legacy.planName, "Weekly Mega");
      expect(legacy.impressionsDelivered, 0);
      expect(campaignStatusLabel(legacy.status), "Ended");
      expect(campaignStatusLabel(campaignStatusFrom("rejected")), "Taken down");
    });

    test("payment state: only the server's fulfilled flag means the promotion exists", () {
      final pending = PaymentState.fromJson({"status": true, "transaction": {"status": "paid", "fulfilled": false, "fulfilmentStatus": "PROCESSING"}});
      expect(pending.paid, isTrue);
      expect(pending.fulfilled, isFalse);
      final done = PaymentState.fromJson({"status": true, "transaction": {"status": "paid", "fulfilled": true, "campaignId": "promo_1"}});
      expect(done.fulfilled, isTrue);
      expect(done.campaignId, "promo_1");
      final created = PaymentState.fromJson({"status": true, "transaction": {"status": "created", "fulfilled": false}});
      expect(created.paid, isFalse);
    });

    test("Peak Boost status parses found / completed / balance", () {
      final s = PeakBoostStatus.fromJson({"status": true, "found": true, "completed": true, "coins": 2000, "balance": 100, "boostId": "pb_u_r"});
      expect(s.found && s.completed, isTrue);
      expect(s.receipt().coins, 2000);
      expect(PeakBoostStatus.fromJson({"status": true, "found": false, "balance": 5}).found, isFalse);
    });
  });

  group("Promote video pages", () {
    for (final size in const [Size(390, 844), Size(1366, 900)]) {
      testWidgets("hub at ${size.width.toInt()}px: Peak Boost vs promotion, real campaigns, plans, honest comparison", (tester) async {
        await _pump(tester, const PromoteVideoView(), _FakePromoRepo(), size: size);
        expect(find.text("Promote my video"), findsOneWidget);
        expect(find.text("Not the same as Peak Boost"), findsOneWidget);
        expect(find.text("My trek vlog"), findsOneWidget);
        expect(find.text("1,234 counted · est. 50,000 – 75,000"), findsOneWidget);
        await tester.scrollUntilVisible(find.text("₹1,470"), 300, scrollable: find.byType(Scrollable).first);
        expect(find.text("₹1,470"), findsOneWidget);
        expect(find.textContaining("2.7× to 4.2×"), findsOneWidget);
        expect(find.textContaining("3.3× comparing the low ends"), findsOneWidget);
        // No claims the product doesn't deliver.
        expect(find.textContaining(RegExp("priority|guaranteed|automated", caseSensitive: false)), findsNothing);
        expect(tester.takeException(), isNull);
      });
    }

    testWidgets("hub load error shows Retry, which reloads", (tester) async {
      final repo = _FakePromoRepo(failFirstLoad: true);
      await _pump(tester, const PromoteVideoView(), repo);
      expect(find.text("Couldn't reach YouPeak. Check your connection and try again."), findsOneWidget);
      await tester.tap(find.text("Retry"));
      await tester.pump();
      await tester.pump();
      expect(repo.planLoads, 2);
      expect(find.text("Promote my video"), findsOneWidget);
    });

    for (final size in const [Size(390, 844), Size(1366, 900)]) {
      testWidgets("flow at ${size.width.toInt()}px: ineligible video explained → plan details → review with the server price", (tester) async {
        await _pump(tester, const PromoteFlowView(), _FakePromoRepo(), size: size);
        expect(find.text("Choose one of your videos"), findsOneWidget);
        expect(find.text("Only normal videos can be promoted (not Bites)."), findsOneWidget);
        await tester.tap(find.text("A Bite"));
        await tester.pump();
        expect(find.text("Choose a plan"), findsNothing, reason: "ineligible video can't be picked");
        await tester.tap(find.text("My trek vlog").first);
        await tester.pump();
        expect(find.text("Choose a plan"), findsOneWidget);
        await tester.ensureVisible(find.text("Weekly Mega Plan").first);
        await tester.pumpAndSettle();
        await tester.tap(find.text("Weekly Mega Plan").first);
        await tester.pumpAndSettle();
        expect(find.text("Choose Weekly Mega Plan"), findsOneWidget);
        expect(find.text("₹1,000 (full amount charged)"), findsOneWidget);
        await tester.ensureVisible(find.text("Choose Weekly Mega Plan"));
        await tester.pumpAndSettle();
        await tester.tap(find.text("Choose Weekly Mega Plan"));
        await tester.pumpAndSettle();
        expect(find.text("Review your order"), findsOneWidget);
        expect(find.text("Pay ₹1,000"), findsOneWidget);
        expect(find.text("50,000 – 75,000"), findsOneWidget);
        expect(find.textContaining("estimates, not guarantees"), findsWidgets);
        expect(tester.takeException(), isNull);
      });
    }

    testWidgets("checkout follows the admin Razorpay switch: explicitly off hides Pay; unset keeps it", (tester) async {
      Future<void> toReview() async {
        await _pump(tester, const PromoteFlowView(initialPlanId: "starter_plan"), _FakePromoRepo());
        await tester.tap(find.text("My trek vlog").first);
        await tester.pumpAndSettle();
      }

      AdminSettingsApi.adminSettingsModel = AdminSettingsModel(setting: Setting(razorPaySwitch: false));
      addTearDown(() => AdminSettingsApi.adminSettingsModel = null);
      await toReview();
      expect(find.text("Review your order"), findsOneWidget);
      expect(find.text("Promotion purchases aren't available on this device right now."), findsOneWidget);
      expect(find.text("Pay ₹49"), findsNothing);

      AdminSettingsApi.adminSettingsModel = AdminSettingsModel(setting: Setting());
      await tester.pumpWidget(const SizedBox()); // fresh page
      await toReview();
      expect(find.text("Pay ₹49"), findsOneWidget);
    });

    testWidgets("campaign details: status, counted impressions, what was bought, history", (tester) async {
      await _pump(tester, const PromotionCampaignView(campaignId: "promo_ptxn_1"), _FakePromoRepo(), size: const Size(1366, 900));
      expect(find.text("Running"), findsOneWidget);
      expect(find.text("1,234"), findsOneWidget);
      expect(find.text("₹1,000"), findsOneWidget);
      expect(find.text("Payment verified — promotion started"), findsOneWidget);
      expect(tester.takeException(), isNull);
    });
  });
}
