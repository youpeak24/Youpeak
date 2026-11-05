import React from "react";
import { Mail, ShieldCheck } from "lucide-react";

const PILLARS = [
  {
    icon: "icon_36h",
    title: "Published Contact",
    desc: "Use the published grievance email for platform complaints and content reports.",
  },
  {
    icon: "icon_bank_security",
    title: "Protect Sensitive Data",
    desc: "Never send an OTP, UPI PIN, password, card number or complete bank credentials by email or chat.",
  },
  {
    icon: "icon_content_guard",
    title: "Policy Review Needed",
    desc: "Detailed moderation, appeals, privacy and security documentation is awaiting business and legal approval.",
  },
];

export default function GrievanceCompliance() {
  return (
    <section id="compliance" className="section px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
            Trust and grievance information
          </div>
          <h2 className="font-display font-black text-4xl sm:text-5xl text-slate-900 tracking-tight leading-tight">
            Know How to <span className="text-gradient-primary">Raise an Issue</span>
          </h2>
          <p className="text-slate-500 text-base">
            Use the published channel below, avoid sharing sensitive credentials,
            and keep a copy of your message and supporting references.
          </p>
        </div>

        {/* 3 PILLARS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {PILLARS.map((p, i) => {
            return (
              <div
                key={i}
                className="glass-card rounded-3xl p-8 text-center space-y-4"
              >
                <img
                  src={`/assets/icons/${p.icon}.webp`}
                  alt=""
                  width="256"
                  height="256"
                  loading="lazy"
                  className="w-24 h-24 object-contain mx-auto drop-shadow-xl"
                />
                <h3 className="font-display font-bold text-xl text-slate-900">
                  {p.title}
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  {p.desc}
                </p>
              </div>
            );
          })}
        </div>

        {/* GRIEVANCE OFFICER CARD */}
        <div
          className="glass-card rounded-3xl p-8 sm:p-10 relative overflow-hidden"
          style={{ border: "1px solid rgba(16,185,129,0.2)" }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent" />
          <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
            <img
              src="/assets/support_art.webp"
              srcSet="/assets/support_art-360.webp 360w, /assets/support_art.webp 720w"
              sizes="176px"
              alt="Friendly support agent ready to help"
              width="720"
              height="720"
              loading="lazy"
              className="w-40 h-40 sm:w-44 sm:h-44 object-contain drop-shadow-xl shrink-0 md:-my-6"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-600 mb-2">
                <img
                  src="/assets/icons/icon_grievance.webp"
                  loading="lazy"
                  alt=""
                  width="256"
                  height="256"
                  className="w-6 h-6 object-contain"
                />
                Published grievance channel
              </div>
              <h3 className="font-display font-black text-2xl text-slate-900 mb-2">
                Issue with our platform?
              </h3>
              <p className="text-slate-500 text-sm max-w-xl">
                Email a concise description, the relevant URL or account reference,
                and the outcome you are requesting. The officer's verified identity,
                postal address and approved response timeline still require publication.
              </p>
            </div>
            <div className="flex flex-col gap-3 shrink-0">
              <a
                href="mailto:grievance@youpeak.org"
                className="btn-primary flex items-center gap-2 whitespace-nowrap"
              >
                <Mail className="w-4 h-4" />
                grievance@youpeak.org
              </a>
              <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                Response time is not guaranteed on this draft site
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
