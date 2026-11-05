import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:youpeak/core/assets/app_icons.dart';
import 'package:youpeak/core/assets/app_visuals.dart';
import 'package:youpeak/core/constants/app_string.dart';
import 'package:youpeak/core/platform/app_layout.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:youpeak/core/utils/custom_get_current_week_date.dart';
import 'package:youpeak/features/coins/view/convert_coin_view.dart';
import 'package:youpeak/features/monetization/view/content_engagement_view.dart';
import 'package:youpeak/features/referral/view/referral_program_view.dart';
import 'package:youpeak/features/rewards/controller/earn_reward_controller.dart';
import 'package:youpeak/features/tasker/presentation/tasker_dashboard_view.dart';
import 'package:youpeak/features/tiers/view/tasker_tier_view.dart';
import 'package:youpeak/features/wallet/view/my_wallet_view.dart';
import 'package:youpeak/main.dart';

// Earn Rewards on a desktop browser window: the balance in a banner, the
// week's check-in beside the ways to earn more, at readable sizes. (The
// phone layout — header artwork, absolute positions — stays as it is.)
class EarnRewardWide extends StatelessWidget {
  const EarnRewardWide({super.key, required this.controller});

  final EarnRewardController controller;

  static final _exact = NumberFormat.decimalPattern("en_IN");

  @override
  Widget build(BuildContext context) {
    final dark = isDarkMode.value;
    return Scaffold(
      body: RefreshIndicator(
        color: AppColor.primaryColor,
        onRefresh: () => controller.init(),
        child: ListView(
          controller: controller.scrollController,
          padding: EdgeInsets.fromLTRB(MediaQuery.sizeOf(context).width < 600 ? 14 : 28, 24, MediaQuery.sizeOf(context).width < 600 ? 14 : 28, 40),
          children: [
            Row(
              children: [
                if (!AppLayout.isWideWeb) IconButton(tooltip: "Back", icon: const Icon(Icons.arrow_back_rounded), onPressed: () => Get.back()),
                Expanded(child: Text(AppStrings.earnRewards.tr, maxLines: 1, overflow: TextOverflow.ellipsis, style: GoogleFonts.urbanist(fontSize: 26, fontWeight: FontWeight.w800))),
                OutlinedButton.icon(
                  onPressed: () => Get.to(const ConvertCoinView()),
                  icon: Image.asset(AppIcons.convertIcon, width: 20),
                  label: const Text("Convert coins"),
                ),
              ],
            ),
            const SizedBox(height: 16),
            _BalanceBanner(controller: controller, format: _exact),
            const SizedBox(height: 20),
            LayoutBuilder(builder: (context, box) {
              final two = box.maxWidth >= 860;
              final checkIn = _CheckInCard(controller: controller, dark: dark);
              final more = Column(children: [_EarnMoreCard(dark: dark), const SizedBox(height: 20), _DailyTasksCard(controller: controller, dark: dark)]);
              if (!two) return Column(children: [checkIn, const SizedBox(height: 20), more]);
              return Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(flex: 11, child: checkIn),
                  const SizedBox(width: 20),
                  Expanded(flex: 10, child: more),
                ],
              );
            }),
          ],
        ),
      ),
    );
  }
}

BoxDecoration _card(bool dark) => BoxDecoration(
      color: dark ? AppColor.mainDark : AppColor.white,
      borderRadius: BorderRadius.circular(20),
      border: Border.all(color: AppColor.primaryColor.withValues(alpha: 0.25), width: 1.2),
    );

class _BalanceBanner extends StatelessWidget {
  const _BalanceBanner({required this.controller, required this.format});

  final EarnRewardController controller;
  final NumberFormat format;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.symmetric(horizontal: MediaQuery.sizeOf(context).width < 600 ? 16 : 28, vertical: 22),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(22),
        gradient: const LinearGradient(colors: [Color(0xFF0F3B20), Color(0xFF0A7A44), Color(0xFF129B57)]),
      ),
      child: Row(
        children: [
          Image.asset(AppIcons.giftImage, height: MediaQuery.sizeOf(context).width < 600 ? 64 : 96, fit: BoxFit.contain),
          SizedBox(width: MediaQuery.sizeOf(context).width < 600 ? 12 : 24),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(AppStrings.myRewardCoin.tr, style: GoogleFonts.urbanist(fontSize: 16, color: Colors.white70, fontWeight: FontWeight.w600)),
                const SizedBox(height: 4),
                Row(
                  children: [
                    Image.asset(AppIcons.coin, width: 34),
                    const SizedBox(width: 10),
                    // Exact balance (the phone view abbreviates, e.g. 1.49k).
                    Obx(() => Text(format.format(controller.myRewardCoin.value),
                        style: GoogleFonts.urbanist(fontSize: 40, color: Colors.white, fontWeight: FontWeight.w800))),
                  ],
                ),
                const SizedBox(height: 4),
                Text("Your spendable coin balance. 100 coins = ₹1.", style: GoogleFonts.urbanist(fontSize: 14, color: Colors.white70)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _CheckInCard extends StatelessWidget {
  const _CheckInCard({required this.controller, required this.dark});

  final EarnRewardController controller;
  final bool dark;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(22),
      decoration: _card(dark),
      child: GetBuilder<EarnRewardController>(
        id: "onGetDailyRewards",
        builder: (controller) => Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Image.asset(AppVisuals.streak, width: 28, height: 28),
                const SizedBox(width: 10),
                Expanded(
                  child: Text("Daily check-in", style: GoogleFonts.urbanist(fontSize: 20, fontWeight: FontWeight.w800)),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(color: AppColor.primaryColor.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(20)),
                  child: Text("${controller.getDailyRewardModel?.streak ?? 0}-day streak",
                      style: GoogleFonts.urbanist(fontSize: 14, fontWeight: FontWeight.w700, color: AppColor.primaryColor)),
                ),
              ],
            ),
            const SizedBox(height: 6),
            Text("Check in once a day (India time). The reward depends on the weekday.",
                style: GoogleFonts.urbanist(fontSize: 14, color: Colors.grey)),
            const SizedBox(height: 16),
            LayoutBuilder(builder: (context, box) {
              // Narrow screens: a scrollable strip of fixed-size days.
              if (box.maxWidth < 520) {
                return SizedBox(
                  height: 104,
                  child: ListView.separated(
                    scrollDirection: Axis.horizontal,
                    itemCount: controller.dailyRewards.length,
                    separatorBuilder: (_, __) => const SizedBox(width: 8),
                    itemBuilder: (_, i) => SizedBox(width: 68, child: _DayTile(controller: controller, index: i, dark: dark)),
                  ),
                );
              }
              return Row(
                children: [
                  for (int i = 0; i < controller.dailyRewards.length; i++) ...[
                    if (i > 0) const SizedBox(width: 8),
                    Expanded(child: _DayTile(controller: controller, index: i, dark: dark)),
                  ],
                ],
              );
            }),
            const SizedBox(height: 18),
            SizedBox(
              width: double.infinity,
              height: 52,
              child: FilledButton.icon(
                style: FilledButton.styleFrom(
                  backgroundColor: AppColor.primaryColor,
                  disabledBackgroundColor: dark ? Colors.white12 : const Color(0xFFE3E7E5),
                  shape: const StadiumBorder(),
                ),
                onPressed: controller.isTodayCheckIn ? null : () => controller.onCheckIn(context),
                icon: Image.asset(AppVisuals.checkIn, width: 24, height: 24),
                label: Text(controller.isTodayCheckIn ? "Checked in today — come back tomorrow" : "${AppStrings.checkIn.tr} · +${controller.todayCoin} coins",
                    style: GoogleFonts.urbanist(fontSize: 16, fontWeight: FontWeight.w700)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _DayTile extends StatelessWidget {
  const _DayTile({required this.controller, required this.index, required this.dark});

  final EarnRewardController controller;
  final int index;
  final bool dark;

  @override
  Widget build(BuildContext context) {
    final d = controller.dailyRewards[index];
    final today = controller.isTodayIndex(index);
    final past = controller.isPastIndex(index);
    final done = d.isCheckIn == true;
    final missed = past && !done;
    final bg = missed
        ? AppColor.lightRed
        : done
            ? AppColor.lightGreen
            : today
                ? AppColor.primaryColor
                : (dark ? Colors.white10 : const Color(0xFFF1F3F2));
    final fg = today && !done ? Colors.white : (dark ? Colors.white : const Color(0xFF2B2B2B));
    final date = d.date != null ? DateTime.tryParse(d.date!) : CustomGetCurrentWeekDate.onGet()[index];
    final weekday = date == null ? "" : DateFormat("EEE").format(date);
    return Tooltip(
      message: missed ? "Missed" : done ? "Checked in" : today ? "Today" : "Upcoming",
      child: Container(
        height: 104,
        decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(14)),
        padding: const EdgeInsets.symmetric(vertical: 10),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(today ? AppStrings.today.tr : weekday, style: GoogleFonts.urbanist(fontSize: 14, fontWeight: FontWeight.w800, color: fg)),
            missed
                ? const Icon(Icons.close_rounded, color: Color(0xFFB3261E), size: 26)
                : done
                    ? const Icon(Icons.check_circle_rounded, color: Color(0xFF1B7F45), size: 26)
                    : Image.asset(today ? AppIcons.coinIcon : AppIcons.coinIconGrey, height: 26),
            Text(missed ? "Missed" : "+${d.reward ?? 0}", style: GoogleFonts.urbanist(fontSize: 14, fontWeight: FontWeight.w700, color: fg)),
          ],
        ),
      ),
    );
  }
}

class _EarnMoreCard extends StatelessWidget {
  const _EarnMoreCard({required this.dark});

  final bool dark;

  @override
  Widget build(BuildContext context) {
    final items = <(String, String, String, VoidCallback)>[
      (AppIcons.referralIcon, AppStrings.referralReward.tr, "Invite friends and earn when they join.", () => Get.to(const ReferralProgramView())),
      (AppIcons.engagementIcon, AppStrings.engagementRewards.tr, "Likes, comments and watch time you earned today.", () => Get.to(const ContentEngagementView())),
      (AppIcons.king, AppStrings.starterPass.tr, "Raise your daily limits and earning cap.", () => Get.to(const TaskerTierView())),
      (AppVisuals.dailyTasks, "Tasker dashboard", "Today's cap, earned coins and lifetime watch hours.", () => Get.to(() => const TaskerDashboardView())),
      (AppIcons.coin, "Withdraw", "Your wallet and withdrawals.", () => Get.to(() => const MyWalletView())),
    ];
    return Container(
      decoration: _card(dark),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(22, 20, 22, 8),
            child: Text(AppStrings.earnMore.tr, style: GoogleFonts.urbanist(fontSize: 20, fontWeight: FontWeight.w800)),
          ),
          for (final it in items)
            ListTile(
              contentPadding: const EdgeInsets.symmetric(horizontal: 22, vertical: 2),
              leading: CircleAvatar(radius: 22, backgroundColor: AppColor.primaryColor.withValues(alpha: 0.1), child: Image.asset(it.$1, width: 24)),
              title: Text(it.$2, style: GoogleFonts.urbanist(fontSize: 16, fontWeight: FontWeight.w700)),
              subtitle: Text(it.$3, style: GoogleFonts.urbanist(fontSize: 13, color: Colors.grey)),
              trailing: const Icon(Icons.chevron_right_rounded),
              onTap: it.$4,
            ),
          const SizedBox(height: 8),
        ],
      ),
    );
  }
}

class _DailyTasksCard extends StatelessWidget {
  const _DailyTasksCard({required this.controller, required this.dark});

  final EarnRewardController controller;
  final bool dark;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(22),
      decoration: _card(dark),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [
            Image.asset(AppVisuals.dailyTasks, width: 28, height: 28),
            const SizedBox(width: 10),
            Text(AppStrings.myDailyTasks.tr, style: GoogleFonts.urbanist(fontSize: 20, fontWeight: FontWeight.w800)),
          ]),
          const SizedBox(height: 10),
          if (!EarnRewardController.adsAvailable)
            Text(
              "Rewarded video ads are available in the YouPeak mobile app only (a browser can't verify a completed ad). "
              "Check-in, likes, comments and watch time earn here.",
              style: GoogleFonts.urbanist(fontSize: 14, height: 1.45, color: dark ? Colors.white70 : const Color(0xFF555555)),
            )
          else
            GetBuilder<EarnRewardController>(
              id: "onGetAdRewards",
              builder: (controller) => Column(
                children: [
                  for (int i = 0; i < controller.adRewards.length; i++)
                    ListTile(
                      contentPadding: EdgeInsets.zero,
                      leading: Image.asset(AppIcons.adIcon, width: 28),
                      title: Text(controller.adRewards[i].adLabel ?? "", style: GoogleFonts.urbanist(fontSize: 15, fontWeight: FontWeight.w700)),
                      subtitle: Text("+${controller.adRewards[i].coinEarnedFromAd ?? 0} coins", style: GoogleFonts.urbanist(fontSize: 13)),
                      trailing: FilledButton(
                        onPressed: i == controller.completeAdTask && controller.isEnableCurrentAdTask ? () => controller.onClickPlay(i) : null,
                        child: Text(i < controller.completeAdTask ? AppStrings.earned.tr : AppStrings.play.tr),
                      ),
                    ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}
