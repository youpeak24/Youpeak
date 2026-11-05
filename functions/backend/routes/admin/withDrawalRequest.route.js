const express = require("express");
const route = express.Router();

const checkAccessWithSecretKey = require("../../checkAccess");

const WithdrawalRequestController = require("../../controllers/admin/withDrawalRequest.controller");

route.get("/", checkAccessWithSecretKey(), WithdrawalRequestController.index);

route.patch("/accept", checkAccessWithSecretKey(), WithdrawalRequestController.acceptWithdrawalRequest);

route.patch("/decline", checkAccessWithSecretKey(), WithdrawalRequestController.declineWithdrawalRequest);

module.exports = route;
