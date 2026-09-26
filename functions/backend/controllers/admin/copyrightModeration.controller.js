const db = require("../../util/connection");
const copyright = require("../../util/copyright.service");

// 1. Copyright-flagged video queue
exports.getFlaggedContent = async (req, res) => {
  try {
    const start = parseInt(req.query.start) || 1;
    const limit = parseInt(req.query.limit) || 20;

    // ?status=open (default) hides videos already taken down; ?status=all shows them.
    const flagged = await db.find("videos", { isCopyrightFlagged: true }, { sort: { copyrightFlaggedAt: -1 } });
    const all = req.query.status === "all" ? flagged : flagged.filter((v) => v.isActive !== false);
    const page = all.slice((start - 1) * limit, (start - 1) * limit + limit);

    const enriched = await Promise.all(page.map(async (v) => {
      const [owner, matched] = await Promise.all([
        db.findById("users", v.userId),
        v.copyrightMatchedVideoId ? db.findById("videos", v.copyrightMatchedVideoId) : null,
      ]);
      return {
        ...v,
        owner: owner ? { _id: owner._id, fullName: owner.fullName, email: owner.email, isBlock: owner.isBlock === true, copyrightStrikes: owner.copyrightStrikes || 0 } : null,
        matchedVideo: matched ? { _id: matched._id, title: matched.title, userId: matched.userId } : null,
      };
    }));

    return res.status(200).json({ status: true, message: "Flagged content fetched.", total: all.length, queue: enriched });
  } catch (error) {
    console.error("Error fetching flagged content:", error);
    return res.status(500).json({ status: false, message: "Internal Server Error" });
  }
};

// 2. Admin action on a duplicate / copyright flag:
//    override    — not a copy: clear the flag, earnings resume
//    muteAudio   — keep the video but silence its audio; an audio-only match
//                  is resolved by that, so earnings resume — a frame match
//                  stays flagged and demonetised for a further decision
//    takedown    — remove the video (copyright strike)
//    takedownBan — remove the video and block the owner's account
//    warn        — strike without removal
const COPYRIGHT_ACTIONS = ["override", "muteAudio", "takedown", "takedownBan", "warn"];
const STRIKE_ACTIONS = new Set(["takedown", "takedownBan", "warn"]);

exports.actionOnFlaggedContent = async (req, res) => {
  try {
    const { videoId, action, reason } = req.body || {};
    if (!videoId || !COPYRIGHT_ACTIONS.includes(action)) {
      return res.status(200).json({ status: false, message: "Invalid action." });
    }
    const video = await db.findById("videos", videoId);
    if (!video) return res.status(200).json({ status: false, message: "Video not found." });

    const now = new Date().toISOString();
    const reviewedBy = req.admin?._id || null;
    let updates;
    if (action === "override") {
      updates = { isCopyrightFlagged: false, isMonetization: true, copyrightOverriddenAt: now, copyrightReviewedBy: reviewedBy };
    } else if (action === "muteAudio") {
      const resolved = video.copyrightMatchVia === "audio";
      updates = {
        audioMuted: true, audioMutedAt: now, copyrightReviewedBy: reviewedBy,
        ...(resolved ? { isCopyrightFlagged: false, isMonetization: true } : {}),
      };
    } else if (action === "takedown" || action === "takedownBan") {
      updates = { isActive: false, isCopyrightFlagged: true, isMonetization: false, takedownReason: reason || "Copyright violation", takedownAt: now, copyrightReviewedBy: reviewedBy };
    } else {
      updates = { copyrightWarningIssued: true, copyrightWarningAt: now };
    }
    const updated = await db.update("videos", videoId, updates);

    if (action === "takedownBan" && video.userId) {
      await db.update("users", String(video.userId), { isBlock: true, blockedReason: `Copyright: ${updates.takedownReason}`, blockedAt: now });
    }

    try {
      const owner = await db.findById("users", video.userId);
      if (owner) {
        const warnings = (owner.copyrightStrikes || 0) + (STRIKE_ACTIONS.has(action) ? 1 : 0);
        if (warnings !== (owner.copyrightStrikes || 0)) {
          await db.update("users", owner._id || owner.id, { copyrightStrikes: warnings });
        }
        if (owner.fcmToken) {
          const admin = require("../../util/firebaseAdmin");
          const body = action === "override" ? "Your video's copyright flag was cleared — earnings resumed."
            : action === "muteAudio" ? "The audio on your video was muted after a copyright review."
            : action === "takedownBan" ? `Your video was removed and your account suspended for copyright. Reason: ${updates.takedownReason}`
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
