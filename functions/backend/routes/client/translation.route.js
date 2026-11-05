const express = require("express");
const translationController = require("../../controllers/client/translation.controller");
const checkAccessWithSecretKey = require("../../checkAccess");

const router = express.Router();

router.use(checkAccessWithSecretKey());

// get single Language's translations
router.get("/harvestTranslation", translationController.harvestTranslation);

// get all Languages and their translations
router.get("/harvestAllTranslations", translationController.harvestAllTranslations);

// get latest version of global Language system
router.get("/revealLatestVersion", translationController.revealLatestVersion);

// get all active Languages
router.get("/harvestActiveLanguages", translationController.harvestActiveLanguages);

module.exports = router;