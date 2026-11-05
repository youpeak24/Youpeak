import React, { useCallback, useEffect, useState } from "react";
import ConfigSectionForm from "./ConfigSectionForm";
import TierTable from "./TierTable";
import { fetchPlatformConfig } from "./configApi";
import "./platformConfig.css";

// Other admins' saves show up here within this interval.
const POLL_MS = 20000;

function usePlatformConfig() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await fetchPlatformConfig();
      if (res.status) {
        setData(res);
        setError(null);
      } else setError(res.message || "Couldn't load the config.");
    } catch (e) {
      setError(e?.response?.data?.message || "Couldn't load the config.");
    }
  }, []);

  useEffect(() => {
    load();
    const tick = () => {
      if (!document.hidden) load();
    };
    const id = setInterval(tick, POLL_MS);
    window.addEventListener("focus", tick);
    return () => {
      clearInterval(id);
      window.removeEventListener("focus", tick);
    };
  }, [load]);

  return { data, error, reload: load };
}

function PlatformConfigPage({ title, subtitle, sectionKeys = [], tiers = [] }) {
  const { data, error, reload } = usePlatformConfig();
  const sections = data ? sectionKeys.map((k) => data.sections.find((s) => s.key === k)).filter(Boolean) : [];
  const coinsPerInr = Number(data?.sections.find((s) => s.key === "tasker_rewards")?.values.coinsPerInr) || 100;

  return (
    <div className="pc-page">
      <div className="pc-page-head">
        <h4 className="pc-page-title">{title}</h4>
        <div className="pc-page-sub">{subtitle}</div>
      </div>
      {error ? (
        <div className="pc-banner pc-banner-error" role="alert">
          {error}{" "}
          <button type="button" className="btn btn-sm btn-link p-0 align-baseline" onClick={reload}>
            Retry
          </button>
        </div>
      ) : null}
      {!data && !error ? <div className="pc-muted">Loading…</div> : null}
      {data
        ? tiers.map((t) => <TierTable key={t.tierType} {...t} coinsPerInr={coinsPerInr} />)
        : null}
      {sections.map((s) => (
        <ConfigSectionForm key={s.key} section={s} coinsPerInr={coinsPerInr} onSaved={reload} />
      ))}
    </div>
  );
}

export const TaskerConfig = () => (
  <PlatformConfigPage
    title="Tasker Tiers & Rewards"
    subtitle="A Tasker moves up a level by reaching its lifetime watch hours or by buying its Starter Pass. Watch hours never reset."
    tiers={[
      {
        tierType: "TASKER",
        title: "Tasker tiers",
        description: "Free Tasker plus Levels 1–4. Daily caps apply per tier; the ad limit per day is also capped platform-wide below.",
      },
    ]}
    sectionKeys={["tasker_rewards"]}
  />
);

export const CreatorPassConfig = () => (
  <PlatformConfigPage
    title="Creator VIP Passes"
    subtitle="Passes run for 3 months or a year. A creator can buy a pass only once they have the minimum subscribers. Passes bought before billing periods existed never expire."
    tiers={[
      {
        tierType: "CREATOR",
        title: "VIP passes & revenue splits",
        description: "Launch prices apply to the first N creators of a pass, who keep them on renewal; later buyers pay the “after intro” price.",
      },
    ]}
  />
);

export const PartnerProgramConfig = () => (
  <PlatformConfigPage
    title="Partner Program & Milestones"
    subtitle="Digital Partner license, the two referral milestones, and District Franchise commissions."
    sectionKeys={["partner_program"]}
  />
);

export const BoostPromotionConfig = () => (
  <PlatformConfigPage
    title="Peak Boost & Promotions"
    subtitle="Fan tipping limits and split, and the paid video promotion rate card."
    sectionKeys={["peak_boost", "promotion_rate_card"]}
  />
);

export const PayoutPolicyConfig = () => (
  <PlatformConfigPage
    title="Payout Policy"
    subtitle="Withdrawal thresholds for users, creators and Digital Partners. The payment gateway is set on the Settings page."
    sectionKeys={["payout_policy"]}
  />
);

export const SafetyConfig = () => (
  <PlatformConfigPage
    title="Moderation & Anti-Fraud Settings"
    subtitle="Thresholds behind the moderation queue, duplicate detection and Tasker device checks."
    sectionKeys={["moderation", "task_security"]}
  />
);

export const AdCreditPacksConfig = () => (
  <PlatformConfigPage title="Ad Credit Packs" subtitle="Top-up packages and how long bought credits stay valid." sectionKeys={["ad_credit_packs"]} />
);
