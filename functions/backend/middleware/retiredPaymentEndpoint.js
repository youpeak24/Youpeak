/**
 * Answers a retired legacy payment-fulfilment endpoint (PAY-1) with 410 Gone,
 * before any auth or business logic runs, so nothing can be credited through it.
 */
"use strict";

module.exports = function retiredPaymentEndpoint(req, res) {
  return res.status(410).json({
    status: false,
    code: "ENDPOINT_RETIRED",
    message: "This purchase method is no longer available. Please update the app and try again.",
  });
};
