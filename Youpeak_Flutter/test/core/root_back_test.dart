import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/core/navigation/root_back.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'package:youpeak/shared/dialogs/app_exit_dialog.dart';

// Distinct page types: GetX names a route after its page class and refuses to push the same name twice.
class _PageA extends StatelessWidget {
  const _PageA();
  @override
  Widget build(BuildContext context) => const Scaffold(body: Text("page a"));
}

class _PageB extends StatelessWidget {
  const _PageB();
  @override
  Widget build(BuildContext context) => const Scaffold(body: Text("page b"));
}

/// Native (Android) behaviour of the shared Back handler. The browser branch
/// is covered by the Chrome navigation suite (reports/project-audit/web-release).
void main() {
  setUpAll(() => GoogleFonts.config.allowRuntimeFetching = false);

  late BuildContext rootContext;
  final platformCalls = <String>[];

  Future<void> pumpRoot(WidgetTester tester) async {
    platformCalls.clear();
    tester.binding.defaultBinaryMessenger.setMockMethodCallHandler(SystemChannels.platform, (call) async {
      platformCalls.add(call.method);
      return null;
    });
    addTearDown(() => tester.binding.defaultBinaryMessenger.setMockMethodCallHandler(SystemChannels.platform, null));
    AppSettings.navigationIndex.value = 0;
    await tester.pumpWidget(GetMaterialApp(
      home: Builder(builder: (context) {
        rootContext = context;
        return const Scaffold(body: Text("root page"));
      }),
    ));
  }

  testWidgets("root page on Android: asks before exiting; Cancel keeps the app, Exit closes it", (tester) async {
    await pumpRoot(tester);
    late Future<bool> result;
    result = handleRootBack(rootContext);
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 600));
    expect(find.byType(AppExitDialog), findsOneWidget);

    await tester.tap(find.text("Cancel"));
    await tester.pumpAndSettle();
    expect(await result, isFalse, reason: "the page itself must not be popped");
    expect(platformCalls, isNot(contains("SystemNavigator.pop")));

    result = handleRootBack(rootContext);
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 600));
    await tester.tap(find.text("Exit"));
    await tester.pumpAndSettle();
    expect(await result, isFalse);
    expect(platformCalls, contains("SystemNavigator.pop"));
  });

  testWidgets("a page opened on top of another is simply popped (Sign up opened from Sign in)", (tester) async {
    await pumpRoot(tester);
    late BuildContext nestedContext;
    Navigator.of(rootContext).push(MaterialPageRoute(builder: (context) {
      nestedContext = context;
      return const Scaffold(body: Text("nested"));
    }));
    await tester.pumpAndSettle();
    expect(await handleRootBack(nestedContext), isTrue);
    expect(find.byType(AppExitDialog), findsNothing);
  });

  testWidgets("main tabs: Back from another tab returns to Home first", (tester) async {
    await pumpRoot(tester);
    AppSettings.navigationIndex.value = 2;
    expect(await handleRootBack(rootContext), isFalse);
    expect(AppSettings.navigationIndex.value, 0);
    expect(find.byType(AppExitDialog), findsNothing);
  });

  testWidgets("switchAuthPage replaces the page when it is on top of others and pushes when it is the root", (tester) async {
    await pumpRoot(tester);
    // Root: the other page is pushed on top (Back returns to this one).
    switchAuthPage(() => const _PageA());
    await tester.pumpAndSettle();
    expect(find.text("page a"), findsOneWidget);
    expect(Get.key.currentState!.canPop(), isTrue);
    // Not the root: it replaces itself, the stack does not grow.
    switchAuthPage(() => const _PageB());
    await tester.pumpAndSettle();
    expect(find.text("page b"), findsOneWidget);
    Get.key.currentState!.pop();
    await tester.pumpAndSettle();
    expect(find.text("root page"), findsOneWidget, reason: "one Back from the replaced page reaches the original root");
  });
}
