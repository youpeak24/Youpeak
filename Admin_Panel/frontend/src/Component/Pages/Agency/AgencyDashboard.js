import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { setToast } from "../../../util/toast";
import {
  PageHeader, StatCard, StatusBadge, EmptyRow, RewardFlow, CommissionStatus, COMMISSION_SOURCES, inr, fmtDate,
} from "../PartnerNetwork/networkUi";

// District Franchise home: its partners, their referrals, its commissions.
export default function AgencyDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get("admin/franchisePortal/dashboard")
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
  if (!data) return <div className="pn-page">Dashboard unavailable.</div>;

  const { agency, summary, commissions, recentCommissions, partners, rules } = data;
  const top = [...partners].sort((a, b) => b.earnings.referralInr - a.earnings.referralInr).slice(0, 5);

  return (
    <div className="pn-page">
      <PageHeader title={agency.name} subtitle={`District Franchise · ${agency.district}, ${agency.state}`}>
        <button className="btn btn-outline-secondary" onClick={() => navigate("/admin/franchiseReferrals")}>View referrals</button>
        <button className="btn btn-success" onClick={() => navigate("/admin/franchisePartners")}>Manage Digital Partners</button>
      </PageHeader>

      <div className="pn-stats">
        <StatCard tone="accent" label="Digital Partners" value={summary.totalPartners} hint={`${summary.activePartners} active · ${summary.suspendedPartners} suspended`} />
        <StatCard tone="info" label="Referrals" value={summary.referrals.total} hint={`${summary.referrals.completed} completed · ${summary.referrals.awaitingWatchTime} in progress`} />
        <StatCard label="Partner earnings" value={inr(summary.referralEarningsInr)} hint={`${inr(summary.pendingEarningsInr)} on hold`} />
        <StatCard tone="warning" label="Your commission" value={inr(commissions.totalEarned)} hint={`${inr(commissions.paid)} paid · ${inr(commissions.pendingPayout)} due`} />
        {commissions.awaitingVerification > 0 && (
          <StatCard tone="danger" label="Awaiting admin verification" value={inr(commissions.awaitingVerification)} hint="Licence fees you recorded" />
        )}
      </div>

      <div className="pn-panel">
        <div className="pn-panel-head"><h6>How referral rewards work</h6></div>
        <div className="pn-panel-body"><RewardFlow rules={rules} /></div>
      </div>

      <div className="pn-two">
          <div className="pn-panel">
            <div className="pn-panel-head">
              <h6>Top partners</h6>
              <button className="btn btn-link p-0" onClick={() => navigate("/admin/franchisePartners")}>All partners</button>
            </div>
            <div className="table-responsive">
              <table className="table align-middle mb-0">
                <thead>
                  <tr><th>Partner</th><th>Referrals</th><th>Earned</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {top.length === 0 ? (
                    <EmptyRow colSpan={4}>No partners yet — add your first Digital Partner.</EmptyRow>
                  ) : (
                    top.map((p) => (
                      <tr key={p.userId} role="button" onClick={() => navigate(`/admin/partnerDetail?userId=${p.userId}`)}>
                        <td className="fw-semibold">{p.fullName}</td>
                        <td>{p.referrals.completed} / {p.referrals.total}</td>
                        <td>{inr(p.earnings.referralInr)}</td>
                        <td><StatusBadge status={p.partnerStatus} /></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <div className="pn-panel">
            <div className="pn-panel-head"><h6>Recent commissions</h6></div>
            <div className="table-responsive">
              <table className="table align-middle mb-0">
                <thead>
                  <tr><th>Date</th><th>Source</th><th>Commission</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {recentCommissions.length === 0 ? (
                    <EmptyRow colSpan={4}>No commissions yet.</EmptyRow>
                  ) : (
                    recentCommissions.map((c) => (
                      <tr key={c._id}>
                        <td>{fmtDate(c.createdAt)}</td>
                        <td>{COMMISSION_SOURCES[c.sourceType] || c.sourceType}</td>
                        <td className="fw-semibold">{inr(c.commissionAmount)}</td>
                        <td><CommissionStatus c={c} forFranchise /></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
      </div>
    </div>
  );
}
