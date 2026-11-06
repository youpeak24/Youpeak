import React, { useState, useEffect } from "react";
import {
  Zap,
  Users,
  TrendingUp,
  Smartphone,
  Trophy,
  Coins,
} from "lucide-react";
import StoreAvailability from "./StoreAvailability";

// 3D objects floating around the hero phone. Positions are relative to the
// phone column. Hidden below lg, where they would cover the phone screen.
const FLOATERS = [
  {
    src: "float_coin",
    className: "top-2 left-16 w-20",
    anim: "animate-float2",
    delay: "0s",
  },
  {
    src: "float_heart",
    className: "top-1/3 left-0 w-16",
    anim: "animate-float",
    delay: "1s",
  },
  {
    src: "float_play",
    className: "bottom-40 left-4 w-16",
    anim: "animate-float2",
    delay: "2s",
  },
  {
    src: "float_coins_stack",
    className: "bottom-4 left-20 w-24",
    anim: "animate-float",
    delay: "0.5s",
  },
  {
    src: "float_wallet",
    className: "top-[46%] -right-16 w-20",
    anim: "animate-float",
    delay: "1.5s",
  },
  {
    src: "float_upi_arrow",
    className: "-bottom-8 right-[340px] w-16",
    anim: "animate-float2",
    delay: "2.5s",
  },
];

const TICKER_ITEMS = [
  { icon: Trophy, text: "Start with the free plan" },
  { icon: TrendingUp, text: "Optional pass upgrades" },
  { icon: Zap, text: "Earnings are not guaranteed" },
  { icon: Smartphone, text: "Store listings coming soon" },
  { icon: Coins, text: "100 Coins = ₹1 INR" },
  { icon: TrendingUp, text: "Creator shares vary by plan" },
  { icon: Users, text: "Referral eligibility applies" },
];

export default function Hero({ onOpenQr }) {
  const [coinCount, setCoinCount] = useState(0);
  useEffect(() => {
    const t = setInterval(() => {
      setCoinCount((p) => {
        if (p >= 2450) {
          clearInterval(t);
          return 2450;
        }
        return p + 42;
      });
    }, 25);
    return () => clearInterval(t);
  }, []);

  return (
    <section className="relative min-h-screen flex flex-col justify-center bg-hero-gradient overflow-hidden">
      {/* ANIMATED BACKGROUND ORBS */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <img
          src="/assets/bg/hero_bg.webp"
          loading="lazy"
          alt=""
          aria-hidden="true"
          width="1920"
          height="1080"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] animate-glow-pulse" />
        <div
          className="absolute top-1/3 right-1/4 w-80 h-80 bg-violet-600/10 rounded-full blur-[100px] animate-glow-pulse"
          style={{ animationDelay: "1.5s" }}
        />
        <div
          className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-blue-500/10 rounded-full blur-[100px] animate-glow-pulse"
          style={{ animationDelay: "3s" }}
        />
        <div
          className="absolute top-1/2 right-10 w-64 h-64 bg-amber-500/8 rounded-full blur-[80px] animate-glow-pulse"
          style={{ animationDelay: "2s" }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* LEFT: COPY */}
          <div className="lg:col-span-6 space-y-8">
            {/* TOP BADGE */}
            <div
              className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full glass"
              style={{ border: "1px solid rgba(16,185,129,0.3)" }}
            >
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 relative">
                <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-emerald-400 opacity-75" />
              </span>
              <img
                src="/assets/emoji/emoji_trophy.webp"
                loading="lazy"
                alt=""
                width="160"
                height="160"
                className="w-5 h-5 object-contain"
              />
              <span className="text-xs font-bold text-emerald-600 tracking-wide">
                VIDEO REWARDS & CREATOR PLATFORM
              </span>
            </div>

            {/* HEADLINE */}
            <div className="space-y-3">
              <h1 className="font-display font-black text-5xl sm:text-6xl lg:text-6xl xl:text-7xl leading-[1.06] tracking-tight text-slate-900">
                Watch Videos.
                <br />
                <span className="text-gradient-primary">Get Paid.</span>
                <br />
                <span className="text-slate-800">Repeat Daily.</span>
              </h1>
              <p className="text-lg sm:text-xl text-slate-600 max-w-xl leading-relaxed font-medium">
                Explore YouPeak's stated video rewards, creator monetization,
                referral rules and optional passes. Earnings depend on valid
                activity, eligibility and current platform terms.
              </p>
            </div>

            {/* QUICK STATS PILLS */}
            <div className="flex flex-wrap gap-3">
              {[
                {
                  emoji: "emoji_money_bag",
                  val: "Up to ₹333.33/day",
                  sub: "Listed cap, not guaranteed",
                },
                {
                  emoji: "emoji_rocket",
                  val: "Withdrawal requests",
                  sub: "Eligibility and minimums apply",
                },
                {
                  emoji: "emoji_gift",
                  val: "Referral rewards",
                  sub: "Qualifying activity required",
                },
                {
                  emoji: "emoji_sparkles",
                  val: "Free Joining",
                  sub: "Optional paid upgrades",
                },
              ].map((b, i) => (
                <div
                  key={i}
                  className="glass flex items-center gap-2.5 px-4 py-2.5 rounded-2xl"
                  style={{ border: "1px solid rgba(15,23,42,0.08)" }}
                >
                  <img
                    src={`/assets/emoji/${b.emoji}.webp`}
                    loading="lazy"
                    alt=""
                    width="160"
                    height="160"
                    className="w-7 h-7 object-contain shrink-0"
                  />
                  <div>
                    <div className="text-xs font-black text-slate-900">
                      {b.val}
                    </div>
                    <div className="text-[10px] text-slate-500">{b.sub}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* STORE BUTTONS */}
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <StoreAvailability />
                {/* QR */}
                <button
                  onClick={onOpenQr}
                  className="btn-ghost text-sm !py-3 !px-4 flex items-center gap-2"
                >
                  <Smartphone className="w-4 h-4" /> QR Code
                </button>
              </div>

              {/* Availability line */}
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <span>Verified app-store product links have not been published.</span>
              </div>
            </div>
          </div>

          {/* RIGHT: PHONE MOCKUP */}
          <div className="lg:col-span-6 flex justify-center lg:justify-end items-center relative">
            <div className="absolute w-[480px] h-[480px] rounded-full border border-emerald-500/10 animate-spin-slow" />
            <div className="absolute w-[380px] h-[380px] rounded-full border border-violet-500/10 animate-counter-spin" />

            {FLOATERS.map((f) => (
              <img
                key={f.src}
                src={`/assets/${f.src}.webp`}
                loading="lazy"
                alt=""
                aria-hidden="true"
                width="320"
                height="320"
                className={`hidden lg:block absolute z-20 pointer-events-none object-contain drop-shadow-xl ${f.anim} ${f.className}`}
                style={{ animationDelay: f.delay }}
              />
            ))}

            <div className="relative animate-float">
              <div
                className="absolute -inset-4 rounded-[52px] opacity-30 blur-3xl"
                style={{
                  background:
                    "linear-gradient(135deg, #10b981 0%, #8b5cf6 50%, #f59e0b 100%)",
                }}
              />

              <div
                className="relative w-[290px] w-[310px] h-[580px] sm:h-[620px] rounded-[46px] overflow-hidden shadow-2xl shadow-slate-900/25"
                style={{
                  background:
                    "linear-gradient(160deg, #ffffff 0%, #f1f5f9 100%)",
                  border: "7px solid #0f172a",
                }}
              >
                {/* Dynamic Island */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-7 bg-black rounded-full z-30 flex items-center justify-center gap-1.5 border border-black">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#0d1f11] border border-emerald-600/30" />
                  <div className="w-8 h-1 bg-gray-900 rounded-full" />
                </div>

                {/* Screen */}
                <div className="flex flex-col h-full px-4 pt-14 pb-4">
                  {/* App Top Bar */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <img
                        src="/assets/app_logo.webp"
                        loading="lazy"
                        alt="YouPeak"
                        width="512"
                        height="512"
                        className="w-7 h-7 rounded-xl object-contain"
                      />
                      <span className="font-display font-black text-sm text-slate-900">
                        YouPeak
                      </span>
                    </div>
                    <div
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold"
                      style={{
                        background: "rgba(245,158,11,0.15)",
                        border: "1px solid rgba(245,158,11,0.3)",
                        color: "#b45309",
                      }}
                    >
                      <Coins className="w-3 h-3" />
                      {coinCount.toLocaleString()}
                    </div>
                  </div>

                  {/* Video Thumbnail */}
                  <div
                    className="flex-1 rounded-2xl overflow-hidden relative"
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(139,92,246,0.1) 100%)",
                      border: "1px solid rgba(15,23,42,0.05)",
                    }}
                  >
                    <img
                      src="/assets/hero_screen.webp"
                      srcSet="/assets/hero_screen-360.webp 360w, /assets/hero_screen-540.webp 540w, /assets/hero_screen.webp 720w"
                      sizes="(min-width: 1024px) 280px, 260px"
                      alt="A young woman earning coins while watching videos on YouPeak"
                      width="720"
                      height="1080"
                      loading="lazy"
                      className="w-full h-full object-contain p-2 pt-8"
                    />

                    {/* Live Badge */}
                    <div
                      className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black"
                      style={{
                        background: "rgba(239,68,68,0.9)",
                        color: "white",
                      }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      LIVE EARNING
                    </div>
                  </div>

                  {/* Bottom Task Row */}
                  <div className="flex gap-2 mt-3">
                    <div
                      className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl"
                      style={{
                        background: "rgba(16,185,129,0.12)",
                        border: "1px solid rgba(16,185,129,0.2)",
                      }}
                    >
                      <img
                        src="/assets/emoji/emoji_fire.webp"
                        loading="lazy"
                        alt=""
                        width="160"
                        height="160"
                        className="w-6 h-6 object-contain shrink-0"
                      />
                      <div>
                        <div className="text-[11px] font-black text-slate-900">
                          Daily Check-in
                        </div>
                        <div className="text-[9px] text-slate-500">
                          Day 5 — Streak!
                        </div>
                      </div>
                    </div>
                    <button
                      className="px-3 py-2.5 rounded-xl text-[11px] font-black text-white shrink-0 flex items-center gap-1"
                      style={{
                        background: "linear-gradient(135deg,#10b981,#059669)",
                      }}
                    >
                      <Coins className="w-3 h-3" /> +50
                    </button>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-28 h-1 bg-slate-100 rounded-full" />
            </div>

            {/* FLOATING BADGE 1: Payout notification */}
            <div
              className="absolute -left-2 sm:-left-8 top-24 notif-badge animate-float2"
              style={{
                background: "rgba(255,255,255,0.95)",
                animationDelay: "0.5s",
                maxWidth: "200px",
              }}
            >
              <img
                src="/assets/icons/icon_notif_withdrawn.webp"
                loading="lazy"
                alt=""
                width="256"
                height="256"
                className="w-10 h-10 object-contain shrink-0"
              />
              <div>
                <div className="text-xs font-black text-slate-900">
                  ₹500 Withdrawn!
                </div>
                <div className="text-[10px] text-slate-500">
                  PhonePe · just now
                </div>
              </div>
            </div>

            {/* FLOATING BADGE 2: Coin earned */}
            <div
              className="absolute -right-2 sm:-right-8 bottom-32 notif-badge animate-float2"
              style={{
                background: "rgba(255,255,255,0.95)",
                animationDelay: "1.5s",
                maxWidth: "190px",
              }}
            >
              <img
                src="/assets/icons/icon_notif_coins.webp"
                loading="lazy"
                alt=""
                width="256"
                height="256"
                className="w-10 h-10 object-contain shrink-0"
              />
              <div>
                <div className="text-xs font-black text-amber-600">
                  +25 Coins!
                </div>
                <div className="text-[10px] text-slate-500">Ad watched ✓</div>
              </div>
            </div>

            {/* FLOATING BADGE 3: Referral bonus */}
            <div
              className="absolute -right-2 sm:-right-4 top-16 notif-badge animate-float"
              style={{
                background: "rgba(255,255,255,0.95)",
                animationDelay: "2.5s",
                maxWidth: "190px",
              }}
            >
              <img
                src="/assets/icons/icon_notif_referral.webp"
                loading="lazy"
                alt=""
                width="256"
                height="256"
                className="w-10 h-10 object-contain shrink-0"
              />
              <div>
                <div className="text-xs font-black text-violet-600">
                  +₹100 Referral!
                </div>
                <div className="text-[10px] text-slate-500">
                  Friend signed up
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SCROLLING TICKER */}
      <div
        className="absolute bottom-0 left-0 right-0 py-3 overflow-hidden"
        style={{
          background: "rgba(16,185,129,0.08)",
          borderTop: "1px solid rgba(16,185,129,0.15)",
        }}
      >
        <div className="flex animate-ticker">
          {TICKER_ITEMS.map((item, i) => {
            const Icon = item.icon;
            return (
              <span
                key={i}
                className="flex items-center gap-2 text-xs font-bold text-emerald-700 px-8 whitespace-nowrap border-r border-emerald-500/20"
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                {item.text}
              </span>
            );
          })}
        </div>
      </div>
    </section>
  );
}
