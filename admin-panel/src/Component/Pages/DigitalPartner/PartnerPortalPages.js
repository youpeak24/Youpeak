import React, { useEffect, useState } from "react";
import axios from "axios";
import { setToast } from "../../../util/toast";
import { PageHeader, EmptyRow, ReferralTable, inr, fmtDateTime } from "../PartnerNetwork/networkUi";
import PartnerWallet from "../PartnerNetwork/PartnerWallet";

const LEDGER_TYPES = {
  5.1: "Stage 1 / direct referral bonus",
  10: "Stage 2 / paid-pass bonus",
  13: "Tasker earnings commission",
};

// The dashboard endpoint already returns the partner's referrals and reward
// ledger (partnerNetwork.service partnerDetail), so these sidebar pages share it.
function usePartnerDashboard() {
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
        setToast("error", "Couldn't load your partner data.");
      });
  }, []);

  return { data, loading };
}

export function NotActivePartner() {
  return (
    <div className="pn-page">
      <div className="alert alert-warning">This login isn't linked to an active Digital Partner. Contact your District Franchise.</div>
    </div>
  );
}

const isActive = (data) => data && data.isDigitalPartner !== false && data.partner;

// Digital Partner portal: everyone who joined with this partner's code.
export function PartnerReferrals() {
  const { data, loading } = usePartnerDashboard();

  if (loading) return <div className="pn-page pn-muted">Loading referrals…</div>;
  if (!isActive(data)) return <NotActivePartner />;

  return (
    <div className="pn-page">
      <PageHeader title="Your referrals" subtitle="New users who joined with your referral code, and where each one is in the reward workflow." />
      <div className="pn-panel">
        <div className="pn-panel-head">
          <h6>Referrals ({data.referralTotal})</h6>
          {data.referralTotal > data.referrals.length && <small className="pn-muted">Showing the latest {data.referrals.length}</small>}
        </div>
        <ReferralTable referrals={data.referrals} showPartner={false} emptyText="No referrals yet — share your code to get started." />
      </div>
    </div>
  );
}

// Digital Partner portal: referral rewards credited to the partner's wallet.
export function PartnerRewardHistory() {
  const { data, loading } = usePartnerDashboard();

  if (loading) return <div className="pn-page pn-muted">Loading reward history…</div>;
  if (!isActive(data)) return <NotActivePartner />;

  return (
    <div className="pn-page">
      <PageHeader title="Reward history" subtitle="Referral rewards paid to your wallet." />
      <div className="pn-panel">
        <div className="table-responsive">
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
    </div>
  );
}

// Digital Partner portal: coins, conversion and withdrawals.
export function PartnerWalletPage() {
  return (
    <div className="pn-page">
      <PageHeader title="Wallet" subtitle="Convert coins and request withdrawals." />
      <PartnerWallet />
    </div>
  );
}
