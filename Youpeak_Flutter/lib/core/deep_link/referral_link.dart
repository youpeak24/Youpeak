import 'package:get_storage/get_storage.dart';

/// Digital Partner referral links: https://youpeak.app/<CODE>.
///
/// The code is remembered until the next sign-in, which applies it (the
/// backend's referral engine then starts Milestone 1 and the 7-day /
/// 100-minute Milestone 2 tracking for this user). Referral codes are the
/// backend's 8-character A–Z / 0–9 codes; one-segment paths that are app
/// routes are never treated as codes.
class ReferralLink {
  ReferralLink._();

  static const _storageKey = "pendingReferralCode";
  static final _code = RegExp(r"^[A-Za-z0-9]{6,12}$");
  static const _reserved = {"share", "video", "videos", "shorts", "channel", "login", "app", "download", "privacy", "terms"};

  /// The referral code in a link's path, or null.
  static String? codeFromPath(List<String> pathSegments) {
    final segments = pathSegments.where((s) => s.isNotEmpty).toList();
    if (segments.length != 1) return null;
    final candidate = segments.single;
    if (_reserved.contains(candidate.toLowerCase()) || !_code.hasMatch(candidate)) return null;
    return candidate.toUpperCase();
  }

  static void remember(String code) {
    try {
      GetStorage().write(_storageKey, code);
    } catch (_) {}
  }

  static String? get pending {
    try {
      final v = GetStorage().read<String>(_storageKey);
      return (v == null || v.isEmpty) ? null : v;
    } catch (_) {
      return null;
    }
  }

  static void clear() {
    try {
      GetStorage().remove(_storageKey);
    } catch (_) {}
  }
}
