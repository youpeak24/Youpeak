import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Pagination from "../../extra/Pagination";
import { setToast } from "../../../util/toast";
import { warningForText } from "../../../util/Alert";
import FranchiseFormModal from "../PartnerNetwork/FranchiseFormModal";
import { PageHeader, StatusBadge, EmptyRow, inr } from "../PartnerNetwork/networkUi";

// Super admin: create and manage District Franchises.
export default function AgencyList() {
  const navigate = useNavigate();
  const [agencies, setAgencies] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | "new" | agency

  const fetchAgencies = useCallback(() => {
    setLoading(true);
    axios
      .get(`admin/agency/getAgencies?start=${page}&limit=${rowsPerPage}&search=${encodeURIComponent(query)}`)
      .then((res) => {
        setLoading(false);
        if (res.data.status) {
          setAgencies(res.data.agencies || []);
          setTotal(res.data.total || 0);
        } else {
          setToast("error", res.data.message);
        }
      })
      .catch(() => {
        setLoading(false);
        setToast("error", "Couldn't load District Franchises.");
      });
  }, [page, rowsPerPage, query]);

  useEffect(() => {
    fetchAgencies();
  }, [fetchAgencies]);

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      setQuery(search.trim());
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const toggleStatus = (item) => {
    const text = item.isActive
      ? `Deactivate ${item.name}? Their login stops working immediately. Their Digital Partners keep working.`
      : `Activate ${item.name} again?`;
    warningForText(text).then((r) => {
      if (!r.isConfirmed) return;
      axios
        .patch(`admin/agency/toggleStatus?agencyId=${item._id}`)
        .then((res) => {
          setToast(res.data.status ? "success" : "error", res.data.message);
          if (res.data.status) fetchAgencies();
        })
        .catch(() => setToast("error", "Couldn't change the status."));
    });
  };

  const remove = (item) => {
    warningForText(`Delete ${item.name}? Only possible if it never had partners or commissions.`).then((r) => {
      if (!r.isConfirmed) return;
      axios
        .delete(`admin/agency/delete?agencyId=${item._id}`)
        .then((res) => {
          setToast(res.data.status ? "success" : "error", res.data.message);
          if (res.data.status) fetchAgencies();
        })
        .catch(() => setToast("error", "Couldn't delete the franchise."));
    });
  };

  return (
    <div className="pn-page">
      <PageHeader
        title="District Franchises"
        subtitle="Create a franchise for a district and give it a login. Each franchise creates and manages its own Digital Partners."
      >
        <input
          className="form-control"
          style={{ width: 240 }}
          placeholder="Search name, district, email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search franchises"
        />
        <button className="btn btn-success" onClick={() => setModal("new")}>+ Add District Franchise</button>
      </PageHeader>

      <div className="pn-panel">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead>
              <tr>
                <th>Franchise</th>
                <th>District</th>
                <th>Login</th>
                <th>Digital Partners</th>
                <th>Referrals</th>
                <th>Partner earnings</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <EmptyRow colSpan={8}>Loading District Franchises…</EmptyRow>
              ) : agencies.length === 0 ? (
                <EmptyRow colSpan={8}>{query ? "No franchise matches your search." : "No District Franchises yet. Add the first one."}</EmptyRow>
              ) : (
                agencies.map((a) => (
                  <tr key={a._id}>
                    <td>
                      <button className="btn btn-link p-0 fw-semibold text-start" onClick={() => navigate(`/admin/agencyDetail?agencyId=${a._id}`)}>
                        {a.name}
                      </button>
                      <div><small className="pn-muted">{a.code}</small></div>
                    </td>
                    <td>
                      {a.district}
                      <div><small className="pn-muted">{a.state}</small></div>
                    </td>
                    <td>
                      {a.loginEmail}
                      {a.mobileNumber ? <div><small className="pn-muted">{a.mobileNumber}</small></div> : null}
                    </td>
                    <td>
                      <span className="fw-semibold">{a.activePartners}</span>
                      <small className="pn-muted"> active / {a.partnerCount}</small>
                    </td>
                    <td>
                      <span className="fw-semibold">{a.completedReferrals}</span>
                      <small className="pn-muted"> completed / {a.referrals}</small>
                    </td>
                    <td>{inr(a.referralEarningsInr)}</td>
                    <td><StatusBadge status={a.isActive === false ? "INACTIVE" : "ACTIVE"} /></td>
                    <td>
                      <div className="pn-actions">
                        <button className="btn btn-outline-success" onClick={() => navigate(`/admin/agencyDetail?agencyId=${a._id}`)}>View</button>
                        <button className="btn btn-outline-secondary" onClick={() => setModal(a)}>Edit</button>
                        <button className={`btn ${a.isActive === false ? "btn-outline-success" : "btn-outline-warning"}`} onClick={() => toggleStatus(a)}>
                          {a.isActive === false ? "Activate" : "Deactivate"}
                        </button>
                        {a.partnerCount === 0 && (
                          <button className="btn btn-outline-danger" onClick={() => remove(a)}>Delete</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          type="server"
          activePage={page}
          rowsPerPage={rowsPerPage}
          userTotal={total}
          setPage={setPage}
          handleRowsPerPage={(n) => { setRowsPerPage(n); setPage(1); }}
        />
      </div>

      {modal && (
        <FranchiseFormModal
          agency={modal === "new" ? null : modal}
          onClose={() => setModal(null)}
          onSaved={fetchAgencies}
        />
      )}
    </div>
  );
}
