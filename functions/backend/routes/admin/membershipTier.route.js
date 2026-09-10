const express = require("express");
const route = express.Router();

const MembershipTierController = require("../../controllers/admin/membershipTier.controller");

route.post("/store", MembershipTierController.store);
route.get("/getTiers", MembershipTierController.getTiers);
route.delete("/destroy", MembershipTierController.destroy);
route.post("/seedDefaults", MembershipTierController.seedDefaults);

module.exports = route;
