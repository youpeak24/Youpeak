const Withdraw = require("../../models/withdraw.model");

//get withdraw method added by admin
exports.withdrawList = async (req, res) => {
  try {
    // A method stored without the flag is enabled (the model default, which
    // the Firestore shim never wrote) — only an explicit false hides it.
    const withdrawMethod = (await Withdraw.find({}).sort({ createdAt: -1 }).lean()).filter((m) => m.isEnabled !== false);

    return res.status(200).json({
      status: true,
      message: "finally, get withdraw method added by admin.",
      withdrawMethod,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};
