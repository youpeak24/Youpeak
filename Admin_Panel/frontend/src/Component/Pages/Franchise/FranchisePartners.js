import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { setToast } from "../../../util/toast";
import { warningForText } from "../../../util/Alert";
import PartnerFormModal from "../PartnerNetwork/PartnerFormModal";
import { PageHeader, StatCard, StatusBadge, EmptyRow, inr, fmtDate } from "../PartnerNetwork/networkUi";

// District Franchise: create / edit / suspend / remove its own Digital Partners.
export default function FranchisePartners() {
  const navigate = useNavigate();
  const [partners, setPartners] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [modal, setModal] = useState(null); // null | "new" | partner

  const load = useCallback(() => {
    setLoading(true);
    axios
      .get("admin/franchisePortal/partners")
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
        setToast("error", "Couldn't load your Digital Partners.");
      });
  }, []);

  useEffect(() => { load(); }, [load]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return partners.filter(
      (p) =>
        (!status || p.partnerStatus === status) &&
        (!q || [p.fullName, p.email, p.mobileNumber, p.referralCode].some((v) => String(v || "").toLowerCase().includes(q)))
    );
  }, [partners, search, status]);

  const changeStatus = (p) => {
    const next = p.partnerStatus === "SUSPENDED" ? "ACTIVE" : "SUSPENDED";
    const text = next === "SUSPENDED"
      ? `Suspend ${p.fullName}? They can't log in to the partner panel until you activate them again.`
      : `Activate ${p.fullName} again?`;
    warningForText(text).then((r) => {
      if (!r.isConfirmed) return;
      axios
        .patch(`admin/franchisePortal/partners/status?userId=${p.userId}`, { status: next })
        .then((res) => {
          setToast(res.data.status ? "success" : "error", res.data.message);
          if (res.data.status) load();
        })
        .catch(() => setToast("error", "Couldn't change the status."));
    });
  };

  const remove = (p) => {
    warningForText(`Remove ${p.fullName} from your Digital Partners? Their partner panel login is deleted. Their Youpeak app account, wallet and referral history stay.`).then((r) => {
      if (!r.isConfirmed) return;
      axios
        .delete(`admin/franchisePortal/partners/remove?userId=${p.userId}`)
        .then((res) => {
          setToast(res.data.status ? "success" : "error", res.data.message);
          if (res.data.status) load();
        })
        .catch(() => setToast("error", "Couldn't remove the partner."));
    });
  };

  return (
    <div className="pn-page">
      <PageHeader title="Digital Partners" subtitle="Partners you add can refer new users with their referral code and earn referral rewards.">
        <button className="btn btn-success" onClick={() => setModal("new")}>+ Add Digital Partner</button>
      </PageHeader>

      {summary && (
        <div className="pn-stats">
          <StatCard tone="accent" label="Digital Partners" value={summary.totalPartners} hint={`${summary.activePartners} active · ${summary.suspendedPartners} suspended`} />
          <StatCard tone="info" label="Referrals" value={summary.referrals.total} hint={`${summary.referrals.completed} completed`} />
          <StatCard label="Partner earnings" value={inr(summary.referralEarningsInr)} hint={`${inr(summary.pendingEarningsInr)} on hold`} />
          <StatCard label="Licence fees recorded" value={inr(summary.licenseFeesInr)} />
        </div>
      )}

      <div className="pn-panel">
        <div className="pn-panel-head">
          <h6>Your partners</h6>
          <div className="pn-filters">
            <input className="form-control" placeholder="Search name, email, code" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search partners" />
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
                <th>Referral code</th>
                <th>Referrals</th>
                <th>Earned</th>
                <th>Added</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <EmptyRow colSpan={7}>Loading partners…</EmptyRow>
              ) : visible.length === 0 ? (
                <EmptyRow colSpan={7}>
                  {partners.length === 0 ? "No Digital Partners yet. Add your first partner." : "No partner matches your filters."}
                </EmptyRow>
              ) : (
                visible.map((p) => (
                  <tr key={p.userId}>
                    <td>
                      <div className="fw-semibold">{p.fullName}</div>
                      <small className="pn-muted">{p.email}{p.mobileNumber ? ` · ${p.mobileNumber}` : ""}</small>
                    </td>
                    <td><code>{p.referralCode || "—"}</code></td>
                    <td>
                      <span className="fw-semibold">{p.referrals.completed}</span>
                      <small className="pn-muted"> completed / {p.referrals.total}</small>
                      {p.referrals.flagged > 0 && <div><small className="text-danger">{p.referrals.flagged} flagged</small></div>}
                    </td>
                    <td>
                      {inr(p.earnings.referralInr)}
                      {p.earnings.pendingInr > 0 && <div><small className="pn-muted">{inr(p.earnings.pendingInr)} on hold</small></div>}
                    </td>
                    <td>{fmtDate(p.partnerSince)}</td>
                    <td><StatusBadge status={p.partnerStatus} /></td>
                    <td>
                      <div className="pn-actions">
                        <button className="btn btn-outline-success" onClick={() => navigate(`/admin/partnerDetail?userId=${p.userId}`)}>View</button>
                        <button className="btn btn-outline-secondary" onClick={() => setModal(p)}>Edit</button>
                        <button className="btn btn-outline-warning" onClick={() => changeStatus(p)}>
                          {p.partnerStatus === "SUSPENDED" ? "Activate" : "Suspend"}
                        </button>
                        <button className="btn btn-outline-danger" onClick={() => remove(p)}>Remove</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal && <PartnerFormModal partner={modal === "new" ? null : modal} onClose={() => setModal(null)} onSaved={load} />}
    </div>
  );
}
