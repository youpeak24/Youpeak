# YouPeak artwork prompt inventory

314 prompt records parsed from YOUPEAK_IMAGE_PROMPTS.txt. This is a design reference; instructions in the source document do not replace the user request.

| ID | Asset | Family | Use |
| --- | --- | --- | --- |
| A-01 | appLogo.png | BRAND | Master source for flutter_launcher_icons (pubspec.yaml image_path) -> generates every Android mipmap + iOS icon. Also the Play Store 512x512 icon. |
| A-02 | app_logo.png | BRAND | Splash screen centre logo (splash_screen_view.dart line ~203, AppIcons.appLogo) and any place the full coloured app icon is shown inside the UI. |
| A-03 | app_logo_icon.png | BRAND (mark only) | AppIcons.logo — login & sign-up header (full colour, ~12% of screen height), premium plan header, and as a TINTED placeholder inside video thumbnails and the Bites loading shimmer (preview_image.dart, shorts_video_shimmer_ui.dart — tinted black / white / green). |
| A-04 | ic_launcher_foreground.png | BRAND (Android adaptive icon foreground layer) | Android 8+ adaptive launcher icon — foreground layer that moves in parallax over the background layer. |
| A-05 | ic_launcher_background.png | BRAND (Android adaptive icon background layer) | Android 8+ adaptive launcher icon — background layer. |
| A-06 | logo.png (notification small icon) | BRAND (Android status-bar notification icon) | Status bar and notification shade small icon for every push / local notification. |
| A-07 | ic_launcher_monochrome.png | BRAND (Android 13+ themed icon) | Android 13+ 'Themed icons' — the launcher tints this layer with the user's wallpaper colours. |
| A-08 | splash_image.png | BRAND (full-screen splash background) | Splash screen full-screen background behind the centred logo (AppIcons.splashImage). The current file is 3.2 MB — the new one must be under 350 KB. |
| A-09 | splash_logo.png  +  android drawable ic_splash.png / splash_logo.png | BRAND (native Android splash icon) | The native Android launch screen shown for the first ~300 ms before Flutter draws (launch_background.xml), and Android 12+ SplashScreen API icon. |
| A-10 | youpeak_wordmark.png | BRAND (logo lock-up) | Optional: login / sign-up header, Home app-bar (instead of plain text), share-card watermark, About screen. |
| A-11 | shorts.png (App shortcut — Bites) | BRAND (Android launcher app-shortcut icon) | Long-press the YouPeak launcher icon -> 'Bites' shortcut (quick_actions, main_home_view.dart line ~139). |
| A-12 | search.png (App shortcut — Search) | BRAND (Android launcher app-shortcut icon) | Long-press launcher icon -> 'Search' shortcut. |
| A-13 | subscription.png (App shortcut — Subscriptions) | BRAND (Android launcher app-shortcut icon) | Long-press launcher icon -> 'Subscriptions' shortcut. |
| B-01 | home.png | GLYPH — OUTLINE (tintable, single colour) | Bottom navigation — Home tab, INACTIVE (tinted grey/charcoal/white). |
| B-02 | boldHome.png | GLYPH — SOLID (tintable, single colour) | Bottom navigation — Home tab, ACTIVE (tinted Forest Green #0A7A44 or white in dark mode). |
| B-03 | Video.png | GLYPH — OUTLINE (tintable, single colour) | Bottom navigation — 'Bites' (short videos) tab, INACTIVE. |
| B-04 | boldVideo.png | GLYPH — SOLID (tintable, single colour) | Bottom navigation — Bites tab ACTIVE; also the 'Create a Bite' tile icon in the Create bottom sheet (tinted). |
| B-05 | videoCircle.png | GLYPH — OUTLINE (tintable, single colour) | Bottom navigation — 'Subscription' tab (channels you follow), INACTIVE. |
| B-06 | boldPlay.png | GLYPH — SOLID (tintable, single colour) | Bottom navigation — Subscription tab ACTIVE; also used on shorts & video pages (tinted). (Go Live tile should move to go_live.png — see F-10.) |
| B-07 | library.png | GLYPH — OUTLINE (tintable, single colour) | Bottom navigation — Library tab, INACTIVE (history, your videos, downloads, watch later, playlists). |
| B-08 | boldDocument.png | GLYPH — SOLID (tintable, single colour) | Bottom navigation — Library tab ACTIVE. |
| B-09 | search.png | GLYPH — OUTLINE (tintable, single colour) | Home app bar search button, Search page field, channel search (tinted charcoal / white). |
| B-10 | notification.png | GLYPH — OUTLINE (tintable, single colour) | Home app bar notifications bell (with a red count badge drawn by the app), Settings > Notifications. |
| B-11 | earn_reward_icon.png | 3D PEAK (full colour) | Home app bar — rewards shortcut button next to the bell (full colour, not tinted). Opens Earn Rewards. |
| C-01 | like.png | GLYPH — OUTLINE (tintable, single colour) | Video details page action row (Like, not yet liked), comment & reply like buttons. |
| C-02 | like_bold.png | GLYPH — SOLID (tintable, single colour) | Like button ACTIVE (tinted Forest Green), Bites right-rail like button (tinted white over video with shadow). |
| C-03 | dislike_icon.png | GLYPH — OUTLINE (tintable, single colour) | Video details Dislike (not selected), comments dislike. |
| C-04 | dislike_bold.png | GLYPH — SOLID (tintable, single colour) | Dislike ACTIVE, Bites right-rail dislike (tinted white over video). |
| C-05 | comment.png | GLYPH — OUTLINE (tintable, single colour) | Video details 'Comments' button, Bites right rail comments (tinted white). |
| C-06 | comment_1.png | GLYPH — SOLID (tintable, single colour) | AppIcons.boldChat — comment count chips, comment sheet header, live chat (tinted). |
| C-07 | share_icon.png | GLYPH — OUTLINE (tintable, single colour) | 'Share' in video action row and More-options sheets. |
| C-08 | boldShare.png | GLYPH — SOLID (tintable, single colour) | Bites right rail share button (tinted white over video), channel share. |
| C-09 | download.png | GLYPH — OUTLINE (tintable, single colour) | 'Download Video' in action row and More-options sheet, Downloads in Library. |
| C-10 | download_bold.png | GLYPH — SOLID (tintable, single colour) | Download active / downloaded state, premium download promo. |
| C-11 | download_1.png | GLYPH — OUTLINE (tintable, single colour) | AppIcons.videoDownload — video download entry, download progress chip. |
| C-12 | videoDownload.png | GLYPH — OUTLINE (tintable, single colour) | Download list rows (secondary download icon). |
| C-13 | watch_later.png | GLYPH — OUTLINE (tintable, single colour) | AppIcons.addToSave — 'Save to Watch Later' in More-options sheet and action row. |
| C-14 | bookmark.png | GLYPH — OUTLINE (tintable, single colour) | Save / bookmark (not saved). |
| C-15 | boldBookmark.png | GLYPH — SOLID (tintable, single colour) | Saved state (tinted Forest Green). |
| C-16 | save_done_1.png | GLYPH — OUTLINE (tintable, single colour) | Saved-to-playlist confirmation (small). |
| C-17 | save_done_2.png | GLYPH — SOLID (tintable, single colour) | Saved-to-playlist confirmation (active, tinted). |
| C-18 | moreCircle.png | GLYPH — OUTLINE (tintable, single colour) | 'More' button on video cards, Bites right rail (tinted white), channel page, app bars. |
| C-19 | moreSquare.png | GLYPH — OUTLINE (tintable, single colour) | Settings / sheet 'More' entries. |
| C-20 | moreThreeCircle.png | GLYPH — OUTLINE (tintable, single colour) | Comment row overflow menu (tinted grey). |
| C-21 | flages.png | GLYPH — OUTLINE (tintable, single colour) | AppIcons.report — 'Report' entry in More-options sheet. |
| C-22 | report.png | GLYPH — SOLID (tintable, single colour) | AppIcons.reportFlag — report dialogs, channel 'Report / Block' (tinted). |
| C-23 | flag.png | GLYPH — OUTLINE (tintable, single colour) | Report reason list / country flag placeholder. |
| C-24 | flage.png | GLYPH — SOLID (tintable, single colour) | AppIcons.flage — small report indicator. |
| C-25 | play.png | GLYPH — OUTLINE (tintable, single colour) | Profile menu 'Your Videos', Settings 'Autoplay', list rows (ImageIcon, tinted). |
| C-26 | play_video.png | GLYPH — SOLID (tintable, single colour) | AppIcons.videoPlay — big centre play button on the video player, preview play, tinted white over video. |
| C-27 | pause.png | GLYPH — SOLID (tintable, single colour) | Video player centre pause (tinted white over video). |
| C-28 | puse.png | GLYPH — OUTLINE (tintable, single colour) | Sound/preview pause in Add Sound sheet and mini players. |
| C-29 | Backward10s.png | GLYPH — OUTLINE (tintable, single colour) | Video player — double-tap / button to rewind 10 seconds (tinted white). |
| C-30 | Forward10s.png | GLYPH — OUTLINE (tintable, single colour) | Video player — forward 10 seconds (tinted white). |
| C-31 | Next.png | GLYPH — SOLID (tintable, single colour) | Video player / playlist — next video (tinted white). |
| C-32 | Previous.png | GLYPH — SOLID (tintable, single colour) | Video player / playlist — previous video. |
| C-33 | Expand.png | GLYPH — OUTLINE (tintable, single colour) | Video player — enter fullscreen (tinted white). |
| C-34 | Collapse.png | GLYPH — OUTLINE (tintable, single colour) | Video player — exit fullscreen. |
| C-35 | Subtitle.png | GLYPH — OUTLINE (tintable, single colour) | Video player settings — subtitles. |
| C-36 | caption.png | GLYPH — OUTLINE (tintable, single colour) | Video player settings — captions (CC). |
| C-37 | Timer.png | GLYPH — OUTLINE (tintable, single colour) | Video player — sleep timer. |
| C-38 | speed.png | GLYPH — OUTLINE (tintable, single colour) | Video player — playback speed. |
| C-39 | boldSpeed.png | GLYPH — SOLID (tintable, single colour) | Create a Bite — recording speed button (tinted white on camera). |
| C-40 | watch.png | GLYPH — OUTLINE (tintable, single colour) | AppIcons.playSpeed — playback-speed entry in the player options sheet (tinted). |
| C-41 | swape.png | GLYPH — OUTLINE (tintable, single colour) | AppIcons.loopVideo — 'Loop video' option in player sheet. |
| C-42 | shuffle.png | GLYPH — OUTLINE (tintable, single colour) | Playlist preview — shuffle play. |
| C-43 | tv.png | GLYPH — OUTLINE (tintable, single colour) | Player options — cast / watch on TV. |
| C-44 | sound.png | GLYPH — OUTLINE (tintable, single colour) | Bites / create page — sound on (tinted white). |
| C-45 | music.png | GLYPH — OUTLINE (tintable, single colour) | Bites 'Original sound' chip, Add Sound list. |
| C-46 | audio.png | GLYPH — OUTLINE (tintable, single colour) | Create a Bite — 'Add Sound' button. |
| F-01 | camera.png | GLYPH — OUTLINE (tintable, single colour) | Fill profile / edit profile avatar camera badge, search, create (tinted). |
| F-02 | flip.png | GLYPH — OUTLINE (tintable, single colour) | AppIcons.flipCamera — Create a Bite & Go Live: switch front/back camera (tinted white). |
| F-03 | flash.png | GLYPH — OUTLINE (tintable, single colour) | Create a Bite / Go Live — flash toggle (tinted white). |
| F-04 | effects.png | GLYPH — OUTLINE (tintable, single colour) | Create a Bite — effects / filters. |
| F-05 | beauty.png | GLYPH — OUTLINE (tintable, single colour) | Create a Bite / Go Live — beauty filter. |
| F-06 | gallery.png | GLYPH — OUTLINE (tintable, single colour) | Choose image (fill profile, edit profile), add thumbnail placeholder (tinted grey). |
| F-07 | set_thumbnail.png | GLYPH — OUTLINE (tintable, single colour) | Upload video — 'Set thumbnail' option row (ImageIcon). |
| F-08 | upload.png | GLYPH — SOLID (tintable, single colour) | AppIcons.boldUpload — 'Upload a Video' tile in the Create sheet, uploading status (tinted). |
| F-09 | recording.png | FLAT BRAND UI (full colour) | Create a Bite — the record button area (full colour, not tinted). |
| F-10 | go_live.png | GLYPH — SOLID (tintable, single colour) | Create sheet 'Go Live' tile (replace AppIcons.boldPlay there), Go Live page header, live indicator on channel. Add constant: static const String goLive = "assets/icons/go_live.png"; |
| F-11 | live_chat.png | GLYPH — OUTLINE (tintable, single colour) | Live stream screen — chat toggle / live chat header (AppIcons declares liveChat.png but the file is missing). |
| F-12 | text_send.png | FLAT BRAND UI (full colour) | Live stream chat — send message button (full colour, not tinted). |
| F-13 | send.png | GLYPH — OUTLINE (tintable, single colour) | Comment & reply input — send button (tinted Forest Green). |
| F-14 | scan.png | GLYPH — OUTLINE (tintable, single colour) | Scan / QR entry (referral, future partner linking). |
| F-15 | 0.png | GLYPH — OUTLINE (tintable, single colour) | AppIcons.descriptionIcon — Upload Video details: 'Add description' row. |
| F-16 | 1.png | GLYPH — OUTLINE (tintable, single colour) | AppIcons.visibilityIcon — Upload Video details: 'Visibility' (Public / Private / Unlisted) row. |
| F-17 | 2.png | GLYPH — OUTLINE (tintable, single colour) | AppIcons.audienceIcon — Upload Video: 'Select audience' (kids / 18+ / both). |
| F-18 | 3.png | GLYPH — OUTLINE (tintable, single colour) | AppIcons.scheduleIcon — Upload Video: 'Schedule' publish time. |
| F-19 | 4.png | GLYPH — OUTLINE (tintable, single colour) | AppIcons.commentIcon — Upload Video: 'Comments' permissions row. |
| F-20 | 5.png | GLYPH — OUTLINE (tintable, single colour) | AppIcons.locationIcon — Upload Video: 'Location' row. |
| F-21 | location.png | GLYPH — OUTLINE (tintable, single colour) | Channel About tab location, fill profile country (tinted). |
| F-22 | video_charges.png | GLYPH — OUTLINE (tintable, single colour) | Upload Video: 'Video charges' (paid / free video) row (ImageIcon). |
| F-23 | paid.png | GLYPH — OUTLINE (tintable, single colour) | Video charges page — 'Paid' option. |
| F-24 | free.png | GLYPH — OUTLINE (tintable, single colour) | Video charges page — 'Free' option. |
| F-25 | ic_edit_video.png | GLYPH — OUTLINE (tintable, single colour) | Your Videos — 'Edit video' in more-options sheet (tinted). |
| F-26 | ic_delete_video.png | GLYPH — OUTLINE (tintable, single colour) | Your Videos — 'Delete video' (tinted red #D32F2F by the app). |
| F-27 | edit.png | GLYPH — OUTLINE (tintable, single colour) | Edit profile, edit channel, edit fields. |
| F-28 | editButton.png | FLAT BRAND UI (full colour) | Profile photo edit badge (small circle on the avatar). |
| G-01 | profileLogo.png | GLYPH — OUTLINE (tintable, single colour) | AppIcons.account — Profile menu 'Your Channel' / account row (ImageIcon, tinted). |
| G-02 | profile.png | GLYPH — OUTLINE (tintable, single colour) | Profile tab / profile entry points (tinted). |
| G-03 | incognito.png | GLYPH — OUTLINE (tintable, single colour) | Profile menu 'Turn on Incognito' (ImageIcon). |
| G-04 | subscription_plan.png | GLYPH — OUTLINE (tintable, single colour) | Profile menu 'Subscription Plan / Premium' (ImageIcon). |
| G-05 | earn_reward.png | GLYPH — OUTLINE (tintable, single colour) | Profile menu 'Earn Rewards' (ImageIcon). |
| G-06 | Wallet.png | GLYPH — OUTLINE (tintable, single colour) | Profile menu 'My Wallet', Settings 'Payments history' (ImageIcon). |
| G-07 | activity.png | GLYPH — OUTLINE (tintable, single colour) | AppIcons.timeWatched — Profile menu 'Time Watched' (ImageIcon). |
| G-08 | dark_mode.png | GLYPH — OUTLINE (tintable, single colour) | Profile menu & Settings 'Dark Mode' switch row (ImageIcon). |
| G-09 | monetization.png | GLYPH — OUTLINE (tintable, single colour) | Profile menu 'Monetization' (ImageIcon) — creator earnings. |
| G-10 | king.png | 3D PEAK — silhouette-safe (full colour AND tinted) | DUAL USE: Profile menu 'Creator VIP Pass' (ImageIcon, TINTED) AND full colour in Creator Tier page header (22 dp) and Earn Rewards 'VIP' row (30 dp). |
| G-11 | trending.png | GLYPH — OUTLINE (tintable, single colour) | Profile menu 'Starter Pass' (Tasker earning tiers) row (ImageIcon). |
| G-12 | setting.png | GLYPH — OUTLINE (tintable, single colour) | Profile menu 'Settings' (ImageIcon), app bars. |
| G-13 | infoSquare.png | GLYPH — OUTLINE (tintable, single colour) | AppIcons.help — Profile menu 'Help Center', Settings 'Help & feedback' (ImageIcon). |
| G-14 | logout.png | GLYPH — OUTLINE (tintable, single colour) | Profile menu 'Logout' (ImageIcon, tinted #F75555 red). |
| G-15 | delete_account.png | GLYPH — OUTLINE (tintable, single colour) | Profile menu 'Delete Account' (ImageIcon, tinted red). |
| G-16 | TimeCircle.png | GLYPH — OUTLINE (tintable, single colour) | DUAL USE: Settings 'Autoplay/General', Tasker tier page 'Lifetime watch hours' (full colour, shows as black), history lists (tinted). |
| G-17 | timeCirclePink.png | GLYPH — SOLID (tintable, single colour) | AppIcons.timerHistory — watch-time history accent. |
| G-18 | history_icon.png | GLYPH — OUTLINE (tintable, single colour) | Coin history, watch history, referral history entries. |
| G-19 | translate.png | GLYPH — OUTLINE (tintable, single colour) | Settings 'Language' (ImageIcon). |
| G-20 | language.png | GLYPH — OUTLINE (tintable, single colour) | Language selection page header / rows. |
| G-21 | internet.png | GLYPH — OUTLINE (tintable, single colour) | Channel About tab — website link (tinted). |
| G-22 | shieldDone.png | GLYPH — OUTLINE (tintable, single colour) | AppIcons.grievance — Settings 'Grievance Officer / File a grievance' (ImageIcon). |
| G-23 | Calendar.png | GLYPH — OUTLINE (tintable, single colour) | Date pickers, 'Filed On', purchase date rows. |
| G-24 | date_icon.png | GLYPH — OUTLINE (tintable, single colour) | Earn Rewards daily check-in date labels. |
| G-25 | Paper.png | GLYPH — OUTLINE (tintable, single colour) | Terms & Privacy Policy, About rows. |
| G-26 | document.png | GLYPH — OUTLINE (tintable, single colour) | Search history rows, description, channel About (tinted). |
| G-27 | Bold3User.png | GLYPH — SOLID (tintable, single colour) | Channel subscribers count, referral members, community. |
| G-28 | 9.png | GLYPH — OUTLINE (tintable, single colour) | Group / three-user placeholder (commented 'threeUser'). |
| G-29 | Chat.png | GLYPH — OUTLINE (tintable, single colour) | Help Center 'Contact us', chat support. |
| G-30 | filter.png | GLYPH — OUTLINE (tintable, single colour) | Search results filter, channel video sort (tinted). |
| G-31 | boldFilter.png | GLYPH — SOLID (tintable, single colour) | Filter active state. |
| G-32 | square.png | GLYPH — OUTLINE (tintable, single colour) | Settings / selection rows — unchecked checkbox & generic square leading icon. |
| G-33 | videoBlack.png | GLYPH — OUTLINE (tintable, single colour) | Settings 'Video quality preferences' / uploads rows (ImageIcon). |
| G-34 | noty_icon.png | GLYPH — SOLID (tintable, single colour) | Notification list item leading icon (system notifications). |
| G-35 | lock2.png | GLYPH — OUTLINE (tintable, single colour) | Private channel / locked rows (outline lock). |
| G-36 | password.png | GLYPH — OUTLINE (tintable, single colour) | Login / sign-up / new-password text-field prefix icon (tinted grey, green when focused). |
| G-37 | email.png | GLYPH — OUTLINE (tintable, single colour) | Login / sign-up / forgot-password email field prefix icon. |
| G-38 | show.png | GLYPH — OUTLINE (tintable, single colour) | Password field 'show password' toggle. |
| G-39 | hide.png | GLYPH — OUTLINE (tintable, single colour) | Password field 'hide password' toggle. |
| G-40 | copy_icon.png | GLYPH — OUTLINE (tintable, single colour) | Referral program — copy referral link; copy IDs. |
| H-01 | arrow_back.png | GLYPH — OUTLINE (tintable, single colour) | Back button on EVERY app bar (60+ screens), tinted black / white. The most-seen icon in the app. |
| H-02 | arrow_right.png | GLYPH — OUTLINE (tintable, single colour) | Profile card / list row trailing chevrons, onboarding next (tinted). |
| H-03 | arrow_down.png | GLYPH — OUTLINE (tintable, single colour) | Dropdowns, expand description, player settings (tinted). |
| H-04 | boldArrowDown.png | GLYPH — SOLID (tintable, single colour) | Dropdown selectors (bolder variant). |
| H-05 | arrow_double_right.png | GLYPH — OUTLINE (tintable, single colour) | 'View all' / swipe-to-continue hints (drawn full colour -> appears black). |
| H-06 | arrowRightCircle.png | GLYPH — OUTLINE (tintable, single colour) | Call-to-action rows, 'Go' buttons. |
| H-07 | up_arrow_bold.png | GLYPH — SOLID (tintable, single colour) | Analytics 'up vs last week' indicators (tinted green). |
| H-08 | down_arrow_bold.png | GLYPH — SOLID (tintable, single colour) | Analytics 'down' indicators, dropdowns (tinted). |
| H-09 | swap.png | GLYPH — OUTLINE (tintable, single colour) | Convert coin <-> money, sort toggle (tinted). |
| H-10 | close_icon.png | GLYPH — OUTLINE (tintable, single colour) | Close dialogs / sheets, missed check-in day marker (full colour -> black). |
| H-11 | closeSquare.png | GLYPH — OUTLINE (tintable, single colour) | Search history remove, dialogs, upload (tinted). |
| H-12 | clear_icon.png | GLYPH — SOLID (tintable, single colour) | Search field clear (x) button, text field clear. |
| H-13 | remove.png | GLYPH — OUTLINE (tintable, single colour) | Remove from Watch Later / Playlist (tinted). |
| H-14 | add.png | GLYPH — OUTLINE (tintable, single colour) | Add to playlist, create new playlist, add items. |
| H-15 | plus.png | GLYPH — OUTLINE (tintable, single colour) | Plus buttons (new playlist, add sound), create button glyph. |
| H-16 | reply.png | GLYPH — OUTLINE (tintable, single colour) | Comment 'Reply' button (tinted). |
| H-17 | done.png | GLYPH — SOLID (tintable, single colour) | DUAL USE: premium benefits bullet checks (tinted mint/green), check-in completed, selection tick (full colour -> black). |
| H-18 | accept.png | GLYPH — OUTLINE (tintable, single colour) | Approve / accept states (withdraw approved, request accepted). |
| H-19 | white_tik.png | GLYPH — OUTLINE (tintable, single colour) | Selected language / selected option checkmark on coloured chips (tinted white). |
| H-20 | dangerSquare.png | GLYPH — OUTLINE (tintable, single colour) | Error / warning rows, report confirmation (tinted). |
| J-01 | coin.png | 3D PEAK (full colour) | The main coin everywhere (20+ places): Earn Rewards balance, Convert Coin, Buy Coin plans, coin history, unlock-video price, profile coin card. |
| J-02 | coin_icon.png | 3D PEAK (full colour) | Daily check-in calendar — days already collected / today's reward (full colour). |
| J-03 | coin_icon_grey.png | 3D PEAK (full colour) | Daily check-in calendar — future days not yet available (full colour, greyed). |
| J-04 | convert_icon.png | 3D PEAK (full colour) | Profile coin card & Earn Rewards header — 'Convert Coin' button (full colour). |
| J-05 | gift_icon.png | 3D PEAK (full colour) | Rewards / gift chips (small). |
| J-06 | daily_gift_icon.png | 3D PEAK (full colour) | Earn Rewards — 'Daily Check-in' section header (full colour). |
| J-07 | referral_icon.png | 3D PEAK (full colour) | Earn Rewards — 'Referral Reward' row (full colour, 30 dp). |
| J-08 | engagement_icon.png | 3D PEAK (full colour) | Earn Rewards — 'Engagement Rewards' row (watch / like / comment to earn). |
| J-09 | ad_icon.png | 3D PEAK (full colour) | Earn Rewards — 'Watch Ad & Earn' rows (full colour, 30 dp). |
| J-10 | ad_round.png | 3D PEAK (full colour) | Ad markers on feed ads and rewarded-ad buttons (full colour). |
| J-11 | premium_image.png | 3D PEAK (full colour) | Profile — 'Join Premium!' card hero (currently a PINK crown — replace), premium plan dialog. |
| J-12 | lock.png | 3D PEAK (full colour) | Locked / private / paid video overlay, 'Unlock Video' sheet (full colour). |
| J-13 | tick.png | 3D PEAK (full colour) | Verified / monetized / active-premium badge next to names (profile monetization row, preview monetization, purchase plan). |
| J-14 | congratulation_icon.png | 3D PEAK (full colour) | Earn Rewards / check-in success dialogs — 'Congratulations' (full colour, 80–120 dp). |
| J-15 | premium_download.png | 3D PEAK (full colour) | Premium plan dialog — 'Download unlimited videos in Full HD' feature image (full colour). |
| J-16 | heartEffects.png | 3D PEAK (full colour) | Live stream / Bites floating like reaction ('hearts' burst). |
| J-17 | coin_pack_1.png | 3D PEAK (full colour) | Buy Coin page — plan cards, tier 1 (smallest pack). Add AppIcons.coinPack1..6 and show per plan by index. |
| J-18 | coin_pack_2.png | 3D PEAK (full colour) | Buy Coin — plan tier 2. |
| J-19 | coin_pack_3.png | 3D PEAK (full colour) | Buy Coin — plan tier 3 ('Popular'). |
| J-20 | coin_pack_4.png | 3D PEAK (full colour) | Buy Coin — plan tier 4. |
| J-21 | coin_pack_5.png | 3D PEAK (full colour) | Buy Coin — plan tier 5. |
| J-22 | coin_pack_6.png | 3D PEAK (full colour) | Buy Coin — plan tier 6 (biggest / best value). |
| J-23 | promote_video.png | 3D PEAK (full colour) | Profile / Your Videos — 'Promote Video' (video promotion plans) entry & page header. |
| J-24 | wallet_3d.png | 3D PEAK (full colour) | My Wallet header, Withdraw page header, Monetization 'My Wallet' card. |
| J-25 | withdraw_bank.png | 3D PEAK (full colour) | Withdraw page — payout method / bank transfer header. |
| J-26 | promo_megaphone.png | 3D PEAK (full colour) | Ad credits / announcements / partner program promo banners. |
| J-27 | green_tick.png | 3D PEAK (full colour) | Success ticks in lists (withdrawal approved, payment success, selected plan / selected option). |
| J-28 | king_round.png | 3D PEAK (full colour) | Round VIP crown medallion (VIP avatar ring accent / VIP promo chips). Not referenced in code today — generate it so the VIP set is complete. |
| K-01 | tier_classic_pass.png | YOUPEAK EMBLEM (full colour) | Creator Tier page (creator_tier_view.dart) — card icon for 'Classic Pass' (free, level 1). Map tierName -> asset. |
| K-02 | tier_starter_vip.png | YOUPEAK EMBLEM (full colour) | Creator Tier page — 'Starter VIP Pass' (level 2). |
| K-03 | tier_silver_vip.png | YOUPEAK EMBLEM (full colour) | Creator Tier page — 'Silver VIP Pass' (level 3). |
| K-04 | tier_gold_vip.png | YOUPEAK EMBLEM (full colour) | Creator Tier page — 'Gold VIP Pass' (level 4). |
| K-05 | tier_platinum_vip.png | YOUPEAK EMBLEM (full colour) | Creator Tier page — 'Platinum VIP Pass' (level 5, top tier). |
| K-06 | tier_tasker_free.png | YOUPEAK EMBLEM (full colour) | Starter Pass / Tasker Tier page (tasker_tier_view.dart) — 'Free Tasker' (level 1). |
| K-07 | tier_tasker_l1.png | YOUPEAK EMBLEM (full colour) | Tasker Tier page — 'Level 1 Tasker'. |
| K-08 | tier_tasker_l2.png | YOUPEAK EMBLEM (full colour) | Tasker Tier page — 'Level 2 Tasker'. |
| K-09 | tier_tasker_l3.png | YOUPEAK EMBLEM (full colour) | Tasker Tier page — 'Level 3 Tasker'. |
| K-10 | tier_tasker_l4.png | YOUPEAK EMBLEM (full colour) | Tasker Tier page — 'Level 4 Tasker' (top). |
| K-11 | verified_badge.png | 3D PEAK (full colour) | Next to verified / monetized channel names on video cards, channel page, comments (AppIcons declares blueTik.png but it is missing — use this). Flat for small sizes. |
| K-12 | live_badge.png | 3D PEAK (full colour) | 'LIVE' pill on live streams in feed, channel avatar ring, live viewer page top-left. |
| K-13 | premium_badge.png | 3D PEAK (full colour) | Small 'Premium' marker on premium videos (premium_videos_shelf), premium users' avatars, plan cards. |
| K-14 | paid_video_badge.png | 3D PEAK (full colour) | Corner tag on paid / coin-locked video thumbnails (instead of plain text). |
| K-15 | top_creator_badge.png | 3D PEAK (full colour) | Trending / top creator chips, leaderboards (future), Home 'Trending' chip. |
| K-16 | new_badge.png | 3D PEAK (full colour) | 'NEW' tag on new features, new videos from subscriptions. |
| K-17 | partner_district_badge.png | YOUPEAK EMBLEM (full colour) | Future: District Partner (District Franchise) badge in the app / partner dashboard. |
| K-18 | partner_digital_badge.png | YOUPEAK EMBLEM (full colour) | Future: Digital Partner Program badge. |
| R-01 | react_like.png | YOUPEAK REACTION EMOJI (full colour) | Comment reactions (inline 20 dp), live-chat quick reactions bar (32 dp), floating live / Bites reaction bursts (60–120 dp), reaction picker sheet (40 dp). |
| R-02 | react_love.png | YOUPEAK REACTION EMOJI (full colour) | Comment reactions (inline 20 dp), live-chat quick reactions bar (32 dp), floating live / Bites reaction bursts (60–120 dp), reaction picker sheet (40 dp). |
| R-03 | react_green_heart.png | YOUPEAK REACTION EMOJI (full colour) | Comment reactions (inline 20 dp), live-chat quick reactions bar (32 dp), floating live / Bites reaction bursts (60–120 dp), reaction picker sheet (40 dp). |
| R-04 | react_laugh.png | YOUPEAK REACTION EMOJI (full colour) | Comment reactions (inline 20 dp), live-chat quick reactions bar (32 dp), floating live / Bites reaction bursts (60–120 dp), reaction picker sheet (40 dp). |
| R-05 | react_rofl.png | YOUPEAK REACTION EMOJI (full colour) | Comment reactions (inline 20 dp), live-chat quick reactions bar (32 dp), floating live / Bites reaction bursts (60–120 dp), reaction picker sheet (40 dp). |
| R-06 | react_wow.png | YOUPEAK REACTION EMOJI (full colour) | Comment reactions (inline 20 dp), live-chat quick reactions bar (32 dp), floating live / Bites reaction bursts (60–120 dp), reaction picker sheet (40 dp). |
| R-07 | react_sad.png | YOUPEAK REACTION EMOJI (full colour) | Comment reactions (inline 20 dp), live-chat quick reactions bar (32 dp), floating live / Bites reaction bursts (60–120 dp), reaction picker sheet (40 dp). |
| R-08 | react_angry.png | YOUPEAK REACTION EMOJI (full colour) | Comment reactions (inline 20 dp), live-chat quick reactions bar (32 dp), floating live / Bites reaction bursts (60–120 dp), reaction picker sheet (40 dp). |
| R-09 | react_heart_eyes.png | YOUPEAK REACTION EMOJI (full colour) | Comment reactions (inline 20 dp), live-chat quick reactions bar (32 dp), floating live / Bites reaction bursts (60–120 dp), reaction picker sheet (40 dp). |
| R-10 | react_star_struck.png | YOUPEAK REACTION EMOJI (full colour) | Comment reactions (inline 20 dp), live-chat quick reactions bar (32 dp), floating live / Bites reaction bursts (60–120 dp), reaction picker sheet (40 dp). |
| R-11 | react_fire.png | YOUPEAK REACTION EMOJI (full colour) | Comment reactions (inline 20 dp), live-chat quick reactions bar (32 dp), floating live / Bites reaction bursts (60–120 dp), reaction picker sheet (40 dp). |
| R-12 | react_clap.png | YOUPEAK REACTION EMOJI (full colour) | Comment reactions (inline 20 dp), live-chat quick reactions bar (32 dp), floating live / Bites reaction bursts (60–120 dp), reaction picker sheet (40 dp). |
| R-13 | react_100.png | YOUPEAK REACTION EMOJI (full colour) | Comment reactions (inline 20 dp), live-chat quick reactions bar (32 dp), floating live / Bites reaction bursts (60–120 dp), reaction picker sheet (40 dp). |
| R-14 | react_mind_blown.png | YOUPEAK REACTION EMOJI (full colour) | Comment reactions (inline 20 dp), live-chat quick reactions bar (32 dp), floating live / Bites reaction bursts (60–120 dp), reaction picker sheet (40 dp). |
| R-15 | react_cool.png | YOUPEAK REACTION EMOJI (full colour) | Comment reactions (inline 20 dp), live-chat quick reactions bar (32 dp), floating live / Bites reaction bursts (60–120 dp), reaction picker sheet (40 dp). |
| R-16 | react_thinking.png | YOUPEAK REACTION EMOJI (full colour) | Comment reactions (inline 20 dp), live-chat quick reactions bar (32 dp), floating live / Bites reaction bursts (60–120 dp), reaction picker sheet (40 dp). |
| R-17 | react_namaste.png | YOUPEAK REACTION EMOJI (full colour) | Comment reactions (inline 20 dp), live-chat quick reactions bar (32 dp), floating live / Bites reaction bursts (60–120 dp), reaction picker sheet (40 dp). |
| R-18 | react_party.png | YOUPEAK REACTION EMOJI (full colour) | Comment reactions (inline 20 dp), live-chat quick reactions bar (32 dp), floating live / Bites reaction bursts (60–120 dp), reaction picker sheet (40 dp). |
| R-19 | react_hug.png | YOUPEAK REACTION EMOJI (full colour) | Comment reactions (inline 20 dp), live-chat quick reactions bar (32 dp), floating live / Bites reaction bursts (60–120 dp), reaction picker sheet (40 dp). |
| R-20 | react_wink.png | YOUPEAK REACTION EMOJI (full colour) | Comment reactions (inline 20 dp), live-chat quick reactions bar (32 dp), floating live / Bites reaction bursts (60–120 dp), reaction picker sheet (40 dp). |
| R-21 | react_skull.png | YOUPEAK REACTION EMOJI (full colour) | Comment reactions (inline 20 dp), live-chat quick reactions bar (32 dp), floating live / Bites reaction bursts (60–120 dp), reaction picker sheet (40 dp). |
| R-22 | react_eyes.png | YOUPEAK REACTION EMOJI (full colour) | Comment reactions (inline 20 dp), live-chat quick reactions bar (32 dp), floating live / Bites reaction bursts (60–120 dp), reaction picker sheet (40 dp). |
| R-23 | react_popcorn.png | YOUPEAK REACTION EMOJI (full colour) | Comment reactions (inline 20 dp), live-chat quick reactions bar (32 dp), floating live / Bites reaction bursts (60–120 dp), reaction picker sheet (40 dp). |
| R-24 | react_rocket.png | YOUPEAK REACTION EMOJI (full colour) | Comment reactions (inline 20 dp), live-chat quick reactions bar (32 dp), floating live / Bites reaction bursts (60–120 dp), reaction picker sheet (40 dp). |
| R-25 | react_peak.png | YOUPEAK REACTION EMOJI (full colour) | Comment reactions (inline 20 dp), live-chat quick reactions bar (32 dp), floating live / Bites reaction bursts (60–120 dp), reaction picker sheet (40 dp). |
| R-26 | react_coin_eyes.png | YOUPEAK REACTION EMOJI (full colour) | Comment reactions (inline 20 dp), live-chat quick reactions bar (32 dp), floating live / Bites reaction bursts (60–120 dp), reaction picker sheet (40 dp). |
| R-27 | react_crown_face.png | YOUPEAK REACTION EMOJI (full colour) | Comment reactions (inline 20 dp), live-chat quick reactions bar (32 dp), floating live / Bites reaction bursts (60–120 dp), reaction picker sheet (40 dp). |
| R-28 | react_muscle.png | YOUPEAK REACTION EMOJI (full colour) | Comment reactions (inline 20 dp), live-chat quick reactions bar (32 dp), floating live / Bites reaction bursts (60–120 dp), reaction picker sheet (40 dp). |
| R-29 | react_facepalm.png | YOUPEAK REACTION EMOJI (full colour) | Comment reactions (inline 20 dp), live-chat quick reactions bar (32 dp), floating live / Bites reaction bursts (60–120 dp), reaction picker sheet (40 dp). |
| R-30 | react_ok.png | YOUPEAK REACTION EMOJI (full colour) | Comment reactions (inline 20 dp), live-chat quick reactions bar (32 dp), floating live / Bites reaction bursts (60–120 dp), reaction picker sheet (40 dp). |
| S-01 | sticker_streak_flame.png | 3D PEAK (full colour) | Earn Rewards — daily check-in streak counter ('You have checked in for N day straight!'), check-in done dialog. |
| S-02 | sticker_party_popper.png | 3D PEAK (full colour) | Congratulations dialogs (account created, tier upgraded, referral applied). |
| S-03 | sticker_money_bag.png | 3D PEAK (full colour) | Monetization earnings, creator revenue share, 'Earn Money' sections. |
| S-04 | sticker_target.png | 3D PEAK (full colour) | 'My Daily Tasks' header, task completion. |
| S-05 | sticker_confetti.png | 3D PEAK (full colour) | Top decoration of success dialogs (placed above the illustration). |
| S-06 | sticker_sparkles.png | 3D PEAK (full colour) | Premium features, 'new' highlights, reward reveals. |
| S-07 | sticker_medal.png | 3D PEAK (full colour) | Creator milestones (subscriber / watch-hour milestones), top tasker achievements. |
| S-08 | notif_reminder.png | 3D PEAK (full colour) | Notification type icon — reminders (check in today, continue watching). |
| S-09 | notif_announcement.png | 3D PEAK (full colour) | Notification type icon — announcements from YouPeak / admin. |
| S-10 | notif_bell.png | 3D PEAK (full colour) | Notification list default icon / notifications permission prompt. |
| S-11 | notif_new_subscriber.png | 3D PEAK (full colour) | Notification type icon — someone subscribed to your channel. |
| S-12 | notif_new_comment.png | 3D PEAK (full colour) | Notification type icon — new comment / reply on your video. |
| S-13 | notif_new_like.png | 3D PEAK (full colour) | Notification type icon — your video / comment got likes. |
| S-14 | notif_live_now.png | 3D PEAK (full colour) | Notification type icon — a subscribed channel went LIVE. |
| S-15 | notif_payment_success.png | 3D PEAK (full colour) | Coin purchase success, premium purchase success, payment history. |
| S-16 | notif_withdrawal_sent.png | 3D PEAK (full colour) | Withdrawal requested / approved notification & withdraw success. |
| S-17 | notif_security.png | 3D PEAK (full colour) | Account security, blocked user dialog, grievance acknowledgement. |
| S-18 | notif_warning.png | 3D PEAK (full colour) | Errors, payment failed, 'something went wrong' toasts and dialogs. |
| S-19 | notif_update.png | 3D PEAK (full colour) | Force update dialog (force_update_dialog.dart), new app version available. |
| S-20 | sticker_wave.png | 3D PEAK (full colour) | Welcome (first login), app exit dialog ('Are you sure you want to exit?'). |
| S-21 | sticker_download_done.png | 3D PEAK (full colour) | Download complete toast / Downloads page header. |
| S-22 | sticker_upload_done.png | 3D PEAK (full colour) | 'Video upload successfully' toast / upload complete dialog. |
| S-23 | sticker_gift_heart.png | 3D PEAK (full colour) | Gift / support-the-creator moments, referral bonus received. |
| S-24 | sticker_calendar_check.png | 3D PEAK (full colour) | Daily check-in button / 'CHECK IN' state. |
| M-01 | boarding_1.png | SOFT CLAY ILLUSTRATION (full colour) | Onboarding page 1 — text below: 'Watch interesting videos from around the world'. Currently a pink flat woman illustration (off-brand). |
| M-02 | boarding_2.png | SOFT CLAY ILLUSTRATION (full colour) | Onboarding page 2 — 'Watch interesting videos easily from your smartphone'. |
| M-03 | boarding_3.png | SOFT CLAY ILLUSTRATION (full colour) | Onboarding page 3 — 'Let's explore videos around the world with YouPeak now!' (last page before login). |
| M-04 | login_image.png | SOFT CLAY ILLUSTRATION (full colour) | 'Let's you in' screen hero (lets_you_in_view) — above Google / Apple / password sign-in buttons. |
| M-05 | profileDoneLogo1.png | SOFT CLAY ILLUSTRATION (full colour) | 'Congratulations — your account is ready' dialog after sign-up / fill profile (CustomDialog, shown on white and dark cards). |
| M-06 | forgetPasswordLogo.png | SOFT CLAY ILLUSTRATION (full colour) | Forgot password screen hero — LIGHT mode (white background). |
| M-07 | darkForgetPasswordLogo.png | SOFT CLAY ILLUSTRATION (full colour) | Forgot password screen hero — DARK mode (#1C1C1E background). |
| M-08 | newPasswordLogo.png | SOFT CLAY ILLUSTRATION (full colour) | Create new password screen hero — LIGHT mode. |
| M-09 | darkNewPasswordLogo.png | SOFT CLAY ILLUSTRATION (full colour) | Create new password screen hero — DARK mode. |
| M-10 | fingerPrint.png | SOFT CLAY ILLUSTRATION (full colour) | Security / biometric illustration (currently a 300 KB file). |
| M-11 | empty_image.png  (and noFound.png — same image) | SOFT CLAY ILLUSTRATION (full colour) | AppIcons.isEmpty & noFound — the generic 'No data found' state used by DataNotFoundUi across the app (videos, comments, notifications, downloads...). |
| M-12 | Internet.png  (no-internet page — replaces Internet.jpg) | SOFT CLAY ILLUSTRATION (full colour) | No Internet Connection page (network_issue_view.dart line 22 loads 'assets/icons/Internet.jpg' — a 685 KB JPG with a white box that looks wrong in dark mode). Save this as Internet.png and change that line to Internet.png. |
| M-13 | Network_Issue.png | SOFT CLAY ILLUSTRATION (full colour) | Connection-issue dialog / internet dialog (internet_dailog.dart). |
| M-14 | monetization_image.png | SOFT CLAY ILLUSTRATION (full colour) | Monetization page hero ('Experience the power of monetization…'). |
| M-15 | monetization_withdraw.png | SOFT CLAY ILLUSTRATION (full colour) | Monetization — withdraw / earnings section illustration. |
| M-16 | wallet_image.png | SOFT CLAY ILLUSTRATION (full colour) | My Wallet / Convert coin / Monetization wallet card illustration. |
| M-17 | withdrawal_done.png | SOFT CLAY ILLUSTRATION (full colour) | 'Withdrawal Done' dialog (withdrawal_done_dialog.dart) — 'You have successfully converted your coins'. |
| M-18 | gift_image.png | SOFT CLAY ILLUSTRATION (full colour) | Earn Rewards page — header hero (big gift illustration at the top of the rewards page). |
| M-19 | referral_image.png | SOFT CLAY ILLUSTRATION (full colour) | Referral Program page hero ('Invite your friends and earn rewards!'). |
| M-20 | convert_coin_image.png | SOFT CLAY ILLUSTRATION (full colour) | Convert Coin page hero (coins -> money). |
| M-21 | content_image.png | SOFT CLAY ILLUSTRATION (full colour) | 'View Content & Engagement' page header (watching videos, commenting, liking = coins). |
| M-22 | ads_image.png | SOFT CLAY ILLUSTRATION (full colour) | Premium plan dialog — 'Watch all you want. Ad-free.' feature image. |
| M-23 | profile_image.png | SOFT CLAY ILLUSTRATION (full colour) | Default avatar for users / channels without a photo (used everywhere: comments, live chat, profile, channel). |
| M-24 | userProfile.png | SOFT CLAY ILLUSTRATION (full colour) | Large profile placeholder (profile header / edit profile). |
| M-25 | cardImage.png | SOFT CLAY ILLUSTRATION (full colour) | Payments / premium purchase — card visual (currently 944 KB — must become < 150 KB). |
| M-26 | empty_videos.png | SOFT CLAY ILLUSTRATION (full colour) | Empty state — no videos / 'Videos not available' / 'Bites not available' / Your Videos empty. |
| M-27 | empty_comments.png | SOFT CLAY ILLUSTRATION (full colour) | Empty state — 'Comments not available' (comment sheet). |
| M-28 | empty_notifications.png | SOFT CLAY ILLUSTRATION (full colour) | Empty state — 'Notification not available'. |
| M-29 | empty_downloads.png | SOFT CLAY ILLUSTRATION (full colour) | Empty state — 'Download not available' (Downloads page). |
| M-30 | empty_history.png | SOFT CLAY ILLUSTRATION (full colour) | Empty state — Watch history / coin history / withdraw history empty. |
| M-31 | empty_playlist.png | SOFT CLAY ILLUSTRATION (full colour) | Empty state — 'Playlist not available', Watch Later empty. |
| M-32 | empty_subscriptions.png | SOFT CLAY ILLUSTRATION (full colour) | Empty state — 'No subscribed channel !!' (Subscription tab). |
| M-33 | empty_search.png | SOFT CLAY ILLUSTRATION (full colour) | Empty state — no search results. |
| M-34 | dialog_account_blocked.png | SOFT CLAY ILLUSTRATION (full colour) | Blocked user dialog ('Account Blocked — You are blocked by the admin'). |
| M-35 | dialog_update.png | SOFT CLAY ILLUSTRATION (full colour) | Force update dialog (force_update_dialog.dart). |
| M-36 | dialog_exit.png | SOFT CLAY ILLUSTRATION (full colour) | App exit dialog ('Are you sure you want to exit?'). |
| M-37 | dialog_logout.png | SOFT CLAY ILLUSTRATION (full colour) | Logout confirmation sheet ('Yes, Logout'). |
| M-38 | dialog_delete_account.png | SOFT CLAY ILLUSTRATION (full colour) | Delete account confirmation. |
| M-39 | dialog_payment_failed.png | SOFT CLAY ILLUSTRATION (full colour) | 'Payment Failed Please Try Again' state. |
| M-40 | dialog_private_content.png | SOFT CLAY ILLUSTRATION (full colour) | 'This Video Is Private Content' / subscribe private channel / unlock video sheets. |
| M-41 | dialog_subscribed_success.png | SOFT CLAY ILLUSTRATION (full colour) | Subscribed success dialog (subscribed_success_dialog.dart). |
| M-42 | hero_creator_vip.png | SOFT CLAY ILLUSTRATION (full colour) | Creator VIP Pass page header (creator_tier_view) — 'Unlock a bigger share of ad revenue as your channel grows'. |
| M-43 | hero_starter_pass.png | SOFT CLAY ILLUSTRATION (full colour) | Starter Pass (Tasker tiers) page header — 'Unlock higher daily earning limits'. |
| M-44 | hero_premium.png | SOFT CLAY ILLUSTRATION (full colour) | Premium plan / Subscription plan page top banner ('Get YouPeak Premium'). |
| M-45 | hero_promote_video.png | SOFT CLAY ILLUSTRATION (full colour) | Promote Video page header (video_promotion). |
| M-46 | hero_help_center.png | SOFT CLAY ILLUSTRATION (full colour) | Help Center page header (FAQ / Contact us). |
| M-47 | hero_grievance.png | SOFT CLAY ILLUSTRATION (full colour) | Grievance Officer page header (file / track a grievance). |
| M-48 | hero_go_live.png | SOFT CLAY ILLUSTRATION (full colour) | Go Live setup page / add-thumbnail screen hero. |
| M-49 | hero_create_channel.png | SOFT CLAY ILLUSTRATION (full colour) | Create Your Channel screen (create_channel_screen / create_channel_view). |
| M-50 | default_channel_banner.png | SOFT CLAY ILLUSTRATION (full colour) | Default channel cover/banner when a creator has not uploaded one (channel page header). |
| M-51 | video_placeholder.png | SOFT CLAY ILLUSTRATION (full colour) | Video thumbnail placeholder while loading or when a thumbnail is missing (instead of a plain tinted logo). |
| M-52 | shade_image.png | SOFT CLAY ILLUSTRATION (full colour) | Gradient shade overlay placed on top of video thumbnails / Bites so white text stays readable. (Tip: a Flutter LinearGradient is even better than an image.) |
| N-01 | play_feature_graphic.png | BRAND IDENTITY | Google Play Console — Feature graphic (shown at the top of the store listing). |
| N-02 | store_screenshot_bg.png | BRAND IDENTITY | Background for Play Store screenshot frames (you place real app screenshots + headline text on top in Figma/Canva). |
| N-03 | share_card_bg.png | BRAND IDENTITY | Background for the generated share card (deep_link/share_manager/share_card_generator.dart) when a video / channel / referral is shared to WhatsApp etc. |
| N-04 | referral_share_banner.png | SOFT CLAY ILLUSTRATION (full colour) | Image attached when users share their referral link ('Refer Now'). |

## Non-glyph production subjects

### A-01 appLogo.png

Family: BRAND. Export: 1024x1024 PNG, NO transparency (fully opaque, full-bleed square — Android and iOS apply their own rounded mask). Also save a 512x512 copy for Play Console.

the official YouPeak app launcher icon, full-bleed square version. Fill the ENTIRE 1024 x 1024 square edge to edge with the background (no rounded corners, no transparent corners, no border, no inner squircle — the operating system cuts the shape). BACKGROUND: a rich diagonal gradient from Dark Forest #1E4D2B at the top-left corner to Forest Green #0A7A44 at the centre to Emerald #19A463 at the bottom-right corner, with a very soft radial lift of light (+8% brightness) behind the mark so it glows gently, and an ultra-subtle diagonal sheen. FOREGROUND: the YouPeak mark, centred optically (nudged 3% to the right because it is a triangle), sized so the whole mark fits inside the central 60% of the canvas (the Android adaptive safe zone): a bold white (#FFFFFF) rounded play triangle; its upper edge is interrupted by a crisp double mountain-peak notch so the upper-left portion of the triangle forms two summits — the right summit taller — like a mountain range cut into the play button; a solid VIP Gold (#FFD700 with a gentle #E0A800 lower edge) circle, diameter about 16% of the triangle height, floats just above and to the right of the tallest summit like a rising sun. Give the white triangle an extremely soft, short, dark-forest inner-side shadow (#0B3B20 at 25%) at its bottom-right edge for depth, and a faint top highlight — it must still read as a flat, confident, modern mark, not a heavy 3D object. No text, no letters, no words, no extra sparkles, no border. It must be recognisable and striking at 48 pixels next to YouTube, Instagram and Netflix on a phone home screen.

### A-02 app_logo.png

Family: BRAND. Export: 1024x1024 PNG with TRANSPARENT corners; downscale to 512x512 for the app (~60–90 KB).

the YouPeak app icon as a finished rounded "squircle" tile for use INSIDE the app (on the splash screen, on white and on dark backgrounds). A continuous-curvature squircle (iOS-style superellipse, corner smoothing 60%) filling 86% of the canvas, centred, with fully TRANSPARENT area outside the squircle. Tile fill: diagonal gradient Dark Forest #1E4D2B (top-left) -> Forest Green #0A7A44 (centre) -> Emerald #19A463 (bottom-right), a soft inner radial glow behind the mark, and a very thin (1.2% of width) inner top highlight line in #FFFFFF at 18% opacity to make the tile feel like polished glass. Mark: the white YouPeak play-peak triangle with the double mountain notch on its upper edge and the VIP Gold #FFD700 sun circle above the tallest summit, occupying 55% of the tile, optically centred. Add a very soft, tight contact shadow INSIDE the tile under the triangle only. No drop shadow outside the tile, no text, no border ring, no sparkles.

### A-03 app_logo_icon.png

Family: BRAND (mark only). Export: 1024x1024 transparent PNG, downscale to 512x512.

the YouPeak MARK ONLY — no tile, no squircle, no background. A solid Forest Green (#0A7A44) rounded play triangle, pointing right, corners rounded to 12% of its height; its upper edge contains a crisp double mountain-peak notch (the upper-left part of the triangle becomes two summits, the right one taller, notch depth about 22% of the triangle height); a solid VIP Gold (#FFD700) circle, diameter about 16% of the triangle height, sits just above and right of the tallest summit with a clear gap of about 4% between them. Completely FLAT: flat solid colours only, no gradients, no shadow, no highlight, no outline — because the app also tints this image into a single colour and it must stay a clean, unmistakable silhouette (play button + mountain peaks + sun dot). Transparent background. The mark fills 80% of the canvas, optically centred (nudged slightly right).

### A-04 ic_launcher_foreground.png

Family: BRAND (Android adaptive icon foreground layer). Export: 1024x1024 transparent PNG, then resize to 432 (xxxhdpi), 324 (xxhdpi), 216 (xhdpi), 162 (hdpi), 108 (mdpi).

the FOREGROUND LAYER of an Android adaptive icon. Fully TRANSPARENT background. In the exact centre, the white (#FFFFFF) YouPeak play-peak triangle (rounded play triangle with a double mountain-peak notch cut into its upper edge, the right summit taller) plus the VIP Gold (#FFD700) sun circle above the tallest summit. CRITICAL SIZING: the whole mark (triangle + sun) must fit inside the central circle whose diameter is 61% of the canvas (the 66dp-of-108dp safe zone), with the triangle's visual centre on the canvas centre (nudged 2% right). Nothing may approach the edges — the outer 20% on every side is empty transparency so the launcher can crop it into circles, squircles or teardrops. Add a very soft, short shadow under the triangle (#0B3B20 at 30% opacity, 2% blur) so it separates from the green background layer. No text, no background colour, no border.

### A-05 ic_launcher_background.png

Family: BRAND (Android adaptive icon background layer). Export: 1024x1024 opaque PNG, resized like A-04.

the BACKGROUND LAYER of an Android adaptive icon — no symbols, no mark, only a beautiful full-bleed brand surface that fills the entire square edge to edge. A smooth diagonal gradient from Dark Forest #1E4D2B at the top-left to Forest Green #0A7A44 in the middle to Emerald #19A463 at the bottom-right, a soft centred radial brightening (+10% luminance, 55% radius) where the white mark will sit, and an extremely subtle topographic contour-line texture (thin mountain elevation lines, #FFFFFF at 4% opacity) suggesting "peaks" — so faint it is only noticed up close. No noise, no banding, no text, no objects, no border, no vignette at the edges (the launcher crops them).

### A-06 logo.png (notification small icon)

Family: BRAND (Android status-bar notification icon). Export: 1024x1024 transparent PNG -> 96x96 (xxxhdpi), 72x72 (xxhdpi), 48x48 (xhdpi), 36x36 (hdpi), 24x24 (mdpi). Pure white.

an Android status-bar notification icon of the YouPeak mark. Android paints notification icons from their alpha channel only, so draw a single flat PURE WHITE (#FFFFFF) silhouette on a fully TRANSPARENT background — no colour, no gradient, no shading, no grey. Shape: the rounded play triangle with the double mountain-peak notch cut into its upper edge, plus the small separate sun circle above the tallest summit (keep a clear transparent gap between the sun and the triangle of at least 8% of the icon width so it survives at 24 pixels). Simplify for tiny size: thick, bold, no thin parts, notch depth 25% of triangle height. Built on a 24 x 24 grid with a 2-unit margin; the mark fills 20 x 20 units, optically centred. Nothing else in the image.

### A-07 ic_launcher_monochrome.png

Family: BRAND (Android 13+ themed icon). Export: 1024x1024 transparent PNG -> same sizes as A-04.

the MONOCHROME layer for Android 13 themed icons. A single flat solid BLACK (#000000) silhouette of the YouPeak mark (rounded play triangle with a double mountain-peak notch in its upper edge, right summit taller, plus the separate sun circle above the tallest summit) on a fully TRANSPARENT background. Same size and position rules as an adaptive-icon foreground: the whole mark must fit inside the central circle of 61% canvas diameter; the outer 20% on every side is empty. Flat, no gradients, no shadow, no inner detail, no outline.

### A-08 splash_image.png

Family: BRAND (full-screen splash background). Export: Generate 1024x1536 portrait, upscale with an AI upscaler to 1440x2160 if needed, export as optimised PNG or WebP under 350 KB. No transparency.

a premium full-screen portrait splash background for YouPeak, designed so the app logo will be placed on top in the exact centre (keep the central 40% area calm and uncluttered). Scene: an elegant, abstract, cinematic landscape of soft layered mountain ridges rendered in smooth gradient planes — farthest ridges in pale mint (#CFF5DD) haze near the upper-middle, mid ridges in Emerald #19A463 and Forest Green #0A7A44, the nearest ridges in deep Dark Forest #1E4D2B filling the bottom 30% of the frame. A warm VIP Gold (#FFD700 -> #E0A800) sunrise glow sits just behind the highest central peak, low in the middle of the frame, casting a soft gold rim onto ridge tops. Sky: a smooth vertical gradient from Dark Forest #0F2E1A at the very top to deep green-teal near the horizon, with a few ultra-subtle floating light particles and very faint thin light streaks suggesting video light / motion. Style: minimal, modern, premium — like an Apple Music or Headspace launch screen — soft focus, gentle bokeh, no hard details, no people, no buildings, no text, no logo, no watermark. Safe areas: nothing important in the top 8% (status bar) and bottom 8% (gesture bar).

### A-09 splash_logo.png  +  android drawable ic_splash.png / splash_logo.png

Family: BRAND (native Android splash icon). Export: 1152x1152 transparent PNG (use a 1024 master padded to 1152), plus 288x288 for drawable-xxxhdpi.

the Android 12+ native splash-screen icon for YouPeak on a fully TRANSPARENT background (the window background colour behind it will be solid Dark Forest #1E4D2B). Centre: the white YouPeak play-peak triangle with the double mountain-peak notch and the VIP Gold #FFD700 sun circle, sized so the entire mark fits inside a centred circle of 62% canvas diameter (Android masks the icon to a circle of 2/3 of its size — nothing may cross that circle). Around the mark, a very soft circular emerald glow (#19A463 at 25% opacity, radius 55% of canvas) fading to full transparency well before the edges. Flat and crisp, no text.

### A-10 youpeak_wordmark.png

Family: BRAND (logo lock-up). Export: 1536x1024 transparent PNG, crop tight, export 1200 px wide. PRO NOTE: AI text can be imperfect — best practice is to typeset 'YouPeak' in Urbanist ExtraBold in Figma and place the generated mark next to it; use this prompt for concept exploration.

the horizontal YouPeak logo lock-up on a fully TRANSPARENT background. Left: the YouPeak mark (Forest Green #0A7A44 rounded play triangle with a double mountain-peak notch cut into its upper edge, plus a VIP Gold #FFD700 sun circle above the tallest summit), height equal to the cap height x 1.35. Right: the word "YouPeak" (exactly these 7 letters, capital Y and capital P, spelled Y-o-u-P-e-a-k) set in a geometric rounded sans-serif identical in spirit to Urbanist ExtraBold, tight but comfortable letter-spacing (-1%), colour Charcoal #1C1C1E for "You" and Forest Green #0A7A44 for "Peak". The dot-free lowercase letters, rounded terminals. Gap between mark and word = 40% of cap height. Everything flat, no gradient, no shadow, no tagline, no other text. Perfectly spelled.

### A-11 shorts.png (App shortcut — Bites)

Family: BRAND (Android launcher app-shortcut icon). Export: 1024x1024 PNG with transparent corners -> 192x192.

an Android launcher app-shortcut icon following Google's shortcut icon guidelines: a perfect filled circle in Mint #E8F5E9 filling 92% of the canvas (transparent outside the circle), and centred inside it a bold Forest Green (#0A7A44) glyph occupying 50% of the circle diameter: a vertical portrait rounded rectangle (like a phone-sized short-video card, aspect 3:4.2, corner radius 22% of its width) drawn with a thick 8%-of-circle stroke, containing a solid rounded play triangle, and with a small circular "bite" notch cut out of its top-right corner (the YouPeak "Bites" symbol). Flat design, no shadow, no gradient, no text.

### A-12 search.png (App shortcut — Search)

Family: BRAND (Android launcher app-shortcut icon). Export: 1024x1024 PNG, transparent corners -> 192x192.

an Android launcher app-shortcut icon: a perfect filled Mint #E8F5E9 circle filling 92% of the canvas (transparent outside), centred inside it a bold Forest Green (#0A7A44) magnifying-glass glyph occupying 50% of the circle: a round lens ring with a thick stroke (8% of the circle diameter) and a short handle with a rounded end pointing to the bottom-right at 45 degrees; inside the lens, a tiny solid rounded play triangle (so it reads as "search videos"). Flat, no shadow, no gradient, no text.

### A-13 subscription.png (App shortcut — Subscriptions)

Family: BRAND (Android launcher app-shortcut icon). Export: 1024x1024 PNG, transparent corners -> 192x192.

an Android launcher app-shortcut icon: a perfect filled Mint #E8F5E9 circle filling 92% of the canvas (transparent outside), centred inside it a bold Forest Green (#0A7A44) "subscriptions" glyph occupying 50% of the circle: a landscape rounded rectangle (video screen, aspect 4:3, thick stroke 8% of the circle) with a solid rounded play triangle in its centre, and above it two progressively shorter horizontal rounded bars (stacked cards peeking out from behind the screen), evenly spaced. Flat, no shadow, no gradient, no text.

### B-11 earn_reward_icon.png

Family: 3D PEAK (full colour). Export: 1024x1024 transparent PNG -> export 256x256 for small icons (<= 40 dp) or 512x512 for heroes; optimise with TinyPNG (target < 60 KB).

a tiny, very readable 3D reward button icon: a compact gift box in Forest Green #0A7A44 with a VIP Gold (#FFD700) ribbon and a plump gold bow on top, its lid slightly lifted and tilted, with ONE shiny gold YouPeak coin (gold coin with a small embossed play-peak mark) popping out of the box at the upper-right. Chunky, simple, bold shapes because it is displayed at only 28 pixels in the app bar — no tiny details, no confetti, no sparkles detached from the object. Compact square-ish silhouette.

### F-09 recording.png

Family: FLAT BRAND UI (full colour). Export: 1024x1024 transparent PNG -> export 192x192 (< 25 KB).

a premium camera RECORD button, flat UI style, viewed straight on, on a fully transparent background. An outer ring: a perfect circle ring whose thickness is 9% of the diameter, filled with a smooth angular gradient from Forest Green #0A7A44 through Emerald #19A463 to VIP Gold #FFD700 and back to Forest Green (like an Instagram-story ring but in YouPeak colours), outer diameter 92% of the canvas. A 5% transparent gap inside the ring. Inside, a solid white (#FFFFFF) disc with a very subtle inner soft shadow at the bottom edge, and at its centre a smaller solid Crimson #D32F2F rounded record dot (diameter 38% of the disc) — the universal "recording" signal. Crisp vector-like edges, no text, no drop shadow outside the ring.

### F-12 text_send.png

Family: FLAT BRAND UI (full colour). Export: 1024x1024 transparent PNG -> export 192x192 (< 25 KB).

a chat SEND button, flat modern UI style, on a fully transparent background: a perfect solid circle filling 92% of the canvas with a smooth diagonal gradient from Forest Green #0A7A44 (bottom-left) to Emerald #19A463 (top-right) and a very subtle soft top highlight; centred inside it a pure white (#FFFFFF) paper-plane glyph pointing to the upper-right at about 35 degrees (a sleek rounded dart shape with a folded centre crease cut in as a thin transparent line), occupying 48% of the circle, optically centred (nudged slightly left and down). Crisp edges, no drop shadow outside the circle, no text.

### F-28 editButton.png

Family: FLAT BRAND UI (full colour). Export: 1024x1024 transparent PNG -> export 192x192 (< 25 KB).

a small flat avatar EDIT badge on a transparent background: a perfect solid Forest Green (#0A7A44) circle filling 88% of the canvas with a 6%-thick pure white (#FFFFFF) outer ring around it (so it separates from any photo), and a white pencil glyph in the centre (diagonal, pointing to the lower-left, rounded) occupying 45% of the circle. Flat, crisp, no shadow, no text.

### G-10 king.png

Family: 3D PEAK — silhouette-safe (full colour AND tinted). Export: 1024x1024 transparent PNG -> export 256x256, optimise (< 50 KB).

a compact VIP crown, 3D Peak style, designed to ALSO work as a one-colour silhouette. A bold, chunky royal crown in polished VIP Gold (#FFD700 with deep gold #E0A800 shading and warm #FFF1A8 highlights): a solid band at the bottom with a thin embossed rim line, and three rounded points rising from it — the centre point tallest — each tipped with a small round gold ball; a single faceted emerald gem (#0A7A44 / #19A463) set in the centre of the band, and two tiny emerald dots on the side points. CRITICAL: the outer silhouette is one solid, simple, closed shape with no holes, no detached sparkles, no shadow, no floor — because on the Profile screen the app paints this image as a flat one-colour silhouette, where it must still clearly read as a crown. Front view, very slight top tilt, fills 80% of the canvas.

### J-01 coin.png

Family: 3D PEAK (full colour). Export: 1024x1024 transparent PNG -> export 256x256 for small icons (<= 40 dp) or 512x512 for heroes; optimise with TinyPNG (target < 60 KB).

the official YouPeak Coin — the in-app currency: a thick, chunky gold coin (thickness about 16% of its diameter) with a rolled, softly reeded outer rim; the coin face is slightly concave polished VIP Gold (#FFD700, shadows #E0A800 and #B8860B, highlights #FFF1A8); in the centre of the face, a raised embossed YouPeak mark — a rounded play triangle whose upper edge has a double mountain-peak notch, with a small round sun above the tallest summit — embossed in the same gold with a slightly deeper tone so it reads by light and shadow; a thin inner ring engraved around the face at 82% of the diameter. Viewed at a gentle three-quarter angle (turned about 20 degrees to the right, tilted 10 degrees toward the viewer) so both the face and a slice of the thick rim are visible. One bright specular glint on the upper-left rim. This is the hero currency icon of the app — it must look valuable, trustworthy, and delicious, like a premium game coin but classy.

### J-02 coin_icon.png

Family: 3D PEAK (full colour). Export: 1024x1024 transparent PNG -> export 256x256 for small icons (<= 40 dp) or 512x512 for heroes; optimise with TinyPNG (target < 60 KB).

the official YouPeak Coin — the in-app currency: a thick, chunky gold coin (thickness about 16% of its diameter) with a rolled, softly reeded outer rim; the coin face is slightly concave polished VIP Gold (#FFD700, shadows #E0A800 and #B8860B, highlights #FFF1A8); in the centre of the face, a raised embossed YouPeak mark — a rounded play triangle whose upper edge has a double mountain-peak notch, with a small round sun above the tallest summit — embossed in the same gold with a slightly deeper tone so it reads by light and shadow; a thin inner ring engraved around the face at 82% of the diameter. Shown straight FRONT view (face-on, no tilt) so it sits neatly inside a small day cell. Clean, bright, simple enough to read at 30 pixels.

### J-03 coin_icon_grey.png

Family: 3D PEAK (full colour). Export: 1024x1024 transparent PNG -> export 256x256 for small icons (<= 40 dp) or 512x512 for heroes; optimise with TinyPNG (target < 60 KB).

the same YouPeak coin as the golden one (thick coin, rolled rim, embossed play-peak mark, straight front view) but in a DISABLED state: fully desaturated cool light grey metal (#D5DAD7 base, #B7BEBA shadows, #F2F4F3 highlights) with a softer, matte finish and lower contrast, so it clearly reads as "locked / not yet". Identical size and silhouette to the gold version.

### J-04 convert_icon.png

Family: 3D PEAK (full colour). Export: 1024x1024 transparent PNG -> export 256x256 for small icons (<= 40 dp) or 512x512 for heroes; optimise with TinyPNG (target < 60 KB).

"Convert coins to money". A compact composition: a gold YouPeak coin (thick, embossed play-peak mark) at the upper-left, a forest-green (#0A7A44) rounded banknote/cash card at the lower-right showing a simple embossed ₹ symbol in a lighter emerald, and between them two chunky curved circular arrows (one gold, one emerald) forming a circle of exchange around them. Bold, simple, readable at 26 pixels.

### J-05 gift_icon.png

Family: 3D PEAK (full colour). Export: 1024x1024 transparent PNG -> export 256x256 for small icons (<= 40 dp) or 512x512 for heroes; optimise with TinyPNG (target < 60 KB).

a small gift box: cube-ish box in Forest Green #0A7A44 with a slightly wider lid, a VIP Gold #FFD700 ribbon crossing the lid and down the front, and a plump gold bow with two rounded loops on top. Closed lid. Chunky, simple, satin gloss.

### J-06 daily_gift_icon.png

Family: 3D PEAK (full colour). Export: 1024x1024 transparent PNG -> export 256x256 for small icons (<= 40 dp) or 512x512 for heroes; optimise with TinyPNG (target < 60 KB).

a DAILY gift: a Forest Green gift box with gold ribbon and bow, its lid popped open and floating slightly above the box at a playful tilt, with three gold YouPeak coins (thick, embossed play-peak mark) bursting upward out of the box in a small arc, and a tiny mint calendar tag hanging from the ribbon showing a single tick mark (no numbers). Joyful, energetic, but a compact silhouette.

### J-07 referral_icon.png

Family: 3D PEAK (full colour). Export: 1024x1024 transparent PNG -> export 256x256 for small icons (<= 40 dp) or 512x512 for heroes; optimise with TinyPNG (target < 60 KB).

"Invite friends & earn". Two friendly rounded 3D person busts (simple heads and shoulders, no faces): the front one in Forest Green #0A7A44, the one behind at the right in Emerald #19A463, and a gold YouPeak coin with a small white plus symbol engraved on it floating at the upper-right between them, as if shared between friends. Designer-toy style.

### J-08 engagement_icon.png

Family: 3D PEAK (full colour). Export: 1024x1024 transparent PNG -> export 256x256 for small icons (<= 40 dp) or 512x512 for heroes; optimise with TinyPNG (target < 60 KB).

"Engagement rewards". A cluster of three chunky 3D symbols: a Forest Green rounded speech bubble (centre-back), a gold thumbs-up hand popping out in front at the lower-left, and a small emerald heart at the upper-right; one small gold coin tucked at the bottom-right. Tight, balanced cluster forming one solid silhouette.

### J-09 ad_icon.png

Family: 3D PEAK (full colour). Export: 1024x1024 transparent PNG -> export 256x256 for small icons (<= 40 dp) or 512x512 for heroes; optimise with TinyPNG (target < 60 KB).

"Watch an ad, earn coins". A chunky rounded 3D TV / video screen in Dark Forest #1E4D2B with a glossy screen showing a white rounded play triangle; a small gold YouPeak coin leaning against the bottom-right corner of the screen, and a tiny gold 4-point sparkle at the top-right corner attached to the screen edge. Solid, compact silhouette.

### J-10 ad_round.png

Family: 3D PEAK (full colour). Export: 1024x1024 transparent PNG -> export 256x256 for small icons (<= 40 dp) or 512x512 for heroes; optimise with TinyPNG (target < 60 KB).

an "AD" badge: a glossy round 3D button (a thick disc seen straight from the front) in VIP Gold #FFD700 with a deep-gold rim, and on its face the two capital letters "AD" in a bold rounded geometric typeface (like Urbanist Black) embossed in Dark Forest #1E4D2B. Exactly the letters A and D, perfectly spelled, centred.

### J-11 premium_image.png

Family: 3D PEAK (full colour). Export: 1024x1024 transparent PNG -> export 256x256 for small icons (<= 40 dp) or 512x512 for heroes; optimise with TinyPNG (target < 60 KB).

the YouPeak PREMIUM crown — hero version. A majestic but friendly chunky crown with five rounded points topped by gold balls, polished VIP Gold with deep-gold shadows; a thick band set with a large central oval emerald (#0A7A44 faceted glass with #19A463 internal glow) flanked by two smaller round emeralds; a subtle engraved play-peak mark on the band beneath the central gem. Around the upper crown, three tiny gold 4-point sparkles attached close to the points (touching the silhouette). Luxurious, premium, joyful — this sells the subscription.

### J-12 lock.png

Family: 3D PEAK (full colour). Export: 1024x1024 transparent PNG -> export 256x256 for small icons (<= 40 dp) or 512x512 for heroes; optimise with TinyPNG (target < 60 KB).

a premium PADLOCK for locked paid content: a chunky rounded padlock with a polished VIP Gold shackle (thick, rounded) and a Dark Forest (#1E4D2B) glossy lock body with rounded corners and a thin gold bevelled edge; in the centre of the body, a gold keyhole in the shape of a small rounded play triangle (meaning "locked video"). Closed state.

### J-13 tick.png

Family: 3D PEAK (full colour). Export: 1024x1024 transparent PNG -> export 256x256 for small icons (<= 40 dp) or 512x512 for heroes; optimise with TinyPNG (target < 60 KB).

the YouPeak VERIFIED badge: a scalloped rosette seal (a circle with 12 soft rounded scallops around its edge) in glossy Forest Green (#0A7A44 with an Emerald #19A463 top highlight), a thin VIP Gold rim along the scalloped edge, and a bold pure-white rounded check mark in the centre. Straight front view. Must remain crisp and recognisable at 16 pixels next to a channel name, like Instagram's / X's verified badge but YouPeak green and gold.

### J-14 congratulation_icon.png

Family: 3D PEAK (full colour). Export: 1024x1024 transparent PNG -> export 256x256 for small icons (<= 40 dp) or 512x512 for heroes; optimise with TinyPNG (target < 60 KB).

CELEBRATION: a chunky gold trophy cup (two rounded handles, a Forest Green base with a gold plate) with a small embossed play-peak mark on the cup, and a party popper cone in Forest Green with gold stripes at the lower-left bursting a tight cluster of confetti — gold coins, mint and emerald rounded confetti pieces, small gold stars — that stays close to the trophy so the whole thing forms one compact group. Joyful and premium.

### J-15 premium_download.png

Family: 3D PEAK (full colour). Export: 1024x1024 transparent PNG -> export 256x256 for small icons (<= 40 dp) or 512x512 for heroes; optimise with TinyPNG (target < 60 KB).

PREMIUM OFFLINE DOWNLOADS: a chunky rounded 3D smartphone (Dark Forest #1E4D2B body, glossy screen in Forest Green gradient) standing slightly angled; out of a soft rounded cloud above it, a bold gold download arrow comes down into the screen; a small gold crown sits tilted on the top-right corner of the phone. Compact, one clean silhouette.

### J-16 heartEffects.png

Family: 3D PEAK (full colour). Export: 1024x1024 transparent PNG -> export 256x256 for small icons (<= 40 dp) or 512x512 for heroes; optimise with TinyPNG (target < 60 KB).

a cluster of three glossy 3D hearts rising in a gentle diagonal from the lower-left to the upper-right, getting smaller as they rise: the big one in rich emerald-green (#19A463 to #0A7A44) with a white glossy highlight, the medium one in VIP Gold, the small one in mint (#CFF5DD). They overlap slightly, forming one connected cluster. Playful, bouncy, soft.

### J-17 coin_pack_1.png

Family: 3D PEAK (full colour). Export: 1024x1024 transparent PNG -> export 256x256 for small icons (<= 40 dp) or 512x512 for heroes; optimise with TinyPNG (target < 60 KB).

YouPeak coin pack, SIZE 1 (smallest): a small tidy stack of 3 thick gold YouPeak coins (a thick, chunky gold coin (thickness about 16% of its diameter) with a rolled, softly reeded outer rim; the coin face is slightly concave polished VIP Gold (#FFD700, shadows #E0A800 and #B8860B, highlights #FFF1A8); in the centre of the face, a raised embossed YouPeak mark — a rounded play triangle whose upper edge has a double mountain-peak notch, with a small round sun above the tallest summit — embossed in the same gold with a slightly deeper tone so it reads by light and shadow; a thin inner ring engraved around the face at 82% of the diameter), slightly offset, with one extra coin leaning against the stack at the front. Six-pack series: this is the humblest size.

### J-18 coin_pack_2.png

Family: 3D PEAK (full colour). Export: 1024x1024 transparent PNG -> export 256x256 for small icons (<= 40 dp) or 512x512 for heroes; optimise with TinyPNG (target < 60 KB).

YouPeak coin pack, SIZE 2: two neat stacks of thick gold YouPeak coins (embossed play-peak mark on each face), one stack of 5 coins and one of 3 coins in front, plus two loose coins lying flat at the front. Same lighting and coin design as the whole series, slightly more abundant than size 1.

### J-19 coin_pack_3.png

Family: 3D PEAK (full colour). Export: 1024x1024 transparent PNG -> export 256x256 for small icons (<= 40 dp) or 512x512 for heroes; optimise with TinyPNG (target < 60 KB).

YouPeak coin pack, SIZE 3: a generous rounded pile of about 15 thick gold YouPeak coins (embossed play-peak mark), some standing on edge, forming a small mountain-shaped heap (a subtle nod to "peak"), with one coin on the top catching a bright glint.

### J-20 coin_pack_4.png

Family: 3D PEAK (full colour). Export: 1024x1024 transparent PNG -> export 256x256 for small icons (<= 40 dp) or 512x512 for heroes; optimise with TinyPNG (target < 60 KB).

YouPeak coin pack, SIZE 4: a plump rounded money pouch / sack in Forest Green (#0A7A44) satin fabric tied with a gold cord at the neck, overflowing with thick gold YouPeak coins spilling out of the top and a few resting at its base; a small embossed gold play-peak emblem stitched on the front of the sack.

### J-21 coin_pack_5.png

Family: 3D PEAK (full colour). Export: 1024x1024 transparent PNG -> export 256x256 for small icons (<= 40 dp) or 512x512 for heroes; optimise with TinyPNG (target < 60 KB).

YouPeak coin pack, SIZE 5: a chunky rounded treasure chest in Dark Forest (#1E4D2B) glossy lacquer with gold trims, gold corners and a gold play-peak shaped lock plate; the lid is open and a heap of thick gold YouPeak coins and two faceted emerald gems overflow from it, with a soft warm golden glow from inside the chest (glow contained within the chest area).

### J-22 coin_pack_6.png

Family: 3D PEAK (full colour). Export: 1024x1024 transparent PNG -> export 256x256 for small icons (<= 40 dp) or 512x512 for heroes; optimise with TinyPNG (target < 60 KB).

YouPeak coin pack, SIZE 6 (ultimate): a majestic gold mountain made of stacked gold YouPeak coins shaped like a two-summit mountain peak (the YouPeak signature), with a small gold crown sitting on the highest summit and three faceted emeralds embedded in the coin mountain; tiny 4-point gold sparkles touching the silhouette. The most abundant, most premium of the series.

### J-23 promote_video.png

Family: 3D PEAK (full colour). Export: 1024x1024 transparent PNG -> export 256x256 for small icons (<= 40 dp) or 512x512 for heroes; optimise with TinyPNG (target < 60 KB).

"Promote your video": a chunky 3D rocket in off-white (#F4F8F5) and Forest Green (#0A7A44) with a round porthole window showing a small white play triangle on a green glass, launching diagonally to the upper-right, with a stylised rounded gold-and-orange flame at its base and two soft rounded mint smoke puffs attached to the flame. Compact, energetic, one connected silhouette.

### J-24 wallet_3d.png

Family: 3D PEAK (full colour). Export: 1024x1024 transparent PNG -> export 256x256 for small icons (<= 40 dp) or 512x512 for heroes; optimise with TinyPNG (target < 60 KB).

a premium 3D WALLET: a plump rounded leather-like wallet in Forest Green (#0A7A44, fine soft grain) with a Dark Forest flap fastened by a gold press stud, a gold YouPeak coin and the corner of a mint banknote peeking out of the top. Satin finish, friendly and premium.

### J-25 withdraw_bank.png

Family: 3D PEAK (full colour). Export: 1024x1024 transparent PNG -> export 256x256 for small icons (<= 40 dp) or 512x512 for heroes; optimise with TinyPNG (target < 60 KB).

"Withdraw to bank": a chunky rounded classical bank building in off-white with Forest Green roof and four rounded columns, with a gold coin flowing from the upper-left along a curved gold arrow into its door. Simple, soft, trustworthy.

### J-26 promo_megaphone.png

Family: 3D PEAK (full colour). Export: 1024x1024 transparent PNG -> export 256x256 for small icons (<= 40 dp) or 512x512 for heroes; optimise with TinyPNG (target < 60 KB).

a friendly 3D megaphone in Forest Green with a gold rim at the mouth and a Dark Forest handle, angled up to the right, with three short rounded gold "sound" arcs attached to the mouth and a small gold coin floating near the handle (touching the silhouette).

### J-27 green_tick.png

Family: 3D PEAK (full colour). Export: 1024x1024 transparent PNG -> export 256x256 for small icons (<= 40 dp) or 512x512 for heroes; optimise with TinyPNG (target < 60 KB).

a small glossy 3D success check: a round domed button (like a jelly sweet seen from the front) in Forest Green #0A7A44 with an Emerald #19A463 top highlight and the signature soft mint rim light on the right, with a bold pure-white rounded check mark slightly raised in the centre. Very simple, crisp and readable at 18 pixels.

### J-28 king_round.png

Family: 3D PEAK (full colour). Export: 1024x1024 transparent PNG -> export 256x256 for small icons (<= 40 dp) or 512x512 for heroes; optimise with TinyPNG (target < 60 KB).

a round VIP medallion: a thick glossy disc in Forest Green #0A7A44 enamel with a polished VIP Gold rim (rim thickness 9% of the diameter), and in its centre a chunky raised gold crown with three rounded points, each tipped with a small gold ball, and a tiny emerald gem on the crown band. Straight front view, simple enough to read at 24 pixels.

### K-01 tier_classic_pass.png

Family: YOUPEAK EMBLEM (full colour). Export: 1024x1024 transparent PNG -> export 256x256 (< 60 KB). Keep the 1024 master for marketing.

CREATOR tier emblem, level 1 — "Classic Pass" (free starting tier). Rim: satin brushed pewter / soft steel (#C9D1CC highlights, #8C9690 shadows). Enamel face: matte Mint (#E8F5E9) enamel. Central raised symbol: the YouPeak play-peak mark (rounded play triangle with a double mountain-notch on its upper edge) in the same pewter metal. No extra ornaments — clean, humble, but beautifully made. It is the first of a five-emblem progression.

### K-02 tier_starter_vip.png

Family: YOUPEAK EMBLEM (full colour). Export: 1024x1024 transparent PNG -> export 256x256 (< 60 KB). Keep the 1024 master for marketing.

CREATOR tier emblem, level 2 — "Starter VIP Pass". Rim: polished warm bronze (#CD8B4A, shadows #8A5424, highlights #F2C28E). Enamel face: glossy Forest Green (#0A7A44) hard enamel. Central raised symbol: the YouPeak play-peak mark in polished bronze. Ornament: one small raised bronze star centred above the mark at the shield's peak point. Second of five — visibly a step up from Classic.

### K-03 tier_silver_vip.png

Family: YOUPEAK EMBLEM (full colour). Export: 1024x1024 transparent PNG -> export 256x256 (< 60 KB). Keep the 1024 master for marketing.

CREATOR tier emblem, level 3 — "Silver VIP Pass". Rim: bright polished silver (#E8ECEA highlights, #9AA39E shadows, crisp reflections). Enamel face: glossy Dark Forest (#1E4D2B) enamel with a subtle radial emerald glow in the centre. Central raised symbol: the play-peak mark in polished silver. Ornaments: a pair of small silver laurel branches curving up along the left and right lower sides of the shield, plus the small star above the mark. Third of five.

### K-04 tier_gold_vip.png

Family: YOUPEAK EMBLEM (full colour). Export: 1024x1024 transparent PNG -> export 256x256 (< 60 KB). Keep the 1024 master for marketing.

CREATOR tier emblem, level 4 — "Gold VIP Pass". Rim: rich polished VIP Gold (#FFD700, shadows #E0A800 / #B8860B, highlights #FFF1A8). Enamel face: deep glossy Forest Green (#0A7A44 to #1E4D2B radial) enamel. Central raised symbol: the play-peak mark in polished gold with a tiny inset emerald as the sun dot. Ornaments: full gold laurel wreath along both lower sides, a small gold crown sitting on the shield's peak point, and a pair of small stylised gold wings extending from the upper left and right edges of the shield. Fourth of five — clearly premium.

### K-05 tier_platinum_vip.png

Family: YOUPEAK EMBLEM (full colour). Export: 1024x1024 transparent PNG -> export 256x256 (< 60 KB). Keep the 1024 master for marketing.

CREATOR tier emblem, level 5 (the ultimate) — "Platinum VIP Pass". Rim: luminous platinum (#F4F7F6 highlights, #B9C3BF shadows) with fine iridescent mint-to-gold sheen at the edges. Enamel face: deep emerald glass-enamel with a faint inner starfield of tiny gold flecks. Central raised symbol: the play-peak mark in platinum, its sun dot a brilliant faceted diamond. Ornaments: platinum laurel wreath, larger stylised wings, a jewelled platinum crown with three emeralds on the shield peak, and soft radiant light rays (contained within 92% of the canvas) fanning behind the top of the emblem. The most spectacular of the five, but still clean and readable.

### K-06 tier_tasker_free.png

Family: YOUPEAK EMBLEM (full colour). Export: 1024x1024 transparent PNG -> export 256x256 (< 60 KB). Keep the 1024 master for marketing.

TASKER tier medal, "Free Tasker" (entry level). TASKER medals use a DIFFERENT base shape from creator emblems: a round medal with a softly scalloped (16 gentle bumps) thick metal rim and a recessed enamel centre, hanging from nothing (no ribbon). Rim: satin pewter (#C9D1CC / #8C9690). Enamel: matte Mint #E8F5E9. Central raised symbol: a chunky check mark inside a rounded square (the "task done" symbol) in pewter. Humble, clean, beautifully made. First of five tasker medals.

### K-07 tier_tasker_l1.png

Family: YOUPEAK EMBLEM (full colour). Export: 1024x1024 transparent PNG -> export 256x256 (< 60 KB). Keep the 1024 master for marketing.

TASKER tier medal, "Level 1 Tasker": the same round scalloped-rim medal, rim in polished bronze (#CD8B4A / #8A5424 / #F2C28E), enamel in glossy Forest Green (#0A7A44), central raised bronze symbol: the check-in-rounded-square "task done" mark, and ONE small raised bronze chevron (rank stripe) below the symbol. Second of five.

### K-08 tier_tasker_l2.png

Family: YOUPEAK EMBLEM (full colour). Export: 1024x1024 transparent PNG -> export 256x256 (< 60 KB). Keep the 1024 master for marketing.

TASKER tier medal, "Level 2 Tasker": the same round scalloped-rim medal, rim in polished silver (#E8ECEA / #9AA39E), enamel in glossy Dark Forest (#1E4D2B) with a soft emerald centre glow, central raised silver "task done" mark, and TWO stacked silver rank chevrons below it. Third of five.

### K-09 tier_tasker_l3.png

Family: YOUPEAK EMBLEM (full colour). Export: 1024x1024 transparent PNG -> export 256x256 (< 60 KB). Keep the 1024 master for marketing.

TASKER tier medal, "Level 3 Tasker": the same round scalloped-rim medal, rim in rich polished VIP Gold (#FFD700 / #E0A800 / #FFF1A8), enamel in deep glossy Forest Green, central raised gold "task done" mark, THREE stacked gold rank chevrons below it, and a small gold star above the symbol. Fourth of five.

### K-10 tier_tasker_l4.png

Family: YOUPEAK EMBLEM (full colour). Export: 1024x1024 transparent PNG -> export 256x256 (< 60 KB). Keep the 1024 master for marketing.

TASKER tier medal, "Level 4 Tasker" (top level): the same round scalloped-rim medal in luminous platinum (#F4F7F6 / #B9C3BF) with a fine mint-to-gold iridescent sheen, enamel in deep emerald glass with tiny gold flecks, central raised platinum "task done" mark, THREE platinum rank chevrons, a small jewelled crown above the symbol, and two tiny laurel sprigs on the lower sides. Most prestigious of the five.

### K-11 verified_badge.png

Family: 3D PEAK (full colour). Export: 1024x1024 transparent PNG -> export 256x256 for small icons (<= 40 dp) or 512x512 for heroes; optimise with TinyPNG (target < 60 KB).

a tiny FLAT verified badge optimised for 14–18 pixels (NOT 3D for this one — flat vector style, override the 3D rendering instructions): a scalloped rosette seal with 8 soft rounded scallops, solid Forest Green (#0A7A44), and a bold pure-white rounded check mark in the centre occupying 50% of the seal. No gradient, no shadow, no rim. Transparent background. Perfectly symmetric and crisp.

### K-12 live_badge.png

Family: 3D PEAK (full colour). Export: 1024x1024 transparent PNG -> export 256x256 for small icons (<= 40 dp) or 512x512 for heroes; optimise with TinyPNG (target < 60 KB).

a flat-with-depth "LIVE" pill badge (landscape 1536 x 1024 canvas, pill fills the width at 85%): a rounded pill shape in Crimson (#D32F2F to #E53935 subtle vertical gradient) with a soft inner top highlight; at the left inside the pill, a white solid dot (the live indicator) with two tiny white broadcast arcs on its right; then the word "LIVE" in bold white rounded geometric capitals (like Urbanist ExtraBold), perfectly spelled L-I-V-E. Crisp, no drop shadow outside the pill. Transparent background.

### K-13 premium_badge.png

Family: 3D PEAK (full colour). Export: 1024x1024 transparent PNG -> export 256x256 for small icons (<= 40 dp) or 512x512 for heroes; optimise with TinyPNG (target < 60 KB).

a compact round PREMIUM badge: a glossy 3D gold coin-disc (VIP Gold, deep gold rim) with a small chunky Forest Green crown (three rounded points) embossed in the centre. Straight front view, simple enough for 18 pixels.

### K-14 paid_video_badge.png

Family: 3D PEAK (full colour). Export: 1024x1024 transparent PNG -> export 256x256 for small icons (<= 40 dp) or 512x512 for heroes; optimise with TinyPNG (target < 60 KB).

a small landscape pill badge (1536 x 1024 canvas, pill 80% width) in Dark Forest (#1E4D2B) glass with a subtle top sheen; at its left, a small 3D gold YouPeak coin (embossed play-peak mark); at its right, a small gold padlock. No text. Crisp edges, transparent background.

### K-15 top_creator_badge.png

Family: 3D PEAK (full colour). Export: 1024x1024 transparent PNG -> export 256x256 for small icons (<= 40 dp) or 512x512 for heroes; optimise with TinyPNG (target < 60 KB).

a round 3D badge with a thick gold rim and a Forest Green glossy enamel face, with an embossed gold flame whose inner tongue forms an upward arrow — "trending / on fire". Straight front view, readable at 22 pixels.

### K-16 new_badge.png

Family: 3D PEAK (full colour). Export: 1024x1024 transparent PNG -> export 256x256 for small icons (<= 40 dp) or 512x512 for heroes; optimise with TinyPNG (target < 60 KB).

a small landscape pill badge (1536 x 1024 canvas, pill 75% width) in glossy VIP Gold (#FFD700 with #E0A800 lower edge) with the word "NEW" in bold Dark Forest (#1E4D2B) rounded geometric capitals (like Urbanist Black), perfectly spelled N-E-W, and a tiny white 4-point sparkle at the upper-right corner of the pill. Transparent background, no outside shadow.

### K-17 partner_district_badge.png

Family: YOUPEAK EMBLEM (full colour). Export: 1024x1024 transparent PNG -> export 256x256 (< 60 KB). Keep the 1024 master for marketing.

a special partner emblem (not a numbered tier): rim in polished VIP Gold, enamel face in Forest Green, central raised gold symbol: a map pin whose round head contains a small play-peak mark, with three tiny gold dots connected by thin raised lines around it (a network of locations). A gold ribbon banner (no text) wrapped across the bottom of the shield.

### K-18 partner_digital_badge.png

Family: YOUPEAK EMBLEM (full colour). Export: 1024x1024 transparent PNG -> export 256x256 (< 60 KB). Keep the 1024 master for marketing.

a special partner emblem: rim in polished platinum-silver, enamel face in Dark Forest #1E4D2B, central raised symbol: two stylised rounded hands meeting in a handshake in silver and emerald, with a small gold play-peak mark above them. An emerald ribbon banner (no text) across the bottom.

### R-01 react_like.png

Family: YOUPEAK REACTION EMOJI (full colour). Export: 1024x1024 transparent PNG -> export 160x160 (inline/comment use) AND 480x480 (floating live reactions); keep the 1024 master. Suggested folder: assets/emoji/

"Like" — a plump 3D thumbs-up hand in the same warm golden-yellow skin gradient as the faces (#FFE45C -> #F2A516), soft rounded fingers curled into the palm, short thumb raised straight up with a glossy highlight on the thumbnail, a thin mint rim light on the right edge, and a small Forest Green (#0A7A44) cuff at the wrist.

### R-02 react_love.png

Family: YOUPEAK REACTION EMOJI (full colour). Export: 1024x1024 transparent PNG -> export 160x160 (inline/comment use) AND 480x480 (floating live reactions); keep the 1024 master. Suggested folder: assets/emoji/

"Love" — a single puffy, juicy 3D heart in rich love-red (#E53935 body, #FF6B6B highlights, #B71C1C shading in the lower curve), perfectly symmetrical, with a big glossy highlight at the upper-left lobe and the signature mint rim light on the right edge. No face.

### R-03 react_green_heart.png

Family: YOUPEAK REACTION EMOJI (full colour). Export: 1024x1024 transparent PNG -> export 160x160 (inline/comment use) AND 480x480 (floating live reactions); keep the 1024 master. Suggested folder: assets/emoji/

"YouPeak heart" — the brand's exclusive heart: identical shape and gloss to the love heart, but in Forest Green (#0A7A44 body, #19A463 highlights, #1E4D2B shading) with a small embossed gold YouPeak play-peak mark in the centre and a thin gold rim line. The signature reaction of the app.

### R-04 react_laugh.png

Family: YOUPEAK REACTION EMOJI (full colour). Export: 1024x1024 transparent PNG -> export 160x160 (inline/comment use) AND 480x480 (floating live reactions); keep the 1024 master. Suggested folder: assets/emoji/

"Tears of joy" — the round golden face with tightly closed upward-curved laughing eyes (^ ^ shape), a huge open laughing mouth (dark brown with a visible upper row of white teeth and a pink-red tongue), and two big glossy aqua-mint tears (#9FF0CF) bursting outward from the outer corners of both eyes, tilted slightly back with laughter.

### R-05 react_rofl.png

Family: YOUPEAK REACTION EMOJI (full colour). Export: 1024x1024 transparent PNG -> export 160x160 (inline/comment use) AND 480x480 (floating live reactions); keep the 1024 master. Suggested folder: assets/emoji/

"Rolling on the floor laughing" — the same laughing face as the tears-of-joy emoji but rotated 25 degrees to the left, eyes squeezed shut, mouth wide open laughing, tears flying outward — pure hysterical laughter.

### R-06 react_wow.png

Family: YOUPEAK REACTION EMOJI (full colour). Export: 1024x1024 transparent PNG -> export 160x160 (inline/comment use) AND 480x480 (floating live reactions); keep the 1024 master. Suggested folder: assets/emoji/

"Wow" — the round golden face with wide-open round eyes (dark brown with white catch-lights), raised eyebrows as small arcs, and a small round open mouth in an "O" shape. Pure surprise and amazement.

### R-07 react_sad.png

Family: YOUPEAK REACTION EMOJI (full colour). Export: 1024x1024 transparent PNG -> export 160x160 (inline/comment use) AND 480x480 (floating live reactions); keep the 1024 master. Suggested folder: assets/emoji/

"Sad" — the round golden face with downturned brows, glossy sad eyes looking slightly down, a small frown, and one big glossy aqua-mint tear rolling down from the left eye onto the cheek.

### R-08 react_angry.png

Family: YOUPEAK REACTION EMOJI (full colour). Export: 1024x1024 transparent PNG -> export 160x160 (inline/comment use) AND 480x480 (floating live reactions); keep the 1024 master. Suggested folder: assets/emoji/

"Angry" — the round face with a special gradient from warm orange-red at the top (#FF7043) to golden (#FFC933) at the bottom, sharply angled furrowed brows, narrowed eyes, and a tight downturned mouth; still cute, not scary.

### R-09 react_heart_eyes.png

Family: YOUPEAK REACTION EMOJI (full colour). Export: 1024x1024 transparent PNG -> export 160x160 (inline/comment use) AND 480x480 (floating live reactions); keep the 1024 master. Suggested folder: assets/emoji/

"Heart eyes" — the round golden face with a big happy open smile (teeth visible) and both eyes replaced by glossy red hearts (#E53935), tilted slightly — adoring the video.

### R-10 react_star_struck.png

Family: YOUPEAK REACTION EMOJI (full colour). Export: 1024x1024 transparent PNG -> export 160x160 (inline/comment use) AND 480x480 (floating live reactions); keep the 1024 master. Suggested folder: assets/emoji/

"Star-struck" — the round golden face with a wide open grin and both eyes replaced by glossy gold 5-point stars (#FFD700 with #E0A800 edges and white highlight), expressing "amazing creator!".

### R-11 react_fire.png

Family: YOUPEAK REACTION EMOJI (full colour). Export: 1024x1024 transparent PNG -> export 160x160 (inline/comment use) AND 480x480 (floating live reactions); keep the 1024 master. Suggested folder: assets/emoji/

"Fire" — a chunky stylised 3D flame: outer flame in orange-red (#FF6D00), mid layer orange-gold (#FF981F), bright inner core of VIP Gold (#FFD700) fading to a white-gold centre, three flicking tongues at the top leaning slightly right, glossy highlights, mint rim light. No face.

### R-12 react_clap.png

Family: YOUPEAK REACTION EMOJI (full colour). Export: 1024x1024 transparent PNG -> export 160x160 (inline/comment use) AND 480x480 (floating live reactions); keep the 1024 master. Suggested folder: assets/emoji/

"Clap" — two plump golden-yellow 3D hands clapping, seen from the front-side, palms meeting at a slight angle, with three short curved motion strokes in white-gold ATTACHED at the top between the fingertips. Forest Green cuffs at the wrists.

### R-13 react_100.png

Family: YOUPEAK REACTION EMOJI (full colour). Export: 1024x1024 transparent PNG -> export 160x160 (inline/comment use) AND 480x480 (floating live reactions); keep the 1024 master. Suggested folder: assets/emoji/

"100" — the number "100" in chunky, bold, slightly italic 3D numerals in Forest Green (#0A7A44 with #19A463 highlights), with two thick glossy gold underlines beneath (the second one shorter), exactly the digits one, zero, zero. Energetic, stamp-like.

### R-14 react_mind_blown.png

Family: YOUPEAK REACTION EMOJI (full colour). Export: 1024x1024 transparent PNG -> export 160x160 (inline/comment use) AND 480x480 (floating live reactions); keep the 1024 master. Suggested folder: assets/emoji/

"Mind blown" — the round golden face with the top of the head exploding into a small stylised puff of mint-green and gold cloud with a few tiny spark pieces attached, eyes wide in shock, mouth open.

### R-15 react_cool.png

Family: YOUPEAK REACTION EMOJI (full colour). Export: 1024x1024 transparent PNG -> export 160x160 (inline/comment use) AND 480x480 (floating live reactions); keep the 1024 master. Suggested folder: assets/emoji/

"Cool" — the round golden face with a confident smirk-smile and sleek dark charcoal (#1C1C1E) sunglasses with a glossy emerald reflection streak across the lenses.

### R-16 react_thinking.png

Family: YOUPEAK REACTION EMOJI (full colour). Export: 1024x1024 transparent PNG -> export 160x160 (inline/comment use) AND 480x480 (floating live reactions); keep the 1024 master. Suggested folder: assets/emoji/

"Thinking" — the round golden face with one raised eyebrow, eyes looking up to the side, a flat unsure mouth, and a golden-yellow hand under the chin with the index finger and thumb along the jaw.

### R-17 react_namaste.png

Family: YOUPEAK REACTION EMOJI (full colour). Export: 1024x1024 transparent PNG -> export 160x160 (inline/comment use) AND 480x480 (floating live reactions); keep the 1024 master. Suggested folder: assets/emoji/

"Namaste / thank you" — two golden-yellow 3D hands pressed together palm to palm pointing upward (folded hands), fingers together, a Forest Green cuff at each wrist, and a few tiny gold sparkle glints attached at the fingertips. Respectful, warm, very Indian audience-friendly.

### R-18 react_party.png

Family: YOUPEAK REACTION EMOJI (full colour). Export: 1024x1024 transparent PNG -> export 160x160 (inline/comment use) AND 480x480 (floating live reactions); keep the 1024 master. Suggested folder: assets/emoji/

"Party" — the round golden face with a joyful closed-eye smile, wearing a small cone-shaped party hat in Forest Green with gold dots tilted to the side, blowing a party horn (a gold-and-green rolled horn) from the mouth, a few confetti pieces attached around the hat.

### R-19 react_hug.png

Family: YOUPEAK REACTION EMOJI (full colour). Export: 1024x1024 transparent PNG -> export 160x160 (inline/comment use) AND 480x480 (floating live reactions); keep the 1024 master. Suggested folder: assets/emoji/

"Hug" — the round golden face with closed happy eyes and warm smile, and two golden open hands at the lower front reaching out as if giving a hug.

### R-20 react_wink.png

Family: YOUPEAK REACTION EMOJI (full colour). Export: 1024x1024 transparent PNG -> export 160x160 (inline/comment use) AND 480x480 (floating live reactions); keep the 1024 master. Suggested folder: assets/emoji/

"Wink" — the round golden face with one eye winking (curved line), the other eye open with a highlight, and a playful sideways smile.

### R-21 react_skull.png

Family: YOUPEAK REACTION EMOJI (full colour). Export: 1024x1024 transparent PNG -> export 160x160 (inline/comment use) AND 480x480 (floating live reactions); keep the 1024 master. Suggested folder: assets/emoji/

"Dead (that's so funny)" — a cute, rounded, friendly 3D skull in soft off-white (#F4F8F5) with a gentle mint rim light, big dark rounded eye sockets and a small nose, not scary at all — Gen-Z "I'm dead" reaction.

### R-22 react_eyes.png

Family: YOUPEAK REACTION EMOJI (full colour). Export: 1024x1024 transparent PNG -> export 160x160 (inline/comment use) AND 480x480 (floating live reactions); keep the 1024 master. Suggested folder: assets/emoji/

"Eyes / watching" — two big glossy 3D eyeballs side by side, white with deep brown irises looking to the left, bright catch-lights, soft mint rim light. No face around them.

### R-23 react_popcorn.png

Family: YOUPEAK REACTION EMOJI (full colour). Export: 1024x1024 transparent PNG -> export 160x160 (inline/comment use) AND 480x480 (floating live reactions); keep the 1024 master. Suggested folder: assets/emoji/

"Popcorn / binge watching" — a classic striped popcorn box with Forest Green and white vertical stripes and a small gold YouPeak play-peak mark on the front, overflowing with fluffy golden-buttery popcorn at the top.

### R-24 react_rocket.png

Family: YOUPEAK REACTION EMOJI (full colour). Export: 1024x1024 transparent PNG -> export 160x160 (inline/comment use) AND 480x480 (floating live reactions); keep the 1024 master. Suggested folder: assets/emoji/

"To the moon / going viral" — a glossy 3D rocket in white and Forest Green with gold fins and a round mint window, flying diagonally to the upper-right with a short gold-orange flame at the bottom-left.

### R-25 react_peak.png

Family: YOUPEAK REACTION EMOJI (full colour). Export: 1024x1024 transparent PNG -> export 160x160 (inline/comment use) AND 480x480 (floating live reactions); keep the 1024 master. Suggested folder: assets/emoji/

"At your peak" — YouPeak's exclusive signature reaction: a chunky 3D mountain with two peaks (Forest Green slopes, Dark Forest shadows, soft mint snow caps) and a small gold flag planted on the tallest summit, a gold sun disc rising behind the right shoulder. Means "legendary / peak content".

### R-26 react_coin_eyes.png

Family: YOUPEAK REACTION EMOJI (full colour). Export: 1024x1024 transparent PNG -> export 160x160 (inline/comment use) AND 480x480 (floating live reactions); keep the 1024 master. Suggested folder: assets/emoji/

"Money / earnings" — the round golden face with a big greedy grin and both eyes replaced by shiny YouPeak gold coins (gold with an embossed play-peak mark), a tongue slightly out — "earning coins!".

### R-27 react_crown_face.png

Family: YOUPEAK REACTION EMOJI (full colour). Export: 1024x1024 transparent PNG -> export 160x160 (inline/comment use) AND 480x480 (floating live reactions); keep the 1024 master. Suggested folder: assets/emoji/

"King / queen" — the round golden face with a proud confident smile and half-closed satisfied eyes, wearing a small tilted gold crown with a single emerald gem.

### R-28 react_muscle.png

Family: YOUPEAK REACTION EMOJI (full colour). Export: 1024x1024 transparent PNG -> export 160x160 (inline/comment use) AND 480x480 (floating live reactions); keep the 1024 master. Suggested folder: assets/emoji/

"Strong / power" — a golden-yellow 3D flexed arm with a big round bicep, fist up, a Forest Green sleeve cuff at the shoulder side, glossy highlight on the bicep.

### R-29 react_facepalm.png

Family: YOUPEAK REACTION EMOJI (full colour). Export: 1024x1024 transparent PNG -> export 160x160 (inline/comment use) AND 480x480 (floating live reactions); keep the 1024 master. Suggested folder: assets/emoji/

"Facepalm" — the round golden face with closed exasperated eyes and a golden hand covering the upper part of the face (palm on forehead), a small flat mouth.

### R-30 react_ok.png

Family: YOUPEAK REACTION EMOJI (full colour). Export: 1024x1024 transparent PNG -> export 160x160 (inline/comment use) AND 480x480 (floating live reactions); keep the 1024 master. Suggested folder: assets/emoji/

"OK / perfect" — a golden-yellow 3D hand making the OK sign (thumb and index finger forming a circle, other three fingers raised and slightly spread), Forest Green cuff.

### S-01 sticker_streak_flame.png

Family: 3D PEAK (full colour). Export: 1024x1024 transparent PNG -> export 256x256 for small icons (<= 40 dp) or 512x512 for heroes; optimise with TinyPNG (target < 60 KB).

a cheerful 3D streak flame character-free: a plump rounded flame in VIP Gold core -> orange #FF981F -> warm red-orange #FF6D00 outer layer, with a crisp inner white-gold glow, sitting on a small Forest Green rounded base disc like a trophy stand, three flicking tips. Bold and iconic like Duolingo's streak flame but in YouPeak colours.

### S-02 sticker_party_popper.png

Family: 3D PEAK (full colour). Export: 1024x1024 transparent PNG -> export 256x256 for small icons (<= 40 dp) or 512x512 for heroes; optimise with TinyPNG (target < 60 KB).

a 3D party popper cone in Forest Green with gold spiral stripes, pointed at the lower-left, bursting from its mouth at the upper-right: curly ribbons in gold and emerald, small spheres and tiny play-triangle confetti in mint and gold — all confetti pieces touching or overlapping the burst so the silhouette stays one cluster.

### S-03 sticker_money_bag.png

Family: 3D PEAK (full colour). Export: 1024x1024 transparent PNG -> export 256x256 for small icons (<= 40 dp) or 512x512 for heroes; optimise with TinyPNG (target < 60 KB).

a plump 3D money bag in Forest Green cloth with a gold cord tied at the neck, a big embossed gold Indian Rupee sign "₹" on the front, a couple of gold coins peeking out at the top.

### S-04 sticker_target.png

Family: 3D PEAK (full colour). Export: 1024x1024 transparent PNG -> export 256x256 for small icons (<= 40 dp) or 512x512 for heroes; optimise with TinyPNG (target < 60 KB).

a 3D dartboard target with concentric rings alternating Forest Green and off-white (#F4F8F5), a gold bullseye centre, and a sleek gold-and-green dart stuck exactly in the centre from the upper-right.

### S-05 sticker_confetti.png

Family: 3D PEAK (full colour). Export: 1024x1024 transparent PNG -> export 256x256 for small icons (<= 40 dp) or 512x512 for heroes; optimise with TinyPNG (target < 60 KB).

a wide celebratory confetti burst composition for a dialog header (generate at 1536 x 1024, landscape): a symmetrical fan of confetti bursting upward from the bottom-centre — curly ribbons, small spheres, tiny stars and small play-triangle pieces in Forest Green, Emerald, Mint and VIP Gold — dense near the centre, thinning toward the edges, leaving the bottom-centre empty. Transparent background.

### S-06 sticker_sparkles.png

Family: 3D PEAK (full colour). Export: 1024x1024 transparent PNG -> export 256x256 for small icons (<= 40 dp) or 512x512 for heroes; optimise with TinyPNG (target < 60 KB).

a cluster of three 3D four-point sparkle stars with softly concave sides: one large in VIP Gold, one medium in Emerald, one small in mint, overlapping slightly, glossy.

### S-07 sticker_medal.png

Family: 3D PEAK (full colour). Export: 1024x1024 transparent PNG -> export 256x256 for small icons (<= 40 dp) or 512x512 for heroes; optimise with TinyPNG (target < 60 KB).

a 3D gold medal: a round gold medal with a raised rim and an embossed YouPeak play-peak mark in the centre, hanging from a V-shaped ribbon in Forest Green with gold edge stripes.

### S-08 notif_reminder.png

Family: 3D PEAK (full colour). Export: 1024x1024 transparent PNG -> export 256x256 for small icons (<= 40 dp) or 512x512 for heroes; optimise with TinyPNG (target < 60 KB).

a chunky 3D alarm clock in Forest Green with two gold bells on top, a gold hammer between them, an off-white clock face with dark forest hands pointing to 10 and 2, short stubby legs, tiny motion lines at the bells attached to the body.

### S-09 notif_announcement.png

Family: 3D PEAK (full colour). Export: 1024x1024 transparent PNG -> export 256x256 for small icons (<= 40 dp) or 512x512 for heroes; optimise with TinyPNG (target < 60 KB).

a 3D megaphone in off-white with a Forest Green bell mouth and gold handle, angled up to the right, with three short curved sound lines in gold touching the mouth.

### S-10 notif_bell.png

Family: 3D PEAK (full colour). Export: 1024x1024 transparent PNG -> export 256x256 for small icons (<= 40 dp) or 512x512 for heroes; optimise with TinyPNG (target < 60 KB).

a glossy 3D notification bell in VIP Gold with a Forest Green rounded clapper, and a small Crimson #D32F2F dot badge attached at the upper-right of the bell.

### S-11 notif_new_subscriber.png

Family: 3D PEAK (full colour). Export: 1024x1024 transparent PNG -> export 256x256 for small icons (<= 40 dp) or 512x512 for heroes; optimise with TinyPNG (target < 60 KB).

a rounded 3D person-bust figure in Forest Green (pill head, rounded shoulders, no face) with a gold circular badge containing a white plus sign attached at its lower-right.

### S-12 notif_new_comment.png

Family: 3D PEAK (full colour). Export: 1024x1024 transparent PNG -> export 256x256 for small icons (<= 40 dp) or 512x512 for heroes; optimise with TinyPNG (target < 60 KB).

a glossy 3D speech bubble in Forest Green with a tail at the bottom-left, three white dots inside, and a smaller mint speech bubble tucked behind it at the upper-right.

### S-13 notif_new_like.png

Family: 3D PEAK (full colour). Export: 1024x1024 transparent PNG -> export 256x256 for small icons (<= 40 dp) or 512x512 for heroes; optimise with TinyPNG (target < 60 KB).

a glossy 3D thumbs-up in Emerald / Forest Green with a small red love heart badge attached at the upper-right.

### S-14 notif_live_now.png

Family: 3D PEAK (full colour). Export: 1024x1024 transparent PNG -> export 256x256 for small icons (<= 40 dp) or 512x512 for heroes; optimise with TinyPNG (target < 60 KB).

a 3D studio microphone (rounded capsule head with a gold mesh, Forest Green body) with two emerald broadcast arcs on each side attached to it and a small crimson live dot on the body.

### S-15 notif_payment_success.png

Family: 3D PEAK (full colour). Export: 1024x1024 transparent PNG -> export 256x256 for small icons (<= 40 dp) or 512x512 for heroes; optimise with TinyPNG (target < 60 KB).

a 3D payment card in Forest Green with a gold chip and subtle embossed lines (no text, no numbers), tilted, with a big glossy green-and-white success check circle badge overlapping its lower-right corner.

### S-16 notif_withdrawal_sent.png

Family: 3D PEAK (full colour). Export: 1024x1024 transparent PNG -> export 256x256 for small icons (<= 40 dp) or 512x512 for heroes; optimise with TinyPNG (target < 60 KB).

a 3D paper plane in off-white with Forest Green fold shading, flying up to the right, carrying a small green rupee banknote (embossed ₹) clipped under its wing, with a short dotted gold trail attached behind.

### S-17 notif_security.png

Family: 3D PEAK (full colour). Export: 1024x1024 transparent PNG -> export 256x256 for small icons (<= 40 dp) or 512x512 for heroes; optimise with TinyPNG (target < 60 KB).

a sturdy 3D shield in Forest Green with a polished gold rim and a raised white rounded check mark in the centre.

### S-18 notif_warning.png

Family: 3D PEAK (full colour). Export: 1024x1024 transparent PNG -> export 256x256 for small icons (<= 40 dp) or 512x512 for heroes; optimise with TinyPNG (target < 60 KB).

a soft rounded 3D warning triangle in amber-orange (#FF981F with #FFB74D highlights) with a thick white rounded exclamation mark, friendly, not alarming.

### S-19 notif_update.png

Family: 3D PEAK (full colour). Export: 1024x1024 transparent PNG -> export 256x256 for small icons (<= 40 dp) or 512x512 for heroes; optimise with TinyPNG (target < 60 KB).

a 3D open box / package in Forest Green with a gold ribbon, and a big glossy white-and-emerald upward arrow rising out of it, plus a couple of tiny gold sparkles attached to the arrow.

### S-20 sticker_wave.png

Family: 3D PEAK (full colour). Export: 1024x1024 transparent PNG -> export 256x256 for small icons (<= 40 dp) or 512x512 for heroes; optimise with TinyPNG (target < 60 KB).

a plump golden-yellow 3D waving hand (same skin gradient as the YouPeak emoji faces) with a Forest Green cuff, fingers spread, tilted as if waving, with two short curved motion lines in gold attached at the side.

### S-21 sticker_download_done.png

Family: 3D PEAK (full colour). Export: 1024x1024 transparent PNG -> export 256x256 for small icons (<= 40 dp) or 512x512 for heroes; optimise with TinyPNG (target < 60 KB).

a soft 3D cloud in mint (#E8F5E9 with a mint-green rim) with a glossy Forest Green circular badge in front containing a white downward arrow ending in a small check tick.

### S-22 sticker_upload_done.png

Family: 3D PEAK (full colour). Export: 1024x1024 transparent PNG -> export 256x256 for small icons (<= 40 dp) or 512x512 for heroes; optimise with TinyPNG (target < 60 KB).

a 3D landscape video card (Forest Green frame, mint screen with a white play triangle) with a gold success check badge attached at its upper-right corner and a small emerald upward arrow behind it.

### S-23 sticker_gift_heart.png

Family: 3D PEAK (full colour). Export: 1024x1024 transparent PNG -> export 256x256 for small icons (<= 40 dp) or 512x512 for heroes; optimise with TinyPNG (target < 60 KB).

a 3D Forest Green gift box with a gold ribbon and, instead of a bow, a plump glossy red love heart sitting on top of the lid.

### S-24 sticker_calendar_check.png

Family: 3D PEAK (full colour). Export: 1024x1024 transparent PNG -> export 256x256 for small icons (<= 40 dp) or 512x512 for heroes; optimise with TinyPNG (target < 60 KB).

a 3D desk calendar in off-white with a Forest Green top band and two gold binding rings, a blank page (no numbers), and a glossy green check-mark badge overlapping its lower-right corner.

### M-01 boarding_1.png

Family: SOFT CLAY ILLUSTRATION (full colour). Export: 1024x1024 transparent PNG -> export 1000x1000 (< 200 KB).

a floating clay globe (the Earth rendered as a smooth Mint #CFF5DD sphere with soft Forest Green #0A7A44 continents, slightly tilted) at the centre; orbiting around it on a gentle tilted ring, four small rounded video cards (landscape rounded rectangles with mint screens, each showing a small white play triangle and a different tiny abstract scene in green tones: mountains, ocean wave, city skyline blocks, a sun), as if videos are travelling around the world; one card at the front is larger and closest to the camera. the YouPeak play-peak mark (a rounded play triangle whose upper edge has a double mountain-peak notch, with a small gold sun circle above the tallest summit) appears as a small gold pin standing on top of the globe like a flag. A few tiny gold sparkles and mint spheres float around. Joyful, spacious, premium.

OUTPUT: one finished illustration, 1024 x 1024 (square) PNG with a fully transparent background, composition centred with generous margins.

### M-02 boarding_2.png

Family: SOFT CLAY ILLUSTRATION (full colour). Export: 1024x1024 transparent PNG -> export 1000x1000 (< 200 KB).

a modern smartphone in soft clay (rounded Dark Forest #1E4D2B body with gently rounded edges, thin bezels, a slightly glossy screen) standing upright, turned 15 degrees to the left, its screen showing a vertical short video layout in abstract form: a big Emerald gradient video area with a large white play triangle, a small round avatar bubble and two short rounded text bars at the bottom, and a vertical column of three small round action buttons on the right edge (heart, bubble, arrow as simple shapes). Popping out of the screen toward the viewer: a big glossy heart in Emerald, a rounded speech bubble in Mint and a gold coin, as if the content is alive. A friendly clay hand (warm brown skin, 4 fingers) holds the phone from the lower-left. Floating mint spheres and gold sparkles.

OUTPUT: one finished illustration, 1024 x 1024 (square) PNG with a fully transparent background, composition centred with generous margins.

### M-03 boarding_3.png

Family: SOFT CLAY ILLUSTRATION (full colour). Export: 1024x1024 transparent PNG -> export 1000x1000 (< 200 KB).

a stylised clay mountain range with three peaks (Forest Green slopes, Dark Forest shadow sides, soft mint snow caps); on the tallest central peak stands a small friendly clay character (young South-Asian creator with dark hair in a bun, wearing a mint hoodie and dark forest trousers) raising one arm in celebration and holding a small gold flag with a white play triangle on it; behind the peak, a large gold sun disc rising with soft rays; a winding path of small rounded video cards climbs the mountain like stepping stones from the bottom-left to the summit. Feels like "reach your peak". Uplifting, triumphant, spacious.

OUTPUT: one finished illustration, 1024 x 1024 (square) PNG with a fully transparent background, composition centred with generous margins.

### M-04 login_image.png

Family: SOFT CLAY ILLUSTRATION (full colour). Export: 1024x1024 transparent PNG -> export 900x900 (< 180 KB).

a welcoming front door concept: a rounded clay doorway / arch in Forest Green standing on a small mint platform, the door open, and from inside a warm gold light spills out; through the doorway we see a glimpse of a glowing mint video screen with a white play triangle. In front of the door, a round Mint welcome mat and a small gold key with a play-triangle bow floating beside it. A few gold sparkles. Meaning: "your account, your door into YouPeak".

OUTPUT: one finished illustration, 1024 x 1024 (square) PNG with a fully transparent background, composition centred with generous margins.

### M-05 profileDoneLogo1.png

Family: SOFT CLAY ILLUSTRATION (full colour). Export: 1024x1024 transparent PNG -> export 800x800 optimised PNG (target < 150 KB).

a large round clay avatar badge (a Mint circle with a simple Forest Green person bust inside, no face details) with a big glossy gold check-mark badge attached at its lower-right, surrounded by a joyful ring of confetti (gold and emerald ribbons, small spheres, tiny play-triangle confetti) all placed close to the avatar so the cluster stays compact. Celebratory, clean.

OUTPUT: one finished illustration, 1024 x 1024 (square) PNG with a fully transparent background, composition centred with generous margins.

### M-06 forgetPasswordLogo.png

Family: SOFT CLAY ILLUSTRATION (full colour). Export: 1024x1024 transparent PNG -> export 800x800 optimised PNG (target < 150 KB).

a chunky clay padlock in Forest Green with a gold shackle, slightly open, with a small curved circular arrow in Emerald wrapping around its right side (meaning reset), and a small mint envelope and a mint phone card floating to the left of it (the two ways to receive the reset code), a gold key with a play-triangle bow hovering above. Designed for a WHITE background: lightest surfaces are #EEF5F0 with soft darker edges so nothing disappears on white.

OUTPUT: one finished illustration, 1024 x 1024 (square) PNG with a fully transparent background, composition centred with generous margins.

### M-07 darkForgetPasswordLogo.png

Family: SOFT CLAY ILLUSTRATION (full colour). Export: 1024x1024 transparent PNG -> export 800x800 optimised PNG (target < 150 KB).

exactly the same composition as the light-mode forgot-password illustration (Forest Green clay padlock with gold shackle slightly open, Emerald circular reset arrow around its right side, a mint envelope and mint phone card floating left, a gold key with a play-triangle bow above), but re-lit for a DARK charcoal (#1C1C1E) screen: slightly brighter Emerald and Mint tones, a stronger mint rim light on every object's edge so the dark green parts separate from the dark background, and a soft emerald glow behind the padlock. No dark-grey parts that could vanish on black.

OUTPUT: one finished illustration, 1024 x 1024 (square) PNG with a fully transparent background, composition centred with generous margins.

### M-08 newPasswordLogo.png

Family: SOFT CLAY ILLUSTRATION (full colour). Export: 1024x1024 transparent PNG -> export 800x800 optimised PNG (target < 150 KB).

a clay shield in Forest Green with a polished gold rim, and in front of it a password field card (a mint rounded rectangle) showing four round dots in a row (no text), with a gold key inserted into the side of the shield; a small glossy check badge at the upper-right of the shield. Calm, secure, fresh. Designed for a WHITE background (lightest surfaces #EEF5F0 with soft darker edges).

OUTPUT: one finished illustration, 1024 x 1024 (square) PNG with a fully transparent background, composition centred with generous margins.

### M-09 darkNewPasswordLogo.png

Family: SOFT CLAY ILLUSTRATION (full colour). Export: 1024x1024 transparent PNG -> export 800x800 optimised PNG (target < 150 KB).

exactly the same composition as the light-mode new-password illustration (Forest Green clay shield with gold rim, mint password card with four dots, gold key, small check badge) but re-lit for a DARK charcoal #1C1C1E screen: brighter Emerald and Mint, strong mint rim light around every silhouette, soft emerald glow behind the shield.

OUTPUT: one finished illustration, 1024 x 1024 (square) PNG with a fully transparent background, composition centred with generous margins.

### M-10 fingerPrint.png

Family: SOFT CLAY ILLUSTRATION (full colour). Export: 1024x1024 transparent PNG -> export 800x800 optimised PNG (target < 150 KB).

a large rounded clay fingerprint made of smooth concentric curved ridges in Forest Green and Emerald, sitting on a mint rounded-square scanner pad, with a thin gold scan line crossing horizontally and a small glossy gold check badge at its lower-right.

OUTPUT: one finished illustration, 1024 x 1024 (square) PNG with a fully transparent background, composition centred with generous margins.

### M-11 empty_image.png  (and noFound.png — same image)

Family: SOFT CLAY ILLUSTRATION (full colour). Export: 1024x1024 transparent PNG -> export 800x800 optimised PNG (target < 150 KB).

a friendly empty-state scene: an open clay cardboard-style box in Mint with Forest Green inner shading, empty inside, tilted slightly; a small magnifying glass in gold leaning against it; above the box, a single small rounded video card floating with a white play triangle and a tiny dotted gold line suggesting it has "flown away". Calm, light, a little playful — it should make an empty screen feel intentional, not broken.

OUTPUT: one finished illustration, 1024 x 1024 (square) PNG with a fully transparent background, composition centred with generous margins.

### M-12 Internet.png  (no-internet page — replaces Internet.jpg)

Family: SOFT CLAY ILLUSTRATION (full colour). Export: 1024x1024 transparent PNG -> export 800x800 optimised PNG (target < 150 KB).

a soft clay Wi-Fi symbol (three stacked rounded arcs and a dot) in Forest Green where the top two arcs are faded to pale mint and slightly broken apart, sitting on a small mint cloud; a tiny sleepy clay cloud face nearby with a small "Z" shape made of a rounded line (no letters needed — use a small curved squiggle); a gold plug and socket floating just apart from each other beneath the cloud, disconnected. Gentle, reassuring, not alarming.

OUTPUT: one finished illustration, 1024 x 1024 (square) PNG with a fully transparent background, composition centred with generous margins.

### M-13 Network_Issue.png

Family: SOFT CLAY ILLUSTRATION (full colour). Export: 1024x1024 transparent PNG -> export 800x800 optimised PNG (target < 150 KB).

a clay satellite dish / antenna in Forest Green on a mint base, with two small broken broadcast arcs in pale mint drifting away and a small amber-orange (#FF981F) rounded warning dot attached to the dish rim. Friendly and simple.

OUTPUT: one finished illustration, 1024 x 1024 (square) PNG with a fully transparent background, composition centred with generous margins.

### M-14 monetization_image.png

Family: SOFT CLAY ILLUSTRATION (full colour). Export: 1536x1024 transparent PNG -> export 1200x800 optimised PNG (target < 180 KB).

a creator's success scene: a clay laptop-like video editor screen (Dark Forest frame, mint screen with a big white play triangle and a small rising green bar chart in the corner) standing on a rounded platform; from the screen, a rising arc of gold YouPeak coins (gold coins with an embossed play-peak mark) flows up and to the right into a plump Forest Green money bag with a gold ₹ emblem; a small clay rocket leaves a mint trail upward at the top-right; an upward Emerald arrow chart made of three rounded bars grows beside the platform.

OUTPUT: one finished illustration, 1536 x 1024 (landscape) PNG with a fully transparent background, composition centred with generous margins.

### M-15 monetization_withdraw.png

Family: SOFT CLAY ILLUSTRATION (full colour). Export: 1024x1024 transparent PNG -> export 800x800 optimised PNG (target < 150 KB).

a clay Forest Green wallet (soft rounded leather look, gold clasp) open at the top, with green rupee notes (embossed ₹, no numbers) and gold coins rising out of it, and a gentle curved Emerald arrow pointing from the wallet toward a small mint bank building (rounded columns, triangular roof) at the right — meaning "cash out to your bank".

OUTPUT: one finished illustration, 1024 x 1024 (square) PNG with a fully transparent background, composition centred with generous margins.

### M-16 wallet_image.png

Family: SOFT CLAY ILLUSTRATION (full colour). Export: 1024x1024 transparent PNG -> export 800x800 optimised PNG (target < 150 KB).

a chunky clay wallet in Dark Forest #1E4D2B with a Forest Green flap and a polished gold clasp, bulging slightly with a green rupee note peeking out and three gold YouPeak coins stacked in front; a small gold sparkle attached to the clasp.

OUTPUT: one finished illustration, 1024 x 1024 (square) PNG with a fully transparent background, composition centred with generous margins.

### M-17 withdrawal_done.png

Family: SOFT CLAY ILLUSTRATION (full colour). Export: 1024x1024 transparent PNG -> export 800x800 optimised PNG (target < 150 KB).

a big glossy Forest Green success circle with a white rounded check mark in the centre, with a gold coin and a green rupee note flying out of its right side along a curved gold dotted trail, and a small burst of confetti (gold, emerald, mint) close around the circle.

OUTPUT: one finished illustration, 1024 x 1024 (square) PNG with a fully transparent background, composition centred with generous margins.

### M-18 gift_image.png

Family: SOFT CLAY ILLUSTRATION (full colour). Export: 1024x1024 transparent PNG -> export 800x800 optimised PNG (target < 150 KB).

a big celebratory clay gift box in Forest Green with a thick gold satin ribbon and a large gold bow, its lid lifted and tilted open, with a fountain of gold YouPeak coins (embossed play-peak mark), a couple of emerald gems and small gold sparkles bursting up out of the box; smaller mint and gold gift boxes sit at its sides. Rich, exciting, rewarding.

OUTPUT: one finished illustration, 1024 x 1024 (square) PNG with a fully transparent background, composition centred with generous margins.

### M-19 referral_image.png

Family: SOFT CLAY ILLUSTRATION (full colour). Export: 1536x1024 transparent PNG -> export 1200x800 optimised PNG (target < 180 KB).

two friendly clay characters (a young South-Asian man in a mint hoodie on the left, a young South-Asian woman in a forest-green jacket on the right) each holding a Dark Forest smartphone, with a glowing curved gold link arc connecting their two phones; along the arc travel a small gift box, a gold coin and a small envelope with a play triangle; both characters smile and wave. Warm, social, trustworthy.

OUTPUT: one finished illustration, 1536 x 1024 (landscape) PNG with a fully transparent background, composition centred with generous margins.

### M-20 convert_coin_image.png

Family: SOFT CLAY ILLUSTRATION (full colour). Export: 1024x1024 transparent PNG -> export 800x800 optimised PNG (target < 150 KB).

a clay exchange machine: on the left a tall stack of gold YouPeak coins, in the middle a rounded Forest Green converter box with a glowing mint window and two circular Emerald arrows on its front, and on the right green rupee notes (embossed ₹, no numbers) coming out neatly stacked. Simple, clear, satisfying.

OUTPUT: one finished illustration, 1024 x 1024 (square) PNG with a fully transparent background, composition centred with generous margins.

### M-21 content_image.png

Family: SOFT CLAY ILLUSTRATION (full colour). Export: 1024x1024 transparent PNG -> export 800x800 optimised PNG (target < 150 KB).

a clay video player card (mint screen, white play triangle, small progress bar) with three floating engagement tokens rising from it — a glossy Emerald heart, a mint speech bubble with three dots, and a Forest Green thumbs-up — each token leaving a short dotted gold trail that ends in a gold coin above. Explains "engage and earn" at a glance.

OUTPUT: one finished illustration, 1024 x 1024 (square) PNG with a fully transparent background, composition centred with generous margins.

### M-22 ads_image.png

Family: SOFT CLAY ILLUSTRATION (full colour). Export: 1024x1024 transparent PNG -> export 800x800 optimised PNG (target < 150 KB).

a clay video screen (mint with a white play triangle) and in front of it a "no ads" concept: a small gold rounded ad card with a bold Forest Green diagonal slash across it (a prohibition sign made of a green ring and slash), with a gold crown sitting on the top-right corner of the screen.

OUTPUT: one finished illustration, 1024 x 1024 (square) PNG with a fully transparent background, composition centred with generous margins.

### M-23 profile_image.png

Family: SOFT CLAY ILLUSTRATION (full colour). Export: 1024x1024 OPAQUE PNG (circle-safe composition) -> export 400x400 (< 40 KB).

a default profile avatar for a circular crop: an opaque soft Mint (#E8F5E9) background filling the whole square with a subtle radial gradient to #D6EEDC at the edges; centred, a simple friendly neutral person bust (round head, rounded shoulders) in Forest Green #0A7A44 clay with a soft Emerald highlight, no face features, no hair details — gender-neutral and calm. The bust's shoulders are cut off by the bottom edge, head centred in the upper-middle, so it looks perfect inside a circle.

OUTPUT: one finished illustration, 1024 x 1024 (square) PNG with an OPAQUE background exactly as described in the subject (this one overrides the transparency rule), composition centred with generous margins.

### M-24 userProfile.png

Family: SOFT CLAY ILLUSTRATION (full colour). Export: 1024x1024 OPAQUE PNG -> export 512x512 (< 60 KB).

the same default avatar concept as the small one (Mint background, neutral Forest Green person bust, no face) but with slightly richer lighting and a thin Emerald ring inset 4% from the edge of the circle area, for large sizes.

OUTPUT: one finished illustration, 1024 x 1024 (square) PNG with an OPAQUE background exactly as described in the subject (this one overrides the transparency rule), composition centred with generous margins.

### M-25 cardImage.png

Family: SOFT CLAY ILLUSTRATION (full colour). Export: 1536x1024 transparent PNG -> export 1200x800 optimised PNG (target < 180 KB).

a premium YouPeak membership card floating at a slight 3D tilt: a landscape rounded card in a deep diagonal gradient from Dark Forest #1E4D2B to Forest Green #0A7A44 with a faint topographic mountain-line pattern, a small gold chip at the left, a gold the YouPeak play-peak mark (a rounded play triangle whose upper edge has a double mountain-peak notch, with a small gold sun circle above the tallest summit) embossed at the upper-right, and a soft emerald glow beneath; NO text, NO numbers, NO names on the card. Behind it at an angle, a second card in polished gold partially visible.

OUTPUT: one finished illustration, 1536 x 1024 (landscape) PNG with a fully transparent background, composition centred with generous margins.

### M-26 empty_videos.png

Family: SOFT CLAY ILLUSTRATION (full colour). Export: 1024x1024 transparent PNG -> export 800x800 optimised PNG (target < 150 KB).

a clay director's clapperboard in Forest Green with gold stripes, lying open, with a small mint video card with a play triangle peeking out from behind it and a tiny gold sparkle — "nothing here yet, create something".

OUTPUT: one finished illustration, 1024 x 1024 (square) PNG with a fully transparent background, composition centred with generous margins.

### M-27 empty_comments.png

Family: SOFT CLAY ILLUSTRATION (full colour). Export: 1024x1024 transparent PNG -> export 800x800 optimised PNG (target < 150 KB).

two clay speech bubbles (a large mint one and a smaller Forest Green one overlapping) with no content inside except a tiny gold "…" made of three dots, and a small clay pencil leaning against them — "be the first to comment".

OUTPUT: one finished illustration, 1024 x 1024 (square) PNG with a fully transparent background, composition centred with generous margins.

### M-28 empty_notifications.png

Family: SOFT CLAY ILLUSTRATION (full colour). Export: 1024x1024 transparent PNG -> export 800x800 optimised PNG (target < 150 KB).

a clay notification bell in Forest Green resting peacefully on a soft mint cloud, with two tiny closed-eye sleeping crescents on the bell (cute, minimal) and three small gold "z"-like curved squiggles (no letters) floating up — "all quiet".

OUTPUT: one finished illustration, 1024 x 1024 (square) PNG with a fully transparent background, composition centred with generous margins.

### M-29 empty_downloads.png

Family: SOFT CLAY ILLUSTRATION (full colour). Export: 1024x1024 transparent PNG -> export 800x800 optimised PNG (target < 150 KB).

a clay mint cloud with a big Forest Green downward arrow below it pointing into an empty open tray / box in Dark Forest; a tiny gold sparkle at the arrow tip.

OUTPUT: one finished illustration, 1024 x 1024 (square) PNG with a fully transparent background, composition centred with generous margins.

### M-30 empty_history.png

Family: SOFT CLAY ILLUSTRATION (full colour). Export: 1024x1024 transparent PNG -> export 800x800 optimised PNG (target < 150 KB).

a clay hourglass in Forest Green with gold caps and a little gold sand, lying beside an empty mint clipboard with a rounded clip — "no history yet".

OUTPUT: one finished illustration, 1024 x 1024 (square) PNG with a fully transparent background, composition centred with generous margins.

### M-31 empty_playlist.png

Family: SOFT CLAY ILLUSTRATION (full colour). Export: 1024x1024 transparent PNG -> export 800x800 optimised PNG (target < 150 KB).

three stacked clay video cards fanned out slightly (Dark Forest, Forest Green and Mint) with no thumbnails, and a round gold plus badge attached to the top card — "create your first playlist".

OUTPUT: one finished illustration, 1024 x 1024 (square) PNG with a fully transparent background, composition centred with generous margins.

### M-32 empty_subscriptions.png

Family: SOFT CLAY ILLUSTRATION (full colour). Export: 1024x1024 transparent PNG -> export 800x800 optimised PNG (target < 150 KB).

a clay Forest Green bell with a mint ribbon next to a round mint avatar bubble with a gold plus badge, and a small rounded 'subscribe' pill shape (no text) in Forest Green below them — "follow creators to see them here".

OUTPUT: one finished illustration, 1024 x 1024 (square) PNG with a fully transparent background, composition centred with generous margins.

### M-33 empty_search.png

Family: SOFT CLAY ILLUSTRATION (full colour). Export: 1024x1024 transparent PNG -> export 800x800 optimised PNG (target < 150 KB).

a big clay magnifying glass with a gold handle and a mint lens, and inside the lens a small puzzled clay video card with a tiny question-mark-shaped curved line (no text) above it; a couple of small mint spheres around.

OUTPUT: one finished illustration, 1024 x 1024 (square) PNG with a fully transparent background, composition centred with generous margins.

### M-34 dialog_account_blocked.png

Family: SOFT CLAY ILLUSTRATION (full colour). Export: 1024x1024 transparent PNG -> export 800x800 optimised PNG (target < 150 KB).

a clay shield in Dark Forest with a muted amber-orange (#FF981F) rounded 'pause' symbol (two bars) on it — firm but not aggressive; a small mint padlock attached at its lower-right.

OUTPUT: one finished illustration, 1024 x 1024 (square) PNG with a fully transparent background, composition centred with generous margins.

### M-35 dialog_update.png

Family: SOFT CLAY ILLUSTRATION (full colour). Export: 1024x1024 transparent PNG -> export 800x800 optimised PNG (target < 150 KB).

a modern smartphone in soft clay (rounded Dark Forest #1E4D2B body with gently rounded edges, thin bezels, a slightly glossy screen) with a large glossy Emerald upward arrow rising out of its screen, surrounded by small gold sparkles and a few rotating clay gears in mint — "new version available".

OUTPUT: one finished illustration, 1024 x 1024 (square) PNG with a fully transparent background, composition centred with generous margins.

### M-36 dialog_exit.png

Family: SOFT CLAY ILLUSTRATION (full colour). Export: 1024x1024 transparent PNG -> export 800x800 optimised PNG (target < 150 KB).

a friendly clay door slightly ajar in Forest Green with warm gold light inside, and a small waving clay hand (warm brown skin) at the doorway — "see you soon".

OUTPUT: one finished illustration, 1024 x 1024 (square) PNG with a fully transparent background, composition centred with generous margins.

### M-37 dialog_logout.png

Family: SOFT CLAY ILLUSTRATION (full colour). Export: 1024x1024 transparent PNG -> export 800x800 optimised PNG (target < 150 KB).

a clay Forest Green arrow leaving a rounded mint doorway toward the right, with a small gold key resting on the door mat.

OUTPUT: one finished illustration, 1024 x 1024 (square) PNG with a fully transparent background, composition centred with generous margins.

### M-38 dialog_delete_account.png

Family: SOFT CLAY ILLUSTRATION (full colour). Export: 1024x1024 transparent PNG -> export 800x800 optimised PNG (target < 150 KB).

a clay avatar card (mint rounded card with a Forest Green person bust) being gently dropped into a rounded Dark Forest bin, with a small amber warning badge at the upper-right of the card. Serious but soft.

OUTPUT: one finished illustration, 1024 x 1024 (square) PNG with a fully transparent background, composition centred with generous margins.

### M-39 dialog_payment_failed.png

Family: SOFT CLAY ILLUSTRATION (full colour). Export: 1024x1024 transparent PNG -> export 800x800 optimised PNG (target < 150 KB).

a clay payment card in Forest Green with a gold chip, tilted, and a round soft Crimson (#D32F2F) badge with a white X attached at its corner, plus a small Emerald circular retry arrow nearby.

OUTPUT: one finished illustration, 1024 x 1024 (square) PNG with a fully transparent background, composition centred with generous margins.

### M-40 dialog_private_content.png

Family: SOFT CLAY ILLUSTRATION (full colour). Export: 1024x1024 transparent PNG -> export 800x800 optimised PNG (target < 150 KB).

a clay video card in Dark Forest with a frosted mint glass overlay and a big polished gold padlock (keyhole shaped like a play triangle) in front of it, with a small gold coin and a small gold crown floating on either side — "unlock with coins or premium".

OUTPUT: one finished illustration, 1024 x 1024 (square) PNG with a fully transparent background, composition centred with generous margins.

### M-41 dialog_subscribed_success.png

Family: SOFT CLAY ILLUSTRATION (full colour). Export: 1024x1024 transparent PNG -> export 800x800 optimised PNG (target < 150 KB).

a clay Forest Green bell ringing (two small emerald motion arcs attached at its sides) with a gold check badge and a few confetti pieces close around.

OUTPUT: one finished illustration, 1024 x 1024 (square) PNG with a fully transparent background, composition centred with generous margins.

### M-42 hero_creator_vip.png

Family: SOFT CLAY ILLUSTRATION (full colour). Export: 1536x1024 transparent PNG -> export 1200x800.

a stage-like scene: five peak-shield tier emblems (from small bronze-mint to large platinum) rising like stairs from left to right on rounded mint steps, the last and highest one glowing with a gold crown; a clay creator character (camera in hand, mint hoodie) climbing the steps; gold coins sprinkled on each step, increasing in number. Aspirational.

OUTPUT: one finished illustration, 1536 x 1024 (landscape) PNG with a fully transparent background, composition centred with generous margins.

### M-43 hero_starter_pass.png

Family: SOFT CLAY ILLUSTRATION (full colour). Export: 1536x1024 transparent PNG -> export 1200x800.

a clay checklist board (mint board, three rounded rows each with a Forest Green check circle) with a glowing lightning bolt emblem at the top, a progress bar at the bottom filling with gold, and a stack of gold coins growing beside it; a small hourglass with gold sand at the left — meaning "complete tasks, watch hours, earn more daily".

OUTPUT: one finished illustration, 1536 x 1024 (landscape) PNG with a fully transparent background, composition centred with generous margins.

### M-44 hero_premium.png

Family: SOFT CLAY ILLUSTRATION (full colour). Export: 1536x1024 transparent PNG -> export 1200x800.

a luxurious clay composition: a big gold crown with emerald gems sitting on top of a Dark Forest video screen (white play triangle), with a green 'download' cloud at the left and a slashed ad card at the right (a gold card with a green prohibition ring), floating gold sparkles and a soft golden glow behind the crown. Premium, desirable.

OUTPUT: one finished illustration, 1536 x 1024 (landscape) PNG with a fully transparent background, composition centred with generous margins.

### M-45 hero_promote_video.png

Family: SOFT CLAY ILLUSTRATION (full colour). Export: 1536x1024 transparent PNG -> export 1200x800.

a clay rocket in Forest Green with gold fins launching a video card upward into a sky of small mint clouds; below, a small crowd of tiny rounded avatar bubbles looking up; an upward-growing Emerald bar chart at the side.

OUTPUT: one finished illustration, 1536 x 1024 (landscape) PNG with a fully transparent background, composition centred with generous margins.

### M-46 hero_help_center.png

Family: SOFT CLAY ILLUSTRATION (full colour). Export: 1024x1024 transparent PNG -> export 800x800 optimised PNG (target < 150 KB).

a friendly clay support headset in Forest Green with a gold microphone boom resting on a mint speech bubble that contains a rounded question-mark-shaped curve (drawn as a shape, not a letter), with a small FAQ-like stack of three rounded mint cards beside it.

OUTPUT: one finished illustration, 1024 x 1024 (square) PNG with a fully transparent background, composition centred with generous margins.

### M-47 hero_grievance.png

Family: SOFT CLAY ILLUSTRATION (full colour). Export: 1024x1024 transparent PNG -> export 800x800 optimised PNG (target < 150 KB).

a balanced clay scale of justice in gold standing on a Forest Green base, with a mint document card on one pan and a small shield with a check on the other, perfectly level — "fair and transparent".

OUTPUT: one finished illustration, 1024 x 1024 (square) PNG with a fully transparent background, composition centred with generous margins.

### M-48 hero_go_live.png

Family: SOFT CLAY ILLUSTRATION (full colour). Export: 1536x1024 transparent PNG -> export 1200x800 optimised PNG (target < 180 KB).

a clay ring light (mint ring) with a Dark Forest phone mounted in the centre on a small tripod, the phone screen showing a crimson live dot and floating hearts, and small clay broadcast arcs in emerald radiating from the phone.

OUTPUT: one finished illustration, 1536 x 1024 (landscape) PNG with a fully transparent background, composition centred with generous margins.

### M-49 hero_create_channel.png

Family: SOFT CLAY ILLUSTRATION (full colour). Export: 1024x1024 transparent PNG -> export 800x800 optimised PNG (target < 150 KB).

a clay channel banner card (landscape mint card with a Forest Green mountain landscape) with a round avatar bubble overlapping its lower-left edge and a glossy gold plus badge; a small clay paintbrush and a camera floating beside it — "build your channel".

OUTPUT: one finished illustration, 1024 x 1024 (square) PNG with a fully transparent background, composition centred with generous margins.

### M-50 default_channel_banner.png

Family: SOFT CLAY ILLUSTRATION (full colour). Export: 1536x1024 OPAQUE PNG -> crop to 16:9 1600x900 (< 200 KB).

an opaque full-bleed decorative banner (no transparency): soft layered clay mountain ridges from pale mint in the back to Forest Green and Dark Forest in the front, a gold sun low on the right, a subtle topographic line pattern in the sky, calm and elegant, no objects in the lower-left quarter (the avatar sits there). No text.

OUTPUT: one finished illustration, 1536 x 1024 (landscape) PNG with an OPAQUE background exactly as described in the subject (this one overrides the transparency rule), composition centred with generous margins.

### M-51 video_placeholder.png

Family: SOFT CLAY ILLUSTRATION (full colour). Export: 1536x1024 OPAQUE PNG -> crop to 16:9 960x540 (< 60 KB).

an opaque full-bleed 16:9 placeholder: a smooth diagonal gradient from Dark Forest #1E4D2B to Forest Green #0A7A44 with a very faint topographic contour pattern, and in the exact centre a soft Mint (#E8F5E9 at 35% opacity) the YouPeak play-peak mark (a rounded play triangle whose upper edge has a double mountain-peak notch, with a small gold sun circle above the tallest summit). Minimal and elegant.

OUTPUT: one finished illustration, 1536 x 1024 (landscape) PNG with an OPAQUE background exactly as described in the subject (this one overrides the transparency rule), composition centred with generous margins.

### M-52 shade_image.png

Family: SOFT CLAY ILLUSTRATION (full colour). Export: 1024x1536 transparent PNG -> export 720x1280.

ONLY a smooth vertical gradient overlay, no objects: fully transparent at the top 45% of the image, then fading smoothly to Charcoal #0D0D0E at 70% opacity at the very bottom, perfectly smooth, no banding, no noise. (Override the illustration instructions: this is a pure technical gradient.)

OUTPUT: one finished illustration, 1024 x 1536 (portrait) PNG with a fully transparent background, composition centred with generous margins.

### N-01 play_feature_graphic.png

Family: BRAND IDENTITY. Export: Generate 1536x1024, crop to exactly 1024x500 (JPG or 24-bit PNG, no transparency).

a Google Play feature graphic (final crop 1024 x 500, so keep all important content inside a centred band of 1536 x 750 in the generated image). Left 45%: the YouPeak app icon (rounded squircle with Dark Forest -> Forest Green -> Emerald gradient, white play-peak triangle and gold sun dot) large and confident, with a soft emerald glow. Right 55%: two modern smartphones in soft clay, overlapping at slight angles, one showing an abstract vertical short video (Emerald gradient with a white play triangle and a column of round action buttons), the other showing an abstract rewards screen (gold coins, a green progress bar, a gift box). Background: deep Dark Forest #0F2E1A to Forest Green gradient with elegant layered mountain ridges at the bottom and a gold sunrise glow behind the phones. No text (text is added later in Figma), no device brand logos.

### N-02 store_screenshot_bg.png

Family: BRAND IDENTITY. Export: Generate 1024x1536 opaque, upscale to 1080x1920.

an opaque portrait background for app-store screenshots: a smooth vertical gradient from Forest Green #0A7A44 at the top to Dark Forest #1E4D2B at the bottom, soft layered mint-and-green mountain ridge silhouettes along the bottom 20%, a subtle topographic contour line pattern (white at 5% opacity), and a soft radial light in the middle where the phone screenshot will sit. Leave the top 22% calm for a headline. No text, no objects, no phone.

### N-03 share_card_bg.png

Family: BRAND IDENTITY. Export: Generate 1024x1536 opaque, crop to 1080x1350 (4:5).

an opaque 4:5 share-card background: Dark Forest #1E4D2B to Forest Green #0A7A44 diagonal gradient, a large empty rounded-rectangle area in the upper 65% outlined by a very soft mint glow (the video thumbnail is placed there by the app), a small YouPeak play-peak mark (white rounded play triangle with a double mountain-peak notch and a gold sun dot) at the bottom-left, and elegant mint mountain ridges along the bottom. Leave the bottom-right 40% x 20% empty for the title text. No text.

### N-04 referral_share_banner.png

Family: SOFT CLAY ILLUSTRATION (full colour). Export: Generate 1536x1024 opaque, crop to 1200x628.

an OPAQUE (override transparency) landscape promotional banner with a soft Mint #E8F5E9 to white background: on the right, a big clay gift box in Forest Green with a gold ribbon bursting with gold YouPeak coins and emerald sparkles; on the left, two small friendly clay characters high-fiving; lots of calm empty space in the left-centre for a headline added later. No text.

OUTPUT: one finished illustration, 1024 x 1024 (square) PNG with a fully transparent background, composition centred with generous margins.
