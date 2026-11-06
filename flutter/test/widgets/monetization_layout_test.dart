import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:youpeak/core/platform/responsive.dart';
import 'package:youpeak/features/monetization/view/monetization_view.dart';

import '../support/shell_harness.dart';

Widget _page(
    {bool loading = false, bool eligible = true, bool showAction = true, double watch = 0.4, double subs = 1, VoidCallback? onAction}) {
  return Scaffold(
    appBar: AppBar(title: const Text('Monetization')),
    body: MonetizationLayout(
      loading: loading,
      name: 'Asha Verma',
      watchProgress: watch,
      watchLabel: '40 Hr / 100 Hr',
      subscriberProgress: subs,
      subscriberLabel: '1200 / 1000',
      eligible: eligible,
      showAction: showAction,
      onAction: onAction ?? () {},
    ),
  );
}

void main() {
  setUpAll(loadPreviewAssets);

  group('requirementProgress', () {
    test('stays within 0..1 whatever the numbers', () {
      expect(requirementProgress(50, 100), 0.5);
      expect(requirementProgress(500, 100), 1.0);
      expect(requirementProgress(-5, 100), 0.0);
      expect(requirementProgress(null, 100), 0.0);
      expect(requirementProgress(0, 0), 1.0);
      expect(requirementProgress(3, null), 1.0);
      expect(requirementProgress(double.nan, 10), 0.0);
      expect(requirementProgress(double.infinity, 10), 1.0);
    });
  });

  for (final entry in layoutSizes.entries) {
    testWidgets('lays out without overflow at ${entry.key}', (tester) async {
      await pumpInShell(tester, entry.value, _page(), maxWidth: 1120);
      expectNoLayoutErrors(tester, where: entry.key);
      expectNoHorizontalOverflow(tester, entry.value);
      await shoot(tester, 'monetization_${entry.key}');
      expect(find.byType(MonetizationLayout), findsOneWidget);
    });
  }

  testWidgets('wide: hero on top, two requirement cards side by side, action right under them', (tester) async {
    await pumpInShell(tester, const Size(1440, 900), _page(), maxWidth: 1120);
    final cards = find.byType(SurfaceCard);
    expect(cards, findsNWidgets(3));
    final hero = tester.getRect(cards.at(0));
    final left = tester.getRect(cards.at(1));
    final right = tester.getRect(cards.at(2));
    expect(hero.bottom, lessThan(left.top));
    expect(left.right, lessThan(right.left));
    expect(left.top, right.top);
    expect(hero.width, closeTo(1056, 1), reason: 'fills the 1120 page minus its 32px gutters, not a phone column');
    final button = tester.getRect(find.byKey(const ValueKey('monetization-action')));
    expect(button.top - left.bottom, lessThan(40), reason: 'the action sits next to the requirements');
    expect(button.left, closeTo(left.left, 1));
  });

  testWidgets('compact: sections stack and the action docks to the bottom', (tester) async {
    await pumpInShell(tester, const Size(390, 844), _page(), maxWidth: 1120);
    await shoot(tester, 'monetization_compact_check');
    final image = tester.getRect(find.byType(Image));
    final card = tester.getRect(find.byType(SurfaceCard));
    expect(image.bottom, lessThanOrEqualTo(card.top), reason: 'intro above the card');
    expect(find.byType(SurfaceCard), findsOneWidget);
    final button = tester.getRect(find.byKey(const ValueKey('monetization-action')));
    expect(button.top, greaterThan(card.bottom));
    expect(button.bottom, greaterThan(800), reason: 'docked at the bottom of the window');
  });

  testWidgets('the action fires, and a monetized channel has none', (tester) async {
    var taps = 0;
    await pumpInShell(tester, const Size(1440, 900), _page(onAction: () => taps++), maxWidth: 1120);
    await tester.tap(find.byKey(const ValueKey('monetization-action')));
    expect(taps, 1);

    await pumpInShell(tester, const Size(1440, 900), _page(showAction: false), maxWidth: 1120);
    expect(find.byKey(const ValueKey('monetization-action')), findsNothing);
  });

  testWidgets('dark theme lays out and keeps the cards readable', (tester) async {
    for (final size in [const Size(390, 844), const Size(1440, 900)]) {
      await pumpInShell(tester, size, _page(), maxWidth: 1120, dark: true);
      expectNoLayoutErrors(tester, where: 'dark $size');
      await shoot(tester, 'monetization_dark_${size.width.toInt()}');
    }
  });

  testWidgets('loading state fits every size', (tester) async {
    for (final size in layoutSizes.values) {
      await pumpInShell(tester, size, _page(loading: true), maxWidth: 1120);
      expectNoLayoutErrors(tester);
    }
  });
}
