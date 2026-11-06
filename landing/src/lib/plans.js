/**
 * Turns the server catalog (+ the signed-in user's own tier data) into the
 * list of things the portal can sell. Prices always come from the server.
 */

// Ids the marketing cards used before the portal existed -> real tier ids.
export const PLAN_ALIASES = Object.freeze({
  bronze: "tier_tasker_bronze",
  silver: "tier_tasker_silver",
  gold: "tier_tasker_gold",
  platinum: "tier_tasker_platinum",
  starter_vip: "tier_creator_starter_vip",
  silver_vip: "tier_creator_silver_vip",
  gold_vip: "tier_creator_gold_vip",
  partner: "digital_partner_license",
});

export const resolvePlanId = (id) => (id ? PLAN_ALIASES[id] || id : null);

export const inr = (n) =>
  `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2, minimumFractionDigits: Number(n) % 1 ? 2 : 0 })}`;

const PERIOD_LABEL = { quarterly: "3 months", annual: "1 year", lifetime: "One-time" };

const idOf = (t) => String(t._id || t.id);

/**
 * @returns {{ starter: Plan[], creator: Plan[], more: Plan[] }}
 *   Plan = { id, group, title, blurb, status: "buy"|"current"|"included"|"locked", note, options: Option[] }
 *   Option = { key, label, priceINR, listPriceINR?, params }   (params go to /payment/createOrder)
 */
export function buildPlans(catalog, taskerData, creatorData) {
  const userTasker = new Map(((taskerData && taskerData.tiers) || []).map((t) => [idOf(t), t]));
  const userCreator = new Map(((creatorData && creatorData.tiers) || []).map((t) => [idOf(t), t]));
  const subs = creatorData ? Number(creatorData.userSubscribers) || 0 : null;

  const starter = (catalog.taskerTiers || [])
    .filter((t) => t.priceINR > 0)
    .map((t) => {
      const u = userTasker.get(t.id);
      let status = "buy";
      let note = "";
      if (u) {
        if (u.isCurrentTier) { status = "current"; note = "Your current pass"; }
        else if (u.isIncluded) { status = "included"; note = "Included in your current level"; }
        else if (!u.canPurchase) { status = "locked"; note = "Not available to buy right now"; }
      }
      const bits = [];
      if (t.dailyEarningCapInINR) bits.push(`up to ${inr(t.dailyEarningCapInINR)}/day`);
      if (t.adCreditsGranted) bits.push(`${Number(t.adCreditsGranted).toLocaleString("en-IN")} ad credits included`);
      return {
        id: t.id,
        group: "starter",
        title: t.name,
        blurb: bits.join(" · ") || t.description,
        status,
        note,
        options: [{ key: "once", label: "One-time", priceINR: t.priceINR, params: { purpose: "tier_upgrade", tierId: t.id } }],
      };
    });

  const creator = (catalog.creatorTiers || []).map((t) => {
    const u = userCreator.get(t.id);
    const options = (u && u.billingOptions ? u.billingOptions : t.billingOptions || []).map((o) => ({
      key: o.billingPeriod,
      label: PERIOD_LABEL[o.billingPeriod] || o.billingPeriod,
      priceINR: o.priceINR,
      listPriceINR: o.listPriceINR,
      params: { purpose: "tier_upgrade", tierId: t.id, ...(o.billingPeriod === "lifetime" ? {} : { billingPeriod: o.billingPeriod }) },
    }));
    let status = options.length ? "buy" : "included";
    let note = options.length ? "" : t.priceINR === 0 ? "Free — every creator starts here" : "Unlocked automatically";
    if (u && u.isCurrentTier) {
      status = "current";
      note = u.passExpiresAt ? `Active until ${new Date(u.passExpiresAt).toLocaleDateString("en-IN")} — buy again to extend` : "Your current pass";
    } else if (subs != null && subs < (t.minSubscribersRequired || 0)) {
      status = "locked";
      note = `Needs ${(t.minSubscribersRequired || 0).toLocaleString("en-IN")} subscribers (you have ${subs.toLocaleString("en-IN")})`;
    }
    const range = t.maxSubscribers ? `${(t.minSubscribersRequired || 0).toLocaleString("en-IN")}–${t.maxSubscribers.toLocaleString("en-IN")} subscribers` : `${(t.minSubscribersRequired || 0).toLocaleString("en-IN")}+ subscribers`;
    return {
      id: t.id,
      group: "creator",
      title: t.name,
      blurb: `${range}${t.creatorRevenueSharePercentage ? ` · ${t.creatorRevenueSharePercentage}% ad revenue share` : ""}`,
      status,
      note,
      options,
    };
  }).filter((p) => p.options.length > 0);

  const more = [];
  if (catalog.digitalPartner && catalog.digitalPartner.enabled) {
    more.push({
      id: "digital_partner_license",
      group: "more",
      title: "Digital Partner License",
      blurb: "Run a local partner business on YouPeak. The full fee is added to your ad-credit wallet.",
      status: "buy",
      note: "",
      options: [{ key: "once", label: "One-time", priceINR: catalog.digitalPartner.licenseFeeINR, params: { purpose: "digital_partner_license" } }],
    });
  }
  for (const p of catalog.adCreditPacks || []) {
    more.push({
      id: `pack:${p.id}`,
      group: "more",
      title: `Ad Credits — ${p.name}`,
      blurb: `${Number(p.credits).toLocaleString("en-IN")} credits${p.bonusPercent ? ` (incl. ${p.bonusPercent}% bonus)` : ""} · valid ${p.validityDays} days`,
      status: "buy",
      note: "",
      options: [{ key: "once", label: "One-time", priceINR: p.priceINR, params: { purpose: "ad_credits", packId: p.id, amountInr: p.priceINR } }],
    });
  }

  return { starter, creator, more };
}

export function findPlan(plans, wanted) {
  const id = resolvePlanId(wanted);
  if (!id) return null;
  return [...plans.starter, ...plans.creator, ...plans.more].find((p) => p.id === id) || null;
}
