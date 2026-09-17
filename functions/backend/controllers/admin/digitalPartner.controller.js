/**
 * Super-Admin-facing Digital Partner management — the admin panel had no
 * visibility into Digital Partners at all (they only ever appeared via
 * their own self-service portal, admin/partnerPortal.controller.js) and no
 * way to onboard one manually. Razorpay isn't live yet (payments disabled),
 * so the self-service license-purchase flow (client/payment.controller.js
 * fulfilDigitalPartnerLicense) can't run for anyone — this is the only way
 * to activate a real Digital Partner (e.g. paid via bank transfer) and hand
 * them their web portal login until the payment gateway is wired up.
 *
 * Restricted to SUPER_ADMIN only, checked explicitly here — most admin
 * routes rely on the frontend hiding menus (see admin.middleware.js's
 * comments), but this creates admin accounts and reveals plaintext
 * passwords, so it gets the same hard backend check as admin.controller.js
 * create()/update().
 */
"use strict";

const db = require("../../util/connection");
const { grantDigitalPartnerLicense, regeneratePortalPassword } = require("../../util/digitalPartner.service");

const num = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);

function requireSuperAdmin(req, res) {
  if (req.adminRole !== "SUPER_ADMIN") {
    res.status(403).json({ status: false, message: "Only a super admin can manage Digital Partners." });
    return false;
  }
  return true;
}

// GET /admin/digitalPartner/list
exports.list = async (req, res) => {
  try {
    if (!requireSuperAdmin(req, res)) return;

    const partners = await db.find("users", { isDigitalPartner: true });
    const rows = await Promise.all(
      partners.map(async (u) => {
        const userId = u._id || u.id;
        const [profile, portalAdmin] = await Promise.all([
          db.findOne("PartnerProfile", { userId }),
          db.findOne("admins", { partnerUserId: userId }),
        ]);
        return {
          userId,
          fullName: u.fullName || "",
          email: u.email || "",
          state: u.state || "",
          district: u.district || "",
          partnerStatus: u.partnerStatus || "NONE",
          licenseFeePaid: num(profile?.licenseFeePaid),
          adCreditsBalance: num(profile?.adCreditsBalance),
          totalReferrals: num(profile?.totalReferrals),
          totalEarnings: num(profile?.totalEarnings),
          activatedAt: profile?.activatedAt || null,
          portalEmail: portalAdmin?.email || null,
          portalAccountExists: !!portalAdmin,
          portalPasswordIsTemporary: portalAdmin ? !!portalAdmin.isDefaultPassword : null,
        };
      })
    );

    rows.sort((a, b) => new Date(b.activatedAt || 0) - new Date(a.activatedAt || 0));
    return res.status(200).json({ status: true, message: "Digital Partners fetched.", partners: rows });
  } catch (error) {
    console.error("digitalPartner.list error:", error);
    return res.status(500).json({ status: false, message: error.message });
  }
};

// POST /admin/digitalPartner/activate   { email, licenseFeeInr? }
// Onboards an existing Youpeak app user as a Digital Partner (or tops up
// an already-active one) and hands back their one-time portal password.
exports.activate = async (req, res) => {
  try {
    if (!requireSuperAdmin(req, res)) return;

    // Unlike admins (always lowercased — see admin.controller.js login),
    // app users' emails are stored case-preserved (userFirestore.controller.js
    // buildUserData only trims, never lowercases) — so this lookup must match
    // that exactly, not normalize case, or a real user could go "not found".
    const email = String(req.body.email || "").trim();
    if (!email) {
      return res.status(200).json({ status: false, message: "email is required." });
    }

    const user = await db.findOne("users", { email });
    if (!user) {
      return res.status(200).json({ status: false, message: "No Youpeak app account found for this email (case-sensitive — must match exactly as registered in the app). The person must sign up in the app first." });
    }

    const userId = user._id || user.id;
    const licenseFeeInr = req.body.licenseFeeInr !== undefined
      ? num(req.body.licenseFeeInr)
      : num((global.settingJSON || {}).digitalPartnerLicenseFeeINR, 25000);

    const result = await grantDigitalPartnerLicense({
      userId,
      amountInr: licenseFeeInr,
      paymentTransactionId: `MANUAL_ADMIN_${req.admin?._id || req.admin?.id || "unknown"}_${Date.now()}`,
    });

    return res.status(200).json({
      status: true,
      message: result.portalCredentials
        ? "Digital Partner activated. Portal login created — share this password now, it won't be shown again."
        : "Digital Partner activated. Portal account already existed, login unchanged.",
      userId,
      adCreditsBalance: result.adCreditsBalance,
      portalCredentials: result.portalCredentials,
    });
  } catch (error) {
    console.error("digitalPartner.activate error:", error);
    return res.status(500).json({ status: false, message: error.message });
  }
};

// POST /admin/digitalPartner/regeneratePassword   { userId }
// For an already-activated Digital Partner whose portal password needs to
// be reissued (lost, or never picked up the first reveal). forgotPassword
// is a non-functional stub platform-wide, so this is their only recovery
// path besides the dashboard's own auto-rotation (client/partner.controller.js
// getDashboard), which only helps once they can already log in once.
exports.regeneratePassword = async (req, res) => {
  try {
    if (!requireSuperAdmin(req, res)) return;

    const userId = req.body.userId;
    if (!userId) {
      return res.status(200).json({ status: false, message: "userId is required." });
    }

    const portalCredentials = await regeneratePortalPassword(userId);
    if (!portalCredentials) {
      return res.status(200).json({ status: false, message: "This user has no Digital Partner portal account yet. Activate them first." });
    }

    return res.status(200).json({ status: true, message: "Portal password regenerated.", portalCredentials });
  } catch (error) {
    console.error("digitalPartner.regeneratePassword error:", error);
    return res.status(500).json({ status: false, message: error.message });
  }
};
