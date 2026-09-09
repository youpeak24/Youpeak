const express = require("express");
const route = express.Router();
const paymentController = require("../../controllers/client/payment.controller");

route.get("/list", paymentController.adminList);
route.post("/markPaid", paymentController.adminMarkPaid);

module.exports = route;
