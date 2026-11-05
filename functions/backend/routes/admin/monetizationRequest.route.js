const express = require("express");
const route = express.Router();

const checkAccessWithSecretKey = require("../../checkAccess");

const MonetizationRequestController = require("../../controllers/admin/monetizationRequest.controller");

//get all monetization requests
route.get("/getAllMonetizationRequests", checkAccessWithSecretKey(), MonetizationRequestController.getAllMonetizationRequests);

//accept or decline monetization request
route.patch("/handleMonetizationRequest", checkAccessWithSecretKey(), MonetizationRequestController.handleMonetizationRequest);

module.exports = route;
