const express = require("express");
const route = express.Router();
const digitalPartner = require("../../controllers/admin/digitalPartner.controller");

route.get("/list", digitalPartner.list);
route.get("/detail", digitalPartner.detail);
route.get("/report", digitalPartner.report);
route.patch("/status", digitalPartner.setStatus);
route.patch("/assignAgency", digitalPartner.assignAgency);
route.post("/regeneratePassword", digitalPartner.regeneratePassword);

module.exports = route;
