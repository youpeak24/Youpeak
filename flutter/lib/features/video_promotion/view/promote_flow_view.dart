import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:get/get.dart';
import 'package:youpeak/core/constants/app_string.dart';
import 'package:youpeak/core/network/app_api_client.dart';
import 'package:youpeak/core/payment/razorpay/razorpay_service.dart';
import 'package:youpeak/core/platform/platform_info.dart';
import 'package:youpeak/core/settings/admin_settings_api.dart';
import 'package:youpeak/core/utils/custom_toast.dart';
import 'package:youpeak/main.dart';
import 'package:youpeak/shared/widgets/loader_ui.dart';
import 'package:youpeak/features/profile/api/get_profile_api.dart';
import 'package:youpeak/features/video_promotion/data/promotion_models.dart';
import 'package:youpeak/features/video_promotion/data/promotion_repository.dart';
import 'package:youpeak/features/video_promotion/view/promotion_campaign_view.dart';
import 'package:youpeak/features/video_promotion/widget/promotion_widgets.dart';

/// Where a promotion purchase stands. Only the server decides "paid" and "active".
enum PromoPayPhase { idle, creatingOrder, checkout, verifying, pending, cancelled, failed }

/// Buying a promotion: 1) one of your eligible videos → 2) a plan (with its
/// details) → 3) review and pay. Payment uses the existing Razorpay order
/// flow; the campaign is created by the server once the payment is verified.
class PromoteFlowView extends ConsumerStatefulWidget {
  const PromoteFlowView({super.key, this.initialPlanId});

  final String? initialPlanId;

  @override
  ConsumerState<PromoteFlowView> createState() => _PromoteFlowViewState();
}

class _PromoteFlowViewState extends ConsumerState<PromoteFlowView> {
  final RazorPayService _razorpay = RazorPayService();

  bool _loading = true;
  String? _loadError;
  List<PromotableVideo> _videos = const [];
  List<PromotionPlan> _plans = const [];

  int _step = 0;
  PromotableVideo? _video;
  PromotionPlan? _plan;

  PromoPayPhase _phase = PromoPayPhase.idle;
  String? _payMessage;
  PromotionOrder? _order;
  bool _checking = false;

  bool get _busy => _phase == PromoPayPhase.creatingOrder || _phase == PromoPayPhase.checkout || _phase == PromoPayPhase.verifying || _checking;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _razorpay.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _loadError = null;
    });
    final repo = ref.read(promotionRepositoryProvider);
    try {
      final results = await Future.wait([repo.eligibleVideos(), repo.plans()]);
      if (!mounted) return;
      setState(() {
        _videos = (results[0] as List<PromotableVideo>)..sort((a, b) => (a.eligible ? 0 : 1) - (b.eligible ? 0 : 1));
        _plans = results[1] as List<PromotionPlan>;
        _plan ??= _plans.where((p) => p.id == widget.initialPlanId).firstOrNull;
        _loading = false;
      });
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _loadError = e.message;
        _loading = false;
      });
    }
  }

  void _goTo(int step) {
    if (_busy || _phase == PromoPayPhase.pending) return;
    setState(() {
      _step = step;
      _phase = PromoPayPhase.idle;
      _payMessage = null;
      if (step < 2) _order = null;
    });
  }

  void _pickVideo(PromotableVideo v) {
    setState(() => _video = v);
    _goTo(_plan != null && widget.initialPlanId != null ? 2 : 1);
  }

  Future<void> _showPlanDetails(PromotionPlan plan, PromoPalette p) async {
    final chosen = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      backgroundColor: p.card,
      constraints: const BoxConstraints(maxWidth: 560),
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (_) => _PlanDetailsSheet(plan: plan, palette: p),
    );
    if (chosen == true && mounted) {
      setState(() => _plan = plan);
      _goTo(2);
    }
  }

  // ── Payment ──────────────────────────────────────────────────────────────

  /// The admin switches the coin and premium checkouts use for Razorpay.
  /// iOS keeps the explicit opt-in (store billing). On Android and the web
  /// only an explicit "off" hides checkout: the promotion page always used
  /// Razorpay, and settings saved before the switch existed don't carry it.
  /// The server refuses the order anyway if Razorpay isn't configured.
  bool get _gatewayAvailable {
    final s = AdminSettingsApi.adminSettingsModel?.setting;
    if (PlatformInfo.isIOS) return s?.razorpayIosEnabled == true;
    if (PlatformInfo.isWeb) return (s?.razorpayWebEnabled ?? s?.razorPaySwitch) != false;
    return s?.razorPaySwitch != false;
  }

  Future<void> _pay() async {
    final video = _video, plan = _plan;
    if (video == null || plan == null || _busy) return;
    setState(() {
      _phase = PromoPayPhase.creatingOrder;
      _payMessage = null;
    });
    final repo = ref.read(promotionRepositoryProvider);
    final PromotionOrder order;
    try {
      order = await repo.createOrder(videoId: video.id, planId: plan.id);
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _phase = PromoPayPhase.failed;
        _payMessage = e.code.startsWith("NETWORK")
            ? "Couldn't start the payment. Nothing was charged. Check your connection and try again."
            : e.message;
      });
      return;
    }
    if (!mounted) return;
    if (order.checkout.isEmpty || order.orderId.isEmpty) {
      setState(() {
        _phase = PromoPayPhase.failed;
        _payMessage = "Couldn't start the payment. Nothing was charged. Please try again.";
      });
      return;
    }
    setState(() {
      _order = order;
      _phase = PromoPayPhase.checkout;
    });
    final user = GetProfileApi.profileModel?.user;
    _razorpay.openCheckout(
      checkout: order.checkout,
      appName: AppStrings.appName.tr,
      email: user?.email,
      contact: user?.mobileNumber,
      onSuccess: (r) => _onGatewaySuccess(r.orderId ?? order.orderId, r.paymentId ?? "", r.signature ?? ""),
      onError: _onGatewayError,
    );
  }

  Future<void> _onGatewaySuccess(String orderId, String paymentId, String signature) async {
    if (!mounted) return;
    setState(() => _phase = PromoPayPhase.verifying);
    try {
      await ref.read(promotionRepositoryProvider).verify(orderId: orderId, paymentId: paymentId, signature: signature);
    } on ApiException {
      // Activation still finishing, a lost response, or a callback the
      // server couldn't verify: the server's record decides, not this reply.
    }
    await _reconcile(polls: 8);
  }

  Future<void> _onGatewayError(String message) async {
    if (!mounted) return;
    // A closed checkout can still have been paid (e.g. the app was in the
    // background when the gateway finished) — ask the server first.
    final state = await _state();
    if (!mounted) return;
    if (state != null && state.paid) {
      await _reconcile(polls: 8);
      return;
    }
    final cancelled = message.toLowerCase().contains("cancel");
    setState(() {
      _phase = cancelled ? PromoPayPhase.cancelled : PromoPayPhase.failed;
      _payMessage = cancelled ? "Payment cancelled. No promotion was bought." : "Payment didn't go through: $message No promotion was bought.";
    });
  }

  Future<PaymentState?> _state() async {
    final order = _order;
    if (order == null) return null;
    try {
      return await ref.read(promotionRepositoryProvider).paymentState(order.orderId);
    } on ApiException {
      return null;
    }
  }

  /// Polls the server's record of this order until the campaign exists.
  Future<void> _reconcile({int polls = 1}) async {
    setState(() {
      _checking = true;
      if (_phase != PromoPayPhase.pending) _phase = PromoPayPhase.verifying;
    });
    PaymentState? state;
    for (var i = 0; i < polls; i++) {
      state = await _state();
      if (!mounted) return;
      if (state != null && state.fulfilled) break;
      if (i < polls - 1) await Future<void>.delayed(const Duration(seconds: 3));
      if (!mounted) return;
    }
    setState(() => _checking = false);
    if (state != null && state.fulfilled) {
      CustomToast.show(AppStrings.promotionActivated.tr);
      final id = state.campaignId;
      if (id != null && id.isNotEmpty) {
        Get.off(() => PromotionCampaignView(campaignId: id));
      } else {
        Get.back();
      }
      return;
    }
    setState(() {
      _phase = PromoPayPhase.pending;
      _payMessage = state != null && state.paid
          ? "Payment received — we're starting your promotion. This can take a minute. Please don't pay again."
          : "We're waiting for the payment provider to confirm your payment. If money left your account, your promotion will start "
              "automatically once it's confirmed. Please don't pay again — check again in a minute.";
    });
  }

  // ── UI ───────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    return Obx(() {
      final p = PromoPalette.of(isDarkMode.value);
      return PopScope(
        canPop: _step == 0 && !_busy,
        onPopInvokedWithResult: (didPop, _) {
          if (!didPop && !_busy && _phase != PromoPayPhase.pending && _step > 0) _goTo(_step - 1);
        },
        child: Scaffold(
          appBar: AppBar(
            backgroundColor: Colors.transparent,
            elevation: 0,
            leading: IconButton(
              tooltip: "Back",
              icon: Icon(Icons.arrow_back, color: p.text),
              onPressed: _busy ? null : () => (_step > 0 && _phase != PromoPayPhase.pending) ? _goTo(_step - 1) : Get.back(),
            ),
            title: Text("Promote a video", style: promoText(p, size: 18, weight: FontWeight.bold)),
          ),
          body: _loading
              ? const LoaderUi()
              : _loadError != null
                  ? PromoErrorView(message: _loadError!, onRetry: _load, palette: p)
                  : LayoutBuilder(builder: (context, box) {
                      final wide = box.maxWidth >= 900;
                      final pad = box.maxWidth < 420 ? 16.0 : 24.0;
                      final content = ListView(
                        padding: EdgeInsets.fromLTRB(pad, 4, pad, 32),
                        children: [
                          _Steps(step: _step, palette: p, onTap: (s) => s < _step ? _goTo(s) : null),
                          const SizedBox(height: 18),
                          if (_step == 0) _videoStep(p),
                          if (_step == 1) _planStep(p, wide ? box.maxWidth - 360 - pad * 2 : box.maxWidth - pad * 2),
                          if (_step == 2) _reviewStep(p, showSummary: !wide),
                        ],
                      );
                      if (!wide) return content;
                      return Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Expanded(child: content),
                        SizedBox(
                          width: 336,
                          child: Padding(
                            padding: EdgeInsets.fromLTRB(0, 4, pad, 24),
                            child: SingleChildScrollView(child: _Summary(video: _video, plan: _plan, palette: p, onChangeVideo: () => _goTo(0), onChangePlan: () => _goTo(1))),
                          ),
                        ),
                      ]);
                    }),
        ),
      );
    });
  }

  Widget _videoStep(PromoPalette p) {
    final eligible = _videos.where((v) => v.eligible).length;
    return Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
      PromoSectionTitle("Choose one of your videos", palette: p, subtitle: "Only public, published normal videos can be promoted."),
      if (_videos.isEmpty)
        PromoCard(palette: p, child: Text(AppStrings.noVideosToPromote.tr, style: promoText(p, color: p.muted)))
      else ...[
        if (eligible == 0)
          Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: Text("None of your videos can be promoted right now — see the reason under each one.", style: promoText(p, size: 13, color: p.muted)),
          ),
        for (final v in _videos)
          Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: Opacity(
              opacity: v.eligible ? 1 : 0.6,
              child: Semantics(
                button: v.eligible,
                enabled: v.eligible,
                selected: _video?.id == v.id,
                label: v.eligible ? v.title : "${v.title}. Can't be promoted: ${v.reason ?? ""}",
                child: PromoCard(
                  palette: p,
                  padding: const EdgeInsets.all(10),
                  selected: _video?.id == v.id,
                  onTap: v.eligible ? () => _pickVideo(v) : null,
                  child: ExcludeSemantics(
                    child: Row(children: [
                      PromoThumb(url: v.image, width: 112),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          Text(v.title.isEmpty ? "Untitled video" : v.title, maxLines: 2, overflow: TextOverflow.ellipsis, style: promoText(p, size: 14.5, weight: FontWeight.w700)),
                          if (!v.eligible && v.reason != null) ...[
                            const SizedBox(height: 4),
                            Text(v.reason!, style: promoText(p, size: 12.5, color: p.muted)),
                          ],
                        ]),
                      ),
                      if (v.eligible) Icon(Icons.chevron_right, color: p.muted),
                    ]),
                  ),
                ),
              ),
            ),
          ),
      ],
    ]);
  }

  Widget _planStep(PromoPalette p, double width) {
    final cols = promoPlanColumns(width);
    const gap = 12.0;
    final tileW = (width - gap * (cols - 1)) / cols;
    return Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
      PromoSectionTitle("Choose a plan", palette: p, subtitle: "Tap a plan to see its details."),
      if (_plans.isEmpty)
        PromoCard(palette: p, child: Text("No promotion plans are available right now.", style: promoText(p, color: p.muted)))
      else
        Wrap(spacing: gap, runSpacing: gap, children: [
          for (final plan in _plans)
            SizedBox(width: tileW, child: PromoPlanCard(plan: plan, palette: p, selected: _plan?.id == plan.id, onTap: () => _showPlanDetails(plan, p))),
        ]),
      const SizedBox(height: 12),
      PromoEstimateNote(palette: p),
    ]);
  }

  Widget _reviewStep(PromoPalette p, {required bool showSummary}) {
    final plan = _plan, video = _video;
    if (plan == null || video == null) return const SizedBox.shrink();
    final available = _gatewayAvailable;
    final pending = _phase == PromoPayPhase.pending;
    return Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
      PromoSectionTitle("Review your order", palette: p),
      if (showSummary) ...[
        _Summary(video: video, plan: plan, palette: p, onChangeVideo: () => _goTo(0), onChangePlan: () => _goTo(1)),
        const SizedBox(height: 14),
      ],
      PromoCard(
        palette: p,
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          _Fact("Starts", "When your payment is verified (or when this video's current promotion ends)", p),
          _Fact("Runs for", plan.durationText, p),
          _Fact("Shown to", "${plan.targeting} — signed-in viewers, in the Promoted spot on Home", p),
          _Fact("Estimated impressions", plan.impressionsLabel, p),
          Divider(color: p.border, height: 20),
          Row(children: [
            Expanded(child: Text("Total", style: promoText(p, size: 16, weight: FontWeight.w800))),
            Text(plan.priceLabel, style: promoText(p, size: 22, weight: FontWeight.w900)),
          ]),
          const SizedBox(height: 4),
          Text("This is the full amount charged. Paid securely through Razorpay.", style: promoText(p, size: 12.5, color: p.muted)),
        ]),
      ),
      const SizedBox(height: 12),
      PromoEstimateNote(palette: p),
      const SizedBox(height: 18),
      if (_payMessage != null) ...[
        _StatusBanner(phase: _phase, message: _payMessage!, palette: p),
        const SizedBox(height: 14),
      ],
      if (!available)
        Text("Promotion purchases aren't available on this device right now.", textAlign: TextAlign.center, style: promoText(p, color: p.muted))
      else if (pending) ...[
        PromoPrimaryButton(label: "Check again", icon: Icons.refresh, loading: _checking, onPressed: () => _reconcile()),
        const SizedBox(height: 10),
        TextButton(onPressed: () => Get.back(), child: const Text("Go to My promotions")),
      ] else
        PromoPrimaryButton(
          label: switch (_phase) {
            PromoPayPhase.creatingOrder => "Preparing payment…",
            PromoPayPhase.checkout => "Complete the payment in the Razorpay window",
            PromoPayPhase.verifying => "Confirming your payment…",
            PromoPayPhase.cancelled || PromoPayPhase.failed => "Try again · ${plan.priceLabel}",
            _ => "Pay ${plan.priceLabel}",
          },
          icon: Icons.lock_outline_rounded,
          loading: _phase == PromoPayPhase.creatingOrder || _phase == PromoPayPhase.verifying,
          onPressed: _phase == PromoPayPhase.checkout ? null : _pay,
        ),
    ]);
  }
}

class _Fact extends StatelessWidget {
  const _Fact(this.label, this.value, this.palette);

  final String label;
  final String value;
  final PromoPalette palette;

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 5),
        child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          SizedBox(width: 150, child: Text(label, style: promoText(palette, size: 13, color: palette.muted))),
          Expanded(child: Text(value, style: promoText(palette, size: 14, weight: FontWeight.w600))),
        ]),
      );
}

class _StatusBanner extends StatelessWidget {
  const _StatusBanner({required this.phase, required this.message, required this.palette});

  final PromoPayPhase phase;
  final String message;
  final PromoPalette palette;

  @override
  Widget build(BuildContext context) {
    final p = palette;
    final (icon, color) = switch (phase) {
      PromoPayPhase.pending => (Icons.hourglass_top_rounded, const Color(0xFFD97706)),
      PromoPayPhase.cancelled => (Icons.close_rounded, p.muted),
      _ => (Icons.error_outline_rounded, p.error),
    };
    return Semantics(
      liveRegion: true,
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(color: color.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(12), border: Border.all(color: color.withValues(alpha: 0.5))),
        child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Icon(icon, color: color, size: 20),
          const SizedBox(width: 10),
          Expanded(child: Text(message, style: promoText(p, size: 13.5, height: 1.35))),
        ]),
      ),
    );
  }
}

class _Steps extends StatelessWidget {
  const _Steps({required this.step, required this.palette, required this.onTap});

  final int step;
  final PromoPalette palette;
  final void Function(int) onTap;

  static const _labels = ["Video", "Plan", "Review & pay"];

  @override
  Widget build(BuildContext context) => LayoutBuilder(builder: (context, box) => _row(compact: box.maxWidth < 480));

  // Narrow screens label only the current step (the others keep their numbers).
  Widget _row({required bool compact}) {
    final p = palette;
    return Row(children: [
      for (var i = 0; i < _labels.length; i++) ...[
        if (i > 0) Expanded(child: Container(height: 2, margin: const EdgeInsets.symmetric(horizontal: 6), color: i <= step ? p.accent : p.border)),
        Semantics(
          button: i < step,
          selected: i == step,
          label: "Step ${i + 1} of 3, ${_labels[i]}",
          child: InkWell(
            borderRadius: BorderRadius.circular(99),
            onTap: i < step ? () => onTap(i) : null,
            child: ExcludeSemantics(
              child: Row(mainAxisSize: MainAxisSize.min, children: [
                CircleAvatar(
                  radius: 12,
                  backgroundColor: i <= step ? p.accent : p.border,
                  child: i < step
                      ? const Icon(Icons.check, size: 14, color: Colors.white)
                      : Text("${i + 1}", style: promoText(p, size: 12, weight: FontWeight.w800, color: Colors.white)),
                ),
                if (!compact || i == step) ...[
                  const SizedBox(width: 6),
                  Text(_labels[i], style: promoText(p, size: 13, weight: i == step ? FontWeight.w800 : FontWeight.w600, color: i == step ? p.text : p.muted)),
                ],
              ]),
            ),
          ),
        ),
      ],
    ]);
  }
}

class _Summary extends StatelessWidget {
  const _Summary({required this.video, required this.plan, required this.palette, required this.onChangeVideo, required this.onChangePlan});

  final PromotableVideo? video;
  final PromotionPlan? plan;
  final PromoPalette palette;
  final VoidCallback onChangeVideo;
  final VoidCallback onChangePlan;

  @override
  Widget build(BuildContext context) {
    final p = palette;
    Widget change(VoidCallback onTap) => TextButton(onPressed: onTap, child: const Text("Change"));
    return PromoCard(
      palette: p,
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text("Your order", style: promoText(p, size: 16, weight: FontWeight.w800)),
        const SizedBox(height: 10),
        Text("Video", style: promoText(p, size: 12.5, color: p.muted)),
        const SizedBox(height: 4),
        if (video == null)
          Text("Not chosen yet", style: promoText(p, color: p.muted))
        else
          Row(children: [
            PromoThumb(url: video!.image, width: 80),
            const SizedBox(width: 10),
            Expanded(child: Text(video!.title, maxLines: 2, overflow: TextOverflow.ellipsis, style: promoText(p, size: 13.5, weight: FontWeight.w700))),
            change(onChangeVideo),
          ]),
        Divider(color: p.border, height: 22),
        Text("Plan", style: promoText(p, size: 12.5, color: p.muted)),
        const SizedBox(height: 4),
        if (plan == null)
          Text("Not chosen yet", style: promoText(p, color: p.muted))
        else ...[
          Row(children: [
            Expanded(child: Text(plan!.name, style: promoText(p, size: 15, weight: FontWeight.w800))),
            change(onChangePlan),
          ]),
          Text("${plan!.durationText} · ${plan!.impressionsLabel} est. impressions · ${plan!.targeting}", style: promoText(p, size: 13, color: p.muted)),
          Divider(color: p.border, height: 22),
          Row(children: [
            Expanded(child: Text("Total", style: promoText(p, size: 15, weight: FontWeight.w800))),
            Text(plan!.priceLabel, style: promoText(p, size: 20, weight: FontWeight.w900)),
          ]),
        ],
      ]),
    );
  }
}

class _PlanDetailsSheet extends StatelessWidget {
  const _PlanDetailsSheet({required this.plan, required this.palette});

  final PromotionPlan plan;
  final PromoPalette palette;

  @override
  Widget build(BuildContext context) {
    final p = palette;
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 20),
      child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
        Center(child: Container(width: 36, height: 4, decoration: BoxDecoration(color: p.border, borderRadius: BorderRadius.circular(4)))),
        const SizedBox(height: 14),
        Text(plan.name, style: promoText(p, size: 22, weight: FontWeight.w900)),
        if (plan.category.isNotEmpty) Text("${plan.category} plan", style: promoText(p, size: 13, color: p.muted)),
        const SizedBox(height: 14),
        _Fact("Price", "${plan.priceLabel} (full amount charged)", p),
        _Fact("Duration", plan.durationText, p),
        _Fact("Estimated impressions", plan.impressionsLabel, p),
        _Fact("Targeting", plan.targeting, p),
        if (plan.costPer1kLabel != null) _Fact("Per 1,000 est. impressions", plan.costPer1kLabel!, p),
        _Fact("Where it's shown", "The Promoted spot on the Home feed", p),
        const SizedBox(height: 10),
        PromoEstimateNote(palette: p),
        const SizedBox(height: 18),
        PromoPrimaryButton(label: "Choose ${plan.name}", onPressed: () => Navigator.of(context).pop(true)),
        const SizedBox(height: 6),
        Center(child: TextButton(onPressed: () => Navigator.of(context).pop(false), child: const Text("Compare other plans"))),
      ]),
    );
  }
}
