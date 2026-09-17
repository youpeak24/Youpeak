import React, { useEffect, useState } from "react";
import Title from "../../extra/Title";
import Button from "../../extra/Button";
import axios from "axios";
import { setToast } from "../../../util/toast";

export default function ManageDigitalPartner() {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(false);

  const [openActivate, setOpenActivate] = useState(false);
  const [email, setEmail] = useState("");
  const [licenseFeeInr, setLicenseFeeInr] = useState("");
  const [activating, setActivating] = useState(false);

  const [credentials, setCredentials] = useState(null); // { email, password } — one-time reveal
  const [regeneratingFor, setRegeneratingFor] = useState(null);

  const fetchPartners = () => {
    setLoading(true);
    axios
      .get("admin/digitalPartner/list")
      .then((res) => {
        setLoading(false);
        if (res.data.status) setPartners(res.data.partners || []);
        else setToast("error", res.data.message);
      })
      .catch((err) => {
        setLoading(false);
        setToast("error", err.response?.data?.message || err.message);
      });
  };

  useEffect(() => {
    fetchPartners();
  }, []);

  const resetActivateForm = () => {
    setEmail("");
    setLicenseFeeInr("");
  };

  const handleActivate = (e) => {
    e.preventDefault();
    if (!email) {
      setToast("warning", "Please enter the partner's app account email.");
      return;
    }
    setActivating(true);
    axios
      .post("admin/digitalPartner/activate", {
        email: email.trim(),
        ...(licenseFeeInr !== "" ? { licenseFeeInr: Number(licenseFeeInr) } : {}),
      })
      .then((res) => {
        setActivating(false);
        if (res.data.status) {
          setToast("success", res.data.message);
          setOpenActivate(false);
          resetActivateForm();
          fetchPartners();
          if (res.data.portalCredentials) setCredentials(res.data.portalCredentials);
        } else {
          setToast("error", res.data.message);
        }
      })
      .catch((err) => {
        setActivating(false);
        setToast("error", err.response?.data?.message || err.message);
      });
  };

  const handleRegeneratePassword = (userId) => {
    setRegeneratingFor(userId);
    axios
      .post("admin/digitalPartner/regeneratePassword", { userId })
      .then((res) => {
        setRegeneratingFor(null);
        if (res.data.status) {
          setToast("success", res.data.message);
          setCredentials(res.data.portalCredentials);
          fetchPartners();
        } else {
          setToast("error", res.data.message);
        }
      })
      .catch((err) => {
        setRegeneratingFor(null);
        setToast("error", err.response?.data?.message || err.message);
      });
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(String(text ?? ""));
      setToast("success", "Copied to clipboard");
    } catch (e) {
      setToast("error", "Could not copy");
    }
  };

  return (
    <div className="mainPage p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <Title name="Digital Partner Management" />
        <Button
          btnName="Activate Digital Partner"
          newClass="submit-btn"
          onClick={() => setOpenActivate(true)}
        />
      </div>

      <div className="card shadow-sm border-0 p-3">
        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead>
              <tr>
                <th>No.</th>
                <th>Name / Email</th>
                <th>State / District</th>
                <th>Status</th>
                <th>License Fee</th>
                <th>Ad Credits</th>
                <th>Portal Login</th>
                <th>Activated On</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" className="text-center py-4">Loading Digital Partners...</td>
                </tr>
              ) : partners.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-4">
                    No Digital Partners yet. Click "Activate Digital Partner" to onboard one.
                  </td>
                </tr>
              ) : (
                partners.map((p, idx) => (
                  <tr key={p.userId}>
                    <td>{idx + 1}</td>
                    <td>
                      <div className="fw-bold">{p.fullName || "—"}</div>
                      <small className="text-muted">{p.email}</small>
                    </td>
                    <td>{p.state || "—"} / {p.district || "—"}</td>
                    <td>
                      <span className={`badge ${p.partnerStatus === "ACTIVE" ? "bg-success" : "bg-secondary"}`}>
                        {p.partnerStatus}
                      </span>
                    </td>
                    <td>₹ {Number(p.licenseFeePaid || 0).toFixed(0)}</td>
                    <td>₹ {Number(p.adCreditsBalance || 0).toFixed(0)}</td>
                    <td>
                      {p.portalAccountExists ? (
                        <>
                          <div>{p.portalEmail}</div>
                          {p.portalPasswordIsTemporary ? (
                            <small className="text-warning">Password not set yet</small>
                          ) : (
                            <small className="text-success">Password set</small>
                          )}
                        </>
                      ) : (
                        <span className="badge bg-danger">No portal account</span>
                      )}
                    </td>
                    <td>{p.activatedAt ? new Date(p.activatedAt).toLocaleDateString() : "—"}</td>
                    <td>
                      <button
                        className="btn btn-sm btn-outline-primary"
                        disabled={regeneratingFor === p.userId}
                        onClick={() => handleRegeneratePassword(p.userId)}
                      >
                        {regeneratingFor === p.userId ? "Generating..." : "Generate Login"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {openActivate && (
        <div className="modal show d-block tab-modal-custom" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Activate Digital Partner</h5>
                <button type="button" className="btn-close" onClick={() => setOpenActivate(false)}></button>
              </div>
              <form onSubmit={handleActivate}>
                <div className="modal-body">
                  <p className="text-muted small">
                    The person must already have a Youpeak app account. This grants them the ad-credits
                    wallet + partner status, records the district commission, and creates their web
                    portal login (or tops up their credits if they're already a partner).
                  </p>
                  <div className="mb-3">
                    <label className="form-label">App Account Email *</label>
                    <input
                      type="email"
                      className="form-control"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Exactly as registered in the app"
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">License Fee (INR)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={licenseFeeInr}
                      onChange={(e) => setLicenseFeeInr(e.target.value)}
                      placeholder="Defaults to the configured license fee (₹25,000)"
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setOpenActivate(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={activating}>
                    {activating ? "Activating..." : "Activate"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {credentials && (
        <div className="modal show d-block tab-modal-custom" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Web Portal Login</h5>
                <button type="button" className="btn-close" onClick={() => setCredentials(null)}></button>
              </div>
              <div className="modal-body">
                <p className="text-muted small">
                  Share this with the Digital Partner now — this password won't be shown again once
                  they set their own.
                </p>
                <div className="mb-3">
                  <label className="form-label">Email</label>
                  <div className="d-flex align-items-center gap-2">
                    <input type="text" className="form-control" value={credentials.email} readOnly />
                    <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => copyToClipboard(credentials.email)}>Copy</button>
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label">Temporary Password</label>
                  <div className="d-flex align-items-center gap-2">
                    <input type="text" className="form-control" value={credentials.password} readOnly />
                    <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => copyToClipboard(credentials.password)}>Copy</button>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-primary" onClick={() => setCredentials(null)}>Got it, I've saved it</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
