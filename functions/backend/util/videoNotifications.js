/**
 * "New video" notifications to a channel's subscribers.
 *
 * Every subscriber gets an in-app notification record (the Notifications
 * screen), whether or not they have a push token — web users usually don't,
 * and the old code only wrote the record after a successful push, so they
 * never saw any. Push is sent in addition where a token exists.
 *
 * Only publicly listed videos notify (public, published, not held/flagged):
 * a private or unlisted upload must not be announced, and a scheduled one is
 * announced when it goes live (util/scheduledPublish), not at upload time.
 * Each (subscriber, video) gets at most one record (deterministic id).
 */
"use strict";

const db = require("./connection");
const visibility = require("./videoVisibility");

const TITLE = "🔔 New Video Alert! 🔔";
const MESSAGE = "Hey there! We're excited to share our latest video. Don't miss out Click here to watch the video now!";

async function notifySubscribersOfNewVideo(video, { admin } = {}) {
  if (!video || !visibility.isPubliclyListable(video)) return { notified: 0, skipped: "NOT_PUBLIC" };
  const fs = db.getDb();
  if (!fs) return { notified: 0 };
  const videoId = String(video._id || video.id);
  const ownerId = String(video.userId && (video.userId._id || video.userId));
  const channelId = String(video.channelId || ownerId);

  const subs = await db.find(db.normalizeCollectionName("UserWiseSubscription"), { channelId });
  const subscriberIds = [...new Set(subs.map((s) => String(s.userId)).filter((id) => id && id !== ownerId))];
  if (!subscriberIds.length) return { notified: 0 };
  const channel = await db.findById("users", ownerId).catch(() => null);

  const col = fs.collection(db.normalizeCollectionName("Notification"));
  const now = new Date().toISOString();
  for (let i = 0; i < subscriberIds.length; i += 400) {
    const batch = fs.batch();
    for (const uid of subscriberIds.slice(i, i + 400)) {
      const id = `newvideo_${uid}_${videoId}`;
      batch.set(col.doc(id), {
        _id: id, id, userId: uid, title: TITLE, message: MESSAGE, type: "NEW_VIDEO",
        videoId, videoType: Number(video.videoType) || 1, channelId,
        channelImage: (channel && channel.image) || "", videoImage: video.videoImage || "",
        isRead: false, createdAt: now, updatedAt: now,
      }, { merge: false });
    }
    await db.withTimeout(batch.commit());
  }

  // Push where a token exists (best effort).
  if (admin) {
    const instance = await admin;
    await Promise.all(subscriberIds.map(async (uid) => {
      try {
        const u = await db.findById("users", uid);
        if (!u || !u.fcmToken) return;
        await instance.messaging().send({
          token: u.fcmToken,
          notification: { title: TITLE, body: MESSAGE },
          data: { type: "NEW_VIDEO", videoId, videoType: String(Number(video.videoType) || 1) },
        });
      } catch (e) { /* stale token etc. */ }
    }));
  }
  return { notified: subscriberIds.length };
}

module.exports = { notifySubscribersOfNewVideo };
