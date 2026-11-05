import React, { useEffect, useState } from "react";
import Title from "../../extra/Title";
import axios from "axios";
import { setToast } from "../../../util/toast";

export default function FraudManagement() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchAlerts = () => {
    setLoading(true);
    axios
      .get("admin/fraud/getAlerts?limit=20")
      .then((res) => {
        setLoading(false);
        if (res.data.status) setAlerts(res.data.alerts);
      })
      .catch((err) => {
        setLoading(false);
        console.error(err);
      });
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleToggleRestriction = (userId, isBlock, isRestricted) => {
    axios
      .post("admin/fraud/toggleUserRestriction", {
        userId,
        isBlock: !isBlock,
        isRestricted: !isRestricted,
        restrictionReason: !isBlock ? "Account locked due to suspicious activity" : "",
      })
      .then((res) => {
        if (res.data.status) {
          setToast(res.data.message, "success");
          fetchAlerts();
        }
      })
      .catch((err) => console.error(err));
  };

  return (
    <div className="mainPage p-4">
      <Title name="Fraud & Suspicious Account Monitoring" />

      <div className="card shadow-sm border-0 p-3">
        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead>
              <tr>
                <th>No.</th>
                <th>User Name / Email</th>
                <th>Risk Type</th>
                <th>Risk Score</th>
                <th>IP Address</th>
                <th>Action Taken</th>
                <th>Account Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center py-4">Loading fraud audit log...</td>
                </tr>
              ) : alerts.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-4">No suspicious fraud alerts recorded.</td>
                </tr>
              ) : (
                alerts.map((item, idx) => (
                  <tr key={item._id}>
                    <td>{idx + 1}</td>
                    <td>
                      <div className="fw-bold">{item.userId?.fullName || "Unknown User"}</div>
                      <small className="text-muted">{item.userId?.email}</small>
                    </td>
                    <td><span className="badge bg-danger">{item.riskType}</span></td>
                    <td>
                      <span className={`fw-bold ${item.riskScore >= 75 ? "text-danger" : "text-warning"}`}>
                        {item.riskScore} / 100
                      </span>
                    </td>
                    <td>{item.ipAddress || "N/A"}</td>
                    <td>
                      <span className="badge bg-secondary">{item.actionAction || item.actionTaken}</span>
                    </td>
                    <td>
                      {item.userId?.isBlock ? (
                        <span className="badge bg-danger">BLOCKED</span>
                      ) : (
                        <span className="badge bg-success">ACTIVE</span>
                      )}
                    </td>
                    <td>
                      <button
                        className={`btn btn-sm ${item.userId?.isBlock ? "btn-outline-success" : "btn-outline-danger"}`}
                        onClick={() =>
                          handleToggleRestriction(
                            item.userId?._id,
                            item.userId?.isBlock,
                            item.userId?.isRestricted
                          )
                        }
                      >
                        {item.userId?.isBlock ? "Unlock Account" : "Lock Account"}
                      </button>
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
