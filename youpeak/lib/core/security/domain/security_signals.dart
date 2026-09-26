import 'dart:math' as math;

import 'package:youpeak/core/system_config/domain/system_configs.dart';

/// What the device can tell us about itself. Self-reported, so the server
/// treats it as a signal — its own IP check and one-account-per-device
/// binding are the parts a modified app can't simply skip.
class DeviceSecuritySnapshot {
  const DeviceSecuritySnapshot({
    required this.platform,
    required this.deviceId,
    required this.isPhysicalDevice,
    required this.isRooted,
    required this.vpnActive,
    required this.proxyActive,
    required this.appVersion,
  });

  /// "android" | "ios" | "web"
  final String platform;
  final String? deviceId;
  final bool isPhysicalDevice;
  final bool isRooted;
  final bool vpnActive;
  final bool proxyActive;
  final String appVersion;

  Map<String, dynamic> toAttestationBody() => {
        "platform": platform,
        "deviceId": deviceId ?? "",
        "isPhysicalDevice": isPhysicalDevice,
        "isRooted": isRooted,
        "vpnActive": vpnActive,
        "proxyActive": proxyActive,
        "appVersion": appVersion,
      };
}

/// Network interface names that mean a VPN tunnel is up.
///
/// iOS always has several `utun` interfaces for its own services (iCloud
/// Private Relay, Handoff, …), so `utun` alone is NOT a VPN there — only
/// ipsec/ppp/tap/tun are.
bool isVpnInterfaceName(String name, {required bool isIOS}) {
  final n = name.toLowerCase();
  if (isIOS) {
    return n.startsWith("ipsec") || n.startsWith("ppp") || n.startsWith("tap") || (n.startsWith("tun") && !n.startsWith("utun"));
  }
  return n.startsWith("tun") || n.startsWith("ppp") || n.startsWith("pptp") || n.startsWith("ipsec") || n.startsWith("tap") || n.startsWith("wg");
}

/// Reason codes (shared with the backend's util/taskSecurity.service.js).
abstract class LockReason {
  static const attestationRequired = "ATTESTATION_REQUIRED";
  static const webPlatform = "WEB_PLATFORM";
  static const emulator = "EMULATOR";
  static const rooted = "ROOTED";
  static const vpn = "VPN";
  static const proxy = "PROXY";
  static const datacenterIp = "DATACENTER_IP";
  static const noDeviceId = "NO_DEVICE_ID";
  static const deviceLinked = "DEVICE_LINKED_TO_OTHER_ACCOUNT";
  static const botActivity = "BOT_ACTIVITY";
}

const _messages = {
  LockReason.attestationRequired: "We couldn't verify this device yet. Check your connection and try again.",
  LockReason.webPlatform: "Tasks and rewards are available in the YouPeak mobile app only.",
  LockReason.emulator: "Tasks can't run on an emulator. Use a real phone.",
  LockReason.rooted: "Tasks can't run on a rooted or jailbroken device.",
  LockReason.vpn: "Turn off your VPN to continue earning.",
  LockReason.proxy: "Turn off your proxy to continue earning.",
  LockReason.datacenterIp: "Your network looks like a VPN or proxy. Switch to mobile data or home Wi-Fi.",
  LockReason.noDeviceId: "This device couldn't be verified. Update the app and try again.",
  LockReason.deviceLinked: "This phone is already linked to another YouPeak tasker account.",
  LockReason.botActivity: "Unusual tapping detected. Tasks are paused for a few minutes.",
};

String lockMessage(List<String> reasons) => reasons.isEmpty ? "" : _messages[reasons.first] ?? "Tasks are paused on this device.";

/// The reasons this device can decide on its own, instantly (the server adds
/// the IP check and the device binding when it attests).
List<String> localLockReasons(DeviceSecuritySnapshot s, SecurityPolicy policy) {
  final reasons = <String>[];
  if (s.platform == "web" && !policy.allowWebTasking) reasons.add(LockReason.webPlatform);
  if (policy.blockEmulator && !s.isPhysicalDevice) reasons.add(LockReason.emulator);
  if (policy.blockRooted && s.isRooted) reasons.add(LockReason.rooted);
  if (policy.blockVpn && s.vpnActive) reasons.add(LockReason.vpn);
  if (policy.blockVpn && s.proxyActive) reasons.add(LockReason.proxy);
  if (s.platform != "web" && (s.deviceId == null || s.deviceId!.isEmpty)) reasons.add(LockReason.noDeviceId);
  return reasons;
}

enum TaskSecurityStatus { checking, allowed, locked }

class TaskSecurityState {
  const TaskSecurityState({required this.status, this.reasons = const [], this.serverVerified = false, this.checkedAt});

  const TaskSecurityState.checking() : this(status: TaskSecurityStatus.checking);

  final TaskSecurityStatus status;
  final List<String> reasons;

  /// Whether the backend confirmed this state (device binding + IP check),
  /// rather than only the on-device checks.
  final bool serverVerified;
  final DateTime? checkedAt;

  bool get taskingAllowed => status == TaskSecurityStatus.allowed;
  bool get isLocked => status == TaskSecurityStatus.locked;
  String get message => lockMessage(reasons);
}

enum CadenceVerdict { allowed, tooFast, botSuspected }

/// Client-side bot filter for task actions (ad claims, likes, comments).
///
/// Refuses actions closer together than [minInterval] (the server enforces
/// the same gap), and flags a run of actions whose spacing is machine-regular
/// — people don't tap at identical intervals, scripts do.
class ActionCadenceMonitor {
  ActionCadenceMonitor({
    this.minInterval = const Duration(seconds: 3),
    this.window = 6,
    this.maxJitter = const Duration(milliseconds: 120),
    this.cooldown = const Duration(minutes: 5),
    DateTime Function()? clock,
  }) : _clock = clock ?? DateTime.now;

  Duration minInterval;
  final int window;
  final Duration maxJitter;
  final Duration cooldown;
  final DateTime Function() _clock;

  final List<DateTime> _accepted = [];
  DateTime? _lockedUntil;

  DateTime? get lockedUntil => _lockedUntil;

  bool get isCoolingDown {
    final until = _lockedUntil;
    return until != null && _clock().isBefore(until);
  }

  CadenceVerdict record() {
    final now = _clock();
    if (isCoolingDown) return CadenceVerdict.botSuspected;
    if (_accepted.isNotEmpty && now.difference(_accepted.last) < minInterval) return CadenceVerdict.tooFast;

    _accepted.add(now);
    if (_accepted.length > window) _accepted.removeAt(0);

    if (_accepted.length == window) {
      final gaps = [for (var i = 1; i < _accepted.length; i++) _accepted[i].difference(_accepted[i - 1]).inMilliseconds.toDouble()];
      final mean = gaps.reduce((a, b) => a + b) / gaps.length;
      final variance = gaps.map((g) => math.pow(g - mean, 2)).reduce((a, b) => a + b) / gaps.length;
      if (math.sqrt(variance) < maxJitter.inMilliseconds) {
        _lockedUntil = now.add(cooldown);
        _accepted.clear();
        return CadenceVerdict.botSuspected;
      }
    }
    return CadenceVerdict.allowed;
  }
}
