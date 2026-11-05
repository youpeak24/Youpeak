import React from "react";
import { Smartphone } from "lucide-react";
import StoreAvailability from "./StoreAvailability";

const CHECKS = [
  "Sign up in 30 seconds",
  "Zero joining fee",
  "Review earning conditions",
  "Withdrawal minimums apply",
];

export default function DownloadCTA({ onOpenQr }) {
  return (
    <section
      id="download"
      className="section px-4 sm:px-6 lg:px-8 relative overflow-hidden"
    >
      {/* MASSIVE BACKGROUND GLOW */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] rounded-full opacity-30 blur-[120px]"
          style={{
            background:
              "radial-gradient(circle, rgba(16,185,129,0.4) 0%, rgba(139,92,246,0.3) 50%, transparent 70%)",
          }}
        />
      </div>

      <div className="max-w-5xl mx-auto relative">
        <div
          className="relative overflow-hidden rounded-3xl p-1"
          style={{
            background:
              "linear-gradient(135deg, rgba(16,185,129,0.5) 0%, rgba(139,92,246,0.5) 50%, rgba(245,158,11,0.5) 100%)",
          }}
        >
          <div
            className="rounded-[22px] p-10 sm:p-16 relative overflow-hidden text-center bg-cover bg-center"
            style={{
              backgroundColor: "#f0fdf9",
              backgroundImage: "url(/assets/bg/cta_bg.webp)",
            }}
          >
            <img
              src="/assets/bg/shapes.webp"
              alt=""
              width="1024"
              height="1024"
              aria-hidden="true"
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover opacity-35 pointer-events-none"
            />
            {/* Decorative orbs */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-500/10 rounded-full blur-2xl pointer-events-none" />

            {/* HERO ART */}
            <img
              src="/assets/cta_art.webp"
              srcSet="/assets/cta_art-480.webp 480w, /assets/cta_art-800.webp 800w, /assets/cta_art.webp 1200w"
              sizes="(max-width: 640px) 90vw, 448px"
              alt="Phone launching upward in a burst of gold coins"
              loading="lazy"
              width="1200"
              height="800"
              className="relative w-full max-w-md mx-auto h-auto -mt-6 sm:-mt-10 drop-shadow-2xl"
            />

            {/* APP ICON */}
            <div className="relative inline-flex -mt-10 mb-8">
              <div className="absolute -inset-2 rounded-3xl bg-gradient-to-br from-emerald-500 to-violet-600 blur opacity-60 animate-glow-pulse" />
              <div className="relative w-20 h-20 rounded-3xl overflow-hidden border-2 border-slate-200 shadow-2xl">
                <img
                  src="/assets/app_logo.webp"
                  loading="lazy"
                  alt="YouPeak"
                width="512"
                height="512"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>

            {/* HEADLINE */}
            <h2 className="relative font-display font-black text-4xl sm:text-6xl text-slate-900 tracking-tight leading-tight mb-4">
              Review the Details. <br />
              <span className="text-gradient-rainbow">Start Free If It Fits.</span>
            </h2>
            <p className="relative text-slate-500 text-base sm:text-lg max-w-xl mx-auto mb-8 leading-relaxed">
              The free plan requires no pass purchase. Review eligibility,
              earning caps and withdrawal conditions before relying on any estimate.
            </p>

            {/* CHECKLIST */}
            <div className="relative flex flex-wrap justify-center gap-4 mb-10">
              {CHECKS.map((c, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 text-sm text-slate-600"
                >
                  <img
                    src="/assets/emoji/emoji_check.webp"
                    loading="lazy"
                    alt=""
                    width="160"
                    height="160"
                    className="w-5 h-5 object-contain shrink-0"
                  />
                  {c}
                </div>
              ))}
            </div>

            {/* STORE BUTTONS */}
            <div className="relative flex flex-wrap justify-center gap-4 mb-6">
              <StoreAvailability />
              <button
                onClick={onOpenQr}
                className="btn-ghost flex items-center gap-2 text-sm"
              >
                <Smartphone className="w-4 h-4" /> Scan QR
              </button>
            </div>

            <p className="relative text-sm text-slate-500">
              Verified Google Play and App Store listing URLs are not available yet.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
