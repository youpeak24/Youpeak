import 'package:youpeak/shared/widgets/app_icon.dart';
import 'package:youpeak/core/assets/app_icons.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:youpeak/features/video_promotion/data/promotion_models.dart';

/// Colours for the promotion pages in the current (light/dark) theme.
class PromoPalette {
  const PromoPalette._(this.dark);

  factory PromoPalette.of(bool dark) => PromoPalette._(dark);

  final bool dark;

  Color get card => dark ? AppColor.secondDarkMode : AppColor.white;
  Color get border => dark ? const Color(0xFF2F6B43) : const Color(0xFFE2E8F0);
  Color get text => dark ? AppColor.white : AppColor.primaryTextIcons;
  Color get muted => dark ? const Color(0xFFB6C8BC) : const Color(0xFF5B6472);
  Color get accent => AppColor.primaryColor;
  Color get accentSoft => AppColor.primaryColor.withValues(alpha: dark ? 0.28 : 0.10);
  Color get warnSoft => const Color(0xFFF59E0B).withValues(alpha: dark ? 0.22 : 0.12);
  Color get error => const Color(0xFFDC2626);
}

TextStyle promoText(PromoPalette p, {double size = 14, FontWeight weight = FontWeight.w500, Color? color, double? height}) =>
    GoogleFonts.urbanist(fontSize: size, fontWeight: weight, color: color ?? p.text, height: height);

class PromoCard extends StatelessWidget {
  const PromoCard({super.key, required this.palette, required this.child, this.padding = const EdgeInsets.all(16), this.selected = false, this.onTap});

  final PromoPalette palette;
  final Widget child;
  final EdgeInsets padding;
  final bool selected;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: palette.card,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(14),
        side: BorderSide(color: selected ? palette.accent : palette.border, width: selected ? 2 : 1),
      ),
      clipBehavior: Clip.antiAlias,
      child: InkWell(onTap: onTap, child: Padding(padding: padding, child: child)),
    );
  }
}

class PromoSectionTitle extends StatelessWidget {
  const PromoSectionTitle(this.title, {super.key, required this.palette, this.subtitle, this.trailing});

  final String title;
  final String? subtitle;
  final PromoPalette palette;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.only(bottom: 10),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Semantics(header: true, child: Text(title, style: promoText(palette, size: 17, weight: FontWeight.w800))),
                  if (subtitle != null) ...[
                    const SizedBox(height: 2),
                    Text(subtitle!, style: promoText(palette, size: 13, color: palette.muted)),
                  ],
                ],
              ),
            ),
            if (trailing != null) trailing!,
          ],
        ),
      );
}

class PromoThumb extends StatelessWidget {
  const PromoThumb({super.key, required this.url, this.width = 96, this.radius = 8});

  final String url;
  final double width;
  final double radius;

  @override
  Widget build(BuildContext context) => ClipRRect(
        borderRadius: BorderRadius.circular(radius),
        child: SizedBox(
          width: width,
          child: AspectRatio(
            aspectRatio: 16 / 9,
            child: url.isEmpty
                ? Container(color: AppColor.grey.withValues(alpha: 0.25), child: const Icon(Icons.play_circle_outline, color: AppColor.grey))
                : Image.network(
                    url,
                    fit: BoxFit.cover,
                    webHtmlElementStrategy: WebHtmlElementStrategy.fallback,
                    errorBuilder: (_, __, ___) => Container(color: AppColor.grey.withValues(alpha: 0.25), child: const Icon(Icons.play_circle_outline, color: AppColor.grey)),
                  ),
          ),
        ),
      );
}

class PromoStatusChip extends StatelessWidget {
  const PromoStatusChip(this.status, {super.key});

  final CampaignStatus status;

  Color get _color => switch (status) {
        CampaignStatus.active => AppColor.primaryColor,
        CampaignStatus.scheduled => const Color(0xFF2563EB),
        CampaignStatus.paused => const Color(0xFFD97706),
        CampaignStatus.completed => const Color(0xFF7C3AED),
        CampaignStatus.rejected => const Color(0xFFDC2626),
        _ => AppColor.grey,
      };

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
        decoration: BoxDecoration(color: _color.withValues(alpha: 0.14), borderRadius: BorderRadius.circular(99)),
        child: Text(campaignStatusLabel(status), style: GoogleFonts.urbanist(fontSize: 12, fontWeight: FontWeight.w800, color: _color)),
      );
}

/// One rate-card plan. Impressions are always labelled as an estimate.
class PromoPlanCard extends StatelessWidget {
  const PromoPlanCard({super.key, required this.plan, required this.palette, this.selected = false, this.onTap});

  final PromotionPlan plan;
  final PromoPalette palette;
  final bool selected;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final p = palette;
    return Semantics(
      button: onTap != null,
      selected: selected,
      label: "${plan.name}, ${plan.priceLabel}, ${plan.durationText}, estimated ${plan.impressionsLabel} impressions",
      child: PromoCard(
        palette: p,
        selected: selected,
        onTap: onTap,
        child: ExcludeSemantics(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                children: [
                  Expanded(child: Text(plan.name, style: promoText(p, size: 16, weight: FontWeight.w800), maxLines: 1, overflow: TextOverflow.ellipsis)),
                  if (plan.category.isNotEmpty)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(color: p.accentSoft, borderRadius: BorderRadius.circular(99)),
                      child: Text(plan.category, style: promoText(p, size: 11, weight: FontWeight.w800, color: p.dark ? AppColor.white : p.accent)),
                    ),
                ],
              ),
              const SizedBox(height: 8),
              Text(plan.priceLabel, style: promoText(p, size: 26, weight: FontWeight.w900, color: p.dark ? AppColor.white : p.accent)),
              Text("for ${plan.durationText}", style: promoText(p, size: 13, color: p.muted)),
              const SizedBox(height: 10),
              _Line(icon: Icons.visibility_outlined, text: "${plan.impressionsLabel} est. impressions", palette: p),
              _Line(icon: Icons.public, text: "${plan.targeting} targeting", palette: p),
              if (plan.costPer1kLabel != null) _Line(icon: Icons.calculate_outlined, text: "${plan.costPer1kLabel} per 1,000 est.", palette: p),
              if (selected) ...[
                const SizedBox(height: 8),
                Row(children: [
                  Icon(Icons.check_circle, size: 16, color: p.accent),
                  const SizedBox(width: 6),
                  Text("Selected", style: promoText(p, size: 13, weight: FontWeight.w800, color: p.accent)),
                ]),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _Line extends StatelessWidget {
  const _Line({required this.icon, required this.text, required this.palette});

  final IconData icon;
  final String text;
  final PromoPalette palette;

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.only(top: 4),
        child: Row(children: [
          Icon(icon, size: 15, color: palette.muted),
          const SizedBox(width: 6),
          Expanded(child: Text(text, style: promoText(palette, size: 13, color: palette.muted))),
        ]),
      );
}

class PromoErrorView extends StatelessWidget {
  const PromoErrorView({super.key, required this.message, required this.onRetry, required this.palette});

  final String message;
  final VoidCallback onRetry;
  final PromoPalette palette;

  @override
  Widget build(BuildContext context) => Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            Icon(Icons.cloud_off_rounded, size: 40, color: palette.muted),
            const SizedBox(height: 10),
            Text(message, textAlign: TextAlign.center, style: promoText(palette, size: 15)),
            const SizedBox(height: 14),
            OutlinedButton.icon(onPressed: onRetry, icon: const AppIcon(AppIcons.extraRetry, size: 20), label: const Text("Retry")),
          ]),
        ),
      );
}

class PromoPrimaryButton extends StatelessWidget {
  const PromoPrimaryButton({super.key, required this.label, required this.onPressed, this.loading = false, this.icon});

  final String label;
  final VoidCallback? onPressed;
  final bool loading;
  final IconData? icon;

  @override
  Widget build(BuildContext context) => SizedBox(
        height: 50,
        width: double.infinity,
        child: FilledButton(
          style: FilledButton.styleFrom(
            backgroundColor: AppColor.primaryColor,
            disabledBackgroundColor: AppColor.primaryColor.withValues(alpha: 0.45),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(99)),
          ),
          onPressed: loading ? null : onPressed,
          child: loading
              ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2.4, color: AppColor.white))
              : Row(mainAxisSize: MainAxisSize.min, children: [
                  if (icon != null) ...[Icon(icon, size: 18, color: AppColor.white), const SizedBox(width: 8)],
                  Flexible(child: Text(label, overflow: TextOverflow.ellipsis, style: GoogleFonts.urbanist(color: AppColor.white, fontWeight: FontWeight.w800, fontSize: 16))),
                ]),
        ),
      );
}

/// Plain-language note that impressions are estimates (used on every step).
class PromoEstimateNote extends StatelessWidget {
  const PromoEstimateNote({super.key, required this.palette});

  final PromoPalette palette;

  @override
  Widget build(BuildContext context) => Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(Icons.info_outline_rounded, size: 16, color: palette.muted),
          const SizedBox(width: 6),
          Expanded(
            child: Text(
              "Impression numbers are estimates, not guarantees. Delivery depends on how many people use YouPeak while your promotion runs.",
              style: promoText(palette, size: 12.5, color: palette.muted, height: 1.35),
            ),
          ),
        ],
      );
}

/// Grid columns for plan cards in [width].
int promoPlanColumns(double width) => width >= 1000 ? 3 : width >= 620 ? 2 : 1;
