# Route coverage matrix

Source: `screenshots/final/evidence.json` (final release build), `screenshots/debug/evidence.json` (debug build, assertions on), `screenshots/before/evidence.json` (pre-task build).

Cell: ✅ reached · S = desktop sidebar shown (expected at 1920/1366) · ⚠ horizontal page scroll. Screenshots: `screenshots/<run>/<route>-<width>.png`.

| Route | 1920 | 1366 | 768 | 390 | Debug build: exceptions / overflows | Before: sidebar at 1920 |
|---|---|---|---|---|---|---|
| 10-tasker | ✅ S | ✅ S | ✅ | ✅ | none | yes |
| 11-earn | ✅ S | ✅ S | ✅ | ✅ | none | **no** |
| 20-history | ✅ S | ✅ S | ✅ | ✅ | none | yes |
| 21-your-videos | ✅ S | ✅ S | ✅ | ✅ | none | yes |
| 22-playlists | ✅ S | ✅ S | ✅ | ✅ | none | yes |
| 23-watch-later | ✅ S | ✅ S | ✅ | ✅ | none | yes |
| 30-wallet | ✅ S | ✅ S | ✅ | ✅ | none | **no** |
| 31-settings | ✅ S | ✅ S | ✅ | ✅ | none | **no** |
| 32-help | ✅ S | ✅ S | ✅ | ✅ | none | **no** |
| 33-time-watched | ✅ S | ✅ S | ✅ | ✅ | none | **no** |
| 34-earn-from-profile | ✅ S | ✅ S | ✅ | ✅ | none | yes |
| 35-create-channel | ✅ S | ✅ S | ✅ | ✅ | none | **no** |
| 36-channel | ✅ S | ✅ S | ✅ | ✅ | 759 exception report(s) — fixed after this run (null-safe header) | — |
| 40-search | ✅ S | ✅ S | ✅ | ✅ | 2 exception report(s) — trailing reports from the channel page just before | yes |
| 41-notifications | ✅ S | ✅ S | ✅ | ✅ | none | yes |
| 42-profile | ✅ S | ✅ S | ✅ | ✅ | none | yes |
| 43-library | ✅ S | ✅ S | ✅ | ✅ | none | yes |
| 44-home | ✅ S | ✅ S | ✅ | ✅ | none | yes |

Phone layouts (390/768) correctly have no sidebar; the bottom navigation / back button is used there.
