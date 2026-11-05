//express
const express = require("express");
const route = express.Router();
const optionalAppUser = require("../../middleware/optionalAppUser.middleware");
const bindAppUser = require("../../middleware/bindAppUser.middleware");

const checkAccessWithSecretKey = require("../../checkAccess");

// ── Firestore controllers (login, signup, profile) ──
const FirestoreUserCtrl = require("../../controllers/client/userFirestore.controller");

// ── Legacy controller for all other endpoints ──
const UserController = require("../../controllers/client/user.controller");

// user login or sign up  ← FIRESTORE
route.post("/login", checkAccessWithSecretKey(), FirestoreUserCtrl.store);

// check the user is exists or not for loginType 4  ← FIRESTORE
route.post("/checkUser", checkAccessWithSecretKey(), FirestoreUserCtrl.checkUser);

// get user profile who login  ← FIRESTORE
route.get("/profile", bindAppUser(), FirestoreUserCtrl.getProfile);

// update profile of the user (when user login or signUp)  ← FIRESTORE
route.patch("/updateProfile", bindAppUser(), FirestoreUserCtrl.updateProfile);

//check referral code is valid and apply referral code by user
route.patch("/validateAndApplyReferralCode", bindAppUser(), UserController.validateAndApplyReferralCode);

//earn coin from watching ad
route.patch("/handleAdWatchReward", bindAppUser(), UserController.handleAdWatchReward);

//earn coin from engagement video reward
route.patch("/handleEngagementVideoWatchReward", bindAppUser(), UserController.handleEngagementVideoWatchReward);

//update details of the channel (create your channel button)
route.patch("/update", bindAppUser(), UserController.update);

//update password
route.patch("/updatePassword", bindAppUser(), UserController.updatePassword);

//set password
route.post("/setPassword", checkAccessWithSecretKey(), UserController.setPassword);

//get particular channel's details (home page)
route.get("/detailsOfChannel", optionalAppUser(), UserController.detailsOfChannel);

//get particular's channel's videoType wise videos (videos, shorts) (your videos)
route.get("/videosOfChannel", optionalAppUser(), UserController.videosOfChannel);

//get particular's channel's playLists
route.get("/playListsOfChannel", optionalAppUser(), UserController.playListsOfChannel);

//get particular playList's videos
route.get("/getPlayListVideos", optionalAppUser(), UserController.getPlayListVideos);

//get particular channel's about
route.get("/aboutOfChannel", optionalAppUser(), UserController.aboutOfChannel);

//search channel for user
route.post("/searchChannel", optionalAppUser(), UserController.searchChannel);

//delete user account
route.delete("/deleteUserAccount", bindAppUser(), UserController.deleteUserAccount);

//get referral history of particular user
route.get("/loadReferralHistoryByUser", bindAppUser(), UserController.loadReferralHistoryByUser);

//get coin history of particular user
route.get("/retriveCoinHistoryByUser", bindAppUser(), UserController.retriveCoinHistoryByUser);

//get wallet history of particular user
route.get("/fetchWalletHistoryByUser", bindAppUser(), UserController.fetchWalletHistoryByUser);

module.exports = route;
