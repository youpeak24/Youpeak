/**
 * GET /admin/mediaAudit/report — READ-ONLY dry run for media cleanup and
 * migration (Phase 2). Nothing is deleted or changed here.
 *
 *   orphanCandidates   upload grants never published and expired more than
 *                      `graceHours` ago (default 72): the object may be safe
 *                      to remove after a human checks it.
 *   migrationItems     videos whose URL is not a validated Cloudflare
 *                      location (external samples, unsigned S3 endpoints,
 *                      mislabelled providers) — re-upload the owned source to
 *                      Cloudflare, verify, then update the record.
 *   providerMismatch   videos whose stored storageProvider disagrees with
 *                      what their URL actually is.
 */
"use strict";

const db = require("../../util/connection");
const { videoLocation } = require("../../util/mediaPolicy");
const cloudflare = require("../../util/cloudflareStorage.service");

exports.report = async (req, res) => {
  try {
    const graceHours = Math.max(1, Number(req.query.graceHours) || 72);
    const cutoff = Date.now() - graceHours * 3600e3;
    const limit = Math.max(1, Math.min(1000, Number(req.query.limit) || 200));
    const cfg = cloudflare._cfg();

    const grants = await db.find("uploadGrants", {});
    const orphanCandidates = grants
      .filter((g) => !g.usedByVideoId && Date.parse(g.publishBy || "") < cutoff)
      .slice(0, limit)
      .map((g) => ({ grantId: g._id || g.id, provider: g.provider, ref: g.ref, ownerId: g.ownerId, createdAt: g.createdAt, publishBy: g.publishBy }));

    const videos = await db.find("videos", {});
    const migrationItems = [];
    const providerMismatch = [];
    for (const v of videos) {
      const loc = v.videoUrl ? videoLocation(v.videoUrl, cfg) : null;
      if (!loc) {
        let host = "";
        try { host = new URL(v.videoUrl).hostname; } catch (_) { host = "(invalid URL)"; }
        migrationItems.push({ videoId: v._id || v.id, ownerId: v.userId || null, host, storedProvider: v.storageProvider || null });
      } else if (v.storageProvider && v.storageProvider !== loc.storageProvider) {
        providerMismatch.push({ videoId: v._id || v.id, storedProvider: v.storageProvider, actualProvider: loc.storageProvider });
      }
    }

    return res.status(200).json({
      status: true,
      dryRun: true,
      graceHours,
      counts: { grants: grants.length, orphanCandidates: orphanCandidates.length, videos: videos.length, migrationItems: migrationItems.length, providerMismatch: providerMismatch.length },
      orphanCandidates,
      migrationItems: migrationItems.slice(0, limit),
      providerMismatch: providerMismatch.slice(0, limit),
    });
  } catch (error) {
    console.error("mediaAudit.report:", error.message);
    return res.status(500).json({ status: false, message: error.message });
  }
};
