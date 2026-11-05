import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:youpeak/core/network/app_api_client.dart';
import 'package:youpeak/features/peak_boost/domain/peak_boost.dart';

class PeakBoostRepository {
  const PeakBoostRepository(this._api);

  final AppApiClient _api;

  /// Atomic on the server: debit the booster, credit the creator 80%, record
  /// the platform's 20%. Same [requestId] = same boost, charged once.
  Future<PeakBoostReceipt> boost({required String videoId, required int coins, required String requestId}) async =>
      PeakBoostReceipt.fromJson(await _api.post("client/peakBoost", {"videoId": videoId, "coins": coins, "requestId": requestId}));

  /// What happened to the caller's boost [requestId] (asked after a timeout,
  /// before offering to boost again).
  Future<PeakBoostStatus> status(String requestId) async =>
      PeakBoostStatus.fromJson(await _api.get("client/peakBoost/status?requestId=${Uri.encodeQueryComponent(requestId)}"));
}

final peakBoostRepositoryProvider = Provider<PeakBoostRepository>((ref) => PeakBoostRepository(ref.watch(appApiClientProvider)));
