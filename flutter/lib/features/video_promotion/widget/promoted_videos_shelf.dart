import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/core/network/app_api_client.dart';
import 'package:youpeak/core/storage/database/database.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:youpeak/main.dart';
import 'package:youpeak/features/video/view/normal_video_details_view.dart';
import 'package:youpeak/features/video_promotion/data/promotion_models.dart';
import 'package:youpeak/features/video_promotion/data/promotion_repository.dart';

/// The Home feed's "Promoted" spot: videos whose creators bought a
/// promotion (served and paced by the server). Each card reports one
/// impression once it has been at least half on screen for a second; the
/// server decides whether that counts (util/promotion.service.js).
class PromotedVideosShelf extends ConsumerStatefulWidget {
  const PromotedVideosShelf({super.key});

  @override
  ConsumerState<PromotedVideosShelf> createState() => _PromotedVideosShelfState();
}

class _PromotedVideosShelfState extends ConsumerState<PromotedVideosShelf> {
  List<PromotedPlacement> _items = const [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    if ((Database.loginUserId ?? "").isEmpty) return;
    try {
      final items = await ref.read(promotionRepositoryProvider).placements(limit: 2);
      if (mounted) setState(() => _items = items);
    } on ApiException {
      // No promoted spot this time.
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_items.isEmpty) return const SizedBox.shrink();
    return Obx(() {
      final dark = isDarkMode.value;
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: 10),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 15),
            child: Text("Promoted", style: GoogleFonts.urbanist(fontSize: 16, fontWeight: FontWeight.bold, color: dark ? AppColor.white : AppColor.primaryTextIcons)),
          ),
          const SizedBox(height: 10),
          SizedBox(
            height: 170,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.only(left: 15, right: 5),
              itemCount: _items.length,
              itemBuilder: (context, i) => _PromotedCard(
                item: _items[i],
                dark: dark,
                onSeen: (token) => ref.read(promotionRepositoryProvider).reportImpression(token),
              ),
            ),
          ),
        ]),
      );
    });
  }
}

class _PromotedCard extends StatefulWidget {
  const _PromotedCard({required this.item, required this.dark, required this.onSeen});

  final PromotedPlacement item;
  final bool dark;
  final void Function(String token) onSeen;

  @override
  State<_PromotedCard> createState() => _PromotedCardState();
}

class _PromotedCardState extends State<_PromotedCard> {
  Timer? _timer;
  Duration _visibleFor = Duration.zero;
  bool _reported = false;
  static const _tick = Duration(milliseconds: 250);
  static const _needed = Duration(seconds: 1);

  @override
  void initState() {
    super.initState();
    if (widget.item.token != null) _timer = Timer.periodic(_tick, (_) => _check());
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  /// At least half of the card inside the window, on the current page, app in front.
  bool _onScreen() {
    if (!mounted) return false;
    if (WidgetsBinding.instance.lifecycleState != AppLifecycleState.resumed) return false;
    if (ModalRoute.of(context)?.isCurrent == false) return false;
    final box = context.findRenderObject();
    if (box is! RenderBox || !box.attached || !box.hasSize) return false;
    final rect = box.localToGlobal(Offset.zero) & box.size;
    final screen = Offset.zero & MediaQuery.sizeOf(context);
    final visible = rect.intersect(screen);
    if (visible.isEmpty || visible.width <= 0 || visible.height <= 0) return false;
    return visible.width * visible.height >= 0.5 * rect.width * rect.height;
  }

  void _check() {
    if (_reported) return;
    _visibleFor = _onScreen() ? _visibleFor + _tick : Duration.zero;
    if (_visibleFor >= _needed) {
      _reported = true;
      _timer?.cancel();
      widget.onSeen(widget.item.token!);
    }
  }

  @override
  Widget build(BuildContext context) {
    final item = widget.item;
    return Semantics(
      button: true,
      label: "Promoted video: ${item.title}",
      child: GestureDetector(
        onTap: () => Get.to(() => NormalVideoDetailsView(videoId: item.videoId, videoUrl: item.videoUrl)),
        child: Container(
          width: 240,
          margin: const EdgeInsets.only(right: 12),
          decoration: BoxDecoration(
            color: widget.dark ? AppColor.secondDarkMode : AppColor.white,
            borderRadius: BorderRadius.circular(12),
            boxShadow: [BoxShadow(color: AppColor.black.withValues(alpha: 0.08), blurRadius: 6, offset: const Offset(0, 3))],
          ),
          child: ExcludeSemantics(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Stack(children: [
                AspectRatio(
                  aspectRatio: 16 / 9,
                  child: ClipRRect(
                    borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
                    child: Image.network(
                      item.image,
                      fit: BoxFit.cover,
                      webHtmlElementStrategy: WebHtmlElementStrategy.fallback,
                      errorBuilder: (_, __, ___) => Container(color: AppColor.secondaryMintGreen, child: const Icon(Icons.play_circle_fill, color: AppColor.primaryColor, size: 40)),
                    ),
                  ),
                ),
                Positioned(
                  top: 6,
                  left: 6,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(color: AppColor.black.withValues(alpha: 0.72), borderRadius: BorderRadius.circular(4)),
                    child: Text("Promoted", style: GoogleFonts.urbanist(fontSize: 10.5, fontWeight: FontWeight.w800, color: AppColor.white)),
                  ),
                ),
              ]),
              Padding(
                padding: const EdgeInsets.all(8),
                child: Text(item.title, maxLines: 1, overflow: TextOverflow.ellipsis,
                    style: GoogleFonts.urbanist(fontSize: 13, fontWeight: FontWeight.bold, color: widget.dark ? AppColor.white : AppColor.primaryTextIcons)),
              ),
            ]),
          ),
        ),
      ),
    );
  }
}
