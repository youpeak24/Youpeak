import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_otp_text_field/flutter_otp_text_field.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/shared/widgets/basic_button.dart';
import 'package:youpeak/core/utils/custom_toast.dart';
import 'package:youpeak/core/storage/database/database.dart';
import 'package:youpeak/main.dart';
import 'package:youpeak/features/auth/view/fill_profile_view.dart';
import 'package:youpeak/features/auth/api/sign_up_send_otp_api.dart';
import 'package:youpeak/features/auth/api/verification_otp_api.dart';
import 'package:youpeak/features/auth/api/sign_up_api.dart';
import 'package:youpeak/features/auth/model/sign_up_model.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'package:youpeak/core/constants/app_string.dart';
import 'package:youpeak/core/theme/app_style.dart';

class SignUpOtpView extends StatefulWidget {
  const SignUpOtpView({super.key, required this.email, required this.password});

  final String email;
  final String password;
  @override
  State<SignUpOtpView> createState() => _SignUpOtpViewState();
}

class _SignUpOtpViewState extends State<SignUpOtpView> {
  TextEditingController otpController = TextEditingController();
  SignUpModel? _signUpModel;
  RxInt otpTime = 15.obs;

  @override
  void initState() {
    otpTime(15);
    countTime();
    super.initState();
  }

  void countTime() {
    otpTime.value == 15
        ? Timer.periodic(
            const Duration(seconds: 1),
            (timer) {
              if (otpTime.value > 0) {
                otpTime--;
              } else {
                timer.cancel();
              }
            },
          )
        : null;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      bottomNavigationBar: Padding(
        padding: const EdgeInsets.all(20),
        child: BasicButton(
          title: AppStrings.verify.tr,
          callback: () async {
            if (otpController.text.isNotEmpty) {
              final isVerify = await VerificationOtpApi.callApi(widget.email, otpController.text);
              if (isVerify != null && isVerify == true) {
                _signUpModel = await SignUpApi.callApi(widget.email, widget.password, 4, Database.fcmToken!, Database.deviceId!);
                if (_signUpModel != null && _signUpModel?.user?.id != null) {
                  AppSettings.onLoginWithReferral(loginUserId: _signUpModel?.user?.id ?? "");
                  Get.offAll(() => FillProfileView(email: widget.email, loginUserId: _signUpModel!.user!.id!));
                }
              }
            } else {
              CustomToast.show(AppStrings.pleaseEnterOtp.tr);
            }
          },
        ),
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.only(left: 10, right: 10),
          child: Column(
            children: [
              BasicAppBar(title: AppStrings.otpVerification.tr),
              SizedBox(height: Get.height / 4),
              Padding(
                  padding: EdgeInsets.only(left: 20, right: Get.height / 25),
                  child: Text("Code has been send to ${widget.email}", style: createPinNoteStyle, textAlign: TextAlign.center)),
              SizedBox(height: Get.height / 15),
              OtpTextField(
                  numberOfFields: 4,
                  fillColor: isDarkMode.value ? AppColor.secondDarkMode : AppColor.grey_50,
                  fieldWidth: 50,
                  filled: true,
                  focusedBorderColor: AppColor.primaryColor,
                  showFieldAsBox: true,
                  textStyle: GoogleFonts.urbanist(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: isDarkMode.value ? AppColor.white : AppColor.black,
                  ),
                  onCodeChanged: (String code) {},
                  onSubmit: (String otpCode) => otpController.text = otpCode),
              SizedBox(height: Get.height / 20),
              Padding(
                padding: EdgeInsets.only(left: Get.height / 20, right: Get.height / 20),
                child: Obx(
                  () => otpTime.value != 0
                      ? Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          crossAxisAlignment: CrossAxisAlignment.center,
                          children: [
                            Text(AppStrings.resendOTP.tr, style: createPinNoteStyle),
                            Obx(
                              () => Text(
                                " ${otpTime.value.toString()}",
                                style: GoogleFonts.urbanist(
                                  fontSize: 15,
                                  color: AppColor.primaryColor,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ),
                            Text("s", style: createPinNoteStyle)
                          ],
                        )
                      : Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          crossAxisAlignment: CrossAxisAlignment.center,
                          children: [
                            Text(AppStrings.doNotSend.tr, style: createPinNoteStyle),
                            GestureDetector(
                              onTap: () {
                                otpTime.value = 15;
                                countTime();
                                SignUpSendOtpApi.callApi(widget.email);
                              },
                              child: Text(
                                "send Otp",
                                style: GoogleFonts.urbanist(
                                  fontSize: 15,
                                  color: AppColor.primaryColor,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ),
                          ],
                        ),
                ),
              ),
              SizedBox(height: Get.height / 20),
            ],
          ),
        ),
      ),
    );
  }
}
