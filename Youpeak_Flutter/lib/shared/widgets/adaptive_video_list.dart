import 'package:flutter/material.dart';
import 'package:youpeak/core/platform/app_layout.dart';

// A list of video cards: the phone's vertical list, or, in wide browser
// windows, a grid of the same cards (VideoGrid sizes their thumbnails 16:9),
// so desktop results use the width instead of one stretched column.
//
// Meant for use inside an outer scroll view (shrink-wrapped, not scrollable).
class AdaptiveVideoList extends StatelessWidget {
  const AdaptiveVideoList({
    super.key,
    required this.itemCount,
    required this.itemBuilder,
    this.separatorBuilder,
    this.padding,
    this.wideTrailer,
  });

  final int itemCount;
  final IndexedWidgetBuilder itemBuilder;

  // Phone list only.
  final IndexedWidgetBuilder? separatorBuilder;
  final EdgeInsetsGeometry? padding;

  // Wide grid only: a full-width row after the first row of cards (e.g. a
  // shelf of Bites).
  final Widget? wideTrailer;

  @override
  Widget build(BuildContext context) {
    if (AppLayout.isWideWeb) {
      return Padding(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
        child: VideoGrid(
          itemCount: itemCount,
          itemBuilder: itemBuilder,
          minTileWidth: 320,
          maxColumns: 4,
          spacing: 16,
          runSpacing: 16,
          firstRowTrailer: wideTrailer == null
              ? null
              : Padding(
                  padding: const EdgeInsets.only(bottom: 16),
                  child: wideTrailer),
        ),
      );
    }
    if (separatorBuilder != null) {
      return ListView.separated(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        padding: padding,
        itemCount: itemCount,
        itemBuilder: itemBuilder,
        separatorBuilder: separatorBuilder!,
      );
    }
    return ListView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      padding: padding,
      itemCount: itemCount,
      itemBuilder: itemBuilder,
    );
  }
}

// Centers [child] at a comfortable reading width in wide browser windows;
// full width otherwise.
class ReadableWidth extends StatelessWidget {
  const ReadableWidth({super.key, required this.child, this.maxWidth = 820});

  final Widget child;
  final double maxWidth;

  @override
  Widget build(BuildContext context) {
    if (!AppLayout.isWideWeb) return child;
    return Align(
      alignment: Alignment.topCenter,
      child: ConstrainedBox(
          constraints: BoxConstraints(maxWidth: maxWidth), child: child),
    );
  }
}
