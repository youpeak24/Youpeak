/**
 * Grievance Officer mechanism (India IT Rules 2021).
 *  • GET  /client/grievance            -> officer contact details
 *  • POST /client/grievance/file       -> user files a grievance (36h SLA clock starts)
 *  • GET  /client/grievance/track      -> status of a filed grievance
 *  • GET  /admin/grievance/list        -> queue (admin), overdue flagged
 *  • POST /admin/grievance/resolve     -> resolve / act
 */
"use strict";

const db = require("../../util/connection");
const moderation = require("../../util/moderation.service");

function officerDetails() {
  const s = global.settingJSON || {};
  return {
    officerName: s.grievanceOfficerName || "Grievance Officer",
    designation: "Grievance Officer",
    companyName: s.companyLegalName || "Youpeak Digital Solutions Pvt Ltd",
    contactEmail: s.grievanceEmail || "grievance@youpeak.in",
    contactPhone: s.grievancePhone || "",
    address: s.grievanceAddress || "Trichy, Tamil Nadu, India",
    workingHours: "Monday to Friday, 10:00 AM to 6:00 PM IST",
    statutoryTurnaroundTime: `${moderation.cfg().grievanceSlaHours} hours for critical takedowns (IT Rules 2021)`,
    reportingMechanism:
      "Report content in-app or email the Grievance Officer. Action on content affecting sovereignty, integrity or public order is taken within the statutory window.",
  };
}

exports.getOfficer = (req, res) =>
  res.status(200).json({ status: true, message: "Grievance Officer details.", data: officerDetails() });

exports.fileGrievance = async (req, res) => {
  try {
    const b = { ...req.query, ...req.body };
    const { userId, category, description } = b;
    if (!description || String(description).trim().length < 5) {
      return res.status(200).json({ status: false, message: "Please describe the grievance." });
    }

    const slaHours = moderation.cfg().grievanceSlaHours;
    const id = `grv_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
    const rec = {
      _id: id,
      userId: userId || null,
      videoId: b.videoId || null,
      commentId: b.commentId || null,
      category: category || "OTHER", // ANTI_NATIONAL | HATE_SPEECH | DEFAMATION | COPYRIGHT | HARASSMENT | OTHER
      description: String(description).trim().slice(0, 4000),
      contactEmail: b.contactEmail || "",
      status: "OPEN", // OPEN | IN_PROGRESS | RESOLVED | REJECTED
      priority: ["ANTI_NATIONAL", "HATE_SPEECH", "CSAM"].includes(String(category).toUpperCase()) ? "CRITICAL" : "NORMAL",
      filedAt: new Date().toISOString(),
      deadlineAt: new Date(Date.now() + slaHours * 3600e3).toISOString(),
      resolvedAt: null,
      resolution: null,
    };
    await db.create("grievances", rec, id);

    // Critical grievance against a video → auto-hold pending officer review.
    if (rec.priority === "CRITICAL" && rec.videoId) {
      await db.update("videos", rec.videoId, {
        moderationStatus: "pending_review",
        moderationFlagSource: "grievance",
        moderationFlaggedAt: rec.filedAt,
      });
    }

    return res.status(200).json({
      status: true,
      message: `Grievance filed. Reference: ${id}. Action within ${slaHours} hours.`,
      grievanceId: id,
      deadlineAt: rec.deadlineAt,
    });
  } catch (error) {
    console.error("fileGrievance error:", error);
    return res.status(500).json({ status: false, message: error.message });
  }
};

exports.trackGrievance = async (req, res) => {
  try {
    const id = req.query.grievanceId || (req.body && req.body.grievanceId);
    const g = await db.findById("grievances", id);
    if (!g) return res.status(200).json({ status: false, message: "Grievance not found." });
    return res.status(200).json({
      status: true,
      grievance: { id: g._id, status: g.status, category: g.category, filedAt: g.filedAt, deadlineAt: g.deadlineAt, resolvedAt: g.resolvedAt, resolution: g.resolution },
    });
  } catch (error) {
    return res.status(500).json({ status: false, message: error.message });
  }
};

// ── Admin ──
exports.adminList = async (req, res) => {
  try {
    const q = {};
    if (req.query.status) q.status = req.query.status;
    const rows = await db.find("grievances", q, { sort: { filedAt: -1 }, limit: Number(req.query.limit) || 100 });
    const now = Date.now();
    const enriched = rows.map((g) => ({
      ...g,
      overdue: g.status !== "RESOLVED" && g.status !== "REJECTED" && g.deadlineAt && now > new Date(g.deadlineAt).getTime(),
      hoursLeft: g.deadlineAt ? Math.round((new Date(g.deadlineAt).getTime() - now) / 3600e3) : null,
    }));
    return res.status(200).json({
      status: true,
      total: enriched.length,
      openCount: enriched.filter((g) => g.status === "OPEN" || g.status === "IN_PROGRESS").length,
      overdueCount: enriched.filter((g) => g.overdue).length,
      grievances: enriched,
    });
  } catch (error) {
    return res.status(500).json({ status: false, message: error.message });
  }
};

exports.adminResolve = async (req, res) => {
  try {
    const { grievanceId, action, note } = req.body || {};
    if (!grievanceId || !["in_progress", "resolve", "reject", "takedown"].includes(action)) {
      return res.status(200).json({ status: false, message: "Invalid action." });
    }
    const g = await db.findById("grievances", grievanceId);
    if (!g) return res.status(200).json({ status: false, message: "Grievance not found." });

    const now = new Date().toISOString();
    let updates = { handledBy: req.admin?._id || null, note: note || g.note || "" };
    if (action === "in_progress") updates.status = "IN_PROGRESS";
    else if (action === "reject") { updates.status = "REJECTED"; updates.resolvedAt = now; updates.resolution = note || "Not a violation."; }
    else { // resolve | takedown
      updates.status = "RESOLVED";
      updates.resolvedAt = now;
      updates.resolution = note || (action === "takedown" ? "Content removed." : "Actioned.");
      if (action === "takedown" && g.videoId) {
        await db.update("videos", g.videoId, {
          isActive: false, moderationStatus: "rejected", isMonetization: false,
          takedownReason: `Grievance ${grievanceId}: ${g.category}`, takedownAt: now,
        });
      }
    }
    const updated = await db.update("grievances", grievanceId, updates);
    return res.status(200).json({ status: true, message: `Grievance ${updates.status}.`, grievance: updated });
  } catch (error) {
    return res.status(500).json({ status: false, message: error.message });
  }
};
