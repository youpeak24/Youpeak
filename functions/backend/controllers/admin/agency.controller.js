/**
 * Super-admin management of District Franchises (the `agencies` collection).
 * Each franchise covers one district and gets an AGENCY_ADMIN panel login
 * that only reaches its own franchise portal (see middleware/admin.middleware.js
 * and controllers/admin/franchisePortal.controller.js).
 */
"use strict";

const db = require("../../util/connection");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const net = require("../../util/partnerNetwork.service");

const idOf = (doc) => String(doc?._id || doc?.id || "");
const norm = (s) => String(s || "").trim().toLowerCase();

function requireSuperAdmin(req, res) {
  if (req.adminRole !== "SUPER_ADMIN") {
    res.status(403).json({ status: false, message: "Only a super admin can manage District Franchises." });
    return false;
  }
  return true;
}

function fail(res, error, fallback) {
  if (error instanceof net.PartnerNetworkError) {
    return res.status(200).json({ status: false, message: error.message });
  }
  console.error(fallback, error);
  return res.status(500).json({ status: false, message: error.message || fallback });
}

// One ACTIVE franchise per district — commission attribution
// (util/geofence.service.js resolveAgency) takes the first match, so two
// active franchises on one district would silently split nothing.
async function assertDistrictFree(state, district, exceptAgencyId = null) {
  const clash = (await db.find("agencies", { isActive: true })).find(
    (a) => idOf(a) !== exceptAgencyId && norm(a.state) === norm(state) && norm(a.district) === norm(district)
  );
  if (clash) {
    throw new net.PartnerNetworkError(`${clash.name} is already the active District Franchise for ${district}, ${state}.`);
  }
}

async function assertLoginEmailFree(email, exceptAdminId = null) {
  const existing = await db.findOne("admins", { email });
  if (existing && idOf(existing) !== exceptAdminId) {
    throw new net.PartnerNetworkError("This email is already used for a panel login.");
  }
}

async function franchiseLogin(agencyId) {
  return db.findOne("admins", { agencyId: String(agencyId), role: "AGENCY_ADMIN" });
}

async function uniqueCode(district) {
  const base = "DF-" + String(district).toUpperCase().replace(/[^A-Z0-9]+/g, "").slice(0, 10);
  for (let i = 0; i < 20; i++) {
    const code = `${base}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`;
    if (!(await db.findOne("agencies", { code }))) return code;
  }
  return `${base}-${Date.now()}`;
}

// POST /admin/agency/store  { name, email, password, mobileNumber?, state, district }
exports.store = async (req, res) => {
  try {
    if (!requireSuperAdmin(req, res)) return;
    const b = req.body || {};
    const name = String(b.name || "").trim();
    const email = norm(b.email);
    const state = String(b.state || "").trim();
    const district = String(b.district || "").trim();

    if (name.length < 2) throw new net.PartnerNetworkError("Enter the franchise name.");
    if (!state || !district) throw new net.PartnerNetworkError("Select the state and district this franchise covers.");
    if (!net.EMAIL_RE.test(email)) throw new net.PartnerNetworkError("Enter a valid login email.");
    net.assertPassword(b.password);
    const mobileNumber = net.cleanMobile(b.mobileNumber);

    await assertLoginEmailFree(email);
    if (await db.findOne("agencies", { email })) throw new net.PartnerNetworkError("A District Franchise with this email already exists.");
    await assertDistrictFree(state, district);

    const suffix = `${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
    const agencyId = `agency_${suffix}`;
    const adminId = `admin_agency_${suffix}`;
    const now = new Date().toISOString();

    const agency = {
      _id: agencyId,
      name,
      code: await uniqueCode(district),
      email,
      mobileNumber,
      state,
      district,
      cities: [district],
      zipCodes: [],
      commissionRatePercentage: 10,
      isActive: true,
      adminId,
      createdAt: now,
    };
    await db.create("agencies", agency, agencyId);
    await db.create(
      "admins",
      {
        _id: adminId,
        name,
        email,
        password: bcrypt.hashSync(b.password, 10),
        role: "AGENCY_ADMIN",
        agencyId,
        isActive: true,
        createdAt: now,
      },
      adminId
    );

    return res.status(200).json({
      status: true,
      message: "District Franchise created. They can now log in with this email and password.",
      agency: net.publicAgency(agency),
      login: { email },
    });
  } catch (error) {
    return fail(res, error, "Failed to create District Franchise");
  }
};

// GET /admin/agency/getAgencies?start=&limit=&search=
exports.getAgencies = async (req, res) => {
  try {
    if (!requireSuperAdmin(req, res)) return;
    const start = Math.max(1, parseInt(req.query.start, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const search = norm(req.query.search);

    let agencies = await db.find("agencies", {}, { sort: { createdAt: -1 } });
    if (search) {
      agencies = agencies.filter((a) =>
        [a.name, a.district, a.state, a.email, a.code].some((v) => norm(v).includes(search))
      );
    }
    const page = agencies.slice((start - 1) * limit, start * limit);

    const rows = await Promise.all(
      page.map(async (a) => {
        const agencyId = idOf(a);
        const [partners, login] = await Promise.all([net.listPartnerRows({ agencyId }), franchiseLogin(agencyId)]);
        const summary = net.summarizePartners(partners);
        return {
          ...net.publicAgency(a),
          loginEmail: login?.email || a.email || "",
          partnerCount: summary.totalPartners,
          activePartners: summary.activePartners,
          referrals: summary.referrals.total,
          completedReferrals: summary.referrals.completed,
          referralEarningsInr: summary.referralEarningsInr,
        };
      })
    );

    return res.status(200).json({ status: true, message: "District Franchises fetched.", total: agencies.length, agencies: rows });
  } catch (error) {
    return fail(res, error, "Failed to fetch District Franchises");
  }
};

// GET /admin/agency/detail?agencyId=
exports.detail = async (req, res) => {
  try {
    if (!requireSuperAdmin(req, res)) return;
    const overview = await net.agencyOverview(req.query.agencyId);
    return res.status(200).json({ status: true, message: "District Franchise detail.", ...overview });
  } catch (error) {
    return fail(res, error, "Failed to load District Franchise");
  }
};

// GET /admin/agency/referrals?agencyId=&stage=&partnerUserId=&start=&limit=
exports.referrals = async (req, res) => {
  try {
    if (!requireSuperAdmin(req, res)) return;
    const agencyId = req.query.agencyId;
    if (!agencyId || !(await db.findById("agencies", agencyId))) throw new net.PartnerNetworkError("District Franchise not found.");
    let partners = await net.listPartnerRows({ agencyId });
    if (req.query.partnerUserId) partners = partners.filter((p) => p.userId === String(req.query.partnerUserId));
    const result = await net.listReferrals(partners, {
      stage: req.query.stage || "",
      start: req.query.start,
      limit: req.query.limit,
      includeContact: true,
    });
    return res.status(200).json({
      status: true,
      message: "Referrals.",
      partners: partners.map((p) => ({ userId: p.userId, fullName: p.fullName })),
      ...result,
    });
  } catch (error) {
    return fail(res, error, "Failed to load referrals");
  }
};

// PATCH /admin/agency/update?agencyId=  { name?, mobileNumber?, email?, state?, district?, newPassword? }
exports.update = async (req, res) => {
  try {
    if (!requireSuperAdmin(req, res)) return;
    const agencyId = req.query.agencyId;
    const agency = await db.findById("agencies", agencyId);
    if (!agency) throw new net.PartnerNetworkError("District Franchise not found.");
    const b = req.body || {};
    const login = await franchiseLogin(agencyId);

    const patch = {};
    const loginPatch = {};
    if (b.name !== undefined) {
      const name = String(b.name).trim();
      if (name.length < 2) throw new net.PartnerNetworkError("Enter the franchise name.");
      patch.name = name;
      loginPatch.name = name;
    }
    if (b.mobileNumber !== undefined) patch.mobileNumber = net.cleanMobile(b.mobileNumber);

    const state = b.state !== undefined ? String(b.state).trim() : agency.state;
    const district = b.district !== undefined ? String(b.district).trim() : agency.district;
    if (norm(state) !== norm(agency.state) || norm(district) !== norm(agency.district)) {
      if (!state || !district) throw new net.PartnerNetworkError("Select the state and district this franchise covers.");
      if (agency.isActive !== false) await assertDistrictFree(state, district, idOf(agency));
      Object.assign(patch, { state, district, cities: [district] });
    }

    if (b.email !== undefined && norm(b.email) !== norm(login?.email || agency.email)) {
      const email = norm(b.email);
      if (!net.EMAIL_RE.test(email)) throw new net.PartnerNetworkError("Enter a valid login email.");
      await assertLoginEmailFree(email, login ? idOf(login) : null);
      patch.email = email;
      loginPatch.email = email;
    }
    if (b.newPassword) {
      net.assertPassword(b.newPassword);
      loginPatch.password = bcrypt.hashSync(b.newPassword, 10);
    }

    if (Object.keys(patch).length) await db.update("agencies", agencyId, patch);
    if (Object.keys(loginPatch).length) {
      if (login) {
        await db.update("admins", idOf(login), loginPatch);
      } else if (loginPatch.password) {
        // Older franchises may have lost their login row — recreate it.
        const adminId = `admin_agency_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
        await db.create(
          "admins",
          {
            _id: adminId,
            name: patch.name || agency.name,
            email: loginPatch.email || agency.email,
            password: loginPatch.password,
            role: "AGENCY_ADMIN",
            agencyId: idOf(agency),
            isActive: agency.isActive !== false,
            createdAt: new Date().toISOString(),
          },
          adminId
        );
      }
    }

    const updated = await db.findById("agencies", agencyId);
    return res.status(200).json({
      status: true,
      message: b.newPassword ? "District Franchise updated and login password reset." : "District Franchise updated.",
      agency: net.publicAgency(updated),
    });
  } catch (error) {
    return fail(res, error, "Failed to update District Franchise");
  }
};

// PATCH /admin/agency/toggleStatus?agencyId=
// Deactivating also disables the franchise login (and admin.middleware
// rejects any session still open). Its partners keep working.
exports.toggleStatus = async (req, res) => {
  try {
    if (!requireSuperAdmin(req, res)) return;
    const agencyId = req.query.agencyId;
    const agency = await db.findById("agencies", agencyId);
    if (!agency) throw new net.PartnerNetworkError("District Franchise not found.");

    const newStatus = agency.isActive === false;
    if (newStatus) await assertDistrictFree(agency.state, agency.district, idOf(agency));

    await db.update("agencies", agencyId, { isActive: newStatus });
    const login = await franchiseLogin(agencyId);
    if (login) await db.update("admins", idOf(login), { isActive: newStatus });

    return res.status(200).json({
      status: true,
      message: newStatus ? "District Franchise activated." : "District Franchise deactivated — its login is disabled.",
      isActive: newStatus,
    });
  } catch (error) {
    return fail(res, error, "Failed to change District Franchise status");
  }
};

// DELETE /admin/agency/delete?agencyId=
// Only for a franchise that never did anything (e.g. created by mistake):
// one with partners or commission history must be deactivated instead, so
// no partner or ledger row is left pointing at a missing franchise.
exports.remove = async (req, res) => {
  try {
    if (!requireSuperAdmin(req, res)) return;
    const agencyId = req.query.agencyId;
    const agency = await db.findById("agencies", agencyId);
    if (!agency) throw new net.PartnerNetworkError("District Franchise not found.");

    const history = await Promise.all([
      db.find("users", { agencyId: String(agencyId) }),
      db.find("users", { partnerAddedByAgencyId: String(agencyId) }),
      db.find("users", { removedFromAgencyId: String(agencyId) }),
      db.find("agencyCommissions", { agencyId: String(agencyId) }),
    ]);
    if (history.some((rows) => rows.length)) {
      throw new net.PartnerNetworkError(
        "This franchise has partners or commission history — deactivate it instead of deleting."
      );
    }

    const login = await franchiseLogin(agencyId);
    if (login) await db.delete("admins", idOf(login));
    await db.delete("agencies", agencyId);
    return res.status(200).json({ status: true, message: "District Franchise deleted." });
  } catch (error) {
    return fail(res, error, "Failed to delete District Franchise");
  }
};
