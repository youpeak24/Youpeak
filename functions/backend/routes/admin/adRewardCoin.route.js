const express = require("express");
const route = express.Router();

//checkAccessWithSecretKey
const checkAccessWithSecretKey = require("../../checkAccess");

//controller
const adRewardCoinController = require("../../controllers/admin/adRewardCoin.controoler");

route.post("/storeAdReward", checkAccessWithSecretKey(), adRewardCoinController.storeAdReward);

route.patch("/updateAdReward", checkAccessWithSecretKey(), adRewardCoinController.updateAdReward);

route.get("/getAdReward", checkAccessWithSecretKey(), adRewardCoinController.getAdReward);

route.delete("/deleteAdReward", checkAccessWithSecretKey(), adRewardCoinController.deleteAdReward);

module.exports = route;
