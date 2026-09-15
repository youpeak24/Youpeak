const express = require("express");
const route = express.Router();
const creatorFunding = require("../../controllers/admin/creatorFunding.controller");

route.get("/list", creatorFunding.list);
route.post("/forceCancel", creatorFunding.forceCancel);

module.exports = route;
