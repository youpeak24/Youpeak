import 'dart:io';

/// Root (Android) / jailbreak (iOS) heuristics, in Dart.
///
/// The same class of checks root-detection plugins run: known `su` /
/// Magisk / SuperSU paths and `test-keys` system builds on Android; Cydia /
/// Sileo / Substrate / rootless-jailbreak paths and a write outside the app
/// sandbox on iOS. A determined user can hide root from any on-device check —
/// this is one signal among the server's (see util/taskSecurity.service.js),
/// and a Play Integrity / App Attest verdict is the stronger follow-up.
class RootDetector {
  RootDetector({bool Function(String path)? exists, bool Function(String path)? canWrite})
      : _exists = exists ?? _fileOrDirExists,
        _canWrite = canWrite ?? _tryWrite;

  final bool Function(String path) _exists;
  final bool Function(String path) _canWrite;

  static const androidPaths = [
    "/system/bin/su",
    "/system/xbin/su",
    "/sbin/su",
    "/system/su",
    "/system/bin/.ext/.su",
    "/system/usr/we-need-root/su-backup",
    "/system/xbin/daemonsu",
    "/data/local/su",
    "/data/local/bin/su",
    "/data/local/xbin/su",
    "/su/bin/su",
    "/cache/su",
    "/dev/su",
    "/system/app/Superuser.apk",
    "/system/app/SuperSU.apk",
    "/system/app/SuperSU",
    "/sbin/.magisk",
    "/data/adb/magisk",
    "/cache/.disable_magisk",
  ];

  static const iosPaths = [
    "/Applications/Cydia.app",
    "/Applications/Sileo.app",
    "/Applications/Zebra.app",
    "/Library/MobileSubstrate/MobileSubstrate.dylib",
    "/usr/lib/libsubstrate.dylib",
    "/bin/bash",
    "/usr/sbin/sshd",
    "/usr/bin/ssh",
    "/etc/apt",
    "/private/var/lib/apt/",
    "/private/var/lib/cydia",
    "/var/jb", // rootless jailbreaks (Dopamine, palera1n)
    "/var/binpack",
  ];

  /// [buildTags] is Android's Build.TAGS (device_info_plus AndroidDeviceInfo.tags).
  bool isRootedAndroid({String? buildTags}) {
    if ((buildTags ?? "").contains("test-keys")) return true;
    return androidPaths.any(_safeExists);
  }

  bool isJailbrokenIos() {
    if (iosPaths.any(_safeExists)) return true;
    // A sandboxed app can't write outside its container.
    return _canWrite("/private/yp_jb_check_${DateTime.now().microsecondsSinceEpoch}.txt");
  }

  bool _safeExists(String path) {
    try {
      return _exists(path);
    } catch (_) {
      return false;
    }
  }

  static bool _fileOrDirExists(String path) => FileSystemEntity.typeSync(path, followLinks: false) != FileSystemEntityType.notFound;

  static bool _tryWrite(String path) {
    try {
      final f = File(path)..writeAsStringSync("x");
      f.deleteSync();
      return true;
    } catch (_) {
      return false;
    }
  }
}
