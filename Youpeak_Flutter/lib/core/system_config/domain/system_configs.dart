/// The app's live configuration, mirrored from Firestore `system_configs/*`
/// (published by the backend from the admin-managed settings).
///
/// Nothing money-related is hard-coded in the UI: reward values, caps, watch
/// targets, Peak Boost presets and payout thresholds all come from here. The
/// defaults below mirror the backend's launch defaults and are only used
/// until the first document arrives (or when the device has never been
/// online). The server always enforces from its own copy, so these values
/// decide what the app shows, never what it pays.
library;

int _int(Map<String, dynamic>? m, String key, int fallback) {
  final v = m?[key];
  if (v is num && v.isFinite) return v.round();
  return fallback;
}

double _double(Map<String, dynamic>? m, String key, double fallback) {
  final v = m?[key];
  if (v is num && v.isFinite) return v.toDouble();
  return fallback;
}

bool _bool(Map<String, dynamic>? m, String key, bool fallback) {
  final v = m?[key];
  return v is bool ? v : fallback;
}

String _string(Map<String, dynamic>? m, String key, String fallback) {
  final v = m?[key];
  return v is String && v.trim().isNotEmpty ? v.trim() : fallback;
}

Map<String, dynamic>? _map(Map<String, dynamic>? m, String key) {
  final v = m?[key];
  return v is Map ? Map<String, dynamic>.from(v) : null;
}

List<Map<String, dynamic>> _maps(Map<String, dynamic>? m, String key) {
  final v = m?[key];
  if (v is! List) return const [];
  return v.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList();
}

// ── tasker_tiers ────────────────────────────────────────────────────────────

class TaskerTierConfig {
  const TaskerTierConfig({
    required this.id,
    required this.rank,
    required this.level,
    required this.name,
    required this.membershipPriceInr,
    required this.watchHoursToUpgrade,
    required this.dailyCapCoins,
    required this.dailyAdLimit,
    required this.dailyLikeLimit,
    required this.dailyCommentLimit,
    required this.monthlyIncomeCapInr,
  });

  factory TaskerTierConfig.fromMap(Map<String, dynamic> m, int index) => TaskerTierConfig(
        id: _string(m, "id", "tier_$index"),
        rank: _int(m, "rank", index),
        level: _int(m, "level", index + 1),
        name: _string(m, "name", index == 0 ? "Free Tasker" : "Level $index Tasker"),
        membershipPriceInr: _int(m, "membershipPriceInr", 0),
        watchHoursToUpgrade: _double(m, "watchHoursToUpgrade", 0),
        dailyCapCoins: _int(m, "dailyCapCoins", 0),
        dailyAdLimit: _int(m, "dailyAdLimit", 20),
        dailyLikeLimit: _int(m, "dailyLikeLimit", 0),
        dailyCommentLimit: _int(m, "dailyCommentLimit", 0),
        monthlyIncomeCapInr: _int(m, "monthlyIncomeCapInr", 0),
      );

  final String id;

  /// 0 = Free Tasker, 1 = Level 1, … — the position on the ladder.
  final int rank;
  final int level;
  final String name;
  final int membershipPriceInr;
  final double watchHoursToUpgrade;
  final int dailyCapCoins;
  final int dailyAdLimit;
  final int dailyLikeLimit;
  final int dailyCommentLimit;
  final int monthlyIncomeCapInr;
}

class TaskerRewards {
  const TaskerRewards({
    required this.likeCoins,
    required this.dislikeCoins,
    required this.commentCoins,
    required this.adCoins,
    required this.engagementWatchMinutes,
    required this.engagementWatchBonusCoins,
  });

  factory TaskerRewards.fromMap(Map<String, dynamic>? m) => TaskerRewards(
        likeCoins: _int(m, "likeCoins", 2),
        dislikeCoins: _int(m, "dislikeCoins", 2),
        commentCoins: _int(m, "commentCoins", 5),
        adCoins: _int(m, "adCoins", 25),
        engagementWatchMinutes: _int(m, "engagementWatchMinutes", 120),
        engagementWatchBonusCoins: _int(m, "engagementWatchBonusCoins", 500),
      );

  final int likeCoins;
  final int dislikeCoins;
  final int commentCoins;
  final int adCoins;
  final int engagementWatchMinutes;
  final int engagementWatchBonusCoins;
}

class TaskerTiersConfig {
  const TaskerTiersConfig({
    required this.coinsPerInr,
    required this.universalDailyAdLimit,
    required this.capBoostCoins,
    required this.rewards,
    required this.tiers,
  });

  factory TaskerTiersConfig.fromMap(Map<String, dynamic>? m) {
    final tierMaps = _maps(m, "tiers");
    final tiers = [for (var i = 0; i < tierMaps.length; i++) TaskerTierConfig.fromMap(tierMaps[i], i)];
    return TaskerTiersConfig(
      coinsPerInr: _int(m, "coinsPerInr", 100).clamp(1, 1000000),
      universalDailyAdLimit: _int(m, "universalDailyAdLimit", 20),
      capBoostCoins: _int(m, "capBoostCoins", 500),
      rewards: TaskerRewards.fromMap(_map(m, "rewards")),
      tiers: tiers.isEmpty ? TaskerTiersConfig.defaults.tiers : tiers,
    );
  }

  static const defaults = TaskerTiersConfig(
    coinsPerInr: 100,
    universalDailyAdLimit: 20,
    capBoostCoins: 500,
    rewards: TaskerRewards(likeCoins: 2, dislikeCoins: 2, commentCoins: 5, adCoins: 25, engagementWatchMinutes: 120, engagementWatchBonusCoins: 500),
    tiers: [
      TaskerTierConfig(id: "tier_tasker_free", rank: 0, level: 1, name: "Free Tasker", membershipPriceInr: 0, watchHoursToUpgrade: 0, dailyCapCoins: 1000, dailyAdLimit: 20, dailyLikeLimit: 5, dailyCommentLimit: 2, monthlyIncomeCapInr: 300),
      TaskerTierConfig(id: "tier_tasker_bronze", rank: 1, level: 2, name: "Level 1 Tasker", membershipPriceInr: 999, watchHoursToUpgrade: 50, dailyCapCoins: 2500, dailyAdLimit: 20, dailyLikeLimit: 10, dailyCommentLimit: 5, monthlyIncomeCapInr: 750),
      TaskerTierConfig(id: "tier_tasker_silver", rank: 2, level: 3, name: "Level 2 Tasker", membershipPriceInr: 2499, watchHoursToUpgrade: 100, dailyCapCoins: 4500, dailyAdLimit: 20, dailyLikeLimit: 20, dailyCommentLimit: 10, monthlyIncomeCapInr: 1350),
      TaskerTierConfig(id: "tier_tasker_gold", rank: 3, level: 4, name: "Level 3 Tasker", membershipPriceInr: 4999, watchHoursToUpgrade: 200, dailyCapCoins: 12500, dailyAdLimit: 20, dailyLikeLimit: 40, dailyCommentLimit: 20, monthlyIncomeCapInr: 3750),
      TaskerTierConfig(id: "tier_tasker_platinum", rank: 4, level: 5, name: "Level 4 Tasker", membershipPriceInr: 9999, watchHoursToUpgrade: 400, dailyCapCoins: 17167, dailyAdLimit: 20, dailyLikeLimit: 60, dailyCommentLimit: 30, monthlyIncomeCapInr: 5150),
    ],
  );

  final int coinsPerInr;
  final int universalDailyAdLimit;
  final int capBoostCoins;
  final TaskerRewards rewards;
  final List<TaskerTierConfig> tiers;

  TaskerTierConfig? tierById(String? id) {
    for (final t in tiers) {
      if (t.id == id) return t;
    }
    return null;
  }
}

// ── peak_boost ──────────────────────────────────────────────────────────────

class PeakBoostPreset {
  const PeakBoostPreset({required this.name, required this.coins});

  final String name;
  final int coins;
}

class PeakBoostConfig {
  const PeakBoostConfig({
    required this.enabled,
    required this.minCoins,
    required this.maxCoins,
    required this.creatorPercent,
    required this.platformPercent,
    required this.presets,
  });

  factory PeakBoostConfig.fromMap(Map<String, dynamic>? m) {
    final presets = _maps(m, "presets")
        .map((p) => PeakBoostPreset(name: _string(p, "name", ""), coins: _int(p, "coins", 0)))
        .where((p) => p.name.isNotEmpty && p.coins > 0)
        .toList();
    final minCoins = _int(m, "minCoins", 100);
    return PeakBoostConfig(
      enabled: _bool(m, "enabled", true),
      minCoins: minCoins,
      maxCoins: _int(m, "maxCoins", 1000000).clamp(minCoins, 1 << 31),
      creatorPercent: _double(m, "creatorPercent", 80),
      platformPercent: _double(m, "platformPercent", 20),
      presets: presets.isEmpty && m == null ? PeakBoostConfig.defaults.presets : presets,
    );
  }

  static const defaults = PeakBoostConfig(
    enabled: true,
    minCoins: 100,
    maxCoins: 1000000,
    creatorPercent: 80,
    platformPercent: 20,
    presets: [
      PeakBoostPreset(name: "Starter Boost", coins: 100),
      PeakBoostPreset(name: "Mini Boost", coins: 500),
      PeakBoostPreset(name: "Super Boost", coins: 2000),
      PeakBoostPreset(name: "Mega Boost", coins: 5000),
      PeakBoostPreset(name: "Ultra Boost", coins: 10000),
    ],
  );

  final bool enabled;
  final int minCoins;
  final int maxCoins;
  final double creatorPercent;
  final double platformPercent;
  final List<PeakBoostPreset> presets;
}

// ── partner_program ─────────────────────────────────────────────────────────

class PartnerProgramConfig {
  const PartnerProgramConfig({
    required this.licenseFeeInr,
    required this.milestone1RewardCoins,
    required this.milestone2WatchMinutes,
    required this.milestone2WindowDays,
    required this.milestone2RewardCoins,
    required this.milestone2HoldHours,
    required this.referralLinkHost,
  });

  factory PartnerProgramConfig.fromMap(Map<String, dynamic>? m) {
    final m1 = _map(m, "milestone1");
    final m2 = _map(m, "milestone2");
    return PartnerProgramConfig(
      licenseFeeInr: _int(m, "licenseFeeInr", 25000),
      milestone1RewardCoins: _int(m1, "rewardCoins", 10000),
      milestone2WatchMinutes: _int(m2, "watchMinutes", 100),
      milestone2WindowDays: _int(m2, "windowDays", 7),
      milestone2RewardCoins: _int(m2, "rewardCoins", 10000),
      milestone2HoldHours: _int(m2, "holdHours", 48),
      referralLinkHost: _string(m, "referralLinkHost", "youpeak.app"),
    );
  }

  static const defaults = PartnerProgramConfig(
    licenseFeeInr: 25000,
    milestone1RewardCoins: 10000,
    milestone2WatchMinutes: 100,
    milestone2WindowDays: 7,
    milestone2RewardCoins: 10000,
    milestone2HoldHours: 48,
    referralLinkHost: "youpeak.app",
  );

  final int licenseFeeInr;
  final int milestone1RewardCoins;
  final int milestone2WatchMinutes;
  final int milestone2WindowDays;
  final int milestone2RewardCoins;
  final int milestone2HoldHours;
  final String referralLinkHost;
}

// ── payout_policy ───────────────────────────────────────────────────────────

class PayoutPolicyConfig {
  const PayoutPolicyConfig({
    required this.coinsPerInr,
    required this.trustHookMinInr,
    required this.standardMinInr,
    required this.enforceTierMonthlyCap,
  });

  factory PayoutPolicyConfig.fromMap(Map<String, dynamic>? m) => PayoutPolicyConfig(
        coinsPerInr: _int(m, "coinsPerInr", 100).clamp(1, 1000000),
        trustHookMinInr: _int(m, "trustHookMinInr", 100),
        standardMinInr: _int(m, "standardMinInr", 500),
        enforceTierMonthlyCap: _bool(m, "enforceTierMonthlyCap", true),
      );

  static const defaults = PayoutPolicyConfig(coinsPerInr: 100, trustHookMinInr: 100, standardMinInr: 500, enforceTierMonthlyCap: true);

  final int coinsPerInr;
  final int trustHookMinInr;
  final int standardMinInr;
  final bool enforceTierMonthlyCap;
}

// ── app_policy ──────────────────────────────────────────────────────────────

class SecurityPolicy {
  const SecurityPolicy({
    required this.requireDeviceAttestation,
    required this.attestationTtlHours,
    required this.blockVpn,
    required this.blockEmulator,
    required this.blockRooted,
    required this.oneAccountPerDevice,
    required this.allowWebTasking,
  });

  factory SecurityPolicy.fromMap(Map<String, dynamic>? m) => SecurityPolicy(
        requireDeviceAttestation: _bool(m, "requireDeviceAttestation", true),
        attestationTtlHours: _double(m, "attestationTtlHours", 24),
        blockVpn: _bool(m, "blockVpn", true),
        blockEmulator: _bool(m, "blockEmulator", true),
        blockRooted: _bool(m, "blockRooted", true),
        oneAccountPerDevice: _bool(m, "oneAccountPerDevice", true),
        allowWebTasking: _bool(m, "allowWebTasking", true),
      );

  static const defaults = SecurityPolicy(
    requireDeviceAttestation: true,
    attestationTtlHours: 24,
    blockVpn: true,
    blockEmulator: true,
    blockRooted: true,
    oneAccountPerDevice: true,
    allowWebTasking: true,
  );

  final bool requireDeviceAttestation;
  final double attestationTtlHours;
  final bool blockVpn;
  final bool blockEmulator;
  final bool blockRooted;
  final bool oneAccountPerDevice;
  final bool allowWebTasking;
}

class AppPolicyConfig {
  const AppPolicyConfig({
    required this.membershipPortalUrl,
    required this.joiningFeeInr,
    required this.heartbeatIntervalSeconds,
    required this.minSecondsBetweenRewardActions,
    required this.security,
  });

  factory AppPolicyConfig.fromMap(Map<String, dynamic>? m) => AppPolicyConfig(
        membershipPortalUrl: _string(m, "membershipPortalUrl", "https://youpeak.in"),
        joiningFeeInr: _int(m, "joiningFeeInr", 0),
        heartbeatIntervalSeconds: _int(m, "heartbeatIntervalSeconds", 10).clamp(5, 60),
        minSecondsBetweenRewardActions: _double(m, "minSecondsBetweenRewardActions", 3),
        security: SecurityPolicy.fromMap(_map(m, "security")),
      );

  static const defaults = AppPolicyConfig(
    membershipPortalUrl: "https://youpeak.in",
    joiningFeeInr: 0,
    heartbeatIntervalSeconds: 10,
    minSecondsBetweenRewardActions: 3,
    security: SecurityPolicy.defaults,
  );

  final String membershipPortalUrl;
  final int joiningFeeInr;
  final int heartbeatIntervalSeconds;
  final double minSecondsBetweenRewardActions;
  final SecurityPolicy security;
}

// ── all of it ───────────────────────────────────────────────────────────────

class SystemConfigs {
  const SystemConfigs({
    required this.taskerTiers,
    required this.peakBoost,
    required this.partnerProgram,
    required this.payoutPolicy,
    required this.appPolicy,
    this.liveDocs = const {},
  });

  static const docIds = ["tasker_tiers", "peak_boost", "partner_program", "payout_policy", "app_policy"];

  static const defaults = SystemConfigs(
    taskerTiers: TaskerTiersConfig.defaults,
    peakBoost: PeakBoostConfig.defaults,
    partnerProgram: PartnerProgramConfig.defaults,
    payoutPolicy: PayoutPolicyConfig.defaults,
    appPolicy: AppPolicyConfig.defaults,
  );

  final TaskerTiersConfig taskerTiers;
  final PeakBoostConfig peakBoost;
  final PartnerProgramConfig partnerProgram;
  final PayoutPolicyConfig payoutPolicy;
  final AppPolicyConfig appPolicy;

  /// Which documents came from the server (live or cached) rather than the
  /// built-in defaults.
  final Set<String> liveDocs;

  /// A copy with one document replaced by its published content.
  SystemConfigs withDoc(String id, Map<String, dynamic> data) {
    final live = {...liveDocs, id};
    switch (id) {
      case "tasker_tiers":
        return _copy(taskerTiers: TaskerTiersConfig.fromMap(data), liveDocs: live);
      case "peak_boost":
        return _copy(peakBoost: PeakBoostConfig.fromMap(data), liveDocs: live);
      case "partner_program":
        return _copy(partnerProgram: PartnerProgramConfig.fromMap(data), liveDocs: live);
      case "payout_policy":
        return _copy(payoutPolicy: PayoutPolicyConfig.fromMap(data), liveDocs: live);
      case "app_policy":
        return _copy(appPolicy: AppPolicyConfig.fromMap(data), liveDocs: live);
      default:
        return this;
    }
  }

  SystemConfigs _copy({
    TaskerTiersConfig? taskerTiers,
    PeakBoostConfig? peakBoost,
    PartnerProgramConfig? partnerProgram,
    PayoutPolicyConfig? payoutPolicy,
    AppPolicyConfig? appPolicy,
    required Set<String> liveDocs,
  }) =>
      SystemConfigs(
        taskerTiers: taskerTiers ?? this.taskerTiers,
        peakBoost: peakBoost ?? this.peakBoost,
        partnerProgram: partnerProgram ?? this.partnerProgram,
        payoutPolicy: payoutPolicy ?? this.payoutPolicy,
        appPolicy: appPolicy ?? this.appPolicy,
        liveDocs: liveDocs,
      );
}
