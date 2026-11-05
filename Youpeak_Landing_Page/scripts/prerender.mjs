import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");
const templatePath = path.join(DIST, "index.html");
const { render } = await import(pathToFileURL(path.join(ROOT, "dist-ssr", "entry-server.js")));

const template = await fs.readFile(templatePath, "utf8");
const appHtml = render();
if (!appHtml.includes("<h1")) throw new Error("Prerendered homepage is missing its H1");
await fs.writeFile(templatePath, template.replace('<div id="root"></div>', `<div id="root">${appHtml}</div>`));

const stylesheet = template.match(/<link rel="stylesheet" crossorigin href="([^"]+)">/)?.[1];

const pages = [
  {
    slug: "privacy",
    title: "Privacy Policy",
    summary: "How YouPeak collects, uses, protects, and stores user information and authentication data.",
    items: [
      "User authentication and phone numbers are securely verified via OTP for account security.",
      "Engagement coins and milestone records are stored securely in bank-grade infrastructure.",
      "YouPeak never shares, sells, or rents personal identifiable information to unauthorized third-party advertisers.",
      "In-app activities operate with engagement coins; payments for optional passes take place via encrypted Razorpay/UPI gateways on the web portal.",
      "For data modification or account deletion requests, email our compliance team at support@youpeak.org.",
    ],
  },
  {
    slug: "terms",
    title: "Terms of Service",
    summary: "Rules, obligations, and terms governing the use of the YouPeak platform, web portal, and mobile application.",
    items: [
      "Eligibility: Users must be at least 18 years old or have parental consent to use the service in India.",
      "Free User Tier: Anyone can watch videos, complete daily tasks, earn coins (up to ₹10 / 1,000 coins/day), and request UPI withdrawals.",
      "Pass Upgrades: Optional Starter Passes (Bronze ₹999, Silver ₹2,499, Gold ₹4,999, Platinum ₹9,999, Diamond ₹24,999) raise daily caps and unlock referral multipliers. Passes are activated on the official website.",
      "Engagement Integrity: Botting, click farms, VPN spoofing, emulator automation, or fake accounts are strictly prohibited and result in immediate account termination.",
      "Withdrawals: Payouts are made via UPI or bank transfer with a minimum first threshold of ₹100, and subsequent thresholds of ₹500 for Users and ₹1,000 for Creators.",
    ],
  },
  {
    slug: "cookie-policy",
    title: "Cookie and Storage Policy",
    summary: "Explanation of local storage, session cookies, and technical identifiers utilized on YouPeak.",
    items: [
      "Local Storage: Used to maintain user session persistence (youpeak_user) after web portal registration or login.",
      "Technical Session Identifiers: Used to prevent session hijacking and provide fast, secure page loads.",
      "No Third-Party Ad Trackers: YouPeak's website does not deploy predatory third-party advertising cookies or cross-site tracking pixels.",
      "Users can clear browser local storage or cookies at any time through standard browser privacy settings.",
    ],
  },
  {
    slug: "content-policy",
    title: "Content & Community Guidelines",
    summary: "Creator publishing standards, intellectual property rules, and prohibited content policies.",
    items: [
      "Creator Rights: Creators retain copyright over their original video uploads and grant YouPeak a distribution license.",
      "Monetization Splits: Up to 80% long-video ad split, 70% shorts share, and 90% direct fan funding via Creator VIP Passes.",
      "Prohibited Material: Explicit adult content, hate speech, violence, defamation, copyright infringement, and deceptive scams are strictly forbidden.",
      "Automated Screening: YouPeak uses real-time keyword screening and media analysis to safeguard community safety.",
      "Report Infringements: To report copyright or community violations, email grievance@youpeak.org with relevant video timestamps and links.",
    ],
  },
  {
    slug: "earnings-disclosure",
    title: "Earnings & Multiplier Disclosure",
    summary: "Transparent mathematical guidelines, daily caps, referral multipliers, and payout terms.",
    items: [
      "Caps vs Guarantees: Daily caps (e.g. ₹10 for Free, ₹20 for Bronze, ₹40 for Silver, ₹120 for Gold, ₹166.67 for Platinum, ₹333.33 for Diamond) are maximum limits based on complete daily task activity.",
      "Fixed Conversion: 100 Coins = ₹1 INR across all tiers with zero hidden deductions.",
      "Referral Multipliers: Direct 10% pass commission (Bronze ₹100, Silver ₹250, Gold ₹500, Platinum ₹1,000, Diamond ₹2,500 = ₹4,350 total base) with pass-level multipliers from 1x up to ~23x.",
      "Creator Revenue: Variable based on genuine advertiser demand, views, viewer retention, and direct fan funding contributions.",
      "Pass Nature: Passes are feature and capacity upgrades, NOT speculative investments or guaranteed financial return instruments.",
    ],
  },
  {
    slug: "refund-cancellation",
    title: "Refund & Cancellation Policy",
    summary: "Conditions regarding pass upgrades, ad credits allocation, and billing inquiries.",
    items: [
      "Pass Activation: User passes and Creator VIP passes are digital memberships activated immediately with 100% matched Ad Credits.",
      "Billing Inquiries: In case of accidental duplicate payment or technical billing errors, notify support@youpeak.org within 48 hours with your transaction reference ID.",
      "Security Notice: Never send passwords, OTPs, UPI PINs, or confidential card CVVs to any support agent.",
      "Renewal Rules: User Passes (Levels 1–4) are one-time passes that do not renew. Diamond Pass and Creator VIP Passes renew annually with upfront notification.",
    ],
  },
  {
    slug: "grievance",
    title: "Grievance Redressal Mechanism",
    summary: "Statutory compliance under the Information Technology (Intermediary Guidelines) Rules, 2021.",
    items: [
      "Designated Channel: Formal grievances, legal notices, and compliance complaints must be submitted to grievance@youpeak.org.",
      "Enforceable SLA: Acknowledgment within 24 hours and statutory resolution within 36 hours of receipt.",
      "Submission Details: State your full name, registered mobile number, clear description of the issue, and supporting evidence or URLs.",
      "Jurisdiction: Operating under the jurisdiction and legal framework of the Republic of India.",
    ],
  },
  {
    slug: "contact",
    title: "Official Contact Directory",
    summary: "Direct communication channels for customer support, creator partnerships, grievances, and business queries.",
    items: [
      "General User Support: support@youpeak.org (Replies within a few hours)",
      "Creator Partnerships & VIP Passes: creators@youpeak.org",
      "Business & Advertiser Enquiries: business@youpeak.org",
      "Statutory Grievance Officer: grievance@youpeak.org (36-hour resolution SLA)",
      "Official Web Portal: https://www.youpeak.org",
    ],
  },
];

const escapeHtml = (value) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
const linkifyEmail = (value) => escapeHtml(value).replace(
  /([\w.+-]+@[\w-]+(?:\.[\w-]+)+)/g,
  '<a class="font-semibold text-emerald-700 underline" href="mailto:$1">$1</a>',
);

// Render Trust Pages
for (const page of pages) {
  const canonical = `https://www.youpeak.org/${page.slug}`;
  const html = `<!doctype html>
<html lang="en-IN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(page.title)} | YouPeak</title>
<meta name="description" content="${escapeHtml(page.summary)}">
<meta name="robots" content="index, follow"><link rel="canonical" href="${canonical}">
<link rel="icon" type="image/png" sizes="32x32" href="/assets/favicon_32.png">${stylesheet ? `<link rel="stylesheet" crossorigin href="${stylesheet}">` : ""}
</head><body class="bg-slate-50 text-slate-900 antialiased"><main class="min-h-screen px-4 py-16 sm:px-6">
<article class="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-12">
<a class="font-semibold text-emerald-700 underline flex items-center gap-1.5" href="/">← Back to YouPeak Homepage</a>
<p class="mt-8 text-xs font-bold uppercase tracking-widest text-emerald-700">Official YouPeak Platform Policy · Transparency & Compliance</p>
<h1 class="mt-3 text-4xl font-black tracking-tight">${escapeHtml(page.title)}</h1>
<p class="mt-5 text-lg leading-8 text-slate-600">${escapeHtml(page.summary)}</p>
<ul class="mt-8 list-disc space-y-4 pl-6 text-slate-700">${page.items.map((item) => `<li>${linkifyEmail(item)}</li>`).join("")}</ul>
<p class="mt-10 border-t border-slate-200 pt-6 text-sm text-slate-500">Effective Date: October 2026. For questions regarding this policy, contact our compliance team at support@youpeak.org or grievance@youpeak.org.</p>
</article></main></body></html>`;
  await fs.writeFile(path.join(DIST, `${page.slug}.html`), html);
}

// Generate Detailed HTML Sitemap Page
const sitemapHtml = `<!doctype html>
<html lang="en-IN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>YouPeak Sitemap | Complete Index of Pages, Tiers & Features</title>
  <meta name="description" content="Explore the full sitemap of YouPeak, including interactive sections, User Passes, Creator VIP tiers, earnings calculators, legal documents, and contact channels.">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="https://www.youpeak.org/sitemap">
  <link rel="icon" type="image/png" sizes="32x32" href="/assets/favicon_32.png">
  ${stylesheet ? `<link rel="stylesheet" crossorigin href="${stylesheet}">` : ""}
</head>
<body class="bg-slate-50 text-slate-900 antialiased min-h-screen">
  <header class="border-b border-slate-200 bg-white/90 backdrop-blur py-4 px-4 sm:px-6 sticky top-0 z-50">
    <div class="max-w-6xl mx-auto flex items-center justify-between">
      <a href="/" class="flex items-center gap-2.5 font-display font-black text-xl text-slate-900">
        <img src="/assets/app_logo.webp" alt="YouPeak" class="w-8 h-8 rounded-lg object-contain" width="32" height="32">
        <span>You<span class="text-gradient-primary">Peak</span></span>
      </a>
      <a href="/" class="text-xs font-bold text-slate-600 hover:text-emerald-600 transition-colors">
        ← Back to Homepage
      </a>
    </div>
  </header>

  <main class="max-w-6xl mx-auto px-4 py-12 sm:px-6">
    <div class="mb-12">
      <span class="text-xs font-bold uppercase tracking-widest text-emerald-600 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 inline-block mb-3">
        Comprehensive Platform Directory
      </span>
      <h1 class="text-4xl sm:text-5xl font-black tracking-tight text-slate-900">
        YouPeak <span class="text-gradient-primary">Sitemap</span>
      </h1>
      <p class="text-slate-600 text-base mt-3 max-w-2xl">
        Complete overview of all accessible platform sections, membership pass tiers, creator monetization tiers, earning tools, legal policies, and machine-readable feeds.
      </p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      <!-- Section 1: Main Platform & Interactive Sections -->
      <div class="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
        <div>
          <div class="flex items-center gap-2 mb-4">
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <h2 class="text-lg font-black text-slate-900">Core Platform Sections</h2>
          </div>
          <ul class="space-y-3 text-sm text-slate-600">
            <li>
              <a href="/" class="font-bold text-slate-900 hover:text-emerald-600 flex items-center justify-between">
                <span>Homepage</span>
                <span class="text-xs text-slate-400">/</span>
              </a>
              <p class="text-xs text-slate-500">Main portal and platform overview</p>
            </li>
            <li>
              <a href="/#features" class="font-bold text-slate-900 hover:text-emerald-600 flex items-center justify-between">
                <span>Platform Features</span>
                <span class="text-xs text-slate-400">/#features</span>
              </a>
              <p class="text-xs text-slate-500">20 daily ads (30s), likes, comments, and streaks</p>
            </li>
            <li>
              <a href="/#personas" class="font-bold text-slate-900 hover:text-emerald-600 flex items-center justify-between">
                <span>Persona Hub</span>
                <span class="text-xs text-slate-400">/#personas</span>
              </a>
              <p class="text-xs text-slate-500">Dashboards for Users, Creators, and Partners</p>
            </li>
            <li>
              <a href="/#how-it-works" class="font-bold text-slate-900 hover:text-emerald-600 flex items-center justify-between">
                <span>How It Works</span>
                <span class="text-xs text-slate-400">/#how-it-works</span>
              </a>
              <p class="text-xs text-slate-500">4-step guide: Download, Watch, Earn, UPI Payout</p>
            </li>
            <li>
              <a href="/#calculator" class="font-bold text-slate-900 hover:text-emerald-600 flex items-center justify-between">
                <span>Earnings Calculator</span>
                <span class="text-xs text-slate-400">/#calculator</span>
              </a>
              <p class="text-xs text-slate-500">Dual calculator for Users & Creators</p>
            </li>
            <li>
              <a href="/#app-preview" class="font-bold text-slate-900 hover:text-emerald-600 flex items-center justify-between">
                <span>Inside the App</span>
                <span class="text-xs text-slate-400">/#app-preview</span>
              </a>
              <p class="text-xs text-slate-500">Feed, vertical shorts, wallet, referral network</p>
            </li>
            <li>
              <a href="/#tiers" class="font-bold text-slate-900 hover:text-emerald-600 flex items-center justify-between">
                <span>Pricing & Passes</span>
                <span class="text-xs text-slate-400">/#tiers</span>
              </a>
              <p class="text-xs text-slate-500">Complete pricing table for all tiers</p>
            </li>
            <li>
              <a href="/#compliance" class="font-bold text-slate-900 hover:text-emerald-600 flex items-center justify-between">
                <span>Statutory Compliance</span>
                <span class="text-xs text-slate-400">/#compliance</span>
              </a>
              <p class="text-xs text-slate-500">IT Rules 2021 & Grievance Redressal</p>
            </li>
            <li>
              <a href="/#faq" class="font-bold text-slate-900 hover:text-emerald-600 flex items-center justify-between">
                <span>Frequently Asked Questions</span>
                <span class="text-xs text-slate-400">/#faq</span>
              </a>
              <p class="text-xs text-slate-500">Top questions, coins conversion, and rules</p>
            </li>
            <li>
              <a href="/#download" class="font-bold text-slate-900 hover:text-emerald-600 flex items-center justify-between">
                <span>Get App & Signup</span>
                <span class="text-xs text-slate-400">/#download</span>
              </a>
              <p class="text-xs text-slate-500">Direct website registration and app QR scan</p>
            </li>
          </ul>
        </div>
      </div>

      <!-- Section 2: User Passes & Tiers -->
      <div class="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
        <div>
          <div class="flex items-center gap-2 mb-4">
            <span class="w-2.5 h-2.5 rounded-full bg-cyan-500"></span>
            <h2 class="text-lg font-black text-slate-900">User Membership Passes</h2>
          </div>
          <ul class="space-y-3 text-sm text-slate-600">
            <li>
              <a href="/#tiers" class="font-bold text-slate-900 hover:text-emerald-600 flex items-center justify-between">
                <span>Free User (Level 1)</span>
                <span class="text-xs font-bold text-slate-700">₹0 Free</span>
              </a>
              <p class="text-xs text-slate-500">Cap: ₹10/day (1,000 coins) · ₹300/mo max · 1x Multiplier</p>
            </li>
            <li>
              <a href="/#tiers" class="font-bold text-slate-900 hover:text-emerald-600 flex items-center justify-between">
                <span>Bronze Starter</span>
                <span class="text-xs font-bold text-amber-700">₹999</span>
              </a>
              <p class="text-xs text-slate-500">Cap: ₹20/day · ₹600/mo max · ₹1,000 ad credits · ~2.3x Mult (₹100/ref)</p>
            </li>
            <li>
              <a href="/#tiers" class="font-bold text-slate-900 hover:text-emerald-600 flex items-center justify-between">
                <span>Silver Intermediate (Level 2)</span>
                <span class="text-xs font-bold text-emerald-700">₹2,499</span>
              </a>
              <p class="text-xs text-slate-500">Cap: ₹40/day · ₹1,200/mo max · ₹2,500 ad credits · ~5.7x Mult (₹250/ref)</p>
            </li>
            <li>
              <a href="/#tiers" class="font-bold text-slate-900 hover:text-emerald-600 flex items-center justify-between">
                <span>Gold Advanced (Level 3)</span>
                <span class="text-xs font-bold text-yellow-700">₹4,999</span>
              </a>
              <p class="text-xs text-slate-500">Cap: ₹120/day · ₹3,600/mo max · ₹5,000 ad credits · ~11.5x Mult (₹500/ref)</p>
            </li>
            <li>
              <a href="/#tiers" class="font-bold text-slate-900 hover:text-emerald-600 flex items-center justify-between">
                <span>Platinum Regional Pro (Level 4)</span>
                <span class="text-xs font-bold text-purple-700">₹9,999</span>
              </a>
              <p class="text-xs text-slate-500">Cap: ₹166.67/day · ₹5,000/mo max · ₹10,000 ad credits · ~19.3x Mult (₹1,000/ref)</p>
            </li>
            <li>
              <a href="/#tiers" class="font-bold text-slate-900 hover:text-emerald-600 flex items-center justify-between">
                <span>Diamond Pass (Special Pass)</span>
                <span class="text-xs font-bold text-blue-700">₹24,999/yr</span>
              </a>
              <p class="text-xs text-slate-500">Cap: ₹333.33/day · ₹10,000/mo max · 25,000 ad credits · ~23x Mult (₹2,500/ref)</p>
            </li>
          </ul>
        </div>
      </div>

      <!-- Section 3: Creator VIP Monetization -->
      <div class="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
        <div>
          <div class="flex items-center gap-2 mb-4">
            <span class="w-2.5 h-2.5 rounded-full bg-violet-600"></span>
            <h2 class="text-lg font-black text-slate-900">Creator VIP Tiers</h2>
          </div>
          <ul class="space-y-3 text-sm text-slate-600">
            <li>
              <a href="/#tiers" class="font-bold text-slate-900 hover:text-emerald-600 flex items-center justify-between">
                <span>Classic Pass (Level 1)</span>
                <span class="text-xs font-bold text-slate-600">Always Free</span>
              </a>
              <p class="text-xs text-slate-500">50% Long Video Split · 50% Shorts · 70% Fan Funding (0+ Subs)</p>
            </li>
            <li>
              <a href="/#tiers" class="font-bold text-slate-900 hover:text-emerald-600 flex items-center justify-between">
                <span>Starter VIP Pass</span>
                <span class="text-xs font-bold text-violet-700">₹4,999/yr</span>
              </a>
              <p class="text-xs text-slate-500">60% Long Video Split · 55% Shorts · 80% Fan Funding (&lt; 5K Subs)</p>
            </li>
            <li>
              <a href="/#tiers" class="font-bold text-slate-900 hover:text-emerald-600 flex items-center justify-between">
                <span>Silver VIP Pass</span>
                <span class="text-xs font-bold text-violet-700">₹2,999/yr</span>
              </a>
              <p class="text-xs text-slate-500">65% Long Video Split · 60% Shorts · 85% Fan Funding (5K–25K Subs)</p>
            </li>
            <li>
              <a href="/#tiers" class="font-bold text-slate-900 hover:text-emerald-600 flex items-center justify-between">
                <span>Gold VIP Pass</span>
                <span class="text-xs font-bold text-violet-700">₹1,499/yr</span>
              </a>
              <p class="text-xs text-slate-500">75% Long Video Split · 65% Shorts · 90% Fan Funding (25K–100K Subs)</p>
            </li>
            <li>
              <a href="/#tiers" class="font-bold text-slate-900 hover:text-emerald-600 flex items-center justify-between">
                <span>Platinum VIP Pass</span>
                <span class="text-xs font-bold text-emerald-700">Free Auto-Unlocked</span>
              </a>
              <p class="text-xs text-slate-500">80% Long Video Split · 70% Shorts · 90% Fan Funding (100K+ Subs)</p>
            </li>
          </ul>
        </div>
      </div>

      <!-- Section 4: Legal & Statutory Policies -->
      <div class="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
        <div>
          <div class="flex items-center gap-2 mb-4">
            <span class="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <h2 class="text-lg font-black text-slate-900">Legal, Trust & Policies</h2>
          </div>
          <ul class="space-y-3 text-sm text-slate-600">
            <li>
              <a href="/privacy" class="font-bold text-slate-900 hover:text-emerald-600 flex items-center justify-between">
                <span>Privacy Policy</span>
                <span class="text-xs text-slate-400">/privacy</span>
              </a>
              <p class="text-xs text-slate-500">Data protection, OTP verification, zero ad-tracker selling</p>
            </li>
            <li>
              <a href="/terms" class="font-bold text-slate-900 hover:text-emerald-600 flex items-center justify-between">
                <span>Terms of Service</span>
                <span class="text-xs text-slate-400">/terms</span>
              </a>
              <p class="text-xs text-slate-500">Platform rules, pass terms, botting prohibition, UPI terms</p>
            </li>
            <li>
              <a href="/cookie-policy" class="font-bold text-slate-900 hover:text-emerald-600 flex items-center justify-between">
                <span>Cookie Policy</span>
                <span class="text-xs text-slate-400">/cookie-policy</span>
              </a>
              <p class="text-xs text-slate-500">Browser local storage usage & session identifiers</p>
            </li>
            <li>
              <a href="/content-policy" class="font-bold text-slate-900 hover:text-emerald-600 flex items-center justify-between">
                <span>Content Policy</span>
                <span class="text-xs text-slate-400">/content-policy</span>
              </a>
              <p class="text-xs text-slate-500">Creator rights, copyright protection, prohibited content</p>
            </li>
            <li>
              <a href="/earnings-disclosure" class="font-bold text-slate-900 hover:text-emerald-600 flex items-center justify-between">
                <span>Earnings Disclosure</span>
                <span class="text-xs text-slate-400">/earnings-disclosure</span>
              </a>
              <p class="text-xs text-slate-500">Coin-to-INR rules, daily caps, multiplier illustrations</p>
            </li>
            <li>
              <a href="/refund-cancellation" class="font-bold text-slate-900 hover:text-emerald-600 flex items-center justify-between">
                <span>Refund & Cancellation</span>
                <span class="text-xs text-slate-400">/refund-cancellation</span>
              </a>
              <p class="text-xs text-slate-500">Digital pass conditions, matched ad credits, renewal terms</p>
            </li>
            <li>
              <a href="/grievance" class="font-bold text-slate-900 hover:text-emerald-600 flex items-center justify-between">
                <span>Grievance Information</span>
                <span class="text-xs text-slate-400">/grievance</span>
              </a>
              <p class="text-xs text-slate-500">Information Technology Rules 2021 & 36h statutory SLA</p>
            </li>
            <li>
              <a href="/contact" class="font-bold text-slate-900 hover:text-emerald-600 flex items-center justify-between">
                <span>Contact Directory</span>
                <span class="text-xs text-slate-400">/contact</span>
              </a>
              <p class="text-xs text-slate-500">Official emails for support, creators, and business</p>
            </li>
          </ul>
        </div>
      </div>

      <!-- Section 5: Machine-Readable Crawlers & Feeds -->
      <div class="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
        <div>
          <div class="flex items-center gap-2 mb-4">
            <span class="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            <h2 class="text-lg font-black text-slate-900">Crawlers & Developer Feeds</h2>
          </div>
          <ul class="space-y-3 text-sm text-slate-600">
            <li>
              <a href="/sitemap.xml" target="_blank" class="font-bold text-slate-900 hover:text-emerald-600 flex items-center justify-between">
                <span>XML Sitemap</span>
                <span class="text-xs font-mono text-slate-400">/sitemap.xml</span>
              </a>
              <p class="text-xs text-slate-500">Standards-compliant XML sitemap for search crawlers</p>
            </li>
            <li>
              <a href="/robots.txt" target="_blank" class="font-bold text-slate-900 hover:text-emerald-600 flex items-center justify-between">
                <span>Robots Exclusion File</span>
                <span class="text-xs font-mono text-slate-400">/robots.txt</span>
              </a>
              <p class="text-xs text-slate-500">Crawler indexing permissions and sitemap reference</p>
            </li>
            <li>
              <a href="/site.webmanifest" target="_blank" class="font-bold text-slate-900 hover:text-emerald-600 flex items-center justify-between">
                <span>Web App Manifest</span>
                <span class="text-xs font-mono text-slate-400">/site.webmanifest</span>
              </a>
              <p class="text-xs text-slate-500">Progressive Web App installation metadata & icons</p>
            </li>
          </ul>
        </div>
      </div>

      <!-- Section 6: Official Support & Communication -->
      <div class="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
        <div>
          <div class="flex items-center gap-2 mb-4">
            <span class="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
            <h2 class="text-lg font-black text-slate-900">Direct Support Desks</h2>
          </div>
          <ul class="space-y-3 text-sm text-slate-600">
            <li>
              <span class="font-bold text-slate-900 block">General User Support</span>
              <a href="mailto:support@youpeak.org" class="text-xs text-emerald-700 underline font-semibold">support@youpeak.org</a>
              <p class="text-xs text-slate-500">Response within a few hours</p>
            </li>
            <li>
              <span class="font-bold text-slate-900 block">Creator Partnership Desk</span>
              <a href="mailto:creators@youpeak.org" class="text-xs text-emerald-700 underline font-semibold">creators@youpeak.org</a>
              <p class="text-xs text-slate-500">VIP onboarding and publisher inquiries</p>
            </li>
            <li>
              <span class="font-bold text-slate-900 block">Brand & Business Enquiries</span>
              <a href="mailto:business@youpeak.org" class="text-xs text-emerald-700 underline font-semibold">business@youpeak.org</a>
              <p class="text-xs text-slate-500">Advertiser campaigns and local ad slots</p>
            </li>
            <li>
              <span class="font-bold text-slate-900 block">Statutory Grievance Redressal</span>
              <a href="mailto:grievance@youpeak.org" class="text-xs text-emerald-700 underline font-semibold">grievance@youpeak.org</a>
              <p class="text-xs text-slate-500">Enforceable 36-hour statutory SLA</p>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </main>

  <footer class="border-t border-slate-200 bg-white py-8 px-4 sm:px-6 text-center text-xs text-slate-500">
    <p>© 2026 YouPeak. All rights reserved. Registered under Indian Information Technology Guidelines.</p>
  </footer>
</body>
</html>`;

await fs.writeFile(path.join(DIST, "sitemap.html"), sitemapHtml);

// Ensure dist/sitemap.xml is synchronized from public/sitemap.xml
try {
  const publicSitemap = await fs.readFile(path.join(ROOT, "public", "sitemap.xml"), "utf8");
  await fs.writeFile(path.join(DIST, "sitemap.xml"), publicSitemap);
} catch {
  // Ignore if public sitemap is missing
}

await fs.writeFile(
  path.join(DIST, "404.html"),
  `<!doctype html><html lang="en-IN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Page not found | YouPeak</title><meta name="robots" content="noindex, nofollow">${stylesheet ? `<link rel="stylesheet" crossorigin href="${stylesheet}">` : ""}</head><body class="bg-slate-50 text-slate-900"><main class="min-h-screen px-4 py-24"><div class="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-10 text-center"><p class="text-sm font-bold text-emerald-700">404</p><h1 class="mt-3 text-4xl font-black">Page not found</h1><p class="mt-4 text-slate-600">The address does not match a published YouPeak page.</p><a class="mt-8 inline-block font-bold text-emerald-700 underline" href="/">Return to the YouPeak homepage</a></div></main></body></html>`,
);

console.log(`Prerendered homepage, HTML sitemap, and ${pages.length} indexable trust pages.`);
