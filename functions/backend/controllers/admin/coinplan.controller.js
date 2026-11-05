const db = require("../../util/connection");
const fs = require("fs");

// create coinplan
exports.store = async (req, res) => {
  try {
    if (!req.body.coin || !req.body.extraCoin || !req.body.amount || !req.body.productKey) {
      return res.status(200).json({ status: false, message: "Oops ! Invalid details." });
    }

    const { coin, extraCoin, amount, productKey } = req.body;
    const planId = "coinplan_" + Date.now();

    const coinplanData = {
      _id: planId,
      coin: Number(coin),
      extraCoin: Number(extraCoin),
      amount: Number(amount),
      productKey: String(productKey),
      isPopular: false,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    await db.create("coinplans", coinplanData, planId);

    return res.status(200).json({
      status: true,
      message: "Coinplan created successfully!",
      data: coinplanData,
    });
  } catch (error) {
    console.error("Error creating coinplan:", error);
    return res.status(200).json({ status: false, error: error.message || "Failed to create coinplan" });
  }
};

// update coinplan
exports.update = async (req, res) => {
  try {
    if (!req.query.coinPlanId) {
      return res.status(200).json({ status: false, message: "coinPlanId must be needed." });
    }

    const coinplan = await db.findById("coinplans", req.query.coinPlanId);
    if (!coinplan) {
      return res.status(200).json({ status: false, message: "CoinPlan not found." });
    }

    const updatedData = {
      coin: req.body.coin !== undefined ? Number(req.body.coin) : coinplan.coin,
      extraCoin: req.body.extraCoin !== undefined ? Number(req.body.extraCoin) : coinplan.extraCoin,
      amount: req.body.amount !== undefined ? Number(req.body.amount) : coinplan.amount,
      productKey: req.body.productKey ? req.body.productKey : coinplan.productKey,
    };

    const result = await db.update("coinplans", req.query.coinPlanId, updatedData);

    return res.status(200).json({
      status: true,
      message: "Coinplan updated successfully!",
      data: result,
    });
  } catch (error) {
    console.error("Error updating coinplan:", error);
    return res.status(200).json({ status: false, error: error.message || "Failed to update coinplan" });
  }
};

// handle isPopular switch
exports.handleisPopularSwitch = async (req, res) => {
  try {
    if (!req.query.coinPlanId) {
      return res.status(200).json({ status: false, message: "coinPlanId must be needed." });
    }

    const coinplan = await db.findById("coinplans", req.query.coinPlanId);
    if (!coinplan) {
      return res.status(200).json({ status: false, message: "CoinPlan not found." });
    }

    const newStatus = !coinplan.isPopular;
    const result = await db.update("coinplans", req.query.coinPlanId, { isPopular: newStatus });

    return res.status(200).json({ status: true, message: "Success", data: result });
  } catch (error) {
    console.error("Error toggling isPopular:", error);
    return res.status(200).json({ status: false, error: error.message });
  }
};

// handle isActive switch
exports.handleisActiveSwitch = async (req, res) => {
  try {
    if (!req.query.coinPlanId) {
      return res.status(200).json({ status: false, message: "coinPlanId must be needed." });
    }

    const coinplan = await db.findById("coinplans", req.query.coinPlanId);
    if (!coinplan) {
      return res.status(200).json({ status: false, message: "CoinPlan not found." });
    }

    const newStatus = !coinplan.isActive;
    const result = await db.update("coinplans", req.query.coinPlanId, { isActive: newStatus });

    return res.status(200).json({ status: true, message: "Success", data: result });
  } catch (error) {
    console.error("Error toggling isActive:", error);
    return res.status(200).json({ status: false, error: error.message });
  }
};

// delete coinplan
exports.delete = async (req, res) => {
  try {
    if (!req.query.coinPlanId) {
      return res.status(200).json({ status: false, message: "coinPlanId must be needed." });
    }

    const coinplan = await db.findById("coinplans", req.query.coinPlanId);
    if (!coinplan) {
      return res.status(200).json({ status: false, message: "CoinPlan not found." });
    }

    await db.delete("coinplans", req.query.coinPlanId);

    return res.status(200).json({
      status: true,
      message: "Coinplan deleted successfully!",
      data: coinplan,
    });
  } catch (error) {
    console.error("Error deleting coinplan:", error);
    return res.status(200).json({ status: false, error: error.message });
  }
};

// get coinPlan
exports.fetchCoinplan = async (req, res) => {
  try {
    const coinPlans = await db.find("coinplans");
    coinPlans.sort((a, b) => (a.coin || 0) - (b.coin || 0));

    return res.status(200).json({
      status: true,
      message: "Retrieved CoinPlan successfully!",
      data: coinPlans,
    });
  } catch (error) {
    console.error("Error fetching coinplan:", error);
    return res.status(200).json({ status: true, message: "Success", data: [] });
  }
};

// get coinplan histories of users
exports.retrieveUserCoinplanRecords = async (req, res) => {
  try {
    const start = Math.max(parseInt(req.query.start) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit) || 20, 1);

    const histories = await db.find("histories", { type: 8 });
    histories.sort((a, b) => new Date(b.createdAt || b.date || 0) - new Date(a.createdAt || a.date || 0));

    const total = histories.length;
    const paginated = histories.slice((start - 1) * limit, start * limit);

    return res.status(200).json({
      status: true,
      message: "Coin plan records retrieved successfully.",
      total,
      data: paginated,
    });
  } catch (error) {
    console.error("Error retrieving user coinplan records:", error);
    return res.status(200).json({ status: true, message: "Success", total: 0, data: [] });
  }
};
