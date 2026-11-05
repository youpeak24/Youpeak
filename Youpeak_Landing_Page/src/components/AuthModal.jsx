import React, { useState } from "react";
import {
  X,
  ShieldCheck,
  CheckCircle2,
  Lock,
  User,
  ArrowRight,
  CreditCard,
  Sparkles,
  LogOut,
} from "lucide-react";

const PASS_OPTIONS = [
  {
    id: "free",
    name: "Free User",
    price: 0,
    priceLabel: "₹0 Free",
    color: "from-gray-500 to-gray-600",
  },
  {
    id: "bronze",
    name: "Bronze Starter",
    price: 990,
    priceLabel: "₹990",
    color: "from-amber-600 to-yellow-600",
  },
  {
    id: "silver",
    name: "Silver Intermediate",
    price: 2490,
    priceLabel: "₹2,490",
    color: "from-emerald-500 to-cyan-500",
    popular: true,
  },
  {
    id: "gold",
    name: "Gold Advanced",
    price: 4990,
    priceLabel: "₹4,990",
    color: "from-yellow-500 to-amber-600",
  },
  {
    id: "platinum",
    name: "Platinum Regional Pro",
    price: 9990,
    priceLabel: "₹9,990",
    color: "from-violet-500 to-purple-600",
  },
  {
    id: "diamond",
    name: "Diamond Pass",
    price: 24990,
    priceLabel: "₹24,990/yr",
    color: "from-cyan-400 to-blue-600",
  },
];

export default function AuthModal({
  isOpen,
  onClose,
  initialTier = "free",
  currentUser,
  onAuthSuccess,
  onLogout,
}) {
  const [tab, setTab] = useState("signup"); // "signup" or "login"
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedPass, setSelectedPass] = useState(initialTier);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStep, setPaymentStep] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const currentPassObj =
    PASS_OPTIONS.find((p) => p.id === selectedPass) || PASS_OPTIONS[0];

  const handleSendOtp = (e) => {
    e.preventDefault();
    if (!phone || phone.length < 10) {
      alert("Please enter a valid 10-digit mobile number.");
      return;
    }
    setOtpSent(true);
    setOtp("5421"); // instant mock OTP for easy verification
  };

  const handleRegisterOrPay = (e) => {
    e.preventDefault();
    if (!otpSent) {
      handleSendOtp(e);
      return;
    }
    if (currentPassObj.price > 0 && !paymentStep) {
      setPaymentStep(true);
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      const user = {
        name: name || "YouPeak Member",
        phone,
        pass: currentPassObj.name,
        passId: currentPassObj.id,
        registeredAt: new Date().toLocaleDateString("en-IN"),
      };
      localStorage.setItem("youpeak_user", JSON.stringify(user));
      onAuthSuccess?.(user);
      setSuccess(true);
    }, 1200);
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (!phone || phone.length < 10) {
      alert("Please enter a valid 10-digit mobile number.");
      return;
    }
    if (!otpSent) {
      setOtpSent(true);
      setOtp("5421");
      return;
    }
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      const user = {
        name: "Vijay S.",
        phone,
        pass: "Silver Intermediate",
        passId: "silver",
        registeredAt: new Date().toLocaleDateString("en-IN"),
      };
      localStorage.setItem("youpeak_user", JSON.stringify(user));
      onAuthSuccess?.(user);
      setSuccess(true);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="YouPeak account and pass demonstration"
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
        style={{ animation: "scale-up 0.25s ease-out" }}
      >
        {/* TOP ACCENT BAR */}
        <div className="h-1.5 bg-gradient-to-r from-emerald-500 via-violet-500 to-amber-500" />

        {/* CLOSE BUTTON */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors z-10"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* LOGGED IN VIEW */}
        {currentUser ? (
          <div className="p-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center text-xl font-black border-2 border-emerald-500 shadow-md">
              {currentUser.name
                ? currentUser.name.slice(0, 2).toUpperCase()
                : "YP"}
            </div>
            <div>
              <h3 className="font-display font-black text-2xl text-slate-900">
                {currentUser.name}
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                +91 {currentUser.phone}
              </p>
              <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Sparkles className="w-3.5 h-3.5" />
                Active Pass: {currentUser.pass || "Free User"}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left text-xs space-y-2 text-slate-600">
              <div className="flex justify-between">
                <span>Registration Status:</span>
                <span className="font-bold text-emerald-600">
                  Verified & Active
                </span>
              </div>
              <div className="flex justify-between">
                <span>Account Sync:</span>
                <span className="font-bold text-slate-900">
                  Direct Web Portal
                </span>
              </div>
              <div className="flex justify-between">
                <span>In-App Linked Device:</span>
                <span className="font-bold text-slate-900">
                  +91 {currentUser.phone}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  onLogout?.();
                  localStorage.removeItem("youpeak_user");
                  onClose();
                }}
                className="flex-1 btn-ghost !py-3 text-red-600 hover:bg-red-50 hover:text-red-700 flex items-center justify-center gap-2 text-sm font-bold"
              >
                <LogOut className="w-4 h-4" /> Log Out
              </button>
              <button
                onClick={onClose}
                className="flex-1 btn-primary text-sm !py-3"
              >
                Done
              </button>
            </div>
          </div>
        ) : success ? (
          /* SUCCESS SCREEN */
          <div className="p-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-lg">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div>
              <h3 className="font-display font-black text-2xl text-slate-900">
                {paymentStep
                  ? "Payment & Registration Successful!"
                  : "Account Registered!"}
              </h3>
              <p className="text-sm text-slate-500 mt-2">
                Your <strong>{currentPassObj.name}</strong> is now linked to{" "}
                <strong>+91 {phone}</strong>.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-xs text-emerald-800 text-left space-y-1.5">
              <div className="font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" /> Next Steps:
              </div>
              <div>
                1. Install the YouPeak app on your Android or iOS device.
              </div>
              <div>
                2. Log in using mobile number +91 {phone} to sync your active
                pass.
              </div>
              <div>
                3. Watch daily videos & ads to collect reward coins directly!
              </div>
            </div>

            <button
              onClick={() => {
                setSuccess(false);
                setPaymentStep(false);
                onClose();
              }}
              className="w-full btn-primary text-sm !py-3"
            >
              Continue to Website
            </button>
          </div>
        ) : paymentStep ? (
          /* PAYMENT STEP */
          <div className="p-8 space-y-6 overflow-y-auto">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 mb-2">
                <CreditCard className="w-3.5 h-3.5" /> Demo Checkout
              </div>
              <h3 className="font-display font-black text-2xl text-slate-900">
                Pay to Register & Activate Pass
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Complete direct website payment to activate your{" "}
                {currentPassObj.name}
              </p>
            </div>

            {/* ORDER SUMMARY */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Selected Pass:</span>
                <span className="font-bold text-slate-900">
                  {currentPassObj.name}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Registration User:</span>
                <span className="font-bold text-slate-900">
                  {name || "New User"} (+91 {phone})
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Ad Credits Matched:</span>
                <span className="font-bold text-emerald-600">
                  Credit amount shown in plan summary
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-black text-slate-900">
                <span>Total Amount:</span>
                <span className="text-emerald-600 text-lg">
                  ₹{currentPassObj.price.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            {/* PAYMENT METHOD SELECTOR */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">
                Select Payment Mode
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs font-bold text-slate-700">
                <div className="p-3 rounded-xl border-2 border-emerald-500 bg-emerald-50/50 flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  UPI (GPay / PhonePe / Paytm)
                </div>
                <div className="p-3 rounded-xl border border-slate-200 bg-white flex items-center gap-2 text-slate-500">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                  Cards & NetBanking
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setPaymentStep(false)}
                className="btn-ghost text-xs !py-3"
              >
                Back
              </button>
              <button
                onClick={handleRegisterOrPay}
                disabled={isProcessing}
                className="flex-1 btn-primary text-sm !py-3 flex items-center justify-center gap-2"
              >
                {isProcessing
                  ? "Processing Payment..."
                  : `Pay ₹${currentPassObj.price.toLocaleString("en-IN")} & Complete`}
              </button>
            </div>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
              <Lock className="w-3.5 h-3.5 text-emerald-600" /> Do not enter real
              payment credentials in this demo
            </div>
          </div>
        ) : (
          /* REGISTRATION / LOGIN FORM */
          <div className="p-8 space-y-6 overflow-y-auto">
            {/* TABS */}
            <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200">
              <button
                onClick={() => setTab("signup")}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                  tab === "signup"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Register & Pay
              </button>
              <button
                onClick={() => setTab("login")}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                  tab === "login"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Log In
              </button>
            </div>

            <div>
              <h3 className="font-display font-black text-2xl text-slate-900">
                {tab === "signup"
                  ? "Create Account & Activate Pass"
                  : "Log In to Your Portal"}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {tab === "signup"
                  ? "Sign up directly on the website to activate your pass and start collecting coins"
                  : "Enter your registered mobile number to manage your passes and payouts"}
              </p>
            </div>

            <form
              onSubmit={tab === "signup" ? handleRegisterOrPay : handleLogin}
              className="space-y-4"
            >
              {tab === "signup" && (
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Vijay S."
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Mobile Number (for OTP & UPI)
                </label>
                <div className="relative">
                  <span className="text-xs font-bold text-slate-500 absolute left-3 top-1/2 -translate-y-1/2">
                    +91
                  </span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={phone}
                    onChange={(e) =>
                      setPhone(e.target.value.replace(/\D/g, ""))
                    }
                    placeholder="9876543210"
                    className="w-full pl-12 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* OTP FIELD */}
              {otpSent && (
                <div className="space-y-1.5 animate-fade-in">
                  <div className="flex justify-between items-center text-xs">
                    <label className="font-bold text-slate-700">
                      Enter OTP
                    </label>
                    <span className="text-emerald-600 font-bold">
                      Auto-sent: 5421
                    </span>
                  </div>
                  <input
                    type="text"
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Enter 4-digit OTP"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-center font-mono font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              )}

              {/* PASS SELECTION (SIGN UP ONLY) */}
              {tab === "signup" && (
                <div className="space-y-2 pt-2 border-t border-slate-200">
                  <label className="text-xs font-bold text-slate-700 block">
                    Select User Pass to Activate
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {PASS_OPTIONS.map((p) => (
                      <button
                        type="button"
                        key={p.id}
                        onClick={() => setSelectedPass(p.id)}
                        className={`p-2.5 rounded-xl text-left border transition-all ${
                          selectedPass === p.id
                            ? "border-emerald-500 bg-emerald-50/60 shadow-sm"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <div className="text-[11px] font-bold text-slate-800 truncate">
                          {p.name}
                        </div>
                        <div className="text-[12px] font-black text-slate-900 mt-0.5">
                          {p.priceLabel}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full btn-primary text-sm !py-3 flex items-center justify-center gap-2"
              >
                {isProcessing
                  ? "Verifying..."
                  : !otpSent
                    ? "Get OTP to Continue"
                    : tab === "signup" && currentPassObj.price > 0
                      ? `Proceed to Pay ${currentPassObj.priceLabel}`
                      : tab === "signup"
                        ? "Complete Free Registration"
                        : "Log In to Account"}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-400 text-center">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Demonstration registration interface. Verify official purchase terms before paying.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
