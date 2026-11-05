import React, { lazy, Suspense, useState } from "react";
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

const QrModal = lazy(() => import("./components/QrModal"));
const ChatWidget = lazy(() => import("./components/ChatWidget"));
const AuthModal = lazy(() => import("./components/AuthModal"));

export default function App() {
  const [qrOpen, setQrOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [chatReady, setChatReady] = useState(false);
  const [authTier, setAuthTier] = useState("free");
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      if (typeof window === "undefined") return null;
      const saved = window.localStorage.getItem("youpeak_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const handleOpenAuth = (tier = "free") => {
    setAuthTier(tier);
    setAuthOpen(true);
  };

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <Navbar
        onOpenQr={() => setQrOpen(true)}
        onOpenAuth={handleOpenAuth}
        currentUser={currentUser}
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
            key={authTier}
            isOpen={authOpen}
            onClose={() => setAuthOpen(false)}
            initialTier={authTier}
            currentUser={currentUser}
            onAuthSuccess={(user) => {
              setCurrentUser(user);
            }}
            onLogout={() => {
              window.localStorage.removeItem("youpeak_user");
              setCurrentUser(null);
              setAuthOpen(false);
            }}
          />
        )}
      </Suspense>
    </div>
  );
}
