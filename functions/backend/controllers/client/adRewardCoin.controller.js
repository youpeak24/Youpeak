const AdRewardCoin = require("../../models/adRewardCoin.model");

//import models
const User = require("../../models/user.model");

const mongoose = require("../../util/mongooseShim");

// get ad reward coin by user
exports.getAdRewardByUser = async (req, res) => {
  try {
    if (!req.query.userId) {
      return res.status(200).json({ status: false, message: "Oops! Invalid details!" });
    }

    const userId = new mongoose.Types.ObjectId(req.query.userId);

    const page = parseInt(req.query.start) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const userPromise = User.findOne({ _id: userId, isActive: true }).select("watchAds").lean();
    const adRewardPromise = AdRewardCoin.aggregate([
      { $sort: { coinEarnedFromAd: 1 } },
      {
        $facet: {
          data: [{ $skip: skip }, { $limit: limit }],
          totalCount: [{ $count: "total" }],
        },
      },
    ]);

    const [user, adRewardResult] = await Promise.all([userPromise, adRewardPromise]);

    const adRewardData = adRewardResult[0]?.data || [];
    const total = adRewardResult[0]?.totalCount[0]?.total || 0;

    return res.status(200).json({
      status: true,
      message: "Retrive AdRewardCoin Successfully",
      userWatchAds: user?.watchAds,
      total: total,
      data: adRewardData,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server error" });
  }
};
