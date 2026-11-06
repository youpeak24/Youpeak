import React, { useEffect, useState } from "react";
import Title from "../../extra/Title";
import axios from "axios";
import { setToast } from "../../../util/toast";

// Campaigns start on verified payment; these are the states the server reports.
const STATUS_OPTIONS = ["All", "active", "scheduled", "paused", "completed", "expired", "rejected"];

const fmt = (n) => (n == null ? "—" : Number(n).toLocaleString("en-IN"));

export default function ManageVideoPromotion() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("All");
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [historyFor, setHistoryFor] = useState(null);
  const [history, setHistory] = useState([]);

  const fetchCampaigns = () => {
    setLoading(true);
    axios
      .get(`admin/videoPromotion/index?status=${encodeURIComponent(statusFilter)}`)
      .then((res) => {
        setLoading(false);
        if (res.data.status) setCampaigns(res.data.campaigns || []);
        else setToast("error", res.data.message);
      })
      .catch((err) => {
        setLoading(false);
        setToast("error", err.response?.data?.message || err.message);
      });
  };

  useEffect(() => {
    fetchCampaigns();
  }, [statusFilter]);

  const act = (campaignId, action, extra = {}) =>
    axios
      .post("admin/videoPromotion/updateStatus", { campaignId, action, ...extra })
      .then((res) => {
        if (res.data.status) {
          setToast("success", res.data.message);
          if (res.data.note) setToast("info", res.data.note);
          setRejectingId(null);
          setRejectionReason("");
          fetchCampaigns();
        } else {
          setToast("error", res.data.message);
        }
      })
      .catch((err) => setToast("error", err.response?.data?.message || err.message));

  const handleReject = (campaignId) => {
    if (!rejectionReason.trim()) return setToast("error", "Enter a reason.");
    act(campaignId, "reject", { rejectionReason: rejectionReason.trim() });
  };

  const showHistory = (campaignId) => {
    if (historyFor === campaignId) return setHistoryFor(null);
    setHistoryFor(campaignId);
    setHistory([]);
    axios
      .get(`admin/videoPromotion/events?campaignId=${encodeURIComponent(campaignId)}`)
      .then((res) => setHistory(res.data.events || []))
      .catch((err) => setToast("error", err.response?.data?.message || err.message));
  };

  const statusBadge = (status) => {
    const map = {
      active: "bg-success",
      scheduled: "bg-info",
      paused: "bg-warning",
      completed: "bg-primary",
      expired: "bg-secondary",
      rejected: "bg-danger",
      pending_payment: "bg-warning",
    };
    return <span className={`badge ${map[status] || "bg-secondary"}`}>{status}</span>;
  };

  return (
    <div className="mainPage p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <Title name="Video Promotion Campaigns" />
        <select className="form-select" style={{ maxWidth: 220 }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s === "All" ? "All Statuses" : s}</option>
          ))}
        </select>
      </div>

      <div className="card shadow-sm border-0 p-3">
        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead>
              <tr>
                <th>No.</th>
                <th>Video</th>
                <th>Creator</th>
                <th>Plan (as bought)</th>
                <th>Price</th>
                <th>Status</th>
                <th>Impressions (delivered / est.)</th>
                <th>Starts / Ends</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" className="text-center py-4">Loading campaigns...</td>
                </tr>
              ) : campaigns.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-4">No promotion campaigns found.</td>
                </tr>
              ) : (
                campaigns.map((c, idx) => {
                  const st = c.effectiveStatus || c.status;
                  const paid = c.paymentStatus === "paid" || (c.status === "active" && c.paymentGatewayRef);
                  return (
                    <React.Fragment key={c._id}>
                      <tr>
                        <td>{idx + 1}</td>
                        <td>
                          <div className="fw-bold">{c.videoId?.title || "—"}</div>
                        </td>
                        <td>
                          <div>{c.userId?.fullName || "—"}</div>
                          <small className="text-muted">{c.userId?.email}</small>
                        </td>
                        <td>
                          {c.plan?.name || c.planName}
                          <div><small className="text-muted">{c.plan?.durationDays ?? c.planDurationDays} day(s) · {c.plan?.targeting || "Global"}</small></div>
                        </td>
                        <td>₹ {Number(c.planPriceINR || 0).toFixed(0)}{paid ? "" : <div><small className="text-danger">not paid</small></div>}</td>
                        <td>
                          {statusBadge(st)}
                          {c.approvedByAdmin && <div><small className="text-muted">reviewed</small></div>}
                          {c.rejectionReason && <div><small className="text-muted">{c.rejectionReason}</small></div>}
                        </td>
                        <td>
                          {fmt(c.impressionsDelivered)} / {fmt(c.impressionsTargetMin)}–{fmt(c.impressionsTargetMax)}
                        </td>
                        <td>
                          <small>
                            {c.startedAt ? new Date(c.startedAt).toLocaleString() : "—"}
                            {" → "}
                            {c.expiresAt ? new Date(c.expiresAt).toLocaleString() : "—"}
                          </small>
                        </td>
                        <td style={{ minWidth: 200 }}>
                          {paid && !c.approvedByAdmin && (st === "active" || st === "scheduled") && (
                            <button className="btn btn-sm btn-outline-success me-2 mb-1" onClick={() => act(c._id, "review")}>Mark reviewed</button>
                          )}
                          {(st === "active" || st === "scheduled") && (
                            <button className="btn btn-sm btn-outline-warning me-2 mb-1" onClick={() => act(c._id, "pause")}>Pause</button>
                          )}
                          {st === "paused" && (
                            <button className="btn btn-sm btn-outline-success me-2 mb-1" onClick={() => act(c._id, "resume")}>Resume</button>
                          )}
                          {(st === "active" || st === "scheduled" || st === "paused" || st === "pending_payment") && (
                            rejectingId === c._id ? (
                              <div className="d-flex align-items-center gap-2 mt-2">
                                <input
                                  type="text"
                                  className="form-control form-control-sm"
                                  placeholder="Reason (shown to the creator)"
                                  value={rejectionReason}
                                  onChange={(e) => setRejectionReason(e.target.value)}
                                  style={{ maxWidth: 180 }}
                                />
                                <button className="btn btn-sm btn-danger" onClick={() => handleReject(c._id)}>Confirm</button>
                                <button className="btn btn-sm btn-secondary" onClick={() => { setRejectingId(null); setRejectionReason(""); }}>Cancel</button>
                              </div>
                            ) : (
                              <button className="btn btn-sm btn-outline-danger me-2 mb-1" onClick={() => setRejectingId(c._id)}>
                                {st === "pending_payment" ? "Reject" : "Take Down"}
                              </button>
                            )
                          )}
                          <button className="btn btn-sm btn-link p-0" onClick={() => showHistory(c._id)}>
                            {historyFor === c._id ? "Hide history" : "History"}
                          </button>
                        </td>
                      </tr>
                      {historyFor === c._id && (
                        <tr>
                          <td colSpan="9" className="bg-light">
                            {history.length === 0 ? (
                              <small className="text-muted">No recorded events.</small>
                            ) : (
                              <ul className="mb-0 small">
                                {history.map((e) => (
                                  <li key={e._id || e.id}>
                                    {new Date(e.at).toLocaleString()} — {e.type} by {e.by}
                                    {e.reason ? ` (${e.reason})` : ""}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <small className="text-muted">
          Campaigns start automatically once payment is verified. Pausing adds the paused time back on resume. Taking down a paid
          campaign does not refund it — refunds are handled manually.
        </small>
      </div>
    </div>
  );
}
