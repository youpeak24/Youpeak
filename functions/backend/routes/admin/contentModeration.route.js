const express = require("express");
const route = express.Router();
const contentModerationController = require("../../controllers/admin/contentModeration.controller");
const checkAccess = require("../../checkAccess");

// Moderation Queue
route.get("/queue", checkAccess(), contentModerationController.getModerationQueue);
route.post("/moderate", checkAccess(), contentModerationController.moderateVideo);

// Keyword Blacklist
route.get("/keywords", checkAccess(), contentModerationController.getKeywords);
route.post("/keywords/add", checkAccess(), contentModerationController.addKeyword);
route.delete("/keywords/delete", checkAccess(), contentModerationController.deleteKeyword);

module.exports = route;
