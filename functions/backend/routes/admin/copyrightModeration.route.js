const express = require("express");
const route = express.Router();
const copyrightModerationController = require("../../controllers/admin/copyrightModeration.controller");
const checkAccess = require("../../checkAccess");

route.get("/flagged", checkAccess(), copyrightModerationController.getFlaggedContent);
route.post("/action", checkAccess(), copyrightModerationController.actionOnFlaggedContent);

module.exports = route;
