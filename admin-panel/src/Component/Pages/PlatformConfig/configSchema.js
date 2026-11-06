// Builds the Zod schema for a Platform Config section from the field
// metadata the backend sends (functions/backend/util/platformConfig.js), so
// the form enforces exactly the rules the server enforces. The section-level
// checks mirror checkFails() there.
import { z } from "zod";

// Settings paths contain dots, which react-hook-form reads as nesting.
export const toKey = (path) => path.replace(/\./g, "__");

const HTTPS_URL = /^https:\/\/[^\s/$.?#][^\s]*$/i;

const toNumber = (v) => {
  if (v === "" || v === null || v === undefined) return undefined;
  return typeof v === "number" ? v : Number(v);
};

export function scalarSchema(f) {
  switch (f.type) {
    case "boolean":
      return z.boolean();
    case "text":
      return z
        .string()
        .trim()
        .min(f.minLength || 1, "Required.")
        .max(f.maxLength || 60, `At most ${f.maxLength || 60} characters.`);
    case "url":
      return z.string().trim().regex(HTTPS_URL, "Must be a full https:// URL.").max(f.maxLength || 300);
    case "select":
      return z.enum(f.options, { errorMap: () => ({ message: `Choose one of: ${f.options.join(", ")}.` }) });
    default: {
      let s = z.number({ required_error: "Required.", invalid_type_error: "Must be a number." }).finite("Must be a number.");
      if (f.integer) s = s.int("Must be a whole number.");
      if (f.min != null) s = s.min(f.min, `Must be at least ${f.min}.`);
      if (f.max != null) s = s.max(f.max, `Must be at most ${f.max}.`);
      return z.preprocess(toNumber, s);
    }
  }
}

function fieldSchema(f) {
  if (f.type !== "list") return scalarSchema(f);
  const item = z.object(Object.fromEntries(f.item.map((sub) => [sub.path, scalarSchema(sub)])));
  return z
    .array(item)
    .min(f.minItems || 1, `Add at least ${f.minItems || 1}.`)
    .max(f.maxItems || 20, `At most ${f.maxItems || 20} entries.`);
}

// Returns the check's message when it fails, else null.
export function checkFails(c, get) {
  const n = (p) => Number(get(p) || 0);
  switch (c.type) {
    case "sum":
      return Math.abs(c.paths.reduce((s, p) => s + n(p), 0) - c.equals) > 1e-9 ? c.message : null;
    case "sumMax":
      return c.paths.reduce((s, p) => s + n(p), 0) > c.max ? c.message : null;
    case "lte":
      return n(c.a) > n(c.b) ? c.message : null;
    case "listLte":
      return (get(c.list) || []).some((it) => Number(it[c.a]) > Number(it[c.b])) ? c.message : null;
    case "listWithin":
      return (get(c.list) || []).some((it) => Number(it[c.field]) < n(c.min) || Number(it[c.field]) > n(c.max))
        ? c.message
        : null;
    case "listUnique": {
      const seen = new Set();
      for (const it of get(c.list) || []) {
        const k = String(it[c.field]).trim().toLowerCase();
        if (seen.has(k)) return c.message;
        seen.add(k);
      }
      return null;
    }
    default:
      return null;
  }
}

// The field a failed check is reported on (same choice as the backend).
export const checkTarget = (c) => c.list || c.a || (c.paths && c.paths[0]);

// react-hook-form re-validates only the field being edited, so a cross-field
// error (e.g. "shares must add up to 100%", shown on the first share) would
// linger after fixing a different field. Map each field to the check targets
// it feeds, for register(name, { deps }).
export function checkDeps(section) {
  const map = {};
  for (const c of section.checks || []) {
    const target = toKey(checkTarget(c));
    const involved = (
      c.type === "sum" || c.type === "sumMax" ? c.paths
      : c.type === "lte" ? [c.a, c.b]
      : c.type === "listWithin" ? [c.min, c.max]
      : []
    ).map(toKey);
    for (const k of involved) {
      if (k === target) continue;
      (map[k] = map[k] || new Set()).add(target);
    }
  }
  return Object.fromEntries(Object.entries(map).map(([k, s]) => [k, [...s]]));
}

export function buildSectionSchema(section) {
  const shape = Object.fromEntries(section.fields.map((f) => [toKey(f.path), fieldSchema(f)]));
  return z.object(shape).superRefine((values, ctx) => {
    const get = (p) => values[toKey(p)];
    for (const c of section.checks || []) {
      const message = checkFails(c, get);
      if (message) ctx.addIssue({ code: z.ZodIssueCode.custom, message, path: [toKey(checkTarget(c))] });
    }
  });
}

// Settings values ({ "a.b": v }) -> form values ({ a__b: v }) and back.
export function toFormValues(section) {
  return Object.fromEntries(section.fields.map((f) => [toKey(f.path), section.values[f.path]]));
}

export function fromFormValues(section, formValues) {
  return Object.fromEntries(section.fields.map((f) => [f.path, formValues[toKey(f.path)]]));
}

// Server errors are keyed by settings path ("peakBoost.presets.0.coins");
// map them to react-hook-form field names.
export function serverErrorToField(section, key) {
  for (const f of section.fields) {
    if (key === f.path) return toKey(f.path);
    if (f.type === "list" && key.startsWith(`${f.path}.`)) return `${toKey(f.path)}.${key.slice(f.path.length + 1)}`;
  }
  return null;
}

// ── Tier tables ──────────────────────────────────────────────────────────────
const money = z.preprocess(toNumber, z.number({ required_error: "Required.", invalid_type_error: "Number." }).min(0, "≥ 0"));
const count = z.preprocess(toNumber, z.number({ required_error: "Required.", invalid_type_error: "Number." }).int("Whole number.").min(0, "≥ 0"));
// Blank = 0 ("same as launch price" / "no intro offer").
const blankZero = (v) => (v === "" || v === null || v === undefined ? 0 : Number(v));
const optionalMoney = z.preprocess(blankZero, z.number({ invalid_type_error: "Number." }).min(0, "≥ 0"));
const optionalCountZero = z.preprocess(blankZero, z.number({ invalid_type_error: "Number." }).int("Whole number.").min(0, "≥ 0"));
const optionalCount = z.preprocess(
  (v) => (v === "" || v === null || v === undefined || Number(v) === 0 ? null : Number(v)),
  z.number({ invalid_type_error: "Number." }).int("Whole number.").min(0, "≥ 0").nullable()
);

const taskerTier = z.object({
  tierName: z.string().trim().min(1, "Required."),
  membershipPrice: money,
  watchHoursToUpgrade: count,
  adCreditsGranted: count,
  dailyAdLimit: count,
  dailyLikeLimit: count,
  dailyCommentLimit: count,
  dailyEarningCapInCoins: count,
  isActive: z.boolean(),
});

const creatorTier = z
  .object({
    tierName: z.string().trim().min(1, "Required."),
    minSubscribersRequired: count,
    maxSubscribers: optionalCount,
    quarterlyPriceINR: money,
    annualPriceINR: money,
    standardQuarterlyPriceINR: optionalMoney,
    standardAnnualPriceINR: optionalMoney,
    introOfferLimit: optionalCountZero,
    creatorRevenueSharePercentage: z.preprocess(toNumber, z.number({ required_error: "Required." }).min(0, "≥ 0").max(100, "≤ 100")),
    isActive: z.boolean(),
  })
  .superRefine((t, ctx) => {
    if (t.maxSubscribers != null && t.maxSubscribers < t.minSubscribersRequired) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Below the minimum.", path: ["maxSubscribers"] });
    }
  });

export const tierTableSchema = (tierType) =>
  z.object({ tiers: z.array(tierType === "CREATOR" ? creatorTier : taskerTier) });
