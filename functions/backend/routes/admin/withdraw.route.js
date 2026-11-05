//express
const express = require("express");
const route = express.Router();

const checkAccessWithSecretKey = require("../../checkAccess");

//controller
const WithdrawController = require("../../controllers/admin/withdraw.controller");

//store Withdraw
route.post("/create", checkAccessWithSecretKey(), WithdrawController.store);

//update Withdraw
route.patch("/update", checkAccessWithSecretKey(), WithdrawController.update);

//get Withdraw
route.get("/", checkAccessWithSecretKey(), WithdrawController.get);

//delete Withdraw
route.delete("/delete", checkAccessWithSecretKey(), WithdrawController.delete);

//handle isEnabled switch
route.patch("/handleSwitch", checkAccessWithSecretKey(), WithdrawController.handleSwitch);

module.exports = route;
