import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/core/assets/app_icons.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:youpeak/core/theme/app_tokens.dart';
import 'package:youpeak/main.dart' show isDarkMode;
import 'package:youpeak/shared/widgets/app_pressable.dart';
import 'package:youpeak/features/auth/phone/data/phone_auth_service.dart';
import 'package:youpeak/features/auth/phone/data/phone_login_repository.dart';
import 'package:youpeak/features/auth/phone/data/phone_number.dart';
import 'package:youpeak/features/auth/service/post_login_router.dart';

/// Sign in with a mobile number (Firebase Phone OTP).
class PhoneLoginView extends ConsumerStatefulWidget {
  const PhoneLoginView({super.key});

  /// "+91 98765 43210" / "9876543210" -> "+919876543210"; null if invalid.
  static String? toE164(String countryCode, String number) => PhoneNumber.toE164(countryCode, number);

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

  /// Firebase accepted the code but the YouPeak sign-in failed; retry that
  /// step with this token instead of asking for (and paying for) a new SMS.
  String? _pendingIdToken;
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
    if (_busy) return;
    final e164 = PhoneNumber.toE164(_countryCode.text, _phone.text);
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
        _pendingIdToken = null;
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
    final pending = _pendingIdToken;
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      final idToken = pending ?? await ref.read(phoneAuthServiceProvider).confirm(v, _code.text);
      _pendingIdToken = idToken;
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
      _pendingIdToken = null;
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
    final dark = isDarkMode.value;
    final bg = dark ? AppColor.mainDark : AppColor.white;
    final strong = dark ? AppColor.white : AppColor.primaryTextIcons;
    final muted = dark ? AppColor.mutedTextDark : AppColor.mutedText;
    return Scaffold(
      backgroundColor: bg,
      appBar: AppBar(
        backgroundColor: bg,
        foregroundColor: strong,
        elevation: 0,
        leading: codeStep
            ? IconButton(
                tooltip: "Change number",
                icon: const Icon(Icons.arrow_back_rounded),
                onPressed: _busy
                    ? null
                    : () => setState(() {
                          _verification = null;
                          _pendingIdToken = null;
                          _error = null;
                        }),
              )
            : null,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(24, 8, 24, 24),
          child: Align(
            alignment: Alignment.topCenter,
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 440),
              child: AutofillGroup(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    ClipRRect(borderRadius: BorderRadius.circular(18), child: Image.asset(AppIcons.appLogo, width: 60, height: 60)),
                    const SizedBox(height: 22),
                    Text(
                      codeStep ? "Enter the code" : "Sign in with your phone",
                      style: GoogleFonts.urbanist(fontSize: 28, fontWeight: FontWeight.w800, letterSpacing: -0.5, height: 1.15, color: strong),
                    ),
                    const SizedBox(height: 10),
                    Text(
                      codeStep ? "We sent a 6-digit code to $_e164." : "We'll text you a one-time code. Standard SMS rates may apply.",
                      style: GoogleFonts.urbanist(fontSize: 15, color: muted, height: 1.45),
                    ),
                    const SizedBox(height: 30),
                    if (!codeStep)
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          SizedBox(
                            width: 92,
                            child: TextField(
                              cursorColor: AppColor.primaryColor,
                              controller: _countryCode,
                              keyboardType: TextInputType.number,
                              style: GoogleFonts.urbanist(fontSize: 16, fontWeight: FontWeight.w700, color: strong),
                              inputFormatters: [FilteringTextInputFormatter.digitsOnly, LengthLimitingTextInputFormatter(3)],
                              decoration: _decoration("Code", dark: dark, prefix: "+"),
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: TextField(
                              cursorColor: AppColor.primaryColor,
                              controller: _phone,
                              autofocus: true,
                              keyboardType: TextInputType.phone,
                              style: GoogleFonts.urbanist(fontSize: 16, fontWeight: FontWeight.w700, color: strong),
                              autofillHints: const [AutofillHints.telephoneNumberNational],
                              // Lets a pasted "+91 98765 43210" through; PhoneNumber.toE164 normalizes it.
                              inputFormatters: [FilteringTextInputFormatter.allow(RegExp(r"[0-9+\s\-()]")), LengthLimitingTextInputFormatter(20)],
                              decoration: _decoration("Mobile number", dark: dark),
                              onSubmitted: (_) => _send(),
                            ),
                          ),
                        ],
                      )
                    else
                      _CodeEntry(
                        controller: _code,
                        dark: dark,
                        hasError: _error != null,
                        onChanged: (v) {
                          setState(() {});
                          if (v.length == 6) _verify();
                        },
                      ),
                    if (_error != null) ...[
                      const SizedBox(height: 14),
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Padding(
                            padding: EdgeInsets.only(top: 1),
                            child: Icon(Icons.error_outline_rounded, size: 18, color: AppColor.notificationAccent),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              _error!,
                              style: GoogleFonts.urbanist(color: AppColor.notificationAccent, fontWeight: FontWeight.w600, height: 1.35),
                            ),
                          ),
                        ],
                      ),
                    ],
                    const SizedBox(height: 26),
                    _PrimaryAction(
                      busy: _busy,
                      label: codeStep ? "Verify & continue" : "Send code",
                      onPressed: _busy ? null : (codeStep ? _verify : _send),
                    ),
                    if (codeStep)
                      Center(
                        child: TextButton(
                          onPressed: _busy || _resendIn > 0 ? null : () => _send(resend: true),
                          child: Text(
                            _resendIn > 0 ? "Resend code in ${_resendIn}s" : "Resend code",
                            style: GoogleFonts.urbanist(
                              fontWeight: FontWeight.w700,
                              color: _resendIn > 0 ? AppColor.grey : (dark ? AppColor.brightGreen : AppColor.primaryColor),
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  InputDecoration _decoration(String label, {required bool dark, String? prefix}) {
    final fill = dark ? AppColor.white.withValues(alpha: 0.07) : AppColor.lightGreyBG;
    OutlineInputBorder border(Color color, [double width = 1]) =>
        OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide(color: color, width: width));
    return InputDecoration(
      labelText: label,
      labelStyle: GoogleFonts.urbanist(color: dark ? AppColor.mutedTextDark : AppColor.mutedText, fontWeight: FontWeight.w500),
      floatingLabelStyle: GoogleFonts.urbanist(color: dark ? AppColor.brightGreen : AppColor.primaryColor, fontWeight: FontWeight.w700),
      prefixText: prefix,
      prefixStyle: GoogleFonts.urbanist(fontSize: 16, fontWeight: FontWeight.w700, color: dark ? AppColor.white : AppColor.primaryTextIcons),
      filled: true,
      fillColor: fill,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 18),
      enabledBorder: border(AppElevation.hairline(dark)),
      border: border(AppElevation.hairline(dark)),
      focusedBorder: border(dark ? AppColor.brightGreen : AppColor.primaryColor, 1.8),
    );
  }
}

/// Full-width brand button with an in-place busy state. Disabled while [onPressed] is null.
class _PrimaryAction extends StatelessWidget {
  const _PrimaryAction({required this.busy, required this.label, required this.onPressed});

  final bool busy;
  final String label;
  final VoidCallback? onPressed;

  @override
  Widget build(BuildContext context) {
    return AppPressable(
      onTap: onPressed,
      haptic: true,
      semanticLabel: label,
      child: AnimatedOpacity(
        duration: AppMotion.of(context),
        opacity: onPressed == null && !busy ? 0.55 : 1,
        child: Container(
          height: 54,
          width: double.infinity,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: AppColor.primaryColor,
            borderRadius: BorderRadius.circular(100),
          ),
          child: AnimatedSwitcher(
            duration: AppMotion.of(context, AppMotion.fast),
            child: busy
                ? const SizedBox(
                    key: ValueKey("busy"),
                    width: 24,
                    height: 24,
                    child: CircularProgressIndicator(strokeWidth: 2.6, strokeCap: StrokeCap.round, color: AppColor.white),
                  )
                : Text(
                    label,
                    key: const ValueKey("label"),
                    style: GoogleFonts.urbanist(fontSize: 16.5, fontWeight: FontWeight.w800, color: AppColor.white),
                  ),
          ),
        ),
      ),
    );
  }
}

/// Six-box one-time-code field. The real [TextField] sits underneath (so
/// keyboard, paste and OS code suggestions work as normal); the boxes just
/// mirror what it holds.
class _CodeEntry extends StatelessWidget {
  const _CodeEntry({required this.controller, required this.dark, required this.hasError, required this.onChanged});

  static const _length = 6;

  final TextEditingController controller;
  final bool dark;
  final bool hasError;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    final text = controller.text;
    final accent = dark ? AppColor.brightGreen : AppColor.primaryColor;
    return Semantics(
      label: "6-digit code",
      textField: true,
      child: SizedBox(
        height: 62,
        child: Stack(
          children: [
            Positioned.fill(
              child: Opacity(
                opacity: 0,
                child: TextField(
                  controller: controller,
                  autofocus: true,
                  showCursor: false,
                  enableInteractiveSelection: false,
                  keyboardType: TextInputType.number,
                  autofillHints: const [AutofillHints.oneTimeCode],
                  inputFormatters: [FilteringTextInputFormatter.digitsOnly, LengthLimitingTextInputFormatter(_length)],
                  onChanged: onChanged,
                ),
              ),
            ),
            IgnorePointer(
              child: Row(
                children: [
                  for (var i = 0; i < _length; i++) ...[
                    if (i > 0) const SizedBox(width: 8),
                    Expanded(
                      child: AnimatedContainer(
                        duration: AppMotion.of(context, AppMotion.fast),
                        alignment: Alignment.center,
                        decoration: BoxDecoration(
                          color: dark ? AppColor.white.withValues(alpha: 0.07) : AppColor.lightGreyBG,
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(
                            color: hasError
                                ? AppColor.notificationAccent
                                : (i == text.length.clamp(0, _length - 1) ? accent : AppElevation.hairline(dark)),
                            width: i == text.length.clamp(0, _length - 1) && !hasError ? 1.8 : 1,
                          ),
                        ),
                        child: Text(
                          i < text.length ? text[i] : "",
                          style: GoogleFonts.urbanist(
                            fontSize: 24,
                            fontWeight: FontWeight.w800,
                            color: dark ? AppColor.white : AppColor.primaryTextIcons,
                          ),
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
