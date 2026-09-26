import 'package:flutter_riverpod/flutter_riverpod.dart';

/// The app's single Riverpod container.
///
/// Screens built with Riverpod read it through the UncontrolledProviderScope
/// in main.dart. The older GetX controllers and static helpers, which have no
/// BuildContext, use [appProviderContainer] directly, so both halves of the
/// app share one copy of the live config, security state and Tasker data.
final ProviderContainer appProviderContainer = ProviderContainer();
