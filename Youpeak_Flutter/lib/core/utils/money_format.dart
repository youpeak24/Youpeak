import 'package:intl/intl.dart';

/// Coin and rupee formatting (Indian digit grouping: 1,00,000).
/// 100 coins = ₹1 at launch; the rate always comes from system_configs.
class MoneyFormat {
  MoneyFormat._();

  static final NumberFormat _grouped = NumberFormat.decimalPattern("en_IN");
  static final NumberFormat _rupees = NumberFormat.currency(locale: "en_IN", symbol: "₹", decimalDigits: 2);
  static final NumberFormat _wholeRupees = NumberFormat.currency(locale: "en_IN", symbol: "₹", decimalDigits: 0);

  static double coinsToInr(num coins, int coinsPerInr) => coins / (coinsPerInr <= 0 ? 100 : coinsPerInr);

  static int inrToCoins(num inr, int coinsPerInr) => (inr * (coinsPerInr <= 0 ? 100 : coinsPerInr)).ceil();

  static String coins(num coins) => _grouped.format(coins.round());

  /// "₹1.00", or "₹500" when [whole].
  static String inr(num amount, {bool whole = false}) => (whole ? _wholeRupees : _rupees).format(amount);

  static String inrFromCoins(num coins, int coinsPerInr) => inr(coinsToInr(coins, coinsPerInr));
}
