//express
const express = require("express");
const route = express.Router();

//admin middleware
const AdminMiddleware = require("../../middleware/admin.middleware");
const CheckScope = require("../../middleware/checkScope.middleware");

//require admin's route.js
const user = require("./user.route");
const FAQ = require("./FAQ.route");
const admin = require("./admin.route");
const premiumPlan = require("./premiumPlan.route");
const contact = require("./contact.route");
const soundList = require("./soundList.route");
const soundCategory = require("./soundCategory.route");
const dashboard = require("./dashboard.route");
const setting = require("./setting.route");
const withdraw = require("./withdraw.route");
const file = require("./file.route");
const video = require("./video.route");
const videoComment = require("./videoComment.route");
const report = require("./report.route");
const advertise = require("./advertise.route");
const currency = require("./currency.route");
const withDrawalRequest = require("./withDrawalRequest.route");
const monetizationRequest = require("./monetizationRequest.route");
const login = require("./login.route");
const adRewardCoin = require("./adRewardCoin.route");
const dailyRewardCoin = require("./dailyRewardCoin.route");
const coinplan = require("./coinplan.route");
const language = require("./language.route");
const translation = require("./translation.route");
const agency = require("./agency.route");
const commission = require("./commission.route");
const agencyReport = require("./agencyReport.route");
const membershipTier = require("./membershipTier.route");
const fraud = require("./fraud.route");
const referral = require("./referral.route");
const videoPromotion = require("./videoPromotion.route");
const contentModeration = require("./contentModeration.route");
const copyrightModeration = require("./copyrightModeration.route");
const payment = require("./payment.route");

//exports admin's route.js
route.use("/admin", admin);
route.use("/user", AdminMiddleware, CheckScope, user);
route.use("/contact", AdminMiddleware, CheckScope, contact);
route.use("/FAQ", AdminMiddleware, CheckScope, FAQ);
route.use("/premiumPlan", AdminMiddleware, CheckScope, premiumPlan);
route.use("/soundList", AdminMiddleware, CheckScope, soundList);
route.use("/soundCategory", AdminMiddleware, CheckScope, soundCategory);
route.use("/dashboard", AdminMiddleware, CheckScope, dashboard);
route.use("/setting", AdminMiddleware, CheckScope, setting);
route.use("/withdraw", AdminMiddleware, CheckScope, withdraw);
route.use("/file", AdminMiddleware, CheckScope, file);
route.use("/video", AdminMiddleware, CheckScope, video);
route.use("/videoComment", AdminMiddleware, CheckScope, videoComment);
route.use("/report", AdminMiddleware, CheckScope, report);
route.use("/advertise", AdminMiddleware, CheckScope, advertise);
route.use("/currency", AdminMiddleware, CheckScope, currency);
route.use("/withDrawalRequest", AdminMiddleware, CheckScope, withDrawalRequest);
route.use("/monetizationRequest", AdminMiddleware, CheckScope, monetizationRequest);
route.use("/adRewardCoin", AdminMiddleware, CheckScope, adRewardCoin);
route.use("/dailyRewardCoin", AdminMiddleware, CheckScope, dailyRewardCoin);
route.use("/coinplan", AdminMiddleware, CheckScope, coinplan);
route.use("/login", login);
route.use("/language", AdminMiddleware, CheckScope, language);
route.use("/translation", AdminMiddleware, CheckScope, translation);
route.use("/agency", AdminMiddleware, CheckScope, agency);
route.use("/commission", AdminMiddleware, CheckScope, commission);
route.use("/agencyReport", AdminMiddleware, CheckScope, agencyReport);
route.use("/membershipTier", AdminMiddleware, CheckScope, membershipTier);
route.use("/fraud", AdminMiddleware, CheckScope, fraud);
route.use("/referral", AdminMiddleware, CheckScope, referral);
route.use("/videoPromotion", AdminMiddleware, CheckScope, videoPromotion);
route.use("/contentModeration", AdminMiddleware, CheckScope, contentModeration);
route.use("/copyrightModeration", AdminMiddleware, CheckScope, copyrightModeration);
route.use("/payment", AdminMiddleware, CheckScope, payment);
route.use("/", admin);

module.exports = route;
