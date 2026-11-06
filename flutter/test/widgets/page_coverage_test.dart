// ignore_for_file: prefer_const_constructors

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:get/get.dart';
import 'package:youpeak/core/platform/app_layout.dart';
import 'package:youpeak/features/ad_credits/view/ad_credits_wallet_view.dart';
import 'package:youpeak/main.dart' show registerWideRoutes;
import 'package:youpeak/features/channel/view/subscription_plan_view.dart';
import 'package:youpeak/features/coins/view/buy_coin_history_view.dart';
import 'package:youpeak/features/coins/view/buy_coin_view.dart';
import 'package:youpeak/features/coins/view/coin_history_view.dart';
import 'package:youpeak/features/coins/view/convert_coin_view.dart';
import 'package:youpeak/features/coins/widget/coin_payment_view.dart';
import 'package:youpeak/features/edit_video/view/edit_video_view.dart';
import 'package:youpeak/features/monetization/view/content_engagement_view.dart';
import 'package:youpeak/features/monetization/view/monetization_view.dart';
import 'package:youpeak/features/monetization/view/preview_monetization.dart';
import 'package:youpeak/features/monetization/view/time_watch_view.dart';
import 'package:youpeak/features/premium/view/payments_view.dart';
import 'package:youpeak/features/premium/view/premium_plan_purchase_history_view.dart';
import 'package:youpeak/features/premium/view/premium_plan_view.dart';
import 'package:youpeak/features/premium/view/purchase_plan_view.dart';
import 'package:youpeak/features/profile/controller/profile_controller.dart';
import 'package:youpeak/features/profile/view/edit_profile.dart';
import 'package:youpeak/features/referral/view/referral_history_view.dart';
import 'package:youpeak/features/referral/view/referral_program_view.dart';
import 'package:youpeak/features/settings/view/grievance_view.dart';
import 'package:youpeak/features/settings/view/language_view.dart';
import 'package:youpeak/features/tiers/view/creator_tier_view.dart';
import 'package:youpeak/features/channel/controller/your_channel_controller.dart';
import 'package:youpeak/features/library/controller/nav_library_controller.dart';
import 'package:youpeak/features/notifications/controller/notification_controller.dart';
import 'package:youpeak/features/rewards/controller/earn_reward_controller.dart';
import 'package:youpeak/features/search/controller/search_controller.dart';
import 'package:youpeak/features/subscriptions/controller/nav_subscription_controller.dart';
import 'package:youpeak/features/channel/view/create_channel_screen.dart';
import 'package:youpeak/features/channel/view/create_channel_view.dart';
import 'package:youpeak/features/channel/view/get_playList_page.dart';
import 'package:youpeak/features/channel/view/preview_playlist_view.dart';
import 'package:youpeak/features/channel/view/your_channel_view.dart';
import 'package:youpeak/features/help_center/view/help_center_view.dart';
import 'package:youpeak/features/library/view/download_view.dart';
import 'package:youpeak/features/library/view/history_view.dart';
import 'package:youpeak/features/library/view/watch_later_view.dart';
import 'package:youpeak/features/library/view/your_video_page.dart';
import 'package:youpeak/features/live/view/add_thumbnail_view.dart';
import 'package:youpeak/features/notifications/view/notification_view.dart';
import 'package:youpeak/features/playlist/controller/create_playlist_controller.dart';
import 'package:youpeak/features/playlist/view/create_playlist_view.dart';
import 'package:youpeak/features/profile/view/profile_view.dart';
import 'package:youpeak/features/rewards/view/earn_reward_view.dart';
import 'package:youpeak/features/search/view/search_view.dart';
import 'package:youpeak/features/settings/view/settings_view.dart';
import 'package:youpeak/features/subscriptions/view/subscribed_channel_view.dart';
import 'package:youpeak/features/tasker/presentation/tasker_dashboard_view.dart';
import 'package:youpeak/features/tiers/view/tasker_tier_view.dart';
import 'package:youpeak/features/upload/controller/upload_video_controller.dart';
import 'package:youpeak/features/upload/view/audience_page.dart';
import 'package:youpeak/features/upload/view/comments_page.dart';
import 'package:youpeak/features/upload/view/description_page.dart';
import 'package:youpeak/features/upload/view/set_thumbnail_page.dart';
import 'package:youpeak/features/upload/view/upload_video_view.dart';
import 'package:youpeak/features/upload/view/video_charges_view.dart';
import 'package:youpeak/features/upload/view/visibility_page.dart';
import 'package:youpeak/features/video_promotion/view/promote_flow_view.dart';
import 'package:youpeak/features/video_promotion/view/promote_video_view.dart';
import 'package:youpeak/features/video_promotion/view/promotion_campaign_view.dart';
import 'package:youpeak/features/wallet/view/withdraw_history_view.dart';

import '../support/shell_harness.dart';

/// Every secondary page, at its registered desktop width, rendered at each
/// window size. The data layer has no backend here, so these are the loading /
/// empty states: they prove the page's structure fits every size (no overflow,
/// no unbounded or broken constraints), not what the real data looks like.
final _pages = <String, ({Widget Function() build, double width, void Function()? setup})>{
  'MonetizationView': (build: () => MonetizationView(), width: 1120, setup: null),
  'PreviewMonetization': (build: () => PreviewMonetization(), width: 1120, setup: null),
  'TimeWatchView': (build: () => TimeWatchView(), width: 1000, setup: null),
  'ContentEngagementView': (build: () => ContentEngagementView(), width: 1000, setup: null),
  'WithdrawHistoryView': (build: () => WithdrawHistoryView(), width: 860, setup: null),
  'BuyCoinView': (build: () => BuyCoinView(), width: 1000, setup: null),
  'BuyCoinHistoryView': (build: () => BuyCoinHistoryView(), width: 860, setup: null),
  'CoinHistoryView': (build: () => CoinHistoryView(), width: 860, setup: null),
  'ConvertCoinView': (build: () => ConvertCoinView(), width: 900, setup: null),
  'CoinPaymentView': (build: () => CoinPaymentView(amount: 99, premiumPlanId: 'p', productKey: 'k'), width: 760, setup: null),
  'ReferralProgramView': (build: () => ReferralProgramView(), width: 1000, setup: null),
  'ReferralHistoryView': (build: () => ReferralHistoryView(), width: 860, setup: null),
  'AdCreditsWalletView': (build: () => AdCreditsWalletView(), width: 1000, setup: null),
  'CreatorTierView': (build: () => CreatorTierView(), width: 1000, setup: null),
  'PremiumPlanView': (build: () => PremiumPlanView(), width: 1000, setup: null),
  'PurchasePlanView': (build: () => PurchasePlanView(), width: 1000, setup: null),
  'PaymentView': (build: () => PaymentView(amount: 99, premiumPlanId: 'p', productKey: 'k'), width: 760, setup: null),
  'PremiumPlanPurchaseHistoryView': (
    build: () => PremiumPlanPurchaseHistoryView(),
    width: 860,
    setup: () {
      Get.put<ProfileController>(ProfileController());
    }
  ),
  'SubscriptionPlanView': (build: () => SubscriptionPlanView(), width: 860, setup: null),
  'EditVideoView': (build: () => EditVideoView(videoId: 'v', videoType: 1), width: 900, setup: null),
  'EditProfileView': (build: () => EditProfileView(), width: 860, setup: null),
  'GrievanceView': (build: () => GrievanceView(), width: 760, setup: null),
  'LanguageView': (build: () => LanguageView(), width: 760, setup: null),

  // Pages with a desktop layout from earlier work, and the flows around them.
  'HelpCenterView': (build: () => HelpCenterView(), width: 760, setup: null),
  'SettingsView': (build: () => SettingsView(), width: 760, setup: null),
  'SearchView': (
    build: () => SearchView(isSearchShorts: false),
    width: 1200,
    setup: () {
      Get.put<SearchingController>(SearchingController());
    }
  ),
  'NotificationPageView': (
    build: () => NotificationPageView(),
    width: 760,
    setup: () {
      Get.put<NotificationController>(NotificationController());
    }
  ),
  'ProfileView': (
    build: () => ProfileView(),
    width: 1120,
    setup: () {
      Get.put<ProfileController>(ProfileController());
    }
  ),
  'TaskerDashboardView': (build: () => TaskerDashboardView(), width: 1180, setup: null),
  'TaskerTierView': (build: () => TaskerTierView(), width: 1280, setup: null),
  'EarnRewardView': (
    build: () => EarnRewardView(),
    width: 1180,
    setup: () {
      Get.put<EarnRewardController>(EarnRewardController());
    }
  ),
  'PromoteVideoView': (build: () => PromoteVideoView(), width: 1120, setup: null),
  'PromoteFlowView': (build: () => PromoteFlowView(), width: 1200, setup: null),
  'PromotionCampaignView': (build: () => PromotionCampaignView(campaignId: 'c'), width: 1000, setup: null),
  'HistoryPageView': (build: () => HistoryPageView(), width: 960, setup: null),
  'WatchLaterView': (
    build: () => WatchLaterView(),
    width: 960,
    setup: () {
      Get.put<NavLibraryPageController>(NavLibraryPageController());
    }
  ),
  'YourVideoPageView': (
    build: () => YourVideoPageView(),
    width: 960,
    setup: () {
      Get.put<NavLibraryPageController>(NavLibraryPageController());
    }
  ),
  'DownloadView': (build: () => DownloadView(), width: 960, setup: null),
  'GetPlaylistPage': (build: () => GetPlaylistPage(), width: 960, setup: null),
  'PreviewPlaylistView': (
    build: () => PreviewPlaylistView(channelName: 'Channel', playListName: 'List', playListId: 'p'),
    width: 960,
    setup: () {
      Get.put<YourChannelController>(YourChannelController());
    }
  ),
  'SubscribedChannelView': (
    build: () => SubscribedChannelView(loginUserId: 'user-1'),
    width: 960,
    setup: () {
      Get.put<NavSubscriptionPageController>(NavSubscriptionPageController());
    }
  ),
  'YourChannelView': (
    build: () => YourChannelView(loginUserId: 'user-1', channelId: 'channel-1'),
    width: 960,
    setup: () {
      Get.put<YourChannelController>(YourChannelController());
    }
  ),
  'CreatePlayListView': (
    build: () => CreatePlayListView(),
    width: 760,
    setup: () {
      Get.put<NavLibraryPageController>(NavLibraryPageController());
      Get.put<CreatePlaylistController>(CreatePlaylistController());
    },
  ),
  'UploadVideoView': (
    build: () => UploadVideoView(videoPath: '', loginUserId: 'user-1', loginUserChannelId: 'channel-1', videoType: 1),
    width: 1200,
    setup: _putUpload,
  ),
  'CreateChannelView': (build: () => CreateChannelView(), width: 760, setup: _putUpload),
  'CreateChannelScreen': (build: () => CreateChannelScreen(), width: 760, setup: null),
  'AudiencePageView': (build: () => AudiencePageView(), width: 760, setup: _putUpload),
  'VisibilityPageView': (build: () => VisibilityPageView(), width: 760, setup: _putUpload),
  'VideoChargesView': (build: () => VideoChargesView(), width: 760, setup: _putUpload),
  'DescriptionPageView': (build: () => DescriptionPageView(), width: 760, setup: _putUpload),
  'CommentsPageView': (build: () => CommentsPageView(), width: 760, setup: _putUpload),
  'SetThumbnailPage': (build: () => SetThumbnailPage(), width: 760, setup: _putUpload),
  'AddThumbnailView': (build: () => AddThumbnailView(), width: 760, setup: null),
};

void _putUpload() {
  Get.put<UploadVideoController>(UploadVideoController());
}

void main() {
  setUpAll(() async {
    await loadPreviewAssets();
    await seedSession();
    useFakeFirebase();
    registerWideRoutes();
  });
  tearDown(Get.reset);

  for (final page in _pages.entries) {
    for (final size in layoutSizes.entries) {
      testWidgets('${page.key} at ${size.key}', (tester) async {
        page.value.setup?.call();
        await guarded(() async {
          final built = page.value.build();
          // The width this test renders at is the width the app registers.
          // (Earn Rewards opens inside the task-lock gate, so its route is the gate's.)
          final routeName = page.key == 'EarnRewardView' ? '/TaskLockGate' : '/${built.runtimeType}';
          expect(AppLayout.shellContentWidth(routeName), page.value.width, reason: '${page.key} is not registered at ${page.value.width}');
          await pumpInShell(tester, size.value, built, maxWidth: page.value.width);
          expectNoLayoutErrors(tester, where: '${page.key} ${size.key}');
          await shoot(tester, '${page.key}_${size.key}');
          // Dispose the page and let its timers run out, so none outlive the test.
          await tester.pumpWidget(const SizedBox());
          await tester.pump(const Duration(seconds: 30));
          tester.takeException();
        });
      });
    }
  }
}
