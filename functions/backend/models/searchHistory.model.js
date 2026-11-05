const mongoose = require("../util/mongooseShim");

const searchHistorySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    searchString: { type: String },
    searchData: {
      sortBy: { type: String, default: "" },
      type: { type: String, default: "" },
      uploadDate: { type: String, default: "" },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

searchHistorySchema.index({ userId: 1 });
searchHistorySchema.index({ searchString: 1 });

module.exports = mongoose.model("SearchHistory", searchHistorySchema);
