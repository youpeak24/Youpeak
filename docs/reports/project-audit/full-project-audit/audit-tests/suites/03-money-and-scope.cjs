// AUDIT: destructive handlers, date filters, coin → cash conversion, franchise/partner scope.
"use strict";
const jwt = require("jsonwebtoken");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

module.exports = async (h, check, assert) => {
  const { call, fsdb, set, seedUser, idToken } = h;
  const count = async (col) => (await fsdb.collection(col).get()).size;
  const adminToken = async (id, extra = {}) => {
    await set("admins", id, { name: id, email: `${id}@test.local`, role: "SUPER_ADMIN", isActive: true, ...extra });
    return jwt.sign({ _id: id, email: `${id}@test.local`, role: extra.role || "SUPER_ADMIN" }, "test-jwt", { expiresIn: "1h" });
  };

  await check("MS-01", "a normal user deleting THEIR OWN single video (client/video/deleteVideoRecord) deletes only that video", async () => {
    await seedUser("ms_u1"); await seedUser("ms_u2"); await seedUser("ms_u3");
    for (const [v, u] of [["ms_v1", "ms_u1"], ["ms_v2", "ms_u2"], ["ms_v3", "ms_u3"]]) {
      await set("videos", v, { userId: u, title: v, isActive: true, videoType: 1, scheduleType: 2, visibilityType: 1 });
      await set("videoComments", "c_" + v, { videoId: v, userId: u, comment: "hello" });
    }
    const before = await count("videos");
    const tok = await idToken("ms_u1");
    const r = await call("DELETE", "/client/video/deleteVideoRecord?videoId=ms_v1", { token: tok });
    assert.equal(r.json.status, true, JSON.stringify(r.json));
    await sleep(3000);
    const after = await count("videos");
    const commentsLeft = (await fsdb.collection("videoComments").get()).size;
    assert.equal(after, before - 1, `videos before=${before} after=${after}; comments left=${commentsLeft} (other users' videos were deleted by user ms_u1)`);
  });

  await check("MS-02", "admin withdrawal list honours a date range that contains the request", async () => {
    const tok = await adminToken("ms_admin");
    await set("withDrawRequests", "ms_wd1", { userId: "ms_u2", requestAmount: 100, status: 1, createdAt: new Date().toISOString() });
    const all = await call("GET", "/admin/withDrawalRequest?startDate=All&endDate=All&type=All&start=1&limit=20", { headers: { authorization: tok } });
    const ranged = await call("GET", "/admin/withDrawalRequest?startDate=2020-01-01&endDate=2030-12-31&type=All&start=1&limit=20", { headers: { authorization: tok } });
    assert.ok((all.json.request || []).length >= 1, "setup: unfiltered list should show the request: " + JSON.stringify(all.json).slice(0, 200));
    assert.equal((ranged.json.request || []).length, (all.json.request || []).length, `date-ranged list returned ${(ranged.json.request || []).length} of ${(all.json.request || []).length} rows`);
  });

  await check("MS-03", "coins that were PURCHASED with money cannot be converted into withdrawable cash (no ₹ in → ₹ out channel)", async () => {
    await seedUser("ms_buyer", { coin: 10000, purchasedCoin: 10000, totalEarningAmount: 0 });
    const tok = await idToken("ms_buyer");
    const r = await call("GET", "/client/withdrawalRequest/coinToAmountConverter?coin=10000", { token: tok });
    const u = await h.getUser("ms_buyer");
    assert.ok(!(r.json.status === true && u.totalEarningAmount > 0), `converted ${r.json.data} ₹ of purchased coins into withdrawable balance (totalEarningAmount=${u.totalEarningAmount})`);
  });

  await check("MS-04", "resolveAgency prefers the franchise of the user's own district over another franchise in the same state", async () => {
    await set("agencies", "ms_ag_chennai", { name: "Chennai", state: "Tamil Nadu", district: "Chennai", isActive: true });
    await set("agencies", "ms_ag_trichy", { name: "Trichy", state: "Tamil Nadu", district: "Tiruchirappalli", isActive: true });
    const { resolveAgency } = h.req("util/geofence.service");
    const got = await resolveAgency({ state: "Tamil Nadu", district: "Tiruchirappalli" });
    assert.equal(got, "ms_ag_trichy", `resolved to "${got}"`);
  });

  await check("MS-05", "a franchise-created partner cannot receive ad credits that were never paid (self-reported licence fee)", async () => {
    await set("agencies", "ms_ag_fee", { name: "FeeFranchise", state: "Kerala", district: "Kochi", isActive: true, commissionRatePercentage: 10 });
    const { createPartner } = h.req("util/partnerNetwork.service");
    const r = await createPartner({ agencyId: "ms_ag_fee", actorAdminId: "franchise_admin", fullName: "Fake Partner", email: "fake.partner@example.test", mobileNumber: "9876543210", password: "Passw0rd!x", licenseFeeInr: 1000000 });
    const prof = await fsdb.collection("partnerProfiles").where("userId", "==", r.partner.userId).get();
    const bal = prof.docs[0] ? prof.docs[0].data().adCreditsBalance : 0;
    assert.equal(bal, 0, `partner ad-credit balance is ${bal} after an unverified, self-reported licence fee of 1000000`);
  });

  await check("MS-06", "GET client/partner/dashboard does not rotate or disclose the portal password (read-only request)", async () => {
    await seedUser("ms_partner", { isDigitalPartner: true, partnerStatus: "ACTIVE", email: "ms.partner@example.test" });
    await set("partnerProfiles", "pp_ms_partner", { userId: "ms_partner", adCreditsBalance: 0, licenseFeePaid: 0 });
    await set("admins", "ms_portal", { email: "ms.partner@example.test", role: "DIGITAL_PARTNER_ADMIN", partnerUserId: "ms_partner", isDefaultPassword: true, isActive: true, password: "$2a$10$abcdefghijklmnopqrstuuabcdefghijklmnopqrstuvwxyz0123" });
    const tok = await idToken("ms_partner");
    const a = await call("GET", "/client/partner/dashboard", { token: tok });
    const b = await call("GET", "/client/partner/dashboard", { token: tok });
    const pa = a.json.portalCredentials && a.json.portalCredentials.password;
    const pb = b.json.portalCredentials && b.json.portalCredentials.password;
    assert.ok(!pa && !pb, `two GET requests returned two different plaintext portal passwords (${pa ? "present" : "absent"}/${pb ? "present" : "absent"}; differ=${pa !== pb})`);
  });
};
