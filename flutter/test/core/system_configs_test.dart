import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:youpeak/core/system_config/domain/system_configs.dart';
import 'package:youpeak/core/system_config/presentation/system_configs_provider.dart';

import '../support/fakes.dart';

void main() {
  group("SystemConfigs parsing", () {
    test("defaults mirror the backend launch values", () {
      const c = SystemConfigs.defaults;
      expect(c.taskerTiers.coinsPerInr, 100);
      expect(c.taskerTiers.tiers.map((t) => t.dailyCapCoins), [1000, 2500, 4500, 12500, 17167]);
      expect(c.taskerTiers.tiers.map((t) => t.watchHoursToUpgrade), [0, 50, 100, 200, 400]);
      expect(c.taskerTiers.universalDailyAdLimit, 20);
      expect(c.peakBoost.presets.map((p) => p.coins), [100, 500, 2000, 5000, 10000]);
      expect(c.peakBoost.minCoins, 100);
      expect(c.peakBoost.maxCoins, 1000000);
      expect(c.payoutPolicy.trustHookMinInr, 100);
      expect(c.payoutPolicy.standardMinInr, 500);
      expect(c.partnerProgram.milestone2WatchMinutes, 100);
      expect(c.partnerProgram.milestone2WindowDays, 7);
      expect(c.liveDocs, isEmpty);
    });

    test("a published doc replaces its section and is marked live", () {
      final c = SystemConfigs.defaults.withDoc("peak_boost", {
        "enabled": true,
        "minCoins": 200,
        "maxCoins": 50000,
        "creatorPercent": 75,
        "platformPercent": 25,
        "presets": [
          {"name": "Small", "coins": 200},
          {"name": "Big", "coins": 20000},
        ],
      });
      expect(c.peakBoost.minCoins, 200);
      expect(c.peakBoost.creatorPercent, 75);
      expect(c.peakBoost.presets.map((p) => p.name), ["Small", "Big"]);
      expect(c.liveDocs, {"peak_boost"});
      // other sections untouched
      expect(c.payoutPolicy.standardMinInr, 500);
    });

    test("bad values fall back instead of crashing", () {
      final c = SystemConfigs.defaults.withDoc("payout_policy", {"trustHookMinInr": "a lot", "standardMinInr": null, "coinsPerInr": 0});
      expect(c.payoutPolicy.trustHookMinInr, 100);
      expect(c.payoutPolicy.standardMinInr, 500);
      expect(c.payoutPolicy.coinsPerInr, 1); // clamped, never divides by zero
      final t = SystemConfigs.defaults.withDoc("tasker_tiers", {"tiers": "nope"});
      expect(t.taskerTiers.tiers.length, 5); // empty/invalid tier list keeps the defaults
    });

    test("tier ladder parses rank, caps and targets", () {
      final c = SystemConfigs.defaults.withDoc("tasker_tiers", {
        "coinsPerInr": 100,
        "tiers": [
          {"id": "tier_tasker_free", "rank": 0, "name": "Free Tasker", "dailyCapCoins": 1000, "watchHoursToUpgrade": 0},
          {"id": "tier_tasker_bronze", "rank": 1, "name": "Level 1 Tasker", "dailyCapCoins": 2500, "watchHoursToUpgrade": 50},
        ],
      });
      expect(c.taskerTiers.tierById("tier_tasker_bronze")?.watchHoursToUpgrade, 50);
      expect(c.taskerTiers.tierById("missing"), isNull);
    });

    test("app policy: security switches and heartbeat interval clamp", () {
      final c = SystemConfigs.defaults.withDoc("app_policy", {
        "membershipPortalUrl": "https://youpeak.in/join",
        "heartbeatIntervalSeconds": 1,
        "security": {"allowWebTasking": true, "blockVpn": false},
      });
      expect(c.appPolicy.membershipPortalUrl, "https://youpeak.in/join");
      expect(c.appPolicy.heartbeatIntervalSeconds, 5);
      expect(c.appPolicy.security.allowWebTasking, isTrue);
      expect(c.appPolicy.security.blockVpn, isFalse);
      expect(c.appPolicy.security.blockEmulator, isTrue);
    });
  });

  group("SystemConfigsNotifier", () {
    test("starts from the offline cache, then follows live Firestore updates", () async {
      final source = FakeConfigSource();
      final cache = InMemoryConfigCache({
        "payout_policy": {"trustHookMinInr": 150, "standardMinInr": 600},
      });
      final container = ProviderContainer(overrides: [
        systemConfigSourceProvider.overrideWithValue(source),
        systemConfigCacheProvider.overrideWithValue(cache),
      ]);
      addTearDown(container.dispose);

      final initial = container.read(systemConfigsProvider);
      expect(initial.payoutPolicy.trustHookMinInr, 150); // cached admin value, not the default
      expect(initial.peakBoost.minCoins, 100); // never cached -> default

      source.publish("payout_policy", {"trustHookMinInr": 100, "standardMinInr": 500});
      source.publish("peak_boost", {"enabled": false, "minCoins": 100, "maxCoins": 1000, "presets": []});
      await Future<void>.delayed(Duration.zero);

      final live = container.read(systemConfigsProvider);
      expect(live.payoutPolicy.trustHookMinInr, 100);
      expect(live.peakBoost.enabled, isFalse);
      expect(live.liveDocs, containsAll(["payout_policy", "peak_boost"]));
      expect(cache.store["peak_boost"]?["enabled"], isFalse); // written through for next cold start
    });
  });
}
