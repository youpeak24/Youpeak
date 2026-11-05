// Real-browser check of the new failure states on the isolated local stack
// (emulators + local API + fixture media; web build of the same Dart code the
// Android app runs). The server's answer to ONE endpoint is replaced per
// scenario (401 / 403 / 500 / connection dropped / "no channel"), everything
// else is the real local backend. This is NOT an Android-device result.
//
//   NODE_PATH=<scratch tools>/node_modules node states.cjs [tag] [ids,comma]
"use strict";
const fs = require("fs");
const path = require("path");
const L = require("../../web-tasking/harness/lib.cjs");
const E = require("../../web-release/harness/e2e-lib.cjs");

const BUILD = path.resolve(__dirname, "../../../../youpeak/build/web_android_fix_local");
const FIXTURE = path.resolve(__dirname, "../../../../local-dev/fixtures/fixture-bite-landscape.webm");
const tag = process.argv[2] || "after";
const only = (process.argv[3] || "").split(",").filter(Boolean);
const OUT = path.join(__dirname, "..", "screenshots", tag);
fs.mkdirSync(OUT, { recursive: true });
const W = 1366, H = 768, PORT = 7331;

// ── Replace one endpoint's answer ─────────────────────────────────────────────
let rule = null; // { match: RegExp, action: "abort" | "reply", status, body }
const prepare = L.preparePage;
L.preparePage = (browser, opts = {}) => prepare(browser, {
  ...opts,
  override: async (req) => {
    if (!rule || req.method() === "OPTIONS" || !rule.match.test(req.url())) return false;
    if (rule.action === "abort") { await req.abort("failed"); return true; }
    await req.respond({
      status: rule.status, contentType: "application/json",
      headers: { "access-control-allow-origin": "*" }, body: JSON.stringify(rule.body),
    });
    return true;
  },
});
const reply = (match, status, body) => { rule = { match, action: "reply", status, body }; };
const drop = (match) => { rule = { match, action: "abort" }; };
const real = () => { rule = null; };

const PROFILE = /\/client\/user\/profile/;
const HOME_OF_CHANNEL = /\/client\/user\/detailsOfChannel/;

let sign;
async function openSession(name) {
  const app = await E.openApp({ dir: BUILD, port: PORT, width: W, height: H, profile: path.join(require("os").tmpdir(), `yp-st-${name}-${Date.now()}`), withExternal: false });
  await app.goExternalThenApp({ semantics: false });
  await E.signInByCoords(app.page, sign, "viewer@youpeak.test");
  return app;
}
const labels = async (page) => [...new Set((await L.nodes(page).catch(() => [])).map((n) => n.label).filter(Boolean))];
const shot = (page, name) => page.screenshot({ path: path.join(OUT, `${name}.png`) });

async function toUploadForm(page) {
  await L.tap(page, "Create", { role: "button", after: 1500 });
  const up = await L.findNode(page, "Upload a Video");
  const [chooser] = await Promise.all([page.waitForFileChooser({ timeout: 15000 }), page.mouse.click(up.x, up.y)]);
  await chooser.accept([FIXTURE]);
  await L.sleep(7000);
  const title = (await L.nodes(page)).find((n) => n.label === "Your title here...");
  if (!title) throw new Error("upload form did not open");
  await page.mouse.click(title.x, title.y);
  await L.sleep(400);
  await page.keyboard.type("gate test", { delay: 20 });
  await L.sleep(500);
}
async function pressUpload(page) {
  const btn = (await L.nodes(page)).find((n) => /^(Upload Video|Checking your channel…)$/.test(n.label) && n.role === "button");
  if (!btn) throw new Error("Upload Video button not found");
  await page.mouse.click(btn.x, btn.y);
}

const results = [];
async function scenario(id, name, fn) {
  if (only.length && !only.includes(id)) return;
  const rec = { id, name, ok: true, notes: [], seen: [] };
  results.push(rec);
  const expect = (cond, text) => { if (!cond) { rec.ok = false; rec.notes.push("EXPECTED: " + text); } };
  let app;
  try {
    real();
    app = await openSession(id);
    await fn({ app, page: app.page, expect, rec });
  } catch (e) {
    rec.ok = false;
    rec.notes.push("ERROR: " + e.message);
    if (app) await shot(app.page, `${id}-error`).catch(() => {});
  } finally {
    real();
    if (app) await app.close().catch(() => {});
  }
  console.log(rec.ok ? "PASS" : "FAIL", id, name, rec.notes.join(" | "));
}
const has = (ls, re) => ls.some((l) => re.test(l));

(async () => {
  sign = await E.probeSignInCoords({ dir: BUILD, port: PORT + 1, width: W, height: H, cacheFile: path.join(__dirname, ".coords-states.json") });

  // ── Create → Upload: the channel check before publishing ─────────────────
  const gate = async (id, name, setup, expectFn, { cancel = true } = {}) => scenario(id, name, async (c) => {
    await toUploadForm(c.page);
    setup();
    await pressUpload(c.page);
    await L.sleep(3500);
    const ls = await labels(c.page);
    c.rec.seen = ls.filter((l) => l.length < 140).slice(0, 25);
    await shot(c.page, id);
    await expectFn(c, ls);
  });

  await gate("U1", "no session (401 AUTH_REQUIRED): 'Sign in again', nothing uploaded, form kept",
    () => reply(PROFILE, 401, { status: false, code: "AUTH_REQUIRED", message: "Please sign in again to continue." }),
    (c, ls) => {
      c.expect(has(ls, /Sign in again/), "Sign in again dialog");
      c.expect(has(ls, /noSession|HTTP 401 AUTH_REQUIRED/), "diagnostic shown");
      c.expect(has(ls, /Signing in again clears this form/), "says the form would be lost");
      c.expect(!has(ls, /Create Your Channel|Channel Name/), "must not be sent to channel creation");
    });
  await gate("U2", "expired session the server keeps refusing (401 AUTH_INVALID): Sign in again, not 'no channel'",
    () => reply(PROFILE, 401, { status: false, code: "AUTH_INVALID", message: "Your session has expired. Please sign in again." }),
    (c, ls) => {
      c.expect(has(ls, /Your session has expired/), "expired message");
      c.expect(!has(ls, /Channel Name/), "not the creation form");
    });
  await gate("U3", "permission refused (403 USER_MISMATCH): says it can't upload with this account; no Retry, no Sign in",
    () => reply(PROFILE, 403, { status: false, code: "USER_MISMATCH", message: "You can only do this for your own account." }),
    (c, ls) => {
      c.expect(has(ls, /Can't upload with this account/), "permission title");
      c.expect(has(ls, /HTTP 403 USER_MISMATCH/), "code");
      c.expect(!has(ls, /^Retry$/), "no Retry for a refusal");
    });
  await gate("U4", "connection dropped: 'Couldn't check your channel' + Retry, form and details kept, NOT the creation form",
    () => drop(PROFILE),
    async (c, ls) => {
      c.expect(has(ls, /Couldn't check your channel/), "title");
      c.expect(has(ls, /Check your internet connection/), "connection message");
      c.expect(has(ls, /^Retry$/), "Retry offered");
      c.expect(!has(ls, /Channel Name/), "must not send an owner to channel creation");
      // Retry once the network is back: it proceeds (real backend answers).
      real();
      const retry = (await L.nodes(c.page)).find((n) => n.label === "Retry");
      if (retry) { await c.page.mouse.click(retry.x, retry.y); await L.sleep(4000); }
      const after = await labels(c.page);
      c.rec.afterRetry = after.filter((l) => l.length < 140).slice(0, 20);
      c.expect(!has(after, /Couldn't check your channel/), "dialog gone after Retry");
      await shot(c.page, "U4-after-retry");
    });
  await gate("U5", "server error (500): 'Couldn't check your channel' with the server-side wording",
    () => reply(PROFILE, 500, { status: false, message: "boom" }),
    (c, ls) => {
      c.expect(has(ls, /problem on its side/), "server wording");
      c.expect(has(ls, /^Retry$/), "Retry offered");
    });
  await gate("U6", "the account has no channel yet (profile says isChannel:false): the intended creation flow opens",
    () => reply(PROFILE, 200, { status: true, message: "Retrieve profile of the user.", user: { _id: "local_app_user", isChannel: false, fullName: "x" } }),
    (c, ls) => {
      c.expect(has(ls, /Channel Name|Create Your Channel|Tell us about yourself/), "channel creation form");
    });
  await gate("U7", "owner (real backend): the check passes and publishing starts; with no storage configured locally it says uploads are unavailable (not auth, not 'no channel')",
    () => real(),
    async (c, ls) => {
      c.expect(!has(ls, /Sign in again|Couldn't check your channel|Channel Name/), "no gate dialog");
      await L.sleep(6000);
      const after = await labels(c.page);
      c.rec.afterUpload = after.filter((l) => l.length < 160).slice(0, 25);
      c.expect(has(after, /temporarily unavailable|Retry|Preparing upload|Uploading|upload/i), "upload attempted");
      await shot(c.page, "U7-after");
    });

  // ── Profile → Your Channel ───────────────────────────────────────────────
  const channel = async (id, name, setup, expectFn) => scenario(id, name, async (c) => {
    await L.tap(c.page, "Profile", { role: "button", after: 3500 });
    setup();            // the answer is replaced before the channel page asks
    await L.sleep(300);
    // Open the channel page (the entry exists for an owner).
    const entry = (await L.nodes(c.page)).find((n) => /^Your Channel$/.test(n.label));
    if (entry) await c.page.mouse.click(entry.x, entry.y);
    await L.sleep(5000);
    const ls = await labels(c.page);
    c.rec.seen = ls.filter((l) => l.length < 140).slice(0, 25);
    await shot(c.page, id);
    await expectFn(c, ls);
  });

  await channel("C1", "owner opens their channel (real backend)", () => real(),
    (c, ls) => c.expect(!has(ls, /Retry|Sign in again/) && has(ls, /Subscribers|subscribers|Home|Videos/i), "channel page loaded"));
  await channel("C2", "session ended (401 AUTH_INVALID): 'Sign in again', with the code, no generic message",
    () => reply(HOME_OF_CHANNEL, 401, { status: false, code: "AUTH_INVALID", message: "Your session has expired." }),
    (c, ls) => {
      c.expect(has(ls, /session has expired/i), "expired message");
      c.expect(has(ls, /Sign in again/), "Sign in again action");
      c.expect(!has(ls, /Some thing went wrong/), "generic message gone");
    });
  await channel("C3", "refused (403): says so, shows the code, no Retry loop",
    () => reply(HOME_OF_CHANNEL, 403, { status: false, code: "USER_MISMATCH", message: "You can only do this for your own account." }),
    (c, ls) => {
      c.expect(has(ls, /own account/), "refusal message");
      c.expect(has(ls, /HTTP 403 USER_MISMATCH/), "code");
    });
  await channel("C4", "connection dropped: says it couldn't reach YouPeak and offers Retry",
    () => drop(HOME_OF_CHANNEL),
    (c, ls) => {
      c.expect(has(ls, /Couldn't reach YouPeak/), "connection message");
      c.expect(has(ls, /Retry/i), "Retry");
    });
  await channel("C5", "server error (500): server-side wording and Retry",
    () => reply(HOME_OF_CHANNEL, 500, { status: false, message: "boom" }),
    (c, ls) => {
      c.expect(has(ls, /problem on its side/), "server wording");
      c.expect(has(ls, /Retry/i), "Retry");
    });

  // ── App start: a failed profile must not sign the user out ───────────────
  const start = async (id, name, setup, expectFn) => scenario(id, name, async (c) => {
    setup();
    await c.page.reload({ waitUntil: "domcontentloaded" });
    await c.page.waitForSelector("flt-semantics-placeholder, flutter-view", { timeout: 90000 });
    await L.sleep(12000);
    await E.ensureSemantics(c.page);
    const ls = await labels(c.page);
    c.rec.seen = ls.filter((l) => l.length < 140).slice(0, 25);
    await shot(c.page, id);
    await expectFn(c, ls);
  });
  await start("S1", "profile times out / fails to load at start: stays signed in with Retry (no logout)",
    () => drop(PROFILE),
    (c, ls) => {
      c.expect(has(ls, /Couldn't load your account/), "retry dialog");
      c.expect(has(ls, /still signed in/i), "says they're still signed in");
      c.expect(!has(ls, /Login to Your Account|Sign in with password/), "not sent to the login screen");
    });
  await start("S2", "server says the account is gone (401 AUTH_NO_ACCOUNT): signs out to login",
    () => reply(PROFILE, 401, { status: false, code: "AUTH_NO_ACCOUNT", message: "Account not found. Please sign in again." }),
    (c, ls) => {
      c.expect(has(ls, /Login to Your Account|Sign in|Let's you in|Continue with/i), "login screen");
    });

  fs.writeFileSync(path.join(OUT, "states-results.json"), JSON.stringify(results, null, 2));
  const failed = results.filter((r) => !r.ok);
  console.log(`\nRESULT ${results.length - failed.length}/${results.length} scenarios passed`);
  process.exit(failed.length ? 1 : 0);
})().catch((e) => { console.error("FATAL", e); process.exit(2); });
