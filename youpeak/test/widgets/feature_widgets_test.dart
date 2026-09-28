import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/misc.dart' show Override;
import 'package:flutter_test/flutter_test.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/core/network/app_api_client.dart';
import 'package:youpeak/core/security/domain/security_signals.dart';
import 'package:youpeak/core/security/presentation/task_lock_gate.dart';
import 'package:youpeak/core/security/security_service.dart';
import 'package:youpeak/core/system_config/presentation/system_configs_provider.dart';
import 'package:youpeak/features/payout/data/payout_repository.dart';
import 'package:youpeak/features/payout/domain/payout_rules.dart';
import 'package:youpeak/features/payout/presentation/withdrawal_modal.dart';
import 'package:youpeak/features/peak_boost/data/peak_boost_repository.dart';
import 'package:youpeak/features/peak_boost/domain/peak_boost.dart';
import 'package:youpeak/features/peak_boost/presentation/peak_boost_bottom_sheet.dart';
import 'package:youpeak/features/tasker/data/tasker_repository.dart';
import 'package:youpeak/features/tasker/domain/tasker_dashboard.dart';
import 'package:youpeak/features/tasker/presentation/tasker_dashboard_view.dart';

import '../support/fakes.dart';

class _FakeBoostRepo extends PeakBoostRepository {
  _FakeBoostRepo({this.failWith}) : super(AppApiClient());

  final ApiException? failWith;
  final calls = <({String videoId, int coins, String requestId})>[];

  @override
  Future<PeakBoostReceipt> boost({required String videoId, required int coins, required String requestId}) async {
    calls.add((videoId: videoId, coins: coins, requestId: requestId));
    if (failWith != null) throw failWith!;
    return PeakBoostReceipt(boostId: "pb_1", coins: coins, balance: 0, creatorCoins: (coins * 0.8).round(), platformCoins: (coins * 0.2).round(), boosterName: "Asha");
  }
}

class _FakeTaskerRepo extends TaskerRepository {
  _FakeTaskerRepo() : super(AppApiClient());

  @override
  Future<TaskerDashboard> fetchDashboard() async => TaskerDashboard.fromJson(sampleDashboardJson());
}

class _FakePayoutRepo extends PayoutRepository {
  _FakePayoutRepo() : super(AppApiClient());

  final requests = <PayoutRequest>[];

  @override
  Future<PayoutReceipt> request(PayoutRequest request) async {
    requests.add(request);
    return PayoutReceipt(requestId: "wr_1", amountInr: request.amountInr, convertedCoins: request.amountInr * 100, isFirstWithdrawal: true);
  }
}

List<Override> _baseOverrides({TaskSecurityState security = const TaskSecurityState(status: TaskSecurityStatus.allowed)}) => [
      systemConfigSourceProvider.overrideWithValue(FakeConfigSource()),
      systemConfigCacheProvider.overrideWithValue(InMemoryConfigCache()),
      securityServiceProvider.overrideWith(() => FakeSecurityService(security)),
      taskerRepositoryProvider.overrideWithValue(_FakeTaskerRepo()),
    ];

/// A screen with one button that opens [open]; the sheet's result is kept.
class _Launcher extends StatelessWidget {
  const _Launcher({required this.open, required this.onResult});

  final Future<Object?> Function(BuildContext) open;
  final void Function(Object?) onResult;

  @override
  Widget build(BuildContext context) => Scaffold(
        body: Center(child: Builder(builder: (ctx) => ElevatedButton(onPressed: () async => onResult(await open(ctx)), child: const Text("open")))),
      );
}

void main() {
  setUpAll(() => GoogleFonts.config.allowRuntimeFetching = false);

  Future<void> pumpSheet(WidgetTester tester, {required int? balance, required _FakeBoostRepo repo, void Function(Object?)? onResult, VoidCallback? onGetCoins}) async {
    tester.view.physicalSize = const Size(1080, 2400);
    tester.view.devicePixelRatio = 2.5;
    addTearDown(tester.view.reset);
    await tester.pumpWidget(ProviderScope(
      overrides: [
        ..._baseOverrides(),
        boostBalanceProvider.overrideWithValue(balance),
        peakBoostRepositoryProvider.overrideWithValue(repo),
      ],
      child: MaterialApp(
        home: _Launcher(
          open: (ctx) => showPeakBoostSheet(ctx, videoId: "video_1", creatorName: "Ravi", onGetCoins: onGetCoins ?? () {}),
          onResult: onResult ?? (_) {},
        ),
      ),
    ));
    await tester.tap(find.text("open"));
    await tester.pumpAndSettle();
  }

  group("PeakBoostBottomSheet", () {
    testWidgets("shows presets, balance and the 80/20 notice", (tester) async {
      await pumpSheet(tester, balance: 12000, repo: _FakeBoostRepo());
      for (final name in ["Starter Boost", "Mini Boost", "Super Boost", "Mega Boost", "Ultra Boost", "Custom Boost"]) {
        expect(find.text(name), findsOneWidget);
      }
      expect(find.text("12,000"), findsOneWidget); // gold coin counter
      expect(find.textContaining("80% goes to the creator · 20% platform fee"), findsOneWidget);
      expect(find.text("Boost 500 Coins · ₹5.00"), findsOneWidget); // Mini Boost preselected
    });

    testWidgets("not enough coins: CTA becomes 'Insufficient Balance • Get Coins' and routes to tasks", (tester) async {
      var gotCoins = false;
      final repo = _FakeBoostRepo();
      await pumpSheet(tester, balance: 50, repo: repo, onGetCoins: () => gotCoins = true);
      expect(find.text("Insufficient Balance • Get Coins"), findsOneWidget);
      await tester.tap(find.text("Insufficient Balance • Get Coins"));
      await tester.pumpAndSettle();
      expect(gotCoins, isTrue);
      expect(repo.calls, isEmpty);
      expect(find.text("Mini Boost"), findsNothing); // sheet closed
    });

    testWidgets("boosting a preset sends coins + an idempotency key and returns the receipt", (tester) async {
      Object? result;
      final repo = _FakeBoostRepo();
      await pumpSheet(tester, balance: 12000, repo: repo, onResult: (r) => result = r);
      await tester.tap(find.text("Super Boost"));
      await tester.pump();
      await tester.tap(find.text("Boost 2,000 Coins · ₹20.00"));
      await tester.pumpAndSettle();
      expect(repo.calls.single.coins, 2000);
      expect(repo.calls.single.videoId, "video_1");
      expect(repo.calls.single.requestId, matches(RegExp(r"^[0-9a-f]{16}$")));
      expect(result, isA<PeakBoostReceipt>());
      expect((result as PeakBoostReceipt).toastText, "Asha boosted 2,000 Coins!");
    });

    testWidgets("custom boost is validated against 100 – 1,000,000", (tester) async {
      await pumpSheet(tester, balance: 12000, repo: _FakeBoostRepo());
      await tester.tap(find.text("Custom Boost"));
      await tester.pumpAndSettle();
      await tester.enterText(find.byType(TextField), "50");
      await tester.pump();
      expect(find.textContaining("Boost between 100 and 10,00,000 coins"), findsOneWidget);
      await tester.enterText(find.byType(TextField), "1500");
      await tester.pump();
      expect(find.text("Boost 1,500 Coins · ₹15.00"), findsOneWidget);
    });

    testWidgets("a server refusal is shown and the balance corrected", (tester) async {
      final repo = _FakeBoostRepo(failWith: const ApiException("INSUFFICIENT_BALANCE", "Insufficient balance.", data: {"balance": 300}));
      await pumpSheet(tester, balance: 12000, repo: repo);
      await tester.tap(find.text("Boost 500 Coins · ₹5.00"));
      await tester.pumpAndSettle();
      expect(find.text("Insufficient balance."), findsOneWidget);
      expect(find.text("300"), findsOneWidget);
      expect(find.text("Insufficient Balance • Get Coins"), findsOneWidget);
    });
  });

  group("TaskerDashboardBody", () {
    Future<void> pumpDashboard(WidgetTester tester, Map<String, dynamic> json, {TaskSecurityState? security}) async {
      tester.view.physicalSize = const Size(1080, 4000);
      tester.view.devicePixelRatio = 2.5;
      addTearDown(tester.view.reset);
      await tester.pumpWidget(ProviderScope(
        overrides: _baseOverrides(security: security ?? const TaskSecurityState(status: TaskSecurityStatus.allowed)),
        child: MaterialApp(home: Scaffold(body: TaskerDashboardBody(dashboard: TaskerDashboard.fromJson(json)))),
      ));
      await tester.pumpAndSettle();
    }

    testWidgets("level, caps, lifetime progress, checklist, milestone and dual buttons", (tester) async {
      await pumpDashboard(tester, sampleDashboardJson());
      expect(find.text("★ LEVEL 1"), findsOneWidget);
      expect(find.text("Level 1 Tasker"), findsOneWidget);
      expect(find.text("Today's Cap"), findsOneWidget);
      expect(find.text("2,500 coins"), findsOneWidget);
      expect(find.text("+500 boost included"), findsOneWidget);
      expect(find.text("Today's Earned"), findsOneWidget);
      expect(find.text("640 coins"), findsOneWidget);
      expect(find.text("50.0 / 100 hrs"), findsOneWidget);
      expect(find.textContaining("50% to Level 2 Tasker"), findsOneWidget);
      expect(find.text("Daily Action Limits"), findsOneWidget);
      expect(find.text("7/20"), findsOneWidget); // ads
      expect(find.text("10/10"), findsOneWidget); // likes (done)
      expect(find.text("45/120 min"), findsOneWidget); // watch time
      expect(find.text("Partner Milestone"), findsOneWidget);
      expect(find.text("Withdraw"), findsOneWidget);
      expect(find.text("Starter Pass"), findsOneWidget);
      expect(find.text("Daily Cap Reached! Earn more tomorrow."), findsNothing);
    });

    testWidgets("cap reached shows the spec's banner", (tester) async {
      await pumpDashboard(tester, sampleDashboardJson(capReached: true));
      expect(find.text("Daily Cap Reached! Earn more tomorrow."), findsOneWidget);
    });

    testWidgets("a VPN lock shows the reason with a re-check", (tester) async {
      await pumpDashboard(tester, sampleDashboardJson(), security: const TaskSecurityState(status: TaskSecurityStatus.locked, reasons: [LockReason.vpn]));
      expect(find.text("Turn off your VPN to continue earning."), findsOneWidget);
      expect(find.text("Check again"), findsOneWidget);
    });
  });

  group("WithdrawalModal", () {
    Future<_FakePayoutRepo> pumpModal(WidgetTester tester, Map<String, dynamic> json) async {
      tester.view.physicalSize = const Size(1080, 3000);
      tester.view.devicePixelRatio = 2.5;
      addTearDown(tester.view.reset);
      final repo = _FakePayoutRepo();
      await tester.pumpWidget(ProviderScope(
        overrides: [..._baseOverrides(), payoutRepositoryProvider.overrideWithValue(repo)],
        child: MaterialApp(
          home: _Launcher(open: (ctx) => showWithdrawalModal(ctx, dashboard: TaskerDashboard.fromJson(json)), onResult: (_) {}),
        ),
      ));
      await tester.tap(find.text("open"));
      await tester.pumpAndSettle();
      return repo;
    }

    testWidgets("first payout: ₹100 trust hook, amount validated before sending", (tester) async {
      final repo = await pumpModal(tester, sampleDashboardJson());
      expect(find.text("First withdrawal — Trust Hook"), findsOneWidget);
      expect(find.text("Minimum ₹100 (10,000 coins)."), findsOneWidget);
      expect(find.text("Your tier allows up to ₹750 per withdrawal."), findsOneWidget);

      await tester.enterText(find.widgetWithText(TextFormField, "Amount"), "50");
      await tester.enterText(find.widgetWithText(TextFormField, "UPI ID / VPA"), "asha@okaxis");
      await tester.tap(find.text("Request withdrawal"));
      await tester.pumpAndSettle();
      expect(find.textContaining("Minimum withdrawal is ₹100"), findsOneWidget);
      expect(repo.requests, isEmpty);

      await tester.enterText(find.widgetWithText(TextFormField, "Amount"), "100");
      await tester.tap(find.text("Request withdrawal"));
      await tester.pumpAndSettle();
      expect(repo.requests.single.toJson(), {"amountInr": 100, "method": "UPI", "upiId": "asha@okaxis"});
      expect(find.text("Withdrawal requested"), findsOneWidget);
      expect(find.textContaining("Pending approval"), findsOneWidget);
    });

    testWidgets("later payouts use the ₹500 standard minimum", (tester) async {
      await pumpModal(tester, sampleDashboardJson(firstWithdrawal: false));
      expect(find.text("Standard withdrawal"), findsOneWidget);
      expect(find.text("Minimum ₹500 (50,000 coins)."), findsOneWidget);
    });
  });

  testWidgets("TaskLockedView explains the lock and retries", (tester) async {
    var retried = 0;
    await tester.pumpWidget(MaterialApp(
      home: TaskLockedView(
        state: const TaskSecurityState(status: TaskSecurityStatus.locked, reasons: [LockReason.deviceLinked, LockReason.vpn]),
        onRetry: () => retried++,
      ),
    ));
    expect(find.text("Tasks paused"), findsOneWidget);
    expect(find.text("This phone is already linked to another YouPeak tasker account."), findsOneWidget);
    expect(find.text("Turn off your VPN to continue earning."), findsOneWidget);
    await tester.tap(find.text("Check again"));
    expect(retried, 1);
  });
}
