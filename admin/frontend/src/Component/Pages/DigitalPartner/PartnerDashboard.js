import React, { useEffect, useState } from "react";
import axios from "axios";
import { setToast } from "../../../util/toast";
import { PageHeader, StatCard, StatusBadge, RewardFlow, inr, fmtDate } from "../PartnerNetwork/networkUi";
import ReferralShareCard from "../PartnerNetwork/ReferralShareCard";
import { NotActivePartner } from "./PartnerPortalPages";

// Digital Partner's own panel: referral code and headline numbers. Referrals,
// reward history and the wallet have their own sidebar pages (PartnerPortalPages).
export default function PartnerDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get("admin/partnerPortal/dashboard")
      .then((res) => {
        setLoading(false);
        if (res.data.status) setData(res.data);
        else setToast("error", res.data.message);
      })
      .catch(() => {
        setLoading(false);
        setToast("error", "Couldn't load your dashboard.");
      });
  }, []);

  if (loading) return <div className="pn-page pn-muted">Loading dashboard…</div>;
  if (!data || data.isDigitalPartner === false || !data.partner) return <NotActivePartner />;

  const p = data.partner;
  const r = p.referrals;

  return (
    <div className="pn-page">
      <PageHeader title={`Welcome, ${p.fullName || "Partner"}`} subtitle={`Digital Partner${p.agencyName ? ` · ${p.agencyName}` : ""}`}>
        <StatusBadge status={p.partnerStatus} />
      </PageHeader>

      <div className="pn-panel">
        <div className="pn-panel-head"><h6>Share your referral</h6></div>
        <div className="pn-panel-body">
          <ReferralShareCard code={p.referralCode} name={p.fullName} />
        </div>
      </div>

      <div className="pn-stats">
        <StatCard tone="info" label="Referrals" value={r.total} hint={`${r.completed} completed · ${r.awaitingWatchTime} in progress`} />
        <StatCard tone="accent" label="Earned" value={inr(p.earnings.referralInr)} hint="Paid to your wallet" />
        <StatCard tone="warning" label="On hold" value={inr(p.earnings.pendingInr)} hint="Paid after the hold period" />
        <StatCard label="Ad credits" value={inr(p.adCreditsBalance)} hint={p.licenseFeePaid ? `Licence ${inr(p.licenseFeePaid)}` : undefined} />
      </div>

      <div className="pn-panel">
        <div className="pn-panel-head"><h6>How you earn</h6></div>
        <div className="pn-panel-body"><RewardFlow rules={data.rules} /></div>
      </div>
      <small className="pn-muted">Partner since {fmtDate(p.partnerSince)}</small>
    </div>
  );
}
