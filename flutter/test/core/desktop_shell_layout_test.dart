import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:youpeak/core/platform/app_layout.dart';

class _PageA {}

class _PageB {}

class _Wide {}

class _Branded {}

class _Fullscreen {}

void main() {
  group("shell route registry", () {
    test("registered pages report their content width; others are not shell pages", () {
      AppLayout.registerShellRoute(_PageA, maxContentWidth: 760);
      expect(AppLayout.shellContentWidth("/$_PageA"), 760);
      expect(AppLayout.isShellRoute("/$_PageA"), isTrue);
      expect(AppLayout.isShellRoute("/$_PageB"), isFalse);
      expect(AppLayout.isShellRoute(null), isFalse);
    });

    test("every other page sits in the shell at the phone column width, except whole-window pages", () {
      AppLayout.shellAvailable = null;
      AppLayout.registerShellRoute(_PageA, maxContentWidth: 760);
      AppLayout.registerWideRoute(_Wide);
      AppLayout.registerBrandedRoute(_Branded);
      AppLayout.registerFullscreenRoute(_Fullscreen);

      expect(AppLayout.shellWidthFor("/$_PageA"), 760);
      expect(AppLayout.shellWidthFor("/$_PageB"), AppLayout.pageMaxWidth, reason: "unregistered pages keep the sidebar");
      expect(AppLayout.shellWidthFor("/TaskLockGate"), AppLayout.pageMaxWidth);
      expect(AppLayout.shellWidthFor("/$_Wide"), isNull);
      expect(AppLayout.shellWidthFor("/$_Branded"), isNull);
      expect(AppLayout.shellWidthFor("/$_Fullscreen"), isNull);
      expect(AppLayout.shellWidthFor("/"), isNull, reason: "the splash");
      expect(AppLayout.shellWidthFor(null), isNull);
    });

    test("signed out: no sidebar for pages reached before signing in", () {
      AppLayout.shellAvailable = () => false;
      addTearDown(() => AppLayout.shellAvailable = null);
      expect(AppLayout.shellWidthFor("/$_PageB"), isNull);
      AppLayout.shellAvailable = () => true;
      expect(AppLayout.shellWidthFor("/$_PageB"), AppLayout.pageMaxWidth);
    });
  });

  group("ShellPageContent", () {
    Future<Size> pageSize(WidgetTester tester, {required double available, required double maxWidth}) async {
      Size? reported;
      await tester.pumpWidget(
        MaterialApp(
          home: Center(
            child: SizedBox(
              width: available,
              height: 800,
              child: ShellPageContent(
                maxWidth: maxWidth,
                child: Builder(builder: (context) {
                  reported = MediaQuery.sizeOf(context);
                  return const SizedBox.expand(key: Key("page"));
                }),
              ),
            ),
          ),
        ),
      );
      final rendered = tester.getSize(find.byKey(const Key("page")));
      expect(reported!.width, rendered.width, reason: "MediaQuery reports the width the page really gets");
      return rendered;
    }

    testWidgets("caps a page at its readable width beside the sidebar", (tester) async {
      tester.view.physicalSize = const Size(2000, 1000);
      tester.view.devicePixelRatio = 1;
      addTearDown(tester.view.reset);
      final size = await pageSize(tester, available: 1600, maxWidth: 760);
      expect(size.width, 760);
      expect(size.height, 800);
    });

    testWidgets("uses the whole area when it is narrower than the cap", (tester) async {
      tester.view.physicalSize = const Size(2000, 1000);
      tester.view.devicePixelRatio = 1;
      addTearDown(tester.view.reset);
      final size = await pageSize(tester, available: 700, maxWidth: 1200);
      expect(size.width, 700);
    });

    testWidgets("is centered horizontally", (tester) async {
      tester.view.physicalSize = const Size(2000, 1000);
      tester.view.devicePixelRatio = 1;
      addTearDown(tester.view.reset);
      await pageSize(tester, available: 1600, maxWidth: 800);
      final page = tester.getRect(find.byKey(const Key("page")));
      final area = tester.getRect(find.byType(ShellPageContent));
      expect(page.center.dx, closeTo(area.center.dx, 0.5));
      expect(page.top, area.top);
    });
  });
}
