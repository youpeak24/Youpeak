import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/core/network/app_api_client.dart';
import 'package:youpeak/core/security/presentation/task_lock_gate.dart';
import 'package:youpeak/core/security/security_service.dart';
import 'package:youpeak/core/storage/database/database.dart';
import 'package:youpeak/core/system_config/presentation/system_configs_provider.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:youpeak/core/utils/money_format.dart';
import 'package:youpeak/features/payout/presentation/withdrawal_modal.dart';
import 'package:youpeak/features/rewards/view/earn_reward_view.dart';
import 'package:youpeak/features/tasker/domain/tasker_dashboard.dart';
import 'package:youpeak/features/tasker/presentation/tasker_dashboard_provider.dart';
import 'package:youpeak/features/tiers/view/tasker_tier_view.dart';

class TaskerDashboardView extends ConsumerWidget {
  const TaskerDashboardView({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final dashboard = ref.watch(taskerDashboardProvider);
    return Scaffold(
      backgroundColor: AppColor.screenBackground,
      appBar: AppBar(
        backgroundColor: AppColor.screenBackground,
        foregroundColor: AppColor.primaryTextIcons,
        elevation: 0,
        title: Text("Tasker Dashboard", style: GoogleFonts.urbanist(fontWeight: FontWeight.w800, color: AppColor.primaryTextIcons)),
      ),
      body: dashboard.when(
        data: (d) => RefreshIndicator(
          color: AppColor.primaryColor,
          onRefresh: () => ref.read(taskerDashboardProvider.notifier).refresh(),
          child: TaskerDashboardBody(dashboard: d),
        ),
        loading: () => const Center(child: CircularProgressIndicator(color: AppColor.primaryColor)),
        error: (e, _) => _ErrorState(
          error: e,
          onRetry: () => ref.invalidate(taskerDashboardProvider),
        ),
      ),
    );
  }
}

/// The dashboard content, separate from loading so it can be tested with
/// fixed data.
class TaskerDashboardBody extends ConsumerWidget {
  const TaskerDashboardBody({super.key, required this.dashboard});

  final TaskerDashboard dashboard;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final d = dashboard;
    final configs = ref.watch(systemConfigsProvider);
    final rate = configs.taskerTiers.coinsPerInr;
    final security = ref.watch(securityServiceProvider);
    final locked = security.isLocked || d.taskingLocked;
    final lockText = security.isLocked ? security.message : (d.securityMessage ?? "Tasks are paused on this device.");

    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: EdgeInsets.fromLTRB(16, 4, 16, 24 + MediaQuery.paddingOf(context).bottom),
      children: [
        _HeaderCard(dashboard: d, rate: rate),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _StatTile(
                label: "Today's Cap",
                value: "${MoneyFormat.coins(d.today.capCoins)} coins",
                caption: configs.taskerTiers.capBoostCoins > 0 ? "+${MoneyFormat.coins(configs.taskerTiers.capBoostCoins)} boost included" : MoneyFormat.inrFromCoins(d.today.capCoins, rate),
                icon: Icons.speed_rounded,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _StatTile(
                label: "Today's Earned",
                value: "${MoneyFormat.coins(d.today.earnedCoins)} coins",
                caption: "${MoneyFormat.inrFromCoins(d.today.earnedCoins, rate)} · ${MoneyFormat.coins(d.today.remainingCoins)} left",
                icon: Icons.monetization_on_rounded,
                iconColor: AppColor.coinGold,
              ),
            ),
          ],
        ),
        if (d.today.capReached) ...[
          const SizedBox(height: 12),
          const _Banner(
            icon: Icons.nightlight_round,
            color: AppColor.darkForestAccent,
            background: AppColor.secondaryMintGreen,
            text: "Daily Cap Reached! Earn more tomorrow.",
          ),
        ],
        if (locked) ...[
          const SizedBox(height: 12),
          _Banner(
            icon: Icons.gpp_bad_rounded,
            color: AppColor.notificationAccent,
            background: AppColor.notificationAccent.withValues(alpha: 0.08),
            text: lockText,
            actionLabel: "Check again",
            onAction: () => ref.read(securityServiceProvider.notifier).recheck(),
          ),
        ],
        const SizedBox(height: 12),
        _LifetimeCard(dashboard: d),
        const SizedBox(height: 12),
        _Checklist(today: d.today),
        if (d.milestone2.status != Milestone2Status.notTracked) ...[
          const SizedBox(height: 12),
          _Milestone2Card(milestone: d.milestone2),
        ],
        const SizedBox(height: 20),
        Row(
          children: [
            Expanded(
              child: SizedBox(
                height: 52,
                child: FilledButton.icon(
                  style: FilledButton.styleFrom(backgroundColor: AppColor.primaryColor, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
                  onPressed: () async {
                    final receipt = await showWithdrawalModal(context, dashboard: d);
                    if (receipt != null) ref.read(taskerDashboardProvider.notifier).refresh();
                  },
                  icon: const Icon(Icons.account_balance_wallet_rounded),
                  label: Text("Withdraw", style: GoogleFonts.urbanist(fontSize: 16, fontWeight: FontWeight.w800)),
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: SizedBox(
                height: 52,
                child: OutlinedButton.icon(
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppColor.darkForestAccent,
                    side: const BorderSide(color: AppColor.goldVipAccent, width: 2),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  onPressed: () => Get.to(() => const TaskerTierView()),
                  icon: const Icon(Icons.workspace_premium_rounded, color: Color(0xFFB8860B)),
                  label: Text("Starter Pass", style: GoogleFonts.urbanist(fontSize: 16, fontWeight: FontWeight.w800)),
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        TextButton.icon(
          onPressed: () => Get.to(() => const TaskLockGate(child: EarnRewardView())),
          icon: const Icon(Icons.play_circle_outline_rounded, color: AppColor.primaryColor),
          label: Text("Watch ads & do tasks", style: GoogleFonts.urbanist(color: AppColor.primaryColor, fontWeight: FontWeight.w800, fontSize: 15)),
        ),
      ],
    );
  }
}

class _HeaderCard extends StatelessWidget {
  const _HeaderCard({required this.dashboard, required this.rate});

  final TaskerDashboard dashboard;
  final int rate;

  @override
  Widget build(BuildContext context) {
    final d = dashboard;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: const LinearGradient(colors: [AppColor.darkForestAccent, AppColor.primaryColor], begin: Alignment.topLeft, end: Alignment.bottomRight),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(color: AppColor.goldVipAccent, borderRadius: BorderRadius.circular(20)),
                  child: Text("★ ${d.tier.badge}", style: GoogleFonts.urbanist(color: AppColor.primaryTextIcons, fontWeight: FontWeight.w900, fontSize: 12, letterSpacing: 0.4)),
                ),
                const SizedBox(height: 10),
                Text(d.tier.name, style: GoogleFonts.urbanist(color: AppColor.white, fontSize: 20, fontWeight: FontWeight.w800)),
                const SizedBox(height: 2),
                Text(
                  d.nextTier == null ? "Top level" : "Next: ${d.nextTier!.name}",
                  style: GoogleFonts.urbanist(color: AppColor.white.withValues(alpha: 0.8), fontSize: 13),
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.monetization_on_rounded, color: AppColor.coinGold, size: 22),
                  const SizedBox(width: 4),
                  Text(MoneyFormat.coins(d.wallet.coins), style: GoogleFonts.urbanist(color: AppColor.white, fontSize: 22, fontWeight: FontWeight.w900)),
                ],
              ),
              Text(MoneyFormat.inrFromCoins(d.wallet.coins, rate), style: GoogleFonts.urbanist(color: AppColor.white.withValues(alpha: 0.85), fontSize: 13, fontWeight: FontWeight.w700)),
              if (d.wallet.withdrawableInr > 0)
                Text("+ ${MoneyFormat.inr(d.wallet.withdrawableInr)} in wallet", style: GoogleFonts.urbanist(color: AppColor.white.withValues(alpha: 0.85), fontSize: 12)),
              if (d.wallet.pendingReferralCoins > 0)
                Text("${MoneyFormat.coins(d.wallet.pendingReferralCoins)} pending", style: GoogleFonts.urbanist(color: AppColor.coinGold, fontSize: 12, fontWeight: FontWeight.w700)),
            ],
          ),
        ],
      ),
    );
  }
}

class _StatTile extends StatelessWidget {
  const _StatTile({required this.label, required this.value, required this.caption, required this.icon, this.iconColor = AppColor.primaryColor});

  final String label;
  final String value;
  final String caption;
  final IconData icon;
  final Color iconColor;

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(color: AppColor.white, borderRadius: BorderRadius.circular(14), border: Border.all(color: AppColor.grey_200)),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(children: [
              Icon(icon, size: 18, color: iconColor),
              const SizedBox(width: 6),
              Flexible(child: Text(label, style: GoogleFonts.urbanist(fontSize: 13, fontWeight: FontWeight.w700, color: AppColor.greyColor))),
            ]),
            const SizedBox(height: 8),
            FittedBox(
              fit: BoxFit.scaleDown,
              alignment: Alignment.centerLeft,
              child: Text(value, style: GoogleFonts.urbanist(fontSize: 18, fontWeight: FontWeight.w900, color: AppColor.primaryTextIcons)),
            ),
            const SizedBox(height: 2),
            Text(caption, maxLines: 2, style: GoogleFonts.urbanist(fontSize: 12, color: AppColor.greyColor)),
          ],
        ),
      );
}

class _LifetimeCard extends StatelessWidget {
  const _LifetimeCard({required this.dashboard});

  final TaskerDashboard dashboard;

  @override
  Widget build(BuildContext context) {
    final d = dashboard;
    final pct = d.progressPercent;
    final target = d.nextTier?.watchHoursRequired;
    return _Card(
      title: "Lifetime Watch Hours",
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            target == null ? "${d.lifetimeWatchHours.toStringAsFixed(1)} hrs" : "${d.lifetimeWatchHours.toStringAsFixed(1)} / ${target.toStringAsFixed(0)} hrs",
            style: GoogleFonts.urbanist(fontSize: 22, fontWeight: FontWeight.w900, color: AppColor.primaryTextIcons),
          ),
          const SizedBox(height: 10),
          Semantics(
            label: "Progress to next level",
            value: "${pct.toStringAsFixed(0)} percent",
            child: ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: LinearProgressIndicator(value: pct / 100, minHeight: 10, backgroundColor: AppColor.secondaryMintGreen, color: AppColor.primaryColor),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            d.nextTier == null
                ? "You're on the top level."
                : "${pct.toStringAsFixed(pct < 10 ? 1 : 0)}% to ${d.nextTier!.name} — free at ${target!.toStringAsFixed(0)} hrs. Hours never reset when you level up.",
            style: GoogleFonts.urbanist(fontSize: 13, color: AppColor.greyColor, height: 1.35),
          ),
        ],
      ),
    );
  }
}

class _Checklist extends StatelessWidget {
  const _Checklist({required this.today});

  final TodayStats today;

  @override
  Widget build(BuildContext context) {
    final watchCaption = today.watchBonusClaimed ? "Bonus earned" : "+${MoneyFormat.coins(today.watchBonusCoins)} bonus";
    return _Card(
      title: "Daily Action Limits",
      child: Column(
        children: [
          _ChecklistRow(icon: Icons.ondemand_video_rounded, label: "Video Ads", quota: today.ads),
          _ChecklistRow(icon: Icons.thumb_up_alt_rounded, label: "Likes", quota: today.likes),
          _ChecklistRow(icon: Icons.chat_bubble_rounded, label: "Comments", quota: today.comments),
          _ChecklistRow(icon: Icons.timer_rounded, label: "Watch Time", quota: today.watch, unit: "min", caption: watchCaption),
        ],
      ),
    );
  }
}

class _ChecklistRow extends StatelessWidget {
  const _ChecklistRow({required this.icon, required this.label, required this.quota, this.unit = "", this.caption});

  final IconData icon;
  final String label;
  final Quota quota;
  final String unit;
  final String? caption;

  @override
  Widget build(BuildContext context) {
    final done = quota.complete;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 7),
      child: Row(
        children: [
          Icon(icon, size: 20, color: AppColor.primaryColor),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: GoogleFonts.urbanist(fontSize: 15, fontWeight: FontWeight.w700, color: AppColor.primaryTextIcons)),
                if (caption != null) Text(caption!, style: GoogleFonts.urbanist(fontSize: 12, color: AppColor.greyColor)),
                const SizedBox(height: 4),
                ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: LinearProgressIndicator(value: quota.fraction, minHeight: 5, backgroundColor: AppColor.secondaryMintGreen, color: AppColor.primaryColor),
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          Text("${quota.done}/${quota.limit}${unit.isEmpty ? "" : " $unit"}",
              style: GoogleFonts.urbanist(fontSize: 14, fontWeight: FontWeight.w800, color: done ? AppColor.primaryColor : AppColor.primaryTextIcons)),
          const SizedBox(width: 6),
          Icon(done ? Icons.check_circle_rounded : Icons.radio_button_unchecked_rounded, size: 20, color: done ? AppColor.primaryColor : AppColor.grey),
        ],
      ),
    );
  }
}

class _Milestone2Card extends StatelessWidget {
  const _Milestone2Card({required this.milestone});

  final Milestone2 milestone;

  @override
  Widget build(BuildContext context) {
    final m = milestone;
    final left = m.timeLeft(DateTime.now());
    final String status;
    switch (m.status) {
      case Milestone2Status.achieved:
        status = "Completed — thanks for watching! Your partner has been rewarded.";
      case Milestone2Status.expired:
        status = "The 7-day window has ended.";
      case Milestone2Status.underReview:
        status = "Under review.";
      case Milestone2Status.inProgress:
      case Milestone2Status.notTracked:
        status = left == null ? "Keep watching to complete it." : "${left.inDays}d ${left.inHours.remainder(24)}h left";
    }
    return _Card(
      title: "Partner Milestone",
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text("Watch ${m.targetMinutes} minutes within 7 days of joining", style: GoogleFonts.urbanist(fontSize: 14, color: AppColor.primaryTextIcons)),
          const SizedBox(height: 8),
          ClipRRect(
            borderRadius: BorderRadius.circular(6),
            child: LinearProgressIndicator(value: m.fraction, minHeight: 8, backgroundColor: AppColor.secondaryMintGreen, color: AppColor.primaryColor),
          ),
          const SizedBox(height: 6),
          Text("${m.watchMinutes.clamp(0, m.targetMinutes)} / ${m.targetMinutes} min · $status", style: GoogleFonts.urbanist(fontSize: 12.5, color: AppColor.greyColor)),
        ],
      ),
    );
  }
}

class _Card extends StatelessWidget {
  const _Card({required this.title, required this.child});

  final String title;
  final Widget child;

  @override
  Widget build(BuildContext context) => Container(
        width: double.infinity,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(color: AppColor.white, borderRadius: BorderRadius.circular(14), border: Border.all(color: AppColor.grey_200)),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: GoogleFonts.urbanist(fontSize: 16, fontWeight: FontWeight.w800, color: AppColor.darkForestAccent)),
            const SizedBox(height: 10),
            child,
          ],
        ),
      );
}

class _Banner extends StatelessWidget {
  const _Banner({required this.icon, required this.color, required this.background, required this.text, this.actionLabel, this.onAction});

  final IconData icon;
  final Color color;
  final Color background;
  final String text;
  final String? actionLabel;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) => Semantics(
        liveRegion: true,
        child: Container(
          padding: const EdgeInsets.fromLTRB(14, 10, 8, 10),
          decoration: BoxDecoration(color: background, borderRadius: BorderRadius.circular(12)),
          child: Row(
            children: [
              Icon(icon, color: color),
              const SizedBox(width: 10),
              Expanded(child: Text(text, style: GoogleFonts.urbanist(fontSize: 14, fontWeight: FontWeight.w700, color: color))),
              if (actionLabel != null)
                TextButton(onPressed: onAction, child: Text(actionLabel!, style: GoogleFonts.urbanist(fontWeight: FontWeight.w800, color: color))),
            ],
          ),
        ),
      );
}

class _ErrorState extends StatelessWidget {
  const _ErrorState({required this.error, required this.onRetry});

  final Object error;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    final api = error is ApiException ? error as ApiException : null;
    final needsSignIn = api?.isAuthError ?? false;
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(needsSignIn ? Icons.lock_person_rounded : Icons.cloud_off_rounded, size: 44, color: AppColor.greyColor),
            const SizedBox(height: 12),
            Text(
              needsSignIn ? "Please sign in again to see your earnings." : (api?.message ?? "Couldn't load your dashboard."),
              textAlign: TextAlign.center,
              style: GoogleFonts.urbanist(fontSize: 16, color: AppColor.primaryTextIcons),
            ),
            const SizedBox(height: 16),
            FilledButton(
              style: FilledButton.styleFrom(backgroundColor: AppColor.primaryColor),
              onPressed: needsSignIn ? Database.logOut : onRetry,
              child: Text(needsSignIn ? "Sign in" : "Try again"),
            ),
          ],
        ),
      ),
    );
  }
}
