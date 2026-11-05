import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { setToast } from "../../../util/toast";
import { warningForText } from "../../../util/Alert";
import { PageHeader, StatCard, StatusBadge, EmptyRow, inr, fmtDate } from "../PartnerNetwork/networkUi";

// Super admin: every Digital Partner across all District Franchises.
// Partners are created by their franchise, never here.
export default function ManageDigitalPartner() {
  const navigate = useNavigate();
  const [partners, setPartners] = useState([]);
  const [summary, setSummary] = useState(null);
  const [agencies, setAgencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [agencyId, setAgencyId] = useState("");
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    axios
      .get("admin/agency/getAgencies?start=1&limit=100")
      .then((res) => res.data.status && setAgencies(res.data.agencies || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setQuery(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(() => {
    setLoading(true);
    axios
      .get(`admin/digitalPartner/list?agencyId=${agencyId}&status=${status}&search=${encodeURIComponent(query)}`)
      .then((res) => {
        setLoading(false);
        if (res.data.status) {
          setPartners(res.data.partners || []);
          setSummary(res.data.summary);
        } else {
          setToast("error", res.data.message);
        }
      })
      .catch(() => {
        setLoading(false);
        setToast("error", "Couldn't load Digital Partners.");
      });
  }, [agencyId, status, query]);

  useEffect(() => { load(); }, [load]);

  const changeStatus = (p) => {
    const next = p.partnerStatus === "SUSPENDED" ? "ACTIVE" : "SUSPENDED";
    warningForText(next === "SUSPENDED" ? `Suspend ${p.fullName}? Their partner panel login stops working.` : `Activate ${p.fullName} again?`).then((r) => {
      if (!r.isConfirmed) return;
      axios
        .patch(`admin/digitalPartner/status?userId=${p.userId}`, { status: next })
        .then((res) => {
          setToast(res.data.status ? "success" : "error", res.data.message);
          if (res.data.status) load();
        })
        .catch(() => setToast("error", "Couldn't change the status."));
    });
  };

  return (
    <div className="pn-page">
      <PageHeader
        title="Digital Partners"
        subtitle="All partners across every District Franchise. Partners are added by their franchise from the franchise panel."
      />

      {summary && (
        <div className="pn-stats">
          <StatCard tone="accent" label="Digital Partners" value={summary.totalPartners} hint={`${summary.activePartners} active · ${summary.suspendedPartners} suspended`} />
          <StatCard tone="info" label="Referrals" value={summary.referrals.total} hint={`${summary.referrals.completed} completed · ${summary.referrals.flagged} flagged`} />
          <StatCard label="Partner earnings" value={inr(summary.referralEarningsInr)} hint={`${inr(summary.pendingEarningsInr)} on hold`} />
          <StatCard tone="warning" label="Licence fees recorded" value={inr(summary.licenseFeesInr)} />
        </div>
      )}

      <div className="pn-panel">
        <div className="pn-panel-head">
          <h6>Partners</h6>
          <div className="pn-filters">
            <input className="form-control" placeholder="Search name, email, code" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search partners" />
            <select className="form-control" value={agencyId} onChange={(e) => setAgencyId(e.target.value)} aria-label="Filter by franchise">
              <option value="">All franchises</option>
              <option value="unassigned">Not linked to a franchise</option>
              {agencies.map((a) => <option key={a._id} value={a._id}>{a.name} ({a.district})</option>)}
            </select>
            <select className="form-control" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
              <option value="">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>
        </div>
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead>
              <tr>
                <th>Partner</th>
                <th>District Franchise</th>
                <th>Referrals</th>
                <th>Earned</th>
                <th>Licence fee</th>
                <th>Since</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <EmptyRow colSpan={8}>Loading partners…</EmptyRow>
              ) : partners.length === 0 ? (
                <EmptyRow colSpan={8}>{query || agencyId || status ? "No partner matches your filters." : "No Digital Partners yet. Franchises add them from their panel."}</EmptyRow>
              ) : (
                partners.map((p) => (
                  <tr key={p.userId}>
                    <td>
                      <div className="fw-semibold">{p.fullName}</div>
                      <small className="pn-muted">{p.email} · <code>{p.referralCode}</code></small>
                    </td>
                    <td>
                      {p.agencyName ? (
                        <button className="btn btn-link p-0 text-start" onClick={() => navigate(`/admin/agencyDetail?agencyId=${p.agencyId}`)}>{p.agencyName}</button>
                      ) : (
                        <span className="pn-stage pn-stage-wait">Not linked</span>
                      )}
                    </td>
                    <td>
                      <span className="fw-semibold">{p.referrals.completed}</span>
                      <small className="pn-muted"> completed / {p.referrals.total}</small>
                    </td>
                    <td>
                      {inr(p.earnings.referralInr)}
                      {p.earnings.pendingInr > 0 && <div><small className="pn-muted">{inr(p.earnings.pendingInr)} on hold</small></div>}
                    </td>
                    <td>{inr(p.licenseFeePaid)}</td>
                    <td>{fmtDate(p.partnerSince)}</td>
                    <td><StatusBadge status={p.partnerStatus} /></td>
                    <td>
                      <div className="pn-actions">
                        <button className="btn btn-outline-success" onClick={() => navigate(`/admin/partnerDetail?userId=${p.userId}`)}>View</button>
                        <button className="btn btn-outline-warning" onClick={() => changeStatus(p)}>
                          {p.partnerStatus === "SUSPENDED" ? "Activate" : "Suspend"}
                        </button>
                      </div>
                    </td>
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
