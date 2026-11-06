import 'package:youpeak/core/platform/app_layout.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/shared/widgets/basic_button.dart';
import 'package:youpeak/main.dart';
import 'package:youpeak/features/auth/view/forgot_password_otp_view.dart';
import 'package:youpeak/features/auth/api/forgot_password_send_otp_api.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:youpeak/core/assets/app_icons.dart';
import 'package:youpeak/core/constants/app_string.dart';
import 'package:youpeak/core/theme/app_style.dart';

class ForgotPasswordView extends StatelessWidget {
  const ForgotPasswordView({super.key, required this.email});

  final String email;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      bottomNavigationBar: Padding(
        padding: const EdgeInsets.all(20),
        child: BasicButton(
          title: AppStrings.continueString.tr,
          callback: () async {
            ForgotPasswordSendOtpApi.callApi(email);
            Get.to(ForgotPasswordOtpView(email: email));
          },
        ),
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.only(left: 10, right: 10),
          child: Column(
            children: [
              BasicAppBar(title: AppStrings.forgotPassword.tr),
              SizedBox(height: Get.height / 60),
              SizedBox(
                height: Get.height / 3.5,
                child: Image(
                  image: isDarkMode.value ? const AssetImage(AppIcons.darkForgetPasswordLogo) : const AssetImage(AppIcons.forgetPasswordLogo),
                ),
              ),
              SizedBox(height: Get.height / 25),
              Padding(
                padding: EdgeInsets.only(left: 20, right: Get.height / 20),
                child: Text(AppStrings.forgotPasswordNote.tr, style: createPinNoteStyle),
              ),
              SizedBox(height: Get.height / 25),
              const SizedBox(height: 20),
              Container(
                height: 100,
                width: AppLayout.width,
                margin: const EdgeInsets.symmetric(horizontal: 5),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: isDarkMode.value ? const Color(0xFF31252F) : AppColor.grey_100, width: 2),
                ),
                child: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.only(left: 15),
                            alignment: Alignment.centerLeft,
                            child: CircleAvatar(
                              backgroundColor: isDarkMode.value ? const Color(0xFF31252F) : AppColor.grey_100,
                              radius: 32,
                              child: const Image(image: AssetImage(AppIcons.email), height: 25, width: 25),
                            ),
                          ),
                          const SizedBox(width: 20),
                          Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(AppStrings.yourEmail.tr, style: optMethodStyle),
                              const SizedBox(height: 5),
                              SizedBox(
                                  width: AppLayout.width / 2, child: Text(email, style: GoogleFonts.urbanist(fontSize: 14, fontWeight: FontWeight.w700))),
                            ],
                          )
                        ],
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

/// phone number sent otp
// onTap: () async {
//   await FirebaseAuth.instance.verifyPhoneNumber(
//     phoneNumber: '${countryController.text + editPhoneNumber}',
//     verificationCompleted: (PhoneAuthCredential credential) {},
//     verificationFailed: (FirebaseAuthException e) {},
//     codeSent: (String verificationId, int? resendToken) {
//       ForgotPasswordScreen.verify = verificationId;
//       Navigator.pushNamed(context, 'verify');
//     },
//     codeAutoRetrievalTimeout: (String verificationId) {},
//   );
//   Get.to(
//     () => const CreateOtpScreen(),
//   );
// },
/// done phone otp
/// Email sent the otp
/// ------ sent otp start ----------- ////
// onTap: () async {
//   myauth.setConfig(
//       appEmail: "",
//       appName: "Live1",
//       userEmail: editEmail,
//       otpLength: 4,
//       otpType: OTPType.digitsOnly);
//   if (await myauth.sendOTP() == true) {
//     ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
//       content: Text("OTP has been sent"),
//     ));
//     Get.to(
//       () => const CreateOtpScreen(),
//     );
//   } else {
//     ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
//       content: Text("Oops, OTP send failed"),
//     ));
//     Get.to(
//       () => const ForgotPasswordScreen(),
//     );
//   }
// },
/// ------ sent otp done ----------- ////
// callback: () async {
//   log("Phone number cheak :: ${countryCode + editPhoneNumber.toString()}");
//   await FirebaseAuth.instance.verifyPhoneNumber(
//     phoneNumber: countryCode + editPhoneNumber.toString(),
//     // phoneNumber: "+91 9909490587",
//
//     verificationCompleted: (PhoneAuthCredential credential) {
//       Get.snackbar("verificationCompleted", "message");
//     },
//     verificationFailed: (FirebaseAuthException e) {
//       Get.snackbar("verificationFailed", "message");
//       log("verificationFailed");
//     },
//     codeSent: (String verificationId, int? resendToken) {
//       ForgotPasswordScreen.verify = verificationId;
//       Navigator.push(
//           context,
//           MaterialPageRoute(
//             builder: (context) => const CreateOtpScreen(),
//           ));
//     },
//     timeout: const Duration(seconds: 60),
//
//     codeAutoRetrievalTimeout: (String verificationId) {
//       Get.snackbar("codeAutoRetrievalTimeout", "message");
//     },
//   );
// },

//
// GestureDetector(
// onTap: () {
// setState(() {});
// isSelected = !isSelected;
// },
// // child: isSelected
// child: true
// ? Container(
// height: (Get.height / 4 > 200) ? Get.height / 7.5 : 110,.5,
// width: AppLayout.width / 1.2,
// decoration: BoxDecoration(
// borderRadius: BorderRadius.circular(20),
// border: Border.all(
// color: isDarkMode.value
// ? const Color(0xFF31252F)
//     : AppColors.grey_100,
// width: 2),
// ),
// child: Column(
// children: [
// Row(
// children: [
// Container(
// padding: const EdgeInsets.only(left: 15, top: 15),
// alignment: Alignment.centerLeft,
// child: CircleAvatar(
// backgroundColor: isDarkMode.value
// ? const Color(0xFF31252F)
//     : AppColors.grey_100,
// radius: 32,
// child: const Image(
// image: AssetImage(AppIcons.boldChat),
// height: 25,
// width: 25,
// ),
// ),
// ),
// const SizedBox(width: 20),
// Column(
// mainAxisAlignment: MainAxisAlignment.start,
// crossAxisAlignment: CrossAxisAlignment.start,
// children: [
// Text(AppStrings.viaSMS, style: optMethodStyle),
// const SizedBox(height: 10),
// Text(
// editPhoneNumber,
// style: GoogleFonts.urbanist(
// fontSize: 14,
// fontWeight: FontWeight.w700,
// ),
// ),
// ],
// )
// ],
// ),
// ],
// ),
// )

//     : Container(
// height: (Get.height / 4 > 200) ? Get.height / 7.5 : 110,.5,
// width: AppLayout.width / 1.2,
// decoration: BoxDecoration(
// borderRadius: BorderRadius.circular(20),
// border: Border.all(color: AppColors.primaryColor, width: 2),
// ),
// child: Column(
// children: [
// Row(
// children: [
// Container(
// padding: const EdgeInsets.only(left: 15, top: 15),
// alignment: Alignment.centerLeft,
// child: CircleAvatar(
// backgroundColor: isDarkMode.value
// ? const Color(0xFF31252F)
//     : AppColors.grey_100,
// radius: 32,
// child: const Image(
// image: AssetImage(AppIcons.boldChat),
// height: 25,
// width: 25,
// ),
// ),
// ),
// const SizedBox(
// width: 20,
// ),
// Column(
// mainAxisAlignment: MainAxisAlignment.start,
// crossAxisAlignment: CrossAxisAlignment.start,
// children: [
// Text(
// AppStrings.viaSMS,
// style: optMethodStyle,
// ),
// const SizedBox(
// height: 10,
// ),
// Text(
// editPhoneNumber,
// style: GoogleFonts.urbanist(
// fontSize: 14,
// fontWeight: FontWeight.w700,
// ),
// ),
// ],
// )
// ],
// ),
// ],
// ),
// ),
// ),

//
//     : Container(
// height: (Get.height / 4 > 200) ? Get.height / 7.5 : 110,.5,
// width: AppLayout.width / 1.2,
// decoration: BoxDecoration(
// borderRadius: BorderRadius.circular(20),
// border: Border.all(color: AppColors.primaryColor, width: 2),
// ),
// child: Column(
// children: [
// Row(
// children: [
// Container(
// padding: const EdgeInsets.only(left: 15, top: 15),
// alignment: Alignment.centerLeft,
// child: CircleAvatar(
// backgroundColor: isDarkMode.value
// ? const Color(0xFF31252F)
//     : AppColors.grey_100,
// radius: 32,
// child: const Image(
// image: AssetImage(AppIcons.email),
// height: 25,
// width: 25,
// ),
// ),
// ),
// const SizedBox(
// width: 20,
// ),
// Column(
// mainAxisAlignment: MainAxisAlignment.start,
// crossAxisAlignment: CrossAxisAlignment.start,
// children: [
// Text(
// AppStrings.viaEmail,
// style: optMethodStyle,
// ),
// const SizedBox(
// height: 10,
// ),
// Text(
// editEmail,
// style: GoogleFonts.urbanist(
// fontSize: 14,
// fontWeight: FontWeight.w700,
// ),
// ),
// ],
// )
// ],
// ),
// ],
// ),
// ),
