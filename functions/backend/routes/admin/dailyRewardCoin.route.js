const express = require("express");
const route = express.Router();

//checkAccessWithSecretKey
const checkAccessWithSecretKey = require("../../checkAccess");

//controller
const dailyRewardCoinController = require("../../controllers/admin/dailyRewardCoin.controller");

route.post("/storeDailyReward", checkAccessWithSecretKey(), dailyRewardCoinController.storeDailyReward);

route.patch("/updateDailyReward", checkAccessWithSecretKey(), dailyRewardCoinController.updateDailyReward);

route.get("/getDailyReward", checkAccessWithSecretKey(), dailyRewardCoinController.getDailyReward);

route.delete("/deleteDailyReward", checkAccessWithSecretKey(), dailyRewardCoinController.deleteDailyReward);

module.exports = route;
