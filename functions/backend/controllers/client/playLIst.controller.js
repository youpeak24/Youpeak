const PlayList = require("../../models/playList.model");

//import model
const User = require("../../models/user.model");
const Video = require("../../models/video.model");

const db = require("../../util/connection");
const visibility = require("../../util/videoVisibility");
const firebaseAdmin = require("../../util/firebaseAdmin");

// PLAYLIST_TYPE: 1 private (owner only), 2 public.
const PLAYLIST_TYPES = [1, 2];
const NAME_MAX = 100;
const MAX_VIDEOS = 500;

const toIdList = (raw) => {
  const list = Array.isArray(raw) ? raw : String(raw || "").split(",");
  return [...new Set(list.map((x) => String((x && (x._id || x)) || "").trim()).filter(Boolean))];
};

// Videos the caller may put in a playlist: ones they can open (public,
// unlisted, or their own) — not someone else's private or held upload.
async function viewableVideoIds(ids, userId) {
  const videos = await Video.find({ _id: { $in: ids } }).lean();
  const ok = new Set(videos.filter((v) => visibility.canView(v, userId)).map((v) => String(v._id || v.id)));
  return ids.filter((id) => ok.has(id));
}

function validateName(name) {
  const n = String(name || "").trim().replace(/\s+/g, " ");
  if (!n) return { ok: false, code: "PLAYLIST_NAME_REQUIRED", message: "Give the playlist a name." };
  if (n.length > NAME_MAX) return { ok: false, code: "PLAYLIST_NAME_TOO_LONG", message: `Playlist names can be at most ${NAME_MAX} characters.` };
  return { ok: true, name: n };
}

async function loadPlaylistWithVideos(id) {
  return PlayList.findById(id).populate({ path: "videoId", select: "title videoImage videoUrl" }).lean();
}

async function activeUser(userId) {
  return User.findOne({ _id: userId, isActive: true }).select("_id isBlock channelId").lean();
}

//user wise new playList (any signed-in user; it belongs to their own profile/channel)
exports.newPlayList = async (req, res) => {
  try {
    const { userId, videoId, playListName, playListType } = req.body || {};
    if (!userId) return res.status(200).json({ status: false, message: "Oops! Invalid details!" });

    const name = validateName(playListName);
    if (!name.ok) return res.status(200).json({ status: false, code: name.code, message: name.message });
    const type = Number(playListType ?? 1);
    if (!PLAYLIST_TYPES.includes(type)) return res.status(200).json({ status: false, code: "PLAYLIST_TYPE_INVALID", message: "Choose Private or Public." });

    const user = await activeUser(userId);
    if (!user) return res.status(200).json({ status: false, message: "User not found!" });
    if (user.isBlock) return res.status(200).json({ status: false, message: "You are blocked by admin!" });

    const ids = toIdList(videoId);
    if (ids.length > MAX_VIDEOS) return res.status(200).json({ status: false, message: `A playlist can hold at most ${MAX_VIDEOS} videos.` });
    const valid = await viewableVideoIds(ids, userId);
    if (valid.length !== ids.length) {
      return res.status(200).json({ status: false, code: "VIDEO_NOT_FOUND", message: "One or more videos not found!" });
    }

    // A retry / double tap within 30 s with the same name returns the first
    // playlist instead of creating a second one.
    const recent = (await PlayList.find({ userId: String(userId) }).lean())
      .find((p) => String(p.playListName).toLowerCase() === name.name.toLowerCase() && Date.now() - Date.parse(p.createdAt || 0) < 30000);
    if (recent) {
      return res.status(200).json({ status: true, duplicate: true, message: "Playlist created successfully!", playList: await loadPlaylistWithVideos(recent._id) });
    }

    // The playlist belongs to the caller's own profile (channelId = userId),
    // whatever channelId the request names.
    const playList = await PlayList.create({
      userId: String(user._id),
      channelId: String(user.channelId || user._id),
      playListName: name.name,
      playListType: type,
      videoId: valid,
    });

    return res.status(200).json({
      status: true,
      message: "Playlist created successfully!",
      playList: await loadPlaylistWithVideos(playList._id),
    });
  } catch (error) {
    console.error("newPlayList error:", error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

//user wise update playlist: rename, privacy, add/remove videos (owner only)
exports.updatePlayList = async (req, res) => {
  try {
    const { userId, playListId, playListName, playListType, videoId = [], type } = req.body || {};
    if (!userId || !playListId) return res.status(200).json({ status: false, message: "Invalid details!" });

    const user = await activeUser(userId);
    if (!user) return res.status(200).json({ status: false, message: "User not found!" });
    if (user.isBlock) return res.status(200).json({ status: false, message: "You are blocked by admin." });

    const existing = await PlayList.findOne({ _id: String(playListId), userId: String(userId) }).lean();
    if (!existing) return res.status(200).json({ status: false, message: "Playlist not found." });

    const set = {};
    if (playListName !== undefined) {
      const name = validateName(playListName);
      if (!name.ok) return res.status(200).json({ status: false, code: name.code, message: name.message });
      set.playListName = name.name;
    }
    if (playListType !== undefined) {
      const t = Number(playListType);
      if (!PLAYLIST_TYPES.includes(t)) return res.status(200).json({ status: false, code: "PLAYLIST_TYPE_INVALID", message: "Choose Private or Public." });
      set.playListType = t;
    }

    const ids = toIdList(videoId);
    const FieldValue = firebaseAdmin.firestore.FieldValue;
    if (ids.length) {
      if (type === "add") {
        const valid = await viewableVideoIds(ids, userId);
        if (valid.length !== ids.length) return res.status(200).json({ status: false, code: "VIDEO_NOT_FOUND", message: "Some videoIds are invalid or inactive." });
        if ((existing.videoId || []).length + ids.length > MAX_VIDEOS) return res.status(200).json({ status: false, message: `A playlist can hold at most ${MAX_VIDEOS} videos.` });
        set.videoId = FieldValue.arrayUnion(...valid);
      } else if (type === "remove") {
        set.videoId = FieldValue.arrayRemove(...ids);
      } else {
        return res.status(200).json({ status: false, message: "Type must be 'add' or 'remove'." });
      }
    }

    if (!Object.keys(set).length) return res.status(200).json({ status: false, message: "No fields provided to update." });

    // arrayUnion/arrayRemove are applied by Firestore atomically: adding and
    // removing at the same time from two tabs can't lose either change, and
    // repeating a request changes nothing.
    set.updatedAt = new Date().toISOString();
    await db.withTimeout(db.getDb().collection(db.normalizeCollectionName("PlayList")).doc(String(existing._id)).update(set));

    return res.status(200).json({
      status: true,
      message: "Playlist updated successfully.",
      playList: await loadPlaylistWithVideos(existing._id),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

//user wise delete playlist (owner only; deleting twice is not an error)
exports.deletePlayList = async (req, res) => {
  try {
    const { userId } = req.body || {};
    const playListId = (req.body && req.body.playListId) || req.query.playListId;
    if (!userId || !playListId) return res.status(200).json({ status: false, message: "Invalid details!" });

    const user = await activeUser(userId);
    if (!user) return res.status(200).json({ status: false, message: "User not found!" });
    if (user.isBlock) return res.status(200).json({ status: false, message: "You are blocked by admin." });

    const playList = await db.findById(db.normalizeCollectionName("PlayList"), String(playListId));
    if (!playList) return res.status(200).json({ status: true, deleted: false, message: "Playlist already deleted." });
    if (String(playList.userId) !== String(userId)) return res.status(200).json({ status: false, message: "Playlist not found." });

    await db.delete(db.normalizeCollectionName("PlayList"), String(playListId));
    return res.status(200).json({ status: true, deleted: true, message: "Playlist deleted successfully." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};
