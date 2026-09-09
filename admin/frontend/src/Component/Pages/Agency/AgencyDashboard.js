import React, { useEffect, useState } from "react";
import Title from "../../extra/Title";
import axios from "axios";

export default function AgencyDashboard() {
  const [report, setReport] = useState(null);
  const [agencyInfo, setAgencyInfo] = useState(null);
  const [commissions, setCommissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAgencyReport();
    fetchAgencyCommissions();
  }, []);

  const fetchAgencyReport = () => {
    axios
      .get("admin/agencyReport/getAgencyReport")
      .then((res) => {
        if (res.data.status) {
          setReport(res.data.report);
          setAgencyInfo(res.data.agency);
        }
      })
      .catch((err) => console.error(err));
  };

  const fetchAgencyCommissions = () => {
    axios
      .get("admin/commission/getCommissions?limit=10")
      .then((res) => {
        setLoading(false);
        if (res.data.status) {
          setCommissions(res.data.commissions);
        }
      })
      .catch((err) => {
        setLoading(false);
        console.error(err);
      });
  };

  return (
    <div className="mainPage p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <Title name={agencyInfo ? `Agency Dashboard - ${agencyInfo.name}` : "Regional Agency Dashboard"} />
      </div>

      <div className="row mb-4">
        <div className="col-md-3">
          <div className="card text-white bg-primary p-3 shadow-sm border-0">
            <h6 className="card-title">Regional Downloads</h6>
            <h3 className="fw-bold">{report ? report.totalDownloads : 0}</h3>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-white bg-success p-3 shadow-sm border-0">
            <h6 className="card-title">Video Views</h6>
            <h3 className="fw-bold">{report ? report.totalVideoViews : 0}</h3>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-white bg-warning p-3 shadow-sm border-0">
            <h6 className="card-title">Ad Impressions</h6>
            <h3 className="fw-bold">{report ? report.totalAdImpressions : 0}</h3>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-white bg-info p-3 shadow-sm border-0">
            <h6 className="card-title">Commission Earned</h6>
            <h3 className="fw-bold">₹ {report ? report.totalCommissionEarned.toFixed(2) : "0.00"}</h3>
          </div>
        </div>
      </div>

      {/* District Partner Commission Rates (DOC-20260826-WA0000) */}
      <div className="card shadow-sm border-0 p-3 mb-4">
        <h5 className="mb-3">District Partner Commission Rates & Breakdown</h5>
        <div className="row g-3">
          <div className="col-md-4">
            <div className="p-3 border rounded bg-light">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <span className="fw-bold text-dark">Video Unlock Revenue</span>
                <span className="badge bg-primary fs-6">10%</span>
              </div>
              <small className="text-secondary d-block mt-2">10% commission per video unlock (Max ₹1,000 cap per unlock transaction).</small>
            </div>
          </div>
          <div className="col-md-4">
            <div className="p-3 border rounded bg-light">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <span className="fw-bold text-dark">VIP Creator Onboarding</span>
                <span className="badge bg-success fs-6">20%</span>
              </div>
              <small className="text-secondary d-block mt-2">20% commission on all VIP Creator subscription & onboarding fees in your region.</small>
            </div>
          </div>
          <div className="col-md-4">
            <div className="p-3 border rounded bg-light">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <span className="fw-bold text-dark">Local Business Ads</span>
                <span className="badge bg-warning text-dark fs-6">30%</span>
              </div>
              <small className="text-secondary d-block mt-2">30% commission on local advertiser & business ad placements within your district.</small>
            </div>
          </div>
        </div>
      </div>

      <div className="card shadow-sm border-0 p-3">
        <h5 className="mb-3">Recent Commission Earnings</h5>
        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead>
              <tr>
                <th>No.</th>
                <th>Source Type</th>
                <th>Gross Revenue</th>
                <th>Commission %</th>
                <th>Commission Amount</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-4">Loading commission ledger...</td>
                </tr>
              ) : commissions.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-4">No recent commission records.</td>
                </tr>
              ) : (
                commissions.map((item, idx) => (
                  <tr key={item._id}>
                    <td>{idx + 1}</td>
                    <td><span className="badge bg-secondary">{item.sourceType}</span></td>
                    <td>₹ {item.grossAmount}</td>
                    <td>{item.commissionRatePercentage}%</td>
                    <td className="fw-bold text-success">₹ {item.commissionAmount}</td>
                    <td>
                      <span className={`badge ${item.payoutStatus === "PAID" ? "bg-success" : "bg-warning"}`}>
                        {item.payoutStatus}
                      </span>
                    </td>
                    <td>{new Date(item.createdAt).toLocaleDateString()}</td>
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
