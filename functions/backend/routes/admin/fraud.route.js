const express = require("express");
const route = express.Router();

const FraudController = require("../../controllers/admin/fraud.controller");

route.get("/getAlerts", FraudController.getAlerts);
route.post("/toggleUserRestriction", FraudController.toggleUserRestriction);

module.exports = route;
