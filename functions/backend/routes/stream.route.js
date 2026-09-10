const express = require("express");
const route = express.Router();
const videoController = require("../controllers/client/video.controller");

// Cloudflare Stream webhook — fires when a video finishes transcoding.
// Authenticity is proven by the Webhook-Signature header (see videoPipeline).
route.post("/webhook", videoController.streamWebhook);

module.exports = route;
