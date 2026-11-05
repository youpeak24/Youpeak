import React, { useCallback, useEffect, useState } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { setToast } from "../../../util/toast";
import { fetchDefaultTiers, fetchTiers, saveTier } from "./configApi";
import { tierTableSchema } from "./configSchema";
import { inr } from "./format";

const COLUMNS = {
  TASKER: [
    { name: "membershipPrice", label: "Starter Pass", unit: "₹" },
    { name: "watchHoursToUpgrade", label: "Or unlock at", unit: "watch hrs" },
    { name: "adCreditsGranted", label: "Ad credits" },
    { name: "dailyAdLimit", label: "Ads/day" },
    { name: "dailyLikeLimit", label: "Likes/day" },
    { name: "dailyCommentLimit", label: "Comments/day" },
    { name: "dailyEarningCapInCoins", label: "Coin cap/day", unit: "incl. boost", hint: "earnings" },
  ],
  CREATOR: [
    { name: "creatorRevenueSharePercentage", label: "Creator share", unit: "%", hint: "split" },
    { name: "minSubscribersRequired", label: "Subscribers from" },
    { name: "maxSubscribers", label: "Subscribers to", placeholder: "no limit" },
    { name: "quarterlyPriceINR", label: "3 months", unit: "₹" },
    { name: "annualPriceINR", label: "1 year", unit: "₹" },
    { name: "standardQuarterlyPriceINR", label: "3 months after intro", unit: "₹", placeholder: "same" },
    { name: "standardAnnualPriceINR", label: "1 year after intro", unit: "₹", placeholder: "same" },
    { name: "introOfferLimit", label: "Intro price for first", unit: "creators", placeholder: "—" },
  ],
};

const ROW_FIELDS = {
  TASKER: ["tierName", ...COLUMNS.TASKER.map((c) => c.name), "isActive"],
  CREATOR: ["tierName", ...COLUMNS.CREATOR.map((c) => c.name), "isActive"],
};

// Shown blank (placeholder) when 0 / unset.
const BLANK_WHEN_ZERO = new Set(["maxSubscribers", "standardQuarterlyPriceINR", "standardAnnualPriceINR", "introOfferLimit"]);

const round2 = (n) => Math.round(n * 100) / 100;

function toRow(tierType, doc) {
  const row = {};
  for (const f of ROW_FIELDS[tierType]) {
    const v = doc[f];
    if (f === "isActive") row[f] = v !== false;
    else if (f === "tierName") row[f] = v || "";
    else if (v === null || v === undefined || (BLANK_WHEN_ZERO.has(f) && Number(v) === 0)) row[f] = "";
    else row[f] = v;
  }
  return row;
}

// Values the server stores that are derived from the edited ones.
function derived(tierType, row, coinsPerInr) {
  if (tierType === "TASKER") {
    return { dailyEarningCapInINR: round2(Number(row.dailyEarningCapInCoins) / (coinsPerInr || 100)) };
  }
  const annual = Number(row.annualPriceINR) || 0;
  const quarterly = Number(row.quarterlyPriceINR) || 0;
  return {
    companyRevenueSharePercentage: round2(100 - Number(row.creatorRevenueSharePercentage)),
    // Older app builds show and charge membershipPrice; they buy the annual pass.
    membershipPrice: annual > 0 ? annual : quarterly,
  };
}

function RowHint({ control, index, tierType, coinsPerInr }) {
  const row = useWatch({ control, name: `tiers.${index}` }) || {};
  if (tierType === "TASKER") {
    const perDay = Number(row.dailyEarningCapInCoins) / (coinsPerInr || 100);
    if (!Number.isFinite(perDay)) return null;
    return <div className="pc-hint">{inr(perDay)}/day · {inr(perDay * 30)}/month</div>;
  }
  const creator = Number(row.creatorRevenueSharePercentage);
  if (!Number.isFinite(creator)) return null;
  return <div className="pc-hint">{round2(creator)} / {round2(100 - creator)}</div>;
}

/**
 * Inline-editable tier ladder (Tasker levels or Creator VIP passes), stored
 * as membershipTiers docs. "Load launch defaults" fills the form from the
 * code's defaults (types/tiers.js) without saving, so the admin can review
 * the change before it goes live.
 */
export default function TierTable({ tierType, title, description, coinsPerInr }) {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isSubmitting, dirtyFields },
  } = useForm({ resolver: zodResolver(tierTableSchema(tierType)), defaultValues: { tiers: [] }, mode: "onChange" });
  const { fields } = useFieldArray({ control, name: "tiers" });

  const load = useCallback(async () => {
    try {
      const res = await fetchTiers(tierType);
      if (!res.status) return;
      const sorted = [...res.tiers].sort((a, b) => a.level - b.level);
      setDocs(sorted);
      reset({ tiers: sorted.map((d) => toRow(tierType, d)) });
    } catch (e) {
      setToast("error", "Couldn't load tiers.");
    } finally {
      setLoading(false);
    }
  }, [tierType, reset]);

  useEffect(() => {
    load();
  }, [load]);

  const loadDefaults = async () => {
    try {
      const res = await fetchDefaultTiers(tierType);
      if (!res.status) return;
      const byLevel = Object.fromEntries(res.tiers.map((t) => [t.level, t]));
      const rows = docs.map((d) => toRow(tierType, byLevel[d.level] ? { ...d, ...byLevel[d.level] } : d));
      reset({ tiers: rows }, { keepDefaultValues: true });
      setToast("info", "Launch defaults loaded into the table — review, then save.");
    } catch (e) {
      setToast("error", "Couldn't load the defaults.");
    }
  };

  const onSubmit = async ({ tiers }) => {
    const changed = tiers.map((row, i) => ({ row, doc: docs[i], i })).filter(({ i }) => dirtyFields.tiers?.[i]);
    const failures = [];
    for (const { row, doc } of changed) {
      try {
        const res = await saveTier({
          ...row,
          ...derived(tierType, row, coinsPerInr),
          tierType,
          level: doc.level,
        });
        if (!res.status) failures.push(`${row.tierName}: ${res.message}`);
      } catch (e) {
        failures.push(`${row.tierName}: ${e?.response?.data?.message || "save failed"}`);
      }
    }
    if (failures.length) setToast("error", failures.join(" · "));
    else setToast("success", `${changed.length} tier${changed.length === 1 ? "" : "s"} saved. Live within 30 seconds.`);
    await load();
  };

  const cols = COLUMNS[tierType];

  return (
    <form className="pc-card" onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="pc-card-head">
        <div>
          <h6 className="pc-card-title">{title}</h6>
          <div className="pc-card-desc">{description}</div>
        </div>
        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={loadDefaults} disabled={loading || !docs.length}>
          Load launch defaults
        </button>
      </div>
      <div className="pc-card-body">
        {loading ? (
          <div className="pc-muted">Loading tiers…</div>
        ) : !docs.length ? (
          <div className="pc-muted">No tiers yet — use “Seed defaults” on the Membership Tiers page first.</div>
        ) : (
          <div className="table-responsive pc-list">
            <table className="table table-sm align-middle mb-0 pc-tier-table">
              <thead>
                <tr>
                  <th scope="col">Tier</th>
                  {cols.map((c) => (
                    <th key={c.name} scope="col">
                      {c.label}
                      {c.unit ? <span className="pc-th-unit"> ({c.unit})</span> : null}
                    </th>
                  ))}
                  <th scope="col">Active</th>
                </tr>
              </thead>
              <tbody>
                {fields.map((row, i) => (
                  <tr key={row.id}>
                    <td className="pc-tier-name">
                      <input type="text" className="form-control form-control-sm" aria-label="Tier name" {...register(`tiers.${i}.tierName`)} />
                      <div className="pc-hint">Level {docs[i]?.level}</div>
                    </td>
                    {cols.map((c) => (
                      <td key={c.name}>
                        <input
                          type="number"
                          inputMode="decimal"
                          min={0}
                          step="any"
                          placeholder={c.placeholder}
                          aria-label={c.label}
                          className="form-control form-control-sm"
                          {...register(`tiers.${i}.${c.name}`)}
                        />
                        {c.hint ? <RowHint control={control} index={i} tierType={tierType} coinsPerInr={coinsPerInr} /> : null}
                        {errors.tiers?.[i]?.[c.name] ? <div className="pc-error">{errors.tiers[i][c.name].message}</div> : null}
                      </td>
                    ))}
                    <td>
                      <div className="form-check form-switch m-0">
                        <input type="checkbox" role="switch" className="form-check-input" aria-label="Active" {...register(`tiers.${i}.isActive`)} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div className="pc-card-foot">
        <span className="pc-muted pc-small">
          {tierType === "CREATOR"
            ? "Blank “after intro” prices keep the launch price. Company share = 100 − creator share."
            : "₹ caps are derived from the coin cap at the current coin rate."}
        </span>
        <div className="pc-actions">
          <button type="button" className="btn btn-sm btn-outline-secondary" disabled={!isDirty || isSubmitting} onClick={() => load()}>
            Discard
          </button>
          <button type="submit" className="btn btn-sm btn-primary" disabled={!isDirty || isSubmitting}>
            {isSubmitting ? "Saving…" : "Save tiers"}
          </button>
        </div>
      </div>
    </form>
  );
}
