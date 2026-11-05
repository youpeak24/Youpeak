import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:get/get.dart';
import 'package:intl/intl.dart';
import 'package:youpeak/core/network/app_api_client.dart';
import 'package:youpeak/core/utils/money_format.dart';
import 'package:youpeak/main.dart';
import 'package:youpeak/shared/widgets/loader_ui.dart';
import 'package:youpeak/features/video_promotion/data/promotion_models.dart';
import 'package:youpeak/features/video_promotion/data/promotion_repository.dart';
import 'package:youpeak/features/video_promotion/widget/promotion_widgets.dart';

final DateFormat _when = DateFormat("d MMM yyyy, h:mm a");
String _fmt(DateTime? d) => d == null ? "—" : _when.format(d);

/// One of the creator's promotions: what was bought (as bought), its real
/// status and counted impressions, and its history.
class PromotionCampaignView extends ConsumerStatefulWidget {
  const PromotionCampaignView({super.key, required this.campaignId});

  final String campaignId;

  @override
  ConsumerState<PromotionCampaignView> createState() => _PromotionCampaignViewState();
}

class _PromotionCampaignViewState extends ConsumerState<PromotionCampaignView> {
  bool _loading = true;
  String? _error;
  PromotionCampaign? _campaign;
  List<CampaignEvent> _events = const [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final (c, events) = await ref.read(promotionRepositoryProvider).campaign(widget.campaignId);
      if (!mounted) return;
      setState(() {
        _campaign = c;
        _events = events;
        _loading = false;
      });
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.message;
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Obx(() {
      final p = PromoPalette.of(isDarkMode.value);
      final c = _campaign;
      return Scaffold(
        appBar: AppBar(
          backgroundColor: Colors.transparent,
          elevation: 0,
          leading: IconButton(tooltip: "Back", icon: Icon(Icons.arrow_back, color: p.text), onPressed: () => Get.back()),
          title: Text("Promotion details", style: promoText(p, size: 18, weight: FontWeight.bold)),
          actions: [IconButton(tooltip: "Refresh", icon: Icon(Icons.refresh, color: p.text), onPressed: _loading ? null : _load)],
        ),
        body: _loading
            ? const LoaderUi()
            : _error != null || c == null
                ? PromoErrorView(message: _error ?? "Promotion not found.", onRetry: _load, palette: p)
                : RefreshIndicator(
                    onRefresh: _load,
                    child: LayoutBuilder(builder: (context, box) {
                      final wide = box.maxWidth >= 760;
                      final pad = box.maxWidth < 420 ? 16.0 : 24.0;
                      final delivery = _Delivery(c: c, palette: p);
                      final history = _History(events: _events, palette: p);
                      return ListView(
                        physics: const AlwaysScrollableScrollPhysics(),
                        padding: EdgeInsets.fromLTRB(pad, 4, pad, 32),
                        children: [
                          _Header(c: c, palette: p, wide: wide),
                          const SizedBox(height: 14),
                          if (wide)
                            Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                              Expanded(child: Column(children: [delivery, const SizedBox(height: 14), _Bought(c: c, palette: p)])),
                              const SizedBox(width: 14),
                              Expanded(child: history),
                            ])
                          else ...[
                            delivery,
                            const SizedBox(height: 14),
                            _Bought(c: c, palette: p),
                            const SizedBox(height: 14),
                            history,
                          ],
                        ],
                      );
                    }),
                  ),
      );
    });
  }
}

class _Header extends StatelessWidget {
  const _Header({required this.c, required this.palette, required this.wide});

  final PromotionCampaign c;
  final PromoPalette palette;
  final bool wide;

  @override
  Widget build(BuildContext context) {
    final p = palette;
    return PromoCard(
      palette: p,
      child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        PromoThumb(url: c.videoImage, width: wide ? 200 : 120, radius: 10),
        const SizedBox(width: 14),
        Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(c.videoTitle.isEmpty ? "Video" : c.videoTitle, maxLines: 2, overflow: TextOverflow.ellipsis, style: promoText(p, size: 17, weight: FontWeight.w800)),
            const SizedBox(height: 6),
            PromoStatusChip(c.status),
            if (c.status == CampaignStatus.rejected && (c.rejectionReason ?? "").isNotEmpty) ...[
              const SizedBox(height: 6),
              Text("Reason: ${c.rejectionReason}", style: promoText(p, size: 13, color: p.muted)),
            ],
          ]),
        ),
      ]),
    );
  }
}

class _Delivery extends StatelessWidget {
  const _Delivery({required this.c, required this.palette});

  final PromotionCampaign c;
  final PromoPalette palette;

  @override
  Widget build(BuildContext context) {
    final p = palette;
    final hasMin = c.impressionsTargetMin > 0;
    final toMin = hasMin ? (c.impressionsDelivered / c.impressionsTargetMin).clamp(0.0, 1.0) : 0.0;
    return PromoCard(
      palette: p,
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text("Delivery", style: promoText(p, size: 16, weight: FontWeight.w800)),
        const SizedBox(height: 10),
        Text(MoneyFormat.coins(c.impressionsDelivered), style: promoText(p, size: 30, weight: FontWeight.w900)),
        Text("impressions counted so far", style: promoText(p, size: 13, color: p.muted)),
        if (hasMin) ...[
          const SizedBox(height: 12),
          Semantics(
            label: "${(toMin * 100).toStringAsFixed(1)} percent of the lower estimate",
            child: ClipRRect(
              borderRadius: BorderRadius.circular(99),
              child: LinearProgressIndicator(value: toMin, minHeight: 8, backgroundColor: p.border, color: p.accent),
            ),
          ),
          const SizedBox(height: 6),
          Text("Estimate for this plan: ${c.estimateLabel} (bar shows progress to the lower estimate)", style: promoText(p, size: 12.5, color: p.muted)),
        ],
        const SizedBox(height: 12),
        _Row("Started", _fmt(c.startedAt), p),
        _Row(c.status == CampaignStatus.active || c.status == CampaignStatus.scheduled || c.status == CampaignStatus.paused ? "Ends" : "Scheduled end", _fmt(c.expiresAt), p),
        const SizedBox(height: 8),
        Text("Counted by YouPeak: one per viewer per day, your own views excluded. Estimates aren't guaranteed.", style: promoText(p, size: 12, color: p.muted, height: 1.35)),
      ]),
    );
  }
}

class _Bought extends StatelessWidget {
  const _Bought({required this.c, required this.palette});

  final PromotionCampaign c;
  final PromoPalette palette;

  @override
  Widget build(BuildContext context) {
    final p = palette;
    return PromoCard(
      palette: p,
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text("What you bought", style: promoText(p, size: 16, weight: FontWeight.w800)),
        const SizedBox(height: 8),
        _Row("Plan", c.planName, p),
        _Row("Price paid", MoneyFormat.inr(c.priceInr, whole: true), p),
        if (c.durationDays > 0) _Row("Duration", durationLabel(c.durationDays), p),
        _Row("Est. impressions", c.estimateLabel, p),
        _Row("Targeting", c.targeting, p),
        _Row("Ordered", _fmt(c.createdAt), p),
      ]),
    );
  }
}

class _History extends StatelessWidget {
  const _History({required this.events, required this.palette});

  final List<CampaignEvent> events;
  final PromoPalette palette;

  @override
  Widget build(BuildContext context) {
    final p = palette;
    return PromoCard(
      palette: p,
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text("History", style: promoText(p, size: 16, weight: FontWeight.w800)),
        const SizedBox(height: 8),
        if (events.isEmpty)
          Text("No recorded changes.", style: promoText(p, size: 13, color: p.muted))
        else
          for (final e in events)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 6),
              child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Padding(padding: const EdgeInsets.only(top: 4), child: Icon(Icons.circle, size: 8, color: p.accent)),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(e.label, style: promoText(p, size: 13.5, weight: FontWeight.w700)),
                    Text(_fmt(e.at), style: promoText(p, size: 12, color: p.muted)),
                    if ((e.reason ?? "").isNotEmpty) Text(e.reason!, style: promoText(p, size: 12.5, color: p.muted)),
                  ]),
                ),
              ]),
            ),
      ]),
    );
  }
}

class _Row extends StatelessWidget {
  const _Row(this.label, this.value, this.palette);

  final String label;
  final String value;
  final PromoPalette palette;

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 4),
        child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          SizedBox(width: 130, child: Text(label, style: promoText(palette, size: 13, color: palette.muted))),
          Expanded(child: Text(value, style: promoText(palette, size: 13.5, weight: FontWeight.w600))),
        ]),
      );
}
