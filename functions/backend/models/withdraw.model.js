const mongoose = require("../util/mongooseShim");

const withdrawSchema = new mongoose.Schema(
  {
    name: { type: String, default: "" },
    image: { type: String, default: "" },
    details: { type: Array, default: [] },
    isEnabled: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

withdrawSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Withdraw", withdrawSchema);
