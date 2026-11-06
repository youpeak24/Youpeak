class AdCreditWalletData {
  final double available;
  final double plan;
  final double topup;
  final double bonus;
  final double expiringSoon;
  final String? expiringSoonDate;
  final int activeLotsCount;

  AdCreditWalletData({
    required this.available,
    required this.plan,
    required this.topup,
    required this.bonus,
    required this.expiringSoon,
    this.expiringSoonDate,
    required this.activeLotsCount,
  });

  factory AdCreditWalletData.fromJson(Map<String, dynamic> json) {
    return AdCreditWalletData(
      available: (json['available'] as num?)?.toDouble() ?? 0.0,
      plan: (json['plan'] as num?)?.toDouble() ?? 0.0,
      topup: (json['topup'] as num?)?.toDouble() ?? 0.0,
      bonus: (json['bonus'] as num?)?.toDouble() ?? 0.0,
      expiringSoon: (json['expiringSoon'] as num?)?.toDouble() ?? 0.0,
      expiringSoonDate: json['expiringSoonDate'] as String?,
      activeLotsCount: (json['activeLotsCount'] as num?)?.toInt() ?? 0,
    );
  }

  factory AdCreditWalletData.empty() {
    return AdCreditWalletData(
      available: 0.0,
      plan: 0.0,
      topup: 0.0,
      bonus: 0.0,
      expiringSoon: 0.0,
      expiringSoonDate: null,
      activeLotsCount: 0,
    );
  }
}

class AdCreditPack {
  final String id;
  final String name;
  final double credits;
  final double baseCredits;
  final double bonusCredits;
  final int bonusPercent;
  final double priceINR;
  final int validityDays;
  final bool isActive;

  AdCreditPack({
    required this.id,
    required this.name,
    required this.credits,
    required this.baseCredits,
    required this.bonusCredits,
    required this.bonusPercent,
    required this.priceINR,
    required this.validityDays,
    required this.isActive,
  });

  factory AdCreditPack.fromJson(Map<String, dynamic> json) {
    return AdCreditPack(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      credits: (json['credits'] as num?)?.toDouble() ?? 0.0,
      baseCredits: (json['baseCredits'] as num?)?.toDouble() ?? 0.0,
      bonusCredits: (json['bonusCredits'] as num?)?.toDouble() ?? 0.0,
      bonusPercent: (json['bonusPercent'] as num?)?.toInt() ?? 0,
      priceINR: (json['priceINR'] as num?)?.toDouble() ?? 0.0,
      validityDays: (json['validityDays'] as num?)?.toInt() ?? 730,
      isActive: json['isActive'] != false,
    );
  }
}

class AdCreditLedgerItem {
  final String id;
  final double credits;
  final double baseCredits;
  final double bonusCredits;
  final String direction; // CREDIT | DEBIT
  final String source; // TOPUP | STARTER_PASS | SPEND | EXPIRY | REVERSAL
  final String type; // BASE | BONUS | PLAN | MIXED
  final double balanceAfter;
  final String? purpose;
  final String createdAt;

  AdCreditLedgerItem({
    required this.id,
    required this.credits,
    required this.baseCredits,
    required this.bonusCredits,
    required this.direction,
    required this.source,
    required this.type,
    required this.balanceAfter,
    this.purpose,
    required this.createdAt,
  });

  factory AdCreditLedgerItem.fromJson(Map<String, dynamic> json) {
    return AdCreditLedgerItem(
      id: json['_id']?.toString() ?? json['id']?.toString() ?? '',
      credits: (json['credits'] as num?)?.toDouble() ?? 0.0,
      baseCredits: (json['baseCredits'] as num?)?.toDouble() ?? 0.0,
      bonusCredits: (json['bonusCredits'] as num?)?.toDouble() ?? 0.0,
      direction: json['direction']?.toString() ?? 'CREDIT',
      source: json['source']?.toString() ?? '',
      type: json['type']?.toString() ?? '',
      balanceAfter: (json['balanceAfter'] as num?)?.toDouble() ?? 0.0,
      purpose: json['purpose']?.toString(),
      createdAt: json['createdAt']?.toString() ?? '',
    );
  }
}
