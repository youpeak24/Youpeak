//express
const express = require("express");
const route = express.Router();
const bindAppUser = require("../../middleware/bindAppUser.middleware");

const checkAccessWithSecretKey = require("../../checkAccess");

//controller
const ReportController = require("../../controllers/client/report.controller");

//when user report the video
route.post("/reportToVideo", bindAppUser(), ReportController.reportToVideo);

module.exports = route;
