// Phase 2 (F-23): Peak Boost settles in one Firestore transaction — viewer
// debit = creator credit + platform share, all durable or nothing.
"use strict";

module.exports = async (h, check, assert) => {
  const { call, seedUser, idToken, setSettings, nowIso, set, get, getUser, where } = h;
  await setSettings({ peakBoost: { enabled: true, minCoins: 100, maxCoins: 1000000 } });

  const creator = "p4_creator";
  await seedUser(creator, { coin: 0 });
  await set("videos", "p4_vid", { userId: creator, channelId: creator, title: "p4", isActive: true, videoType: 1, scheduleType: 2, visibilityType: 1, moderationStatus: "approved", createdAt: nowIso() });

  let n = 0;
  const rid = () => `p4req${String(++n).padStart(6, "0")}xx`;
  const boost = (tok, coins, requestId = rid(), videoId = "p4_vid") => call("POST", "/client/peakBoost", { token: tok, body: { videoId, coins, requestId } });

  async function fresh(id, coin) { await seedUser(id, { coin }); return idToken(id); }

  // Conservation for one boost: viewer debit = creator credit + platform share (ledger).
  async function conserved(boostId, T) {
    const b = await get("peakBoosts", boostId);
    const ledger = await get(h.db.normalizeCollectionName("revenueLedger"), `rev_${boostId}`);
    assert.ok(b && ledger, "boost and ledger rows must exist");
    assert.equal(b.creatorCoins + b.platformCoins, T);
    assert.equal(ledger.creatorCoins + ledger.platformCoins + ledger.referrerCoins, T);
    assert.equal(ledger.platformCoins, b.platformCoins, "platform share durable in the ledger");
    const credit = await get("histories", `rev_${boostId}_creator`);
    assert.equal(credit.coin, b.creatorCoins);
    return b;
  }

  await check("PB-01", "amounts 100 / 101 / 500 / 2,000 / 10,000 / 1,000,000: debit = creator + platform, 80/20 by the implemented rounding", async () => {
    const tok = await fresh("p4_rich", 2000000);
    const c0 = (await getUser(creator)).coin;
    let paid = 0, credited = 0;
    for (const T of [100, 101, 500, 2000, 10000, 1000000]) {
      const r = await boost(tok, T);
      assert.equal(r.json.status, true, `${T}: ${JSON.stringify(r.json)}`);
      const b = await conserved(r.json.boostId, T);
      assert.equal(b.creatorCoins, Math.round(T * 0.8), `${T}: creator share`);
      paid += T; credited += b.creatorCoins;
    }
    assert.equal((await getUser("p4_rich")).coin, 2000000 - paid);
    assert.equal((await getUser(creator)).coin, c0 + credited);
  });
  await check("PB-02", "invalid amounts are refused with no state change (99, max+1, 0, -100, 150.5, '200', null)", async () => {
    const tok = await fresh("p4_inv", 5000000);
    for (const T of [99, 1000001, 0, -100, 150.5, "200", null]) {
      const r = await boost(tok, T);
      assert.equal(r.json.code, "INVALID_AMOUNT", `${JSON.stringify(T)} -> ${JSON.stringify(r.json)}`);
    }
    assert.equal((await getUser("p4_inv")).coin, 5000000);
    assert.equal((await where("peakBoosts", "boosterId", "p4_inv")).length, 0);
  });
  await check("PB-03", "insufficient funds refused; exact balance succeeds and leaves 0", async () => {
    const tok = await fresh("p4_exact", 500);
    const r1 = await boost(tok, 501);
    assert.equal(r1.json.code, "INSUFFICIENT_BALANCE");
    const r2 = await boost(tok, 500);
    assert.equal(r2.json.status, true, JSON.stringify(r2.json));
    assert.equal((await getUser("p4_exact")).coin, 0);
  });
  await check("PB-04", "same requestId replayed returns the first result and charges once; different payload -> 409", async () => {
    const tok = await fresh("p4_dup", 10000);
    const id = rid();
    const a = await boost(tok, 1000, id);
    const b = await boost(tok, 1000, id);
    assert.equal(a.json.status, true); assert.equal(b.json.status, true);
    assert.equal(a.json.boostId, b.json.boostId);
    assert.equal((await getUser("p4_dup")).coin, 9000);
    const c = await boost(tok, 2000, id);
    assert.equal(c.status, 409); assert.equal(c.json.code, "REQUEST_ID_REUSED");
    assert.equal((await getUser("p4_dup")).coin, 9000);
  });
  await check("PB-05", "rapid double tap (10 parallel, one requestId) charges once", async () => {
    const tok = await fresh("p4_tap", 10000);
    const id = rid();
    const out = await Promise.all(Array.from({ length: 10 }, () => boost(tok, 500, id)));
    assert.ok(out.every((r) => r.json.status !== true || r.json.boostId === `pb_p4_tap_${id}`));
    assert.equal((await getUser("p4_tap")).coin, 9500);
    assert.equal((await where("peakBoosts", "boosterId", "p4_tap")).length, 1);
  });
  await check("PB-06", "concurrent different boosts never overdraw: 10 x 300 against 1,000 -> exactly 3", async () => {
    const tok = await fresh("p4_conc", 1000);
    const c0 = (await getUser(creator)).coin;
    const out = await Promise.all(Array.from({ length: 10 }, () => boost(tok, 300)));
    const ok = out.filter((r) => r.json.status === true);
    assert.equal(ok.length, 3, JSON.stringify(out.map((r) => r.json.code || r.json.status)));
    assert.equal((await getUser("p4_conc")).coin, 100);
    assert.equal((await getUser(creator)).coin, c0 + 3 * 240);
    for (const r of ok) await conserved(r.json.boostId, 300);
  });
  await check("PB-07", "self-boost, missing video, blocked creator and private video are refused with no debit", async () => {
    const ctok = await idToken(creator);
    assert.equal((await boost(ctok, 100)).json.code, "SELF_BOOST");
    const tok = await fresh("p4_ref", 1000);
    assert.equal((await boost(tok, 100, rid(), "p4_missing")).json.code, "VIDEO_NOT_FOUND");
    await seedUser("p4_blocked_creator", { isBlock: true });
    await set("videos", "p4_vid_b", { userId: "p4_blocked_creator", channelId: "p4_blocked_creator", isActive: true, videoType: 1, scheduleType: 2, visibilityType: 1, moderationStatus: "approved" });
    assert.equal((await boost(tok, 100, rid(), "p4_vid_b")).json.code, "CREATOR_UNAVAILABLE");
    await set("videos", "p4_vid_priv", { userId: creator, channelId: creator, isActive: true, videoType: 1, scheduleType: 2, visibilityType: 2, moderationStatus: "approved" });
    assert.equal((await boost(tok, 100, rid(), "p4_vid_priv")).json.code, "VIDEO_NOT_FOUND");
    assert.equal((await getUser("p4_ref")).coin, 1000);
  });
  await check("PB-08", "blocked viewer is refused before any write", async () => {
    const tok = await fresh("p4_blockedviewer", 1000);
    await h.fsdb.collection("users").doc("p4_blockedviewer").update({ isBlock: true });
    const r = await boost(tok, 100);
    assert.equal(r.status, 403);
    assert.equal((await getUser("p4_blockedviewer")).coin, 1000);
  });
  await check("PB-09", "a failure inside the transaction leaves nothing behind (no debit, no credit, no boost row)", async () => {
    const tok = await fresh("p4_fail", 1000);
    const id = rid();
    const boostId = `pb_p4_fail_${id}`;
    // Pre-create the booster's history row: the transaction's create() of it fails at commit.
    await set("histories", `${boostId}_sent`, { userId: "p4_fail", note: "injected" });
    const c0 = (await getUser(creator)).coin;
    const r = await boost(tok, 500, id);
    assert.notEqual(r.json.status, true);
    assert.equal((await getUser("p4_fail")).coin, 1000);
    assert.equal((await getUser(creator)).coin, c0);
    assert.equal(await get("peakBoosts", boostId), null);
    assert.equal(await get(h.db.normalizeCollectionName("revenueLedger"), `rev_${boostId}`), null);
  });
};
