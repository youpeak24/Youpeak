import 'dart:convert';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:get_storage/get_storage.dart';

/// Where the published `system_configs/*` documents come from.
abstract class SystemConfigSource {
  /// Emits the document's data on every change (null if it doesn't exist).
  Stream<Map<String, dynamic>?> watch(String docId);
}

/// Live Firestore listener. The collection is world-readable (firestore.rules),
/// so this works before sign-in too.
class FirestoreSystemConfigSource implements SystemConfigSource {
  FirestoreSystemConfigSource([FirebaseFirestore? firestore]) : _firestore = firestore;

  final FirebaseFirestore? _firestore;

  @override
  Stream<Map<String, dynamic>?> watch(String docId) =>
      (_firestore ?? FirebaseFirestore.instance).collection("system_configs").doc(docId).snapshots().map((s) => s.data());
}

/// Last-known copy of each document, so a cold start offline still shows
/// the admin's values rather than the built-in defaults.
class SystemConfigCache {
  SystemConfigCache([GetStorage? box]) : _box = box;

  final GetStorage? _box;
  static const _prefix = "system_config_";

  GetStorage get _storage => _box ?? GetStorage();

  Map<String, dynamic>? read(String docId) {
    try {
      final raw = _storage.read<String>("$_prefix$docId");
      if (raw == null) return null;
      final decoded = jsonDecode(raw);
      return decoded is Map ? Map<String, dynamic>.from(decoded) : null;
    } catch (_) {
      return null;
    }
  }

  Future<void> write(String docId, Map<String, dynamic> data) async {
    try {
      // Timestamps and other non-JSON values are stored as strings; the
      // config fields themselves are all plain JSON.
      await _storage.write("$_prefix$docId", jsonEncode(data, toEncodable: (v) => v.toString()));
    } catch (_) {}
  }
}
