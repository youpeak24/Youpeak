import 'package:flutter_test/flutter_test.dart';
import 'package:youpeak/core/deep_link/referral_link.dart';
import 'package:youpeak/core/system_config/domain/system_configs.dart';
import 'package:youpeak/features/auth/phone/presentation/phone_login_view.dart';
import 'package:youpeak/features/payout/domain/payout_rules.dart';
import 'package:youpeak/features/peak_boost/domain/peak_boost.dart';
import 'package:youpeak/features/tasker/domain/tasker_dashboard.dart';

import '../support/fakes.dart';

void main() {
  group("Tasker level progress (Module 2)", () {
    test("progress = lifetime hours / next target x 100", () {
      expect(levelProgressPercent(lifetimeHours: 25, nextTargetHours: 50), 50);
      expect(levelProgressPercent(lifetimeHours: 12.5, nextTargetHours: 100), 12.5);
    });

    test("hours are cumulative: after reaching Level 1 at 50 h, 50 of 100 h = 50%", () {
      expect(levelProgressPercent(lifetimeHours: 50, nextTargetHours: 100), 50);
    });

    test("clamped to 0-100; top level is 100%", () {
      expect(levelProgressPercent(lifetimeHours: 900, nextTargetHours: 400), 100);
      expect(levelProgressPercent(lifetimeHours: -1, nextTargetHours: 50), 0);
      expect(levelProgressPercent(lifetimeHours: 999, nextTargetHours: null), 100);
    });

    test("dashboard JSON parses into the view model", () {
      final d = TaskerDashboard.fromJson(sampleDashboardJson());
      expect(d.tier.badge, "LEVEL 1");
      expect(d.tier.name, "Level 1 Tasker");
      expect(d.nextTier?.watchHoursRequired, 100);
      expect(d.progressPercent, 50);
      expect(d.today.likes.complete, isTrue);
      expect(d.today.comments.fraction, closeTo(0.2, 1e-9));
      expect(d.today.remainingCoins, 2500 - 640);
      expect(d.wallet.totalAvailableInr, 120);
      expect(d.payout.isFirstWithdrawal, isTrue);
      expect(d.milestone2.status, Milestone2Status.inProgress);
      expect(d.milestone2.fraction, closeTo(0.4, 1e-9));
      expect(d.milestone2.timeLeft(DateTime.utc(2026, 10, 1, 10)), const Duration(days: 1));
    });

    test("free tier badge and missing sections are tolerated", () {
      final d = TaskerDashboard.fromJson({"tier": {"rank": 0, "name": "Free Tasker"}});
      expect(d.tier.badge, "FREE");
      expect(d.nextTier, isNull);
      expect(d.progressPercent, 100);
      expect(d.milestone2.status, Milestone2Status.notTracked);
    });
  });

  group("Peak Boost validation (Module 4)", () {
    const config = PeakBoostConfig.defaults;

    test("custom boost range 100 – 1,000,000 coins", () {
      expect(validateBoostAmount("", config).isValid, isFalse);
      expect(validateBoostAmount("abc", config).error, contains("whole coins"));
      expect(validateBoostAmount("99", config).error, contains("₹1.00"));
      expect(validateBoostAmount("1000001", config).error, contains("₹10,000.00"));
      expect(validateBoostAmount("100", config).coins, 100);
      expect(validateBoostAmount("1,000,000", config).coins, 1000000);
    });

    test("affordability", () {
      expect(canAffordBoost(balance: 499, coins: 500), isFalse);
      expect(canAffordBoost(balance: 500, coins: 500), isTrue);
      expect(canAffordBoost(balance: 500, coins: 0), isFalse);
    });

    test("request ids are fresh 16-char hex idempotency keys", () {
      final a = newBoostRequestId();
      final b = newBoostRequestId();
      expect(a, matches(RegExp(r"^[0-9a-f]{16}$")));
      expect(a, isNot(b));
    });

    test("toast text", () {
      final r = PeakBoostReceipt.fromJson({"coins": 2000, "boosterName": "Asha"});
      expect(r.toastText, "Asha boosted 2,000 Coins!");
      expect(PeakBoostReceipt.fromJson({"coins": 100, "boosterName": "  "}).boosterName, "A fan");
    });
  });

  group("Withdrawal rules (Module 5)", () {
    const policy = PayoutPolicyConfig.defaults;

    test("Trust Hook: ₹100 on the first payout, ₹500 after", () {
      expect(PayoutRules.minimumInr(isFirstWithdrawal: true, policy: policy), 100);
      expect(PayoutRules.minimumInr(isFirstWithdrawal: false, policy: policy), 500);
    });

    String? amount(int? inr, {bool first = true, double available = 1000, int? cap}) => PayoutRules.validateAmount(
          amountInr: inr,
          minInr: first ? 100 : 500,
          availableInr: available,
          isFirstWithdrawal: first,
          coinsPerInr: 100,
          capInr: cap,
        );

    test("amount checks", () {
      expect(amount(null), isNotNull);
      expect(amount(99), contains("10,000 coins"));
      expect(amount(99), contains("first payout"));
      expect(amount(100), isNull);
      expect(amount(400, first: false), contains("₹500"));
      expect(amount(800, cap: 750), contains("₹750"));
      expect(amount(600, available: 550.8), contains("₹550"));
    });

    test("UPI / bank details", () {
      expect(PayoutRules.validateUpi("asha@okaxis"), isNull);
      expect(PayoutRules.validateUpi("asha.k-1@ybl"), isNull);
      expect(PayoutRules.validateUpi("asha"), isNotNull);
      expect(PayoutRules.validateUpi("@okaxis"), isNotNull);
      expect(PayoutRules.validateIfsc("sbin0001234"), isNull);
      expect(PayoutRules.validateIfsc("SBIN1001234"), isNotNull);
      expect(PayoutRules.validateAccountNumber("1234 5678 9012"), isNull);
      expect(PayoutRules.validateAccountNumber("12345"), isNotNull);
      expect(PayoutRules.validateHolderName("Asha K"), isNull);
      expect(PayoutRules.validateHolderName("1"), isNotNull);
    });

    test("request body is normalised the way the server expects", () {
      expect(const PayoutRequest.upi(amountInr: 100, upiId: " asha@okaxis ").toJson(), {"amountInr": 100, "method": "UPI", "upiId": "asha@okaxis"});
      expect(
        const PayoutRequest.bank(amountInr: 500, accountHolderName: "Asha K", accountNumber: "1234 5678 9012", ifsc: "sbin0001234").toJson(),
        {"amountInr": 500, "method": "BANK", "accountHolderName": "Asha K", "accountNumber": "123456789012", "ifsc": "SBIN0001234"},
      );
    });
  });

  group("Digital Partner links (youpeak.app/<CODE>)", () {
    test("8-char codes are recognised and upper-cased", () {
      expect(ReferralLink.codeFromPath(["AB12CD34"]), "AB12CD34");
      expect(ReferralLink.codeFromPath(["ab12cd34"]), "AB12CD34");
    });

    test("routes and other paths are not codes", () {
      expect(ReferralLink.codeFromPath(["share"]), isNull);
      expect(ReferralLink.codeFromPath(["download"]), isNull);
      expect(ReferralLink.codeFromPath(["share", "AB12CD34"]), isNull);
      expect(ReferralLink.codeFromPath(["AB-12"]), isNull);
      expect(ReferralLink.codeFromPath([]), isNull);
    });
  });

  group("Phone number formatting", () {
    test("Indian numbers need exactly 10 digits", () {
      expect(PhoneLoginView.toE164("91", "98765 43210"), "+919876543210");
      expect(PhoneLoginView.toE164("+91", "987654321"), isNull);
      expect(PhoneLoginView.toE164("1", "4155550123"), "+14155550123");
      expect(PhoneLoginView.toE164("", "9876543210"), isNull);
    });
  });
}
