import 'dart:async';

import 'package:youpeak/core/security/domain/security_signals.dart';
import 'package:youpeak/core/security/security_service.dart';
import 'package:youpeak/core/system_config/data/system_config_repository.dart';

/// system_configs source whose documents the test pushes by hand.
class FakeConfigSource implements SystemConfigSource {
  final Map<String, StreamController<Map<String, dynamic>?>> _docs = {};

  StreamController<Map<String, dynamic>?> _controller(String id) => _docs.putIfAbsent(id, StreamController<Map<String, dynamic>?>.broadcast);

  void publish(String id, Map<String, dynamic> data) => _controller(id).add(data);

  @override
  Stream<Map<String, dynamic>?> watch(String docId) => _controller(docId).stream;
}

/// Offline cache kept in memory (the real one uses GetStorage).
class InMemoryConfigCache extends SystemConfigCache {
  InMemoryConfigCache([Map<String, Map<String, dynamic>>? initial]) : store = {...?initial};

  final Map<String, Map<String, dynamic>> store;

  @override
  Map<String, dynamic>? read(String docId) => store[docId];

  @override
  Future<void> write(String docId, Map<String, dynamic> data) async => store[docId] = data;
}

/// Security gate with a fixed state and no platform listeners.
class FakeSecurityService extends SecurityService {
  FakeSecurityService([this.initial = const TaskSecurityState(status: TaskSecurityStatus.allowed)]);

  final TaskSecurityState initial;

  @override
  TaskSecurityState build() => initial;

  @override
  Future<void> recheck({bool attest = true}) async {}
}

/// GET client/tasker/dashboard, as the backend returns it (shape taken from
/// the emulator run of functions/backend/controllers/client/tasker.controller.js).
Map<String, dynamic> sampleDashboardJson({bool capReached = false, bool firstWithdrawal = true, bool milestone2 = true}) => {
      "status": true,
      "tier": {"id": "tier_tasker_bronze", "rank": 1, "level": 2, "name": "Level 1 Tasker", "isTopTier": false},
      "nextTier": {"id": "tier_tasker_silver", "name": "Level 2 Tasker", "watchHoursRequired": 100, "membershipPriceInr": 2499},
      "today": {
        "date": "2026-09-27",
        "earnedCoins": capReached ? 2500 : 640,
        "capCoins": 2500,
        "capReached": capReached,
        "ads": {"done": 7, "limit": 20},
        "likes": {"done": 10, "limit": 10},
        "comments": {"done": 1, "limit": 5},
        "watch": {"minutes": 45, "targetMinutes": 120, "bonusCoins": 500, "bonusClaimed": false},
      },
      "lifetime": {"watchMinutes": 3000, "watchHours": 50.0, "targetHours": 100, "progressPercent": 50},
      "wallet": {"coins": 12000, "coinsInr": 120, "withdrawableInr": 0, "pendingReferralCoins": 10000, "coinsPerInr": 100},
      "payout": {
        "completedPayouts": firstWithdrawal ? 0 : 2,
        "hasPendingRequest": false,
        "isFirstWithdrawal": firstWithdrawal,
        "minThresholdInr": firstWithdrawal ? 100 : 500,
        "trustHookMinInr": 100,
        "standardMinInr": 500,
        "monthlyCapInr": 750,
      },
      "milestone2": milestone2
          ? {
              "tracked": true,
              "referredByPartnerId": "user_103",
              "registeredAt": "2026-09-25T10:00:00.000Z",
              "deadlineAt": "2026-10-02T10:00:00.000Z",
              "cumulativeWatchMinutes": 40,
              "targetMinutes": 100,
              "rewardCoins": 10000,
              "achieved": false,
              "expired": false,
              "flagged": false,
            }
          : {"tracked": false},
      "access": {"locked": false, "reason": null, "activationUrl": "https://youpeak.in"},
      "security": {"taskingLocked": false, "reasons": [], "message": null, "attestedAt": "2026-09-27T09:00:00.000Z"},
    };
