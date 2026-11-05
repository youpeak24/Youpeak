import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:youpeak/core/network/app_api_client.dart';
import 'package:youpeak/features/tasker/domain/tasker_dashboard.dart';

class TaskerRepository {
  const TaskerRepository(this._api);

  final AppApiClient _api;

  Future<TaskerDashboard> fetchDashboard() async => TaskerDashboard.fromJson(await _api.get("client/tasker/dashboard"));
}

final taskerRepositoryProvider = Provider<TaskerRepository>((ref) => TaskerRepository(ref.watch(appApiClientProvider)));
