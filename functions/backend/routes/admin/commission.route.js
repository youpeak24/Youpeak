const express = require("express");
const route = express.Router();

const CommissionController = require("../../controllers/admin/commission.controller");

route.get("/getCommissions", CommissionController.getCommissions);
route.post("/updatePayoutStatus", CommissionController.updatePayoutStatus);
route.patch("/verify", CommissionController.verify);

module.exports = route;
