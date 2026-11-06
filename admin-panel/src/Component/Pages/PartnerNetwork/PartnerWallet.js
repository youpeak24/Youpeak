import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { setToast } from "../../../util/toast";
import { warningForText } from "../../../util/Alert";
import { Modal, EmptyRow, inr, fmtDate } from "./networkUi";

// Older requests were stored without a status; the model default is 1 (pending).
const statusOf = (r) => (r.status == null ? 1 : Number(r.status));

const REQUEST_STATUS = {
  1: ["pn-stage-wait", "Pending"],
  2: ["pn-stage-done", "Paid"],
  3: ["pn-stage-bad", "Declined"],
};

// Digital Partner's app wallet, driven by the app's own withdrawal rules
// (backend: admin/partnerPortal.controller.js getWallet / convertCoins / requestWithdrawal).
export default function PartnerWallet({ onChanged }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [coins, setCoins] = useState("");
  const [busy, setBusy] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [form, setForm] = useState({ amount: "", methodId: "", details: {} });

  const load = useCallback(() => {
    setLoading(true);
    axios
      .get("admin/partnerPortal/wallet")
      .then((res) => {
        setLoading(false);
        if (res.data.status) setData(res.data);
        else setToast("error", res.data.message);
      })
      .catch(() => {
        setLoading(false);
        setToast("error", "Couldn't load your wallet.");
      });
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading && !data) return <div className="pn-panel pn-panel-body pn-muted">Loading wallet…</div>;
  if (!data) return null;

  const w = data.wallet;
  const rate = Number(w.minCoinForCashOut) || 100; // coins per ₹1
  const minConvert = Number(w.minConvertCoin) || 0;
  const hasPaidOut = (data.requests || []).some((r) => statusOf(r) === 2);
  const minWithdraw = hasPaidOut ? Number(w.minWithdrawalRequestedAmount) || 500 : Number(data.firstWithdrawalMinimumInr) || 100;
  const pending = (data.requests || []).some((r) => statusOf(r) === 1);
  const method = (data.methods || []).find((m) => m._id === form.methodId);

  const convert = () => {
    const n = parseInt(coins, 10);
    if (!Number.isFinite(n) || n <= 0) return setToast("error", "Enter how many coins to convert.");
    if (minConvert && n < minConvert) return setToast("error", `Convert at least ${minConvert.toLocaleString("en-IN")} coins.`);
    if (n > w.coin) return setToast("error", "You don't have that many coins.");
    warningForText(`Convert ${n.toLocaleString("en-IN")} coins into ${inr(n / rate)} withdrawable balance?`).then((r) => {
      if (!r.isConfirmed) return;
      setBusy(true);
      axios
        .post("admin/partnerPortal/wallet/convert", { coin: n })
        .then((res) => {
          setBusy(false);
          setToast(res.data.status ? "success" : "error", res.data.message);
          if (res.data.status) {
            setCoins("");
            load();
            onChanged && onChanged();
          }
        })
        .catch(() => {
          setBusy(false);
          setToast("error", "Conversion failed.");
        });
    });
  };

  const submitWithdraw = (e) => {
    e.preventDefault();
    const amount = Math.floor(Number(form.amount));
    if (!Number.isFinite(amount) || amount <= 0) return setToast("error", "Enter the amount to withdraw.");
    if (amount < minWithdraw) return setToast("error", `Minimum withdrawal is ${inr(minWithdraw)}.`);
    if (amount > w.totalEarningAmount) return setToast("error", "That's more than your withdrawable balance.");
    if (!method) return setToast("error", "Choose a payout method.");
    const missing = method.details.find((d) => !String(form.details[d] || "").trim());
    if (missing) return setToast("error", `Enter your ${missing}.`);
    setBusy(true);
    axios
      .post("admin/partnerPortal/wallet/withdraw", {
        requestAmount: amount,
        paymentGateway: method.name,
        paymentDetails: method.details.map((d) => `${d}:${String(form.details[d]).trim()}`),
      })
      .then((res) => {
        setBusy(false);
        setToast(res.data.status ? "success" : "error", res.data.message);
        if (res.data.status) {
          setWithdrawOpen(false);
          setForm({ amount: "", methodId: "", details: {} });
          load();
        }
      })
      .catch(() => {
        setBusy(false);
        setToast("error", "Withdrawal request failed.");
      });
  };

  return (
    <div className="pn-panel">
      <div className="pn-panel-head">
        <h6>Wallet</h6>
        <small className="pn-muted">Same wallet as your Youpeak app</small>
      </div>
      <div className="pn-panel-body">
        <div className="pn-stats mb-3">
          <div className="pn-stat">
            <div className="pn-stat-label">Coins</div>
            <div className="pn-stat-value">{Number(w.coin || 0).toLocaleString("en-IN")}</div>
            <div className="pn-stat-hint">{rate} coins = ₹1</div>
          </div>
          <div className="pn-stat pn-stat-accent">
            <div className="pn-stat-label">Withdrawable</div>
            <div className="pn-stat-value">{inr(w.totalEarningAmount)}</div>
            <div className="pn-stat-hint">Minimum withdrawal {inr(minWithdraw)}</div>
          </div>
        </div>

        <div className="pn-filters mb-3">
          <input
            type="number"
            min="0"
            className="form-control"
            placeholder={minConvert ? `Coins to convert (min ${minConvert})` : "Coins to convert"}
            value={coins}
            onChange={(e) => setCoins(e.target.value)}
            aria-label="Coins to convert"
          />
          <button className="btn btn-outline-success" style={{ borderRadius: 0 }} onClick={convert} disabled={busy}>
            Convert{coins > 0 ? ` → ${inr(Number(coins) / rate)}` : ""}
          </button>
          <button
            className="btn btn-success"
            style={{ borderRadius: 0 }}
            onClick={() => setWithdrawOpen(true)}
            disabled={busy || pending || !(data.methods || []).length}
            title={pending ? "You already have a pending request" : !(data.methods || []).length ? "No payout method available yet" : ""}
          >
            Withdraw
          </button>
          {pending && <small className="pn-muted">A withdrawal is pending — you can request another once it's processed.</small>}
        </div>

        <div className="table-responsive">
          <table className="table align-middle mb-0">
            <thead><tr><th>Requested</th><th>Amount</th><th>Method</th><th>Status</th></tr></thead>
            <tbody>
              {(data.requests || []).length === 0 ? (
                <EmptyRow colSpan={4}>No withdrawal requests yet.</EmptyRow>
              ) : (
                data.requests.map((r) => {
                  const [cls, label] = REQUEST_STATUS[statusOf(r)] || ["pn-stage-muted", "—"];
                  return (
                    <tr key={r._id}>
                      <td>{fmtDate(r.createdAt || r.requestDate)}</td>
                      <td className="fw-semibold">{inr(r.requestAmount)}</td>
                      <td>{r.paymentGateway}</td>
                      <td><span className={`pn-stage ${cls}`}>{label}</span>{r.reason ? <div><small className="pn-muted">{r.reason}</small></div> : null}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {withdrawOpen && (
        <Modal
          title="Request withdrawal"
          onClose={() => setWithdrawOpen(false)}
          footer={
            <>
              <button type="button" className="btn btn-outline-secondary" onClick={() => setWithdrawOpen(false)} disabled={busy}>Cancel</button>
              <button type="submit" form="withdraw-form" className="btn btn-success" disabled={busy}>{busy ? "Sending…" : "Send request"}</button>
            </>
          }
        >
          <form id="withdraw-form" onSubmit={submitWithdraw} noValidate>
            <p className="pn-muted mb-3">Withdrawable balance {inr(w.totalEarningAmount)} · minimum {inr(minWithdraw)}. The Youpeak admin reviews and pays the request.</p>
            <div className="mb-3">
              <label className="form-label" htmlFor="wd-amount">Amount (₹) *</label>
              <input id="wd-amount" type="number" min="0" className="form-control" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} />
            </div>
            <div className="mb-3">
              <label className="form-label" htmlFor="wd-method">Payout method *</label>
              <select id="wd-method" className="form-control" value={form.methodId} onChange={(e) => setForm((f) => ({ ...f, methodId: e.target.value, details: {} }))}>
                <option value="">Choose</option>
                {data.methods.map((m) => <option key={m._id} value={m._id}>{m.name}</option>)}
              </select>
            </div>
            {method &&
              method.details.map((d, i) => (
                <div className="mb-3" key={d}>
                  <label className="form-label" htmlFor={`wd-detail-${i}`}>{d} *</label>
                  <input
                    id={`wd-detail-${i}`}
                    className="form-control"
                    value={form.details[d] || ""}
                    onChange={(e) => setForm((f) => ({ ...f, details: { ...f.details, [d]: e.target.value } }))}
                  />
                </div>
              ))}
          </form>
        </Modal>
      )}
    </div>
  );
}
