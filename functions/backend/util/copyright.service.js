/**
 * Copyright / duplicate detection.
 *
 * FFmpeg + Chromaprint (audio) + pHash (frames) run in a SEPARATE worker
 * (tools/worker/fingerprintWorker.js — deploy to Railway/Render/a VPS). This module is
 * the Vercel-safe half:
 *   • queueForFingerprint()  — enqueue a new upload
 *   • ingestFingerprint()    — the worker posts hashes back here
 *   • findMatch()            — compare against every stored fingerprint
 *   • flagCopyright()        — mark the video, demonetise, notify
 *
 * Match rule (config): audio Chromaprint similarity >= threshold, OR any frame
 * pHash within `frameHammingThreshold` bits of a stored frame.
 */
"use strict";

const db = require("../util/connection");

function cfg() {
  const s = global.settingJSON || {};
  const n = (v, d) => (Number.isFinite(Number(v)) ? Number(v) : d);
  return {
    enabled: s.copyrightEngineEnabled === true,
    audioThreshold: n(s.copyrightAudioMatchThreshold, 0.85),
    frameHamming: n(s.copyrightFrameHammingThreshold, 10),
    minFrameMatches: n(s.copyrightMinFrameMatches, 3),
  };
}

// Hamming distance between two hex strings (pHash is 16 hex chars = 64 bits).
function hammingHex(a, b) {
  if (!a || !b || a.length !== b.length) return Infinity;
  let dist = 0;
  for (let i = 0; i < a.length; i++) {
    let x = parseInt(a[i], 16) ^ parseInt(b[i], 16);
    while (x) { dist += x & 1; x >>= 1; }
  }
  return dist;
}

// Chromaprint fingerprints are int arrays; similarity = fraction of matching
// bits across the overlapping region. Accepts arrays or comma/space strings.
function audioSimilarity(a, b) {
  const toArr = (v) => Array.isArray(v) ? v : String(v || "").split(/[\s,]+/).filter(Boolean).map(Number);
  const x = toArr(a), y = toArr(b);
  const len = Math.min(x.length, y.length);
  if (len < 20) return 0;
  let matchBits = 0, totalBits = 0;
  for (let i = 0; i < len; i++) {
    let diff = (x[i] ^ y[i]) >>> 0;
    let same = 32;
    while (diff) { same -= diff & 1; diff >>>= 1; }
    matchBits += same;
    totalBits += 32;
  }
  return totalBits ? matchBits / totalBits : 0;
}

async function queueForFingerprint({ videoId, streamUid = null, videoUrl = null }) {
  if (!cfg().enabled || !videoId) return null;
  return db.create("fingerprintQueue", {
    _id: `fpq_${Date.now()}_${Math.floor(Math.random() * 1e6)}`,
    videoId: String(videoId),
    streamUid,
    videoUrl,
    status: "pending",
    attempts: 0,
    createdAt: new Date().toISOString(),
  }, `fpq_${videoId}`);
}

/** Compare a candidate fingerprint against every stored one. */
async function findMatch({ audioHash, frameHashes = [], excludeVideoId }) {
  const c = cfg();
  const stored = await db.find("contentFingerprints", {});
  for (const fp of stored) {
    if (String(fp.videoId) === String(excludeVideoId)) continue;

    if (audioHash && fp.audioHash) {
      const sim = audioSimilarity(audioHash, fp.audioHash);
      if (sim >= c.audioThreshold) {
        return { match: true, matchedVideoId: fp.videoId, via: "audio", score: Number(sim.toFixed(3)) };
      }
    }
    if (Array.isArray(frameHashes) && frameHashes.length && Array.isArray(fp.frameHashes) && fp.frameHashes.length) {
      let hits = 0;
      for (const h of frameHashes) {
        if (fp.frameHashes.some((s) => hammingHex(h, s) <= c.frameHamming)) hits++;
        if (hits >= c.minFrameMatches) {
          return { match: true, matchedVideoId: fp.videoId, via: "frames", score: hits };
        }
      }
    }
  }
  return { match: false };
}

/** Worker posts here after processing a queued video. */
async function ingestFingerprint({ videoId, audioHash = null, frameHashes = [] }) {
  if (!videoId) return { ok: false, message: "videoId required" };

  await db.create("contentFingerprints", {
    _id: `fp_${videoId}`,
    videoId: String(videoId),
    audioHash,
    frameHashes,
    createdAt: new Date().toISOString(),
  }, `fp_${videoId}`);

  await db.update("fingerprintQueue", `fpq_${videoId}`, { status: "done", processedAt: new Date().toISOString() }).catch(() => {});

  const m = await findMatch({ audioHash, frameHashes, excludeVideoId: videoId });
  if (m.match) {
    await flagCopyright({ videoId, matchedVideoId: m.matchedVideoId, via: m.via, score: m.score });
    return { ok: true, flagged: true, ...m };
  }
  return { ok: true, flagged: false };
}

async function flagCopyright({ videoId, matchedVideoId, via, score }) {
  const s = global.settingJSON || {};
  await db.update("videos", videoId, {
    isCopyrightFlagged: true,
    copyrightMatchedVideoId: matchedVideoId || null,
    copyrightMatchVia: via || null,
    copyrightMatchScore: score || null,
    copyrightFlaggedAt: new Date().toISOString(),
    isMonetization: false, // demonetise immediately
  });

  try {
    const video = await db.findById("videos", videoId);
    const owner = video && (await db.findById("users", video.userId));
    if (owner && owner.fcmToken && global.io == null) {
      const admin = require("./firebaseAdmin");
      admin.messaging().send({
        token: owner.fcmToken,
        notification: {
          title: "⚠️ Copyright flag",
          body: "One of your videos was flagged for a possible copyright match and its earnings are paused pending review.",
        },
        data: { type: "COPYRIGHT_FLAG", videoId: String(videoId) },
      }).catch(() => {});
    }
  } catch (e) { /* ignore */ }
}

module.exports = { cfg, queueForFingerprint, findMatch, ingestFingerprint, flagCopyright, hammingHex, audioSimilarity };
