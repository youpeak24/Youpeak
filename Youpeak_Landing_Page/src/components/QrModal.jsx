import React, { useEffect, useRef } from "react";
import { X, Smartphone } from "lucide-react";
import StoreAvailability from "./StoreAvailability";

export default function QrModal({ onClose }) {
  const closeButton = useRef(null);

  useEffect(() => {
    const previous = document.activeElement;
    closeButton.current?.focus();
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previous?.focus?.();
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.45)", backdropFilter: "blur(20px)" }}
      onClick={onClose}
      role="presentation"
    >
      <div
        className="glass-card rounded-3xl p-8 max-w-xs w-full text-center relative"
        style={{
          border: "1px solid rgba(16,185,129,0.2)",
          boxShadow: "0 0 60px rgba(16,185,129,0.15)",
        }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="qr-modal-title"
      >
        <button
          ref={closeButton}
          onClick={onClose}
          aria-label="Close download information"
          className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex justify-center mb-4">
          <img
            src="/assets/logo_mark.webp"
            loading="lazy"
            alt="YouPeak"
            width="256"
            height="256"
            className="w-16 h-16 object-contain drop-shadow-lg"
          />
        </div>

        <h3 id="qr-modal-title" className="font-display font-black text-xl text-slate-900 mb-1">
          Store Listings Coming Soon
        </h3>
        <p className="text-slate-500 text-sm mb-6">
          A verified app download destination has not been published.
        </p>

        {/* Honest fallback until a first-party listing is verified. */}
        <div
          className="p-4 rounded-2xl mx-auto w-fit mb-5"
          style={{
            background: "rgba(15,23,42,0.04)",
            border: "1px solid rgba(15,23,42,0.06)",
          }}
        >
          <div className="w-48 h-48 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 text-sm flex-col gap-2 p-3">
            <img
              src="/assets/empty_state.webp"
              loading="lazy"
              alt=""
              width="720"
              height="720"
              className="w-24 h-24 object-contain"
            />
            <span>QR code unavailable until a store listing is verified.</span>
          </div>
        </div>

        <p className="flex items-center justify-center gap-1.5 text-slate-400 text-xs mb-4">
          <Smartphone className="w-3.5 h-3.5" /> Product availability is awaiting verification
        </p>

        <StoreAvailability compact />
      </div>
    </div>
  );
}
