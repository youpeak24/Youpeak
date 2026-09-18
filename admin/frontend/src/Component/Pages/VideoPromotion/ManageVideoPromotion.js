import React, { useEffect, useState } from "react";
import Title from "../../extra/Title";
import axios from "axios";
import { setToast } from "../../../util/toast";

const STATUS_OPTIONS = ["All", "pending_payment", "active", "expired", "rejected"];

export default function ManageVideoPromotion() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("All");
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");

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

  const handleApprove = (campaignId) => {
    axios
      .post("admin/videoPromotion/updateStatus", { campaignId, action: "approve" })
      .then((res) => {
        if (res.data.status) {
          setToast("success", res.data.message);
          fetchCampaigns();
        } else {
          setToast("error", res.data.message);
        }
      })
      .catch((err) => setToast("error", err.response?.data?.message || err.message));
  };

  const handleReject = (campaignId) => {
    axios
      .post("admin/videoPromotion/updateStatus", { campaignId, action: "reject", rejectionReason: rejectionReason || "Rejected by Admin" })
      .then((res) => {
        if (res.data.status) {
          setToast("success", res.data.message);
          setRejectingId(null);
          setRejectionReason("");
          fetchCampaigns();
        } else {
          setToast("error", res.data.message);
        }
      })
      .catch((err) => setToast("error", err.response?.data?.message || err.message));
  };

  const statusBadge = (status) => {
    const map = {
      pending_payment: "bg-warning",
      active: "bg-success",
      expired: "bg-secondary",
      rejected: "bg-danger",
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
                <th>Plan</th>
                <th>Price</th>
                <th>Status</th>
                <th>Started / Expires</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center py-4">Loading campaigns...</td>
                </tr>
              ) : campaigns.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-4">No promotion campaigns found.</td>
                </tr>
              ) : (
                campaigns.map((c, idx) => (
                  <tr key={c._id}>
                    <td>{idx + 1}</td>
                    <td>
                      <div className="fw-bold">{c.videoId?.title || "—"}</div>
                    </td>
                    <td>
                      <div>{c.userId?.fullName || "—"}</div>
                      <small className="text-muted">{c.userId?.email}</small>
                    </td>
                    <td>{c.planName}</td>
                    <td>₹ {Number(c.planPriceINR || 0).toFixed(0)}</td>
                    <td>{statusBadge(c.status)}</td>
                    <td>
                      <small>
                        {c.startedAt ? new Date(c.startedAt).toLocaleDateString() : "—"}
                        {" → "}
                        {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : "—"}
                      </small>
                    </td>
                    <td>
                      {c.status === "pending_payment" && (
                        <button className="btn btn-sm btn-outline-success me-2" onClick={() => handleApprove(c._id)}>
                          Approve
                        </button>
                      )}
                      {(c.status === "active" || c.status === "pending_payment") && (
                        rejectingId === c._id ? (
                          <div className="d-flex align-items-center gap-2 mt-2">
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              placeholder="Reason"
                              value={rejectionReason}
                              onChange={(e) => setRejectionReason(e.target.value)}
                              style={{ maxWidth: 160 }}
                            />
                            <button className="btn btn-sm btn-danger" onClick={() => handleReject(c._id)}>Confirm</button>
                            <button className="btn btn-sm btn-secondary" onClick={() => { setRejectingId(null); setRejectionReason(""); }}>Cancel</button>
                          </div>
                        ) : (
                          <button className="btn btn-sm btn-outline-danger" onClick={() => setRejectingId(c._id)}>
                            {c.status === "active" ? "Take Down" : "Reject"}
                          </button>
                        )
                      )}
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
