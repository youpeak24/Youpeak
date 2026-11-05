import 'dart:math';

import 'package:youpeak/core/system_config/domain/system_configs.dart';
import 'package:youpeak/core/utils/money_format.dart';

class BoostValidation {
  const BoostValidation.ok(int this.coins) : error = null;

  const BoostValidation.invalid(String this.error) : coins = null;

  final int? coins;
  final String? error;

  bool get isValid => coins != null;
}

/// Validates a custom boost amount against the published limits
/// (100 – 1,000,000 coins = ₹1 – ₹10,000 at launch).
BoostValidation validateBoostAmount(String input, PeakBoostConfig config, {int coinsPerInr = 100}) {
  final cleaned = input.replaceAll(RegExp(r"[,\s]"), "");
  if (cleaned.isEmpty) return const BoostValidation.invalid("Enter how many coins to boost.");
  final coins = int.tryParse(cleaned);
  if (coins == null) return const BoostValidation.invalid("Use whole coins only.");
  if (coins < config.minCoins || coins > config.maxCoins) {
    return BoostValidation.invalid(
      "Boost between ${MoneyFormat.coins(config.minCoins)} and ${MoneyFormat.coins(config.maxCoins)} coins "
      "(${MoneyFormat.inrFromCoins(config.minCoins, coinsPerInr)} – ${MoneyFormat.inrFromCoins(config.maxCoins, coinsPerInr)}).",
    );
  }
  return BoostValidation.ok(coins);
}

bool canAffordBoost({required int balance, required int coins}) => coins > 0 && balance >= coins;

final Random _random = Random.secure();

/// A fresh idempotency key for one boost attempt. Retrying the SAME attempt
/// (e.g. after a timeout) must reuse it, so the server charges only once.
String newBoostRequestId() => List.generate(16, (_) => _random.nextInt(16).toRadixString(16)).join();

class PeakBoostReceipt {
  const PeakBoostReceipt({
    required this.boostId,
    required this.coins,
    required this.balance,
    required this.creatorCoins,
    required this.platformCoins,
    required this.boosterName,
  });

  factory PeakBoostReceipt.fromJson(Map<String, dynamic> json) => PeakBoostReceipt(
        boostId: json["boostId"]?.toString() ?? "",
        coins: (json["coins"] as num?)?.round() ?? 0,
        balance: (json["balance"] as num?)?.round() ?? 0,
        creatorCoins: (json["creatorCoins"] as num?)?.round() ?? 0,
        platformCoins: (json["platformCoins"] as num?)?.round() ?? 0,
        boosterName: (json["boosterName"] as String?)?.trim().isNotEmpty == true ? (json["boosterName"] as String).trim() : "A fan",
      );

  final String boostId;
  final int coins;
  final int balance;
  final int creatorCoins;
  final int platformCoins;
  final String boosterName;

  String get toastText => "$boosterName boosted ${MoneyFormat.coins(coins)} Coins!";
}

/// The server's record of one boost attempt (client/peakBoost/status).
class PeakBoostStatus {
  const PeakBoostStatus({required this.found, required this.completed, required this.coins, required this.balance, this.boostId});

  factory PeakBoostStatus.fromJson(Map<String, dynamic> json) => PeakBoostStatus(
        found: json["found"] == true,
        completed: json["completed"] == true,
        coins: (json["coins"] as num?)?.round() ?? 0,
        balance: (json["balance"] as num?)?.round() ?? 0,
        boostId: json["boostId"]?.toString(),
      );

  final bool found;
  final bool completed;
  final int coins;
  final int balance;
  final String? boostId;

  /// A completed boost as a receipt, so the sheet closes the same way as on a direct success.
  PeakBoostReceipt receipt({String? boosterName}) => PeakBoostReceipt(
        boostId: boostId ?? "",
        coins: coins,
        balance: balance,
        creatorCoins: 0,
        platformCoins: 0,
        boosterName: boosterName ?? "You",
      );
}
