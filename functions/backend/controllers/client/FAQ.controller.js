const FAQ = require("../../models/FAQ.model");

//get FAQ
exports.get = async (req, res) => {
  try {
    const FaQ = await FAQ.find().sort({ createdAt: 1 }).lean();

    return res.status(200).json({ status: true, message: "data get Successfully.", FaQ });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server error" });
  }
};
