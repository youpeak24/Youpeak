import React, { useEffect, useState } from "react";
import Title from "../../extra/Title";
import axios from "axios";
import { setToast } from "../../../util/toast";

export default function PartnerDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = () => {
    axios
      .get("admin/partnerPortal/dashboard")
      .then((res) => {
        setLoading(false);
        if (res.data.status) {
          setData(res.data);
        } else {
          setToast("error", res.data.message);
        }
      })
      .catch((err) => {
        setLoading(false);
        console.error(err);
      });
  };

  const copyReferralCode = () => {
    if (!data?.referralCode) return;
    navigator.clipboard.writeText(data.referralCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  if (loading) {
    return (
      <div className="mainPage p-4">
        <Title name="Digital Partner Dashboard" />
        <div className="text-center py-5">Loading dashboard...</div>
      </div>
    );
  }

  if (!data || data.isDigitalPartner === false) {
    return (
      <div className="mainPage p-4">
        <Title name="Digital Partner Dashboard" />
        <div className="alert alert-warning">
          This account isn't linked to an active Digital Partner profile.
        </div>
      </div>
    );
  }

  return (
    <div className="mainPage p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <Title name={`Digital Partner Dashboard - ${data.fullName || ""}`} />
        <span className={`badge fs-6 ${data.partnerStatus === "ACTIVE" ? "bg-success" : "bg-secondary"}`}>
          {data.partnerStatus}
        </span>
      </div>

      <div className="row mb-4">
        <div className="col-md-3">
          <div className="card text-white bg-primary p-3 shadow-sm border-0">
            <h6 className="card-title">Coin Balance</h6>
            <h3 className="fw-bold">{data.wallet?.coinBalance || 0}</h3>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-white bg-success p-3 shadow-sm border-0">
            <h6 className="card-title">Ad Credits Balance</h6>
            <h3 className="fw-bold">{data.wallet?.adCreditsBalance || 0}</h3>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-white bg-warning p-3 shadow-sm border-0">
            <h6 className="card-title">Total Referrals</h6>
            <h3 className="fw-bold">{data.referrals?.total || 0}</h3>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-white bg-info p-3 shadow-sm border-0">
            <h6 className="card-title">Referral Earnings</h6>
            <h3 className="fw-bold">₹ {(data.referrals?.totalEarningsInr || 0).toFixed(2)}</h3>
          </div>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-md-6">
          <div className="card shadow-sm border-0 p-3 h-100">
            <h5 className="mb-3">Your Referral Code</h5>
            <p className="text-muted small">
              Share this code with creators and taskers you onboard — you earn 10% of a creator's earnings
              and 20% of a tasker's earnings, ongoing.
            </p>
            <div className="d-flex align-items-center gap-2">
              <span className="badge bg-secondary fs-5 px-3 py-2">{data.referralCode || "—"}</span>
              <button className="btn btn-sm btn-outline-primary" onClick={copyReferralCode} disabled={!data.referralCode}>
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <hr />
            <div className="row text-center">
              <div className="col-6">
                <div className="fw-bold">{data.referrals?.awaitingWatchTimeMilestone || 0}</div>
                <small className="text-muted">Awaiting Stage 2</small>
              </div>
              <div className="col-6">
                <div className="fw-bold">{data.referrals?.completedBothStages || 0}</div>
                <small className="text-muted">Fully Completed</small>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card shadow-sm border-0 p-3 h-100">
            <h5 className="mb-3">License</h5>
            <div className="d-flex justify-content-between border-bottom py-2">
              <span className="text-muted">Fee Paid</span>
              <span className="fw-bold">₹ {(data.license?.feePaidInr || 0).toFixed(2)}</span>
            </div>
            <div className="d-flex justify-content-between border-bottom py-2">
              <span className="text-muted">Activated</span>
              <span>{data.license?.activatedAt ? new Date(data.license.activatedAt).toLocaleDateString() : "—"}</span>
            </div>
            <div className="d-flex justify-content-between py-2">
              <span className="text-muted">Portal Login Email</span>
              <span>{data.email || "—"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
