// ignore_for_file: depend_on_referenced_packages

import 'dart:async';
import 'dart:io';
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter/foundation.dart';
import 'package:firebase_core_platform_interface/firebase_core_platform_interface.dart';
import 'package:flutter/services.dart';
import 'package:get_storage/get_storage.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:get/get.dart';
import 'package:youpeak/core/platform/app_layout.dart';
import 'package:youpeak/core/platform/platform_info.dart';
import 'package:youpeak/features/main/view/wide_side_nav.dart';
import 'package:youpeak/main.dart' show isDarkMode;

/// The window sizes every desktop-layout check runs at.
const layoutSizes = <String, Size>{
  'mobile_390x844': Size(390, 844),
  'tablet_768x1024': Size(768, 1024),
  'laptop_1024x768': Size(1024, 768),
  'laptop_1366x768': Size(1366, 768),
  'desktop_1440x900': Size(1440, 900),
  'desktop_1920x1080': Size(1920, 1080),
};

final previewDir = Platform.environment['PREVIEW_DIR'];

/// Lays [page] out the way the app does on the web at [size]: beside the
/// sidebar (full from 1200, a rail from 900) at [maxWidth], or in the
/// compact frame below 900. Returns nothing; use [expectNoLayoutErrors].
Future<void> pumpInShell(
  WidgetTester tester,
  Size size,
  Widget page, {
  required double maxWidth,
  bool dark = false,
}) async {
  debugDefaultTargetPlatformOverride = null;
  // The app is a web app: lay it out as one (shell, sidebar, compact frame).
  PlatformInfo.debugIsWeb = true;
  isDarkMode.value = dark;
  addTearDown(() {
    PlatformInfo.debugIsWeb = null;
    isDarkMode.value = false;
  });
  tester.view.physicalSize = size;
  tester.view.devicePixelRatio = 1;
  addTearDown(tester.view.reset);

  final wide = size.width >= AppLayout.wideBreakpoint;

  // The real shell (sidebar or rail + page) from 900, the compact frame below.
  final Widget body = wide
      ? Builder(builder: (context) => buildDesktopShell(context, '/${page.runtimeType}', ShellPageContent(maxWidth: maxWidth, child: page)))
      : AppPageFrame(maxWidth: maxWidth.isInfinite ? AppLayout.pageMaxWidth : maxWidth, child: page);

  await tester.pumpWidget(
    ProviderScope(
      child: GetMaterialApp(
        debugShowCheckedModeBanner: false,
        theme: dark ? ThemeData.dark() : ThemeData.light(),
        home: RepaintBoundary(key: const ValueKey('shot'), child: Material(child: body)),
      ),
    ),
  );
  await tester.pump(const Duration(milliseconds: 400));
}

/// google_fonts cannot fetch in the sandbox (expected); anything else, such as
/// an overflow or a build error, fails the test.
void expectNoLayoutErrors(WidgetTester tester, {String? where}) {
  final errors = <Object>[];
  Object? e;
  while ((e = tester.takeException()) != null) {
    if (!e.toString().contains('GoogleFonts')) errors.add(e!);
  }
  expect(errors, isEmpty, reason: '${where ?? ''}\n${errors.join('\n---\n')}');
}

/// Writes the current shell as a PNG when PREVIEW_DIR is set.
Future<void> shoot(WidgetTester tester, String name) async {
  if (previewDir == null) return;
  await tester.runAsync(() async {
    final boundary = tester.renderObject<RenderRepaintBoundary>(find.byKey(const ValueKey('shot')));
    final image = await boundary.toImage(pixelRatio: 1);
    final bytes = await image.toByteData(format: ui.ImageByteFormat.png);
    await File('$previewDir/$name.png').writeAsBytes(bytes!.buffer.asUint8List());
  });
}

/// Nothing is laid out wider than the window (no horizontal scrolling).
void expectNoHorizontalOverflow(WidgetTester tester, Size size) {
  for (final element in find.byType(Scrollable).evaluate()) {
    final state = (element as StatefulElement).state as ScrollableState;
    if (axisDirectionToAxis(state.axisDirection) == Axis.horizontal) continue;
    final extent = state.position.viewportDimension;
    expect(extent, lessThanOrEqualTo(size.height + 0.5));
  }
  expect(tester.binding.renderViews.first.size.width, lessThanOrEqualTo(size.width + 0.5));
}

/// Real glyphs, icons and decoded images for screenshots (the test engine
/// otherwise draws blocks and skips unloaded images). Call from setUpAll.
Future<void> loadPreviewAssets() async {
  TestWidgetsFlutterBinding.ensureInitialized();
  GoogleFonts.config.allowRuntimeFetching = false;
  // Always load a real face: without one every glyph is one em wide and text
  // wraps far more than it does in the app, which fakes overflow errors.
  final regular = File(r'C:/Windows/Fonts/arial.ttf');
  final bold = File(r'C:/Windows/Fonts/arialbd.ttf');
  final icons = File(r'C:/flutter/flutter/bin/cache/artifacts/material_fonts/MaterialIcons-Regular.otf');
  if (icons.existsSync()) {
    final loader = FontLoader('MaterialIcons')..addFont(Future.value(ByteData.sublistView(icons.readAsBytesSync())));
    await loader.load();
  }
  if (regular.existsSync() && bold.existsSync()) {
    for (final variant in ['regular', '100', '200', '300', '500', '600', '700', '800', '900']) {
      final heavy = variant != 'regular' && int.parse(variant) >= 600;
      final bytes = (heavy ? bold : regular).readAsBytesSync();
      final loader = FontLoader('Urbanist_$variant')..addFont(Future.value(ByteData.sublistView(bytes)));
      await loader.load();
    }
  }
  if (previewDir == null) return;
  // Decode the asset images while real time is available, so screenshots show them.
  final manifest = await AssetManifest.loadFromAssetBundle(rootBundle);
  for (final path in manifest.listAssets().where((a) => a.startsWith('assets/icons/') && a.endsWith('.png'))) {
    final done = Completer<void>();
    final stream = AssetImage(path).resolve(ImageConfiguration.empty);
    late ImageStreamListener listener;
    listener = ImageStreamListener((_, __) {
      stream.removeListener(listener);
      if (!done.isCompleted) done.complete();
    }, onError: (_, __) {
      stream.removeListener(listener);
      if (!done.isCompleted) done.complete();
    });
    stream.addListener(listener);
    await done.future;
  }
}

/// A signed-in session in local storage (GetStorage on a temp directory), so
/// pages that read the logged-in user id don't throw. Call from setUpAll.
Future<void> seedSession() async {
  TestWidgetsFlutterBinding.ensureInitialized();
  final dir = Directory.systemTemp.createTempSync('yp_storage_');
  TestDefaultBinaryMessenger? messenger;
  messenger = TestWidgetsFlutterBinding.instance.defaultBinaryMessenger;
  messenger.setMockMethodCallHandler(const MethodChannel('plugins.flutter.io/path_provider'), (call) async => dir.path);
  await GetStorage.init();
  final storage = GetStorage();
  await storage.write('loginUserId', 'user-1');
  await storage.write('channelId', 'channel-1');
  await storage.write('isNewUser', false);
  await storage.write('loginType', 5);
}

class _FakeFirebasePlatform extends FirebasePlatform {
  _FakeFirebasePlatform() : super();

  static const _options = FirebaseOptions(apiKey: 'test', appId: '1:1:web:test', messagingSenderId: '1', projectId: 'youpeak-test');

  @override
  FirebaseAppPlatform app([String name = defaultFirebaseAppName]) => FirebaseAppPlatform(name, _options);

  @override
  Future<FirebaseAppPlatform> initializeApp({String? name, FirebaseOptions? options}) async => app(name ?? defaultFirebaseAppName);

  @override
  List<FirebaseAppPlatform> get apps => [app()];
}

/// Lets `Firebase.app()` / `FirebaseAuth.instance` resolve to an app with no
/// signed-in user, so data-layer calls fail the way they do when signed out
/// instead of throwing "no app". Call from setUpAll.
void useFakeFirebase() {
  FirebasePlatform.instance = _FakeFirebasePlatform();
}

/// Runs [body] in a zone that ignores google_fonts' late "font not bundled"
/// errors and plugin calls with no test implementation, but fails on anything else.
Future<void> guarded(Future<void> Function() body) {
  final done = Completer<void>();
  runZonedGuarded(() async {
    await body();
    if (!done.isCompleted) done.complete();
  }, (error, stack) {
    // Platform plugins that have no implementation in the test engine.
    const ignorable = [
      'GoogleFonts',
      'google_fonts',
      'FlutterBranchSdk',
      'MissingPluginException',
      'Mocked response',
      'SocketException',
      'WebSocket'
    ];
    if (ignorable.any(error.toString().contains)) return;
    if (!done.isCompleted) done.completeError(error, stack);
  });
  return done.future;
}

/// Lays out a page that takes the whole window (the main tabs, which draw
/// their own sidebar or bottom bar) at [size].
Future<void> pumpFull(WidgetTester tester, Size size, Widget page, {bool dark = false}) async {
  PlatformInfo.debugIsWeb = true;
  isDarkMode.value = dark;
  addTearDown(() {
    PlatformInfo.debugIsWeb = null;
    isDarkMode.value = false;
  });
  tester.view.physicalSize = size;
  tester.view.devicePixelRatio = 1;
  addTearDown(tester.view.reset);
  await tester.pumpWidget(
    ProviderScope(
      child: GetMaterialApp(
        debugShowCheckedModeBanner: false,
        theme: dark ? ThemeData.dark() : ThemeData.light(),
        home: RepaintBoundary(key: const ValueKey('shot'), child: Material(child: page)),
      ),
    ),
  );
  await tester.pump(const Duration(milliseconds: 400));
}
