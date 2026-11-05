//express
const express = require("express");
const route = express.Router();
const optionalAppUser = require("../../middleware/optionalAppUser.middleware");

const checkAccessWithSecretKey = require("../../checkAccess");
const bindAppUser = require("../../middleware/bindAppUser.middleware");

//controller
const VideoCommentController = require("../../controllers/client/videoComment.controller");

//create user wise comment for video
// F-18: bindAppUser() extracts identity from the Firebase token so the
// controller must NOT trust req.body.userId / req.query.userId for auth.
route.post("/createComment", checkAccessWithSecretKey(), bindAppUser(), VideoCommentController.createComment);

//create like or dislike for comment
// F-18: same token-binding for like/dislike identity
route.post("/likeOrDislike", checkAccessWithSecretKey(), bindAppUser(), VideoCommentController.likeOrDislike);

//get commentType wise all comments for particular video (top, mostLiked, newest)
route.get("/getComments", optionalAppUser(), VideoCommentController.getComments);

//create user wise reply to particular comment of particular video
// F-18: same token-binding for reply identity
route.post("/createCommentReply", checkAccessWithSecretKey(), bindAppUser(), VideoCommentController.createCommentReply);

//get all replies for particular comment
route.get("/repliesOfVideoComment", optionalAppUser(), VideoCommentController.repliesOfVideoComment);

//delete own comment, or any comment on own video
route.delete("/deleteComment", bindAppUser(), VideoCommentController.deleteComment);

module.exports = route;
