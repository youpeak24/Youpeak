import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:get/get.dart';
import 'package:youpeak/core/constants/app_string.dart';
import 'package:youpeak/core/network/app_api_client.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'package:youpeak/core/utils/money_format.dart';
import 'package:youpeak/main.dart';
import 'package:youpeak/shared/widgets/loader_ui.dart';
import 'package:youpeak/features/video_promotion/data/promotion_models.dart';
import 'package:youpeak/features/video_promotion/data/promotion_repository.dart';
import 'package:youpeak/features/video_promotion/view/promote_flow_view.dart';
import 'package:youpeak/features/video_promotion/view/promotion_campaign_view.dart';
import 'package:youpeak/features/video_promotion/widget/promotion_widgets.dart';

/// Video Promotion hub: what promotion is (and how it differs from Peak
/// Boost), the creator's own promotions, the rate-card plans and an honest
/// value comparison. Buying happens in [PromoteFlowView].
class PromoteVideoView extends ConsumerStatefulWidget {
  const PromoteVideoView({super.key});

  @override
  ConsumerState<PromoteVideoView> createState() => _PromoteVideoViewState();
}

class _PromoteVideoViewState extends ConsumerState<PromoteVideoView> {
  bool _loading = true;
  String? _error;
  List<PromotionPlan> _plans = const [];
  List<PromotionCampaign> _campaigns = const [];

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
    final repo = ref.read(promotionRepositoryProvider);
    try {
      final results = await Future.wait([repo.plans(), repo.myCampaigns()]);
      if (!mounted) return;
      setState(() {
        _plans = results[0] as List<PromotionPlan>;
        _campaigns = results[1] as List<PromotionCampaign>;
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

  Future<void> _startFlow({String? planId}) async {
    await Get.to(() => PromoteFlowView(initialPlanId: planId));
    if (mounted) _load();
  }

  Future<void> _openCampaign(PromotionCampaign c) async {
    await Get.to(() => PromotionCampaignView(campaignId: c.id));
    if (mounted) _load();
  }

  @override
  Widget build(BuildContext context) {
    return Obx(() {
      final p = PromoPalette.of(isDarkMode.value);
      return Scaffold(
        appBar: AppBar(
          systemOverlayStyle: const SystemUiOverlayStyle(statusBarColor: Colors.transparent, statusBarBrightness: Brightness.dark),
          backgroundColor: Colors.transparent,
          elevation: 0,
          leading: IconButton(tooltip: "Back", icon: Icon(Icons.arrow_back, color: p.text), onPressed: () => Get.back()),
          title: Text(AppStrings.videoPromotionTitle.tr, style: promoText(p, size: 18, weight: FontWeight.bold)),
          centerTitle: AppSettings.isCenterTitle,
        ),
        body: _loading
            ? const LoaderUi()
            : _error != null
                ? PromoErrorView(message: _error!, onRetry: _load, palette: p)
                : RefreshIndicator(
                    onRefresh: _load,
                    child: LayoutBuilder(builder: (context, box) {
                      final wide = box.maxWidth >= 840;
                      final pad = box.maxWidth < 420 ? 16.0 : 24.0;
                      return ListView(
                        physics: const AlwaysScrollableScrollPhysics(),
                        padding: EdgeInsets.fromLTRB(pad, 8, pad, 32),
                        children: [
                          _Intro(palette: p, wide: wide, onStart: _plans.isEmpty ? null : () => _startFlow()),
                          const SizedBox(height: 24),
                          PromoSectionTitle("My promotions", palette: p, subtitle: _campaigns.isEmpty ? null : "Impressions are counted by YouPeak as your video is shown."),
                          if (_campaigns.isEmpty)
                            PromoCard(palette: p, child: Center(child: Text(AppStrings.noPromotionsYet.tr, style: promoText(p, color: p.muted))))
                          else
                            _CampaignList(campaigns: _campaigns, palette: p, wide: wide, onOpen: _openCampaign),
                          const SizedBox(height: 28),
                          PromoSectionTitle("Plans", palette: p, subtitle: "All plans target viewers globally. Prices are in Indian rupees."),
                          if (_plans.isEmpty)
                            PromoCard(palette: p, child: Text("No promotion plans are available right now.", style: promoText(p, color: p.muted)))
                          else
                            _PlanGrid(plans: _plans, palette: p, width: box.maxWidth - pad * 2, onPick: (plan) => _startFlow(planId: plan.id)),
                          const SizedBox(height: 10),
                          PromoEstimateNote(palette: p),
                          if (PlanComparison.from(_plans) case final cmp?) ...[
                            const SizedBox(height: 28),
                            _ComparisonCard(cmp: cmp, palette: p),
                          ],
                          const SizedBox(height: 28),
                          _HowItWorks(palette: p),
                        ],
                      );
                    }),
                  ),
      );
    });
  }
}

class _Intro extends StatelessWidget {
  const _Intro({required this.palette, required this.wide, required this.onStart});

  final PromoPalette palette;
  final bool wide;
  final VoidCallback? onStart;

  @override
  Widget build(BuildContext context) {
    final p = palette;
    final promote = _IntroTile(
      palette: p,
      icon: Icons.campaign_rounded,
      title: "Promote my video",
      body: "Pay a fixed price to show one of your own videos in the Promoted spot on Home for a set number of days.",
      highlight: true,
    );
    final boost = _IntroTile(
      palette: p,
      icon: Icons.rocket_launch_rounded,
      title: "Not the same as Peak Boost",
      body: "Peak Boost is how fans support a creator by sending coins on a video. It doesn't buy placement.",
    );
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text("Get your video in front of more viewers", style: promoText(p, size: wide ? 26 : 22, weight: FontWeight.w900)),
        const SizedBox(height: 14),
        if (wide)
          IntrinsicHeight(child: Row(crossAxisAlignment: CrossAxisAlignment.stretch, children: [Expanded(child: promote), const SizedBox(width: 12), Expanded(child: boost)]))
        else ...[
          promote,
          const SizedBox(height: 10),
          boost,
        ],
        const SizedBox(height: 16),
        Align(
          alignment: wide ? Alignment.centerLeft : Alignment.center,
          child: ConstrainedBox(
            constraints: BoxConstraints(maxWidth: wide ? 320 : double.infinity),
            child: PromoPrimaryButton(label: AppStrings.promoteAVideo.tr, icon: Icons.campaign_rounded, onPressed: onStart),
          ),
        ),
      ],
    );
  }
}

class _IntroTile extends StatelessWidget {
  const _IntroTile({required this.palette, required this.icon, required this.title, required this.body, this.highlight = false});

  final PromoPalette palette;
  final IconData icon;
  final String title;
  final String body;
  final bool highlight;

  @override
  Widget build(BuildContext context) {
    final p = palette;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: highlight ? p.accentSoft : p.card,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: highlight ? p.accent.withValues(alpha: 0.5) : p.border),
      ),
      child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Icon(icon, color: highlight ? p.accent : p.muted),
        const SizedBox(width: 12),
        Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(title, style: promoText(p, size: 15, weight: FontWeight.w800)),
            const SizedBox(height: 4),
            Text(body, style: promoText(p, size: 13.5, color: p.muted, height: 1.35)),
          ]),
        ),
      ]),
    );
  }
}

class _CampaignList extends StatelessWidget {
  const _CampaignList({required this.campaigns, required this.palette, required this.wide, required this.onOpen});

  final List<PromotionCampaign> campaigns;
  final PromoPalette palette;
  final bool wide;
  final void Function(PromotionCampaign) onOpen;

  @override
  Widget build(BuildContext context) {
    final p = palette;
    return Column(
      children: [
        for (final c in campaigns)
          Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: Semantics(
              button: true,
              label: "${c.videoTitle}, ${c.planName}, ${campaignStatusLabel(c.status)}",
              child: PromoCard(
                palette: p,
                padding: const EdgeInsets.all(12),
                onTap: () => onOpen(c),
                child: ExcludeSemantics(
                  child: Row(children: [
                    PromoThumb(url: c.videoImage, width: wide ? 128 : 88),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Text(c.videoTitle.isEmpty ? "Video" : c.videoTitle, maxLines: 1, overflow: TextOverflow.ellipsis, style: promoText(p, size: 15, weight: FontWeight.w700)),
                        const SizedBox(height: 2),
                        Text("${c.planName} · ${MoneyFormat.inr(c.priceInr, whole: true)}", style: promoText(p, size: 13, color: p.muted)),
                        const SizedBox(height: 2),
                        Text("${MoneyFormat.coins(c.impressionsDelivered)} counted · est. ${c.estimateLabel}",
                            maxLines: 1, overflow: TextOverflow.ellipsis, style: promoText(p, size: 12.5, color: p.muted)),
                        if (!wide) ...[const SizedBox(height: 6), PromoStatusChip(c.status)],
                      ]),
                    ),
                    if (wide) ...[const SizedBox(width: 12), PromoStatusChip(c.status)],
                    Icon(Icons.chevron_right, color: p.muted),
                  ]),
                ),
              ),
            ),
          ),
      ],
    );
  }
}

class _PlanGrid extends StatelessWidget {
  const _PlanGrid({required this.plans, required this.palette, required this.width, required this.onPick});

  final List<PromotionPlan> plans;
  final PromoPalette palette;
  final double width;
  final void Function(PromotionPlan) onPick;

  @override
  Widget build(BuildContext context) {
    final cols = promoPlanColumns(width);
    const gap = 12.0;
    final tileW = (width - gap * (cols - 1)) / cols;
    return Wrap(
      spacing: gap,
      runSpacing: gap,
      children: [for (final plan in plans) SizedBox(width: tileW, child: PromoPlanCard(plan: plan, palette: palette, onTap: () => onPick(plan)))],
    );
  }
}

/// The rate card's 30-day comparison, from live prices, shown as ranges.
class _ComparisonCard extends StatelessWidget {
  const _ComparisonCard({required this.cmp, required this.palette});

  final PlanComparison cmp;
  final PromoPalette palette;

  String _x(double v) => "${v.toStringAsFixed(1)}×";

  @override
  Widget build(BuildContext context) {
    final p = palette;
    final d = cmp.daily, m = cmp.monthly;
    Widget row(String label, String a, String b) => Padding(
          padding: const EdgeInsets.symmetric(vertical: 6),
          child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Expanded(flex: 4, child: Text(label, style: promoText(p, size: 13, color: p.muted))),
            Expanded(flex: 5, child: Text(a, style: promoText(p, size: 13.5, weight: FontWeight.w600))),
            Expanded(flex: 5, child: Text(b, style: promoText(p, size: 13.5, weight: FontWeight.w600))),
          ]),
        );
    return PromoCard(
      palette: p,
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text("Compare ${cmp.days} days", style: promoText(p, size: 17, weight: FontWeight.w800)),
        const SizedBox(height: 4),
        Text("Buying the ${d.name} every day vs one ${m.name}.", style: promoText(p, size: 13, color: p.muted)),
        const SizedBox(height: 10),
        row("", "${d.name} × ${cmp.days}", m.name),
        Divider(color: p.border, height: 1),
        row("Total price", MoneyFormat.inr(cmp.dailyTotal, whole: true), m.priceLabel),
        row("Est. impressions", impressionRange(cmp.dailyImpressionsMin, cmp.dailyImpressionsMax), m.impressionsLabel),
        row("Per 1,000 est.", d.costPer1kLabel ?? "—", m.costPer1kLabel ?? "—"),
        row("Purchases", "${cmp.days} separate orders", "1 order"),
        const SizedBox(height: 8),
        Text(
          "The ${m.name}'s estimate is about ${_x(cmp.ratioLow)} to ${_x(cmp.ratioHigh)} the ${cmp.days}-day ${d.name} estimate "
          "(${_x(cmp.ratioLowToLow)} comparing the low ends). Both are estimates, so the real difference can be anywhere in that range.",
          style: promoText(p, size: 12.5, color: p.muted, height: 1.35),
        ),
      ]),
    );
  }
}

class _HowItWorks extends StatelessWidget {
  const _HowItWorks({required this.palette});

  final PromoPalette palette;

  @override
  Widget build(BuildContext context) {
    final p = palette;
    Widget item(IconData icon, String title, String body) => Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Icon(icon, size: 20, color: p.accent),
            const SizedBox(width: 10),
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(title, style: promoText(p, size: 14, weight: FontWeight.w800)),
                const SizedBox(height: 2),
                Text(body, style: promoText(p, size: 13, color: p.muted, height: 1.35)),
              ]),
            ),
          ]),
        );
    return PromoCard(
      palette: p,
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text("How promotion works", style: promoText(p, size: 17, weight: FontWeight.w800)),
        const SizedBox(height: 12),
        item(Icons.verified_outlined, "Starts after payment is verified",
            "Your promotion begins as soon as YouPeak confirms your payment. If the video is already being promoted, the new one starts when the current one ends."),
        item(Icons.home_outlined, "Shown in the Promoted spot",
            "Your video appears with a “Promoted” label on the Home feed of signed-in viewers worldwide, until the plan's days end or its upper estimate is reached."),
        item(Icons.visibility_outlined, "How impressions are counted",
            "One impression is a viewer seeing your Promoted card on screen. Each viewer counts at most once a day, and your own views never count."),
        item(Icons.receipt_long_outlined, "Price",
            "The price shown is the full amount you pay. Refunds aren't covered by the published rate card — contact YouPeak support if something goes wrong."),
        Text("Only public, published normal videos (not Bites) can be promoted.", style: promoText(p, size: 12.5, color: p.muted)),
      ]),
    );
  }
}

