const CoinPlan = require("../../models/coinplan.model");

//import models
const User = require("../../models/user.model");
const History = require("../../models/history.model");
const CoinPlanHistory = require("../../models/coinplanHistory.model");

//mongoose
const mongoose = require("../../util/mongooseShim");

const moment = require("moment");

//generateHistoryUniqueId
const { generateHistoryUniqueId } = require("../../util/generateHistoryUniqueId");

//revenue split (referral bonus on purchases)
const revenueSplit = require("../../util/revenueSplit.service");

//razorpay
const Razorpay = require("razorpay");

//get coinPlan
exports.retriveCoinplanByUser = async (req, res) => {
  try {
    const coinPlan = await CoinPlan.find({ isActive: true }).sort({ coin: 1, amount: 1 }).lean();

    return res.status(200).json({
      status: true,
      message: "Retrive CoinPlan Successfully",
      data: coinPlan,
    });
  } catch {
    console.error(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server error" });
  }
};

//when user purchase the coinPlan create coinPlan history by user
// SECURITY: this endpoint used to credit coins purely on the client's say-so
// (userId + coinPlanId + a gateway *name* string, no proof of payment) — any
// caller could mint themselves unlimited coins. It now requires and verifies
// the same Razorpay order/payment/signature triple as
// POST /client/payment/verify, and refuses to credit the same paymentId
// twice (replay protection). Prefer /client/payment/createOrder + verify
// for new integrations — this endpoint stays only so the already-shipped
// app build (which calls it directly after a real gateway checkout) keeps
// working once the app is wired to actually complete a Razorpay payment
// before calling it.
exports.createCoinPlanHistory = async (req, res) => {
  try {
    if (!req.body.userId || !req.body.coinPlanId || !req.body.paymentGateway) {
      return res.json({ status: false, message: "Oops ! Invalid details." });
    }

    const { orderId, paymentId, signature } = req.body;
    if (!orderId || !paymentId || !signature) {
      return res.status(200).json({ status: false, message: "Payment proof (orderId/paymentId/signature) is required." });
    }
    const paymentService = require("../../util/payment.service");
    const verified = paymentService.verifyCallbackSignature({
      gateway: req.body.paymentGateway,
      orderId, paymentId, signature,
    });
    if (!verified) {
      console.warn("createCoinPlanHistory: signature verification failed", { userId: req.body.userId, orderId, paymentId });
      return res.status(200).json({ status: false, message: "Payment verification failed." });
    }
    const dupe = await CoinPlanHistory.findOne({ paymentId });
    if (dupe) {
      return res.status(200).json({ status: false, message: "This payment has already been credited." });
    }

    const userId = new mongoose.Types.ObjectId(req.body.userId);
    const coinPlanId = new mongoose.Types.ObjectId(req.body.coinPlanId);
    const paymentGateWay = req.body.paymentGateway.trim().toLowerCase();

    const [uniqueId, user, coinPlan] = await Promise.all([generateHistoryUniqueId(), User.findOne({ _id: userId }).select("_id isBlock").lean(), CoinPlan.findById(coinPlanId).lean()]);

    if (!user) {
      return res.status(200).json({ status: false, message: "User does not found." });
    }

    if (user.isBlock) {
      return res.status(200).json({ status: false, message: "you are blocked by admin!" });
    }

    if (!coinPlan) {
      return res.status(200).json({ status: false, message: "CoinPlan does not found." });
    }

    res.status(200).json({
      status: true,
      message: "When user purchase the coinPlan created coinPlan history!",
    });

    const history = new CoinPlanHistory();
    history.userId = user._id;
    history.coinplanId = coinPlan._id;
    history.paymentGateway = paymentGateWay;
    history.paymentId = paymentId;
    history.orderId = orderId;
    history.date = moment().toISOString();

    const newCoinPlan = {
      amount: coinPlan.amount,
      coin: coinPlan.coin,
      extraCoin: coinPlan.extraCoin,
      purchasedAt: new Date(),
    };

    const totalCoins = coinPlan.coin + coinPlan.extraCoin;

    await Promise.all([
      User.updateOne(
        { _id: userId },
        {
          $inc: {
            coin: totalCoins,
            purchasedCoin: coinPlan.coin,
          },
          $push: {
            coinplan: newCoinPlan,
          },
        },
      )
        .then((result) => {
          console.log("User successfully purchased new coin plan:", result.purchasedCoin);
        })
        .catch((err) => {
          console.error("Error purchasing new coin plan:", err);
        }),
      history.save(),
      History.create({
        userId: user._id,
        coinplan: coinPlan._id,
        coin: coinPlan.coin,
        rewardCoins: coinPlan.extraCoin,
        amount: coinPlan.amount,
        paymentGateway: paymentGateWay,
        uniqueId: uniqueId,
        type: 8,
        date: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
      }),
    ]);

    // Referral bonus: buyer's referrer gets a config % of the purchase (as coins).
    try {
      const buyerFresh = await User.findById(String(user._id));
      await revenueSplit.settleRevenue({
        sourceType: "coinPurchase",
        grossInr: Number(coinPlan.amount) || 0,
        buyerId: String(user._id),
        referrerOf: "buyer",
        agencyContext: buyerFresh
          ? { state: buyerFresh.state || "", district: buyerFresh.district || "", userId: String(user._id) }
          : null,
        meta: { coinPlanId: String(coinPlan._id), gateway: paymentGateWay },
      });
    } catch (splitErr) {
      console.error("coinPlan revenue split error:", splitErr.message);
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//purchase plan through stripe ( web )
exports.handleStripePayment = async (req, res) => {
  try {
    console.log("Stripe Payment API initiated for web:", req.body);

    const { userId, coinPlanId, currency, billing_details, payment_method_id } = req.body || {};

    if (!userId || !coinPlanId || !currency || !billing_details) {
      return res.status(200).json({ status: false, message: "Invalid request. Required details missing." });
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const coinPlanObjectId = new mongoose.Types.ObjectId(coinPlanId);

    const [uniqueId, user, coinPlan] = await Promise.all([generateHistoryUniqueId(), User.findOne({ _id: userObjectId }).select("_id isBlock").lean(), CoinPlan.findById(coinPlanObjectId).lean()]);

    if (!user) {
      return res.status(200).json({ status: false, message: "User does not found." });
    }

    if (user.isBlock) {
      return res.status(200).json({ status: false, message: "you are blocked by admin!" });
    }

    if (!coinPlan) {
      return res.status(200).json({ status: false, message: "CoinPlan does not found." });
    }

    if (!settingJSON) {
      return res.status(200).json({ status: false, message: "Configuration settings not found." });
    }

    if (!payment_method_id) {
      return res.status(200).json({ status: false, message: "Payment method ID is required." });
    }

    console.log("Received payment_method_id:", payment_method_id);

    const stripe = require("stripe")(settingJSON?.stripeSecretKey);

    const paymentMethod = await stripe.paymentMethods.retrieve(payment_method_id);
    if (!paymentMethod) {
      return res.status(200).json({ status: false, message: "Invalid payment method." });
    }

    const customer = await stripe.customers.create({
      email: billing_details.email,
      name: billing_details.name,
      address: {
        line1: billing_details?.address?.line1,
        line2: billing_details?.address?.line2,
        postal_code: billing_details?.address?.postal_code,
        city: billing_details?.address?.city,
        state: billing_details?.address?.state,
        country: billing_details?.address?.country,
      },
    });

    console.log("Stripe customer created:", customer);

    const finalPrice = coinPlan.amount;

    if (typeof finalPrice !== "number" || isNaN(finalPrice) || finalPrice <= 0) {
      return res.status(200).json({
        status: false,
        message: "Invalid coin plan amount.",
      });
    }

    if (currency.toLowerCase() === "inr" && finalPrice < 50) {
      return res.status(200).json({
        status: false,
        message: "Minimum transaction amount should be ₹50.",
      });
    }

    let intent = await stripe.paymentIntents.create({
      amount: currency === "inr" ? finalPrice * 100 : finalPrice * 100,
      currency,
      customer: customer.id,
      automatic_payment_methods: { enabled: true, allow_redirects: "never" },
      description: `Coin Purchase - ${coinPlan.coin} Coins`,
      shipping: {
        name: billing_details.name,
        address: {
          line1: billing_details?.address?.line1,
          line2: billing_details?.address?.line2,
          postal_code: billing_details?.address?.postal_code,
          city: billing_details?.address?.city,
          state: billing_details?.address?.state,
          country: billing_details?.address?.country,
        },
      },
      payment_method: payment_method_id,
    });

    console.log("Stripe PaymentIntent created:", intent.id);

    intent = await stripe.paymentIntents.confirm(intent.id);
    console.log("PaymentIntent status after confirmation:", intent.status);

    if (intent.status === "requires_action" && intent.next_action.type === "use_stripe_sdk") {
      return res.status(200).json({
        status: true,
        requires_action: true,
        payment_intent_client_secret: intent.client_secret,
      });
    } else if (intent.status === "succeeded") {
      console.log("Payment successful");

      const history = new CoinPlanHistory();
      history.userId = user._id;
      history.coinplanId = coinPlan._id;
      history.paymentGateway = "Stripe";
      history.date = moment().toISOString();

      const newCoinPlan = {
        amount: coinPlan.amount,
        coin: coinPlan.coin,
        extraCoin: coinPlan.extraCoin,
        purchasedAt: new Date(),
      };

      const totalCoins = coinPlan.coin + coinPlan.extraCoin;

      await Promise.all([
        User.updateOne(
          { _id: userId },
          {
            $inc: {
              coin: totalCoins,
              purchasedCoin: coinPlan.coin,
            },
            $push: {
              coinplan: newCoinPlan,
            },
          },
        ),
        history.save(),
        History.create({
          userId: user._id,
          coinplan: coinPlan._id,
          coin: coinPlan.coin,
          rewardCoins: coinPlan.extraCoin,
          amount: coinPlan.amount,
          paymentGateway: "stripe",
          uniqueId: uniqueId,
          type: 8,
          date: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
        }),
      ]);

      return res.status(200).json({
        status: true,
        message: "Payment successful, coins added to your account.",
        payment_intent_client_secret: intent.client_secret,
      });
    } else {
      return res.status(200).json({
        status: false,
        message: "Payment failed. Invalid PaymentIntent status.",
      });
    }
  } catch (error) {
    console.error("Error in payment processing:", error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

//integrate razorpay's order creation ( web )
exports.processRazorpayPayment = async (req, res) => {
  try {
    let { amount, currency = "INR", receipt } = req.body || {};

    if (!amount || !receipt) {
      return res.status(200).json({ status: false, message: "Amount and receipt are required" });
    }

    currency = currency?.toUpperCase() || "INR";

    const razorpay = new Razorpay({
      key_id: settingJSON.razorPayId,
      key_secret: settingJSON.razorSecretKey,
    });

    const options = {
      amount: amount * 100, // Convert amount to the smallest unit
      currency: "INR",
      receipt,
    };

    const order = await razorpay.orders.create(options);
    console.log("order: ", order);

    return res.status(200).json({
      status: true,
      message: "Order created successfully",
      order,
    });
  } catch (error) {
    console.error("Error in order creation:", error);

    const statusCode = error.statusCode || 500;
    const description = error.error?.description || error.message || "Internal Server Error";

    return res.status(statusCode).json({ status: false, error: description, code: error.error?.code || "UNKNOWN_ERROR" });
  }
};
