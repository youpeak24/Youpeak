import React, { useState, useEffect } from "react";
import { Menu, X, Zap, Calculator } from "lucide-react";

const navLinks = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How It Works" },
  { href: "#calculator", label: "Calculator", icon: Calculator },
  { href: "#tiers", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
];

export default function Navbar({ onOpenQr }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeHash, setActiveHash] = useState("");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    const onHashChange = () => setActiveHash(window.location.hash);
    window.addEventListener("scroll", onScroll);
    window.addEventListener("hashchange", onHashChange);
    onHashChange();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("hashchange", onHashChange);
    };
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "glass-nav py-3 shadow-xl shadow-slate-900/10"
          : "bg-transparent py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* LOGO */}
        <a href="/" aria-label="YouPeak home" className="flex items-center gap-3 group">
          <div className="relative w-10 h-10">
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-emerald-500 to-violet-600 animate-glow-pulse blur-sm" />
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-violet-600 p-0.5 shadow-lg flex items-center justify-center overflow-hidden">
              <img
                src="/assets/app_logo.webp"
                loading="lazy"
                alt="YouPeak"
                width="512"
                height="512"
                className="w-full h-full object-contain rounded-[10px]"
              />
            </div>
          </div>
          <div>
            <span className="font-display font-black text-xl text-slate-900 tracking-tight">
              You<span className="text-gradient-primary">Peak</span>
            </span>
          </div>
        </a>

        {/* DESKTOP NAV */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <a
                key={link.href}
                href={link.href}
                aria-current={activeHash === link.href ? "location" : undefined}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-all duration-200"
              >
                {Icon && <Icon className="w-3.5 h-3.5" />}
                {link.label}
              </a>
            );
          })}
        </nav>

        {/* DESKTOP CTA */}
        <div className="hidden lg:flex items-center gap-3">
          <button
            onClick={onOpenQr}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            Scan QR
          </button>
          <a
            href="#download"
            className="btn-primary flex items-center gap-2 text-sm !py-2.5 !px-5"
          >
            <Zap className="w-4 h-4" />
            Download Free
          </a>
        </div>

        {/* MOBILE MENU BUTTON */}
        <div className="md:hidden flex items-center gap-2">
          <a
            href="#download"
            className="btn-primary text-xs !py-2 !px-4 flex items-center gap-1.5"
          >
            <Zap className="w-3.5 h-3.5" /> Get App
          </a>
          <button
            onClick={() => setOpen(!open)}
            aria-label={open ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={open}
            aria-controls="mobile-navigation"
            className="p-2 text-slate-700 hover:text-slate-900"
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* MOBILE MENU */}
      {open && (
        <div id="mobile-navigation" className="md:hidden glass-nav border-t border-slate-200 px-4 py-6 space-y-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <a
                key={link.href}
                href={link.href}
                aria-current={activeHash === link.href ? "location" : undefined}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-all"
              >
                {Icon && <Icon className="w-4 h-4" />}
                {link.label}
              </a>
            );
          })}
          <div className="pt-3 space-y-2 border-t border-slate-200">
            <button
              onClick={() => {
                setOpen(false);
                onOpenQr();
              }}
              className="w-full btn-ghost text-sm !py-3 flex items-center justify-center gap-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
              </svg>
              Scan QR Code
            </button>
            <a
              href="#download"
              onClick={() => setOpen(false)}
              className="w-full btn-primary text-sm !py-3 text-center flex items-center justify-center gap-2 block"
            >
              <Zap className="w-4 h-4" /> Download Free Now
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
