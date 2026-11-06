// ignore_for_file: prefer_const_constructors

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:get/get.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'package:youpeak/features/main/view/main_home_view.dart';

import '../support/shell_harness.dart';

/// The four main tabs (Home, Bites, Subscription, Library) inside the main
/// screen, which swaps its bottom bar for the sidebar on wide windows.
/// Loading/empty states only: there is no backend in the tests.
const _tabs = {0: 'home', 1: 'bites', 2: 'subscription', 3: 'library'};

void main() {
  setUpAll(() async {
    await loadPreviewAssets();
    await seedSession();
    useFakeFirebase();
  });
  tearDown(Get.reset);

  for (final tab in _tabs.entries) {
    for (final size in layoutSizes.entries) {
      testWidgets('${tab.value} tab at ${size.key}', (tester) async {
        await guarded(() async {
          AppSettings.navigationIndex.value = tab.key;
          await pumpFull(tester, size.value, MainHomePageView());
          expectNoLayoutErrors(tester, where: '${tab.value} ${size.key}');
          await shoot(tester, 'main_${tab.value}_${size.key}');
          await tester.pumpWidget(const SizedBox());
          await tester.pump(const Duration(seconds: 30));
          tester.takeException();
        });
      });
    }
  }
}
