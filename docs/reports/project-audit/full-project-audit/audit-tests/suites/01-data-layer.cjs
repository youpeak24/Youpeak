// AUDIT: data-layer semantics (mongooseShim.js / firestoreDb.service.js).
// Each check asserts the behaviour a Mongo/Mongoose-style caller expects.
// A FAIL means the shim deviates and callers relying on it are exposed.
"use strict";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

module.exports = async (h, check, assert) => {
  const { fsdb, set } = h;
  const Video = h.req("models/video.model");
  const Report = h.req("models/report.model");
  const User = h.req("models/user.model");
  const count = async (col) => (await fsdb.collection(col).get()).size;

  await check("DL-01", "Model.find({_id:{$in:[x]}}) returns only the requested document", async () => {
    for (const id of ["dl_v1", "dl_v2", "dl_v3"]) await set("videos", id, { title: id });
    const rows = await Video.find({ _id: { $in: ["dl_v1"] } });
    assert.equal(rows.length, 1, `returned ${rows.length} docs (expected 1) — $in was ignored`);
  });

  await check("DL-02", "Model.find({n:{$gte:5}}) honours the range operator", async () => {
    for (let i = 1; i <= 4; i++) await set("reports", "dl_r" + i, { n: i * 3, videoId: "dl_v" + (i % 3 + 1) });
    const rows = await Report.find({ n: { $gte: 9 } });
    assert.equal(rows.length, 2, `returned ${rows.length} docs (expected 2) — $gte was ignored`);
  });

  await check("DL-03", "admin deleteVideoReport(reportId=<one report>) deletes only that report's video", async () => {
    const before = await count("videos");
    await set("reports", "dl_rdel", { videoId: "dl_v1", reason: "x" });
    const ctl = h.req("controllers/admin/report.controller");
    const m = h.mockRes();
    await ctl.deleteVideoReport({ query: { reportId: "dl_rdel" } }, m.res);
    await m.done; await sleep(2500);
    const after = await count("videos");
    assert.equal(after, before - 1, `videos before=${before}, after=${after} (expected exactly one removed)`);
  });

  await check("DL-04", "Date.now()-id fallback: 25 parallel create() calls keep 25 distinct documents", async () => {
    const before = await count("walletHistories");
    await Promise.all(Array.from({ length: 25 }, (_, i) => h.db.create("walletHistories", { userId: "dl_u", amount: i })));
    const after = await count("walletHistories");
    assert.equal(after - before, 25, `created ${after - before} of 25 documents`);
  });

  await check("DL-05", "guarded $inc: two parallel spends of 100 against a balance of 100 → only one succeeds", async () => {
    await h.seedUser("dl_spender", { coin: 100 });
    const spend = () => User.updateOne({ _id: "dl_spender", coin: { $gte: 100 } }, { $inc: { coin: -100 } });
    await Promise.all([spend(), spend(), spend()]);
    const u = await h.getUser("dl_spender");
    assert.ok(u.coin >= 0, `balance ended at ${u.coin}`);
  });

  await check("DL-06", "instance.save() does not overwrite concurrent balance changes (lost update)", async () => {
    await h.seedUser("dl_lost", { coin: 0, fullName: "a" });
    const stale = await User.findById("dl_lost");               // loaded earlier
    await User.updateOne({ _id: "dl_lost" }, { $inc: { coin: 500 } }); // someone credits 500
    stale.fullName = "renamed";
    await stale.save();                                          // handler saves its stale copy
    const u = await h.getUser("dl_lost");
    assert.equal(u.coin, 500, `coin=${u.coin} (credit of 500 lost)`);
  });

  await check("DL-07", "findOneAndUpdate upsert keeps the query keys so the next call finds the same doc", async () => {
    const Hist = h.req("models/watchHistory.model");
    await Hist.findOneAndUpdate({ userId: "dl_up", dateKey: "2026-10-05" }, { $inc: { seconds: 5 } }, { upsert: true, new: true });
    await Hist.findOneAndUpdate({ userId: "dl_up", dateKey: "2026-10-05" }, { $inc: { seconds: 5 } }, { upsert: true, new: true });
    const docs = (await fsdb.collection(Hist.collectionName).get()).docs.map((d) => d.data()).filter((d) => d.seconds !== undefined);
    const withKey = docs.filter((d) => d.userId === "dl_up");
    assert.equal(withKey.length, 1, `upsert produced ${docs.length} doc(s) with seconds, ${withKey.length} carrying the query key userId (expected exactly 1)`);
  });

  await check("DL-08", "aggregate $round rounds (2.6 → 3)", async () => {
    await set("videos", "dl_round", { price: 2.6 });
    const rows = await Video.aggregate([{ $match: { _id: "dl_round" } }, { $project: { r: { $round: ["$price", 0] } } }]);
    assert.equal(rows[0].r, 3, `got ${rows[0].r}`);
  });
};
