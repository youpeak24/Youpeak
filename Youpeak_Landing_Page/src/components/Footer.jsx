import React from "react";
import { Mail, MapPin, Globe } from "lucide-react";
import { POLICY_LINKS, SITE } from "../config/site";
import StoreAvailability from "./StoreAvailability";

const LINKS = {
  Product: [
    { label: "Download", href: "#download" },
    { label: "Features", href: "#features" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "Pricing", href: "#tiers" },
    { label: "Earnings Calculator", href: "#calculator" },
  ],
  Legal: [
    { label: "Privacy Policy", href: POLICY_LINKS.privacy },
    { label: "Terms of Service", href: POLICY_LINKS.terms },
    { label: "Cookie Policy", href: POLICY_LINKS.cookies },
    { label: "Content Policy", href: POLICY_LINKS.content },
    { label: "Earnings Disclosure", href: POLICY_LINKS.earnings },
    { label: "Refund & Cancellation", href: "/refund-cancellation" },
    { label: "Grievance Information", href: POLICY_LINKS.grievance },
    { label: "HTML Sitemap", href: POLICY_LINKS.sitemap },
  ],
  Support: [
    { label: "Help Center", href: "#faq" },
    { label: "Contact Us", href: POLICY_LINKS.contact },
    { label: "Creator Support", href: "mailto:creators@youpeak.org" },
    { label: "Report Content", href: "mailto:grievance@youpeak.org" },
    { label: "Business Enquiry", href: "mailto:business@youpeak.org" },
  ],
};

export default function Footer() {
  return (
    <footer className="relative bg-slate-50 pt-20 pb-8 px-4 sm:px-6 lg:px-8 border-t border-slate-200">
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(16,185,129,0.3), rgba(139,92,246,0.3), transparent)",
        }}
      />

      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-12 gap-10 mb-16">
          {/* BRAND COLUMN */}
          <div className="col-span-2 md:col-span-4 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl overflow-hidden border border-emerald-500/20">
                <img
                  src="/assets/app_logo.webp"
                  loading="lazy"
                  alt="YouPeak"
                  width="512"
                  height="512"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <span className="font-display font-black text-xl text-slate-900">
                  You<span className="text-gradient-primary">Peak</span>
                </span>
                <p className="text-[10px] text-slate-400 -mt-0.5">
                  Official Platform & Web Portal
                </p>
              </div>
            </div>

            <p className="text-slate-500 text-sm leading-relaxed">
              Information about YouPeak's stated video rewards, optional passes,
              creator monetization and withdrawal conditions.
            </p>

            <div className="space-y-2 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 shrink-0" />
                <a
                  href="mailto:support@youpeak.org"
                  className="hover:text-slate-900 transition-colors"
                >
                  support@youpeak.org
                </a>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                <span>India</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="w-3.5 h-3.5 shrink-0" />
                <a href={SITE.url} className="hover:text-slate-900">www.youpeak.org</a>
              </div>
            </div>

            <p className="text-[11px] text-slate-400">
              Company registration, address and payment-provider claims require business verification.
            </p>
          </div>

          {/* LINKS */}
          {Object.entries(LINKS).map(([title, links]) => (
            <div key={title} className="col-span-1 md:col-span-2 space-y-4">
              <h2 className="font-display font-bold text-sm text-slate-900">
                {title}
              </h2>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-xs text-slate-500 hover:text-slate-900 transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Download column */}
          <div className="col-span-2 md:col-span-2 space-y-4">
            <h2 className="font-display font-bold text-sm text-slate-900">
              App Availability
            </h2>
            <StoreAvailability compact />
          </div>
        </div>

        {/* BOTTOM BAR */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-slate-200">
          <p className="text-xs text-slate-400 text-center sm:text-left">
            © 2026 YouPeak. All rights reserved.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-xs text-slate-300">
            <a
              href={POLICY_LINKS.privacy}
              className="hover:text-slate-700 transition-colors"
            >
              Privacy
            </a>
            <a
              href={POLICY_LINKS.terms}
              className="hover:text-slate-700 transition-colors"
            >
              Terms
            </a>
            <a
              href={POLICY_LINKS.grievance}
              className="hover:text-slate-700 transition-colors"
            >
              Grievance
            </a>
            <span className="flex items-center gap-1">
              <img
                src="/assets/emoji/emoji_india_flag_heart.webp"
                loading="lazy"
                alt=""
                width="160"
                height="160"
                className="w-4 h-4 object-contain"
              />{" "}
              Made in India
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
