// Ad Credits: expiry sweep, pagination, concurrency and strict-reversal audit.
//
// Real Firestore + Auth emulators (demo-* project), the real Express app, the
// real service. Nothing here mocks Firestore: fault injection wraps the real
// Firestore handle and throws a gRPC ABORTED error from INSIDE a live
// transaction, so the real SDK retry loop re-runs the callback.
//
// Every test id below maps to the audit matrix (F-1 … F-30) or to a confirmed
// defect (D-1 … D-7):
//   D-1 cron restarted scanning from the beginning, response cursor never persisted
//   D-2 batchSize*5 scanned but only batchSize processed -> skipped lots behind the cursor
//   D-3 non-expiring ACTIVE lots could fill the first page and starve expired lots
//   D-4 counters were incremented inside retriable transaction callbacks
//   D-5 strict reversal policy still reported EXPIRED_REVERSAL_POLICY_PENDING
//   D-6 no concurrency / pagination boundary coverage
//   D-7 spend recomputed the compat balance from unexpired lots only, so a later
//       sweep subtracted already-excluded expired units a second time
"use strict";

const crypto = require("node:crypto");

module.exports = async (h, check, assert) => {
  const { call, seedUser, idToken, setSettings, nowIso, set, get, getUser, fsdb, admin } = h;
  const wallet = h.req("util/adCreditWallet.service");
  const jwt = require(require.resolve("jsonwebtoken", { paths: [h.BACKEND] }));

  const LOTS = "adCreditLots";
  const LEDGER = "adCreditLedger";
  const OPS = "adCreditOperations";
  const DAY = 86400000;
  const HOUR = 3600000;

  await setSettings({ paymentGateway: "razorpay", adCreditValidityDays: 730 });

  // ── helpers ───────────────────────────────────────────────────────────────
  async function resetAdCredits() {
    for (const c of [LOTS, LEDGER, OPS]) await fsdb.recursiveDelete(fsdb.collection(c));
  }

  async function newUser(id, { legacyUnits = 0, extra = {} } = {}) {
    await seedUser(id, {
      adCreditsBalance: legacyUnits / 100,
      adCreditsBalanceUnits: legacyUnits,
      adCreditsGranted: 0,
      adCreditsGrantedUnits: 0,
      ...extra,
    });
    return id;
  }

  const past = (ms = 2 * DAY) => new Date(Date.now() - ms).toISOString();
  const future = (ms = 30 * DAY) => new Date(Date.now() + ms).toISOString();
  const pad = (n, w = 4) => String(n).padStart(w, "0");

  /** Writes lots directly and keeps the compat balance consistent with the documented model. */
  async function seedLots(userId, specs, { bumpCache = true } = {}) {
    const stamp = nowIso();
    let active = 0;
    for (let i = 0; i < specs.length; i += 400) {
      const batch = fsdb.batch();
      for (const s of specs.slice(i, i + 400)) {
        const units = s.units == null ? 1000 : s.units;
        const status = s.status || "ACTIVE";
        if (status === "ACTIVE") active += units;
        batch.set(fsdb.collection(LOTS).doc(s.id), {
          _id: s.id, id: s.id, userId: s.userId || userId, source: s.source || "TOPUP", type: s.type || "BASE",
          amount: units / 100, amountUnits: units, remaining: units / 100, remainingUnits: units,
          expiresAt: s.expiresAt === undefined ? null : s.expiresAt, status,
          createdAt: s.createdAt || stamp, updatedAt: stamp,
          ...(s.raw || {}),
        });
      }
      await batch.commit();
    }
    if (bumpCache && active) {
      await fsdb.runTransaction(async (tx) => {
        const ref = fsdb.collection("users").doc(userId);
        const u = (await tx.get(ref)).data();
        const units = (u.adCreditsBalanceUnits || 0) + active;
        tx.update(ref, { adCreditsBalanceUnits: units, adCreditsBalance: units / 100 });
      });
    }
  }

  const allDocs = async (col, field, value) =>
    (await (field ? fsdb.collection(col).where(field, "==", value) : fsdb.collection(col)).get()).docs.map((d) => d.data());

  const lotStatuses = async (prefix) => {
    const docs = await allDocs(LOTS);
    const out = {};
    for (const l of docs) if (!prefix || l.id.startsWith(prefix)) out[l.status] = (out[l.status] || 0) + 1;
    return out;
  };

  /**
   * Financial reconciliation for one user:
   *   1. compat balance == legacy + sum(remaining of every ACTIVE lot, expired-unswept included)
   *   2. per lot: amountUnits == remainingUnits + sum(ledger deductions for that lot)
   *   3. terminal lots (EXPIRED/EXHAUSTED) hold zero remaining units
   *   4. no expiry ledger entry exists twice (deterministic id) and none for a lot that is still ACTIVE
   */
  async function reconcile(userId, { legacyUnits = 0 } = {}) {
    const user = await getUser(userId);
    const lots = await allDocs(LOTS, "userId", userId);
    const ledger = await allDocs(LEDGER, "userId", userId);
    const deducted = new Map();
    for (const e of ledger) {
      if (e.direction !== "DEBIT") continue;
      for (const d of e.lotsDeducted || []) {
        deducted.set(d.lotId, (deducted.get(d.lotId) || 0) + d.amountDeductedUnits);
      }
    }
    let activeUnits = 0;
    for (const l of lots) {
      assert.ok(Number.isSafeInteger(l.remainingUnits) && l.remainingUnits >= 0, `lot ${l.id} remainingUnits invalid`);
      if (l.status === "ACTIVE") activeUnits += l.remainingUnits;
      if (l.status === "EXPIRED" || l.status === "EXHAUSTED") assert.equal(l.remainingUnits, 0, `terminal lot ${l.id} still holds units`);
      if (l.status !== "EXPIRY_REVIEW") {
        assert.equal(l.amountUnits, l.remainingUnits + (deducted.get(l.id) || 0), `lot ${l.id} conservation (amount = remaining + ledger deductions)`);
      }
      if (l.status === "ACTIVE") assert.ok(!ledger.some((e) => e.id === `adc_exp_${l.id}`), `active lot ${l.id} has an expiry ledger entry`);
    }
    assert.equal(user.adCreditsBalanceUnits, legacyUnits + activeUnits, `compat balance ${user.adCreditsBalanceUnits} != legacy ${legacyUnits} + active lots ${activeUnits}`);
    return { user, lots, ledger, activeUnits };
  }

  /** Real Firestore handle with fault injection inside live transactions. */
  function faultFs({ abortFirstAttempt = false, deadAfterCommits = null, beforeTx = null, failLotId = null } = {}) {
    let commits = 0;
    let dead = false;
    const crash = () => Object.assign(new Error("simulated process crash"), { code: "SIMULATED_CRASH" });
    const proxy = new Proxy(fsdb, {
      get(target, prop) {
        if (prop === "runTransaction") {
          return async (fn, opts) => {
            if (dead) throw crash();
            if (beforeTx) await beforeTx();
            let attempt = 0;
            const res = await target.runTransaction(async (tx) => {
              attempt += 1;
              let touchedFailLot = false;
              const spy = new Proxy(tx, {
                get(t, p) {
                  if (p === "create") {
                    // only the processing transaction creates the expiry ledger entry; failure bookkeeping does not
                    return (ref, ...rest) => {
                      if (failLotId && ref && ref.path && ref.path.endsWith(`/adc_exp_${failLotId}`)) touchedFailLot = true;
                      return t.create(ref, ...rest);
                    };
                  }
                  const v = t[p];
                  return typeof v === "function" ? v.bind(t) : v;
                },
              });
              const r = await fn(spy);
              if (touchedFailLot) throw Object.assign(new Error("9 FAILED_PRECONDITION: injected deterministic failure"), { code: 9 });
              if (abortFirstAttempt && attempt === 1) throw Object.assign(new Error("10 ABORTED: injected contention"), { code: 10 });
              return r;
            }, opts);
            commits += 1;
            if (deadAfterCommits != null && commits >= deadAfterCommits) dead = true;
            return res;
          };
        }
        if (prop === "collection" && dead) return () => { throw crash(); };
        const v = target[prop];
        return typeof v === "function" ? v.bind(target) : v;
      },
    });
    proxy.__commits = () => commits;
    return proxy;
  }

  /** Real Firestore handle that counts transaction starts (outer retries show up as extra starts). */
  function countingFs() {
    const stats = { starts: 0, failures: 0, codes: {} };
    const proxy = new Proxy(fsdb, {
      get(target, prop) {
        if (prop === "runTransaction") {
          return async (fn, opts) => {
            stats.starts += 1;
            try {
              return await target.runTransaction(fn, opts);
            } catch (e) {
              stats.failures += 1;
              const k = String(e.code || e.message).slice(0, 40);
              stats.codes[k] = (stats.codes[k] || 0) + 1;
              throw e;
            }
          };
        }
        const v = target[prop];
        return typeof v === "function" ? v.bind(target) : v;
      },
    });
    proxy.__stats = stats;
    return proxy;
  }

  const adminToken = (id) => jwt.sign({ _id: id }, process.env.JWT_SECRET);
  const adminCall = (method, path, id, body) => call(method, path, { body, headers: { authorization: adminToken(id) } });
  const cronGet = (path = "/cron/daily") => call("GET", `${path}?key=test-cron`);
  const expire = (opts = {}) => wallet.expireCredits({ fs: fsdb, ...opts });
  const sum = (a) => a.reduce((x, y) => x + y, 0);

  await h.set("admins", "adc_super", { email: "adc-super@test.local", role: "SUPER_ADMIN", isActive: true, isBlock: false });

  // ═══════════════════════════════ EXPIRY (F-1 … F-14) ═══════════════════════════════

  await check("EXP-01", "F-1 empty collection: sweep completes with zero work and no more work", async () => {
    await resetAdCredits();
    const r = await expire({ batchSize: 10 });
    assert.equal(r.expiredLotsCount, 0);
    assert.equal(r.totalUnitsExpired, 0);
    assert.equal(r.moreWork, false);
  });

  await check("EXP-02", "F-2 no eligible expired lots: non-expiring and future lots are untouched", async () => {
    await resetAdCredits();
    const u = await newUser("u_x_noelig");
    await seedLots(u, [
      { id: "lot_p1", type: "PLAN", expiresAt: null },
      { id: "lot_f1", expiresAt: future() },
      { id: "lot_f2", expiresAt: future(HOUR) },
    ]);
    const r = await expire({ batchSize: 10 });
    assert.equal(r.expiredLotsCount, 0);
    assert.equal(r.moreWork, false);
    assert.deepEqual(await lotStatuses(), { ACTIVE: 3 });
    await reconcile(u);
  });

  await check("EXP-03", "F-3 exact batch boundary: batch of 10 over exactly 10 expired lots leaves no more work", async () => {
    await resetAdCredits();
    const u = await newUser("u_x_exact");
    await seedLots(u, Array.from({ length: 10 }, (_, i) => ({ id: `lot_e_${pad(i)}`, expiresAt: past() })));
    const r = await expire({ batchSize: 10, maxBatches: 1 });
    assert.equal(r.expiredLotsCount, 10);
    assert.equal(r.totalUnitsExpired, 10000);
    assert.equal(r.moreWork, false, "no work remains after exactly one full batch");
    assert.deepEqual(await lotStatuses(), { EXPIRED: 10 });
    const rec = await reconcile(u);
    assert.equal(rec.user.adCreditsBalanceUnits, 0);
  });

  await check("EXP-04", "F-4 batch boundary + 1: first run reports more work, second finishes with exactly one lot", async () => {
    await resetAdCredits();
    const u = await newUser("u_x_plus1");
    await seedLots(u, Array.from({ length: 11 }, (_, i) => ({ id: `lot_e_${pad(i)}`, expiresAt: past() })));
    const r1 = await expire({ batchSize: 10, maxBatches: 1 });
    assert.equal(r1.expiredLotsCount, 10);
    assert.equal(r1.moreWork, true, "an eleventh eligible lot remains and must be reported");
    const r2 = await expire({ batchSize: 10, maxBatches: 1 });
    assert.equal(r2.expiredLotsCount, 1);
    assert.equal(r2.moreWork, false);
    assert.deepEqual(await lotStatuses(), { EXPIRED: 11 });
    await reconcile(u);
  });

  await check("EXP-05", "F-5 several batches of expired lots over repeated invocations; no lot lost, none doubled (D-2 cursor chain)", async () => {
    await resetAdCredits();
    const u = await newUser("u_x_multi");
    // 1200 lots; with the old batchSize*5 scan page of 500, each page holds 120+ expired lots.
    const specs = [];
    for (let i = 0; i < 1200; i++) specs.push({ id: `lot_m_${pad(i)}`, expiresAt: i % 4 === 0 ? past() : future() });
    await seedLots(u, specs);
    // A caller that follows whatever cursor the response returns (the only way the old API could be resumed).
    let cursor = null;
    let invocations = 0;
    let expired = 0;
    do {
      const r = await expire({ batchSize: 100, cursor });
      cursor = r.nextCursor || null;
      expired += r.expiredLotsCount;
      invocations += 1;
    } while ((cursor || false) && invocations < 20);
    // Finish with plain repeated invocations (what the daily cron does).
    let guard = 0;
    for (;;) {
      const r = await expire({ batchSize: 100, maxBatches: 5 });
      expired += r.expiredLotsCount;
      if (!r.moreWork && r.expiredLotsCount === 0) break;
      if (++guard > 20) assert.fail("backlog did not drain in 20 invocations");
    }
    assert.equal(expired, 300, "exactly the 300 expired lots were processed once each");
    const st = await lotStatuses();
    assert.equal(st.EXPIRED, 300);
    assert.equal(st.ACTIVE, 900);
    const ledger = (await allDocs(LEDGER, "source", "EXPIRY")).length;
    assert.equal(ledger, 300);
    await reconcile(u);
  });

  await check("EXP-06", "F-6 / D-3 600 non-expiring ACTIVE lots ahead of the expired ones cannot starve them (real /cron/daily path)", async () => {
    await resetAdCredits();
    const u = await newUser("u_x_starve");
    const specs = [];
    for (let i = 0; i < 600; i++) specs.push({ id: `lot_a_${pad(i)}`, type: "PLAN", expiresAt: null });
    for (let i = 0; i < 12; i++) specs.push({ id: `lot_z_${pad(i)}`, expiresAt: past() });
    await seedLots(u, specs);
    for (let run = 0; run < 3; run++) {
      const r = await cronGet();
      assert.equal(r.status, 200);
      if (r.json.tasks.expireAdCredits.moreWork === false) break;
    }
    const st = await lotStatuses();
    assert.equal(st.EXPIRED, 12, `expired lots were starved: ${JSON.stringify(st)}`);
    assert.equal(st.ACTIVE, 600);
    await reconcile(u);
  });

  await check("EXP-07", "F-7 identical expiry timestamps: stable id tie-break, deterministic order, each lot once", async () => {
    await resetAdCredits();
    const u = await newUser("u_x_ties");
    const at = past(HOUR);
    const ids = Array.from({ length: 25 }, (_, i) => `lot_t_${pad(i)}`);
    // insert in scrambled order; ordering must come from the id tie-break, not insertion order
    const scrambled = [...ids].sort((a, b) => crypto.createHash("md5").update(a).digest("hex").localeCompare(crypto.createHash("md5").update(b).digest("hex")));
    await seedLots(u, scrambled.map((id) => ({ id, expiresAt: at })));
    const seen = [];
    for (let run = 0; run < 10; run++) {
      const r = await expire({ batchSize: 7, maxBatches: 1 });
      seen.push(...(r.processedLotIds || []));
      if (!r.moreWork) break;
    }
    assert.deepEqual(seen, ids, "lots processed in (expiresAt, id) order, exactly once");
    assert.equal((await allDocs(LEDGER, "source", "EXPIRY")).length, 25);
    await reconcile(u);
  });

  await check("EXP-08", "F-8 lots that become eligible between sweeps, and lots inserted before the previous position, are handled by a later sweep", async () => {
    await resetAdCredits();
    const u = await newUser("u_x_between");
    const T1 = new Date("2031-03-01T00:00:00.000Z");
    const iso = (ms) => new Date(T1.getTime() + ms).toISOString();
    await seedLots(u, [
      { id: "lot_c", expiresAt: iso(-3 * HOUR) },
      { id: "lot_d", expiresAt: iso(-2 * HOUR) },
      { id: "lot_e", expiresAt: iso(-1 * HOUR) },
      { id: "lot_later", expiresAt: iso(+1 * HOUR) }, // not eligible at T1
    ]);
    const r1 = await expire({ batchSize: 2, maxBatches: 1, now: T1 });
    assert.deepEqual(r1.processedLotIds, ["lot_c", "lot_d"]);
    assert.equal(r1.moreWork, true);
    // new lots appear: one sorts BEFORE everything already processed, one is brand new
    await seedLots(u, [{ id: "lot_a_inserted_early", expiresAt: iso(-5 * HOUR) }]);
    const r2 = await expire({ batchSize: 10, maxBatches: 1, now: T1 });
    assert.deepEqual(r2.processedLotIds, ["lot_a_inserted_early", "lot_e"]);
    assert.equal(r2.moreWork, false);
    const T2 = new Date(T1.getTime() + 2 * HOUR);
    const r3 = await expire({ batchSize: 10, now: T2 });
    assert.deepEqual(r3.processedLotIds, ["lot_later"], "lot that crossed its expiry between sweeps is now processed");
    await reconcile(u);
  });

  await check("EXP-09", "F-9 stale/deleted cursor input and a lot deleted mid-sweep never stall the sweep", async () => {
    await resetAdCredits();
    const u = await newUser("u_x_deleted");
    await seedLots(u, Array.from({ length: 6 }, (_, i) => ({ id: `lot_d_${i}`, expiresAt: past() })));
    // a cursor naming a document that does not exist must not restart/skip anything
    const r1 = await expire({ batchSize: 3, maxBatches: 1, cursor: "lot_does_not_exist" });
    assert.equal(r1.expiredLotsCount, 3);
    // delete the next lot after it was queried but before its transaction runs
    let deleted = false;
    const fs = faultFs({
      beforeTx: async () => {
        if (!deleted) {
          deleted = true;
          const left = (await fsdb.collection(LOTS).where("status", "==", "ACTIVE").get()).docs.map((d) => d.id).sort();
          await fsdb.collection(LOTS).doc(left[0]).delete();
        }
      },
    });
    const r2 = await wallet.expireCredits({ batchSize: 10, fs });
    assert.equal(r2.expiredLotsCount, 2, "the two surviving lots are still expired");
    assert.equal(r2.errorCount || 0, 0);
    const st = await lotStatuses();
    assert.equal(st.EXPIRED, 5);
  });

  await check("EXP-10", "F-10 crash after partial work, then resume: no duplicate ledger entries, nothing skipped", async () => {
    await resetAdCredits();
    const u = await newUser("u_x_crash");
    await seedLots(u, Array.from({ length: 12 }, (_, i) => ({ id: `lot_k_${pad(i)}`, expiresAt: past() })));
    const crashing = faultFs({ deadAfterCommits: 5 });
    let first;
    try {
      first = await wallet.expireCredits({ batchSize: 12, maxBatches: 1, fs: crashing });
    } catch (e) {
      first = { threw: true };
    }
    const mid = await lotStatuses();
    assert.equal(mid.EXPIRED, 5, "exactly the committed work survived the crash");
    assert.equal(mid.ACTIVE, 7);
    await reconcile(u); // consistent at the crash point
    const resumed = await expire({ batchSize: 12, maxBatches: 1 });
    assert.equal(resumed.expiredLotsCount, 7);
    assert.equal((await allDocs(LEDGER, "source", "EXPIRY")).length, 12);
    assert.deepEqual(await lotStatuses(), { EXPIRED: 12 });
    await reconcile(u);
  });

  await check("EXP-11", "F-11 repeated invocations and a repeated /cron/daily create no duplicate ledger effects", async () => {
    await resetAdCredits();
    const u = await newUser("u_x_repeat");
    await seedLots(u, Array.from({ length: 8 }, (_, i) => ({ id: `lot_r_${i}`, expiresAt: past() })));
    const c1 = await cronGet();
    assert.equal(c1.json.tasks.expireAdCredits.expiredLotsCount, 8);
    const before = await reconcile(u);
    for (let i = 0; i < 3; i++) {
      const c = await cronGet();
      assert.equal(c.json.tasks.expireAdCredits.expiredLotsCount, 0);
      const r = await expire({ batchSize: 10 });
      assert.equal(r.expiredLotsCount, 0);
    }
    const after = await reconcile(u);
    assert.equal(after.ledger.length, before.ledger.length);
    assert.equal(after.user.adCreditsBalanceUnits, before.user.adCreditsBalanceUnits);
  });

  await check("EXP-12", "F-12 four overlapping workers (3 service + 1 HTTP cron) conserve balances and report exact totals", async () => {
    await resetAdCredits();
    const users = ["u_x_ov_a", "u_x_ov_b", "u_x_ov_c", "u_x_ov_d"];
    let total = 0;
    for (const uid of users) {
      await newUser(uid);
      const specs = Array.from({ length: 15 }, (_, i) => ({ id: `lot_${uid}_${pad(i)}`, units: 100 + i * 7, expiresAt: past((i + 1) * HOUR) }));
      total += sum(specs.map((s) => s.units));
      await seedLots(uid, specs);
    }
    const results = await Promise.all([
      expire({ batchSize: 10, maxBatches: 10 }),
      expire({ batchSize: 7, maxBatches: 10 }),
      expire({ batchSize: 13, maxBatches: 10 }),
      cronGet("/cron/daily"),
    ]);
    const reports = [results[0], results[1], results[2], results[3].json.tasks.expireAdCredits];
    // finish anything a worker left because it hit its own limit
    for (let i = 0; i < 5; i++) reports.push(await expire({ batchSize: 50, maxBatches: 5 }));
    const ledger = await allDocs(LEDGER, "source", "EXPIRY");
    assert.equal(ledger.length, 60, "exactly one expiry entry per lot");
    assert.equal(sum(ledger.map((e) => e.creditUnits)), total);
    assert.equal(sum(reports.map((r) => r.totalUnitsExpired)), total, "sum of reported units across workers equals committed units");
    assert.equal(sum(reports.map((r) => r.expiredLotsCount)), 60, "sum of reported lots across workers equals committed lots");
    for (const uid of users) {
      const rec = await reconcile(uid);
      assert.equal(rec.user.adCreditsBalanceUnits, 0);
    }
  });

  await check("EXP-13", "F-13 / D-4 transaction retries (real SDK retry after injected ABORTED) do not inflate reported totals", async () => {
    await resetAdCredits();
    const u = await newUser("u_x_retry");
    const specs = Array.from({ length: 9 }, (_, i) => ({ id: `lot_q_${i}`, units: 250 + i, expiresAt: past() }));
    await seedLots(u, specs);
    const real = sum(specs.map((s) => s.units));
    const fs = faultFs({ abortFirstAttempt: true });
    const r = await wallet.expireCredits({ batchSize: 20, fs });
    assert.equal(r.expiredLotsCount, 9, "lots counted once even though every callback ran twice");
    assert.equal(r.totalUnitsExpired, real, `reported ${r.totalUnitsExpired} vs committed ${real}`);
    assert.equal(r.totalCreditsExpired, real / 100);
    const rec = await reconcile(u);
    assert.equal(rec.ledger.filter((e) => e.source === "EXPIRY").length, 9);
    assert.equal(rec.user.adCreditsBalanceUnits, 0);
  });

  await check("EXP-14", "F-14 missing owner / corrupt lot / balance below lot are quarantined for review: no account created, no clamp, no silent loss", async () => {
    await resetAdCredits();
    const ghost = "u_x_ghost_owner";
    assert.equal(await get("users", ghost), null);
    const good = await newUser("u_x_good");
    const low = await newUser("u_x_lowcache");
    await seedLots(good, [{ id: "lot_ok_1", units: 5000, expiresAt: past() }]);
    await seedLots(ghost, [{ id: "lot_orphan", units: 700, userId: ghost, expiresAt: past() }], { bumpCache: false });
    await seedLots(good, [
      { id: "lot_corrupt_frac", units: 100, expiresAt: past(), raw: { remainingUnits: 12.5, remaining: 0.125 } },
      { id: "lot_corrupt_neg", units: 100, expiresAt: past(), raw: { remainingUnits: -40, remaining: -0.4 } },
    ], { bumpCache: false });
    await seedLots(low, [{ id: "lot_lowcache", units: 900, expiresAt: past() }], { bumpCache: false });
    await fsdb.collection("users").doc(low).update({ adCreditsBalanceUnits: 300, adCreditsBalance: 3 }); // corrupt: cache < lot
    const goodBefore = await getUser(good);
    const r = await expire({ batchSize: 20 });
    assert.equal(r.expiredLotsCount, 1, "only the healthy lot is expired");
    assert.equal(r.totalUnitsExpired, 5000);
    assert.equal(r.reviewLotsCount, 4);
    assert.equal(await get("users", ghost), null, "an orphan lot must never create an owner account");
    const st = await lotStatuses();
    assert.equal(st.EXPIRY_REVIEW, 4);
    const lowAfter = await getUser(low);
    assert.equal(lowAfter.adCreditsBalanceUnits, 300, "balance discrepancy is left visible, not clamped to zero");
    assert.equal((await get(LOTS, "lot_lowcache")).remainingUnits, 900, "units of a lot under review are not erased");
    assert.equal((await allDocs(LEDGER, "source", "EXPIRY")).length, 1);
    const goodAfter = await getUser(good);
    assert.equal(goodAfter.adCreditsBalanceUnits, goodBefore.adCreditsBalanceUnits - 5000);
    // a second sweep must not keep reprocessing quarantined lots
    const r2 = await expire({ batchSize: 20 });
    assert.equal(r2.expiredLotsCount, 0);
    assert.equal(r2.reviewLotsCount, 0);
    assert.equal(r2.moreWork, false);
  });

  await check("EXP-15", "D-7 compat balance stays reconciled when a spend happens while an expired lot is still unswept (legacy balance preserved)", async () => {
    await resetAdCredits();
    const u = await newUser("u_x_dyn", { legacyUnits: 2500 });
    await seedLots(u, [
      { id: "lot_dyn_expired", units: 4000, expiresAt: past() },
      { id: "lot_dyn_live", units: 10000, expiresAt: future() },
    ]);
    await reconcile(u, { legacyUnits: 2500 });
    const wb = await wallet.getWalletBalance(u, { fs: fsdb });
    assert.equal(wb.availableUnits, 10000, "expired-unswept lot is excluded dynamically");
    await wallet.spendCredits({ userId: u, amount: 10, operationId: "op_dyn_1", fs: fsdb });
    await reconcile(u, { legacyUnits: 2500 });
    const r = await expire({ batchSize: 10 });
    assert.equal(r.totalUnitsExpired, 4000);
    const rec = await reconcile(u, { legacyUnits: 2500 });
    assert.equal(rec.user.adCreditsBalanceUnits, 2500 + 9000);
  });

  await check("EXP-16", "Persistent poison lots (a deterministic failure and a squatted ledger id) cannot starve later expired lots across invocations", async () => {
    await resetAdCredits();
    const u = await newUser("u_x_poison");
    const specs = [
      { id: "lot_0_poison", units: 100, expiresAt: past(10 * DAY) },
      { id: "lot_0_squat", units: 100, expiresAt: past(9 * DAY) },
    ];
    for (let i = 0; i < 6; i++) specs.push({ id: `lot_1_ok_${i}`, units: 100, expiresAt: past() });
    await seedLots(u, specs);
    // a foreign document already occupies the deterministic expiry ledger id of lot_0_squat
    await fsdb.collection(LEDGER).doc("adc_exp_lot_0_squat").set({ id: "adc_exp_lot_0_squat", userId: "someone_else", note: "squatter" });
    const fs = faultFs({ failLotId: "lot_0_poison" });
    let expired = 0;
    let runs = 0;
    for (; runs < 12; runs++) {
      const r = await wallet.expireCredits({ batchSize: 2, maxBatches: 1, fs });
      expired += r.expiredLotsCount;
      if (!r.moreWork) break;
    }
    assert.ok(runs < 12, "sweep must terminate");
    assert.equal(expired, 6, "all healthy lots were expired despite the failing lots at the head of the queue");
    assert.equal((await get(LOTS, "lot_0_poison")).status, "EXPIRY_REVIEW");
    assert.equal((await get(LOTS, "lot_0_squat")).status, "EXPIRY_REVIEW");
    assert.equal((await get(LEDGER, "adc_exp_lot_0_squat")).note, "squatter", "foreign document untouched");
  });

  await check("EXP-17", "Cron: dedicated expiry route + daily task report committed counts, remaining-work state and no user identifiers", async () => {
    await resetAdCredits();
    const u = await newUser("u_x_cronshape");
    await seedLots(u, Array.from({ length: 7 }, (_, i) => ({ id: `lot_cs_${i}`, units: 321, expiresAt: past() })));
    const r = await cronGet("/cron/adCreditsExpiry");
    assert.equal(r.status, 200);
    const t = r.json.tasks.expireAdCredits;
    assert.equal(t.expiredLotsCount, 7);
    assert.equal(t.totalUnitsExpired, 7 * 321);
    assert.equal(t.moreWork, false);
    assert.ok(["COMPLETE", "BATCH_LIMIT", "TIME_BUDGET"].includes(t.stoppedReason));
    const text = JSON.stringify(r.json);
    assert.ok(!text.includes("u_x_cronshape"), "no user ids in the cron response");
    assert.ok(!text.includes("lot_cs_"), "no lot ids (they embed user ids) in the cron response");
    assert.equal(t.processedLotIds, undefined);
  });

  await check("EXP-18", "Cron: time budget stops with resumable progress; other tasks still reported", async () => {
    await resetAdCredits();
    const u = await newUser("u_x_budget");
    await seedLots(u, Array.from({ length: 30 }, (_, i) => ({ id: `lot_tb_${pad(i)}`, expiresAt: past() })));
    const r = await expire({ batchSize: 10, maxBatches: 5, deadlineMs: Date.now() - 1 });
    assert.equal(r.expiredLotsCount, 0);
    assert.equal(r.stoppedReason, "TIME_BUDGET");
    assert.equal(r.moreWork, true);
    const r2 = await expire({ batchSize: 10, maxBatches: 5, deadlineMs: Date.now() + 60000 });
    assert.equal(r2.expiredLotsCount, 30);
    assert.equal(r2.stoppedReason, "COMPLETE");
    const c = await cronGet();
    assert.ok(c.json.tasks.expireReferrals, "other tasks isolated and present");
  });

  // ═══════════════════════════ SPENDING & REVERSAL (F-15 … F-23) ═══════════════════════════

  await check("SPD-01", "F-15 concurrent spends never overdraw: 12 x 10.00 against 100.00 -> exactly 10 succeed", async () => {
    await resetAdCredits();
    const u = await newUser("u_x_spend");
    await seedLots(u, [
      { id: "lot_s_1", units: 4000, expiresAt: future(10 * DAY), createdAt: "2030-01-01T00:00:00.000Z" },
      { id: "lot_s_2", units: 3000, expiresAt: future(20 * DAY), type: "BONUS", createdAt: "2030-01-02T00:00:00.000Z" },
      { id: "lot_s_3", units: 3000, type: "PLAN", expiresAt: null, createdAt: "2030-01-03T00:00:00.000Z" },
    ]);
    const cfs = countingFs();
    const outcomes = await Promise.allSettled(
      Array.from({ length: 12 }, (_, i) => wallet.spendCredits({ userId: u, amount: 10, operationId: `op_conc_${i}`, fs: cfs }))
    );
    console.log(`     [SPD-01] transaction starts=${cfs.__stats.starts} failed-attempts=${cfs.__stats.failures} codes=${JSON.stringify(cfs.__stats.codes)}`);
    const ok = outcomes.filter((o) => o.status === "fulfilled");
    const bad = outcomes.filter((o) => o.status === "rejected");
    assert.equal(ok.length, 10, `successes=${ok.length}; failures: ${bad.map((b) => b.reason.code || b.reason.message).join(", ")}`);
    for (const b of bad) assert.match(b.reason.message, /Insufficient ad credits balance/);
    const rec = await reconcile(u);
    assert.equal(rec.user.adCreditsBalanceUnits, 0);
    assert.equal(rec.ledger.filter((e) => e.direction === "DEBIT").length, 10);
  });

  await check("SPD-02", "F-16 same operation id submitted concurrently debits exactly once", async () => {
    await resetAdCredits();
    const u = await newUser("u_x_sameop");
    await seedLots(u, [{ id: "lot_so_1", units: 10000, expiresAt: future() }]);
    const rs = await Promise.allSettled(
      Array.from({ length: 8 }, () => wallet.spendCredits({ userId: u, amount: 12.34, operationId: "op_same_1", purpose: "campaign_delivery", fs: fsdb }))
    );
    assert.ok(rs.every((r) => r.status === "fulfilled"), JSON.stringify(rs.filter((r) => r.status === "rejected").map((r) => r.reason.message)));
    assert.equal(rs.filter((r) => !r.value.replayed).length, 1, "exactly one execution; the rest are replays");
    const rec = await reconcile(u);
    assert.equal(rec.user.adCreditsBalanceUnits, 10000 - 1234);
    assert.equal(rec.ledger.filter((e) => e.direction === "DEBIT").length, 1);
    assert.equal((await allDocs(OPS, "userId", u)).length, 1);
  });

  await check("SPD-03", "F-17 reused operation id with changed parameters conflicts (409), including under concurrency", async () => {
    await resetAdCredits();
    const u = await newUser("u_x_conflict");
    await seedLots(u, [{ id: "lot_cf_1", units: 10000, expiresAt: future() }]);
    await wallet.spendCredits({ userId: u, amount: 5, operationId: "op_cf", purpose: "a", fs: fsdb });
    for (const variant of [{ amount: 6, purpose: "a" }, { amount: 5, purpose: "b" }]) {
      await assert.rejects(wallet.spendCredits({ userId: u, operationId: "op_cf", fs: fsdb, ...variant }), (e) => e.code === "OPERATION_CONFLICT" && e.statusCode === 409);
    }
    const mixed = await Promise.allSettled([
      wallet.spendCredits({ userId: u, amount: 5, operationId: "op_cf2", purpose: "a", fs: fsdb }),
      wallet.spendCredits({ userId: u, amount: 7, operationId: "op_cf2", purpose: "a", fs: fsdb }),
    ]);
    assert.equal(mixed.filter((m) => m.status === "fulfilled").length, 1);
    const rej = mixed.find((m) => m.status === "rejected");
    assert.ok(rej && rej.reason.code === "OPERATION_CONFLICT", "loser gets a conflict, never a second debit");
    assert.equal((await reconcile(u)).ledger.filter((e) => e.direction === "DEBIT").length, 2);
  });

  await check("SPD-04", "F-18 spending racing with expiry preserves accounting (spend at T0 vs sweep at T0+2h on the same lot)", async () => {
    await resetAdCredits();
    const u = await newUser("u_x_race", { legacyUnits: 111 });
    const T0 = new Date();
    const specs = Array.from({ length: 6 }, (_, i) => ({ id: `lot_rc_${i}`, units: 1000, expiresAt: new Date(T0.getTime() + HOUR).toISOString(), createdAt: `2030-02-0${i + 1}T00:00:00.000Z` }));
    await seedLots(u, specs);
    const later = new Date(T0.getTime() + 2 * HOUR);
    const ops = [];
    for (let i = 0; i < 8; i++) ops.push(wallet.spendCredits({ userId: u, amount: 3.5, operationId: `op_race_${i}`, now: T0, fs: fsdb }).catch((e) => ({ error: e })));
    ops.push(expire({ batchSize: 3, maxBatches: 5, now: later }));
    ops.push(expire({ batchSize: 3, maxBatches: 5, now: later }));
    await Promise.all(ops);
    for (let i = 0; i < 3; i++) await expire({ batchSize: 10, now: later });
    const rec = await reconcile(u, { legacyUnits: 111 });
    const spentLedger = sum(rec.ledger.filter((e) => e.source === "SPEND").map((e) => e.creditUnits));
    const expiredLedger = sum(rec.ledger.filter((e) => e.source === "EXPIRY").map((e) => e.creditUnits));
    assert.equal(spentLedger + expiredLedger, 6000, "every granted unit is either spent or expired, none lost or duplicated");
    assert.equal(rec.user.adCreditsBalanceUnits, 111);
  });

  await check("SPD-05", "F-19 valid multi-lot reversal restores original types, expiry and provenance; does not extend validity", async () => {
    await resetAdCredits();
    const u = await newUser("u_x_rev");
    const e1 = future(10 * DAY);
    const e2 = future(40 * DAY);
    await seedLots(u, [
      { id: "lot_v_base", units: 3000, type: "BASE", expiresAt: e1, createdAt: "2030-03-01T00:00:00.000Z" },
      { id: "lot_v_bonus", units: 500, type: "BONUS", expiresAt: e2, createdAt: "2030-03-02T00:00:00.000Z" },
      { id: "lot_v_plan", units: 4000, type: "PLAN", source: "STARTER_PASS", expiresAt: null, createdAt: "2030-03-03T00:00:00.000Z" },
    ]);
    const sp = await wallet.spendCredits({ userId: u, amount: 40, operationId: "op_rev_multi", fs: fsdb });
    assert.equal(sp.lotsDeducted.length, 3);
    const rev = await wallet.reverseDebit({ userId: u, originalOperationId: "op_rev_multi", fs: fsdb });
    assert.equal(rev.restoredUnits, 4000);
    const byType = Object.fromEntries(rev.lots.map((l) => [l.type, l]));
    assert.equal(byType.BASE.expiresAt, e1);
    assert.equal(byType.BONUS.expiresAt, e2);
    assert.equal(byType.PLAN.expiresAt, null);
    assert.equal(byType.BASE.amountUnits, 3000);
    assert.equal(byType.BONUS.amountUnits, 500);
    assert.equal(byType.PLAN.amountUnits, 500);
    assert.equal(byType.PLAN.source, "STARTER_PASS");
    const rec = await reconcile(u);
    assert.equal(rec.user.adCreditsBalanceUnits, 7500 + 0);
  });

  await check("SPD-06", "F-20 concurrent duplicate reversals restore exactly once", async () => {
    await resetAdCredits();
    const u = await newUser("u_x_dupl");
    await seedLots(u, [{ id: "lot_dr_1", units: 5000, expiresAt: future() }, { id: "lot_dr_2", units: 5000, type: "PLAN", expiresAt: null }]);
    await wallet.spendCredits({ userId: u, amount: 70, operationId: "op_dr", fs: fsdb });
    const rs = await Promise.allSettled(Array.from({ length: 6 }, () => wallet.reverseDebit({ userId: u, originalOperationId: "op_dr", fs: fsdb })));
    assert.ok(rs.every((r) => r.status === "fulfilled"), JSON.stringify(rs.filter((r) => r.status === "rejected").map((r) => r.reason.message)));
    assert.equal(rs.filter((r) => !r.value.replayed).length, 1);
    const rec = await reconcile(u);
    assert.equal(rec.user.adCreditsBalanceUnits, 10000);
    assert.equal(rec.ledger.filter((e) => e.source === "REVERSAL").length, 1);
    assert.equal(rec.lots.filter((l) => l.id.startsWith("lot_rev_")).length, 2);
  });

  async function seedExpiredAllocationOp(uid, opId, { expiredAt, liveAt }) {
    await set(OPS, opId, {
      userId: uid, amount: 30, amountUnits: 3000, purpose: "seeded", isReversed: false,
      lotsDeducted: [
        { lotId: "lot_hist_live", amountDeducted: 10, amountDeductedUnits: 1000, lotType: "BASE", lotSource: "TOPUP", expiresAt: liveAt },
        { lotId: "lot_hist_expired", amountDeducted: 20, amountDeductedUnits: 2000, lotType: "BASE", lotSource: "TOPUP", expiresAt: expiredAt },
      ],
      createdAt: nowIso(),
    });
  }
  async function snapshotState(uid) {
    return JSON.stringify({
      lots: (await allDocs(LOTS, "userId", uid)).sort((a, b) => a.id.localeCompare(b.id)),
      ledger: (await allDocs(LEDGER, "userId", uid)).sort((a, b) => a.id.localeCompare(b.id)),
      ops: (await allDocs(OPS, "userId", uid)).sort((a, b) => a.id.localeCompare(b.id)),
      user: await getUser(uid),
    });
  }

  await check("SPD-07", "F-21 / D-5 one expired allocation rejects the whole reversal with EXPIRED_CREDITS_NOT_REVERSIBLE and zero changes (service + admin HTTP)", async () => {
    await resetAdCredits();
    const u = await newUser("u_x_strict");
    await seedExpiredAllocationOp(u, "op_strict", { expiredAt: past(HOUR), liveAt: future(10 * DAY) });
    const before = await snapshotState(u);
    await assert.rejects(
      wallet.reverseDebit({ userId: u, originalOperationId: "op_strict", fs: fsdb }),
      (e) => e.code === "EXPIRED_CREDITS_NOT_REVERSIBLE" && e.statusCode === 422 && !/pending/i.test(e.message)
    );
    assert.equal(await snapshotState(u), before, "rejection mutated nothing");
    const http = await adminCall("POST", "/admin/adCredits/reverse", "adc_super", { userId: u, originalOperationId: "op_strict", reason: "x" });
    assert.equal(http.status, 422);
    assert.equal(http.json.code, "EXPIRED_CREDITS_NOT_REVERSIBLE");
    assert.ok(!/pending/i.test(http.json.message));
    assert.equal(await snapshotState(u), before);
  });

  await check("SPD-08", "F-22 expiry boundary: expiresAt == operation time is expired; one millisecond later is reversible", async () => {
    await resetAdCredits();
    const u = await newUser("u_x_boundary");
    const T = new Date("2032-06-01T12:00:00.000Z");
    await set(OPS, "op_b_equal", {
      userId: u, amount: 10, amountUnits: 1000, purpose: "b", isReversed: false,
      lotsDeducted: [{ lotId: "lot_b1", amountDeducted: 10, amountDeductedUnits: 1000, lotType: "BASE", lotSource: "TOPUP", expiresAt: T.toISOString() }],
      createdAt: nowIso(),
    });
    await set(OPS, "op_b_after", {
      userId: u, amount: 10, amountUnits: 1000, purpose: "b", isReversed: false,
      lotsDeducted: [{ lotId: "lot_b2", amountDeducted: 10, amountDeductedUnits: 1000, lotType: "BASE", lotSource: "TOPUP", expiresAt: new Date(T.getTime() + 1).toISOString() }],
      createdAt: nowIso(),
    });
    await assert.rejects(wallet.reverseDebit({ userId: u, originalOperationId: "op_b_equal", now: T, fs: fsdb }), (e) => e.code === "EXPIRED_CREDITS_NOT_REVERSIBLE");
    const ok = await wallet.reverseDebit({ userId: u, originalOperationId: "op_b_after", now: T, fs: fsdb });
    assert.equal(ok.restoredUnits, 1000);
    assert.equal(ok.lots[0].expiresAt, new Date(T.getTime() + 1).toISOString(), "original expiry preserved, validity not extended");
  });

  await check("SPD-09", "Reversal rejects operations without recorded allocations instead of minting a fresh 730-day lot", async () => {
    await resetAdCredits();
    const u = await newUser("u_x_noprov");
    await set(OPS, "op_noprov", { userId: u, amount: 5, amountUnits: 500, purpose: "legacy", isReversed: false, lotsDeducted: [], createdAt: nowIso() });
    const before = await snapshotState(u);
    await assert.rejects(wallet.reverseDebit({ userId: u, originalOperationId: "op_noprov", fs: fsdb }), (e) => e.statusCode === 422 && /PROVENANCE/.test(e.code));
    assert.equal(await snapshotState(u), before);
  });

  await check("SPD-10", "F-23 integer precision / range validation: invalid amounts are refused with zero mutations", async () => {
    await resetAdCredits();
    const u = await newUser("u_x_prec");
    await seedLots(u, [{ id: "lot_pr_1", units: 100000, expiresAt: future() }]);
    const before = await snapshotState(u);
    const bad = [0.001, 0.1 + 0.2, "1.005", "1e3", 1e21, NaN, Infinity, -5, 0, "0", "-0", "abc", "10.5.1", "", null, undefined, {}, [], true, "9".repeat(30)];
    let i = 0;
    for (const amount of bad) {
      await assert.rejects(wallet.spendCredits({ userId: u, amount, operationId: `op_bad_${i++}`, fs: fsdb }), undefined, `amount ${String(amount)} must be refused`);
    }
    for (const operationId of ["", "  ", "a/b", "rev_x", "x".repeat(300), null]) {
      await assert.rejects(wallet.spendCredits({ userId: u, amount: 1, operationId, fs: fsdb }), undefined, `operationId ${String(operationId)} must be refused`);
    }
    assert.equal(await snapshotState(u), before);
    await assert.rejects(wallet.grantCredits({ userId: u, amount: -5, bonus: 10, source: "TOPUP", fs: fsdb }));
    await assert.rejects(wallet.grantCredits({ userId: u, amount: 1e12, source: "TOPUP", fs: fsdb }));
    assert.equal(await snapshotState(u), before);
    const ok = await wallet.spendCredits({ userId: u, amount: "0.01", operationId: "op_min", fs: fsdb });
    assert.equal(ok.debitedUnits, 1);
    const big = await wallet.spendCredits({ userId: u, amount: 999.99, operationId: "op_big", fs: fsdb });
    assert.equal(big.debitedUnits, 99999);
    await reconcile(u);
  });

  // ═════════════════════════ SECURITY & REGRESSION (F-24 … F-30) ═════════════════════════

  await check("SEC-01", "F-24 maintenance refuses anonymous, shared-app-key and wrong-secret callers BEFORE any database access", async () => {
    await resetAdCredits();
    const u = await newUser("u_x_secure");
    await seedLots(u, [{ id: "lot_sec_1", units: 100, expiresAt: past() }]);
    let dbCalls = 0;
    const origCollection = fsdb.collection;
    const origTx = fsdb.runTransaction;
    const origDoc = fsdb.doc;
    const origGetAll = fsdb.getAll;
    fsdb.collection = function (...a) { dbCalls++; return origCollection.apply(this, a); };
    fsdb.runTransaction = function (...a) { dbCalls++; return origTx.apply(this, a); };
    fsdb.doc = function (...a) { dbCalls++; return origDoc.apply(this, a); };
    fsdb.getAll = function (...a) { dbCalls++; return origGetAll.apply(this, a); };
    try {
      const attempts = [
        call("GET", "/cron/daily"),
        call("POST", "/cron/daily"),
        call("GET", "/cron/daily?key=test-app-key"),
        call("GET", "/cron/adCreditsExpiry"),
        call("GET", "/cron/adCreditsExpiry?key=test-app-key"),
        call("GET", "/cron/daily", { headers: { authorization: "Bearer test-app-key" } }),
        call("GET", "/cron/daily", { headers: { authorization: "Bearer wrong" } }),
        call("GET", "/cron/daily", { headers: { authorization: `Bearer ${adminToken("adc_super")}` } }),
      ];
      for (const r of await Promise.all(attempts)) assert.equal(r.status, 401);
    } finally {
      fsdb.collection = origCollection; fsdb.runTransaction = origTx; fsdb.doc = origDoc; fsdb.getAll = origGetAll;
    }
    assert.equal(dbCalls, 0, `unauthenticated maintenance touched the database ${dbCalls} time(s)`);
    assert.equal((await get(LOTS, "lot_sec_1")).status, "ACTIVE");
    const ok = await call("GET", "/cron/adCreditsExpiry", { headers: { authorization: "Bearer test-cron" } });
    assert.equal(ok.status, 200);
    assert.equal((await get(LOTS, "lot_sec_1")).status, "EXPIRED");
  });

  await check("SEC-02", "F-25 admin maintenance: unauthorized roles refused, input validated, limits enforced", async () => {
    await resetAdCredits();
    const u = await newUser("u_x_adm");
    await seedLots(u, Array.from({ length: 4 }, (_, i) => ({ id: `lot_adm_${i}`, units: 100, expiresAt: past() })));
    await h.set("admins", "adc_agency", { email: "agency@test.local", role: "AGENCY_ADMIN", agencyId: "ag1", isActive: true, isBlock: false });
    await h.set("admins", "adc_blocked", { email: "blocked@test.local", role: "SUPER_ADMIN", isActive: true, isBlock: true });
    const path = "/admin/adCredits/maintenance/expire";
    assert.equal((await call("POST", path, { body: {} })).status, 401);
    assert.equal((await call("POST", path, { headers: { authorization: "garbage" }, body: {} })).status, 401);
    assert.equal((await adminCall("POST", path, "adc_agency", {})).status, 403);
    assert.equal((await adminCall("POST", path, "adc_blocked", {})).status, 403);
    assert.equal((await adminCall("POST", path, "adc_missing", {})).status, 401);
    for (const body of [{ batchSize: 0 }, { batchSize: -5 }, { batchSize: "abc" }, { batchSize: 1.5 }, { batchSize: 100000 }, { maxBatches: 0 }, { maxBatches: 999 }, { cursor: "lot_adm_1" }]) {
      const r = await adminCall("POST", path, "adc_super", body);
      assert.equal(r.status, 400, `${JSON.stringify(body)} -> ${r.status}`);
      assert.equal(r.json.code, "INVALID_PARAMETERS");
    }
    assert.deepEqual(await lotStatuses("lot_adm_"), { ACTIVE: 4 }, "rejected requests mutated nothing");
    const ok = await adminCall("POST", path, "adc_super", { batchSize: 2, maxBatches: 1 });
    assert.equal(ok.status, 200);
    assert.equal(ok.json.result.expiredLotsCount, 2);
    assert.equal(ok.json.result.moreWork, true);
    assert.equal(ok.json.result.processedLotIds, undefined);
    assert.equal(ok.json.result.nextCursor, undefined);
  });

  await check("SEC-03", "F-26 owner wallet + paginated history succeed; cross-user and malformed pagination refused", async () => {
    await resetAdCredits();
    const owner = await newUser("u_x_hist");
    const other = await newUser("u_x_hist_other");
    const tok = await idToken(owner);
    const base = Date.now();
    for (let i = 0; i < 7; i++) {
      await set(LEDGER, `adc_hist_${i}`, { userId: owner, direction: i % 2 ? "DEBIT" : "CREDIT", creditUnits: 100 + i, credits: (100 + i) / 100, source: "TEST", createdAt: new Date(base + (i < 3 ? 0 : i * 1000)).toISOString() });
    }
    await set(LEDGER, "adc_hist_other", { userId: other, direction: "CREDIT", creditUnits: 1, credits: 0.01, source: "TEST", createdAt: nowIso() });
    const seen = [];
    let cursor = null;
    for (let page = 0; page < 6; page++) {
      const r = await call("GET", `/client/adCredits/history?limit=3${cursor ? `&startAfter=${cursor}` : ""}`, { token: tok });
      assert.equal(r.status, 200);
      if (!r.json.history.length) break;
      seen.push(...r.json.history.map((e) => e.id));
      cursor = r.json.history[r.json.history.length - 1].id;
    }
    assert.equal(seen.length, 7, "every ledger row exactly once across pages, ties included");
    assert.equal(new Set(seen).size, 7);
    assert.ok(!seen.includes("adc_hist_other"));
    assert.equal((await call("GET", "/client/adCredits/history?startAfter=adc_hist_other", { token: tok })).status, 400, "another user's row is not a valid cursor");
    assert.equal((await call("GET", "/client/adCredits/history?startAfter=nope_missing", { token: tok })).status, 400);
    assert.equal((await call("GET", "/client/adCredits/history?direction=SIDEWAYS", { token: tok })).status, 400);
    assert.equal((await call("GET", `/client/adCredits/history?userId=${other}`, { token: tok })).status, 403);
    const w = await call("GET", "/client/adCredits/wallet", { token: tok });
    assert.equal(w.status, 200);
  });

  await check("SEC-04", "F-27 public consume stays disabled and mutates nothing", async () => {
    await resetAdCredits();
    const u = await newUser("u_x_consume");
    await seedLots(u, [{ id: "lot_cn_1", units: 5000, expiresAt: future() }]);
    const tok = await idToken(u);
    const before = await snapshotState(u);
    for (const body of [{ amount: 1, purpose: "x" }, { operationId: "op_x", purpose: "PROMOTION_CAMPAIGN", amount: 1 }, {}]) {
      const r = await call("POST", "/client/adCredits/consume", { token: tok, body });
      assert.equal(r.status, 400);
      assert.equal(r.json.code, "CONSUMPTION_UNAVAILABLE");
    }
    assert.equal(await snapshotState(u), before);
  });

  const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;
  const hook = (orderId, amountPaise) => {
    const raw = JSON.stringify({ event: "payment.captured", payload: { payment: { entity: { id: `pay_${orderId}`, order_id: orderId, amount: amountPaise, currency: "INR", status: "captured" } } } });
    const sig = crypto.createHmac("sha256", WEBHOOK_SECRET).update(raw).digest("hex");
    return call("POST", "/payment/webhook/razorpay", { raw, headers: { "x-razorpay-signature": sig } });
  };

  await check("SEC-05", "F-28 / F-29 / F-30 verified payment fulfils once under 5 simultaneous webhooks; snapshot survives catalogue edits; wallet reconciles", async () => {
    await resetAdCredits();
    const u = await newUser("u_x_pay");
    const pack = wallet.findPack("pack_100");
    const snap = wallet.snapshotPack(pack);
    await set("paymentTransactions", "adc_x_txn_1", {
      userId: u, gateway: "razorpay", purpose: "ad_credits", packId: pack.id, adCreditPack: snap,
      amountInr: snap.priceINR, currency: "INR", orderId: "order_x_1", status: "created", fulfilled: false, createdAt: nowIso(),
    });
    // catalogue edited AFTER the order was created
    const catalogue = (await fsdb.collection("settings").doc("main").get()).data() || {};
    const edited = (wallet.getPacks() || []).map((p) => (p.id === "pack_100" ? { ...p, credits: 500, bonusPercent: 50, priceINR: 999, validityDays: 5 } : p));
    await setSettings({ adCreditPacks: edited.map((p) => ({ id: p.id, name: p.name, credits: p.credits, bonusPercent: p.bonusPercent, priceINR: p.priceINR, validityDays: p.validityDays, isActive: p.isActive })) });
    try {
      const rs = await Promise.all(Array.from({ length: 5 }, () => hook("order_x_1", Math.round(snap.priceINR * 100))));
      for (const r of rs) assert.equal(r.status, 200);
      const rec = await reconcile(u);
      assert.equal(rec.user.adCreditsBalanceUnits, 10000);
      assert.equal(rec.lots.length, 2);
      const base = rec.lots.find((l) => l.type === "BASE");
      const bonus = rec.lots.find((l) => l.type === "BONUS");
      assert.equal(base.amountUnits, 9804);
      assert.equal(bonus.amountUnits, 196);
      const days = Math.round((Date.parse(base.expiresAt) - Date.now()) / DAY);
      assert.ok(days >= 729 && days <= 730, `validity must follow the purchased snapshot (730d), got ${days}d`);
      assert.equal(rec.ledger.filter((e) => e.paymentTransactionId === "adc_x_txn_1").length, 1);
    } finally {
      if (catalogue.adCreditPacks) await setSettings({ adCreditPacks: catalogue.adCreditPacks });
      else {
        await fsdb.collection("settings").doc("main").update({ adCreditPacks: admin.firestore.FieldValue.delete() });
        await setSettings({});
      }
    }
  });

  await check("SEC-06", "Expiry, spend and reversal never touch reward coins, INR or partner balances", async () => {
    await resetAdCredits();
    const money = { coin: 4321, totalEarningAmount: 77.5, totalRewardCoin: 900, partnerBalance: 12.5, withdrawableBalance: 40 };
    const u = await newUser("u_x_money", { extra: money });
    await seedLots(u, [
      { id: "lot_mn_1", units: 1000, expiresAt: past() },
      { id: "lot_mn_2", units: 8000, expiresAt: future() },
    ]);
    await expire({ batchSize: 10 });
    await wallet.spendCredits({ userId: u, amount: 20, operationId: "op_mn", fs: fsdb });
    await wallet.reverseDebit({ userId: u, originalOperationId: "op_mn", fs: fsdb });
    const after = await getUser(u);
    for (const [k, v] of Object.entries(money)) assert.equal(after[k], v, `${k} changed`);
    await reconcile(u);
  });
};
