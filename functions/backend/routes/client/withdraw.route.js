//express
const express = require("express");
const route = express.Router();

const checkAccessWithSecretKey = require("../../checkAccess");

//controller
const WithdrawController = require("../../controllers/client/withdraw.controller");

//get withdraw method added by admin
route.get("/withdrawList", checkAccessWithSecretKey(), WithdrawController.withdrawList);

module.exports = route;
