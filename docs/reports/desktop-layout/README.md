# Desktop responsiveness: what changed and what was checked

Written for: whoever reviews the web layout work before it is committed.

## Root cause

Three shared causes forced a phone column on desktop:

1. `AppLayout.width` is `min(window, 600)`. Pages sized cards with `width: AppLayout.width`, so a page beside the sidebar still drew 600px-wide cards however wide its area was.
2. The shell gave every page without a registered width a **600px** column (`AppLayout.shellWidthFor` fallback). About 35 secondary pages (Monetization, Wallet, coins, plans, forms, upload steps) were unregistered.
3. Primary actions lived in `Scaffold.bottomNavigationBar`, so on a tall desktop window the button sat at the window bottom, far from the form it submits. Several pages also hardcoded card heights (`height: 200`) and spacers.

## Shared fix

| Where | What |
| --- | --- |
| `lib/core/platform/responsive.dart` (new) | `PageWidth`, breakpoints, `AdaptiveScroll`, `ResponsiveSplit`, `ResponsiveGrid`, `AdaptiveCardList`, `SurfaceCard`, `CardOnWide`, `ActionWidth`. Everything sizes from the width the page really gets (beside the sidebar), not the window. |
| `lib/core/platform/app_layout.dart` | `AppLayout.widthOf(context)`; `ShellPageContent` and `AppPageFrame` publish the page width; below 900px a registered page gets its own width up to the window instead of a fixed 600 column. |
| `lib/core/platform/shell_route_widths.dart` (new) | Content width for every secondary page (760 forms, 860 lists, 1000-1120 dashboards). |
| `lib/shared/dialogs/app_sheet.dart` (new) | All 33 `Get.bottomSheet` call sites now use `AppSheet.show`: a centred panel of at most 640px on wide windows, unchanged on phones. Flutter's own `showModalBottomSheet` is capped by the theme. |
| `lib/core/platform/platform_info.dart` | `debugIsWeb` test hook so the web layouts can be exercised in the VM. |

Rule used on pages with a bottom action: below 720px the action stays docked (phone design); from 720px it sits under the content it belongs to; from 840px the page splits into two columns where the content suits it.

## Route checklist

**Redesigned for desktop** (new arrangement; phone layout kept):
Monetization (hero + requirement cards + inline action; progress clamped), My Wallet, Withdraw, Buy Coins (columns follow width), Convert Coin, Referral Program, Premium Plans (cards in columns), Current Plan (summary beside details), Subscription Plan (fields side by side), Edit Profile (photo beside form), Edit Video (preview beside form), Language (two columns), Coin Payment, Premium Payment, Create Channel (both variants), Add Thumbnail, Upload Video (button under the form), Audience, Visibility, Video Charges, Comments, Description, Set Thumbnail, Withdraw History, Coin History, Buy-coin History, Referral History (list in a card), Premium Purchase History (also fixed: the list could not scroll).

**Width registered, content already fluid** (checked, not redesigned):
Preview Monetization, Time Watched, Content Engagement, Ad Credits Wallet, Creator VIP Pass, Grievance Officer, Create Playlist, Privacy Policy (opens in a new browser tab on web).

**Already had desktop layouts, re-checked** (loading/empty states): Home, Bites, Subscription, Library, Search, Notifications, Tasker, Tasker tiers, Earn Rewards, Profile, Settings, Help Center, History, Watch Later, Your Videos, Downloads, Playlists, Subscribed Channels, Your Channel, Promote Video / Flow / Campaign.

**Not covered**: video player (`NormalVideoDetailsView`), Bites full-screen player, camera / go-live / live, sign-in and onboarding pages.

## Bugs found and fixed on the way

- Upload preview: `Positioned` children with `width: double.infinity` (from an earlier uncommitted edit) threw an infinite-width layout error at every size.
- Desktop rail labels "Subscription" / "Notification" were cut off; they now shrink to fit.
- New cards were unreadable in dark mode (dark green on dark green, white progress track); fixed.

## Evidence

- `flutter test`: 613 tests pass. New: page coverage (53 pages x 6 sizes, plus an assertion that each is registered at the width it is rendered at), main tabs (4 tabs x 6 sizes), Monetization layout, wallet, sheets, resize-across-breakpoint, phone sign-in.
- Sizes: 390x844, 768x1024, 1024x768, 1366x768, 1440x900, 1920x1080.
- `flutter analyze lib`: no errors. Warnings and infos in untouched code are unchanged.
- `flutter build web --release` succeeds.
- Resize test: a page opened through the real transition keeps its state when the window goes 1440 -> 390 -> 768 -> 1024 -> 1920.

## Not verified

- Most pages were rendered in their loading / empty state (no backend in tests). Populated layouts were rendered for Monetization and My Wallet only.
- No real browser pass: a headless Chrome load of the built app booted but produced a blank capture, and signed-in screens need a login.
- Earn Rewards' wide layout (`EarnRewardWide`, web only) was not rendered with data.
- Test glyphs use Arial, not Urbanist, so text widths are close but not exact.
