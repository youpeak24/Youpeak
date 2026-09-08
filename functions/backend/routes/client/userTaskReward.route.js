const express = require("express");
const route = express.Router();
const checkAccess = require("../../checkAccess");
const userTaskRewardController = require("../../controllers/client/userTaskReward.controller");

route.post("/like", checkAccess(), userTaskRewardController.rewardVideoLike);
route.post("/comment", checkAccess(), userTaskRewardController.rewardVideoComment);
route.post("/adWatch", checkAccess(), userTaskRewardController.rewardAdWatch);
route.get("/status", checkAccess(), userTaskRewardController.getDailyEarningStatus);
// Watch-time milestone: 500 Coins after 2 hours (120 min) daily engagement (Per YP-TC-2026-FINAL)
route.post("/watchTimeMilestone", checkAccess(), userTaskRewardController.checkWatchTimeMilestone);

module.exports = route;
