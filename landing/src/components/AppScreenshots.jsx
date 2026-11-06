import React, { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Film,
  Smartphone,
  Video,
  Wallet,
  Users,
  BarChart2,
} from "lucide-react";

const SCREENS = [
  {
    title: "Discovery Feed",
    tag: "Watch & Engage",
    icon: Film,
    img: "/assets/screen_feed.webp",
    color: "from-emerald-500 to-cyan-500",
    desc: "Infinite scroll of trending videos, shorts & live streams in ultra HD with engagement rewards",
  },
  {
    title: "Vertical Shorts",
    tag: "Swipe & Earn Coins",
    icon: Smartphone,
    img: "/assets/screen_shorts.webp",
    color: "from-violet-500 to-purple-600",
    desc: "Full-screen shorts built for single-hand swiping, daily streak bonuses, and low-data mode",
  },
  {
    title: "Creator Studio",
    tag: "Publish & Grow",
    icon: Video,
    img: "/assets/screen_studio.webp",
    color: "from-blue-500 to-indigo-600",
    desc: "Upload videos, set visibility, add hashtags, go live — all from your phone",
  },
  {
    title: "Coin & Reward Hub",
    tag: "Milestones & Coins",
    icon: Wallet,
    img: "/assets/screen_wallet.webp",
    color: "from-amber-400 to-orange-500",
    desc: "Track daily watch coins, milestone streaks, and active pass status with transparent coin balances",
  },
  {
    title: "Referral Network",
    tag: "Invite & Level Up",
    icon: Users,
    img: "/assets/screen_referral.webp",
    color: "from-rose-500 to-pink-500",
    desc: "Share your invite link, watch your friend network grow, and unlock bonus pass multipliers",
  },
  {
    title: "Creator Analytics",
    tag: "Channel Dashboard",
    icon: BarChart2,
    img: "/assets/screen_analytics.webp",
    color: "from-emerald-400 to-teal-500",
    desc: "Real-time statistics on watch minutes, subscriber milestones, viewer retention, and channel reach",
  },
];

export default function AppScreenshots() {
  const [idx, setIdx] = useState(0);
  const screen = SCREENS[idx];
  const ScreenIcon = screen.icon;
  const prev = () => setIdx((i) => (i === 0 ? SCREENS.length - 1 : i - 1));
  const next = () => setIdx((i) => (i === SCREENS.length - 1 ? 0 : i + 1));

  return (
    <section
      id="app-preview"
      className="section px-4 sm:px-6 lg:px-8 relative"
      style={{ background: "#f8fafc" }}
    >
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
            Inside the App
          </div>
          <h2 className="font-display font-black text-4xl sm:text-5xl text-slate-900 tracking-tight leading-tight">
            See It. <span className="text-gradient-purple">Love It.</span>{" "}
            <img
              src="/assets/emoji/emoji_heart_eyes.webp"
              loading="lazy"
              alt=""
              width="160"
              height="160"
              className="inline w-12 h-12 -mt-2 object-contain"
            />{" "}
            Use It.
          </h2>
          <p className="text-slate-500 text-base">
            Tour the app before downloading. Every screen designed for speed &
            delight.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* LEFT: SCREEN LIST */}
          <div className="lg:col-span-5 space-y-3">
            {SCREENS.map((s, i) => {
              const Icon = s.icon;
              return (
                <button
                  key={i}
                  onClick={() => setIdx(i)}
                  className="w-full text-left p-4 rounded-2xl flex items-center gap-4 transition-all duration-300"
                  style={
                    i === idx
                      ? {
                          background: "#ffffff",
                          boxShadow: "0 10px 30px -12px rgba(15,23,42,0.18)",
                          border: "1px solid rgba(15,23,42,0.1)",
                        }
                      : { border: "1px solid transparent" }
                  }
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br ${s.color} ${i === idx ? "shadow-lg scale-110" : "opacity-60"} transition-all`}
                  >
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div
                      className={`font-bold text-sm ${i === idx ? "text-slate-900" : "text-slate-500"} transition-colors`}
                    >
                      {s.title}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                      {s.tag}
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-bold text-slate-400 font-mono shrink-0 ${i === idx ? "text-slate-600" : ""}`}
                  >
                    0{i + 1}
                  </span>
                </button>
              );
            })}
          </div>

          {/* RIGHT: PHONE DISPLAY */}
          <div className="lg:col-span-7 flex flex-col items-center gap-8">
            {/* Screen meta */}
            <div className="text-center space-y-1">
              <div
                className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r ${screen.color} text-white`}
              >
                <ScreenIcon className="w-3.5 h-3.5" />
                {screen.tag}
              </div>
              <h3 className="font-display font-bold text-2xl text-slate-900 mt-2">
                {screen.title}
              </h3>
              <p className="text-slate-500 text-sm max-w-sm mx-auto">
                {screen.desc}
              </p>
            </div>

            {/* Phone */}
            <div className="relative">
              <div
                className={`absolute -inset-8 bg-gradient-to-br ${screen.color} opacity-15 blur-3xl rounded-full`}
              />

              <div
                className="relative w-[260px] h-[520px] rounded-[44px] overflow-hidden shadow-2xl"
                style={{
                  background: "linear-gradient(160deg, #ffffff, #f1f5f9)",
                  border: "6px solid #0f172a",
                }}
              >
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-24 h-5 bg-black rounded-full z-20 border border-black" />
                <div className="absolute inset-0 pt-8">
                  <img
                    key={idx}
                    src={screen.img}
                    srcSet={`${screen.img.replace(".webp", "-360.webp")} 360w, ${screen.img.replace(".webp", "-540.webp")} 540w, ${screen.img} 720w`}
                    sizes="260px"
                    alt={screen.title}
                    width="720"
                    height="1080"
                    loading="lazy"
                    className="w-full h-full object-cover"
                    style={{ animation: "slide-up 0.4s ease-out" }}
                  />
                </div>
              </div>
            </div>

            {/* Prev/Next */}
            <div className="flex items-center gap-4">
              <button
                onClick={prev}
                className="btn-ghost !p-3 !rounded-xl"
                aria-label="Previous"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="flex gap-2">
                {SCREENS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setIdx(i)}
                    aria-label={`Show ${SCREENS[i].title}`}
                    aria-current={i === idx ? "true" : undefined}
                    className="flex h-6 w-6 items-center justify-center rounded-full"
                  >
                    <span
                      aria-hidden="true"
                      className={`h-2 rounded-full transition-all ${i === idx ? "w-6 bg-emerald-600" : "w-2 bg-slate-400"}`}
                    />
                  </button>
                ))}
              </div>
              <button
                onClick={next}
                className="btn-ghost !p-3 !rounded-xl"
                aria-label="Next"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
