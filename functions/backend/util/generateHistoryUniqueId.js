"use strict";
const scheduler = require("./scheduler");
const History = require("../models/history.model");
const WalletHistory = require("../models/walletHistory.model");

async function generateHistoryUniqueId() {
  let uniqueId;
  let exists = true;
  while (exists) {
    uniqueId = "#" + Math.floor(100000 + Math.random() * 900000).toString();
    try {
      const h1 = await History.findOne({ uniqueId }).lean();
      const h2 = await WalletHistory.findOne({ uniqueId }).lean();
      exists = Boolean(h1 || h2);
    } catch (e) {
      exists = false;
    }
  }
  return uniqueId;
}

module.exports = { generateHistoryUniqueId };
