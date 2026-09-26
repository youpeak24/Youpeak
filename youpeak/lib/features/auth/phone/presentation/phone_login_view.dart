import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/core/assets/app_icons.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:youpeak/features/auth/phone/data/phone_auth_service.dart';
import 'package:youpeak/features/auth/phone/data/phone_login_repository.dart';
import 'package:youpeak/features/auth/service/post_login_router.dart';

/// Sign in with a mobile number (Firebase Phone OTP).
class PhoneLoginView extends ConsumerStatefulWidget {
  const PhoneLoginView({super.key});

  /// "+91 98765 43210" / "9876543210" -> "+919876543210"; null if invalid.
  static String? toE164(String countryCode, String number) {
    final cc = countryCode.replaceAll(RegExp(r"[^0-9]"), "");
    final digits = number.replaceAll(RegExp(r"[^0-9]"), "");
    if (cc.isEmpty || digits.length < 6 || digits.length > 14) return null;
    if (cc == "91" && digits.length != 10) return null;
    return "+$cc$digits";
  }

  @override
  ConsumerState<PhoneLoginView> createState() => _PhoneLoginViewState();
}

class _PhoneLoginViewState extends ConsumerState<PhoneLoginView> {
  static const _resendSeconds = 30;

  final _countryCode = TextEditingController(text: "91");
  final _phone = TextEditingController();
  final _code = TextEditingController();
  PhoneVerification? _verification;
  String? _e164;
  String? _error;
  bool _busy = false;
  int _resendIn = 0;
  Timer? _resendTimer;

  @override
  void dispose() {
    _resendTimer?.cancel();
    _countryCode.dispose();
    _phone.dispose();
    _code.dispose();
    super.dispose();
  }

  void _startResendTimer() {
    _resendTimer?.cancel();
    setState(() => _resendIn = _resendSeconds);
    _resendTimer = Timer.periodic(const Duration(seconds: 1), (t) {
      if (!mounted) return t.cancel();
      setState(() => _resendIn--);
      if (_resendIn <= 0) t.cancel();
    });
  }

  Future<void> _send({bool resend = false}) async {
    final e164 = PhoneLoginView.toE164(_countryCode.text, _phone.text);
    if (e164 == null) {
      setState(() => _error = "Enter a valid mobile number.");
      return;
    }
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      final v = await ref.read(phoneAuthServiceProvider).sendCode(
            e164,
            resendToken: resend ? _verification?.resendToken : null,
            onAutoVerified: _finish,
          );
      if (!mounted) return;
      if (v.autoIdToken != null) return _finish(v.autoIdToken!);
      setState(() {
        _verification = v;
        _e164 = e164;
        _code.clear();
      });
      _startResendTimer();
    } on PhoneAuthError catch (e) {
      if (mounted) setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _verify() async {
    final v = _verification;
    if (v == null || _code.text.length != 6 || _busy) return;
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      final idToken = await ref.read(phoneAuthServiceProvider).confirm(v, _code.text);
      await _finish(idToken);
    } on PhoneAuthError catch (e) {
      if (mounted) setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _finish(String idToken) async {
    if (!mounted) return;
    setState(() => _busy = true);
    try {
      final model = await ref.read(phoneLoginRepositoryProvider).login(idToken);
      TextInput.finishAutofillContext();
      await PostLoginRouter.go(userId: model.user!.id!, isSignUp: model.signUp == true);
    } on PhoneAuthError catch (e) {
      if (mounted) setState(() => _error = e.message);
    } catch (_) {
      if (mounted) setState(() => _error = "Couldn't reach YouPeak. Check your connection and try again.");
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final codeStep = _verification != null;
    return Scaffold(
      backgroundColor: AppColor.white,
      appBar: AppBar(
        backgroundColor: AppColor.white,
        foregroundColor: AppColor.primaryTextIcons,
        elevation: 0,
        leading: codeStep
            ? IconButton(
                tooltip: "Change number",
                icon: const Icon(Icons.arrow_back_rounded),
                onPressed: _busy ? null : () => setState(() => _verification = null),
              )
            : null,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(24, 8, 24, 24),
          child: AutofillGroup(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                ClipRRect(borderRadius: BorderRadius.circular(16), child: Image.asset(AppIcons.appLogo, width: 56, height: 56)),
                const SizedBox(height: 20),
                Text(codeStep ? "Enter the code" : "Sign in with your phone",
                    style: GoogleFonts.urbanist(fontSize: 26, fontWeight: FontWeight.w800, color: AppColor.primaryTextIcons)),
                const SizedBox(height: 8),
                Text(
                  codeStep ? "We sent a 6-digit code to $_e164." : "We'll text you a one-time code. Standard SMS rates may apply.",
                  style: GoogleFonts.urbanist(fontSize: 15, color: AppColor.greyColor, height: 1.4),
                ),
                const SizedBox(height: 28),
                if (!codeStep)
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      SizedBox(
                        width: 84,
                        child: TextField(
                          controller: _countryCode,
                          keyboardType: TextInputType.number,
                          inputFormatters: [FilteringTextInputFormatter.digitsOnly, LengthLimitingTextInputFormatter(3)],
                          decoration: _decoration("Code", prefix: "+"),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: TextField(
                          controller: _phone,
                          autofocus: true,
                          keyboardType: TextInputType.phone,
                          autofillHints: const [AutofillHints.telephoneNumberNational],
                          inputFormatters: [FilteringTextInputFormatter.digitsOnly, LengthLimitingTextInputFormatter(14)],
                          decoration: _decoration("Mobile number"),
                          onSubmitted: (_) => _send(),
                        ),
                      ),
                    ],
                  )
                else
                  TextField(
                    controller: _code,
                    autofocus: true,
                    keyboardType: TextInputType.number,
                    autofillHints: const [AutofillHints.oneTimeCode],
                    textAlign: TextAlign.center,
                    style: GoogleFonts.urbanist(fontSize: 26, fontWeight: FontWeight.w800, letterSpacing: 10),
                    inputFormatters: [FilteringTextInputFormatter.digitsOnly, LengthLimitingTextInputFormatter(6)],
                    decoration: _decoration("6-digit code"),
                    onChanged: (v) {
                      if (v.length == 6) _verify();
                    },
                  ),
                if (_error != null) ...[
                  const SizedBox(height: 12),
                  Text(_error!, style: GoogleFonts.urbanist(color: AppColor.notificationAccent, fontWeight: FontWeight.w600)),
                ],
                const SizedBox(height: 24),
                SizedBox(
                  width: double.infinity,
                  height: 52,
                  child: FilledButton(
                    style: FilledButton.styleFrom(backgroundColor: AppColor.primaryColor, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
                    onPressed: _busy ? null : (codeStep ? _verify : _send),
                    child: _busy
                        ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2.4, color: AppColor.white))
                        : Text(codeStep ? "Verify & continue" : "Send code", style: GoogleFonts.urbanist(fontSize: 16, fontWeight: FontWeight.w700)),
                  ),
                ),
                if (codeStep)
                  Center(
                    child: TextButton(
                      onPressed: _busy || _resendIn > 0 ? null : () => _send(resend: true),
                      child: Text(_resendIn > 0 ? "Resend code in ${_resendIn}s" : "Resend code",
                          style: GoogleFonts.urbanist(fontWeight: FontWeight.w700, color: _resendIn > 0 ? AppColor.grey : AppColor.primaryColor)),
                    ),
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  InputDecoration _decoration(String label, {String? prefix}) => InputDecoration(
        labelText: label,
        prefixText: prefix,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColor.primaryColor, width: 1.6)),
      );
}
