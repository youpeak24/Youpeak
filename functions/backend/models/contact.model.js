const mongoose = require("../util/mongooseShim");

const contactSchema = new mongoose.Schema(
  {
    name: { type: String },
    link: { type: String },
    image: { type: String },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model("Contact", contactSchema);
