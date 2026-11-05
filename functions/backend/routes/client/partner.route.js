const express = require("express");
const route = express.Router();
const bindAppUser = require("../../middleware/bindAppUser.middleware");
const checkAccess = require("../../checkAccess");
const partnerController = require("../../controllers/client/partner.controller");

// Digital Partner Program (TRS). Verification/fulfilment reuse the payment
// flow — see POST /client/payment/verify + payment.controller.fulfilDigitalPartnerLicense.
route.post("/upgrade", bindAppUser(), partnerController.upgrade);
route.get("/dashboard", bindAppUser(), partnerController.getDashboard);

module.exports = route;
