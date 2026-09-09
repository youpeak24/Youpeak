const db = require("../../util/connection");
const copyright = require("../../util/copyright.service");

// 1. Copyright-flagged video queue
exports.getFlaggedContent = async (req, res) => {
  try {
    const start = parseInt(req.query.start) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const all = await db.find("videos", { isCopyrightFlagged: true }, { sort: { createdAt: -1 } });
    const page = all.slice((start - 1) * limit, (start - 1) * limit + limit);

    const enriched = await Promise.all(page.map(async (v) => {
      const [owner, matched] = await Promise.all([
        db.findById("users", v.userId),
        v.copyrightMatchedVideoId ? db.findById("videos", v.copyrightMatchedVideoId) : null,
      ]);
      return {
        ...v,
        owner: owner ? { _id: owner._id, fullName: owner.fullName, email: owner.email } : null,
        matchedVideo: matched ? { _id: matched._id, title: matched.title, userId: matched.userId } : null,
      };
    }));

    return res.status(200).json({ status: true, message: "Flagged content fetched.", total: all.length, queue: enriched });
  } catch (error) {
    console.error("Error fetching flagged content:", error);
    return res.status(500).json({ status: false, message: "Internal Server Error" });
  }
};

// 2. Admin action: override (clear flag, re-monetise) | takedown (permanent) | warn
exports.actionOnFlaggedContent = async (req, res) => {
  try {
    const { videoId, action, reason } = req.body || {};
    if (!videoId || !["override", "takedown", "warn"].includes(action)) {
      return res.status(200).json({ status: false, message: "Invalid action." });
    }
    const video = await db.findById("videos", videoId);
    if (!video) return res.status(200).json({ status: false, message: "Video not found." });

    const now = new Date().toISOString();
    let updates;
    if (action === "override") {
      updates = { isCopyrightFlagged: false, isMonetization: true, copyrightOverriddenAt: now, copyrightReviewedBy: req.admin?._id || null };
    } else if (action === "takedown") {
      updates = { isActive: false, isCopyrightFlagged: true, isMonetization: false, takedownReason: reason || "Copyright violation", takedownAt: now, copyrightReviewedBy: req.admin?._id || null };
    } else {
      updates = { copyrightWarningIssued: true, copyrightWarningAt: now };
    }
    const updated = await db.update("videos", videoId, updates);

    try {
      const owner = await db.findById("users", video.userId);
      if (owner) {
        const warnings = (owner.copyrightStrikes || 0) + (action === "takedown" || action === "warn" ? 1 : 0);
        if (warnings !== (owner.copyrightStrikes || 0)) {
          await db.update("users", owner._id || owner.id, { copyrightStrikes: warnings });
        }
        if (owner.fcmToken) {
          const admin = require("../../util/firebaseAdmin");
          const body = action === "override" ? "Your video's copyright flag was cleared — earnings resumed."
            : action === "takedown" ? `Your video was removed for copyright. Reason: ${updates.takedownReason}`
            : "A copyright warning was issued on your video.";
          admin.messaging().send({ token: owner.fcmToken, notification: { title: "Copyright review", body }, data: { type: "COPYRIGHT_ACTION", videoId: String(videoId), action } }).catch(() => {});
        }
      }
    } catch (e) { /* ignore */ }

    return res.status(200).json({ status: true, message: `Processed: ${action}.`, video: updated });
  } catch (error) {
    console.error("Error processing flagged content:", error);
    return res.status(500).json({ status: false, message: "Internal Server Error" });
  }
};

// 3. Manually flag a video (admin) — e.g. after a rights-holder complaint
exports.manualFlag = async (req, res) => {
  try {
    const { videoId, matchedVideoId, reason } = req.body || {};
    if (!videoId) return res.status(200).json({ status: false, message: "videoId required." });
    await copyright.flagCopyright({ videoId, matchedVideoId: matchedVideoId || null, via: "manual", score: null });
    if (reason) await db.update("videos", videoId, { copyrightFlagReason: reason });
    return res.status(200).json({ status: true, message: "Video flagged for copyright and demonetised." });
  } catch (error) {
    return res.status(500).json({ status: false, message: error.message });
  }
};

// 4. Worker callback: ingest a computed fingerprint + run the match
exports.ingestFingerprint = async (req, res) => {
  try {
    const secret = process.env.FINGERPRINT_WORKER_SECRET;
    const provided = req.headers["x-worker-secret"] || (req.body && req.body.workerSecret);
    if (!secret || provided !== secret) {
      return res.status(401).json({ status: false, message: "Unauthorized worker." });
    }
    const { videoId, audioHash, frameHashes } = req.body || {};
    const result = await copyright.ingestFingerprint({ videoId, audioHash, frameHashes: frameHashes || [] });
    return res.status(200).json({ status: true, ...result });
  } catch (error) {
    console.error("ingestFingerprint error:", error);
    return res.status(500).json({ status: false, message: error.message });
  }
};

// 5. Pending fingerprint queue (for the worker to pull)
exports.fingerprintQueue = async (req, res) => {
  try {
    const secret = process.env.FINGERPRINT_WORKER_SECRET;
    const provided = req.headers["x-worker-secret"] || req.query.workerSecret;
    if (!secret || provided !== secret) {
      return res.status(401).json({ status: false, message: "Unauthorized worker." });
    }
    const pending = await db.find("fingerprintQueue", { status: "pending" }, { sort: { createdAt: 1 }, limit: Number(req.query.limit) || 10 });
    return res.status(200).json({ status: true, queue: pending });
  } catch (error) {
    return res.status(500).json({ status: false, message: error.message });
  }
};
