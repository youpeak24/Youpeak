# YouPeak — complete premium icon prompt pack

Prepared from the Flutter source on 15 October 2026. This is an icon/artwork design inventory and prompt deliverable, not a runtime, accessibility, security or complete functional app audit. No application files were changed.

## What I found in your project

- Android Flutter application: `youpeak/`.
- Bottom navigation: Home, Bites, central Create, Subscriptions, Library. Four destinations plus an action, not five destinations.
- Create menu: Create a Bite, Upload a video, Go live.
- Account/profile menu: Incognito, Create/Your channel, Manage subscription, Earn rewards, My wallet, Time watched, Monetization, Creator VIP pass, Video promotion, Settings, Help center, Log out, Delete account. Some entries depend on account state.
- Settings includes history, autoplay, dark appearance, payments history, language, notifications, privacy policy and grievance officer.
- Library includes history, your videos, Android downloads, new playlist, watch later and playlists.
- The wide sidebar is a web layout in `wide_side_nav.dart`. I found no Flutter `Drawer(` or `drawer:` declaration. Use the account-menu prompts for the side drawer you intend to introduce, but that drawer is not currently established in this source.
- Other feature families include authentication/OTP, onboarding, search, channels, video playback, comments/replies, Bites capture, live, uploads/editing, paid videos, subscriptions, rewards/tasker, coins/conversion, referrals, monetization, wallet/withdrawal, ad credits, campaigns, creator/tasker tiers, help, reporting and access restrictions.
- There are 328 files in `assets/icons`. That is not 328 unique required designs: aliases, state variants, official provider marks, legacy files and backgrounds are included. Every existing file has a treatment below; prioritize referenced assets first.
- Your current app uses forest green `#0A7A44`, charcoal `#1C1C1E` and mint `#E8F5E9`. The supplied logo uses a brighter green–teal–blue progression. The proposed direction keeps forest green for everyday UI and uses the brighter progression selectively in brand artwork.

## Recommended direction: YouPeak Precision

Use one restrained rounded geometric icon family. Navigation, player controls and forms should be flat and crisp; larger feature illustrations can have subtle satin depth. Reserve gold for coins and membership, blue for selective brand/verified accents, red for destructive/live states, and amber for warnings. These are proposed design decisions, not a claim that the present app already uses them consistently.

Do not put the full logo gradient, camera outline, a background tile or a tiny crown inside every icon. Recognition, consistent optical weight and spacing create the premium impression. Let icons support the content.

## How to use these prompts

1. Attach your YouPeak logo as a brand reference. First approve Home, Bites, Subscriptions, Library, Search, Wallet, Settings and Like as one coherent family.
2. Generate each deliverable individually using its complete prompt below. Use the approved family as a second reference for every subsequent generation. A contact sheet is useful for review, but must not be your final production sprite sheet.
3. Small UI symbols should ultimately be hand-cleaned SVG/vector paths or consistent code-drawn icons. Raster generation produces concepts and cannot guarantee valid SVG. Your current code uses `Image.asset`; SVG adoption needs a compatible renderer and widget changes. PNG replacement must preserve current paths and the expected alpha/tint behavior.
4. Generate outline and selected versions only where states need distinct shapes. Dark mode and disabled state should usually use runtime tint/opacity, not independent drawings. Keep destructive meaning explicit with labels and shape, not color alone.
5. Full-color artwork belongs in the existing `AppVisuals`/`AppArtwork` flow and must not receive monochrome UI tint. For the bottom bar, the current code explicitly tints PNGs: colored replacement images would lose their intended colors.
6. Existing file paths are case-sensitive when packaged for some targets. Preserve exact names during drop-in replacement, including `Video.png`, `Wallet.png`, `TimeCircle.png`, and historical misspellings such as `puse.png` and `swape.png`. Rename only with corresponding code changes.
7. A source reference count is a discovery aid: includes declaration files and comments, does not prove a screen is reachable. Dynamic coin packs and tier lookups may not have direct literal references. Keep candidate/legacy assets until their use is checked.

## Bottom navigation — priority briefs

| Position | Purpose | Required design | Existing files |
|---|---|---|---|
| 1 | Home | Soft house, outline + filled | home.png / boldHome.png |
| 2 | Bites | Upright play tile, outline + filled | Video.png / boldVideo.png |
| Center | Create action | Equal-arm plus; circular button drawn by app | currently Icons.add |
| 3 | Subscriptions | Stacked landscape video cards, outline + filled | videoCircle.png / boldPlay.png |
| 4 | Library | Books/spines, outline + filled | library.png / boldDocument.png |

The same symbols should be reused in the wide sidebar. Avoid using the Bites symbol for Upload or Subscriptions: portrait play tile, upward tray arrow and stacked landscape cards should remain distinct.

## Account menu / intended drawer — semantic refinements

Use the individual glyph prompts below for existing items. Two current reused symbols should gain dedicated designs during a later implementation: Privacy policy → document with a small lock; Payment history → receipt with a small clock. Tasker → a checklist with one clear check, distinct from Creator VIP's crown. Ad credits → a compact megaphone with a tiny coin. Campaigns → video tile with a rising chart. Referral history → two people with a small clock. Do not make these compete with the navigation icons through colored tiles on every row.

Copy-ready additional glyph prompt: "Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: [insert one of the specific semantic refinements above]."

## Production handoff and acceptance

- UI master: true 24 × 24 vector geometry, roughly 2-unit strokes; inspect actual 20/22/24/28 sizes. Do not simply scale a detailed illustration into an icon.
- For existing PNG widgets, export transparent 1x/2x/3x/4x assets at their actual logical display size; a 24px glyph therefore needs 24/48/72/96px exports. Keep a large source master separate.
- Selected states retain the same geometry, baseline and perceived size. Runtime colors: forest-green selection on light surfaces; use a sufficiently visible lighter brand tint on dark surfaces after checking contrast. Do not rely on color alone for state.
- Check on white, mint and charcoal backgrounds and over busy video. Player icons need a consistent scrim or control container supplied by the UI. Tap areas can be larger than visible glyphs; use a comfortable approximately 48 logical pixel target in the implementation.
- Artwork masters: transparent 1024px source is a working default, then export for the actual rendered dimensions. Banner dimensions must follow their actual crop behavior, not a universal square.
- Launcher: deliver separate foreground, background and monochrome design layers; let Android apply its launcher mask. Keep the recognizable mark away from crop edges. The logo wordmark is too small for a launcher symbol. Validate adaptive masks with Android tooling during implementation.
- Android notification small icon: white alpha silhouette only; a full-color launcher image is unsuitable. Existing `ic_notification.png` is listed separately.
- Preserve official social/authentication/payment marks. Do not ask an image model to invent Google, Apple, PayPal, Razorpay, Stripe or other provider identities.
- Badge meaning must remain truthful: decorative VIP/partner badges should not impersonate account verification.
- Add LIVE, NEW, CC, 10-second labels, prices and membership names as real interface text where feasible. This allows accurate rendering and localization.
- Prioritize navigation/account menu → playback/actions → creation/upload → wallet/rewards → forms/settings → empty states/dialogs → tiers/illustrations → reactions → optional legacy cleanup.

## Complete per-file prompts

Each entry below is a complete standalone instruction. Files sharing a meaning should share the same master design; do not commission subtly different duplicates.

### UI glyph

#### 0.png

Code aliases: `descriptionIcon`. Source files matching filename/alias: 2.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Video description: rounded document with three clean horizontal text strokes. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### 1.png

Code aliases: `visibilityIcon`. Source files matching filename/alias: 2.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Visibility: open eye with a centered circular pupil. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### 2.png

Code aliases: `audienceIcon`. Source files matching filename/alias: 2.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Audience: three neutral head silhouettes; central person slightly forward. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### 3.png

Code aliases: `scheduleIcon`. Source files matching filename/alias: 2.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Schedule: calendar with two upper binding tabs and one small clock. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### 4.png

Code aliases: `commentIcon`. Source files matching filename/alias: 2.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Allow comments: speech bubble with a small checkmark. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### 5.png

Code aliases: `locationIcon`. Source files matching filename/alias: 2.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Location: teardrop map pin with an open round center. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### 9.png

Code aliases: `threeUser`. Source files matching filename/alias: 2.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Audience: three neutral head silhouettes; central person slightly forward. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### Backward10s.png

Code aliases: `backward10s`. Source files matching filename/alias: 3.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Replay ten seconds: counterclockwise circular arrow; reserve clear space for a separately typeset 10. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### Bold3User.png

Code aliases: `boldThreeUser`. Source files matching filename/alias: 1.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Audience: three neutral head silhouettes; central person slightly forward. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### Calendar.png

Code aliases: `calendar`. Source files matching filename/alias: 1.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Schedule: calendar with two upper binding tabs and one small clock. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### Chat.png

Code aliases: `chat`. Source files matching filename/alias: 2.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Comments/chat: rounded speech bubble with a short tail and two interior strokes. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### Collapse.png

Code aliases: `collapse`. Source files matching filename/alias: 3.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Exit fullscreen: four inward-facing corner brackets. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### Expand.png

Code aliases: `expand`. Source files matching filename/alias: 3.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Fullscreen: four outward-facing corner brackets. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### Forward10s.png

Code aliases: `forward10s`. Source files matching filename/alias: 3.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Forward ten seconds: clockwise circular arrow; reserve clear space for a separately typeset 10. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### Next.png

Code aliases: `next`. Source files matching filename/alias: 2.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Next: right-facing play triangle followed by a vertical bar. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### Paper.png

Code aliases: `paper`. Source files matching filename/alias: 2.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Document: rounded page with one folded corner and two text strokes. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### Previous.png

Code aliases: `previous`. Source files matching filename/alias: 2.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Previous: vertical bar followed by a left-facing play triangle. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### Subtitle.png

Code aliases: `subtitle`. Source files matching filename/alias: 1.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Captions: rounded rectangle with two short horizontal caption strokes; actual CC letters may be typeset separately. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### TimeCircle.png

Code aliases: `timeCircle`. Source files matching filename/alias: 10.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Watch or transaction history: a clock with a counterclockwise history arrow. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### Timer.png

Code aliases: `timer`. Source files matching filename/alias: 2.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Timer: compact stopwatch with one top stem. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### Video.png

Code aliases: `video`. Source files matching filename/alias: 12.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Bites: one upright rounded video tile with an optically centered play cutout; clearly portrait and distinct from Subscriptions. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### Wallet.png

Code aliases: `wallet`. Source files matching filename/alias: 4.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Wallet: slim rounded wallet with a distinct short closure tab. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### accept.png

Code aliases: `accept`. Source files matching filename/alias: 2.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Success/selected: one clear checkmark with a short left arm. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### activity.png

Code aliases: `timeWatched`. Source files matching filename/alias: 4.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Time watched: a clock face with a small play cutout; distinguish from watch history. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### ad_icon.png

Code aliases: `adIcon`. Source files matching filename/alias: 3.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Advertisement: rounded landscape video panel with a small corner sparkle; AD label belongs in live text. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### ad_round.png

Code aliases: `adRound`. Source files matching filename/alias: 3.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Advertisement: rounded landscape video panel with a small corner sparkle; AD label belongs in live text. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### add.png

Code aliases: `add`. Source files matching filename/alias: 2.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Create: one perfectly balanced plus, with equal arms and rounded ends; do not include its button background. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### arrowRightCircle.png

Code aliases: `arrowRightCircle`. Source files matching filename/alias: 2.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Continue: right-facing arrow inside a thin circle. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### arrow_back.png

Code aliases: `arrowBack`. Source files matching filename/alias: 56.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Back: one left-facing arrow with a straight stem. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### arrow_double_right.png

Code aliases: `arrowDoubleRight`. Source files matching filename/alias: 4.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Double next: two evenly spaced right-facing chevrons. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### arrow_down.png

Code aliases: `arrowDown`. Source files matching filename/alias: 3.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Expand: one downward-facing chevron. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### arrow_right.png

Code aliases: `arrowRight`. Source files matching filename/alias: 6.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Next: one right-facing chevron. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### audio.png

Code aliases: `audio`. Source files matching filename/alias: 2.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Microphone: rounded microphone capsule on a U-shaped stand. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### beauty.png

Code aliases: `beauty`. Source files matching filename/alias: 1.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Beauty adjustment: minimalist face contour with a single sparkle. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### boldArrowDown.png

Code aliases: `boldArrowDown`. Source files matching filename/alias: 1.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Expand: one downward-facing chevron. Selected state: use a coherent filled silhouette with clean cutouts, maintaining the same outer geometry as the outline version.

#### boldBookmark.png

Code aliases: `boldBookmark`. Source files matching filename/alias: 1.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Save: vertical bookmark with a centered V notch. Selected state: use a coherent filled silhouette with clean cutouts, maintaining the same outer geometry as the outline version.

#### boldDocument.png

Code aliases: `boldLibrary`. Source files matching filename/alias: 3.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Library: three upright spines, with the last leaning slightly; do not resemble a document or a shopping bag. Selected state: use a coherent filled silhouette with clean cutouts, maintaining the same outer geometry as the outline version.

#### boldFilter.png

Code aliases: `boldFilter`. Source files matching filename/alias: 1.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Filter: three horizontal adjustment lines with alternating circular sliders. Selected state: use a coherent filled silhouette with clean cutouts, maintaining the same outer geometry as the outline version.

#### boldHome.png

Code aliases: `boldHome`. Source files matching filename/alias: 3.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Home: a softly squared house with a generous doorway, balanced roof and no chimney. Selected state: use a coherent filled silhouette with clean cutouts, maintaining the same outer geometry as the outline version.

#### boldPlay.png

Code aliases: `boldPlay`. Source files matching filename/alias: 6.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Subscriptions: two offset landscape video cards with one small play cutout on the front card; communicate followed channels rather than playback alone. Selected state: use a coherent filled silhouette with clean cutouts, maintaining the same outer geometry as the outline version.

#### boldShare.png

Code aliases: `boldShare`. Source files matching filename/alias: 4.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Share: three small connected nodes with generous separation. Selected state: use a coherent filled silhouette with clean cutouts, maintaining the same outer geometry as the outline version.

#### boldSpeed.png

Code aliases: `boldSpeed`. Source files matching filename/alias: 1.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Playback speed: clean semicircular speedometer with one diagonal needle. Selected state: use a coherent filled silhouette with clean cutouts, maintaining the same outer geometry as the outline version.

#### boldVideo.png

Code aliases: `boldVideo`. Source files matching filename/alias: 4.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Bites: one upright rounded video tile with an optically centered play cutout; clearly portrait and distinct from Subscriptions. Selected state: use a coherent filled silhouette with clean cutouts, maintaining the same outer geometry as the outline version.

#### bookmark.png

Code aliases: `bookmark`. Source files matching filename/alias: 1.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Save: vertical bookmark with a centered V notch. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### camera.png

Code aliases: `camera`. Source files matching filename/alias: 6.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Camera: rounded camera body, small upper shoulder, single circular lens. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### caption.png

Code aliases: `caption`. Source files matching filename/alias: 1.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Captions: rounded rectangle with two short horizontal caption strokes; actual CC letters may be typeset separately. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### clear_icon.png

Code aliases: `clear`. Source files matching filename/alias: 6.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Delete/clear: simple trash bin with lid and two vertical slots. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### closeSquare.png

Code aliases: `closeSquare`. Source files matching filename/alias: 6.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Close: two diagonal strokes forming an optically balanced X. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### close_icon.png

Code aliases: `closeIcon`. Source files matching filename/alias: 2.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Close: two diagonal strokes forming an optically balanced X. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### coin.png

Code aliases: `coin`. Source files matching filename/alias: 13.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Coin: one circular coin with a recessed abstract peak symbol, no currency text. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### coin_icon.png

Code aliases: `coinIcon`. Source files matching filename/alias: 3.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Coin: one circular coin with a recessed abstract peak symbol, no currency text. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### coin_icon_grey.png

Code aliases: `coinIconGrey`. Source files matching filename/alias: 3.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Coin: one circular coin with a recessed abstract peak symbol, no currency text. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### comment.png

Code aliases: `comments`. Source files matching filename/alias: 4.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Comments/chat: rounded speech bubble with a short tail and two interior strokes. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### comment_1.png

Code aliases: `boldChat`. Source files matching filename/alias: 2.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Comments/chat: rounded speech bubble with a short tail and two interior strokes. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### convert_icon.png

Code aliases: `convertIcon`. Source files matching filename/alias: 4.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Convert balance: two opposing curved arrows around one plain coin. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### copy_icon.png

Code aliases: `copyIcon`. Source files matching filename/alias: 2.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Copy: two overlapping rounded rectangles. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### daily_gift_icon.png

Code aliases: `dailyGiftIcon`. Source files matching filename/alias: 1.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Daily gift: small ribboned gift box; daily status is displayed separately. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### dangerSquare.png

Code aliases: `dangerSquare`. Source files matching filename/alias: 2.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Warning: rounded triangle enclosing a simple exclamation mark. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### dark_mode.png

Code aliases: `darkMode`. Source files matching filename/alias: 3.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Dark appearance: clean crescent moon with no stars. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### date_icon.png

Code aliases: `dateIcon`. Source files matching filename/alias: 1.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Schedule: calendar with two upper binding tabs and one small clock. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### delete_account.png

Code aliases: `deleteAccount`. Source files matching filename/alias: 2.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Delete account: neutral account silhouette with a small minus badge. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### dislike_bold.png

Code aliases: `disLikeBold`. Source files matching filename/alias: 7.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Dislike: downward thumb with a simple wrist cuff. Selected state: use a coherent filled silhouette with clean cutouts, maintaining the same outer geometry as the outline version.

#### dislike_icon.png

Code aliases: `disLike`. Source files matching filename/alias: 7.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Dislike: downward thumb with a simple wrist cuff. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### document.png

Code aliases: `document`. Source files matching filename/alias: 4.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Document: rounded page with one folded corner and two text strokes. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### done.png

Code aliases: `done`. Source files matching filename/alias: 6.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Success/selected: one clear checkmark with a short left arm. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### down_arrow_bold.png

Code aliases: `downArrowBold`. Source files matching filename/alias: 9.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Outgoing/fall: one downward arrow. Selected state: use a coherent filled silhouette with clean cutouts, maintaining the same outer geometry as the outline version.

#### download.png

Code aliases: `download`. Source files matching filename/alias: 5.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Download: downward arrow entering a shallow tray. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### download_1.png

Code aliases: `videoDownload`. Source files matching filename/alias: 2.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Download: downward arrow entering a shallow tray. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### download_bold.png

Code aliases: `boldDownload`. Source files matching filename/alias: 2.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Download: downward arrow entering a shallow tray. Selected state: use a coherent filled silhouette with clean cutouts, maintaining the same outer geometry as the outline version.

#### earn_reward_icon.png

Code aliases: `earnRewardIcon`. Source files matching filename/alias: 1.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Earn rewards: a small gift box with one clean ribbon and a subtle star cutout. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### edit.png

Code aliases: `edit`. Source files matching filename/alias: 1.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Edit: diagonal pencil with a clearly defined nib. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### editButton.png

Code aliases: `editButton`. Source files matching filename/alias: 1.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Edit: diagonal pencil with a clearly defined nib. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### effects.png

Code aliases: `effects`. Source files matching filename/alias: 1.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Effects: one large four-point sparkle and one small sparkle. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### email.png

Code aliases: `email`. Source files matching filename/alias: 4.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Email: rounded envelope with one simple folded flap. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### engagement_icon.png

Code aliases: `engagementIcon`. Source files matching filename/alias: 3.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Engagement: small play tile with one comment bubble and one heart, simplified to remain clear. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### filter.png

Code aliases: `filter`. Source files matching filename/alias: 2.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Filter: three horizontal adjustment lines with alternating circular sliders. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### fingerPrint.png

Code aliases: `fingerPrint`. Source files matching filename/alias: 1.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Fingerprint: three nested open ridge loops, readable at small size. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### flag.png

Code aliases: `flag`. Source files matching filename/alias: 1.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Report: single waving flag on a straight pole; do not use a national flag. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### flage.png

Code aliases: `flage`. Source files matching filename/alias: 1.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Report: single waving flag on a straight pole; do not use a national flag. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### flages.png

Code aliases: `report`. Source files matching filename/alias: 2.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Report: single waving flag on a straight pole; do not use a national flag. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### flash.png

Code aliases: `flash`. Source files matching filename/alias: 2.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Flash: one compact lightning bolt. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### flip.png

Code aliases: `flipCamera`. Source files matching filename/alias: 3.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Flip camera: two curved arrows surrounding a small camera lens. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### free.png

Code aliases: `free`. Source files matching filename/alias: 2.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Free content: small video tile with a clean checkmark; do not bake FREE text into the icon. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### gallery.png

Code aliases: `gallery`. Source files matching filename/alias: 3.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Gallery/thumbnail: rounded image frame with one small sun and one simple hill. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### gift_icon.png

Code aliases: `giftIcon`. Source files matching filename/alias: 1.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Daily gift: small ribboned gift box; daily status is displayed separately. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### go_live.png

Code aliases: `goLive`. Source files matching filename/alias: 2.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Go live: small central broadcast dot with two symmetrical signal arcs on each side. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### green_tick.png

Code aliases: `greenTick`. Source files matching filename/alias: 1.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Success/selected: one clear checkmark with a short left arm. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### heartEffects.png

Code aliases: `heartEffects`. Source files matching filename/alias: 1.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Heart effect: one heart with two small sparkles. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### hide.png

Code aliases: `hide`. Source files matching filename/alias: 4.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Hide password: matching eye crossed by one diagonal stroke. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### history_icon.png

Code aliases: `historyIcon`. Source files matching filename/alias: 5.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Watch or transaction history: a clock with a counterclockwise history arrow. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### home.png

Code aliases: `homeLogo`. Source files matching filename/alias: 3.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Home: a softly squared house with a generous doorway, balanced roof and no chimney. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### ic_delete_video.png

Code aliases: `icDeleteVideo`. Source files matching filename/alias: 2.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Delete/clear: simple trash bin with lid and two vertical slots. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### ic_edit_video.png

Code aliases: `icEditVideo`. Source files matching filename/alias: 2.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Edit: diagonal pencil with a clearly defined nib. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### incognito.png

Code aliases: `incognito`. Source files matching filename/alias: 2.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Incognito: a simple shield with a small eye crossed by one diagonal stroke; express private browsing without a cartoon disguise. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### infoSquare.png

Code aliases: `help`. Source files matching filename/alias: 4.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Help center: rounded speech bubble with one question mark. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### king.png

Code aliases: `king`. Source files matching filename/alias: 5.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Creator VIP pass: restrained three-point crown with a flat baseline. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### language.png

Code aliases: `language`. Source files matching filename/alias: 1.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Language: globe with two meridians and one equator; labels are drawn separately. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### library.png

Code aliases: `libraryLogo`. Source files matching filename/alias: 5.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Library: three upright spines, with the last leaning slightly; do not resemble a document or a shopping bag. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### like.png

Code aliases: `like`. Source files matching filename/alias: 8.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Like: upright thumb with a simple wrist cuff. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### like_bold.png

Code aliases: `likeBold`. Source files matching filename/alias: 8.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Like: upright thumb with a simple wrist cuff. Selected state: use a coherent filled silhouette with clean cutouts, maintaining the same outer geometry as the outline version.

#### live_chat.png

Code aliases: `liveChat`. Source files matching filename/alias: 1.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Comments/chat: rounded speech bubble with a short tail and two interior strokes. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### location.png

Code aliases: `location`. Source files matching filename/alias: 3.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Location: teardrop map pin with an open round center. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### lock.png

Code aliases: `lock`. Source files matching filename/alias: 5.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Locked/password: closed padlock with a generous shackle opening. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### lock2.png

Code aliases: `lock2`. Source files matching filename/alias: 1.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Locked/password: closed padlock with a generous shackle opening. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### logout.png

Code aliases: `logOut`. Source files matching filename/alias: 2.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Log out: open doorway with an outward arrow; do not confuse with delete. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### monetization.png

Code aliases: `monetization`. Source files matching filename/alias: 4.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Monetization: one coin with a small rising chart, no currency letters. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### moreCircle.png

Code aliases: `moreCircle`. Source files matching filename/alias: 7.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: More actions: three evenly spaced horizontal dots; no surrounding disk. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### moreSquare.png

Code aliases: `moreSquare`. Source files matching filename/alias: 2.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: More options: three horizontal dots inside a softly rounded square. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### moreThreeCircle.png

Code aliases: `moreThreeCircle`. Source files matching filename/alias: 2.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: More actions: three evenly spaced horizontal dots; no surrounding disk. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### music.png

Code aliases: `music`. Source files matching filename/alias: 1.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Sound/music: two connected musical notes. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### notification.png

Code aliases: `notification`. Source files matching filename/alias: 5.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Notifications: a simple bell with visible clapper; no baked-in unread dot. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### noty_icon.png

Code aliases: `notyIcon`. Source files matching filename/alias: 1.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Notifications: a simple bell with visible clapper; no baked-in unread dot. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### paid.png

Code aliases: `paid`. Source files matching filename/alias: 2.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Paid content: small video tile with a coin at its lower-right corner. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### password.png

Code aliases: `password`. Source files matching filename/alias: 5.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Locked/password: closed padlock with a generous shackle opening. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### pause.png

Code aliases: `pause`. Source files matching filename/alias: 7.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Pause: two evenly spaced vertical bars. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### play.png

Code aliases: `play`. Source files matching filename/alias: 4.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Play: a single right-facing triangle with subtly softened corners. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### play_video.png

Code aliases: `videoPlay`. Source files matching filename/alias: 7.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Play: a single right-facing triangle with subtly softened corners. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### plus.png

Code aliases: `plus`. Source files matching filename/alias: 3.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Create: one perfectly balanced plus, with equal arms and rounded ends; do not include its button background. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### premium_download.png

Code aliases: `premiumDownload`. Source files matching filename/alias: 3.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Premium download: downward tray arrow with a tiny crown above it. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### profile.png

Code aliases: `profile`. Source files matching filename/alias: 9.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Account/channel: neutral head and shoulders with no facial details. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### profileLogo.png

Code aliases: `account`. Source files matching filename/alias: 2.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Account/channel: neutral head and shoulders with no facial details. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### promote_video.png

Source files matching filename/alias: 0.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Video promotion: upward trending arrow above a short baseline. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### puse.png

Code aliases: `puse`. Source files matching filename/alias: 2.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Pause: two evenly spaced vertical bars. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### recording.png

Code aliases: `recording`. Source files matching filename/alias: 1.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Record: one solid circle; button surround is drawn separately. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### referral_icon.png

Code aliases: `referralIcon`. Source files matching filename/alias: 3.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Referral: two neutral people linked by a short sharing arrow. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### remove.png

Code aliases: `remove`. Source files matching filename/alias: 4.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Delete/clear: simple trash bin with lid and two vertical slots. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### reply.png

Code aliases: `reply`. Source files matching filename/alias: 3.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Reply: left-turning arrow with a short curved stem. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### report.png

Code aliases: `reportFlag`. Source files matching filename/alias: 1.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Report: single waving flag on a straight pole; do not use a national flag. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### scan.png

Code aliases: `scan`. Source files matching filename/alias: 1.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Scan: four corner brackets surrounding a minimal scan line. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### search.png

Code aliases: `search`. Source files matching filename/alias: 9.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Search: circular lens with a short diagonal handle. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### send.png

Code aliases: `send`. Source files matching filename/alias: 3.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Send: simple paper plane angled up and right, with one clean fold. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### set_thumbnail.png

Code aliases: `setThumbnail`. Source files matching filename/alias: 3.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Gallery/thumbnail: rounded image frame with one small sun and one simple hill. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### setting.png

Code aliases: `setting`. Source files matching filename/alias: 4.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Settings: restrained six-tooth gear with a generous circular center. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### share_icon.png

Code aliases: `share`. Source files matching filename/alias: 2.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Share: three small connected nodes with generous separation. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### shieldDone.png

Code aliases: `incognito, grievance`. Source files matching filename/alias: 3.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Grievance and protection: simple shield with a checkmark. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### show.png

Code aliases: `show`. Source files matching filename/alias: 4.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Show password: almond-shaped eye with a clear round pupil. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### shuffle.png

Code aliases: `shuffle`. Source files matching filename/alias: 1.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Shuffle: two crossing directional arrows, with one clear overpass. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### sound.png

Code aliases: `sound`. Source files matching filename/alias: 2.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Sound/music: two connected musical notes. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### speed.png

Code aliases: `speed`. Source files matching filename/alias: 1.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Playback speed: clean semicircular speedometer with one diagonal needle. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### square.png

Code aliases: `square`. Source files matching filename/alias: 2.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Checkbox: empty softly rounded square. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### subscription_plan.png

Code aliases: `subscriptionPlan`. Source files matching filename/alias: 2.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Manage subscription: a rounded membership card with a small check in one corner. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### swap.png

Code aliases: `swap`. Source files matching filename/alias: 1.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Swap: two parallel arrows pointing in opposite directions. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### swape.png

Code aliases: `loopVideo`. Source files matching filename/alias: 2.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Loop playback: two bent arrows forming a closed horizontal loop. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### text_send.png

Code aliases: `textSend`. Source files matching filename/alias: 2.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Send: simple paper plane angled up and right, with one clean fold. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### tick.png

Code aliases: `tick`. Source files matching filename/alias: 4.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Success/selected: one clear checkmark with a short left arm. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### timeCirclePink.png

Code aliases: `timerHistory`. Source files matching filename/alias: 2.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Watch or transaction history: a clock with a counterclockwise history arrow. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### translate.png

Code aliases: `translate`. Source files matching filename/alias: 2.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Language: globe with two meridians and one equator; labels are drawn separately. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### trending.png

Code aliases: `trending`. Source files matching filename/alias: 2.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Video promotion: upward trending arrow above a short baseline. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### tv.png

Code aliases: `tv`. Source files matching filename/alias: 1.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Watch on television: landscape display with a short central stand. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### up_arrow_bold.png

Code aliases: `upArrowBold`. Source files matching filename/alias: 2.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Incoming/rise: one upward arrow. Selected state: use a coherent filled silhouette with clean cutouts, maintaining the same outer geometry as the outline version.

#### upload.png

Code aliases: `boldUpload`. Source files matching filename/alias: 3.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Upload: upward arrow leaving a shallow tray. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### videoBlack.png

Code aliases: `videoBlack`. Source files matching filename/alias: 2.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Video: landscape rounded frame with a centered play triangle. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### videoCircle.png

Code aliases: `videoCircle`. Source files matching filename/alias: 3.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Subscriptions: two offset landscape video cards with one small play cutout on the front card; communicate followed channels rather than playback alone. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### videoDownload.png

Source files matching filename/alias: 0.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Download: downward arrow entering a shallow tray. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### video_charges.png

Code aliases: `videoCharges`. Source files matching filename/alias: 2.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Paid content: small video tile with a coin at its lower-right corner. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### visibility.png

Source files matching filename/alias: 0.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Visibility: open eye with a centered circular pupil. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### watch.png

Code aliases: `playSpeed`. Source files matching filename/alias: 2.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Playback speed: clean semicircular speedometer with one diagonal needle. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### watch_later.png

Code aliases: `addToSave`. Source files matching filename/alias: 2.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Watch later: bookmark outline containing a small clock. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

#### white_tik.png

Source files matching filename/alias: 0.

> Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: Success/selected: one clear checkmark with a short left arm. Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.

### Illustration / badge / reaction

#### Internet.jpg

Source files matching filename/alias: 0.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: Internet status legacy illustration: clean globe with restrained connection arcs; export without an artificial white box when replacing with PNG.

#### Internet.png

Source files matching filename/alias: 1.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: Connection restored or internet status: clean globe with restrained connection arcs.

#### Network_Issue.png

Code aliases: `networkIssue`. Source files matching filename/alias: 2.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: Offline: disconnected network arcs beside one quiet cloud; reassuring, no panic imagery.

#### ads_image.png

Code aliases: `adsImage`. Source files matching filename/alias: 3.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: ads image.

#### boarding_1.png

Code aliases: `onBoarding1`. Source files matching filename/alias: 2.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: Discover: three floating video cards orbiting a simple play tile; leave the lower area clear for onboarding copy.

#### boarding_2.png

Code aliases: `onBoarding2`. Source files matching filename/alias: 2.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: Create: camera lens, one portrait video tile and two restrained sparkles; celebrate personal creativity.

#### boarding_3.png

Code aliases: `onBoarding3`. Source files matching filename/alias: 2.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: Grow: an abstract ascending peak with a modest coin and a community symbol; avoid promises of wealth.

#### cardImage.png

Code aliases: `cardImage`. Source files matching filename/alias: 1.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: card Image.

#### coin_pack_1.png

Source files matching filename/alias: 0.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: Coin pack 1 of six: the same abstract peak coin design, with progressively greater coin quantity from a single coin in pack one to a compact balanced cluster in pack six; keep camera, scale, lighting and coin material consistent; no denomination or value text.

#### coin_pack_2.png

Source files matching filename/alias: 0.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: Coin pack 2 of six: the same abstract peak coin design, with progressively greater coin quantity from a single coin in pack one to a compact balanced cluster in pack six; keep camera, scale, lighting and coin material consistent; no denomination or value text.

#### coin_pack_3.png

Source files matching filename/alias: 0.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: Coin pack 3 of six: the same abstract peak coin design, with progressively greater coin quantity from a single coin in pack one to a compact balanced cluster in pack six; keep camera, scale, lighting and coin material consistent; no denomination or value text.

#### coin_pack_4.png

Source files matching filename/alias: 0.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: Coin pack 4 of six: the same abstract peak coin design, with progressively greater coin quantity from a single coin in pack one to a compact balanced cluster in pack six; keep camera, scale, lighting and coin material consistent; no denomination or value text.

#### coin_pack_5.png

Source files matching filename/alias: 0.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: Coin pack 5 of six: the same abstract peak coin design, with progressively greater coin quantity from a single coin in pack one to a compact balanced cluster in pack six; keep camera, scale, lighting and coin material consistent; no denomination or value text.

#### coin_pack_6.png

Source files matching filename/alias: 0.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: Coin pack 6 of six: the same abstract peak coin design, with progressively greater coin quantity from a single coin in pack one to a compact balanced cluster in pack six; keep camera, scale, lighting and coin material consistent; no denomination or value text.

#### congratulation_icon.png

Code aliases: `congratulationIcon`. Source files matching filename/alias: 2.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: congratulation icon.

#### content_image.png

Code aliases: `contentImage`. Source files matching filename/alias: 2.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: content image.

#### convert_coin_image.png

Code aliases: `convertCoinImage`. Source files matching filename/alias: 2.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: convert coin image.

#### darkForgetPasswordLogo.png

Code aliases: `darkForgetPasswordLogo`. Source files matching filename/alias: 2.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: dark Forget Password Logo. Dark-surface variant of the matching light illustration: preserve composition and geometry, adjust highlights and shadow contrast for charcoal; do not merely invert colors.

#### darkNewPasswordLogo.png

Code aliases: `darkNewPasswordLogo`. Source files matching filename/alias: 2.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: dark New Password Logo. Dark-surface variant of the matching light illustration: preserve composition and geometry, adjust highlights and shadow contrast for charcoal; do not merely invert colors.

#### dialog_account_blocked.png

Source files matching filename/alias: 1.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: Account restricted: simple shield and closed padlock, composed calmly without punishment imagery.

#### dialog_delete_account.png

Source files matching filename/alias: 1.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: Account deletion: neutral account tile beside a small minus sign, composed soberly without celebration.

#### dialog_exit.png

Source files matching filename/alias: 1.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: Exit app: simple open doorway with a subtle outward arrow; neutral tone.

#### dialog_logout.png

Source files matching filename/alias: 1.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: Log out: a profile tile gently moving through a doorway; neutral tone.

#### dialog_payment_failed.png

Source files matching filename/alias: 1.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: Payment failed: payment card beside a small amber warning marker; no broken coins or dramatic explosion.

#### dialog_private_content.png

Source files matching filename/alias: 1.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: Private content: closed padlock in front of a video tile.

#### dialog_subscribed_success.png

Source files matching filename/alias: 1.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: Subscription confirmed: two channel cards and one clean success check; restrained celebration.

#### dialog_update.png

Source files matching filename/alias: 1.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: Update available: app tile with an upward arrow and one subtle sparkle.

#### earn_reward.png

Code aliases: `earnReward`. Source files matching filename/alias: 2.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: Earn rewards: a small gift box with one clean ribbon and a subtle star cutout.

#### empty_comments.png

Source files matching filename/alias: 1.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: No comments: two empty speech bubbles, one slightly behind the other.

#### empty_downloads.png

Source files matching filename/alias: 1.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: No downloads: downward arrow hovering above an empty download tray.

#### empty_history.png

Source files matching filename/alias: 1.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: No history: simple clock beside an empty timeline.

#### empty_image.png

Code aliases: `isEmpty`. Source files matching filename/alias: 3.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: Empty state: one open rounded tray with a single floating rounded card.

#### empty_notifications.png

Source files matching filename/alias: 1.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: No notifications: calm bell above a quiet shallow tray.

#### empty_playlist.png

Source files matching filename/alias: 1.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: No playlists: three stacked video cards with a small plus.

#### empty_search.png

Source files matching filename/alias: 1.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: No search results: magnifying lens beside an empty video card, no sad face.

#### empty_subscriptions.png

Source files matching filename/alias: 1.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: No subscriptions: two channel cards linked by a subtle plus.

#### empty_videos.png

Source files matching filename/alias: 1.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: No videos: one empty landscape video frame and a small play symbol.

#### forgetPasswordLogo.png

Code aliases: `forgetPasswordLogo`. Source files matching filename/alias: 2.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: forget Password Logo.

#### gift_image.png

Code aliases: `giftImage`. Source files matching filename/alias: 3.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: gift image.

#### hero_create_channel.png

Source files matching filename/alias: 1.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: Create channel: a landscape video card emerging from a personalized channel frame.

#### hero_creator_vip.png

Source files matching filename/alias: 1.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: Creator VIP: sculpted emerald membership card with a small champagne-metal crown.

#### hero_go_live.png

Source files matching filename/alias: 1.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: Go live: camera tile broadcasting two restrained concentric signal arcs.

#### hero_grievance.png

Source files matching filename/alias: 1.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: Grievance: protective shield supporting an open speech bubble; calm and respectful.

#### hero_help_center.png

Source files matching filename/alias: 1.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: Help: a softly sculpted headset surrounding a calm speech bubble.

#### hero_premium.png

Source files matching filename/alias: 1.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: Premium: a refined emerald play tile elevated beside one satin-metal crown.

#### hero_promote_video.png

Source files matching filename/alias: 1.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: Video promotion: a clean megaphone projecting three ascending video tiles.

#### hero_starter_pass.png

Source files matching filename/alias: 1.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: Tasker Starter Pass: a clean task card with three completed checks and one modest reward token.

#### king_round.png

Source files matching filename/alias: 1.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: king round.

#### live_badge.png

Source files matching filename/alias: 1.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: live badge. Badge exception: simplify to flat or very shallow depth, strong silhouette and one focal symbol so it reads at 16–24 pixels. No tiny ornament or text; render LIVE, NEW or tier names separately in the interface.

#### login_image.png

Code aliases: `loginLogo`. Source files matching filename/alias: 2.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: login image.

#### monetization_image.png

Code aliases: `monetizationImage`. Source files matching filename/alias: 2.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: monetization image.

#### monetization_withdraw.png

Code aliases: `monetizationWithdraw`. Source files matching filename/alias: 2.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: monetization withdraw.

#### newPasswordLogo.png

Code aliases: `newPasswordLogo`. Source files matching filename/alias: 2.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: new Password Logo.

#### new_badge.png

Source files matching filename/alias: 1.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: new badge. Badge exception: simplify to flat or very shallow depth, strong silhouette and one focal symbol so it reads at 16–24 pixels. No tiny ornament or text; render LIVE, NEW or tier names separately in the interface.

#### noFound.png

Code aliases: `noFound`. Source files matching filename/alias: 1.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: no Found.

#### notif_announcement.png

Source files matching filename/alias: 1.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: notification: announcement.

#### notif_bell.png

Source files matching filename/alias: 1.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: notification: bell.

#### notif_live_now.png

Source files matching filename/alias: 1.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: notification: live now.

#### notif_new_comment.png

Source files matching filename/alias: 1.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: notification: new comment.

#### notif_new_like.png

Source files matching filename/alias: 1.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: notification: new like.

#### notif_new_subscriber.png

Source files matching filename/alias: 1.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: notification: new subscriber.

#### notif_payment_success.png

Source files matching filename/alias: 1.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: notification: payment success.

#### notif_reminder.png

Source files matching filename/alias: 1.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: notification: reminder.

#### notif_security.png

Source files matching filename/alias: 1.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: notification: security.

#### notif_update.png

Source files matching filename/alias: 1.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: notification: update.

#### notif_warning.png

Source files matching filename/alias: 1.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: notification: warning.

#### notif_withdrawal_sent.png

Source files matching filename/alias: 1.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: notification: withdrawal sent.

#### paid_video_badge.png

Source files matching filename/alias: 1.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: paid video badge. Badge exception: simplify to flat or very shallow depth, strong silhouette and one focal symbol so it reads at 16–24 pixels. No tiny ornament or text; render LIVE, NEW or tier names separately in the interface.

#### partner_digital_badge.png

Source files matching filename/alias: 1.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: Digital partner: three connected nodes inside a restrained seal; distinct from verification. Badge exception: simplify to flat or very shallow depth, strong silhouette and one focal symbol so it reads at 16–24 pixels. No tiny ornament or text; render LIVE, NEW or tier names separately in the interface.

#### partner_district_badge.png

Source files matching filename/alias: 1.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: District partner: a geometric location pin inside a restrained seal; distinct from verification. Badge exception: simplify to flat or very shallow depth, strong silhouette and one focal symbol so it reads at 16–24 pixels. No tiny ornament or text; render LIVE, NEW or tier names separately in the interface.

#### premium_badge.png

Source files matching filename/alias: 1.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: premium badge. Badge exception: simplify to flat or very shallow depth, strong silhouette and one focal symbol so it reads at 16–24 pixels. No tiny ornament or text; render LIVE, NEW or tier names separately in the interface.

#### premium_image.png

Code aliases: `premiumImage`. Source files matching filename/alias: 2.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: premium image.

#### profileDoneLogo1.png

Code aliases: `profileDoneLogo1`. Source files matching filename/alias: 6.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: profile Done Logo1.

#### profile_image.png

Code aliases: `profileImage`. Source files matching filename/alias: 6.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: Neutral default avatar: head and shoulders with no age, gender, facial details or celebrity resemblance.

#### promo_megaphone.png

Source files matching filename/alias: 1.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: promo megaphone.

#### react_100.png

Source files matching filename/alias: 1.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: Perfect reaction: create only a celebratory underline and compact framing; typeset the exact 100 separately to guarantee accuracy. Reaction exception: friendly expressive emoji, bold readable facial features, identical face proportions and camera angle to the approved reaction family; emotion must read at 24–32 pixels. Preserve the meaning of its existing Unicode reaction; no sticker border.

#### react_angry.png

Source files matching filename/alias: 1.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: reaction: angry. Reaction exception: friendly expressive emoji, bold readable facial features, identical face proportions and camera angle to the approved reaction family; emotion must read at 24–32 pixels. Preserve the meaning of its existing Unicode reaction; no sticker border.

#### react_clap.png

Source files matching filename/alias: 1.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: reaction: clap. Reaction exception: friendly expressive emoji, bold readable facial features, identical face proportions and camera angle to the approved reaction family; emotion must read at 24–32 pixels. Preserve the meaning of its existing Unicode reaction; no sticker border.

#### react_coin_eyes.png

Source files matching filename/alias: 1.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: Coin-eyes reaction: friendly face with two modest coin-shaped eyes; playful without exaggerated wealth imagery. Reaction exception: friendly expressive emoji, bold readable facial features, identical face proportions and camera angle to the approved reaction family; emotion must read at 24–32 pixels. Preserve the meaning of its existing Unicode reaction; no sticker border.

#### react_cool.png

Source files matching filename/alias: 1.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: reaction: cool. Reaction exception: friendly expressive emoji, bold readable facial features, identical face proportions and camera angle to the approved reaction family; emotion must read at 24–32 pixels. Preserve the meaning of its existing Unicode reaction; no sticker border.

#### react_crown_face.png

Source files matching filename/alias: 1.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: Crown reaction: friendly face wearing a restrained three-point champagne crown. Reaction exception: friendly expressive emoji, bold readable facial features, identical face proportions and camera angle to the approved reaction family; emotion must read at 24–32 pixels. Preserve the meaning of its existing Unicode reaction; no sticker border.

#### react_eyes.png

Source files matching filename/alias: 1.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: reaction: eyes. Reaction exception: friendly expressive emoji, bold readable facial features, identical face proportions and camera angle to the approved reaction family; emotion must read at 24–32 pixels. Preserve the meaning of its existing Unicode reaction; no sticker border.

#### react_facepalm.png

Source files matching filename/alias: 1.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: reaction: facepalm. Reaction exception: friendly expressive emoji, bold readable facial features, identical face proportions and camera angle to the approved reaction family; emotion must read at 24–32 pixels. Preserve the meaning of its existing Unicode reaction; no sticker border.

#### react_fire.png

Source files matching filename/alias: 1.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: reaction: fire. Reaction exception: friendly expressive emoji, bold readable facial features, identical face proportions and camera angle to the approved reaction family; emotion must read at 24–32 pixels. Preserve the meaning of its existing Unicode reaction; no sticker border.

#### react_green_heart.png

Source files matching filename/alias: 1.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: reaction: green heart. Reaction exception: friendly expressive emoji, bold readable facial features, identical face proportions and camera angle to the approved reaction family; emotion must read at 24–32 pixels. Preserve the meaning of its existing Unicode reaction; no sticker border.

#### react_heart_eyes.png

Source files matching filename/alias: 1.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: reaction: heart eyes. Reaction exception: friendly expressive emoji, bold readable facial features, identical face proportions and camera angle to the approved reaction family; emotion must read at 24–32 pixels. Preserve the meaning of its existing Unicode reaction; no sticker border.

#### react_hug.png

Source files matching filename/alias: 1.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: reaction: hug. Reaction exception: friendly expressive emoji, bold readable facial features, identical face proportions and camera angle to the approved reaction family; emotion must read at 24–32 pixels. Preserve the meaning of its existing Unicode reaction; no sticker border.

#### react_laugh.png

Source files matching filename/alias: 1.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: reaction: laugh. Reaction exception: friendly expressive emoji, bold readable facial features, identical face proportions and camera angle to the approved reaction family; emotion must read at 24–32 pixels. Preserve the meaning of its existing Unicode reaction; no sticker border.

#### react_like.png

Source files matching filename/alias: 1.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: reaction: like. Reaction exception: friendly expressive emoji, bold readable facial features, identical face proportions and camera angle to the approved reaction family; emotion must read at 24–32 pixels. Preserve the meaning of its existing Unicode reaction; no sticker border.

#### react_love.png

Source files matching filename/alias: 1.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: reaction: love. Reaction exception: friendly expressive emoji, bold readable facial features, identical face proportions and camera angle to the approved reaction family; emotion must read at 24–32 pixels. Preserve the meaning of its existing Unicode reaction; no sticker border.

#### react_mind_blown.png

Source files matching filename/alias: 1.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: reaction: mind blown. Reaction exception: friendly expressive emoji, bold readable facial features, identical face proportions and camera angle to the approved reaction family; emotion must read at 24–32 pixels. Preserve the meaning of its existing Unicode reaction; no sticker border.

#### react_muscle.png

Source files matching filename/alias: 1.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: reaction: muscle. Reaction exception: friendly expressive emoji, bold readable facial features, identical face proportions and camera angle to the approved reaction family; emotion must read at 24–32 pixels. Preserve the meaning of its existing Unicode reaction; no sticker border.

#### react_namaste.png

Source files matching filename/alias: 1.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: reaction: namaste. Reaction exception: friendly expressive emoji, bold readable facial features, identical face proportions and camera angle to the approved reaction family; emotion must read at 24–32 pixels. Preserve the meaning of its existing Unicode reaction; no sticker border.

#### react_ok.png

Source files matching filename/alias: 1.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: reaction: ok. Reaction exception: friendly expressive emoji, bold readable facial features, identical face proportions and camera angle to the approved reaction family; emotion must read at 24–32 pixels. Preserve the meaning of its existing Unicode reaction; no sticker border.

#### react_party.png

Source files matching filename/alias: 1.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: reaction: party. Reaction exception: friendly expressive emoji, bold readable facial features, identical face proportions and camera angle to the approved reaction family; emotion must read at 24–32 pixels. Preserve the meaning of its existing Unicode reaction; no sticker border.

#### react_peak.png

Source files matching filename/alias: 1.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: Peak reaction: friendly compact emerald mountain summit with one soft cyan highlight. Reaction exception: friendly expressive emoji, bold readable facial features, identical face proportions and camera angle to the approved reaction family; emotion must read at 24–32 pixels. Preserve the meaning of its existing Unicode reaction; no sticker border.

#### react_popcorn.png

Source files matching filename/alias: 1.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: reaction: popcorn. Reaction exception: friendly expressive emoji, bold readable facial features, identical face proportions and camera angle to the approved reaction family; emotion must read at 24–32 pixels. Preserve the meaning of its existing Unicode reaction; no sticker border.

#### react_rocket.png

Source files matching filename/alias: 1.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: reaction: rocket. Reaction exception: friendly expressive emoji, bold readable facial features, identical face proportions and camera angle to the approved reaction family; emotion must read at 24–32 pixels. Preserve the meaning of its existing Unicode reaction; no sticker border.

#### react_rofl.png

Source files matching filename/alias: 1.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: reaction: rofl. Reaction exception: friendly expressive emoji, bold readable facial features, identical face proportions and camera angle to the approved reaction family; emotion must read at 24–32 pixels. Preserve the meaning of its existing Unicode reaction; no sticker border.

#### react_sad.png

Source files matching filename/alias: 1.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: reaction: sad. Reaction exception: friendly expressive emoji, bold readable facial features, identical face proportions and camera angle to the approved reaction family; emotion must read at 24–32 pixels. Preserve the meaning of its existing Unicode reaction; no sticker border.

#### react_skull.png

Source files matching filename/alias: 1.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: reaction: skull. Reaction exception: friendly expressive emoji, bold readable facial features, identical face proportions and camera angle to the approved reaction family; emotion must read at 24–32 pixels. Preserve the meaning of its existing Unicode reaction; no sticker border.

#### react_star_struck.png

Source files matching filename/alias: 1.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: reaction: star struck. Reaction exception: friendly expressive emoji, bold readable facial features, identical face proportions and camera angle to the approved reaction family; emotion must read at 24–32 pixels. Preserve the meaning of its existing Unicode reaction; no sticker border.

#### react_thinking.png

Source files matching filename/alias: 1.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: reaction: thinking. Reaction exception: friendly expressive emoji, bold readable facial features, identical face proportions and camera angle to the approved reaction family; emotion must read at 24–32 pixels. Preserve the meaning of its existing Unicode reaction; no sticker border.

#### react_wink.png

Source files matching filename/alias: 1.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: reaction: wink. Reaction exception: friendly expressive emoji, bold readable facial features, identical face proportions and camera angle to the approved reaction family; emotion must read at 24–32 pixels. Preserve the meaning of its existing Unicode reaction; no sticker border.

#### react_wow.png

Source files matching filename/alias: 1.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: reaction: wow. Reaction exception: friendly expressive emoji, bold readable facial features, identical face proportions and camera angle to the approved reaction family; emotion must read at 24–32 pixels. Preserve the meaning of its existing Unicode reaction; no sticker border.

#### referral_image.png

Code aliases: `referralImage`. Source files matching filename/alias: 2.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: referral image.

#### save_done_1.png

Code aliases: `saveDone1`. Source files matching filename/alias: 2.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: save done 1.

#### save_done_2.png

Code aliases: `saveDone2`. Source files matching filename/alias: 2.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: save done 2.

#### sticker_calendar_check.png

Source files matching filename/alias: 1.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: sticker calendar check.

#### sticker_confetti.png

Source files matching filename/alias: 1.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: sticker confetti.

#### sticker_download_done.png

Source files matching filename/alias: 1.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: sticker download done.

#### sticker_gift_heart.png

Source files matching filename/alias: 1.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: sticker gift heart.

#### sticker_medal.png

Source files matching filename/alias: 1.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: sticker medal.

#### sticker_money_bag.png

Source files matching filename/alias: 1.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: sticker money bag.

#### sticker_party_popper.png

Source files matching filename/alias: 1.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: sticker party popper.

#### sticker_sparkles.png

Source files matching filename/alias: 1.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: sticker sparkles.

#### sticker_streak_flame.png

Source files matching filename/alias: 1.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: sticker streak flame.

#### sticker_target.png

Source files matching filename/alias: 1.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: sticker target.

#### sticker_upload_done.png

Source files matching filename/alias: 1.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: sticker upload done.

#### sticker_wave.png

Source files matching filename/alias: 1.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: sticker wave.

#### tier_classic_pass.png

Source files matching filename/alias: 1.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: tier classic pass: use the same membership medallion silhouette as the other tiers. Creator tiers progress classic graphite, starter emerald, silver satin silver, gold champagne gold, platinum cool platinum; tasker free uses a simple open peak and levels one through four add one through four clean upward steps. Differentiate by shape as well as material; no numerals, prices, stars implying verification or baked-in labels.

#### tier_gold_vip.png

Source files matching filename/alias: 1.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: tier gold vip: use the same membership medallion silhouette as the other tiers. Creator tiers progress classic graphite, starter emerald, silver satin silver, gold champagne gold, platinum cool platinum; tasker free uses a simple open peak and levels one through four add one through four clean upward steps. Differentiate by shape as well as material; no numerals, prices, stars implying verification or baked-in labels.

#### tier_platinum_vip.png

Source files matching filename/alias: 1.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: tier platinum vip: use the same membership medallion silhouette as the other tiers. Creator tiers progress classic graphite, starter emerald, silver satin silver, gold champagne gold, platinum cool platinum; tasker free uses a simple open peak and levels one through four add one through four clean upward steps. Differentiate by shape as well as material; no numerals, prices, stars implying verification or baked-in labels.

#### tier_silver_vip.png

Source files matching filename/alias: 1.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: tier silver vip: use the same membership medallion silhouette as the other tiers. Creator tiers progress classic graphite, starter emerald, silver satin silver, gold champagne gold, platinum cool platinum; tasker free uses a simple open peak and levels one through four add one through four clean upward steps. Differentiate by shape as well as material; no numerals, prices, stars implying verification or baked-in labels.

#### tier_starter_vip.png

Source files matching filename/alias: 1.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: tier starter vip: use the same membership medallion silhouette as the other tiers. Creator tiers progress classic graphite, starter emerald, silver satin silver, gold champagne gold, platinum cool platinum; tasker free uses a simple open peak and levels one through four add one through four clean upward steps. Differentiate by shape as well as material; no numerals, prices, stars implying verification or baked-in labels.

#### tier_tasker_free.png

Source files matching filename/alias: 1.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: tier tasker free: use the same membership medallion silhouette as the other tiers. Creator tiers progress classic graphite, starter emerald, silver satin silver, gold champagne gold, platinum cool platinum; tasker free uses a simple open peak and levels one through four add one through four clean upward steps. Differentiate by shape as well as material; no numerals, prices, stars implying verification or baked-in labels.

#### tier_tasker_l1.png

Source files matching filename/alias: 1.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: tier tasker l1: use the same membership medallion silhouette as the other tiers. Creator tiers progress classic graphite, starter emerald, silver satin silver, gold champagne gold, platinum cool platinum; tasker free uses a simple open peak and levels one through four add one through four clean upward steps. Differentiate by shape as well as material; no numerals, prices, stars implying verification or baked-in labels.

#### tier_tasker_l2.png

Source files matching filename/alias: 1.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: tier tasker l2: use the same membership medallion silhouette as the other tiers. Creator tiers progress classic graphite, starter emerald, silver satin silver, gold champagne gold, platinum cool platinum; tasker free uses a simple open peak and levels one through four add one through four clean upward steps. Differentiate by shape as well as material; no numerals, prices, stars implying verification or baked-in labels.

#### tier_tasker_l3.png

Source files matching filename/alias: 1.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: tier tasker l3: use the same membership medallion silhouette as the other tiers. Creator tiers progress classic graphite, starter emerald, silver satin silver, gold champagne gold, platinum cool platinum; tasker free uses a simple open peak and levels one through four add one through four clean upward steps. Differentiate by shape as well as material; no numerals, prices, stars implying verification or baked-in labels.

#### tier_tasker_l4.png

Source files matching filename/alias: 1.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: tier tasker l4: use the same membership medallion silhouette as the other tiers. Creator tiers progress classic graphite, starter emerald, silver satin silver, gold champagne gold, platinum cool platinum; tasker free uses a simple open peak and levels one through four add one through four clean upward steps. Differentiate by shape as well as material; no numerals, prices, stars implying verification or baked-in labels.

#### top_creator_badge.png

Source files matching filename/alias: 1.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: top creator badge. Badge exception: simplify to flat or very shallow depth, strong silhouette and one focal symbol so it reads at 16–24 pixels. No tiny ornament or text; render LIVE, NEW or tier names separately in the interface.

#### userProfile.png

Source files matching filename/alias: 1.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: user Profile.

#### verified_badge.png

Code aliases: `blueTik`. Source files matching filename/alias: 2.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: Verified status: compact blue scalloped seal with one high-contrast white check; clear at 16 pixels. Badge exception: simplify to flat or very shallow depth, strong silhouette and one focal symbol so it reads at 16–24 pixels. No tiny ornament or text; render LIVE, NEW or tier names separately in the interface.

#### video_placeholder.png

Source files matching filename/alias: 1.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: Unavailable video thumbnail: simple play tile over a quiet abstract emerald surface; clearly a placeholder, never fake content.

#### wallet_3d.png

Source files matching filename/alias: 1.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: wallet 3d.

#### wallet_image.png

Code aliases: `walletImage`. Source files matching filename/alias: 1.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: wallet image.

#### withdraw_bank.png

Source files matching filename/alias: 1.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: withdraw bank.

#### withdrawal_done.png

Code aliases: `withdrawalDone`. Source files matching filename/alias: 2.

> Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale. Subject: withdrawal done.

### Brand/system asset

#### appLogo.png

Source files matching filename/alias: 0.

> Use the supplied YouPeak reference as the identity source. Refine the camera/play symbol through precise vector reconstruction, preserving its recognizable rounded camera body, white play cutout and detached lens silhouette. Retain the green-to-teal-to-blue progression for brand artwork. Create a symbol-only variant without text or baked-in outer launcher mask. For appLogo.png, match its actual consumer and framing; launcher layers, splash mark and header logo need separate exports. Do not redesign the wordmark with an image generator.

#### app_logo.png

Code aliases: `appLogo`. Source files matching filename/alias: 4.

> Use the supplied YouPeak reference as the identity source. Refine the camera/play symbol through precise vector reconstruction, preserving its recognizable rounded camera body, white play cutout and detached lens silhouette. Retain the green-to-teal-to-blue progression for brand artwork. Create a symbol-only variant without text or baked-in outer launcher mask. For app_logo.png, match its actual consumer and framing; launcher layers, splash mark and header logo need separate exports. Do not redesign the wordmark with an image generator.

#### app_logo_icon.png

Code aliases: `logo`. Source files matching filename/alias: 9.

> Use the supplied YouPeak reference as the identity source. Refine the camera/play symbol through precise vector reconstruction, preserving its recognizable rounded camera body, white play cutout and detached lens silhouette. Retain the green-to-teal-to-blue progression for brand artwork. Create a symbol-only variant without text or baked-in outer launcher mask. For app_logo_icon.png, match its actual consumer and framing; launcher layers, splash mark and header logo need separate exports. Do not redesign the wordmark with an image generator.

#### ic_launcher_foreground.png

Source files matching filename/alias: 0.

> Use the supplied YouPeak reference as the identity source. Refine the camera/play symbol through precise vector reconstruction, preserving its recognizable rounded camera body, white play cutout and detached lens silhouette. Retain the green-to-teal-to-blue progression for brand artwork. Create a symbol-only variant without text or baked-in outer launcher mask. For ic_launcher_foreground.png, match its actual consumer and framing; launcher layers, splash mark and header logo need separate exports. Do not redesign the wordmark with an image generator.

#### ic_notification.png

Source files matching filename/alias: 0.

> Derive a simplified silhouette of the supplied YouPeak camera/play mark. Solid white foreground pixels with transparent surrounding area; no wordmark, border, gradients or colored background. Readable at tiny status-bar scale. This is a notification small icon, not a full-color launcher. Validate in Android notification previews.

#### logo.png

Source files matching filename/alias: 0.

> Use the supplied YouPeak reference as the identity source. Refine the camera/play symbol through precise vector reconstruction, preserving its recognizable rounded camera body, white play cutout and detached lens silhouette. Retain the green-to-teal-to-blue progression for brand artwork. Create a symbol-only variant without text or baked-in outer launcher mask. For logo.png, match its actual consumer and framing; launcher layers, splash mark and header logo need separate exports. Do not redesign the wordmark with an image generator.

#### splash_logo.png

Code aliases: `splashLogo`. Source files matching filename/alias: 1.

> Use the supplied YouPeak reference as the identity source. Refine the camera/play symbol through precise vector reconstruction, preserving its recognizable rounded camera body, white play cutout and detached lens silhouette. Retain the green-to-teal-to-blue progression for brand artwork. Create a symbol-only variant without text or baked-in outer launcher mask. For splash_logo.png, match its actual consumer and framing; launcher layers, splash mark and header logo need separate exports. Do not redesign the wordmark with an image generator.

#### youpeak_wordmark.png

Source files matching filename/alias: 1.

> Reconstruct the approved YouPeak wordmark from authorized vector source, preserving exact spelling, case, proportions and brand identity. Export transparent light-surface and dark-surface variants. Do not use image-generation lettering as production typography. Pair with the approved camera/play mark.

### Official third-party asset

#### apple_logo.png

Code aliases: `appleLogo`. Source files matching filename/alias: 6.

> Do not regenerate or restyle this third-party mark. Obtain the current official vector or high-resolution asset from the brand owner, preserve its proportions, clear space and permitted colors, and match only its displayed optical size to nearby controls. Existing file: apple_logo.png. Verify the exact provider identity before replacement.

#### cash_free_icon.webp

Code aliases: `cashFreeIcon`. Source files matching filename/alias: 3.

> Do not regenerate or restyle this third-party mark. Obtain the current official vector or high-resolution asset from the brand owner, preserve its proportions, clear space and permitted colors, and match only its displayed optical size to nearby controls. Existing file: cash_free_icon.webp. Verify the exact provider identity before replacement.

#### facebook.png

Code aliases: `facebook`. Source files matching filename/alias: 2.

> Do not regenerate or restyle this third-party mark. Obtain the current official vector or high-resolution asset from the brand owner, preserve its proportions, clear space and permitted colors, and match only its displayed optical size to nearby controls. Existing file: facebook.png. Verify the exact provider identity before replacement.

#### facebookLogo.png

Code aliases: `facebookLogo`. Source files matching filename/alias: 1.

> Do not regenerate or restyle this third-party mark. Obtain the current official vector or high-resolution asset from the brand owner, preserve its proportions, clear space and permitted colors, and match only its displayed optical size to nearby controls. Existing file: facebookLogo.png. Verify the exact provider identity before replacement.

#### flutter_wave_icon.png

Code aliases: `flutterWaveIcon`. Source files matching filename/alias: 3.

> Do not regenerate or restyle this third-party mark. Obtain the current official vector or high-resolution asset from the brand owner, preserve its proportions, clear space and permitted colors, and match only its displayed optical size to nearby controls. Existing file: flutter_wave_icon.png. Verify the exact provider identity before replacement.

#### flutter_wave_logo.png

Code aliases: `flutterWaveLogo`. Source files matching filename/alias: 1.

> Do not regenerate or restyle this third-party mark. Obtain the current official vector or high-resolution asset from the brand owner, preserve its proportions, clear space and permitted colors, and match only its displayed optical size to nearby controls. Existing file: flutter_wave_logo.png. Verify the exact provider identity before replacement.

#### google_logo.png

Code aliases: `googleLogo`. Source files matching filename/alias: 6.

> Do not regenerate or restyle this third-party mark. Obtain the current official vector or high-resolution asset from the brand owner, preserve its proportions, clear space and permitted colors, and match only its displayed optical size to nearby controls. Existing file: google_logo.png. Verify the exact provider identity before replacement.

#### ic_paypal_logo.webp

Code aliases: `payPalIcon`. Source files matching filename/alias: 1.

> Do not regenerate or restyle this third-party mark. Obtain the current official vector or high-resolution asset from the brand owner, preserve its proportions, clear space and permitted colors, and match only its displayed optical size to nearby controls. Existing file: ic_paypal_logo.webp. Verify the exact provider identity before replacement.

#### instagram.png

Code aliases: `instagram`. Source files matching filename/alias: 2.

> Do not regenerate or restyle this third-party mark. Obtain the current official vector or high-resolution asset from the brand owner, preserve its proportions, clear space and permitted colors, and match only its displayed optical size to nearby controls. Existing file: instagram.png. Verify the exact provider identity before replacement.

#### paypal.png

Code aliases: `paypal`. Source files matching filename/alias: 3.

> Do not regenerate or restyle this third-party mark. Obtain the current official vector or high-resolution asset from the brand owner, preserve its proportions, clear space and permitted colors, and match only its displayed optical size to nearby controls. Existing file: paypal.png. Verify the exact provider identity before replacement.

#### paystack_image.png

Code aliases: `payStackIcon`. Source files matching filename/alias: 3.

> Do not regenerate or restyle this third-party mark. Obtain the current official vector or high-resolution asset from the brand owner, preserve its proportions, clear space and permitted colors, and match only its displayed optical size to nearby controls. Existing file: paystack_image.png. Verify the exact provider identity before replacement.

#### razorPay.png

Code aliases: `razorPay`. Source files matching filename/alias: 3.

> Do not regenerate or restyle this third-party mark. Obtain the current official vector or high-resolution asset from the brand owner, preserve its proportions, clear space and permitted colors, and match only its displayed optical size to nearby controls. Existing file: razorPay.png. Verify the exact provider identity before replacement.

#### stripe.png

Code aliases: `stripe`. Source files matching filename/alias: 3.

> Do not regenerate or restyle this third-party mark. Obtain the current official vector or high-resolution asset from the brand owner, preserve its proportions, clear space and permitted colors, and match only its displayed optical size to nearby controls. Existing file: stripe.png. Verify the exact provider identity before replacement.

#### twitter.png

Code aliases: `twitter`. Source files matching filename/alias: 2.

> Do not regenerate or restyle this third-party mark. Obtain the current official vector or high-resolution asset from the brand owner, preserve its proportions, clear space and permitted colors, and match only its displayed optical size to nearby controls. Existing file: twitter.png. Verify the exact provider identity before replacement.

#### whatsApp.png

Code aliases: `whatsApp`. Source files matching filename/alias: 1.

> Do not regenerate or restyle this third-party mark. Obtain the current official vector or high-resolution asset from the brand owner, preserve its proportions, clear space and permitted colors, and match only its displayed optical size to nearby controls. Existing file: whatsApp.png. Verify the exact provider identity before replacement.

### Background/composition

#### default_channel_banner.png

Source files matching filename/alias: 1.

> Create a premium YouPeak background for default channel banner. Use a very quiet forest-green-to-teal field with one restrained blue accent and large rounded abstract forms derived from the camera/play logo. Keep at least 60 percent of the composition visually quiet for separately rendered content. No text, UI, fake thumbnails, logos, borders or watermark. For channel, referral and share compositions use a wide landscape draft; for store screenshot backgrounds use a portrait draft. Treat dimensions as a draft only: inspect the consuming widget or publishing template before final export. Keep all live text and logos separate. Provide editable layers where possible.

#### play_feature_graphic.png

Source files matching filename/alias: 0.

> Create a premium YouPeak background for play feature graphic. Use a very quiet forest-green-to-teal field with one restrained blue accent and large rounded abstract forms derived from the camera/play logo. Keep at least 60 percent of the composition visually quiet for separately rendered content. No text, UI, fake thumbnails, logos, borders or watermark. For channel, referral and share compositions use a wide landscape draft; for store screenshot backgrounds use a portrait draft. Treat dimensions as a draft only: inspect the consuming widget or publishing template before final export. Keep all live text and logos separate. Provide editable layers where possible.

#### referral_share_banner.png

Source files matching filename/alias: 1.

> Create a premium YouPeak background for referral share banner. Use a very quiet forest-green-to-teal field with one restrained blue accent and large rounded abstract forms derived from the camera/play logo. Keep at least 60 percent of the composition visually quiet for separately rendered content. No text, UI, fake thumbnails, logos, borders or watermark. For channel, referral and share compositions use a wide landscape draft; for store screenshot backgrounds use a portrait draft. Treat dimensions as a draft only: inspect the consuming widget or publishing template before final export. Keep all live text and logos separate. Provide editable layers where possible.

#### shade_image.png

Code aliases: `shadeImage`. Source files matching filename/alias: 1.

> Create a premium YouPeak background for shade image. Use a very quiet forest-green-to-teal field with one restrained blue accent and large rounded abstract forms derived from the camera/play logo. Keep at least 60 percent of the composition visually quiet for separately rendered content. No text, UI, fake thumbnails, logos, borders or watermark. For channel, referral and share compositions use a wide landscape draft; for store screenshot backgrounds use a portrait draft. Treat dimensions as a draft only: inspect the consuming widget or publishing template before final export. Keep all live text and logos separate. Provide editable layers where possible.

#### share_card_bg.png

Source files matching filename/alias: 0.

> Create a premium YouPeak background for share card bg. Use a very quiet forest-green-to-teal field with one restrained blue accent and large rounded abstract forms derived from the camera/play logo. Keep at least 60 percent of the composition visually quiet for separately rendered content. No text, UI, fake thumbnails, logos, borders or watermark. For channel, referral and share compositions use a wide landscape draft; for store screenshot backgrounds use a portrait draft. Treat dimensions as a draft only: inspect the consuming widget or publishing template before final export. Keep all live text and logos separate. Provide editable layers where possible.

#### splash_image.png

Code aliases: `splashImage`. Source files matching filename/alias: 1.

> Create a premium YouPeak background for splash image. Use a very quiet forest-green-to-teal field with one restrained blue accent and large rounded abstract forms derived from the camera/play logo. Keep at least 60 percent of the composition visually quiet for separately rendered content. No text, UI, fake thumbnails, logos, borders or watermark. For channel, referral and share compositions use a wide landscape draft; for store screenshot backgrounds use a portrait draft. Treat dimensions as a draft only: inspect the consuming widget or publishing template before final export. Keep all live text and logos separate. Provide editable layers where possible.

#### store_screenshot_bg.png

Source files matching filename/alias: 0.

> Create a premium YouPeak background for store screenshot bg. Use a very quiet forest-green-to-teal field with one restrained blue accent and large rounded abstract forms derived from the camera/play logo. Keep at least 60 percent of the composition visually quiet for separately rendered content. No text, UI, fake thumbnails, logos, borders or watermark. For channel, referral and share compositions use a wide landscape draft; for store screenshot backgrounds use a portrait draft. Treat dimensions as a draft only: inspect the consuming widget or publishing template before final export. Keep all live text and logos separate. Provide editable layers where possible.

### Motion asset

#### mic.json

Source files matching filename/alias: 1.

> Create a subtle looping microphone listening animation using the YouPeak UI geometry: three to five rounded waveform bars, stable baseline, small amplitude changes, calm timing, no flashing or background. Deliver editable vector motion through a supported animation pipeline; a still-image generator cannot deliver a working Lottie JSON. Inspect the consuming widget before changing this file.

## Built-in Flutter symbols also found in source

These are not missing PNG files. They are existing code-rendered icons. Reuse the approved semantic vector master when you later unify the UI. Variant suffixes such as rounded/outlined usually do not justify a separate design. This scan may include comments.

- `Icons.account_balance_rounded`
- `Icons.account_balance_wallet_rounded`
- `Icons.add`
- `Icons.add_circle_outline`
- `Icons.arrow_back`
- `Icons.arrow_back_ios_new`
- `Icons.arrow_back_rounded`
- `Icons.arrow_drop_down`
- `Icons.arrow_forward_ios_rounded`
- `Icons.arrow_forward_rounded`
- `Icons.auto_awesome`
- `Icons.build_circle_outlined`
- `Icons.calculate_outlined`
- `Icons.calendar_today_outlined`
- `Icons.campaign_rounded`
- `Icons.chat_bubble_rounded`
- `Icons.check`
- `Icons.check_circle`
- `Icons.check_circle_outline`
- `Icons.check_circle_rounded`
- `Icons.chevron_right`
- `Icons.chevron_right_rounded`
- `Icons.circle`
- `Icons.close`
- `Icons.close_rounded`
- `Icons.cloud_off_rounded`
- `Icons.delete_outline_outlined`
- `Icons.delete_outlined`
- `Icons.done`
- `Icons.done_all_rounded`
- `Icons.download_rounded`
- `Icons.edit`
- `Icons.edit_outlined`
- `Icons.edit_rounded`
- `Icons.email_outlined`
- `Icons.emoji_events_outlined`
- `Icons.emoji_events_rounded`
- `Icons.error_outline_rounded`
- `Icons.female`
- `Icons.forward_10_rounded`
- `Icons.front_hand_rounded`
- `Icons.fullscreen_exit_rounded`
- `Icons.fullscreen_rounded`
- `Icons.gavel_outlined`
- `Icons.gpp_bad_rounded`
- `Icons.home_outlined`
- `Icons.hourglass_disabled`
- `Icons.hourglass_top_rounded`
- `Icons.image`
- `Icons.info_outline`
- `Icons.info_outline_rounded`
- `Icons.link`
- `Icons.location_on_outlined`
- `Icons.lock_outline_rounded`
- `Icons.lock_person_rounded`
- `Icons.lock_rounded`
- `Icons.male`
- `Icons.monetization_on_rounded`
- `Icons.more_vert`
- `Icons.nightlight_round`
- `Icons.notifications_none_rounded`
- `Icons.ondemand_video_rounded`
- `Icons.open_in_new_rounded`
- `Icons.outlined_flag_rounded`
- `Icons.pause_circle_filled_rounded`
- `Icons.pause_rounded`
- `Icons.phone_iphone_rounded`
- `Icons.phone_outlined`
- `Icons.phonelink_lock_rounded`
- `Icons.play_arrow_rounded`
- `Icons.play_circle_fill`
- `Icons.play_circle_fill_rounded`
- `Icons.play_circle_outline`
- `Icons.play_circle_outline_rounded`
- `Icons.public`
- `Icons.qr_code_rounded`
- `Icons.radio_button_unchecked_rounded`
- `Icons.receipt_long_outlined`
- `Icons.refresh`
- `Icons.refresh_rounded`
- `Icons.remove_circle_outline`
- `Icons.replay_10_rounded`
- `Icons.replay_rounded`
- `Icons.rocket_launch_rounded`
- `Icons.schedule_outlined`
- `Icons.search`
- `Icons.search_rounded`
- `Icons.send_rounded`
- `Icons.skip_next_rounded`
- `Icons.speed_rounded`
- `Icons.stop`
- `Icons.thumb_up_alt_rounded`
- `Icons.timer_outlined`
- `Icons.timer_rounded`
- `Icons.verified`
- `Icons.verified_outlined`
- `Icons.verified_user_rounded`
- `Icons.video_file`
- `Icons.videocam_off_outlined`
- `Icons.visibility`
- `Icons.visibility_outlined`
- `Icons.volume_down_rounded`
- `Icons.volume_off_rounded`
- `Icons.volume_up_rounded`
- `Icons.vpn_lock_rounded`
- `Icons.warning_amber_rounded`
- `Icons.wifi_off_rounded`
- `Icons.workspace_premium_rounded`

For a built-in symbol without a PNG counterpart, use this full prompt: "Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG. Subject: [the control meaning, not the API spelling]. Preserve the established meaning and direction of the current control. Reuse an approved master whenever the meaning matches."

Additional distinct controls to cover: volume high/low/mute (speaker with two/one/no wave and slash for mute), stop (solid square), refresh/retry (clockwise arrow), external link (box with northeast arrow), link (two interlocking links), phone (handset), QR (three corner finder blocks), bank (three-column facade), receipt (rounded receipt with text strokes), security/device lock (phone with padlock), VPN restriction (shield with connection slash), legal/grievance (balanced scales), timer pending (hourglass), task completion (check inside circle), access denied (shield with minus), and support contact (headset). All use the same complete UI-glyph prompt and one single clear subject.

## Declared paths absent from the icon folder

These constants exist in AppIcons but their files were not found. They may be unused legacy declarations; this is not evidence of a runtime failure. Check actual consumers before generating or deleting them.

- `card.png` — aliases: card
- `internet.png` — aliases: internet
- `colorFilter.png` — aliases: colorFilter
- `ArrowDown1.png` — aliases: arrowdown
