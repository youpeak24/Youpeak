import 'package:youpeak/core/system_config/domain/system_configs.dart';
import 'package:youpeak/core/utils/money_format.dart';

enum PayoutMethod { upi, bank }

/// Withdrawal rules, mirrored from POST client/payout/request so the form can
/// explain a problem before submitting. The server applies the same checks.
class PayoutRules {
  PayoutRules._();

  static final _upi = RegExp(r"^[a-zA-Z0-9._-]{2,256}@[a-zA-Z][a-zA-Z0-9.-]{1,63}$");
  static final _ifsc = RegExp(r"^[A-Z]{4}0[A-Z0-9]{6}$");
  static final _account = RegExp(r"^\d{9,18}$");
  static final _holder = RegExp(r"^[A-Za-z][A-Za-z .'-]{1,99}$");

  /// Trust Hook: the first-ever payout has the lower minimum (₹100), so the
  /// user can confirm their payout details work; every later one uses the
  /// standard minimum (₹500).
  static int minimumInr({required bool isFirstWithdrawal, required PayoutPolicyConfig policy}) =>
      isFirstWithdrawal ? policy.trustHookMinInr : policy.standardMinInr;

  static String? validateAmount({
    required int? amountInr,
    required int minInr,
    required double availableInr,
    required bool isFirstWithdrawal,
    required int coinsPerInr,
    int? capInr,
  }) {
    if (amountInr == null || amountInr <= 0) return "Enter an amount in rupees.";
    if (amountInr < minInr) {
      final first = isFirstWithdrawal ? " for your first payout" : "";
      return "Minimum withdrawal is ${MoneyFormat.inr(minInr, whole: true)} (${MoneyFormat.coins(minInr * coinsPerInr)} coins)$first.";
    }
    if (capInr != null && capInr > 0 && amountInr > capInr) {
      return "Your tier allows up to ${MoneyFormat.inr(capInr, whole: true)} per withdrawal.";
    }
    if (amountInr > availableInr.floor()) {
      return "You can withdraw up to ${MoneyFormat.inr(availableInr.floor(), whole: true)}.";
    }
    return null;
  }

  static String? validateUpi(String value) => _upi.hasMatch(value.trim()) ? null : "Enter a valid UPI ID, like name@bank.";

  static String? validateHolderName(String value) =>
      _holder.hasMatch(value.trim()) ? null : "Enter the name exactly as on the bank account.";

  static String? validateAccountNumber(String value) =>
      _account.hasMatch(value.replaceAll(RegExp(r"\s+"), "")) ? null : "Account number must be 9–18 digits.";

  static String? validateIfsc(String value) => _ifsc.hasMatch(value.trim().toUpperCase()) ? null : "Enter a valid IFSC code, like SBIN0001234.";
}

class PayoutRequest {
  const PayoutRequest.upi({required this.amountInr, required String this.upiId})
      : method = PayoutMethod.upi,
        accountHolderName = null,
        accountNumber = null,
        ifsc = null;

  const PayoutRequest.bank({required this.amountInr, required String this.accountHolderName, required String this.accountNumber, required String this.ifsc})
      : method = PayoutMethod.bank,
        upiId = null;

  final int amountInr;
  final PayoutMethod method;
  final String? upiId;
  final String? accountHolderName;
  final String? accountNumber;
  final String? ifsc;

  Map<String, dynamic> toJson() => method == PayoutMethod.upi
      ? {"amountInr": amountInr, "method": "UPI", "upiId": upiId!.trim()}
      : {
          "amountInr": amountInr,
          "method": "BANK",
          "accountHolderName": accountHolderName!.trim(),
          "accountNumber": accountNumber!.replaceAll(RegExp(r"\s+"), ""),
          "ifsc": ifsc!.trim().toUpperCase(),
        };
}

class PayoutReceipt {
  const PayoutReceipt({required this.requestId, required this.amountInr, required this.convertedCoins, required this.isFirstWithdrawal});

  factory PayoutReceipt.fromJson(Map<String, dynamic> json) => PayoutReceipt(
        requestId: json["requestId"]?.toString() ?? "",
        amountInr: (json["amountInr"] as num?)?.round() ?? 0,
        convertedCoins: (json["convertedCoins"] as num?)?.round() ?? 0,
        isFirstWithdrawal: json["isFirstWithdrawal"] == true,
      );

  final String requestId;
  final int amountInr;
  final int convertedCoins;
  final bool isFirstWithdrawal;
}
