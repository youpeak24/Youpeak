import 'package:youpeak/shared/dialogs/app_sheet.dart';
import 'package:youpeak/shared/widgets/app_icon.dart';
import 'package:youpeak/core/security/presentation/task_lock_gate.dart';
import 'package:youpeak/core/platform/app_layout.dart';
import 'dart:developer';

import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:youpeak/core/platform/platform_info.dart';
import 'package:get/get.dart';
import 'package:get/get_rx/src/rx_typedefs/rx_typedefs.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/features/profile/api/delete_account_api.dart';
import 'package:youpeak/core/utils/custom_format_number.dart';
import 'package:youpeak/core/utils/custom_toast.dart';
import 'package:youpeak/shared/widgets/loader_ui.dart';
import 'package:youpeak/core/storage/database/database.dart';
import 'package:youpeak/main.dart';
import 'package:youpeak/core/settings/admin_settings_api.dart';
import 'package:youpeak/features/coins/view/buy_coin_view.dart';
import 'package:youpeak/features/profile/api/get_profile_api.dart';
import 'package:youpeak/features/channel/view/create_channel_screen.dart';
import 'package:youpeak/features/rewards/view/earn_reward_view.dart';
import 'package:youpeak/features/tiers/view/creator_tier_view.dart';
import 'package:youpeak/features/video_promotion/view/promote_video_view.dart';
import 'package:youpeak/features/ad_credits/view/ad_credits_wallet_view.dart';
import 'package:youpeak/features/profile/view/edit_profile.dart';
import 'package:youpeak/features/help_center/view/help_center_view.dart';
import 'package:youpeak/features/profile/controller/profile_controller.dart';
import 'package:youpeak/features/monetization/view/monetization_view.dart';
import 'package:youpeak/features/monetization/view/preview_monetization.dart';
import 'package:youpeak/features/wallet/view/my_wallet_view.dart';
import 'package:youpeak/features/premium/view/premium_plan_view.dart';
import 'package:youpeak/features/premium/view/purchase_plan_view.dart';
import 'package:youpeak/features/settings/view/settings_view.dart';
import 'package:youpeak/features/monetization/view/time_watch_view.dart';
import 'package:youpeak/features/channel/view/your_channel_view.dart';
import 'package:youpeak/features/channel/view/subscription_plan_view.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:youpeak/core/theme/app_tokens.dart';
import 'package:youpeak/shared/widgets/app_pressable.dart';
import 'package:youpeak/core/config/size_config.dart';
import 'package:youpeak/core/assets/app_icons.dart';
import 'package:youpeak/core/assets/app_visuals.dart';
import 'package:youpeak/shared/widgets/app_artwork.dart';
import 'package:youpeak/shared/widgets/preview_image.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'package:youpeak/core/constants/app_string.dart';
import 'package:youpeak/core/utils/utils.dart';

class ProfileView extends GetView<ProfileController> {
  const ProfileView({super.key});

  @override
  Widget build(BuildContext context) {
    print("*******${Database.loginUserId}");
    controller.onGetRewardCoin();
    // controller.monetizationApi();
    controller.getProfile();
    return Scaffold(
      appBar: AppBar(
        elevation: 0,
        backgroundColor: Colors.transparent,
        centerTitle: AppSettings.isCenterTitle,
        leadingWidth: 60,
        titleSpacing: 0,
        leading: GestureDetector(
          onTap: () => Get.back(),
          child: Container(
            height: 40,
            width: 40,
            color: AppColor.transparent,
            alignment: Alignment.center,
            child: Obx(
              () => Image.asset(AppIcons.arrowBack, height: 20, width: 20, color: isDarkMode.value ? AppColor.white : AppColor.black),
            ),
          ),
        ),
        title: Text(AppStrings.profile.tr, style: GoogleFonts.urbanist(fontSize: 21, fontWeight: FontWeight.w800, letterSpacing: -0.3)),
        actions: [
          GestureDetector(
            onTap: () async {
              await Get.to(() => const TaskLockGate(child: EarnRewardView()));
              controller.onGetRewardCoin();
            },
            child: Container(
              height: 35,
              padding: const EdgeInsets.symmetric(horizontal: 10),
              decoration: BoxDecoration(
                border: Border.all(color: AppColor.orangeColor),
                borderRadius: BorderRadius.circular(7),
              ),
              child: Row(
                children: [
                  Image.asset(AppIcons.convertIcon, width: 25),
                  5.width,
                  Obx(
                    () => Text(
                      CustomFormatNumber.convert(controller.rewardCoins.value),
                      style: GoogleFonts.urbanist(fontSize: 16, fontWeight: FontWeight.w700),
                    ),
                  ),
                ],
              ),
            ),
          ),
          15.width,
        ],
      ),
      // Phone: one column. Desktop browser: the account overview and plan
      // cards beside the menu, instead of one tall strip.
      body: LayoutBuilder(
        builder: (context, constraints) {
          final wide = PlatformInfo.isWeb && constraints.maxWidth >= 900;
          final overview = <Widget>[
            15.height,
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                children: [
                  AppPressable(
                    onTap: () => Get.to(const EditProfileView()),
                    pressedScale: 0.96,
                    semanticLabel: "Edit profile",
                    child: SizedBox(
                      height: 104,
                      width: 104,
                      child: Stack(
                        clipBehavior: Clip.none,
                        children: [
                          Container(
                            padding: const EdgeInsets.all(3),
                            decoration: const BoxDecoration(shape: BoxShape.circle, gradient: AppColor.brandGradient),
                            child: Container(
                              padding: const EdgeInsets.all(3),
                              decoration: BoxDecoration(shape: BoxShape.circle, color: isDarkMode.value ? AppColor.mainDark : AppColor.white),
                              child: Obx(
                                () => PreviewProfileImage(
                                  size: 92,
                                  id: Database.channelId ?? "",
                                  image: AppSettings.profileImage.value,
                                  fit: BoxFit.cover,
                                ),
                              ),
                            ),
                          ),
                          Positioned(
                            bottom: 2,
                            right: 2,
                            child: Container(
                              height: 32,
                              width: 32,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: AppColor.primaryColor,
                                border: Border.all(color: isDarkMode.value ? AppColor.mainDark : AppColor.white, width: 2.5),
                              ),
                              child: const Center(
                                child: Icon(Icons.edit_rounded, size: 15, color: AppColor.white),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          AppSettings.channelName.value,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: GoogleFonts.urbanist(fontSize: 22, fontWeight: FontWeight.w800, letterSpacing: -0.3),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          GetProfileApi.profileModel?.user?.email ?? "",
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: GoogleFonts.urbanist(
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                            color: isDarkMode.value ? AppColor.mutedTextDark : AppColor.mutedText,
                          ),
                        ),
                        const SizedBox(height: 10),
                        Obx(
                          () => Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                            decoration: BoxDecoration(
                              color: isDarkMode.value ? AppColor.white.withValues(alpha: 0.08) : AppColor.secondaryMintGreen,
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Text(
                              "${AppStrings.myBalance.tr} : ${controller.myBalance}${AppStrings.currencySymbol}",
                              style: GoogleFonts.urbanist(
                                fontSize: 13.5,
                                fontWeight: FontWeight.w800,
                                color: isDarkMode.value ? AppColor.white : AppColor.darkForestAccent,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            16.height,
            Divider(color: AppElevation.hairline(isDarkMode.value), indent: 16, endIndent: 16),
            14.height,
            _PromoBanner(
              gradient: AppColor.brandGradient,
              leading: Image.asset(AppIcons.premiumImage, width: 56),
              title: (GetProfileApi.profileModel?.user?.isPremiumPlan ?? false) ? AppStrings.youPeakPremium.tr : AppStrings.getYouPeakPremium.tr,
              subtitle: (GetProfileApi.profileModel?.user?.isPremiumPlan ?? false) ? AppStrings.purchasePlanSubTitle.tr : AppStrings.premiumBenefits.tr,
              onTap: () {
                if (GetProfileApi.profileModel?.user?.isPremiumPlan ?? false) {
                  Get.to(() => const PurchasePlanView());
                } else {
                  Get.to(() => PremiumPlanView());
                }
              },
            ),
            12.height,
            _PromoBanner(
              color: const Color(0xFFF08A00),
              leading: Container(
                height: 56,
                width: 56,
                padding: const EdgeInsets.all(7),
                decoration: const BoxDecoration(shape: BoxShape.circle, color: AppColor.white),
                child: Image.asset(AppIcons.coin),
              ),
              title: AppStrings.buyCoinSubscription.tr,
              subtitle: AppStrings.premiumBenefits.tr,
              onTap: () {
                Get.to(const BuyCoinView())?.then(
                  (value) {
                    controller.onGetRewardCoin();
                  },
                );
              },
            ),
            12.height,
            _PromoBanner(
              color: AppColor.darkForestAccent,
              leading: Container(
                height: 56,
                width: 56,
                decoration: const BoxDecoration(shape: BoxShape.circle, color: AppColor.white),
                child: const Center(child: AppIcon(AppIcons.extraAdCredits, size: 30, color: AppColor.primaryColor)),
              ),
              title: AppStrings.adCreditsWalletTitle.tr,
              subtitle: "Top up & manage promotional credits",
              onTap: () => Get.to(const AdCreditsWalletView()),
            ),
            6.height,
          ];
          final menu = Padding(
              padding: const EdgeInsets.symmetric(horizontal: 15),
              child: Column(
                children: [
                  ProfileItemUi(
                    title: AppStrings.incognito.tr,
                    leading: AppIcons.incognito,
                    // Incognito only touches incognito/history state; theme is
                    // exclusively the Settings > Dark Mode toggle's job. One
                    // handler serves the row and the switch.
                    trailing: Obx(
                      () => Switch(
                        value: AppSettings.isIncognitoMode.value,
                        onChanged: (_) => _toggleIncognito(),
                      ),
                    ),
                    callback: _toggleIncognito,
                  ),
                  Database.isChannel
                      ? const Offstage()
                      : ProfileItemUi(
                          title: AppStrings.createYourChannel.tr,
                          leading: AppIcons.account,
                          callback: () => Database.isChannel ? CustomToast.show(AppStrings.channelAlreadyCreated.tr) : Get.to(const CreateChannelScreen()),
                        ),
                  Database.isChannel && Database.channelId != null
                      ? ProfileItemUi(
                          leading: AppIcons.play,
                          title: AppStrings.yourChannel.tr,
                          callback: () => Database.isChannel && Database.channelId != null
                              ? Get.to(
                                  () => YourChannelView(
                                    loginUserId: Database.loginUserId!,
                                    channelId: Database.channelId!,
                                  ),
                                )
                              : CustomToast.show(AppStrings.pleaseCreateChannel.tr),
                        )
                      : const SizedBox.shrink(),
                  ProfileItemUi(
                    leading: AppIcons.subscriptionPlan,
                    title: AppStrings.manageSubscription.tr,
                    iconSize: 26,
                    callback: () => Get.to(() => const SubscriptionPlanView()),
                  ),
                  ProfileItemUi(
                    leading: AppIcons.earnReward,
                    title: AppStrings.earnRewards.tr,
                    iconSize: 23,
                    callback: () async {
                      await Get.to(() => const TaskLockGate(child: EarnRewardView()));
                      controller.onGetRewardCoin();
                    },
                  ),
                  ProfileItemUi(
                    leading: AppIcons.wallet,
                    title: AppStrings.myWallet.tr,
                    callback: () => Get.to(() => const MyWalletView()),
                  ),
                  ProfileItemUi(
                    leading: AppIcons.timeWatched,
                    title: AppStrings.timeWatched.tr,
                    callback: () {
                      Get.to(const TimeWatchView());
                    },
                  ),
                  /*ProfileItemUi(
                    leading: AppIcons.darkMode,
                    title: AppStrings.darkMode.tr,
                    callback: () {},
                    trailing: GestureDetector(
                      onTap: () {
                        // if (AppSettings.isIncognitoMode.value && isDarkMode.value) {
                        //   AppSettings.isIncognitoMode.value = false;
                        //   AppSettings.isCreateHistory.value = true;
                        //   Database.onSetIncognitoMode(AppSettings.isIncognitoMode.value);
                        //   Database.onSetCreateHistory(AppSettings.isCreateHistory.value);
                        // }
                        isDarkMode.value = !isDarkMode.value;
                        ThemeService().switchTheme();
                      },
                      child: Container(
                        height: 20,
                        width: 60,
                        alignment: Alignment.centerRight,
                        color: Colors.transparent,
                        child: SizedBox(
                          height: 20,
                          width: 25,
                          child: Transform.scale(
                            scale: 0.7,
                            child: Obx(
                              () => CupertinoSwitch(
                                activeColor: AppColor.primaryColor,
                                value: isDarkMode.value,
                                onChanged: (value) {
                                  // if (AppSettings.isIncognitoMode.value && isDarkMode.value) {
                                  //   AppSettings.isIncognitoMode.value = false;
                                  //   AppSettings.isCreateHistory.value = true;
                                  //   Database.onSetIncognitoMode(AppSettings.isIncognitoMode.value);
                                  //   Database.onSetCreateHistory(AppSettings.isCreateHistory.value);
                                  // }
                                  isDarkMode.value = value;
                                  ThemeService().switchTheme();
                                },
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),*/
                  (AdminSettingsApi.adminSettingsModel?.setting?.isMonetization ?? false)
                      ? ProfileItemUi(
                          leading: AppIcons.monetization,
                          title: AppStrings.monetization.tr,
                          icon: (GetProfileApi.profileModel?.user?.isMonetization ?? false)
                              ? Image.asset(
                                  AppVisuals.verified,
                                  width: 18,
                                  height: 18,
                                  ).paddingOnly(left: 3)
                              : const Offstage(),
                          // (GetProfileApi.profileModel?.user?.isMonetization ?? false) ? Get.to(() => const PreviewMonetization()) :
                          callback: () async {
                            Get.dialog(const LoaderUi(color: AppColor.white), barrierDismissible: false);

                            Get.back(); // loader close

                            if (GetProfileApi.profileModel?.user?.isMonetization ?? false) {
                              Get.to(const PreviewMonetization());
                            } else {
                              Get.to(() => const MonetizationView());
                            }
                          },
                        )
                      : const Offstage(),
                  ProfileItemUi(
                    leading: AppIcons.king,
                    title: AppStrings.creatorVipPass.tr,
                    callback: () => Get.to(() => const CreatorTierView()),
                  ),
                  ProfileItemUi(
                    leading: AppIcons.trending,
                    title: AppStrings.videoPromotionTitle.tr,
                    callback: () => Get.to(() => const PromoteVideoView()),
                  ),
                  ProfileItemUi(
                    leading: AppIcons.setting,
                    title: AppStrings.settings.tr,
                    callback: () => Get.to(() => const SettingsView()),
                  ),
                  ProfileItemUi(
                    leading: AppIcons.help,
                    title: AppStrings.helpCenter.tr,
                    callback: () => Get.to(() => const HelpCenterView()),
                  ),
                  Obx(
                    () => ProfileItemUi(
                      leading: AppIcons.logOut,
                      title: AppStrings.logOut.tr,
                      trailing: const Offstage(),
                      color: isDarkMode.value ? AppColor.white : AppColor.black,
                      callback: () => AppSheet.show(
                        backgroundColor: isDarkMode.value ? AppColor.secondDarkMode : AppColor.white,
                        shape: const RoundedRectangleBorder(
                          borderRadius: BorderRadius.only(
                            topRight: Radius.circular(40),
                            topLeft: Radius.circular(40),
                          ),
                        ),
                        Container(
                          padding: EdgeInsets.only(
                            left: SizeConfig.blockSizeHorizontal * 3,
                            right: SizeConfig.blockSizeHorizontal * 3,
                            bottom: 24,
                          ),
                          decoration: BoxDecoration(
                            color: isDarkMode.value ? AppColor.secondDarkMode : AppColor.white,
                            borderRadius: const BorderRadius.only(topRight: Radius.circular(40), topLeft: Radius.circular(40)),
                          ),
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.start,
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const SizedBox(height: 10),
                              Container(
                                width: 30,
                                height: 3,
                                decoration: BoxDecoration(
                                  borderRadius: BorderRadius.circular(60),
                                  color: isDarkMode.value ? AppColor.white.withOpacity(0.2) : AppColor.grey_200,
                                ),
                              ),
                              const SizedBox(height: 6),
                              const AppArtwork(asset: AppVisuals.logout, height: 112),
                              Text(
                                AppStrings.logOut.tr,
                                style: GoogleFonts.urbanist(
                                  fontSize: 22,
                                  color: isDarkMode.value ? AppColor.white : AppColor.logOutColor,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const SizedBox(height: 5),
                              Divider(indent: 30, color: AppColor.grey_200, endIndent: 30),
                              const SizedBox(height: 5),
                              Text(
                                AppStrings.logOutText.tr,
                                textAlign: TextAlign.center,
                                style: GoogleFonts.urbanist(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const SizedBox(height: 15),
                              Row(
                                crossAxisAlignment: CrossAxisAlignment.center,
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  GestureDetector(
                                    onTap: () => Get.back(),
                                    child: Container(
                                      height: 45,
                                      width: 130,
                                      alignment: Alignment.center,
                                      decoration: BoxDecoration(
                                        borderRadius: BorderRadius.circular(30),
                                        color: AppColor.primaryColor.withOpacity(0.2),
                                      ),
                                      child: Text(
                                        AppStrings.cancel.tr,
                                        style: GoogleFonts.urbanist(
                                          fontWeight: FontWeight.bold,
                                          fontSize: 14,
                                          color: AppColor.primaryColor,
                                        ),
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 10),
                                  GestureDetector(
                                    child: Container(
                                      height: 45,
                                      width: 130,
                                      alignment: Alignment.center,
                                      decoration: BoxDecoration(borderRadius: BorderRadius.circular(100), color: AppColor.primaryColor),
                                      child: Text(
                                        AppStrings.yesLogOut.tr,
                                        style: GoogleFonts.urbanist(color: AppColor.white, fontWeight: FontWeight.bold, fontSize: 14),
                                      ),
                                    ),
                                    onTap: () async {
                                      Database.logOut();
                                    },
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ),
                    ).paddingOnly(left: AppLayout.width * 0.005),
                  ),
                  ProfileItemUi(
                    leading: AppIcons.deleteAccount,
                    title: AppStrings.deleteAccount.tr,
                    trailing: const Offstage(),
                    color: AppColor.primaryColor,
                    callback: () {
                      AppSheet.show(
                        backgroundColor: isDarkMode.value ? AppColor.secondDarkMode : AppColor.white,
                        shape: const RoundedRectangleBorder(
                          borderRadius: BorderRadius.only(
                            topRight: Radius.circular(40),
                            topLeft: Radius.circular(40),
                          ),
                        ),
                        Container(
                          padding: EdgeInsets.only(
                            left: SizeConfig.blockSizeHorizontal * 3,
                            right: SizeConfig.blockSizeHorizontal * 3,
                            bottom: 24,
                          ),
                          decoration: BoxDecoration(
                            color: isDarkMode.value ? AppColor.secondDarkMode : AppColor.white,
                            borderRadius: const BorderRadius.only(topRight: Radius.circular(40), topLeft: Radius.circular(40)),
                          ),
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.start,
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const SizedBox(height: 10),
                              Container(
                                width: 30,
                                height: 3,
                                decoration: BoxDecoration(
                                  borderRadius: BorderRadius.circular(60),
                                  color: isDarkMode.value ? AppColor.white.withOpacity(0.2) : AppColor.grey_200,
                                ),
                              ),
                              const SizedBox(height: 6),
                              const AppArtwork(asset: AppVisuals.deleteAccount, height: 112),
                              Text(
                                AppStrings.deleteAccount.tr,
                                style: GoogleFonts.urbanist(
                                  fontSize: 22,
                                  color: isDarkMode.value ? AppColor.white : AppColor.logOutColor,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const SizedBox(height: 5),
                              Divider(indent: 30, color: AppColor.grey_200, endIndent: 30),
                              const SizedBox(height: 5),
                              Text(
                                AppStrings.deleteAccountText.tr,
                                textAlign: TextAlign.center,
                                style: GoogleFonts.urbanist(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const SizedBox(height: 15),
                              Row(
                                crossAxisAlignment: CrossAxisAlignment.center,
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  GestureDetector(
                                    onTap: () => Get.back(),
                                    child: Container(
                                      height: 45,
                                      width: 130,
                                      alignment: Alignment.center,
                                      decoration: BoxDecoration(
                                        borderRadius: BorderRadius.circular(30),
                                        color: AppColor.primaryColor.withOpacity(0.2),
                                      ),
                                      child: Text(
                                        AppStrings.cancel.tr,
                                        style: GoogleFonts.urbanist(
                                          fontWeight: FontWeight.bold,
                                          fontSize: 14,
                                          color: AppColor.primaryColor,
                                        ),
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 10),
                                  GestureDetector(
                                    child: Container(
                                      height: 45,
                                      width: 130,
                                      alignment: Alignment.center,
                                      decoration: BoxDecoration(borderRadius: BorderRadius.circular(100), color: AppColor.primaryColor),
                                      child: Text(
                                        AppStrings.delete.tr,
                                        style: GoogleFonts.urbanist(color: AppColor.white, fontWeight: FontWeight.bold, fontSize: 14),
                                      ),
                                    ),
                                    onTap: () async {
                                      log("${Database.loginUserId} ");
                                      Get.dialog(const LoaderUi(), barrierDismissible: false);
                                      final response = await DeleteUserApi.callApi(loginUserId: Database.loginUserId ?? '');
                                      if (response) {
                                        Database.logOut();
                                        CustomToast.show(AppStrings.deleteAccountSuccess.tr);
                                      } else {
                                        Get.close(2);
                                      }
                                    },
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ],
              ),
            );

          if (!wide) {
            return SingleChildScrollView(
              physics: const BouncingScrollPhysics(),
              child: Column(children: [...overview, menu, SizedBox(height: Get.height * 0.05)]),
            );
          }
          return SingleChildScrollView(
            physics: const BouncingScrollPhysics(),
            padding: const EdgeInsets.fromLTRB(12, 8, 12, 40),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SizedBox(width: 420, child: Column(children: overview)),
                const SizedBox(width: 28),
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.only(bottom: 20),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(color: isDarkMode.value ? Colors.white12 : AppColor.grey_200),
                    ),
                    child: menu,
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}

/// A tappable promo/CTA banner at the top of the profile.
class _PromoBanner extends StatelessWidget {
  const _PromoBanner({this.gradient, this.color, required this.leading, required this.title, required this.subtitle, required this.onTap})
      : assert(gradient != null || color != null);

  final Gradient? gradient;
  final Color? color;
  final Widget leading;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return AppPressable(
      onTap: onTap,
      haptic: true,
      pressedScale: 0.985,
      semanticLabel: title,
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 16),
        decoration: BoxDecoration(
          gradient: gradient,
          color: gradient == null ? color : null,
          borderRadius: BorderRadius.circular(22),
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(22),
          child: Stack(
            children: [
              // Soft decorative discs, as on the brand artwork.
              Positioned(
                right: -26,
                top: -34,
                child: Container(height: 110, width: 110, decoration: BoxDecoration(shape: BoxShape.circle, color: AppColor.white.withValues(alpha: 0.10))),
              ),
              Positioned(
                right: 34,
                bottom: -44,
                child: Container(height: 84, width: 84, decoration: BoxDecoration(shape: BoxShape.circle, color: AppColor.white.withValues(alpha: 0.07))),
              ),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                child: Row(
                  children: [
                    leading,
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            title,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: GoogleFonts.urbanist(fontWeight: FontWeight.w800, fontSize: 19, color: AppColor.white, letterSpacing: -0.2),
                          ),
                          const SizedBox(height: 3),
                          Text(
                            subtitle,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: GoogleFonts.urbanist(fontSize: 12.5, height: 1.3, color: AppColor.white.withValues(alpha: 0.92), fontWeight: FontWeight.w500),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      height: 34,
                      width: 34,
                      decoration: BoxDecoration(shape: BoxShape.circle, color: AppColor.white.withValues(alpha: 0.22)),
                      child: const Icon(Icons.arrow_forward_rounded, size: 19, color: AppColor.white),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

void _toggleIncognito() {
  AppSettings.isIncognitoMode.value = !AppSettings.isIncognitoMode.value;
  AppSettings.isCreateHistory.value = !AppSettings.isIncognitoMode.value;
  Database.onSetIncognitoMode(AppSettings.isIncognitoMode.value);
  Database.onSetCreateHistory(AppSettings.isCreateHistory.value);
}

class ProfileItemUi extends StatelessWidget {
  const ProfileItemUi({super.key, required this.title, required this.leading, this.trailing, required this.callback, this.color, this.icon, this.iconSize});

  final String title;
  final String leading;
  final Widget? trailing;
  final Callback callback;
  final Color? color;
  final double? iconSize;
  final Widget? icon;

  @override
  Widget build(BuildContext context) {
    final dark = isDarkMode.value;
    return AppPressable(
      onTap: callback,
      pressedScale: 0.985,
      semanticLabel: title,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 7),
        child: Row(
          children: [
            Container(
              height: 42,
              width: 42,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(13),
                color: dark ? AppColor.white.withValues(alpha: 0.08) : AppColor.secondaryMintGreen,
              ),
              child: Center(
                child: ImageIcon(
                  AssetImage(leading),
                  color: color ?? (dark ? AppColor.white : AppColor.darkForestAccent),
                  size: (iconSize ?? 24).clamp(18, 24).toDouble(),
                ),
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Row(
                children: [
                  Flexible(
                    child: Text(
                      title,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: GoogleFonts.urbanist(fontSize: 16.5, fontWeight: FontWeight.w700, color: color),
                    ),
                  ),
                  icon ?? const Offstage(),
                ],
              ),
            ),
            trailing ?? Icon(Icons.chevron_right_rounded, size: 24, color: dark ? AppColor.mutedTextDark : AppColor.mutedText),
          ],
        ),
      ),
    );
  }
}
