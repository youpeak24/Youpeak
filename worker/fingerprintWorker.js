/**
 * YouPeak copyright fingerprint worker — runs OUTSIDE Vercel (Railway / Render /
 * a small VPS / a container). Vercel can't run FFmpeg or long jobs.
 *
 * Loop:
 *   1. GET  {API}/api/internal/fingerprint/queue     (X-Worker-Secret)
 *   2. for each pending video: download it, extract
 *        • audio fingerprint  — fpcalc (Chromaprint)
 *        • frame pHashes      — ffmpeg frames + a perceptual hash
 *   3. POST {API}/api/internal/fingerprint/ingest    { videoId, audioHash, frameHashes }
 *      (the backend stores it and runs the match/flag)
 *
 * Requirements on the host:
 *   ffmpeg, fpcalc (chromaprint), node 18+
 *   npm i sharp            (for pHash; or swap in any perceptual-hash lib)
 *
 * Env:
 *   API_BASE_URL              e.g. https://youpeak.vercel.app
 *   FINGERPRINT_WORKER_SECRET must match the backend
 *   POLL_INTERVAL_MS          default 30000
 */
"use strict";

const { execFile } = require("child_process");
const { promisify } = require("util");
const fs = require("fs");
const os = require("os");
const path = require("path");
const https = require("https");
const execFileP = promisify(execFile);

const API = (process.env.API_BASE_URL || "").replace(/\/$/, "");
const SECRET = process.env.FINGERPRINT_WORKER_SECRET || "";
const POLL_MS = Number(process.env.POLL_INTERVAL_MS) || 30000;

if (!API || !SECRET) {
  console.error("Set API_BASE_URL and FINGERPRINT_WORKER_SECRET"); process.exit(1);
}

function apiFetch(pathname, { method = "GET", body } = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(API + pathname);
    const data = body ? JSON.stringify(body) : null;
    const req = https.request(url, {
      method,
      headers: {
        "X-Worker-Secret": SECRET,
        "Content-Type": "application/json",
        ...(data ? { "Content-Length": Buffer.byteLength(data) } : {}),
      },
    }, (res) => {
      let buf = "";
      res.on("data", (c) => (buf += c));
      res.on("end", () => {
        try { resolve(JSON.parse(buf || "{}")); } catch (e) { resolve({ raw: buf }); }
      });
    });
    req.on("error", reject);
    if (data) req.write(data);
    req.end();
  });
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.headers.location) return resolve(download(res.headers.location, dest));
      res.pipe(file);
      file.on("finish", () => file.close(() => resolve(dest)));
    }).on("error", (e) => { fs.unlink(dest, () => reject(e)); });
  });
}

async function audioFingerprint(videoPath) {
  // fpcalc -json -length 120 <file>  ->  { fingerprint: "AQAA...", duration: N }
  try {
    const { stdout } = await execFileP("fpcalc", ["-json", "-length", "120", videoPath]);
    const j = JSON.parse(stdout);
    return j.fingerprint || null;
  } catch (e) {
    console.warn("fpcalc failed:", e.message);
    return null;
  }
}

async function frameHashes(videoPath, workDir) {
  const framesDir = path.join(workDir, "frames");
  fs.mkdirSync(framesDir, { recursive: true });
  try {
    // one frame every 2s
    await execFileP("ffmpeg", ["-i", videoPath, "-vf", "fps=1/2,scale=32:32:flags=bilinear", "-y", path.join(framesDir, "f%03d.png")]);
  } catch (e) {
    console.warn("ffmpeg frames failed:", e.message);
    return [];
  }
  let sharp;
  try { sharp = require("sharp"); } catch (e) { console.warn("`sharp` not installed — skipping frame hashes"); return []; }

  const hashes = [];
  for (const f of fs.readdirSync(framesDir).sort()) {
    try {
      const raw = await sharp(path.join(framesDir, f)).greyscale().resize(8, 8, { fit: "fill" }).raw().toBuffer();
      const avg = raw.reduce((s, v) => s + v, 0) / raw.length;
      let bits = "";
      for (const v of raw) bits += v >= avg ? "1" : "0";
      // 64 bits -> 16 hex chars
      let hex = "";
      for (let i = 0; i < 64; i += 4) hex += parseInt(bits.slice(i, i + 4), 2).toString(16);
      hashes.push(hex);
    } catch (e) { /* skip frame */ }
  }
  return hashes;
}

async function processOne(item) {
  const workDir = fs.mkdtempSync(path.join(os.tmpdir(), "fpw-"));
  const videoPath = path.join(workDir, "video.mp4");
  try {
    const url = item.videoUrl || (item.streamUid ? `${API}/videos/${item.streamUid}` : null);
    if (!url) throw new Error("no source url");
    await download(url, videoPath);

    const [audioHash, frames] = await Promise.all([
      audioFingerprint(videoPath),
      frameHashes(videoPath, workDir),
    ]);

    const r = await apiFetch("/api/internal/fingerprint/ingest", {
      method: "POST",
      body: { videoId: item.videoId, audioHash, frameHashes: frames },
    });
    console.log(`✓ ${item.videoId} → ${JSON.stringify(r)}`);
  } catch (e) {
    console.error(`✗ ${item.videoId}:`, e.message);
  } finally {
    fs.rmSync(workDir, { recursive: true, force: true });
  }
}

async function tick() {
  try {
    const { queue = [] } = await apiFetch("/api/internal/fingerprint/queue?limit=5");
    if (!queue.length) return;
    console.log(`processing ${queue.length} video(s)`);
    for (const item of queue) await processOne(item);
  } catch (e) {
    console.error("tick error:", e.message);
  }
}

console.log(`fingerprint worker → ${API} (every ${POLL_MS}ms)`);
tick();
setInterval(tick, POLL_MS);
