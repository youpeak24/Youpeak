import React, { useState } from "react";
import axios from "axios";
import { setToast } from "../../../util/toast";
import { Modal, generatePassword, inr } from "./networkUi";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// District Franchise: create (partner = null) or edit one of its Digital Partners.
export default function PartnerFormModal({ partner, onClose, onSaved }) {
  const editing = !!partner;
  const [form, setForm] = useState({
    fullName: partner?.fullName || "",
    email: partner?.email || "",
    mobileNumber: partner?.mobileNumber || "",
    password: "",
    licenseFeeInr: "",
  });
  const [showPassword, setShowPassword] = useState(!editing);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(null);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const validate = () => {
    if (form.fullName.trim().length < 2) return "Enter the partner's full name.";
    if (!editing && !EMAIL_RE.test(form.email.trim())) return "Enter a valid email address.";
    if (!editing && form.password.length < 8) return "Password must be at least 8 characters.";
    if (editing && form.password && form.password.length < 8) return "New password must be at least 8 characters.";
    const m = form.mobileNumber.replace(/[\s-]/g, "").replace(/^\+91/, "");
    if (m && !/^[6-9]\d{9}$/.test(m)) return "Enter a valid 10-digit mobile number.";
    const fee = form.licenseFeeInr === "" ? 0 : Number(form.licenseFeeInr);
    if (!Number.isFinite(fee) || fee < 0) return "Licence fee must be 0 or more.";
    return null;
  };

  const submit = (e) => {
    e.preventDefault();
    const problem = validate();
    if (problem) return setToast("error", problem);
    setSaving(true);
    const req = editing
      ? axios.patch(`admin/franchisePortal/partners/update?userId=${partner.userId}`, {
          fullName: form.fullName.trim(),
          mobileNumber: form.mobileNumber,
          ...(form.password ? { newPassword: form.password } : {}),
        })
      : axios.post("admin/franchisePortal/partners/create", {
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          mobileNumber: form.mobileNumber,
          password: form.password,
          licenseFeeInr: form.licenseFeeInr === "" ? 0 : Number(form.licenseFeeInr),
        });
    req
      .then((res) => {
        setSaving(false);
        if (!res.data.status) return setToast("error", res.data.message);
        onSaved && onSaved();
        if (!editing) {
          setDone({
            message: res.data.message,
            email: res.data.portalLogin?.email || form.email.trim().toLowerCase(),
            password: form.password,
            appAccount: res.data.appAccount,
            commission: res.data.commission,
          });
        } else if (form.password) {
          setDone({ message: res.data.message, email: partner.portalEmail || partner.email, password: form.password, passwordChanged: res.data.passwordChanged });
        } else {
          setToast("success", res.data.message);
          onClose();
        }
      })
      .catch((err) => {
        setSaving(false);
        setToast("error", err?.response?.data?.message || "Something went wrong.");
      });
  };

  if (done) {
    return (
      <Modal title={editing ? "Password updated" : "Digital Partner created"} onClose={onClose} footer={<button className="btn btn-success" onClick={onClose}>Done</button>}>
        <p className="mb-2">{done.message}</p>
        <div className="pn-credentials">
          <div>Email: <code>{done.email}</code></div>
          <div>Password: <code>{done.password}</code></div>
          <small className="pn-muted d-block mt-1">
            {done.appAccount === "LINKED_EXISTING" || (done.passwordChanged && !done.passwordChanged.app)
              ? "Works for the partner panel. Their app login stays their own."
              : "Works for both the Youpeak app and the partner panel."}
          </small>
        </div>
        {done.commission && (
          <div className="alert alert-warning mt-3 mb-0">
            Your {inr(done.commission.amount)} commission on this licence fee is recorded and will be payable after the Youpeak admin verifies the fee was received.
          </div>
        )}
        <small className="pn-muted d-block mt-2">Share these details with the partner now — the password isn't shown again.</small>
      </Modal>
    );
  }

  return (
    <Modal
      title={editing ? `Edit ${partner.fullName}` : "Add Digital Partner"}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-outline-secondary" onClick={onClose} disabled={saving}>Cancel</button>
          <button type="submit" form="partner-form" className="btn btn-success" disabled={saving}>
            {saving ? "Saving…" : editing ? "Save changes" : "Create partner"}
          </button>
        </>
      }
    >
      <form id="partner-form" onSubmit={submit} noValidate>
        <div className="mb-3">
          <label className="form-label" htmlFor="pf-name">Full name *</label>
          <input id="pf-name" className="form-control" value={form.fullName} onChange={set("fullName")} />
        </div>
        <div className="row">
          <div className="col-md-6 mb-3">
            <label className="form-label" htmlFor="pf-email">Email *</label>
            <input id="pf-email" type="email" className="form-control" value={form.email} onChange={set("email")} disabled={editing} autoComplete="off" />
            {!editing && <small className="pn-muted">If this email already has a Youpeak app account, it's linked.</small>}
          </div>
          <div className="col-md-6 mb-3">
            <label className="form-label" htmlFor="pf-mobile">Mobile number</label>
            <input id="pf-mobile" className="form-control" value={form.mobileNumber} onChange={set("mobileNumber")} placeholder="10-digit mobile" />
          </div>
        </div>
        <div className="mb-3">
          <label className="form-label" htmlFor="pf-password">{editing ? "Reset password (leave empty to keep)" : "Password *"}</label>
          <div className="pn-password">
            <input
              id="pf-password"
              type={showPassword ? "text" : "password"}
              className="form-control"
              value={form.password}
              onChange={set("password")}
              autoComplete="new-password"
              placeholder="At least 8 characters"
            />
            <button type="button" className="btn btn-outline-secondary" onClick={() => setShowPassword((v) => !v)}>{showPassword ? "Hide" : "Show"}</button>
            <button type="button" className="btn btn-outline-success" onClick={() => { setForm((f) => ({ ...f, password: generatePassword() })); setShowPassword(true); }}>Generate</button>
          </div>
        </div>
        {!editing && (
          <div className="mb-1">
            <label className="form-label" htmlFor="pf-fee">Licence fee collected (₹)</label>
            <input id="pf-fee" type="number" min="0" step="1" className="form-control" value={form.licenseFeeInr} onChange={set("licenseFeeInr")} placeholder="0 if no fee was collected" />
            <small className="pn-muted">
              The partner gets the same amount as ad credits. Your commission on it is recorded and paid only after the Youpeak admin verifies the fee.
            </small>
          </div>
        )}
      </form>
    </Modal>
  );
}
