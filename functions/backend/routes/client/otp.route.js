//express
const express = require("express");
const route = express.Router();

const checkAccessWithSecretKey = require("../../checkAccess");

//Controller
const OTPController = require("../../controllers/client/otp.controller");

//create OTP when user login
route.post("/otplogin", checkAccessWithSecretKey(), OTPController.otplogin);

//create OTP and send the email for password security
route.post("/create", checkAccessWithSecretKey(), OTPController.store);

//verify the OTP
route.post("/verify", checkAccessWithSecretKey(), OTPController.verify);

module.exports = route;
