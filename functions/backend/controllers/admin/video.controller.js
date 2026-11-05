const db = require("../../util/connection");
const moment = require("moment");
const { generateUniqueVideoId } = require("../../util/generateUniqueVideoId");
const { deleteFromStorage } = require("../../util/storageHelper");
const firebaseSyncService = require("../../util/firebaseSync.service");

// upload (normal videos or shorts) by the admin
exports.uploadVideo = async (req, res) => {
  try {
    const media = require("../../util/mediaPolicy").videoLocation(req.body?.videoUrl, require("../../util/cloudflareStorage.service")._cfg());
    if (!media) return res.status(400).json({ status: false, code: "INVALID_VIDEO_PROVIDER", message: "Upload videos and bites to the configured Cloudflare storage first." });
    if (
      !req.body.title ||
      !req.body.description ||
      !req.body.hashTag ||
      !req.body.videoType ||
      !req.body.videoTime ||
      !req.body.visibilityType ||
      !req.body.audienceType ||
      !req.body.commentType ||
      !req.body.scheduleType ||
      !req.body.location ||
      !req.body.userId ||
      !req.body.channelId ||
      !req.body.videoUrl ||
      !req.body.videoImage
    ) {
      if (req.body.videoImage) await deleteFromStorage(req.body.videoImage);
      if (req.body.videoUrl) await deleteFromStorage(req.body.videoUrl);
      return res.status(200).json({ status: false, message: "Oops ! Invalid details!" });
    }

    const uniqueVideoId = await generateUniqueVideoId();
    const user = await db.findById("users", req.body.userId);

    if (!user) {
      if (req.body.videoImage) await deleteFromStorage(req.body.videoImage);
      if (req.body.videoUrl) await deleteFromStorage(req.body.videoUrl);
      return res.status(200).json({ status: false, message: "user does not found!" });
    }

    if (user.isBlock) {
      if (req.body.videoImage) await deleteFromStorage(req.body.videoImage);
      if (req.body.videoUrl) await deleteFromStorage(req.body.videoUrl);
      return res.status(200).json({ status: false, message: "you are blocked by the admin!" });
    }

    const videoId = "video_" + Date.now();
    const multiplehashTag = req.body.hashTag.toString().split(",");

    const videoData = {
      _id: videoId,
      title: req.body.title.trim(),
      description: req.body.description.trim(),
      videoType: Number(req.body.videoType),
      videoTime: String(req.body.videoTime),
      visibilityType: Number(req.body.visibilityType),
      audienceType: Number(req.body.audienceType),
      commentType: Number(req.body.commentType),
      videoUrl: req.body.videoUrl,
      ...media,
      videoImage: req.body.videoImage,
      isAddByAdmin: true,
      scheduleType: Number(req.body.scheduleType),
      scheduleTime: req.body.scheduleTime || "",
      location: req.body.location,
      locationCoordinates: {
        latitude: Number(req.body.latitude || 0),
        longitude: Number(req.body.longitude || 0),
      },
      userId: user._id,
      channelId: req.body.channelId,
      hashTag: multiplehashTag,
      uniqueVideoId: uniqueVideoId,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    await db.create("videos", videoData, videoId);
    await firebaseSyncService.syncMetadata("videos", videoId, videoData);

    return res.status(200).json({
      status: true,
      message: "Normal video or shorts has been uploaded by the admin!",
      video: videoData,
    });
  } catch (error) {
    console.error("uploadVideo Error:", error);
    return res.status(200).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

// update (normal videos or shorts) by the admin
exports.updateVideo = async (req, res) => {
  try {
    const { videoId } = req.query;
    if (!videoId) {
      return res.status(200).json({ status: false, message: "videoId is required!" });
    }

    const video = await db.findById("videos", videoId);
    if (!video) {
      return res.status(200).json({ status: false, message: "video does not found!" });
    }

    const updatedData = {
      title: req.body.title ? req.body.title.trim() : video.title,
      description: req.body.description ? req.body.description.trim() : video.description,
      visibilityType: req.body.visibilityType !== undefined ? Number(req.body.visibilityType) : video.visibilityType,
      audienceType: req.body.audienceType !== undefined ? Number(req.body.audienceType) : video.audienceType,
      commentType: req.body.commentType !== undefined ? Number(req.body.commentType) : video.commentType,
    };

    const result = await db.update("videos", videoId, updatedData);

    return res.status(200).json({
      status: true,
      message: "Video has been updated by admin!",
      video: result,
    });
  } catch (error) {
    console.error("updateVideo Error:", error);
    return res.status(200).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

// delete (normal videos or shorts) by admin (multiple or single)
exports.deleteVideo = async (req, res) => {
  try {
    const { videoId } = req.query || {};
    if (!videoId) {
      return res.status(200).json({ status: false, message: "videoId must be required!" });
    }

    const videoIds = videoId.split(",");
    await Promise.all(videoIds.map((id) => db.delete("videos", id.trim())));

    return res.status(200).json({
      status: true,
      message: "Video has been deleted by the admin.",
    });
  } catch (error) {
    console.error("deleteVideo Error:", error);
    return res.status(200).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

// get all normal videos or shorts
exports.videosOrShorts = async (req, res) => {
  try {
    const start = Math.max(parseInt(req.query.start) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit) || 20, 1);
    const videoType = req.query.videoType ? Number(req.query.videoType) : null;
    const search = req.query.search?.trim().toLowerCase();

    let videos = await db.find("videos");
    let users = await db.find("users");
    const userMap = new Map((users || []).map((u) => [String(u._id || u.id), u]));

    videos = videos.map((v) => {
      const u = userMap.get(String(v.userId)) || {};
      return {
        ...v,
        uniqueVideoId: v.uniqueVideoId || v._id || "-",
        fullName: v.fullName || u.fullName || u.name || v.channelName || "Unknown User",
        nickName: v.nickName || u.name || v.channelName || "User",
        uniqueId: v.uniqueId || u.referralCode || u._id || v.userId || "-",
        image: v.image || u.image || v.channelImage || "",
      };
    });

    if (videoType) {
      videos = videos.filter((v) => Number(v.videoType) === videoType);
    }

    if (search) {
      videos = videos.filter(
        (v) =>
          (v.title && v.title.toLowerCase().includes(search)) ||
          (v.uniqueVideoId && v.uniqueVideoId.toLowerCase().includes(search)) ||
          (v.channelId && v.channelId.toLowerCase().includes(search)) ||
          (v.fullName && v.fullName.toLowerCase().includes(search))
      );
    }

    videos.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    const total = videos.length;
    const paginated = videos.slice((start - 1) * limit, start * limit);

    return res.status(200).json({
      status: true,
      message: "Retrived videoType wise videos or shorts for admin!",
      totalVideosOrShorts: total,
      videosOrShorts: paginated,
    });
  } catch (error) {
    console.error("videosOrShorts Error:", error);
    return res.status(200).json({
      status: true,
      message: "Retrived videos or shorts for admin",
      totalVideosOrShorts: 0,
      videosOrShorts: [],
    });
  }
};
