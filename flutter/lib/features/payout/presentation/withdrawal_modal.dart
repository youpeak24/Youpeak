import 'package:youpeak/shared/widgets/app_icon.dart';
import 'package:youpeak/core/assets/app_icons.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/core/network/app_api_client.dart';
import 'package:youpeak/core/system_config/presentation/system_configs_provider.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:youpeak/core/theme/app_tokens.dart';
import 'package:youpeak/core/utils/money_format.dart';
import 'package:youpeak/features/payout/data/payout_repository.dart';
import 'package:youpeak/features/payout/domain/payout_rules.dart';
import 'package:youpeak/features/tasker/domain/tasker_dashboard.dart';

/// Opens the Tasker withdrawal sheet. Returns the receipt when a request was
/// sent (status PENDING, paid after admin approval), else null.
Future<PayoutReceipt?> showWithdrawalModal(BuildContext context, {required TaskerDashboard dashboard}) {
  return showModalBottomSheet<PayoutReceipt>(
    context: context,
    isScrollControlled: true,
    useSafeArea: true,
    shape: const RoundedRectangleBorder(borderRadius: AppRadius.sheetBorder),
    builder: (_) => WithdrawalModal(dashboard: dashboard),
  );
}

class WithdrawalModal extends ConsumerStatefulWidget {
  const WithdrawalModal({super.key, required this.dashboard});

  final TaskerDashboard dashboard;

  @override
  ConsumerState<WithdrawalModal> createState() => _WithdrawalModalState();
}

class _WithdrawalModalState extends ConsumerState<WithdrawalModal> {
  final _formKey = GlobalKey<FormState>();
  final _amount = TextEditingController();
  final _upi = TextEditingController();
  final _holder = TextEditingController();
  final _account = TextEditingController();
  final _ifsc = TextEditingController();
  PayoutMethod _method = PayoutMethod.upi;
  bool _submitting = false;
  String? _serverError;
  PayoutReceipt? _receipt;

  @override
  void dispose() {
    for (final c in [_amount, _upi, _holder, _account, _ifsc]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() => _serverError = null);
    if (!(_formKey.currentState?.validate() ?? false)) return;
    final amount = int.parse(_amount.text);
    final request = _method == PayoutMethod.upi
        ? PayoutRequest.upi(amountInr: amount, upiId: _upi.text)
        : PayoutRequest.bank(amountInr: amount, accountHolderName: _holder.text, accountNumber: _account.text, ifsc: _ifsc.text);

    setState(() => _submitting = true);
    try {
      final receipt = await ref.read(payoutRepositoryProvider).request(request);
      if (!mounted) return;
      HapticFeedback.mediumImpact();
      setState(() => _receipt = receipt);
    } on ApiException catch (e) {
      if (mounted) setState(() => _serverError = e.message);
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final policy = ref.watch(systemConfigsProvider).payoutPolicy;
    final d = widget.dashboard;
    final isFirst = d.payout.isFirstWithdrawal;
    final minInr = PayoutRules.minimumInr(isFirstWithdrawal: isFirst, policy: policy);
    final capInr = policy.enforceTierMonthlyCap ? d.payout.monthlyCapInr : null;
    final available = d.wallet.totalAvailableInr;
    final rate = policy.coinsPerInr;

    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(context).bottom),
      child: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
        child: _receipt != null
            ? _Success(receipt: _receipt!, onDone: () => Navigator.of(context).pop(_receipt))
            : Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Center(child: Container(width: 40, height: 4, decoration: BoxDecoration(color: AppColor.grey_300, borderRadius: BorderRadius.circular(4)))),
                    const SizedBox(height: 16),
                    Text("Withdraw", style: GoogleFonts.urbanist(fontSize: 22, fontWeight: FontWeight.w800)),
                    const SizedBox(height: 4),
                    Text(
                      "${MoneyFormat.inr(available)} available · ${MoneyFormat.coins(d.wallet.coins)} coins (${MoneyFormat.coins(rate)} coins = ₹1)",
                      style: GoogleFonts.urbanist(fontSize: 14, color: AppColor.greyColor),
                    ),
                    const SizedBox(height: 16),
                    _ThresholdCard(isFirst: isFirst, minInr: minInr, standardMinInr: policy.standardMinInr, capInr: capInr, rate: rate),
                    const SizedBox(height: 16),
                    if (d.payout.hasPendingRequest)
                      const _Notice(icon: Icons.hourglass_top_rounded, text: "You already have a withdrawal waiting for approval. You can request another once it's processed.")
                    else ...[
                      TextFormField(
                        cursorColor: AppColor.primaryColor,
                        controller: _amount,
                        keyboardType: TextInputType.number,
                        inputFormatters: [FilteringTextInputFormatter.digitsOnly, LengthLimitingTextInputFormatter(7)],
                        decoration: _decoration("Amount", prefix: "₹ "),
                        validator: (v) => PayoutRules.validateAmount(
                          amountInr: int.tryParse(v ?? ""),
                          minInr: minInr,
                          availableInr: available,
                          isFirstWithdrawal: isFirst,
                          coinsPerInr: rate,
                          capInr: capInr,
                        ),
                      ),
                      const SizedBox(height: 16),
                      SegmentedButton<PayoutMethod>(
                        segments: const [
                          ButtonSegment(value: PayoutMethod.upi, label: Text("UPI"), icon: AppIcon(AppIcons.extraQrCode, size: 20)),
                          ButtonSegment(value: PayoutMethod.bank, label: Text("Bank transfer"), icon: AppIcon(AppIcons.extraWithdrawToBank, size: 20)),
                        ],
                        selected: {_method},
                        style: SegmentedButton.styleFrom(
                          selectedBackgroundColor: AppColor.secondaryMintGreen,
                          selectedForegroundColor: AppColor.primaryColor,
                          minimumSize: const Size.fromHeight(44),
                        ),
                        onSelectionChanged: (s) => setState(() => _method = s.first),
                      ),
                      const SizedBox(height: 16),
                      if (_method == PayoutMethod.upi)
                        TextFormField(
                          cursorColor: AppColor.primaryColor,
                          controller: _upi,
                          keyboardType: TextInputType.emailAddress,
                          autocorrect: false,
                          decoration: _decoration("UPI ID / VPA", hint: "name@okaxis"),
                          validator: (v) => PayoutRules.validateUpi(v ?? ""),
                        )
                      else ...[
                        TextFormField(
                          cursorColor: AppColor.primaryColor,
                          controller: _holder,
                          textCapitalization: TextCapitalization.words,
                          decoration: _decoration("Account holder name"),
                          validator: (v) => PayoutRules.validateHolderName(v ?? ""),
                        ),
                        const SizedBox(height: 12),
                        TextFormField(
                          cursorColor: AppColor.primaryColor,
                          controller: _account,
                          keyboardType: TextInputType.number,
                          inputFormatters: [FilteringTextInputFormatter.digitsOnly, LengthLimitingTextInputFormatter(18)],
                          decoration: _decoration("Account number"),
                          validator: (v) => PayoutRules.validateAccountNumber(v ?? ""),
                        ),
                        const SizedBox(height: 12),
                        TextFormField(
                          cursorColor: AppColor.primaryColor,
                          controller: _ifsc,
                          textCapitalization: TextCapitalization.characters,
                          inputFormatters: [LengthLimitingTextInputFormatter(11)],
                          decoration: _decoration("IFSC code", hint: "SBIN0001234"),
                          validator: (v) => PayoutRules.validateIfsc(v ?? ""),
                        ),
                      ],
                      if (_serverError != null) ...[
                        const SizedBox(height: 12),
                        Text(_serverError!, style: GoogleFonts.urbanist(color: AppColor.notificationAccent, fontWeight: FontWeight.w600)),
                      ],
                      const SizedBox(height: 20),
                      SizedBox(
                        width: double.infinity,
                        height: 52,
                        child: FilledButton(
                          style: FilledButton.styleFrom(backgroundColor: AppColor.primaryColor, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
                          onPressed: _submitting ? null : _submit,
                          child: _submitting
                              ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2.4, color: AppColor.white))
                              : Text("Request withdrawal", style: GoogleFonts.urbanist(fontSize: 16, fontWeight: FontWeight.w700)),
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        "Coins are converted to ₹ at ${MoneyFormat.coins(rate)} coins = ₹1 when needed. Paid after admin approval.",
                        style: GoogleFonts.urbanist(fontSize: 12, color: AppColor.greyColor),
                      ),
                    ],
                  ],
                ),
              ),
      ),
    );
  }

  InputDecoration _decoration(String label, {String? hint, String? prefix}) => InputDecoration(
        labelText: label,
        floatingLabelStyle: const TextStyle(color: AppColor.primaryColor, fontWeight: FontWeight.w600),
        hintText: hint,
        prefixText: prefix,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColor.primaryColor, width: 1.6)),
      );
}

class _ThresholdCard extends StatelessWidget {
  const _ThresholdCard({required this.isFirst, required this.minInr, required this.standardMinInr, required this.capInr, required this.rate});

  final bool isFirst;
  final int minInr;
  final int standardMinInr;
  final int? capInr;
  final int rate;

  @override
  Widget build(BuildContext context) {
    final style = GoogleFonts.urbanist(fontSize: 14, height: 1.35);
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(color: AppColor.secondaryMintGreen, borderRadius: BorderRadius.circular(12)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [
            const Icon(Icons.verified_user_rounded, color: AppColor.primaryColor, size: 20),
            const SizedBox(width: 8),
            Flexible(
              child: Text(isFirst ? "First withdrawal — Trust Hook" : "Standard withdrawal",
                  style: GoogleFonts.urbanist(fontSize: 15, fontWeight: FontWeight.w800, color: AppColor.darkForestAccent)),
            ),
          ]),
          const SizedBox(height: 6),
          Text("Minimum ${MoneyFormat.inr(minInr, whole: true)} (${MoneyFormat.coins(minInr * rate)} coins).", style: style),
          if (isFirst) Text("After your first payout the minimum is ${MoneyFormat.inr(standardMinInr, whole: true)}.", style: style),
          if (capInr != null) Text("Your tier allows up to ${MoneyFormat.inr(capInr!, whole: true)} per withdrawal.", style: style),
        ],
      ),
    );
  }
}

class _Notice extends StatelessWidget {
  const _Notice({required this.icon, required this.text});

  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) => Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: AppColor.orangeTextColor),
          const SizedBox(width: 10),
          Expanded(child: Text(text, style: GoogleFonts.urbanist(fontSize: 14, height: 1.35))),
        ],
      );
}

class _Success extends StatelessWidget {
  const _Success({required this.receipt, required this.onDone});

  final PayoutReceipt receipt;
  final VoidCallback onDone;

  @override
  Widget build(BuildContext context) => Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const SizedBox(height: 12),
          const Icon(Icons.check_circle_rounded, color: AppColor.primaryColor, size: 64),
          const SizedBox(height: 12),
          Text("Withdrawal requested", style: GoogleFonts.urbanist(fontSize: 22, fontWeight: FontWeight.w800)),
          const SizedBox(height: 8),
          Text(
            "${MoneyFormat.inr(receipt.amountInr, whole: true)} · Status: Pending approval",
            style: GoogleFonts.urbanist(fontSize: 15),
          ),
          if (receipt.convertedCoins > 0)
            Padding(
              padding: const EdgeInsets.only(top: 4),
              child: Text("${MoneyFormat.coins(receipt.convertedCoins)} coins were converted.", style: GoogleFonts.urbanist(fontSize: 13, color: AppColor.greyColor)),
            ),
          const SizedBox(height: 20),
          SizedBox(
            width: double.infinity,
            height: 48,
            child: FilledButton(
              style: FilledButton.styleFrom(backgroundColor: AppColor.primaryColor, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
              onPressed: onDone,
              child: Text("Done", style: GoogleFonts.urbanist(fontSize: 16, fontWeight: FontWeight.w700)),
            ),
          ),
        ],
      );
}
