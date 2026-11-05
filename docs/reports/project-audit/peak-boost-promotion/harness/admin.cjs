// Admin panel → Video Promotion Campaigns on the isolated local stack (admin
// :3055, API :5055, seeded local super admin only). Captures the list at four
// widths, a campaign's history, and review / pause / resume (each written to
// the campaign's audit history). Run after routes.cjs: it changes local state.
//   NODE_PATH=<scratch tools>/node_modules node admin.cjs [tag]
"use strict";
const fs = require("fs");
const path = require("path");
const L = require("../../migration/harness/lib.cjs");

const CDN = [/^https:\/\/cdn\.jsdelivr\.net\//, /^https:\/\/code\.jquery\.com\//, /^https:\/\/cdnjs\.cloudflare\.com\//];
const OUT = path.join(__dirname, "..", "screenshots", process.argv[2] || "after", "admin");
fs.mkdirSync(OUT, { recursive: true });
const results = [];
const record = (name, ok, detail) => { results.push({ name, ok, detail }); console.log(ok ? "PASS" : "FAIL", name, detail ? JSON.stringify(detail).slice(0, 300) : ""); };

async function clickButton(page, re, within) {
  const handles = await page.$$(`${within || ""} button`);
  for (const b of handles) {
    const t = (await b.evaluate((e) => e.textContent || "")).trim();
    if (re.test(t)) { await b.click(); return t; }
  }
  throw new Error(`button not found: ${re}`);
}
const toasts = (page) => page.$$eval(".Toastify__toast", (els) => els.map((e) => e.textContent.trim()));

(async () => {
  const browser = await L.launch({ width: 1366, height: 768 });
  const { page } = await L.preparePage(browser, { extraAllow: CDN });
  await page.goto("http://localhost:3055/login", { waitUntil: "networkidle2", timeout: 180000 });
  await page.waitForSelector("input[type=password]", { timeout: 60000 });
  await page.type("input[type=email]", "superadmin@youpeak.test");
  await page.type("input[type=password]", "Test@1234");
  await clickButton(page, /^(sign in|log ?in|login)$/i);
  await page.waitForFunction(() => location.pathname.startsWith("/admin/"), { timeout: 30000 });
  await L.sleep(3000);

  await page.goto("http://localhost:3055/admin/videoPromotions", { waitUntil: "networkidle2" });
  await page.waitForFunction(() => document.querySelectorAll("tbody tr").length >= 3 && !/Loading/.test(document.querySelector("tbody").textContent), { timeout: 30000 });
  const rows = await page.$$eval("tbody tr", (trs) => trs.map((tr) => tr.textContent.replace(/\s+/g, " ").trim()));
  record("list shows the three paid local campaigns with delivered / estimated impressions", rows.length === 3 && rows.some((r) => /Weekly Mega Plan/.test(r) && /3 \/ 50,000–75,000/.test(r)), rows);
  for (const [w, h] of [[1920, 1080], [1366, 768], [768, 1024], [390, 844]]) {
    await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
    await L.sleep(1200);
    await page.screenshot({ path: path.join(OUT, `admin-promotions-${w}.png`) });
  }
  await page.setViewport({ width: 1366, height: 768, deviceScaleFactor: 1 });
  await L.sleep(800);

  // Row of the running Weekly Mega campaign.
  const rowSel = async () => {
    const trs = await page.$$("tbody tr");
    for (const tr of trs) if (/My public free video/.test(await tr.evaluate((e) => e.textContent))) return tr;
    throw new Error("running campaign row not found");
  };
  const clickIn = async (re) => {
    const tr = await rowSel();
    for (const b of await tr.$$("button")) if (re.test((await b.evaluate((e) => e.textContent)).trim())) { await b.click(); return; }
    throw new Error(`no ${re} in row`);
  };
  const dates = async () => (await (await rowSel()).evaluate((e) => e.children[7].textContent.trim()));

  const before = await dates();
  await clickIn(/^Mark reviewed$/);
  await L.sleep(2000);
  record("Mark reviewed keeps the campaign dates", (await dates()) === before && /reviewed/.test(await (await rowSel()).evaluate((e) => e.textContent)), { before, after: await dates() });

  await clickIn(/^Pause$/);
  await L.sleep(2000);
  record("Pause → status paused", /paused/.test(await (await rowSel()).evaluate((e) => e.children[5].textContent)));
  await page.screenshot({ path: path.join(OUT, "admin-paused.png") });
  await clickIn(/^Resume$/);
  await L.sleep(2000);
  record("Resume → active again", /active/.test(await (await rowSel()).evaluate((e) => e.children[5].textContent)));

  await clickIn(/^History$/);
  await L.sleep(1500);
  const hist = await page.$$eval("tbody ul li", (lis) => lis.map((li) => li.textContent.trim()));
  record("History lists payment activation and each admin action", ["activated", "reviewed", "paused", "resumed"].every((t) => hist.some((h) => h.includes(`— ${t} by`))), hist);
  await page.screenshot({ path: path.join(OUT, "admin-history.png") });
  record("toasts", true, await toasts(page));

  fs.writeFileSync(path.join(OUT, "admin-results.json"), JSON.stringify(results, null, 2));
  await browser.close();
  process.exit(results.every((r) => r.ok) ? 0 : 1);
})().catch((e) => { console.error("FATAL", e); process.exit(1); });
