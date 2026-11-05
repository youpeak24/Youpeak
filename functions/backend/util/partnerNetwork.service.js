/**
 * District Franchise → Digital Partner network.
 *
 *   Super admin  creates District Franchises (one per district) and can see /
 *                manage every franchise and partner — but never creates a
 *                partner (controllers/admin/agency.controller.js,
 *                controllers/admin/digitalPartner.controller.js).
 *   Franchise    (AGENCY_ADMIN login) creates / edits / suspends / removes the
 *                Digital Partners in its own district and sees their full
 *                referral workflow (controllers/admin/franchisePortal.controller.js).
 *   Partner      is a normal app user flagged isDigitalPartner, linked to the
 *                franchise by user.agencyId, with a DIGITAL_PARTNER_ADMIN web
 *                portal login. They earn through the regular referral engine
 *                (util/referral.service.js — ₹100 stage 1 + ₹100 stage 2 + bonuses).
 *
 * Every figure here is derived from the source records (referralHistories,
 * the user's referral coin balances, agencyCommissions) — PartnerProfile's
 * totalReferrals/totalEarnings were never maintained anywhere, so they are
 * not read.
 */
"use strict";

const db = require("./connection");
const bcrypt = require("bcryptjs");
const { grantDigitalPartnerLicense } = require("./digitalPartner.service");

const num = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);
const coinRate = () => num((global.settingJSON || {}).coinToInrRate, 0.01);
const inr = (coins) => Number((num(coins) * coinRate()).toFixed(2));
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOBILE_RE = /^[6-9]\d{9}$/;
const MIN_PASSWORD = 8;
const MAX_LICENSE_FEE_INR = 1000000;

// Referral reward history types (util/referral.service.js, util/rewardEngine.js)
const REFERRAL_HISTORY_TYPES = new Set([5.1, 10, 13]);

// Validation problems the caller should show to the user as-is.
class PartnerNetworkError extends Error {}

const idOf = (doc) => String(doc?._id || doc?.id || "");

function publicAgency(agency) {
  if (!agency) return null;
  const { password, ...rest } = agency;
  return { ...rest, _id: idOf(agency) };
}

function assertPassword(password) {
  if (typeof password !== "string" || password.length < MIN_PASSWORD) {
    throw new PartnerNetworkError(`Password must be at least ${MIN_PASSWORD} characters.`);
  }
}

function cleanMobile(mobileNumber) {
  const m = String(mobileNumber || "").replace(/[\s-]/g, "").replace(/^\+91/, "");
  if (m && !MOBILE_RE.test(m)) throw new PartnerNetworkError("Enter a valid 10-digit mobile number.");
  return m;
}

// ── Referral workflow ────────────────────────────────────────────────────────
// PENDING can't normally happen (stage 1 completes when the code is applied)
// but keeps old/partial records visible instead of dropping them.
function referralStage(r, now = Date.now()) {
  if (r.status === "FLAGGED_SUSPICIOUS") return "FLAGGED";
  if (r.stage1Completed && r.stage2Completed) return "COMPLETED";
  const deadline = r.stage2DeadlineAt ? Date.parse(r.stage2DeadlineAt) : NaN;
  if (r.status === "EXPIRED" || (Number.isFinite(deadline) && now > deadline)) return "EXPIRED";
  if (r.stage1Completed) return "AWAITING_WATCH_TIME";
  return "PENDING";
}

function summarizeReferrals(refs) {
  const now = Date.now();
  const s = { total: refs.length, awaitingWatchTime: 0, completed: 0, expired: 0, flagged: 0, rewardCoinsReleased: 0, rewardCoinsOnHold: 0 };
  for (const r of refs) {
    const stage = referralStage(r, now);
    if (stage === "COMPLETED") s.completed++;
    else if (stage === "EXPIRED") s.expired++;
    else if (stage === "FLAGGED") s.flagged++;
    else s.awaitingWatchTime++;

    s.rewardCoinsReleased += num(r.totalRewardCoinsGiven);
    if (stage !== "FLAGGED") {
      for (const st of ["stage1", "stage2"]) {
        if (r[`${st}Completed`] && !r[`${st}Released`]) s.rewardCoinsOnHold += num(r[`${st}RewardCoins`]);
      }
    }
  }
  s.valid = s.total - s.flagged;
  s.rewardInrReleased = inr(s.rewardCoinsReleased);
  s.rewardInrOnHold = inr(s.rewardCoinsOnHold);
  return s;
}

function sumSummaries(list) {
  const keys = ["total", "valid", "awaitingWatchTime", "completed", "expired", "flagged", "rewardCoinsReleased", "rewardCoinsOnHold"];
  const out = Object.fromEntries(keys.map((k) => [k, list.reduce((a, s) => a + num(s[k]), 0)]));
  out.rewardInrReleased = inr(out.rewardCoinsReleased);
  out.rewardInrOnHold = inr(out.rewardCoinsOnHold);
  return out;
}

async function agenciesById() {
  const agencies = await db.find("agencies", {});
  return new Map(agencies.map((a) => [idOf(a), a]));
}

// ── Partner rows ─────────────────────────────────────────────────────────────
async function partnerRow(user, agencies, refs = null) {
  const userId = idOf(user);
  const [profile, portal, referrals] = await Promise.all([
    db.findOne("PartnerProfile", { userId }),
    db.findOne("admins", { partnerUserId: userId }),
    refs ? Promise.resolve(refs) : db.find("referralHistories", { referrerId: userId }),
  ]);
  const agency = user.agencyId ? agencies.get(String(user.agencyId)) : null;

  return {
    userId,
    uniqueId: user.uniqueId || "",
    fullName: user.fullName || user.nickName || "",
    email: user.email || "",
    mobileNumber: user.mobileNumber || "",
    image: user.image || "",
    referralCode: user.referralCode || "",
    state: user.state || "",
    district: user.district || "",
    agencyId: user.agencyId ? String(user.agencyId) : null,
    agencyName: agency ? agency.name : null,
    partnerStatus: user.partnerStatus || "ACTIVE",
    partnerSince: user.partnerSince || profile?.activatedAt || null,
    createdByFranchise: !!user.partnerCreatedByAgencyId,
    appAccountBlocked: !!user.isBlock,
    licenseFeePaid: num(profile?.licenseFeePaid),
    adCreditsBalance: num(profile?.adCreditsBalance),
    portalEmail: portal?.email || null,
    portalActive: portal ? portal.isActive !== false : false,
    referrals: summarizeReferrals(referrals),
    earnings: {
      referralCoins: num(user.referralRewardCoin),
      referralInr: inr(user.referralRewardCoin),
      pendingCoins: num(user.pendingReferralCoin),
      pendingInr: inr(user.pendingReferralCoin),
      walletCoins: num(user.coin),
      walletInr: inr(user.coin),
    },
  };
}

async function partnerUsers(agencyId) {
  const query = { isDigitalPartner: true };
  if (agencyId) query.agencyId = String(agencyId);
  return db.find("users", query);
}

async function listPartnerRows({ agencyId = null } = {}) {
  const [users, agencies] = await Promise.all([partnerUsers(agencyId), agenciesById()]);
  const rows = await Promise.all(users.map((u) => partnerRow(u, agencies)));
  rows.sort((a, b) => new Date(b.partnerSince || 0) - new Date(a.partnerSince || 0));
  return rows;
}

function summarizePartners(rows) {
  return {
    totalPartners: rows.length,
    activePartners: rows.filter((r) => r.partnerStatus === "ACTIVE").length,
    suspendedPartners: rows.filter((r) => r.partnerStatus === "SUSPENDED").length,
    licenseFeesInr: rows.reduce((a, r) => a + r.licenseFeePaid, 0),
    referrals: sumSummaries(rows.map((r) => r.referrals)),
    referralEarningsInr: Number(rows.reduce((a, r) => a + r.earnings.referralInr, 0).toFixed(2)),
    pendingEarningsInr: Number(rows.reduce((a, r) => a + r.earnings.pendingInr, 0).toFixed(2)),
  };
}

// ── Referral lists ───────────────────────────────────────────────────────────
function referralView(r, partnerName, referred, includeContact) {
  return {
    _id: idOf(r),
    partnerUserId: String(r.referrerId),
    partnerName,
    referredUserId: r.referredUserId,
    referredUserName: referred ? referred.fullName || referred.nickName || "Youpeak User" : "Deleted user",
    referredUserUniqueId: referred?.uniqueId || "",
    referredUserEmail: includeContact ? referred?.email || "" : undefined,
    referralCode: r.referralCode || "",
    stage: referralStage(r),
    status: r.status,
    flaggedReason: r.flaggedReason || null,
    createdAt: r.createdAt || null,
    stage1CompletedAt: r.stage1CompletedAt || null,
    stage1RewardCoins: num(r.stage1RewardCoins),
    stage1Released: !!r.stage1Released,
    stage1HeldUntil: r.stage1HeldUntil || null,
    stage2CompletedAt: r.stage2CompletedAt || null,
    stage2DeadlineAt: r.stage2DeadlineAt || null,
    stage2RewardCoins: num(r.stage2RewardCoins),
    stage2Released: !!r.stage2Released,
    stage2HeldUntil: r.stage2HeldUntil || null,
    releasedCoins: num(r.totalRewardCoinsGiven),
    releasedInr: inr(r.totalRewardCoinsGiven),
  };
}

/**
 * Referrals made by the given partners, newest first.
 * @param {Array<{userId, fullName}>} partners
 * @param {object} opts  stage filter (AWAITING_WATCH_TIME|COMPLETED|EXPIRED|FLAGGED), search, start (1-based), limit
 */
async function listReferrals(partners, { stage = "", start = 1, limit = 20, includeContact = false } = {}) {
  const nameById = new Map(partners.map((p) => [String(p.userId), p.fullName || "Partner"]));
  const perPartner = await Promise.all(
    partners.map((p) => db.find("referralHistories", { referrerId: String(p.userId) }))
  );
  let all = perPartner.flat();
  const summary = summarizeReferrals(all);
  if (stage) all = all.filter((r) => referralStage(r) === stage);
  all.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

  const page = Math.max(1, parseInt(start, 10) || 1);
  const size = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const slice = all.slice((page - 1) * size, page * size);
  const referred = await Promise.all(slice.map((r) => (r.referredUserId ? db.findById("users", r.referredUserId).catch(() => null) : null)));

  return {
    total: all.length,
    summary,
    referrals: slice.map((r, i) => referralView(r, nameById.get(String(r.referrerId)), referred[i], includeContact)),
  };
}

// Every referral made by the given partners, classified, without the
// per-row referred-user lookups listReferrals does (for counting/reports).
async function referralFacts(partners) {
  const perPartner = await Promise.all(
    partners.map((p) => db.find("referralHistories", { referrerId: String(p.userId) }))
  );
  return perPartner.flat().map((r) => ({
    createdAt: r.createdAt || null,
    stage: referralStage(r),
    releasedInr: inr(r.totalRewardCoinsGiven),
  }));
}

async function partnerDetail(userId, { includeContact = false } = {}) {
  const user = await db.findById("users", userId);
  if (!user) throw new PartnerNetworkError("Partner not found.");
  const agencies = await agenciesById();
  const refs = await db.find("referralHistories", { referrerId: String(userId) });
  const row = await partnerRow(user, agencies, refs);
  const [referrals, histories] = await Promise.all([
    listReferrals([{ userId: row.userId, fullName: row.fullName }], { limit: 100, includeContact }),
    db.find("histories", { userId: String(userId) }),
  ]);
  const rewardLedger = histories
    .filter((h) => REFERRAL_HISTORY_TYPES.has(Number(h.type)))
    .sort((a, b) => new Date(b.date || b.createdAt || 0) - new Date(a.date || a.createdAt || 0))
    .slice(0, 100)
    .map((h) => ({
      _id: idOf(h),
      coins: num(h.coin),
      inr: inr(h.coin),
      type: Number(h.type),
      note: h.note || null,
      referralId: h.referralId || null,
      date: h.date || h.createdAt || null,
    }));
  return { partner: row, isDigitalPartner: !!user.isDigitalPartner, referrals: referrals.referrals, referralTotal: referrals.total, rewardLedger };
}

// ── Franchise overview (dashboard / super-admin detail) ──────────────────────
function summarizeCommissions(commissions) {
  const s = { totalEarned: 0, paid: 0, pendingPayout: 0, awaitingVerification: 0, rejected: 0, bySource: {} };
  for (const c of commissions) {
    const amt = num(c.commissionAmount);
    if (c.verificationStatus === "REJECTED") {
      s.rejected += amt;
      continue;
    }
    s.totalEarned += amt;
    if (c.payoutStatus === "PAID") s.paid += amt;
    else if (c.verificationStatus === "UNVERIFIED") s.awaitingVerification += amt;
    else s.pendingPayout += amt;
    const key = c.sourceType || "OTHER";
    s.bySource[key] = s.bySource[key] || { grossAmount: 0, commissionAmount: 0, count: 0 };
    s.bySource[key].grossAmount += num(c.grossAmount);
    s.bySource[key].commissionAmount += amt;
    s.bySource[key].count += 1;
  }
  for (const k of ["totalEarned", "paid", "pendingPayout", "awaitingVerification", "rejected"]) s[k] = Number(s[k].toFixed(2));
  return s;
}

async function agencyOverview(agencyId) {
  const agency = await db.findById("agencies", agencyId);
  if (!agency) throw new PartnerNetworkError("District Franchise not found.");
  const [rows, commissions, login] = await Promise.all([
    listPartnerRows({ agencyId }),
    db.find("agencyCommissions", { agencyId: String(agencyId) }, { sort: { createdAt: -1 } }),
    db.findOne("admins", { agencyId: String(agencyId), role: "AGENCY_ADMIN" }),
  ]);
  return {
    agency: { ...publicAgency(agency), loginEmail: login?.email || agency.email || "" },
    summary: summarizePartners(rows),
    commissions: summarizeCommissions(commissions),
    recentCommissions: commissions.slice(0, 10),
    partners: rows,
  };
}

// ── Partner lifecycle ────────────────────────────────────────────────────────
async function loadScopedPartner(userId, agencyScopeId) {
  const user = userId ? await db.findById("users", userId) : null;
  if (!user || !user.isDigitalPartner) throw new PartnerNetworkError("Digital Partner not found.");
  if (agencyScopeId && String(user.agencyId || "") !== String(agencyScopeId)) {
    throw new PartnerNetworkError("This Digital Partner does not belong to your district franchise.");
  }
  return user;
}

async function createPartner({ agencyId, actorAdminId, fullName, email, mobileNumber, password, licenseFeeInr }) {
  const agency = await db.findById("agencies", agencyId);
  if (!agency) throw new PartnerNetworkError("District Franchise not found.");
  if (agency.isActive === false) throw new PartnerNetworkError("This District Franchise is deactivated.");

  const name = String(fullName || "").trim();
  if (name.length < 2) throw new PartnerNetworkError("Enter the partner's full name.");
  const emailTrim = String(email || "").trim();
  const emailLower = emailTrim.toLowerCase();
  if (!EMAIL_RE.test(emailTrim)) throw new PartnerNetworkError("Enter a valid email address.");
  assertPassword(password);
  const mobile = cleanMobile(mobileNumber);
  const fee = num(licenseFeeInr, NaN);
  if (!Number.isFinite(fee) || fee < 0 || fee > MAX_LICENSE_FEE_INR) {
    throw new PartnerNetworkError("Licence fee must be a number between 0 and 10,00,000.");
  }

  // The portal login shares the admins collection with every panel login.
  const existingLogin = await db.findOne("admins", { email: emailLower });
  if (existingLogin) throw new PartnerNetworkError("This email is already used for a panel login.");

  // App users' emails are stored as typed — try the exact and lowercased forms.
  let user = await db.findOne("users", { email: emailTrim });
  if (!user && emailLower !== emailTrim) user = await db.findOne("users", { email: emailLower });

  let appAccount = "CREATED";
  if (user) {
    if (user.isDigitalPartner) {
      const owner = user.agencyId ? await db.findById("agencies", user.agencyId) : null;
      throw new PartnerNetworkError(`This person is already a Digital Partner${owner ? ` under ${owner.name}` : ""}.`);
    }
    if (user.isBlock) throw new PartnerNetworkError("This app account is blocked by the admin.");
    appAccount = "LINKED_EXISTING";
    const patch = {};
    if (!user.mobileNumber && mobile) patch.mobileNumber = mobile;
    if (!user.state) patch.state = agency.state || "";
    if (!user.district) patch.district = agency.district || "";
    if (!user.fullName) patch.fullName = name;
    if (Object.keys(patch).length) await db.update("users", idOf(user), patch);
  } else {
    // Required lazily: userFirestore.controller pulls in firebase-admin helpers.
    const { createEmailPasswordAccount } = require("../controllers/client/userFirestore.controller");
    user = await createEmailPasswordAccount({
      fullName: name,
      email: emailTrim,
      password,
      mobileNumber: mobile,
      state: agency.state || "",
      district: agency.district || "",
    });
  }
  const userId = idOf(user);

  await db.update("users", userId, {
    partnerAddedByAgencyId: String(agencyId),
    partnerCreatedByAgencyId: appAccount === "CREATED" ? String(agencyId) : user.partnerCreatedByAgencyId || null,
  });

  const result = await grantDigitalPartnerLicense({
    userId,
    amountInr: fee,
    paymentTransactionId: fee > 0 ? `FRANCHISE_${agencyId}_${Date.now()}` : null,
    agencyId: String(agencyId),
    portalPassword: password,
    feeRecordedByAdminId: fee > 0 ? String(actorAdminId || "") : null,
  });

  const fresh = await db.findById("users", userId);
  const row = await partnerRow(fresh, await agenciesById());
  return {
    partner: row,
    appAccount,
    portalLogin: { email: emailLower },
    commission: result.commission
      ? { amount: result.commission.commissionAmount, verificationStatus: result.commission.verificationStatus }
      : null,
  };
}

async function updatePartner({ userId, agencyScopeId = null, fullName, mobileNumber, newPassword }) {
  const user = await loadScopedPartner(userId, agencyScopeId);
  const patch = {};
  if (fullName !== undefined) {
    const name = String(fullName).trim();
    if (name.length < 2) throw new PartnerNetworkError("Enter the partner's full name.");
    patch.fullName = name;
  }
  if (mobileNumber !== undefined) patch.mobileNumber = cleanMobile(mobileNumber);
  if (Object.keys(patch).length) await db.update("users", userId, patch);

  const portal = await db.findOne("admins", { partnerUserId: String(userId) });
  if (portal && patch.fullName) await db.update("admins", idOf(portal), { name: patch.fullName });

  const passwordChanged = { portal: false, app: false };
  if (newPassword) {
    assertPassword(newPassword);
    if (portal) {
      await db.update("admins", idOf(portal), { password: bcrypt.hashSync(newPassword, 10), isDefaultPassword: false });
      passwordChanged.portal = true;
    }
    // Only an app account this franchise created may have its app password
    // reset — a linked pre-existing account keeps the owner's own login.
    const ownsAppAccount =
      user.loginType === 4 &&
      user.partnerCreatedByAgencyId &&
      (!agencyScopeId || String(user.partnerCreatedByAgencyId) === String(agencyScopeId));
    if (ownsAppAccount) {
      // bcrypt only (F-19); login reads passwordHash first, so a legacy
      // cryptr value written here would be ignored after migration.
      const { hashPassword } = require("../controllers/client/userFirestore.controller");
      await db.update("users", userId, { passwordHash: await hashPassword(newPassword), password: null });
      passwordChanged.app = true;
    }
  }
  const row = await partnerRow(await db.findById("users", userId), await agenciesById());
  return { partner: row, passwordChanged };
}

async function setPartnerStatus({ userId, agencyScopeId = null, status }) {
  if (!["ACTIVE", "SUSPENDED"].includes(status)) throw new PartnerNetworkError("status must be ACTIVE or SUSPENDED.");
  await loadScopedPartner(userId, agencyScopeId);
  await db.update("users", userId, { partnerStatus: status });
  const portal = await db.findOne("admins", { partnerUserId: String(userId) });
  if (portal) await db.update("admins", idOf(portal), { isActive: status === "ACTIVE" });
  return { userId: String(userId), partnerStatus: status };
}

// Takes the person out of the partner programme. Their app account, wallet
// coins and referral history stay — those belong to the user, not the role.
async function removePartner({ userId, agencyScopeId = null }) {
  const user = await loadScopedPartner(userId, agencyScopeId);
  await db.update("users", userId, {
    isDigitalPartner: false,
    partnerStatus: "REMOVED",
    agencyId: null,
    removedFromAgencyId: user.agencyId || null,
    partnerRemovedAt: new Date().toISOString(),
  });
  const portal = await db.findOne("admins", { partnerUserId: String(userId) });
  if (portal) await db.delete("admins", idOf(portal));
  const profile = await db.findOne("PartnerProfile", { userId: String(userId) });
  if (profile) await db.update("PartnerProfile", idOf(profile), { removedAt: new Date().toISOString(), agencyId: null });
  return { userId: String(userId), removed: true };
}

async function assignPartnerToAgency({ userId, agencyId }) {
  await loadScopedPartner(userId, null);
  let target = null;
  if (agencyId) {
    target = await db.findById("agencies", agencyId);
    if (!target) throw new PartnerNetworkError("District Franchise not found.");
    if (target.isActive === false) throw new PartnerNetworkError("That District Franchise is deactivated.");
  }
  const value = target ? idOf(target) : null;
  await db.update("users", userId, { agencyId: value });
  const [portal, profile] = await Promise.all([
    db.findOne("admins", { partnerUserId: String(userId) }),
    db.findOne("PartnerProfile", { userId: String(userId) }),
  ]);
  if (portal) await db.update("admins", idOf(portal), { agencyId: value });
  if (profile) await db.update("PartnerProfile", idOf(profile), { agencyId: value });
  return { userId: String(userId), agencyId: value, agencyName: target ? target.name : null };
}

// The live referral reward rules (settings-driven), for explaining the
// workflow in the franchise and partner portals.
function referralRules() {
  const { cfg } = require("./referral.service");
  const c = cfg();
  const s = global.settingJSON || {};
  return {
    stage1Inr: inr(c.stage1Coins),
    stage1HoldHours: c.stage1HoldHours,
    stage2Inr: inr(c.stage2Coins),
    stage2WatchMinutes: c.stage2WatchMinutes,
    stage2WindowDays: c.stage2WindowDays,
    stage2HoldHours: c.stage2HoldHours,
    freeTierBonusInr: inr(c.freeTaskerReferralBonusCoins),
    paidTierPercentage: c.paidTierPct,
    taskerEarningsPercentage: num(s.taskerEarningsReferralPercentage, 20),
    maxReferralsPerDay: c.maxReferralsPerDay,
  };
}

module.exports = {
  PartnerNetworkError,
  referralRules,
  EMAIL_RE,
  MOBILE_RE,
  MIN_PASSWORD,
  publicAgency,
  assertPassword,
  cleanMobile,
  referralStage,
  summarizeReferrals,
  summarizeCommissions,
  listPartnerRows,
  summarizePartners,
  listReferrals,
  referralFacts,
  partnerDetail,
  agencyOverview,
  createPartner,
  updatePartner,
  setPartnerStatus,
  removePartner,
  assignPartnerToAgency,
};
