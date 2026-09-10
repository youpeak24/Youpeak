const express = require("express");
const route = express.Router();
const checkAccess = require("../../checkAccess");
const grievance = require("../../controllers/client/grievance.controller");

// Public Grievance Officer details (IT Rules 2021)
route.get("/", grievance.getOfficer);

route.post("/file", checkAccess(), grievance.fileGrievance);
route.get("/track", checkAccess(), grievance.trackGrievance);

module.exports = route;
