//express
const express = require("express");
const route = express.Router();
const optionalAppUser = require("../../middleware/optionalAppUser.middleware");
const bindAppUser = require("../../middleware/bindAppUser.middleware");

const checkAccessWithSecretKey = require("../../checkAccess");

//controller
const videoController = require("../../controllers/client/video.controller");
const requireAppUser = require("../../middleware/appUser.middleware");
const db = require("../../util/connection");

// Scheduled uploads become public at their time (throttled, see util/scheduledPublish).
route.use(require("../../util/scheduledPublish").middleware);
function bindUser(req, _res, next) {
  req.body = { ...req.body, userId: req.appUserId };
  req.query.userId = req.appUserId;
  next();
}
async function requireOwner(req, res, next) {
  try {
    const video = await db.findById("videos", req.query.videoId);
    if (!video || String(video.userId?._id || video.userId || "") !== req.appUserId) return res.status(403).json({ status: false, message: "You can only change your own videos." });
    return next();
  } catch (error) { return next(error); }
}

//video Unlocked
route.post("/unlockPrivateVideo", bindAppUser(), videoController.unlockPrivateVideo);

//channel name verify when upload viodeo or shorts
// A browser cannot send a body with a GET, so the name is also read from the
// query string; the caller (when signed in) may keep a name they already own.
route.get("/verifyChannelname", optionalAppUser(), videoController.verifyChannelname);
route.post("/verifyChannelname", optionalAppUser(), videoController.verifyChannelname);

//upload (normal videos or shorts) by the user
route.post("/createVideo", requireAppUser(), bindUser, videoController.createVideo);

//poll cloudflare stream transcode status
route.get("/streamStatus", checkAccessWithSecretKey(), videoController.getStreamStatus);

//when user share (normal videos or shorts) then shareCount increased
route.post("/shareCount", optionalAppUser(), videoController.shareCount);

//get shorts from home page directly
route.get("/shortsOfUser", optionalAppUser(), videoController.shortsOfUser);

//get all shorts for user (shorts)
route.get("/getShorts", optionalAppUser(), videoController.getShorts);

//get all normal videos for user (home)
route.get("/getVideos", optionalAppUser(), videoController.getVideos);

//get channel details of shorts for user
route.get("/channeldetailsOfShorts", optionalAppUser(), videoController.channeldetailsOfShorts);

//get all (normal videos or shorts) for user (home)
route.get("/videosOfHome", optionalAppUser(), videoController.videosOfHome);

//get particular normal video's details for user
route.get("/detailsOfVideo", optionalAppUser(), videoController.detailsOfVideo);

//create like or dislike for video (normal videos or shorts)
route.post("/likeOrDislikeOfVideo", bindAppUser(), videoController.likeOrDislikeOfVideo);

//get all more like this (normal videos or shorts)
route.get("/getAllLikeThis", optionalAppUser(), videoController.getAllLikeThis);

//search (normal videos or shorts) for user
route.post("/search", optionalAppUser(), videoController.search);

//previous search (normal videos or shorts) for user
route.get("/searchData", bindAppUser(), videoController.searchData);

//search shorts for user
route.post("/searchShorts", optionalAppUser(), videoController.searchShorts);

//type wise searching (All OR videos OR shorts)
route.post("/searchChannelVideoShortsByUser", optionalAppUser(), videoController.searchChannelVideoShortsByUser);

//clear all searchHistory for particular user
route.delete("/clearAllSearchHistory", bindAppUser(), videoController.clearAllSearchHistory);

//update (normal videos or shorts) by user
route.patch("/modifyVideo", requireAppUser(), bindUser, requireOwner, videoController.modifyVideo);

//delete (normal videos or shorts) by user
route.delete("/deleteVideoRecord", requireAppUser(), bindUser, requireOwner, videoController.deleteVideoRecord);

//get top 10 videos based on views
route.get("/getTopViewedVideos", bindAppUser(), videoController.getTopViewedVideos);

//get all normal videos for user (at the time of added to playlist or watch later or history)
route.get("/getVideoList", optionalAppUser(), videoController.getVideoList);

//get own videos/shorts
route.get("/getUserVideos", bindAppUser(), videoController.getUserVideos);

module.exports = route;
