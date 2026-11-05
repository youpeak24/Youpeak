const express = require("express");
const route = express.Router();
const bindAppUser = require("../../middleware/bindAppUser.middleware");

//checkAccessWithSecretKey
const checkAccessWithSecretKey = require("../../checkAccess");

//controller
const dailyRewardCoinController = require("../../controllers/client/dailyRewardCoin.controller");

//get daily reward coin
route.get("/getDailyRewardCoinByUser", bindAppUser(), dailyRewardCoinController.getDailyRewardCoinByUser);

//earn coin from daily check In
route.patch("/handleDailyCheckInReward", bindAppUser(), dailyRewardCoinController.handleDailyCheckInReward);

module.exports = route;
