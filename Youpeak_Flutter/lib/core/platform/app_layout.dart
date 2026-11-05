import 'dart:math' as math;

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/core/assets/app_icons.dart';
import 'package:youpeak/core/platform/platform_info.dart';
import 'package:youpeak/core/platform/responsive.dart';

// Screen metrics for the web app.
//
// The app's screens were designed for a phone and size themselves from the
// screen (Get.width / Get.height). In a desktop browser the "screen" is the
// whole window, so those layouts would stretch across 1900px. On the web:
//
//  * in a desktop-wide window every page a signed-in person opens sits in
//    the navigation shell, beside the sidebar ([AppLayout.shellWidthFor]):
//    at its registered content width, or in a [pageMaxWidth] column if it
//    still has its phone layout. Below the desktop breakpoint, phone-layout
//    pages render in a centered column [pageMaxWidth] wide (AppPageFrame);
//    either way [AppLayout.width] reports that column's width;
//  * sign-in and onboarding pages use a full desktop split layout, while the
//    actual form remains a comfortable reading width;
//  * the main tabs, the video player and Bites have real desktop layouts,
//    listed in [AppLayout.isWideRoute]; camera, live and the Bites player
//    take the whole window ([AppLayout.registerFullscreenRoute]).
//
// On Android/iOS every getter returns the plain screen size, so the phone
// app is unchanged.
class AppLayout {
  AppLayout._();

  // Width of the content column for pages that keep their phone layout.
  static const double pageMaxWidth = 600;

  // Window width from which the main screen swaps its bottom bar for a
  // sidebar and lays videos out in a grid.
  static const double wideBreakpoint = 900;

  // Sidebar widths of the wide main screen: labelled, and icon-only rail.
  static const double sidebarWidth = 232;
  static const double railWidth = 76;

  // Window size (the Flutter view), not the size of the current page.
  static double get windowWidth => Get.width;

  static double get windowHeight => Get.height;

  // True in a browser window wide enough for the desktop layouts.
  static bool get isWideWeb => PlatformInfo.isWeb && windowWidth >= wideBreakpoint;

  // Width the phone layouts should size themselves against.
  static double get width =>
      PlatformInfo.isWeb ? math.min(windowWidth, pageMaxWidth) : Get.width;

  static double get height => Get.height;

  // Width a page should size itself against: the width its shell/frame gives
  // it (see PageWidthScope), so a page beside the sidebar fills the space it
  // really has instead of the phone column. Outside a page (dialogs, sheets)
  // it is the phone-column width on the web and the screen elsewhere.
  static double widthOf(BuildContext context) {
    final page = PageWidthScope.maybeOf(context);
    if (page != null) return page;
    final media = MediaQuery.sizeOf(context).width;
    return PlatformInfo.isWeb ? math.min(media, pageMaxWidth) : media;
  }

  // Route names of pages that lay themselves out for any width and are
  // therefore not squeezed into the page column. GetX names a route pushed
  // with Get.to(SomeView()) "/SomeView"; `$Type` gives the same (possibly
  // minified) name in every build mode.
  static final Set<String> _wideRouteNames = {};

  static void registerWideRoute(Type page) => _wideRouteNames.add("/$page");

  static bool isWideRoute(String? name) =>
      name != null && _wideRouteNames.contains(name);

  // Sign-in and onboarding pages: shown on the brand gradient, like the
  // loading screen, instead of the neutral page backdrop.
  static final Set<String> _brandedRouteNames = {};

  static void registerBrandedRoute(Type page) =>
      _brandedRouteNames.add("/$page");

  static bool isBrandedRoute(String? name) =>
      name != null && _brandedRouteNames.contains(name);

  // Pages with a desktop arrangement wider than the phone column. On wide
  // windows they are shown inside the navigation shell, beside the sidebar,
  // at this maximum content width.
  static final Map<String, double> _shellRouteWidths = {};

  static void registerShellRoute(Type page, {required double maxContentWidth}) =>
      _shellRouteWidths["/$page"] = maxContentWidth;

  static double? shellContentWidth(String? name) =>
      name == null ? null : _shellRouteWidths[name];

  static bool isShellRoute(String? name) => shellContentWidth(name) != null;

  // Pages that need the whole window even on a desktop (camera and upload
  // editors, going live, the full-screen Bites player).
  static final Set<String> _fullscreenRouteNames = {};

  static void registerFullscreenRoute(Type page) =>
      _fullscreenRouteNames.add("/$page");

  static bool isFullscreenRoute(String? name) =>
      name != null && _fullscreenRouteNames.contains(name);

  // Whether the sidebar may be shown at all (a signed-in session). Pages a
  // signed-out visitor reaches (e.g. the privacy policy from sign-up) keep
  // the plain column. Null: always.
  static bool Function()? shellAvailable;

  // Content width of [name] inside the navigation shell, or null when the
  // page is not shown in the shell. Every page is, unless it lays itself out
  // for the whole window (wide, branded or full-screen routes, and the
  // splash at "/"); one without a registered width keeps its phone layout in
  // a [pageMaxWidth] column — next to the sidebar rather than alone on an
  // empty backdrop.
  static double? shellWidthFor(String? name) {
    if (name == null || name == "/") return null;
    final registered = _shellRouteWidths[name];
    if (registered != null) return registered;
    if (isWideRoute(name) || isBrandedRoute(name) || isFullscreenRoute(name)) {
      return null;
    }
    if (!(shellAvailable?.call() ?? true)) return null;
    return pageMaxWidth;
  }

  // Draws the navigation shell (sidebar + [content]) for a shell route. Set
  // by the main feature, which owns the sidebar; null until then.
  static Widget Function(BuildContext context, String routeName, Widget content)?
      shellBuilder;

  // Number of video card columns that fit [availableWidth] in the wide grids.
  static int gridColumns(double availableWidth,
          {double minTileWidth = 300, int maxColumns = 5}) =>
      (availableWidth / minTileWidth).floor().clamp(1, maxColumns);
}

// Centers a phone-layout page in a [AppLayout.pageMaxWidth] column on wide
// web windows, and makes MediaQuery report the column's size so layouts
// that read MediaQuery.size see the width they actually get.
//
// The widget tree is identical at every window size, so a page keeps its
// state when the window is resized across the breakpoint.
class AppPageFrame extends StatelessWidget {
  const AppPageFrame(
      {super.key,
      required this.child,
      this.enabled = true,
      this.backdrop,
      this.branded = false,
      this.maxWidth = AppLayout.pageMaxWidth});

  final Widget child;
  final bool enabled;

  // Width of the centered column on windows wider than it.
  final double maxWidth;

  // Color beside the column; a neutral tint of the page background if null.
  final Color? backdrop;

  // Brand gradient beside the column (sign-in and onboarding pages).
  final bool branded;

  static const _brandGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [
      Color(0xFF0F3B20),
      Color(0xFF1E4D2B),
      Color(0xFF0A7A44),
      Color(0xFF129B57)
    ],
    stops: [0, 0.3, 0.65, 1],
  );

  @override
  Widget build(BuildContext context) {
    final mediaQuery = MediaQuery.of(context);
    final fullWidth = mediaQuery.size.width;
    final exceedsCompactWidth = PlatformInfo.isWeb && enabled && fullWidth > maxWidth;

    // Auth/onboarding pages should feel like a website on a desktop, not like
    // a phone screenshot floating in the middle of the browser. Keep their
    // existing, battle-tested mobile content in a bounded surface and use the
    // rest of the viewport as a real brand panel. Below the desktop
    // breakpoint the original full-width page is used unchanged.
    if (exceedsCompactWidth &&
        branded &&
        fullWidth >= AppLayout.wideBreakpoint) {
      return _DesktopBrandedFrame(mediaQuery: mediaQuery, child: child);
    }

    // A tablet-sized auth page uses all available width. Only regular
    // phone-layout detail pages retain the centered compact frame.
    final framed = exceedsCompactWidth && !branded;
    final width = framed ? maxWidth : fullWidth;
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    final Decoration outside;
    if (!framed) {
      outside = const BoxDecoration();
    } else if (branded) {
      outside = const BoxDecoration(gradient: _brandGradient);
    } else {
      outside = BoxDecoration(
          color: backdrop ??
              (isDark ? const Color(0xFF0B0B0F) : const Color(0xFFF1F4F2)));
    }

    return DecoratedBox(
      decoration: outside,
      child: Center(
        child: SizedBox(
          width: width,
          child: DecoratedBox(
            decoration: framed
                ? BoxDecoration(
                    color: theme.scaffoldBackgroundColor,
                    border: branded
                        ? null
                        : Border.symmetric(
                            vertical: BorderSide(
                                color:
                                    isDark ? Colors.white10 : Colors.black12),
                          ),
                    boxShadow: branded
                        ? const [
                            BoxShadow(color: Color(0x59000000), blurRadius: 40)
                          ]
                        : null,
                  )
                : const BoxDecoration(),
            child: MediaQuery(
              data: mediaQuery.copyWith(
                  size: Size(width, mediaQuery.size.height)),
              child: PageWidthScope(width: width, child: child),
            ),
          ),
        ),
      ),
    );
  }
}

class _DesktopBrandedFrame extends StatelessWidget {
  const _DesktopBrandedFrame({required this.mediaQuery, required this.child});

  final MediaQueryData mediaQuery;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final fullWidth = mediaQuery.size.width;
    final panelWidth =
        (fullWidth * 0.42).clamp(AppLayout.pageMaxWidth, 680.0).toDouble();
    final theme = Theme.of(context);
    final dark = theme.brightness == Brightness.dark;

    return ColoredBox(
      color: dark ? const Color(0xFF0B0B0F) : const Color(0xFFF7F8F7),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Expanded(child: _DesktopBrandPanel()),
          SizedBox(
            width: panelWidth,
            child: DecoratedBox(
              decoration: BoxDecoration(
                color: theme.scaffoldBackgroundColor,
                boxShadow: const [
                  BoxShadow(
                      color: Color(0x26000000),
                      blurRadius: 28,
                      offset: Offset(-8, 0))
                ],
              ),
              child: MediaQuery(
                data: mediaQuery.copyWith(
                    size: Size(panelWidth, mediaQuery.size.height)),
                child: PageWidthScope(width: panelWidth, child: child),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _DesktopBrandPanel extends StatelessWidget {
  const _DesktopBrandPanel();

  @override
  Widget build(BuildContext context) {
    // The panel sits beside the page's Scaffold, not inside it, so it has no
    // Material ancestor of its own. Without one its Text widgets inherit
    // MaterialApp's fallback style (monospace, yellow double underline).
    return ExcludeSemantics(
      child: Material(
        type: MaterialType.transparency,
        child: DecoratedBox(
        decoration: const BoxDecoration(gradient: AppPageFrame._brandGradient),
        child: Stack(
          fit: StackFit.expand,
          children: [
            const Positioned(
              top: -150,
              right: -110,
              child: _BrandOrb(size: 390, color: Color(0x16FFFFFF)),
            ),
            const Positioned(
              bottom: -190,
              left: -130,
              child: _BrandOrb(size: 460, color: Color(0x12000000)),
            ),
            Center(
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 560),
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 48),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Image.asset(AppIcons.logo, width: 58, height: 58),
                          const SizedBox(width: 16),
                          Text(
                            'YouPeak',
                            style: GoogleFonts.urbanist(
                              color: Colors.white,
                              fontSize: 34,
                              height: 1,
                              fontWeight: FontWeight.w800,
                              letterSpacing: -1,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 36),
                      Text(
                        'Watch. Create.\nReach your peak.',
                        style: GoogleFonts.urbanist(
                          color: Colors.white,
                          fontSize: 44,
                          height: 1.12,
                          fontWeight: FontWeight.w800,
                          letterSpacing: -1.4,
                        ),
                      ),
                      const SizedBox(height: 20),
                      Text(
                        'Discover videos, connect with creators, and grow with a community built for you.',
                        style: GoogleFonts.urbanist(
                          color: Colors.white.withAlpha(205),
                          fontSize: 18,
                          height: 1.55,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
      ),
    );
  }
}

class _BrandOrb extends StatelessWidget {
  const _BrandOrb({required this.size, required this.color});

  final double size;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(shape: BoxShape.circle, color: color),
    );
  }
}

// Page transition used for every GetX route on the web (GetMaterialApp
// customTransition). Besides animating, it places each page — the one place
// every pushed page passes through: in the desktop navigation shell on wide
// windows (AppLayout.shellWidthFor), otherwise in AppPageFrame unless the
// route is registered as a wide page.
class AdaptivePageTransition extends CustomTransition {
  @override
  Widget buildTransition(
    BuildContext context,
    Curve? curve,
    Alignment? alignment,
    Animation<double> animation,
    Animation<double> secondaryAnimation,
    Widget child,
  ) {
    final route = ModalRoute.of(context);
    final name = route?.settings.name;
    // Keyed by the route, so the page keeps its state when a window resize
    // moves it between the shell and the phone column.
    child = KeyedSubtree(key: GlobalObjectKey(route ?? child), child: child);
    final shellWidth = AppLayout.shellWidthFor(name);
    final shell = AppLayout.shellBuilder;
    if (shellWidth != null &&
        shell != null &&
        MediaQuery.sizeOf(context).width >= AppLayout.wideBreakpoint) {
      // The sidebar is the same on both routes, so it stays put while only
      // the page content cross-fades.
      return shell(
        context,
        name!,
        FadeTransition(
          opacity: animation,
          child: ShellPageContent(maxWidth: shellWidth, child: child),
        ),
      );
    }
    // Below the sidebar breakpoint a page with a registered desktop layout
    // gets the width it was designed for (up to the window), not the phone
    // column; the rest keep the phone column.
    final registered = AppLayout.shellContentWidth(name);
    final page = AppPageFrame(
        enabled: !AppLayout.isWideRoute(name),
        branded: AppLayout.isBrandedRoute(name),
        maxWidth: registered == null || registered.isInfinite ? AppLayout.pageMaxWidth : registered,
        child: child);
    if (route is PageRoute) {
      return const PageTransitionsTheme().buildTransitions(
          route, context, animation, secondaryAnimation, page);
    }
    return FadeTransition(opacity: animation, child: page);
  }
}

// The page area of the desktop navigation shell: the page is centered at up
// to [maxWidth] on the page background (no phone-column border or backdrop),
// and MediaQuery reports the width the page actually gets.
class ShellPageContent extends StatelessWidget {
  const ShellPageContent(
      {super.key, required this.maxWidth, required this.child});

  final double maxWidth;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return ColoredBox(
      color: theme.scaffoldBackgroundColor,
      child: LayoutBuilder(
        builder: (context, constraints) {
          final width = math.min(constraints.maxWidth, maxWidth);
          final mediaQuery = MediaQuery.of(context);
          return Align(
            alignment: Alignment.topCenter,
            child: SizedBox(
              width: width,
              child: MediaQuery(
                data: mediaQuery.copyWith(
                    size: Size(width, mediaQuery.size.height)),
                child: PageWidthScope(width: width, child: child),
              ),
            ),
          );
        },
      ),
    );
  }
}

// Marks a video card as a cell of a wide grid, so it sizes its thumbnail
// 16:9 from the cell width instead of the phone's screen-based height.
class VideoGridScope extends InheritedWidget {
  const VideoGridScope(
      {super.key, required this.tileWidth, required super.child});

  final double tileWidth;

  // Height for a card thumbnail with [horizontalMargin] on both sides:
  // 16:9 in a grid cell (never below [minGridHeight]), else [phoneHeight].
  static double thumbnailHeight(
    BuildContext context, {
    required double phoneHeight,
    double horizontalMargin = 10,
    double minGridHeight = 0,
  }) {
    final scope = context.dependOnInheritedWidgetOfExactType<VideoGridScope>();
    if (scope == null) return phoneHeight;
    final height = (scope.tileWidth - 2 * horizontalMargin) * 9 / 16;
    return height < minGridHeight ? minGridHeight : height;
  }

  static bool inGrid(BuildContext context) =>
      context.dependOnInheritedWidgetOfExactType<VideoGridScope>() != null;

  @override
  bool updateShouldNotify(VideoGridScope oldWidget) =>
      oldWidget.tileWidth != tileWidth;
}

// Lays [itemCount] cards out in rows of equal-width columns (as many
// [minTileWidth]-wide columns as fit). Rows take the height of their tallest
// card, so cards with one- and two-line titles still line up.
class VideoGrid extends StatelessWidget {
  const VideoGrid({
    super.key,
    required this.itemCount,
    required this.itemBuilder,
    this.minTileWidth = 320,
    this.maxColumns = 5,
    this.spacing = 8,
    this.runSpacing = 8,
    this.firstRowTrailer,
  });

  final int itemCount;
  final IndexedWidgetBuilder itemBuilder;
  final double minTileWidth;
  final int maxColumns;
  final double spacing;
  final double runSpacing;

  // Shown full-width after the first row (e.g. the Bites shelf).
  final Widget? firstRowTrailer;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final columns = AppLayout.gridColumns(constraints.maxWidth,
            minTileWidth: minTileWidth, maxColumns: maxColumns);
        final tileWidth =
            (constraints.maxWidth - spacing * (columns - 1)) / columns;
        final rowCount = (itemCount / columns).ceil();

        final rows = <Widget>[];
        for (var row = 0; row < rowCount; row++) {
          final cells = <Widget>[];
          for (var column = 0; column < columns; column++) {
            final index = row * columns + column;
            if (column > 0) cells.add(SizedBox(width: spacing));
            cells.add(
              SizedBox(
                width: tileWidth,
                child: index < itemCount
                    ? VideoGridScope(
                        tileWidth: tileWidth,
                        child: itemBuilder(context, index))
                    : null,
              ),
            );
          }
          rows.add(Padding(
            padding: EdgeInsets.only(bottom: runSpacing),
            child: Row(
                crossAxisAlignment: CrossAxisAlignment.start, children: cells),
          ));
          if (row == 0 && firstRowTrailer != null) {
            rows.add(firstRowTrailer!);
          }
        }
        if (rowCount == 0 && firstRowTrailer != null) {
          rows.add(firstRowTrailer!);
        }

        return Column(
            crossAxisAlignment: CrossAxisAlignment.stretch, children: rows);
      },
    );
  }
}
