import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:youpeak/core/security/data/root_detector.dart';
import 'package:youpeak/core/security/domain/security_signals.dart';
import 'package:youpeak/core/system_config/domain/system_configs.dart';

DeviceSecuritySnapshot snap({
  String platform = "android",
  String? deviceId = "hw-1",
  bool physical = true,
  bool rooted = false,
  bool vpn = false,
  bool proxy = false,
}) =>
    DeviceSecuritySnapshot(platform: platform, deviceId: deviceId, isPhysicalDevice: physical, isRooted: rooted, vpnActive: vpn, proxyActive: proxy, appVersion: "1.0.0+1");

void main() {
  group("VPN interface names", () {
    test("Android tunnels", () {
      for (final n in ["tun0", "ppp0", "pptp1", "ipsec0", "tap0", "wg0"]) {
        expect(isVpnInterfaceName(n, isIOS: false), isTrue, reason: n);
      }
      for (final n in ["wlan0", "rmnet_data0", "lo", "eth0"]) {
        expect(isVpnInterfaceName(n, isIOS: false), isFalse, reason: n);
      }
    });

    test("iOS utun interfaces are the system's own, not a VPN", () {
      expect(isVpnInterfaceName("utun0", isIOS: true), isFalse);
      expect(isVpnInterfaceName("utun4", isIOS: true), isFalse);
      expect(isVpnInterfaceName("ipsec0", isIOS: true), isTrue);
      expect(isVpnInterfaceName("ppp0", isIOS: true), isTrue);
    });
  });

  group("local lock reasons", () {
    const policy = SecurityPolicy.defaults;

    test("clean phone -> no reasons", () => expect(localLockReasons(snap(), policy), isEmpty));

    test("each signal maps to its reason", () {
      expect(localLockReasons(snap(vpn: true), policy), [LockReason.vpn]);
      expect(localLockReasons(snap(proxy: true), policy), [LockReason.proxy]);
      expect(localLockReasons(snap(physical: false), policy), [LockReason.emulator]);
      expect(localLockReasons(snap(rooted: true), policy), [LockReason.rooted]);
      expect(localLockReasons(snap(deviceId: ""), policy), [LockReason.noDeviceId]);
    });

    test("web: nothing is decided locally — the server's attestation decides, even when web earning is off", () {
      const webOff = SecurityPolicy(
        requireDeviceAttestation: true,
        attestationTtlHours: 24,
        blockVpn: true,
        blockEmulator: true,
        blockRooted: true,
        oneAccountPerDevice: true,
        allowWebTasking: false,
      );
      expect(localLockReasons(snap(platform: "web", deviceId: null), policy), isEmpty);
      expect(localLockReasons(snap(platform: "web", deviceId: null, physical: false), webOff), isEmpty);
    });

    test("a browser's attestation carries no device claims", () {
      final body = snap(platform: "web", deviceId: null).toAttestationBody();
      expect(body, {"platform": "web", "appVersion": "1.0.0+1"});
      expect(snap().toAttestationBody()["isPhysicalDevice"], isTrue, reason: "the app still reports its device signals");
    });

    test("admin switches turn rules off", () {
      const lenient = SecurityPolicy(
        requireDeviceAttestation: true,
        attestationTtlHours: 24,
        blockVpn: false,
        blockEmulator: false,
        blockRooted: false,
        oneAccountPerDevice: true,
        allowWebTasking: true,
      );
      expect(localLockReasons(snap(vpn: true, proxy: true, physical: false, rooted: true), lenient), isEmpty);
      expect(localLockReasons(snap(platform: "web", deviceId: null), lenient), isEmpty);
    });

    test("messages match the first reason", () {
      expect(lockMessage([LockReason.vpn, LockReason.rooted]), contains("VPN"));
      expect(lockMessage([LockReason.deviceLinked]), contains("another YouPeak tasker account"));
      expect(lockMessage(const []), "");
    });
  });

  group("ActionCadenceMonitor (bot filter)", () {
    late DateTime now;
    ActionCadenceMonitor monitor() => ActionCadenceMonitor(clock: () => now);

    setUp(() => now = DateTime(2026, 9, 27, 10));

    test("refuses actions closer than the minimum gap", () {
      final m = monitor();
      expect(m.record(), CadenceVerdict.allowed);
      now = now.add(const Duration(seconds: 1));
      expect(m.record(), CadenceVerdict.tooFast);
      now = now.add(const Duration(seconds: 3));
      expect(m.record(), CadenceVerdict.allowed);
    });

    test("machine-regular spacing is flagged and cools down", () {
      final m = monitor();
      CadenceVerdict? last;
      for (var i = 0; i < 6; i++) {
        last = m.record();
        now = now.add(const Duration(milliseconds: 4000)); // exactly 4.000 s every time
      }
      expect(last, CadenceVerdict.botSuspected);
      expect(m.isCoolingDown, isTrue);
      now = now.add(const Duration(minutes: 1));
      expect(m.record(), CadenceVerdict.botSuspected);
      now = now.add(const Duration(minutes: 5));
      expect(m.record(), CadenceVerdict.allowed);
    });

    test("human, irregular spacing is fine", () {
      final m = monitor();
      const gaps = [3500, 9000, 4200, 15000, 6100, 3300, 22000];
      for (final g in gaps) {
        expect(m.record(), CadenceVerdict.allowed);
        now = now.add(Duration(milliseconds: g));
      }
    });
  });

  group("RootDetector", () {
    test("clean Android: no su paths, release-keys", () {
      final d = RootDetector(exists: (_) => false);
      expect(d.isRootedAndroid(buildTags: "release-keys"), isFalse);
    });

    test("rooted Android: su binary, Magisk or test-keys", () {
      expect(RootDetector(exists: (p) => p == "/system/xbin/su").isRootedAndroid(buildTags: "release-keys"), isTrue);
      expect(RootDetector(exists: (p) => p == "/sbin/.magisk").isRootedAndroid(), isTrue);
      expect(RootDetector(exists: (_) => false).isRootedAndroid(buildTags: "test-keys"), isTrue);
    });

    test("iOS: jailbreak paths or a write outside the sandbox", () {
      expect(RootDetector(exists: (_) => false, canWrite: (_) => false).isJailbrokenIos(), isFalse);
      expect(RootDetector(exists: (p) => p == "/var/jb", canWrite: (_) => false).isJailbrokenIos(), isTrue);
      expect(RootDetector(exists: (_) => false, canWrite: (_) => true).isJailbrokenIos(), isTrue);
    });

    test("a probe that throws counts as absent", () {
      expect(RootDetector(exists: (_) => throw const FileSystemException("denied")).isRootedAndroid(), isFalse);
    });
  });
}
