import 'dart:io';

import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:device_info_plus/device_info_plus.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:flutter_jailbreak_detection/flutter_jailbreak_detection.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:youpeak/core/platform/device_identity.dart';
import 'package:youpeak/core/platform/platform_info.dart';
import 'package:youpeak/core/security/domain/security_signals.dart';
import 'package:youpeak/core/settings/app_settings.dart';

/// Reads the device's security signals. Every probe fails safe to "clean"
/// only where the platform genuinely can't tell (the server re-checks the
/// network side), and never throws.
class DeviceSignalCollector {
  static const _network = MethodChannel("youpeak/network_security");

  Future<DeviceSecuritySnapshot> collect() async {
    final platform = kIsWeb ? "web" : (PlatformInfo.isIOS ? "ios" : "android");
    final results = await Future.wait<Object?>([
      _deviceId(),
      _isPhysicalDevice(),
      _isRooted(),
      _networkSignals(),
      _appVersion(),
    ]);
    final network = results[3] as ({bool vpn, bool proxy});
    return DeviceSecuritySnapshot(
      platform: platform,
      deviceId: results[0] as String?,
      isPhysicalDevice: results[1] as bool,
      isRooted: results[2] as bool,
      vpnActive: network.vpn,
      proxyActive: network.proxy,
      appVersion: results[4] as String,
    );
  }

  Future<String?> _deviceId() async {
    try {
      return await DeviceIdentity.get().timeout(const Duration(seconds: 3));
    } catch (_) {
      return null;
    }
  }

  Future<bool> _isPhysicalDevice() async {
    if (kIsWeb) return true;
    try {
      final info = DeviceInfoPlugin();
      if (PlatformInfo.isIOS) return (await info.iosInfo).isPhysicalDevice;
      if (PlatformInfo.isAndroid) return (await info.androidInfo).isPhysicalDevice;
    } catch (e) {
      AppSettings.showLog("isPhysicalDevice check failed => $e");
    }
    return true;
  }

  Future<bool> _isRooted() async {
    if (kIsWeb) return false;
    try {
      return await FlutterJailbreakDetection.jailbroken;
    } catch (e) {
      AppSettings.showLog("root/jailbreak check failed => $e");
      return false;
    }
  }

  Future<({bool vpn, bool proxy})> _networkSignals() async {
    if (kIsWeb) return (vpn: false, proxy: false);
    var vpn = false;
    var proxy = false;

    // Android: NetworkCapabilities.TRANSPORT_VPN + the system proxy
    // (MainActivity.kt, channel "youpeak/network_security").
    if (PlatformInfo.isAndroid) {
      try {
        final info = await _network.invokeMapMethod<String, dynamic>("inspect");
        vpn = info?["vpnActive"] == true;
        proxy = ((info?["proxyHost"] as String?) ?? "").isNotEmpty;
      } catch (e) {
        AppSettings.showLog("network_security channel failed => $e");
      }
    }

    // Both platforms: the connectivity type, then tunnel interface names.
    try {
      if (await Connectivity().checkConnectivity() == ConnectivityResult.vpn) vpn = true;
    } catch (_) {}
    try {
      final interfaces = await NetworkInterface.list(includeLoopback: false, includeLinkLocal: true);
      if (interfaces.any((i) => isVpnInterfaceName(i.name, isIOS: PlatformInfo.isIOS))) vpn = true;
    } catch (_) {}

    return (vpn: vpn, proxy: proxy);
  }

  Future<String> _appVersion() async {
    try {
      final info = await PackageInfo.fromPlatform();
      return "${info.version}+${info.buildNumber}";
    } catch (_) {
      return "";
    }
  }
}
