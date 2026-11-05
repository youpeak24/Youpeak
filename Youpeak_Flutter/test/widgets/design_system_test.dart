import 'dart:async';
import 'dart:io';
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/core/assets/app_icons.dart';
import 'package:youpeak/core/assets/app_visuals.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:youpeak/core/theme/theme_view.dart';
import 'package:youpeak/features/main/view/main_home_view.dart';
import 'package:youpeak/features/onboarding/view/on_boarding_view.dart';
import 'package:youpeak/main.dart' show isDarkMode;
import 'package:youpeak/shared/widgets/app_pressable.dart';
import 'package:youpeak/shared/widgets/basic_button.dart';
import 'package:youpeak/shared/widgets/custom_border_button.dart';
import 'package:youpeak/shared/widgets/custom_filled_button.dart';
import 'package:youpeak/shared/widgets/custom_text_field.dart';
import 'package:youpeak/shared/widgets/data_not_found_ui.dart';
import 'package:youpeak/shared/widgets/short_video_ui.dart';
import 'package:youpeak/shared/widgets/video_card_parts.dart';
import 'package:youpeak/shared/widgets/app_icon.dart';
import 'package:youpeak/shared/widgets/option_tile.dart';
import 'package:youpeak/shared/views/network_issue_view.dart';
import 'package:youpeak/shared/widgets/normal_video_ui.dart';
import 'package:youpeak/features/profile/view/profile_view.dart' show ProfileItemUi;
import 'package:youpeak/features/settings/view/settings_view.dart' show SettingItemUi;
import 'package:youpeak/features/library/view/nav_library_page.dart' show LibraryItem;
import 'package:youpeak/features/bites/view/nav_shorts_details_view.dart' show BitesRailAction;

/// Layout and theme checks for the shared design-system widgets.
///
/// Every widget is laid out on a narrow phone in light and dark mode; Flutter
/// fails the test on any overflow or build error. Set PREVIEW_DIR to also
/// write each scene as a PNG for eyeballing:
///   PREVIEW_DIR=/some/dir flutter test test/widgets/design_system_test.dart
Future<List<String>> rootBundleManifest() async {
  final manifest = await AssetManifest.loadFromAssetBundle(rootBundle);
  return manifest.listAssets();
}

Future<void> _warm(ImageProvider provider) {
  final done = Completer<void>();
  final stream = provider.resolve(ImageConfiguration.empty);
  late ImageStreamListener listener;
  listener = ImageStreamListener(
    (_, __) {
      stream.removeListener(listener);
      if (!done.isCompleted) done.complete();
    },
    onError: (_, __) {
      stream.removeListener(listener);
      if (!done.isCompleted) done.complete();
    },
  );
  stream.addListener(listener);
  return done.future;
}

void main() {
  setUpAll(() async {
    TestWidgetsFlutterBinding.ensureInitialized();
    GoogleFonts.config.allowRuntimeFetching = false;
    // Give text a real face when previewing (the test engine's default draws
    // blocks). google_fonts names its families "<Family>_<weight>"; register a
    // system font under those names. Skipped where the system font is absent.
    final regular = File(r'C:/Windows/Fonts/arial.ttf');
    final bold = File(r'C:/Windows/Fonts/arialbd.ttf');
    final icons = File(r'C:/flutter/flutter/bin/cache/artifacts/material_fonts/MaterialIcons-Regular.otf');
    if (icons.existsSync()) {
      final loader = FontLoader('MaterialIcons')..addFont(Future.value(ByteData.sublistView(icons.readAsBytesSync())));
      await loader.load();
    }
    // Decode the asset images while real time is available and nothing has
    // started a google_fonts load yet (those only fail once real time passes).
    final assets = (await rootBundleManifest()).where((a) => a.startsWith('assets/icons/') && a.endsWith('.png'));
    for (final path in assets) {
      await _warm(AssetImage(path));
    }
    if (regular.existsSync() && bold.existsSync()) {
      for (final variant in ['regular', '100', '200', '300', '500', '600', '700', '800', '900']) {
        final heavy = variant != 'regular' && int.parse(variant) >= 600;
        final bytes = (heavy ? bold : regular).readAsBytesSync();
        final loader = FontLoader('Urbanist_$variant')..addFont(Future.value(ByteData.sublistView(bytes)));
        await loader.load();
      }
    }
  });

  final previewDir = Platform.environment['PREVIEW_DIR'];

  // google_fonts re-throws when it cannot fetch a font in the test sandbox;
  // that is expected here and ignored. Anything else (an overflow, a build
  // error) is collected and fails the test.
  Future<List<Object>> drain(WidgetTester tester) async {
    await tester.pump(const Duration(milliseconds: 50));
    final errors = <Object>[];
    Object? e;
    while ((e = tester.takeException()) != null) {
      if (!e.toString().contains('GoogleFonts')) errors.add(e!);
    }
    return errors;
  }

  void expectNoLayoutErrors(List<Object> errors) => expect(errors, isEmpty, reason: errors.join('\n---\n'));

  Future<void> scene(
    WidgetTester tester,
    String name,
    Widget child, {
    bool dark = false,
    Size size = const Size(390, 700),
  }) async {
    isDarkMode.value = dark;
    // Real, blurred shadows (the test engine flattens them by default). The
    // binding insists this is back to its default before a test body ends, so
    // it is restored at the end of this function.
    debugDisableShadows = false;
    tester.view.physicalSize = size * 2;
    tester.view.devicePixelRatio = 2;
    addTearDown(tester.view.reset);
    final key = GlobalKey();
    await tester.pumpWidget(
      GetMaterialApp(
        debugShowCheckedModeBanner: false,
        theme: Themes.light,
        darkTheme: Themes.dark,
        themeMode: dark ? ThemeMode.dark : ThemeMode.light,
        home: Scaffold(
          body: RepaintBoundary(
            key: key,
            child: ColoredBox(
              color: dark ? AppColor.mainDark : AppColor.white,
              child: child,
            ),
          ),
        ),
      ),
    );
    await tester.pump(const Duration(milliseconds: 400));
    if (previewDir != null) {
      // Large asset images decode off the test clock; give them real time.
      await tester.runAsync(() => Future<void>.delayed(const Duration(milliseconds: 900)));
      await tester.pump(const Duration(milliseconds: 100));
      await tester.runAsync(() async {
        final boundary = key.currentContext!.findRenderObject() as RenderRepaintBoundary;
        final image = await boundary.toImage(pixelRatio: 2);
        final data = await image.toByteData(format: ui.ImageByteFormat.png);
        File('$previewDir/$name${dark ? '_dark' : '_light'}.png').writeAsBytesSync(data!.buffer.asUint8List());
      });
    }
    debugDisableShadows = true;
  }

  Widget controls() => Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            BasicButton(title: 'Continue', width: double.infinity, callback: () {}),
            const SizedBox(height: 14),
            CustomFilledButton(title: 'Subscribe', callback: () {}),
            const SizedBox(height: 14),
            const CustomFilledButton(title: 'Disabled'),
            const SizedBox(height: 14),
            Wrap(
              spacing: 12,
              runSpacing: 8,
              children: [
                CustomBorderButton(title: 'Outlined', callback: () {}),
                FilledButton(onPressed: () {}, child: const Text('Theme filled')),
                OutlinedButton(onPressed: () {}, child: const Text('Theme outlined')),
              ],
            ),
            const SizedBox(height: 14),
            TwoButton(button1: 'Cancel', button2: 'Save', button1OnTap: () {}, button2OnTap: () {}),
            const SizedBox(height: 18),
            CustomTextFieldView(hintText: 'Email', focusNode: FocusNode(), controller: TextEditingController()),
            const SizedBox(height: 18),
            Row(
              children: [
                Switch(value: true, onChanged: (_) {}),
                Switch(value: false, onChanged: (_) {}),
                Checkbox(value: true, onChanged: (_) {}),
                const SizedBox(width: 8),
                const Expanded(child: LinearProgressIndicator(value: 0.6)),
              ],
            ),
            const SizedBox(height: 18),
            Wrap(
              spacing: 8,
              children: [
                const Chip(label: Text('Chip')),
                ChoiceChip(label: const Text('Selected'), selected: true, onSelected: (_) {}),
              ],
            ),
            const SizedBox(height: 18),
            LoginScreenBottomText(text1: "Don't have an account?", text2: 'Sign up', onTap: () {}),
          ],
        ),
      );

  for (final dark in [false, true]) {
    final mode = dark ? 'dark' : 'light';

    testWidgets('buttons, inputs and themed controls lay out ($mode)', (tester) async {
      await scene(tester, 'controls', controls(), dark: dark, size: const Size(390, 780));
      expect(find.text('Continue'), findsOneWidget);
      expectNoLayoutErrors(await drain(tester));
    });

    testWidgets('create menu options lay out ($mode)', (tester) async {
      await scene(
        tester,
        'create_menu',
        Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const SizedBox(height: 24),
            CreateShortsOption(logo: AppIcons.boldVideo, option: 'Create a Short', onTap: () {}),
            CreateShortsOption(logo: AppIcons.boldUpload, option: 'Upload a video', onTap: () {}),
            CreateShortsOption(logo: AppIcons.goLive, option: 'Go live', onTap: () {}),
          ],
        ),
        dark: dark,
        size: const Size(390, 360),
      );
      expectNoLayoutErrors(await drain(tester));
    });

    testWidgets('bottom bar items lay out ($mode)', (tester) async {
      AppSettings.navigationIndex.value = 1;
      await scene(
        tester,
        'bottom_bar',
        Column(
          mainAxisAlignment: MainAxisAlignment.end,
          children: [
            Container(
              height: 64,
              decoration: BoxDecoration(border: Border(top: BorderSide(color: dark ? Colors.white12 : AppColor.hairlineLight))),
              child: Row(
                children: [
                  const BottomBarItemUi(activeIcon: AppIcons.boldHome, icon: AppIcons.homeLogo, title: 'Home', index: 0),
                  const BottomBarItemUi(activeIcon: AppIcons.boldVideo, icon: AppIcons.video, title: 'Bites', index: 1),
                  const Expanded(child: Offstage()),
                  const BottomBarItemUi(activeIcon: AppIcons.boldPlay, icon: AppIcons.videoCircle, title: 'Subscriptions', index: 2),
                  const BottomBarItemUi(activeIcon: AppIcons.boldLibrary, icon: AppIcons.libraryLogo, title: 'Library', index: 3),
                ],
              ),
            ),
          ],
        ),
        dark: dark,
        size: const Size(360, 120),
      );
      expectNoLayoutErrors(await drain(tester));
    });

    testWidgets('video card parts lay out ($mode)', (tester) async {
      await scene(
        tester,
        'video_parts',
        Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const DurationBadge(text: '12:04'),
              const SizedBox(height: 12),
              VideoMetaText(channel: 'YouPeak Studio', views: '1.2K views', age: '3 days ago', dark: dark),
              const SizedBox(height: 12),
              SizedBox(width: 160, child: VideoMetaText(channel: 'A very long channel name here', views: '12M views', age: '3 days ago', dark: dark)),
              const SizedBox(height: 12),
              const DataNotFoundUi(title: 'Video not found'),
            ],
          ),
        ),
        dark: dark,
        size: const Size(390, 420),
      );
      expectNoLayoutErrors(await drain(tester));
    });


    testWidgets('feed video card lays out ($mode)', (tester) async {
      await scene(
        tester,
        'feed_card',
        const Padding(
          padding: EdgeInsets.only(top: 12),
          child: NormalVideoUi(
            videoId: 'v1',
            title: 'Building a premium app in thirty days: what actually worked for our team',
            videoImage: '',
            videoUrl: '',
            videoTime: 754,
            channelId: 'c1',
            channelImage: '',
            channelName: 'YouPeak Studio',
            views: 128400,
            uploadTime: '3 days ago',
            isSave: false,
          ),
        ),
        dark: dark,
        size: const Size(390, 360),
      );
      expectNoLayoutErrors(await drain(tester));
    });

    testWidgets('list rows lay out ($mode)', (tester) async {
      await scene(
        tester,
        'list_rows',
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: Column(
            children: [
              ProfileItemUi(title: 'My wallet', leading: AppIcons.wallet, callback: () {}),
              ProfileItemUi(title: 'Earn rewards', leading: AppIcons.earnReward, callback: () {}),
              SettingItemUi(title: 'Dark mode', leading: AppIcons.darkMode, callback: () {}, trailing: Switch(value: true, onChanged: (_) {})),
              SettingItemUi(title: 'Auto play', leading: AppIcons.play, callback: () {}, trailing: Switch(value: false, onChanged: (_) {})),
              SettingItemUi(title: 'Language', leading: AppIcons.translate, callback: () {}),
              LibraryItem(title: 'Watch later', iconPath: AppIcons.timerHistory, callback: () {}),
              LibraryItem(title: 'Your videos', iconPath: AppIcons.boldPlay, callback: () {}),
            ],
          ),
        ),
        dark: dark,
        size: const Size(390, 560),
      );
      expectNoLayoutErrors(await drain(tester));
      // Profile and Settings rows share one right edge for their chevrons
      // (a Flexible + Spacer pair once left the profile ones mid-row).
      final chevrons = find.byIcon(Icons.chevron_right_rounded);
      final edge = tester.getTopRight(chevrons.at(0)).dx;
      expect(tester.getTopRight(chevrons.at(1)).dx, edge);
      expect(tester.getTopRight(chevrons.at(2)).dx, edge);
    });

    testWidgets('bites action rail lays out ($mode)', (tester) async {
      await scene(
        tester,
        'bites_rail',
        Container(
          color: const Color(0xFF3B5B49),
          alignment: Alignment.centerRight,
          padding: const EdgeInsets.only(right: 12),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              BitesRailAction(icon: AppIcons.likeBold, label: 'Like', count: '12.4K', active: true, onTap: () {}),
              const SizedBox(height: 14),
              BitesRailAction(icon: AppIcons.disLikeBold, label: 'Dislike', count: '32', onTap: () {}),
              const SizedBox(height: 14),
              BitesRailAction(icon: AppIcons.comments, label: 'Comments', count: '1.2K', onTap: () {}, size: 27),
              const SizedBox(height: 14),
              BitesRailAction(icon: AppIcons.boldShare, label: 'Share', count: '88', onTap: () {}, size: 27),
            ],
          ),
        ),
        dark: dark,
        size: const Size(390, 420),
      );
      expectNoLayoutErrors(await drain(tester));
    });


    testWidgets('icon family at real sizes lays out ($mode)', (tester) async {
      Widget cell(String asset, String label, {Color? color, bool colored = false}) => SizedBox(
            width: 78,
            child: Column(
              children: [
                colored ? AppIcon.colored(asset, size: 32) : AppIcon(asset, size: 28, color: color),
                const SizedBox(height: 4),
                Text(label, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 10)),
              ],
            ),
          );
      await scene(
        tester,
        'icon_gallery',
        Padding(
          padding: const EdgeInsets.all(12),
          child: Wrap(
            runSpacing: 14,
            children: [
              cell(AppIcons.homeLogo, 'home'),
              cell(AppIcons.boldHome, 'home on', color: AppColor.primaryColor),
              cell(AppIcons.video, 'bites'),
              cell(AppIcons.boldVideo, 'bites on', color: AppColor.primaryColor),
              cell(AppIcons.videoCircle, 'subs'),
              cell(AppIcons.boldPlay, 'subs on', color: AppColor.primaryColor),
              cell(AppIcons.libraryLogo, 'library'),
              cell(AppIcons.boldLibrary, 'lib on', color: AppColor.primaryColor),
              cell(AppIcons.like, 'like'),
              cell(AppIcons.likeBold, 'like on', color: AppColor.primaryColor),
              cell(AppIcons.disLike, 'dislike'),
              cell(AppIcons.disLikeBold, 'dislike on', color: AppColor.primaryColor),
              cell(AppIcons.comments, 'comments'),
              cell(AppIcons.boldShare, 'share'),
              cell(AppIcons.addToSave, 'save'),
              cell(AppIcons.saveDone1, 'saved', color: AppColor.primaryColor),
              cell(AppIcons.search, 'search'),
              cell(AppIcons.notification, 'bell'),
              cell(AppIcons.setting, 'settings'),
              cell(AppIcons.timeCircle, 'time'),
              cell(AppIcons.extraCreate, 'create'),
              cell(AppIcons.extraRetry, 'retry'),
              cell(AppIcons.extraCopyLink, 'copy'),
              cell(AppIcons.extraAdCredits, 'ad credits'),
              cell(AppIcons.extraPhoneSignIn, 'phone'),
              cell(AppIcons.extraPaymentHistory, 'payments'),
              cell(AppIcons.extraPrivacyPolicy, 'privacy'),
              cell(AppIcons.extraLegalSupport, 'legal'),
              cell(AppIcons.extraWithdrawToBank, 'withdraw'),
              cell(AppIcons.extraPending, 'pending'),
              cell(AppIcons.extraDeviceSecurity, 'device'),
              cell(AppIcons.extraVpnRestriction, 'vpn'),
              cell(AppIcons.lock, 'lock'),
              cell(AppIcons.king, 'king'),
              cell(AppIcons.tick, 'tick'),
              cell(AppIcons.convertIcon, 'convert'),
              cell(AppIcons.coin, 'coin', colored: true),
              cell(AppVisuals.premiumBadge, 'premium', colored: true),
              cell(AppVisuals.verified, 'verified', colored: true),
              cell(AppVisuals.liveBadge, 'live', colored: true),
              cell(AppVisuals.notifBell, 'n bell', colored: true),
              cell(AppVisuals.notifPayment, 'n pay', colored: true),
              cell(AppVisuals.notifWarning, 'n warn', colored: true),
            ],
          ),
        ),
        dark: dark,
        size: const Size(390, 600),
      );
      expectNoLayoutErrors(await drain(tester));
    });

    testWidgets('option tiles and states lay out ($mode)', (tester) async {
      await scene(
        tester,
        'options_states',
        SingleChildScrollView(
          child: Column(
            children: [
              const SizedBox(height: 12),
              OptionTile(title: 'Public', subtitle: 'Anyone can search for and view', selected: true, onTap: () {}),
              OptionTile(title: 'Private', subtitle: 'Only you can view it', selected: false, onTap: () {}),
              OptionTile(title: 'Unlisted', subtitle: 'Anyone with the link can view', selected: false, onTap: () {}),
              const SizedBox(height: 8),
              SizedBox(
                height: 300,
                child: DataNotFoundUi(
                  type: EmptyStateType.videos,
                  title: 'No videos yet',
                  message: 'Videos you upload will show up here.',
                  actionLabel: 'Upload a video',
                  onAction: () {},
                ),
              ),
            ],
          ),
        ),
        dark: dark,
        size: const Size(390, 640),
      );
      expectNoLayoutErrors(await drain(tester));
    });

    testWidgets('offline state lays out ($mode)', (tester) async {
      await scene(tester, 'offline', NetworkIssueView(callback: () {}), dark: dark, size: const Size(360, 520));
      expectNoLayoutErrors(await drain(tester));
    });

    testWidgets('shorts shelf card lays out ($mode)', (tester) async {
      await scene(
        tester,
        'short_card',
        Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: const [
              ShortVideoUi(
                videoId: 'v1',
                title: 'How I reached my peak in thirty days with a very long title',
                videoImage: '',
                videoUrl: '',
                videoTime: 42,
                channelName: 'Asha',
                channelId: 'c1',
                isSave: false,
                views: 12400,
              ),
            ],
          ),
        ),
        dark: dark,
        size: const Size(390, 340),
      );
      expectNoLayoutErrors(await drain(tester));
    });
  }

  testWidgets('onboarding page lays out and advances', (tester) async {
    await scene(tester, 'onboarding', const OnBoardIngScreen(), size: const Size(390, 800));
    expect(find.byType(AppPressable), findsWidgets);
    expectNoLayoutErrors(await drain(tester));
  });
}
