import React from "react";
import { Smartphone } from "lucide-react";
import { SITE } from "../config/site";

function StoreLink({ href, children, className = "" }) {
  if (!href) {
    return (
      <span
        aria-disabled="true"
        title="A verified product listing is not available yet"
        className={`store-btn cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-500 ${className}`}
      >
        {children}
        <span className="sr-only"> — verified listing coming soon</span>
      </span>
    );
  }

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={`store-btn ${className}`}>
      {children}
    </a>
  );
}

export default function StoreAvailability({ compact = false }) {
  return (
    <div className={`flex flex-wrap gap-3 ${compact ? "flex-col" : "justify-center sm:justify-start"}`}>
      <StoreLink href={SITE.stores.googlePlay} className={compact ? "text-xs !p-3" : "text-sm"}>
        <Smartphone aria-hidden="true" className="h-5 w-5 shrink-0" />
        <span>Google Play — coming soon</span>
      </StoreLink>
      <StoreLink href={SITE.stores.appleAppStore} className={compact ? "text-xs !p-3" : "text-sm"}>
        <Smartphone aria-hidden="true" className="h-5 w-5 shrink-0" />
        <span>App Store — coming soon</span>
      </StoreLink>
    </div>
  );
}
