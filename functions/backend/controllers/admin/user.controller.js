const db = require("../../util/connection");
const crypto = require("crypto");

const toBool = (v) => v === true || v === "true";
const num = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);

// create user by admin (a "fake" / admin-seeded user)
exports.fakeUser = async (req, res) => {
  try {
    const b = req.body || {};
    const { fullName, nickName, email, password, channelName } = b;
    if (!fullName || !nickName || !email) {
      return res.status(200).json({ status: false, message: "Required fields missing" });
    }

    const newUser = await db.create("users", {
      fullName,
      nickName,
      email,
      password: password || crypto.randomBytes(12).toString("hex"),
      // gender/mobileNumber/age/image/country/ipAddress/social links: the
      // create-fake-user form collects all of these, but only
      // fullName/nickName/email/password/channelName ever reached storage —
      // everything else was silently discarded.
      gender: b.gender || "",
      mobileNumber: b.mobileNumber || null,
      age: num(b.age, 0),
      image: b.image || null,
      country: b.country || null,
      ipAddress: b.ipAddress || null,
      socialMediaLinks: {
        instagramLink: b.instagramLink || "",
        facebookLink: b.facebookLink || "",
        twitterLink: b.twitterLink || "",
        websiteLink: b.websiteLink || "",
      },
      isChannel: !!channelName,
      // The real "this was created by an admin" flag is isAddByAdmin (used
      // elsewhere in the codebase, e.g. video.controller.js's
      // isAddByAdmin:false check). isFake was never a schema field, so
      // every downstream isFake query — including this file's own
      // getUsersAddByAdminForChannel below — was quietly matching nothing.
      isAddByAdmin: true,
      isActive: true,
      isBlock: false,
      coin: 0,
    });

    return res.status(200).json({ status: true, message: "User created successfully", user: newUser });
  } catch (error) {
    return res.status(500).json({ status: false, message: error.message });
  }
};

// update user — also used for the "Create Channel" flow (isChannel arrives
// as a query param there) and the profile-edit flow (social links arrive as
// flat top-level fields, but the schema nests them under socialMediaLinks.*).
exports.updateUser = async (req, res) => {
  try {
    const userId = (req.body && req.body.userId) || (req.query && req.query.userId);
    if (!userId) return res.status(200).json({ status: false, message: "userId is required." });

    const existing = await db.findById("users", userId);
    if (!existing) return res.status(200).json({ status: false, message: "User not found." });

    const b = req.body || {};
    const patch = {};
    for (const k of [
      "fullName", "nickName", "email", "gender", "mobileNumber", "age", "image",
      "country", "descriptionOfChannel", "channelType", "subscriptionCost", "videoUnlockCost",
    ]) {
      if (b[k] !== undefined) patch[k] = b[k];
    }

    // Merge onto the EXISTING socialMediaLinks — a bare {socialMediaLinks:{...}}
    // write would replace the whole nested map and blank out the other links.
    const socialUpdates = {};
    if (b.socialMediaLinks && typeof b.socialMediaLinks === "object") Object.assign(socialUpdates, b.socialMediaLinks);
    for (const k of ["instagramLink", "facebookLink", "twitterLink", "websiteLink"]) {
      if (b[k] !== undefined) socialUpdates[k] = b[k];
    }
    if (Object.keys(socialUpdates).length) {
      patch.socialMediaLinks = { ...(existing.socialMediaLinks || {}), ...socialUpdates };
    }

    const isChannelRaw = b.isChannel !== undefined ? b.isChannel : (req.query && req.query.isChannel);
    if (isChannelRaw !== undefined) patch.isChannel = toBool(isChannelRaw);

    if (!Object.keys(patch).length) {
      return res.status(200).json({ status: false, message: "No fields to update." });
    }

    const updated = await db.update("users", userId, patch);
    return res.status(200).json({ status: true, message: "User updated successfully", user: updated });
  } catch (error) {
    return res.status(500).json({ status: false, message: error.message });
  }
};

// handle isActive — accepts a comma-separated userId list for bulk actions,
// and an explicit target state (?isActive=true|false) when the caller
// already knows what it wants (falls back to toggling a single user).
exports.isActive = async (req, res) => {
  try {
    const raw = req.query.userId;
    if (!raw) return res.status(200).json({ status: false, message: "userId is required." });
    const ids = String(raw).split(",").map((s) => s.trim()).filter(Boolean);
    const explicitTarget = req.query.isActive !== undefined ? toBool(req.query.isActive) : null;

    const updated = [];
    for (const id of ids) {
      const user = await db.findById("users", id);
      if (!user) continue;
      const nextValue = explicitTarget !== null ? explicitTarget : !user.isActive;
      updated.push(await db.update("users", id, { isActive: nextValue }));
    }
    if (!updated.length) return res.status(200).json({ status: false, message: "User not found" });
    return res.status(200).json({ status: true, message: "Success", user: updated[0], users: updated });
  } catch (error) {
    return res.status(500).json({ status: false, message: error.message });
  }
};

// handle isBlock — same bulk + explicit-target support as isActive above.
// Real bug this closes: bulk block/unblock sent "id1,id2,id3" as a single
// userId (Array.toString() in the URL template literal), which
// db.findById() looked up as one literal, nonexistent document id — every
// bulk block/unblock click failed outright.
exports.isBlock = async (req, res) => {
  try {
    const raw = req.query.userId;
    if (!raw) return res.status(200).json({ status: false, message: "userId is required." });
    const ids = String(raw).split(",").map((s) => s.trim()).filter(Boolean);
    const explicitTarget = req.query.isBlock !== undefined ? toBool(req.query.isBlock) : null;

    const updated = [];
    for (const id of ids) {
      const user = await db.findById("users", id);
      if (!user) continue;
      const nextValue = explicitTarget !== null ? explicitTarget : !user.isBlock;
      updated.push(await db.update("users", id, { isBlock: nextValue }));
    }
    if (!updated.length) return res.status(200).json({ status: false, message: "User not found" });
    return res.status(200).json({ status: true, message: "Success", user: updated[0], users: updated });
  } catch (error) {
    return res.status(500).json({ status: false, message: error.message });
  }
};

// update password
exports.updatePassword = async (req, res) => {
  try {
    const { userId, newPassword } = req.body;
    await db.update("users", userId, { password: newPassword });
    return res.status(200).json({ status: true, message: "Password updated successfully" });
  } catch (error) {
    return res.status(500).json({ status: false, message: error.message });
  }
};

// delete users — same comma-separated-id bulk support. Previously
// "id1,id2,id3" was passed straight to db.delete(), which deletes a
// Firestore doc ref that never exists — no error, no effect, but the
// endpoint still reported success and the frontend removed the rows from
// local state, so they silently reappeared on the next reload.
exports.deleteUsers = async (req, res) => {
  try {
    const raw = req.query.userId;
    if (!raw) return res.status(200).json({ status: false, message: "userId is required." });
    const ids = String(raw).split(",").map((s) => s.trim()).filter(Boolean);

    let deletedCount = 0;
    for (const id of ids) {
      const existing = await db.findById("users", id);
      if (!existing) continue;
      await db.delete("users", id);
      deletedCount++;
    }
    if (!deletedCount) {
      return res.status(200).json({ status: false, message: "No matching users found to delete." });
    }
    return res.status(200).json({ status: true, message: "Users deleted successfully", deletedCount });
  } catch (error) {
    return res.status(500).json({ status: false, message: error.message });
  }
};

// get profile
exports.getProfile = async (req, res) => {
  try {
    const { userId } = req.query;
    const user = await db.findById("users", userId);
    return res.status(200).json({ status: true, message: "Success", user });
  } catch (error) {
    return res.status(500).json({ status: false, message: error.message });
  }
};

// Shared filter/search/paginate for both getUsers and getUsersAddByAdminForChannel.
function filterUsers(users, { type, search, isBlock, startDate, endDate }) {
  let out = users;

  if (type === "realUser") out = out.filter((u) => !u.isAddByAdmin);
  else if (type === "addByAdmin" || type === "addByadmin") out = out.filter((u) => u.isAddByAdmin);

  if (isBlock === "true" || isBlock === "false") {
    const want = isBlock === "true";
    out = out.filter((u) => !!u.isBlock === want);
  }

  if (search && String(search).trim()) {
    const re = new RegExp(String(search).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    out = out.filter((u) => re.test(u.fullName || "") || re.test(u.email || "") || re.test(u.nickName || "") || re.test(u.uniqueId || ""));
  }

  if (startDate && endDate && startDate !== "All" && endDate !== "All") {
    const s = new Date(startDate).getTime();
    const e = new Date(endDate);
    e.setHours(23, 59, 59, 999);
    const eTime = e.getTime();
    out = out.filter((u) => {
      const t = new Date(u.createdAt || 0).getTime();
      return t >= s && t <= eTime;
    });
  }

  return out;
}

// get users — the "User"/"Fake User" tabs, and the search/block-filter/date-range/
// pagination controls on both of them, all funnel through this one endpoint via
// `type`. It used to ignore every query param and return the entire, unfiltered,
// unpaginated users collection to both tabs identically.
exports.getUsers = async (req, res) => {
  try {
    const start = Math.max(parseInt(req.query.start) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit) || 20, 1);

    let users = await db.find("users", {});
    users = filterUsers(users, req.query);
    users.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    const total = users.length;
    const paginated = users.slice((start - 1) * limit, start * limit);

    return res.status(200).json({ status: true, message: "Success", total, users: paginated });
  } catch (error) {
    return res.status(500).json({ status: false, message: error.message });
  }
};

// get users added by admin for channel (used by the "select a fake user"
// dropdown when creating a channel) — now matches the isAddByAdmin flag
// fakeUser() actually sets, instead of the never-set isFake.
exports.getUsersAddByAdminForChannel = async (req, res) => {
  try {
    let users = await db.find("users", { isAddByAdmin: true });
    return res.status(200).json({ status: true, message: "Success", total: users.length, users });
  } catch (error) {
    return res.status(500).json({ status: false, message: error.message });
  }
};

// get channels of user — channels are User docs flagged isChannel:true (the
// separate "channels" Firestore collection is never written to anywhere in
// the codebase). Same query-param handling as getUsers: search/date-range/
// real-vs-fake/pagination.
exports.channelsOfUser = async (req, res) => {
  try {
    const start = Math.max(parseInt(req.query.start) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit) || 20, 1);

    let channels = await db.find("users", { isChannel: true });
    channels = filterUsers(channels, req.query);
    channels.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    const total = channels.length;
    const paginated = channels.slice((start - 1) * limit, start * limit);

    return res.status(200).json({ status: true, message: "Success", total, channels: paginated });
  } catch (error) {
    return res.status(500).json({ status: false, message: error.message });
  }
};

// delete channel by admin — channelId identifies the channel (a separate
// field from the user's own _id), and "deleting a channel" means clearing
// the channel flags off that user's document, not deleting the account.
// Previously this deleted a doc from the dead "channels" collection — a
// silent no-op that never touched the real, live record, so a "deleted"
// channel stayed fully live in the client app.
exports.deleteChannelByAdmin = async (req, res) => {
  try {
    const { channelId } = req.query;
    if (!channelId) return res.status(200).json({ status: false, message: "channelId is required." });

    const user = await db.findOne("users", { channelId });
    if (!user) return res.status(200).json({ status: false, message: "Channel not found." });

    await db.update("users", user._id || user.id, {
      isChannel: false,
      channelId: null,
      channelType: 1,
      descriptionOfChannel: null,
    });

    return res.status(200).json({ status: true, message: "Channel deleted successfully" });
  } catch (error) {
    return res.status(500).json({ status: false, message: error.message });
  }
};

// fetch user coin + VIP history
// "All Plan Earning" (Order History): every coin-plan (type 8) and premium-
// plan (type 11) purchase, joined with the buyer's display info. Previously
// read "wallet_history" — a plain ledger with none of the fields the admin
// page actually renders (no paymentGateway, no rewardCoins, no user info)
// — and ignored every query param, so search/date-range/gateway filtering
// and pagination all did nothing.
exports.fetchUserCoinVipHistory = async (req, res) => {
  try {
    const start = Math.max(parseInt(req.query.start) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit) || 20, 1);
    const { search, paymentGateway, startDate, endDate } = req.query;

    let rows = await db.find("histories", {});
    rows = rows.filter((r) => r.type === 8 || r.type === 11);

    if (paymentGateway && paymentGateway !== "All") {
      const wanted = String(paymentGateway).split(",").map((g) => g.trim().toLowerCase()).filter(Boolean);
      rows = rows.filter((r) => wanted.includes(String(r.paymentGateway || "").toLowerCase()));
    }

    if (startDate && endDate && startDate !== "All" && endDate !== "All") {
      const s = new Date(startDate).getTime();
      const e = new Date(endDate);
      e.setHours(23, 59, 59, 999);
      const eTime = e.getTime();
      rows = rows.filter((r) => {
        const t = new Date(r.createdAt || r.date || 0).getTime();
        return t >= s && t <= eTime;
      });
    }

    const userIds = [...new Set(rows.map((r) => String(r.userId || "")).filter(Boolean))];
    const users = userIds.length ? await Promise.all(userIds.map((id) => db.findById("users", id).catch(() => null))) : [];
    const byId = {};
    userIds.forEach((id, i) => { if (users[i]) byId[id] = users[i]; });

    if (search && String(search).trim()) {
      const re = new RegExp(String(search).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      rows = rows.filter((r) => {
        const u = byId[String(r.userId || "")];
        return (
          re.test(r.uniqueId || "") ||
          re.test(r.paymentGateway || "") ||
          (u && (re.test(u.fullName || "") || re.test(u.nickName || "") || re.test(u.uniqueId || "")))
        );
      });
    }

    rows.sort((a, b) => new Date(b.createdAt || b.date || 0) - new Date(a.createdAt || a.date || 0));

    const total = rows.length;
    const paginated = rows.slice((start - 1) * limit, start * limit).map((r) => {
      const u = byId[String(r.userId || "")];
      return {
        _id: r._id || r.id,
        uniqueId: r.uniqueId || "",
        type: r.type,
        coin: r.coin || 0,
        rewardCoins: r.rewardCoins || 0,
        amount: r.amount || 0,
        paymentGateway: r.paymentGateway || "",
        createdAt: r.createdAt || r.date || null,
        user: u ? { fullName: u.fullName, nickName: u.nickName, image: u.image, userUniqueId: u.uniqueId } : null,
      };
    });

    return res.status(200).json({ status: true, message: "Success", total, data: paginated });
  } catch (error) {
    return res.status(500).json({ status: false, message: error.message });
  }
};

// toggle paymentStatus — Admin can manually verify a user's web portal payment
// Per: Youpeak_Final_Developer_Blueprint — paymentStatus must be true for full access
exports.togglePaymentStatus = async (req, res) => {
  try {
    const { userId } = req.query;
    const user = await db.findById("users", userId);
    if (!user) return res.status(200).json({ status: false, message: "User not found" });

    const newStatus = !user.paymentStatus;
    const updated = await db.update("users", userId, {
      paymentStatus: newStatus,
      paymentVerifiedAt: newStatus ? new Date() : null,
    });
    return res.status(200).json({
      status: true,
      message: `Payment status set to ${newStatus ? "Verified" : "Unverified"}`,
      user: updated,
    });
  } catch (error) {
    return res.status(500).json({ status: false, message: error.message });
  }
};

// Payment webhook handler — called by Razorpay/PhonePe after successful web portal payment
// Per: Youpeak_App_Integration_Guide — "backend must instantly update user record with mobile_number and payment_status: true"
exports.paymentWebhook = async (req, res) => {
  try {
    const { mobileNumber, gatewayRef, event } = req.body;
    if (!mobileNumber) {
      return res.status(200).json({ status: false, message: "mobileNumber is required" });
    }

    // Only process successful payment events
    const successEvents = ["payment.captured", "payment_captured", "PAYMENT_SUCCESS", "SUCCESS"];
    if (event && !successEvents.includes(event)) {
      return res.status(200).json({ status: true, message: "Event acknowledged, no action needed" });
    }

    const User = require("../../models/user.model");
    const user = await User.findOneAndUpdate(
      { mobileNumber: String(mobileNumber) },
      {
        paymentStatus: true,
        paymentVerifiedAt: new Date(),
        paymentGatewayRef: gatewayRef || null,
      },
      { new: true }
    );

    if (!user) {
      return res.status(200).json({ status: false, message: "User with this mobile number not found" });
    }

    return res.status(200).json({
      status: true,
      message: "Payment verified. User account activated.",
      userId: user._id,
    });
  } catch (error) {
    return res.status(500).json({ status: false, message: error.message });
  }
};
