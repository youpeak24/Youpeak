const mongoose = require("../util/mongooseShim");

const soundCategorySchema = new mongoose.Schema(
  {
    name: { type: String },
    image: { type: String },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

soundCategorySchema.index({ isActive: 1 });

module.exports = mongoose.model("SoundCategory", soundCategorySchema);
