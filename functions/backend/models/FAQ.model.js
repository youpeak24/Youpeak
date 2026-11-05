const mongoose = require("../util/mongooseShim");

const FAQSchema = new mongoose.Schema(
  {
    question: { type: String },
    answer: { type: String },
    isView: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model("FAQ", FAQSchema);
