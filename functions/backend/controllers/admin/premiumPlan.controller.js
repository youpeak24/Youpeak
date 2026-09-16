const PremiumPlan = require("../../models/premiumPlan.model");

//import model
const PremiumPlanHistory = require("../../models/premiumPlanHistory.model");
const History = require("../../models/history.model");

//create premiumPlan by admin
exports.store = async (req, res) => {
  try {
    if (!req?.body?.validity || !req?.body?.validityType || !req?.body?.amount || !req?.body?.planBenefit || !req.body.productKey) {
      return res.status(200).json({ status: false, message: "Oops ! Invalid details!!" });
    }

    const premiumPlan = new PremiumPlan();
    premiumPlan.amount = req?.body?.amount;
    premiumPlan.validity = req?.body?.validity;
    premiumPlan.validityType = req?.body?.validityType;
    premiumPlan.productKey = req?.body?.productKey;
    premiumPlan.planBenefit = req?.body?.planBenefit?.split(",");
    await premiumPlan.save();

    return res.status(200).json({ status: true, message: "finally, plan has been created by the admin.", premiumPlan: premiumPlan });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//update premiumPlan by admin
exports.update = async (req, res) => {
  try {
    const premiumPlan = await PremiumPlan.findById(req.query.premiumPlanId);
    if (!premiumPlan) {
      return res.status(200).json({ status: false, message: "premiumPlan does not found!" });
    }

    premiumPlan.amount = req.body.amount ? req.body.amount : premiumPlan.amount;
    premiumPlan.validity = req.body.validity ? req.body.validity : premiumPlan.validity;
    premiumPlan.validityType = req.body.validityType ? req.body.validityType : premiumPlan.validityType;
    premiumPlan.productKey = req.body.productKey ? req.body.productKey : premiumPlan.productKey;

    const planbenefit = req.body.planBenefit.toString();
    premiumPlan.planBenefit = planbenefit ? planbenefit.split(",") : premiumPlan.planBenefit;
    await premiumPlan.save();

    return res.status(200).json({ status: true, message: "finally, plan has been updated by the admin.", premiumPlan: premiumPlan });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//delete premiumPlan by admin
exports.destroy = async (req, res) => {
  try {
    const premiumPlan = await PremiumPlan.findById(req.query.premiumPlanId);
    if (!premiumPlan) {
      return res.status(200).json({ status: false, message: "premiumPlan does not found." });
    }

    await premiumPlan.deleteOne();

    return res.status(200).json({ status: true, message: "finally, plan has been deleted by the admin." });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//get premiumPlan for admin
exports.index = async (req, res) => {
  try {
    const premiumPlan = await PremiumPlan.find().sort({ validityType: 1, validity: 1 }).lean();
    if (!premiumPlan) {
      return res.status(200).json({ status: false, message: "No data found." });
    }

    return res.status(200).json({ status: true, message: "Success", premiumPlan });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//handle activation of premiumPlan
exports.handleisActive = async (req, res) => {
  try {
    if (!req.query.premiumPlanId) {
      return res.status(200).json({ status: false, message: "Oops ! Invalid details!" });
    }

    const premiumPlan = await PremiumPlan.findById(req.query.premiumPlanId);
    if (!premiumPlan) {
      return res.status(200).json({ status: false, message: "premiumPlan does not found!" });
    }

    premiumPlan.isActive = !premiumPlan.isActive;
    await premiumPlan.save();

    return res.status(200).json({ status: true, message: "finally, activation of premiumPlan handled by admin!", premiumPlan });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      error: error.message || "Internal Server Error",
    });
  }
};

//get user's premiumPlan histories
exports.getpremiumPlanHistory = async (req, res) => {
  try {
    if (!req.query.startDate || !req.query.endDate || !req.query.start || !req.query.limit) {
      return res.status(200).json({ status: false, message: "Oops ! Invalid details!" });
    }

    const start = parseInt(req.query.start) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (start - 1) * limit;

    const search = req.query.search?.trim();
    const searchRegex = search ? new RegExp(search, "i") : null;
    const paymentGateway = req?.query?.paymentGateway || "All";

    let matchQuery = {};

    if (req.query.startDate !== "All" && req.query.endDate !== "All") {
      const startDate = new Date(req.query.startDate);
      const endDate = new Date(req.query.endDate);
      endDate.setHours(23, 59, 59, 999);

      matchQuery.createdAt = {
        $gte: startDate,
        $lte: endDate,
      };
    }

    if (paymentGateway && paymentGateway !== "All") {
      matchQuery.paymentGateway = paymentGateway.trim().toLowerCase();
    }

    const result = await PremiumPlanHistory.aggregate([
      { $match: matchQuery },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          pipeline: [
            {
              $project: {
                fullName: 1,
                nickName: 1,
                image: 1,
                uniqueId: 1,
              },
            },
          ],
          as: "user",
        },
      },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
      ...(searchRegex
        ? [
          {
            $match: {
              $or: [
                { "user.fullName": { $regex: searchRegex } },
                { "user.nickName": { $regex: searchRegex } },
                { "user.uniqueId": { $regex: searchRegex } },
                { paymentGateway: { $regex: searchRegex } },
              ],
            },
          },
        ]
        : []),
      {
        $facet: {
          totalHistory: [{ $count: "count" }],
          history: [
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: limit },
            {
              $project: {
                userId: 1,
                paymentGateway: 1,
                premiumPlanId: 1,
                createdAt: 1,
                fullName: "$user.fullName",
                nickName: "$user.nickName",
                userUniqueId: "$user.uniqueId",
                image: "$user.image",
                // Snapshot captured at purchase time on the history record
                // itself (see premiumPlanHistory.model.js) — NOT the
                // user's current plan, which can since have changed,
                // renewed, or expired, making every past row show today's
                // price instead of what was actually paid.
                amount: 1,
                validity: 1,
                validityType: 1,
              },
            },
          ],
        },
      },
    ]);

    const data = result[0];

    return res.status(200).json({
      status: true,
      message: "Success",
      totalHistory: data.totalHistory.length ? data.totalHistory[0].count : 0,
      history: data.history || [],
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//get user's premiumPlan histories
exports.fetchPremiumPlanRecords = async (req, res) => {
  try {
    if (!req.query.startDate || !req.query.endDate) {
      return res.status(200).json({ status: false, message: "Oops! Invalid details!" });
    }

    const start = Math.max(parseInt(req.query.start) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit) || 20, 1);
    const skip = (start - 1) * limit;

    const search = req.query.search?.trim();
    const searchRegex = search ? new RegExp(search, "i") : null;
    const paymentGateway = req?.query?.paymentGateway || "All";

    let matchQuery = {
      type: 11,
      amount: { $exists: true, $ne: 0 },
    };

    if (paymentGateway && paymentGateway !== "All") {
      matchQuery.paymentGateway = paymentGateway.trim().toLowerCase();
    }

    if (req.query.startDate !== "All" && req.query.endDate !== "All") {
      const startDate = new Date(req.query.startDate);
      const endDate = new Date(req.query.endDate);
      endDate.setHours(23, 59, 59, 999);

      matchQuery.createdAt = { $gte: startDate, $lte: endDate };
    }

    const result = await History.aggregate([
      { $match: matchQuery },
      {
        $facet: {
          total: [{ $count: "count" }],
          data: [
            {
              $lookup: {
                from: "users",
                localField: "userId",
                foreignField: "_id",
                pipeline: [
                  {
                    $project: {
                      _id: 1,
                      fullName: 1,
                      nickName: 1,
                      image: 1,
                      uniqueId: 1,
                    },
                  },
                ],
                as: "user",
              },
            },
            { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
            ...(search
              ? [
                {
                  $match: {
                    $or: [
                      { paymentGateway: { $regex: searchRegex } },
                      { uniqueId: { $regex: searchRegex } },
                      { "user.fullName": { $regex: searchRegex } },
                      { "user.nickName": { $regex: searchRegex } },
                      { "user.uniqueId": { $regex: searchRegex } },
                    ],
                  },
                },
              ]
              : []),
            { $sort: { date: -1 } },
            { $skip: skip },
            { $limit: limit },
            {
              $project: {
                _id: 1,
                uniqueId: 1,
                paymentGateway: 1,
                coin: 1,
                rewardCoins: 1,
                amount: 1,
                date: 1,
                user: 1,
              },
            },
          ],
        },
      },
    ]);

    const data = result[0]?.data || [];
    const total = result[0]?.total?.[0]?.count || 0;

    return res.status(200).json({
      status: true,
      message: "Coin plan records retrieved successfully.",
      total,
      data,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, message: "Internal server error" });
  }
};
