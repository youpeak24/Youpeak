const express = require("express");
const route = express.Router();
const bindAppUser = require("../../middleware/bindAppUser.middleware");

const checkAccessWithSecretKey = require("../../checkAccess");

const WithdrawalRequestController = require("../../controllers/client/withDrawalRequest.controller");

//get setting details
route.get("/fetchSettingDetails", bindAppUser(), WithdrawalRequestController.fetchSettingDetails);

//convert coin into amount at a time wallet history created and coin has been deducted (in default currency)
route.get("/coinToAmountConverter", bindAppUser(), WithdrawalRequestController.coinToAmountConverter);

//withdraw request made by particular user
route.post("/createWithdrawRequest", bindAppUser(), WithdrawalRequestController.createWithdrawRequest);

//get all withdraw request by particular user
route.get("/getWithdrawRequests", bindAppUser(), WithdrawalRequestController.getWithdrawRequests);

module.exports = route;
