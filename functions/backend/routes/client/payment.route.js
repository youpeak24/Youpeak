const express = require("express");
const route = express.Router();
const bindAppUser = require("../../middleware/bindAppUser.middleware");
const checkAccess = require("../../checkAccess");
const optionalAppUser = require("../../middleware/optionalAppUser.middleware");
const paymentController = require("../../controllers/client/payment.controller");

route.post("/createOrder", bindAppUser(), paymentController.createOrder);
route.post("/verify", checkAccess(), paymentController.verify);
// Signed-in callers only ever see their own orders.
route.get("/status", optionalAppUser(), paymentController.status);

module.exports = route;
