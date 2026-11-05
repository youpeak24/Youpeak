// Admin SPA state checks against the LOCAL demo stack: unauthorised route (UI redirect), unknown route,
// offline behaviour, expired/invalid token (401) handling, and browser back navigation.
"use strict";
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const EDGE = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const BASE = "http://localhost:3055";
const cfg = require(path.join(__dirname, "..", "..", "..", "..", "local-dev", "config.js"));
const outDir = path.join(__dirname, "..", "screenshots", "admin-states");
fs.mkdirSync(outDir, { recursive: true });
const port = 9800 + Math.floor(Math.random() * 90);
const profile = fs.mkdtempSync(path.join(require("os").tmpdir(), "edge-states-"));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const proc = spawn(EDGE, [`--remote-debugging-port=${port}`, "--headless=new", `--user-data-dir=${profile}`, "--no-first-run", "about:blank"], { stdio: "ignore" });
  let targets;
  for (let i = 0; i < 40; i++) { try { targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); if (targets.length) break; } catch (_) {} await sleep(250); }
  const ws = new WebSocket(targets.find((t) => t.type === "page").webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  let id = 0; const pending = new Map();
  ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); } };
  const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async (e) => { const r = await send("Runtime.evaluate", { expression: e, returnByValue: true, awaitPromise: true }); return r.result.result ? r.result.result.value : undefined; };
  const shot = async (n) => { const s = await send("Page.captureScreenshot", { format: "jpeg", quality: 55 }); fs.writeFileSync(path.join(outDir, n), Buffer.from(s.result.data, "base64")); };
  for (const d of ["Page", "Runtime", "Network"]) await send(d + ".enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1366, height: 768, deviceScaleFactor: 1, mobile: false });
  const login = async (email) => {
    await send("Page.navigate", { url: BASE + "/login" }); await sleep(3500);
    await ev("sessionStorage.clear()"); await send("Page.navigate", { url: BASE + "/login" }); await sleep(3500);
    await ev(`(()=>{const set=(el,v)=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(el,v);el.dispatchEvent(new Event('input',{bubbles:true}));};const i=[...document.querySelectorAll('input')];set(i.find(x=>x.type==='email'||/mail/i.test(x.placeholder))||i[0],${JSON.stringify(email)});set(i.find(x=>x.type==='password'),${JSON.stringify(cfg.PASSWORD || "Test@1234")});})()`);
    await ev(`[...document.querySelectorAll('button')].find(b=>/sign in/i.test(b.textContent)).click()`); await sleep(4500);
  };
  const nav = async (p) => { await ev(`history.pushState({}, '', ${JSON.stringify(p)}); window.dispatchEvent(new PopStateEvent('popstate'))`); await sleep(2500); };
  const out = {};
  // 1. franchise opens a super-admin-only page by URL
  await login("district@youpeak.test");
  await nav("/admin/userTable"); out.franchiseOpensUserTable = { path: await ev("location.pathname") }; await shot("franchise-opens-userTable.jpg");
  await nav("/admin/doesNotExist"); out.unknownRoute = { path: await ev("location.pathname"), textLen: await ev("document.body.innerText.trim().length") }; await shot("unknown-route.jpg");
  // 2. browser back/forward between two pages
  await nav("/admin/franchisePartners"); await nav("/admin/franchiseReferrals"); await ev("history.back()"); await sleep(1500);
  out.back = { path: await ev("location.pathname") };
  // 3. offline
  await send("Network.emulateNetworkConditions", { offline: true, latency: 0, downloadThroughput: 0, uploadThroughput: 0 });
  await nav("/admin/agencyDashboard"); await sleep(2000);
  out.offline = { text: (await ev("document.body.innerText.slice(0,200)")) };
  await shot("offline-dashboard.jpg");
  await send("Network.emulateNetworkConditions", { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
  // 4. invalid token: corrupt the stored JWT then trigger a call
  await ev("sessionStorage.setItem('token','invalid.token.value')");
  await send("Page.reload"); await sleep(4500);
  await nav("/admin/franchiseReferrals"); await sleep(3500);
  out.invalidToken = { path: await ev("location.pathname"), sessionToken: await ev("!!sessionStorage.getItem('token')"), isAuth: await ev("sessionStorage.getItem('isAuth')"), text: await ev("document.body.innerText.slice(0,160)") };
  await shot("invalid-token.jpg");
  // 5. refresh on a deep page keeps the session
  await login("partner@youpeak.test");
  await nav("/admin/partnerWallet"); await send("Page.reload"); await sleep(4000);
  out.refreshKeepsSession = { path: await ev("location.pathname"), heading: await ev("(document.querySelector('h1,h2,h3,h4,h5,h6')||{}).textContent") };
  await login("superadmin@youpeak.test");
  await nav("/admin/doesNotExist"); await sleep(1500);
  out.superAdminUnknownRoute = { path: await ev("location.pathname"), mainText: await ev("(document.querySelector('.mainAdmin')||{}).innerText||''") };
  await shot("super-unknown-route.jpg");
  console.log(JSON.stringify(out, null, 1));
  fs.writeFileSync(path.join(outDir, "states-report.json"), JSON.stringify(out, null, 1));
  ws.close(); proc.kill();
  try { fs.rmSync(profile, { recursive: true, force: true }); } catch (_) {}
  process.exit(0);
})().catch((e) => { console.error("FAILED", e); process.exit(1); });
