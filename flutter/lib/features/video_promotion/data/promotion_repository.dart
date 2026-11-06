import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:youpeak/core/network/app_api_client.dart';
import 'package:youpeak/features/video_promotion/data/promotion_models.dart';

List<Map<String, dynamic>> _list(dynamic v) => v is List ? v.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList() : const [];

/// Video promotion API (functions/backend/controllers/client/videoPromotion.controller.js).
/// Buying uses the shared payment flow (client/payment, purpose
/// "video_promotion"): the server prices the order from the plan id and
/// activates the campaign only after the gateway payment is verified.
class PromotionRepository {
  const PromotionRepository(this._api);

  final AppApiClient _api;

  Future<List<PromotionPlan>> plans() async => _list((await _api.get("client/videoPromotion/plans"))["plans"]).map(PromotionPlan.fromJson).toList();

  Future<List<PromotableVideo>> eligibleVideos() async =>
      _list((await _api.get("client/videoPromotion/eligibleVideos"))["videos"]).map(PromotableVideo.fromJson).toList();

  Future<List<PromotionCampaign>> myCampaigns() async => _list((await _api.get("client/videoPromotion/"))["campaigns"]).map(PromotionCampaign.fromJson).toList();

  Future<(PromotionCampaign, List<CampaignEvent>)> campaign(String id) async {
    final j = await _api.get("client/videoPromotion/campaign?campaignId=${Uri.encodeQueryComponent(id)}");
    return (PromotionCampaign.fromJson(Map<String, dynamic>.from(j["campaign"] as Map)), _list(j["events"]).map(CampaignEvent.fromJson).toList());
  }

  Future<List<PromotedPlacement>> placements({int limit = 2}) async =>
      _list((await _api.get("client/videoPromotion/placements?limit=$limit"))["placements"]).map(PromotedPlacement.fromJson).toList();

  /// Reports that a Promoted card was on screen; the server decides whether it counts.
  Future<void> reportImpression(String placementToken) async {
    try {
      await _api.post("client/videoPromotion/impression", {"placementToken": placementToken});
    } on ApiException {
      // Not counted (already counted today, campaign ended, offline…) — nothing to show.
    }
  }

  /// Creates (or, within 15 minutes, reuses) the unpaid order for this video and plan.
  Future<PromotionOrder> createOrder({required String videoId, required String planId}) async =>
      PromotionOrder.fromJson(await _api.post("client/payment/createOrder", {"purpose": "video_promotion", "gateway": "razorpay", "videoId": videoId, "planId": planId}));

  /// Sends the gateway's signed result to the server. Throws [ApiException]
  /// with the fulfilment code (e.g. PROCESSING) if activation isn't finished yet.
  Future<void> verify({required String orderId, required String paymentId, required String signature}) =>
      _api.post("client/payment/verify", {"orderId": orderId, "paymentId": paymentId, "signature": signature});

  Future<PaymentState> paymentState(String orderId) async =>
      PaymentState.fromJson(await _api.get("client/payment/status?orderId=${Uri.encodeQueryComponent(orderId)}"));
}

final promotionRepositoryProvider = Provider<PromotionRepository>((ref) => PromotionRepository(ref.watch(appApiClientProvider)));
