import 'dart:io';

import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:get/get_rx/src/rx_typedefs/rx_typedefs.dart';
import 'package:youpeak/shared/widgets/basic_button.dart';
import 'package:youpeak/shared/dialogs/custom_dialog.dart';
import 'package:youpeak/core/utils/custom_toast.dart';
import 'package:youpeak/shared/widgets/loader_ui.dart';
import 'package:youpeak/shared/dialogs/app_exit_dialog.dart';
import 'package:youpeak/core/storage/database/database.dart';
import 'package:youpeak/main.dart';
import 'package:youpeak/core/settings/admin_settings_api.dart';
import 'package:youpeak/features/auth/view/fill_profile_view.dart';
import 'package:youpeak/features/profile/api/get_profile_api.dart';
import 'package:youpeak/features/auth/service/google_login.dart';
import 'package:youpeak/features/auth/view/login_view.dart';
import 'package:youpeak/features/auth/api/sign_up_api.dart';
import 'package:youpeak/features/auth/model/sign_up_model.dart';
import 'package:youpeak/features/auth/view/sign_up_view.dart';
import 'package:youpeak/features/main/view/main_home_view.dart';
import 'package:youpeak/core/theme/app_color.dart';
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
      onWillPop: () async {
        if (AppSettings.navigationIndex.value != 0) {
          AppSettings.navigationIndex.value = 0;
          return false;
        } else {
          final shouldExit = await Get.dialog<bool>(
            const AppExitDialog(),
          );
          if (shouldExit == true) {
            if (PlatformInfo.isAndroid) {
              SystemNavigator.pop();
            } else if (PlatformInfo.isIOS) {
              exit(0);
            }
          }
          return false;
        }
      },
      child: Scaffold(
        backgroundColor: isDarkMode.value ? const Color(0xFF0D0826) : const Color(0xFFF5F4FF),
        body: Container(
          decoration: isDarkMode.value
              ? null
              : const BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      Color(0xFFECEAFF), // Very light blue-purple top
                      Color(0xFFF8F7FF), // Near-white bottom
                    ],
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
                    icon: const Icon(Icons.phone_iphone_rounded, color: AppColor.primaryColor, size: 26),
                    callback: () => Get.to(() => const PhoneLoginView()),
                  ),
                  SizedBox(height: Get.height / 35),
                  ButtonItemUi(
                    title: AppStrings.googleLogin.tr,
                    icon: Image.asset(AppIcons.googleLogo, width: 25),
                    callback: () async {
                      Get.dialog(const LoaderUi(color: AppColor.white), barrierDismissible: false);

                      dynamic response;
                      try {
                        response = await GoogleLogin.signInWithGoogle();
                      } catch (e) {
                        AppSettings.showLog("GOOGLE ERROOR $e");
                      }

                      if (response != null && response.user?.email != null) {
                        final fcmToken = Database.fcmToken ?? "dummy_fcm_token";
                        final deviceId = Database.deviceId ?? "dummy_device_id";

                        _signUpModel = await SignUpApi.callApi(response.user!.email!, null, 2, fcmToken, deviceId);

                        AppSettings.showLog("SignUp Result Status: ${_signUpModel?.status}, SignUp: ${_signUpModel?.signUp}");

                        if (_signUpModel != null && _signUpModel?.user?.id != null) {
                          AppSettings.onLoginWithReferral(loginUserId: _signUpModel?.user?.id ?? "");

                          if (_signUpModel?.user?.id != null) {
                            await GetProfileApi.callApi(_signUpModel!.user!.id!);
                          }

                          final userProfile = GetProfileApi.profileModel?.user;
                          final hasFullName = userProfile?.fullName != null && userProfile!.fullName!.isNotEmpty;

                          Get.back();
                          if (!hasFullName || _signUpModel?.signUp == true) {
                            Get.offAll(FillProfileView(
                              email: response.user!.email!,
                              loginUserId: _signUpModel!.user!.id!,
                              profileImage: response.user!.photoURL,
                              username: response.user!.displayName,
                            ));
                          } else {
                            Get.offAll(const MainHomePageView());
                          }
                        } else {
                          Get.back();
                          if (_signUpModel?.message == "You are blocked by admin!") {
                            CustomToast.show(_signUpModel?.message.toString() ?? AppStrings.someThingWentWrong.tr);
                          } else {
                            // Fallback login directly if server user auto-creation succeeds
                            Get.offAll(const MainHomePageView());
                          }
                        }
                      } else {
                        Get.back();
                        CustomToast.show(AppStrings.googleLoginFailed.tr);
                      }
                    },
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
                    width: Get.width,
                    child: Row(
                      children: [
                        Expanded(
                          child: Container(
                            height: 1,
                            margin: const EdgeInsets.only(right: 15),
                            decoration: BoxDecoration(color: Colors.grey.shade300, borderRadius: BorderRadius.circular(10)),
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
                            decoration: BoxDecoration(color: Colors.grey.shade300, borderRadius: BorderRadius.circular(10)),
                          ),
                        ),
                      ],
                    ),
                  ),
                  SizedBox(height: Get.height / 35),
                  BasicButton(width: Get.width, title: AppStrings.signWithPassword.tr, callback: () => Get.offAll(() => const LoginView())),
                  SizedBox(height: Get.height / 35),
                  LoginScreenBottomText(
                    text1: AppStrings.dontHaveAnAccount.tr,
                    text2: AppStrings.signUp.tr,
                    onTap: () => Get.offAll(() => const SignUpView()),
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
    return GestureDetector(
      onTap: callback,
      child: Container(
        height: Get.height * 0.064,
        width: Get.width,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: isDarkMode.value ? const Color(0xff35383F) : Colors.black12),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Row(
              mainAxisSize: MainAxisSize.min,
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                icon,
                const SizedBox(width: 12),
                Text(title, style: loginMethodStyle),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
