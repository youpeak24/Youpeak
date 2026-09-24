import 'dart:developer';

import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:get/get_rx/src/rx_typedefs/rx_typedefs.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/custom/custom_api/delete_account_api.dart';
import 'package:youpeak/custom/custom_method/custom_format_number.dart';
import 'package:youpeak/custom/custom_method/custom_toast.dart';
import 'package:youpeak/custom/custom_ui/loader_ui.dart';
import 'package:youpeak/database/database.dart';
import 'package:youpeak/main.dart';
import 'package:youpeak/pages/admin_settings/admin_settings_api.dart';
import 'package:youpeak/pages/buy_coin_page/view/buy_coin_view.dart';
import 'package:youpeak/pages/login_related_page/fill_profile_page/get_profile_api.dart';
import 'package:youpeak/pages/profile_page/create_channel_page/create_channel_screen.dart';
import 'package:youpeak/pages/profile_page/earn_reward_page/earn_reward_view.dart';
import 'package:youpeak/pages/profile_page/creator_tier_page/creator_tier_view.dart';
import 'package:youpeak/pages/profile_page/video_promotion_page/promote_video_view.dart';
import 'package:youpeak/pages/profile_page/edit_profile/edit_profile.dart';
import 'package:youpeak/pages/profile_page/help_center_page/help_center_view.dart';
import 'package:youpeak/pages/profile_page/main_page/profile_controller.dart';
import 'package:youpeak/pages/profile_page/monetization_page/monetization_view.dart';
import 'package:youpeak/pages/profile_page/monetization_page/preview_monetization.dart';
import 'package:youpeak/pages/profile_page/my_wallet_page/my_wallet_view.dart';
import 'package:youpeak/pages/profile_page/premium_plan_page/premium_plan_view.dart';
import 'package:youpeak/pages/profile_page/premium_plan_page/purchase_plan_view.dart';
import 'package:youpeak/pages/profile_page/setting_page/settings_view.dart';
import 'package:youpeak/pages/profile_page/time_watch_page/time_watch_view.dart';
import 'package:youpeak/pages/profile_page/your_channel_page/main_page/your_channel_view.dart';
import 'package:youpeak/pages/subscription_plan_page/view/subscription_plan_view.dart';
import 'package:youpeak/utils/colors/app_color.dart';
import 'package:youpeak/utils/config/size_config.dart';
import 'package:youpeak/utils/icons/app_icons.dart';
import 'package:youpeak/utils/services/preview_image.dart';
import 'package:youpeak/utils/settings/app_settings.dart';
import 'package:youpeak/utils/string/app_string.dart';
import 'package:youpeak/utils/theme/theme_services.dart';
import 'package:youpeak/utils/utils.dart';

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
        title: Text(AppStrings.profile.tr, style: GoogleFonts.urbanist(fontSize: 20, fontWeight: FontWeight.bold)),
        actions: [
          GestureDetector(
            onTap: () async {
              await Get.to(() => const EarnRewardView());
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
      body: SingleChildScrollView(
        physics: const BouncingScrollPhysics(),
        child: Column(
          children: [
            15.height,
            Row(
              children: [
                15.width,
                GestureDetector(
                  onTap: () => Get.to(const EditProfileView()),
                  child: SizedBox(
                    height: 120,
                    width: 120,
                    child: Stack(
                      children: [
                        Obx(
                          () {
                            print("image::::::::::::::::::::::::::${AppSettings.profileImage.value}");
                            return PreviewProfileImage(
                              size: 120,
                              id: Database.channelId ?? "",
                              image: AppSettings.profileImage.value,
                              fit: BoxFit.cover,
                            );
                          },
                        ),
                        Positioned(
                          bottom: 6,
                          right: 6,
                          child: Container(
                            height: 32,
                            width: 32,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: AppColor.primaryColor,
                              border: Border.all(color: AppColor.white, width: 2),
                              boxShadow: [
                                BoxShadow(color: AppColor.black.withValues(alpha: 0.15), blurRadius: 4),
                              ],
                            ),
                            child: const Center(
                              child: Icon(Icons.edit_rounded, size: 16, color: AppColor.white),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                15.width,
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(AppSettings.channelName.value,
                          maxLines: 1, overflow: TextOverflow.ellipsis, style: GoogleFonts.urbanist(fontSize: 20, fontWeight: FontWeight.bold)),
                      Text(GetProfileApi.profileModel?.user?.email ?? "",
                          maxLines: 1, overflow: TextOverflow.ellipsis, style: GoogleFonts.urbanist(fontSize: 14, fontWeight: FontWeight.w500)),
                      2.height,
                      Obx(
                        () => Text(
                          "${AppStrings.myBalance.tr} : ${controller.myBalance}${AppStrings.currencySymbol}",
                          style: GoogleFonts.urbanist(fontSize: 14, fontWeight: FontWeight.w500),
                        ),
                      ),
                    ],
                  ),
                ),
                15.width,
              ],
            ),
            10.height,
            Divider(color: AppColor.grey_200, indent: 15, endIndent: 15),
            15.height,
            GestureDetector(
              onTap: () {
                if (GetProfileApi.profileModel?.user?.isPremiumPlan ?? false) {
                  Get.to(() => const PurchasePlanView());
                } else {
                  Get.to(() => PremiumPlanView());
                }
              },
              child: Container(
                height: 95,
                width: Get.width,
                margin: const EdgeInsets.symmetric(horizontal: 15),
                padding: const EdgeInsets.symmetric(horizontal: 15),
                decoration: BoxDecoration(
                  gradient: AppColor.pinkLinearGradient,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    Image.asset(
                      // (GetProfileApi.profileModel?.user?.isPremiumPlan ?? false) ? AppIcons.tick : AppIcons.premiumImage,
                      AppIcons.premiumImage,
                      color: Colors.white,
                      width: 60,
                    ),
                    15.width,
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            (GetProfileApi.profileModel?.user?.isPremiumPlan ?? false) ? AppStrings.youPeakPremium.tr : AppStrings.getYouPeakPremium.tr,
                            style: GoogleFonts.urbanist(fontWeight: FontWeight.w800, fontSize: 20, color: AppColor.white),
                          ),
                          Text(
                            (GetProfileApi.profileModel?.user?.isPremiumPlan ?? false) ? AppStrings.purchasePlanSubTitle.tr : AppStrings.premiumBenefits.tr,
                            style: GoogleFonts.urbanist(
                              fontSize: 12,
                              color: AppColor.white,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                    ),
                    10.width,
                    const Image(
                      image: AssetImage(AppIcons.arrowRight),
                      width: 30,
                      color: AppColor.white,
                    ),
                  ],
                ),
              ),
            ),
            15.height,
            GestureDetector(
              onTap: () {
                Get.to(const BuyCoinView())?.then(
                  (value) {
                    controller.onGetRewardCoin();
                  },
                );
              },
              child: Container(
                height: 95,
                width: Get.width,
                margin: const EdgeInsets.symmetric(horizontal: 15),
                padding: const EdgeInsets.symmetric(horizontal: 15),
                decoration: BoxDecoration(
                  color: AppColor.orangeColor,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    Container(
                      height: 60,
                      width: 60,
                      padding: const EdgeInsets.all(5),
                      decoration: const BoxDecoration(shape: BoxShape.circle, color: AppColor.white),
                      child: Image.asset(AppIcons.coin),
                    ),
                    15.width,
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            AppStrings.buyCoinSubscription.tr,
                            style: GoogleFonts.urbanist(fontWeight: FontWeight.w800, fontSize: 20, color: AppColor.white),
                          ),
                          Text(
                            AppStrings.premiumBenefits.tr,
                            style: GoogleFonts.urbanist(
                              fontSize: 12,
                              color: AppColor.white,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                    ),
                    10.width,
                    const Image(
                      image: AssetImage(AppIcons.arrowRight),
                      width: 30,
                      color: AppColor.white,
                    ),
                  ],
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 15),
              child: Column(
                children: [
                  ProfileItemUi(
                    title: AppStrings.incognito.tr,
                    leading: AppIcons.incognito,
                    trailing: GestureDetector(
                      // Incognito used to also force isDarkMode on/off as a side
                      // effect (and duplicated that logic again in the switch's
                      // own onChanged below, so one tap could fire both handlers
                      // and leave isDarkMode and the real Flutter ThemeMode
                      // pointing different directions). Incognito now only
                      // touches incognito/history state; theme is exclusively
                      // the Settings > Dark Mode toggle's job.
                      onTap: () {
                        AppSettings.isIncognitoMode.value = !AppSettings.isIncognitoMode.value;
                        AppSettings.isCreateHistory.value = !AppSettings.isIncognitoMode.value;
                        Database.onSetIncognitoMode(AppSettings.isIncognitoMode.value);
                        Database.onSetCreateHistory(AppSettings.isCreateHistory.value);
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
                                () => IgnorePointer(
                                  // Purely visual — the surrounding GestureDetector
                                  // is the single source of truth so one tap can't
                                  // double-fire both this and onTap above.
                                  child: CupertinoSwitch(
                                    activeColor: AppColor.primaryColor,
                                    value: AppSettings.isIncognitoMode.value,
                                    onChanged: (value) {},
                                  ),
                                ),
                              ),
                            ),
                          )),
                    ),
                    callback: () {},
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
                      await Get.to(() => const EarnRewardView());
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
                                  AppIcons.tick,
                                  width: 12,
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
                      callback: () => Get.bottomSheet(
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
                          ),
                          height: 180,
                          decoration: BoxDecoration(
                            color: isDarkMode.value ? AppColor.secondDarkMode : AppColor.white,
                            borderRadius: const BorderRadius.only(topRight: Radius.circular(40), topLeft: Radius.circular(40)),
                          ),
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.start,
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
                              const SizedBox(height: 10),
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
                    ).paddingOnly(left: Get.width * 0.005),
                  ),
                  ProfileItemUi(
                    leading: AppIcons.deleteAccount,
                    title: AppStrings.deleteAccount.tr,
                    trailing: const Offstage(),
                    color: AppColor.primaryColor,
                    callback: () {
                      Get.bottomSheet(
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
                          ),
                          height: 180,
                          decoration: BoxDecoration(
                            color: isDarkMode.value ? AppColor.secondDarkMode : AppColor.white,
                            borderRadius: const BorderRadius.only(topRight: Radius.circular(40), topLeft: Radius.circular(40)),
                          ),
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.start,
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
                              const SizedBox(height: 10),
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
            ),
            SizedBox(height: Get.height * 0.05),
          ],
        ),
      ),
    );
  }
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
    return GestureDetector(
      onTap: callback,
      child: Padding(
        padding: EdgeInsets.only(top: SizeConfig.blockSizeVertical * 2.5),
        child: Container(
          color: AppColor.transparent,
          child: Center(
            child: Row(
              children: [
                SizedBox(width: 30, child: Center(child: ImageIcon(AssetImage(leading), color: color, size: iconSize ?? 25))),
                SizedBox(width: SizeConfig.blockSizeHorizontal * 2),
                Text(title, style: GoogleFonts.urbanist(fontSize: 17, fontWeight: FontWeight.w600, color: color)),
                icon ?? const Offstage(),
                const Spacer(),
                trailing ?? const Icon(Icons.arrow_forward_ios_rounded, size: 18),
                SizedBox(width: SizeConfig.blockSizeHorizontal * 0.3),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
