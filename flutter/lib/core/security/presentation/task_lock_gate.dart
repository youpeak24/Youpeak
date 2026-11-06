import 'package:youpeak/shared/widgets/app_icon.dart';
import 'package:youpeak/core/assets/app_icons.dart';
import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/core/security/domain/security_signals.dart';
import 'package:youpeak/core/security/security_service.dart';
import 'package:youpeak/core/theme/app_color.dart';

/// Wraps a Tasker screen: shows it while tasks are allowed, and a full alert
/// screen instead while earning is locked (VPN, emulator, root, second
/// account on this phone, bot-like activity, web earning switched off).
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
  final Future<void> Function() onRetry;

  Widget get _glyph {
    final r = state.reasons.isEmpty ? "" : state.reasons.first;
    const color = AppColor.notificationAccent;
    if (r == LockReason.vpn || r == LockReason.proxy || r == LockReason.datacenterIp) {
      return const AppIcon(AppIcons.extraVpnRestriction, size: 48, color: color);
    }
    if (r == LockReason.deviceLinked) return const AppIcon(AppIcons.extraDeviceSecurity, size: 48, color: color);
    if (r == LockReason.botActivity) return const Icon(Icons.front_hand_rounded, size: 48, color: color);
    if (r == LockReason.webPlatform) return const Icon(Icons.phone_iphone_rounded, size: 48, color: color);
    if (r == LockReason.attestationRequired) return const AppIcon(AppIcons.extraPending, size: 48, color: color);
    return const AppIcon(AppIcons.extraAccessRestricted, size: 48, color: color);
  }

  @override
  Widget build(BuildContext context) {
    final resumesAt = state.resumesAt;
    final canRetry = lockCanRetry(state.reasons);
    return Scaffold(
      appBar: AppBar(
        elevation: 0,
        title: Text("Earn Rewards", style: GoogleFonts.urbanist(fontWeight: FontWeight.w800)),
      ),
      body: SafeArea(
        child: Center(
          // Scrolls on short windows instead of overflowing; a readable
          // card width on a desktop instead of stretching across it.
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 520),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(color: AppColor.notificationAccent.withValues(alpha: 0.08), shape: BoxShape.circle),
                    child: _glyph,
                  ),
                  const SizedBox(height: 20),
                  Semantics(
                    header: true,
                    child: Text("Earning paused", style: GoogleFonts.urbanist(fontSize: 22, fontWeight: FontWeight.w800)),
                  ),
                  const SizedBox(height: 16),
                  for (final reason in state.reasons) _ReasonRow(reason: reason),
                  if (resumesAt != null) ...[
                    const SizedBox(height: 4),
                    Text(
                      "Earning resumes at ${TimeOfDay.fromDateTime(resumesAt).format(context)}.",
                      textAlign: TextAlign.center,
                      style: GoogleFonts.urbanist(fontSize: 14, fontWeight: FontWeight.w700),
                    ),
                  ],
                  const SizedBox(height: 12),
                  Text(
                    "You can still watch, like, comment and subscribe while earning is paused.",
                    textAlign: TextAlign.center,
                    style: GoogleFonts.urbanist(fontSize: 13, color: AppColor.greyColor),
                  ),
                  const SizedBox(height: 28),
                  if (canRetry)
                    LockRetryButton(onRetry: onRetry)
                  else
                    SizedBox(
                      width: double.infinity,
                      height: 48,
                      child: OutlinedButton(
                        style: OutlinedButton.styleFrom(
                          foregroundColor: AppColor.primaryColor,
                          side: const BorderSide(color: AppColor.primaryColor),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        onPressed: () => Navigator.of(context).maybePop(),
                        child: Text("Go back", style: GoogleFonts.urbanist(fontSize: 16, fontWeight: FontWeight.w700)),
                      ),
                    ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _ReasonRow extends StatelessWidget {
  const _ReasonRow({required this.reason});

  final String reason;

  @override
  Widget build(BuildContext context) {
    final hint = lockHint(reason);
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Column(
        children: [
          Text(
            lockMessage([reason]),
            textAlign: TextAlign.center,
            style: GoogleFonts.urbanist(fontSize: 16, height: 1.4, fontWeight: FontWeight.w600),
          ),
          if (hint != null) ...[
            const SizedBox(height: 4),
            Text(hint, textAlign: TextAlign.center, style: GoogleFonts.urbanist(fontSize: 13, height: 1.35, color: AppColor.greyColor)),
          ],
        ],
      ),
    );
  }
}

/// "Check again" that can't be hammered: it shows the check in progress,
/// and if the lock is still there afterwards it says so and rests for
/// [cooldown] before it can be pressed again. (The service also re-checks
/// on its own every minute while locked.)
class LockRetryButton extends StatefulWidget {
  const LockRetryButton({super.key, required this.onRetry, this.compact = false, this.color = AppColor.primaryColor});

  final Future<void> Function() onRetry;

  /// Text button for a banner instead of the full-width button.
  final bool compact;
  final Color color;

  static const cooldown = Duration(seconds: 15);

  @override
  State<LockRetryButton> createState() => _LockRetryButtonState();
}

class _LockRetryButtonState extends State<LockRetryButton> {
  bool _checking = false;
  int _restSeconds = 0;
  Timer? _tick;

  Future<void> _run() async {
    setState(() => _checking = true);
    try {
      await widget.onRetry();
    } catch (_) {
      // The service already falls back to a safe state; the button only
      // needs to come back.
    }
    if (!mounted) return;
    setState(() {
      _checking = false;
      _restSeconds = LockRetryButton.cooldown.inSeconds;
    });
    _tick?.cancel();
    _tick = Timer.periodic(const Duration(seconds: 1), (t) {
      if (!mounted) return t.cancel();
      setState(() => _restSeconds--);
      if (_restSeconds <= 0) t.cancel();
    });
  }

  @override
  void dispose() {
    _tick?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final rest = _restSeconds;
    final enabled = !_checking && rest == 0;
    final label = _checking
        ? "Checking…"
        : rest > 0
            ? "Still paused · retry in ${rest}s"
            : "Check again";
    final spinner = SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: widget.compact ? widget.color : AppColor.white));

    if (widget.compact) {
      return TextButton(
        onPressed: enabled ? _run : null,
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (_checking) ...[spinner, const SizedBox(width: 6)],
            Text(label, style: GoogleFonts.urbanist(fontWeight: FontWeight.w800, color: enabled ? widget.color : AppColor.greyColor)),
          ],
        ),
      );
    }
    return SizedBox(
      width: double.infinity,
      height: 48,
      child: FilledButton(
        style: FilledButton.styleFrom(
          backgroundColor: widget.color,
          disabledBackgroundColor: widget.color.withValues(alpha: 0.35),
          disabledForegroundColor: AppColor.white,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
        onPressed: enabled ? _run : null,
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (_checking) ...[spinner, const SizedBox(width: 10)],
            Text(label, style: GoogleFonts.urbanist(fontSize: 16, fontWeight: FontWeight.w700)),
          ],
        ),
      ),
    );
  }
}
