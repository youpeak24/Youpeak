// Admin panel visual/functional sweep against the LOCAL demo stack only (emulators + demo data).
// Logs in with the documented demo fixtures (local-dev/config.js), visits every route a role may open at
// 4 viewport widths, and records horizontal overflow, console/page errors, HTTP >= 400 API answers, blank pages
// and unlabelled controls. Never targets production. usage: node cdp-admin.cjs <role: super|franchise|partner>
"use strict";
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const EDGE = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const BASE = "http://localhost:3055";
const role = process.argv[2];
const cfgPath = path.join(__dirname, "..", "..", "..", "..", "local-dev", "config.js");
const cfg = require(cfgPath);
const ACCOUNTS = { super: "superadmin@youpeak.test", franchise: "district@youpeak.test", partner: "partner@youpeak.test" };
const ROUTES = {
  super: ["mainDashboard", "agency", "agencyReports", "manageDigitalPartner", "digitalPartnerReports", "videoPromotions", "membershipTiers", "fraudManagement", "referralManagement", "moderationQueue", "duplicateScreening", "config/tasker", "config/creatorPasses", "config/partnerProgram", "config/boost", "config/payouts", "config/safety", "config/adCredits", "userTable", "videos", "shorts", "channel", "sound", "settingPage", "profile", "allreport", "premiumPlanTable", "coinPlanTable", "coinplanhistory", "withdrawRequest", "reward", "allmonetizationRequest", "adminEarnings"],
  franchise: ["agencyDashboard", "franchisePartners", "franchiseReferrals", "agencyReports", "digitalPartnerReports", "profile"],
  partner: ["partnerDashboard", "partnerReferrals", "partnerRewards", "partnerWallet", "partnerLocalBusinessAds", "digitalPartnerReports", "profile"],
};
const outDir = path.join(__dirname, "..", "screenshots", "admin-" + role);
fs.mkdirSync(outDir, { recursive: true });
const port = 9700 + Math.floor(Math.random() * 90);
const profile = fs.mkdtempSync(path.join(require("os").tmpdir(), "edge-admin-"));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const proc = spawn(EDGE, [`--remote-debugging-port=${port}`, "--headless=new", `--user-data-dir=${profile}`, "--no-first-run", "about:blank"], { stdio: "ignore" });
  let targets;
  for (let i = 0; i < 40; i++) { try { targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); if (targets.length) break; } catch (_) {} await sleep(250); }
  const ws = new WebSocket(targets.find((t) => t.type === "page").webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  let id = 0; const pending = new Map(); let events = [];
  ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); } else if (d.method) events.push(d); };
  const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async (e) => { const r = await send("Runtime.evaluate", { expression: e, returnByValue: true, awaitPromise: true }); return r.result.result ? r.result.result.value : undefined; };
  for (const d of ["Page", "Runtime", "Network", "Log"]) await send(d + ".enable");
  const reqUrls = new Map();

  // ---- login
  await send("Emulation.setDeviceMetricsOverride", { width: 1366, height: 768, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url: BASE + "/login" });
  await sleep(4000);
  await ev(`(()=>{const set=(el,v)=>{const s=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;s.call(el,v);el.dispatchEvent(new Event('input',{bubbles:true}));};const i=[...document.querySelectorAll('input')];set(i.find(x=>x.type==='email'||/mail/i.test(x.placeholder)||/mail/i.test(x.name))||i[0],${JSON.stringify(ACCOUNTS[role])});set(i.find(x=>x.type==='password'),${JSON.stringify(cfg.PASSWORD || "Test@1234")});})()`);
  await ev(`[...document.querySelectorAll('button')].find(b=>/sign in/i.test(b.textContent)).click()`);
  await sleep(5000);
  const authed = await ev(`JSON.stringify({token:!!sessionStorage.getItem('token'),isAuth:sessionStorage.getItem('isAuth'),path:location.pathname,role:(JSON.parse(sessionStorage.getItem('admin')||'{}')||{}).role})`);
  console.log("login:", authed);
  if (!JSON.parse(authed).token) { console.log("LOGIN FAILED"); ws.close(); proc.kill(); process.exit(2); }

  const report = { role, login: JSON.parse(authed), pages: [] };
  for (const [w, h] of [[1920, 1080], [1366, 768], [768, 1024], [390, 844]]) {
    await send("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 1, mobile: w < 700 });
    for (const r of ROUTES[role]) {
      events = []; reqUrls.clear();
      await ev(`history.pushState({}, '', '/admin/${r}'); window.dispatchEvent(new PopStateEvent('popstate'))`);
      await sleep(3200);
      const info = JSON.parse(await ev(`JSON.stringify({path:location.pathname,iw:innerWidth,sw:document.documentElement.scrollWidth,bodySw:document.body.scrollWidth,textLen:(document.body.innerText||'').trim().length,h1:(document.querySelector('h1,h2,h3,h4,h5,h6')||{}).textContent||'',unlabelled:[...document.querySelectorAll('button,a,input,select')].filter(e=>!(e.getAttribute('aria-label')||e.title||(e.textContent||'').trim()||(e.labels&&e.labels.length)||e.getAttribute('placeholder'))).length,rawKeys:(document.body.innerText.match(/\\b[a-z]+[A-Z][A-Za-z]+\\.[a-zA-Z]+\\b/g)||[]).slice(0,5),toast:(document.querySelector('.Toastify__toast,.swal2-popup')||{}).textContent||''})`));
      const failures = [];
      const urlById = new Map();
      for (const e of events) { if (e.method === "Network.requestWillBeSent") urlById.set(e.params.requestId, e.params.request.url); if (e.method === "Network.responseReceived" && e.params.response.status >= 400) failures.push(`${e.params.response.status} ${(urlById.get(e.params.requestId) || e.params.response.url).replace(/^https?:\/\/[^/]+/, "").split("?")[0]}`); }
      const errs = events.filter((e) => e.method === "Runtime.exceptionThrown").map((e) => (e.params.exceptionDetails.exception && e.params.exceptionDetails.exception.description || e.params.exceptionDetails.text).slice(0, 160));
      const cerr = events.filter((e) => e.method === "Runtime.consoleAPICalled" && e.params.type === "error").map((e) => (e.params.args || []).map((a) => a.value ?? a.description ?? "").join(" ").slice(0, 160));
      const shot = await send("Page.captureScreenshot", { format: "jpeg", quality: 55 });
      const file = `${r.replace(/\//g, "-")}-${w}.jpg`;
      fs.writeFileSync(path.join(outDir, file), Buffer.from(shot.result.data, "base64"));
      report.pages.push({ route: "/admin/" + r, width: w, file, redirectedTo: info.path !== "/admin/" + r ? info.path : null, overflowX: info.sw > info.iw + 1, scrollWidth: info.sw, textLen: info.textLen, heading: info.h1.trim().slice(0, 60), unlabelled: info.unlabelled, rawKeys: info.rawKeys, apiFailures: [...new Set(failures)].slice(0, 6), pageErrors: errs.slice(0, 3), consoleErrors: cerr.slice(0, 3) });
    }
  }
  fs.writeFileSync(path.join(outDir, "report.json"), JSON.stringify(report, null, 1));
  const bad = report.pages.filter((p) => p.overflowX || p.apiFailures.length || p.pageErrors.length || p.redirectedTo || p.textLen < 20);
  console.log(`pages checked: ${report.pages.length}; with a problem signal: ${bad.length}`);
  ws.close(); proc.kill();
  try { fs.rmSync(profile, { recursive: true, force: true }); } catch (_) {}
  process.exit(0);
})().catch((e) => { console.error("FAILED", e); process.exit(1); });
