//express
const express = require("express");
const route = express.Router();

const checkAccessWithSecretKey = require("../../checkAccess");

//controller
const soundListController = require("../../controllers/admin/soundList.controller");

//create soundList by admin
route.post("/createSoundList", checkAccessWithSecretKey(), soundListController.createSoundList);

//update soundList by admin
route.patch("/updateSoundList", checkAccessWithSecretKey(), soundListController.updateSoundList);

//get all soundList
route.get("/getSoundList", checkAccessWithSecretKey(), soundListController.getSoundList);

//delete soundList by admin (multiple or single)
route.delete("/deleteSoundList", checkAccessWithSecretKey(), soundListController.deleteSoundList);

module.exports = route;
