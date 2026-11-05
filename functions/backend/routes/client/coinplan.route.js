const express = require("express");
const route = express.Router();
const bindAppUser = require("../../middleware/bindAppUser.middleware");
const optionalAppUser = require("../../middleware/optionalAppUser.middleware");

//Controller
const coinplanController = require("../../controllers/client/coinplan.controller");

//checkAccessWithSecretKey
const checkAccessWithSecretKey = require("../../checkAccess");
const retiredPaymentEndpoint = require("../../middleware/retiredPaymentEndpoint");

//get coinplan
route.get("/retriveCoinplanByUser", optionalAppUser(), coinplanController.retriveCoinplanByUser);

//when user purchase the coinPlan create coinPlan history by user
// PAY-1: retired. It credited coins for any valid gateway signature without
// tying the payment to the plan (and replays raced). Purchases go through
// client/payment/createOrder + verify (server-side order state machine).
route.post("/createCoinPlanHistory", retiredPaymentEndpoint);

//purchase plan through stripe ( web )
route.post("/handleStripePayment", bindAppUser(), coinplanController.handleStripePayment);

//integrate razorpay's order creation ( web )
// PAY-1: retired (multiplied a client-supplied amount).
route.post("/processRazorpayPayment", retiredPaymentEndpoint);

module.exports = route;
