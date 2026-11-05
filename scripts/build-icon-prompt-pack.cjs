const fs = require('fs');
const path = require('path');
const root = process.cwd();
const dir = path.join(root,'Youpeak_Flutter/assets/icons');
const out = path.join(root,'docs/reports/youpeak-icon-prompts');
fs.mkdirSync(out,{recursive:true});
const files = fs.readdirSync(dir).sort();
const dartFiles=[];
function walk(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);if(e.isDirectory())walk(p);else if(p.endsWith('.dart'))dartFiles.push(p);}}
walk(path.join(root,'Youpeak_Flutter/lib'));
const source = dartFiles.map(p=>({p,s:fs.readFileSync(p,'utf8')}));
const icons = fs.readFileSync('Youpeak_Flutter/lib/core/assets/app_icons.dart','utf8');
const aliases = new Map();
for(const m of icons.matchAll(/static const String (\w+)\s*=\s*["']assets\/icons\/([^"']+)["']/g)){const a=aliases.get(m[2])||[];a.push(m[1]);aliases.set(m[2],a);}
const subjects={};
function map(names,subject){for(const n of names.split('|'))subjects[n+'.png']=subject;}
map('home|boldHome','Home: a softly squared house with a generous doorway, balanced roof and no chimney');
map('Video|boldVideo','Bites: one upright rounded video tile with an optically centered play cutout; clearly portrait and distinct from Subscriptions');
map('videoCircle|boldPlay','Subscriptions: two offset landscape video cards with one small play cutout on the front card; communicate followed channels rather than playback alone');
map('library|boldDocument','Library: three upright spines, with the last leaning slightly; do not resemble a document or a shopping bag');
map('add|plus','Create: one perfectly balanced plus, with equal arms and rounded ends; do not include its button background');
map('search','Search: circular lens with a short diagonal handle');
map('notification|noty_icon','Notifications: a simple bell with visible clapper; no baked-in unread dot');
map('profile|profileLogo','Account/channel: neutral head and shoulders with no facial details');
map('incognito','Incognito: a simple shield with a small eye crossed by one diagonal stroke; express private browsing without a cartoon disguise');
map('subscription_plan','Manage subscription: a rounded membership card with a small check in one corner');
map('earn_reward|earn_reward_icon','Earn rewards: a small gift box with one clean ribbon and a subtle star cutout');
map('Wallet','Wallet: slim rounded wallet with a distinct short closure tab');
map('activity','Time watched: a clock face with a small play cutout; distinguish from watch history');
map('monetization','Monetization: one coin with a small rising chart, no currency letters');
map('king','Creator VIP pass: restrained three-point crown with a flat baseline');
map('trending|promote_video','Video promotion: upward trending arrow above a short baseline');
map('setting','Settings: restrained six-tooth gear with a generous circular center');
map('infoSquare','Help center: rounded speech bubble with one question mark');
map('shieldDone','Grievance and protection: simple shield with a checkmark');
map('logout','Log out: open doorway with an outward arrow; do not confuse with delete');
map('delete_account','Delete account: neutral account silhouette with a small minus badge');
map('dark_mode','Dark appearance: clean crescent moon with no stars');
map('translate|language','Language: globe with two meridians and one equator; labels are drawn separately');
map('TimeCircle|history_icon|timeCirclePink','Watch or transaction history: a clock with a counterclockwise history arrow');
map('watch_later','Watch later: bookmark outline containing a small clock');
map('download|download_bold|download_1|videoDownload','Download: downward arrow entering a shallow tray');
map('upload','Upload: upward arrow leaving a shallow tray');
map('play|play_video','Play: a single right-facing triangle with subtly softened corners');
map('pause|puse','Pause: two evenly spaced vertical bars');
map('Next','Next: right-facing play triangle followed by a vertical bar');
map('Previous','Previous: vertical bar followed by a left-facing play triangle');
map('Backward10s','Replay ten seconds: counterclockwise circular arrow; reserve clear space for a separately typeset 10');
map('Forward10s','Forward ten seconds: clockwise circular arrow; reserve clear space for a separately typeset 10');
map('Expand','Fullscreen: four outward-facing corner brackets');
map('Collapse','Exit fullscreen: four inward-facing corner brackets');
map('caption|Subtitle','Captions: rounded rectangle with two short horizontal caption strokes; actual CC letters may be typeset separately');
map('swape','Loop playback: two bent arrows forming a closed horizontal loop');
map('shuffle','Shuffle: two crossing directional arrows, with one clear overpass');
map('watch|speed|boldSpeed','Playback speed: clean semicircular speedometer with one diagonal needle');
map('Timer','Timer: compact stopwatch with one top stem');
map('tv','Watch on television: landscape display with a short central stand');
map('like|like_bold','Like: upright thumb with a simple wrist cuff');
map('dislike_icon|dislike_bold','Dislike: downward thumb with a simple wrist cuff');
map('comment|comment_1|Chat|live_chat','Comments/chat: rounded speech bubble with a short tail and two interior strokes');
map('reply','Reply: left-turning arrow with a short curved stem');
map('share_icon|boldShare','Share: three small connected nodes with generous separation');
map('bookmark|boldBookmark','Save: vertical bookmark with a centered V notch');
map('send|text_send','Send: simple paper plane angled up and right, with one clean fold');
map('edit|editButton|ic_edit_video','Edit: diagonal pencil with a clearly defined nib');
map('ic_delete_video|remove|clear_icon','Delete/clear: simple trash bin with lid and two vertical slots');
map('copy_icon','Copy: two overlapping rounded rectangles');
map('flage|flages|flag|report','Report: single waving flag on a straight pole; do not use a national flag');
map('lock|lock2|password','Locked/password: closed padlock with a generous shackle opening');
map('show','Show password: almond-shaped eye with a clear round pupil');
map('hide','Hide password: matching eye crossed by one diagonal stroke');
map('email','Email: rounded envelope with one simple folded flap');
map('fingerPrint','Fingerprint: three nested open ridge loops, readable at small size');
map('camera','Camera: rounded camera body, small upper shoulder, single circular lens');
map('flip','Flip camera: two curved arrows surrounding a small camera lens');
map('flash','Flash: one compact lightning bolt');
map('gallery|set_thumbnail','Gallery/thumbnail: rounded image frame with one small sun and one simple hill');
map('music|sound','Sound/music: two connected musical notes');
map('audio','Microphone: rounded microphone capsule on a U-shaped stand');
map('recording','Record: one solid circle; button surround is drawn separately');
map('effects','Effects: one large four-point sparkle and one small sparkle');
map('beauty','Beauty adjustment: minimalist face contour with a single sparkle');
map('heartEffects','Heart effect: one heart with two small sparkles');
map('colorFilter|filter|boldFilter','Filter: three horizontal adjustment lines with alternating circular sliders');
map('go_live','Go live: small central broadcast dot with two symmetrical signal arcs on each side');
map('swap','Swap: two parallel arrows pointing in opposite directions');
map('location|5','Location: teardrop map pin with an open round center');
map('0','Video description: rounded document with three clean horizontal text strokes');
map('1|visibility','Visibility: open eye with a centered circular pupil');
map('2|9|Bold3User','Audience: three neutral head silhouettes; central person slightly forward');
map('3|Calendar|date_icon','Schedule: calendar with two upper binding tabs and one small clock');
map('4','Allow comments: speech bubble with a small checkmark');
map('arrow_back','Back: one left-facing arrow with a straight stem');
map('arrow_right','Next: one right-facing chevron');
map('arrow_down|ArrowDown1|boldArrowDown','Expand: one downward-facing chevron');
map('arrow_double_right','Double next: two evenly spaced right-facing chevrons');
map('arrowRightCircle','Continue: right-facing arrow inside a thin circle');
map('up_arrow_bold','Incoming/rise: one upward arrow');
map('down_arrow_bold','Outgoing/fall: one downward arrow');
map('moreCircle|moreThreeCircle','More actions: three evenly spaced horizontal dots; no surrounding disk');
map('moreSquare','More options: three horizontal dots inside a softly rounded square');
map('close_icon|closeSquare','Close: two diagonal strokes forming an optically balanced X');
map('done|accept|tick|green_tick|white_tik','Success/selected: one clear checkmark with a short left arm');
map('dangerSquare','Warning: rounded triangle enclosing a simple exclamation mark');
map('square','Checkbox: empty softly rounded square');
map('scan','Scan: four corner brackets surrounding a minimal scan line');
map('Paper|document','Document: rounded page with one folded corner and two text strokes');
map('internet','Website: simple globe with two meridians and one equator');
map('ad_icon|ad_round','Advertisement: rounded landscape video panel with a small corner sparkle; AD label belongs in live text');
map('engagement_icon','Engagement: small play tile with one comment bubble and one heart, simplified to remain clear');
map('gift_icon|daily_gift_icon','Daily gift: small ribboned gift box; daily status is displayed separately');
map('referral_icon','Referral: two neutral people linked by a short sharing arrow');
map('convert_icon','Convert balance: two opposing curved arrows around one plain coin');
map('coin_icon|coin_icon_grey|coin','Coin: one circular coin with a recessed abstract peak symbol, no currency text');
map('videoBlack','Video: landscape rounded frame with a centered play triangle');
map('premium_download','Premium download: downward tray arrow with a tiny crown above it');
map('video_charges|paid','Paid content: small video tile with a coin at its lower-right corner');
map('free','Free content: small video tile with a clean checkmark; do not bake FREE text into the icon');

const official=/^(apple_logo|google_logo|facebook|facebookLogo|instagram|twitter|whatsApp|paypal|ic_paypal_logo|razorPay|stripe|paystack_image|cash_free_icon|flutter_wave_icon|flutter_wave_logo)\./;
const brand=/^(app_logo|app_logo_icon|appLogo|logo|splash_logo|ic_launcher_foreground|ic_notification|youpeak_wordmark)\./;
const back=/^(shade_image|share_card_bg|store_screenshot_bg|play_feature_graphic|default_channel_banner|referral_share_banner|splash_image)\./;
const artwork=/^(hero_|empty_|dialog_|sticker_|notif_|tier_|react_|coin_pack_|partner_)|^(boarding_[123]|login_image|profile_image|userProfile|profileDoneLogo1|forgetPasswordLogo|darkForgetPasswordLogo|newPasswordLogo|darkNewPasswordLogo|monetization_image|monetization_withdraw|wallet_image|wallet_3d|withdraw_bank|promo_megaphone|referral_image|gift_image|content_image|convert_coin_image|withdrawal_done|congratulation_icon|earn_reward|ads_image|premium_image|save_done_[12]|cardImage|Internet|Network_Issue|noFound|king_round|verified_badge|premium_badge|paid_video_badge|live_badge|new_badge|top_creator_badge|video_placeholder)\./;
const human=n=>n.replace(/\.[^.]+$/,'').replace(/([a-z])([A-Z])/g,'$1 $2').replace(/_/g,' ').replace(/^react /,'reaction: ').replace(/^notif /,'notification: ');
const artOverrides={
 'boarding_1.png':'Discover: three floating video cards orbiting a simple play tile; leave the lower area clear for onboarding copy',
 'boarding_2.png':'Create: camera lens, one portrait video tile and two restrained sparkles; celebrate personal creativity',
 'boarding_3.png':'Grow: an abstract ascending peak with a modest coin and a community symbol; avoid promises of wealth',
 'hero_creator_vip.png':'Creator VIP: sculpted emerald membership card with a small champagne-metal crown',
 'hero_starter_pass.png':'Tasker Starter Pass: a clean task card with three completed checks and one modest reward token',
 'hero_premium.png':'Premium: a refined emerald play tile elevated beside one satin-metal crown',
 'hero_promote_video.png':'Video promotion: a clean megaphone projecting three ascending video tiles',
 'hero_help_center.png':'Help: a softly sculpted headset surrounding a calm speech bubble',
 'hero_grievance.png':'Grievance: protective shield supporting an open speech bubble; calm and respectful',
 'hero_go_live.png':'Go live: camera tile broadcasting two restrained concentric signal arcs',
 'hero_create_channel.png':'Create channel: a landscape video card emerging from a personalized channel frame',
 'profile_image.png':'Neutral default avatar: head and shoulders with no age, gender, facial details or celebrity resemblance',
 'video_placeholder.png':'Unavailable video thumbnail: simple play tile over a quiet abstract emerald surface; clearly a placeholder, never fake content',
 'verified_badge.png':'Verified status: compact blue scalloped seal with one high-contrast white check; clear at 16 pixels',
 'partner_district_badge.png':'District partner: a geometric location pin inside a restrained seal; distinct from verification',
 'partner_digital_badge.png':'Digital partner: three connected nodes inside a restrained seal; distinct from verification',
 'dialog_delete_account.png':'Account deletion: neutral account tile beside a small minus sign, composed soberly without celebration',
 'dialog_payment_failed.png':'Payment failed: payment card beside a small amber warning marker; no broken coins or dramatic explosion',
 'dialog_account_blocked.png':'Account restricted: simple shield and closed padlock, composed calmly without punishment imagery',
 'dialog_private_content.png':'Private content: closed padlock in front of a video tile',
 'dialog_subscribed_success.png':'Subscription confirmed: two channel cards and one clean success check; restrained celebration',
 'dialog_logout.png':'Log out: a profile tile gently moving through a doorway; neutral tone',
 'dialog_exit.png':'Exit app: simple open doorway with a subtle outward arrow; neutral tone',
 'dialog_update.png':'Update available: app tile with an upward arrow and one subtle sparkle',
 'Network_Issue.png':'Offline: disconnected network arcs beside one quiet cloud; reassuring, no panic imagery',
 'Internet.png':'Connection restored or internet status: clean globe with restrained connection arcs',
 'Internet.jpg':'Internet status legacy illustration: clean globe with restrained connection arcs; export without an artificial white box when replacing with PNG',
 'empty_image.png':'Empty state: one open rounded tray with a single floating rounded card',
 'empty_search.png':'No search results: magnifying lens beside an empty video card, no sad face',
 'empty_videos.png':'No videos: one empty landscape video frame and a small play symbol',
 'empty_comments.png':'No comments: two empty speech bubbles, one slightly behind the other',
 'empty_notifications.png':'No notifications: calm bell above a quiet shallow tray',
 'empty_downloads.png':'No downloads: downward arrow hovering above an empty download tray',
 'empty_history.png':'No history: simple clock beside an empty timeline',
 'empty_playlist.png':'No playlists: three stacked video cards with a small plus',
 'empty_subscriptions.png':'No subscriptions: two channel cards linked by a subtle plus',
 'react_100.png':'Perfect reaction: create only a celebratory underline and compact framing; typeset the exact 100 separately to guarantee accuracy',
 'react_peak.png':'Peak reaction: friendly compact emerald mountain summit with one soft cyan highlight',
 'react_coin_eyes.png':'Coin-eyes reaction: friendly face with two modest coin-shaped eyes; playful without exaggerated wealth imagery',
 'react_crown_face.png':'Crown reaction: friendly face wearing a restrained three-point champagne crown',
};
const glyphStyle='Create ONE production UI glyph for YouPeak. Flat monochrome black on a truly transparent background. Use a 24 by 24 design grid, approximately 2-unit uniform strokes, rounded caps and joins, consistent optical weight, roughly 2-unit outer clearance, generous negative space and clean geometry. It must remain recognizable at 20, 22 and 24 logical pixels. Center optically. No gradient, 3D, shadow, texture, glow, background plate, wordmark, decorative border, mockup or watermark. Deliver a single isolated 1024 by 1024 transparent PNG concept, with matching scale to the approved family. A designer must redraw or clean the accepted concept as true SVG paths; do not claim a raster image is SVG.';
const artStyle='Create ONE premium YouPeak brand illustration. Match the supplied YouPeak logo in spirit: emerald and fresh green moving through teal into restrained blue. Use forest green #0A7A44 as the grounding color, teal and cyan as accents, a small amount of cobalt blue, soft ivory highlights and charcoal details. Use sculpted rounded geometry, satin materials, subtle depth, one consistent upper-left soft light, restrained contact shading and generous negative space. Mature, calm, precise and editorial. No glossy toy plastic, glassmorphism, excessive neon, glitter, clutter, photoreal hands, fake text, watermark or device mockup. Isolated on a genuinely transparent 1024 by 1024 canvas with 12 percent safe padding. Keep shadows within the alpha silhouette. Match the approved family in camera angle, material, lighting and optical scale.';
let rows=[];
for(const f of files){
 let type=official.test(f)?'Official third-party asset':brand.test(f)?'Brand/system asset':back.test(f)?'Background/composition':f.endsWith('.json')?'Motion asset':artwork.test(f)?'Illustration / badge / reaction':'UI glyph';
 let used=source.filter(x=>x.s.includes('assets/icons/'+f)|| (aliases.get(f)||[]).some(a=>x.s.includes('AppIcons.'+a))).map(x=>path.relative(root,x.p).replaceAll('\\','/'));
 let subject=subjects[f]||artOverrides[f]||human(f);
 let prompt='';
 if(type==='Official third-party asset')prompt='Do not regenerate or restyle this third-party mark. Obtain the current official vector or high-resolution asset from the brand owner, preserve its proportions, clear space and permitted colors, and match only its displayed optical size to nearby controls. Existing file: '+f+'. Verify the exact provider identity before replacement.';
 else if(type==='Motion asset')prompt='Create a subtle looping microphone listening animation using the YouPeak UI geometry: three to five rounded waveform bars, stable baseline, small amplitude changes, calm timing, no flashing or background. Deliver editable vector motion through a supported animation pipeline; a still-image generator cannot deliver a working Lottie JSON. Inspect the consuming widget before changing this file.';
 else if(type==='Brand/system asset')prompt=f==='ic_notification.png'?'Derive a simplified silhouette of the supplied YouPeak camera/play mark. Solid white foreground pixels with transparent surrounding area; no wordmark, border, gradients or colored background. Readable at tiny status-bar scale. This is a notification small icon, not a full-color launcher. Validate in Android notification previews.':f==='youpeak_wordmark.png'?'Reconstruct the approved YouPeak wordmark from authorized vector source, preserving exact spelling, case, proportions and brand identity. Export transparent light-surface and dark-surface variants. Do not use image-generation lettering as production typography. Pair with the approved camera/play mark.':'Use the supplied YouPeak reference as the identity source. Refine the camera/play symbol through precise vector reconstruction, preserving its recognizable rounded camera body, white play cutout and detached lens silhouette. Retain the green-to-teal-to-blue progression for brand artwork. Create a symbol-only variant without text or baked-in outer launcher mask. For '+f+', match its actual consumer and framing; launcher layers, splash mark and header logo need separate exports. Do not redesign the wordmark with an image generator.';
 else if(type==='Background/composition')prompt='Create a premium YouPeak background for '+human(f)+'. Use a very quiet forest-green-to-teal field with one restrained blue accent and large rounded abstract forms derived from the camera/play logo. Keep at least 60 percent of the composition visually quiet for separately rendered content. No text, UI, fake thumbnails, logos, borders or watermark. For channel, referral and share compositions use a wide landscape draft; for store screenshot backgrounds use a portrait draft. Treat dimensions as a draft only: inspect the consuming widget or publishing template before final export. Keep all live text and logos separate. Provide editable layers where possible.';
 else if(type==='UI glyph')prompt=glyphStyle+' Subject: '+subject+'.'+ (/bold|_bold/.test(f)?' Selected state: use a coherent filled silhouette with clean cutouts, maintaining the same outer geometry as the outline version.':' Default state: outline geometry unless the symbol is inherently solid, such as play, pause, dots or record.');
 else {
  subject=artOverrides[f]||subjects[f]||human(f);
  if(f.startsWith('coin_pack_'))subject='Coin pack '+f.match(/\d+/)[0]+' of six: the same abstract peak coin design, with progressively greater coin quantity from a single coin in pack one to a compact balanced cluster in pack six; keep camera, scale, lighting and coin material consistent; no denomination or value text';
  if(f.startsWith('tier_'))subject=human(f)+': use the same membership medallion silhouette as the other tiers. Creator tiers progress classic graphite, starter emerald, silver satin silver, gold champagne gold, platinum cool platinum; tasker free uses a simple open peak and levels one through four add one through four clean upward steps. Differentiate by shape as well as material; no numerals, prices, stars implying verification or baked-in labels';
  prompt=artStyle+' Subject: '+subject+'.';
  if(/badge/.test(f))prompt+=' Badge exception: simplify to flat or very shallow depth, strong silhouette and one focal symbol so it reads at 16–24 pixels. No tiny ornament or text; render LIVE, NEW or tier names separately in the interface.';
  if(f.startsWith('react_'))prompt+=' Reaction exception: friendly expressive emoji, bold readable facial features, identical face proportions and camera angle to the approved reaction family; emotion must read at 24–32 pixels. Preserve the meaning of its existing Unicode reaction; no sticker border.';
  if(/darkForget|darkNew/.test(f))prompt+=' Dark-surface variant of the matching light illustration: preserve composition and geometry, adjust highlights and shadow contrast for charcoal; do not merely invert colors.';
 }
 rows.push({file:f,type,aliases:(aliases.get(f)||[]).join(', '),references:used.length,source:used.join('; '),prompt});
}
const material=[...new Set(source.flatMap(x=>[...x.s.matchAll(/(?<![A-Za-z])Icons\.(\w+)/g)].map(m=>m[1])))].sort();
const intro=`# YouPeak — complete premium icon prompt pack

Prepared from the Flutter source on 15 October 2026. This is an icon/artwork design inventory and prompt deliverable, not a runtime, accessibility, security or complete functional app audit. No application files were changed.

## What I found in your project

- Android Flutter application: \`Youpeak_Flutter/\`.
- Bottom navigation: Home, Bites, central Create, Subscriptions, Library. Four destinations plus an action, not five destinations.
- Create menu: Create a Bite, Upload a video, Go live.
- Account/profile menu: Incognito, Create/Your channel, Manage subscription, Earn rewards, My wallet, Time watched, Monetization, Creator VIP pass, Video promotion, Settings, Help center, Log out, Delete account. Some entries depend on account state.
- Settings includes history, autoplay, dark appearance, payments history, language, notifications, privacy policy and grievance officer.
- Library includes history, your videos, Android downloads, new playlist, watch later and playlists.
- The wide sidebar is a web layout in \`wide_side_nav.dart\`. I found no Flutter \`Drawer(\` or \`drawer:\` declaration. Use the account-menu prompts for the side drawer you intend to introduce, but that drawer is not currently established in this source.
- Other feature families include authentication/OTP, onboarding, search, channels, video playback, comments/replies, Bites capture, live, uploads/editing, paid videos, subscriptions, rewards/tasker, coins/conversion, referrals, monetization, wallet/withdrawal, ad credits, campaigns, creator/tasker tiers, help, reporting and access restrictions.
- There are ${files.length} files in \`assets/icons\`. That is not ${files.length} unique required designs: aliases, state variants, official provider marks, legacy files and backgrounds are included. Every existing file has a treatment below; prioritize referenced assets first.
- Your current app uses forest green \`#0A7A44\`, charcoal \`#1C1C1E\` and mint \`#E8F5E9\`. The supplied logo uses a brighter green–teal–blue progression. The proposed direction keeps forest green for everyday UI and uses the brighter progression selectively in brand artwork.

## Recommended direction: YouPeak Precision

Use one restrained rounded geometric icon family. Navigation, player controls and forms should be flat and crisp; larger feature illustrations can have subtle satin depth. Reserve gold for coins and membership, blue for selective brand/verified accents, red for destructive/live states, and amber for warnings. These are proposed design decisions, not a claim that the present app already uses them consistently.

Do not put the full logo gradient, camera outline, a background tile or a tiny crown inside every icon. Recognition, consistent optical weight and spacing create the premium impression. Let icons support the content.

## How to use these prompts

1. Attach your YouPeak logo as a brand reference. First approve Home, Bites, Subscriptions, Library, Search, Wallet, Settings and Like as one coherent family.
2. Generate each deliverable individually using its complete prompt below. Use the approved family as a second reference for every subsequent generation. A contact sheet is useful for review, but must not be your final production sprite sheet.
3. Small UI symbols should ultimately be hand-cleaned SVG/vector paths or consistent code-drawn icons. Raster generation produces concepts and cannot guarantee valid SVG. Your current code uses \`Image.asset\`; SVG adoption needs a compatible renderer and widget changes. PNG replacement must preserve current paths and the expected alpha/tint behavior.
4. Generate outline and selected versions only where states need distinct shapes. Dark mode and disabled state should usually use runtime tint/opacity, not independent drawings. Keep destructive meaning explicit with labels and shape, not color alone.
5. Full-color artwork belongs in the existing \`AppVisuals\`/\`AppArtwork\` flow and must not receive monochrome UI tint. For the bottom bar, the current code explicitly tints PNGs: colored replacement images would lose their intended colors.
6. Existing file paths are case-sensitive when packaged for some targets. Preserve exact names during drop-in replacement, including \`Video.png\`, \`Wallet.png\`, \`TimeCircle.png\`, and historical misspellings such as \`puse.png\` and \`swape.png\`. Rename only with corresponding code changes.
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

Copy-ready additional glyph prompt: "${glyphStyle} Subject: [insert one of the specific semantic refinements above]."

## Production handoff and acceptance

- UI master: true 24 × 24 vector geometry, roughly 2-unit strokes; inspect actual 20/22/24/28 sizes. Do not simply scale a detailed illustration into an icon.
- For existing PNG widgets, export transparent 1x/2x/3x/4x assets at their actual logical display size; a 24px glyph therefore needs 24/48/72/96px exports. Keep a large source master separate.
- Selected states retain the same geometry, baseline and perceived size. Runtime colors: forest-green selection on light surfaces; use a sufficiently visible lighter brand tint on dark surfaces after checking contrast. Do not rely on color alone for state.
- Check on white, mint and charcoal backgrounds and over busy video. Player icons need a consistent scrim or control container supplied by the UI. Tap areas can be larger than visible glyphs; use a comfortable approximately 48 logical pixel target in the implementation.
- Artwork masters: transparent 1024px source is a working default, then export for the actual rendered dimensions. Banner dimensions must follow their actual crop behavior, not a universal square.
- Launcher: deliver separate foreground, background and monochrome design layers; let Android apply its launcher mask. Keep the recognizable mark away from crop edges. The logo wordmark is too small for a launcher symbol. Validate adaptive masks with Android tooling during implementation.
- Android notification small icon: white alpha silhouette only; a full-color launcher image is unsuitable. Existing \`ic_notification.png\` is listed separately.
- Preserve official social/authentication/payment marks. Do not ask an image model to invent Google, Apple, PayPal, Razorpay, Stripe or other provider identities.
- Badge meaning must remain truthful: decorative VIP/partner badges should not impersonate account verification.
- Add LIVE, NEW, CC, 10-second labels, prices and membership names as real interface text where feasible. This allows accurate rendering and localization.
- Prioritize navigation/account menu → playback/actions → creation/upload → wallet/rewards → forms/settings → empty states/dialogs → tiers/illustrations → reactions → optional legacy cleanup.

## Complete per-file prompts

Each entry below is a complete standalone instruction. Files sharing a meaning should share the same master design; do not commission subtly different duplicates.
`;
let doc=intro;
for(const type of [...new Set(rows.map(r=>r.type))]){
 doc+='\n### '+type+'\n';
 for(const r of rows.filter(r=>r.type===type))doc+='\n#### '+r.file+'\n\n'+(r.aliases?'Code aliases: `'+r.aliases+'`. ':'')+'Source files matching filename/alias: '+r.references+'.\n\n> '+r.prompt+'\n';
}
doc+='\n## Built-in Flutter symbols also found in source\n\nThese are not missing PNG files. They are existing code-rendered icons. Reuse the approved semantic vector master when you later unify the UI. Variant suffixes such as rounded/outlined usually do not justify a separate design. This scan may include comments.\n\n';
for(const n of material)doc+='- `Icons.'+n+'`\n';
doc+='\nFor a built-in symbol without a PNG counterpart, use this full prompt: "'+glyphStyle+' Subject: [the control meaning, not the API spelling]. Preserve the established meaning and direction of the current control. Reuse an approved master whenever the meaning matches."\n';
doc+='\nAdditional distinct controls to cover: volume high/low/mute (speaker with two/one/no wave and slash for mute), stop (solid square), refresh/retry (clockwise arrow), external link (box with northeast arrow), link (two interlocking links), phone (handset), QR (three corner finder blocks), bank (three-column facade), receipt (rounded receipt with text strokes), security/device lock (phone with padlock), VPN restriction (shield with connection slash), legal/grievance (balanced scales), timer pending (hourglass), task completion (check inside circle), access denied (shield with minus), and support contact (headset). All use the same complete UI-glyph prompt and one single clear subject.\n';
fs.writeFileSync(path.join(out,'YouPeak-complete-icon-prompts.md'),doc);
const missing=[...aliases.keys()].filter(f=>!files.includes(f));
fs.appendFileSync(path.join(out,'YouPeak-complete-icon-prompts.md'),'\n## Declared paths absent from the icon folder\n\nThese constants exist in AppIcons but their files were not found. They may be unused legacy declarations; this is not evidence of a runtime failure. Check actual consumers before generating or deleting them.\n\n'+missing.map(f=>'- `'+f+'` — aliases: '+aliases.get(f).join(', ')).join('\n')+'\n');
const extra={
 'Create':'equal-arm plus with rounded ends; button circle is rendered separately',
 'Tasker':'rounded checklist with two short rows and one prominent checkmark',
 'Ad credits':'compact megaphone with one plain coin, simplified for 24px',
 'Campaign analytics':'small video panel beside a three-bar ascending chart',
 'Privacy policy':'rounded document with a small padlock in the lower corner',
 'Payment history':'receipt with a small clock in the lower corner',
 'Referral history':'two neutral people with a small history clock',
 'Volume high':'speaker wedge and two separated sound arcs',
 'Volume low':'same speaker wedge and one sound arc',
 'Mute':'same speaker wedge crossed by one diagonal slash',
 'Stop':'solid square with subtly rounded corners',
 'Retry':'clockwise circular arrow with a clear open gap',
 'External link':'open rounded square and an arrow pointing northeast',
 'Copy link':'two interlocking diagonal chain links',
 'Phone sign-in':'single clean telephone handset',
 'QR code':'three corner finder blocks and a restrained abstract code pattern; decorative, not a scannable code',
 'Withdraw to bank':'restrained three-column bank facade with triangular roof and one baseline',
 'Device security':'upright phone with a small closed padlock',
 'VPN restriction':'shield containing a small disconnected network symbol',
 'Legal support':'balanced scales with a simple central stem',
 'Pending':'clean hourglass with one narrow central waist',
 'Access restricted':'shield containing a minus sign',
 'Support contact':'headset with one short microphone boom',
};
let quick='# YouPeak — start here\n\nUse the supplied logo as your brand reference. This shortlist covers the bottom bar and account menu first. Each prompt is complete and ready to copy. Full per-file artwork, badge, reaction, tier, dialog, empty-state and legacy treatments are in the companion complete pack.\n\n';
const priority=['home.png','boldHome.png','Video.png','boldVideo.png','videoCircle.png','boldPlay.png','library.png','boldDocument.png','search.png','notification.png','incognito.png','profileLogo.png','subscription_plan.png','earn_reward_icon.png','Wallet.png','activity.png','monetization.png','king.png','trending.png','setting.png','infoSquare.png','shieldDone.png','logout.png','delete_account.png'];
for(const f of priority){const r=rows.find(x=>x.file===f);quick+='## '+f+'\n\n'+r.prompt+'\n\n';}
for(const [name,subject]of Object.entries(extra))quick+='## '+name+' — dedicated symbol\n\n'+glyphStyle+' Subject: '+subject+'.\n\n';
quick+='## Family review prompt\n\nReview the supplied YouPeak icon concepts as one family. Compare Home, Bites, Subscriptions, Library, Create, Search, Wallet, Settings and Like at actual 22px size on white and charcoal surfaces. Identify inconsistent stroke width, optical size, corner treatment, inner spacing and ambiguous silhouettes. Preserve the meaning of every control. Recommend precise geometry corrections; do not add decoration or change the app navigation. Produce a contact sheet for comparison only, with labels outside the artwork.\n';
fs.writeFileSync(path.join(out,'YouPeak-start-here-navigation-prompts.md'),quick);
const q=s=>'"'+String(s).replaceAll('"','""')+'"';
fs.writeFileSync(path.join(out,'YouPeak-icon-inventory.csv'),'Filename,Category,Code aliases,Source reference file count,Source files,Complete prompt\n'+rows.map(r=>[r.file,r.type,r.aliases,r.references,r.source,r.prompt].map(q).join(',')).join('\n'));
console.log(JSON.stringify({assets:files.length,prompts:rows.length,materialSymbols:material.length,missingDeclaredPaths:missing,categories:rows.reduce((a,r)=>(a[r.type]=(a[r.type]||0)+1,a),{}),documentBytes:Buffer.byteLength(doc),output:out},null,2));
