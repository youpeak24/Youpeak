import 'dart:io';

import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:youpeak/custom/basic_button.dart';
import 'package:youpeak/custom/custom_method/custom_box_button.dart';
import 'package:youpeak/custom/custom_method/custom_dialog.dart';
import 'package:youpeak/custom/custom_method/custom_text_field.dart';
import 'package:youpeak/custom/custom_method/custom_toast.dart';
import 'package:youpeak/custom/custom_ui/loader_ui.dart';
import 'package:youpeak/custom/dialog/app_exit_dialog.dart';
import 'package:youpeak/database/database.dart';
import 'package:youpeak/main.dart';
import 'package:youpeak/pages/admin_settings/admin_settings_api.dart';
import 'package:youpeak/pages/login_related_page/fill_profile_page/fill_profile_view.dart';
import 'package:youpeak/pages/login_related_page/fill_profile_page/get_profile_api.dart';
import 'package:youpeak/pages/login_related_page/google_login_page/google_login.dart';
import 'package:youpeak/pages/login_related_page/lets_you_in_page/lets_you_in_view.dart';
import 'package:youpeak/pages/login_related_page/login_page/login_api.dart';
import 'package:youpeak/pages/login_related_page/login_page/login_model.dart';
import 'package:youpeak/pages/login_related_page/login_page/login_view.dart';
import 'package:youpeak/pages/login_related_page/otp_page/sign_up_otp_view.dart';
import 'package:youpeak/pages/login_related_page/otp_page/sign_up_send_otp_api.dart';
import 'package:youpeak/pages/login_related_page/sign_up_page/sign_up_api.dart';
import 'package:youpeak/pages/login_related_page/sign_up_page/sign_up_model.dart';
import 'package:youpeak/pages/main_home_page/main_home_view.dart';
import 'package:youpeak/utils/colors/app_color.dart';
import 'package:youpeak/utils/config/size_config.dart';
import 'package:youpeak/utils/icons/app_icons.dart';
import 'package:youpeak/utils/settings/app_settings.dart';
import 'package:youpeak/utils/string/app_string.dart';
import 'package:youpeak/utils/style/app_style.dart';
import 'package:sign_in_with_apple/sign_in_with_apple.dart';

import '../../nav_add_page/live_page/widget/device_orientation.dart';

class SignUpView extends StatefulWidget {
  const SignUpView({super.key});

  @override
  State<SignUpView> createState() => _SignUpViewState();
}

class _SignUpViewState extends State<SignUpView> {
  SignUpModel? _signUpModel;
  LoginModel? _loginModel;
  RxBool isShowPassword = false.obs;
  RxBool isShowConfirmPassword = false.obs;
  TextEditingController emailController = TextEditingController();
  TextEditingController passwordController = TextEditingController();
  TextEditingController confirmPasswordController = TextEditingController();

  FocusNode emailFocusNode = FocusNode();
  FocusNode passwordFocusNode = FocusNode();
  FocusNode confirmPasswordFocusNode = FocusNode();

  @override
  void initState() {
    emailController.clear();
    passwordController.clear();
    confirmPasswordController.clear();
    isShowPassword.value = false;

    super.initState();
    emailFocusNode.addListener(() {
      if (emailFocusNode.hasFocus) {
        setState(() => color = const Color(0xFFFCE7E9));
      } else {
        color = AppColor.grey_100;
      }
    });
    passwordFocusNode.addListener(
      () {
        if (passwordFocusNode.hasFocus) {
          setState(() => color = const Color(0xFFFCE7E9));
        } else {
          color = AppColor.grey_100;
        }
      },
    );
    confirmPasswordFocusNode.addListener(
      () {
        if (confirmPasswordFocusNode.hasFocus) {
          setState(() => color = const Color(0xFFFCE7E9));
        } else {
          color = AppColor.grey_100;
        }
      },
    );
  }

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
            if (Platform.isAndroid) {
              SystemNavigator.pop();
            } else if (Platform.isIOS) {
              exit(0);
            }
          }
          return false;
        }
      },
      child: Scaffold(
        body: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: SingleChildScrollView(
            child: Column(
              children: [
                SizedBox(height: Get.height * 0.15),
                Image.asset(AppIcons.logo, width: Get.height * 0.12),
                SizedBox(height: Get.height / 25),
                Text(
                  AppStrings.createYourAccount.tr,
                  textAlign: TextAlign.center,
                  style: createAccountStyle,
                ),
                SizedBox(height: Get.height / 35),
                Column(
                  children: [
                    CustomTextFieldView(
                      width: Get.width,
                      hintText: AppStrings.email.tr,
                      prefixIconPath: AppIcons.email,
                      controller: emailController,
                      focusNode: emailFocusNode,
                      keyboardType: TextInputType.emailAddress,
                    ),
                    SizedBox(height: SizeConfig.screenHeight / 50),
                    Obx(
                      () => CustomTextFieldView(
                        width: Get.width,
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
                    SizedBox(height: SizeConfig.screenHeight / 50),
                    Obx(
                      () => CustomTextFieldView(
                        width: Get.width,
                        hintText: AppStrings.conformPassword.tr,
                        obscureText: !isShowConfirmPassword.value,
                        prefixIconPath: AppIcons.password,
                        controller: confirmPasswordController,
                        suffixIconPath: isShowConfirmPassword.value ? AppIcons.show : AppIcons.hide,
                        suffixIconCallback: () => isShowConfirmPassword.value = !isShowConfirmPassword.value,
                        focusNode: confirmPasswordFocusNode,
                        keyboardType: TextInputType.visiblePassword,
                      ),
                    ),
                  ],
                ),
                SizedBox(height: SizeConfig.screenHeight / 50),
                BasicButton(
                  width: Get.width,
                  title: AppStrings.signUp.tr,
                  callback: () async {
                    if (emailController.text.isNotEmpty && passwordController.text.isNotEmpty) {
                      if (passwordController.text == confirmPasswordController.text) {
                        Get.dialog(const LoaderUi(color: AppColor.white), barrierDismissible: false);

                        _loginModel = await LoginApi.callApi(emailController.text.trim(), passwordController.text.trim(), 4);

                        if (_loginModel?.status == true && _loginModel?.isLogin == false) {
                          Get.back();
                          SignUpSendOtpApi.callApi(emailController.text);
                          Get.to(SignUpOtpView(email: emailController.text, password: passwordController.text));
                        } else {
                          Get.back();
                          CustomToast.show(AppStrings.userAlreadyExist.tr);
                          Get.to(const LoginView());
                        }
                      } else {
                        CustomToast.show(AppStrings.passwordNotMatch.tr);
                      }
                    } else {
                      CustomToast.show(AppStrings.pleaseFillUpDetails.tr);
                    }
                  },
                ),
                SizedBox(height: Get.height / 20),
                SizedBox(
                  width: Get.width,
                  child: Row(
                    children: [
                      Expanded(
                        child: Container(
                          height: 1,
                          margin: const EdgeInsets.only(right: 5),
                          decoration: BoxDecoration(color: Colors.grey.shade300, borderRadius: BorderRadius.circular(10)),
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
                          decoration: BoxDecoration(color: Colors.grey.shade300, borderRadius: BorderRadius.circular(10)),
                        ),
                      ),
                    ],
                  ),
                ),
                SizedBox(height: Get.height / 35),
                Platform.isIOS
                    ? Row(
                        mainAxisSize: MainAxisSize.min,
                        mainAxisAlignment: MainAxisAlignment.center,
                        crossAxisAlignment: CrossAxisAlignment.center,
                        children: [
                          CustomBoxButton(
                            child: Image.asset(
                              AppIcons.googleLogo,
                              width: 30,
                            ),
                            callback: () async {
                              Get.dialog(const LoaderUi(color: AppColor.white), barrierDismissible: false);
                              dynamic response;
                              try {
                                response = await GoogleLogin.signInWithGoogle();
                              } catch (e) {
                                AppSettings.showLog("GOOGLE ERROOR $e");
                              }
                              if (response != null && response.user?.email != null) {
                                _signUpModel = await SignUpApi.callApi(response.user!.email!, null, 2, Database.fcmToken!, Database.deviceId!);
                                if (_signUpModel != null && _signUpModel?.user?.id != null) {
                                  AppSettings.onLoginWithReferral(loginUserId: _signUpModel?.user?.id ?? "");
                                  if (_signUpModel?.status == true && _signUpModel?.signUp == true) {
                                    Get.back();
                                    //  CustomToast.show(AppStrings.googleSignUpSuccess.tr);
                                    Get.offAll(FillProfileView(
                                      email: response.user!.email!,
                                      loginUserId: _signUpModel!.user!.id!,
                                      profileImage: response.user.photoURL,
                                      username: response.user.displayName,
                                    ));
                                  } else {
                                    Get.back();
                                    CustomDialog.show(AppIcons.profileDoneLogo1, AppStrings.congratulations.tr, AppStrings.congratulationsNote.tr);
                                    if (_signUpModel?.user?.id != null) {
                                      await GetProfileApi.callApi(_signUpModel!.user!.id!);
                                    }
                                    Get.back();
                                    // Was also gating on Database.loginUserId != null and
                                    // AdminSettingsApi.adminSettingsModel?.setting != null,
                                    // neither of which this flow sets/needs directly — the
                                    // first only gets set as a side effect deep inside
                                    // GetProfileApi.callApi() and could still read stale/null
                                    // right after a fully successful login. Trust the profile
                                    // we just fetched above instead, same as the (working)
                                    // lets_you_in_view.dart Google flow does.
                                    if (GetProfileApi.profileModel?.user != null) {
                                      Get.offAll(const MainHomePageView());
                                    } else {
                                      CustomToast.show(AppStrings.getProfileFailed.tr);
                                    }
                                  }
                                } else {
                                  Get.back();
                                  if (_signUpModel?.message == "You are blocked by admin!") {
                                    CustomToast.show(_signUpModel?.message.toString() ?? AppStrings.someThingWentWrong.tr);
                                  } else {
                                    CustomToast.show(AppStrings.googleLoginFailed.tr);
                                  }
                                }
                              } else {
                                Get.back();
                                CustomToast.show(AppStrings.googleLoginFailed.tr);
                              }
                            },
                          ),
                          const SizedBox(width: 20),
                          CustomBoxButton(
                            callback: Platform.isIOS
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

                                          if (Database.isNewUser == false &&
                                              AdminSettingsApi.adminSettingsModel?.setting != null &&
                                              Database.loginUserId != null &&
                                              GetProfileApi.profileModel?.user != null) {
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
                        callback: () async {
                          Get.dialog(const LoaderUi(color: AppColor.white), barrierDismissible: false);

                          dynamic response;
                          try {
                            response = await GoogleLogin.signInWithGoogle();
                          } catch (e) {
                            AppSettings.showLog("GOOGLE ERROOR $e");
                          }

                          if (response != null && response.user?.email != null) {
                            _signUpModel = await SignUpApi.callApi(response.user!.email!, null, 2, Database.fcmToken!, Database.deviceId!);

                            if (_signUpModel != null && _signUpModel?.user?.id != null) {
                              AppSettings.onLoginWithReferral(loginUserId: _signUpModel?.user?.id ?? "");
                              if (_signUpModel?.status == true && _signUpModel?.signUp == true) {
                                Get.back();
                                // CustomToast.show(AppStrings.googleSignUpSuccess.tr);
                                Get.offAll(FillProfileView(
                                  email: response.user!.email!,
                                  loginUserId: _signUpModel!.user!.id!,
                                  profileImage: response.user!.photoURL,
                                  username: response.user!.displayName,
                                ));
                              } else {
                                Get.back();
                                CustomDialog.show(AppIcons.profileDoneLogo1, AppStrings.congratulations.tr, AppStrings.congratulationsNote.tr);
                                if (_signUpModel?.user?.id != null) await GetProfileApi.callApi(_signUpModel!.user!.id!);
                                Get.back();
                                // Was also gating on Database.loginUserId != null and
                                // AdminSettingsApi.adminSettingsModel?.setting != null,
                                // neither of which this flow sets/needs directly — the
                                // first only gets set as a side effect deep inside
                                // GetProfileApi.callApi() and could still read stale/null
                                // right after a fully successful login. This is the Android
                                // "sign up with Google" button — trust the profile we just
                                // fetched above instead, same as the (working)
                                // lets_you_in_view.dart Google flow does.
                                if (GetProfileApi.profileModel?.user != null) {
                                  Get.offAll(const MainHomePageView());
                                } else {
                                  CustomToast.show(AppStrings.getProfileFailed.tr);
                                }
                              }
                            } else {
                              Get.back();
                              if (_signUpModel?.message == "You are blocked by admin!") {
                                CustomToast.show(_signUpModel?.message.toString() ?? AppStrings.someThingWentWrong.tr);
                              } else {
                                CustomToast.show(AppStrings.signUpFailed.tr);
                              }
                            }
                          } else {
                            Get.back();
                            CustomToast.show(AppStrings.googleLoginFailed.tr);
                          }
                        },
                      ),
                SizedBox(height: Get.height / 35),
                LoginScreenBottomText(
                  text1: AppStrings.alreadyHaveAnAccount.tr,
                  text2: AppStrings.signIN.tr,
                  onTap: () => Get.to(() => const LoginView()),
                ),
                SizedBox(height: Get.height / 35),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
