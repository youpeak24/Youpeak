//express
const express = require("express");
const route = express.Router();

const checkAccessWithSecretKey = require("../../checkAccess");

//controller
const ReportController = require("../../controllers/admin/report.controller");

//get all reports of the video or shorts
route.get("/getReports", checkAccessWithSecretKey(), ReportController.getReports);

//delete reports of the video by admin (multiple or single)
route.delete("/deleteVideoReport", checkAccessWithSecretKey(), ReportController.deleteVideoReport);

module.exports = route;
