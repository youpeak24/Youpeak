const mongoose = require("../util/mongooseShim");

const adminSchema = new mongoose.Schema(
  {
    name: { type: String, default: "" },
    email: { type: String, default: "" },
    password: { type: String, default: "" },
    image: { type: String, default: "" },
    purchaseCode: { type: String, trim: true, default: "" },
    role: { type: String, enum: ["SUPER_ADMIN", "AGENCY_ADMIN", "DIGITAL_PARTNER_ADMIN"], default: "SUPER_ADMIN" },
    agencyId: { type: mongoose.Schema.Types.ObjectId, ref: "Agency", default: null },
    // DIGITAL_PARTNER_ADMIN's scope link — mirrors agencyId above, but
    // Digital Partners aren't a separate business-entity collection like
    // Agency; the "partner" IS a flagged User. Auto-created alongside that
    // User's PartnerProfile the moment their license purchase succeeds —
    // see controllers/client/payment.controller.js fulfilDigitalPartnerLicense.
    partnerUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    // True from auto-creation until the partner calls setPassword/
    // updatePassword themselves. admin.controller.js's forgotPassword is a
    // stub (always "success", does nothing) — there is no real email-based
    // recovery path yet. While this stays true, the partner's app dashboard
    // (client/partner.controller.js getDashboard) regenerates and shows a
    // fresh temporary password on every fetch, so a lost/forgotten
    // auto-generated password is always recoverable from inside the app
    // they're already logged into, not a dead end.
    isDefaultPassword: { type: Boolean, default: false },
    permissions: [{ type: String }],
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

module.exports = mongoose.model("Admin", adminSchema);
