const Notification = require("../../models/notification.model");

//import model
const User = require("../../models/user.model");

//dayjs
const dayjs = require("dayjs");

//mongoose
const mongoose = require("../../util/mongooseShim");

// "5 minutes ago" etc. (the old $dateDiff pipeline isn't supported by the
// Firestore layer and produced " hours ago" for everything).
function relativeTime(iso, now = Date.now()) {
  const t = Date.parse(iso || "");
  if (!Number.isFinite(t)) return "";
  const min = Math.floor(Math.max(0, now - t) / 60000);
  if (min < 1) return "Just now";
  if (min < 60) return `${min} minute${min === 1 ? "" : "s"} ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} hour${h === 1 ? "" : "s"} ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} day${d === 1 ? "" : "s"} ago`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo} month${mo === 1 ? "" : "s"} ago`;
  const y = Math.floor(d / 365);
  return `${y} year${y === 1 ? "" : "s"} ago`;
}

//get notification list for that user (the verified caller only — bindAppUser)
exports.getNotificationList = async (req, res) => {
  try {
    if (!req.query.userId) {
      return res.status(200).json({ status: false, message: "Oops ! Invalid details!!" });
    }

    const start = Math.max(1, parseInt(req.query.start) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const userId = String(req.query.userId);

    const [user, rows] = await Promise.all([
      User.findOne({ _id: userId, isActive: true }).select("isBlock").lean(),
      // Equality on userId runs in Firestore: only this user's records are read.
      Notification.find({ userId }).lean(),
    ]);

    if (!user) {
      return res.status(200).json({ status: false, message: "user does not found." });
    }

    if (user.isBlock) {
      return res.status(200).json({ status: false, message: "you are blocked by admin." });
    }

    rows.sort((x, y) => String(y.createdAt || "").localeCompare(String(x.createdAt || "")));
    const now = Date.now();
    const page = rows.slice((start - 1) * limit, (start - 1) * limit + limit).map((n) => ({
      ...n,
      isRead: n.isRead === true,
      time: relativeTime(n.createdAt, now),
    }));

    return res.status(200).json({
      status: true,
      message: "Success",
      total: rows.length,
      unreadCount: rows.filter((n) => n.isRead !== true).length,
      hasMore: start * limit < rows.length,
      notification: page,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

// Mark the caller's notifications read: `notificationId` for one, or all.
exports.markNotificationsRead = async (req, res) => {
  try {
    const userId = String(req.appUserId || "");
    if (!userId) return res.status(401).json({ status: false, message: "Sign in again." });
    const one = String(req.query.notificationId || req.body?.notificationId || "");
    const targets = one
      ? (await Notification.find({ _id: one, userId }).lean())
      : (await Notification.find({ userId }).lean()).filter((n) => n.isRead !== true);
    await Promise.all(targets.map((n) => Notification.updateOne({ _id: n._id, userId }, { $set: { isRead: true, readAt: new Date().toISOString() } })));
    return res.status(200).json({ status: true, message: "Marked as read.", updated: targets.length });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

//clear all notification for particular user
exports.clearNotificationHistory = async (req, res) => {
  try {
    if (!req.query.userId) {
      return res.status(200).json({ status: false, message: "userId must be requried." });
    }

    const userId = new mongoose.Types.ObjectId(req.query.userId);

    const [user, clearNotificationHistory] = await Promise.all([User.findOne({ _id: userId, isActive: true }).select("isBlock").lean(), Notification.deleteMany({ userId: userId })]);

    if (!user) {
      return res.status(200).json({ status: false, message: "user does not found." });
    }

    if (user.isBlock) {
      return res.status(200).json({ status: false, message: "you are blocked by admin!" });
    }

    if (clearNotificationHistory.deletedCount > 0) {
      return res.status(200).json({
        status: true,
        message: "Successfully cleared all Notification history for the user.",
      });
    } else {
      return res.status(200).json({
        status: true,
        message: "There were no notifications to clear.",
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};
