const express = require("express");
const route = express.Router();
const bindAppUser = require("../../middleware/bindAppUser.middleware");

//checkAccessWithSecretKey
const checkAccessWithSecretKey = require("../../checkAccess");

//controller
const adRewardCoinController = require("../../controllers/client/adRewardCoin.controller");

// get ad reward coin by user
route.get("/getAdRewardByUser", bindAppUser(), adRewardCoinController.getAdRewardByUser);

module.exports = route;
