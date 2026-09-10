const express = require("express");
const route = express.Router();
const paymentController = require("../controllers/client/payment.controller");

// Server-to-server webhook. No secret-key gate — authenticity is proven by the
// gateway signature. The raw body is captured in index.js/server.js.
route.post("/webhook/:gateway", paymentController.webhook);
route.post("/webhook", paymentController.webhook);

module.exports = route;
