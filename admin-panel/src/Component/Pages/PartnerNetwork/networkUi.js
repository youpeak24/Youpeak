// Shared UI pieces for the District Franchise → Digital Partner pages.
import React from "react";

export const getAdmin = () => {
  try {
    return JSON.parse(sessionStorage.getItem("admin") || "{}") || {};
  } catch {
    return {};
  }
};

// Tokens without a role are treated as super admin by the backend too.
export const getAdminRole = () => getAdmin().role || "SUPER_ADMIN";

export const ROLE_HOME = {
  SUPER_ADMIN: "/admin/mainDashboard",
  AGENCY_ADMIN: "/admin/agencyDashboard",
  DIGITAL_PARTNER_ADMIN: "/admin/partnerDashboard",
};

export const roleHome = () => ROLE_HOME[getAdminRole()] || ROLE_HOME.SUPER_ADMIN;

export const inr = (v) =>
  `₹${Number(v || 0).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

export const fmtDate = (v) => (v ? new Date(v).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—");

export const fmtDateTime = (v) =>
  v ? new Date(v).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";

export const STAGES = {
  AWAITING_WATCH_TIME: { label: "Joined · awaiting watch time", cls: "pn-stage-wait" },
  COMPLETED: { label: "Completed", cls: "pn-stage-done" },
  EXPIRED: { label: "Watch-time window missed", cls: "pn-stage-muted" },
  FLAGGED: { label: "Flagged", cls: "pn-stage-bad" },
  PENDING: { label: "Pending", cls: "pn-stage-muted" },
};

export function StageBadge({ stage, reason }) {
  const s = STAGES[stage] || STAGES.PENDING;
  return (
    <span className={`pn-stage ${s.cls}`} title={reason || ""}>
      {s.label}
      {stage === "FLAGGED" && reason ? ` · ${reason.replace(/_/g, " ").toLowerCase()}` : ""}
    </span>
  );
}

export function StatusBadge({ status }) {
  const map = {
    ACTIVE: ["pn-stage-done", "Active"],
    SUSPENDED: ["pn-stage-bad", "Suspended"],
    INACTIVE: ["pn-stage-muted", "Inactive"],
  };
  const [cls, label] = map[status] || ["pn-stage-muted", status || "—"];
  return <span className={`pn-stage ${cls}`}>{label}</span>;
}

export function StatCard({ label, value, hint, tone }) {
  return (
    <div className={`pn-stat ${tone ? `pn-stat-${tone}` : ""}`}>
      <div className="pn-stat-label">{label}</div>
      <div className="pn-stat-value">{value}</div>
      {hint ? <div className="pn-stat-hint">{hint}</div> : null}
    </div>
  );
}

export function PageHeader({ title, subtitle, children }) {
  return (
    <div className="pn-header">
      <div>
        <h4 className="pn-title">{title}</h4>
        {subtitle ? <div className="pn-subtitle">{subtitle}</div> : null}
      </div>
      {children ? <div className="pn-header-actions">{children}</div> : null}
    </div>
  );
}

export function EmptyRow({ colSpan, children }) {
  return (
    <tr>
      <td colSpan={colSpan} className="text-center py-4 pn-muted">
        {children}
      </td>
    </tr>
  );
}

// Stage 1 is credited when the code is applied, stage 2 after the watch-time
// milestone; each is held before it reaches the wallet.
export function ReferralProgress({ r }) {
  const step = (done, released, label, heldUntil) => (
    <div className={`pn-step ${done ? (released ? "pn-step-paid" : "pn-step-held") : ""}`}>
      <span className="pn-step-dot" />
      <span>
        {label}
        <small>
          {done ? (released ? " · paid" : ` · on hold${heldUntil ? " till " + fmtDateTime(heldUntil) : ""}`) : ""}
        </small>
      </span>
    </div>
  );
  return (
    <div className="pn-steps">
      {step(r.stage1CompletedAt || r.stage1RewardCoins > 0, r.stage1Released, "Stage 1", r.stage1HeldUntil)}
      {step(!!r.stage2CompletedAt, r.stage2Released, "Stage 2", r.stage2HeldUntil)}
    </div>
  );
}

export function ReferralTable({ referrals, loading, showPartner = true, showContact = false, emptyText = "No referrals yet." }) {
  const cols = 5 + (showPartner ? 1 : 0);
  return (
    <div className="table-responsive">
      <table className="table table-hover align-middle mb-0">
        <thead>
          <tr>
            <th>Referred user</th>
            {showPartner && <th>Digital Partner</th>}
            <th>Joined</th>
            <th>Workflow</th>
            <th>Rewards</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <EmptyRow colSpan={cols}>Loading referrals…</EmptyRow>
          ) : !referrals || referrals.length === 0 ? (
            <EmptyRow colSpan={cols}>{emptyText}</EmptyRow>
          ) : (
            referrals.map((r) => (
              <tr key={r._id}>
                <td>
                  <div className="fw-semibold">{r.referredUserName}</div>
                  <small className="pn-muted">
                    {r.referredUserUniqueId ? `ID ${r.referredUserUniqueId}` : ""}
                    {showContact && r.referredUserEmail ? ` · ${r.referredUserEmail}` : ""}
                  </small>
                </td>
                {showPartner && <td>{r.partnerName}</td>}
                <td>{fmtDate(r.createdAt)}</td>
                <td>
                  <ReferralProgress r={r} />
                  {r.stage === "AWAITING_WATCH_TIME" && r.stage2DeadlineAt ? (
                    <small className="pn-muted d-block">Watch-time deadline {fmtDate(r.stage2DeadlineAt)}</small>
                  ) : null}
                </td>
                <td>
                  <div className="fw-semibold">{inr(r.releasedInr)}</div>
                  <small className="pn-muted">paid to wallet</small>
                </td>
                <td>
                  <StageBadge stage={r.stage} reason={r.flaggedReason} />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export function Modal({ title, onClose, children, footer, size = "" }) {
  return (
    <div className="modal show d-block pn-modal" role="dialog" aria-modal="true" style={{ backgroundColor: "rgba(0,0,0,0.45)" }}>
      <div className={`modal-dialog modal-dialog-centered modal-dialog-scrollable ${size}`}>
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{title}</h5>
            <button type="button" className="btn-close" aria-label="Close" onClick={onClose}></button>
          </div>
          <div className="modal-body">{children}</div>
          {footer ? <div className="modal-footer">{footer}</div> : null}
        </div>
      </div>
    </div>
  );
}

export const COMMISSION_SOURCES = {
  DIGITAL_PARTNER_LICENSE: "Digital Partner licence",
  VIDEO_UNLOCK: "Video unlocks",
  VIP_CREATOR_ONBOARDING: "VIP creator onboarding",
  TASKER_ONBOARDING: "Tasker onboarding",
  LOCAL_BUSINESS_ADS: "Local business ads",
};

export function CommissionStatus({ c, forFranchise = false }) {
  if (c.verificationStatus === "REJECTED") return <span className="pn-stage pn-stage-bad">Rejected</span>;
  if (c.verificationStatus === "UNVERIFIED") {
    return <span className="pn-stage pn-stage-wait">{forFranchise ? "Awaiting admin verification" : "Awaiting your verification"}</span>;
  }
  if (c.payoutStatus === "PAID") return <span className="pn-stage pn-stage-done">Paid {fmtDate(c.paidAt)}</span>;
  return <span className="pn-stage pn-stage-muted">Payout pending</span>;
}

// The live reward rules from the backend (partnerNetwork.service referralRules).
export function RewardFlow({ rules }) {
  if (!rules) return null;
  return (
    <div className="pn-flow">
      <div className="pn-flow-step">
        <b>1 · Share the code</b>
        <span>A new user signs up in the Youpeak app and enters the partner's referral code (new accounts only).</span>
      </div>
      <div className="pn-flow-step">
        <b>2 · Stage 1 — {inr(rules.stage1Inr)}</b>
        <span>Credited when the code is applied, held {rules.stage1HoldHours}h, then paid to the partner's wallet.</span>
      </div>
      <div className="pn-flow-step">
        <b>3 · Stage 2 — {inr(rules.stage2Inr)}</b>
        <span>When the user watches {rules.stage2WatchMinutes} minutes within {rules.stage2WindowDays} days. Held {rules.stage2HoldHours}h, then paid.</span>
      </div>
      <div className="pn-flow-step">
        <b>Bonuses</b>
        <span>
          {rules.paidTierPercentage}% of any paid pass the user buys, {rules.taskerEarningsPercentage}% of their tasker earnings
          {rules.freeTierBonusInr > 0 ? `, and ${inr(rules.freeTierBonusInr)} instantly while the partner is on the free tier` : ""}.
        </span>
      </div>
      <div className="pn-flow-step">
        <b>Fraud checks</b>
        <span>Same device, VPN, or too many sign-ups from one network are flagged and earn nothing. Limit {rules.maxReferralsPerDay} referrals a day.</span>
      </div>
    </div>
  );
}

export const generatePassword = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const arr = new Uint32Array(10);
  window.crypto.getRandomValues(arr);
  return Array.from(arr, (n) => chars[n % chars.length]).join("") + "#7";
};
