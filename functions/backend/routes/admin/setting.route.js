//express
const express = require("express");
const route = express.Router();

const checkAccessWithSecretKey = require("../../checkAccess");

const AdminMiddleware = require("../../middleware/admin.middleware");

//controller
const settingController = require("../../controllers/admin/setting.controller");

//update Setting
route.patch("/update", AdminMiddleware, checkAccessWithSecretKey(), settingController.update);

//get setting data
route.get("/", checkAccessWithSecretKey(), settingController.index);

//handle setting switch
route.patch("/handleSwitch", AdminMiddleware, checkAccessWithSecretKey(), settingController.handleSwitch);

//handle water mark setting
route.patch("/updateWatermarkSetting", AdminMiddleware, checkAccessWithSecretKey(), settingController.updateWatermarkSetting);

//handle update storage
route.patch("/switchStorageOption", AdminMiddleware, checkAccessWithSecretKey(), settingController.switchStorageOption);

// Get selected fields of setting
route.get("/retrieveLinks", settingController.retrieveLinks);

// One-time: write the YP-TC-2026-FINAL economy values into the settings doc
route.post("/applyEconomyDefaults", AdminMiddleware, checkAccessWithSecretKey(), settingController.applyEconomyDefaults);

module.exports = route;
