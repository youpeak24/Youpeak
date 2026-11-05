import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:get/get.dart';
import 'package:youpeak/core/localization/languages/language_en.dart';
import 'package:youpeak/features/ad_credits/controller/ad_credits_controller.dart';
import 'package:youpeak/features/ad_credits/model/ad_credits_models.dart';
import 'package:youpeak/features/ad_credits/view/ad_credits_wallet_view.dart';

class TestTranslations extends Translations {
  @override
  Map<String, Map<String, String>> get keys => {
        'en_US': enUS,
      };
}

void main() {
  setUp(() {
    Get.testMode = true;
    Get.clearTranslations();
    Get.addTranslations(TestTranslations().keys);
    Get.locale = const Locale('en', 'US');
  });

  tearDown(() {
    Get.reset();
  });

  group('Ad Credits Models Test', () {
    test('AdCreditWalletData parses accurately from JSON and handles empty fallback', () {
      final json = {
        'available': 1250.50,
        'plan': 1000.0,
        'topup': 248.50,
        'bonus': 2.0,
        'expiringSoon': 50.0,
        'expiringSoonDate': '2028-10-12T12:00:00.000Z',
        'activeLotsCount': 3,
      };

      final wallet = AdCreditWalletData.fromJson(json);
      expect(wallet.available, 1250.50);
      expect(wallet.plan, 1000.0);
      expect(wallet.topup, 248.50);
      expect(wallet.bonus, 2.0);
      expect(wallet.expiringSoon, 50.0);
      expect(wallet.expiringSoonDate, '2028-10-12T12:00:00.000Z');
      expect(wallet.activeLotsCount, 3);

      final empty = AdCreditWalletData.empty();
      expect(empty.available, 0.0);
      expect(empty.plan, 0.0);
      expect(empty.activeLotsCount, 0);
    });

    test('AdCreditPack parses and extracts pricing, validity and bonus chips', () {
      final json = {
        'id': 'pack_100',
        'name': '100 Credits',
        'credits': 100.0,
        'baseCredits': 98.04,
        'bonusCredits': 1.96,
        'bonusPercent': 2,
        'priceINR': 160.0,
        'validityDays': 730,
        'isActive': true,
      };

      final pack = AdCreditPack.fromJson(json);
      expect(pack.id, 'pack_100');
      expect(pack.name, '100 Credits');
      expect(pack.credits, 100.0);
      expect(pack.baseCredits, 98.04);
      expect(pack.bonusCredits, 1.96);
      expect(pack.bonusPercent, 2);
      expect(pack.priceINR, 160.0);
      expect(pack.validityDays, 730);
      expect(pack.isActive, true);
    });

    test('AdCreditLedgerItem parses credit and debit directions', () {
      final creditJson = {
        'id': 'adc_123',
        'credits': 100.0,
        'baseCredits': 98.0,
        'bonusCredits': 2.0,
        'direction': 'CREDIT',
        'source': 'TOPUP',
        'type': 'MIXED',
        'balanceAfter': 100.0,
        'createdAt': '2026-10-13T10:00:00.000Z',
      };
      final debitJson = {
        'id': 'adc_456',
        'credits': 20.0,
        'direction': 'DEBIT',
        'source': 'SPEND',
        'purpose': 'video_promotion',
        'type': 'BASE',
        'balanceAfter': 80.0,
        'createdAt': '2026-10-13T11:00:00.000Z',
      };

      final creditItem = AdCreditLedgerItem.fromJson(creditJson);
      expect(creditItem.direction, 'CREDIT');
      expect(creditItem.credits, 100.0);

      final debitItem = AdCreditLedgerItem.fromJson(debitJson);
      expect(debitItem.direction, 'DEBIT');
      expect(debitItem.purpose, 'video_promotion');
      expect(debitItem.balanceAfter, 80.0);
    });
  });

  group('AdCreditsController Logic Test', () {
    test('Controller handles pack selection, filter toggling, and terms checkbox', () {
      final controller = AdCreditsController();

      // Populate test packs
      controller.packs = [
        AdCreditPack(
          id: 'pack_100',
          name: '100 Credits',
          credits: 100.0,
          baseCredits: 98.0,
          bonusCredits: 2.0,
          bonusPercent: 2,
          priceINR: 160.0,
          validityDays: 730,
          isActive: true,
        ),
        AdCreditPack(
          id: 'pack_330',
          name: '330 Credits',
          credits: 330.0,
          baseCredits: 330.0,
          bonusCredits: 0.0,
          bonusPercent: 0,
          priceINR: 520.0,
          validityDays: 730,
          isActive: true,
        ),
      ];

      expect(controller.selectedPack?.id, 'pack_100');
      controller.selectPack(1);
      expect(controller.selectedPack?.id, 'pack_330');

      // Terms toggle
      expect(controller.isTermsAccepted, true);
      controller.toggleTerms(false);
      expect(controller.isTermsAccepted, false);
      controller.toggleTerms(true);
      expect(controller.isTermsAccepted, true);

      // History filters
      controller.history = [
        AdCreditLedgerItem(
          id: '1',
          credits: 100.0,
          baseCredits: 100.0,
          bonusCredits: 0.0,
          direction: 'CREDIT',
          source: 'TOPUP',
          type: 'BASE',
          balanceAfter: 100.0,
          createdAt: '',
        ),
        AdCreditLedgerItem(
          id: '2',
          credits: 25.0,
          baseCredits: 25.0,
          bonusCredits: 0.0,
          direction: 'DEBIT',
          source: 'SPEND',
          type: 'BASE',
          balanceAfter: 75.0,
          createdAt: '',
        ),
        AdCreditLedgerItem(
          id: '3',
          credits: 10.0,
          baseCredits: 10.0,
          bonusCredits: 0.0,
          direction: 'DEBIT',
          source: 'EXPIRY',
          type: 'BASE',
          balanceAfter: 65.0,
          createdAt: '',
        ),
      ];

      controller.setFilter('ALL');
      expect(controller.filteredHistory.length, 3);

      controller.setFilter('CREDIT');
      expect(controller.filteredHistory.length, 1);
      expect(controller.filteredHistory.first.id, '1');

      controller.setFilter('DEBIT');
      expect(controller.filteredHistory.length, 1);
      expect(controller.filteredHistory.first.id, '2');

      controller.setFilter('EXPIRY');
      expect(controller.filteredHistory.length, 1);
      expect(controller.filteredHistory.first.id, '3');
    });
  });

  group('AdCreditsWalletView Responsive Widget Rendering', () {
    Widget buildTestHarness(Size size) {
      return MediaQuery(
        data: MediaQueryData(size: size),
        child: const GetMaterialApp(
          home: AdCreditsWalletView(),
        ),
      );
    }

    testWidgets('Renders cleanly on Mobile (390 x 844)', (WidgetTester tester) async {
      tester.view.physicalSize = const Size(390, 844);
      tester.view.devicePixelRatio = 1.0;

      await tester.pumpWidget(buildTestHarness(const Size(390, 844)));
      await tester.pumpAndSettle();

      expect(find.byType(AdCreditsWalletView), findsOneWidget);
      expect(find.text('Credits'), findsWidgets);
    });

    testWidgets('Renders cleanly on Tablet (768 x 1024)', (WidgetTester tester) async {
      tester.view.physicalSize = const Size(768, 1024);
      tester.view.devicePixelRatio = 1.0;

      await tester.pumpWidget(buildTestHarness(const Size(768, 1024)));
      await tester.pumpAndSettle();

      expect(find.byType(AdCreditsWalletView), findsOneWidget);
    });

    testWidgets('Renders cleanly on Desktop Laptop (1366 x 768)', (WidgetTester tester) async {
      tester.view.physicalSize = const Size(1366, 768);
      tester.view.devicePixelRatio = 1.0;

      await tester.pumpWidget(buildTestHarness(const Size(1366, 768)));
      await tester.pumpAndSettle();

      expect(find.byType(AdCreditsWalletView), findsOneWidget);
    });

    testWidgets('Renders cleanly on Desktop Wide (1920 x 1080)', (WidgetTester tester) async {
      tester.view.physicalSize = const Size(1920, 1080);
      tester.view.devicePixelRatio = 1.0;

      await tester.pumpWidget(buildTestHarness(const Size(1920, 1080)));
      await tester.pumpAndSettle();

      expect(find.byType(AdCreditsWalletView), findsOneWidget);
    });
  });
}
