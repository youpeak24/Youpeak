const express = require("express");
const route = express.Router();

//Controller
const dashboardController = require("../../controllers/admin/dashboard.controller");

//checkAccessWithSecretKey
const checkAccessWithSecretKey = require("../../checkAccess");

//get admin panel dashboard
route.get("/dashboardCount", checkAccessWithSecretKey(), dashboardController.dashboardCount);

//get date wise chartAnalytic for users, videos, shorts
route.get("/chartAnalytic", checkAccessWithSecretKey(), dashboardController.chartAnalytic);

//get date wise chartAnalytic for active users, inActive users
route.get("/chartAnalyticOfactiveInactiveUser", checkAccessWithSecretKey(), dashboardController.chartAnalyticOfactiveInactiveUser);

module.exports = route;
