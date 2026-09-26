import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/core/assets/app_icons.dart';
import 'package:youpeak/core/membership/membership_portal.dart';
import 'package:youpeak/core/storage/database/database.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:youpeak/core/utils/custom_toast.dart';
import 'package:youpeak/features/main/view/main_home_view.dart';
import 'package:youpeak/features/profile/api/get_profile_api.dart';

/// Shown instead of the app while the account owes an activation payment
/// (a membership picked on the web portal, or a joining fee). Payment happens
/// only on the web portal — never inside the app.
class ActivationLockView extends StatefulWidget {
  const ActivationLockView({super.key, required this.activationUrl, this.reason});

  final String activationUrl;
  final String? reason;

  @override
  State<ActivationLockView> createState() => _ActivationLockViewState();
}

class _ActivationLockViewState extends State<ActivationLockView> {
  bool _checking = false;

  String get _host => Uri.tryParse(widget.activationUrl)?.host ?? "youpeak.in";

  Future<void> _checkAgain() async {
    final userId = Database.loginUserId;
    if (userId == null || _checking) return;
    setState(() => _checking = true);
    await GetProfileApi.callApi(userId);
    if (!mounted) return;
    setState(() => _checking = false);
    final gate = GetProfileApi.accessGate;
    if (gate == null || gate["locked"] != true) {
      Get.offAll(() => const MainHomePageView());
    } else {
      CustomToast.show("We haven't received your payment yet. It can take a few minutes after paying.");
    }
  }

  @override
  Widget build(BuildContext context) {
    final pendingMembership = widget.reason == "MEMBERSHIP_PAYMENT_PENDING";
    return PopScope(
      canPop: false,
      child: Scaffold(
        backgroundColor: AppColor.white,
        body: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: Column(
              children: [
                const Spacer(),
                ClipRRect(
                  borderRadius: BorderRadius.circular(20),
                  child: Image.asset(AppIcons.appLogo, width: 72, height: 72),
                ),
                const SizedBox(height: 24),
                Text(
                  "Activate your account",
                  textAlign: TextAlign.center,
                  style: GoogleFonts.urbanist(fontSize: 24, fontWeight: FontWeight.w800, color: AppColor.primaryTextIcons),
                ),
                const SizedBox(height: 12),
                Text(
                  pendingMembership
                      ? "Your membership is waiting for payment. Complete it on $_host, then come back here."
                      : "Complete your one-time account activation on $_host to start watching and earning.",
                  textAlign: TextAlign.center,
                  style: GoogleFonts.urbanist(fontSize: 16, height: 1.4, color: AppColor.primaryTextIcons),
                ),
                const SizedBox(height: 8),
                Text(
                  "Payments are handled securely on our website, not in the app.",
                  textAlign: TextAlign.center,
                  style: GoogleFonts.urbanist(fontSize: 13, color: AppColor.greyColor),
                ),
                const Spacer(),
                SizedBox(
                  width: double.infinity,
                  height: 52,
                  child: FilledButton.icon(
                    style: FilledButton.styleFrom(backgroundColor: AppColor.primaryColor, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
                    onPressed: () => MembershipPortal.open(overrideBaseUrl: widget.activationUrl),
                    icon: const Icon(Icons.open_in_new_rounded),
                    label: Text("Activate on $_host", style: GoogleFonts.urbanist(fontSize: 16, fontWeight: FontWeight.w700)),
                  ),
                ),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: OutlinedButton(
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppColor.primaryColor,
                      side: const BorderSide(color: AppColor.primaryColor),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    onPressed: _checking ? null : _checkAgain,
                    child: _checking
                        ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                        : Text("I've paid — check again", style: GoogleFonts.urbanist(fontSize: 15, fontWeight: FontWeight.w700)),
                  ),
                ),
                TextButton(
                  onPressed: Database.logOut, // returns to the sign-in screen
                  child: Text("Use a different account", style: GoogleFonts.urbanist(color: AppColor.greyColor, fontWeight: FontWeight.w600)),
                ),
                const SizedBox(height: 8),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
