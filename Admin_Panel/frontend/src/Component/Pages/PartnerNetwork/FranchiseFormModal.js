import React, { useMemo, useState } from "react";
import axios from "axios";
import { setToast } from "../../../util/toast";
import INDIA from "../../../util/indiaDistricts.json";
import { Modal, generatePassword } from "./networkUi";

const OTHER = "__other__";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Create (agency = null) or edit a District Franchise. Super admin only.
export default function FranchiseFormModal({ agency, onClose, onSaved }) {
  const editing = !!agency;
  const states = useMemo(() => Object.keys(INDIA), []);
  const knownDistrict = (st, d) => (INDIA[st] || []).includes(d);

  const [form, setForm] = useState({
    name: agency?.name || "",
    state: agency?.state || "",
    district: agency ? (knownDistrict(agency.state, agency.district) ? agency.district : OTHER) : "",
    customDistrict: agency && !knownDistrict(agency.state, agency.district) ? agency.district || "" : "",
    email: agency?.loginEmail || agency?.email || "",
    password: "",
    mobileNumber: agency?.mobileNumber || "",
  });
  const [showPassword, setShowPassword] = useState(!editing);
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState(null);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const districts = INDIA[form.state] || [];
  const district = form.district === OTHER ? form.customDistrict.trim() : form.district;

  const validate = () => {
    if (form.name.trim().length < 2) return "Enter the franchise name.";
    if (!form.state) return "Select the state.";
    if (!district) return "Select the district (city) this franchise covers.";
    if (!EMAIL_RE.test(form.email.trim())) return "Enter a valid login email.";
    if (!editing && form.password.length < 8) return "Password must be at least 8 characters.";
    if (editing && form.password && form.password.length < 8) return "New password must be at least 8 characters.";
    const m = form.mobileNumber.replace(/[\s-]/g, "").replace(/^\+91/, "");
    if (m && !/^[6-9]\d{9}$/.test(m)) return "Enter a valid 10-digit mobile number.";
    return null;
  };

  const submit = (e) => {
    e.preventDefault();
    const problem = validate();
    if (problem) return setToast("error", problem);
    setSaving(true);
    const body = {
      name: form.name.trim(),
      state: form.state,
      district,
      email: form.email.trim(),
      mobileNumber: form.mobileNumber,
    };
    const req = editing
      ? axios.patch(`admin/agency/update?agencyId=${agency._id}`, { ...body, ...(form.password ? { newPassword: form.password } : {}) })
      : axios.post("admin/agency/store", { ...body, password: form.password });
    req
      .then((res) => {
        setSaving(false);
        if (!res.data.status) return setToast("error", res.data.message);
        setToast("success", res.data.message);
        onSaved && onSaved();
        if (!editing || form.password) {
          setCreated({ email: body.email.toLowerCase(), password: form.password });
        } else {
          onClose();
        }
      })
      .catch((err) => {
        setSaving(false);
        setToast("error", err?.response?.data?.message || "Something went wrong.");
      });
  };

  if (created) {
    return (
      <Modal
        title={editing ? "Login updated" : "District Franchise created"}
        onClose={onClose}
        footer={<button className="btn btn-success" onClick={onClose}>Done</button>}
      >
        <p className="mb-2">Share these login details with the franchise. They log in at this same admin panel address.</p>
        <div className="pn-credentials">
          <div>Email: <code>{created.email}</code></div>
          <div>Password: <code>{created.password}</code></div>
        </div>
        <small className="pn-muted d-block mt-2">The password isn't shown again. You can reset it later from Edit.</small>
      </Modal>
    );
  }

  return (
    <Modal
      title={editing ? `Edit ${agency.name}` : "Add District Franchise"}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-outline-secondary" onClick={onClose} disabled={saving}>Cancel</button>
          <button type="submit" form="franchise-form" className="btn btn-success" disabled={saving}>
            {saving ? "Saving…" : editing ? "Save changes" : "Create franchise"}
          </button>
        </>
      }
    >
      <form id="franchise-form" onSubmit={submit} noValidate>
        <div className="mb-3">
          <label className="form-label" htmlFor="ff-name">Franchise name *</label>
          <input id="ff-name" className="form-control" value={form.name} onChange={set("name")} placeholder="e.g. Youpeak Trichy" />
        </div>
        <div className="row">
          <div className="col-md-6 mb-3">
            <label className="form-label" htmlFor="ff-state">State *</label>
            <select id="ff-state" className="form-control" value={form.state} onChange={(e) => setForm((f) => ({ ...f, state: e.target.value, district: "", customDistrict: "" }))}>
              <option value="">Select state</option>
              {states.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="col-md-6 mb-3">
            <label className="form-label" htmlFor="ff-district">District / city *</label>
            <select id="ff-district" className="form-control" value={form.district} onChange={set("district")} disabled={!form.state}>
              <option value="">{form.state ? "Select district" : "Select state first"}</option>
              {districts.map((d) => <option key={d} value={d}>{d}</option>)}
              {form.state && <option value={OTHER}>Other — type it</option>}
            </select>
          </div>
        </div>
        {form.district === OTHER && (
          <div className="mb-3">
            <label className="form-label" htmlFor="ff-custom">District name *</label>
            <input id="ff-custom" className="form-control" value={form.customDistrict} onChange={set("customDistrict")} placeholder="Type the district name" />
          </div>
        )}
        <div className="row">
          <div className="col-md-6 mb-3">
            <label className="form-label" htmlFor="ff-email">Login email *</label>
            <input id="ff-email" type="email" className="form-control" value={form.email} onChange={set("email")} autoComplete="off" />
          </div>
          <div className="col-md-6 mb-3">
            <label className="form-label" htmlFor="ff-mobile">Mobile number</label>
            <input id="ff-mobile" className="form-control" value={form.mobileNumber} onChange={set("mobileNumber")} placeholder="10-digit mobile" />
          </div>
        </div>
        <div className="mb-1">
          <label className="form-label" htmlFor="ff-password">{editing ? "Reset password (leave empty to keep)" : "Login password *"}</label>
          <div className="pn-password">
            <input
              id="ff-password"
              type={showPassword ? "text" : "password"}
              className="form-control"
              value={form.password}
              onChange={set("password")}
              autoComplete="new-password"
              placeholder="At least 8 characters"
            />
            <button type="button" className="btn btn-outline-secondary" onClick={() => setShowPassword((v) => !v)}>
              {showPassword ? "Hide" : "Show"}
            </button>
            <button type="button" className="btn btn-outline-success" onClick={() => { setForm((f) => ({ ...f, password: generatePassword() })); setShowPassword(true); }}>
              Generate
            </button>
          </div>
        </div>
        <small className="pn-muted">One active franchise per district. The franchise logs in to its own portal and manages the Digital Partners in its district.</small>
      </form>
    </Modal>
  );
}
