import 'package:flutter/material.dart';
import 'package:youpeak/shared/widgets/app_icon.dart';
import 'package:youpeak/core/platform/web_video_fullscreen.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/core/assets/app_icons.dart';
import 'package:youpeak/core/assets/app_visuals.dart';
import 'package:youpeak/core/constants/app_string.dart';
import 'package:youpeak/core/platform/app_layout.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'package:youpeak/core/storage/database/database.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:youpeak/features/main/view/main_home_view.dart';
import 'package:youpeak/features/notifications/view/notification_view.dart';
import 'package:youpeak/features/profile/view/profile_view.dart';
import 'package:youpeak/features/search/view/search_view.dart';
import 'package:youpeak/features/tasker/presentation/tasker_dashboard_view.dart';
import 'package:youpeak/main.dart';
import 'package:youpeak/shared/widgets/preview_image.dart';

// Left navigation of the main screen in wide browser windows; replaces the
// phone's bottom bar and "+" button. [expanded] shows labels beside the
// icons; otherwise it is an icon rail.
class WideSideNav extends StatelessWidget {
  const WideSideNav({super.key, required this.expanded, required this.onCreate, this.activeRoute});

  final bool expanded;
  final VoidCallback onCreate;

  // Route name of the shell page this sidebar is shown beside, or null on
  // the main screen (where the selected tab is highlighted instead).
  final String? activeRoute;

  static final _mainRoute = "/$MainHomePageView";

  // Shows main tab [index], leaving any shell page first.
  void _openTab(int index) {
    AppSettings.navigationIndex.value = index;
    if (activeRoute != null) Get.until((route) => route.isFirst || route.settings.name == _mainRoute);
  }

  // Opens a sidebar destination. From one shell page to another the page is
  // replaced, so moving around the sidebar doesn't build up a back stack.
  void _openLink(Type page, Widget Function() builder) {
    if (activeRoute == "/$page") return;
    if (activeRoute != null) {
      Get.off(builder, preventDuplicates: false);
    } else {
      Get.to(builder);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Obx(() {
      final dark = isDarkMode.value;
      final selected = AppSettings.navigationIndex.value;

      return Container(
        width: expanded ? AppLayout.sidebarWidth : AppLayout.railWidth,
        color: dark ? AppColor.mainDark : AppColor.white,
        child: SingleChildScrollView(
          padding: EdgeInsets.symmetric(horizontal: expanded ? 12 : 8, vertical: 16),
          child: Column(
            crossAxisAlignment: expanded ? CrossAxisAlignment.stretch : CrossAxisAlignment.center,
            children: [
              _Brand(expanded: expanded, dark: dark, onTap: () => _openTab(0)),
              const SizedBox(height: 20),
              _CreateButton(expanded: expanded, onTap: onCreate),
              const SizedBox(height: 16),
              _TabTile(
                expanded: expanded,
                dark: dark,
                selected: activeRoute == null && selected == 0,
                icon: AppIcons.homeLogo,
                activeIcon: AppIcons.boldHome,
                label: AppStrings.home.tr,
                onTap: () => _openTab(0),
              ),
              _TabTile(
                expanded: expanded,
                dark: dark,
                selected: activeRoute == null && selected == 1,
                icon: AppIcons.video,
                activeIcon: AppIcons.boldVideo,
                label: AppStrings.shorts.tr,
                onTap: () => _openTab(1),
              ),
              _TabTile(
                expanded: expanded,
                dark: dark,
                selected: activeRoute == null && selected == 2,
                icon: AppIcons.videoCircle,
                activeIcon: AppIcons.boldPlay,
                label: AppStrings.subscription.tr,
                onTap: () => _openTab(2),
              ),
              _TabTile(
                expanded: expanded,
                dark: dark,
                selected: activeRoute == null && selected == 3,
                icon: AppIcons.libraryLogo,
                activeIcon: AppIcons.boldLibrary,
                label: AppStrings.library.tr,
                onTap: () => _openTab(3),
              ),
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 12),
                child: Divider(height: 1, color: dark ? Colors.white12 : AppColor.grey_200),
              ),
              _LinkTile(
                expanded: expanded,
                dark: dark,
                icon: const Icon(Icons.search_rounded, size: 22),
                label: AppStrings.search.tr,
                selected: activeRoute == "/$SearchView",
                onTap: () => _openLink(SearchView, () => const SearchView(isSearchShorts: false)),
              ),
              _LinkTile(
                expanded: expanded,
                dark: dark,
                icon: const Icon(Icons.notifications_none_rounded, size: 22),
                label: AppStrings.notification.tr,
                selected: activeRoute == "/$NotificationPageView",
                onTap: () => _openLink(NotificationPageView, () => const NotificationPageView()),
              ),
              _LinkTile(
                expanded: expanded,
                dark: dark,
                icon: const Icon(Icons.emoji_events_outlined, size: 22),
                label: "Tasker",
                selected: activeRoute == "/$TaskerDashboardView",
                onTap: () => _openLink(TaskerDashboardView, () => const TaskerDashboardView()),
              ),
              _LinkTile(
                expanded: expanded,
                dark: dark,
                icon: PreviewProfileImage(
                  size: 24,
                  id: Database.channelId ?? "",
                  image: AppSettings.profileImage.value,
                  fit: BoxFit.cover,
                ),
                label: AppStrings.profile.tr,
                selected: activeRoute == "/$ProfileView",
                onTap: () => _openLink(ProfileView, () => const ProfileView()),
              ),
            ],
          ),
        ),
      );
    });
  }
}

class _Brand extends StatelessWidget {
  const _Brand({required this.expanded, required this.dark, required this.onTap});

  final bool expanded;
  final bool dark;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final Widget mark;
    if (!expanded) {
      mark = Image.asset(AppIcons.logo, width: 36, height: 36);
    } else if (dark) {
      // The wordmark's charcoal "You" disappears on dark surfaces.
      mark = Row(
        children: [
          Image.asset(AppIcons.logo, width: 32, height: 32),
          const SizedBox(width: 8),
          Text(
            AppStrings.appName.tr,
            style: GoogleFonts.urbanist(fontSize: 22, fontWeight: FontWeight.w800, color: AppColor.white),
          ),
        ],
      );
    } else {
      mark = Align(
        alignment: Alignment.centerLeft,
        child: Image.asset(AppVisuals.wordmark, height: 44, semanticLabel: AppStrings.appName.tr),
      );
    }

    return Semantics(
      button: true,
      label: AppStrings.home.tr,
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: onTap,
        child: Padding(
          padding: EdgeInsets.symmetric(horizontal: expanded ? 8 : 0, vertical: 4),
          child: mark,
        ),
      ),
    );
  }
}

class _CreateButton extends StatelessWidget {
  const _CreateButton({required this.expanded, required this.onTap});

  final bool expanded;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    if (!expanded) {
      return Tooltip(
        message: AppStrings.create.tr,
        child: Material(
          color: AppColor.primaryColor,
          shape: const CircleBorder(),
          child: InkWell(
            customBorder: const CircleBorder(),
            onTap: onTap,
            child: const SizedBox(width: 48, height: 48, child: Center(child: AppIcon(AppIcons.extraCreate, size: 24, color: AppColor.white))),
          ),
        ),
      );
    }

    return SizedBox(
      height: 46,
      child: ElevatedButton.icon(
        onPressed: onTap,
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColor.primaryColor,
          foregroundColor: AppColor.white,
          elevation: 0,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(23)),
        ),
        icon: const AppIcon(AppIcons.extraCreate, size: 22, color: AppColor.white),
        label: Text(AppStrings.create.tr, style: GoogleFonts.urbanist(fontSize: 15, fontWeight: FontWeight.bold)),
      ),
    );
  }
}

// One of the four main tabs.
class _TabTile extends StatelessWidget {
  const _TabTile({
    required this.expanded,
    required this.dark,
    required this.selected,
    required this.icon,
    required this.activeIcon,
    required this.label,
    required this.onTap,
  });

  final bool expanded;
  final bool dark;
  final bool selected;
  final String icon;
  final String activeIcon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final color = selected ? (dark ? AppColor.brightGreen : AppColor.primaryColor) : (dark ? AppColor.white.withAlpha(200) : AppColor.primaryTextIcons);
    return _NavTileFrame(
      expanded: expanded,
      dark: dark,
      selected: selected,
      label: label,
      onTap: onTap,
      icon: AppIcon(selected ? activeIcon : icon, size: 24, color: color),
      textColor: color,
    );
  }
}

// Opens another page (search, notifications, ...).
class _LinkTile extends StatelessWidget {
  const _LinkTile({
    required this.expanded,
    required this.dark,
    required this.icon,
    required this.label,
    required this.onTap,
    this.selected = false,
  });

  final bool expanded;
  final bool dark;
  final Widget icon;
  final String label;
  final VoidCallback onTap;
  final bool selected;

  @override
  Widget build(BuildContext context) {
    final color = selected ? (dark ? AppColor.brightGreen : AppColor.primaryColor) : (dark ? AppColor.white.withAlpha(200) : AppColor.primaryTextIcons);
    return _NavTileFrame(
      expanded: expanded,
      dark: dark,
      selected: selected,
      label: label,
      onTap: onTap,
      icon: IconTheme(data: IconThemeData(color: color), child: icon),
      textColor: color,
    );
  }
}

class _NavTileFrame extends StatelessWidget {
  const _NavTileFrame({
    required this.expanded,
    required this.dark,
    required this.selected,
    required this.label,
    required this.onTap,
    required this.icon,
    required this.textColor,
  });

  final bool expanded;
  final bool dark;
  final bool selected;
  final String label;
  final VoidCallback onTap;
  final Widget icon;
  final Color textColor;

  @override
  Widget build(BuildContext context) {
    final background = selected ? (dark ? AppColor.white.withAlpha(20) : AppColor.secondaryMintGreen) : Colors.transparent;
    final text = label.isEmpty ? label : label[0].toUpperCase() + label.substring(1);

    final Widget content = expanded
        ? SizedBox(
            height: 46,
            child: Row(
              children: [
                const SizedBox(width: 14),
                SizedBox(width: 24, height: 24, child: Center(child: icon)),
                const SizedBox(width: 16),
                Expanded(
                  child: Text(
                    text,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: GoogleFonts.urbanist(
                      fontSize: 15,
                      fontWeight: selected ? FontWeight.w800 : FontWeight.w600,
                      color: textColor,
                    ),
                  ),
                ),
              ],
            ),
          )
        : SizedBox(
            width: 64,
            height: 62,
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                SizedBox(width: 24, height: 24, child: Center(child: icon)),
                const SizedBox(height: 4),
                // Shrinks a long label ("Subscription") to fit the 64px tile
                // instead of cutting it off.
                FittedBox(
                  fit: BoxFit.scaleDown,
                  child: Text(
                    text,
                    maxLines: 1,
                    style: GoogleFonts.urbanist(
                      fontSize: 11,
                      fontWeight: selected ? FontWeight.w800 : FontWeight.w600,
                      color: textColor,
                    ),
                  ),
                ),
              ],
            ),
          );

    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Semantics(
        button: true,
        selected: selected,
        label: text,
        child: Material(
          color: background,
          borderRadius: BorderRadius.circular(12),
          child: InkWell(
            borderRadius: BorderRadius.circular(12),
            onTap: onTap,
            child: ExcludeSemantics(child: content),
          ),
        ),
      ),
    );
  }
}

// The desktop navigation shell around a shell route (see
// AppLayout.registerShellRoute): the sidebar, with [routeName] highlighted,
// beside the page content. The "+" button goes back to the main screen and
// opens its create menu there.
Widget buildDesktopShell(BuildContext context, String routeName, Widget content) {
  return Obx(() {
    // A video in browser fullscreen takes the whole window.
    if (WebVideoFullscreen.active.value) return content;
    final dark = isDarkMode.value;
    return Material(
      color: dark ? AppColor.mainDark : AppColor.white,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          WideSideNav(
            expanded: MediaQuery.sizeOf(context).width >= 1200,
            activeRoute: routeName,
            onCreate: () {
              Get.until((route) => route.isFirst || route.settings.name == WideSideNav._mainRoute);
              WidgetsBinding.instance.addPostFrameCallback((_) => MainHomePageView.openCreateMenu?.call());
            },
          ),
          VerticalDivider(width: 1, thickness: 1, color: dark ? Colors.white12 : AppColor.grey_200),
          Expanded(child: content),
        ],
      ),
    );
  });
}
