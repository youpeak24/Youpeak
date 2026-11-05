const PremiumPlan = require("../../models/premiumPlan.model");

//import model
const User = require("../../models/user.model");
const PremiumPlanHistory = require("../../models/premiumPlanHistory.model");
const History = require("../../models/history.model");

//moment
const moment = require("moment");

const mongoose = require("../../util/mongooseShim");

const { generateHistoryUniqueId } = require("../../util/generateHistoryUniqueId");

//get all premiumPlan for user (isActive)
exports.index = async (req, res) => {
  try {
    const premiumPlan = await PremiumPlan.find({ isActive: true }).sort({ validityType: 1, validity: 1 }).lean();

    return res.status(200).json({ status: true, message: "Success", premiumPlan });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//when user purchase the premiumPlan create premiumPlan history by user
exports.createHistory = async (req, res) => {
  try {
    const { userId, premiumPlanId, paymentGateway } = req.body || {};

    if (!userId || !premiumPlanId || !paymentGateway) {
      return res.status(200).json({ status: false, message: "Oops! Invalid details." });
    }

    const currentDate = new Date();

    const [uniqueId, user, premiumPlan] = await Promise.all([generateHistoryUniqueId(), User.findById(userId).select("isBlock isPremiumPlan plan"), PremiumPlan.findById(premiumPlanId)]);

    if (!user) {
      return res.status(200).json({ status: false, message: "User not found." });
    }

    if (user.isBlock) {
      return res.status(200).json({ status: false, message: "You are blocked by admin!" });
    }

    if (user.isPremiumPlan && user.plan?.planEndDate && new Date(user.plan.planEndDate) > currentDate) {
      console.log("active plan check");
      return res.status(200).json({
        status: false,
        message: "You already have an active premium plan. Please wait until it expires.",
      });
    }

    if (!premiumPlan) {
      return res.status(200).json({ status: false, message: "Premium plan not found." });
    }

    const paymentGateWay = paymentGateway.trim().toLowerCase();

    let planEndDate = new Date(currentDate);

    if (premiumPlan.validityType === "month") {
      planEndDate.setMonth(planEndDate.getMonth() + premiumPlan.validity);
    } else if (premiumPlan.validityType === "year") {
      planEndDate.setFullYear(planEndDate.getFullYear() + premiumPlan.validity);
    }

    const planPatch = {
      planStartDate: moment().toISOString(),
      planEndDate: moment(planEndDate).toISOString(),
      premiumPlanId: premiumPlan._id,
      amount: premiumPlan.amount,
      validity: premiumPlan.validity,
      validityType: premiumPlan.validityType,
      planBenefit: premiumPlan.planBenefit,
    };

    const premiumPlanHistory = new PremiumPlanHistory({
      userId: user._id,
      premiumPlanId: premiumPlan._id,
      paymentGateway: paymentGateWay,
      date: moment().toISOString(),
      amount: premiumPlan.amount,
      validity: premiumPlan.validity,
      validityType: premiumPlan.validityType,
    });

    const history = new History({
      userId: user._id,
      premiumPlan: premiumPlan._id,
      type: 11,
      amount: premiumPlan.amount,
      paymentGateway: paymentGateWay,
      uniqueId,
      date: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
    });

    // `user` came from a query (findById(...).select(...)), a plain data
    // object — it never had a working .save(); calling it threw a
    // TypeError on every single purchase attempt. Use the same
    // User.updateOne() pattern handleStripePaymentForPremiumPlan already
    // uses correctly, below.
    await Promise.all([
      User.updateOne({ _id: userId }, { isPremiumPlan: true, plan: planPatch }),
      premiumPlanHistory.save(),
      history.save(),
    ]);

    return res.status(200).json({
      status: true,
      message: "Premium plan purchased successfully.",
      history: premiumPlanHistory,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//get premiumPlanHistory of particular user (user)
exports.planHistoryOfUser = async (req, res) => {
  try {
    if (!req.query.userId) {
      return res.status(200).json({
        status: false,
        message: "userId must be required.",
      });
    }

    const start = req.query.start ? parseInt(req.query.start) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;
    const userId = new mongoose.Types.ObjectId(req.query.userId);

    const [user, result] = await Promise.all([
      User.findById(userId).select("isBlock").lean(),
      PremiumPlanHistory.aggregate([
        { $match: { userId: userId } },

        {
          $facet: {
            planHistory: [
              { $sort: { createdAt: -1 } },
              { $skip: (start - 1) * limit },
              { $limit: limit },

              {
                $lookup: {
                  from: "users",
                  let: { userId: "$userId" },
                  pipeline: [
                    {
                      $match: {
                        $expr: { $eq: ["$_id", "$$userId"] },
                      },
                    },
                    {
                      $project: {
                        fullName: 1,
                        nickName: 1,
                        image: 1,
                        "plan.planStartDate": 1,
                        "plan.planEndDate": 1,
                        "plan.amount": 1,
                        "plan.validity": 1,
                        "plan.validityType": 1,
                        "plan.planBenefit": 1,
                      },
                    },
                  ],
                  as: "user",
                },
              },
              { $unwind: "$user" },

              {
                $project: {
                  paymentGateway: 1,
                  premiumPlanId: 1,
                  userId: 1,
                  fullName: "$user.fullName",
                  nickName: "$user.nickName",
                  image: "$user.image",
                  planStartDate: "$user.plan.planStartDate",
                  planEndDate: "$user.plan.planEndDate",
                  amount: "$user.plan.amount",
                  validity: "$user.plan.validity",
                  validityType: "$user.plan.validityType",
                  planBenefit: "$user.plan.planBenefit",
                },
              },
            ],

            totalCount: [{ $count: "count" }],
          },
        },
      ]),
    ]);

    if (!user) {
      return res.status(200).json({ status: false, message: "User not found." });
    }

    if (user.isBlock) {
      return res.status(200).json({ status: false, message: "You are blocked by the admin." });
    }

    const history = result[0]?.planHistory || [];
    const total = result[0]?.totalCount[0]?.count || 0;

    return res.status(200).json({
      status: true,
      message: "Success",
      total,
      planHistory: history,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//get coinPlanHistory of particular user (user)
exports.fetchCoinplanHistoryOfUser = async (req, res) => {
  try {
    if (!req.query.startDate || !req.query.endDate || !req.query.userId) {
      return res.status(200).json({ status: false, message: "Oops ! Invalid details!" });
    }

    const userId = new mongoose.Types.ObjectId(req.query.userId);
    const startDate = req?.query?.startDate || "All";
    const endDate = req?.query?.endDate || "All";
    const start = req.query.start ? parseInt(req.query.start) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;

    let dateFilterQuery = {};
    if (req?.query?.startDate !== "All" && req?.query?.endDate !== "All") {
      const formatStartDate = new Date(startDate);
      const formatEndDate = new Date(endDate);
      formatEndDate.setHours(23, 59, 59, 999);

      dateFilterQuery = {
        createdAt: {
          $gte: formatStartDate,
          $lte: formatEndDate,
        },
      };
    }
    //console.log("dateFilterQuery:   ", dateFilterQuery);

    const [user, history] = await Promise.all([
      User.findOne({ _id: userId, isActive: true }).select("_id isBlock").lean(),
      History.aggregate([
        {
          $match: {
            ...dateFilterQuery,
            type: 8,
            userId: userId,
          },
        },
        {
          $project: {
            _id: 1,
            type: 1,
            coin: 1,
            rewardCoins: 1,
            uniqueId: 1,
            paymentGateway: 1,
            date: 1,
            amount: 1,
            createdAt: 1,
          },
        },
        { $sort: { createdAt: -1 } },
        { $skip: (start - 1) * limit },
        { $limit: limit },
      ]),
    ]);

    if (!user) {
      return res.status(200).json({ status: false, message: "User not found." });
    }

    if (user.isBlock) {
      return res.status(200).json({ status: false, message: "You are blocked by the admin." });
    }

    return res.status(200).json({ status: true, message: "Retrieve all histories.", data: history });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: "Internal server error" });
  }
};

//purchase plan through stripe ( web )
exports.handleStripePaymentForPremiumPlan = async (req, res) => {
  try {
    console.log("Stripe Premium Payment API initiated:", req.body);

    const { userId, premiumPlanId, currency, billing_details, payment_method_id } = req.body || {};

    if (!userId || !premiumPlanId || !currency || !billing_details || !payment_method_id) {
      return res.status(200).json({
        status: false,
        message: "Invalid request. Required details missing.",
      });
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const premiumPlanObjectId = new mongoose.Types.ObjectId(premiumPlanId);
    const currentDate = new Date();

    const [uniqueId, user, premiumPlan] = await Promise.all([
      generateHistoryUniqueId(),
      User.findById(userObjectId).select("_id isBlock isPremiumPlan plan").lean(),
      PremiumPlan.findById(premiumPlanObjectId).select("_id amount validity validityType planBenefit").lean(),
    ]);

    if (!user) {
      return res.status(200).json({ status: false, message: "User not found." });
    }

    if (user.isBlock) {
      return res.status(200).json({ status: false, message: "You are blocked by admin!" });
    }

    if (user.isPremiumPlan && user.plan?.planEndDate && new Date(user.plan.planEndDate) > currentDate) {
      console.log("active plan check");
      return res.status(200).json({ status: false, message: "You already have an active premium plan. Please wait until it expires." });
    }

    if (!premiumPlan) {
      return res.status(200).json({
        status: false,
        message: "Premium plan not found.",
      });
    }

    const finalPrice = premiumPlan.amount;
    if (typeof finalPrice !== "number" || finalPrice <= 0) {
      return res.status(200).json({
        status: false,
        message: "Invalid premium plan amount.",
      });
    }

    const stripe = require("stripe")(settingJSON.stripeSecretKey);

    const customer = await stripe.customers.create({
      email: billing_details.email,
      name: billing_details.name,
      address: billing_details.address,
    });

    const intent = await stripe.paymentIntents.create({
      amount: finalPrice * 100,
      currency,
      customer: customer.id,
      payment_method: payment_method_id,
      confirm: true,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: "never",
      },
      description: "Premium Plan Purchase",
    });

    if (intent.status === "requires_action") {
      return res.status(200).json({
        status: true,
        requires_action: true,
        payment_intent_client_secret: intent.client_secret,
      });
    }

    console.log("PaymentIntent status after confirmation handleStripePaymentForPremiumPlan:", intent.status);

    if (intent.status !== "succeeded") {
      return res.status(200).json({
        status: false,
        message: "Payment failed.",
      });
    }

    let planEndDate = new Date(currentDate);

    if (premiumPlan.validityType === "month") {
      planEndDate.setMonth(currentDate.getMonth() + premiumPlan.validity);
    } else if (premiumPlan.validityType === "year") {
      planEndDate.setFullYear(currentDate.getFullYear() + premiumPlan.validity);
    }

    await Promise.all([
      User.updateOne(
        { _id: userObjectId },
        {
          isPremiumPlan: true,
          plan: {
            planStartDate: moment().toISOString(),
            planEndDate: moment(planEndDate).toISOString(),
            premiumPlanId: premiumPlan._id,
            amount: premiumPlan.amount,
            validity: premiumPlan.validity,
            validityType: premiumPlan.validityType,
            planBenefit: premiumPlan.planBenefit,
          },
        },
      ),
      PremiumPlanHistory.create({
        userId: userObjectId,
        premiumPlanId: premiumPlan._id,
        paymentGateway: "stripe",
        date: moment().toISOString(),
        amount: premiumPlan.amount,
        validity: premiumPlan.validity,
        validityType: premiumPlan.validityType,
      }),
      History.create({
        userId: user._id,
        premiumPlan: premiumPlan._id,
        type: 11,
        amount: premiumPlan.amount,
        paymentGateway: "stripe",
        uniqueId,
        date: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
      }),
    ]);

    return res.status(200).json({
      status: true,
      message: "Premium plan activated successfully.",
      payment_intent_client_secret: intent.client_secret,
    });
  } catch (error) {
    console.error("Stripe Premium Error:", error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};
