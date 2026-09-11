const express = require("express");
const route = express.Router();
const checkAccess = require("../../checkAccess");
const partnerController = require("../../controllers/client/partner.controller");

// Digital Partner Program (TRS). Verification/fulfilment reuse the payment
// flow — see POST /client/payment/verify + payment.controller.fulfilDigitalPartnerLicense.
route.post("/upgrade", checkAccess(), partnerController.upgrade);
route.get("/dashboard", checkAccess(), partnerController.getDashboard);

module.exports = route;
