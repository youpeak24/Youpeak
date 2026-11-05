const express = require("express");
const route = express.Router();

const AgencyReportController = require("../../controllers/admin/agencyReport.controller");

route.get("/getAgencyReport", AgencyReportController.getAgencyReport);
route.get("/getDigitalPartners", AgencyReportController.getDigitalPartners);

module.exports = route;
