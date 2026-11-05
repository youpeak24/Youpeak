import React, { useState } from "react";
import {
  Check,
  Eye,
  Film,
  Star,
  Gift,
  TrendingUp,
  Sparkles,
} from "lucide-react";

const TASKER_TIERS = [
  {
    id: "free",
    img: "tier_free",
    name: "Free User",
    level: "Level 1",
    price: "₹0",
    period: "Always free",
    monthlyMax: "₹300.00",
    dailyCap: "₹10",
    popular: false,
    credits: null,
    features: [
      "Up to ₹10/day (1,000 coins)",
      "20 ads per day",
      "10 likes per day",
      "5 comments per day",
      "Unlock Level 2 FREE (100 Watch Hrs)",
      "1x Referral Multiplier (Cap: ₹5,000/mo)",
      "Standard UPI cashout",
    ],
    color: "from-gray-500 to-gray-600",
    btnClass:
      "bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-200",
  },
  {
    id: "bronze",
    img: "tier_bronze",
    name: "Bronze Starter",
    level: "Starter",
    price: "₹990",
    period: "One-time",
    monthlyMax: "₹600.00",
    dailyCap: "₹20",
    popular: false,
    credits: "₹1,000 Ad Credits FREE",
    features: [
      "Up to ₹20/day",
      "20 ads per day",
      "10 likes per day",
      "5 comments per day",
      "10% Referral (₹99/ref) · ~2.3x Multiplier",
      "Referral Cap: ₹10,000/mo",
      "₹1,000 credits bonus",
    ],
    color: "from-amber-700 to-yellow-600",
    btnClass: "bg-amber-700 hover:bg-amber-800 text-white",
  },
  {
    id: "silver",
    img: "tier_silver",
    name: "Silver Intermediate",
    level: "Level 2",
    price: "₹2,490",
    period: "One-time",
    monthlyMax: "₹1,200.00",
    dailyCap: "₹40",
    popular: true,
    credits: "₹2,500 Ad Credits FREE",
    features: [
      "Up to ₹40/day",
      "20 ads per day",
      "20 likes per day",
      "10 comments per day",
      "10% Referral (₹249/ref) · ~5.7x Multiplier",
      "Referral Cap: ₹25,000/mo",
      "₹2,500 credits bonus",
    ],
    color: "from-emerald-500 to-cyan-500",
    btnClass: "bg-gradient-to-r from-emerald-500 to-cyan-500 text-white",
  },
  {
    id: "gold",
    img: "tier_gold",
    name: "Gold Advanced",
    level: "Level 3",
    price: "₹4,990",
    period: "One-time",
    monthlyMax: "₹3,600.00",
    dailyCap: "₹120",
    popular: false,
    credits: "₹5,000 Ad Credits FREE",
    features: [
      "Up to ₹120/day",
      "20 ads per day",
      "40 likes per day",
      "20 comments per day",
      "10% Referral (₹499/ref) · ~11.5x Multiplier",
      "Referral Cap: ₹50,000/mo",
      "₹5,000 credits bonus",
    ],
    color: "from-amber-400 to-yellow-500",
    btnClass: "bg-gradient-to-r from-amber-400 to-yellow-500 text-gray-900",
  },
  {
    id: "platinum",
    img: "tier_platinum",
    name: "Platinum Regional Pro",
    level: "Level 4",
    price: "₹9,990",
    period: "One-time",
    monthlyMax: "₹5,000.00",
    dailyCap: "₹166.67",
    popular: false,
    credits: "₹10,000 Ad Credits FREE",
    features: [
      "Up to ₹166.67/day",
      "20 ads per day",
      "60 likes per day",
      "30 comments per day",
      "10% Referral (₹999/ref) · ~19.3x Multiplier",
      "Referral Cap: ₹84,000/mo",
      "₹10,000 credits bonus",
    ],
    color: "from-violet-500 to-purple-600",
    btnClass: "bg-gradient-to-r from-violet-500 to-purple-600 text-white",
  },
  {
    id: "diamond",
    img: "tier_diamond",
    name: "Diamond Pass",
    level: "Special Pass",
    badge: "Special Pass",
    price: "₹24,990",
    period: "/ year",
    monthlyMax: "₹10,000.00",
    dailyCap: "₹333.33",
    popular: false,
    credits: "25,000 Ad Credits FREE",
    features: [
      "Listed monthly task cap up to ₹10,000",
      "20 ads per day",
      "10% Referral (₹2,499/ref) · ~23x Multiplier",
      "Referral Cap: ₹1,00,000/mo",
      "25,000 Ad Credits FREE",
      "(Daily Caps): 20 Ads / 120 Likes / 60 Comments",
    ],
    color: "from-cyan-400 via-blue-500 to-indigo-500",
    btnClass:
      "bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 text-white shadow-lg shadow-cyan-500/25",
  },
];

const CREATOR_TIERS = [
  {
    name: "Classic",
    img: "vip_classic",
    level: "Level 1",
    price: "Free",
    period: "Always Free",
    subs: "0+ Subs",
    split: "50%",
    shortsShare: "50%",
    fanFunding: "70%",
    max: "₹1,000/video",
    color: "from-gray-500 to-gray-600",
  },
  {
    name: "Starter VIP Pass",
    img: "vip_starter",
    level: "Level 2",
    badge: "Launch Special",
    price: "₹4,999/year",
    period: "Annual — Launch Special",
    subs: "< 5,000 Subs",
    subtext:
      "Available for the first 1,000 creators or during the 3-month launch window.",
    keyHighlight:
      "Early creators lock in this ₹4,999 annual renewal rate permanently (Standard price: ₹19,999/year after the threshold).",
    split: "60%",
    shortsShare: "55%",
    fanFunding: "80%",
    max: "₹2,000/video",
    color: "from-emerald-500 to-teal-500",
  },
  {
    name: "Silver VIP",
    img: "vip_silver",
    level: "Level 3",
    price: "₹2,999/yr",
    period: "Annual",
    subs: "5K–25K Subs",
    split: "65%",
    shortsShare: "60%",
    fanFunding: "85%",
    max: "₹5,000/video",
    color: "from-blue-500 to-cyan-500",
  },
  {
    name: "Gold VIP",
    img: "vip_gold",
    level: "Level 4",
    price: "₹1,499/yr",
    period: "Annual",
    subs: "25K–100K Subs",
    split: "75%",
    shortsShare: "65%",
    fanFunding: "90%",
    max: "₹15,000/video",
    color: "from-amber-400 to-orange-500",
  },
  {
    name: "Platinum VIP",
    img: "vip_platinum",
    level: "Level 5",
    price: "Free",
    period: "Auto-Unlocked",
    subs: "100K+ Subs",
    split: "80%",
    shortsShare: "70%",
    fanFunding: "90%",
    max: "Unlimited",
    color: "from-violet-500 to-purple-600",
  },
];

export default function TiersPricing() {
  const [mode, setMode] = useState("tasker");

  return (
    <section
      id="tiers"
      className="section bg-slate-50 bg-no-repeat bg-top bg-cover px-4 sm:px-6 lg:px-8 relative"
      style={{ backgroundImage: "url(/assets/bg/pricing_bg.webp)" }}
    >
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(16,185,129,0.4), rgba(139,92,246,0.4), transparent)",
        }}
      />

      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-4">
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
            Transparent pricing. No fine print.
          </div>
          <h2 className="font-display font-black text-4xl sm:text-5xl text-slate-900 tracking-tight leading-tight">
            Pick Your <span className="text-gradient-gold">Power Level</span>
          </h2>
          <p className="text-slate-500 text-base">
            Compare the plan settings currently advertised. Paid passes are optional;
            caps and projections are not guaranteed income.
          </p>
        </div>

        {/* SWITCHER */}
        <div className="flex justify-center mb-12">
          <div className="glass rounded-2xl p-1.5 flex gap-1 border border-slate-200">
            <button
              onClick={() => setMode("tasker")}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${mode === "tasker" ? "bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg" : "text-slate-500 hover:text-slate-900"}`}
            >
              <Eye className="w-4 h-4" /> User Passes
            </button>
            <button
              onClick={() => setMode("creator")}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${mode === "creator" ? "bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-900"}`}
            >
              <Film className="w-4 h-4" /> Creator VIP
            </button>
          </div>
        </div>

        {/* TASKER TIERS */}
        {mode === "tasker" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {TASKER_TIERS.map((t) => {
              return (
                <div
                  key={t.id}
                  className={`tier-card relative flex flex-col glass-card ${t.popular || t.badge ? "tier-card-popular" : ""}`}
                  style={
                    t.badge
                      ? {
                          border: "2px solid rgba(56,189,248,0.5)",
                          boxShadow: "0 0 40px rgba(56,189,248,0.15)",
                        }
                      : t.popular
                        ? {
                            border: "2px solid rgba(16,185,129,0.5)",
                            boxShadow: "0 0 40px rgba(16,185,129,0.15)",
                          }
                        : { border: "1px solid rgba(15,23,42,0.06)" }
                  }
                >
                  {t.badge ? (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-black text-white bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 shadow-lg whitespace-nowrap flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 fill-white" /> {t.badge}
                    </div>
                  ) : t.popular ? (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-black text-white bg-gradient-to-r from-emerald-500 to-cyan-500 shadow-lg whitespace-nowrap flex items-center gap-1.5">
                      <Star className="w-3 h-3 fill-white" /> Most Popular
                    </div>
                  ) : null}

                  <div
                    className={`h-1 rounded-full bg-gradient-to-r ${t.color} mb-5`}
                  />

                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <img
                        src={`/assets/icons/${t.img}.webp`}
                        alt=""
                        width="256"
                        height="256"
                        loading="lazy"
                        className="w-10 h-10 -my-1 -ml-1 object-contain drop-shadow-md shrink-0"
                      />
                      <h3 className="font-display font-black text-sm text-slate-900">
                        {t.name}
                      </h3>
                    </div>
                    {t.level && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 whitespace-nowrap">
                        {t.level}
                      </span>
                    )}
                  </div>

                  <div className="mt-3 mb-1">
                    <div className="font-display font-black text-2xl text-slate-900">
                      {t.price}
                    </div>
                    <div className="text-slate-500 text-[11px]">{t.period}</div>
                  </div>

                  <div
                    className="mt-3 mb-4 p-3 rounded-xl"
                    style={{ background: "rgba(15,23,42,0.04)" }}
                  >
                    <div className="text-xs text-slate-500">Max per month</div>
                    <div
                      className={`font-black text-xl bg-gradient-to-r ${t.color} bg-clip-text text-transparent`}
                    >
                      {t.monthlyMax}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      (Daily cap: {t.dailyCap})
                    </div>
                    {t.credits && (
                      <div className="flex items-center gap-1 mt-2 text-[10px] font-bold text-amber-600">
                        <Gift className="w-3 h-3 shrink-0" /> {t.credits}
                      </div>
                    )}
                  </div>

                  <ul className="space-y-2 flex-1 mb-6">
                    {t.features.map((f, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-1.5 text-[11px] text-slate-600 leading-tight"
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <a
                    href="#download"
                    className={`w-full py-2.5 rounded-xl text-[12px] font-black text-center block transition-all ${t.btnClass}`}
                  >
                    {t.price === "₹0" ? "Review Free Plan" : `Review ${t.name}`}
                  </a>
                </div>
              );
            })}
          </div>
        )}

        {/* CREATOR TIERS */}
        {mode === "creator" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
            {CREATOR_TIERS.map((t, i) => {
              return (
                <div
                  key={i}
                  className={`tier-card glass-card flex flex-col relative ${t.badge ? "tier-card-popular" : ""}`}
                  style={
                    t.badge
                      ? {
                          border: "2px solid rgba(16,185,129,0.5)",
                          boxShadow: "0 0 40px rgba(16,185,129,0.15)",
                        }
                      : { border: "1px solid rgba(15,23,42,0.06)" }
                  }
                >
                  {t.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-black text-white bg-gradient-to-r from-emerald-500 to-teal-500 shadow-lg whitespace-nowrap flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 fill-white" /> {t.badge}
                    </div>
                  )}

                  <div
                    className={`h-1 rounded-full bg-gradient-to-r ${t.color} mb-5`}
                  />

                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <img
                        src={`/assets/icons/${t.img}.webp`}
                        alt=""
                        width="256"
                        height="256"
                        loading="lazy"
                        className="w-10 h-10 -my-1 -ml-1 object-contain drop-shadow-md shrink-0"
                      />
                      <h3 className="font-display font-black text-sm text-slate-900">
                        {t.name}
                      </h3>
                    </div>
                    {t.level && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {t.level}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    {t.subs}
                  </div>

                  {t.subtext && (
                    <div className="text-[11px] text-emerald-600 font-semibold mt-2 leading-tight">
                      {t.subtext}
                    </div>
                  )}

                  <div className="mt-4 mb-3">
                    <div className="font-display font-black text-2xl text-slate-900">
                      {t.price}
                    </div>
                    <div className="text-slate-400 text-[11px]">{t.period}</div>
                  </div>

                  {t.keyHighlight && (
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-700 mb-3 leading-snug">
                      <strong className="text-slate-900 block mb-0.5 font-bold">
                        Key Highlight:
                      </strong>
                      {t.keyHighlight}
                    </div>
                  )}

                  <div className="space-y-2 flex-1 mb-6">
                    <div
                      className="p-3 rounded-xl"
                      style={{ background: "rgba(15,23,42,0.04)" }}
                    >
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-1">
                        <TrendingUp className="w-3 h-3" /> Long-Video Ad Share
                      </div>
                      <div
                        className={`font-black text-3xl bg-gradient-to-r ${t.color} bg-clip-text text-transparent`}
                      >
                        {t.split}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div
                        className="text-[10px] p-2 rounded-lg"
                        style={{ background: "rgba(15,23,42,0.03)" }}
                      >
                        <div className="text-slate-400">Shorts</div>
                        <div className="text-slate-700 font-bold">
                          {t.shortsShare}
                        </div>
                      </div>
                      <div
                        className="text-[10px] p-2 rounded-lg"
                        style={{ background: "rgba(15,23,42,0.03)" }}
                      >
                        <div className="text-slate-400">Fan Funding</div>
                        <div className="text-slate-700 font-bold">
                          {t.fanFunding}
                        </div>
                      </div>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      <span className="text-slate-600 font-bold">
                        Max per video:
                      </span>{" "}
                      {t.max}
                    </div>
                  </div>

                  <a
                    href="#download"
                    className={`w-full py-3 rounded-xl text-[12px] font-black text-center block text-white bg-gradient-to-r ${t.color} hover:opacity-90 transition-opacity`}
                  >
                    {t.price === "Free"
                      ? "Start Creating Free"
                      : "Unlock VIP Pass"}
                  </a>
                </div>
              );
            })}
          </div>
        )}

        <p className="text-center text-slate-500 text-xs mt-10 max-w-2xl mx-auto leading-relaxed">
          The site states that paid plans include matched Ad Credits. Confirm credit
          conditions, pass duration, renewal, cancellation, refunds, fees and earning
          rules in approved terms before purchase. User passes are listed as one-time
          except Diamond; Creator VIP passes are listed as annual.
        </p>
      </div>
    </section>
  );
}
