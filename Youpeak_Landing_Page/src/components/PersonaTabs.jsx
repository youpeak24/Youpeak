import React, { useState } from "react";
import {
  Eye,
  Film,
  Users,
  ArrowRight,
  Tv,
  Trophy,
  ThumbsUp,
  Clock,
  MonitorPlay,
  Gem,
  Lock,
  BarChart2,
  Mail,
  Timer,
  Briefcase,
  Infinity as InfinityIcon,
} from "lucide-react";

const TABS = [
  {
    id: "tasker",
    icon: Eye,
    label: "For Users",
    color: "emerald",
    gradient: "from-emerald-500 to-cyan-500",
  },
  {
    id: "creator",
    icon: Film,
    label: "For Creators",
    color: "violet",
    gradient: "from-violet-500 to-purple-600",
  },
  {
    id: "partner",
    icon: Users,
    label: "For Partners",
    color: "amber",
    gradient: "from-amber-400 to-orange-500",
  },
];

const CONTENT = {
  tasker: {
    headline: "Understand Video Reward Limits",
    sub: "The free plan currently lists a maximum ₹10 daily cap. Results depend on valid activity, available tasks, eligibility and current withdrawal rules.",
    image: "/assets/persona_watch.webp",
    badge: "Caps are not guaranteed income",
    badgeColor: "text-emerald-600",
    points: [
      {
        icon: Tv,
        title: "Watch 20 sponsored clips/day (30 sec each)",
        sub: "30-second clips · 25 coins per ad watched",
        iconClass: "icon-cyan",
      },
      {
        icon: Trophy,
        title: "7-Day streak bonuses",
        sub: "More you watch, more you earn",
        iconClass: "icon-gold",
      },
      {
        icon: ThumbsUp,
        title: "Like & comment rewards",
        sub: "2-5 coins per engagement",
        iconClass: "icon-green",
      },
      {
        icon: Clock,
        title: "2-hour milestone bonus",
        sub: "+500 coins for 120 min watch",
        iconClass: "icon-purple",
      },
    ],
  },
  creator: {
    headline: "Compare Stated Creator Revenue Shares",
    sub: "Current plan tables describe several creator revenue streams and different shares by pass. Availability, eligible revenue, fees and payout timing require confirmation in the creator agreement.",
    image: "/assets/persona_creator.webp",
    badge: "Up to 90% stated share",
    badgeColor: "text-violet-600",
    points: [
      {
        icon: MonitorPlay,
        title: "Long-Video & Shorts Ad Split",
        sub: "50–80% long-video · 50–70% shorts",
        iconClass: "icon-blue",
      },
      {
        icon: Gem,
        title: "Fan Funding — Up to 90%",
        sub: "Direct UPI bypasses 30% app store fees",
        iconClass: "icon-purple",
      },
      {
        icon: Lock,
        title: "0% Merch Store Fee (VIP)",
        sub: "Keep 100% of merch & store profits",
        iconClass: "icon-pink",
      },
      {
        icon: BarChart2,
        title: "BrandConnect — 0% Platform Fee",
        sub: "100% sponsorship funds go to you",
        iconClass: "icon-cyan",
      },
    ],
  },
  partner: {
    headline: "Review Referral Eligibility and Caps",
    sub: "The site advertises staged referral rewards and partner commissions. These are conditional program amounts, not guaranteed earnings; validation, holding periods, caps and current terms apply.",
    image: "/assets/persona_referral.webp",
    badge: "Up to ₹200 advertised reward",
    badgeColor: "text-amber-600",
    points: [
      {
        icon: Mail,
        title: "Stage 1: ₹100 on Registration",
        sub: "Friend downloads via link + completes OTP",
        iconClass: "icon-green",
      },
      {
        icon: Timer,
        title: "Stage 2: ₹100 on Watch Time",
        sub: "They complete 100 watch-mins within 7 days",
        iconClass: "icon-gold",
      },
      {
        icon: Briefcase,
        title: "15% VIP Creator · 10% User Onboarding",
        sub: "Commission on every onboarding in your district",
        iconClass: "icon-purple",
      },
      {
        icon: InfinityIcon,
        title: "30% Local Ads · 20% Digital Partner",
        sub: "Earn on ad margins & district expansion",
        iconClass: "icon-cyan",
      },
    ],
  },
};

export default function PersonaTabs() {
  const [active, setActive] = useState("tasker");
  const data = CONTENT[active];
  const tab = TABS.find((t) => t.id === active);
  const TabIcon = tab.icon;

  return (
    <section id="personas" className="section px-4 sm:px-6 lg:px-8 relative">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-4">
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
            Who is YouPeak for?
          </div>
          <h2 className="font-display font-black text-4xl sm:text-5xl text-slate-900 tracking-tight leading-tight">
            Built for <span className="text-gradient-primary">Everyone</span>
          </h2>
          <p className="text-slate-500 text-base">
            Pick your role and see exactly how YouPeak works for you
          </p>
        </div>

        {/* TAB BUTTONS */}
        <div className="flex justify-center mb-10">
          <div
            role="tablist"
            aria-label="YouPeak user types"
            className="glass rounded-2xl p-1.5 flex gap-1"
            style={{ border: "1px solid rgba(15,23,42,0.06)" }}
          >
            {TABS.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  id={`persona-tab-${t.id}`}
                  role="tab"
                  aria-selected={active === t.id}
                  aria-controls="persona-panel"
                  aria-label={t.label}
                  onClick={() => setActive(t.id)}
                  className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${
                    active === t.id
                      ? `bg-gradient-to-r ${t.gradient} text-white shadow-lg`
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* CONTENT PANEL */}
        <div
          id="persona-panel"
          role="tabpanel"
          aria-labelledby={`persona-tab-${active}`}
          className="glass-card rounded-3xl overflow-hidden"
          key={active}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* LEFT: TEXT */}
            <div className="p-8 sm:p-12 space-y-6">
              <div
                className="inline-flex items-center gap-2 text-xs font-black px-3 py-1.5 rounded-full"
                style={{
                  background: "rgba(15,23,42,0.06)",
                  border: "1px solid rgba(15,23,42,0.08)",
                }}
              >
                <TabIcon className={`w-3.5 h-3.5 ${data.badgeColor}`} />
                <span className={data.badgeColor}>{data.badge}</span>
              </div>

              <h3 className="font-display font-black text-2xl sm:text-3xl text-slate-900 leading-tight">
                {data.headline}
              </h3>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                {data.sub}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {data.points.map((p, i) => {
                  const PointIcon = p.icon;
                  return (
                    <div
                      key={i}
                      className="flex items-start gap-3 p-4 rounded-2xl"
                      style={{
                        background: "rgba(15,23,42,0.03)",
                        border: "1px solid rgba(15,23,42,0.05)",
                      }}
                    >
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${p.iconClass}`}
                      >
                        <PointIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">
                          {p.title}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {p.sub}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <a
                href="#download"
                className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white shadow-lg bg-gradient-to-r ${tab.gradient}`}
              >
                Start {tab.label} <ArrowRight className="w-4 h-4" />
              </a>
            </div>

            {/* RIGHT: IMAGE */}
            <div
              className="flex items-center justify-center p-8 relative overflow-hidden"
              style={{
                background:
                  "linear-gradient(135deg, rgba(15,23,42,0.02), transparent)",
              }}
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${tab.gradient} opacity-[0.06]`}
              />
              <img
                src={data.image}
                loading="lazy"
                srcSet={`${data.image.replace(".webp", "-360.webp")} 360w, ${data.image.replace(".webp", "-540.webp")} 540w, ${data.image} 720w`}
                sizes="(max-width: 640px) 288px, 384px"
                alt={data.headline}
                width="720"
                height="720"
                className="w-72 sm:w-96 h-auto object-contain drop-shadow-2xl relative z-10 animate-float"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
