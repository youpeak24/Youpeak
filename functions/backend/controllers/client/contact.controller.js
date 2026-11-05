const Contact = require("../../models/contact.model");

//get contact
exports.get = async (req, res) => {
  try {
    const contact = await Contact.find().sort({ createdAt: -1 }).lean();

    return res.status(200).json({ status: true, message: "Success", contact });
  } catch (error) {
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};
