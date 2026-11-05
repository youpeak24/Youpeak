//express
const express = require("express");
const route = express.Router();

const checkAccessWithSecretKey = require("../../checkAccess");

//controller
const UserController = require("../../controllers/admin/user.controller");

//create user by admin
route.post("/fakeUser", checkAccessWithSecretKey(), UserController.fakeUser);

//update details of the channel or profile of the user
route.patch("/updateUser", checkAccessWithSecretKey(), UserController.updateUser);

//handle activation of the users (multiple or single)
route.patch("/isActive", checkAccessWithSecretKey(), UserController.isActive);

//handle block of the users (multiple or single)
route.patch("/isBlock", checkAccessWithSecretKey(), UserController.isBlock);

//update password of user added by admin
route.patch("/updatePassword", checkAccessWithSecretKey(), UserController.updatePassword);

//delete the users (multiple or single)
route.delete("/deleteUsers", checkAccessWithSecretKey(), UserController.deleteUsers);

//get user profile
route.get("/getProfile", checkAccessWithSecretKey(), UserController.getProfile);

//get users (who is added by admin or real)
route.get("/getUsers", checkAccessWithSecretKey(), UserController.getUsers);

//get users who is added by admin for channel creation
route.get("/getUsersAddByAdminForChannel", checkAccessWithSecretKey(), UserController.getUsersAddByAdminForChannel);

//get the all channels of the user (who has been added by admin or real)
route.get("/channelsOfUser", checkAccessWithSecretKey(), UserController.channelsOfUser);

//handle unnecessary channel is inActive
route.patch("/deleteChannelByAdmin", checkAccessWithSecretKey(), UserController.deleteChannelByAdmin);

//get coin + VIP history (all users)
route.get("/fetchUserCoinVipHistory", checkAccessWithSecretKey(), UserController.fetchUserCoinVipHistory);

// Toggle paymentStatus for a user (Admin manual verification)
// Per: Youpeak_Final_Developer_Blueprint
route.patch("/togglePaymentStatus", checkAccessWithSecretKey(), UserController.togglePaymentStatus);

// Payment webhook — called by Razorpay/PhonePe after web portal joining fee payment
// No auth header needed as it's called by the payment gateway server-side
route.post("/paymentWebhook", UserController.paymentWebhook);

module.exports = route;
