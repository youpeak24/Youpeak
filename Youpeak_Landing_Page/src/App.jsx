import React, { lazy, Suspense, useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { MessageCircle } from "lucide-react";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import PersonaTabs from "./components/PersonaTabs";
import FeaturesGrid from "./components/FeaturesGrid";
import EarningsCalculator from "./components/EarningsCalculator";
import AppScreenshots from "./components/AppScreenshots";
import HowItWorks from "./components/HowItWorks";
import TiersPricing from "./components/TiersPricing";
import GrievanceCompliance from "./components/GrievanceCompliance";
import FaqAccordion from "./components/FaqAccordion";
import DownloadCTA from "./components/DownloadCTA";
import Footer from "./components/Footer";
import { loadSession, logout as portalLogout, onSessionChange } from "./lib/portal";

const QrModal = lazy(() => import("./components/QrModal"));
const ChatWidget = lazy(() => import("./components/ChatWidget"));
const AuthModal = lazy(() => import("./components/AuthModal"));

export default function App() {
  const [qrOpen, setQrOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [chatReady, setChatReady] = useState(false);
  // { mode: "login" | "signup", plan?: tier id to buy after signing in }
  const [intent, setIntent] = useState({ mode: "signup" });
  // The server snapshot is "signed out", so the prerendered HTML and the first
  // client render always match; the stored session appears right after hydration.
  const session = useSyncExternalStore(onSessionChange, loadSession, () => null);

  // /?plan=tier_tasker_bronze (the app's "buy on the web" link, or a shared
  // link) opens checkout for that plan once the visitor is signed in.
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const plan = params.get("plan");
      if (plan) {
        // Arriving from the app means the visitor already has an account.
        setIntent({ mode: loadSession() || params.get("source") === "app" ? "login" : "signup", plan });
        setAuthOpen(true);
      }
    } catch {
      /* no URL access: nothing to open */
    }
  }, []);

  // Every "Sign up", "Log in", "Buy" button funnels through here. A plain
  // string is a plan id; an object sets the mode explicitly.
  const handleOpenAuth = useCallback((arg) => {
    const next = typeof arg === "string" ? { plan: arg, mode: "signup" } : { mode: "signup", ...(arg || {}) };
    setIntent(next);
    setAuthOpen(true);
  }, []);

  const handleLogout = useCallback(() => {
    portalLogout();
    setAuthOpen(false);
  }, []);

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <Navbar
        onOpenQr={() => setQrOpen(true)}
        onOpenAuth={handleOpenAuth}
        session={session}
      />
      <main id="main-content">
        <Hero onOpenQr={() => setQrOpen(true)} onOpenAuth={handleOpenAuth} />
        <PersonaTabs onSelectPass={handleOpenAuth} />
        <FeaturesGrid />
        <EarningsCalculator
          onOpenQr={() => setQrOpen(true)}
          onSelectPass={handleOpenAuth}
        />
        <AppScreenshots />
        <HowItWorks onOpenQr={() => setQrOpen(true)} />
        <TiersPricing onSelectPass={handleOpenAuth} />
        <GrievanceCompliance />
        <FaqAccordion />
        <DownloadCTA onOpenQr={() => setQrOpen(true)} />
      </main>
      <Footer />
      {!chatReady && (
        <button
          type="button"
          onClick={() => setChatReady(true)}
          aria-label="Open YouPeak Assistant"
          className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-2xl shadow-emerald-600/30 transition-transform hover:scale-105 focus-visible:scale-105 sm:h-16 sm:w-16"
        >
          <MessageCircle aria-hidden="true" className="h-7 w-7" />
        </button>
      )}
      <Suspense fallback={null}>
        {chatReady && <ChatWidget initialOpen />}
        {qrOpen && <QrModal onClose={() => setQrOpen(false)} />}
        {authOpen && (
          <AuthModal
            key={`${intent.mode}-${intent.plan || ""}`}
            isOpen={authOpen}
            onClose={() => setAuthOpen(false)}
            intent={intent}
            session={session}
            onLogout={handleLogout}
          />
        )}
      </Suspense>
    </div>
  );
}
