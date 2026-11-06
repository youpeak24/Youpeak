import 'dart:async';
import 'dart:io';
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/features/auth/phone/data/phone_auth_service.dart';
import 'package:youpeak/features/auth/phone/presentation/phone_login_view.dart';
import 'package:youpeak/main.dart' show isDarkMode;

/// Counts sends and answers each with whatever the test queued.
class _ScriptedPhoneAuth extends PhoneAuthService {
  final List<String> sentTo = [];
  Completer<PhoneVerification>? pending;
  PhoneAuthError? failure;

  @override
  Future<PhoneVerification> sendCode(String phoneE164, {int? resendToken, void Function(String idToken)? onAutoVerified}) {
    sentTo.add(phoneE164);
    if (failure != null) return Future.error(failure!);
    return (pending = Completer<PhoneVerification>()).future;
  }
}

void main() {
  setUpAll(() => GoogleFonts.config.allowRuntimeFetching = false);

  final previewDir = Platform.environment['PREVIEW_DIR'];

  Future<_ScriptedPhoneAuth> open(WidgetTester tester, Size size) async {
    isDarkMode.value = false;
    tester.view.physicalSize = size * 2;
    tester.view.devicePixelRatio = 2;
    addTearDown(tester.view.reset);
    final auth = _ScriptedPhoneAuth();
    await tester.pumpWidget(
      ProviderScope(
        overrides: [phoneAuthServiceProvider.overrideWithValue(auth)],
        child: const MaterialApp(home: RepaintBoundary(key: ValueKey("shot"), child: PhoneLoginView())),
      ),
    );
    await tester.pump(const Duration(milliseconds: 100));
    return auth;
  }

  // google_fonts cannot fetch in the sandbox; that is expected, layout errors are not.
  void expectNoLayoutErrors(WidgetTester tester) {
    final errors = <Object>[];
    Object? e;
    while ((e = tester.takeException()) != null) {
      if (!e.toString().contains('GoogleFonts')) errors.add(e!);
    }
    expect(errors, isEmpty, reason: errors.join('\n---\n'));
  }

  Future<void> shot(WidgetTester tester, String name) async {
    if (previewDir == null) return;
    await tester.runAsync(() async {
      final boundary = tester.renderObject<RenderRepaintBoundary>(find.byKey(const ValueKey("shot")));
      final image = await boundary.toImage(pixelRatio: 1);
      final bytes = await image.toByteData(format: ui.ImageByteFormat.png);
      await File("$previewDir/$name.png").writeAsBytes(bytes!.buffer.asUint8List());
    });
  }

  const phone = Size(390, 760);
  const desktop = Size(1280, 800);

  testWidgets("mobile and desktop lay out without overflow", (tester) async {
    for (final size in [phone, desktop]) {
      await open(tester, size);
      await shot(tester, "phone_login_${size.width.toInt()}");
      expectNoLayoutErrors(tester);
    }
  });

  testWidgets("a region-blocked failure shows a clear error, keeps the number and frees the button", (tester) async {
    final auth = await open(tester, phone);
    auth.failure = const PhoneAuthError("Phone sign-in isn't available for this country yet.", failure: PhoneAuthFailure.regionBlocked);

    await tester.enterText(find.byType(TextField).last, "98765 43210");
    await tester.tap(find.text("Send code"));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 100));

    expect(find.textContaining("isn't available for this country"), findsOneWidget);
    expect(find.text("We sent a 6-digit code", findRichText: true), findsNothing);
    expect(find.text("Send code"), findsOneWidget); // not stuck on the spinner
    expect(find.text("98765 43210"), findsOneWidget); // entry preserved
    await shot(tester, "phone_login_region_error");

    // The retry is allowed and goes out as one normalized number.
    auth.failure = null;
    await tester.tap(find.text("Send code"));
    await tester.pump();
    expect(auth.sentTo, ["+919876543210", "+919876543210"]);
    expectNoLayoutErrors(tester);
  });

  testWidgets("double tapping Send code while a request is in flight sends once", (tester) async {
    final auth = await open(tester, phone);
    await tester.enterText(find.byType(TextField).last, "9876543210");

    await tester.tap(find.text("Send code"));
    await tester.pump();
    await tester.testTextInput.receiveAction(TextInputAction.done); // Enter key path
    await tester.pump();

    expect(auth.sentTo, hasLength(1));
  });

  testWidgets("an invalid number is rejected before anything is sent", (tester) async {
    final auth = await open(tester, phone);
    await tester.enterText(find.byType(TextField).last, "12345");
    await tester.tap(find.text("Send code"));
    await tester.pump();

    expect(find.text("Enter a valid mobile number."), findsOneWidget);
    expect(auth.sentTo, isEmpty);
  });

  testWidgets("the code step only appears after the send is confirmed", (tester) async {
    final auth = await open(tester, phone);
    await tester.enterText(find.byType(TextField).last, "+91 98765 43210");
    await tester.tap(find.text("Send code"));
    await tester.pump();

    expect(find.text("Enter the code"), findsNothing); // still waiting on Firebase
    auth.pending!.complete(const PhoneVerification.forTest("verification-id"));
    await tester.pump(const Duration(milliseconds: 100));

    expect(auth.sentTo, ["+919876543210"]);
    expect(find.text("Enter the code"), findsOneWidget);
    expect(find.textContaining("+919876543210"), findsOneWidget);
    expect(find.textContaining("Resend code in"), findsOneWidget);
    await shot(tester, "phone_login_code_step");
    // Let the resend timer finish so no timer is left pending.
    await tester.pump(const Duration(seconds: 31));
    expectNoLayoutErrors(tester);
  });
}
