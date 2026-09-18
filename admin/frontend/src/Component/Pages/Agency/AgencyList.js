import React, { useEffect, useState } from "react";
import Title from "../../extra/Title";
import Button from "../../extra/Button";
import axios from "axios";
import { setToast } from "../../../util/toast";
import Table from "../../extra/Table";
import Pagination from "../../extra/Pagination";

export default function AgencyList() {
  const [agencies, setAgencies] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);

  // Modal State
  const [openModal, setOpenModal] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [commissionRatePercentage, setCommissionRatePercentage] = useState(10);
  const [state, setState] = useState("");
  const [district, setDistrict] = useState("");
  const [radiusKm, setRadiusKm] = useState(50);

  const fetchAgencies = (p = page, limit = rowsPerPage) => {
    setLoading(true);
    axios
      .get(`admin/agency/getAgencies?start=${p}&limit=${limit}`)
      .then((res) => {
        setLoading(false);
        if (res.data.status) {
          setAgencies(res.data.agencies || []);
          setTotal(res.data.total || 0);
        }
      })
      .catch((err) => {
        setLoading(false);
        console.error(err);
      });
  };

  useEffect(() => {
    fetchAgencies();
  }, [page, rowsPerPage]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !code || !email || !password) {
      setToast("warning", "Please fill all required fields!");
      return;
    }

    axios
      .post("admin/agency/store", {
        name,
        code,
        email,
        password,
        mobileNumber,
        commissionRatePercentage: Number(commissionRatePercentage) || 10,
        state,
        district,
        radiusKm: Number(radiusKm) || 50,
      })
      .then((res) => {
        if (res.data && res.data.status) {
          setToast("success", res.data.message || "District Franchise created successfully!");
          setOpenModal(false);
          fetchAgencies();
          resetForm();
        } else {
          setToast("error", res.data?.message || "Failed to create District Franchise!");
        }
      })
      .catch((err) => {
        console.error(err);
        const errMsg = err.response?.data?.message || err.message || "Failed to save District Franchise";
        setToast("error", errMsg);
      });
  };

  const resetForm = () => {
    setName("");
    setCode("");
    setEmail("");
    setPassword("");
    setMobileNumber("");
    setCommissionRatePercentage(10);
    setState("");
    setDistrict("");
    setRadiusKm(50);
  };

  const toggleStatus = (id) => {
    axios
      .patch(`admin/agency/toggleStatus?agencyId=${id}`)
      .then((res) => {
        if (res.data && res.data.status) {
          setToast("success", res.data.message);
          fetchAgencies();
        }
      })
      .catch((err) => console.error(err));
  };

  return (
    <div className="mainPage p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <Title name="Geofenced District Franchise Management" />
        <Button
          btnName="Add District Franchise"
          newClass="btn-theme"
          onClick={() => setOpenModal(true)}
        />
      </div>

      <div className="card shadow-sm border-0 p-3">
        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead>
              <tr>
                <th>No.</th>
                <th>District Franchise Name</th>
                <th>Code</th>
                <th>Email</th>
                <th>State / District</th>
                <th>Geofence Radius</th>
                <th>Commission Rate</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" className="text-center py-4">
                    Loading District Franchises...
                  </td>
                </tr>
              ) : agencies.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-4">
                    No District Franchises found.
                  </td>
                </tr>
              ) : (
                agencies.map((item, index) => (
                  <tr key={item._id}>
                    <td>{(page - 1) * rowsPerPage + index + 1}</td>
                    <td className="fw-bold">{item.name}</td>
                    <td><span className="badge bg-secondary">{item.code}</span></td>
                    <td>{item.email}</td>
                    <td>{item.state} / {item.district}</td>
                    <td>{item.radiusKm} km</td>
                    <td>{item.commissionRatePercentage}%</td>
                    <td>
                      <span className={`badge ${item.isActive ? "bg-success" : "bg-danger"}`}>
                        {item.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      <button
                        className={`btn btn-sm ${item.isActive ? "btn-outline-danger" : "btn-outline-success"}`}
                        onClick={() => toggleStatus(item._id)}
                      >
                        {item.isActive ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          type="agency"
          activePage={page}
          rowsPerPage={rowsPerPage}
          userTotal={total}
          setPage={setPage}
          handleRowsPerPage={setRowsPerPage}
        />
      </div>

      {openModal && (
        <div className="modal show d-block tab-modal-custom" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Create Geofenced District Franchise</h5>
                <button type="button" className="btn-close" onClick={() => setOpenModal(false)}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">District Franchise Name *</label>
                    <input type="text" className="form-control" value={name} onChange={(e) => setName(e.target.value)} required />
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">District Franchise Code *</label>
                      <input type="text" className="form-control" value={code} onChange={(e) => setCode(e.target.value)} required />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Commission %</label>
                      <input type="number" className="form-control" value={commissionRatePercentage} onChange={(e) => setCommissionRatePercentage(e.target.value)} />
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Email *</label>
                      <input type="email" className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Password *</label>
                      <input type="password" className="form-control" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-4 mb-3">
                      <label className="form-label">State</label>
                      <input type="text" className="form-control" value={state} onChange={(e) => setState(e.target.value)} />
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label">District</label>
                      <input type="text" className="form-control" value={district} onChange={(e) => setDistrict(e.target.value)} />
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label">Radius (km)</label>
                      <input type="number" className="form-control" value={radiusKm} onChange={(e) => setRadiusKm(e.target.value)} />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setOpenModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Create District Franchise</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
