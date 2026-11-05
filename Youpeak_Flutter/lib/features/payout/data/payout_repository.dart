import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:youpeak/core/network/app_api_client.dart';
import 'package:youpeak/features/payout/domain/payout_rules.dart';

class PayoutRepository {
  const PayoutRepository(this._api);

  final AppApiClient _api;

  /// Creates a PENDING withdrawal for admin approval. Any shortfall in the
  /// withdrawable ₹ balance is converted from coins by the server.
  Future<PayoutReceipt> request(PayoutRequest request) async => PayoutReceipt.fromJson(await _api.post("client/payout/request", request.toJson()));
}

final payoutRepositoryProvider = Provider<PayoutRepository>((ref) => PayoutRepository(ref.watch(appApiClientProvider)));
