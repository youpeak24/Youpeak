const Withdraw = require("../../models/withdraw.model");

//deleteFromStorage
const { deleteFromStorage } = require("../../util/storageHelper");

//store Withdraw
exports.store = async (req, res) => {
  try {
    if (!req?.body?.name || !req?.body?.details || !req?.body?.image) {
      return res.status(200).json({ status: false, message: "Oops ! Invalid details!" });
    }

    const withdraw = new Withdraw();
    withdraw.name = req?.body?.name;
    withdraw.details = req?.body?.details?.split(",");
    withdraw.image = req?.body?.image;
    // Set explicitly: the Firestore mongoose shim doesn't apply schema
    // defaults, so the model's `isEnabled: true` default never reached the
    // DB and the app's withdrawList (isEnabled === true) hid every new method.
    withdraw.isEnabled = true;
    await withdraw.save();

    return res.status(200).json({
      status: true,
      message: "withdraw method created by admin!!",
      withdraw,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      error: error.message || "Internal Server Error",
    });
  }
};

//update Withdraw
exports.update = async (req, res) => {
  try {
    if (!req.query.withdrawId) {
      return res.status(200).json({ status: false, message: "Oops ! Invalid details!" });
    }

    const withdraw = await Withdraw.findById(req.query.withdrawId);
    if (!withdraw) {
      return res.status(200).json({ status: false, message: "withdraw does not found!!" });
    }

    if (req.body.image) {
      if (withdraw.image) {
        await deleteFromStorage(withdraw.image);
      }

      withdraw.image = req?.body?.image ? req?.body?.image : withdraw.image;
    }

    withdraw.name = req?.body?.name ? req?.body?.name : withdraw.name;
    withdraw.details = req?.body?.details.toString() ? req?.body?.details.toString().split(",") : withdraw.details;
    await withdraw.save();

    return res.status(200).json({
      status: true,
      message: "withdraw method updated by admin!",
      withdraw,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//delete Withdraw
exports.delete = async (req, res) => {
  try {
    if (!req.query.withdrawId) {
      return res.status(200).json({ status: false, message: "Oops ! Invalid details!!" });
    }

    const withdraw = await Withdraw.findById(req.query.withdrawId);
    if (!withdraw) {
      return res.status(200).json({ status: false, message: "withdraw does not found!!" });
    }

    res.status(200).json({
      status: true,
      message: "withdraw method deleted by admin!",
    });

    if (withdraw.image) {
      await deleteFromStorage(withdraw.image);
    }

    await withdraw.deleteOne();
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      error: error.message || "Internal Server Error",
    });
  }
};

//get Withdraw
exports.get = async (req, res) => {
  try {
    // Missing flag = enabled (see store()), so the admin switch matches the app.
    const withdraw = (await Withdraw.find().sort({ createdAt: 1 }).lean()).map((m) => ({ ...m, isEnabled: m.isEnabled !== false }));

    return res.status(200).json({
      status: true,
      message: "withdraw methods get by admin!",
      withdraw,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//handle isEnabled switch
exports.handleSwitch = async (req, res) => {
  try {
    if (!req.query.withdrawId) {
      return res.status(200).json({ status: false, message: "Oops ! Invalid details!!" });
    }

    const withdraw = await Withdraw.findById(req.query.withdrawId);
    if (!withdraw) {
      return res.status(200).json({ status: false, message: "Withdraw does not found!" });
    }

    // A missing flag counts as enabled, so the first toggle disables it.
    withdraw.isEnabled = withdraw.isEnabled === false;
    await withdraw.save();

    return res.status(200).json({ status: true, message: "Success!!", withdraw });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      error: error.message || "Internal Server Error",
    });
  }
};
