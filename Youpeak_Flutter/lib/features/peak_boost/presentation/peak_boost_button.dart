import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/core/security/presentation/task_lock_gate.dart';
import 'package:youpeak/core/system_config/presentation/system_configs_provider.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:youpeak/features/peak_boost/presentation/boost_toast.dart';
import 'package:youpeak/features/peak_boost/presentation/peak_boost_bottom_sheet.dart';
import 'package:youpeak/features/rewards/view/earn_reward_view.dart';

/// "Peak Boost" pill for the video player's action bar (#4F46E5 → #7C3AED).
/// Hidden when an admin turns Peak Boost off, and on the viewer's own video.
class PeakBoostButton extends ConsumerWidget {
  const PeakBoostButton({super.key, required this.videoId, this.creatorName, this.isOwnVideo = false});

  final String videoId;
  final String? creatorName;
  final bool isOwnVideo;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final enabled = ref.watch(systemConfigsProvider.select((c) => c.peakBoost.enabled));
    if (!enabled || isOwnVideo || videoId.isEmpty) return const SizedBox.shrink();

    return Semantics(
      button: true,
      label: "Peak Boost this creator",
      child: ConstrainedBox(
        constraints: const BoxConstraints(minHeight: 44, minWidth: 44),
        child: DecoratedBox(
          decoration: BoxDecoration(gradient: AppColor.peakBoostGradient, borderRadius: BorderRadius.circular(22)),
          child: Material(
            color: Colors.transparent,
            child: InkWell(
              borderRadius: BorderRadius.circular(22),
              onTap: () async {
                final receipt = await showPeakBoostSheet(
                  context,
                  videoId: videoId,
                  creatorName: creatorName,
                  onGetCoins: () => Get.to(() => const TaskLockGate(child: EarnRewardView())),
                );
                if (receipt != null && context.mounted) showBoostToast(context, receipt.toastText);
              },
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.rocket_launch_rounded, size: 18, color: AppColor.white),
                    const SizedBox(width: 6),
                    Text("Peak Boost", style: GoogleFonts.urbanist(color: AppColor.white, fontSize: 13, fontWeight: FontWeight.w800)),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
