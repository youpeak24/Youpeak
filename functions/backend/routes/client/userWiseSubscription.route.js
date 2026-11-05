//express
const express = require("express");
const route = express.Router();
const bindAppUser = require("../../middleware/bindAppUser.middleware");

const checkAccessWithSecretKey = require("../../checkAccess");

//controller
const userWiseSubscriptionController = require("../../controllers/client/userWiseSubscription.controller");

//user wise subscribed or unSubscribed the channel
route.post("/subscribedUnSubscibed", bindAppUser(), userWiseSubscriptionController.subscribedUnSubscibed);

//get all subscription channels subscribed by that user
route.get("/getSubscribedChannel", bindAppUser(), userWiseSubscriptionController.getSubscribedChannel);

//get type wise videos of the subscribed channels
route.get("/videoOfSubscribedChannel", bindAppUser(), userWiseSubscriptionController.videoOfSubscribedChannel);

module.exports = route;
