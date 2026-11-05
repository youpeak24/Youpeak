const SoundList = require("../../models/soundsList.model");

//import model
const SoundCategory = require("../../models/soundCategory.model");

//deleteFromStorage
const { deleteFromStorage } = require("../../util/storageHelper");

const mongoose = require("../../util/mongooseShim");

//create soundList by admin
exports.createSoundList = async (req, res) => {
  try {
    if (!req.body.singerName || !req.body.soundTitle || !req.body.soundLink || !req.body.soundTime || !req.body.soundImage || !req.body.soundCategoryId) {
      return res.status(200).json({ status: false, message: "Oops ! Invalid details!!" });
    }

    const soundCategory = await SoundCategory.findById(req.body.soundCategoryId);
    if (!soundCategory) {
      return res.status(200).json({ status: false, message: "soundCategory does not found!" });
    }

    const soundList = new SoundList();
    soundList.singerName = req.body.singerName;
    soundList.soundTitle = req.body.soundTitle;
    soundList.soundLink = req.body.soundLink;
    soundList.soundTime = req.body.soundTime;
    soundList.soundImage = req.body.soundImage;
    soundList.soundCategoryId = soundCategory._id;

    await soundList.save();

    const data = await SoundList.findById(soundList._id).populate("soundCategoryId", "name image");

    return res.status(200).json({
      status: true,
      message: "finally, soundList added by admin!",
      soundList: data,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      error: error.message || "Internal Server Error",
    });
  }
};

//update soundList by admin
exports.updateSoundList = async (req, res) => {
  try {
    if (!req.query.soundListId) {
      return res.status(200).json({ status: false, message: "Oops ! Invalid details!!" });
    }

    const soundList = await SoundList.findById(req.query.soundListId);
    if (!soundList) {
      return res.status(200).json({ status: false, message: "soundList does not found!" });
    }

    if (req.body.soundCategoryId) {
      const soundCategory = await SoundCategory.findById(req.body.soundCategoryId);
      if (!soundCategory) {
        return res.status(200).json({ status: false, message: "soundCategory does not found!" });
      }

      soundList.soundCategoryId = req.body.soundCategoryId ? soundCategory._id : soundList.soundCategoryId;
    }

    soundList.singerName = req.body.singerName ? req.body.singerName : soundList.singerName;
    soundList.soundTitle = req.body.soundTitle ? req.body.soundTitle : soundList.soundTitle;
    soundList.soundTime = req.body.soundTime ? req.body.soundTime : soundList.soundTime;

    if (req?.body?.soundLink) {
      if (soundList.soundLink) {
        await deleteFromStorage(soundList.soundLink);
      }

      soundList.soundLink = req.body.soundLink ? req.body.soundLink : soundList.soundLink;
    }

    if (req?.body?.soundImage) {
      if (soundList.soundImage) {
        await deleteFromStorage(soundList.soundImage);
      }

      soundList.soundImage = req.body.soundImage ? req.body.soundImage : soundList.soundImage;
      console.log("updated soundList soundImage: ", soundList.soundImage);
    }

    await soundList.save();

    const data = await SoundList.findById(soundList._id).populate("soundCategoryId", "name image");

    return res.status(200).json({
      status: true,
      message: "finally, soundList updated by admin!",
      soundList: data,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      error: error.message || "Internal Server Error",
    });
  }
};

//get all soundList
exports.getSoundList = async (req, res, next) => {
  try {
    const search = req.query.search ? req.query.search.trim() : "";
    const page = req.query.start ? parseInt(req.query.start) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;
    const skip = (page - 1) * limit;

    const pipeline = [
      {
        $lookup: {
          from: "soundcategories",
          localField: "soundCategoryId",
          foreignField: "_id",
          as: "soundCategoryId",
        },
      },
      {
        $unwind: {
          path: "$soundCategoryId",
          preserveNullAndEmptyArrays: true,
        },
      },
    ];

    if (search) {
      pipeline.push({
        $match: {
          $or: [{ singerName: { $regex: search, $options: "i" } }, { soundTitle: { $regex: search, $options: "i" } }, { "soundCategoryId.name": { $regex: search, $options: "i" } }],
        },
      });
    }

    pipeline.push(
      {
        $project: {
          singerName: 1,
          soundTitle: 1,
          soundTime: 1,
          soundLink: 1,
          soundImage: 1,
          createdAt: 1,
          soundCategoryId: {
            _id: "$soundCategoryId._id",
            name: "$soundCategoryId.name",
            image: "$soundCategoryId.image",
          },
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $facet: {
          data: [{ $skip: skip }, { $limit: limit }],
          totalCount: [{ $count: "count" }],
        },
      },
    );

    const result = await SoundList.aggregate(pipeline);

    const data = result[0].data;
    const total = result[0].totalCount[0]?.count || 0;

    return res.status(200).json({
      status: true,
      message: "finally, get all soundList by admin!",
      soundList: data,
      total,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      message: error.message || "Internal Server Error",
    });
  }
};

//delete soundList by admin (multiple or single)
exports.deleteSoundList = async (req, res) => {
  try {
    if (!req.query.soundListId) {
      return res.status(200).json({
        status: false,
        message: "soundListId must be required!",
      });
    }

    const soundListIds = req.query.soundListId.split(",").filter((id) => mongoose.Types.ObjectId.isValid(id));

    if (!soundListIds.length) {
      return res.status(200).json({
        status: false,
        message: "Invalid soundListId!",
      });
    }

    const soundLists = await SoundList.find({
      _id: { $in: soundListIds },
    })
      .select("soundImage soundLink")
      .lean();

    if (!soundLists.length) {
      return res.status(200).json({
        status: false,
        message: "No soundLists found with the provided IDs.",
      });
    }

    const filesToDelete = [];

    soundLists.forEach((sound) => {
      if (sound.soundImage) filesToDelete.push(sound.soundImage);
      if (sound.soundLink) filesToDelete.push(sound.soundLink);
    });

    await Promise.all(filesToDelete.map((file) => deleteFromStorage(file)));

    const result = await SoundList.deleteMany({
      _id: { $in: soundListIds },
    });

    return res.status(200).json({
      status: true,
      message: "SoundLists deleted successfully!",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};
