import React, { useState } from "react";
import {
  Sparkles,
  ArrowRight,
  Wallet,
  Coins,
  Film,
  Calendar,
  CheckCircle2,
  Zap,
  TrendingUp,
  Eye,
} from "lucide-react";

const TIERS = [
  {
    id: "free",
    name: "Free",
    fullName: "Level 1 User (Free)",
    price: 0,
    priceLabel: "Free",
    cap: 1000,
    capINR: 10,
    monthlyCap: 300,
    multiplier: "1x",
    multiplierVal: 1.0,
    referralCap: 5000,
    referralLabel: "1x Multiplier (Cap: ₹5,000/mo)",
  },
  {
    id: "bronze",
    name: "Bronze",
    fullName: "Bronze User (Starter)",
    price: 990,
    priceLabel: "₹990",
    cap: 2000,
    capINR: 20,
    monthlyCap: 600,
    commission10: 99,
    multiplier: "~2.3x",
    multiplierVal: 2.301,
    referralCap: 10000,
    referralLabel: "~2.3x Multiplier (Cap: ₹10,000/mo)",
  },
  {
    id: "silver",
    name: "Silver",
    fullName: "Silver User (Intermediate)",
    price: 2490,
    priceLabel: "₹2,490",
    cap: 4000,
    capINR: 40,
    monthlyCap: 1200,
    commission10: 249,
    multiplier: "~5.7x",
    multiplierVal: 5.753,
    referralCap: 25000,
    referralLabel: "~5.7x Multiplier (Cap: ₹25,000/mo)",
  },
  {
    id: "gold",
    name: "Gold",
    fullName: "Gold User (Advanced)",
    price: 4990,
    priceLabel: "₹4,990",
    cap: 12000,
    capINR: 120,
    monthlyCap: 3600,
    commission10: 499,
    multiplier: "~11.5x",
    multiplierVal: 11.507,
    referralCap: 50000,
    referralLabel: "~11.5x Multiplier (Cap: ₹50,000/mo)",
  },
  {
    id: "platinum",
    name: "Platinum",
    fullName: "Platinum User (Regional Pro)",
    price: 9990,
    priceLabel: "₹9,990",
    cap: 16667,
    capINR: 166.67,
    monthlyCap: 5000,
    commission10: 999,
    multiplier: "~19.3x",
    multiplierVal: 19.332,
    referralCap: 84000,
    referralLabel: "~19.3x Multiplier (Cap: ₹84,000/mo)",
  },
  {
    id: "diamond",
    name: "Diamond",
    fullName: "Diamond Pass (Special Pass)",
    price: 24990,
    priceLabel: "₹24,990",
    cap: 33333,
    capINR: 333.33,
    monthlyCap: 10000,
    commission10: 2499,
    multiplier: "~23x",
    multiplierVal: 23.014,
    referralCap: 100000,
    referralLabel: "~23x Multiplier (Cap: ₹1,00,000/mo)",
  },
];

const CREATOR_TIERS = [
  {
    id: "classic",
    name: "Classic",
    fullName: "Classic Pass",
    level: "Level 1",
    priceLabel: "Free",
    subs: "0+ Subs",
    longSplit: 0.5,
    shortsSplit: 0.5,
    fanFundingSplit: 0.7,
    badge: "Always Free",
    color: "from-gray-500 to-gray-600",
  },
  {
    id: "starter",
    name: "Starter VIP",
    fullName: "Starter VIP Pass",
    level: "Level 2",
    priceLabel: "₹4,999/yr",
    subs: "< 5,000 Subs",
    longSplit: 0.6,
    shortsSplit: 0.55,
    fanFundingSplit: 0.8,
    badge: "Launch Special",
    color: "from-emerald-500 to-teal-500",
  },
  {
    id: "silver",
    name: "Silver VIP",
    fullName: "Silver VIP Pass",
    level: "Level 3",
    priceLabel: "₹2,999/yr",
    subs: "5K–25K Subs",
    longSplit: 0.65,
    shortsSplit: 0.6,
    fanFundingSplit: 0.85,
    badge: "5K–25K Subs",
    color: "from-blue-500 to-cyan-500",
  },
  {
    id: "gold",
    name: "Gold VIP",
    fullName: "Gold VIP Pass",
    level: "Level 4",
    priceLabel: "₹1,499/yr",
    subs: "25K–100K Subs",
    longSplit: 0.75,
    shortsSplit: 0.65,
    fanFundingSplit: 0.9,
    badge: "25K–100K Subs",
    color: "from-amber-400 to-orange-500",
  },
  {
    id: "platinum",
    name: "Platinum VIP",
    fullName: "Platinum VIP Pass",
    level: "Level 5",
    priceLabel: "Free (100K+)",
    subs: "100,000+ Subs",
    longSplit: 0.8,
    shortsSplit: 0.7,
    fanFundingSplit: 0.9,
    badge: "Auto-Unlocked",
    color: "from-violet-500 to-purple-600",
  },
];

function Slider({
  label,
  icon,
  val,
  min,
  max,
  step,
  onChange,
  colorClass,
  hint,
  formatVal,
}) {
  const pct = ((val - min) / (max - min)) * 100;
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <span className="flex items-center gap-2 text-sm font-bold text-slate-700">
          <img
            src={`/assets/icons/${icon}.webp`}
            alt=""
            width="256"
            height="256"
            loading="lazy"
            className="w-8 h-8 object-contain"
          />
          {label}
        </span>
        <span className={`text-sm font-black font-mono ${colorClass}`}>
          {formatVal
            ? formatVal(val)
            : typeof val === "number"
              ? val.toLocaleString()
              : val}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={val}
        aria-label={label}
        onChange={(e) => onChange(Number(e.target.value))}
        className={`w-full h-2 rounded-full cursor-pointer outline-none appearance-none`}
        style={{
          background: `linear-gradient(to right, ${colorClass.includes("emerald") ? "#10b981" : colorClass.includes("violet") || colorClass.includes("purple") ? "#8b5cf6" : "#f59e0b"} ${pct}%, rgba(15,23,42,0.1) ${pct}%)`,
        }}
      />
      <div className="flex justify-between text-[10px] text-slate-400">
        <span>{hint[0]}</span>
        <span>{hint[1]}</span>
      </div>
    </div>
  );
}

export default function EarningsCalculator({ onOpenQr }) {
  // Mode switcher: "user" (Watch & Earn) or "creator" (Produce & Monetize)
  const [calcMode, setCalcMode] = useState("user");

  // User state
  const [tier, setTier] = useState("free");
  const [watch, setWatch] = useState(120); // 120 mins (2 hrs req done)
  const [engage, setEngage] = useState(20); // 20 actions (10 likes + 5 comments + ads)
  const [refs, setRefs] = useState(0); // 0 refs so Free starts clean at ₹10.00 / day (₹300/mo)

  const activeTier = TIERS.find((t) => t.id === tier) || TIERS[0];

  // Activity score scales smoothly with user engagement
  const watchFactor = Math.min(1.0, watch / 120);
  const engageFactor = Math.min(1.0, engage / 20);
  const activityIntensity = Math.min(
    1.0,
    0.3 + watchFactor * 0.45 + engageFactor * 0.25,
  );
  const dailyINR = Math.min(
    activeTier.capINR,
    Math.round(activeTier.capINR * activityIntensity * 100) / 100,
  );
  const monthlyTasks = Math.min(
    activeTier.monthlyCap,
    Math.round(dailyINR * 30),
  );
  const basePerRef = 4345 / 30;
  const rawReferrals = refs * basePerRef * activeTier.multiplierVal;
  const monthlyReferrals = Math.min(
    activeTier.referralCap,
    Math.round(rawReferrals),
  );
  const monthly = Math.round(monthlyTasks + monthlyReferrals);
  const displayed = monthly;

  // Creator state
  const [creatorTier, setCreatorTier] = useState("starter");
  const [longViews, setLongViews] = useState(50000);
  const [shortsViews, setShortsViews] = useState(250000);
  const [fanFunding, setFanFunding] = useState(5000);

  const activeCreatorTier =
    CREATOR_TIERS.find((t) => t.id === creatorTier) || CREATOR_TIERS[1];

  // Creator monetization math:
  // Long-video gross ad pool ~₹80/1K views
  const grossLong = (longViews / 1000) * 80;
  const creatorLongRev = Math.round(grossLong * activeCreatorTier.longSplit);

  // Shorts gross pool ~₹16/1K views
  const grossShorts = (shortsViews / 1000) * 16;
  const creatorShortsRev = Math.round(
    grossShorts * activeCreatorTier.shortsSplit,
  );

  // Direct UPI fan funding / channel tips
  const creatorFanRev = Math.round(
    fanFunding * activeCreatorTier.fanFundingSplit,
  );

  const creatorTotalMonthly = Math.round(
    creatorLongRev + creatorShortsRev + creatorFanRev,
  );
  const displayedCreator = creatorTotalMonthly;

  const userComparison = () => {
    if (monthly < 500)
      return {
        emoji: "emoji_thumbs_up",
        text: "Illustrative estimate under the selected assumptions.",
      };
    if (monthly < 2000)
      return {
        emoji: "emoji_party",
        text: "Illustrative estimate under the selected assumptions.",
      };
    if (monthly < 5000)
      return {
        emoji: "emoji_money_face",
        text: "Illustrative estimate, not an expected or guaranteed outcome.",
      };
    return {
      emoji: "emoji_crown",
      text: "Upper-range projection; actual results may be substantially lower.",
    };
  };

  const creatorComparison = () => {
    if (creatorTotalMonthly < 5000)
      return {
        emoji: "emoji_sparkles",
        text: "Illustrative creator estimate; monetization eligibility applies.",
      };
    if (creatorTotalMonthly < 20000)
      return {
        emoji: "emoji_party",
        text: "Illustrative creator estimate, not a typical-results statement.",
      };
    if (creatorTotalMonthly < 50000)
      return {
        emoji: "emoji_money_face",
        text: "Projection based on entered views and unverified revenue assumptions.",
      };
    return {
      emoji: "emoji_crown",
      text: "Upper-range projection; actual eligible revenue may be much lower.",
    };
  };

  const { emoji: comparisonEmoji, text: comparisonText } =
    calcMode === "user" ? userComparison() : creatorComparison();

  return (
    <section
      id="calculator"
      className="section px-4 sm:px-6 lg:px-8 relative overflow-hidden"
    >
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-0 w-96 h-96 bg-amber-500/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-emerald-500/8 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-7xl mx-auto relative">
        {/* HEADER */}
        <div className="text-center max-w-2xl mx-auto mb-8 space-y-4">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold"
            style={{
              background: "rgba(245,158,11,0.12)",
              border: "1px solid rgba(245,158,11,0.25)",
              color: "#b45309",
            }}
          >
            <img
              src="/assets/emoji/emoji_sparkles.webp"
              loading="lazy"
              alt=""
              width="160"
              height="160"
              className="w-5 h-5 object-contain"
            />{" "}
            Earnings Estimate Calculator
          </div>
          <h2 className="font-display font-black text-4xl sm:text-5xl text-slate-900 tracking-tight">
            Explore an <span className="text-gradient-gold">Illustrative Estimate</span>
          </h2>
          <p className="text-slate-500 text-base">
            Change the assumptions below. Results are estimates, not promises or typical outcomes.
          </p>
        </div>

        {/* CALCULATOR SWITCHER: USER vs CREATOR */}
        <div className="flex flex-col items-center justify-center mb-10 gap-3">
          <div className="glass rounded-2xl p-1.5 flex gap-2 border border-slate-200 shadow-sm">
            <button
              onClick={() => setCalcMode("user")}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${
                calcMode === "user"
                  ? "bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg shadow-emerald-500/25"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <Eye className="w-4 h-4" />
              <span>For Users (Watch & Earn)</span>
            </button>
            <button
              onClick={() => setCalcMode("creator")}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${
                calcMode === "creator"
                  ? "bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg shadow-purple-500/25"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <Film className="w-4 h-4" />
              <span>For Creators (Videos & Shorts)</span>
            </button>
          </div>

          <div className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            {calcMode === "user"
              ? "Showing User Calculator: Watching videos, daily likes, comments & referral bonuses"
              : "Showing Creator Calculator: Long-video ads, shorts pool & fan funding via Direct UPI"}
          </div>
        </div>

        {/* MAIN CALCULATOR CARD */}
        {calcMode === "user" ? (
          /* ================= USER CALCULATOR ================= */
          <div
            className="glass-card rounded-3xl overflow-hidden"
            style={{ border: "1px solid rgba(15,23,42,0.07)" }}
          >
            <div className="grid grid-cols-1 lg:grid-cols-12">
              {/* LEFT: USER CONTROLS */}
              <div className="lg:col-span-7 p-8 sm:p-10 space-y-8">
                {/* USER PASS SELECTOR */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Step 1: Choose Your User Pass
                    </p>
                    <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                      For Users
                    </span>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {TIERS.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setTier(t.id)}
                        className={`p-3 rounded-2xl text-center transition-all duration-200 ${
                          tier === t.id
                            ? "bg-gradient-to-br from-emerald-500 to-cyan-500 text-white shadow-lg shadow-emerald-500/30 scale-105"
                            : "glass text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                        }`}
                      >
                        <img
                          src={`/assets/icons/tier_${t.id}.webp`}
                          alt=""
                          width="256"
                          height="256"
                          loading="lazy"
                          className="w-8 h-8 mx-auto mb-1 object-contain"
                        />
                        <div className="text-[11px] font-black">{t.name}</div>
                        <div className="text-[10px] mt-0.5 font-bold opacity-100">
                          {t.priceLabel}
                        </div>
                        <div className="text-[9px] mt-1 opacity-100">
                          ≤₹{t.capINR}/d
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* USER SLIDERS */}
                <div className="space-y-6">
                  <Slider
                    label="Daily Watch Time"
                    icon="icon_watch_time"
                    val={watch}
                    min={15}
                    max={180}
                    step={15}
                    onChange={setWatch}
                    colorClass="text-emerald-600"
                    hint={["15 min (Quick)", "120 min (2-Hour Goal Done)"]}
                    formatVal={(v) => `${v} min`}
                  />
                  <Slider
                    label="Daily Likes & Comments"
                    icon="icon_engagement"
                    val={engage}
                    min={2}
                    max={60}
                    step={2}
                    onChange={setEngage}
                    colorClass="text-emerald-600"
                    hint={["2 actions (Casual)", "60 actions (Power user)"]}
                    formatVal={(v) => `${v} actions`}
                  />
                  <Slider
                    label="Friends Invited This Month"
                    icon="icon_friends"
                    val={refs}
                    min={0}
                    max={30}
                    step={1}
                    onChange={setRefs}
                    colorClass="text-amber-600"
                    hint={[
                      "0 (Solo)",
                      `${refs} referrals = ₹${monthlyReferrals.toLocaleString("en-IN")} bonus (${activeTier.multiplier} · Cap: ₹${activeTier.referralCap.toLocaleString("en-IN")}/mo)`,
                    ]}
                    formatVal={(v) => `${v} friends`}
                  />
                </div>

                {/* INFO NOTE */}
                <div
                  className="flex items-start gap-2.5 text-xs text-slate-400 p-4 rounded-xl"
                  style={{
                    background: "rgba(15,23,42,0.02)",
                    border: "1px solid rgba(15,23,42,0.04)",
                  }}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                  Uses the plan settings currently shown on this page. Availability,
                  valid activity, eligibility, verification, fees and changing terms
                  can make actual results lower or zero.
                </div>
              </div>

              {/* RIGHT: USER RESULT PANEL */}
              <div
                className="lg:col-span-5 flex items-center justify-center p-8 sm:p-10 relative"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(245,158,11,0.06) 0%, rgba(16,185,129,0.06) 100%)",
                  borderLeft: "1px solid rgba(15,23,42,0.06)",
                }}
              >
                <div className="text-center space-y-6 w-full max-w-xs">
                  <div className="flex justify-center">
                    <img
                      src="/assets/icons/icon_wallet_big.webp"
                      alt=""
                      width="256"
                      height="256"
                      loading="lazy"
                      className="w-28 h-28 object-contain drop-shadow-xl animate-float"
                    />
                  </div>

                  <div>
                    <div className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">
                      Projected User Monthly Income
                    </div>
                    <div className="font-display font-black text-6xl sm:text-7xl text-gradient-gold leading-none">
                      ₹{displayed.toLocaleString("en-IN")}
                    </div>
                    <div className="text-slate-400 text-sm mt-2">
                      per month to your UPI
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div
                      className="text-center p-3.5 rounded-2xl"
                      style={{
                        background: "rgba(16,185,129,0.1)",
                        border: "1px solid rgba(16,185,129,0.2)",
                      }}
                    >
                      <div className="text-emerald-600 font-black text-lg leading-tight">
                        ₹{dailyINR.toFixed(2)}
                      </div>
                      <div className="text-slate-500 text-[10px] mt-0.5">
                        Per Day (₹{monthlyTasks.toLocaleString("en-IN")}/mo)
                      </div>
                    </div>
                    <div
                      className="text-center p-3.5 rounded-2xl"
                      style={{
                        background: "rgba(245,158,11,0.1)",
                        border: "1px solid rgba(245,158,11,0.2)",
                      }}
                    >
                      <div className="text-amber-600 font-black text-lg leading-tight">
                        ₹{monthlyReferrals.toLocaleString("en-IN")}
                      </div>
                      <div className="text-slate-500 text-[10px] mt-0.5">
                        Referrals ({refs} ref · {activeTier.multiplier})
                      </div>
                      <div className="text-[9px] text-amber-700/70 font-semibold mt-0.5">
                        Cap: ₹{activeTier.referralCap.toLocaleString("en-IN")}
                        /mo
                      </div>
                    </div>
                  </div>

                  <div
                    className="flex items-center gap-2 text-xs text-slate-500 p-3 rounded-xl justify-center"
                    style={{ background: "rgba(15,23,42,0.03)" }}
                  >
                    <img
                      src={`/assets/emoji/${comparisonEmoji}.webp`}
                      loading="lazy"
                      alt=""
                      width="160"
                      height="160"
                      className="w-6 h-6 object-contain shrink-0"
                    />
                    {comparisonText}
                  </div>

                  {/* USER PAYOUT THRESHOLDS */}
                  <div
                    className="p-3 rounded-xl text-left border border-slate-200 space-y-1"
                    style={{ background: "rgba(15,23,42,0.03)" }}
                  >
                    <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-emerald-600">
                      <Zap className="w-3 h-3" /> User Payout Thresholds
                    </div>
                    <div className="text-[11px] text-slate-700">
                      First Payout:{" "}
                      <span className="text-slate-900 font-bold">
                        Min. ₹100
                      </span>{" "}
                      (Immediate)
                    </div>
                    <div className="text-[11px] text-slate-500">
                      2nd onwards:{" "}
                      <span className="text-slate-700 font-bold">
                        Min. ₹500
                      </span>{" "}
                      (Processing conditions apply)
                    </div>
                  </div>

                  <a
                    href="#download"
                    className="w-full btn-primary text-center block text-sm"
                  >
                    Start Earning Now — Free
                  </a>
                  <button
                    onClick={onOpenQr}
                    className="text-xs text-slate-400 hover:text-slate-700 transition-colors flex items-center justify-center gap-1 mx-auto"
                  >
                    Scan QR to download <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ================= CREATOR CALCULATOR ================= */
          <div
            className="glass-card rounded-3xl overflow-hidden"
            style={{ border: "1px solid rgba(139,92,246,0.15)" }}
          >
            <div className="grid grid-cols-1 lg:grid-cols-12">
              {/* LEFT: CREATOR CONTROLS */}
              <div className="lg:col-span-7 p-8 sm:p-10 space-y-8">
                {/* CREATOR PASS SELECTOR */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Step 1: Choose Your Creator Pass
                    </p>
                    <span className="text-[11px] font-bold text-violet-700 bg-violet-50 px-2.5 py-0.5 rounded-full border border-violet-100">
                      For Creators
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                    {CREATOR_TIERS.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setCreatorTier(t.id)}
                        className={`p-3 rounded-2xl text-center transition-all duration-200 ${
                          creatorTier === t.id
                            ? "bg-gradient-to-br from-violet-600 to-purple-600 text-white shadow-lg shadow-purple-500/30 scale-105"
                            : "glass text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                        }`}
                      >
                        <div className="text-[12px] font-black">{t.name}</div>
                        <div className="text-[10px] mt-0.5 font-bold opacity-80">
                          {t.priceLabel}
                        </div>
                        <div className="text-[9px] mt-1 font-semibold opacity-100">
                          {t.subs}
                        </div>
                        <div className="mt-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-black/10">
                          {Math.round(t.longSplit * 100)}% Ads
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* CREATOR SLIDERS */}
                <div className="space-y-6">
                  <Slider
                    label="Monthly Long-Video Views"
                    icon="icon_hd_video"
                    val={longViews}
                    min={5000}
                    max={1000000}
                    step={5000}
                    onChange={setLongViews}
                    colorClass="text-violet-600"
                    hint={["5,000 views", "1,000,000 views (Pro channel)"]}
                    formatVal={(v) => `${(v / 1000).toFixed(0)}K views`}
                  />
                  <Slider
                    label="Monthly Shorts Views"
                    icon="icon_step_watch"
                    val={shortsViews}
                    min={10000}
                    max={2000000}
                    step={10000}
                    onChange={setShortsViews}
                    colorClass="text-violet-600"
                    hint={["10,000 views", "2,000,000 views (Viral Shorts)"]}
                    formatVal={(v) => `${(v / 1000).toFixed(0)}K views`}
                  />
                  <Slider
                    label="Monthly Fan Funding / Direct UPI Tips"
                    icon="icon_coins"
                    val={fanFunding}
                    min={0}
                    max={50000}
                    step={1000}
                    onChange={setFanFunding}
                    colorClass="text-amber-600"
                    hint={["₹0", "₹50,000/mo (Direct UPI memberships)"]}
                    formatVal={(v) => `₹${v.toLocaleString("en-IN")}`}
                  />
                </div>

                {/* CREATOR INFO NOTE */}
                <div
                  className="flex items-start gap-2.5 text-xs text-slate-400 p-4 rounded-xl"
                  style={{
                    background: "rgba(139,92,246,0.03)",
                    border: "1px solid rgba(139,92,246,0.08)",
                  }}
                >
                  <TrendingUp className="w-3.5 h-3.5 text-violet-600 mt-0.5 shrink-0" />
                  Uses assumed gross rates plus the displayed {Math.round(activeCreatorTier.longSplit * 100)}%
                  long-video, {Math.round(activeCreatorTier.shortsSplit * 100)}% shorts and{" "}
                  {Math.round(activeCreatorTier.fanFundingSplit * 100)}% fan-funding shares.
                  These inputs are not independently verified typical results.
                </div>
              </div>

              {/* RIGHT: CREATOR RESULT PANEL */}
              <div
                className="lg:col-span-5 flex items-center justify-center p-8 sm:p-10 relative"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(139,92,246,0.08) 0%, rgba(59,130,246,0.06) 100%)",
                  borderLeft: "1px solid rgba(15,23,42,0.06)",
                }}
              >
                <div className="text-center space-y-6 w-full max-w-xs">
                  <div className="flex justify-center">
                    <img
                      src="/assets/icons/icon_wallet_big.webp"
                      alt=""
                      width="256"
                      height="256"
                      loading="lazy"
                      className="w-28 h-28 object-contain drop-shadow-xl animate-float"
                    />
                  </div>

                  <div>
                    <div className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">
                      Projected Creator Monthly Revenue
                    </div>
                    <div className="font-display font-black text-6xl sm:text-7xl text-gradient-purple leading-none">
                      ₹{displayedCreator.toLocaleString("en-IN")}
                    </div>
                    <div className="text-slate-400 text-sm mt-2">
                      monthly directly to your UPI
                    </div>
                  </div>

                  {/* REVENUE BREAKDOWN */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-violet-500/10 border border-violet-500/20 text-xs">
                      <span className="text-slate-700 font-bold">
                        Long-Video Ads
                      </span>
                      <span className="font-black text-violet-700">
                        ₹{creatorLongRev.toLocaleString("en-IN")}{" "}
                        <span className="text-[10px] font-normal text-slate-500">
                          ({Math.round(activeCreatorTier.longSplit * 100)}%)
                        </span>
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-xs">
                      <span className="text-slate-700 font-bold">
                        Shorts Pool
                      </span>
                      <span className="font-black text-cyan-700">
                        ₹{creatorShortsRev.toLocaleString("en-IN")}{" "}
                        <span className="text-[10px] font-normal text-slate-500">
                          ({Math.round(activeCreatorTier.shortsSplit * 100)}%)
                        </span>
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs">
                      <span className="text-slate-700 font-bold">
                        Fan Funding (UPI)
                      </span>
                      <span className="font-black text-amber-700">
                        ₹{creatorFanRev.toLocaleString("en-IN")}{" "}
                        <span className="text-[10px] font-normal text-slate-500">
                          ({Math.round(activeCreatorTier.fanFundingSplit * 100)}
                          %)
                        </span>
                      </span>
                    </div>
                  </div>

                  <div
                    className="flex items-center gap-2 text-xs text-slate-500 p-3 rounded-xl justify-center"
                    style={{ background: "rgba(15,23,42,0.03)" }}
                  >
                    <img
                      src={`/assets/emoji/${comparisonEmoji}.webp`}
                      loading="lazy"
                      alt=""
                      width="160"
                      height="160"
                      className="w-6 h-6 object-contain shrink-0"
                    />
                    {comparisonText}
                  </div>

                  {/* CREATOR PAYOUT THRESHOLDS */}
                  <div
                    className="p-3 rounded-xl text-left border border-slate-200 space-y-1"
                    style={{ background: "rgba(15,23,42,0.03)" }}
                  >
                    <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-violet-600">
                      <Calendar className="w-3 h-3" /> Creator Payout Schedule
                    </div>
                    <div className="text-[11px] text-slate-700">
                      First Payout:{" "}
                      <span className="text-slate-900 font-bold">
                        Min. ₹100
                      </span>{" "}
                      (Immediate)
                    </div>
                    <div className="text-[11px] text-slate-500">
                      2nd onwards:{" "}
                      <span className="text-slate-700 font-bold">
                        Min. ₹1,000
                      </span>{" "}
                      (Monthly: 21st–26th)
                    </div>
                  </div>

                  <a
                    href="#tiers"
                    className="w-full py-3 rounded-2xl text-center block text-sm font-bold text-white shadow-lg bg-gradient-to-r from-violet-600 to-purple-600 hover:opacity-95 transition-opacity"
                  >
                    Unlock Creator VIP Pass
                  </a>
                  <button
                    onClick={onOpenQr}
                    className="text-xs text-slate-400 hover:text-slate-700 transition-colors flex items-center justify-center gap-1 mx-auto"
                  >
                    Scan QR to download <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* UPDATED PAYOUT RULES & SCHEDULES */}
        <div className="mt-10 max-w-4xl mx-auto">
          <div
            className="glass-card rounded-3xl p-6 sm:p-8 relative overflow-hidden"
            style={{
              border: "1px solid rgba(16,185,129,0.25)",
              boxShadow: "0 0 50px rgba(16,185,129,0.08)",
            }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-5 border-b border-slate-200">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-3 h-3" /> Unverified Site Summary
                </span>
                <h3 className="font-display font-black text-2xl text-slate-900 mt-2">
                  Stated Payout Minimums & Schedules
                </h3>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-xs text-slate-500 flex items-center gap-2">
                  <img
                    src="/assets/emoji/emoji_clock.webp"
                    loading="lazy"
                    alt=""
                    width="160"
                    height="160"
                    className="w-5 h-5 object-contain shrink-0"
                  />
                  Processing conditions apply
                </div>
                <img
                  src="/assets/payout_art.webp"
                  width="720"
                  height="720"
                  srcSet="/assets/payout_art-360.webp 360w, /assets/payout_art.webp 720w"
                  sizes="112px"
                  alt="Coins flowing into a UPI payout"
                  loading="lazy"
                  className="hidden sm:block w-28 h-28 -my-6 object-contain drop-shadow-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* USERS CARD */}
              <div
                className="p-5 rounded-2xl border border-slate-200 flex flex-col justify-between"
                style={{ background: "rgba(15,23,42,0.02)" }}
              >
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-white shadow-lg">
                      <Wallet className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-display font-black text-slate-900 text-base">
                        For Users
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Watch, like, comment & daily tasks
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                      <span className="text-slate-700 font-medium">
                        First Payout
                      </span>
                      <span className="font-black text-emerald-600 text-sm">
                        Min. ₹100
                        <span className="text-[10px] text-slate-500 block font-normal text-right">
                          Immediate withdrawal
                        </span>
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-slate-700 font-medium">
                        Subsequent Payouts
                      </span>
                      <span className="font-black text-slate-900 text-sm">
                        Min. ₹500
                        <span className="text-[10px] text-slate-500 block font-normal text-right">
                          2nd onwards (processing conditions apply)
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200 flex items-center gap-2 text-[11px] text-slate-500">
                  <Zap className="w-3.5 h-3.5 text-amber-600" />
                  The site describes UPI and bank withdrawal options; provider,
                  verification and account-review delays may apply.
                </div>
              </div>

              {/* CREATORS CARD */}
              <div
                className="p-5 rounded-2xl border border-slate-200 flex flex-col justify-between"
                style={{ background: "rgba(15,23,42,0.02)" }}
              >
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
                      <Film className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-display font-black text-slate-900 text-base">
                        For Creators
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Ad splits, shorts, fan funding & VIP perks
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                      <span className="text-slate-700 font-medium">
                        First Payout
                      </span>
                      <span className="font-black text-emerald-600 text-sm">
                        Min. ₹100
                        <span className="text-[10px] text-slate-500 block font-normal text-right">
                          Immediate withdrawal
                        </span>
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-violet-500/5 border border-violet-500/10">
                      <span className="text-slate-700 font-medium">
                        Subsequent Payouts
                      </span>
                      <span className="font-black text-violet-700 text-sm">
                        Min. ₹1,000
                        <span className="text-[10px] text-slate-500 block font-normal text-right">
                          2nd onwards (Monthly cycle)
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200 flex items-center gap-2 text-[11px] text-slate-500">
                  <Calendar className="w-3.5 h-3.5 text-violet-600" />
                  Processed on a flexible monthly cycle between the 21st and
                  26th of every month.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* REFERRAL EARNING CAPS & MULTIPLIER LOGIC */}
        <div className="mt-8 max-w-4xl mx-auto">
          <div
            className="glass-card rounded-3xl p-6 sm:p-8 relative overflow-hidden"
            style={{
              border: "1px solid rgba(245,158,11,0.25)",
              boxShadow: "0 0 50px rgba(245,158,11,0.06)",
            }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-5 border-b border-slate-200">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-700 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20 inline-flex items-center gap-1.5">
                  <Coins className="w-3 h-3" /> Advertised Program Settings
                </span>
                <h3 className="font-display font-black text-2xl text-slate-900 mt-2">
                  Referral Earning Caps & Multiplier Logic
                </h3>
                <p className="text-slate-500 text-xs mt-1">
                  10% base commission per pass tier with progressive monthly
                  earning multipliers and caps
                </p>
              </div>
              <div className="px-4 py-2 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Total Base Amount
                </div>
                <div className="text-xl font-black text-amber-600">₹4,345</div>
                <div className="text-[10px] text-slate-400">
                  1 ref per pass tier
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* SECTION 1: BASE COMMISSION LOGIC */}
              <div
                className="p-5 rounded-2xl border border-slate-200 flex flex-col justify-between"
                style={{ background: "rgba(15,23,42,0.02)" }}
              >
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-6 h-6 rounded-lg bg-amber-500 text-white font-black text-xs flex items-center justify-center">
                      1
                    </span>
                    <h4 className="font-display font-black text-slate-900 text-sm">
                      Base Commission (10% Per Pass Tier)
                    </h4>
                  </div>
                  <p className="text-[11px] text-slate-500 mb-4">
                    Direct 10% commission when a referred friend activates any
                    User Starter or VIP Pass:
                  </p>

                  <div className="space-y-2 text-xs">
                    {[
                      {
                        tier: "Bronze Pass",
                        price: "₹990",
                        comm: "₹99",
                        color:
                          "text-amber-700 bg-amber-500/5 border-amber-500/15",
                      },
                      {
                        tier: "Silver Pass",
                        price: "₹2,490",
                        comm: "₹249",
                        color: "text-slate-700 bg-slate-50 border-slate-200",
                      },
                      {
                        tier: "Gold Pass",
                        price: "₹4,990",
                        comm: "₹499",
                        color:
                          "text-yellow-700 bg-yellow-500/5 border-yellow-500/15",
                      },
                      {
                        tier: "Platinum Pass",
                        price: "₹9,990",
                        comm: "₹999",
                        color:
                          "text-purple-700 bg-purple-500/5 border-purple-500/15",
                      },
                      {
                        tier: "Diamond Pass",
                        price: "₹24,990",
                        comm: "₹2,499",
                        color: "text-cyan-700 bg-cyan-500/5 border-cyan-500/15",
                      },
                    ].map((row, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center justify-between p-2.5 rounded-xl border ${row.color}`}
                      >
                        <span className="font-bold text-slate-800">
                          {row.tier}{" "}
                          <span className="text-[11px] text-slate-400 font-normal">
                            ({row.price})
                          </span>
                        </span>
                        <span className="font-black text-sm text-slate-900">
                          {row.comm}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>1 Referral Across All 5 Tiers</span>
                  <span className="font-black text-emerald-600 text-sm">
                    Total: ₹4,345
                  </span>
                </div>
              </div>

              {/* SECTION 2: PASS-WISE MULTIPLIERS & CAPS */}
              <div
                className="p-5 rounded-2xl border border-slate-200 flex flex-col justify-between"
                style={{ background: "rgba(15,23,42,0.02)" }}
              >
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-6 h-6 rounded-lg bg-emerald-500 text-white font-black text-xs flex items-center justify-center">
                      2
                    </span>
                    <h4 className="font-display font-black text-slate-900 text-sm">
                      Pass-wise Multipliers & Monthly Caps
                    </h4>
                  </div>
                  <p className="text-[11px] text-slate-500 mb-4">
                    Higher passes multiply your referral earning power and
                    unlock higher monthly caps:
                  </p>

                  <div className="space-y-2 text-xs">
                    {[
                      {
                        tier: "Free Pass",
                        mult: "1x",
                        cap: "₹5,000",
                        badge: "bg-slate-100 text-slate-600",
                      },
                      {
                        tier: "Bronze Pass",
                        mult: "~2.3x",
                        cap: "₹10,000",
                        badge: "bg-amber-100 text-amber-800",
                      },
                      {
                        tier: "Silver Pass",
                        mult: "~5.7x",
                        cap: "₹25,000",
                        badge: "bg-slate-200 text-slate-800",
                      },
                      {
                        tier: "Gold Pass",
                        mult: "~11.5x",
                        cap: "₹50,000",
                        badge: "bg-yellow-100 text-yellow-800",
                      },
                      {
                        tier: "Platinum Pass",
                        mult: "~19.3x",
                        cap: "₹84,000",
                        badge: "bg-purple-100 text-purple-800",
                      },
                      {
                        tier: "Diamond Pass",
                        mult: "~23x",
                        cap: "₹1,00,000",
                        badge: "bg-cyan-100 text-cyan-800 font-extrabold",
                      },
                    ].map((row, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200"
                      >
                        <span className="font-bold text-slate-800">
                          {row.tier}
                        </span>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-black px-2 py-0.5 rounded-md ${row.badge}`}
                          >
                            {row.mult}
                          </span>
                          <span className="font-black text-slate-900 text-sm">
                            Cap: {row.cap}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200 flex items-center gap-2 text-[11px] text-slate-500">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  ₹1,00,000/mo is a listed maximum referral cap, not a promised or typical earning amount.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
