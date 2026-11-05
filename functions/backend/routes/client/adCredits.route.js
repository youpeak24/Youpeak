const express = require("express");
const route = express.Router();
const requireAppUser = require("../../middleware/appUser.middleware");
const checkAccess = require("../../checkAccess");
const adCreditsController = require("../../controllers/client/adCredits.controller");

// Catalog of top-up packages (public/client app accessible)
route.get("/packs", checkAccess(), adCreditsController.getPacks);

// User wallet summary (breakdown: available, plan, topup, bonus, expiring soon)
route.get("/wallet", requireAppUser(), adCreditsController.getWallet);

// Paginated immutable ledger history
route.get("/history", requireAppUser(), adCreditsController.getHistory);

// Server-authoritative credit consumption (for authorized platform services)
route.post("/consume", requireAppUser(), adCreditsController.consumeCredits);

module.exports = route;
