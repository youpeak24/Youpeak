import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { useNavigate, useSearchParams } from "react-router-dom";
import { setToast } from "../../../util/toast";
import { warningForText } from "../../../util/Alert";
import PartnerFormModal from "../PartnerNetwork/PartnerFormModal";
import ReferralShareCard from "../PartnerNetwork/ReferralShareCard";
import {
  PageHeader, StatCard, StatusBadge, EmptyRow, ReferralTable, getAdminRole, inr, fmtDate, fmtDateTime,
} from "../PartnerNetwork/networkUi";

const LEDGER_TYPES = {
  5.1: "Stage 1 / direct referral bonus",
  10: "Stage 2 / paid-pass bonus",
  13: "Tasker earnings commission",
};

// One Digital Partner — opened by the super admin (all partners) or by the
// partner's own District Franchise.
export default function PartnerDetail() {
  const [params] = useSearchParams();
  const userId = params.get("userId");
  const navigate = useNavigate();
  const isSuper = getAdminRole() === "SUPER_ADMIN";
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  const load = useCallback(() => {
    if (!userId) return;
    setLoading(true);
    const url = isSuper ? `admin/digitalPartner/detail?userId=${userId}` : `admin/franchisePortal/partners/detail?userId=${userId}`;
    axios
      .get(url)
      .then((res) => {
        setLoading(false);
        if (res.data.status) setData(res.data);
        else {
          setData(null);
          setToast("error", res.data.message);
        }
      })
      .catch(() => {
        setLoading(false);
        setToast("error", "Couldn't load the partner.");
      });
  }, [userId, isSuper]);

  useEffect(() => { load(); }, [load]);

  const back = () => navigate(isSuper ? "/admin/manageDigitalPartner" : "/admin/franchisePartners");

  const changeStatus = () => {
    const p = data.partner;
    const next = p.partnerStatus === "SUSPENDED" ? "ACTIVE" : "SUSPENDED";
    warningForText(next === "SUSPENDED" ? `Suspend ${p.fullName}? Their partner panel login stops working.` : `Activate ${p.fullName} again?`).then((r) => {
      if (!r.isConfirmed) return;
      const req = isSuper
        ? axios.patch(`admin/digitalPartner/status?userId=${userId}`, { status: next })
        : axios.patch(`admin/franchisePortal/partners/status?userId=${userId}`, { status: next });
      req.then((res) => {
        setToast(res.data.status ? "success" : "error", res.data.message);
        if (res.data.status) load();
      });
    });
  };

  const remove = () => {
    warningForText(`Remove ${data.partner.fullName} from your Digital Partners? Their app account, wallet and referral history stay.`).then((r) => {
      if (!r.isConfirmed) return;
      axios.delete(`admin/franchisePortal/partners/remove?userId=${userId}`).then((res) => {
        setToast(res.data.status ? "success" : "error", res.data.message);
        if (res.data.status) navigate("/admin/franchisePartners");
      });
    });
  };

  const resetPortalPassword = () => {
    warningForText("Generate a new partner panel password? The old one stops working.").then((r) => {
      if (!r.isConfirmed) return;
      axios.post("admin/digitalPartner/regeneratePassword", { userId }).then((res) => {
        if (!res.data.status) return setToast("error", res.data.message);
        Swal.fire({
          title: "New panel password",
          html: `Email: <b>${res.data.portalCredentials.email}</b><br/>Password: <b>${res.data.portalCredentials.password}</b><br/><small>Share it with the partner now — it isn't shown again.</small>`,
          icon: "success",
          confirmButtonColor: "#16a34a",
        });
      });
    });
  };

  const moveFranchise = async () => {
    const res = await axios.get("admin/agency/getAgencies?start=1&limit=100").catch(() => null);
    const agencies = (res?.data?.agencies || []).filter((a) => a.isActive !== false);
    const options = { "": "— No franchise (unassigned) —" };
    agencies.forEach((a) => { options[a._id] = `${a.name} (${a.district})`; });
    const r = await Swal.fire({
      title: "Move to District Franchise",
      input: "select",
      inputOptions: options,
      inputValue: data.partner.agencyId || "",
      showCancelButton: true,
      confirmButtonColor: "#16a34a",
      confirmButtonText: "Move",
    });
    if (!r.isConfirmed) return;
    axios.patch(`admin/digitalPartner/assignAgency?userId=${userId}`, { agencyId: r.value || null }).then((resp) => {
      setToast(resp.data.status ? "success" : "error", resp.data.message);
      if (resp.data.status) load();
    });
  };

  if (!userId) return <div className="pn-page">No partner selected.</div>;
  if (loading && !data) return <div className="pn-page pn-muted">Loading partner…</div>;
  if (!data) {
    return (
      <div className="pn-page">
        Partner not found. <button className="btn btn-link" onClick={back}>Back</button>
      </div>
    );
  }

  const p = data.partner;
  const r = p.referrals;

  return (
    <div className="pn-page">
      <PageHeader
        title={p.fullName || "Digital Partner"}
        subtitle={`Digital Partner${p.agencyName ? ` · ${p.agencyName}` : " · not linked to a franchise"} · since ${fmtDate(p.partnerSince)}`}
      >
        <StatusBadge status={data.isDigitalPartner ? p.partnerStatus : "INACTIVE"} />
        <button className="btn btn-outline-secondary" onClick={back}>Back</button>
        {data.isDigitalPartner && !isSuper && <button className="btn btn-outline-secondary" onClick={() => setEditing(true)}>Edit / reset password</button>}
        {data.isDigitalPartner && isSuper && <button className="btn btn-outline-secondary" onClick={resetPortalPassword}>Reset panel password</button>}
        {data.isDigitalPartner && isSuper && <button className="btn btn-outline-secondary" onClick={moveFranchise}>Move franchise</button>}
        {data.isDigitalPartner && (
          <button className="btn btn-outline-warning" onClick={changeStatus}>{p.partnerStatus === "SUSPENDED" ? "Activate" : "Suspend"}</button>
        )}
        {data.isDigitalPartner && !isSuper && <button className="btn btn-outline-danger" onClick={remove}>Remove</button>}
      </PageHeader>

      {!data.isDigitalPartner && <div className="alert alert-secondary">This person is no longer a Digital Partner. Their history is shown below.</div>}

      <div className="pn-stats">
        <StatCard tone="info" label="Referrals" value={r.total} hint={`${r.completed} completed · ${r.awaitingWatchTime} in progress`} />
        <StatCard tone="accent" label="Referral earnings" value={inr(p.earnings.referralInr)} hint="Paid to wallet" />
        <StatCard tone="warning" label="On hold" value={inr(p.earnings.pendingInr)} hint="Released after the hold period" />
        <StatCard label="Wallet balance" value={inr(p.earnings.walletInr)} hint={`${p.earnings.walletCoins.toLocaleString("en-IN")} coins`} />
        <StatCard tone="danger" label="Flagged / missed" value={r.flagged + r.expired} hint={`${r.flagged} flagged · ${r.expired} missed`} />
      </div>

      <div className="pn-two">
          <div className="pn-panel">
            <div className="pn-panel-head"><h6>Profile</h6></div>
            <div className="pn-panel-body">
              <dl className="pn-kv mb-0">
                <dt>Referral code</dt><dd><code>{p.referralCode || "—"}</code></dd>
                <dt>Email</dt><dd>{p.email || "—"}</dd>
                <dt>Mobile</dt><dd>{p.mobileNumber || "—"}</dd>
                <dt>User ID</dt><dd>{p.uniqueId || "—"}</dd>
                <dt>District</dt><dd>{[p.district, p.state].filter(Boolean).join(", ") || "—"}</dd>
                <dt>Franchise</dt><dd>{p.agencyName || "Not linked"}</dd>
                <dt>Panel login</dt><dd>{p.portalEmail ? `${p.portalEmail}${p.portalActive ? "" : " (disabled)"}` : "None"}</dd>
                <dt>App account</dt><dd>{p.createdByFranchise ? "Created by the franchise" : "Their own (linked)"}{p.appAccountBlocked ? " · blocked" : ""}</dd>
                <dt>Licence fee</dt><dd>{inr(p.licenseFeePaid)}</dd>
                <dt>Ad credits</dt><dd>{inr(p.adCreditsBalance)}</dd>
              </dl>
            </div>
          </div>
          <div className="pn-panel">
            <div className="pn-panel-head"><h6>Reward ledger</h6><small className="pn-muted">Referral coins credited to the wallet</small></div>
            <div className="table-responsive" style={{ maxHeight: 340 }}>
              <table className="table align-middle mb-0">
                <thead><tr><th>Date</th><th>Reward</th><th>Amount</th></tr></thead>
                <tbody>
                  {data.rewardLedger.length === 0 ? (
                    <EmptyRow colSpan={3}>No referral rewards paid yet.</EmptyRow>
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

      {data.isDigitalPartner && p.referralCode && (
        <div className="pn-panel">
          <div className="pn-panel-head"><h6>Referral link &amp; QR</h6><small className="pn-muted">Share or print for the partner</small></div>
          <div className="pn-panel-body"><ReferralShareCard code={p.referralCode} name={p.fullName} /></div>
        </div>
      )}

      <div className="pn-panel">
        <div className="pn-panel-head">
          <h6>Referrals ({data.referralTotal})</h6>
          {data.referralTotal > data.referrals.length && <small className="pn-muted">Showing the latest {data.referrals.length}</small>}
        </div>
        <ReferralTable referrals={data.referrals} showPartner={false} showContact={isSuper} emptyText="No referrals yet." />
      </div>

      {editing && <PartnerFormModal partner={p} onClose={() => setEditing(false)} onSaved={load} />}
    </div>
  );
}
