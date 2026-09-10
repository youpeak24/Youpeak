const express = require("express");
const route = express.Router();
const checkAccess = require("../../checkAccess");
const paymentController = require("../../controllers/client/payment.controller");

route.post("/createOrder", checkAccess(), paymentController.createOrder);
route.post("/verify", checkAccess(), paymentController.verify);
route.get("/status", checkAccess(), paymentController.status);

module.exports = route;
