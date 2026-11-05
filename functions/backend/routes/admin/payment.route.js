const express = require("express");
const route = express.Router();
const paymentController = require("../../controllers/client/payment.controller");

route.get("/list", paymentController.adminList);
route.get("/gatewayStatus", paymentController.adminGatewayStatus);
route.post("/testGateway", paymentController.adminGatewayTest);
route.post("/markPaid", paymentController.adminMarkPaid);
// Paid orders whose fulfilment needs attention: GET = dry-run list, POST {retry:true} = idempotent retry.
route.get("/reconcile", paymentController.adminReconcile);
route.post("/reconcile", paymentController.adminReconcile);

module.exports = route;
