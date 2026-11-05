const Video = require("../../models/video.model");

//import model
const User = require("../../models/user.model");
const SoundList = require("../../models/soundsList.model");
const UserWiseSubscription = require("../../models/userWiseSubscription.model");
const Notification = require("../../models/notification.model");
const SearchHistory = require("../../models/searchHistory.model");
const LikeHistoryOfVideo = require("../../models/likeHistoryOfVideo.model");
const WatchHistory = require("../../models/watchHistory.model");
const SaveToWatchLater = require("../../models/saveToWatchLater.model");
const History = require("../../models/history.model");
const VideoComment = require("../../models/videoComment.model");
const Report = require("../../models/report.model");
const LikeHistoryOfVideoComment = require("../../models/likeHistoryOfVideoComment.model");
const PlayList = require("../../models/playList.model");
const VideoUnlock = require("../../models/videoUnlock.model");
const PlaybackSession = require("../../models/playbackSession.model");
const visibility = require("../../util/videoVisibility");
const uploadGrants = require("../../util/uploadGrants");

// Clean up a file the caller just uploaded, after a failed publish/update.
// Only the caller's OWN, still-unpublished upload is deleted: the video file
// by its upload grant, an image by its upload record (app_assets/<file>
// .uploadedBy). These handlers used to delete whatever videoUrl/videoImage the
// request named, so any signed-in user could delete another user's media (F-28).
async function discardOwnUpload(req, url, remove = deleteMediaByUrl) {
  try {
    if (!url || !req.appUserId) return;
    const media = require("../../util/mediaPolicy").videoLocation(url, require("../../util/cloudflareStorage.service")._cfg());
    if (media) {
      const ref = media.storageProvider === "stream" ? media.streamUid : uploadGrants.r2KeyFromUrl(media.videoUrl);
      const owned = await uploadGrants.verifyOwnedUpload({ provider: media.storageProvider, ref, ownerId: req.appUserId });
      if (owned.ok && owned.grant && !owned.grant.usedByVideoId) await remove(url);
      return;
    }
    const fileName = decodeURIComponent(String(url).split("?")[0].split("/").pop() || "").split("/").pop();
    const record = fileName ? await db.findById("app_assets", fileName).catch(() => null) : null;
    if (record && String(record.uploadedBy || "") === String(req.appUserId)) await remove(url);
  } catch (e) {
    console.error("discardOwnUpload:", e.message);
  }
}


//deleteFromStorage
const { deleteFromStorage } = require("../../util/storageHelper");
// R2 and Firebase Storage deletes (storageHelper only knows the legacy hosts).
const { deleteMediaByUrl } = require("../../util/mediaCleanup");

//private key
const admin = require("../../util/privateKey");

//momemt
const moment = require("moment");

//mongoose
const mongoose = require("../../util/mongooseShim");

//day.js
const dayjs = require("dayjs");

//uuid
const uuid = require("uuid");

//generateUniqueVideoId
const { generateUniqueVideoId } = require("../../util/generateUniqueVideoId");

//generateHistoryUniqueId
const { generateHistoryUniqueId } = require("../../util/generateHistoryUniqueId");

//reward engine (daily caps + coin crediting)
const rewardEngine = require("../../util/rewardEngine");
const engagement = require("../../util/engagement.service");
const scheduledPublish = require("../../util/scheduledPublish");

// User search text matched literally (never compiled as a regular expression).
const escapeRegex = (s) => String(s || "").trim().slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

//firestore connection (direct doc updates)
const db = require("../../util/connection");

//revenue split engine (creator / referrer / platform / district partner)
const revenueSplit = require("../../util/revenueSplit.service");

//cloudflare stream pipeline
const videoPipeline = require("../../util/videoPipeline.service");

//content moderation + copyright
const moderation = require("../../util/moderation.service");
const copyright = require("../../util/copyright.service");

//video Unlocked
exports.unlockPrivateVideo = async (req, res) => {
  try {
    const { userId, videoId } = req.query;

    if (!userId || !videoId) {
      return res.status(200).json({
        status: false,
        message: "Invalid user or video details provided.",
      });
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const videoObjectId = new mongoose.Types.ObjectId(videoId);

    const [user, video] = await Promise.all([
      User.findOne({ _id: userObjectId, isActive: true }).select("_id coin isBlock fcmToken state district").lean(),
      Video.findOne({
        _id: videoObjectId,
        videoPrivacyType: 2, // private
        isActive: true,
      })
        .select("_id userId videoUrl visibilityType scheduleType moderationStatus isCopyrightFlagged isActive")
        .lean(),
    ]);

    if (!user) {
      return res.status(200).json({ status: false, message: "User not found!" });
    }

    if (user.isBlock) {
      return res.status(200).json({ status: false, message: "You are blocked by the admin." });
    }

    if (!video) {
      return res.status(200).json({ status: false, message: "Private video not found." });
    }

    if (video.userId.toString() === userObjectId.toString()) {
      console.log("❌ Prevent unlocking own video");
      return res.status(200).json({ status: false, message: "You cannot unlock your own private video." });
    }

    // Only a video this viewer could otherwise open can be bought (not
    // private/held/rejected/copyright-flagged — util/videoVisibility.js).
    if (!visibility.canView(video, userId)) {
      return res.status(200).json({ status: false, message: "Private video not found." });
    }

    const [alreadyUnlocked, videoOwner] = await Promise.all([
      VideoUnlock.exists({
        userId: userObjectId,
        videoId: videoObjectId,
      }),
      User.findOne({ _id: video.userId }).select("_id videoUnlockCost fcmToken").lean(),
    ]);

    if (!videoOwner) {
      return res.status(200).json({ status: false, message: "Video owner not found." });
    }

    if (alreadyUnlocked) {
      return res.status(200).json({
        status: false,
        message: "Video already unlocked.",
        isUnlocked: true,
        videoUrl: video.videoUrl || null,
      });
    }

    const unlockCost = Number(videoOwner?.videoUnlockCost || 0);

    if (unlockCost <= 0) {
      return res.status(200).json({ status: false, message: "Invalid unlock cost." });
    }

    // Atomic debit — see firestoreDb.service.js spendBalance() for why this
    // can't be a plain $inc: two near-simultaneous unlock requests (a
    // double-tap, or a script firing them in parallel) could both read the
    // same starting balance and both pass a "balance >= cost" check before
    // either write lands, giving the buyer two unlocks for the price of one.
    // Phase 2: the unlock record (deterministic id), the buyer's debit, the
    // buyer's history row and the revenue settlement (creator/referrer credits,
    // ledger row with the platform share, District Partner commission) commit
    // in ONE transaction. Two parallel unlocks can't both charge (the record's
    // create() conflicts), and a failure can't leave the buyer charged with no
    // unlock or the creator unpaid. A copyright-flagged / under-review video
    // earns nothing for the creator: the platform keeps the full amount, on the ledger.
    const unlockId = `unlock_${String(userId)}_${String(videoId)}`;
    const monetizable = moderation.isMonetizable(video);
    const plan = await revenueSplit.planRevenue({
      sourceType: "videoUnlock",
      grossCoins: unlockCost,
      creatorId: monetizable ? String(video.userId) : null,
      buyerId: String(userId),
      referrerOf: "creator",
      videoId: String(videoId),
      agencyContext: { state: user.state || "", district: user.district || "", userId: String(userId) },
      ledgerId: `rev_${unlockId}`,
      meta: { unlockId, demonetised: !monetizable },
    });
    const historyUniqueId = await generateHistoryUniqueId();
    const fsdb = db.getDb();
    const unlockRef = fsdb.collection(db.normalizeCollectionName("VideoUnlock")).doc(unlockId);
    const buyerRef = fsdb.collection("users").doc(String(userId));
    let outcome;
    try {
      outcome = await db.withTimeout(fsdb.runTransaction(async (tx) => {
        const [unlockSnap, buyerSnap] = await Promise.all([tx.get(unlockRef), tx.get(buyerRef)]);
        if (unlockSnap.exists) return "ALREADY";
        const balance = Number(buyerSnap.exists ? buyerSnap.data().coin : 0) || 0;
        if (balance < unlockCost) return "INSUFFICIENT";
        const now = new Date().toISOString();
        tx.update(buyerRef, { coin: balance - unlockCost, updatedAt: now });
        tx.create(unlockRef, { _id: unlockId, id: unlockId, userId: String(userId), videoId: String(videoId), videoOwnerId: String(video.userId), unlockCost, unlockedAt: now, createdAt: now });
        const hid = `${unlockId}_paid`;
        tx.create(fsdb.collection("histories").doc(hid), { _id: hid, id: hid, otherUserId: String(userId), videoId: String(videoId), uniqueId: historyUniqueId, coin: -unlockCost, type: 9, date: now, createdAt: now });
        revenueSplit.applyRevenuePlan(tx, plan);
        return "OK";
      }));
    } catch (err) {
      if (err.code === 6 || /ALREADY_EXISTS/i.test(err.message || "")) outcome = "ALREADY";
      else throw err;
    }
    if (outcome === "ALREADY") {
      return res.status(200).json({ status: false, message: "Video already unlocked.", isUnlocked: true, videoUrl: video.videoUrl || null });
    }
    if (outcome === "INSUFFICIENT") {
      return res.status(200).json({ status: false, message: "Insufficient coin balance." });
    }
    const settlement = { creatorCoins: plan.creatorCoins, referrerCoins: plan.referrerCoins, platformCoins: plan.platformCoins };

    res.status(200).json({
      status: true,
      message: "Video unlocked successfully.",
      isUnlocked: true,
      // Feeds withhold a locked video's URL (middleware/withholdLockedPlayback.js);
      // the buyer gets it here.
      videoUrl: video.videoUrl || null,
      revenueSplit: {
        creatorCoins: settlement.creatorCoins,
        referrerCoins: settlement.referrerCoins,
        platformCoins: settlement.platformCoins,
      },
    });

    if (user.fcmToken) {
      try {
        const adminInstance = await admin;
        await adminInstance.messaging().send({
          token: user.fcmToken,
          notification: {
            title: "🔓 Video Unlocked!",
            body: `You unlocked a private video for ${unlockCost} coins! Enjoy the content! 🎬✨`,
          },
          data: {
            type: "VIDEO_UNLOCKED",
          },
        });
      } catch (err) {
        console.error("FCM error:", err.message);
      }
    }

    if (videoOwner.fcmToken) {
      try {
        const adminInstance = await admin;
        await adminInstance.messaging().send({
          token: videoOwner.fcmToken,
          notification: {
            title: "🎉 Private Video Unlocked!",
            body: `Your private video has been unlocked by a viewer. You’ve received ${unlockCost} coins in your wallet.`,
          },
          data: {
            type: "VIDEO_UNLOCK_RECEIVED",
            videoId: videoObjectId.toString(),
            coins: unlockCost.toString(),
          },
        });
      } catch (err) {
        console.error("Owner FCM error:", err.message);
      }
    }
  } catch (error) {
    console.error("unlockPrivateVideo error:", error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

//channel name verify when upload viodeo or shorts
exports.verifyChannelname = async (req, res) => {
  try {
    const channelService = require("../../util/channel.service");
    // Query string first: browsers drop the body of a GET request.
    const name = channelService.normalizeName(req.query?.fullName ?? req.body?.fullName);
    if (!name) {
      return res.status(200).json({ status: false, code: "CHANNEL_NAME_REQUIRED", message: "Enter a channel name." });
    }
    if (name.length < channelService.NAME_MIN || name.length > channelService.NAME_MAX) {
      return res.status(200).json({ status: false, code: "CHANNEL_NAME_INVALID", message: "Enter a channel name between " + channelService.NAME_MIN + " and " + channelService.NAME_MAX + " characters." });
    }

    // A name the caller already owns (their own profile name, or the name they
    // reserved) is available to them.
    const callerId = req.appUserId ? String(req.appUserId) : "";
    const [sameName, reserved] = await Promise.all([
      db.find("users", { fullName: name }),
      db.findById("channelNames", channelService.nameKey(name)).catch(() => null),
    ]);
    const takenByOther = sameName.some((u) => String(u._id || u.id) !== callerId) || (reserved && String(reserved.ownerId) !== callerId);
    if (takenByOther) {
      return res.status(200).json({ status: false, code: "CHANNEL_NAME_TAKEN", message: "This channel name is already taken. Please try another one." });
    }
    return res.status(200).json({ status: true, message: "This channel name is available. You may proceed to use it." });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//upload (normal videos or shorts) by the user
exports.createVideo = async (req, res) => {
  // Held while this request publishes its upload; given back if it fails.
  let heldClaim = null;
  let heldRef = null;
  let heldProvider = null;
  try {
    const mediaPolicy = require("../../util/mediaPolicy");
    const media = mediaPolicy.videoLocation(req.body?.videoUrl, require("../../util/cloudflareStorage.service")._cfg());
    if (!media) return res.status(400).json({ status: false, code: "INVALID_VIDEO_PROVIDER", message: "Upload videos and bites to the configured Cloudflare storage first." });
    // A Cloudflare URL isn't proof of ownership: the caller must hold the
    // unused, unexpired grant issued when they uploaded it (util/uploadGrants.js),
    // and an R2 object must really exist.
    const mediaRef = media.storageProvider === "stream" ? media.streamUid : uploadGrants.r2KeyFromUrl(media.videoUrl);

    // Publishing is idempotent: a retry after a lost reply (or a second tap)
    // for an upload this caller already published gets that video back, not
    // an error and not a duplicate.
    const publishedAlready = async () => {
      const existing = await uploadGrants.publishedVideoFor({ provider: media.storageProvider, ref: mediaRef, ownerId: req.appUserId });
      if (!existing) return false;
      res.status(200).json({ status: true, alreadyPublished: true, message: "This video is already published.", video: existing, underReview: existing.moderationStatus === "pending_review" });
      return true;
    };
    if (await publishedAlready()) return;

    const ownership = await uploadGrants.verifyOwnedUpload({ provider: media.storageProvider, ref: mediaRef, ownerId: req.appUserId });
    if (!ownership.ok) {
      // A parallel request for the same upload may have finished in the meantime.
      if (ownership.code === "UPLOAD_ALREADY_USED" && (await publishedAlready())) return;
      return res.status(403).json({ status: false, code: ownership.code, message: ownership.message });
    }
    if (media.storageProvider === "r2") {
      const stored = await uploadGrants.r2ObjectInfo(mediaRef);
      if (stored && (!stored.exists || stored.size <= 0)) {
        return res.status(409).json({ status: false, code: "UPLOAD_INCOMPLETE", message: "The upload hasn't finished. Please upload the video again." });
      }
      if (stored && stored.size > mediaPolicy.MAX_VIDEO_BYTES) {
        await discardOwnUpload(req, req.body.videoUrl);
        await discardOwnUpload(req, req.body.videoImage);
        return res.status(413).json({ status: false, code: "UPLOAD_TOO_LARGE", message: "This video is larger than the allowed size." });
      }
    }
    // Two requests racing on one upload: only one may create the video.
    const claim = await uploadGrants.claimGrant({ provider: media.storageProvider, ref: mediaRef, ownerId: req.appUserId });
    if (!claim.ok) {
      if (claim.code === "UPLOAD_ALREADY_USED" && (await publishedAlready())) return;
      return res.status(claim.code === "UPLOAD_IN_PROGRESS" ? 409 : 403).json({ status: false, code: claim.code, message: claim.message });
    }
    heldClaim = claim.claimId;
    heldRef = mediaRef;
    heldProvider = media.storageProvider;
    if (
      !req.body.title ||
      //!req.body.description ||
      //!req.body.hashTag ||
      !req.body.videoType ||
      !req.body.videoTime ||
      !req.body.visibilityType ||
      !req.body.audienceType ||
      !req.body.commentType ||
      !req.body.scheduleType ||
      //!req.body.location ||
      //!req.body.latitude ||
      //!req.body.longitude ||
      !req.body.userId ||
      !req.body.videoPrivacyType ||
      //!req.body.channelId ||
      !req.body.videoUrl ||
      !req.body.videoImage
    ) {
      if (req.body.videoImage) {
        await discardOwnUpload(req, req.body.videoImage);
      }

      if (req.body.videoUrl) {
        await discardOwnUpload(req, req.body.videoUrl);
      }

      return res.status(200).json({ status: false, message: "Oops ! Invalid details!" });
    }

    // A scheduled publish needs a valid future time (with its timezone); it
    // stays owner-only until then (util/scheduledPublish).
    let scheduledAt = null;
    if (req.body.scheduleType == 1) {
      const parsed = scheduledPublish.parseScheduleTime(req.body.scheduleTime);
      if (!parsed.ok) {
        if (req.body.videoImage) {
          await discardOwnUpload(req, req.body.videoImage);
        }

        if (req.body.videoUrl) {
          await discardOwnUpload(req, req.body.videoUrl);
        }

        return res.status(200).json({ status: false, code: parsed.code, message: parsed.message });
      }
      scheduledAt = parsed.iso;
    }
    // Upload form choices are stored as numbers and must be in range.
    for (const [field, max] of [["visibilityType", 3], ["audienceType", 3], ["commentType", 4], ["videoPrivacyType", 2]]) {
      const n = Number(req.body[field]);
      if (!Number.isInteger(n) || n < 1 || n > max) {
        if (req.body.videoImage) await discardOwnUpload(req, req.body.videoImage);
        if (req.body.videoUrl) await discardOwnUpload(req, req.body.videoUrl);
        return res.status(200).json({ status: false, code: "INVALID_OPTION", message: `${field} is not a valid choice.` });
      }
    }

    if (req.body.videoType == 2) {
      if (settingJSON.durationOfShorts < parseInt(req.body.videoTime)) {
        if (req.body.videoImage) {
          await discardOwnUpload(req, req.body.videoImage);
        }

        if (req.body.videoUrl) {
          await discardOwnUpload(req, req.body.videoUrl);
        }
        return res.status(200).json({ status: false, message: "your duration of Shorts greater than decided by admin!" });
      }
    }

    if (req?.body?.soundListId) {
      var soundList = await SoundList.findById(req?.body?.soundListId);
      if (!soundList) {
        if (req.body.videoImage) {
          await discardOwnUpload(req, req.body.videoImage);
        }

        if (req.body.videoUrl) {
          await discardOwnUpload(req, req.body.videoUrl);
        }

        return res.status(200).json({ status: false, message: "soundList does not found!" });
      }
    }

    // isAddByAdmin: false in the query itself would only match documents where
    // that field was explicitly set to false — Firestore equality doesn't
    // treat a missing field as false, and 15 of the 18 live user docs (every
    // real signup, including the founder's own account) never had this field
    // set at all. That silently rejected every real user's upload with "user
    // does not found!". Fetch by id/isActive only, then check the flag in code
    // so missing == not-admin-added, same as it was clearly meant to behave.
    const [uniqueVideoId, user] = await Promise.all([generateUniqueVideoId(), User.findOne({ _id: req.body.userId, isActive: true })]);

    if (!user || user.isAddByAdmin === true) {
      if (req.body.videoImage) {
        await discardOwnUpload(req, req.body.videoImage);
      }

      if (req.body.videoUrl) {
        await discardOwnUpload(req, req.body.videoUrl);
      }
      return res.status(200).json({ status: false, message: "user does not found!" });
    }

    if (user.isBlock) {
      if (req.body.videoImage) {
        await discardOwnUpload(req, req.body.videoImage);
      }

      if (req.body.videoUrl) {
        await discardOwnUpload(req, req.body.videoUrl);
      }

      return res.status(200).json({ status: false, message: "you are blocked by admin!" });
    }

    const video = new Video();

    if (!user.isChannel) {
      console.log("User don't have channel:  ", req?.body?.channelType);

      if (req.body.fullName && req.body.fullName !== user.fullName) {
        //Check if the new channelName is different from the current one
        const isDuplicateFullName = await User.findOne({ fullName: req.body.fullName.trim() });
        if (isDuplicateFullName) {
          if (req.body.videoImage) {
            await discardOwnUpload(req, req.body.videoImage);
          }

          if (req.body.videoUrl) {
            await discardOwnUpload(req, req.body.videoUrl);
          }

          return res.status(200).json({ status: false, message: "The provided channelName is already in use. Please choose a different one." });
        }

        user.fullName = req.body.fullName ? req.body.fullName.trim() : user.fullName; //channelName
      }

      // The channel is the owner's own profile (channelId === userId): the channel
      // page, subscriptions and monetisation all look the channel up by that id.
      user.channelId = String(user._id || user.id);
      user.isChannel = true;
      user.channelType = parseInt(req?.body?.channelType) || 1;
      user.subscriptionCost = 10;
      user.videoUnlockCost = 10;

      user.descriptionOfChannel = req.body.descriptionOfChannel ? req.body.descriptionOfChannel : user.descriptionOfChannel;
      // Most accounts never had this object (only a channel setup writes it): an
      // unguarded write here made the first upload of such an account a 500.
      if (!user.socialMediaLinks || typeof user.socialMediaLinks !== "object") user.socialMediaLinks = {};
      user.socialMediaLinks.instagramLink = req.body.instagramLink ? req.body.instagramLink : user.socialMediaLinks.instagramLink;
      user.socialMediaLinks.facebookLink = req.body.facebookLink ? req.body.facebookLink : user.socialMediaLinks.facebookLink;
      user.socialMediaLinks.twitterLink = req.body.twitterLink ? req.body.twitterLink : user.socialMediaLinks.twitterLink;
      user.socialMediaLinks.websiteLink = req.body.websiteLink ? req.body.websiteLink : user.socialMediaLinks.websiteLink;

      video.channelId = user.channelId;
    }

    let channel;
    if (req.body.channelId) {
      console.log("User have channel");

      channel = await User.findOne({ channelId: user.channelId });
      if (!channel) {
        if (req.body.videoImage) {
          await discardOwnUpload(req, req.body.videoImage);
        }

        if (req.body.videoUrl) {
          await discardOwnUpload(req, req.body.videoUrl);
        }

        return res.status(404).json({ status: false, code: "CHANNEL_NOT_FOUND", message: "Channel does not found!" });
      }

      if (user.channelId !== req.body.channelId) {
        if (req.body.videoImage) {
          await discardOwnUpload(req, req.body.videoImage);
        }

        if (req.body.videoUrl) {
          await discardOwnUpload(req, req.body.videoUrl);
        }

        return res.status(403).json({ status: false, code: "CHANNEL_NOT_OWNED", message: "Video has been uploaded only by own channelId." });
      }

      video.channelId = channel.channelId;
    }

    if (req?.body?.scheduleType) {
      video.scheduleType = req?.body?.scheduleType;

      if (req?.body?.scheduleType == 1) {
        video.scheduleTime = scheduledAt; // UTC ISO, e.g. "2023-07-11T18:00:00.000Z"
      } else if (req?.body?.scheduleType == 2) {
        video.scheduleTime = "";
      } else {
        if (req.body.videoImage) {
          await discardOwnUpload(req, req.body.videoImage);
        }

        if (req.body.videoUrl) {
          await discardOwnUpload(req, req.body.videoUrl);
        }

        return res.status(200).json({ status: false, message: "scheduleType must be passed valid!" });
      }
    }

    video.title = req?.body?.title.trim();
    video.description = (req?.body?.description || "").trim();
    video.videoType = req?.body?.videoType;
    video.videoTime = req?.body?.videoTime;
    video.videoUrl = req?.body?.videoUrl;
    video.videoImage = req?.body?.videoImage;

    // ── Cloudflare Stream metadata (set when the app used direct upload) ──
    if (media.streamUid) {
      video.streamUid = media.streamUid;
      video.storageProvider = "stream";
      video.rawVideoUrl = null;
      const pb = videoPipeline.playbackUrls(media.streamUid);
      video.hlsUrl = pb.hlsUrl;
      video.dashUrl = pb.dashUrl;
      video.videoUrl = video.hlsUrl; // the app plays videoUrl
      video.streamStatus = "inprogress";
    } else {
      video.storageProvider = "r2";
      video.rawVideoUrl = req.body.videoUrl;
      video.streamStatus = "r2";
    }
    video.visibilityType = Number(req.body.visibilityType);
    video.audienceType = Number(req.body.audienceType);
    video.commentType = Number(req.body.commentType);
    video.scheduleType = Number(req.body.scheduleType);
    video.videoPrivacyType = parseInt(req?.body?.videoPrivacyType);

    video.location = req?.body?.location ? String(req.body.location).toLowerCase() : "";
    video.locationCoordinates = {
      latitude: req?.body?.latitude || "",
      longitude: req?.body?.longitude || "",
    };
    video.soundListId = soundList?._id || null;
    video.userId = user._id;
    video.isAddByAdmin = false;

    const multiplehashTag = req.body.hashTag ? req?.body?.hashTag.toString().split(",") : [];
    video.hashTag = multiplehashTag;

    video.uniqueVideoId = uniqueVideoId;

    // user is a plain object from findOne() — no .save(); persist explicitly.
    const userChanges = {};
    for (const k of ["fullName", "channelId", "isChannel", "channelType", "subscriptionCost", "videoUnlockCost", "descriptionOfChannel", "socialMediaLinks"]) {
      if (user[k] !== undefined) userChanges[k] = user[k];
    }
    await db.update("users", user._id || user.id, userChanges);
    const savedVideo = await video.save();
    const newVideoId = savedVideo._id || savedVideo.id || video._id;
    await uploadGrants.markGrantUsed({ provider: media.storageProvider, ref: mediaRef, videoId: newVideoId }).catch((e) => console.error("markGrantUsed:", e.message));

    // Content moderation — keyword-screen the metadata (transcript is added later
    // by the worker); may push the video to pending_review.
    let moderationResult = { flagged: false };
    try {
      moderationResult = await moderation.screenVideo({
        videoId: newVideoId,
        title: video.title, description: video.description,
        hashTags: video.hashTag || [],
      });
    } catch (e) { console.error("moderation.screenVideo:", e.message); }

    // Copyright — enqueue for fingerprinting (a worker processes the queue).
    try {
      await copyright.queueForFingerprint({
        videoId: newVideoId, streamUid: video.streamUid || null, videoUrl: video.rawVideoUrl || video.videoUrl,
      });
    } catch (e) { /* engine disabled or no worker */ }

    const data = await Video.findById(newVideoId);
    if (data && data.soundListId) {
      try {
        const sl = await SoundList.findById(data.soundListId);
        if (sl) data.soundListId = { _id: sl._id, soundTitle: sl.soundTitle, soundLink: sl.soundLink };
      } catch (e) { /* leave as id */ }
    }
    if (data) {
      data.userId = { _id: user._id || user.id, fullName: user.fullName, nickName: user.nickName };
    }

    res.status(200).json({
      status: true,
      message: moderationResult.flagged
        ? "Video uploaded — it is under review and will go live once approved."
        : "Normal video or shorts has been uploaded by the user!",
      video: data,
      underReview: !!moderationResult.flagged,
    });

    //if user don't have channel then send notification to that user
    if (!user.isChannel) {
      if (user.fcmToken && user.fcmToken !== null) {
        const payload = {
          token: user.fcmToken,
          notification: {
            title: "🚀 Channel Creation Successful! 🚀",
            body: "Your channel has been successfully created. Start uploading content and turn your creativity into earnings today! 📈",
          },
        };

        const adminPromise = await admin;
        adminPromise
          .messaging()
          .send(payload)
          .then((response) => {
            console.log("Successfully sent with response: ", response);
          })
          .catch((error) => {
            console.log("Error sending message: ", error);
          });
      }
    }

    // Subscribers: an in-app notification for each (and a push where they
    // have a token) — only when the video is publicly listed now; a scheduled
    // one is announced when it goes live (util/videoNotifications).
    await require("../../util/videoNotifications").notifySubscribersOfNewVideo(data || video, { admin });
  } catch (error) {
    // After the success response nothing may be cleaned up or sent again:
    // the video is published (a second send also crashed the process).
    if (res.headersSent) {
      console.error("createVideo post-response step failed:", error.message);
      return;
    }
    // Let the app's retry take the upload again.
    await uploadGrants.releaseClaim({ provider: heldProvider, ref: heldRef, claimId: heldClaim }).catch(() => {});
    if (req.body.videoImage) {
      await discardOwnUpload(req, req.body.videoImage);
    }

    if (req.body.videoUrl) {
      await discardOwnUpload(req, req.body.videoUrl);
    }

    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//when user share (normal videos or shorts) then shareCount increased
exports.shareCount = async (req, res) => {
  try {
    if (!req.query.userId || !req.query.videoId) {
      return res.status(200).json({ status: false, message: "Oops ! Invalid details." });
    }

    const [user, video] = await Promise.all([User.findOne({ _id: req.query.userId, isActive: true }), Video.findOne({ _id: req.query.videoId, isActive: true })]);

    if (!user) {
      return res.status(200).json({ status: false, message: "User does not found." });
    }

    if (user.isBlock) {
      return res.status(200).json({ status: false, message: "you are blocked by admin!" });
    }

    if (!video) {
      return res.status(200).json({ status: false, message: "video does not found!!" });
    }

    const updated = await Video.findByIdAndUpdate(video._id || video.id, { $inc: { shareCount: 1 } });

    return res.status(200).json({ status: true, message: "When user share video then shareCount increased!", video: updated });
  } catch (error) {
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//get shorts from home page directly
exports.shortsOfUser = async (req, res) => {
  try {
    if (!req.query.userId || !req.query.videoId) {
      return res.status(200).json({ status: false, message: "userId and videoId must be requried." });
    }

    const start = req.query.start ? parseInt(req.query.start) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 50;

    const userId = new mongoose.Types.ObjectId(req.query.userId);

    const user = await User.findOne({ _id: userId, isActive: true });
    if (!user) {
      return res.status(200).json({ status: false, message: "User does not found!" });
    }

    if (user.isBlock) {
      return res.status(200).json({ status: false, message: "you are blocked by admin!" });
    }

    let shorts = await Video.aggregate([
      {
        $match: {
          isActive: true,
          scheduleType: 2,
          visibilityType: 1,
          moderationStatus: { $nin: ["pending_review", "rejected"] },
          isCopyrightFlagged: { $ne: true },
          videoType: 2,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "channelId",
          foreignField: "channelId",
          as: "channel",
        },
      },
      {
        $unwind: {
          path: "$channel",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "videocomments",
          localField: "_id",
          foreignField: "videoId",
          pipeline: [{ $match: { recursiveCommentId: null, status: { $ne: "held" } } }], // held-for-review comments are not public
          as: "totalComments",
        },
      },
      {
        $lookup: {
          from: "likehistoryofvideos",
          localField: "_id",
          foreignField: "videoId",
          pipeline: [{ $match: { userId: user._id } }, { $limit: 1 }],
          as: "likeHistory",
        },
      },
      {
        $unwind: {
          path: "$likeHistory",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "watchhistories",
          localField: "_id",
          foreignField: "videoId",
          as: "views",
        },
      },
      {
        $lookup: {
          from: "userwisesubscriptions",
          localField: "channel.channelId",
          foreignField: "channelId",
          pipeline: [{ $match: { userId: userId } }, { $limit: 1 }],
          as: "subscription",
        },
      },
      {
        $lookup: {
          from: "videounlocks",
          localField: "_id",
          foreignField: "videoId",
          pipeline: [{ $match: { userId: userId } }, { $limit: 1 }],
          as: "unlockData",
        },
      },
      {
        $addFields: {
          isSubscribed: { $gt: [{ $size: "$subscription" }, 0] },
          isUnlocked: { $gt: [{ $size: "$unlockData" }, 0] },
          storedPrivacyType: "$videoPrivacyType", // before the per-viewer recompute below
        },
      },
      {
        $addFields: {
          videoPrivacyType: {
            $cond: {
              if: {
                $or: [
                  { $eq: ["$videoPrivacyType", 1] }, // free video
                  "$isUnlocked", // individually unlocked
                  {
                    $and: [
                      { $eq: ["$channel.channelType", 2] }, // paid channel
                      "$isSubscribed",
                    ],
                  },
                ],
              },
              then: 1,
              else: 2,
            },
          },
        },
      },
      {
        $project: {
          like: 1,
          dislike: 1,
          shareCount: 1,
          title: 1,
          videoType: 1,
          videoTime: 1,
          videoUrl: 1,
          videoImage: 1,
          description: 1,
          hashTag: 1,
          userId: 1,
          channelId: 1,
          videoPrivacyType: 1,
          createdAt: 1,
          channelType: "$channel.channelType",
          subscriptionCost: "$channel.subscriptionCost",
          // Free videos have no price, whatever the channel charges for its paid ones
          // (issue: free uploads were listed as "Premium Exclusive").
          videoUnlockCost: { $cond: [{ $eq: ["$storedPrivacyType", 2] }, "$channel.videoUnlockCost", 0] },
          isPaidVideo: { $eq: ["$storedPrivacyType", 2] },
          channelName: "$channel.fullName",
          channelImage: "$channel.image",
          totalComments: { $size: "$totalComments" },
          isSubscribed: 1,
          isLike: { $eq: ["$likeHistory.likeOrDislike", "like"] },
          isDislike: { $eq: ["$likeHistory.likeOrDislike", "dislike"] },
          views: { $size: "$views" },
        },
      },
      { $skip: (start - 1) * limit },
      { $limit: limit },
    ]);

    // Find the index of the specified videoId
    const videoIndex = shorts.findIndex((short) => short._id.toString() === req.query.videoId);

    // If the videoId is found, move it to the 0th index
    if (videoIndex !== -1) {
      const [movedVideo] = shorts.splice(videoIndex, 1);
      shorts.unshift(movedVideo);
    }

    // Adjust the skip value
    const adjustedStart = videoIndex !== -1 ? 1 : start;

    // Limit the shorts based on the new start value
    shorts = shorts.slice(adjustedStart - 1, adjustedStart - 1 + limit);

  } catch (error) {
    console.log("videosOfHome fallback to local DB:", error.message);
    try {
      const db = require("../../util/connection");
      let videos = await db.find("videos", {});
      return res.status(200).json({
        status: true,
        message: "Retrieve videos for user from local DB",
        videos: videos || [],
        total: videos.length || 0,
      });
    } catch (e) {
      return res.status(200).json({ status: true, message: "Retrieve videos for user", videos: [], total: 0 });
    }
  }
};

//get all shorts for user (shorts)
exports.getShorts = async (req, res) => {
  try {
    const start = req.query.start ? parseInt(req.query.start) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 50;

    const hasUser = !!req.query.userId;
    const userId = hasUser ? new mongoose.Types.ObjectId(req.query.userId) : null;

    if (hasUser) {
      const user = await User.findOne({ _id: userId, isActive: true });
      if (!user) {
        return res.status(200).json({ status: false, message: "User does not found!" });
      }
      if (user.isBlock) {
        return res.status(200).json({ status: false, message: "you are blocked by admin!" });
      }
    }

    const result = await Video.aggregate([
      {
        $match: {
          isActive: true,
          scheduleType: 2,
          visibilityType: 1,
          moderationStatus: { $nin: ["pending_review", "rejected"] },
          isCopyrightFlagged: { $ne: true },
          videoType: 2,
        },
      },
      {
        $facet: {
          shorts: [
            { $sort: { createdAt: -1 } },
            { $skip: (start - 1) * limit },
            { $limit: limit },
            {
              $lookup: {
                from: "users",
                localField: "channelId",
                foreignField: "channelId",
                as: "channel",
              },
            },
            { $unwind: { path: "$channel", preserveNullAndEmptyArrays: true } },
            {
              $lookup: {
                from: "videocomments",
                localField: "_id",
                foreignField: "videoId",
                pipeline: [{ $match: { recursiveCommentId: null, status: { $ne: "held" } } }], // held-for-review comments are not public
                as: "totalComments",
              },
            },
            {
              $lookup: {
                from: "likehistoryofvideos",
                localField: "_id",
                foreignField: "videoId",
                pipeline: [{ $match: { userId: userId } }, { $limit: 1 }],
                as: "likeHistory",
              },
            },
            { $unwind: { path: "$likeHistory", preserveNullAndEmptyArrays: true } },
            {
              $lookup: {
                from: "watchhistories",
                localField: "_id",
                foreignField: "videoId",
                as: "views",
              },
            },
            {
              $lookup: {
                from: "savetowatchlaters",
                localField: "_id",
                foreignField: "videoId",
                pipeline: [{ $match: { userId: userId } }, { $limit: 1 }],
                as: "isSaveToWatchLater",
              },
            },
            {
              $lookup: {
                from: "userwisesubscriptions",
                localField: "channel.channelId",
                foreignField: "channelId",
                pipeline: [{ $match: { userId: userId } }, { $limit: 1 }],
                as: "subscription",
              },
            },
            {
              $lookup: {
                from: "videounlocks",
                localField: "_id",
                foreignField: "videoId",
                pipeline: [{ $match: { userId: userId } }, { $limit: 1 }],
                as: "unlockData",
              },
            },
            {
              $addFields: {
                isUnlocked: {
                  $cond: [hasUser, { $gt: [{ $size: "$unlockData" }, 0] }, false],
                },
                storedPrivacyType: "$videoPrivacyType", // before the per-viewer recompute below
                isSubscribed: {
                  $cond: [hasUser, { $gt: [{ $size: "$subscription" }, 0] }, false],
                },
                isSaveToWatchLater: {
                  $cond: [hasUser, { $gt: [{ $size: "$isSaveToWatchLater" }, 0] }, false],
                },
              },
            },
            {
              $addFields: {
                videoPrivacyType: {
                  $cond: {
                    if: {
                      $or: [
                        { $eq: ["$videoPrivacyType", 1] }, // free video
                        "$isUnlocked", // individually unlocked
                        {
                          $and: [
                            { $eq: ["$channel.channelType", 2] }, // paid channel
                            "$isSubscribed",
                          ],
                        },
                      ],
                    },
                    then: 1,
                    else: 2,
                  },
                },
              },
            },
            {
              $project: {
                like: 1,
                dislike: 1,
                shareCount: 1,
                title: 1,
                videoType: 1,
                videoTime: 1,
                videoUrl: 1,
                videoImage: 1,
                description: 1,
                hashTag: 1,
                userId: 1,
                channelId: 1,
                videoPrivacyType: 1,
                commentType: 1,
                createdAt: 1,
                channelType: "$channel.channelType",
                subscriptionCost: "$channel.subscriptionCost",
                // Free videos have no price, whatever the channel charges for its paid ones
                // (issue: free uploads were listed as "Premium Exclusive").
                videoUnlockCost: { $cond: [{ $eq: ["$storedPrivacyType", 2] }, "$channel.videoUnlockCost", 0] },
                isPaidVideo: { $eq: ["$storedPrivacyType", 2] },
                channelName: "$channel.fullName",
                channelImage: "$channel.image",
                totalComments: { $size: "$totalComments" },
                isSubscribed: 1,
                isSaveToWatchLater: 1,
                isLike: {
                  $cond: [hasUser, { $eq: ["$likeHistory.likeOrDislike", "like"] }, false],
                },
                isDislike: {
                  $cond: [hasUser, { $eq: ["$likeHistory.likeOrDislike", "dislike"] }, false],
                },
                views: { $size: "$views" },
              },
            },
          ],
          total: [{ $count: "total" }],
        },
      },
    ]);

    return res.status(200).json({
      status: true,
      message: "Retrive shorts for user.",
      total: result[0]?.total[0]?.total || 0,
      shorts: result[0]?.shorts || [],
    });
  } catch (error) {
    console.error("getShorts fallback to local DB:", error.message);
    try {
      const db = require("../../util/connection");
      let allVideos = await db.find("videos", {});
      let shorts = allVideos.filter((v) => Number(v.videoType) === 2 || String(v._id).startsWith("short_"));
      if (shorts.length === 0) shorts = allVideos;
      return res.status(200).json({
        status: true,
        message: "Retrieve shorts for user from local DB",
        total: shorts.length,
        shorts: shorts,
      });
    } catch (e) {
      return res.status(200).json({ status: true, message: "Retrieve shorts for user", total: 0, shorts: [] });
    }
  }
};

//get all normal videos for user (home)
exports.getVideos = async (req, res) => {
  try {
    const start = req.query.start ? parseInt(req.query.start) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 50;

    if (!req.query.userId) {
      // Anonymous browsing: public, published, unmoderated-OK normal videos only
      // (this used to return the whole videos collection — private, deleted,
      // held and copyright-flagged records included).
      const publicVideos = await Video.aggregate([
        { $match: { ...visibility.publicListingMatch(), videoType: 1 } },
        { $sort: { createdAt: -1 } },
        { $skip: (start - 1) * limit },
        { $limit: limit },
      ]);
      return res.status(200).json({ status: true, message: "Retrieve videos for the user.", videos: publicVideos.map(visibility.stripInternal) });
    }

    let now = dayjs();

    const userId = new mongoose.Types.ObjectId(req.query.userId);

    const [user, videos] = await Promise.all([
      User.findOne({ _id: userId, isActive: true }).select("isBlock").lean(),
      Video.aggregate([
        {
          $match: {
            isActive: true,
            videoType: 1,
            scheduleType: 2,
            visibilityType: 1,
            moderationStatus: { $nin: ["pending_review", "rejected"] },
            isCopyrightFlagged: { $ne: true },
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "channelId",
            foreignField: "channelId",
            as: "channel",
          },
        },
        {
          $unwind: {
            path: "$channel",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "watchhistories",
            localField: "_id",
            foreignField: "videoId",
            as: "views",
          },
        },
        {
          $lookup: {
            from: "savetowatchlaters",
            localField: "_id",
            foreignField: "videoId",
            pipeline: [{ $match: { userId: userId } }, { $limit: 1 }],
            as: "isSaveToWatchLater",
          },
        },
        {
          $lookup: {
            from: "userwisesubscriptions",
            localField: "channel.channelId",
            foreignField: "channelId",
            pipeline: [{ $match: { userId: userId } }, { $limit: 1 }],
            as: "subscription",
          },
        },
        {
          $lookup: {
            from: "videounlocks",
            localField: "_id",
            foreignField: "videoId",
            pipeline: [{ $match: { userId: userId } }, { $limit: 1 }],
            as: "unlockData",
          },
        },
        {
          $addFields: {
            isSaveToWatchLater: { $gt: [{ $size: "$isSaveToWatchLater" }, 0] },
            isSubscribed: { $gt: [{ $size: "$subscription" }, 0] },
            isUnlocked: { $gt: [{ $size: "$unlockData" }, 0] },
            storedPrivacyType: "$videoPrivacyType", // before the per-viewer recompute below
          },
        },
        {
          $addFields: {
            videoPrivacyType: {
              $cond: {
                if: {
                  $or: [
                    { $eq: ["$videoPrivacyType", 1] }, // free video
                    "$isUnlocked", // individually unlocked
                    {
                      $and: [
                        { $eq: ["$channel.channelType", 2] }, // paid channel
                        "$isSubscribed",
                      ],
                    },
                  ],
                },
                then: 1,
                else: 2,
              },
            },
          },
        },
        {
          $project: {
            _id: 1,
            title: 1,
            videoType: 1,
            videoTime: 1,
            videoUrl: 1,
            videoImage: 1,
            scheduleType: 1,
            scheduleTime: 1,
            userId: 1, //videoUserId
            channelId: 1, //videoChannelId
            videoPrivacyType: 1,
            views: { $size: "$views" },
            channelType: "$channel.channelType",
            subscriptionCost: "$channel.subscriptionCost",
            // Free videos have no price, whatever the channel charges for its paid ones
            // (issue: free uploads were listed as "Premium Exclusive").
            videoUnlockCost: { $cond: [{ $eq: ["$storedPrivacyType", 2] }, "$channel.videoUnlockCost", 0] },
            isPaidVideo: { $eq: ["$storedPrivacyType", 2] },
            channelName: "$channel.fullName",
            channelImage: "$channel.image",
            isSaveToWatchLater: 1,
            isSubscribed: 1,
            time: {
              $let: {
                vars: {
                  timeDiff: { $subtract: [now.toDate(), "$createdAt"] },
                },
                in: {
                  $concat: [
                    {
                      $switch: {
                        branches: [
                          {
                            case: { $gte: ["$$timeDiff", 31536000000] },
                            then: { $concat: [{ $toString: { $floor: { $divide: ["$$timeDiff", 31536000000] } } }, " years ago"] },
                          },
                          {
                            case: { $gte: ["$$timeDiff", 2592000000] },
                            then: { $concat: [{ $toString: { $floor: { $divide: ["$$timeDiff", 2592000000] } } }, " months ago"] },
                          },
                          {
                            case: { $gte: ["$$timeDiff", 604800000] },
                            then: { $concat: [{ $toString: { $floor: { $divide: ["$$timeDiff", 604800000] } } }, " weeks ago"] },
                          },
                          {
                            case: { $gte: ["$$timeDiff", 86400000] },
                            then: { $concat: [{ $toString: { $floor: { $divide: ["$$timeDiff", 86400000] } } }, " days ago"] },
                          },
                          {
                            case: { $gte: ["$$timeDiff", 3600000] },
                            then: { $concat: [{ $toString: { $floor: { $divide: ["$$timeDiff", 3600000] } } }, " hours ago"] },
                          },
                          {
                            case: { $gte: ["$$timeDiff", 60000] },
                            then: { $concat: [{ $toString: { $floor: { $divide: ["$$timeDiff", 60000] } } }, " minutes ago"] },
                          },
                          {
                            case: { $gte: ["$$timeDiff", 1000] },
                            then: { $concat: [{ $toString: { $floor: { $divide: ["$$timeDiff", 1000] } } }, " seconds ago"] },
                          },
                          { case: true, then: "Just now" },
                        ],
                      },
                    },
                  ],
                },
              },
            },
          },
        },
        { $sort: { time: -1 } },
        { $skip: (start - 1) * limit },
        { $limit: limit },
      ]),
    ]);

    if (!user) {
      return res.status(200).json({ status: false, message: "User does not found." });
    }

    if (user.isBlock) {
      return res.status(200).json({ status: false, message: "you are blocked by admin." });
    }

    return res.status(200).json({ status: true, message: "Retrive videos for the user.", videos: videos });
  } catch (error) {
    console.log("getVideos fallback to local DB:", error.message);
    try {
      const db = require("../../util/connection");
      let allVideos = await db.find("videos", {});
      let normalVideos = allVideos.filter((v) => Number(v.videoType) === 1 || String(v._id).startsWith("video_"));
      if (normalVideos.length === 0) normalVideos = allVideos;
      return res.status(200).json({ status: true, message: "Retrieve videos for the user from local DB.", videos: normalVideos });
    } catch (e) {
      return res.status(200).json({ status: true, message: "Retrieve videos for the user.", videos: [] });
    }
  }
};

//get channel details of shorts for user
exports.channeldetailsOfShorts = async (req, res) => {
  try {
    if (!req.query.channelId || !req.query.userId || !req.query.start || !req.query.limit) {
      return res.status(200).json({ status: false, message: "Oops ! Invalid details!" });
    }

    const start = req.query.start ? parseInt(req.query.start) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 50;

    const [channel, user, totalShortsOfChannel, isSubscribedChannel] = await Promise.all([
      User.findOne({ channelId: req.query.channelId }),
      User.findOne({ _id: req.query.userId, isActive: true }),
      Video.countDocuments({ channelId: req.query.channelId, videoType: 2 }),
      UserWiseSubscription.findOne({ $and: [{ userId: req.query.userId }, { channelId: req.query.channelId }] }),
    ]);

    if (!channel) {
      return res.status(200).json({ status: false, message: "channel does not found!" });
    }

    if (!user) {
      return res.status(200).json({ status: false, message: "user does not found!" });
    }

    if (user.isBlock) {
      return res.status(200).json({ status: false, message: "you are blocked by admin!" });
    }

    const [isSubscribed, channelName, channelImage, totalSubscribers, data] = await Promise.all([
      isSubscribedChannel ? true : false,
      channel.fullName,
      channel.image,
      UserWiseSubscription.countDocuments({ channelId: channel.channelId }),
      Video.aggregate([
        {
          $match: {
            channelId: channel.channelId,
            videoType: 2,
            ...visibility.publicListingMatch(),
          },
        },
        {
          $lookup: {
            from: "watchhistories",
            localField: "_id",
            foreignField: "videoId",
            as: "views",
          },
        },
        {
          $project: {
            title: 1,
            videoType: 1,
            videoTime: 1,
            videoUrl: 1,
            videoImage: 1,
            channelId: 1,
            createdAt: 1,
            views: { $size: "$views" },
          },
        },
        { $skip: (start - 1) * limit },
        { $limit: limit },
      ]),
    ]);

    return res.status(200).json({
      status: true,
      message: "Retrive particular channel's details for shorts!",
      totalShortsOfChannel: totalShortsOfChannel,
      totalSubscribers: totalSubscribers,
      isSubscribed: isSubscribed,
      channelName: channelName,
      channelImage: channelImage,
      detailsOfShorts: data,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

//get type wise videos for user (home)
exports.videosOfHome = async (req, res) => {
  try {
    let now = dayjs();

    const start = req.query.start ? parseInt(req.query.start) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 50;

    if (!req.query.type) {
      return res.status(200).json({ status: false, message: "type must be requried." });
    }

    const type = req.query.type.trim().toLowerCase();
    const userId = req.query.userId && mongoose.Types.ObjectId.isValid(req.query.userId) ? new mongoose.Types.ObjectId(req.query.userId) : null;

    let user = null;
    if (userId) {
      user = await User.findOne({ _id: userId, isActive: true }).select("_id isBlock").lean();

      if (!user) {
        return res.status(200).json({
          status: false,
          message: "User does not found!",
        });
      }

      if (user.isBlock) {
        return res.status(200).json({
          status: false,
          message: "You are blocked by admin!",
        });
      }
    }

    if (type === "all") {
      let seed;
      if (start === 1) {
        seed =
          (userId
            ? userId
                .toString()
                .split("")
                .reduce((a, c) => a + c.charCodeAt(0), 0)
            : Math.floor(Math.random() * 1000000)) + Date.now();
      } else {
        if (!req.query.seed) {
          console.log("Seed is required for pagination beyond first page.");
          return res.status(200).json({
            status: false,
            message: "Seed is required for pagination beyond first page.",
          });
        }

        seed = Number(req.query.seed);

        if (!Number.isInteger(seed) || seed <= 0) {
          return res.status(200).json({
            status: false,
            message: "Invalid seed value.",
          });
        }
      }

      const [videos, shorts] = await Promise.all([
        Video.aggregate([
          {
            $match: {
              isActive: true,
              scheduleType: 2,
              visibilityType: 1,
              moderationStatus: { $nin: ["pending_review", "rejected"] },
              isCopyrightFlagged: { $ne: true },
              videoType: 1,
            },
          },
          {
            $facet: {
              data: [
                {
                  $addFields: {
                    randomSortField: {
                      $mod: [
                        {
                          $abs: {
                            $multiply: [{ $toLong: { $toDate: "$_id" } }, seed],
                          },
                        },
                        1234567,
                      ],
                    },
                  },
                },
                {
                  $sort: {
                    randomSortField: 1,
                    _id: 1,
                  },
                },
                { $skip: (start - 1) * limit },
                { $limit: limit },

                {
                  $lookup: {
                    from: "users",
                    localField: "channelId",
                    foreignField: "channelId",
                    as: "channel",
                  },
                },
                { $unwind: { path: "$channel", preserveNullAndEmptyArrays: true } },

                ...(userId
                  ? [
                      {
                        $lookup: {
                          from: "userwisesubscriptions",
                          localField: "channelId",
                          foreignField: "channelId",
                          pipeline: [{ $match: { userId: userId } }, { $limit: 1 }],
                          as: "subscription",
                        },
                      },
                    ]
                  : []),

                {
                  $lookup: {
                    from: "watchhistories",
                    localField: "_id",
                    foreignField: "videoId",
                    as: "views",
                  },
                },

                ...(userId
                  ? [
                      {
                        $lookup: {
                          from: "savetowatchlaters",
                          localField: "_id",
                          foreignField: "videoId",
                          pipeline: [{ $match: { userId: userId } }, { $limit: 1 }],
                          as: "isSaveToWatchLater",
                        },
                      },
                    ]
                  : []),

                ...(userId
                  ? [
                      {
                        $lookup: {
                          from: "videounlocks",
                          localField: "_id",
                          foreignField: "videoId",
                          pipeline: [{ $match: { userId: userId } }, { $limit: 1 }],
                          as: "unlockData",
                        },
                      },
                    ]
                  : []),
                {
                  $addFields: {
                    isSaveToWatchLater: { $gt: [{ $size: { $ifNull: ["$isSaveToWatchLater", []] } }, 0] },
                    isSubscribed: { $gt: [{ $size: { $ifNull: ["$subscription", []] } }, 0] },
                    isUnlocked: { $gt: [{ $size: { $ifNull: ["$unlockData", []] } }, 0] },
                    storedPrivacyType: "$videoPrivacyType", // before the per-viewer recompute below
                  },
                },
                {
                  $addFields: {
                    videoPrivacyType: {
                      $cond: {
                        if: {
                          $or: [
                            { $eq: ["$videoPrivacyType", 1] }, // free video
                            "$isUnlocked", // individually unlocked
                            {
                              $and: [
                                { $eq: ["$channel.channelType", 2] }, // paid channel
                                "$isSubscribed",
                              ],
                            },
                          ],
                        },
                        then: 1,
                        else: 2,
                      },
                    },
                  },
                },
                {
                  $project: {
                    _id: 1,
                    title: 1,
                    videoType: 1,
                    videoTime: 1,
                    videoUrl: 1,
                    videoImage: 1,
                    scheduleType: 1,
                    scheduleTime: 1,
                    videoPrivacyType: 1,
                    userId: 1, //videoUserId
                    channelId: 1, //videoChannelId
                    views: { $size: "$views" },
                    channelType: "$channel.channelType",
                    subscriptionCost: "$channel.subscriptionCost",
                    // Free videos have no price, whatever the channel charges for its paid ones
                    // (issue: free uploads were listed as "Premium Exclusive").
                    videoUnlockCost: { $cond: [{ $eq: ["$storedPrivacyType", 2] }, "$channel.videoUnlockCost", 0] },
                    isPaidVideo: { $eq: ["$storedPrivacyType", 2] },
                    channelName: "$channel.fullName",
                    channelImage: "$channel.image",
                    isSubscribed: 1,
                    isSaveToWatchLater: 1,
                    time: {
                      $let: {
                        vars: {
                          timeDiff: { $subtract: [now.toDate(), "$createdAt"] },
                        },
                        in: {
                          $concat: [
                            {
                              $switch: {
                                branches: [
                                  {
                                    case: { $gte: ["$$timeDiff", 31536000000] },
                                    then: { $concat: [{ $toString: { $floor: { $divide: ["$$timeDiff", 31536000000] } } }, " years ago"] },
                                  },
                                  {
                                    case: { $gte: ["$$timeDiff", 2592000000] },
                                    then: { $concat: [{ $toString: { $floor: { $divide: ["$$timeDiff", 2592000000] } } }, " months ago"] },
                                  },
                                  {
                                    case: { $gte: ["$$timeDiff", 604800000] },
                                    then: { $concat: [{ $toString: { $floor: { $divide: ["$$timeDiff", 604800000] } } }, " weeks ago"] },
                                  },
                                  {
                                    case: { $gte: ["$$timeDiff", 86400000] },
                                    then: { $concat: [{ $toString: { $floor: { $divide: ["$$timeDiff", 86400000] } } }, " days ago"] },
                                  },
                                  {
                                    case: { $gte: ["$$timeDiff", 3600000] },
                                    then: { $concat: [{ $toString: { $floor: { $divide: ["$$timeDiff", 3600000] } } }, " hours ago"] },
                                  },
                                  {
                                    case: { $gte: ["$$timeDiff", 60000] },
                                    then: { $concat: [{ $toString: { $floor: { $divide: ["$$timeDiff", 60000] } } }, " minutes ago"] },
                                  },
                                  {
                                    case: { $gte: ["$$timeDiff", 1000] },
                                    then: { $concat: [{ $toString: { $floor: { $divide: ["$$timeDiff", 1000] } } }, " seconds ago"] },
                                  },
                                  { case: true, then: "Just now" },
                                ],
                              },
                            },
                          ],
                        },
                      },
                    },
                  },
                },
              ],
              totalCount: [{ $count: "count" }],
            },
          },
          {
            $project: {
              data: 1,
              total: { $ifNull: [{ $arrayElemAt: ["$totalCount.count", 0] }, 0] },
            },
          },
        ]),
        Video.aggregate([
          {
            $match: {
              isActive: true,
              scheduleType: 2,
              visibilityType: 1,
              moderationStatus: { $nin: ["pending_review", "rejected"] },
              isCopyrightFlagged: { $ne: true },
              videoType: 2,
            },
          },
          {
            $facet: {
              data: [
                {
                  $addFields: {
                    randomSortField: {
                      $mod: [
                        {
                          $abs: {
                            $multiply: [{ $toLong: { $toDate: "$_id" } }, seed],
                          },
                        },
                        1234567,
                      ],
                    },
                  },
                },
                {
                  $sort: {
                    randomSortField: 1,
                    _id: 1,
                  },
                },
                { $skip: (start - 1) * limit },
                { $limit: limit },
                {
                  $lookup: {
                    from: "users",
                    localField: "channelId",
                    foreignField: "channelId",
                    as: "channel",
                  },
                },
                {
                  $unwind: {
                    path: "$channel",
                    preserveNullAndEmptyArrays: true,
                  },
                },
                ...(userId
                  ? [
                      {
                        $lookup: {
                          from: "userwisesubscriptions",
                          localField: "channelId",
                          foreignField: "channelId",
                          pipeline: [{ $match: { userId: userId } }, { $limit: 1 }],
                          as: "subscription",
                        },
                      },
                    ]
                  : []),

                {
                  $lookup: {
                    from: "videocomments",
                    localField: "_id",
                    foreignField: "videoId",
                    pipeline: [{ $match: { recursiveCommentId: null, status: { $ne: "held" } } }], // held-for-review comments are not public
                    as: "totalComments",
                  },
                },
                ...(userId
                  ? [
                      {
                        $lookup: {
                          from: "likehistoryofvideos",
                          localField: "_id",
                          foreignField: "videoId",
                          pipeline: [{ $match: { userId: userId } }, { $limit: 1 }],
                          as: "likeHistory",
                        },
                      },
                      {
                        $unwind: { path: "$likeHistory", preserveNullAndEmptyArrays: true },
                      },
                    ]
                  : []),

                {
                  $lookup: {
                    from: "watchhistories",
                    localField: "_id",
                    foreignField: "videoId",
                    as: "views",
                  },
                },

                ...(userId
                  ? [
                      {
                        $lookup: {
                          from: "savetowatchlaters",
                          localField: "_id",
                          foreignField: "videoId",
                          pipeline: [{ $match: { userId: userId } }, { $limit: 1 }],
                          as: "isSaveToWatchLater",
                        },
                      },
                    ]
                  : []),

                ...(userId
                  ? [
                      {
                        $lookup: {
                          from: "videounlocks",
                          localField: "_id",
                          foreignField: "videoId",
                          pipeline: [{ $match: { userId: userId } }, { $limit: 1 }],
                          as: "unlockData",
                        },
                      },
                    ]
                  : []),
                {
                  $addFields: {
                    isSaveToWatchLater: { $gt: [{ $size: { $ifNull: ["$isSaveToWatchLater", []] } }, 0] },
                    isSubscribed: { $gt: [{ $size: { $ifNull: ["$subscription", []] } }, 0] },
                    isUnlocked: { $gt: [{ $size: { $ifNull: ["$unlockData", []] } }, 0] },
                    storedPrivacyType: "$videoPrivacyType", // before the per-viewer recompute below
                  },
                },
                {
                  $addFields: {
                    videoPrivacyType: {
                      $cond: {
                        if: {
                          $or: [
                            { $eq: ["$videoPrivacyType", 1] }, // free video
                            "$isUnlocked", // individually unlocked
                            {
                              $and: [
                                { $eq: ["$channel.channelType", 2] }, // paid channel
                                "$isSubscribed",
                              ],
                            },
                          ],
                        },
                        then: 1,
                        else: 2,
                      },
                    },
                  },
                },
                {
                  $project: {
                    _id: 1,
                    like: 1,
                    dislike: 1,
                    shareCount: 1,
                    title: 1,
                    videoType: 1,
                    videoTime: 1,
                    videoUrl: 1,
                    videoImage: 1,
                    description: 1,
                    hashTag: 1,
                    userId: 1, //videoUserId
                    channelId: 1, //videoChannelId
                    commentType: 1,
                    videoPrivacyType: 1,
                    createdAt: 1,
                    channelName: "$channel.fullName",
                    channelImage: "$channel.image",
                    channelType: "$channel.channelType",
                    subscriptionCost: "$channel.subscriptionCost",
                    // Free videos have no price, whatever the channel charges for its paid ones
                    // (issue: free uploads were listed as "Premium Exclusive").
                    videoUnlockCost: { $cond: [{ $eq: ["$storedPrivacyType", 2] }, "$channel.videoUnlockCost", 0] },
                    isPaidVideo: { $eq: ["$storedPrivacyType", 2] },
                    totalComments: { $size: "$totalComments" },
                    isSubscribed: 1,
                    isSaveToWatchLater: 1,
                    isLike: {
                      $eq: [{ $ifNull: ["$likeHistory.likeOrDislike", null] }, "like"],
                    },
                    isDislike: {
                      $eq: [{ $ifNull: ["$likeHistory.likeOrDislike", null] }, "dislike"],
                    },
                    views: { $size: "$views" },
                  },
                },
              ],
              totalCount: [{ $count: "count" }],
            },
          },
          {
            $project: {
              data: 1,
              total: { $ifNull: [{ $arrayElemAt: ["$totalCount.count", 0] }, 0] },
            },
          },
        ]),
      ]);

      return res.status(200).json({
        status: true,
        message: "Retrive videos for the user!",
        seed,
        totalVideos: videos[0]?.total || 0,
        totalShorts: shorts[0]?.total || 0,
        data: {
          videos: videos[0]?.data || [],
          shorts: shorts[0]?.data || [],
        },
      });
    } else if (type === "popular") {
      const [videos, shorts] = await Promise.all([
        Video.aggregate([
          {
            $match: {
              isActive: true,
              scheduleType: 2,
              visibilityType: 1,
              moderationStatus: { $nin: ["pending_review", "rejected"] },
              isCopyrightFlagged: { $ne: true },
              videoType: 1,
            },
          },
          {
            $facet: {
              data: [
                {
                  $lookup: {
                    from: "watchhistories",
                    localField: "_id",
                    foreignField: "videoId",
                    as: "views",
                  },
                },
                { $sort: { views: -1 } },
                { $skip: (start - 1) * limit },
                { $limit: limit },
                {
                  $lookup: {
                    from: "users",
                    localField: "channelId",
                    foreignField: "channelId",
                    as: "channel",
                  },
                },
                {
                  $unwind: {
                    path: "$channel",
                    preserveNullAndEmptyArrays: true,
                  },
                },

                ...(userId
                  ? [
                      {
                        $lookup: {
                          from: "userwisesubscriptions",
                          localField: "channelId",
                          foreignField: "channelId",
                          pipeline: [{ $match: { userId: userId } }, { $limit: 1 }],
                          as: "subscription",
                        },
                      },
                    ]
                  : []),

                ...(userId
                  ? [
                      {
                        $lookup: {
                          from: "savetowatchlaters",
                          localField: "_id",
                          foreignField: "videoId",
                          pipeline: [{ $match: { userId: userId } }, { $limit: 1 }],
                          as: "isSaveToWatchLater",
                        },
                      },
                    ]
                  : []),

                ...(userId
                  ? [
                      {
                        $lookup: {
                          from: "videounlocks",
                          localField: "_id",
                          foreignField: "videoId",
                          pipeline: [{ $match: { userId: userId } }, { $limit: 1 }],
                          as: "unlockData",
                        },
                      },
                    ]
                  : []),
                {
                  $addFields: {
                    isSaveToWatchLater: { $gt: [{ $size: { $ifNull: ["$isSaveToWatchLater", []] } }, 0] },
                    isSubscribed: { $gt: [{ $size: { $ifNull: ["$subscription", []] } }, 0] },
                    isUnlocked: { $gt: [{ $size: { $ifNull: ["$unlockData", []] } }, 0] },
                    storedPrivacyType: "$videoPrivacyType", // before the per-viewer recompute below
                  },
                },
                {
                  $addFields: {
                    videoPrivacyType: {
                      $cond: {
                        if: {
                          $or: [
                            { $eq: ["$videoPrivacyType", 1] }, // free video
                            "$isUnlocked", // individually unlocked
                            {
                              $and: [
                                { $eq: ["$channel.channelType", 2] }, // paid channel
                                "$isSubscribed",
                              ],
                            },
                          ],
                        },
                        then: 1,
                        else: 2,
                      },
                    },
                  },
                },
                {
                  $project: {
                    _id: 1,
                    title: 1,
                    videoType: 1,
                    videoTime: 1,
                    videoUrl: 1,
                    videoImage: 1,
                    scheduleType: 1,
                    scheduleTime: 1,
                    userId: 1, //videoUserId
                    channelId: 1, //videoChannelId
                    videoPrivacyType: 1,
                    views: { $size: "$views" },
                    channelType: "$channel.channelType",
                    subscriptionCost: "$channel.subscriptionCost",
                    // Free videos have no price, whatever the channel charges for its paid ones
                    // (issue: free uploads were listed as "Premium Exclusive").
                    videoUnlockCost: { $cond: [{ $eq: ["$storedPrivacyType", 2] }, "$channel.videoUnlockCost", 0] },
                    isPaidVideo: { $eq: ["$storedPrivacyType", 2] },
                    channelName: "$channel.fullName",
                    channelImage: "$channel.image",
                    isSubscribed: 1,
                    isSaveToWatchLater: 1,
                    time: {
                      $let: {
                        vars: {
                          timeDiff: { $subtract: [now.toDate(), "$createdAt"] },
                        },
                        in: {
                          $concat: [
                            {
                              $switch: {
                                branches: [
                                  {
                                    case: { $gte: ["$$timeDiff", 31536000000] },
                                    then: { $concat: [{ $toString: { $floor: { $divide: ["$$timeDiff", 31536000000] } } }, " years ago"] },
                                  },
                                  {
                                    case: { $gte: ["$$timeDiff", 2592000000] },
                                    then: { $concat: [{ $toString: { $floor: { $divide: ["$$timeDiff", 2592000000] } } }, " months ago"] },
                                  },
                                  {
                                    case: { $gte: ["$$timeDiff", 604800000] },
                                    then: { $concat: [{ $toString: { $floor: { $divide: ["$$timeDiff", 604800000] } } }, " weeks ago"] },
                                  },
                                  {
                                    case: { $gte: ["$$timeDiff", 86400000] },
                                    then: { $concat: [{ $toString: { $floor: { $divide: ["$$timeDiff", 86400000] } } }, " days ago"] },
                                  },
                                  {
                                    case: { $gte: ["$$timeDiff", 3600000] },
                                    then: { $concat: [{ $toString: { $floor: { $divide: ["$$timeDiff", 3600000] } } }, " hours ago"] },
                                  },
                                  {
                                    case: { $gte: ["$$timeDiff", 60000] },
                                    then: { $concat: [{ $toString: { $floor: { $divide: ["$$timeDiff", 60000] } } }, " minutes ago"] },
                                  },
                                  {
                                    case: { $gte: ["$$timeDiff", 1000] },
                                    then: { $concat: [{ $toString: { $floor: { $divide: ["$$timeDiff", 1000] } } }, " seconds ago"] },
                                  },
                                  { case: true, then: "Just now" },
                                ],
                              },
                            },
                          ],
                        },
                      },
                    },
                  },
                },
              ],
              totalCount: [{ $count: "count" }],
            },
          },
          {
            $project: {
              data: 1,
              total: { $ifNull: [{ $arrayElemAt: ["$totalCount.count", 0] }, 0] },
            },
          },
        ]),
        Video.aggregate([
          {
            $match: {
              isActive: true,
              scheduleType: 2,
              visibilityType: 1,
              moderationStatus: { $nin: ["pending_review", "rejected"] },
              isCopyrightFlagged: { $ne: true },
              videoType: 2,
            },
          },
          {
            $facet: {
              data: [
                {
                  $lookup: {
                    from: "watchhistories",
                    localField: "_id",
                    foreignField: "videoId",
                    as: "views",
                  },
                },
                { $sort: { views: -1 } },
                { $skip: (start - 1) * limit },
                { $limit: limit },

                {
                  $lookup: {
                    from: "users",
                    localField: "channelId",
                    foreignField: "channelId",
                    as: "channel",
                  },
                },
                {
                  $unwind: {
                    path: "$channel",
                    preserveNullAndEmptyArrays: true,
                  },
                },

                ...(userId
                  ? [
                      {
                        $lookup: {
                          from: "userwisesubscriptions",
                          localField: "channelId",
                          foreignField: "channelId",
                          pipeline: [{ $match: { userId: userId } }, { $limit: 1 }],
                          as: "subscription",
                        },
                      },
                    ]
                  : []),
                {
                  $lookup: {
                    from: "videocomments",
                    localField: "_id",
                    foreignField: "videoId",
                    pipeline: [{ $match: { recursiveCommentId: null, status: { $ne: "held" } } }], // held-for-review comments are not public
                    as: "totalComments",
                  },
                },

                ...(userId
                  ? [
                      {
                        $lookup: {
                          from: "likehistoryofvideos",
                          localField: "_id",
                          foreignField: "videoId",
                          pipeline: [{ $match: { userId: userId } }, { $limit: 1 }],
                          as: "likeHistory",
                        },
                      },

                      {
                        $unwind: { path: "$likeHistory", preserveNullAndEmptyArrays: true },
                      },
                    ]
                  : []),

                ...(userId
                  ? [
                      {
                        $lookup: {
                          from: "savetowatchlaters",
                          localField: "_id",
                          foreignField: "videoId",
                          pipeline: [{ $match: { userId: userId } }, { $limit: 1 }],
                          as: "isSaveToWatchLater",
                        },
                      },
                    ]
                  : []),

                ...(userId
                  ? [
                      {
                        $lookup: {
                          from: "videounlocks",
                          localField: "_id",
                          foreignField: "videoId",
                          pipeline: [{ $match: { userId: userId } }, { $limit: 1 }],
                          as: "unlockData",
                        },
                      },
                    ]
                  : []),
                {
                  $addFields: {
                    isSaveToWatchLater: { $gt: [{ $size: { $ifNull: ["$isSaveToWatchLater", []] } }, 0] },
                    isSubscribed: { $gt: [{ $size: { $ifNull: ["$subscription", []] } }, 0] },
                    isUnlocked: { $gt: [{ $size: { $ifNull: ["$unlockData", []] } }, 0] },
                    storedPrivacyType: "$videoPrivacyType", // before the per-viewer recompute below
                  },
                },
                {
                  $addFields: {
                    videoPrivacyType: {
                      $cond: {
                        if: {
                          $or: [
                            { $eq: ["$videoPrivacyType", 1] }, // free video
                            "$isUnlocked", // individually unlocked
                            {
                              $and: [
                                { $eq: ["$channel.channelType", 2] }, // paid channel
                                "$isSubscribed",
                              ],
                            },
                          ],
                        },
                        then: 1,
                        else: 2,
                      },
                    },
                  },
                },
                {
                  $project: {
                    like: 1,
                    dislike: 1,
                    shareCount: 1,
                    title: 1,
                    videoType: 1,
                    videoTime: 1,
                    videoUrl: 1,
                    videoImage: 1,
                    description: 1,
                    hashTag: 1,
                    userId: 1,
                    channelId: 1,
                    commentType: 1,
                    videoPrivacyType: 1,
                    createdAt: 1,
                    channelName: "$channel.fullName",
                    channelImage: "$channel.image",
                    channelType: "$channel.channelType",
                    subscriptionCost: "$channel.subscriptionCost",
                    // Free videos have no price, whatever the channel charges for its paid ones
                    // (issue: free uploads were listed as "Premium Exclusive").
                    videoUnlockCost: { $cond: [{ $eq: ["$storedPrivacyType", 2] }, "$channel.videoUnlockCost", 0] },
                    isPaidVideo: { $eq: ["$storedPrivacyType", 2] },
                    totalComments: { $size: "$totalComments" },
                    isSubscribed: 1,
                    isSaveToWatchLater: 1,
                    isLike: {
                      $eq: [{ $ifNull: ["$likeHistory.likeOrDislike", null] }, "like"],
                    },
                    isDislike: {
                      $eq: [{ $ifNull: ["$likeHistory.likeOrDislike", null] }, "dislike"],
                    },
                    views: { $size: "$views" },
                  },
                },
              ],
              totalCount: [{ $count: "count" }],
            },
          },
          {
            $project: {
              data: 1,
              total: { $ifNull: [{ $arrayElemAt: ["$totalCount.count", 0] }, 0] },
            },
          },
        ]),
      ]);

      return res.status(200).json({
        status: true,
        message: "Retrieve popular videos successfully!",
        totalVideos: videos[0]?.total || 0,
        totalShorts: shorts[0]?.total || 0,
        data: {
          videos: videos[0]?.data || [],
          shorts: shorts[0]?.data || [],
        },
      });
    } else if (type === "new") {
      const [videos, shorts] = await Promise.all([
        Video.aggregate([
          {
            $match: {
              isActive: true,
              scheduleType: 2,
              visibilityType: 1,
              moderationStatus: { $nin: ["pending_review", "rejected"] },
              isCopyrightFlagged: { $ne: true },
              videoType: 1,
            },
          },
          {
            $facet: {
              data: [
                { $sort: { createdAt: -1 } },
                { $skip: (start - 1) * limit },
                { $limit: limit },
                {
                  $lookup: {
                    from: "users",
                    localField: "channelId",
                    foreignField: "channelId",
                    as: "channel",
                  },
                },
                {
                  $unwind: {
                    path: "$channel",
                    preserveNullAndEmptyArrays: true,
                  },
                },

                ...(userId
                  ? [
                      {
                        $lookup: {
                          from: "userwisesubscriptions",
                          localField: "channelId",
                          foreignField: "channelId",
                          pipeline: [{ $match: { userId: userId } }, { $limit: 1 }],
                          as: "subscription",
                        },
                      },
                    ]
                  : []),
                {
                  $lookup: {
                    from: "watchhistories",
                    localField: "_id",
                    foreignField: "videoId",
                    as: "views",
                  },
                },

                ...(userId
                  ? [
                      {
                        $lookup: {
                          from: "savetowatchlaters",
                          localField: "_id",
                          foreignField: "videoId",
                          pipeline: [{ $match: { userId: userId } }, { $limit: 1 }],
                          as: "isSaveToWatchLater",
                        },
                      },
                    ]
                  : []),

                ...(userId
                  ? [
                      {
                        $lookup: {
                          from: "videounlocks",
                          localField: "_id",
                          foreignField: "videoId",
                          pipeline: [{ $match: { userId: userId } }, { $limit: 1 }],
                          as: "unlockData",
                        },
                      },
                    ]
                  : []),
                {
                  $addFields: {
                    isSaveToWatchLater: { $gt: [{ $size: { $ifNull: ["$isSaveToWatchLater", []] } }, 0] },
                    isSubscribed: { $gt: [{ $size: { $ifNull: ["$subscription", []] } }, 0] },
                    isUnlocked: { $gt: [{ $size: { $ifNull: ["$unlockData", []] } }, 0] },
                    storedPrivacyType: "$videoPrivacyType", // before the per-viewer recompute below
                  },
                },
                {
                  $addFields: {
                    videoPrivacyType: {
                      $cond: {
                        if: {
                          $or: [
                            { $eq: ["$videoPrivacyType", 1] }, // free video
                            "$isUnlocked", // individually unlocked
                            {
                              $and: [
                                { $eq: ["$channel.channelType", 2] }, // paid channel
                                "$isSubscribed",
                              ],
                            },
                          ],
                        },
                        then: 1,
                        else: 2,
                      },
                    },
                  },
                },
                {
                  $project: {
                    _id: 1,
                    title: 1,
                    videoType: 1,
                    videoTime: 1,
                    videoUrl: 1,
                    videoImage: 1,
                    scheduleType: 1,
                    scheduleTime: 1,
                    videoPrivacyType: 1,
                    userId: 1, //videoUserId
                    channelId: 1, //videoChannelId
                    createdAt: 1,
                    views: { $size: "$views" },
                    channelType: "$channel.channelType",
                    subscriptionCost: "$channel.subscriptionCost",
                    // Free videos have no price, whatever the channel charges for its paid ones
                    // (issue: free uploads were listed as "Premium Exclusive").
                    videoUnlockCost: { $cond: [{ $eq: ["$storedPrivacyType", 2] }, "$channel.videoUnlockCost", 0] },
                    isPaidVideo: { $eq: ["$storedPrivacyType", 2] },
                    channelName: "$channel.fullName",
                    channelImage: "$channel.image",
                    isSubscribed: 1,
                    isSaveToWatchLater: 1,
                    time: {
                      $let: {
                        vars: {
                          timeDiff: { $subtract: [now.toDate(), "$createdAt"] },
                        },
                        in: {
                          $concat: [
                            {
                              $switch: {
                                branches: [
                                  {
                                    case: { $gte: ["$$timeDiff", 31536000000] },
                                    then: { $concat: [{ $toString: { $floor: { $divide: ["$$timeDiff", 31536000000] } } }, " years ago"] },
                                  },
                                  {
                                    case: { $gte: ["$$timeDiff", 2592000000] },
                                    then: { $concat: [{ $toString: { $floor: { $divide: ["$$timeDiff", 2592000000] } } }, " months ago"] },
                                  },
                                  {
                                    case: { $gte: ["$$timeDiff", 604800000] },
                                    then: { $concat: [{ $toString: { $floor: { $divide: ["$$timeDiff", 604800000] } } }, " weeks ago"] },
                                  },
                                  {
                                    case: { $gte: ["$$timeDiff", 86400000] },
                                    then: { $concat: [{ $toString: { $floor: { $divide: ["$$timeDiff", 86400000] } } }, " days ago"] },
                                  },
                                  {
                                    case: { $gte: ["$$timeDiff", 3600000] },
                                    then: { $concat: [{ $toString: { $floor: { $divide: ["$$timeDiff", 3600000] } } }, " hours ago"] },
                                  },
                                  {
                                    case: { $gte: ["$$timeDiff", 60000] },
                                    then: { $concat: [{ $toString: { $floor: { $divide: ["$$timeDiff", 60000] } } }, " minutes ago"] },
                                  },
                                  {
                                    case: { $gte: ["$$timeDiff", 1000] },
                                    then: { $concat: [{ $toString: { $floor: { $divide: ["$$timeDiff", 1000] } } }, " seconds ago"] },
                                  },
                                  { case: true, then: "Just now" },
                                ],
                              },
                            },
                          ],
                        },
                      },
                    },
                  },
                },
              ],
              totalCount: [{ $count: "count" }],
            },
          },
          {
            $project: {
              data: 1,
              total: { $ifNull: [{ $arrayElemAt: ["$totalCount.count", 0] }, 0] },
            },
          },
        ]),
        Video.aggregate([
          {
            $match: {
              isActive: true,
              scheduleType: 2,
              visibilityType: 1,
              moderationStatus: { $nin: ["pending_review", "rejected"] },
              isCopyrightFlagged: { $ne: true },
              videoType: 2,
            },
          },
          {
            $facet: {
              data: [
                { $sort: { createdAt: -1 } },
                { $skip: (start - 1) * limit },
                { $limit: limit },
                {
                  $lookup: {
                    from: "users",
                    localField: "channelId",
                    foreignField: "channelId",
                    as: "channel",
                  },
                },
                {
                  $unwind: {
                    path: "$channel",
                    preserveNullAndEmptyArrays: true,
                  },
                },
                ...(userId
                  ? [
                      {
                        $lookup: {
                          from: "userwisesubscriptions",
                          localField: "channelId",
                          foreignField: "channelId",
                          pipeline: [{ $match: { userId: userId } }, { $limit: 1 }],
                          as: "subscription",
                        },
                      },
                    ]
                  : []),

                {
                  $lookup: {
                    from: "videocomments",
                    localField: "_id",
                    foreignField: "videoId",
                    pipeline: [{ $match: { recursiveCommentId: null, status: { $ne: "held" } } }], // held-for-review comments are not public
                    as: "totalComments",
                  },
                },
                ...(userId
                  ? [
                      {
                        $lookup: {
                          from: "likehistoryofvideos",
                          localField: "_id",
                          foreignField: "videoId",
                          pipeline: [{ $match: { userId: userId } }, { $limit: 1 }],
                          as: "likeHistory",
                        },
                      },

                      {
                        $unwind: { path: "$likeHistory", preserveNullAndEmptyArrays: true },
                      },
                    ]
                  : []),

                {
                  $lookup: {
                    from: "watchhistories",
                    localField: "_id",
                    foreignField: "videoId",
                    as: "views",
                  },
                },
                ...(userId
                  ? [
                      {
                        $lookup: {
                          from: "savetowatchlaters",
                          localField: "_id",
                          foreignField: "videoId",
                          pipeline: [{ $match: { userId: userId } }, { $limit: 1 }],
                          as: "isSaveToWatchLater",
                        },
                      },
                    ]
                  : []),

                ...(userId
                  ? [
                      {
                        $lookup: {
                          from: "videounlocks",
                          localField: "_id",
                          foreignField: "videoId",
                          pipeline: [{ $match: { userId: userId } }, { $limit: 1 }],
                          as: "unlockData",
                        },
                      },
                    ]
                  : []),
                {
                  $addFields: {
                    isSaveToWatchLater: { $gt: [{ $size: { $ifNull: ["$isSaveToWatchLater", []] } }, 0] },
                    isSubscribed: { $gt: [{ $size: { $ifNull: ["$subscription", []] } }, 0] },
                    isUnlocked: { $gt: [{ $size: { $ifNull: ["$unlockData", []] } }, 0] },
                    storedPrivacyType: "$videoPrivacyType", // before the per-viewer recompute below
                  },
                },
                {
                  $addFields: {
                    videoPrivacyType: {
                      $cond: {
                        if: {
                          $or: [
                            { $eq: ["$videoPrivacyType", 1] }, // free video
                            "$isUnlocked", // individually unlocked
                            {
                              $and: [
                                { $eq: ["$channel.channelType", 2] }, // paid channel
                                "$isSubscribed",
                              ],
                            },
                          ],
                        },
                        then: 1,
                        else: 2,
                      },
                    },
                  },
                },
                {
                  $project: {
                    like: 1,
                    dislike: 1,
                    shareCount: 1,
                    title: 1,
                    videoType: 1,
                    videoTime: 1,
                    videoUrl: 1,
                    videoImage: 1,
                    description: 1,
                    hashTag: 1,
                    userId: 1,
                    channelId: 1,
                    commentType: 1,
                    videoPrivacyType: 1,
                    createdAt: 1,
                    channelType: "$channel.channelType",
                    subscriptionCost: "$channel.subscriptionCost",
                    // Free videos have no price, whatever the channel charges for its paid ones
                    // (issue: free uploads were listed as "Premium Exclusive").
                    videoUnlockCost: { $cond: [{ $eq: ["$storedPrivacyType", 2] }, "$channel.videoUnlockCost", 0] },
                    isPaidVideo: { $eq: ["$storedPrivacyType", 2] },
                    channelName: "$channel.fullName",
                    channelImage: "$channel.image",
                    totalComments: 1,
                    isSubscribed: 1,
                    isSaveToWatchLater: 1,
                    isLike: {
                      $eq: [{ $ifNull: ["$likeHistory.likeOrDislike", null] }, "like"],
                    },
                    isDislike: {
                      $eq: [{ $ifNull: ["$likeHistory.likeOrDislike", null] }, "dislike"],
                    },
                    views: { $size: "$views" },
                  },
                },
              ],
              totalCount: [{ $count: "count" }],
            },
          },
          {
            $project: {
              data: 1,
              total: { $ifNull: [{ $arrayElemAt: ["$totalCount.count", 0] }, 0] },
            },
          },
        ]),
      ]);

      return res.status(200).json({
        status: true,
        message: "Retrieve latest videos successfully!",
        totalVideos: videos[0]?.total || 0,
        totalShorts: shorts[0]?.total || 0,
        data: {
          videos: videos[0]?.data || [],
          shorts: shorts[0]?.data || [],
        },
      });
    } else if (type === "publiclive") {
      const matchUser = {
        isBlock: false,
        isLive: true,
      };

      if (userId) {
        matchUser._id = { $ne: new mongoose.Types.ObjectId(userId) };
      }

      const publicLive = await User.aggregate([
        { $match: matchUser },
        {
          $lookup: {
            from: "liveusers",
            localField: "_id",
            foreignField: "userId",
            as: "liveUser",
          },
        },
        { $unwind: "$liveUser" },
        { $match: { "liveUser.liveType": 1 } },
        {
          $project: {
            _id: 1,
            fullName: 1,
            nickName: 1,
            image: 1,
            channelId: 1,
            thumbnail: "$liveUser.thumbnail",
            title: "$liveUser.title",
            liveHistoryId: "$liveUser.liveHistoryId",
            view: "$liveUser.view",
          },
        },
        {
          $facet: {
            data: [{ $skip: (start - 1) * limit }, { $limit: limit }],
            total: [{ $count: "count" }],
          },
        },
      ]);

      const data = publicLive[0]?.data || [];
      const total = publicLive[0]?.total[0]?.count || 0;

      return res.status(200).json({
        status: true,
        message: "Retrieve public live users successfully!",
        total,
        data,
      });
    } else {
      return res.status(200).json({ status: false, message: "Invalid type value." });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

//get particular nornmal ( videos or shorts )'s details for user
exports.detailsOfVideo = async (req, res) => {
  try {
    if (!req.query.userId || !req.query.videoId || !req.query.videoType)
      return res.status(200).json({
        status: false,
        message: "Oops ! Invalid details.",
      });

    let now = dayjs();

    const userId = new mongoose.Types.ObjectId(req.query.userId);
    const videoId = new mongoose.Types.ObjectId(req.query.videoId);
    const videoType = Number(req.query.videoType);

    const [user, video, data] = await Promise.all([
      User.findOne({ _id: userId, isActive: true }),
      // F-12 (Phase 2): load the active video; whether this viewer may open it
      // (public/unlisted + published + not held/flagged, or their own) is
      // decided by visibility.canView() below.
      Video.findOne({ _id: videoId, videoType: videoType, isActive: true }),
      Video.aggregate([
        {
          $match: {
            _id: videoId,
            videoType: videoType,
            isActive: true,
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "channelId",
            foreignField: "channelId",
            as: "channel",
          },
        },
        {
          $unwind: "$channel",
        },
        {
          $lookup: {
            from: "videocomments",
            localField: "_id",
            foreignField: "videoId",
            pipeline: [{ $match: { recursiveCommentId: null, status: { $ne: "held" } } }], // held-for-review comments are not public
            as: "totalComments",
          },
        },
        {
          $lookup: {
            from: "userwisesubscriptions",
            localField: "channelId",
            foreignField: "channelId",
            as: "totalSubscribers",
          },
        },
        {
          $lookup: {
            from: "watchhistories",
            localField: "_id",
            foreignField: "videoId",
            as: "views",
          },
        },
        {
          $lookup: {
            from: "userwisesubscriptions",
            localField: "channelId",
            foreignField: "channelId",
            pipeline: [{ $match: { userId: userId } }, { $limit: 1 }],
            as: "subscription",
          },
        },
        {
          $lookup: {
            from: "likehistoryofvideos",
            localField: "_id",
            foreignField: "videoId",
            pipeline: [{ $match: { userId: userId } }, { $limit: 1 }],
            as: "likeHistory",
          },
        },
        {
          $unwind: {
            path: "$likeHistory",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "savetowatchlaters",
            localField: "_id",
            foreignField: "videoId",
            pipeline: [{ $match: { userId: userId } }, { $limit: 1 }],
            as: "isSaveToWatchLater",
          },
        },
        {
          $lookup: {
            from: "videounlocks",
            localField: "_id",
            foreignField: "videoId",
            pipeline: [{ $match: { userId: userId } }, { $limit: 1 }],
            as: "unlockData",
          },
        },
        {
          $addFields: {
            isSaveToWatchLater: { $gt: [{ $size: { $ifNull: ["$isSaveToWatchLater", []] } }, 0] },
            isSubscribed: { $gt: [{ $size: { $ifNull: ["$subscription", []] } }, 0] },
            isUnlocked: { $gt: [{ $size: { $ifNull: ["$unlockData", []] } }, 0] },
            storedPrivacyType: "$videoPrivacyType", // before the per-viewer recompute below
          },
        },
        {
          $addFields: {
            videoPrivacyType: {
              $cond: {
                if: {
                  $or: [
                    { $eq: ["$videoPrivacyType", 1] }, // free video
                    "$isUnlocked", // individually unlocked
                    {
                      $and: [
                        { $eq: ["$channel.channelType", 2] }, // paid channel
                        "$isSubscribed",
                      ],
                    },
                  ],
                },
                then: 1,
                else: 2,
              },
            },
          },
        },
        {
          $project: {
            shareCount: 1,
            userId: 1,
            title: 1,
            videoType: 1,
            videoTime: 1,
            videoUrl: 1,
            videoImage: 1,
            description: 1,
            hashTag: 1,
            like: 1,
            dislike: 1,
            videoPrivacyType: 1,
            channelId: 1,
            commentType: 1,
            createdAt: 1,
            channelType: "$channel.channelType",
            subscriptionCost: "$channel.subscriptionCost",
            // Free videos have no price, whatever the channel charges for its paid ones
            // (issue: free uploads were listed as "Premium Exclusive").
            videoUnlockCost: { $cond: [{ $eq: ["$storedPrivacyType", 2] }, "$channel.videoUnlockCost", 0] },
            isPaidVideo: { $eq: ["$storedPrivacyType", 2] },
            channelName: "$channel.fullName",
            channelImage: "$channel.image",
            totalComments: { $size: "$totalComments" },
            totalSubscribers: { $size: "$totalSubscribers" },
            views: { $size: "$views" },
            isSubscribed: 1,
            isSaveToWatchLater: 1,
            isLike: {
              $cond: [{ $eq: ["$likeHistory.likeOrDislike", "like"] }, true, false],
            },
            isDislike: {
              $cond: [{ $eq: ["$likeHistory.likeOrDislike", "dislike"] }, true, false],
            },
            time: {
              $let: {
                vars: {
                  timeDiff: { $subtract: [now.toDate(), "$createdAt"] },
                },
                in: {
                  $concat: [
                    {
                      $switch: {
                        branches: [
                          {
                            case: { $gte: ["$$timeDiff", 31536000000] },
                            then: { $concat: [{ $toString: { $floor: { $divide: ["$$timeDiff", 31536000000] } } }, " years ago"] },
                          },
                          {
                            case: { $gte: ["$$timeDiff", 2592000000] },
                            then: { $concat: [{ $toString: { $floor: { $divide: ["$$timeDiff", 2592000000] } } }, " months ago"] },
                          },
                          {
                            case: { $gte: ["$$timeDiff", 604800000] },
                            then: { $concat: [{ $toString: { $floor: { $divide: ["$$timeDiff", 604800000] } } }, " weeks ago"] },
                          },
                          {
                            case: { $gte: ["$$timeDiff", 86400000] },
                            then: { $concat: [{ $toString: { $floor: { $divide: ["$$timeDiff", 86400000] } } }, " days ago"] },
                          },
                          {
                            case: { $gte: ["$$timeDiff", 3600000] },
                            then: { $concat: [{ $toString: { $floor: { $divide: ["$$timeDiff", 3600000] } } }, " hours ago"] },
                          },
                          {
                            case: { $gte: ["$$timeDiff", 60000] },
                            then: { $concat: [{ $toString: { $floor: { $divide: ["$$timeDiff", 60000] } } }, " minutes ago"] },
                          },
                          {
                            case: { $gte: ["$$timeDiff", 1000] },
                            then: { $concat: [{ $toString: { $floor: { $divide: ["$$timeDiff", 1000] } } }, " seconds ago"] },
                          },
                          { case: true, then: "Just now" },
                        ],
                      },
                    },
                  ],
                },
              },
            },
          },
        },
      ]),
    ]);

    if (!user) {
      return res.status(200).json({ status: false, message: "user does not found." });
    }

    if (user.isBlock) {
      return res.status(200).json({ status: false, message: "you are blocked by admin." });
    }

    // One policy for opening a video by id (util/videoVisibility.js): public or
    // unlisted, published, not held/rejected/flagged — or the viewer's own.
    // Answers "not found" either way so private ids aren't confirmed.
    if (!video || !data[0] || !visibility.canView(video, req.query.userId)) {
      return res.status(200).json({ status: false, message: "video does not found." });
    }

    return res.status(200).json({
      status: true,
      message: "Retrive particular video's details for user.",
      detailsOfVideo: visibility.stripInternal(data[0]),
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

//create like or dislike for video (normal video or short)
exports.likeOrDislikeOfVideo = async (req, res) => {
  try {
    console.log("🔔 likeOrDislikeOfVideo API called");
    console.log("➡️ Request Query:", req.query);

    const { userId, videoId, likeOrDislike } = req.query;

    if (!userId || !videoId || !likeOrDislike) {
      console.log("❌ Missing required params");
      return res.status(200).json({ status: false, message: "Oops ! Invalid details!" });
    }

    const validTypes = ["like", "dislike", "likeremove", "dislikeremove"];
    if (!validTypes.includes(likeOrDislike)) {
      console.log("❌ Invalid likeOrDislike type:", likeOrDislike);
      return res.status(200).json({ status: false, message: "Oops ! Invalid details!" });
    }

    console.log("🔍 Fetching user, video & history");

    const [user, target] = await Promise.all([User.findOne({ _id: userId, isActive: true }), Video.findById(videoId)]);
    if (!user) return res.status(200).json({ status: false, message: "user does not found!" });
    if (user.isBlock) return res.status(200).json({ status: false, message: "you are blocked by admin!" });
    if (!target || !visibility.canView(target, userId)) return res.status(200).json({ status: false, message: "video does not found!" });

    // One transaction moves the viewer's record and the video's counters
    // together (engagement.service): no lost updates between users, no
    // duplicate records from a double tap, and a repeated request is a no-op.
    const t = await engagement.setLikeState({ userId, videoId, action: likeOrDislike });
    if (!t.ok) return res.status(200).json({ status: false, message: "video does not found!" });
    const { before, after, like, dislike } = t;

    // Rewards follow the transition (server-decided, once per video, capped).
    if (before === "like" && after !== "like") {
      const rev = await rewardEngine.reverseReward({ userId, videoId, historyType: rewardEngine.HISTORY_TYPE.VIDEO_LIKE, countField: "dailyLikesToday" });
      if (rev.reversed) console.log("💰 Like coins reversed:", rev.reversed);
    }
    if (before === "dislike" && after !== "dislike") {
      const rev = await rewardEngine.reverseReward({ userId, videoId, historyType: rewardEngine.HISTORY_TYPE.VIDEO_DISLIKE, countField: "dailyDislikesToday" });
      if (rev.reversed) console.log("💰 Dislike coins reversed:", rev.reversed);
    }
    let coinsEarned = 0, rewardStatus;
    if (after === "like" && before !== "like") {
      const r = await rewardEngine.creditReward({ userId, kind: "like", historyType: rewardEngine.HISTORY_TYPE.VIDEO_LIKE, countField: "dailyLikesToday", capField: "maxLikesPerDay", dedupeVideoId: videoId, meta: { videoId } });
      coinsEarned = r.ok ? r.credited : 0; rewardStatus = r.reason;
      if (user.fcmToken && coinsEarned > 0) {
        try {
          admin.messaging().send({ token: user.fcmToken, notification: { title: "👍 You've Earned Coins!", body: `You earned ${coinsEarned} coins for liking a video 🎬💰` }, data: { type: "ENGAGEMENT_LIKING_REWARD" } }).catch(() => {});
        } catch (e) {}
      }
      try {
        const videoUser = t.ownerId && t.ownerId !== String(userId) ? await User.findById(t.ownerId) : null;
        if (videoUser?.fcmToken) {
          admin.messaging().send({ token: videoUser.fcmToken, notification: { title: "🌟 New Like!", body: "Someone liked your video 👍🎥" }, data: { type: "VIDEO_LIKING_NOTIFICATION" } }).catch(() => {});
        }
      } catch (e) {}
    }
    if (after === "dislike" && before !== "dislike") {
      // Dislike reward (YP-TC-2026-FINAL: 2 coins; set dislikeVideoRewardCoins=0 in settings to disable)
      const r = await rewardEngine.creditReward({ userId, kind: "dislike", historyType: rewardEngine.HISTORY_TYPE.VIDEO_DISLIKE, countField: "dailyDislikesToday", capField: "maxDislikesPerDay", dedupeVideoId: videoId, meta: { videoId } });
      coinsEarned = r.ok ? r.credited : 0; rewardStatus = r.reason;
    }

    const messages = { like: "Video liked successfully", dislike: "Video disliked successfully", likeremove: "Like removed successfully", dislikeremove: "Dislike removed successfully" };
    return res.status(200).json({
      status: true,
      message: before === after && (likeOrDislike === "like" || likeOrDislike === "dislike") ? `Already ${likeOrDislike}d` : messages[likeOrDislike],
      isLike: after === "like",
      isDislike: after === "dislike",
      like,
      dislike,
      changed: before !== after,
      coinsEarned,
      rewardStatus,
    });
  } catch (error) {
    console.error("API ERROR:", error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

//get all more like this (normal videos or shorts)
exports.getAllLikeThis = async (req, res) => {
  try {
    if (!req.query.videoId || !req.query.userId) {
      return res.status(200).json({ status: false, message: "videoId and userId must be required." });
    }

    const { videoId, start = 1, limit = 10 } = req.query || {};
    const userId = new mongoose.Types.ObjectId(req.query.userId);
    const skip = (start - 1) * limit;

    const [user, currentVideo] = await Promise.all([User.findOne({ _id: userId, isActive: true }), Video.findById(videoId).select("_id hashTag videoType")]);

    if (!user) {
      return res.status(200).json({ status: false, message: "user does not found." });
    }

    if (user.isBlock) {
      return res.status(200).json({ status: false, message: "you are blocked by admin." });
    }

    if (!currentVideo) {
      return res.status(200).json({ status: false, message: "Video not found" });
    }

    const hashTags = currentVideo.hashTag || [];

    const data = await Video.aggregate([
      {
        $match: {
          _id: { $ne: currentVideo._id },
          videoType: { $eq: currentVideo.videoType },
          ...visibility.publicListingMatch(),
          hashTag: { $in: hashTags },
        },
      },
      {
        $facet: {
          paginatedData: [
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: Number(limit) },
            {
              $lookup: {
                from: "users",
                localField: "userId",
                foreignField: "_id",
                pipeline: [
                  {
                    $project: {
                      fullName: 1,
                      image: 1,
                      channelId: 1,
                      subscriptionCost: 1,
                      videoUnlockCost: 1,
                      channelType: 1,
                    },
                  },
                ],
                as: "owner",
              },
            },
            {
              $unwind: {
                path: "$owner",
                preserveNullAndEmptyArrays: false,
              },
            },
            {
              $lookup: {
                from: "watchhistories",
                localField: "_id",
                foreignField: "videoId",
                as: "views",
              },
            },
            {
              $lookup: {
                from: "savetowatchlaters",
                localField: "_id",
                foreignField: "videoId",
                pipeline: [{ $match: { userId: userId } }, { $limit: 1 }],
                as: "isSaveToWatchLater",
              },
            },
            {
              $lookup: {
                from: "userwisesubscriptions",
                localField: "channelId",
                foreignField: "channelId",
                pipeline: [{ $match: { userId: userId } }, { $limit: 1 }],
                as: "subscription",
              },
            },
            {
              $lookup: {
                from: "videounlocks",
                localField: "_id",
                foreignField: "videoId",
                pipeline: [{ $match: { userId: userId } }, { $limit: 1 }],
                as: "unlockData",
              },
            },
            {
              $addFields: {
                isSaveToWatchLater: { $gt: [{ $size: { $ifNull: ["$isSaveToWatchLater", []] } }, 0] },
                isSubscribed: { $gt: [{ $size: { $ifNull: ["$subscription", []] } }, 0] },
                isUnlocked: { $gt: [{ $size: { $ifNull: ["$unlockData", []] } }, 0] },
                storedPrivacyType: "$videoPrivacyType", // before the per-viewer recompute below
              },
            },
            {
              $addFields: {
                totalViews: { $ifNull: [{ $arrayElemAt: ["$views.count", 0] }, 0] },
                videoPrivacyType: {
                  $cond: {
                    if: {
                      $or: [
                        { $eq: ["$videoPrivacyType", 1] }, // free video
                        "$isUnlocked", // individually unlocked
                        {
                          $and: [
                            { $eq: ["$channel.channelType", 2] }, // paid channel
                            "$isSubscribed",
                          ],
                        },
                      ],
                    },
                    then: 1,
                    else: 2,
                  },
                },
                time: {
                  $let: {
                    vars: {
                      diff: { $subtract: [new Date(), "$createdAt"] },
                    },
                    in: {
                      $switch: {
                        branches: [
                          {
                            case: { $gte: ["$$diff", 31536000000] },
                            then: {
                              $concat: [{ $toString: { $floor: { $divide: ["$$diff", 31536000000] } } }, " years ago"],
                            },
                          },
                          {
                            case: { $gte: ["$$diff", 2592000000] },
                            then: {
                              $concat: [{ $toString: { $floor: { $divide: ["$$diff", 2592000000] } } }, " months ago"],
                            },
                          },
                          {
                            case: { $gte: ["$$diff", 86400000] },
                            then: {
                              $concat: [{ $toString: { $floor: { $divide: ["$$diff", 86400000] } } }, " days ago"],
                            },
                          },
                        ],
                        default: "Just now",
                      },
                    },
                  },
                },
              },
            },
            {
              $project: {
                _id: 1,
                title: 1,
                videoImage: 1,
                videoUrl: 1,
                videoTime: 1,
                videoType: 1,
                channelId: 1,
                videoPrivacyType: 1,
                user: {
                  fullName: "$owner.fullName",
                  image: "$owner.image",
                  channelId: "$owner.channelId",
                  subscriptionCost: "$owner.subscriptionCost",
                  // Free videos have no price, whatever the channel charges for its paid ones
                  // (issue: free uploads were listed as "Premium Exclusive").
                  videoUnlockCost: { $cond: [{ $eq: ["$storedPrivacyType", 2] }, "$owner.videoUnlockCost", 0] },
                  isPaidVideo: { $eq: ["$storedPrivacyType", 2] },
                  channelType: "$owner.channelType",
                },
                totalViews: 1,
                time: 1,
                isSavedToWatchLater: 1,
                isSubscribedChannel: "$isSubscribed",
                createdAt: 1,
              },
            },
          ],
          totalCount: [{ $count: "count" }],
        },
      },
    ]);

    const videos = data[0].paginatedData;
    const total = data[0].totalCount[0]?.count || 0;

    return res.status(200).json({
      status: true,
      message: "Similar videos fetched",
      total,
      data: videos,
    });
  } catch (error) {
    console.error("getAllLikeThis error:", error);
    return res.status(500).json({ status: false, message: "Something went wrong" });
  }
};

//search (normal videos or shorts) for user
exports.search = async (req, res) => {
  try {
    if (!req.body.searchString || !req.body.userId) {
      return res.status(200).json({ status: false, message: "Oops ! Invalid details!" });
    }

    let now = dayjs();
    const userId = new mongoose.Types.ObjectId(req.body.userId);

    const [user, response] = await Promise.all([
      User.findOne({ _id: userId, isActive: true }),
      Video.aggregate([
        {
          $match: {
            isActive: true,
            scheduleType: 2,
            visibilityType: 1,
            moderationStatus: { $nin: ["pending_review", "rejected"] },
            isCopyrightFlagged: { $ne: true },
            $or: [{ title: { $regex: escapeRegex(req.body.searchString), $options: "i" } }, { description: { $regex: escapeRegex(req.body.searchString), $options: "i" } }],
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "channelId",
            foreignField: "channelId",
            as: "channel",
          },
        },
        {
          $unwind: "$channel",
        },
        {
          $lookup: {
            from: "watchhistories",
            localField: "_id",
            foreignField: "videoId",
            as: "views",
          },
        },
        {
          $lookup: {
            from: "userwisesubscriptions",
            localField: "channel.channelId",
            foreignField: "channelId",
            pipeline: [{ $match: { userId: userId } }, { $limit: 1 }],
            as: "subscription",
          },
        },
        {
          $lookup: {
            from: "savetowatchlaters",
            localField: "_id",
            foreignField: "videoId",
            pipeline: [{ $match: { userId: userId } }, { $limit: 1 }],
            as: "isSaveToWatchLater",
          },
        },
        {
          $lookup: {
            from: "videounlocks",
            localField: "_id",
            foreignField: "videoId",
            pipeline: [{ $match: { userId: userId } }, { $limit: 1 }],
            as: "unlockData",
          },
        },
        {
          $addFields: {
            isSaveToWatchLater: { $gt: [{ $size: "$isSaveToWatchLater" }, 0] },
            isSubscribed: { $gt: [{ $size: "$subscription" }, 0] },
            isUnlocked: { $gt: [{ $size: "$unlockData" }, 0] },
            storedPrivacyType: "$videoPrivacyType", // before the per-viewer recompute below
          },
        },
        {
          $addFields: {
            videoPrivacyType: {
              $cond: {
                if: {
                  $or: [
                    { $eq: ["$videoPrivacyType", 1] }, // free video
                    "$isUnlocked", // individually unlocked
                    {
                      $and: [
                        { $eq: ["$channel.channelType", 2] }, // paid channel
                        "$isSubscribed",
                      ],
                    },
                  ],
                },
                then: 1,
                else: 2,
              },
            },
          },
        },
        {
          $project: {
            title: 1,
            videoType: 1,
            videoTime: 1,
            videoUrl: 1,
            videoImage: 1,
            description: 1,
            channelId: 1,
            videoPrivacyType: 1,
            createdAt: 1,
            channelType: "$channel.channelType",
            subscriptionCost: "$channel.subscriptionCost",
            // Free videos have no price, whatever the channel charges for its paid ones
            // (issue: free uploads were listed as "Premium Exclusive").
            videoUnlockCost: { $cond: [{ $eq: ["$storedPrivacyType", 2] }, "$channel.videoUnlockCost", 0] },
            isPaidVideo: { $eq: ["$storedPrivacyType", 2] },
            channelName: "$channel.fullName",
            channelImage: "$channel.image",
            isSubscribed: 1,
            isSaveToWatchLater: 1,
            views: { $size: "$views" },
            time: {
              $let: {
                vars: {
                  timeDiff: { $subtract: [now.toDate(), "$createdAt"] },
                },
                in: {
                  $concat: [
                    {
                      $switch: {
                        branches: [
                          {
                            case: { $gte: ["$$timeDiff", 31536000000] },
                            then: { $concat: [{ $toString: { $floor: { $divide: ["$$timeDiff", 31536000000] } } }, " years ago"] },
                          },
                          {
                            case: { $gte: ["$$timeDiff", 2592000000] },
                            then: { $concat: [{ $toString: { $floor: { $divide: ["$$timeDiff", 2592000000] } } }, " months ago"] },
                          },
                          {
                            case: { $gte: ["$$timeDiff", 604800000] },
                            then: { $concat: [{ $toString: { $floor: { $divide: ["$$timeDiff", 604800000] } } }, " weeks ago"] },
                          },
                          {
                            case: { $gte: ["$$timeDiff", 86400000] },
                            then: { $concat: [{ $toString: { $floor: { $divide: ["$$timeDiff", 86400000] } } }, " days ago"] },
                          },
                          {
                            case: { $gte: ["$$timeDiff", 3600000] },
                            then: { $concat: [{ $toString: { $floor: { $divide: ["$$timeDiff", 3600000] } } }, " hours ago"] },
                          },
                          {
                            case: { $gte: ["$$timeDiff", 60000] },
                            then: { $concat: [{ $toString: { $floor: { $divide: ["$$timeDiff", 60000] } } }, " minutes ago"] },
                          },
                          {
                            case: { $gte: ["$$timeDiff", 1000] },
                            then: { $concat: [{ $toString: { $floor: { $divide: ["$$timeDiff", 1000] } } }, " seconds ago"] },
                          },
                          { case: true, then: "Just now" },
                        ],
                      },
                    },
                  ],
                },
              },
            },
          },
        },
      ]),
      // SearchHistory.create({
      //   userId: userId,
      //   searchString: req?.body?.searchString,
      // }),
    ]);

    if (!user) {
      return res.status(200).json({ status: false, message: "User does not found." });
    }

    if (user.isBlock) {
      return res.status(200).json({ status: false, message: "you are blocked by admin." });
    }

    return res.status(200).json({ status: true, message: "Success", searchData: response });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//previous search (normal videos or shorts) for user
exports.searchData = async (req, res) => {
  try {
    if (!req.query.userId) {
      return res.status(200).json({
        status: false,
        message: "Oops! Invalid details!",
      });
    }

    const user = await User.findOne({ _id: req.query.userId, isActive: true });
    if (!user) {
      return res.status(200).json({ status: false, message: "User does not found." });
    }

    if (user.isBlock) {
      return res.status(200).json({ status: false, message: "you are blocked by admin." });
    }

    const lastSearchedData = await SearchHistory.find({ userId: user.id })
      .sort({ createdAt: -1 }) //Sort by most recently searched
      .limit(20);

    return res.status(200).json({
      status: true,
      message: "Success",
      lastSearchedData,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      message: error.message || "Internal Server Error",
    });
  }
};

//search shorts for user
exports.searchShorts = async (req, res) => {
  try {
    if (!req.body.searchString || !req.body.userId) {
      return res.status(200).json({
        status: false,
        message: "Oops! Invalid details!",
      });
    }

    let now = dayjs();
    const userId = new mongoose.Types.ObjectId(req.body.userId);

    const [user, response] = await Promise.all([
      User.findOne({ _id: userId, isActive: true }).select("_id isBlock"),
      Video.aggregate([
        {
          $match: {
            $and: [
              {
                $or: [{ title: { $regex: escapeRegex(req.body.searchString), $options: "i" } }, { description: { $regex: escapeRegex(req.body.searchString), $options: "i" } }],
              },
              { videoType: 2 },
              visibility.publicListingMatch(),
            ],
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "channelId",
            foreignField: "channelId",
            as: "channel",
          },
        },
        {
          $unwind: "$channel",
        },
        {
          $lookup: {
            from: "watchhistories",
            localField: "_id",
            foreignField: "videoId",
            as: "views",
          },
        },
        {
          $lookup: {
            from: "savetowatchlaters",
            localField: "_id",
            foreignField: "videoId",
            pipeline: [{ $match: { userId: userId } }, { $limit: 1 }],
            as: "isSaveToWatchLater",
          },
        },
        {
          $lookup: {
            from: "userwisesubscriptions",
            localField: "channel.channelId",
            foreignField: "channelId",
            pipeline: [{ $match: { userId: userId } }, { $limit: 1 }],
            as: "subscription",
          },
        },
        {
          $lookup: {
            from: "videounlocks",
            localField: "_id",
            foreignField: "videoId",
            pipeline: [{ $match: { userId: userId } }, { $limit: 1 }],
            as: "unlockData",
          },
        },
        {
          $addFields: {
            isSaveToWatchLater: { $gt: [{ $size: "$isSaveToWatchLater" }, 0] },
            isSubscribed: { $gt: [{ $size: "$subscription" }, 0] },
            isUnlocked: { $gt: [{ $size: "$unlockData" }, 0] },
            storedPrivacyType: "$videoPrivacyType", // before the per-viewer recompute below
          },
        },
        {
          $addFields: {
            videoPrivacyType: {
              $cond: {
                if: {
                  $or: [
                    { $eq: ["$videoPrivacyType", 1] }, // free video
                    "$isUnlocked", // individually unlocked
                    {
                      $and: [
                        { $eq: ["$channel.channelType", 2] }, // paid channel
                        "$isSubscribed",
                      ],
                    },
                  ],
                },
                then: 1,
                else: 2,
              },
            },
          },
        },
        {
          $project: {
            title: 1,
            videoType: 1,
            videoTime: 1,
            videoUrl: 1,
            videoImage: 1,
            description: 1,
            videoPrivacyType: 1,
            createdAt: 1,
            channelType: "$channel.channelType",
            subscriptionCost: "$channel.subscriptionCost",
            // Free videos have no price, whatever the channel charges for its paid ones
            // (issue: free uploads were listed as "Premium Exclusive").
            videoUnlockCost: { $cond: [{ $eq: ["$storedPrivacyType", 2] }, "$channel.videoUnlockCost", 0] },
            isPaidVideo: { $eq: ["$storedPrivacyType", 2] },
            channelName: "$channel.fullName",
            channelImage: "$channel.image",
            isSubscribed: 1,
            views: { $size: "$views" },
            isSaveToWatchLater: 1,
            time: {
              $let: {
                vars: {
                  timeDiff: { $subtract: [now.toDate(), "$createdAt"] },
                },
                in: {
                  $concat: [
                    {
                      $switch: {
                        branches: [
                          {
                            case: { $gte: ["$$timeDiff", 31536000000] },
                            then: { $concat: [{ $toString: { $floor: { $divide: ["$$timeDiff", 31536000000] } } }, " years ago"] },
                          },
                          {
                            case: { $gte: ["$$timeDiff", 2592000000] },
                            then: { $concat: [{ $toString: { $floor: { $divide: ["$$timeDiff", 2592000000] } } }, " months ago"] },
                          },
                          {
                            case: { $gte: ["$$timeDiff", 604800000] },
                            then: { $concat: [{ $toString: { $floor: { $divide: ["$$timeDiff", 604800000] } } }, " weeks ago"] },
                          },
                          {
                            case: { $gte: ["$$timeDiff", 86400000] },
                            then: { $concat: [{ $toString: { $floor: { $divide: ["$$timeDiff", 86400000] } } }, " days ago"] },
                          },
                          {
                            case: { $gte: ["$$timeDiff", 3600000] },
                            then: { $concat: [{ $toString: { $floor: { $divide: ["$$timeDiff", 3600000] } } }, " hours ago"] },
                          },
                          {
                            case: { $gte: ["$$timeDiff", 60000] },
                            then: { $concat: [{ $toString: { $floor: { $divide: ["$$timeDiff", 60000] } } }, " minutes ago"] },
                          },
                          {
                            case: { $gte: ["$$timeDiff", 1000] },
                            then: { $concat: [{ $toString: { $floor: { $divide: ["$$timeDiff", 1000] } } }, " seconds ago"] },
                          },
                          { case: true, then: "Just now" },
                        ],
                      },
                    },
                  ],
                },
              },
            },
          },
        },
      ]),
      // SearchHistory.create({
      //   userId: userId,
      //   searchString: req?.body?.searchString,
      // }),
    ]);

    if (!user) {
      return res.status(200).json({ status: false, message: "User does not found." });
    }

    if (user.isBlock) {
      return res.status(200).json({ status: false, message: "you are blocked by admin." });
    }

    return res.status(200).json({ status: true, message: "Success", searchShortsData: response });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//type wise searching (All OR videos OR shorts)
exports.searchChannelVideoShortsByUser = async (req, res) => {
  try {
    const start = Math.max(1, Number((req.query || {}).start) || 1);
    const limit = Math.min(50, Math.max(1, Number((req.query || {}).limit) || 10));

    // Whitespace-only is "no query" (the client shows its empty state).
    const rawSearch = String(req.query.searchString || "").trim().replace(/\s+/g, " ").slice(0, 100);
    if (!rawSearch) {
      return res.status(200).json({ status: false, code: "EMPTY_QUERY", message: "Oops ! Invalid details!" });
    }

    let now = dayjs();
    const type = String(req.query.type || "all").trim().toLowerCase() || "all";
    // Matched literally: "C++", "(", "?" and the like used to be compiled as a
    // regular expression (errors, or catastrophic backtracking on crafted input).
    const searchString = escapeRegex(rawSearch);
    const userId = req.query.userId ? new mongoose.Types.ObjectId(req.query.userId) : null;
    const skip = (Math.max(1, Number(start) || 1) - 1) * Math.min(50, Math.max(1, Number(limit) || 10));

    if (type === "all") {
      const [user, channel, videos, shorts, historyEntry] = await Promise.all([
        userId ? User.findOne({ _id: userId, isActive: true }).select("_id isBlock").lean() : Promise.resolve(null),
        User.aggregate([
          {
            // Channels only (an account without a channel isn't searchable),
            // and not deactivated or blocked ones.
            $match: {
              isChannel: true,
              isActive: true,
              isBlock: { $ne: true },
              fullName: { $regex: searchString, $options: "i" },
            },
          },
          {
            $facet: {
              data: [
                { $sort: { createdAt: -1 } },
                { $skip: skip },
                { $limit: Number(limit) },
                {
                  $lookup: {
                    from: "videos",
                    localField: "channelId",
                    foreignField: "channelId",
                    as: "totalVideos",
                  },
                },
                ...(userId
                  ? [
                      {
                        $lookup: {
                          from: "userwisesubscriptions",
                          localField: "channelId",
                          foreignField: "channelId",
                          pipeline: [{ $match: { userId: userId } }, { $limit: 1 }],
                          as: "subscription",
                        },
                      },
                    ]
                  : []),

                {
                  $lookup: {
                    from: "userwisesubscriptions",
                    localField: "channelId",
                    foreignField: "channelId",
                    as: "totalSubscribers",
                  },
                },
                {
                  $project: {
                    channelId: 1,
                    fullName: 1,
                    image: 1,
                    channelType: 1,
                    subscriptionCost: 1,
                    videoUnlockCost: 1,
                    createdAt: 1,
                    isSubscribed: { $gt: [{ $size: { $ifNull: ["$subscription", []] } }, 0] },
                    totalVideos: { $size: "$totalVideos" },
                    totalSubscribers: { $size: "$totalSubscribers" },
                  },
                },
              ],
              total: [{ $count: "count" }],
            },
          },
        ]),
        Video.aggregate([
          {
            $match: {
              isActive: true,
              scheduleType: 2,
              visibilityType: 1,
              moderationStatus: { $nin: ["pending_review", "rejected"] },
              isCopyrightFlagged: { $ne: true },
              videoType: 1,
              $or: [{ title: { $regex: searchString, $options: "i" } }, { description: { $regex: searchString, $options: "i" } }],
            },
          },
          {
            $facet: {
              data: [
                { $sort: { createdAt: -1 } },
                { $skip: skip },
                { $limit: Number(limit) },
                {
                  $lookup: {
                    from: "users",
                    localField: "channelId",
                    foreignField: "channelId",
                    pipeline: [{ $project: { fullName: 1, image: 1, channelType: 1, subscriptionCost: 1, videoUnlockCost: 1 } }],
                    as: "channel",
                  },
                },
                { $unwind: "$channel" },
                {
                  $lookup: {
                    from: "watchhistories",
                    localField: "_id",
                    foreignField: "videoId",
                    pipeline: [{ $count: "count" }],
                    as: "viewsData",
                  },
                },
                ...(userId
                  ? [
                      {
                        $lookup: {
                          from: "userwisesubscriptions",
                          localField: "channelId",
                          foreignField: "channelId",
                          pipeline: [{ $match: { userId: userId } }, { $limit: 1 }],
                          as: "subscription",
                        },
                      },
                      {
                        $lookup: {
                          from: "savetowatchlaters",
                          localField: "_id",
                          foreignField: "videoId",
                          pipeline: [{ $match: { userId: userId } }, { $limit: 1 }],
                          as: "isSaveToWatchLater",
                        },
                      },
                    ]
                  : []),
                ...(userId
                  ? [
                      {
                        $lookup: {
                          from: "videounlocks",
                          localField: "_id",
                          foreignField: "videoId",
                          pipeline: [{ $match: { userId: userId } }, { $limit: 1 }],
                          as: "unlockData",
                        },
                      },
                    ]
                  : []),
                {
                  $addFields: {
                    isSaveToWatchLater: { $gt: [{ $size: { $ifNull: ["$isSaveToWatchLater", []] } }, 0] },
                    isSubscribed: { $gt: [{ $size: { $ifNull: ["$subscription", []] } }, 0] },
                    isUnlocked: { $gt: [{ $size: { $ifNull: ["$unlockData", []] } }, 0] },
                    storedPrivacyType: "$videoPrivacyType", // before the per-viewer recompute below
                  },
                },
                {
                  $addFields: {
                    videoPrivacyType: {
                      $cond: {
                        if: {
                          $or: [
                            { $eq: ["$videoPrivacyType", 1] }, // free video
                            "$isUnlocked", // individually unlocked
                            {
                              $and: [
                                { $eq: ["$channel.channelType", 2] }, // paid channel
                                "$isSubscribed",
                              ],
                            },
                          ],
                        },
                        then: 1,
                        else: 2,
                      },
                    },
                  },
                },
                {
                  $project: {
                    title: 1,
                    videoType: 1,
                    videoTime: 1,
                    videoUrl: 1,
                    videoImage: 1,
                    description: 1,
                    channelId: 1,
                    videoPrivacyType: 1,
                    createdAt: 1,
                    subscriptionCost: "$channel.subscriptionCost",
                    // Free videos have no price, whatever the channel charges for its paid ones
                    // (issue: free uploads were listed as "Premium Exclusive").
                    videoUnlockCost: { $cond: [{ $eq: ["$storedPrivacyType", 2] }, "$channel.videoUnlockCost", 0] },
                    isPaidVideo: { $eq: ["$storedPrivacyType", 2] },
                    channelType: "$channel.channelType",
                    channelName: "$channel.fullName",
                    channelImage: "$channel.image",
                    isSubscribed: 1,
                    isSaveToWatchLater: 1,
                    views: { $ifNull: [{ $arrayElemAt: ["$viewsData.count", 0] }, 0] },
                    time: {
                      $let: {
                        vars: {
                          timeDiff: { $subtract: [now.toDate(), "$createdAt"] },
                        },
                        in: {
                          $concat: [
                            {
                              $switch: {
                                branches: [
                                  {
                                    case: { $gte: ["$$timeDiff", 31536000000] },
                                    then: { $concat: [{ $toString: { $floor: { $divide: ["$$timeDiff", 31536000000] } } }, " years ago"] },
                                  },
                                  {
                                    case: { $gte: ["$$timeDiff", 2592000000] },
                                    then: { $concat: [{ $toString: { $floor: { $divide: ["$$timeDiff", 2592000000] } } }, " months ago"] },
                                  },
                                  {
                                    case: { $gte: ["$$timeDiff", 604800000] },
                                    then: { $concat: [{ $toString: { $floor: { $divide: ["$$timeDiff", 604800000] } } }, " weeks ago"] },
                                  },
                                  {
                                    case: { $gte: ["$$timeDiff", 86400000] },
                                    then: { $concat: [{ $toString: { $floor: { $divide: ["$$timeDiff", 86400000] } } }, " days ago"] },
                                  },
                                  {
                                    case: { $gte: ["$$timeDiff", 3600000] },
                                    then: { $concat: [{ $toString: { $floor: { $divide: ["$$timeDiff", 3600000] } } }, " hours ago"] },
                                  },
                                  {
                                    case: { $gte: ["$$timeDiff", 60000] },
                                    then: { $concat: [{ $toString: { $floor: { $divide: ["$$timeDiff", 60000] } } }, " minutes ago"] },
                                  },
                                  {
                                    case: { $gte: ["$$timeDiff", 1000] },
                                    then: { $concat: [{ $toString: { $floor: { $divide: ["$$timeDiff", 1000] } } }, " seconds ago"] },
                                  },
                                  { case: true, then: "Just now" },
                                ],
                              },
                            },
                          ],
                        },
                      },
                    },
                  },
                },
              ],
              total: [{ $count: "count" }],
            },
          },
        ]),
        Video.aggregate([
          {
            $match: {
              isActive: true,
              scheduleType: 2,
              visibilityType: 1,
              moderationStatus: { $nin: ["pending_review", "rejected"] },
              isCopyrightFlagged: { $ne: true },
              videoType: 2,
              $or: [{ title: { $regex: searchString, $options: "i" } }, { description: { $regex: searchString, $options: "i" } }],
            },
          },
          {
            $facet: {
              data: [
                { $sort: { createdAt: -1 } },
                { $skip: skip },
                { $limit: Number(limit) },
                {
                  $lookup: {
                    from: "users",
                    localField: "channelId",
                    foreignField: "channelId",
                    pipeline: [{ $project: { fullName: 1, image: 1, channelType: 1, subscriptionCost: 1, videoUnlockCost: 1 } }],
                    as: "channel",
                  },
                },
                { $unwind: "$channel" },
                {
                  $lookup: {
                    from: "watchhistories",
                    localField: "_id",
                    foreignField: "videoId",
                    pipeline: [{ $count: "count" }],
                    as: "viewsData",
                  },
                },
                ...(userId
                  ? [
                      {
                        $lookup: {
                          from: "userwisesubscriptions",
                          localField: "channelId",
                          foreignField: "channelId",
                          pipeline: [{ $match: { userId: userId } }, { $limit: 1 }],
                          as: "subscription",
                        },
                      },
                      {
                        $lookup: {
                          from: "savetowatchlaters",
                          localField: "_id",
                          foreignField: "videoId",
                          pipeline: [{ $match: { userId: userId } }, { $limit: 1 }],
                          as: "isSaveToWatchLater",
                        },
                      },
                    ]
                  : []),
                ...(userId
                  ? [
                      {
                        $lookup: {
                          from: "videounlocks",
                          localField: "_id",
                          foreignField: "videoId",
                          pipeline: [{ $match: { userId: userId } }, { $limit: 1 }],
                          as: "unlockData",
                        },
                      },
                    ]
                  : []),
                {
                  $addFields: {
                    isSaveToWatchLater: { $gt: [{ $size: { $ifNull: ["$isSaveToWatchLater", []] } }, 0] },
                    isSubscribed: { $gt: [{ $size: { $ifNull: ["$subscription", []] } }, 0] },
                    isUnlocked: { $gt: [{ $size: { $ifNull: ["$unlockData", []] } }, 0] },
                    storedPrivacyType: "$videoPrivacyType", // before the per-viewer recompute below
                  },
                },
                {
                  $addFields: {
                    videoPrivacyType: {
                      $cond: {
                        if: {
                          $or: [
                            { $eq: ["$videoPrivacyType", 1] }, // free video
                            "$isUnlocked", // individually unlocked
                            {
                              $and: [
                                { $eq: ["$channel.channelType", 2] }, // paid channel
                                "$isSubscribed",
                              ],
                            },
                          ],
                        },
                        then: 1,
                        else: 2,
                      },
                    },
                  },
                },
                {
                  $project: {
                    title: 1,
                    videoType: 1,
                    videoTime: 1,
                    videoUrl: 1,
                    videoImage: 1,
                    description: 1,
                    channelId: 1,
                    videoPrivacyType: 1,
                    createdAt: 1,
                    channelType: "$channel.channelType",
                    subscriptionCost: "$channel.subscriptionCost",
                    // Free videos have no price, whatever the channel charges for its paid ones
                    // (issue: free uploads were listed as "Premium Exclusive").
                    videoUnlockCost: { $cond: [{ $eq: ["$storedPrivacyType", 2] }, "$channel.videoUnlockCost", 0] },
                    isPaidVideo: { $eq: ["$storedPrivacyType", 2] },
                    channelName: "$channel.fullName",
                    channelImage: "$channel.image",
                    isSubscribed: 1,
                    isSaveToWatchLater: 1,
                    views: { $ifNull: [{ $arrayElemAt: ["$viewsData.count", 0] }, 0] },
                    time: {
                      $let: {
                        vars: {
                          timeDiff: { $subtract: [now.toDate(), "$createdAt"] },
                        },
                        in: {
                          $concat: [
                            {
                              $switch: {
                                branches: [
                                  {
                                    case: { $gte: ["$$timeDiff", 31536000000] },
                                    then: { $concat: [{ $toString: { $floor: { $divide: ["$$timeDiff", 31536000000] } } }, " years ago"] },
                                  },
                                  {
                                    case: { $gte: ["$$timeDiff", 2592000000] },
                                    then: { $concat: [{ $toString: { $floor: { $divide: ["$$timeDiff", 2592000000] } } }, " months ago"] },
                                  },
                                  {
                                    case: { $gte: ["$$timeDiff", 604800000] },
                                    then: { $concat: [{ $toString: { $floor: { $divide: ["$$timeDiff", 604800000] } } }, " weeks ago"] },
                                  },
                                  {
                                    case: { $gte: ["$$timeDiff", 86400000] },
                                    then: { $concat: [{ $toString: { $floor: { $divide: ["$$timeDiff", 86400000] } } }, " days ago"] },
                                  },
                                  {
                                    case: { $gte: ["$$timeDiff", 3600000] },
                                    then: { $concat: [{ $toString: { $floor: { $divide: ["$$timeDiff", 3600000] } } }, " hours ago"] },
                                  },
                                  {
                                    case: { $gte: ["$$timeDiff", 60000] },
                                    then: { $concat: [{ $toString: { $floor: { $divide: ["$$timeDiff", 60000] } } }, " minutes ago"] },
                                  },
                                  {
                                    case: { $gte: ["$$timeDiff", 1000] },
                                    then: { $concat: [{ $toString: { $floor: { $divide: ["$$timeDiff", 1000] } } }, " seconds ago"] },
                                  },
                                  { case: true, then: "Just now" },
                                ],
                              },
                            },
                          ],
                        },
                      },
                    },
                  },
                },
              ],
              total: [{ $count: "count" }],
            },
          },
        ]),
        // SearchHistory.create({
        //   userId: userId,
        //   searchString: searchString,
        // }),
      ]);

      if (userId) {
        if (!user) {
          return res.status(200).json({ status: false, message: "User does not found." });
        }

        if (user.isBlock) {
          return res.status(200).json({ status: false, message: "you are blocked by admin." });
        }
      }

      return res.status(200).json({
        status: true,
        message: "Success",
        searchData: {
          totalChannel: channel[0]?.total[0]?.count || 0,
          channel: channel,
          totalVideos: videos[0]?.total[0]?.count || 0,
          videos: videos[0]?.data || [],
          totalShorts: shorts[0]?.total[0]?.count || 0,
          shorts: shorts[0]?.data || [],
        },
      });
    } else if (type === "videos") {
      const [user, shorts, historyEntry] = await Promise.all([
        userId ? User.findOne({ _id: userId, isActive: true }).select("_id isBlock").lean() : Promise.resolve(null),
        Video.aggregate([
          {
            $match: {
              $and: [
                {
                  $or: [{ title: { $regex: searchString, $options: "i" } }, { description: { $regex: searchString, $options: "i" } }],
                },
                { videoType: 1 },
                visibility.publicListingMatch(),
              ],
            },
          },
          {
            $facet: {
              data: [
                { $sort: { createdAt: -1 } },
                { $skip: skip },
                { $limit: Number(limit) },
                {
                  $lookup: {
                    from: "users",
                    localField: "channelId",
                    foreignField: "channelId",
                    pipeline: [{ $project: { fullName: 1, image: 1, channelType: 1, subscriptionCost: 1, videoUnlockCost: 1 } }],
                    as: "channel",
                  },
                },
                { $unwind: "$channel" },
                {
                  $lookup: {
                    from: "watchhistories",
                    localField: "_id",
                    foreignField: "videoId",
                    pipeline: [{ $count: "count" }],
                    as: "viewsData",
                  },
                },
                ...(userId
                  ? [
                      {
                        $lookup: {
                          from: "userwisesubscriptions",
                          localField: "channelId",
                          foreignField: "channelId",
                          pipeline: [{ $match: { userId: userId } }, { $limit: 1 }],
                          as: "subscription",
                        },
                      },
                      {
                        $lookup: {
                          from: "savetowatchlaters",
                          localField: "_id",
                          foreignField: "videoId",
                          pipeline: [{ $match: { userId: userId } }, { $limit: 1 }],
                          as: "isSaveToWatchLater",
                        },
                      },
                    ]
                  : []),
                ...(userId
                  ? [
                      {
                        $lookup: {
                          from: "videounlocks",
                          localField: "_id",
                          foreignField: "videoId",
                          pipeline: [{ $match: { userId: userId } }, { $limit: 1 }],
                          as: "unlockData",
                        },
                      },
                    ]
                  : []),
                {
                  $addFields: {
                    isSaveToWatchLater: { $gt: [{ $size: { $ifNull: ["$isSaveToWatchLater", []] } }, 0] },
                    isSubscribed: { $gt: [{ $size: { $ifNull: ["$subscription", []] } }, 0] },
                    isUnlocked: { $gt: [{ $size: { $ifNull: ["$unlockData", []] } }, 0] },
                    storedPrivacyType: "$videoPrivacyType", // before the per-viewer recompute below
                  },
                },
                {
                  $addFields: {
                    videoPrivacyType: {
                      $cond: {
                        if: {
                          $or: [
                            { $eq: ["$videoPrivacyType", 1] }, // free video
                            "$isUnlocked", // individually unlocked
                            {
                              $and: [
                                { $eq: ["$channel.channelType", 2] }, // paid channel
                                "$isSubscribed",
                              ],
                            },
                          ],
                        },
                        then: 1,
                        else: 2,
                      },
                    },
                  },
                },
                {
                  $project: {
                    title: 1,
                    videoType: 1,
                    videoTime: 1,
                    videoUrl: 1,
                    videoImage: 1,
                    description: 1,
                    videoPrivacyType: 1,
                    createdAt: 1,
                    channelType: "$channel.channelType",
                    subscriptionCost: "$channel.subscriptionCost",
                    // Free videos have no price, whatever the channel charges for its paid ones
                    // (issue: free uploads were listed as "Premium Exclusive").
                    videoUnlockCost: { $cond: [{ $eq: ["$storedPrivacyType", 2] }, "$channel.videoUnlockCost", 0] },
                    isPaidVideo: { $eq: ["$storedPrivacyType", 2] },
                    channelName: "$channel.fullName",
                    channelImage: "$channel.image",
                    isSubscribed: 1,
                    isSaveToWatchLater: 1,
                    views: { $ifNull: [{ $arrayElemAt: ["$viewsData.count", 0] }, 0] },
                    time: {
                      $let: {
                        vars: {
                          timeDiff: { $subtract: [now.toDate(), "$createdAt"] },
                        },
                        in: {
                          $concat: [
                            {
                              $switch: {
                                branches: [
                                  {
                                    case: { $gte: ["$$timeDiff", 31536000000] },
                                    then: { $concat: [{ $toString: { $floor: { $divide: ["$$timeDiff", 31536000000] } } }, " years ago"] },
                                  },
                                  {
                                    case: { $gte: ["$$timeDiff", 2592000000] },
                                    then: { $concat: [{ $toString: { $floor: { $divide: ["$$timeDiff", 2592000000] } } }, " months ago"] },
                                  },
                                  {
                                    case: { $gte: ["$$timeDiff", 604800000] },
                                    then: { $concat: [{ $toString: { $floor: { $divide: ["$$timeDiff", 604800000] } } }, " weeks ago"] },
                                  },
                                  {
                                    case: { $gte: ["$$timeDiff", 86400000] },
                                    then: { $concat: [{ $toString: { $floor: { $divide: ["$$timeDiff", 86400000] } } }, " days ago"] },
                                  },
                                  {
                                    case: { $gte: ["$$timeDiff", 3600000] },
                                    then: { $concat: [{ $toString: { $floor: { $divide: ["$$timeDiff", 3600000] } } }, " hours ago"] },
                                  },
                                  {
                                    case: { $gte: ["$$timeDiff", 60000] },
                                    then: { $concat: [{ $toString: { $floor: { $divide: ["$$timeDiff", 60000] } } }, " minutes ago"] },
                                  },
                                  {
                                    case: { $gte: ["$$timeDiff", 1000] },
                                    then: { $concat: [{ $toString: { $floor: { $divide: ["$$timeDiff", 1000] } } }, " seconds ago"] },
                                  },
                                  { case: true, then: "Just now" },
                                ],
                              },
                            },
                          ],
                        },
                      },
                    },
                  },
                },
              ],
              total: [{ $count: "count" }],
            },
          },
        ]),
        // SearchHistory.create({
        //   userId: userId,
        //   searchString: req?.body?.searchString,
        // }),
      ]);

      if (userId) {
        if (!user) {
          return res.status(200).json({ status: false, message: "User does not found." });
        }

        if (user.isBlock) {
          return res.status(200).json({ status: false, message: "you are blocked by admin." });
        }
      }

      return res.status(200).json({
        status: true,
        message: "Success",
        searchData: shorts,
        total: shorts[0]?.total[0]?.count || 0,
      });
    } else if (type === "shorts") {
      const [user, videos, historyEntry] = await Promise.all([
        userId ? User.findOne({ _id: userId, isActive: true }).select("_id isBlock").lean() : Promise.resolve(null),
        Video.aggregate([
          {
            $match: {
              $and: [
                {
                  $or: [{ title: { $regex: searchString, $options: "i" } }, { description: { $regex: searchString, $options: "i" } }],
                },
                { videoType: 2 },
                visibility.publicListingMatch(),
              ],
            },
          },
          {
            $facet: {
              data: [
                { $sort: { createdAt: -1 } },
                { $skip: skip },
                { $limit: Number(limit) },
                {
                  $lookup: {
                    from: "users",
                    localField: "channelId",
                    foreignField: "channelId",
                    pipeline: [{ $project: { fullName: 1, image: 1, channelType: 1, subscriptionCost: 1, videoUnlockCost: 1 } }],
                    as: "channel",
                  },
                },
                { $unwind: "$channel" },
                {
                  $lookup: {
                    from: "watchhistories",
                    localField: "_id",
                    foreignField: "videoId",
                    pipeline: [{ $count: "count" }],
                    as: "viewsData",
                  },
                },
                ...(userId
                  ? [
                      {
                        $lookup: {
                          from: "userwisesubscriptions",
                          localField: "channelId",
                          foreignField: "channelId",
                          pipeline: [{ $match: { userId: userId } }, { $limit: 1 }],
                          as: "subscription",
                        },
                      },
                      {
                        $lookup: {
                          from: "savetowatchlaters",
                          localField: "_id",
                          foreignField: "videoId",
                          pipeline: [{ $match: { userId: userId } }, { $limit: 1 }],
                          as: "isSaveToWatchLater",
                        },
                      },
                    ]
                  : []),
                ...(userId
                  ? [
                      {
                        $lookup: {
                          from: "videounlocks",
                          localField: "_id",
                          foreignField: "videoId",
                          pipeline: [{ $match: { userId: userId } }, { $limit: 1 }],
                          as: "unlockData",
                        },
                      },
                    ]
                  : []),
                {
                  $addFields: {
                    isSaveToWatchLater: { $gt: [{ $size: { $ifNull: ["$isSaveToWatchLater", []] } }, 0] },
                    isSubscribed: { $gt: [{ $size: { $ifNull: ["$subscription", []] } }, 0] },
                    isUnlocked: { $gt: [{ $size: { $ifNull: ["$unlockData", []] } }, 0] },
                    storedPrivacyType: "$videoPrivacyType", // before the per-viewer recompute below
                  },
                },
                {
                  $addFields: {
                    videoPrivacyType: {
                      $cond: {
                        if: {
                          $or: [
                            { $eq: ["$videoPrivacyType", 1] }, // free video
                            "$isUnlocked", // individually unlocked
                            {
                              $and: [
                                { $eq: ["$channel.channelType", 2] }, // paid channel
                                "$isSubscribed",
                              ],
                            },
                          ],
                        },
                        then: 1,
                        else: 2,
                      },
                    },
                  },
                },
                {
                  $project: {
                    title: 1,
                    videoType: 1,
                    videoTime: 1,
                    videoUrl: 1,
                    videoImage: 1,
                    description: 1,
                    videoPrivacyType: 1,
                    createdAt: 1,
                    channelType: "$channel.channelType",
                    subscriptionCost: "$channel.subscriptionCost",
                    // Free videos have no price, whatever the channel charges for its paid ones
                    // (issue: free uploads were listed as "Premium Exclusive").
                    videoUnlockCost: { $cond: [{ $eq: ["$storedPrivacyType", 2] }, "$channel.videoUnlockCost", 0] },
                    isPaidVideo: { $eq: ["$storedPrivacyType", 2] },
                    channelName: "$channel.fullName",
                    channelImage: "$channel.image",
                    isSubscribed: 1,
                    isSaveToWatchLater: 1,
                    views: { $ifNull: [{ $arrayElemAt: ["$viewsData.count", 0] }, 0] },
                    time: {
                      $let: {
                        vars: {
                          timeDiff: { $subtract: [now.toDate(), "$createdAt"] },
                        },
                        in: {
                          $concat: [
                            {
                              $switch: {
                                branches: [
                                  {
                                    case: { $gte: ["$$timeDiff", 31536000000] },
                                    then: { $concat: [{ $toString: { $floor: { $divide: ["$$timeDiff", 31536000000] } } }, " years ago"] },
                                  },
                                  {
                                    case: { $gte: ["$$timeDiff", 2592000000] },
                                    then: { $concat: [{ $toString: { $floor: { $divide: ["$$timeDiff", 2592000000] } } }, " months ago"] },
                                  },
                                  {
                                    case: { $gte: ["$$timeDiff", 604800000] },
                                    then: { $concat: [{ $toString: { $floor: { $divide: ["$$timeDiff", 604800000] } } }, " weeks ago"] },
                                  },
                                  {
                                    case: { $gte: ["$$timeDiff", 86400000] },
                                    then: { $concat: [{ $toString: { $floor: { $divide: ["$$timeDiff", 86400000] } } }, " days ago"] },
                                  },
                                  {
                                    case: { $gte: ["$$timeDiff", 3600000] },
                                    then: { $concat: [{ $toString: { $floor: { $divide: ["$$timeDiff", 3600000] } } }, " hours ago"] },
                                  },
                                  {
                                    case: { $gte: ["$$timeDiff", 60000] },
                                    then: { $concat: [{ $toString: { $floor: { $divide: ["$$timeDiff", 60000] } } }, " minutes ago"] },
                                  },
                                  {
                                    case: { $gte: ["$$timeDiff", 1000] },
                                    then: { $concat: [{ $toString: { $floor: { $divide: ["$$timeDiff", 1000] } } }, " seconds ago"] },
                                  },
                                  { case: true, then: "Just now" },
                                ],
                              },
                            },
                          ],
                        },
                      },
                    },
                  },
                },
              ],
              total: [{ $count: "count" }],
            },
          },
        ]),
        // SearchHistory.create({
        //   userId: userId,
        //   searchString: req?.body?.searchString,
        // }),
      ]);

      if (userId) {
        if (!user) {
          return res.status(200).json({ status: false, message: "User does not found." });
        }

        if (user.isBlock) {
          return res.status(200).json({ status: false, message: "you are blocked by admin." });
        }
      }

      return res.status(200).json({
        status: true,
        message: "Success",
        searchData: videos,
        total: videos[0]?.total[0]?.count || 0,
      });
    } else {
      return res.status(200).json({ status: false, message: "type must be passed valid!" });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//clear all searchHistory for particular user
exports.clearAllSearchHistory = async (req, res) => {
  try {
    if (!req.query.userId) {
      return res.status(200).json({ status: false, message: "Oops! Invalid details!" });
    }

    const user = await User.findOne({ _id: req.query.userId, isActive: true });
    if (!user) {
      return res.status(200).json({ status: false, message: "User does not found!" });
    }

    if (user.isBlock) {
      return res.status(200).json({ status: false, message: "you are blocked by admin!" });
    }

    const clearSearchHistory = await SearchHistory.deleteMany({ userId: user._id });

    if (clearSearchHistory.deletedCount > 0) {
      return res.status(200).json({
        status: true,
        message: "Successfully cleared all search history for the user!",
      });
    } else {
      return res.status(200).json({
        status: false,
        message: "Search history not found for the user!",
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

//update (normal videos or shorts) by user
exports.modifyVideo = async (req, res) => {
  try {
    const replacement = req.body?.videoUrl ? require("../../util/mediaPolicy").videoLocation(req.body.videoUrl, require("../../util/cloudflareStorage.service")._cfg()) : null;
    if (req.body?.videoUrl && !replacement) return res.status(400).json({ status: false, code: "INVALID_VIDEO_PROVIDER", message: "Upload replacement videos to Cloudflare first." });
    let replacementRef = null;
    if (replacement) {
      // Same ownership rule as createVideo (util/uploadGrants.js).
      replacementRef = replacement.storageProvider === "stream" ? replacement.streamUid : uploadGrants.r2KeyFromUrl(replacement.videoUrl);
      const owned = await uploadGrants.verifyOwnedUpload({ provider: replacement.storageProvider, ref: replacementRef, ownerId: req.appUserId, allowVideoId: req.query.videoId });
      if (!owned.ok) return res.status(403).json({ status: false, code: owned.code, message: owned.message });
      if (replacement.storageProvider === "r2" && (await uploadGrants.r2ObjectExists(replacementRef)) === false) {
        return res.status(409).json({ status: false, code: "UPLOAD_INCOMPLETE", message: "The upload hasn't finished. Please upload the video again." });
      }
    }
    if (!req.query.videoId || !req.query.userId || !req.query.channelId || !req.query.videoType) {
      if (req.body.videoImage) {
        await discardOwnUpload(req, req.body.videoImage);
      }

      if (req.body.videoUrl) {
        await discardOwnUpload(req, req.body.videoUrl);
      }

      return res.status(200).json({ status: false, message: "OOps ! Invalid details!" });
    }

    const [user, video] = await Promise.all([
      User.findOne({ _id: req.query.userId, isActive: true }).select("isBlock channelId").lean(),
      Video.findOne({ _id: req.query.videoId, isActive: true, videoType: Number(req.query.videoType) }),
    ]);

    if (!user) {
      if (req.body.videoImage) {
        await discardOwnUpload(req, req.body.videoImage);
      }

      if (req.body.videoUrl) {
        await discardOwnUpload(req, req.body.videoUrl);
      }

      return res.status(200).json({ status: false, message: "User does not found!" });
    }

    if (user.isBlock) {
      if (req.body.videoImage) {
        await discardOwnUpload(req, req.body.videoImage);
      }

      if (req.body.videoUrl) {
        await discardOwnUpload(req, req.body.videoUrl);
      }

      return res.status(200).json({ status: false, message: "you are blocked by admin!" });
    }

    const channel = await User.findOne({ channelId: user.channelId });
    if (!channel) {
      if (req.body.videoImage) {
        await discardOwnUpload(req, req.body.videoImage);
      }

      if (req.body.videoUrl) {
        await discardOwnUpload(req, req.body.videoUrl);
      }

      return res.status(200).json({ status: false, message: "channel does not found!" });
    }

    if (user.channelId !== req.query.channelId) {
      if (req.body.videoImage) {
        await discardOwnUpload(req, req.body.videoImage);
      }

      if (req.body.videoUrl) {
        await discardOwnUpload(req, req.body.videoUrl);
      }

      return res.status(403).json({ status: false, code: "CHANNEL_NOT_OWNED", message: "video has been updated only by own channelId." });
    }

    if (!video) {
      if (req.body.videoImage) {
        await discardOwnUpload(req, req.body.videoImage);
      }

      if (req.body.videoUrl) {
        await discardOwnUpload(req, req.body.videoUrl);
      }

      return res.status(200).json({ status: false, message: "video does not found!" });
    }

    const b = req.body || {};
    const changes = {};
    if (b.title) changes.title = String(b.title).trim();
    if (b.description) changes.description = String(b.description).trim();

    if (Number(req.query.videoType) === 2 && b.videoTime) {
      if (global.settingJSON.durationOfShorts < Number(b.videoTime)) {
        if (b.videoImage) await deleteFromStorage(b.videoImage);
        if (b.videoUrl) await deleteFromStorage(b.videoUrl);
        return res.status(200).json({ status: false, message: "your duration of Shorts greater than decided by the admin." });
      }
      changes.videoTime = b.videoTime;
    }

    for (const [field, max] of [["visibilityType", 3], ["audienceType", 3], ["commentType", 4]]) {
      if (b[field] === undefined || b[field] === null || b[field] === "") continue;
      const n = Number(b[field]);
      if (!Number.isInteger(n) || n < 1 || n > max) {
        if (b.videoImage) await deleteFromStorage(b.videoImage);
        if (b.videoUrl) await deleteFromStorage(b.videoUrl);
        return res.status(200).json({ status: false, code: "INVALID_OPTION", message: `${field} is not a valid choice.` });
      }
      changes[field] = n;
    }

    if (b.scheduleType) {
      changes.scheduleType = Number(b.scheduleType);
      if (b.scheduleType == 1) {
        // A new time must be a valid future time; keeping the stored one is allowed.
        if (b.scheduleTime) {
          const parsed = scheduledPublish.parseScheduleTime(b.scheduleTime);
          if (!parsed.ok) {
            if (b.videoImage) await deleteFromStorage(b.videoImage);
            if (b.videoUrl) await deleteFromStorage(b.videoUrl);
            return res.status(200).json({ status: false, code: parsed.code, message: parsed.message });
          }
          changes.scheduleTime = parsed.iso;
        } else changes.scheduleTime = video.scheduleTime || "";
      } else if (b.scheduleType == 2) changes.scheduleTime = "";
      else {
        if (b.videoImage) await deleteFromStorage(b.videoImage);
        if (b.videoUrl) await deleteFromStorage(b.videoUrl);
        return res.status(200).json({ status: false, message: "scheduleType must be passed valid!" });
      }
    }

    if (b.location) changes.location = b.location;
    if (b.latitude || b.longitude) {
      changes.locationCoordinates = {
        latitude: b.latitude || video.locationCoordinates?.latitude || "",
        longitude: b.longitude || video.locationCoordinates?.longitude || "",
      };
    }
    if (b.hashTag) changes.hashTag = String(b.hashTag).split(",");

    if (b.videoImage) {
      if (video.videoImage) await deleteFromStorage(video.videoImage);
      changes.videoImage = b.videoImage;
    }
    const replacingFile = !!(b.videoUrl && b.videoUrl !== video.videoUrl);
    if (replacingFile) {
      Object.assign(changes, { streamUid: null, hlsUrl: null, dashUrl: null, rawVideoUrl: null }, replacement);
    }

    await db.update("videos", video._id || video.id, changes);

    // Old media goes only after the record points at the new file — deleting
    // first left the video pointing at nothing when the update failed.
    if (replacingFile) {
      await uploadGrants.markGrantUsed({ provider: replacement.storageProvider, ref: replacementRef, videoId: video._id || video.id }).catch(() => {});
      if (video.streamUid && video.streamUid !== b.streamUid) {
        try { await videoPipeline.deleteVideo(video.streamUid); } catch (e) { /* ignore */ }
      } else if (video.videoUrl) {
        await deleteFromStorage(video.videoUrl);
      }
    }

    return res.status(200).json({ status: true, message: "Video has been updated!" });
  } catch (error) {
    if (req.body.videoImage) {
      await discardOwnUpload(req, req.body.videoImage);
    }

    if (req.body.videoUrl) {
      await discardOwnUpload(req, req.body.videoUrl);
    }
    console.log(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

//delete (normal videos or shorts) by user
exports.deleteVideoRecord = async (req, res) => {
  try {
    if (!req.query.videoId) {
      return res.status(200).json({ status: false, message: "videoId must be required!" });
    }

    const videoIds = [...new Set(req.query.videoId.split(",").map((x) => x.trim()).filter(Boolean))];

    // Only the caller's own videos (requireOwner checks the first id; this
    // checks every one).
    const videos = (await Video.find({ _id: { $in: videoIds } }).lean())
      .filter((v) => String(v.userId?._id || v.userId || "") === String(req.appUserId));

    if (!videos.length) {
      return res.status(200).json({ status: false, message: "No videos found with the provided IDs." });
    }

    // Delete first, answer after: on serverless, work after the response may
    // never run (the video used to stay listed while the app said "deleted").
    await Promise.all(
      videos.map(async (video) => {
        // R2 / Firebase Storage objects (deleteFromStorage skipped those).
        for (const url of [video.videoImage, video.rawVideoUrl || video.videoUrl]) {
          if (url) await deleteMediaByUrl(url).catch((e) => console.error("delete media:", e.message));
        }

        const comments = await VideoComment.find({ videoId: video._id }).select("_id").lean();
        const commentIds = comments.map((c) => c._id);

        await Promise.all([
          Notification.deleteMany({ videoId: video._id }),
          LikeHistoryOfVideo.deleteMany({ videoId: video._id }),
          commentIds.length ? LikeHistoryOfVideoComment.deleteMany({ videoCommentId: { $in: commentIds } }) : null,
          VideoComment.deleteMany({ videoId: video._id }),
          Report.deleteMany({ videoId: video._id }),
          SaveToWatchLater.deleteMany({ videoId: video._id }),
          WatchHistory.deleteMany({ videoId: video._id }),
          PlaybackSession.deleteMany({ videoId: video._id }),
          PlayList.updateMany({ videoId: video._id }, { $pull: { videoId: video._id } }),
          Video.deleteOne({ _id: video._id }),
        ]);
      }),
    );

    return res.status(200).json({
      status: true,
      message: videos.length === 1 ? "Video deleted." : `${videos.length} videos deleted.`,
      deleted: videos.map((v) => String(v._id)),
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//get top 10 videos based on views
exports.getTopViewedVideos = async (req, res) => {
  try {
    if (!req.query.userId) {
      return res.status(200).json({ status: false, message: "Oops! Invalid details." });
    }

    const userId = new mongoose.Types.ObjectId(req.query.userId);

    const user = await User.findOne({ _id: userId, isActive: true }).select("isBlock").lean();

    if (!user) {
      return res.status(200).json({ status: false, message: "User not found." });
    }

    if (user.isBlock) {
      return res.status(200).json({ status: false, message: "You are blocked by admin." });
    }

    const videos = await Video.aggregate([
      {
        $match: {
          userId,
          isActive: true,
          videoType: 1,
          scheduleType: 2,
          visibilityType: 1,
        },
      },
      {
        $lookup: {
          from: "watchhistories",
          localField: "_id",
          foreignField: "videoId",
          as: "views",
        },
      },
      {
        $lookup: {
          from: "users",
          let: { channelId: "$channelId" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$channelId", "$$channelId"],
                },
              },
            },
            {
              $project: {
                _id: 0,
                fullName: 1,
                image: 1,
                channelType: 1,
              },
            },
          ],
          as: "channel",
        },
      },
      {
        $unwind: {
          path: "$channel",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          viewsCount: { $size: "$views" },
        },
      },
      {
        $project: {
          _id: 1,
          title: 1,
          videoUrl: 1,
          videoImage: 1,
          videoTime: 1,
          views: "$viewsCount",
          channelId: 1,
          channelName: "$channel.fullName",
          channelImage: "$channel.image",
          channelType: "$channel.channelType",
          createdAt: 1,
        },
      },
      { $match: { views: { $gt: 0 } } },
      { $sort: { views: -1 } },
      { $limit: 10 },
    ]);

    return res.status(200).json({
      status: true,
      message: "Top viewed videos fetched successfully.",
      videos,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

//get all normal videos for user (at the time of added to playlist or watch later or history)
exports.getVideoList = async (req, res) => {
  try {
    const start = req.query.start ? parseInt(req.query.start) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 50;
    const search = escapeRegex(req.query.search || ""); // matched literally

    const userId = req?.query?.userId || null;

    const pipeline = [
      {
        // F-12 (Phase 2): add moderation/copyright guards so held and flagged
        // videos are excluded from the public video list.
        $match: {
          isActive: true,
          videoType: 1,
          scheduleType: 2,
          visibilityType: 1,
          moderationStatus: { $nin: visibility.HIDDEN_MODERATION },
          isCopyrightFlagged: { $ne: true },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "channelId",
          foreignField: "channelId",
          pipeline: [
            {
              $project: {
                _id: 0,
                fullName: 1,
                image: 1,
                channelType: 1,
                subscriptionCost: 1,
              },
            },
          ],
          as: "channel",
        },
      },
      {
        $unwind: {
          path: "$channel",
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $lookup: {
          from: "watchhistories",
          localField: "_id",
          foreignField: "videoId",
          as: "views",
        },
      },
    ];

    if (userId) {
      pipeline.push(
        {
          $lookup: {
            from: "userwisesubscriptions",
            localField: "channel.channelId",
            foreignField: "channelId",
            pipeline: [{ $match: { userId: userId } }, { $limit: 1 }],
            as: "subscription",
          },
        },
        {
          $lookup: {
            from: "videounlocks",
            localField: "_id",
            foreignField: "videoId",
            pipeline: [{ $match: { userId: userId } }, { $limit: 1 }],
            as: "unlockData",
          },
        },
        {
          $addFields: {
            isSubscribed: { $gt: [{ $size: "$subscription" }, 0] },
            isUnlocked: { $gt: [{ $size: "$unlockData" }, 0] },
            storedPrivacyType: "$videoPrivacyType", // before the per-viewer recompute below
          },
        },
      );
    } else {
      pipeline.push({
        $addFields: {
          isSubscribed: false,
          isUnlocked: false,
        },
      });
    }

    pipeline.push({
      $addFields: {
        videoPrivacyType: {
          $cond: {
            if: {
              $or: [
                { $eq: ["$videoPrivacyType", 1] }, // free
                "$isUnlocked",
                {
                  $and: [{ $eq: ["$channel.channelType", 2] }, "$isSubscribed"],
                },
              ],
            },
            then: 1,
            else: 2,
          },
        },
      },
    });

    if (search) {
      pipeline.push({
        $match: {
          $or: [{ title: { $regex: search, $options: "i" } }, { description: { $regex: search, $options: "i" } }, { "channel.fullName": { $regex: search, $options: "i" } }],
        },
      });
    }

    pipeline.push({
      $facet: {
        videos: [
          {
            $project: {
              _id: 1,
              title: 1,
              description: 1,
              videoType: 1,
              videoTime: 1,
              videoUrl: 1,
              videoImage: 1,
              scheduleType: 1,
              scheduleTime: 1,
              createdAt: 1,
              userId: 1,
              channelId: 1,

              channelName: "$channel.fullName",
              channelType: "$channel.channelType",
              channelImage: "$channel.image",
              subscriptionCost: "$channel.subscriptionCost",

              videoPrivacyType: 1,
              isSubscribed: 1,
              views: { $size: "$views" },
            },
          },
          { $sort: { createdAt: -1 } },
          { $skip: (start - 1) * limit },
          { $limit: limit },
        ],
        totalCount: [{ $count: "count" }],
      },
    });

    const result = await Video.aggregate(pipeline);

    const videos = result[0]?.videos || [];
    const total = result[0]?.totalCount[0]?.count || 0;

    return res.status(200).json({
      status: true,
      message: "Retrieve videos for the user.",
      total,
      videos,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      message: error.message || "Internal Server Error",
    });
  }
};

//get own videos/shorts
exports.getUserVideos = async (req, res) => {
  try {
    const start = req.query.start ? parseInt(req.query.start) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 50;
    const { userId, videoType } = req.query;

    if (!userId) {
      return res.status(200).json({ status: false, message: "Oops ! Invalid details." });
    }

    const objectUserId = new mongoose.Types.ObjectId(userId);

    const matchFilter = {
      isActive: true,
      userId: objectUserId,
    };

    if (videoType !== undefined) {
      matchFilter.videoType = parseInt(videoType);
    }

    const [user, result] = await Promise.all([
      User.findOne({ _id: objectUserId, isActive: true }).select("isBlock").lean(),
      Video.aggregate([
        { $match: matchFilter },
        {
          $facet: {
            videos: [
              { $sort: { createdAt: -1 } },
              { $skip: (start - 1) * limit },
              { $limit: limit },

              {
                $lookup: {
                  from: "videocomments",
                  localField: "_id",
                  foreignField: "videoId",
                  pipeline: [{ $match: { recursiveCommentId: null, status: { $ne: "held" } } }], // held-for-review comments are not public
                  as: "totalComments",
                },
              },
              {
                $lookup: {
                  from: "likehistoryofvideos",
                  localField: "_id",
                  foreignField: "videoId",
                  pipeline: [{ $match: { userId: objectUserId } }, { $limit: 1 }],
                  as: "likeHistory",
                },
              },
              {
                $lookup: {
                  from: "watchhistories",
                  localField: "_id",
                  foreignField: "videoId",
                  as: "views",
                },
              },
              {
                $lookup: {
                  from: "videounlocks",
                  localField: "_id",
                  foreignField: "videoId",
                  pipeline: [{ $match: { userId: objectUserId } }, { $limit: 1 }],
                  as: "unlockData",
                },
              },
              {
                $addFields: {
                  isUnlocked: { $gt: [{ $size: "$unlockData" }, 0] },
                  storedPrivacyType: "$videoPrivacyType", // before the per-viewer recompute below
                  totalComments: { $size: "$totalComments" },
                  views: { $size: "$views" },
                },
              },
              {
                $project: {
                  _id: 1,
                  title: 1,
                  description: 1,
                  hashTag: 1,
                  location: 1,
                  videoType: 1,
                  videoTime: 1,
                  videoUrl: 1,
                  videoImage: 1,
                  scheduleType: 1,
                  scheduleTime: 1,
                  userId: 1,
                  channelId: 1,
                  videoPrivacyType: 1,
                  totalComments: 1,
                  views: 1,
                  createdAt: 1,
                },
              },
            ],

            totalCount: [{ $count: "count" }],
          },
        },

        {
          $project: {
            videos: 1,
            total: { $ifNull: [{ $arrayElemAt: ["$totalCount.count", 0] }, 0] },
          },
        },
      ]),
    ]);

    if (!user) {
      return res.status(200).json({ status: false, message: "User does not found." });
    }

    if (user.isBlock) {
      return res.status(200).json({ status: false, message: "you are blocked by admin." });
    }

    return res.status(200).json({
      status: true,
      message: "Retrieve videos for the user.",
      videos: result[0]?.videos || [],
      total: result[0]?.total || 0,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

// ── Cloudflare Stream webhook: a video finished transcoding ─────────────────
exports.streamWebhook = async (req, res) => {
  try {
    const parsed = videoPipeline.verifyWebhook({
      rawBody: Buffer.isBuffer(req.body) ? req.body : (req.rawBody || JSON.stringify(req.body || {})),
      headers: req.headers,
    });
    if (!parsed.valid) {
      console.warn("stream webhook rejected:", parsed.reason);
      return res.status(400).json({ status: false, message: parsed.reason });
    }
    if (!parsed.uid) return res.status(400).json({ status: false });
    const video = await Video.findOne({ streamUid: parsed.uid });
    if (!video) return res.status(200).json({ status: true });
    // An old queued callback must not replace a ready state.
    if (video.streamStatus === "ready" && !parsed.ready) return res.status(200).json({ status: true });

    const updates = {
      streamStatus: parsed.state || (parsed.ready ? "ready" : "inprogress"),
    };
    if (parsed.ready) {
      updates.hlsUrl = parsed.hlsUrl;
      updates.dashUrl = parsed.dashUrl;
      updates.videoUrl = parsed.hlsUrl;            // the app plays videoUrl
      updates.videoDuration = Math.round(parsed.duration || 0);
      if (parsed.duration) updates.videoTime = Math.round(parsed.duration);
      // Keep the creator-uploaded thumbnail on Firebase; Stream thumbnails
      // must not silently move non-video assets to a different provider.
    }
    await db.update("videos", video._id || video.id, updates);
    return res.status(200).json({ status: true });
  } catch (error) {
    console.error("streamWebhook error:", error.message);
    if (!res.headersSent) res.status(500).json({ status: false });
  }
};

// ── Poll a video's Stream transcode status (client fallback for the webhook) ──
exports.getStreamStatus = async (req, res) => {
  try {
    const videoId = req.query.videoId || (req.body && req.body.videoId);
    if (!videoId) return res.status(200).json({ status: false, message: "videoId is required." });
    const video = await Video.findById(videoId);
    if (!video || !video.streamUid) {
      return res.status(200).json({ status: false, message: "Video is not on Cloudflare Stream." });
    }
    if (video.streamStatus === "ready") {
      return res.status(200).json({ status: true, ready: true, streamStatus: "ready", hlsUrl: video.hlsUrl, videoDuration: video.videoDuration });
    }
    const s = await videoPipeline.getStatus(video.streamUid);
    if (s.ready) {
      await db.update("videos", video._id || video.id, {
        streamStatus: "ready",
        hlsUrl: s.hlsUrl, dashUrl: s.dashUrl, videoUrl: s.hlsUrl,
        videoDuration: Math.round(s.duration || 0),
        videoTime: Math.round(s.duration || video.videoTime || 0),
      });
    } else {
      await db.update("videos", video._id || video.id, { streamStatus: s.state || "inprogress" });
    }
    return res.status(200).json({
      status: true,
      ready: s.ready,
      streamStatus: s.state,
      hlsUrl: s.ready ? s.hlsUrl : null,
      videoDuration: Math.round(s.duration || 0),
    });
  } catch (error) {
    console.error("getStreamStatus error:", error.message);
    return res.status(200).json({ status: false, message: error.message });
  }
};

exports._internal = { discardOwnUpload };
