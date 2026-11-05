// Read-only visual audit of DEPLOYED public pages with headless Edge over the DevTools protocol.
// Only GET navigation to public pages (no login, no form submit). Captures a screenshot per viewport,
// measures horizontal overflow, and records console messages / failed requests.
// usage: node cdp-shots.cjs <url> <label> [waitMs]
"use strict";
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const EDGE = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const [url, label, waitArg] = process.argv.slice(2);
const waitMs = Number(waitArg || 8000);
const outDir = path.join(__dirname, "..", "screenshots");
const widths = [[1920, 1080], [1366, 768], [768, 1024], [390, 844]];
const port = 9333 + Math.floor(Math.random() * 500);
const profile = fs.mkdtempSync(path.join(require("os").tmpdir(), "edge-audit-"));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const proc = spawn(EDGE, [`--remote-debugging-port=${port}`, "--headless=new", "--disable-gpu-sandbox", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", `--user-data-dir=${profile}`, "--no-first-run", "about:blank"], { stdio: "ignore" });
  let targets;
  for (let i = 0; i < 40; i++) { try { targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); if (targets.length) break; } catch (_) {} await sleep(250); }
  const page = targets.find((t) => t.type === "page");
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  let id = 0; const pending = new Map(); const events = [];
  ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); } else if (d.method) events.push(d); };
  const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
  await send("Page.enable"); await send("Runtime.enable"); await send("Network.enable"); await send("Log.enable");
  const report = { url, label, viewports: [] };
  for (const [w, h] of widths) {
    events.length = 0;
    await send("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 1, mobile: w < 700 });
    await send("Page.navigate", { url });
    await sleep(waitMs);
    const m = await send("Runtime.evaluate", { expression: "JSON.stringify({iw:innerWidth,sw:document.documentElement.scrollWidth,sh:document.documentElement.scrollHeight,title:document.title,text:(document.body&&document.body.innerText||'').slice(0,300),lang:document.documentElement.lang,viewportMeta:(document.querySelector('meta[name=viewport]')||{}).content||null,inputsWithoutLabel:[...document.querySelectorAll('input,button,select')].filter(e=>!(e.labels&&e.labels.length)&&!e.getAttribute('aria-label')&&!(e.textContent||'').trim()&&!e.title).length})", returnByValue: true });
    const info = JSON.parse(m.result.result.value);
    const shot = await send("Page.captureScreenshot", { format: "png" });
    const file = `${label}-${w}.png`;
    fs.writeFileSync(path.join(outDir, file), Buffer.from(shot.result.data, "base64"));
    const consoleMsgs = events.filter((e) => e.method === "Runtime.consoleAPICalled").map((e) => `${e.params.type}: ${(e.params.args || []).map((a) => a.value ?? a.description ?? "").join(" ").slice(0, 200)}`);
    const logEntries = events.filter((e) => e.method === "Log.entryAdded").map((e) => `${e.params.entry.level}: ${e.params.entry.text.slice(0, 200)} ${e.params.entry.url || ""}`);
    const failed = events.filter((e) => e.method === "Network.loadingFailed").map((e) => e.params.errorText);
    report.viewports.push({ width: w, file, ...info, horizontalOverflow: info.sw > info.iw, console: consoleMsgs.slice(0, 15), log: logEntries.slice(0, 10), failedRequests: failed.slice(0, 10) });
  }
  console.log(JSON.stringify(report, null, 1));
  fs.writeFileSync(path.join(outDir, `${label}-report.json`), JSON.stringify(report, null, 1));
  ws.close(); proc.kill();
  try { fs.rmSync(profile, { recursive: true, force: true }); } catch (_) {}
  process.exit(0);
})().catch((e) => { console.error("FAILED", e); process.exit(1); });
