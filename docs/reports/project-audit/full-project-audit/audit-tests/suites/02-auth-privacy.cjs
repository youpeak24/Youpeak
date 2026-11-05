// AUDIT: account privacy and sign-up integrity (client/user + userFirestore controllers).
"use strict";
module.exports = async (h, check, assert) => {
  const { call, fsdb, db } = h;
  let victimId; let victimEmail = "audit.victim@example.test";

  await check("AP-01", "email/password signup creates a user whose document id is not a guessable timestamp", async () => {
    const r = await call("POST", "/client/user/login", { body: { loginType: 4, identity: "dev-a", fcmToken: "tok", email: victimEmail, password: "Aud1t-secret!", fullName: "Audit Victim" } });
    assert.equal(r.json.status, true, JSON.stringify(r.json));
    victimId = String(r.json.user._id || r.json.user.id);
    assert.ok(!/^\d{13}$/.test(victimId), `user id "${victimId}" is a 13-digit epoch-millisecond value`);
  });

  await check("AP-02", "GET aboutOfChannel (public key only, no token) does not expose credential or contact fields", async () => {
    const r = await call("GET", `/client/user/aboutOfChannel?channelId=${victimId}`);
    const ch = r.json.channel || {};
    const leaked = ["passwordHash", "password", "email", "fcmToken", "mobileNumber", "taskAttestation", "totalEarningAmount", "ipAddress", "identity"].filter((k) => ch[k] !== undefined && ch[k] !== null && ch[k] !== "");
    assert.deepEqual(leaked, [], `leaked fields: ${leaked.join(", ")}`);
  });

  await check("AP-03", "POST searchChannel (public key only) returns only public channel fields", async () => {
    const r = await call("POST", "/client/user/searchChannel", { body: { searchString: "Audit", start: 0, limit: 5 } });
    const row = (r.json.channel || [])[0] || {};
    const leaked = ["passwordHash", "email", "fcmToken", "mobileNumber", "identity"].filter((k) => row[k]);
    assert.deepEqual(leaked, [], `leaked fields in search result: ${leaked.join(", ")}`);
  });

  await check("AP-04", "a second email/password signup for an email already used by a Google account does not create a duplicate account", async () => {
    await h.seedUser("ap_google", { email: "audit.google@example.test", loginType: 2 });
    const r = await call("POST", "/client/user/login", { body: { loginType: 4, identity: "dev-b", fcmToken: "tok", email: "audit.google@example.test", password: "Another-pass-1", fullName: "Imposter" } });
    const rows = await h.where("users", "email", "audit.google@example.test");
    assert.equal(rows.length, 1, `signup status=${r.json.status}; ${rows.length} user documents now share that email`);
  });

  await check("AP-05", "failed password attempts are rate-limited (20 wrong passwords in a row)", async () => {
    let refused = 0;
    for (let i = 0; i < 20; i++) {
      const r = await call("POST", "/client/user/login", { body: { loginType: 4, identity: "dev-c", fcmToken: "tok", email: victimEmail, password: "wrong-" + i } });
      if (r.status === 429 || /too many|locked|try again/i.test(String(r.json.message))) refused++;
    }
    assert.ok(refused > 0, "all 20 wrong-password attempts were evaluated; no throttling or lockout");
  });

  await check("AP-06", "deleteUserAccount removes personal data / blocks re-login", async () => {
    const tok = await h.idToken(victimId);
    const d = await call("DELETE", "/client/user/deleteUserAccount", { token: tok });
    assert.equal(d.json.status, true, JSON.stringify(d.json));
    const doc = await h.get("users", victimId);
    assert.ok(!doc.email && !doc.passwordHash, `document still holds email="${doc.email}" passwordHash=${doc.passwordHash ? "present" : "absent"} after deletion`);
  });
};
