import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:youpeak/features/tasker/data/tasker_repository.dart';
import 'package:youpeak/features/tasker/domain/tasker_dashboard.dart';

/// The signed-in Tasker's dashboard. Refreshed on pull-to-refresh and after
/// anything that changes it (a heartbeat milestone, a level-up, a boost, a
/// withdrawal).
///
/// No automatic retry: Riverpod 3 otherwise retries a failed load up to ten
/// times with back-off (~40 s, longer when requests time out), and the page
/// shows only its loading spinner the whole time. A failure is shown at once
/// instead, with "Try again" (or "Sign in" for an expired session).
final taskerDashboardProvider = AsyncNotifierProvider<TaskerDashboardNotifier, TaskerDashboard>(
  TaskerDashboardNotifier.new,
  retry: (retryCount, error) => null,
);

class TaskerDashboardNotifier extends AsyncNotifier<TaskerDashboard> {
  @override
  Future<TaskerDashboard> build() => ref.watch(taskerRepositoryProvider).fetchDashboard();

  /// Reload, keeping the current data on screen until the new copy arrives.
  Future<void> refresh() async {
    state = await AsyncValue.guard(() => ref.read(taskerRepositoryProvider).fetchDashboard());
  }
}
