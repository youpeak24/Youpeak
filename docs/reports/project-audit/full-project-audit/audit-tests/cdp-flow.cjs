// Read-only click-through of the DEPLOYED consumer web onboarding (no login, no form submit) at 4 widths,
// plus the /privacy and /terms deep links. Records screenshots and the semantics (accessibility) tree state.
"use strict";
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const EDGE = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const outDir = path.join(__dirname, "..", "screenshots");
const port = 9900 + Math.floor(Math.random() * 90);
const profile = fs.mkdtempSync(path.join(require("os").tmpdir(), "edge-flow-"));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const proc = spawn(EDGE, [`--remote-debugging-port=${port}`, "--headless=new", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", `--user-data-dir=${profile}`, "--no-first-run", "about:blank"], { stdio: "ignore" });
  let targets;
  for (let i = 0; i < 40; i++) { try { targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); if (targets.length) break; } catch (_) {} await sleep(250); }
  const ws = new WebSocket(targets.find((t) => t.type === "page").webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  let id = 0; const pending = new Map(); const events = [];
  ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); } else if (d.method) events.push(d); };
  const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
  const shot = async (name) => { const s = await send("Page.captureScreenshot", { format: "png" }); fs.writeFileSync(path.join(outDir, name), Buffer.from(s.result.data, "base64")); };
  const click = async (x, y) => { for (const type of ["mousePressed", "mouseReleased"]) await send("Input.dispatchMouseEvent", { type, x, y, button: "left", clickCount: 1 }); };
  const evalJs = async (e) => (await send("Runtime.evaluate", { expression: e, returnByValue: true })).result.result.value;
  await send("Page.enable"); await send("Runtime.enable");
  const out = [];
  for (const [w, h] of [[1920, 1080], [1366, 768], [768, 1024], [390, 844]]) {
    await send("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 1, mobile: w < 700 });
    await send("Page.navigate", { url: "https://www.youpeak.app/" });
    await sleep(9000);
    const wide = w >= 1200;
    const x = wide ? Math.round(w * 0.6458 + (w - w * 0.6458) / 2) : Math.round(w / 2);
    const y = h - 34;
    const sem = await evalJs("JSON.stringify({placeholder:!!document.querySelector('flt-semantics-placeholder'),semanticsNodes:document.querySelectorAll('flt-semantics').length,glassPane:!!document.querySelector('flt-glass-pane')})");
    for (let step = 1; step <= 3; step++) { await click(x, y); await sleep(2500); await shot(`consumer-onboarding-${w}-step${step}.png`); }
    out.push({ width: w, semanticsBeforeInteraction: JSON.parse(sem), clickAt: [x, y], semanticsAfter: JSON.parse(await evalJs("JSON.stringify({semanticsNodes:document.querySelectorAll('flt-semantics').length})")) });
  }
  for (const p of ["privacy", "terms"]) {
    await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    await send("Page.navigate", { url: `https://www.youpeak.app/${p}` });
    await sleep(9000);
    await shot(`consumer-deeplink-${p}-390.png`);
    out.push({ deepLink: `/${p}`, finalUrl: await evalJs("location.href") });
  }
  console.log(JSON.stringify(out, null, 1));
  fs.writeFileSync(path.join(outDir, "consumer-flow-report.json"), JSON.stringify(out, null, 1));
  ws.close(); proc.kill();
  try { fs.rmSync(profile, { recursive: true, force: true }); } catch (_) {}
  process.exit(0);
})().catch((e) => { console.error("FAILED", e); process.exit(1); });
