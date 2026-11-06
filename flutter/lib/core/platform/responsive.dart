import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:youpeak/core/theme/app_tokens.dart';

// Layout helpers for pages that sit in the navigation shell (see AppLayout).
//
// Everything here sizes from the width the page really gets — the area beside
// the sidebar — never from the window, so one page works in a phone, beside a
// rail or a full sidebar, and in the compact frame.

/// How much room a page has. Chosen from the page's own width.
enum ContentSize {
  /// Under 600: phone. One column, bottom-docked actions.
  compact,

  /// 600-1023: tablet, or a desktop window beside the sidebar. Two columns
  /// only where a page opts in.
  medium,

  /// 1024 and up: wide desktop content.
  expanded;

  static ContentSize of(double width) => width < Responsive.mediumFrom
      ? ContentSize.compact
      : width < Responsive.expandedFrom
          ? ContentSize.medium
          : ContentSize.expanded;
}

abstract final class Responsive {
  static const double mediumFrom = 600;
  static const double expandedFrom = 1024;

  /// Width from which a page puts its main action inline, next to the content
  /// it belongs to, instead of docking it to the bottom of the window.
  static const double inlineActionFrom = 720;

  /// Width from which a page may split into a main column and a side column.
  static const double splitFrom = 840;

  /// Outer padding for a page that is [width] wide: 16 on phones, growing to 40.
  static double gutter(double width) => width < mediumFrom
      ? 16
      : width < expandedFrom
          ? 24
          : width < 1280
              ? 32
              : 40;

  static ContentSize sizeOf(BuildContext context) => ContentSize.of(PageWidth.of(context));

  static bool isCompact(BuildContext context) => PageWidth.of(context) < mediumFrom;

  static bool isInlineAction(BuildContext context) => PageWidth.of(context) >= inlineActionFrom;

  /// A form field's width: the phone design's fixed [phoneWidth] on a phone,
  /// the whole column once the page is wide enough to have laid it out.
  static double fieldWidth(BuildContext context, double phoneWidth) =>
      PageWidth.of(context) >= inlineActionFrom ? double.infinity : phoneWidth;
}

/// The width the current page is laid out in. Set by the shell and the compact
/// frame; anywhere else (dialogs, sheets, other platforms) it falls back to
/// the media width.
class PageWidthScope extends InheritedWidget {
  const PageWidthScope({super.key, required this.width, required super.child});

  final double width;

  static double? maybeOf(BuildContext context) => context.dependOnInheritedWidgetOfExactType<PageWidthScope>()?.width;

  @override
  bool updateShouldNotify(PageWidthScope oldWidget) => oldWidget.width != width;
}

/// Reads the page width. Use it instead of the window or screen size.
abstract final class PageWidth {
  static double of(BuildContext context) => PageWidthScope.maybeOf(context) ?? MediaQuery.sizeOf(context).width;
}

/// Scrollable page body: content centred in a [maxWidth] column with
/// responsive side padding. The page keeps one scroll view, so nothing nests.
class AdaptiveScroll extends StatelessWidget {
  const AdaptiveScroll({
    super.key,
    required this.child,
    this.maxWidth = 1200,
    this.topPadding = 16,
    this.bottomPadding = 32,
    this.controller,
  });

  final Widget child;
  final double maxWidth;
  final double topPadding;
  final double bottomPadding;
  final ScrollController? controller;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final gutter = Responsive.gutter(constraints.maxWidth);
        return SingleChildScrollView(
          controller: controller,
          padding: EdgeInsets.fromLTRB(gutter, topPadding, gutter, bottomPadding),
          child: Align(
            alignment: Alignment.topCenter,
            child: ConstrainedBox(constraints: BoxConstraints(maxWidth: maxWidth), child: child),
          ),
        );
      },
    );
  }
}

/// [primary] beside [secondary] when there is room, stacked (primary first)
/// otherwise. The split follows the width this widget is given.
class ResponsiveSplit extends StatelessWidget {
  const ResponsiveSplit({
    super.key,
    required this.primary,
    required this.secondary,
    this.breakpoint = Responsive.splitFrom,
    this.gap = 24,
    this.primaryFlex = 3,
    this.secondaryFlex = 2,
    this.alignment = CrossAxisAlignment.start,
  });

  final Widget primary;
  final Widget secondary;
  final double breakpoint;
  final double gap;
  final int primaryFlex;
  final int secondaryFlex;
  final CrossAxisAlignment alignment;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        if (constraints.maxWidth < breakpoint) {
          return Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [primary, SizedBox(height: gap), secondary]);
        }
        return Row(
          crossAxisAlignment: alignment,
          children: [
            Expanded(flex: primaryFlex, child: primary),
            SizedBox(width: gap),
            Expanded(flex: secondaryFlex, child: secondary),
          ],
        );
      },
    );
  }
}

/// Equal-width tiles in as many columns as fit [minTileWidth]. Tiles take their
/// own height (no fixed aspect ratio), so text never clips.
class ResponsiveGrid extends StatelessWidget {
  const ResponsiveGrid({
    super.key,
    required this.children,
    this.minTileWidth = 280,
    this.maxColumns = 4,
    this.spacing = 16,
  });

  final List<Widget> children;
  final double minTileWidth;
  final int maxColumns;
  final double spacing;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final columns = math.max(1, math.min(maxColumns, ((constraints.maxWidth + spacing) / (minTileWidth + spacing)).floor()));
        final tile = (constraints.maxWidth - spacing * (columns - 1)) / columns;
        final rows = <Widget>[];
        for (var start = 0; start < children.length; start += columns) {
          final cells = <Widget>[];
          for (var i = start; i < start + columns; i++) {
            if (i > start) cells.add(SizedBox(width: spacing));
            cells.add(SizedBox(width: tile, child: i < children.length ? children[i] : null));
          }
          if (rows.isNotEmpty) rows.add(SizedBox(height: spacing));
          rows.add(Row(crossAxisAlignment: CrossAxisAlignment.start, children: cells));
        }
        return Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: rows);
      },
    );
  }
}

/// A raised panel: the same card look on every page.
class SurfaceCard extends StatelessWidget {
  const SurfaceCard({super.key, required this.child, this.padding = const EdgeInsets.all(20), this.radius = 20});

  final Widget child;
  final EdgeInsetsGeometry padding;
  final double radius;

  @override
  Widget build(BuildContext context) {
    final dark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      padding: padding,
      decoration: BoxDecoration(
        color: dark ? AppColor.secondDarkMode : AppColor.white,
        borderRadius: BorderRadius.circular(radius),
        border: Border.all(color: AppElevation.hairline(dark)),
        boxShadow: AppElevation.card(dark),
      ),
      child: child,
    );
  }
}

/// Wraps a page body (a header and a scrolling list, for example) in a card
/// with the page gutters once the page is wide enough for one; on phones the
/// body is returned untouched. The body must be able to fill the height it
/// is given (an Expanded list inside a Column does).
class CardOnWide extends StatelessWidget {
  const CardOnWide({super.key, required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    final width = PageWidth.of(context);
    if (width < Responsive.inlineActionFrom) return child;
    final gutter = Responsive.gutter(width);
    return Padding(
      padding: EdgeInsets.fromLTRB(gutter, 8, gutter, 24),
      child: SurfaceCard(padding: const EdgeInsets.fromLTRB(9, 12, 9, 4), child: child),
    );
  }
}

/// Cards that stack in one column on a phone and sit in equal-height columns
/// when there is room (each column at least [minTileWidth] wide).
///
/// The cards bring their own bottom margin, as the phone list rows do; this
/// only adds the gap between columns. It never scrolls itself: put it in a
/// scroll view.
class AdaptiveCardList extends StatelessWidget {
  const AdaptiveCardList({
    super.key,
    required this.itemCount,
    required this.itemBuilder,
    this.minTileWidth = 280,
    this.maxColumns = 3,
    this.spacing = 18,
    this.padding = EdgeInsets.zero,
  });

  final int itemCount;
  final IndexedWidgetBuilder itemBuilder;
  final double minTileWidth;
  final int maxColumns;
  final double spacing;
  final EdgeInsets padding;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final inner = constraints.maxWidth - padding.horizontal;
        final columns = math.max(1, math.min(maxColumns, ((inner + spacing) / (minTileWidth + spacing)).floor()));
        if (columns == 1) {
          return ListView.builder(
            padding: padding,
            itemCount: itemCount,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemBuilder: itemBuilder,
          );
        }
        final rows = <Widget>[];
        for (var start = 0; start < itemCount; start += columns) {
          final cells = <Widget>[];
          for (var i = start; i < start + columns; i++) {
            if (i > start) cells.add(SizedBox(width: spacing));
            cells.add(Expanded(child: i < itemCount ? itemBuilder(context, i) : const SizedBox.shrink()));
          }
          rows.add(IntrinsicHeight(child: Row(crossAxisAlignment: CrossAxisAlignment.stretch, children: cells)));
        }
        return Padding(padding: padding, child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: rows));
      },
    );
  }
}

/// Keeps a page's primary button a normal button width, left-aligned with the
/// content above it, on wide pages; on phones it is returned untouched (full
/// width, as designed).
class ActionWidth extends StatelessWidget {
  const ActionWidth({super.key, required this.child, this.maxWidth = 380});

  final Widget child;
  final double maxWidth;

  @override
  Widget build(BuildContext context) {
    if (!Responsive.isInlineAction(context)) return child;
    return Align(alignment: Alignment.centerLeft, child: ConstrainedBox(constraints: BoxConstraints(maxWidth: maxWidth), child: child));
  }
}
