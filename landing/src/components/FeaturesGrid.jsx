import React from "react";
import { ArrowRight } from "lucide-react";

const FEATURES = [
  {
    icon: "icon_hd_video",
    title: "HD Video & Shorts",
    desc: "The product describes adaptive video and short-form playback; actual quality depends on the app, device and network.",
    tag: "Streaming",
    gradient: "from-cyan-500/10 to-blue-500/10",
    border: "rgba(6,182,212,0.2)",
  },
  {
    icon: "icon_coins",
    title: "Real Coin Rewards",
    desc: "Eligible activity may earn coins under current platform rules. The site lists 100 coins = ₹1 INR.",
    tag: "Earn",
    gradient: "from-amber-500/10 to-orange-500/10",
    border: "rgba(245,158,11,0.2)",
  },
  {
    icon: "icon_referral",
    title: "Referral Program",
    desc: "Advertised referral rewards require qualifying registration, activity validation and current program eligibility.",
    tag: "Referrals",
    gradient: "from-violet-500/10 to-purple-500/10",
    border: "rgba(139,92,246,0.2)",
  },
  {
    icon: "icon_upi_cashout",
    title: "UPI Withdrawal Requests",
    desc: "Request a withdrawal after meeting the stated minimums; verification and processing conditions apply.",
    tag: "Payments",
    gradient: "from-emerald-500/10 to-green-500/10",
    border: "rgba(16,185,129,0.2)",
  },
  {
    icon: "icon_ppv_lock",
    title: "Pay-Per-View Content",
    desc: "The site describes paid content with a stated creator share. Binding creator and viewer terms should confirm the calculation.",
    tag: "Creator",
    gradient: "from-rose-500/10 to-pink-500/10",
    border: "rgba(236,72,153,0.2)",
  },
  {
    icon: "icon_legal_shield",
    title: "Grievance Contact",
    desc: "A complaint email is published. Complete legal, moderation and officer details still require verification.",
    tag: "Safety",
    gradient: "from-blue-500/10 to-indigo-500/10",
    border: "rgba(59,130,246,0.2)",
  },
];

export default function FeaturesGrid() {
  return (
    <section
      id="features"
      className="section bg-slate-50 bg-cover bg-center px-4 sm:px-6 lg:px-8"
      style={{ backgroundImage: "url(/assets/bg/section_glow.webp)" }}
    >
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
            What makes us different
          </div>
          <h2 className="font-display font-black text-4xl sm:text-5xl text-slate-900 tracking-tight leading-tight">
            Everything You Need <br />
            <span className="text-gradient-primary">in One App</span>
          </h2>
          <p className="text-slate-500 text-base">
            Built different. Designed to reward you, not exploit you.
          </p>
        </div>

        {/* GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f, i) => {
            return (
              <div
                key={i}
                className="glass-card rounded-3xl p-8 relative overflow-hidden group cursor-pointer"
                style={{ border: `1px solid ${f.border}` }}
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${f.gradient} opacity-40 group-hover:opacity-70 transition-opacity`}
                />

                {/* Top row */}
                <div className="relative flex items-center justify-between mb-6">
                  <img
                    src={`/assets/icons/${f.icon}.webp`}
                    alt=""
                    width="256"
                    height="256"
                    loading="lazy"
                    className="w-20 h-20 -my-3 -ml-2 object-contain drop-shadow-lg group-hover:scale-110 transition-transform"
                  />
                  <span
                    className="text-[11px] font-bold px-3 py-1 rounded-full"
                    style={{
                      background: "rgba(15,23,42,0.05)",
                      color: "rgba(15,23,42,0.5)",
                      border: "1px solid rgba(15,23,42,0.07)",
                    }}
                  >
                    {f.tag}
                  </span>
                </div>

                {/* Content */}
                <div className="relative">
                  <h3 className="font-display font-bold text-xl text-slate-900 mb-3">
                    {f.title}
                  </h3>
                  <p className="text-slate-500 text-sm leading-relaxed">
                    {f.desc}
                  </p>
                </div>

                {/* Bottom arrow */}
                <div className="relative flex items-center gap-1 mt-6 text-xs font-bold text-slate-400 group-hover:text-slate-700 transition-colors">
                  <span>Learn more</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
