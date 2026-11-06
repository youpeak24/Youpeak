/// Turns what the user typed into an E.164 number for Firebase.
class PhoneNumber {
  const PhoneNumber._();

  /// "91" + "98765 43210", "+91 98765 43210", "919876543210" or "09876543210"
  /// all become "+919876543210". Returns null when the input can't be a real
  /// mobile number, so nothing is sent to Firebase.
  static String? toE164(String countryCode, String number) {
    final cc = countryCode.replaceAll(RegExp(r"[^0-9]"), "");
    final trimmed = number.trim();
    var digits = trimmed.replaceAll(RegExp(r"[^0-9]"), "");

    // A number typed or pasted with its own "+" is already international.
    if (trimmed.startsWith("+")) {
      if (digits.length < 8 || digits.length > 15 || digits.startsWith("0")) return null;
      return _validIndia(digits) ? "+$digits" : null;
    }

    if (cc.isEmpty || cc.length > 3 || cc.startsWith("0")) return null;

    if (cc == "91") {
      // Pasted with the country code already on it, or with the 0 trunk prefix.
      if (digits.length == 12 && digits.startsWith("91")) digits = digits.substring(2);
      if (digits.length == 11 && digits.startsWith("0")) digits = digits.substring(1);
    }

    if (digits.length < 6 || cc.length + digits.length > 15) return null;
    final e164 = "+$cc$digits";
    return _validIndia(e164.substring(1)) ? e164 : null;
  }

  /// Indian mobile numbers are 10 digits starting 6-9; anything else is
  /// rejected here instead of costing a Firebase request.
  static bool _validIndia(String internationalDigits) {
    if (!internationalDigits.startsWith("91")) return true;
    return RegExp(r"^91[6-9][0-9]{9}$").hasMatch(internationalDigits);
  }
}
