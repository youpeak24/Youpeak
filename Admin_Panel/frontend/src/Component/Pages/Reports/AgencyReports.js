import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { setToast } from "../../../util/toast";
import {
  PageHeader, StatCard, StatusBadge, EmptyRow, COMMISSION_SOURCES, getAdminRole, inr,
} from "../PartnerNetwork/networkUi";

const SOURCE_LABELS = {
  ...COMMISSION_SOURCES,
  AD_IMPRESSION: "Ad impressions",
  DOWNLOAD: "App downloads",
  COIN_PURCHASE: "Coin purchases",
  PREMIUM_SUBSCRIPTION: "Premium subscriptions",
  PAID_CHANNEL: "Paid channel (legacy)",
};

// Super admin: platform-wide or per-franchise. Franchise login: its own district only.
export default function AgencyReports() {
  const isSuper = getAdminRole() === "SUPER_ADMIN";
  const [agencies, setAgencies] = useState([]);
  const [filters, setFilters] = useState({ agencyId: "", startDate: "", endDate: "" });
  const [applied, setApplied] = useState(filters);
  const [report, setReport] = useState(null);
  const [agency, setAgency] = useState(null);
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSuper) return;
    axios
      .get("admin/agency/getAgencies?start=1&limit=100")
      .then((res) => res.data.status && setAgencies(res.data.agencies || []))
      .catch(() => {});
  }, [isSuper]);

  const load = useCallback(() => {
    setLoading(true);
    const q = new URLSearchParams();
    if (isSuper && applied.agencyId) q.set("agencyId", applied.agencyId);
    if (applied.startDate) q.set("startDate", applied.startDate);
    if (applied.endDate) q.set("endDate", applied.endDate);
    Promise.all([
      axios.get(`admin/agencyReport/getAgencyReport?${q.toString()}`),
      axios.get(`admin/agencyReport/getDigitalPartners?${isSuper && applied.agencyId ? `agencyId=${applied.agencyId}` : ""}`),
    ])
      .then(([r, p]) => {
        setLoading(false);
        if (r.data.status) {
          setReport(r.data.report);
          setAgency(r.data.agency);
        } else {
          setToast("error", r.data.message);
        }
        if (p.data.status) setPartners(p.data.partners || []);
      })
      .catch(() => {
        setLoading(false);
        setToast("error", "Couldn't generate the report.");
      });
  }, [applied, isSuper]);

  useEffect(() => { load(); }, [load]);

  const submit = (e) => {
    e.preventDefault();
    if (filters.startDate && filters.endDate && filters.startDate > filters.endDate) {
      return setToast("error", "Start date must be before the end date.");
    }
    setApplied(filters);
  };

  const set = (k) => (e) => setFilters((f) => ({ ...f, [k]: e.target.value }));
  const sources = report ? Object.entries(report.commissionBySource || {}) : [];
  const period = applied.startDate || applied.endDate ? `${applied.startDate || "start"} → ${applied.endDate || "today"}` : "All time";

  return (
    <div className="pn-page">
      <PageHeader
        title="Franchise Reports"
        subtitle={report?.scope === "PLATFORM" ? `Whole platform · ${period}` : `${agency ? `${agency.name} · ${agency.district}` : "Your franchise"} · ${period}`}
      />

      <form className="pn-panel pn-panel-body pn-filters mb-3" onSubmit={submit}>
        {isSuper && (
          <select className="form-control" value={filters.agencyId} onChange={set("agencyId")} aria-label="District Franchise">
            <option value="">Whole platform</option>
            {agencies.map((a) => <option key={a._id} value={a._id}>{a.name} ({a.district})</option>)}
          </select>
        )}
        <label className="mb-0 d-flex align-items-center gap-2">
          <span className="pn-muted" style={{ whiteSpace: "nowrap" }}>From</span>
          <input type="date" className="form-control" value={filters.startDate} onChange={set("startDate")} />
        </label>
        <label className="mb-0 d-flex align-items-center gap-2">
          <span className="pn-muted" style={{ whiteSpace: "nowrap" }}>To</span>
          <input type="date" className="form-control" value={filters.endDate} onChange={set("endDate")} />
        </label>
        <button type="submit" className="btn btn-success" style={{ borderRadius: 0 }}>Generate report</button>
      </form>

      {loading ? (
        <div className="pn-muted">Generating report…</div>
      ) : !report ? (
        <div className="pn-muted">No report data.</div>
      ) : (
        <>
          <div className="pn-stats">
            <StatCard tone="info" label={report.scope === "PLATFORM" ? "New users" : "Users in district"} value={report.totalUsers} hint={report.scope === "PLATFORM" ? "Registered in this period" : "By profile district"} />
            <StatCard tone="accent" label="Digital Partners" value={report.totalDigitalPartners} hint={report.activeDigitalPartners != null ? `${report.activeDigitalPartners} active` : undefined} />
            {report.scope === "FRANCHISE" && (
              <>
                <StatCard label="Referrals" value={report.totalReferrals} hint={`${report.completedReferrals} completed · ${report.lifetimeReferrals} all time`} />
                <StatCard label="Referral rewards paid" value={inr(report.referralRewardsPaidInr)} />
              </>
            )}
            {report.scope === "PLATFORM" && (
              <>
                <StatCard label="App downloads" value={report.totalDownloads} />
                <StatCard label="Video views" value={report.totalVideoViews} hint="All time" />
                <StatCard label="Ad impressions" value={report.totalAdImpressions} hint="All time" />
              </>
            )}
            <StatCard tone="warning" label="Franchise commission" value={inr(report.totalCommissionEarned)} hint={`on ${inr(report.totalGrossRevenue)} revenue`} />
          </div>

          <div className="pn-panel">
            <div className="pn-panel-head"><h6>Commission by source</h6></div>
            <div className="table-responsive">
              <table className="table align-middle mb-0">
                <thead><tr><th>Source</th><th>Transactions</th><th>Gross revenue</th><th>Commission</th></tr></thead>
                <tbody>
                  {sources.length === 0 ? (
                    <EmptyRow colSpan={4}>No commissions in this period.</EmptyRow>
                  ) : (
                    sources.map(([key, v]) => (
                      <tr key={key}>
                        <td>{SOURCE_LABELS[key] || key}</td>
                        <td>{v.count}</td>
                        <td>{inr(v.grossAmount)}</td>
                        <td className="fw-semibold">{inr(v.commissionAmount)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pn-panel">
            <div className="pn-panel-head"><h6>Digital Partners ({partners.length})</h6></div>
            <div className="table-responsive">
              <table className="table align-middle mb-0">
                <thead>
                  <tr>
                    <th>Partner</th>
                    {isSuper && <th>Franchise</th>}
                    <th>Referrals</th>
                    <th>Earned</th>
                    <th>Licence fee</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {partners.length === 0 ? (
                    <EmptyRow colSpan={isSuper ? 6 : 5}>No Digital Partners.</EmptyRow>
                  ) : (
                    partners.map((p) => (
                      <tr key={p.userId}>
                        <td>
                          <div className="fw-semibold">{p.fullName}</div>
                          <small className="pn-muted">{p.email}</small>
                        </td>
                        {isSuper && <td>{p.agencyName || <span className="pn-muted">Not linked</span>}</td>}
                        <td>{p.referrals.completed} / {p.referrals.total}</td>
                        <td>{inr(p.earnings.referralInr)}</td>
                        <td>{inr(p.licenseFeePaid)}</td>
                        <td><StatusBadge status={p.partnerStatus} /></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
