import React, { useEffect, useState } from "react";
import Title from "../../extra/Title";
import axios from "axios";
import { setToast } from "../../../util/toast";

const inr = (v) =>
  `₹ ${Number(v || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const count = (v) => Number(v || 0).toLocaleString("en-IN");
const date = (v) => (v ? new Date(v).toLocaleDateString("en-IN") : "—");

const styles = {
  groupLabel: {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: "#64748b",
    margin: "0 0 8px",
  },
  stat: {
    border: "1px solid var(--new-border-color)",
    borderRadius: "var(--radius-sm)",
    background: "#fff",
    padding: "12px 14px",
    height: "100%",
  },
  statLabel: { fontSize: 12, color: "#64748b", marginBottom: 4 },
  statValue: { fontSize: 18, fontWeight: 600, color: "#0f172a", lineHeight: 1.2 },
  statHint: { fontSize: 11, color: "#94a3b8", marginTop: 2 },
  panel: {
    border: "1px solid var(--new-border-color)",
    borderRadius: "var(--radius-sm)",
    background: "#fff",
  },
  th: {
    fontSize: 11,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    color: "#64748b",
    whiteSpace: "nowrap",
    borderBottom: "1px solid var(--new-border-color)",
    background: "#f8fafc",
  },
  td: { fontSize: 13, color: "#0f172a", whiteSpace: "nowrap", verticalAlign: "middle" },
};

function Stat({ label, value, hint }) {
  return (
    <div style={styles.stat}>
      <div style={styles.statLabel}>{label}</div>
      <div style={styles.statValue}>{value}</div>
      {hint && <div style={styles.statHint}>{hint}</div>}
    </div>
  );
}

function StatGroup({ title, children }) {
  return (
    <div className="mb-3">
      <p style={styles.groupLabel}>{title}</p>
      <div className="row g-2">
        {React.Children.map(children, (child) => (
          <div className="col-6 col-md-4 col-xl-3">{child}</div>
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const active = status === "ACTIVE";
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 600,
        padding: "2px 8px",
        borderRadius: "var(--radius-sm)",
        border: `1px solid ${active ? "#a7f3d0" : "#e2e8f0"}`,
        background: active ? "#ecfdf5" : "#f8fafc",
        color: active ? "#047857" : "#64748b",
      }}
    >
      {status}
    </span>
  );
}

export default function DigitalPartnerReports() {
  const admin = JSON.parse(sessionStorage.getItem("admin") || "{}");
  const isPartner = admin?.role === "DIGITAL_PARTNER_ADMIN";

  const [filters, setFilters] = useState({ startDate: "", endDate: "", state: "", district: "" });
  const [summary, setSummary] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchReport = (f = filters) => {
    setLoading(true);
    const params = Object.fromEntries(Object.entries(f).filter(([, v]) => v));
    axios
      .get("admin/digitalPartner/report", { params })
      .then((res) => {
        setLoading(false);
        if (res.data.status) {
          setSummary(res.data.summary);
          setRows(res.data.partners || []);
        } else {
          setToast("error", res.data.message);
        }
      })
      .catch((err) => {
        setLoading(false);
        setToast("error", err.response?.data?.message || err.message);
      });
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const setField = (key) => (e) => setFilters((f) => ({ ...f, [key]: e.target.value }));

  const handleApply = (e) => {
    e.preventDefault();
    if (filters.startDate && filters.endDate && filters.startDate > filters.endDate) {
      setToast("warning", "Start date must be before end date.");
      return;
    }
    fetchReport();
  };

  const handleReset = () => {
    const cleared = { startDate: "", endDate: "", state: "", district: "" };
    setFilters(cleared);
    fetchReport(cleared);
  };

  const exportCsv = () => {
    const header = [
      "Name", "Email", "State", "District", "Status", "Activated On", "License Fee (INR)",
      "Referrals", "Completed Referrals", "Flagged Referrals", "Referral Earnings (INR)",
      "Ads Submitted", "Ads Active", "Ads Pending", "Ads Rejected", "Approved Ad Budget (INR)",
      "Ad Commission (INR)", "Impressions", "Clicks", "Ad Credits (INR)",
    ];
    const lines = rows.map((r) => [
      r.fullName, r.email, r.state, r.district, r.partnerStatus, date(r.activatedAt), r.licenseFeePaid,
      r.referrals.total, r.referrals.completed, r.referrals.flagged, r.referralEarningsInr,
      r.ads.submitted, r.ads.active, r.ads.pending, r.ads.rejected, r.ads.approvedBudgetInr,
      r.ads.commissionInr, r.ads.impressions, r.ads.clicks, r.adCreditsBalance,
    ]);
    const csv = [header, ...lines]
      .map((line) => line.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `digital-partner-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const ctr = summary && summary.impressions > 0
    ? `${((summary.clicks / summary.impressions) * 100).toFixed(2)}% click-through`
    : null;
  const periodNote = filters.startDate || filters.endDate ? "In selected period" : "All time";

  return (
    <div className="mainPage p-4">
      <Title name={isPartner ? "My Partner Report" : "Digital Partner Reports"} />

      <form onSubmit={handleApply} style={{ ...styles.panel, padding: 14 }} className="mb-3">
        <div className="row g-2 align-items-end">
          <div className="col-6 col-md-3">
            <label className="form-label mb-1" style={{ fontSize: 12 }}>Start date</label>
            <input type="date" className="form-control form-control-sm" value={filters.startDate} onChange={setField("startDate")} />
          </div>
          <div className="col-6 col-md-3">
            <label className="form-label mb-1" style={{ fontSize: 12 }}>End date</label>
            <input type="date" className="form-control form-control-sm" value={filters.endDate} onChange={setField("endDate")} />
          </div>
          {!isPartner && (
            <>
              <div className="col-6 col-md-2">
                <label className="form-label mb-1" style={{ fontSize: 12 }}>State</label>
                <input className="form-control form-control-sm" placeholder="Any" value={filters.state} onChange={setField("state")} />
              </div>
              <div className="col-6 col-md-2">
                <label className="form-label mb-1" style={{ fontSize: 12 }}>District</label>
                <input className="form-control form-control-sm" placeholder="Any" value={filters.district} onChange={setField("district")} />
              </div>
            </>
          )}
          <div className={`col-12 ${isPartner ? "col-md-6" : "col-md-2"} d-flex gap-2`}>
            <button type="submit" className="btn btn-sm text-white flex-grow-1" style={{ background: "var(--new-color)", borderRadius: "var(--radius-sm)" }}>
              Apply
            </button>
            <button type="button" className="btn btn-sm btn-light border flex-grow-1" style={{ borderRadius: "var(--radius-sm)" }} onClick={handleReset}>
              Reset
            </button>
          </div>
        </div>
      </form>

      {loading && !summary ? (
        <div style={{ ...styles.panel, padding: 40 }} className="text-center text-muted">Loading report…</div>
      ) : summary ? (
        <>
          {!isPartner && (
            <StatGroup title="Partners">
              <Stat label="Total partners" value={count(summary.totalPartners)} />
              <Stat label="Active partners" value={count(summary.activePartners)} />
              <Stat label="License revenue" value={inr(summary.licenseRevenueInr)} hint={periodNote} />
              <Stat label="Unused ad credits" value={inr(summary.adCreditsBalance)} hint="Current balance" />
            </StatGroup>
          )}

          {isPartner && (
            <StatGroup title="License">
              <Stat label="License fee paid" value={inr(summary.licenseRevenueInr)} />
              <Stat label="Ad credits balance" value={inr(summary.adCreditsBalance)} hint="Current balance" />
            </StatGroup>
          )}

          <StatGroup title="Referrals">
            <Stat label="Referrals" value={count(summary.referrals)} hint={periodNote} />
            <Stat label="Completed both stages" value={count(summary.completedReferrals)} />
            <Stat label="Flagged as suspicious" value={count(summary.flaggedReferrals)} />
            <Stat label="Referral earnings" value={inr(summary.referralEarningsInr)} hint="Lifetime" />
          </StatGroup>

          <StatGroup title="Local business ads">
            <Stat label="Ads submitted" value={count(summary.adsSubmitted)} hint={periodNote} />
            <Stat label="Live / pending / rejected" value={`${summary.adsActive} / ${summary.adsPending} / ${summary.adsRejected}`} />
            <Stat label="Approved ad budget" value={inr(summary.approvedAdBudgetInr)} />
            <Stat label="Partner commission" value={inr(summary.adCommissionInr)} />
            <Stat label="Impressions" value={count(summary.impressions)} />
            <Stat label="Clicks" value={count(summary.clicks)} hint={ctr} />
          </StatGroup>

          {!isPartner && (
            <div style={styles.panel} className="mt-2">
              <div className="d-flex justify-content-between align-items-center px-3 py-2" style={{ borderBottom: "1px solid var(--new-border-color)" }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>
                  Partner breakdown <span className="text-muted fw-normal">({rows.length})</span>
                </span>
                <button className="btn btn-sm btn-light border" style={{ borderRadius: "var(--radius-sm)" }} onClick={exportCsv} disabled={!rows.length}>
                  Export CSV
                </button>
              </div>
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead>
                    <tr>
                      {["Partner", "Region", "Status", "Activated", "License", "Referrals", "Referral earnings", "Ads (live / total)", "Ad commission", "Impr. / clicks", "Ad credits"].map((h) => (
                        <th key={h} style={styles.th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="text-center text-muted py-4" style={{ fontSize: 13 }}>
                          No Digital Partners match these filters.
                        </td>
                      </tr>
                    ) : (
                      rows.map((r) => (
                        <tr key={r.userId}>
                          <td style={styles.td}>
                            <div className="fw-semibold">{r.fullName || "—"}</div>
                            <div className="text-muted" style={{ fontSize: 12 }}>{r.email}</div>
                          </td>
                          <td style={styles.td}>{[r.district, r.state].filter(Boolean).join(", ") || "—"}</td>
                          <td style={styles.td}><StatusBadge status={r.partnerStatus} /></td>
                          <td style={styles.td}>{date(r.activatedAt)}</td>
                          <td style={styles.td}>{inr(r.licenseFeePaid)}</td>
                          <td style={styles.td}>
                            {count(r.referrals.total)}
                            {r.referrals.flagged > 0 && (
                              <span className="text-danger ms-1" style={{ fontSize: 12 }}>({r.referrals.flagged} flagged)</span>
                            )}
                          </td>
                          <td style={styles.td}>{inr(r.referralEarningsInr)}</td>
                          <td style={styles.td}>{r.ads.active} / {r.ads.submitted}</td>
                          <td style={styles.td}>{inr(r.ads.commissionInr)}</td>
                          <td style={styles.td}>{count(r.ads.impressions)} / {count(r.ads.clicks)}</td>
                          <td style={styles.td}>{inr(r.adCreditsBalance)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
