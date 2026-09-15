const express = require("express");
const route = express.Router();
const localBusinessAd = require("../../controllers/admin/localBusinessAd.controller");

route.get("/list", localBusinessAd.list);
route.post("/approve", localBusinessAd.approve);
route.post("/reject", localBusinessAd.reject);

module.exports = route;
