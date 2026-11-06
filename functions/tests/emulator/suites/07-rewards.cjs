// Phase 2 (F-25): tasker rewards across midnight, reversals, the daily watch
// bonus under concurrency, and lifetime watch hours across resets/upgrades.
"use strict";

module.exports = async (h, check, assert) => {
  const { call, seedUser, idToken, setSettings, getUser, where, fsdb } = h;
  await setSettings({ minSecondsBetweenRewardActions: 0, joiningFeeINR: 0, adRewardCoins: 20, taskerCapBoost: { enabled: true, coins: 500 } });
  for (const tier of h.req("types/tiers").ALL_TIERS) await h.set("membershipTiers", tier._id, tier);
  const engine = h.req("util/rewardEngine");
  const ledger = h.req("util/watchLedger.service");
  const { loadSettings } = h.req("util/loadSettings");
  const yesterday = engine.todayStr(new Date(Date.now() - 86400e3));

  await check("RW-01", "business day is Asia/Kolkata whatever the host timezone (18:29:59Z = same day, 18:30Z = next)", async () => {
    assert.equal(engine.todayStr(new Date("2026-10-01T18:29:59.999Z")), "2026-10-01");
    assert.equal(engine.todayStr(new Date("2026-10-01T18:30:00.000Z")), "2026-10-02");
    assert.equal(engine.todayStr(new Date("2026-09-30T23:59:00.000Z")), "2026-10-01");
  });
  await check("RW-02", "first requests after midnight (stale counters at yesterday's cap): no credited count is lost to a stale reset", async () => {
    await seedUser("p7_midnight", { lastActivityDate: yesterday, dailyAdCountToday: 20, dailyEarningCoinsToday: 1000, coin: 5000 });
    const tok = await idToken("p7_midnight");
    const out = await Promise.all(Array.from({ length: 10 }, () => call("POST", "/client/userTaskReward/adWatch", { token: tok, body: {} })));
    const ok = out.filter((r) => r.json.status === true).length;
    const u = await getUser("p7_midnight");
    assert.ok(ok >= 1, "the new day must allow ad rewards again");
    assert.equal(u.lastActivityDate, engine.todayStr());
    assert.equal(u.dailyAdCountToday, ok, `count ${u.dailyAdCountToday} vs ${ok} credited`);
    assert.equal(u.dailyEarningCoinsToday, ok * 20);
    assert.equal(u.coin, 5000 + ok * 20);
  });
  await check("RW-03", "120-minute bonus under 3 parallel reports: paid once and capped by the day's room (800/1000 → +200)", async () => {
    await seedUser("p7_watch", { totalCurrentWatchTime: 119, totalWatchTime: 500, dailyEarningCoinsToday: 800, watchClaimAt: Date.now() - 10 * 60e3 });
    await loadSettings(true);
    const u0 = await getUser("p7_watch");
    const out = await Promise.all(Array.from({ length: 3 }, () => ledger.recordWatchProgress({ ...u0, _id: "p7_watch" }, 120, { maxSeconds: 180 })));
    const paid = out.reduce((s, r) => s + (r.milestoneCoins || 0), 0);
    const u = await getUser("p7_watch");
    assert.equal(paid, 200); assert.equal(u.dailyEarningCoinsToday, 1000);
    assert.equal((await where("histories", "userId", "p7_watch")).filter((x) => x.type === engine.HISTORY_TYPE.WATCH_TIME_MILESTONE).length, 1);
  });
  await check("RW-04", "like → unlike → re-like: net one like; double unlike reverses once", async () => {
    await seedUser("p7_like");
    await loadSettings(true);
    const like = () => engine.creditReward({ userId: "p7_like", kind: "like", historyType: 7, countField: "dailyLikesToday", capField: "maxLikesPerDay", dedupeVideoId: "p7_v" });
    const unlike = () => engine.reverseReward({ userId: "p7_like", videoId: "p7_v", historyType: 7, countField: "dailyLikesToday" });
    assert.equal((await like()).credited, 2);
    const both = await Promise.all([unlike(), unlike()]);
    assert.equal(both.filter((r) => r.ok).length, 1);
    let u = await getUser("p7_like");
    assert.equal(u.coin, 0); assert.equal(u.dailyLikesToday, 0); assert.equal(u.dailyEarningCoinsToday, 0);
    assert.equal((await like()).credited, 2);
    u = await getUser("p7_like");
    assert.equal(u.coin, 2); assert.equal(u.dailyLikesToday, 1);
  });
  await check("RW-05", "reversal never drives the balance negative (coins already spent → shortfall reported)", async () => {
    await seedUser("p7_spent");
    await loadSettings(true);
    await engine.creditReward({ userId: "p7_spent", kind: "comment", historyType: 8, countField: "dailyCommentsToday", capField: "maxCommentsPerDay", dedupeVideoId: "p7_c" });
    await fsdb.collection("users").doc("p7_spent").update({ coin: 1 });
    const r = await engine.reverseReward({ userId: "p7_spent", videoId: "p7_c", historyType: 8, countField: "dailyCommentsToday" });
    assert.equal(r.reversed, 1); assert.equal(r.shortfall, 4);
    assert.equal((await getUser("p7_spent")).coin, 0);
  });
  await check("RW-06", "lifetime watch minutes survive the daily reset and a free level-up (2999 + 1 → L1 at 3000)", async () => {
    await seedUser("p7_life", { lastActivityDate: yesterday, totalCurrentWatchTime: 90, totalWatchTime: 2999, membershipTierId: "tier_tasker_free", watchClaimAt: Date.now() - 5 * 60e3 });
    await loadSettings(true);
    const r = await ledger.recordWatchProgress({ ...(await getUser("p7_life")), _id: "p7_life" }, 60, { maxSeconds: 60 });
    assert.equal(r.ok, true, JSON.stringify(r));
    const u = await getUser("p7_life");
    assert.equal(u.totalWatchTime, 3000, "lifetime minutes must not reset");
    assert.equal(u.totalCurrentWatchTime, 1, "today's minutes restart after the reset");
    assert.equal(u.membershipTierId, "tier_tasker_bronze");
  });
  await check("RW-07", "+500 cap boost (capacity) and the 500-coin watch reward are separate values", async () => {
    await loadSettings(true);
    const free = await engine.getLimits({ membershipTierId: "tier_tasker_free" });
    const l4 = await engine.getLimits({ membershipTierId: "tier_tasker_platinum" });
    assert.equal(free.dailyEarningCapInCoins, 1000); assert.equal(l4.dailyEarningCapInCoins, 17167);
    assert.equal(free.reward.engagementWatch, 500);
    assert.deepEqual(free.capBoost, { enabled: true, coins: 500 });
    await setSettings({ taskerCapBoost: { enabled: false, coins: 500 } });
    const off = await engine.getLimits({ membershipTierId: "tier_tasker_free" });
    assert.equal(off.dailyEarningCapInCoins, 500); assert.equal(off.reward.engagementWatch, 500);
    await setSettings({ taskerCapBoost: { enabled: true, coins: 500 } });
  });
};
