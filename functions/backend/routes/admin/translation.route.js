const express = require("express");
const multer = require("multer");

const localizationController = require("../../controllers/admin/translation.controller");
const checkAccessWithSecretKey = require("../../checkAccess");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(checkAccessWithSecretKey());

// create Translations for languages using CSV file
router.post(
  "/infuseTranslations",
  upload.single("file"),
  localizationController.infuseTranslations
);

// update specific key-value pairs for a language
router.patch("/refineTranslations", localizationController.refineTranslations);

// download all translations as CSV file
router.get("/extractTranslationsCSV", localizationController.extractTranslationsCSV);

// get single Language's translations
router.get("/harvestTranslations", localizationController.harvestTranslations);

module.exports = router;