import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:youpeak/core/network/app_api_client.dart';
import 'package:youpeak/features/tasker/data/tasker_repository.dart';
import 'package:youpeak/features/tasker/domain/tasker_dashboard.dart';
import 'package:youpeak/features/tasker/presentation/tasker_dashboard_provider.dart';

class _FailingTaskerRepo extends TaskerRepository {
  _FailingTaskerRepo(this.error) : super(AppApiClient());

  final Object error;
  int calls = 0;

  @override
  Future<TaskerDashboard> fetchDashboard() async {
    calls++;
    throw error;
  }
}

void main() {
  for (final error in const [
    ApiException("NETWORK_ERROR", "Couldn't reach YouPeak. Check your connection and try again."),
    ApiException("AUTH_REQUIRED", "Please sign in again to continue.", httpStatus: 401),
  ]) {
    test("${error.code}: shown at once as an error, not retried behind a spinner", () async {
      final repo = _FailingTaskerRepo(error);
      final container = ProviderContainer(overrides: [taskerRepositoryProvider.overrideWithValue(repo)]);
      addTearDown(container.dispose);
      final sub = container.listen(taskerDashboardProvider, (_, __) {});
      addTearDown(sub.close);

      await expectLater(container.read(taskerDashboardProvider.future), throwsA(isA<ApiException>()));
      // Riverpod's default policy would retry after 200 ms, 400 ms, ...
      await Future<void>.delayed(const Duration(milliseconds: 900));

      expect(repo.calls, 1);
      final state = container.read(taskerDashboardProvider);
      expect(state.hasError, isTrue);
      expect(state.isLoading, isFalse);
    });
  }
}
