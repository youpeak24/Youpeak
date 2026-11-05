const AdRewardCoin = require("../../models/adRewardCoin.model");
const db = require("../../util/connection");

// This admin form is the ONLY place "coins earned from watching an ad" is
// configured, but rewardEngine.js's actual ad-watch crediting has always
// read a completely different, disconnected value —
// settingJSON.adRewardCoins (itself only ever set as a side-effect of the
// unrelated "Watching Video & Shorts" field on the Engagement Settings
// page). So every AdRewardCoin record an admin created/edited had zero
// effect on what a user was actually paid for watching an ad. Sync
// settingJSON.adRewardCoins to match whenever this form is saved, so the
// control it's actually labelled for does what it says.
async function syncAdRewardCoinsIntoSettings(coinEarnedFromAd) {
  try {
    const amount = Number(coinEarnedFromAd);
    if (!Number.isFinite(amount) || amount < 0) return;
    let setting = await db.findOne("settings", {});
    if (setting) {
      await db.update("settings", setting._id || setting.id, { adRewardCoins: amount });
    } else {
      await db.create("settings", { adRewardCoins: amount }, "default_settings");
    }
    await require("../../util/loadSettings").loadSettings(true);
  } catch (e) {
    console.error("syncAdRewardCoinsIntoSettings error:", e.message);
  }
}

exports.storeAdReward = async (req, res) => {
  try {
    if (!req.body) {
      return res.status(200).json({ status: false, message: "Oops ! Invalid details." });
    }

    if (!settingJSON) {
      return res.status(200).json({ status: false, message: "Setting does not found." });
    }

    const totalAdReward = await AdRewardCoin.countDocuments();

    if (totalAdReward > 0 && totalAdReward >= settingJSON.maxAdPerDay) {
      return res.status(200).json({
        status: false,
        message: `You have already created the maximum ${settingJSON.maxAdPerDay} ads.`,
      });
    }

    const adReward = new AdRewardCoin();
    adReward.adLabel = req.body.adLabel.trim();
    adReward.adDisplayInterval = parseInt(req.body.adDisplayInterval);
    adReward.coinEarnedFromAd = parseInt(req.body.coinEarnedFromAd);
    await adReward.save();
    await syncAdRewardCoinsIntoSettings(adReward.coinEarnedFromAd);

    return res.status(200).json({
      status: true,
      message: "AdRewardCoin create Successfully",
      data: adReward,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server error" });
  }
};

exports.updateAdReward = async (req, res) => {
  try {
    if (!req.body.adRewardId) {
      return res.status(200).json({ status: false, message: "adRewardId must be needed." });
    }

    const adReward = await AdRewardCoin.findOne({ _id: req.body.adRewardId });
    if (!adReward) {
      return res.status(200).json({ status: false, message: "adReward not found." });
    }

    adReward.adLabel = req.body.adLabel ? req.body.adLabel.trim() : adReward.adLabel;
    adReward.adDisplayInterval = req.body.adDisplayInterval ? parseInt(req.body.adDisplayInterval) : adReward.adDisplayInterval;
    adReward.coinEarnedFromAd = req.body.coinEarnedFromAd ? parseInt(req.body.coinEarnedFromAd) : adReward.coinEarnedFromAd;
    await adReward.save();
    await syncAdRewardCoinsIntoSettings(adReward.coinEarnedFromAd);

    return res.status(200).json({
      status: true,
      message: "AdRewardCoin update Successfully",
      data: adReward,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server error" });
  }
};

exports.getAdReward = async (req, res) => {
  try {
    const adReward = await AdRewardCoin.find().sort({ coinEarnedFromAd: 1 }).lean();

    return res.status(200).json({
      status: true,
      message: "Retrive AdRewardCoin Successfully",
      data: adReward,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server error" });
  }
};

exports.deleteAdReward = async (req, res) => {
  try {
    if (!req.query.adRewardId) {
      return res.status(200).json({ status: false, message: "adRewardId must be needed." });
    }

    const adReward = await AdRewardCoin.findOne({ _id: req.query.adRewardId });
    if (!adReward) {
      return res.status(200).json({ status: false, message: "adReward not found." });
    }

    await adReward.deleteOne();

    return res.status(200).json({
      status: true,
      message: "AdRewardCoin delete Successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server error" });
  }
};
