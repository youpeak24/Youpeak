const express = require("express");
const route = express.Router();

// Per-user routes: shared app key + Firebase ID token (middleware/appUser.middleware.js).
const requireAppUser = require("../../middleware/appUser.middleware");
const securityController = require("../../controllers/client/security.controller");

// Device attestation (VPN / proxy / emulator / root / one account per device)
route.post("/attest", requireAppUser(), securityController.attest);

module.exports = route;
