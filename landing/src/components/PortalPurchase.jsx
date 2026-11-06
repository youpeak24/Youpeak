import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Copy,
  CreditCard,
  Loader2,
  Lock,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import {
  PORTAL_CONFIG,
  createOrder,
  fetchCatalog,
  fetchCreatorTiers,
  fetchProfile,
  fetchTaskerTiers,
  orderStatus,
  verifyPayment,
} from "../lib/portal";
import { buildPlans, findPlan, inr } from "../lib/plans";
import { openCheckout } from "../lib/razorpayCheckout";

const TABS = [
  { id: "starter", label: "User passes" },
  { id: "creator", label: "Creator VIP" },
  { id: "more", label: "Partner & ads" },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default function PortalPurchase({ session, initialPlan, onLogout, onClose }) {
  const [catalog, setCatalog] = useState(null);
  const [taskerData, setTaskerData] = useState(null);
  const [creatorData, setCreatorData] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [tab, setTab] = useState("starter");

  const [selected, setSelected] = useState(null); // { plan, optionKey }
  const [phase, setPhase] = useState("browse"); // browse | confirm | paying | verifying | done | error
  const [message, setMessage] = useState("");
  const [result, setResult] = useState(null);
  const initialApplied = useRef(false);

  const load = useCallback(async () => {
    setLoadError("");
    try {
      const [cat, tasker, creator, me] = await Promise.all([
        fetchCatalog({ force: true }),
        fetchTaskerTiers().catch(() => null),
        fetchCreatorTiers().catch(() => null),
        fetchProfile().catch(() => null),
      ]);
      setCatalog(cat);
      setTaskerData(tasker);
      setCreatorData(creator);
      setProfile(me);
    } catch (e) {
      setLoadError(e.message || "Couldn't load plans.");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const plans = useMemo(() => (catalog ? buildPlans(catalog, taskerData, creatorData) : null), [catalog, taskerData, creatorData]);

  // Deep link (?plan=… from the app or a pricing card): jump to that plan.
  useEffect(() => {
    if (!plans || !initialPlan || initialApplied.current) return;
    initialApplied.current = true;
    const plan = findPlan(plans, initialPlan);
    if (!plan) return;
    setTab(plan.group);
    if (plan.status !== "included" && plan.status !== "locked") {
      setSelected({ plan, optionKey: plan.options[plan.options.length - 1].key });
      setPhase("confirm");
    }
  }, [plans, initialPlan]);

  const option = selected && selected.plan.options.find((o) => o.key === selected.optionKey);
  const payments = catalog && catalog.payments;

  const startPayment = async () => {
    if (!selected || !option) return;
    setMessage("");
    setPhase("paying");
    let order;
    try {
      order = await createOrder(option.params);
    } catch (e) {
      setMessage(e.message || "Couldn't start the payment.");
      setPhase("confirm");
      return;
    }

    let paid;
    try {
      paid = await openCheckout({
        checkout: order.checkout,
        description: selected.plan.title,
        prefill: { name: session.name || profile?.fullName || "", email: session.email },
      });
    } catch (e) {
      setMessage(e && e.failed ? `${e.message} You were not charged for a failed attempt.` : e && e.dismissed ? "Payment cancelled — you were not charged." : (e && e.message) || "Payment could not be started.");
      setPhase("confirm");
      return;
    }

    setPhase("verifying");
    try {
      let res = await verifyPayment(paid);
      // The money is taken; the pass is applied by the server. If it is still
      // finishing, check the order a few times before telling the buyer.
      const inFlight = (r) => r.status !== true && ["PENDING", "PROCESSING"].includes(r.fulfilmentStatus || r.code);
      for (let i = 0; i < 6 && inFlight(res); i++) {
        await sleep(2000);
        const st = await orderStatus(paid.orderId).catch(() => null);
        const tx = st && st.status ? st.transaction : null;
        if (tx && tx.fulfilmentStatus === "COMPLETED") res = { status: true, fulfilment: res.fulfilment };
        else if (tx && !["PENDING", "PROCESSING"].includes(tx.fulfilmentStatus)) break;
      }
      if (res.status === true) {
        setResult({ title: selected.plan.title, amountINR: order.amountInr, paymentId: paid.paymentId, credentials: res.fulfilment && res.fulfilment.portalCredentials, group: selected.plan.group });
        setPhase("done");
        load();
      } else {
        setMessage(
          res.message
            ? `${res.message} Payment reference: ${paid.paymentId}. If your pass doesn't appear within a few minutes, contact support with this reference — you will not be charged twice.`
            : `Payment received (${paid.paymentId}) but we couldn't confirm it yet. Contact support with this reference.`,
        );
        setPhase("error");
      }
    } catch (e) {
      setMessage(`${e.message || "We couldn't confirm the payment."} Payment reference: ${paid.paymentId}. Contact support with this reference if the pass doesn't appear.`);
      setPhase("error");
    }
  };

  const back = () => {
    setPhase("browse");
    setSelected(null);
    setMessage("");
    setResult(null);
  };

  /* ── header ───────────────────────────────────────────────────────────── */
  const header = (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h3 className="font-display font-black text-xl text-slate-900 truncate">{session.name || profile?.fullName || "Your account"}</h3>
        <p className="text-xs text-slate-500 truncate">{session.email}</p>
        {profile && (
          <p className="text-[11px] text-slate-500 mt-1">
            {Number(profile.coin || 0).toLocaleString("en-IN")} coins
            {profile.uniqueId ? ` · ID ${profile.uniqueId}` : ""}
          </p>
        )}
      </div>
      <button onClick={onLogout} className="shrink-0 inline-flex items-center gap-1.5 text-xs font-bold text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg">
        <LogOut className="w-3.5 h-3.5" /> Log out
      </button>
    </div>
  );

  /* ── done ─────────────────────────────────────────────────────────────── */
  if (phase === "done" && result) {
    return (
      <div className="p-6 sm:p-8 text-center space-y-5 overflow-y-auto">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <div>
          <h3 className="font-display font-black text-2xl text-slate-900">Payment successful</h3>
          <p className="text-sm text-slate-600 mt-2">
            <strong>{result.title}</strong> ({inr(result.amountINR)}) is now active on <strong>{session.email}</strong>.
          </p>
          <p className="text-xs text-slate-500 mt-1">Payment ID: {result.paymentId}</p>
        </div>
        {result.credentials && (
          <div className="text-left p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2">
            <div className="font-bold">Your Digital Partner dashboard login — save this now</div>
            <div>
              Sign in at{" "}
              <a className="underline font-semibold" href={PORTAL_CONFIG.adminPanelUrl} target="_blank" rel="noreferrer">
                {PORTAL_CONFIG.adminPanelUrl.replace(/^https?:\/\//, "")}
              </a>
            </div>
            <div className="font-mono bg-white/70 rounded-lg p-2 break-all">
              {result.credentials.email}
              <br />
              {result.credentials.password}
            </div>
            <button
              type="button"
              onClick={() => navigator.clipboard && navigator.clipboard.writeText(`${result.credentials.email}\n${result.credentials.password}`)}
              className="inline-flex items-center gap-1.5 font-bold"
            >
              <Copy className="w-3.5 h-3.5" /> Copy login
            </button>
            <div>This password is shown only once. Change it after your first login.</div>
          </div>
        )}
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-xs text-emerald-800 text-left space-y-1">
          <div className="font-bold flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" /> Next step
          </div>
          <div>Open the YouPeak app and sign in with {session.email}. Your purchase syncs automatically.</div>
        </div>
        <div className="flex gap-3">
          <button onClick={back} className="flex-1 btn-ghost text-sm !py-3">Buy something else</button>
          <button onClick={onClose} className="flex-1 btn-primary text-sm !py-3">Done</button>
        </div>
      </div>
    );
  }

  /* ── confirm / paying / verifying / error ─────────────────────────────── */
  if (selected && option && phase !== "browse") {
    const busy = phase === "paying" || phase === "verifying";
    return (
      <div className="p-6 sm:p-8 space-y-5 overflow-y-auto">
        {!busy && phase !== "error" && (
          <button onClick={back} className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-900">
            <ArrowLeft className="w-3.5 h-3.5" /> All plans
          </button>
        )}
        <div>
          <h3 className="font-display font-black text-2xl text-slate-900">{selected.plan.title}</h3>
          <p className="text-xs text-slate-500 mt-1">{selected.plan.blurb}</p>
        </div>

        {selected.plan.options.length > 1 && (
          <div className="grid grid-cols-2 gap-2">
            {selected.plan.options.map((o) => (
              <button
                key={o.key}
                type="button"
                disabled={busy}
                onClick={() => setSelected({ plan: selected.plan, optionKey: o.key })}
                className={`p-3 rounded-xl text-left border-2 transition-all ${o.key === selected.optionKey ? "border-emerald-500 bg-emerald-50/60" : "border-slate-200 hover:border-slate-300"}`}
              >
                <div className="text-[11px] font-bold text-slate-600">{o.label}</div>
                <div className="font-black text-slate-900">{inr(o.priceINR)}</div>
                {o.listPriceINR > o.priceINR && <div className="text-[10px] text-slate-400 line-through">{inr(o.listPriceINR)}</div>}
              </button>
            ))}
          </div>
        )}

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
          <div className="flex justify-between text-slate-600"><span>Account</span><span className="font-bold text-slate-900">{session.email}</span></div>
          <div className="flex justify-between text-slate-600"><span>Plan</span><span className="font-bold text-slate-900">{selected.plan.title}{selected.plan.options.length > 1 ? ` · ${option.label}` : ""}</span></div>
          <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-black text-slate-900">
            <span>Total</span><span className="text-emerald-600 text-lg">{inr(option.priceINR)}</span>
          </div>
        </div>

        {message && (
          <div role="alert" className={`p-3 rounded-xl text-xs flex gap-2 ${phase === "error" ? "bg-red-50 text-red-800 border border-red-200" : "bg-amber-50 text-amber-900 border border-amber-200"}`}>
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /> <span>{message}</span>
          </div>
        )}

        {phase === "error" ? (
          <div className="flex gap-3">
            <button onClick={back} className="flex-1 btn-ghost text-sm !py-3">Back to plans</button>
            <button onClick={onClose} className="flex-1 btn-primary text-sm !py-3">Close</button>
          </div>
        ) : !payments || !payments.enabled ? (
          <div className="p-3 rounded-xl text-xs bg-slate-100 text-slate-700">
            Online payment isn't available right now. Please try again later or contact support.
          </div>
        ) : (
          <button onClick={startPayment} disabled={busy} className="w-full btn-primary text-sm !py-3 flex items-center justify-center gap-2 disabled:opacity-70">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
            {phase === "paying" ? "Opening secure checkout…" : phase === "verifying" ? "Confirming payment…" : `Pay ${inr(option.priceINR)} securely`}
          </button>
        )}

        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 text-center">
          <Lock className="w-3.5 h-3.5 text-emerald-600" />
          Payments are processed by Razorpay (UPI, cards, netbanking, wallets). YouPeak never sees your card details.
        </div>
      </div>
    );
  }

  /* ── browse ───────────────────────────────────────────────────────────── */
  const list = plans ? plans[tab] : [];
  return (
    <div className="p-6 sm:p-8 space-y-5 overflow-y-auto">
      {header}

      <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${tab === t.id ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loadError && (
        <div role="alert" className="p-3 rounded-xl text-xs bg-red-50 text-red-800 border border-red-200">
          {loadError}{" "}
          <button className="underline font-bold" onClick={load}>Retry</button>
        </div>
      )}
      {!plans && !loadError && (
        <div className="py-10 flex justify-center text-slate-400"><Loader2 className="w-6 h-6 animate-spin" /></div>
      )}
      {plans && payments && !payments.enabled && (
        <div className="p-3 rounded-xl text-xs bg-amber-50 text-amber-900 border border-amber-200">
          Online payment is temporarily unavailable. You can still browse plans.
        </div>
      )}
      {plans && list.length === 0 && <p className="text-sm text-slate-500 text-center py-6">Nothing to buy here right now.</p>}

      <div className="space-y-3">
        {list.map((p) => {
          const lowest = Math.min(...p.options.map((o) => o.priceINR));
          const disabled = p.status === "included" || p.status === "locked";
          return (
            <div key={p.id} className={`p-4 rounded-2xl border ${p.status === "current" ? "border-emerald-400 bg-emerald-50/40" : "border-slate-200 bg-white"} ${disabled ? "opacity-70" : ""}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-display font-black text-sm text-slate-900">{p.title}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{p.blurb}</div>
                  {p.note && <div className={`text-[11px] mt-1 font-semibold ${p.status === "locked" ? "text-amber-700" : "text-emerald-700"}`}>{p.note}</div>}
                </div>
                <div className="text-right shrink-0">
                  <div className="font-black text-slate-900">{p.options.length > 1 ? `from ${inr(lowest)}` : inr(lowest)}</div>
                  <button
                    disabled={disabled}
                    onClick={() => {
                      setSelected({ plan: p, optionKey: p.options[p.options.length - 1].key });
                      setPhase("confirm");
                      setMessage("");
                    }}
                    className="mt-1.5 btn-primary !py-1.5 !px-4 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {p.status === "current" ? "Renew / extend" : "Buy"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-[11px] text-slate-400 text-center leading-relaxed">
        Prices are set by YouPeak. Check pass duration, renewal, refund and earning rules in the terms before you buy; earnings are not guaranteed.
      </p>
    </div>
  );
}
