const express = require("express");
const route = express.Router();

const AdminMiddleware = require("../../middleware/admin.middleware");
const AdminController = require("../../controllers/admin/admin.controller");

route.post("/login", AdminController.login);
// No AdminMiddleware here on purpose — create() must also work
// unauthenticated (the public Registration page), gated by
// ADMIN_SIGNUP_CODE instead. See the comment on exports.create.
route.post("/create", AdminController.create);
route.get("/profile", AdminMiddleware, AdminController.getProfile);
route.patch("/update", AdminMiddleware, AdminController.update);
route.post("/forgotPassword", AdminController.forgotPassword);
route.patch("/updatePassword", AdminMiddleware, AdminController.updatePassword);
route.post("/setPassword", AdminMiddleware, AdminController.setPassword);

module.exports = route;
