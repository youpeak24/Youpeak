export const SITE = Object.freeze({
  name: "YouPeak",
  url: "https://www.youpeak.org",
  locale: "en_IN",
  language: "en-IN",
  description:
    "Learn how YouPeak's video rewards, creator monetization, optional passes, referrals and withdrawal rules are described.",
  socialImage: Object.freeze({
    url: "https://www.youpeak.org/assets/og_image.jpg",
    width: 1200,
    height: 630,
    alt: "YouPeak video rewards and creator platform",
  }),
  emails: Object.freeze({
    support: "support@youpeak.org",
    creators: "creators@youpeak.org",
    business: "business@youpeak.org",
    grievance: "grievance@youpeak.org",
  }),
  stores: Object.freeze({
    // No verified product listing was available during the 2026-09-29 audit.
    googlePlay: null,
    appleAppStore: null,
  }),
});

export const POLICY_LINKS = Object.freeze({
  privacy: "/privacy",
  terms: "/terms",
  cookies: "/cookie-policy",
  content: "/content-policy",
  earnings: "/earnings-disclosure",
  grievance: "/grievance",
  contact: "/contact",
  sitemap: "/sitemap",
});
