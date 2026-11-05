/// Tasker dashboard, as computed by GET client/tasker/dashboard from the same
/// rules the server enforces (caps, the watch ledger, payout thresholds).
library;

int _i(Map<String, dynamic>? m, String k, [int d = 0]) {
  final v = m?[k];
  return v is num && v.isFinite ? v.round() : d;
}

double _d(Map<String, dynamic>? m, String k, [double d = 0]) {
  final v = m?[k];
  return v is num && v.isFinite ? v.toDouble() : d;
}

bool _b(Map<String, dynamic>? m, String k, [bool d = false]) {
  final v = m?[k];
  return v is bool ? v : d;
}

String? _s(Map<String, dynamic>? m, String k) {
  final v = m?[k];
  return v is String && v.isNotEmpty ? v : null;
}

Map<String, dynamic>? _m(Map<String, dynamic>? m, String k) {
  final v = m?[k];
  return v is Map ? Map<String, dynamic>.from(v) : null;
}

/// Progress to the next level: (lifetime watch hours / next level's target
/// hours) × 100, clamped to 0–100. Lifetime hours are cumulative and never
/// reset on level-up. At the top level there is no next target: 100%.
double levelProgressPercent({required double lifetimeHours, required double? nextTargetHours}) {
  if (nextTargetHours == null || nextTargetHours <= 0) return 100;
  return ((lifetimeHours / nextTargetHours) * 100).clamp(0, 100).toDouble();
}

class Quota {
  const Quota({required this.done, required this.limit});

  factory Quota.fromJson(Map<String, dynamic>? m) => Quota(done: _i(m, "done"), limit: _i(m, "limit"));

  final int done;
  final int limit;

  bool get complete => limit > 0 && done >= limit;
  double get fraction => limit <= 0 ? 0 : (done / limit).clamp(0, 1).toDouble();
}

class TierInfo {
  const TierInfo({required this.id, required this.rank, required this.level, required this.name, required this.isTopTier});

  factory TierInfo.fromJson(Map<String, dynamic>? m) => TierInfo(
        id: _s(m, "id"),
        rank: _i(m, "rank"),
        level: _i(m, "level", 1),
        name: _s(m, "name") ?? "Free Tasker",
        isTopTier: _b(m, "isTopTier"),
      );

  final String? id;
  final int rank;
  final int level;
  final String name;
  final bool isTopTier;

  /// "FREE" for rank 0, otherwise "LEVEL n".
  String get badge => rank == 0 ? "FREE" : "LEVEL $rank";
}

class NextTier {
  const NextTier({required this.id, required this.name, required this.watchHoursRequired, required this.membershipPriceInr});

  static NextTier? fromJson(Map<String, dynamic>? m) => m == null
      ? null
      : NextTier(
          id: _s(m, "id") ?? "",
          name: _s(m, "name") ?? "Next level",
          watchHoursRequired: _d(m, "watchHoursRequired"),
          membershipPriceInr: _i(m, "membershipPriceInr"),
        );

  final String id;
  final String name;
  final double watchHoursRequired;
  final int membershipPriceInr;
}

class TodayStats {
  const TodayStats({
    required this.earnedCoins,
    required this.capCoins,
    required this.capReached,
    required this.ads,
    required this.likes,
    required this.comments,
    required this.watchMinutes,
    required this.watchTargetMinutes,
    required this.watchBonusCoins,
    required this.watchBonusClaimed,
  });

  factory TodayStats.fromJson(Map<String, dynamic>? m) {
    final watch = _m(m, "watch");
    return TodayStats(
      earnedCoins: _i(m, "earnedCoins"),
      capCoins: _i(m, "capCoins"),
      capReached: _b(m, "capReached"),
      ads: Quota.fromJson(_m(m, "ads")),
      likes: Quota.fromJson(_m(m, "likes")),
      comments: Quota.fromJson(_m(m, "comments")),
      watchMinutes: _i(watch, "minutes"),
      watchTargetMinutes: _i(watch, "targetMinutes", 120),
      watchBonusCoins: _i(watch, "bonusCoins", 500),
      watchBonusClaimed: _b(watch, "bonusClaimed"),
    );
  }

  final int earnedCoins;
  final int capCoins;
  final bool capReached;
  final Quota ads;
  final Quota likes;
  final Quota comments;
  final int watchMinutes;
  final int watchTargetMinutes;
  final int watchBonusCoins;
  final bool watchBonusClaimed;

  Quota get watch => Quota(done: watchMinutes, limit: watchTargetMinutes);
  int get remainingCoins => (capCoins - earnedCoins).clamp(0, capCoins);
}

class WalletSummary {
  const WalletSummary({required this.coins, required this.withdrawableInr, required this.pendingReferralCoins, required this.coinsPerInr});

  factory WalletSummary.fromJson(Map<String, dynamic>? m) => WalletSummary(
        coins: _i(m, "coins"),
        withdrawableInr: _d(m, "withdrawableInr"),
        pendingReferralCoins: _i(m, "pendingReferralCoins"),
        coinsPerInr: _i(m, "coinsPerInr", 100),
      );

  final int coins;

  /// Already-converted ₹ waiting to be withdrawn.
  final double withdrawableInr;
  final int pendingReferralCoins;
  final int coinsPerInr;

  /// Everything the user could withdraw now: converted ₹ + coins at the rate.
  double get totalAvailableInr => withdrawableInr + coins / (coinsPerInr <= 0 ? 100 : coinsPerInr);
}

class PayoutStatus {
  const PayoutStatus({
    required this.completedPayouts,
    required this.hasPendingRequest,
    required this.minThresholdInr,
    required this.trustHookMinInr,
    required this.standardMinInr,
    required this.monthlyCapInr,
  });

  factory PayoutStatus.fromJson(Map<String, dynamic>? m) => PayoutStatus(
        completedPayouts: _i(m, "completedPayouts"),
        hasPendingRequest: _b(m, "hasPendingRequest"),
        minThresholdInr: _i(m, "minThresholdInr", 100),
        trustHookMinInr: _i(m, "trustHookMinInr", 100),
        standardMinInr: _i(m, "standardMinInr", 500),
        monthlyCapInr: m?["monthlyCapInr"] is num ? (m!["monthlyCapInr"] as num).round() : null,
      );

  final int completedPayouts;
  final bool hasPendingRequest;
  final int minThresholdInr;
  final int trustHookMinInr;
  final int standardMinInr;

  /// Null when the per-withdrawal tier cap isn't enforced.
  final int? monthlyCapInr;

  bool get isFirstWithdrawal => completedPayouts == 0;
}

enum Milestone2Status { notTracked, inProgress, achieved, expired, underReview }

class Milestone2 {
  const Milestone2({
    required this.status,
    required this.watchMinutes,
    required this.targetMinutes,
    required this.rewardCoins,
    this.deadlineAt,
  });

  factory Milestone2.fromJson(Map<String, dynamic>? m) {
    if (m == null || m["tracked"] != true) {
      return const Milestone2(status: Milestone2Status.notTracked, watchMinutes: 0, targetMinutes: 100, rewardCoins: 0);
    }
    final status = _b(m, "achieved")
        ? Milestone2Status.achieved
        : _b(m, "flagged")
            ? Milestone2Status.underReview
            : _b(m, "expired")
                ? Milestone2Status.expired
                : Milestone2Status.inProgress;
    return Milestone2(
      status: status,
      watchMinutes: _i(m, "cumulativeWatchMinutes"),
      targetMinutes: _i(m, "targetMinutes", 100),
      rewardCoins: _i(m, "rewardCoins"),
      deadlineAt: DateTime.tryParse(_s(m, "deadlineAt") ?? ""),
    );
  }

  final Milestone2Status status;
  final int watchMinutes;
  final int targetMinutes;
  final int rewardCoins;
  final DateTime? deadlineAt;

  double get fraction => targetMinutes <= 0 ? 1 : (watchMinutes / targetMinutes).clamp(0, 1).toDouble();

  Duration? timeLeft(DateTime now) {
    final d = deadlineAt;
    if (d == null) return null;
    final left = d.difference(now);
    return left.isNegative ? Duration.zero : left;
  }
}

class TaskerDashboard {
  const TaskerDashboard({
    required this.tier,
    required this.nextTier,
    required this.today,
    required this.lifetimeWatchHours,
    required this.wallet,
    required this.payout,
    required this.milestone2,
    required this.accessLocked,
    required this.activationUrl,
    required this.taskingLocked,
    required this.securityReasons,
    required this.securityMessage,
  });

  factory TaskerDashboard.fromJson(Map<String, dynamic> json) {
    final lifetime = _m(json, "lifetime");
    final access = _m(json, "access");
    final security = _m(json, "security");
    return TaskerDashboard(
      tier: TierInfo.fromJson(_m(json, "tier")),
      nextTier: NextTier.fromJson(_m(json, "nextTier")),
      today: TodayStats.fromJson(_m(json, "today")),
      lifetimeWatchHours: _d(lifetime, "watchHours"),
      wallet: WalletSummary.fromJson(_m(json, "wallet")),
      payout: PayoutStatus.fromJson(_m(json, "payout")),
      milestone2: Milestone2.fromJson(_m(json, "milestone2")),
      accessLocked: _b(access, "locked"),
      activationUrl: _s(access, "activationUrl"),
      taskingLocked: _b(security, "taskingLocked"),
      securityReasons: List<String>.from((security?["reasons"] as List?) ?? const []),
      securityMessage: _s(security, "message"),
    );
  }

  final TierInfo tier;
  final NextTier? nextTier;
  final TodayStats today;
  final double lifetimeWatchHours;
  final WalletSummary wallet;
  final PayoutStatus payout;
  final Milestone2 milestone2;
  final bool accessLocked;
  final String? activationUrl;
  final bool taskingLocked;
  final List<String> securityReasons;
  final String? securityMessage;

  double get progressPercent => levelProgressPercent(lifetimeHours: lifetimeWatchHours, nextTargetHours: nextTier?.watchHoursRequired);
}
