// AUDIT: can a lower-privilege admin plant markup that the Super Admin UI renders as HTML?
// Sink (static): admin/frontend/src/Component/Pages/DigitalPartner/PartnerDetail.js:86 builds a SweetAlert `html:` string with the partner's email.
"use strict";
const jwt = require("jsonwebtoken");

module.exports = async (h, check, assert) => {
  const { call, set } = h;
  const tok = (id, role) => jwt.sign({ _id: id, role }, "test-jwt", { expiresIn: "1h" });
  const admin = async (id, role, extra = {}) => { await set("admins", id, { name: id, email: `${id}@t.local`, role, isActive: true, ...extra }); return tok(id, role); };
  await set("agencies", "xs_ag", { name: "XS", state: "TN", district: "Trichy", isActive: true });
  const fr = await admin("xs_fr", "AGENCY_ADMIN", { agencyId: "xs_ag" });
  const sup = await admin("xs_sup", "SUPER_ADMIN");
  const payload = "<img/src=x/onerror=alert(document.domain)>@a.bc";

  await check("XSS-01", "a franchise login cannot create a partner whose email contains HTML markup", async () => {
    const r = await call("POST", "/admin/franchisePortal/partners/create", { headers: { authorization: fr }, body: { fullName: "Mallory", email: payload, mobileNumber: "9876543210", password: "Sup3rSecret!", licenseFeeInr: 0 } });
    assert.ok(r.json.status !== true, `server accepted the markup email: ${JSON.stringify(r.json).slice(0, 200)}`);
  });

  await check("XSS-02", "the credentials returned to the Super Admin for a partner never contain unescaped markup", async () => {
    const users = await h.fsdb.collection("users").where("fullName", "==", "Mallory").get();
    if (users.empty) return; // partner was refused: nothing to render
    const uid = users.docs[0].id;
    const r = await call("POST", "/admin/digitalPartner/regeneratePassword", { headers: { authorization: sup }, body: { userId: uid } });
    const email = r.json && r.json.portalCredentials && r.json.portalCredentials.email;
    assert.ok(!/[<>]/.test(String(email || "")), `portalCredentials.email returned verbatim: ${email}`);
  });
};
