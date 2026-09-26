import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/core/security/domain/security_signals.dart';
import 'package:youpeak/core/security/security_service.dart';
import 'package:youpeak/core/theme/app_color.dart';

/// Wraps a Tasker screen: shows it while tasks are allowed, and a full alert
/// screen instead while the device is locked (VPN, emulator, root, second
/// account on this phone, bot-like activity).
class TaskLockGate extends ConsumerWidget {
  const TaskLockGate({super.key, required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final security = ref.watch(securityServiceProvider);
    if (!security.isLocked) return child;
    return TaskLockedView(state: security, onRetry: () => ref.read(securityServiceProvider.notifier).recheck());
  }
}

class TaskLockedView extends StatelessWidget {
  const TaskLockedView({super.key, required this.state, required this.onRetry});

  final TaskSecurityState state;
  final VoidCallback onRetry;

  IconData get _icon {
    final r = state.reasons.isEmpty ? "" : state.reasons.first;
    if (r == LockReason.vpn || r == LockReason.proxy || r == LockReason.datacenterIp) return Icons.vpn_lock_rounded;
    if (r == LockReason.deviceLinked) return Icons.phonelink_lock_rounded;
    if (r == LockReason.botActivity) return Icons.front_hand_rounded;
    return Icons.gpp_bad_rounded;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColor.white,
      appBar: AppBar(backgroundColor: AppColor.white, elevation: 0, foregroundColor: AppColor.primaryTextIcons),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(color: AppColor.notificationAccent.withValues(alpha: 0.08), shape: BoxShape.circle),
                child: Icon(_icon, size: 48, color: AppColor.notificationAccent),
              ),
              const SizedBox(height: 20),
              Text("Tasks paused", style: GoogleFonts.urbanist(fontSize: 22, fontWeight: FontWeight.w800, color: AppColor.primaryTextIcons)),
              const SizedBox(height: 10),
              Text(
                state.message,
                textAlign: TextAlign.center,
                style: GoogleFonts.urbanist(fontSize: 16, height: 1.4, color: AppColor.primaryTextIcons),
              ),
              if (state.reasons.length > 1) ...[
                const SizedBox(height: 12),
                for (final reason in state.reasons.skip(1))
                  Padding(
                    padding: const EdgeInsets.only(top: 4),
                    child: Text(lockMessage([reason]), textAlign: TextAlign.center, style: GoogleFonts.urbanist(fontSize: 13, color: AppColor.greyColor)),
                  ),
              ],
              const SizedBox(height: 8),
              Text(
                "You can still watch and subscribe. Earning resumes once this is fixed.",
                textAlign: TextAlign.center,
                style: GoogleFonts.urbanist(fontSize: 13, color: AppColor.greyColor),
              ),
              const SizedBox(height: 28),
              SizedBox(
                width: double.infinity,
                height: 48,
                child: FilledButton(
                  style: FilledButton.styleFrom(backgroundColor: AppColor.primaryColor, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
                  onPressed: onRetry,
                  child: Text("Check again", style: GoogleFonts.urbanist(fontSize: 16, fontWeight: FontWeight.w700)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
