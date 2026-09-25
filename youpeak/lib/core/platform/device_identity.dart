import 'dart:math';

import 'package:flutter/foundation.dart';
import 'package:get_storage/get_storage.dart';
import 'package:mobile_device_identifier/mobile_device_identifier.dart';

// The device id the backend stores against an account. Android/iOS read the
// hardware identifier; a browser has none, so the web app generates a random
// id once and keeps it in local storage ("deviceId" is the same key the
// Database class uses and preserves across logout).
class DeviceIdentity {
  DeviceIdentity._();

  static Future<String?> get() async {
    if (!kIsWeb) return MobileDeviceIdentifier().getDeviceId();

    final saved = GetStorage().read<String>("deviceId");
    if (saved != null && saved.isNotEmpty) return saved;

    final random = Random.secure();
    return "web-${List.generate(16, (_) => random.nextInt(256).toRadixString(16).padLeft(2, "0")).join()}";
  }
}
