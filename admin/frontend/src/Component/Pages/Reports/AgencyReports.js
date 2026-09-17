import React, { useEffect, useState } from "react";
import Title from "../../extra/Title";
import axios from "axios";

const SOURCE_LABELS = {
  AD_IMPRESSION: "Ad Impressions",
  DOWNLOAD: "App Downloads",
  COIN_PURCHASE: "Coin Purchases",
  PREMIUM_SUBSCRIPTION: "Premium Subscriptions",
  VIDEO_UNLOCK: "Video Unlocks",
  VIP_CREATOR_ONBOARDING: "VIP Creator Onboarding",
  LOCAL_BUSINESS_ADS: "Local Business Ads",
  TASKER_ONBOARDING: "Tasker Onboarding",
  DIGITAL_PARTNER_LICENSE: "Digital Partner License",
  PAID_CHANNEL: "Paid Channel (legacy)",
};

export default function AgencyReports() {
  const [report, setReport] = useState(null);
  const [agencies, setAgencies] = useState([]);
  const [selectedAgency, setSelectedAgency] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [partners, setPartners] = useState([]);
  const [loadingPartners, setLoadingPartners] = useState(false);

  useEffect(() => {
    fetchAgencies();
    fetchReport();
    fetchDigitalPartners();
  }, []);

  const fetchAgencies = () => {
    axios
      .get("admin/agency/getAgencies?limit=100")
      .then((res) => {
        if (res.data.status) setAgencies(res.data.agencies);
      })
      .catch((err) => console.error(err));
  };

  const fetchReport = () => {
    setLoading(true);
    let url = `admin/agencyReport/getAgencyReport?agencyId=${selectedAgency}`;
    if (startDate) url += `&startDate=${startDate}`;
    if (endDate) url += `&endDate=${endDate}`;

    axios
      .get(url)
      .then((res) => {
        setLoading(false);
        if (res.data.status) setReport(res.data.report);
      })
      .catch((err) => {
        setLoading(false);
        console.error(err);
      });
  };

  const fetchDigitalPartners = () => {
    setLoadingPartners(true);
    let url = "admin/agencyReport/getDigitalPartners";
    if (selectedAgency) url += `?agencyId=${selectedAgency}`;

    axios
      .get(url)
      .then((res) => {
        setLoadingPartners(false);
        if (res.data.status) setPartners(res.data.partners || []);
      })
      .catch((err) => {
        setLoadingPartners(false);
        console.error(err);
      });
  };

  const handleFilter = (e) => {
    e.preventDefault();
    fetchReport();
    fetchDigitalPartners();
  };

  return (
    <div className="mainPage p-4">
      <Title name="Agency & Regional Performance Reports" />

      <div className="card shadow-sm border-0 p-3 mb-4">
        <form onSubmit={handleFilter} className="row g-3 align-items-end">
          <div className="col-md-4">
            <label className="form-label">Filter by Agency</label>
            <select className="form-select" value={selectedAgency} onChange={(e) => setSelectedAgency(e.target.value)}>
              <option value="">All Agencies / Platform Global</option>
              {agencies.map((agency) => (
                <option key={agency._id} value={agency._id}>
                  {agency.name} ({agency.district || agency.state})
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-3">
            <label className="form-label">Start Date</label>
            <input type="date" className="form-control" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="col-md-3">
            <label className="form-label">End Date</label>
            <input type="date" className="form-control" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          <div className="col-md-2">
            <button type="submit" className="btn btn-primary w-100">Generate Report</button>
          </div>
        </form>
      </div>

      <div className="card shadow-sm border-0 p-4">
        {loading ? (
          <div className="text-center py-5">Generating Report...</div>
        ) : !report ? (
          <div className="text-center py-5">No report data available.</div>
        ) : (
          <div className="row g-4">
            <div className="col-md-4">
              <div className="p-3 border rounded">
                <h6 className="text-muted">Total Registered Users</h6>
                <h4>{report.totalUsers}</h4>
              </div>
            </div>
            <div className="col-md-4">
              <div className="p-3 border rounded">
                <h6 className="text-muted">App Downloads</h6>
                <h4>{report.totalDownloads}</h4>
              </div>
            </div>
            <div className="col-md-4">
              <div className="p-3 border rounded">
                <h6 className="text-muted">Regional Video Views</h6>
                <h4>{report.totalVideoViews}</h4>
              </div>
            </div>
            <div className="col-md-4">
              <div className="p-3 border rounded">
                <h6 className="text-muted">Ad Impressions</h6>
                <h4>{report.totalAdImpressions}</h4>
              </div>
            </div>
            <div className="col-md-4">
              <div className="p-3 border rounded">
                <h6 className="text-muted">Gross Platform Revenue</h6>
                <h4 className="text-primary">₹ {report.totalGrossRevenue.toFixed(2)}</h4>
              </div>
            </div>
            <div className="col-md-4">
              <div className="p-3 border rounded">
                <h6 className="text-muted">Commission Share</h6>
                <h4 className="text-success">₹ {report.totalCommissionEarned.toFixed(2)}</h4>
              </div>
            </div>

            {Object.keys(report.commissionBySource || {}).length > 0 && (
              <div className="col-12">
                <h6 className="text-muted mt-2 mb-3">Revenue Stream Breakdown</h6>
                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead>
                      <tr>
                        <th>Revenue Stream</th>
                        <th>Transactions</th>
                        <th>Gross Amount</th>
                        <th>Your Commission</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(report.commissionBySource).map(([key, v]) => (
                        <tr key={key}>
                          <td>{SOURCE_LABELS[key] || key}</td>
                          <td>{v.count}</td>
                          <td>₹ {Number(v.grossAmount).toFixed(2)}</td>
                          <td className="text-success">₹ {Number(v.commissionAmount).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="card shadow-sm border-0 p-4 mt-4">
        <h6 className="text-muted mb-3">Digital Partners in This Territory</h6>
        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead>
              <tr>
                <th>No.</th>
                <th>Name / Email</th>
                <th>District</th>
                <th>Status</th>
                <th>License Fee</th>
                <th>Ad Credits</th>
                <th>Their Referrals</th>
                <th>Activated On</th>
              </tr>
            </thead>
            <tbody>
              {loadingPartners ? (
                <tr>
                  <td colSpan="8" className="text-center py-4">Loading Digital Partners...</td>
                </tr>
              ) : partners.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-4">No Digital Partners activated in this territory yet.</td>
                </tr>
              ) : (
                partners.map((p, idx) => (
                  <tr key={p.userId}>
                    <td>{idx + 1}</td>
                    <td>
                      <div className="fw-bold">{p.fullName || "—"}</div>
                      <small className="text-muted">{p.email}</small>
                    </td>
                    <td>{p.district || "—"}</td>
                    <td>
                      <span className={`badge ${p.partnerStatus === "ACTIVE" ? "bg-success" : "bg-secondary"}`}>
                        {p.partnerStatus}
                      </span>
                    </td>
                    <td>₹ {Number(p.licenseFeePaid || 0).toFixed(0)}</td>
                    <td>₹ {Number(p.adCreditsBalance || 0).toFixed(0)}</td>
                    <td>{p.totalReferrals || 0}</td>
                    <td>{p.activatedAt ? new Date(p.activatedAt).toLocaleDateString() : "—"}</td>
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
