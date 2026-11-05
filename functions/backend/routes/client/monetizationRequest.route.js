const express = require("express");
const route = express.Router();
const bindAppUser = require("../../middleware/bindAppUser.middleware");

const checkAccessWithSecretKey = require("../../checkAccess");

const MonetizationRequestController = require("../../controllers/client/monetizationRequest.controller");

//Monetization request made by particular user
route.post("/createMonetizationRequest", bindAppUser(), MonetizationRequestController.createMonetizationRequest);

//get monetization for the particular user (after monetiization on)
route.get("/getMonetizationForUser", bindAppUser(), MonetizationRequestController.getMonetizationForUser);

//get minimum criteria and actual result of particular user (check monetization for user)
route.get("/getMonetization", bindAppUser(), MonetizationRequestController.getMonetization);

module.exports = route;
