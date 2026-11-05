//express
const express = require("express");
const route = express.Router();
const bindAppUser = require("../../middleware/bindAppUser.middleware");

const checkAccessWithSecretKey = require("../../checkAccess");

//controller
const NotificationController = require("../../controllers/client/notification.controller");

//get notification list for that user
route.get("/getNotificationList", bindAppUser(), NotificationController.getNotificationList);

//clear all notification for particular user
route.delete("/clearNotificationHistory", bindAppUser(), NotificationController.clearNotificationHistory);

//mark one (notificationId) or all of the caller's notifications read
route.patch("/markRead", bindAppUser(), NotificationController.markNotificationsRead);

module.exports = route;
