import React, { useEffect, useState } from "react";
import { AlertTriangle, ArrowRight, Eye, EyeOff, Loader2, Lock, Mail, ShieldCheck, User, X } from "lucide-react";
import {
  PortalError,
  accountState,
  sendEmailOtp,
  sendResetOtp,
  setNewPassword,
  signInWithPassword,
  verifyEmailOtp,
} from "../lib/portal";
import { POLICY_LINKS } from "../config/site";
import PortalPurchase from "./PortalPurchase";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const inputCls =
  "w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500";

function Field({ label, icon: Icon, right, ...props }) {
  return (
    <div>
      <label className="text-xs font-bold text-slate-700 block mb-1">{label}</label>
      <div className="relative">
        {Icon && <Icon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />}
        <input {...props} className={`${inputCls} ${right ? "pr-11" : ""}`} />
        {right}
      </div>
    </div>
  );
}

/**
 * YouPeak account + purchase window. Same accounts as the app: email and
 * password (verified with the same email OTP), then the web membership portal.
 *
 * intent = { mode: "login" | "signup", plan?: string }  (plan = tier id to buy after signing in)
 */
export default function AuthModal({ isOpen, onClose, intent = {}, session, onAuthSuccess, onLogout }) {
  const [mode, setMode] = useState(intent.mode === "login" ? "login" : "signup"); // login | signup | forgot
  const [step, setStep] = useState("details"); // details | otp | reset
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [otp, setOtp] = useState("");
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const switchMode = (next) => {
    setMode(next);
    setStep("details");
    setOtp("");
    setError("");
    setInfo("");
  };

  const run = async (fn) => {
    setError("");
    setInfo("");
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof PortalError ? e.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const cleanEmail = email.trim().toLowerCase();

  const validEmail = () => {
    if (!EMAIL_RE.test(cleanEmail)) {
      setError("Please enter a valid email address.");
      return false;
    }
    return true;
  };

  /* ── sign up ──────────────────────────────────────────────────────────── */
  const submitSignup = (e) => {
    e.preventDefault();
    if (step === "otp") return finishSignup();
    if (name.trim().length < 2) return setError("Please enter your full name.");
    if (!validEmail()) return undefined;
    if (password.length < 6) return setError("Choose a password with at least 6 characters.");
    if (!agree) return setError("Please accept the Terms and Privacy Policy to continue.");
    return run(async () => {
      const state = await accountState({ email: cleanEmail, password });
      if (state !== "NEW") {
        setError("An account with this email already exists. Please log in instead.");
        return;
      }
      await sendEmailOtp(cleanEmail);
      setStep("otp");
      setInfo(`We emailed a 4-digit code to ${cleanEmail}. It expires in 5 minutes.`);
    });
  };

  const finishSignup = () => {
    if (!/^\d{4}$/.test(otp.trim())) return setError("Enter the 4-digit code from your email.");
    return run(async () => {
      await verifyEmailOtp(cleanEmail, otp.trim());
      const { session: s } = await signInWithPassword({ email: cleanEmail, password, fullName: name.trim() });
      onAuthSuccess?.(s);
    });
  };

  /* ── log in ───────────────────────────────────────────────────────────── */
  const submitLogin = (e) => {
    e.preventDefault();
    if (!validEmail()) return undefined;
    if (!password) return setError("Enter your password.");
    return run(async () => {
      const state = await accountState({ email: cleanEmail, password });
      if (state === "NEW") {
        setError("No email-and-password account found for this address. Sign up first — or, if you joined with Google or a phone number, use the YouPeak app.");
        return;
      }
      if (state === "EXISTS_WRONG_PASSWORD") {
        setError("That password doesn't match this account.");
        return;
      }
      const { session: s } = await signInWithPassword({ email: cleanEmail, password });
      onAuthSuccess?.(s);
    });
  };

  /* ── forgot password ──────────────────────────────────────────────────── */
  const submitForgot = (e) => {
    e.preventDefault();
    if (step === "details") {
      if (!validEmail()) return undefined;
      return run(async () => {
        await sendResetOtp(cleanEmail);
        setStep("otp");
        setInfo(`We emailed a 4-digit code to ${cleanEmail}.`);
      });
    }
    if (step === "otp") {
      if (!/^\d{4}$/.test(otp.trim())) return setError("Enter the 4-digit code from your email.");
      return run(async () => {
        await verifyEmailOtp(cleanEmail, otp.trim());
        setStep("reset");
        setPassword("");
        setInfo("Code verified. Choose a new password.");
      });
    }
    if (password.length < 6) return setError("Choose a password with at least 6 characters.");
    return run(async () => {
      await setNewPassword(cleanEmail, password);
      const { session: s } = await signInWithPassword({ email: cleanEmail, password });
      onAuthSuccess?.(s);
    });
  };

  const resend = () =>
    run(async () => {
      await (mode === "forgot" ? sendResetOtp(cleanEmail) : sendEmailOtp(cleanEmail));
      setInfo("A new code is on its way.");
    });

  const submit = mode === "signup" ? submitSignup : mode === "login" ? submitLogin : submitForgot;
  const title =
    mode === "signup" ? "Create your YouPeak account" : mode === "login" ? "Log in to YouPeak" : step === "reset" ? "Set a new password" : "Reset your password";
  const subtitle =
    mode === "signup"
      ? "One account for the website and the app. Buy passes here, then sign in to the app with the same email."
      : mode === "login"
        ? "Use the email and password you use in the YouPeak app."
        : "We'll email you a code to confirm it's you.";
  const cta = busy
    ? "Please wait…"
    : mode === "signup"
      ? step === "otp" ? "Verify & create account" : "Send verification code"
      : mode === "login"
        ? "Log in"
        : step === "details" ? "Send code" : step === "otp" ? "Verify code" : "Save password & log in";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={session ? "YouPeak account and purchases" : title}
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
        style={{ animation: "scale-up 0.25s ease-out" }}
      >
        <div className="h-1.5 bg-gradient-to-r from-emerald-500 via-violet-500 to-amber-500 shrink-0" />
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors z-10" aria-label="Close">
          <X className="w-5 h-5" />
        </button>

        {session ? (
          <PortalPurchase session={session} initialPlan={intent.plan} onLogout={onLogout} onClose={onClose} />
        ) : (
          <div className="p-6 sm:p-8 space-y-5 overflow-y-auto">
            {mode !== "forgot" && (
              <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200 mr-10">
                {[["signup", "Sign up"], ["login", "Log in"]].map(([id, label]) => (
                  <button key={id} type="button" onClick={() => switchMode(id)} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${mode === id ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"}`}>
                    {label}
                  </button>
                ))}
              </div>
            )}

            <div>
              <h3 className="font-display font-black text-2xl text-slate-900">{title}</h3>
              <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
              {intent.plan && mode === "signup" && (
                <p className="text-xs text-emerald-700 font-semibold mt-2">After you sign up you'll go straight to checkout for your selected plan.</p>
              )}
            </div>

            <form onSubmit={submit} className="space-y-4" noValidate>
              {mode === "signup" && step === "details" && (
                <Field label="Full name" icon={User} type="text" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Vijay Sharma" />
              )}

              {(step === "details" || mode !== "forgot") && step !== "reset" && (
                <Field
                  label="Email"
                  icon={Mail}
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  value={email}
                  disabled={step === "otp"}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              )}

              {((mode === "signup" && step === "details") || mode === "login" || (mode === "forgot" && step === "reset")) && (
                <Field
                  label={mode === "forgot" ? "New password" : "Password"}
                  icon={Lock}
                  type={showPw ? "text" : "password"}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === "login" ? "Your password" : "At least 6 characters"}
                  right={
                    <button type="button" onClick={() => setShowPw((v) => !v)} aria-label={showPw ? "Hide password" : "Show password"} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                />
              )}

              {step === "otp" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Verification code</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={4}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    placeholder="4-digit code"
                    autoFocus
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-center font-mono font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                  <button type="button" disabled={busy} onClick={resend} className="text-xs font-bold text-emerald-700 hover:underline">
                    Resend code
                  </button>
                </div>
              )}

              {mode === "signup" && step === "details" && (
                <label className="flex items-start gap-2 text-[11px] text-slate-600 leading-snug cursor-pointer">
                  <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 accent-emerald-600" />
                  <span>
                    I agree to the{" "}
                    <a href={POLICY_LINKS.terms} target="_blank" rel="noreferrer" className="underline font-semibold">Terms</a> and{" "}
                    <a href={POLICY_LINKS.privacy} target="_blank" rel="noreferrer" className="underline font-semibold">Privacy Policy</a>.
                  </span>
                </label>
              )}

              {info && <div role="status" className="p-3 rounded-xl text-xs bg-emerald-50 text-emerald-800 border border-emerald-200">{info}</div>}
              {error && (
                <div role="alert" className="p-3 rounded-xl text-xs bg-red-50 text-red-800 border border-red-200 flex gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /> <span>{error}</span>
                </div>
              )}

              <button type="submit" disabled={busy} className="w-full btn-primary text-sm !py-3 flex items-center justify-center gap-2 disabled:opacity-70">
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {cta}
                {!busy && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>

            <div className="flex items-center justify-between text-xs">
              {mode === "login" ? (
                <button type="button" onClick={() => switchMode("forgot")} className="font-bold text-emerald-700 hover:underline">Forgot password?</button>
              ) : mode === "forgot" ? (
                <button type="button" onClick={() => switchMode("login")} className="font-bold text-emerald-700 hover:underline">Back to log in</button>
              ) : <span />}
              <span className="text-slate-400">Joined with Google or phone? Use the YouPeak app.</span>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-400 text-center">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              Your password is stored securely (hashed) and never shown to anyone.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
