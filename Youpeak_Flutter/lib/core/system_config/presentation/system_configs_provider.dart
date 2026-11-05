import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'package:youpeak/core/system_config/data/system_config_repository.dart';
import 'package:youpeak/core/system_config/domain/system_configs.dart';

final systemConfigSourceProvider = Provider<SystemConfigSource>((ref) => FirestoreSystemConfigSource());

final systemConfigCacheProvider = Provider<SystemConfigCache>((ref) => SystemConfigCache());

/// Live `system_configs/*`, starting from the cached copy (or the built-in
/// defaults) and updating the moment an admin saves a change.
final systemConfigsProvider = NotifierProvider<SystemConfigsNotifier, SystemConfigs>(SystemConfigsNotifier.new);

class SystemConfigsNotifier extends Notifier<SystemConfigs> {
  final List<StreamSubscription<Map<String, dynamic>?>> _subscriptions = [];

  @override
  SystemConfigs build() {
    final cache = ref.watch(systemConfigCacheProvider);
    final source = ref.watch(systemConfigSourceProvider);

    var initial = SystemConfigs.defaults;
    for (final id in SystemConfigs.docIds) {
      final cached = cache.read(id);
      if (cached != null) initial = initial.withDoc(id, cached);
    }

    for (final id in SystemConfigs.docIds) {
      _subscriptions.add(source.watch(id).listen(
        (data) {
          if (data == null) return; // not published yet — keep cache/defaults
          cache.write(id, data);
          state = state.withDoc(id, data);
        },
        // Offline or rules not deployed yet: keep the cached/default values.
        onError: (Object e) => AppSettings.showLog("system_configs/$id listen error => $e"),
      ));
    }
    ref.onDispose(() {
      for (final s in _subscriptions) {
        s.cancel();
      }
      _subscriptions.clear();
    });
    return initial;
  }
}
