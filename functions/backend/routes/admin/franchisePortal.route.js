const express = require("express");
const route = express.Router();

const franchisePortal = require("../../controllers/admin/franchisePortal.controller");

route.get("/dashboard", franchisePortal.dashboard);
route.get("/partners", franchisePortal.listPartners);
route.post("/partners/create", franchisePortal.createPartner);
route.get("/partners/detail", franchisePortal.partnerDetail);
route.patch("/partners/update", franchisePortal.updatePartner);
route.patch("/partners/status", franchisePortal.setPartnerStatus);
route.delete("/partners/remove", franchisePortal.removePartner);
route.get("/referrals", franchisePortal.referrals);

module.exports = route;
