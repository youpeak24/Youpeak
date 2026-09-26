import React, { useEffect, useState } from "react";
import axios from "axios";
import { setToast } from "../../../util/toast";
import {
  PageHeader, StatCard, StatusBadge, EmptyRow, ReferralTable, RewardFlow, inr, fmtDate, fmtDateTime,
} from "../PartnerNetwork/networkUi";
import ReferralShareCard from "../PartnerNetwork/ReferralShareCard";
import PartnerWallet from "../PartnerNetwork/PartnerWallet";

const LEDGER_TYPES = {
  5.1: "Stage 1 / direct referral bonus",
  10: "Stage 2 / paid-pass bonus",
  13: "Tasker earnings commission",
};

// Digital Partner's own panel: referral code, referrals and earnings.
export default function PartnerDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
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
  };

  useEffect(load, []);

  if (loading) return <div className="pn-page pn-muted">Loading dashboard…</div>;
  if (!data || data.isDigitalPartner === false || !data.partner) {
    return (
      <div className="pn-page">
        <div className="alert alert-warning">This login isn't linked to an active Digital Partner. Contact your District Franchise.</div>
      </div>
    );
  }

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

      <PartnerWallet onChanged={load} />

      <div className="pn-panel">
        <div className="pn-panel-head"><h6>How you earn</h6></div>
        <div className="pn-panel-body"><RewardFlow rules={data.rules} /></div>
      </div>

      <div className="pn-panel">
        <div className="pn-panel-head">
          <h6>Your referrals ({data.referralTotal})</h6>
          {data.referralTotal > data.referrals.length && <small className="pn-muted">Showing the latest {data.referrals.length}</small>}
        </div>
        <ReferralTable referrals={data.referrals} showPartner={false} emptyText="No referrals yet — share your code to get started." />
      </div>

      <div className="pn-panel">
        <div className="pn-panel-head"><h6>Reward history</h6></div>
        <div className="table-responsive" style={{ maxHeight: 360 }}>
          <table className="table align-middle mb-0">
            <thead><tr><th>Date</th><th>Reward</th><th>Amount</th></tr></thead>
            <tbody>
              {data.rewardLedger.length === 0 ? (
                <EmptyRow colSpan={3}>No rewards paid yet.</EmptyRow>
              ) : (
                data.rewardLedger.map((h) => (
                  <tr key={h._id}>
                    <td>{fmtDateTime(h.date)}</td>
                    <td>{h.note || LEDGER_TYPES[h.type] || "Referral reward"}</td>
                    <td className="fw-semibold">{inr(h.inr)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <small className="pn-muted">Partner since {fmtDate(p.partnerSince)}</small>
    </div>
  );
}
