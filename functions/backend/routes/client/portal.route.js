const express = require("express");
const route = express.Router();
const checkAccess = require("../../checkAccess");
const portalController = require("../../controllers/client/portal.controller");

// Public prices + payment availability for the web membership portal.
route.get("/catalog", checkAccess(), portalController.catalog);

module.exports = route;
