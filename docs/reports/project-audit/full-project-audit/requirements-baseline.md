# Requirements baseline (source documents → extracted requirements)

Source folder: `E:\Legendary One\youpeak\documents\` (and `documents\new\`). PDFs were converted with `pdftotext`; identical duplicates exist between `documents\` and `documents\new\` (same md5). `documents\new\Youpeak_Master_Membership_Terms_V2.pdf` is byte-identical in text to `DOC-20260906-WA0016.pdf`.
`vibe_media_agency_website_copy_spec.pdf` describes an unrelated agency website, not YouPeak — out of scope.

## Document versions that conflict (not resolved here — recorded as requirement conflicts)

| ID | Topic | Version A | Version B | Version C |
|---|---|---|---|---|
| RC-1 | Master tasker terms | V1 `DOC-20260825-WA2382` (19 Aug 2026): tiers Free/Bronze/Silver/Gold/Platinum, daily cap Free 500, Bronze 2,000, Silver 4,000, Gold 12,000, Platinum 16,667; no payout minimum (unlocks at monthly cap) | V2 `Master_Membership_Terms_V2` (19 Aug 2026): same caps; min payout ₹500 (50,000 coins) | **V9 `DOC-20260910-WA0046` (10 Sep 2026): +500 boost on every tier → Free 1,000 / L1 2,500 / L2 4,500 / L3 12,500 / L4 17,167; Level 1-4 naming; dual upgrade (watch hours 50/100/200/400 OR Starter Pass); first payout ₹100, later ₹500** |
| RC-2 | Free-tier action caps | V1: Free = 20 ads/5 likes/2 comments | same in V9 | V2 table lists Free ad credits "0 Credits" and different column order (ambiguous layout) |
| RC-3 | Creator VIP pass pricing | `DOC-20260908-WA0008` V6-INTRO: Starter ₹4,999/yr (₹1,499/3mo) intro, standard ₹9,999/yr; Silver ₹2,999; Gold ₹1,499; thresholds <5,000 / 5k-25k / 25k-100k subs; splits 60/65/75/80 | `work flow.txt` (earlier table): Starter ₹2,999 (₹600), Silver ₹1,999 (₹400), Gold ₹1,499 (₹300), Platinum ₹999; thresholds <1,000 / 1k-10k / 10k-100k; splits 60/70/80 | — |
| RC-4 | Partner minimum withdrawal | Peak Partner Terms: ₹500 min, weekly Monday payout | Tasker V9: first ₹100 then ₹500 | Creator V6: first ₹100, then ₹500 |
| RC-5 | Where joining/partner/payment logic lives | Architecture Split + Final Blueprint + Integration Guide: **no joining fees / franchise / partner logic inside the mobile binary**; web portal (`youpeak.in`, `partners.youpeak.in`) with `payment_status` gate | V9 terms / audit brief: Starter Pass purchase inside consumer app; domains `youpeak.app`, `admin.youpeak.app`, `api.youpeak.app` | Developer quotation (`YouPeak_Developer.pdf`): hybrid Firebase + AWS/DigitalOcean; brief now says Firebase + Cloudflare + Vercel |
| RC-6 | Partner payout holds | Partner Terms: Stage 1 ₹100 hold 24h; Stage 2 ₹100 hold 48h; Stage 2 needs 100 watch-min within 7 days | `text.txt` TRS: Phase 1 ₹100 "pending/available" (no hold stated); Phase 2 ₹100 at ≥100 min in 7 days | — |
| RC-7 | Digital Partner license | `text.txt` TRS: ₹25,000 licence fee incl. GST → ad-credit wallet ₹25,000 | no such figure elsewhere | — |
| RC-8 | District partner commission | `DOC-20260826-WA0000`: 10% of coin unlocks in district (cap ₹1,000); 20% VIP Creator Pass sales; 30% local business ads margin ("Trichy territory") | `work flow.txt` transcript summary: franchisee gets 10% of total ad revenue from users watching ads in district | — |
| RC-9 | Peak Boost split | Peak Boost spec V4: 80% creator / 20% platform; min 100 coins, max 10,00,000 coins | — | — |
| RC-10 | Watch-hour upgrades | V9 §1.6: cumulative Watch Hours 50 / 100 / 200 / 400 (stage-to-stage targets); brief says "cumulative lifetime" | ambiguous whether 100h means 100 *additional* hours after L1 or 100 lifetime hours | — |

## Requirements the audit tests against

1. 100 coins = ₹1 (all docs).
2. Task rewards: like 2, unlike 2, comment 5 coins; daily watch-time reward 500 coins at 120 min/day, subject to daily cap (V1/V2/V9).
3. Max 20 rewarded ads/day, all tiers including Free (V1/V2/V9).
4. V9 daily coin caps incl. +500: Free 1,000, L1 2,500, L2 4,500, L3 12,500, L4 17,167. Starter pass: 999 / 2,499 / 4,999 / 9,999 → ad credits 1,000 / 2,500 / 5,000 / 10,000.
5. Action caps (likes/comments): Free 5/2, L1 10/5, L2 20/10, L3 40/20, L4 60/30.
6. Referral: Free tasker 250 coins per registered referral; paid tiers 10% of referred member's Starter Pass (single tier only).
7. Upgrade = EITHER lifetime watch hours threshold OR verified Starter Pass purchase.
8. Coins → INR wallet at midnight server time (settlement).
9. VPN/proxy usage → permanent lock, pass non-refundable, coins forfeited.
10. Peak Partner: Stage 1 ₹100 (verified registration, 24h hold), Stage 2 ₹100 (100 watch-min in 7 days, 48h hold), one account per device, min withdrawal ₹500, weekly Monday payout.
11. Peak Boost: 80/20 split, atomic, ledger in boost_transactions, min 100 coins.
12. Moderation: 5 reports within 24h → auto-hold; keyword blacklist screening; admin queue; 36-hour takedown endpoint (IT Rules 2021).
13. Copyright: audio fingerprint >85% / frame pHash distance <10 → flagged and monetisation disabled.
14. HLS: Cloudflare Stream/R2 → HLS delivery; never raw MP4 streaming.
15. Architecture (brief): videos & Bites on Cloudflare, other data on Firebase, web on Vercel; consumer youpeak.app/www, admin.youpeak.app, api.youpeak.app.
