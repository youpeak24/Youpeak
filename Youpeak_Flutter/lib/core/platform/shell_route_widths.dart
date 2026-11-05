import 'package:youpeak/core/platform/app_layout.dart';
import 'package:youpeak/features/ad_credits/view/ad_credits_wallet_view.dart';
import 'package:youpeak/features/channel/view/create_channel_screen.dart';
import 'package:youpeak/features/channel/view/create_channel_view.dart';
import 'package:youpeak/features/channel/view/subscription_plan_view.dart';
import 'package:youpeak/features/coins/view/buy_coin_history_view.dart';
import 'package:youpeak/features/coins/view/buy_coin_view.dart';
import 'package:youpeak/features/coins/view/coin_history_view.dart';
import 'package:youpeak/features/coins/view/convert_coin_view.dart';
import 'package:youpeak/features/coins/widget/coin_payment_view.dart';
import 'package:youpeak/features/edit_video/view/edit_video_view.dart';
import 'package:youpeak/features/library/view/your_video_page.dart';
import 'package:youpeak/features/live/view/add_thumbnail_view.dart';
import 'package:youpeak/features/monetization/view/content_engagement_view.dart';
import 'package:youpeak/features/monetization/view/monetization_view.dart';
import 'package:youpeak/features/monetization/view/preview_monetization.dart';
import 'package:youpeak/features/monetization/view/time_watch_view.dart';
import 'package:youpeak/features/playlist/view/create_playlist_view.dart';
import 'package:youpeak/features/premium/view/payments_view.dart';
import 'package:youpeak/features/premium/view/premium_plan_purchase_history_view.dart';
import 'package:youpeak/features/premium/view/premium_plan_view.dart';
import 'package:youpeak/features/premium/view/purchase_plan_view.dart';
import 'package:youpeak/features/profile/view/edit_profile.dart';
import 'package:youpeak/features/referral/view/referral_history_view.dart';
import 'package:youpeak/features/referral/view/referral_program_view.dart';
import 'package:youpeak/features/settings/view/grievance_view.dart';
import 'package:youpeak/features/settings/view/language_view.dart';
import 'package:youpeak/features/settings/view/privacy_policy_web_view.dart';
import 'package:youpeak/features/tiers/view/creator_tier_view.dart';
import 'package:youpeak/features/upload/view/audience_page.dart';
import 'package:youpeak/features/upload/view/comments_page.dart';
import 'package:youpeak/features/upload/view/description_page.dart';
import 'package:youpeak/features/upload/view/set_thumbnail_page.dart';
import 'package:youpeak/features/upload/view/video_charges_view.dart';
import 'package:youpeak/features/upload/view/visibility_page.dart';
import 'package:youpeak/features/wallet/view/my_wallet_view.dart';
import 'package:youpeak/features/wallet/view/withdraw_history_view.dart';
import 'package:youpeak/features/wallet/view/withdraw_view.dart';

/// Content width of every secondary page (reached from the profile menu,
/// Earn Rewards, settings, channel and upload flows) beside the desktop
/// sidebar. A page fills this width itself with grids and side-by-side
/// sections; the number is the widest its content stays comfortable at:
///
///  * dashboards and plan/price grids  1000-1120
///  * lists and histories              860
///  * forms and settings               760-900
void registerSecondaryPageWidths() {
  void register(Iterable<Type> pages, double width) {
    for (final page in pages) {
      AppLayout.registerShellRoute(page, maxContentWidth: width);
    }
  }

  // Monetization: earnings dashboard and the intro/eligibility page.
  register([MonetizationView, PreviewMonetization], 1120);
  register([TimeWatchView, ContentEngagementView], 1000);

  // Wallet, coins and payouts.
  register([MyWalletView, WithdrawView, BuyCoinView, AdCreditsWalletView, ReferralProgramView], 1000);
  register([WithdrawHistoryView, BuyCoinHistoryView, CoinHistoryView, ReferralHistoryView], 860);
  register([ConvertCoinView], 900);
  register([CoinPaymentView], 760);

  // Plans and tiers.
  register([PremiumPlanView, CreatorTierView], 1000);
  register([SubscriptionPlanView], 860);
  register([PurchasePlanView], 1000);
  register([PaymentView], 760);
  register([PremiumPlanPurchaseHistoryView], 860);

  // Library.
  register([YourVideoPageView], 960);

  // Forms and settings.
  register([EditProfileView], 860);
  register([EditVideoView, PrivacyPolicyWebView], 900);
  register([GrievanceView, LanguageView], 760);
  register([CreateChannelView, CreateChannelScreen, CreatePlayListView], 760);

  // Upload flow sub-pages.
  register(
      [AudiencePageView, VisibilityPageView, VideoChargesView, DescriptionPageView, CommentsPageView, SetThumbnailPage, AddThumbnailView],
      760);
}
