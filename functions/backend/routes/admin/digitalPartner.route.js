const express = require("express");
const route = express.Router();
const digitalPartner = require("../../controllers/admin/digitalPartner.controller");

route.get("/list", digitalPartner.list);
route.post("/activate", digitalPartner.activate);
route.post("/regeneratePassword", digitalPartner.regeneratePassword);

module.exports = route;
