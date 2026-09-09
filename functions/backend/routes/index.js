//express
const express = require("express");
const route = express.Router();

//admin index.js
const admin = require("./admin/index");

//client index.js
const client = require("./client/index");

//cron (scheduled maintenance)
const cron = require("./cron.route");

route.use("/admin", admin);
route.use("/client", client);
route.use("/cron", cron);

module.exports = route;
