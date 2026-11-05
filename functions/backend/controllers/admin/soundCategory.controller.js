const SoundCategory = require("../../models/soundCategory.model");
const SoundList = require("../../models/soundsList.model");

//deleteFromStorage
const { deleteFromStorage } = require("../../util/storageHelper");

const mongoose = require("../../util/mongooseShim");

//create soundCategory
exports.create = async (req, res) => {
  try {
    if (!req.body.name || !req.body.image) {
      if (req.body.image) {
        await deleteFromStorage(req.body.image);
      }

      return res.status(200).json({ status: false, message: "Oops ! Invalid details!" });
    }

    const soundCategory = new SoundCategory();
    soundCategory.name = req.body.name;
    soundCategory.image = req.body.image;
    await soundCategory.save();

    return res.status(200).json({
      status: true,
      message: "soundCategory created by admin!",
      soundCategory,
    });
  } catch (error) {
    if (req.body.image) {
      await deleteFromStorage(req.body.image);
    }
    console.log(error);
    return res.status(500).json({
      status: false,
      error: error.message || "Internal Server Error",
    });
  }
};

//update soundCategory
exports.update = async (req, res) => {
  try {
    if (!req.query.soundCategoryId) {
      if (req.body.image) {
        await deleteFromStorage(req.body.image);
      }
      return res.status(200).json({ status: false, message: "soundCategoryId must be required!!" });
    }

    const soundCategory = await SoundCategory.findOne({ _id: req.query.soundCategoryId, isActive: true });
    if (!soundCategory) {
      if (req.body.image) {
        await deleteFromStorage(req.body.image);
      }
      return res.status(200).json({ status: false, message: "soundCategory does not found!!" });
    }

    if (req.body.image) {
      if (soundCategory.image) {
        await deleteFromStorage(soundCategory.image);
      }

      soundCategory.image = req.body.image ? req.body.image : soundCategory.image;
    }

    soundCategory.name = req.body.name ? req.body.name : soundCategory.name;
    await soundCategory.save();

    return res.status(200).json({
      status: true,
      message: "soundCategory updated by admin!",
      soundCategory,
    });
  } catch (error) {
    if (req.body.image) {
      await deleteFromStorage(req.body.image);
    }
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//delete soundCategory
exports.destroy = async (req, res) => {
  try {
    if (!req.query.soundCategoryId) {
      return res.status(200).json({ status: false, message: "soundCategoryId must be required!" });
    }

    const soundCategoryIds = req.query.soundCategoryId.split(",").filter((id) => mongoose.Types.ObjectId.isValid(id));

    if (!soundCategoryIds.length) {
      return res.status(200).json({ status: false, message: "Invalid soundCategoryId!" });
    }

    const categories = await SoundCategory.find({
      _id: { $in: soundCategoryIds },
    })
      .select("image")
      .lean();

    if (!categories.length) {
      return res.status(200).json({ status: false, message: "No SoundCategories found." });
    }

    const sounds = await SoundList.find({
      soundCategoryId: { $in: soundCategoryIds },
    })
      .select("soundLink soundImage")
      .lean();

    const filesToDelete = [];

    categories.forEach((cat) => {
      if (cat.image) filesToDelete.push(cat.image);
    });

    sounds.forEach((sound) => {
      if (sound.soundLink) filesToDelete.push(sound.soundLink);
      if (sound.soundImage) filesToDelete.push(sound.soundImage);
    });

    await Promise.all(filesToDelete.map((file) => deleteFromStorage(file)));

    await SoundList.deleteMany({
      soundCategoryId: { $in: soundCategoryIds },
    });

    const result = await SoundCategory.deleteMany({
      _id: { $in: soundCategoryIds },
    });

    return res.status(200).json({
      status: true,
      message: "SoundCategories and related sounds deleted successfully!",
      deletedCategories: result.deletedCount,
      deletedSounds: sounds.length,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

//get all soundCategory
exports.get = async (req, res) => {
  try {
    const search = req.query.search ? req.query.search.trim() : "";
    
    const start = req.query.start ? parseInt(req.query.start) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;
    const skip = (start - 1) * limit;

    const pipeline = [];

    if (search) {
      pipeline.push({
        $match: {
          name: { $regex: search, $options: "i" },
        },
      });
    }

    pipeline.push(
      {
        $sort: { createdAt: -1 },
      },
      {
        $facet: {
          soundCategory: [{ $skip: skip }, { $limit: limit }],
          totalCount: [{ $count: "count" }],
        },
      },
    );

    const result = await SoundCategory.aggregate(pipeline);

    const soundCategory = result[0].soundCategory;
    const total = result[0].totalCount[0]?.count || 0;

    return res.status(200).json({
      status: true,
      message: "finally, get all soundCategory by admin!",
      total,
      soundCategory,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      error: error.message || "Internal Server error",
    });
  }
};
