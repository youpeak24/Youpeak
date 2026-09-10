const express = require("express");
const route = express.Router();
const grievance = require("../../controllers/client/grievance.controller");

route.get("/list", grievance.adminList);
route.post("/resolve", grievance.adminResolve);

module.exports = route;
