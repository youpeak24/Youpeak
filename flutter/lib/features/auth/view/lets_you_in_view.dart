import 'package:youpeak/shared/widgets/app_icon.dart';
import 'package:youpeak/core/platform/app_layout.dart';

import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:youpeak/core/navigation/root_back.dart';
import 'package:get/get.dart';
import 'package:get/get_rx/src/rx_typedefs/rx_typedefs.dart';
import 'package:youpeak/shared/widgets/basic_button.dart';
import 'package:youpeak/shared/dialogs/custom_dialog.dart';
import 'package:youpeak/core/utils/custom_toast.dart';
import 'package:youpeak/shared/widgets/loader_ui.dart';
import 'package:youpeak/core/storage/database/database.dart';
import 'package:youpeak/main.dart';
import 'package:youpeak/core/settings/admin_settings_api.dart';
import 'package:youpeak/features/auth/view/fill_profile_view.dart';
import 'package:youpeak/features/profile/api/get_profile_api.dart';
import 'package:youpeak/features/auth/service/google_sign_in_flow.dart';
import 'package:youpeak/features/auth/view/login_view.dart';
import 'package:youpeak/features/auth/api/sign_up_api.dart';
import 'package:youpeak/features/auth/model/sign_up_model.dart';
import 'package:youpeak/features/auth/view/sign_up_view.dart';
import 'package:youpeak/features/main/view/main_home_view.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:youpeak/core/theme/app_tokens.dart';
import 'package:youpeak/shared/widgets/app_pressable.dart';
import 'package:youpeak/core/assets/app_icons.dart';
import 'package:youpeak/core/assets/app_visuals.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'package:youpeak/core/constants/app_string.dart';
import 'package:youpeak/core/theme/app_style.dart';
import 'package:sign_in_with_apple/sign_in_with_apple.dart';

import 'package:youpeak/features/live/widget/device_orientation.dart';
import 'package:youpeak/core/platform/platform_info.dart';
import 'package:youpeak/features/auth/phone/presentation/phone_login_view.dart';

class LetsYouInView extends StatefulWidget {
  const LetsYouInView({super.key});

  @override
  State<LetsYouInView> createState() => _LetsYouInViewState();
}

class _LetsYouInViewState extends State<LetsYouInView> {
  SignUpModel? _signUpModel;

  @override
  Widget build(BuildContext context) {
    return WillPopScope(
      onWillPop: () => handleRootBack(context),
      child: Scaffold(
        backgroundColor: isDarkMode.value ? AppColor.mainDark : AppColor.white,
        body: Container(
          // Brand-tinted wash from the top: mint on light, forest on dark.
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: isDarkMode.value
                  ? [AppColor.darkForestAccent.withValues(alpha: 0.55), AppColor.mainDark]
                  : [AppColor.secondaryMintGreen, AppColor.white],
              stops: const [0.0, 0.55],
            ),
          ),
          child: Center(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: SingleChildScrollView(
              child: Column(
                children: [
                  Container(
                      alignment: Alignment.center,
                      height: Get.height / 4.5,
                      decoration: const BoxDecoration(),
                      child: ColorFiltered(
                        colorFilter: const ColorFilter.mode(AppColor.primaryColor, BlendMode.modulate),
                        child: const Image(image: AssetImage(AppIcons.loginLogo)),
                      )),
                  SizedBox(height: Get.height / 35),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Flexible(child: Text(AppStrings.letsYouIn.tr, textAlign: TextAlign.center, style: letsInStyle)),
                      const SizedBox(width: 8),
                      Image.asset(AppVisuals.wave, width: 40, height: 40),
                    ],
                  ),
                  SizedBox(height: Get.height / 35),
                  // Primary sign-in: Firebase Phone OTP.
                  ButtonItemUi(
                    title: "Continue with phone",
                    icon: const AppIcon(AppIcons.extraPhoneSignIn, color: AppColor.primaryColor, size: 24),
                    callback: () => Get.to(() => const PhoneLoginView()),
                  ),
                  SizedBox(height: Get.height / 35),
                  ButtonItemUi(
                    title: AppStrings.googleLogin.tr,
                    icon: Image.asset(AppIcons.googleLogo, width: 25),
                    callback: GoogleSignInFlow.run,
                  ),
                  SizedBox(height: Get.height / 35),
                  PlatformInfo.isIOS
                      ? Column(
                          children: [
                            ButtonItemUi(
                              title: AppStrings.appleLogin.tr,
                              icon: Image.asset(AppIcons.appleLogo, width: 28, color: isDarkMode.value ? AppColor.white : AppColor.black),
                              callback: PlatformInfo.isIOS
                                  ? () async {
                                      try {
                                        // Show loading dialog
                                        Get.dialog(const LoaderUi(color: AppColor.white), barrierDismissible: false);

                                        // Check if Apple Sign In is available
                                        final isAvailable = await SignInWithApple.isAvailable();
                                        if (!isAvailable) {
                                          Get.back();
                                          CustomToast.show("Apple Sign In is not available on this device");
                                          return;
                                        }

                                        // Get Apple credentials
                                        final appleCredential = await SignInWithApple.getAppleIDCredential(
                                          scopes: [
                                            AppleIDAuthorizationScopes.email,
                                            AppleIDAuthorizationScopes.fullName,
                                          ],
                                        );

                                        // Validate Apple credential
                                        if (appleCredential.identityToken == null) {
                                          Get.back();
                                          CustomToast.show("Failed to get Apple credentials");
                                          return;
                                        }

                                        // Create Firebase OAuth credential
                                        final oauthCredential = OAuthProvider("apple.com").credential(
                                          idToken: appleCredential.identityToken,
                                          accessToken: appleCredential.authorizationCode, // Add this if needed
                                        );

                                        // Sign in with Firebase
                                        final response = await FirebaseAuth.instance.signInWithCredential(oauthCredential);

                                        // Check if user and email exist
                                        if (response.user == null) {
                                          Get.back();
                                          CustomToast.show("Authentication failed");
                                          return;
                                        }

                                        String? userEmail = response.user!.email;

                                        // Handle case where Apple doesn't provide email (return users)
                                        if (userEmail == null || userEmail.isEmpty) {
                                          // For return users, Apple might not provide email
                                          // You can use the user ID or prompt user to enter email
                                          userEmail = appleCredential.email ?? response.user!.uid + "@appleid.com";
                                        }

                                        // Validate required tokens
                                        if (Database.fcmToken == null || Database.deviceId == null) {
                                          Get.back();
                                          CustomToast.show("Device information not available. Please restart the app.");
                                          return;
                                        }

                                        // Call your signup API
                                        _signUpModel = await SignUpApi.callApi(
                                            userEmail,
                                            null,
                                            3, // Apple login type
                                            Database.fcmToken!,
                                            Database.deviceId!);

                                        // Handle API response
                                        if (_signUpModel != null && _signUpModel?.user?.id != null) {
                                          // Login with referral
                                          AppSettings.onLoginWithReferral(loginUserId: _signUpModel?.user?.id ?? "");

                                          if (_signUpModel?.status == true && _signUpModel?.signUp == true) {
                                            // New user - go to profile fill
                                            Get.back();
                                            Get.offAll(FillProfileView(email: userEmail, loginUserId: _signUpModel!.user!.id!));
                                          } else {
                                            // Existing user - get profile and go to home
                                            Get.back();
                                            CustomDialog.show(AppIcons.profileDoneLogo1, AppStrings.congratulations.tr, AppStrings.congratulationsNote.tr);

                                            if (_signUpModel?.user?.id != null) {
                                              await GetProfileApi.callApi(_signUpModel!.user!.id!);
                                            }

                                            Get.back();

                                            // Was also gating on Database.loginUserId != null
                                            // and AdminSettingsApi.adminSettingsModel?.setting
                                            // != null, neither set/needed directly by this
                                            // flow — the former only gets set as a side effect
                                            // deep inside GetProfileApi.callApi() and could
                                            // read stale/null right after a fully successful
                                            // login. Trust the profile we just fetched instead.
                                            if (GetProfileApi.profileModel?.user != null) {
                                              Get.offAll(const MainHomePageView());
                                            } else {
                                              CustomToast.show(AppStrings.getProfileFailed.tr);
                                            }
                                          }
                                        } else {
                                          // Handle signup failure
                                          Get.back();
                                          if (_signUpModel?.message == "You are blocked by admin!") {
                                            CustomToast.show(_signUpModel?.message.toString() ?? AppStrings.someThingWentWrong.tr);
                                          } else {
                                            CustomToast.show(_signUpModel?.message ?? AppStrings.signUpFailed.tr);
                                          }
                                        }
                                      } catch (e) {
                                        // Better error handling
                                        Get.back();
                                        print("Apple Login Error: $e");

                                        if (e is SignInWithAppleAuthorizationException) {
                                        } else if (e is FirebaseAuthException) {
                                          CustomToast.show("Firebase error: ${e.message}");
                                        } else {
                                          CustomToast.show("An unexpected error occurred");
                                        }
                                      }
                                    }
                                  : () {
                                      CustomToast.show(AppStrings.thisIsNotIosPlatform.tr);
                                    },
                            ),
                            SizedBox(height: Get.height / 35),
                          ],
                        )
                      : const Offstage(),
                  SizedBox(
                    width: AppLayout.width,
                    child: Row(
                      children: [
                        Expanded(
                          child: Container(
                            height: 1,
                            margin: const EdgeInsets.only(right: 15),
                            decoration: BoxDecoration(color: AppElevation.hairline(isDarkMode.value), borderRadius: BorderRadius.circular(10)),
                          ),
                        ),
                        Text(
                          AppStrings.or.tr,
                          textAlign: TextAlign.center,
                          style: orStyle,
                        ),
                        Expanded(
                          child: Container(
                            height: 1,
                            margin: const EdgeInsets.only(left: 15),
                            decoration: BoxDecoration(color: AppElevation.hairline(isDarkMode.value), borderRadius: BorderRadius.circular(10)),
                          ),
                        ),
                      ],
                    ),
                  ),
                  SizedBox(height: Get.height / 35),
                  BasicButton(width: AppLayout.width, title: AppStrings.signWithPassword.tr, callback: () => Get.to(() => const LoginView())),
                  SizedBox(height: Get.height / 35),
                  LoginScreenBottomText(
                    text1: AppStrings.dontHaveAnAccount.tr,
                    text2: AppStrings.signUp.tr,
                    onTap: () => Get.to(() => const SignUpView()),
                  ),
                ],
              ),
            ),
          ),
        ),
        ),  // closes Container (gradient background)
      ),
    );
  }
}

class ButtonItemUi extends StatelessWidget {
  const ButtonItemUi({super.key, required this.title, required this.icon, required this.callback});

  final String title;
  final Widget icon;
  final Callback callback;

  @override
  Widget build(BuildContext context) {
    final dark = isDarkMode.value;
    return AppPressable(
      onTap: callback,
      haptic: true,
      pressedScale: 0.98,
      semanticLabel: title,
      child: Container(
        height: 56,
        width: AppLayout.width,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        decoration: BoxDecoration(
          color: dark ? AppColor.white.withValues(alpha: 0.06) : AppColor.white,
          borderRadius: BorderRadius.circular(AppRadius.card),
          border: Border.all(color: dark ? const Color(0xff35383F) : AppColor.hairlineLight, width: 1.2),
          boxShadow: AppElevation.card(dark),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            icon,
            const SizedBox(width: 12),
            Flexible(child: Text(title, maxLines: 1, overflow: TextOverflow.ellipsis, style: loginMethodStyle.copyWith(fontSize: 15, fontWeight: FontWeight.w700))),
          ],
        ),
      ),
    );
  }
}
