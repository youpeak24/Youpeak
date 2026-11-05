//express
const express = require("express");
const route = express.Router();
const bindAppUser = require("../../middleware/bindAppUser.middleware");
const optionalAppUser = require("../../middleware/optionalAppUser.middleware");

//checkAccessWithSecretKey
const checkAccessWithSecretKey = require("../../checkAccess");
const retiredPaymentEndpoint = require("../../middleware/retiredPaymentEndpoint");

//controller
const premiumPlanController = require("../../controllers/client/premiumPlan.controller");

//get all premiumPlan for
route.get("/", optionalAppUser(), premiumPlanController.index);

//when user purchase the premiumPlan create premiumPlan history by user
// PAY-1: retired. It activated a premium plan with no payment at all.
// Purchases go through client/payment/createOrder + verify.
route.post("/createHistory", retiredPaymentEndpoint);

//get premiumPlanHistory of particular user (user)
route.get("/planHistoryOfUser", bindAppUser(), premiumPlanController.planHistoryOfUser);

//get coinPlanHistory of particular user (user)
route.get("/fetchCoinplanHistoryOfUser", bindAppUser(), premiumPlanController.fetchCoinplanHistoryOfUser);

//purchase plan through stripe ( web )
route.post("/handleStripePaymentForPremiumPlan", bindAppUser(), premiumPlanController.handleStripePaymentForPremiumPlan);

module.exports = route;
