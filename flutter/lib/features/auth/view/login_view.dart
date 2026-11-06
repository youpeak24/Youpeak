import 'package:youpeak/core/platform/app_layout.dart';

import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:youpeak/core/navigation/root_back.dart';
import 'package:get/get.dart';
import 'package:youpeak/shared/widgets/basic_button.dart';
import 'package:youpeak/shared/widgets/custom_box_button.dart';
import 'package:youpeak/shared/dialogs/custom_dialog.dart';
import 'package:youpeak/shared/widgets/custom_text_field.dart';
import 'package:youpeak/core/utils/custom_toast.dart';
import 'package:youpeak/shared/dialogs/blocked_user_dialog.dart';
import 'package:youpeak/shared/widgets/loader_ui.dart';
import 'package:youpeak/core/storage/database/database.dart';
import 'package:youpeak/main.dart';
import 'package:youpeak/core/settings/admin_settings_api.dart';
import 'package:youpeak/features/auth/view/fill_profile_view.dart';
import 'package:youpeak/features/profile/api/get_profile_api.dart';
import 'package:youpeak/features/auth/view/forget_password_view.dart';
import 'package:youpeak/features/auth/service/google_sign_in_flow.dart';
import 'package:youpeak/features/auth/view/lets_you_in_view.dart';
import 'package:youpeak/features/auth/api/login_api.dart';
import 'package:youpeak/features/auth/model/login_model.dart';
import 'package:youpeak/features/auth/api/sign_up_api.dart';
import 'package:youpeak/features/auth/model/sign_up_model.dart';
import 'package:youpeak/features/auth/view/sign_up_view.dart';
import 'package:youpeak/features/main/view/main_home_view.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:youpeak/core/theme/app_tokens.dart';
import 'package:youpeak/core/config/size_config.dart';
import 'package:youpeak/core/assets/app_icons.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'package:youpeak/core/constants/app_string.dart';
import 'package:youpeak/core/theme/app_style.dart';
import 'package:sign_in_with_apple/sign_in_with_apple.dart';
import 'package:youpeak/core/platform/platform_info.dart';

class LoginView extends StatefulWidget {
  const LoginView({super.key});

  @override
  State<LoginView> createState() => _LoginViewState();
}

class _LoginViewState extends State<LoginView> {
  LoginModel? _loginModel;
  SignUpModel? _signUpModel;

  TextEditingController emailController = TextEditingController();
  TextEditingController passwordController = TextEditingController();
  RxBool isShowPassword = false.obs;
  RxBool isRememberMe = false.obs;

  FocusNode passwordFocusNode = FocusNode();
  FocusNode emailFocusNode = FocusNode();

  @override
  void initState() {
    emailController.clear();
    passwordController.clear();
    isShowPassword(false);
    isRememberMe(false);

    emailFocusNode.addListener(() {
      if (emailFocusNode.hasFocus) {
        setState(() => color = const Color(0xFFFCE7E9));
      } else {
        color = AppColor.grey_100;
      }
    });
    passwordFocusNode.addListener(() {
      if (passwordFocusNode.hasFocus) {
        setState(() => color = const Color(0xFFFCE7E9));
      } else {
        color = AppColor.grey_100;
      }
    });
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20),
        child: SingleChildScrollView(
          physics: const BouncingScrollPhysics(),
          child: Column(
            children: [
              SizedBox(height: Get.height * 0.15),
              Image.asset(AppIcons.logo, width: Get.height * 0.12),
              SizedBox(height: Get.height / 25),
              Text(AppStrings.loginYourAccount.tr, textAlign: TextAlign.center, style: createAccountStyle),
              SizedBox(height: SizeConfig.screenHeight / 35),
              Column(
                children: [
                  CustomTextFieldView(
                    width: AppLayout.width,
                    hintText: AppStrings.email.tr,
                    prefixIconPath: AppIcons.email,
                    controller: emailController,
                    focusNode: emailFocusNode,
                    keyboardType: TextInputType.emailAddress,
                  ),
                  SizedBox(height: SizeConfig.screenHeight / 50),
                  Obx(
                    () => CustomTextFieldView(
                      width: AppLayout.width,
                      hintText: AppStrings.password.tr,
                      obscureText: !isShowPassword.value,
                      prefixIconPath: AppIcons.password,
                      controller: passwordController,
                      suffixIconPath: isShowPassword.value ? AppIcons.show : AppIcons.hide,
                      suffixIconCallback: () => isShowPassword.value = !isShowPassword.value,
                      focusNode: passwordFocusNode,
                      keyboardType: TextInputType.visiblePassword,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              GestureDetector(
                onTap: () => isRememberMe.value = !isRememberMe.value,
                child: SizedBox(
                  height: 40,
                  // color: Colors.lightBlue,
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      SizedBox(
                        height: 22,
                        width: 22,
                        child: Obx(
                          () => Checkbox(
                            activeColor: AppColor.primaryColor,
                            checkColor: AppColor.white,
                            value: isRememberMe.value,
                            onChanged: (value) => isRememberMe.value = value!,
                            shape: const RoundedRectangleBorder(borderRadius: BorderRadius.all(Radius.circular(5))),
                            side: const BorderSide(color: AppColor.primaryColor, width: 1.5),
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Text(
                        AppStrings.rememberMe.tr,
                        textAlign: TextAlign.center,
                        style: rememberStyle,
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 10),
              BasicButton(
                width: AppLayout.width,
                title: AppStrings.signIN.tr,
                callback: () async {
                  if (emailController.text.isNotEmpty && passwordController.text.isNotEmpty) {
                    AppSettings.showLog("Login Email => ${emailController.text}");
                    AppSettings.showLog("Login Password => ${passwordController.text}");
                    Get.dialog(const LoaderUi(color: AppColor.white), barrierDismissible: false);

                    _loginModel = await LoginApi.callApi(emailController.text.trim(), passwordController.text.trim(), 4);

                    if (_loginModel?.status == true && _loginModel?.isLogin == true) {
                      if (Database.deviceId != null && Database.fcmToken != null) {
                        _signUpModel = await SignUpApi.callApi(
                          emailController.text.trim(),
                          passwordController.text.trim(),
                          4, // Use => Email Login
                          Database.fcmToken!,
                          Database.deviceId!,
                        );
                        if (_signUpModel != null && _signUpModel?.user?.id != null) {
                          AppSettings.onLoginWithReferral(loginUserId: _signUpModel?.user?.id ?? "");
                          Get.back();
                          if (_signUpModel?.signUp == false) {
                            CustomDialog.show(AppIcons.profileDoneLogo1, AppStrings.congratulations.tr, AppStrings.congratulationsNote.tr);
                            await GetProfileApi.callApi(_signUpModel!.user!.id!);
                            Get.back();
                            // Was also gating on Database.loginUserId != null, which this
                            // flow never sets directly — only as a side effect deep inside
                            // GetProfileApi.callApi() — so it could read stale/null right
                            // after a fully successful login, and there was no else branch
                            // at all, silently stranding the user on this screen. Trust the
                            // profile we just fetched above instead.
                            if (GetProfileApi.profileModel?.user != null) {
                              Get.offAll(const MainHomePageView());
                            } else {
                              CustomToast.show(AppStrings.getProfileFailed.tr);
                            }
                          } else {
                            Get.offAll(FillProfileView(email: _signUpModel!.user!.email!, loginUserId: _signUpModel!.user!.id!));
                          }
                        } else {
                          Get.back();
                          if (_signUpModel?.message != null) {
                            if (_signUpModel!.message!.toLowerCase().contains("block")) {
                              Get.dialog(const BlockedUserDialog(), barrierDismissible: false);
                            } else {
                              CustomToast.show(_signUpModel?.message.toString() ?? AppStrings.someThingWentWrong.tr);
                            }
                          }
                        }
                      } else {
                        Get.back();
                        CustomToast.show(AppStrings.someThingWentWrong.tr);
                      }
                    } else {
                      Get.back();
                      CustomToast.show(_loginModel?.message.toString() ?? AppStrings.someThingWentWrong.tr);
                      if (_loginModel?.message == "User must have sign up!!") {
                        emailController.clear();
                        passwordController.clear();
                        switchAuthPage(() => const SignUpView());
                      }
                    }
                  } else {
                    CustomToast.show(AppStrings.pleaseFillUpDetails.tr);
                  }
                }, // email on  tap
              ),
              SizedBox(height: SizeConfig.screenHeight / 50),
              GestureDetector(
                child: Text(AppStrings.forgetThePassword.tr, style: forGetPasswordStyle),
                onTap: () {
                  if (emailController.text.isNotEmpty || emailController.text != "") {
                    Get.to(() => ForgotPasswordView(email: emailController.text));
                  } else {
                    CustomToast.show(AppStrings.pleaseEnterYourEmail.tr);
                  }
                },
              ),
              SizedBox(height: SizeConfig.screenHeight / 20),
              SizedBox(
                width: AppLayout.width,
                child: Row(
                  children: [
                    Expanded(
                      child: Container(
                        height: 1,
                        margin: const EdgeInsets.only(right: 5),
                        decoration: BoxDecoration(color: AppElevation.hairline(isDarkMode.value), borderRadius: BorderRadius.circular(10)),
                      ),
                    ),
                    Expanded(
                      child: Text(
                        AppStrings.orContinueWith.tr,
                        textAlign: TextAlign.center,
                        style: titalstyle5,
                      ),
                    ),
                    Expanded(
                      child: Container(
                        height: 1,
                        margin: const EdgeInsets.only(left: 5),
                        decoration: BoxDecoration(color: AppElevation.hairline(isDarkMode.value), borderRadius: BorderRadius.circular(10)),
                      ),
                    ),
                  ],
                ),
              ),
              SizedBox(height: Get.height / 30),
              PlatformInfo.isIOS
                  ? Row(
                      mainAxisSize: MainAxisSize.min,
                      mainAxisAlignment: MainAxisAlignment.center,
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        CustomBoxButton(
                          callback: GoogleSignInFlow.run,
                          child: Image.asset(
                            AppIcons.googleLogo,
                            width: 30,
                          ),
                        ),
                        const SizedBox(width: 20),
                        CustomBoxButton(
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
                                      accessToken: appleCredential.authorizationCode,
                                    );

                                    // Sign in with Firebase
                                    final response = await FirebaseAuth.instance.signInWithCredential(oauthCredential);

                                    // Check if user exists
                                    if (response.user == null) {
                                      Get.back();
                                      CustomToast.show("Authentication failed");
                                      return;
                                    }

                                    String? userEmail = response.user!.email;
                                    String? userName = response.user!.displayName;
                                    String? photoURL = response.user!.photoURL;

                                    // Handle case where Apple doesn't provide email (return users)
                                    if (userEmail == null || userEmail.isEmpty) {
                                      // For return users, Apple might not provide email
                                      // Try to get from Apple credential first
                                      userEmail = appleCredential.email;

                                      if (userEmail == null || userEmail.isEmpty) {
                                        // As last resort, create a placeholder email
                                        userEmail = response.user!.uid + "@appleid.private";
                                      }
                                    }

                                    // Handle username from Apple credential if Firebase doesn't have it
                                    if (userName == null || userName.isEmpty) {
                                      if (appleCredential.givenName != null || appleCredential.familyName != null) {
                                        userName = "${appleCredential.givenName ?? ''} ${appleCredential.familyName ?? ''}".trim();
                                        if (userName.isEmpty) userName = null;
                                      }
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
                                        AppSettings.showLog("APP LOGIN 2");
                                        Get.offAll(FillProfileView(
                                          email: userEmail,
                                          loginUserId: _signUpModel!.user!.id!,
                                          username: userName,
                                          profileImage: photoURL,
                                        ));
                                      } else {
                                        // Existing user - get profile and go to home
                                        Get.back();
                                        CustomDialog.show(AppIcons.profileDoneLogo1, AppStrings.congratulations.tr, AppStrings.congratulationsNote.tr);

                                        if (_signUpModel?.user?.id != null) {
                                          await GetProfileApi.callApi(_signUpModel!.user!.id!);
                                        }

                                        Get.back();

                                        // Was also gating on Database.loginUserId != null and
                                        // AdminSettingsApi.adminSettingsModel?.setting != null,
                                        // neither set/needed directly by this flow — the former
                                        // only gets set as a side effect deep inside
                                        // GetProfileApi.callApi() and could read stale/null
                                        // right after a fully successful login. Trust the
                                        // profile we just fetched instead.
                                        if (GetProfileApi.profileModel?.user != null) {
                                          Get.offAll(const MainHomePageView());
                                        } else {
                                          CustomToast.show(AppStrings.getProfileFailed.tr);
                                        }
                                      }
                                    } else {
                                      // Handle signup failure
                                      Get.back();
                                      if (_signUpModel?.message != null) {
                                        if (_signUpModel!.message!.toLowerCase().contains("block")) {
                                          Get.dialog(const BlockedUserDialog(), barrierDismissible: false);
                                        } else {
                                          CustomToast.show(_signUpModel?.message.toString() ?? AppStrings.someThingWentWrong.tr);
                                        }
                                      } else {
                                        CustomToast.show(_signUpModel?.message ?? AppStrings.signUpFailed.tr);
                                      }
                                    }
                                  } catch (e) {
                                    // Enhanced error handling
                                    Get.back();
                                    AppSettings.showLog("Apple Login Error: $e");

                                    if (e is SignInWithAppleAuthorizationException) {
                                      switch (e.code) {
                                        case AuthorizationErrorCode.canceled:
                                          // User canceled - don't show error message
                                          AppSettings.showLog("Apple Sign In canceled by user");
                                          break;
                                        case AuthorizationErrorCode.failed:
                                          CustomToast.show("Apple Sign In failed. Please try again.");
                                          break;
                                        case AuthorizationErrorCode.invalidResponse:
                                          CustomToast.show("Invalid response from Apple. Please try again.");
                                          break;
                                        case AuthorizationErrorCode.notHandled:
                                          CustomToast.show("Apple Sign In not available. Please try again.");
                                          break;
                                        case AuthorizationErrorCode.unknown:
                                          CustomToast.show("Unknown error occurred. Please try again.");
                                          break;
                                        default:
                                          CustomToast.show("Apple Sign In failed. Please try again.");
                                      }
                                    } else if (e is FirebaseAuthException) {
                                      switch (e.code) {
                                        case 'invalid-credential':
                                          CustomToast.show("Invalid Apple credentials. Please try again.");
                                          break;
                                        case 'account-exists-with-different-credential':
                                          CustomToast.show("An account already exists with this email using a different sign-in method.");
                                          break;
                                        case 'network-request-failed':
                                          CustomToast.show("Network error. Please check your connection.");
                                          break;
                                        default:
                                          CustomToast.show("Authentication failed: ${e.message}");
                                      }
                                    } else {
                                      CustomToast.show("An unexpected error occurred. Please try again.");
                                    }
                                  }
                                }
                              : () {
                                  CustomToast.show(AppStrings.thisIsNotIosPlatform.tr);
                                },
                          child: Image.asset(AppIcons.appleLogo, color: isDarkMode.value ? AppColor.white : AppColor.black, width: 30),
                        ),
                      ],
                    )
                  : ButtonItemUi(
                      title: AppStrings.googleLogin.tr,
                      icon: Image.asset(AppIcons.googleLogo, width: 25),
                      callback: GoogleSignInFlow.run,
                    ),
              SizedBox(height: SizeConfig.screenHeight / 30),
              LoginScreenBottomText(
                text1: AppStrings.dontHaveAnAccount.tr,
                text2: AppStrings.signUp.tr,
                onTap: () => switchAuthPage(() => const SignUpView()),
              ),
              SizedBox(height: SizeConfig.screenHeight / 35)
            ],
          ),
        ),
      ),
    );
  }
}
