import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:get/get.dart';
import 'package:youpeak/core/platform/app_layout.dart';
import 'package:youpeak/core/platform/platform_info.dart';
import 'package:youpeak/core/platform/responsive.dart';
import 'package:youpeak/features/main/view/wide_side_nav.dart';

import '../support/shell_harness.dart';

/// A page with state, reached through the app's real page transition.
class _CounterPage extends StatefulWidget {
  const _CounterPage();

  @override
  State<_CounterPage> createState() => _CounterPageState();
}

class _CounterPageState extends State<_CounterPage> {
  int count = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Column(
        children: [
          Text('count $count'),
          Text('page width ${PageWidth.of(context).round()}'),
          TextButton(onPressed: () => setState(() => count++), child: const Text('add')),
        ],
      ),
    );
  }
}

void main() {
  setUpAll(() async {
    await loadPreviewAssets();
    await seedSession();
    useFakeFirebase();
    AppLayout.shellBuilder = buildDesktopShell;
    AppLayout.shellAvailable = () => true;
    AppLayout.registerShellRoute(_CounterPage, maxContentWidth: 800);
  });
  tearDown(Get.reset);

  Future<void> resize(WidgetTester tester, Size size) async {
    tester.view.physicalSize = size;
    await tester.pump(const Duration(milliseconds: 300));
  }

  testWidgets('a page keeps its state while the window crosses the sidebar breakpoint', (tester) async {
    await guarded(() async {
      PlatformInfo.debugIsWeb = true;
      addTearDown(() => PlatformInfo.debugIsWeb = null);
      tester.view.devicePixelRatio = 1;
      tester.view.physicalSize = const Size(1440, 900);
      addTearDown(tester.view.reset);

      await tester.pumpWidget(
        GetMaterialApp(
          customTransition: AdaptivePageTransition(),
          home: const Scaffold(body: Text('root')),
        ),
      );
      Get.to(() => const _CounterPage());
      await tester.pumpAndSettle();

      // Desktop: sidebar beside the page, page capped at its registered width.
      expect(find.byType(WideSideNav), findsOneWidget);
      expect(find.text('page width 800'), findsOneWidget);
      await tester.tap(find.text('add'));
      await tester.pump();
      await tester.tap(find.text('add'));
      await tester.pump();
      expect(find.text('count 2'), findsOneWidget);

      // Phone-sized window: no sidebar, the page fills the window, same state.
      await resize(tester, const Size(390, 844));
      expect(find.byType(WideSideNav), findsNothing);
      expect(find.text('page width 390'), findsOneWidget);
      expect(find.text('count 2'), findsOneWidget, reason: 'state survives the switch to the compact frame');

      // Tablet: still compact, uses the width it has up to its registered cap.
      await resize(tester, const Size(768, 1024));
      expect(find.byType(WideSideNav), findsNothing);
      expect(find.text('page width 768'), findsOneWidget);
      expect(find.text('count 2'), findsOneWidget);

      // Back to a laptop with the rail, then the full sidebar.
      await resize(tester, const Size(1024, 768));
      expect(find.byType(WideSideNav), findsOneWidget);
      expect(find.text('count 2'), findsOneWidget, reason: 'state survives the switch back to the shell');
      await resize(tester, const Size(1920, 1080));
      expect(find.byType(WideSideNav), findsOneWidget);
      expect(find.text('page width 800'), findsOneWidget);
      expect(find.text('count 2'), findsOneWidget);

      // Interaction still works after all that.
      await tester.tap(find.text('add'));
      await tester.pump();
      expect(find.text('count 3'), findsOneWidget);
      expectNoLayoutErrors(tester);
    });
  });
}
