import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/core/network/app_api_client.dart';
import 'package:youpeak/core/system_config/domain/system_configs.dart';
import 'package:youpeak/core/system_config/presentation/system_configs_provider.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:youpeak/core/utils/money_format.dart';
import 'package:youpeak/features/peak_boost/data/peak_boost_repository.dart';
import 'package:youpeak/features/peak_boost/domain/peak_boost.dart';
import 'package:youpeak/features/profile/api/get_profile_api.dart';
import 'package:youpeak/features/tasker/presentation/tasker_dashboard_provider.dart';

/// The booster's spendable coin balance: the Tasker dashboard's live copy,
/// else the last loaded profile.
final boostBalanceProvider = Provider<int?>((ref) {
  final fromDashboard = ref.watch(taskerDashboardProvider).value?.wallet.coins;
  return fromDashboard ?? GetProfileApi.profileModel?.user?.coin?.round();
});

/// Opens the Peak Boost sheet for [videoId]. Returns the receipt of a
/// completed boost, or null if the user closed the sheet.
Future<PeakBoostReceipt?> showPeakBoostSheet(
  BuildContext context, {
  required String videoId,
  String? creatorName,
  required VoidCallback onGetCoins,
}) {
  return showModalBottomSheet<PeakBoostReceipt>(
    context: context,
    isScrollControlled: true,
    useSafeArea: true,
    backgroundColor: Colors.transparent,
    builder: (_) => PeakBoostBottomSheet(videoId: videoId, creatorName: creatorName, onGetCoins: onGetCoins),
  );
}

class PeakBoostBottomSheet extends ConsumerStatefulWidget {
  const PeakBoostBottomSheet({super.key, required this.videoId, this.creatorName, required this.onGetCoins});

  final String videoId;
  final String? creatorName;
  final VoidCallback onGetCoins;

  @override
  ConsumerState<PeakBoostBottomSheet> createState() => _PeakBoostBottomSheetState();
}

class _PeakBoostBottomSheetState extends ConsumerState<PeakBoostBottomSheet> {
  final _custom = TextEditingController();
  int? _selectedPreset = 1; // Mini Boost by default, when it exists
  bool _customSelected = false;
  bool _submitting = false;
  String? _error;
  int? _balanceOverride;
  String _requestId = newBoostRequestId();

  @override
  void dispose() {
    _custom.dispose();
    super.dispose();
  }

  void _select({int? preset, bool custom = false}) {
    setState(() {
      _selectedPreset = preset;
      _customSelected = custom;
      _error = null;
      _requestId = newBoostRequestId(); // a different amount is a different attempt
    });
    HapticFeedback.selectionClick();
  }

  BoostValidation _currentAmount(PeakBoostConfig config, int rate) {
    if (_customSelected) return validateBoostAmount(_custom.text, config, coinsPerInr: rate);
    final i = _selectedPreset;
    if (i == null || i >= config.presets.length) return const BoostValidation.invalid("Choose a boost.");
    return BoostValidation.ok(config.presets[i].coins);
  }

  Future<void> _submit(int coins) async {
    setState(() {
      _submitting = true;
      _error = null;
    });
    try {
      final receipt = await ref.read(peakBoostRepositoryProvider).boost(videoId: widget.videoId, coins: coins, requestId: _requestId);
      HapticFeedback.heavyImpact();
      ref.read(taskerDashboardProvider.notifier).refresh();
      if (mounted) Navigator.of(context).pop(receipt);
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.message;
        if (e.code == "INSUFFICIENT_BALANCE" && e.data["balance"] is num) _balanceOverride = (e.data["balance"] as num).round();
        // Keep the id after a network failure (the boost may have gone
        // through — a retry must not charge twice); anything else was a
        // definite refusal, so the next try is a new attempt.
        if (e.code != "NETWORK_TIMEOUT" && e.code != "NETWORK_ERROR") _requestId = newBoostRequestId();
      });
      HapticFeedback.vibrate();
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final configs = ref.watch(systemConfigsProvider);
    final config = configs.peakBoost;
    final rate = configs.taskerTiers.coinsPerInr;
    final balance = _balanceOverride ?? ref.watch(boostBalanceProvider);
    final amount = _currentAmount(config, rate);
    final coins = amount.coins;
    final insufficient = coins != null && balance != null && !canAffordBoost(balance: balance, coins: coins);

    return Container(
      decoration: const BoxDecoration(color: AppColor.darkSurface, borderRadius: BorderRadius.vertical(top: Radius.circular(16))),
      padding: EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(context).bottom),
      child: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(20, 10, 20, 20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(child: Container(width: 40, height: 4, decoration: BoxDecoration(color: AppColor.darkCardBorder, borderRadius: BorderRadius.circular(4)))),
            const SizedBox(height: 14),
            Row(
              children: [
                const Icon(Icons.rocket_launch_rounded, color: Color(0xFF7C3AED)),
                const SizedBox(width: 8),
                Text("Peak Boost", style: GoogleFonts.urbanist(color: AppColor.white, fontSize: 20, fontWeight: FontWeight.w800)),
                const Spacer(),
                _CoinCounter(balance: balance),
              ],
            ),
            const SizedBox(height: 4),
            Text(
              widget.creatorName == null ? "Support this creator with coins" : "Support ${widget.creatorName} with coins",
              style: GoogleFonts.urbanist(color: const Color(0xFF94A3B8), fontSize: 14),
            ),
            const SizedBox(height: 16),
            if (!config.enabled)
              Text("Peak Boost isn't available right now.", style: GoogleFonts.urbanist(color: AppColor.white, fontSize: 15))
            else ...[
              GridView.count(
                crossAxisCount: 3,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                mainAxisSpacing: 10,
                crossAxisSpacing: 10,
                childAspectRatio: 1.05,
                children: [
                  for (var i = 0; i < config.presets.length; i++)
                    _PresetCard(
                      title: config.presets[i].name,
                      coins: config.presets[i].coins,
                      inr: MoneyFormat.inrFromCoins(config.presets[i].coins, rate),
                      selected: !_customSelected && _selectedPreset == i,
                      onTap: () => _select(preset: i),
                    ),
                  _PresetCard(title: "Custom Boost", selected: _customSelected, onTap: () => _select(custom: true)),
                ],
              ),
              if (_customSelected) ...[
                const SizedBox(height: 14),
                TextField(
                  controller: _custom,
                  autofocus: true,
                  keyboardType: TextInputType.number,
                  inputFormatters: [FilteringTextInputFormatter.digitsOnly, LengthLimitingTextInputFormatter(8)],
                  style: GoogleFonts.urbanist(color: AppColor.white, fontSize: 16, fontWeight: FontWeight.w700),
                  cursorColor: AppColor.coinGold,
                  onChanged: (_) => setState(() => _requestId = newBoostRequestId()),
                  decoration: InputDecoration(
                    hintText: "${MoneyFormat.coins(config.minCoins)} – ${MoneyFormat.coins(config.maxCoins)} coins",
                    hintStyle: GoogleFonts.urbanist(color: const Color(0xFF64748B)),
                    prefixIcon: const Icon(Icons.monetization_on_rounded, color: AppColor.coinGold),
                    suffixText: coins != null ? MoneyFormat.inrFromCoins(coins, rate) : null,
                    suffixStyle: GoogleFonts.urbanist(color: const Color(0xFF94A3B8)),
                    filled: true,
                    fillColor: AppColor.darkCard,
                    errorText: _custom.text.isEmpty ? null : amount.error,
                    enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColor.darkCardBorder)),
                    focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFF7C3AED), width: 1.6)),
                    errorBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColor.notificationAccent)),
                    focusedErrorBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColor.notificationAccent)),
                  ),
                ),
              ],
              const SizedBox(height: 14),
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(Icons.info_outline_rounded, size: 16, color: Color(0xFF94A3B8)),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      "${config.creatorPercent.round()}% goes to the creator · ${config.platformPercent.round()}% platform fee. Boosts can't be refunded.",
                      style: GoogleFonts.urbanist(color: const Color(0xFF94A3B8), fontSize: 12.5, height: 1.35),
                    ),
                  ),
                ],
              ),
              if (_error != null) ...[
                const SizedBox(height: 10),
                Text(_error!, style: GoogleFonts.urbanist(color: const Color(0xFFF87171), fontSize: 14, fontWeight: FontWeight.w600)),
              ],
              const SizedBox(height: 16),
              _BoostButton(
                label: insufficient
                    ? "Insufficient Balance • Get Coins"
                    : coins == null
                        ? "Boost"
                        : "Boost ${MoneyFormat.coins(coins)} Coins · ${MoneyFormat.inrFromCoins(coins, rate)}",
                loading: _submitting,
                muted: insufficient,
                onPressed: _submitting
                    ? null
                    : insufficient
                        ? () {
                            Navigator.of(context).pop();
                            widget.onGetCoins();
                          }
                        : coins == null
                            ? null
                            : () => _submit(coins),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _CoinCounter extends StatelessWidget {
  const _CoinCounter({required this.balance});

  final int? balance;

  @override
  Widget build(BuildContext context) => Semantics(
        label: "Coin balance ${balance ?? "loading"}",
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
          decoration: BoxDecoration(color: AppColor.darkCard, borderRadius: BorderRadius.circular(20), border: Border.all(color: AppColor.darkCardBorder)),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.monetization_on_rounded, color: AppColor.coinGold, size: 18),
              const SizedBox(width: 6),
              Text(balance == null ? "—" : MoneyFormat.coins(balance!),
                  style: GoogleFonts.urbanist(color: AppColor.coinGold, fontWeight: FontWeight.w800, fontSize: 15)),
            ],
          ),
        ),
      );
}

class _PresetCard extends StatelessWidget {
  const _PresetCard({required this.title, required this.selected, required this.onTap, this.coins, this.inr});

  final String title;
  final int? coins;
  final String? inr;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      selected: selected,
      label: coins == null ? title : "$title, ${MoneyFormat.coins(coins!)} coins, $inr",
      child: Material(
        color: selected ? AppColor.darkCardSelected : AppColor.darkCard,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: BorderSide(color: selected ? const Color(0xFF7C3AED) : AppColor.darkCardBorder, width: selected ? 2 : 1),
        ),
        child: InkWell(
          borderRadius: BorderRadius.circular(12),
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.all(8),
            child: ExcludeSemantics(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(title, textAlign: TextAlign.center, maxLines: 2, style: GoogleFonts.urbanist(color: const Color(0xFFCBD5E1), fontSize: 12.5, fontWeight: FontWeight.w700)),
                  const SizedBox(height: 6),
                  if (coins != null) ...[
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.monetization_on_rounded, color: AppColor.coinGold, size: 16),
                        const SizedBox(width: 4),
                        Flexible(
                          child: FittedBox(
                            child: Text(MoneyFormat.coins(coins!), style: GoogleFonts.urbanist(color: AppColor.white, fontSize: 16, fontWeight: FontWeight.w800)),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 2),
                    Text(inr!, style: GoogleFonts.urbanist(color: const Color(0xFF94A3B8), fontSize: 12)),
                  ] else
                    const Icon(Icons.edit_rounded, color: AppColor.coinGold),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _BoostButton extends StatelessWidget {
  const _BoostButton({required this.label, required this.loading, required this.muted, required this.onPressed});

  final String label;
  final bool loading;
  final bool muted;
  final VoidCallback? onPressed;

  @override
  Widget build(BuildContext context) {
    final enabled = onPressed != null;
    return Opacity(
      opacity: enabled || loading ? 1 : 0.5,
      child: DecoratedBox(
        decoration: BoxDecoration(
          gradient: muted ? null : AppColor.peakBoostGradient,
          color: muted ? AppColor.darkCard : null,
          border: muted ? Border.all(color: AppColor.coinGold) : null,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            borderRadius: BorderRadius.circular(12),
            onTap: onPressed,
            child: SizedBox(
              height: 52,
              width: double.infinity,
              child: Center(
                child: loading
                    ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2.4, color: AppColor.white))
                    : Text(label, style: GoogleFonts.urbanist(color: muted ? AppColor.coinGold : AppColor.white, fontSize: 16, fontWeight: FontWeight.w800)),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
