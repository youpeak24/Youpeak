// AUDIT: role isolation (Consumer / Admin / Digital Partner / District Franchise) and bypass attempts.
"use strict";
const jwt = require("jsonwebtoken");

module.exports = async (h, check, assert) => {
  const { call, set, seedUser, idToken } = h;
  const tok = (id, role) => jwt.sign({ _id: id, role }, "test-jwt", { expiresIn: "1h" });
  const admin = async (id, role, extra = {}) => { await set("admins", id, { name: id, email: `${id}@t.local`, role, isActive: true, ...extra }); return tok(id, role); };
  const get = (p, t, extra = {}) => call("GET", p, { headers: { authorization: t, ...extra } });

  await set("agencies", "az_agA", { name: "A", state: "TN", district: "Trichy", isActive: true });
  await set("agencies", "az_agB", { name: "B", state: "TN", district: "Madurai", isActive: true });
  await seedUser("az_pA", { isDigitalPartner: true, partnerStatus: "ACTIVE", agencyId: "az_agA", referralCode: "PA", email: "pa@t.local" });
  await seedUser("az_pB", { isDigitalPartner: true, partnerStatus: "ACTIVE", agencyId: "az_agB", referralCode: "PB", email: "pb@t.local" });
  await set("referralHistories", "az_rB", { referrerId: "az_pB", referredUserId: "x1", stage1Completed: true, status: "STAGE1_DONE", createdAt: new Date().toISOString() });
  await set("agencyCommissions", "az_cB", { agencyId: "az_agB", sourceType: "VIDEO_UNLOCK", commissionAmount: 99, grossAmount: 990, payoutStatus: "PENDING", createdAt: new Date().toISOString() });
  await set("agencyCommissions", "az_cA", { agencyId: "az_agA", sourceType: "VIDEO_UNLOCK", commissionAmount: 5, grossAmount: 50, payoutStatus: "PENDING", createdAt: new Date().toISOString() });
  const fA = await admin("az_fA", "AGENCY_ADMIN", { agencyId: "az_agA" });
  const fB = await admin("az_fB", "AGENCY_ADMIN", { agencyId: "az_agB" });
  const pA = await admin("az_ppA", "DIGITAL_PARTNER_ADMIN", { partnerUserId: "az_pA", agencyId: "az_agA" });
  const sup = await admin("az_sup", "SUPER_ADMIN");

  await check("AZ-01", "franchise login cannot reach super-admin routes (users, settings, withdrawals, platform config, payments)", async () => {
    const paths = ["/admin/user/getUsers", "/admin/setting/", "/admin/withDrawalRequest?startDate=All&endDate=All&type=All", "/admin/platformConfig/", "/admin/payment/list", "/admin/agency/getAgencies", "/admin/digitalPartner/list", "/admin/localBusinessAd/list"];
    const open = [];
    for (const p of paths) { const r = await get(p, fA); if (r.status !== 403) open.push(`${p}→${r.status}`); }
    assert.deepEqual(open, [], open.join(", "));
  });

  await check("AZ-02", "partner login cannot reach franchise or super-admin routes", async () => {
    const paths = ["/admin/franchisePortal/dashboard", "/admin/franchisePortal/partners", "/admin/user/getUsers", "/admin/agencyReport/getAgencyReport", "/admin/commission/getCommissions"];
    const open = [];
    for (const p of paths) { const r = await get(p, pA); if (r.status !== 403) open.push(`${p}→${r.status}`); }
    assert.deepEqual(open, [], open.join(", "));
  });

  await check("AZ-03", "franchise A cannot read, edit, suspend or remove franchise B's partner", async () => {
    const d = await get("/admin/franchisePortal/partners/detail?userId=az_pB", fA);
    const u = await call("PATCH", "/admin/franchisePortal/partners/update?userId=az_pB", { headers: { authorization: fA }, body: { fullName: "Hacked" } });
    const s = await call("PATCH", "/admin/franchisePortal/partners/status?userId=az_pB", { headers: { authorization: fA }, body: { status: "SUSPENDED" } });
    const r = await call("DELETE", "/admin/franchisePortal/partners/remove?userId=az_pB", { headers: { authorization: fA } });
    const after = await h.getUser("az_pB");
    assert.ok(d.json.status === false && u.json.status === false && s.json.status === false && r.json.status === false && after.partnerStatus === "ACTIVE" && after.isDigitalPartner === true,
      JSON.stringify({ detail: d.json.status, update: u.json.status, status: s.json.status, remove: r.json.status, partnerStatus: after.partnerStatus }));
  });

  await check("AZ-04", "franchise report/commission endpoints ignore an agencyId of another franchise", async () => {
    const rep = await get("/admin/agencyReport/getAgencyReport?agencyId=az_agB", fA);
    const com = await get("/admin/commission/getCommissions?agencyId=az_agB", fA);
    const ids = (com.json.commissions || []).map((c) => c.agencyId);
    assert.ok(com.status === 200 && ids.every((a) => a === "az_agA") && (rep.json.agency || {})._id !== "az_agB" && Number(rep.json.report && rep.json.report.totalCommissionEarned) < 99,
      `commissions agencyIds=${ids}; report agency=${(rep.json.agency || {})._id}; earned=${rep.json.report && rep.json.report.totalCommissionEarned}`);
  });

  await check("AZ-05", "partner login report only returns the partner's own row even with partnerUserId of another partner", async () => {
    const r = await get("/admin/digitalPartner/report?partnerUserId=az_pB", pA);
    const rows = r.json.partners || [];
    assert.ok(rows.every((p) => p.userId === "az_pA"), `rows for: ${rows.map((p) => p.userId)}`);
  });

  await check("AZ-06", "franchise cannot mutate commission payout status or verification (super admin only)", async () => {
    const a = await call("POST", "/admin/commission/updatePayoutStatus", { headers: { authorization: fA }, body: { commissionId: "az_cA", payoutStatus: "PAID" } });
    const b = await call("PATCH", "/admin/commission/verify", { headers: { authorization: fA }, body: { commissionId: "az_cA", decision: "VERIFIED" } });
    assert.ok(a.status === 403 && b.status === 403, `updatePayoutStatus=${a.status}, verify=${b.status}`);
  });

  await check("AZ-07", "an app user's Firebase token / shared key cannot call admin routes", async () => {
    await seedUser("az_user");
    const t = await idToken("az_user");
    const withToken = await get("/admin/user/getUsers", `Bearer ${t}`);
    const keyOnly = await get("/admin/user/getUsers", undefined);
    assert.ok(withToken.status === 401 && keyOnly.status === 401, `token=${withToken.status}, keyOnly=${keyOnly.status}`);
  });

  await check("AZ-08", "an admin JWT cannot be used for per-user client routes, and a user cannot act on another userId", async () => {
    const r1 = await call("GET", "/client/tasker/dashboard", { headers: { authorization: `Bearer ${sup}` } });
    await seedUser("az_user2");
    const t = await idToken("az_user");
    const r2 = await call("GET", "/client/user/profile?userId=az_user2", { token: t });
    assert.ok(r1.status === 401 && r2.status === 403, `adminJwt→${r1.status}, otherUser→${r2.status}`);
  });

  await check("AZ-09", "unauthenticated server-to-server endpoints refuse unsigned calls (cron, fingerprint worker, payment & stream webhooks)", async () => {
    const out = [];
    const cron = await call("GET", "/cron/daily"); if (cron.status !== 401) out.push(`cron ${cron.status}`);
    const fq = await call("GET", "/internal/fingerprint/queue"); if (fq.status !== 401) out.push(`fingerprint ${fq.status}`);
    const pw = await call("POST", "/payment/webhook/razorpay", { raw: JSON.stringify({ event: "payment.captured" }) }); if (pw.status !== 400) out.push(`payment webhook ${pw.status}`);
    const sw = await call("POST", "/stream/webhook", { raw: JSON.stringify({ uid: "a".repeat(32) }) }); if (sw.status !== 400) out.push(`stream webhook ${sw.status}`);
    assert.deepEqual(out, [], out.join(", "));
  });

  await check("AZ-10", "a suspended partner / deactivated franchise token stops working immediately", async () => {
    await h.fsdb.collection("users").doc("az_pA").set({ partnerStatus: "SUSPENDED" }, { merge: true });
    await h.fsdb.collection("agencies").doc("az_agB").set({ isActive: false }, { merge: true });
    const p = await get("/admin/partnerPortal/dashboard", pA);
    const f = await get("/admin/franchisePortal/dashboard", fB);
    assert.ok(p.status === 403 && f.status === 403, `partner=${p.status}, franchise=${f.status}`);
  });

  await check("AZ-11", "Express path normalisation cannot bypass the role allow-list (case, trailing slash, double slash, /api prefix)", async () => {
    const tries = ["/admin/User/getUsers", "/admin//user/getUsers", "/api/admin/user/getUsers", "/admin/user/getUsers/", "/admin/franchisePortal/../user/getUsers", "/admin/FranchisePortal/partners"];
    const leaked = [];
    for (const p of tries) {
      const r = await get(p, fA);
      if (p.toLowerCase().includes("user/getusers") && r.status === 200 && r.json.status !== false) leaked.push(`${p}→${r.status}`);
    }
    assert.deepEqual(leaked, [], leaked.join(", "));
  });

  await check("AZ-12", "franchise portal works through the documented /api prefix (functional)", async () => {
    const r = await get("/api/admin/franchisePortal/dashboard", fA);
    assert.ok(r.status === 200 && r.json.status === true, `HTTP ${r.status} ${JSON.stringify(r.json).slice(0, 120)}`);
  });
};
