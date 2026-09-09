//express
const express = require("express");
const route = express.Router();

//admin index.js
const admin = require("./admin/index");

//client index.js
const client = require("./client/index");

//cron (scheduled maintenance)
const cron = require("./cron.route");

//payment webhook (server-to-server)
const payment = require("./payment.route");

route.use("/admin", admin);
route.use("/client", client);
route.use("/cron", cron);
route.use("/payment", payment);

module.exports = route;
