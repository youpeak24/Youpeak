const db = require("../../util/connection");
const KeywordBlacklist = require("../../models/keywordBlacklist.model");
const moderation = require("../../util/moderation.service");

// 1. Moderation queue — videos pending review (+ report count each)
exports.getModerationQueue = async (req, res) => {
  try {
    const start = parseInt(req.query.start) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const queue = await db.find(
      "videos",
      { moderationStatus: "pending_review" },
      { sort: { createdAt: -1 }, limit, skip: (start - 1) * limit }
    );
    const totalRows = await db.find("videos", { moderationStatus: "pending_review" });

    const enriched = await Promise.all(
      queue.map(async (video) => {
        const [reports, owner] = await Promise.all([
          db.find("reports", { videoId: video._id || video.id }),
          db.findById("users", video.userId),
        ]);
        return {
          ...video,
          reportCount: reports.length,
          owner: owner ? { _id: owner._id, fullName: owner.fullName, nickName: owner.nickName, email: owner.email, image: owner.image } : null,
        };
      })
    );

    return res.status(200).json({ status: true, message: "Moderation queue fetched.", total: totalRows.length, queue: enriched });
  } catch (error) {
    console.error("Error fetching moderation queue:", error);
    return res.status(500).json({ status: false, message: "Internal Server Error" });
  }
};

// 2. Admin action — approve | reject(takedown) | muteAudio
// IT Rules 2021: statutory takedown within 36h for sovereignty/integrity/public-order content
exports.moderateVideo = async (req, res) => {
  try {
    const { videoId, action, reason } = req.body || {};
    if (!videoId || !["approve", "reject", "muteAudio"].includes(action)) {
      return res.status(200).json({ status: false, message: "Invalid moderation action." });
    }

    const video = await db.findById("videos", videoId);
    if (!video) return res.status(200).json({ status: false, message: "Video not found." });

    const now = new Date().toISOString();
    let updates;
    if (action === "approve") {
      updates = { moderationStatus: "approved", isFlaggedAntiNational: false, flaggedKeywords: [], moderationReviewedAt: now, moderationReviewedBy: req.admin?._id || null };
    } else if (action === "reject") {
      updates = { moderationStatus: "rejected", isActive: false, isMonetization: false, takedownReason: reason || "IT Rules 2021 violation", takedownAt: now, moderationReviewedBy: req.admin?._id || null };
    } else {
      updates = { audioMuted: true, moderationStatus: "approved", moderationReviewedAt: now };
    }

    const updated = await db.update("videos", videoId, updates);

    // notify owner
    try {
      const owner = await db.findById("users", video.userId);
      if (owner && owner.fcmToken) {
        const admin = require("../../util/firebaseAdmin");
        const body = action === "reject"
          ? `Your video was taken down. Reason: ${updates.takedownReason}`
          : action === "muteAudio" ? "The audio on your video was muted after review." : "Your video passed review and is live.";
        admin.messaging().send({ token: owner.fcmToken, notification: { title: "Content review", body }, data: { type: "MODERATION_ACTION", videoId: String(videoId), action } }).catch(() => {});
      }
    } catch (e) { /* ignore */ }

    return res.status(200).json({ status: true, message: `Video ${action === "reject" ? "taken down" : action + "d"}.`, video: updated });
  } catch (error) {
    console.error("Error moderating video:", error);
    return res.status(500).json({ status: false, message: "Internal Server Error" });
  }
};

// 3. Keyword blacklist
exports.getKeywords = async (req, res) => {
  try {
    const keywords = await db.find("KeywordBlacklist", {}, { sort: { createdAt: -1 } });
    return res.status(200).json({ status: true, message: "Keywords fetched.", keywords });
  } catch (error) {
    console.error("Error fetching keywords:", error);
    return res.status(500).json({ status: false, message: "Internal Server Error" });
  }
};

exports.addKeyword = async (req, res) => {
  try {
    const { keyword, category } = req.body || {};
    if (!keyword) return res.status(200).json({ status: false, message: "Keyword is required." });
    const clean = String(keyword).trim().toLowerCase();

    const existing = await db.findOne("KeywordBlacklist", { keyword: clean });
    if (existing) return res.status(200).json({ status: false, message: "Keyword already exists." });

    const created = await db.create("KeywordBlacklist", {
      _id: `kw_${Buffer.from(clean).toString("hex").slice(0, 24)}`,
      keyword: clean,
      category: category || "anti_national",
      createdAt: new Date().toISOString(),
    });
    return res.status(200).json({ status: true, message: "Keyword added to blacklist.", keyword: created });
  } catch (error) {
    console.error("Error adding keyword:", error);
    return res.status(500).json({ status: false, message: "Internal Server Error" });
  }
};

exports.deleteKeyword = async (req, res) => {
  try {
    const keywordId = req.query.keywordId || (req.body && req.body.keywordId);
    if (!keywordId) return res.status(200).json({ status: false, message: "Keyword ID is required." });
    await db.delete("KeywordBlacklist", keywordId);
    return res.status(200).json({ status: true, message: "Keyword removed." });
  } catch (error) {
    console.error("Error deleting keyword:", error);
    return res.status(500).json({ status: false, message: "Internal Server Error" });
  }
};

// 4. Re-screen a video on demand (e.g. after a transcript arrives)
exports.rescreenVideo = async (req, res) => {
  try {
    const { videoId, transcript } = req.body || {};
    const video = await db.findById("videos", videoId);
    if (!video) return res.status(200).json({ status: false, message: "Video not found." });
    const r = await moderation.screenVideo({
      videoId,
      title: video.title, description: video.description,
      hashTags: video.hashTag || [], transcript: transcript || "",
    });
    return res.status(200).json({ status: true, message: r.flagged ? "Flagged and queued for review." : "Clean.", result: r });
  } catch (error) {
    return res.status(500).json({ status: false, message: error.message });
  }
};
