import 'dart:async';

import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:youpeak/core/network/app_api_client.dart';
import 'package:youpeak/core/network/app_session.dart';
import 'package:youpeak/core/security/data/device_signal_collector.dart';
import 'package:youpeak/core/security/domain/security_signals.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'package:youpeak/core/system_config/presentation/system_configs_provider.dart';

final deviceSignalCollectorProvider = Provider<DeviceSignalCollector>((ref) => DeviceSignalCollector());

/// Anti-fraud gate for Tasker actions (ads, likes, comments, watch-time
/// earning): VPN / proxy, emulator, rooted or jailbroken device, one tasker
/// account per phone, and bot-like tapping.
///
/// On-device checks lock tasks instantly (e.g. the moment a VPN comes up);
/// the device is then attested to the backend (POST client/security/attest),
/// which adds its IP check and the device binding and is what reward
/// endpoints actually enforce. Re-checks on launch, resume, every network
/// change and once a minute.
final securityServiceProvider = NotifierProvider<SecurityService, TaskSecurityState>(SecurityService.new);

class SecurityService extends Notifier<TaskSecurityState> {
  static const _pollInterval = Duration(minutes: 1);

  final ActionCadenceMonitor _cadence = ActionCadenceMonitor();
  StreamSubscription<ConnectivityResult>? _connectivity;
  AppLifecycleListener? _lifecycle;
  Timer? _poll;
  Timer? _cooldownTimer;
  bool _busy = false;
  List<String> _lastLocalReasons = const [];
  DateTime? _lastAttestedAt;

  @override
  TaskSecurityState build() {
    _connectivity = Connectivity().onConnectivityChanged.listen((_) => recheck());
    _lifecycle = AppLifecycleListener(onResume: recheck);
    _poll = Timer.periodic(_pollInterval, (_) => recheck(attest: _attestationDue()));
    ref.onDispose(() {
      _connectivity?.cancel();
      _lifecycle?.dispose();
      _poll?.cancel();
      _cooldownTimer?.cancel();
    });
    Future.microtask(recheck);
    return const TaskSecurityState.checking();
  }

  bool _attestationDue() {
    final last = _lastAttestedAt;
    if (last == null) return true;
    final ttlHours = ref.read(systemConfigsProvider).appPolicy.security.attestationTtlHours;
    // Re-attest well before the server-side attestation expires.
    return DateTime.now().difference(last) > Duration(minutes: (ttlHours * 60 / 2).round().clamp(5, 24 * 60));
  }

  /// Re-run the on-device checks, and (by default) attest to the server.
  Future<void> recheck({bool attest = true}) async {
    if (_busy) return;
    _busy = true;
    try {
      final snapshot = await ref.read(deviceSignalCollectorProvider).collect();
      final policy = ref.read(systemConfigsProvider).appPolicy.security;
      final local = [
        ...localLockReasons(snapshot, policy),
        if (_cadence.isCoolingDown) LockReason.botActivity,
      ];

      // A local problem shows immediately; clearing one (VPN switched off)
      // forces a fresh attestation so the server lifts its lock too.
      final changed = local.join(",") != _lastLocalReasons.join(",");
      _lastLocalReasons = local;
      if (local.isNotEmpty) {
        state = TaskSecurityState(status: TaskSecurityStatus.locked, reasons: local, checkedAt: DateTime.now());
      }
      if (!(attest || changed) || !AppSession.isEstablished) {
        if (local.isEmpty && state.status != TaskSecurityStatus.allowed && !AppSession.isEstablished) {
          // Not signed in yet: nothing to attest, nothing locally wrong.
          state = TaskSecurityState(status: TaskSecurityStatus.allowed, checkedAt: DateTime.now());
        }
        return;
      }

      try {
        final res = await ref.read(appApiClientProvider).post("client/security/attest", snapshot.toAttestationBody());
        _lastAttestedAt = DateTime.now();
        final serverReasons = List<String>.from((res["reasons"] as List?) ?? const []);
        final reasons = {...local, ...serverReasons}.toList();
        state = TaskSecurityState(
          status: reasons.isEmpty ? TaskSecurityStatus.allowed : TaskSecurityStatus.locked,
          reasons: reasons,
          serverVerified: true,
          checkedAt: DateTime.now(),
        );
      } on ApiException catch (e) {
        AppSettings.showLog("device attestation failed => $e");
        if (local.isEmpty) {
          // Couldn't reach the server: stay usable, the reward endpoints
          // still refuse anything the server wouldn't accept.
          state = TaskSecurityState(status: TaskSecurityStatus.allowed, checkedAt: DateTime.now());
        }
      }
    } finally {
      _busy = false;
    }
  }

  /// Call before sending a task action (ad claim, like, comment). Returns
  /// false when the action must not be sent.
  bool allowTaskAction() {
    if (state.isLocked) return false;
    _cadence.minInterval = Duration(
      milliseconds: (ref.read(systemConfigsProvider).appPolicy.minSecondsBetweenRewardActions * 1000).round(),
    );
    switch (_cadence.record()) {
      case CadenceVerdict.allowed:
        return true;
      case CadenceVerdict.tooFast:
        return false;
      case CadenceVerdict.botSuspected:
        state = TaskSecurityState(
          status: TaskSecurityStatus.locked,
          reasons: {...state.reasons, LockReason.botActivity}.toList(),
          serverVerified: state.serverVerified,
          checkedAt: DateTime.now(),
        );
        _cooldownTimer?.cancel();
        final until = _cadence.lockedUntil;
        if (until != null) _cooldownTimer = Timer(until.difference(DateTime.now()), recheck);
        return false;
    }
  }
}
