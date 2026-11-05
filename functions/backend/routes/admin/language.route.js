//express
const express = require("express");
const route = express.Router();

const checkAccessWithSecretKey = require("../../checkAccess");

//controller
const languageController = require("../../controllers/admin/language.controller");

route.use(checkAccessWithSecretKey());

// get all languages (default & aliases)
route.get("/", languageController.harvestLanguages);
route.get("/harvestLanguages", languageController.harvestLanguages);
route.get("/get", languageController.harvestLanguages);

// create language
route.post("/forgeLanguage", languageController.forgeLanguage);
route.post("/create", languageController.forgeLanguage);

// get single language
route.get("/harvestLanguage", languageController.harvestLanguage);

// update language
route.patch("/refineLanguage", languageController.refineLanguage);
route.patch("/update", languageController.refineLanguage);

// toggle isActive and isDefault switch
route.patch("/shiftLanguageState", languageController.shiftLanguageState);

// delete language and its translations
route.delete("/obliterateLanguage", languageController.obliterateLanguage);
route.delete("/delete", languageController.obliterateLanguage);

module.exports = route;
