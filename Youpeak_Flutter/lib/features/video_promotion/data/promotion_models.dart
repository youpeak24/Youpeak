import 'package:youpeak/core/utils/money_format.dart';

// Video promotion (DOC-20260826-WA0214 "Creator Growth & Video Promotion"
// rate card). Everything here comes from the server: the app never prices a
// plan, decides that a payment succeeded, or counts impressions itself.

int _int(dynamic v) => (v as num?)?.round() ?? 0;
double _num(dynamic v) => (v as num?)?.toDouble() ?? 0;
String _str(dynamic v) => v?.toString() ?? "";
DateTime? _date(dynamic v) => v == null ? null : DateTime.tryParse(v.toString())?.toLocal();

/// "2,000 – 2,500" (Indian digit grouping).
String impressionRange(int min, int max) => min == max ? MoneyFormat.coins(min) : "${MoneyFormat.coins(min)} – ${MoneyFormat.coins(max)}";

String durationLabel(int days) => days == 1 ? "1 day" : "$days days";

/// ₹ per 1,000 estimated impressions, with paise only when needed (₹19.60, ₹12).
String perThousandLabel(double value) => value == value.roundToDouble() ? MoneyFormat.inr(value, whole: true) : MoneyFormat.inr(value);

class PromotionPlan {
  const PromotionPlan({
    required this.id,
    required this.name,
    required this.priceInr,
    required this.impressionsMin,
    required this.impressionsMax,
    required this.durationDays,
    required this.targeting,
    required this.category,
    this.costPer1kLow,
    this.costPer1kHigh,
  });

  factory PromotionPlan.fromJson(Map<String, dynamic> j) => PromotionPlan(
        id: _str(j["id"]),
        name: _str(j["name"] ?? j["planName"]),
        priceInr: _num(j["priceINR"]),
        impressionsMin: _int(j["impressionsMin"]),
        impressionsMax: _int(j["impressionsMax"]),
        durationDays: _int(j["durationDays"]),
        targeting: _str(j["targeting"]).isEmpty ? "Global" : _str(j["targeting"]),
        category: _str(j["category"]),
        costPer1kLow: (j["costPer1kLow"] as num?)?.toDouble(),
        costPer1kHigh: (j["costPer1kHigh"] as num?)?.toDouble(),
      );

  final String id;
  final String name;
  final double priceInr;
  final int impressionsMin;
  final int impressionsMax;
  final int durationDays;
  final String targeting;
  final String category;
  final double? costPer1kLow;
  final double? costPer1kHigh;

  String get priceLabel => MoneyFormat.inr(priceInr, whole: true);
  String get impressionsLabel => impressionRange(impressionsMin, impressionsMax);
  String get durationText => durationLabel(durationDays);

  String? get costPer1kLabel {
    final lo = costPer1kLow, hi = costPer1kHigh;
    if (lo == null || hi == null) return null;
    return lo == hi ? perThousandLabel(lo) : "${perThousandLabel(lo)} – ${perThousandLabel(hi)}";
  }
}

/// The rate card's "30 × Starter vs Monthly Pro" comparison, computed from
/// the live catalogue (so it can't drift from the prices actually charged).
/// Null when the catalogue has no 1-day plan or no 30-day plan.
class PlanComparison {
  const PlanComparison({required this.daily, required this.monthly});

  final PromotionPlan daily;
  final PromotionPlan monthly;

  static PlanComparison? from(List<PromotionPlan> plans) {
    final dailies = plans.where((p) => p.durationDays == 1).toList()..sort((a, b) => a.priceInr.compareTo(b.priceInr));
    final monthlies = plans.where((p) => p.durationDays == 30).toList();
    if (dailies.isEmpty || monthlies.isEmpty) return null;
    return PlanComparison(daily: dailies.first, monthly: monthlies.first);
  }

  int get days => monthly.durationDays;
  double get dailyTotal => daily.priceInr * days;
  int get dailyImpressionsMin => daily.impressionsMin * days;
  int get dailyImpressionsMax => daily.impressionsMax * days;

  /// Reach ratio across the two estimate ranges: worst case (monthly low vs
  /// daily high) to best case (monthly high vs daily low). Not one fixed number.
  double get ratioLow => dailyImpressionsMax == 0 ? 0 : monthly.impressionsMin / dailyImpressionsMax;
  double get ratioHigh => dailyImpressionsMin == 0 ? 0 : monthly.impressionsMax / dailyImpressionsMin;

  /// Low end vs low end — the rate card's "3.3×".
  double get ratioLowToLow => dailyImpressionsMin == 0 ? 0 : monthly.impressionsMin / dailyImpressionsMin;
}

class PromotableVideo {
  const PromotableVideo({required this.id, required this.title, required this.image, required this.eligible, this.reason});

  factory PromotableVideo.fromJson(Map<String, dynamic> j) => PromotableVideo(
        id: _str(j["_id"]),
        title: _str(j["title"]),
        image: _str(j["videoImage"]),
        eligible: j["eligible"] == true,
        reason: j["reason"]?.toString(),
      );

  final String id;
  final String title;
  final String image;
  final bool eligible;
  final String? reason;
}

enum CampaignStatus { active, scheduled, paused, completed, expired, rejected, unknown }

CampaignStatus campaignStatusFrom(String s) => switch (s) {
      "active" => CampaignStatus.active,
      "scheduled" => CampaignStatus.scheduled,
      "paused" => CampaignStatus.paused,
      "completed" => CampaignStatus.completed,
      "expired" => CampaignStatus.expired,
      "rejected" => CampaignStatus.rejected,
      _ => CampaignStatus.unknown,
    };

String campaignStatusLabel(CampaignStatus s) => switch (s) {
      CampaignStatus.active => "Running",
      CampaignStatus.scheduled => "Starts soon",
      CampaignStatus.paused => "Paused by YouPeak",
      CampaignStatus.completed => "Delivered",
      CampaignStatus.expired => "Ended",
      CampaignStatus.rejected => "Taken down",
      CampaignStatus.unknown => "Processing",
    };

class PromotionCampaign {
  const PromotionCampaign({
    required this.id,
    required this.videoId,
    required this.videoTitle,
    required this.videoImage,
    required this.planName,
    required this.priceInr,
    required this.durationDays,
    required this.targeting,
    required this.status,
    required this.impressionsDelivered,
    required this.impressionsTargetMin,
    required this.impressionsTargetMax,
    this.startedAt,
    this.expiresAt,
    this.createdAt,
    this.rejectionReason,
  });

  factory PromotionCampaign.fromJson(Map<String, dynamic> j) {
    final plan = j["plan"] is Map ? Map<String, dynamic>.from(j["plan"]) : const <String, dynamic>{};
    final video = j["video"] is Map ? Map<String, dynamic>.from(j["video"]) : const <String, dynamic>{};
    return PromotionCampaign(
      id: _str(j["_id"]),
      videoId: _str(j["videoId"]),
      videoTitle: _str(video["title"]),
      videoImage: _str(video["videoImage"]),
      planName: _str(plan["name"] ?? j["planName"]),
      priceInr: _num(plan["priceINR"] ?? j["planPriceINR"]),
      durationDays: _int(plan["durationDays"]),
      targeting: _str(plan["targeting"]).isEmpty ? "Global" : _str(plan["targeting"]),
      status: campaignStatusFrom(_str(j["status"])),
      impressionsDelivered: _int(j["impressionsDelivered"]),
      impressionsTargetMin: _int(j["impressionsTargetMin"] ?? plan["impressionsMin"]),
      impressionsTargetMax: _int(j["impressionsTargetMax"] ?? plan["impressionsMax"]),
      startedAt: _date(j["startedAt"]),
      expiresAt: _date(j["expiresAt"]),
      createdAt: _date(j["createdAt"]),
      rejectionReason: j["rejectionReason"]?.toString(),
    );
  }

  final String id;
  final String videoId;
  final String videoTitle;
  final String videoImage;
  final String planName;
  final double priceInr;
  final int durationDays;
  final String targeting;
  final CampaignStatus status;
  final int impressionsDelivered;
  final int impressionsTargetMin;
  final int impressionsTargetMax;
  final DateTime? startedAt;
  final DateTime? expiresAt;
  final DateTime? createdAt;
  final String? rejectionReason;

  String get estimateLabel => impressionRange(impressionsTargetMin, impressionsTargetMax);
}

class CampaignEvent {
  const CampaignEvent({required this.type, required this.at, this.reason});

  factory CampaignEvent.fromJson(Map<String, dynamic> j) => CampaignEvent(type: _str(j["type"]), at: _date(j["at"]), reason: j["reason"]?.toString());

  final String type;
  final DateTime? at;
  final String? reason;

  String get label => switch (type) {
        "activated" => "Payment verified — promotion started",
        "scheduled_after_running_campaign" => "Payment verified — queued after your running promotion",
        "reviewed" => "Reviewed by YouPeak",
        "paused" => "Paused by YouPeak",
        "resumed" => "Resumed (paused time added back)",
        "rejected" => "Taken down by YouPeak",
        "expired" => "Ended (duration complete)",
        "completed" => "Ended (upper estimate delivered)",
        _ => type,
      };
}

class PromotedPlacement {
  const PromotedPlacement({required this.campaignId, required this.token, required this.videoId, required this.title, required this.image, required this.videoUrl});

  factory PromotedPlacement.fromJson(Map<String, dynamic> j) {
    final v = j["video"] is Map ? Map<String, dynamic>.from(j["video"]) : const <String, dynamic>{};
    return PromotedPlacement(
      campaignId: _str(j["campaignId"]),
      token: j["placementToken"]?.toString(),
      videoId: _str(v["_id"]),
      title: _str(v["title"]),
      image: _str(v["videoImage"]),
      videoUrl: _str(v["videoUrl"]),
    );
  }

  final String campaignId;
  final String? token;
  final String videoId;
  final String title;
  final String image;
  final String videoUrl;
}

/// A promotion order as created by the server (price set server-side).
class PromotionOrder {
  const PromotionOrder({required this.orderId, required this.amountInr, required this.checkout, required this.reused});

  factory PromotionOrder.fromJson(Map<String, dynamic> j) => PromotionOrder(
        orderId: _str(j["orderId"] ?? (j["checkout"] is Map ? j["checkout"]["order_id"] : null)),
        amountInr: _num(j["amountInr"]),
        checkout: j["checkout"] is Map ? Map<String, dynamic>.from(j["checkout"]) : const {},
        reused: j["reused"] == true,
      );

  final String orderId;
  final double amountInr;
  final Map<String, dynamic> checkout;
  final bool reused;
}

/// The server's view of one order (client/payment/status).
class PaymentState {
  const PaymentState({required this.paid, required this.fulfilled, required this.fulfilmentStatus, this.campaignId});

  factory PaymentState.fromJson(Map<String, dynamic> j) {
    final t = j["transaction"] is Map ? Map<String, dynamic>.from(j["transaction"]) : const <String, dynamic>{};
    return PaymentState(
      paid: _str(t["status"]) == "paid" || t["fulfilled"] == true,
      fulfilled: t["fulfilled"] == true,
      fulfilmentStatus: _str(t["fulfilmentStatus"]),
      campaignId: t["campaignId"]?.toString(),
    );
  }

  final bool paid;
  final bool fulfilled;
  final String fulfilmentStatus;
  final String? campaignId;
}
