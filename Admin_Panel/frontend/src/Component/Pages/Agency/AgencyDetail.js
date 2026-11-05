import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { useNavigate, useSearchParams } from "react-router-dom";
import { setToast } from "../../../util/toast";
import { warningForText } from "../../../util/Alert";
import FranchiseFormModal from "../PartnerNetwork/FranchiseFormModal";
import {
  PageHeader, StatCard, StatusBadge, EmptyRow, ReferralTable, CommissionStatus, COMMISSION_SOURCES, inr, fmtDate,
} from "../PartnerNetwork/networkUi";

// Super admin: one District Franchise with its partners, referrals and commissions.
export default function AgencyDetail() {
  const [params] = useSearchParams();
  const agencyId = params.get("agencyId");
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("partners");
  const [editing, setEditing] = useState(false);

  const [refs, setRefs] = useState({ referrals: [], total: 0 });
  const [refStage, setRefStage] = useState("");
  const [refPage, setRefPage] = useState(1);
  const [refLoading, setRefLoading] = useState(false);
  const [commissions, setCommissions] = useState([]);

  const load = useCallback(() => {
    if (!agencyId) return;
    setLoading(true);
    axios
      .get(`admin/agency/detail?agencyId=${agencyId}`)
      .then((res) => {
        setLoading(false);
        if (res.data.status) setData(res.data);
        else setToast("error", res.data.message);
      })
      .catch(() => {
        setLoading(false);
        setToast("error", "Couldn't load the franchise.");
      });
    axios
      .get(`admin/commission/getCommissions?agencyId=${agencyId}&limit=200`)
      .then((res) => res.data.status && setCommissions(res.data.commissions || []))
      .catch(() => {});
  }, [agencyId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (tab !== "referrals" || !agencyId) return;
    setRefLoading(true);
    axios
      .get(`admin/agency/referrals?agencyId=${agencyId}&stage=${refStage}&start=${refPage}&limit=20`)
      .then((res) => {
        setRefLoading(false);
        if (res.data.status) setRefs(res.data);
      })
      .catch(() => setRefLoading(false));
  }, [tab, agencyId, refStage, refPage]);

  const toggleStatus = () => {
    const a = data.agency;
    warningForText(a.isActive === false ? `Activate ${a.name} again?` : `Deactivate ${a.name}? Their login stops working immediately.`).then((r) => {
      if (!r.isConfirmed) return;
      axios.patch(`admin/agency/toggleStatus?agencyId=${agencyId}`).then((res) => {
        setToast(res.data.status ? "success" : "error", res.data.message);
        if (res.data.status) load();
      });
    });
  };

  const setPartnerStatus = (p) => {
    const next = p.partnerStatus === "SUSPENDED" ? "ACTIVE" : "SUSPENDED";
    warningForText(next === "SUSPENDED" ? `Suspend ${p.fullName}? Their partner panel login stops working.` : `Activate ${p.fullName} again?`).then((r) => {
      if (!r.isConfirmed) return;
      axios.patch(`admin/digitalPartner/status?userId=${p.userId}`, { status: next }).then((res) => {
        setToast(res.data.status ? "success" : "error", res.data.message);
        if (res.data.status) load();
      });
    });
  };

  const verify = async (c, decision) => {
    let note = "";
    if (decision === "REJECTED") {
      const r = await Swal.fire({
        title: "Reject this licence fee?",
        text: `The ${inr(c.commissionAmount)} commission is cancelled and the partner's ad credits from this ${inr(c.grossAmount)} fee are taken back.`,
        input: "text",
        inputPlaceholder: "Reason (optional)",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#dc2626",
        confirmButtonText: "Reject",
      });
      if (!r.isConfirmed) return;
      note = r.value || "";
    } else {
      const r = await warningForText(`Confirm Youpeak received the ${inr(c.grossAmount)} licence fee? The franchise's ${inr(c.commissionAmount)} commission becomes payable.`);
      if (!r.isConfirmed) return;
    }
    axios
      .patch("admin/commission/verify", { commissionId: c._id, decision, note })
      .then((res) => {
        setToast(res.data.status ? "success" : "error", res.data.message);
        if (res.data.status) load();
      })
      .catch(() => setToast("error", "Couldn't update the commission."));
  };

  const markPaid = (c) => {
    warningForText(`Mark ${inr(c.commissionAmount)} as paid to the franchise?`).then((r) => {
      if (!r.isConfirmed) return;
      axios.post("admin/commission/updatePayoutStatus", { commissionId: c._id, payoutStatus: "PAID" }).then((res) => {
        setToast(res.data.status ? "success" : "error", res.data.message);
        if (res.data.status) load();
      });
    });
  };

  if (!agencyId) return <div className="pn-page">No franchise selected.</div>;
  if (loading && !data) return <div className="pn-page pn-muted">Loading franchise…</div>;
  if (!data) return <div className="pn-page">Franchise not found. <button className="btn btn-link" onClick={() => navigate("/admin/agency")}>Back to list</button></div>;

  const { agency, summary, commissions: cs, partners } = data;
  const tabs = [
    ["partners", `Digital Partners (${partners.length})`],
    ["referrals", `Referrals (${summary.referrals.total})`],
    ["commissions", `Commissions (${commissions.length})`],
  ];

  return (
    <div className="pn-page">
      <PageHeader
        title={agency.name}
        subtitle={`${agency.district}, ${agency.state} · Login ${agency.loginEmail}${agency.mobileNumber ? " · " + agency.mobileNumber : ""} · Since ${fmtDate(agency.createdAt)}`}
      >
        <StatusBadge status={agency.isActive === false ? "INACTIVE" : "ACTIVE"} />
        <button className="btn btn-outline-secondary" onClick={() => navigate("/admin/agency")}>All franchises</button>
        <button className="btn btn-outline-secondary" onClick={() => setEditing(true)}>Edit / reset password</button>
        <button className={`btn ${agency.isActive === false ? "btn-success" : "btn-outline-warning"}`} onClick={toggleStatus}>
          {agency.isActive === false ? "Activate" : "Deactivate"}
        </button>
      </PageHeader>

      <div className="pn-stats">
        <StatCard tone="accent" label="Digital Partners" value={summary.totalPartners} hint={`${summary.activePartners} active · ${summary.suspendedPartners} suspended`} />
        <StatCard tone="info" label="Referrals" value={summary.referrals.total} hint={`${summary.referrals.completed} completed · ${summary.referrals.awaitingWatchTime} in progress`} />
        <StatCard label="Partner referral earnings" value={inr(summary.referralEarningsInr)} hint={`${inr(summary.pendingEarningsInr)} on hold`} />
        <StatCard tone="warning" label="Franchise commission" value={inr(cs.totalEarned)} hint={`${inr(cs.paid)} paid · ${inr(cs.awaitingVerification)} to verify`} />
        <StatCard label="Licence fees recorded" value={inr(summary.licenseFeesInr)} />
      </div>

      <ul className="nav nav-tabs mb-3">
        {tabs.map(([key, label]) => (
          <li className="nav-item" key={key}>
            <button className={`nav-link ${tab === key ? "active" : ""}`} onClick={() => setTab(key)}>{label}</button>
          </li>
        ))}
      </ul>

      {tab === "partners" && (
        <div className="pn-panel">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead>
                <tr>
                  <th>Partner</th>
                  <th>Referral code</th>
                  <th>Referrals</th>
                  <th>Earned</th>
                  <th>Licence fee</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {partners.length === 0 ? (
                  <EmptyRow colSpan={7}>This franchise hasn't added any Digital Partners yet.</EmptyRow>
                ) : (
                  partners.map((p) => (
                    <tr key={p.userId}>
                      <td>
                        <div className="fw-semibold">{p.fullName}</div>
                        <small className="pn-muted">{p.email}{p.mobileNumber ? ` · ${p.mobileNumber}` : ""}</small>
                      </td>
                      <td><code>{p.referralCode}</code></td>
                      <td>
                        <span className="fw-semibold">{p.referrals.completed}</span>
                        <small className="pn-muted"> completed / {p.referrals.total}</small>
                      </td>
                      <td>
                        {inr(p.earnings.referralInr)}
                        {p.earnings.pendingInr > 0 && <div><small className="pn-muted">{inr(p.earnings.pendingInr)} on hold</small></div>}
                      </td>
                      <td>{inr(p.licenseFeePaid)}</td>
                      <td><StatusBadge status={p.partnerStatus} /></td>
                      <td>
                        <div className="pn-actions">
                          <button className="btn btn-outline-success" onClick={() => navigate(`/admin/partnerDetail?userId=${p.userId}`)}>View</button>
                          <button className="btn btn-outline-warning" onClick={() => setPartnerStatus(p)}>
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
      )}

      {tab === "referrals" && (
        <div className="pn-panel">
          <div className="pn-panel-head">
            <h6>Referrals by this franchise's partners</h6>
            <div className="pn-filters">
              <select className="form-control" value={refStage} onChange={(e) => { setRefStage(e.target.value); setRefPage(1); }} aria-label="Filter by stage">
                <option value="">All stages</option>
                <option value="AWAITING_WATCH_TIME">Awaiting watch time</option>
                <option value="COMPLETED">Completed</option>
                <option value="EXPIRED">Window missed</option>
                <option value="FLAGGED">Flagged</option>
              </select>
            </div>
          </div>
          <ReferralTable referrals={refs.referrals} loading={refLoading} showContact />
          {refs.total > 20 && (
            <div className="d-flex justify-content-between align-items-center p-3">
              <small className="pn-muted">Page {refPage} of {Math.ceil(refs.total / 20)} · {refs.total} referrals</small>
              <div className="pn-actions">
                <button className="btn btn-outline-secondary" disabled={refPage <= 1} onClick={() => setRefPage((p) => p - 1)}>Previous</button>
                <button className="btn btn-outline-secondary" disabled={refPage >= Math.ceil(refs.total / 20)} onClick={() => setRefPage((p) => p + 1)}>Next</button>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "commissions" && (
        <div className="pn-panel">
          <div className="pn-panel-head">
            <h6>Commission ledger</h6>
            <small className="pn-muted">Licence fees entered by the franchise must be verified before they can be paid.</small>
          </div>
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Source</th>
                  <th>Gross</th>
                  <th>Rate</th>
                  <th>Commission</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {commissions.length === 0 ? (
                  <EmptyRow colSpan={7}>No commission records yet.</EmptyRow>
                ) : (
                  commissions.map((c) => (
                    <tr key={c._id}>
                      <td>{fmtDate(c.createdAt)}</td>
                      <td>
                        {COMMISSION_SOURCES[c.sourceType] || c.sourceType}
                        {c.verificationNote ? <div><small className="pn-muted">{c.verificationNote}</small></div> : null}
                      </td>
                      <td>{inr(c.grossAmount)}</td>
                      <td>{c.commissionRatePercentage}%</td>
                      <td className="fw-semibold">{inr(c.commissionAmount)}</td>
                      <td><CommissionStatus c={c} /></td>
                      <td>
                        <div className="pn-actions">
                          {c.verificationStatus === "UNVERIFIED" && (
                            <>
                              <button className="btn btn-outline-success" onClick={() => verify(c, "VERIFIED")}>Verify</button>
                              <button className="btn btn-outline-danger" onClick={() => verify(c, "REJECTED")}>Reject</button>
                            </>
                          )}
                          {c.verificationStatus !== "UNVERIFIED" && c.verificationStatus !== "REJECTED" && c.payoutStatus !== "PAID" && (
                            <button className="btn btn-outline-success" onClick={() => markPaid(c)}>Mark paid</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {editing && <FranchiseFormModal agency={agency} onClose={() => setEditing(false)} onSaved={load} />}
    </div>
  );
}
