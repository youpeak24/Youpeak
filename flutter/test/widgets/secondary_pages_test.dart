import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:get/get.dart';
import 'package:youpeak/features/wallet/controller/my_wallet_controller.dart';
import 'package:youpeak/features/wallet/model/get_wallet_history_model.dart';
import 'package:youpeak/features/wallet/view/my_wallet_view.dart';
import 'package:youpeak/features/wallet/view/withdraw_view.dart';

import '../support/shell_harness.dart';

/// Wallet controller that holds data instead of calling the API.
class _FakeWallet extends MyWalletController {
  _FakeWallet() {
    myBalance = 4820;
    walletHistory = [
      for (var i = 0; i < 12; i++)
        Data(
            id: '$i',
            uniqueId: 'TXN${1000 + i}',
            type: i.isEven ? 1 : 2,
            coin: 1200 + i * 35,
            amount: 120 + i,
            date: '2026-10-${10 + i} 14:3$i'),
    ];
  }

  @override
  // ignore: must_call_super
  void onInit() {}
}

void main() {
  setUpAll(loadPreviewAssets);
  tearDown(Get.reset);

  group('MyWalletView', () {
    for (final entry in layoutSizes.entries) {
      testWidgets('populated at ${entry.key}', (tester) async {
        Get.put<MyWalletController>(_FakeWallet());
        await pumpInShell(tester, entry.value, const MyWalletView(), maxWidth: 1000);
        expectNoLayoutErrors(tester, where: entry.key);
        await shoot(tester, 'wallet_${entry.key}');
        expect(find.byType(WalletItem), findsWidgets);
      });
    }

    testWidgets('wide: Withdraw sits under the balance, not at the bottom of the window', (tester) async {
      Get.put<MyWalletController>(_FakeWallet());
      await pumpInShell(tester, const Size(1440, 900), const MyWalletView(), maxWidth: 1000);
      final withdraw = tester.getRect(find.text('withdraw'));
      expect(withdraw.bottom, lessThan(300));
      expect(find.byType(WalletItem), findsWidgets);
    });

    testWidgets('compact: Withdraw is docked to the bottom', (tester) async {
      Get.put<MyWalletController>(_FakeWallet());
      await pumpInShell(tester, const Size(390, 844), const MyWalletView(), maxWidth: 1000);
      expect(tester.getRect(find.text('withdraw')).bottom, greaterThan(780));
    });
  });

  group('actions stay with their content between a phone and a split layout', () {
    testWidgets('Withdraw at 768px is under the form, not at the window bottom', (tester) async {
      await guarded(() async {
        await pumpInShell(tester, const Size(768, 1024), WithdrawView(balance: 4820), maxWidth: 1000);
        final button = find.text('withdraw').evaluate().map((e) => tester.getRect(find.byWidget(e.widget))).reduce((a, b) => a.top > b.top ? a : b);
        expect(button.bottom, lessThan(800), reason: 'a docked button would sit at ~990');
        expect(button.top, greaterThan(300), reason: 'below the form fields');
      });
    });

    testWidgets('Withdraw at 390px keeps the phone design: docked at the bottom', (tester) async {
      await guarded(() async {
        await pumpInShell(tester, const Size(390, 844), WithdrawView(balance: 4820), maxWidth: 1000);
        final button = find.text('withdraw').evaluate().map((e) => tester.getRect(find.byWidget(e.widget))).reduce((a, b) => a.top > b.top ? a : b);
        expect(button.bottom, greaterThan(780));
      });
    });
  });

  group('WithdrawView', () {
    for (final entry in layoutSizes.entries) {
      testWidgets('at ${entry.key}', (tester) async {
        await pumpInShell(tester, entry.value, const WithdrawView(balance: 4820), maxWidth: 1000);
        expectNoLayoutErrors(tester, where: entry.key);
        await shoot(tester, 'withdraw_${entry.key}');
      });
    }
  });
}
