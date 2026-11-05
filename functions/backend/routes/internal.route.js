const express = require("express");
const route = express.Router();
const copyrightModeration = require("../controllers/admin/copyrightModeration.controller");

// Server-to-server, for the fingerprint worker. Auth = X-Worker-Secret header
// (checked inside the controller against FINGERPRINT_WORKER_SECRET).
route.get("/fingerprint/queue", copyrightModeration.fingerprintQueue);
route.post("/fingerprint/ingest", copyrightModeration.ingestFingerprint);

module.exports = route;
