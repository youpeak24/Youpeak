/// Full-colour YouPeak artwork. Keep these separate from tintable UI glyphs.
abstract final class AppVisuals {
  static const empty = 'assets/icons/empty_image.png';
  static const emptyVideos = 'assets/icons/empty_videos.png';
  static const emptyComments = 'assets/icons/empty_comments.png';
  static const emptyNotifications = 'assets/icons/empty_notifications.png';
  static const emptyDownloads = 'assets/icons/empty_downloads.png';
  static const emptyHistory = 'assets/icons/empty_history.png';
  static const emptyPlaylist = 'assets/icons/empty_playlist.png';
  static const emptySubscriptions = 'assets/icons/empty_subscriptions.png';
  static const emptySearch = 'assets/icons/empty_search.png';
  static const offline = 'assets/icons/Network_Issue.png';
  static const avatar = 'assets/icons/profile_image.png';
  static const profileSetup = 'assets/icons/userProfile.png';
  static const videoPlaceholder = 'assets/icons/video_placeholder.png';
  static const channelBanner = 'assets/icons/default_channel_banner.png';
  static const creatorHero = 'assets/icons/hero_creator_vip.png';
  static const taskerHero = 'assets/icons/hero_starter_pass.png';
  static const premiumHero = 'assets/icons/hero_premium.png';
  static const promoteHero = 'assets/icons/hero_promote_video.png';
  static const helpHero = 'assets/icons/hero_help_center.png';
  static const grievanceHero = 'assets/icons/hero_grievance.png';
  static const liveHero = 'assets/icons/hero_go_live.png';
  static const channelHero = 'assets/icons/hero_create_channel.png';
  static const accountBlocked = 'assets/icons/dialog_account_blocked.png';
  static const update = 'assets/icons/dialog_update.png';
  static const exit = 'assets/icons/dialog_exit.png';
  static const logout = 'assets/icons/dialog_logout.png';
  static const deleteAccount = 'assets/icons/dialog_delete_account.png';
  static const paymentFailed = 'assets/icons/dialog_payment_failed.png';
  static const privateContent = 'assets/icons/dialog_private_content.png';
  static const subscribed = 'assets/icons/dialog_subscribed_success.png';
  static const streak = 'assets/icons/sticker_streak_flame.png';
  static const dailyTasks = 'assets/icons/sticker_target.png';
  static const checkIn = 'assets/icons/sticker_calendar_check.png';
  static const verified = 'assets/icons/verified_badge.png';
  static const premiumBadge = 'assets/icons/premium_badge.png';
  static const paidVideoBadge = 'assets/icons/paid_video_badge.png';
  static const liveBadge = 'assets/icons/live_badge.png';
  static const newBadge = 'assets/icons/new_badge.png';
  static const topCreatorBadge = 'assets/icons/top_creator_badge.png';
  static const vipMedallion = 'assets/icons/king_round.png';
  static const districtPartnerBadge = 'assets/icons/partner_district_badge.png';
  static const digitalPartnerBadge = 'assets/icons/partner_digital_badge.png';
  static const wallet = 'assets/icons/wallet_3d.png';
  static const withdrawBank = 'assets/icons/withdraw_bank.png';
  static const megaphone = 'assets/icons/promo_megaphone.png';
  static const referralShareBanner = 'assets/icons/referral_share_banner.png';
  static const wordmark = 'assets/icons/youpeak_wordmark.png';
  static const noInternet = 'assets/icons/Internet.png';
  static const wave = 'assets/icons/sticker_wave.png';
  static const sparkles = 'assets/icons/sticker_sparkles.png';
  static const medal = 'assets/icons/sticker_medal.png';
  static const moneyBag = 'assets/icons/sticker_money_bag.png';
  static const giftHeart = 'assets/icons/sticker_gift_heart.png';
  static const confetti = 'assets/icons/sticker_confetti.png';
  static const partyPopper = 'assets/icons/sticker_party_popper.png';
  static const uploadDone = 'assets/icons/sticker_upload_done.png';
  static const downloadDone = 'assets/icons/sticker_download_done.png';

  // Notification type artwork, keyed by the backend's notification wording.
  static const notifBell = 'assets/icons/notif_bell.png';
  static const notifAnnouncement = 'assets/icons/notif_announcement.png';
  static const notifLiveNow = 'assets/icons/notif_live_now.png';
  static const notifComment = 'assets/icons/notif_new_comment.png';
  static const notifLike = 'assets/icons/notif_new_like.png';
  static const notifSubscriber = 'assets/icons/notif_new_subscriber.png';
  static const notifPayment = 'assets/icons/notif_payment_success.png';
  static const notifReminder = 'assets/icons/notif_reminder.png';
  static const notifSecurity = 'assets/icons/notif_security.png';
  static const notifUpdate = 'assets/icons/notif_update.png';
  static const notifWarning = 'assets/icons/notif_warning.png';
  static const notifWithdrawal = 'assets/icons/notif_withdrawal_sent.png';

  static const _creatorTiers = [
    'assets/icons/tier_classic_pass.png',
    'assets/icons/tier_starter_vip.png',
    'assets/icons/tier_silver_vip.png',
    'assets/icons/tier_gold_vip.png',
    'assets/icons/tier_platinum_vip.png',
  ];
  static const _taskerTiers = [
    'assets/icons/tier_tasker_free.png',
    'assets/icons/tier_tasker_l1.png',
    'assets/icons/tier_tasker_l2.png',
    'assets/icons/tier_tasker_l3.png',
    'assets/icons/tier_tasker_l4.png',
  ];

  /// Backend names preserve a tier's identity when the response order changes.
  static String creatorTier(String name) {
    final value = name.toLowerCase();
    if (value.contains('platinum')) return _creatorTiers[4];
    if (value.contains('gold')) return _creatorTiers[3];
    if (value.contains('silver')) return _creatorTiers[2];
    if (value.contains('starter')) return _creatorTiers[1];
    return _creatorTiers[0];
  }

  static String taskerTier(String name) {
    final level = RegExp(r'(?:level|tasker|l)\s*([1-4])', caseSensitive: false)
        .firstMatch(name);
    return _taskerTiers[level == null ? 0 : int.parse(level.group(1)!)];
  }

  /// Notifications carry no type field, so classify by the backend's fixed
  /// title wording. Order matters: a declined withdrawal is a warning first.
  static String notification(String? title, String? message) {
    final text = '${title ?? ''} ${message ?? ''}'.toLowerCase();
    bool has(String pattern) => RegExp(pattern).hasMatch(text);
    if (has(r'declin|reject|flag|copyright|review|failed')) return notifWarning;
    if (has(r'withdraw')) return notifWithdrawal;
    if (has(r'live now|is live')) return notifLiveNow;
    if (has(r'subscriber|subscription earned')) return notifSubscriber;
    if (has(r'comment|repl')) return notifComment;
    if (has(r'\blike')) return notifLike;
    if (has(r'check-in|check in|reminder|streak')) return notifReminder;
    if (has(r'password|security|login from|blocked')) return notifSecurity;
    if (has(r'update|new version')) return notifUpdate;
    if (has(r'coin|unlock|bonus|reward|approved|payment|purchase')) return notifPayment;
    if (has(r'new video|announce|channel creation|monetization')) return notifAnnouncement;
    return notifBell;
  }

  /// Pack art grows with the plan: [rank] is the plan's position by coin
  /// amount (0 = smallest) among [count] plans, spread across all six images.
  static String coinPack(int rank, int count) {
    final step = count <= 1 ? 0 : (rank * 5 / (count - 1)).round();
    return 'assets/icons/coin_pack_${step.clamp(0, 5) + 1}.png';
  }
}
