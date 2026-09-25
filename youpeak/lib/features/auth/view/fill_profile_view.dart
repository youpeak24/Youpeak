// ignore_for_file: avoid_print

import 'dart:developer';
import 'dart:io';

import 'package:dropdown_button2/dropdown_button2.dart';
import 'package:flutter/material.dart';
import 'package:youpeak/core/assets/app_visuals.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:http/http.dart' as http;
import 'package:image_picker/image_picker.dart';

// import 'package:intl_phone_field/intl_phone_field.dart';
import 'package:intl_phone_field2/intl_phone_field.dart';
import 'package:youpeak/shared/widgets/basic_button.dart';
import 'package:youpeak/shared/dialogs/custom_dialog.dart';
import 'package:youpeak/shared/widgets/custom_filled_button.dart';
import 'package:youpeak/core/utils/custom_image_picker.dart';
import 'package:youpeak/core/utils/custom_toast.dart';
import 'package:youpeak/shared/widgets/loader_ui.dart';
import 'package:youpeak/core/storage/database/database.dart';
import 'package:youpeak/main.dart';
import 'package:youpeak/core/settings/admin_settings_api.dart';
import 'package:youpeak/core/file_upload/convert_channel_image_api.dart';
import 'package:youpeak/features/profile/api/edit_profile_api.dart';
import 'package:youpeak/features/profile/api/get_profile_api.dart';
import 'package:youpeak/features/main/view/main_home_view.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:youpeak/core/config/size_config.dart';
import 'package:youpeak/core/assets/app_icons.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'package:youpeak/core/constants/app_string.dart';
import 'package:youpeak/core/theme/app_style.dart';
import 'package:path/path.dart';
import 'package:path_provider/path_provider.dart';

class FillProfileView extends StatefulWidget {
  const FillProfileView({super.key, required this.email, required this.loginUserId, this.username, this.profileImage});

  final String email;
  final String loginUserId;
  final String? username;
  final String? profileImage;

  @override
  State<FillProfileView> createState() => _FillProfileViewState();
}

class _FillProfileViewState extends State<FillProfileView> {
  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();

  @override
  void initState() {
    super.initState();
    AppSettings.emailController.text = widget.email;
    AppSettings.pickImagePath.value = widget.profileImage ?? "";
    AppSettings.nameController.text = widget.username ?? "";
    if (widget.username != null && widget.username!.isNotEmpty) {
      AppSettings.nickNameController.text = widget.username!.toLowerCase().replaceAll(" ", "_");
    }
  }

  @override
  Widget build(BuildContext context) {
    List genderItems = ['male'.tr, 'female'.tr];
    SystemChrome.setSystemUIOverlayStyle(
      const SystemUiOverlayStyle(statusBarColor: Colors.transparent, statusBarBrightness: Brightness.dark),
    );

    AppSettings.showLog("Its Come ${widget.username}");
    AppSettings.showLog("Its Come ${widget.profileImage}");
    return Scaffold(
      resizeToAvoidBottomInset: true,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        automaticallyImplyLeading: false,
        centerTitle: true,
        leadingWidth: 60,
        title: Text(AppStrings.fillProfile.tr, style: GoogleFonts.urbanist(fontSize: 20, fontWeight: FontWeight.bold)),
      ),
      body: SingleChildScrollView(
        physics: const BouncingScrollPhysics(),
        child: Padding(
          padding: const EdgeInsets.only(left: 10, right: 10),
          child: Column(
            children: [
              SizedBox(height: SizeConfig.screenHeight / 40),
              GestureDetector(
                onTap: chooseImageBottomSheet,
                child: Stack(
                  children: [
                    Obx(() {
                      bool isNetwork = false;
                      bool hasImage = false;

                      String currentImage = AppSettings.pickImagePath.value;
                      if (currentImage.isNotEmpty) {
                        isNetwork = currentImage.startsWith('http://') || currentImage.startsWith('https://');
                        hasImage = true;
                      }

                      return Container(
                        height: 125,
                        width: 125,
                        decoration: BoxDecoration(
                          color: isDarkMode.value ? AppColor.secondDarkMode : AppColor.white,
                          shape: BoxShape.circle,
                          border: Border.all(color: AppColor.grey_300),
                          image: hasImage
                              ? isNetwork
                                  ? DecorationImage(
                                      image: NetworkImage(
                                        AppSettings.pickImagePath.value,
                                      ),
                                      fit: BoxFit.cover,
                                    )
                                  : DecorationImage(
                                      image: FileImage(File(AppSettings.pickImagePath.value)),
                                      fit: BoxFit.cover,
                                    )
                              : const DecorationImage(
                                  image: AssetImage(AppVisuals.profileSetup),
                                  fit: BoxFit.contain,
                                ),
                          // AppSettings.pickImagePath.isEmpty
                          //     ? const DecorationImage(image: AssetImage(AppIcons.profileImage))
                          //     : DecorationImage(image: FileImage(File(AppSettings.pickImagePath.value)), fit: BoxFit.cover),
                        ),
                      );
                    }),
                    Positioned(
                        bottom: 6,
                        right: 6,
                        child: Container(
                            height: 28,
                            width: 28,
                            decoration: const BoxDecoration(
                              shape: BoxShape.circle,
                              color: AppColor.primaryColor,
                              boxShadow: [
                                BoxShadow(color: Colors.black26, blurRadius: 4),
                              ],
                            ),
                            child: const Center(
                              child: Icon(Icons.edit, color: Colors.white, size: 16),
                            ))),
                  ],
                ),
              ),
              Form(
                key: _formKey,
                child: Column(
                  children: [
                    SizedBox(height: SizeConfig.screenHeight / 40),
                    ProfileTextFieldView(
                        hintText: "${AppStrings.fullName.tr} *",
                        controller: AppSettings.nameController,
                        inputFormatter: [LengthLimitingTextInputFormatter(50)]),
                    SizedBox(height: SizeConfig.screenHeight / 40),
                    ProfileTextFieldView(
                        hintText: "${AppStrings.nickName.tr} *",
                        controller: AppSettings.nickNameController,
                        inputFormatter: [LengthLimitingTextInputFormatter(20)]),
                    SizedBox(height: SizeConfig.screenHeight / 40),
                    ProfileTextFieldView(
                      hintText: AppStrings.email.tr,
                      controller: AppSettings.emailController,
                      isReadOnly: false,
                    ),
                    SizedBox(height: SizeConfig.screenHeight / 40),
                    const PhoneNumberTextFormField(),
                    SizedBox(height: SizeConfig.screenHeight / 40),
                    ProfileTextFieldView(
                      hintText: AppStrings.age.tr,
                      controller: AppSettings.ageController,
                      keyboardType: TextInputType.number,
                      inputFormatter: [LengthLimitingTextInputFormatter(3)],
                    ),
                    SizedBox(height: SizeConfig.screenHeight / 40),
                    Container(
                      height: Get.height / 16,
                      width: Get.width / 1.1,
                      alignment: Alignment.center,
                      padding: EdgeInsets.only(right: SizeConfig.blockSizeHorizontal * 3),
                      decoration: BoxDecoration(
                        color: isDarkMode.value ? AppColor.secondDarkMode : AppColor.grey_100,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: DropdownButtonFormField2(
                        value: AppSettings.selectedGender,
                        decoration: const InputDecoration(
                          isDense: true,
                          suffixIconConstraints: BoxConstraints(minWidth: 2, minHeight: 2),
                          prefixIconConstraints: BoxConstraints(minWidth: 2, minHeight: 2),
                          contentPadding: EdgeInsets.zero,
                          border: InputBorder.none,
                        ),
                        isExpanded: true,
                        hint: Text(AppStrings.gender.tr, style: fillYourProfileStyle),
                        items: genderItems
                            .map(
                              (item) => DropdownMenuItem<String>(
                                value: item,
                                child: Row(
                                  children: [
                                    Icon(item == "male".tr ? Icons.male : Icons.female),
                                    const SizedBox(width: 8),
                                    Text(
                                      item,
                                      style: const TextStyle(
                                        fontSize: 14,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            )
                            .toList(),
                        validator: (value) {
                          if (value == null) {
                            return 'Please select gender.';
                          }
                          return null;
                        },
                        onChanged: (value) {
                          AppSettings.selectedGender = value.toString();
                          log("selectedValue $AppSettings.selectedGender");
                        },
                        onSaved: (value) {
                          AppSettings.selectedGender = value.toString();
                        },
                      ),
                    ),
                    SizedBox(height: SizeConfig.screenHeight / 40),
                    const CountryTextFormField(),
                  ],
                ),
              ),
              SizedBox(height: SizeConfig.screenHeight / 20),
              CustomFilledButton(
                title: AppStrings.continueString.tr,
                callback: () async {
                  if (AppSettings.nameController.text.trim().isEmpty) {
                    CustomToast.show("Please enter your full name");
                    return;
                  }
                  if (AppSettings.nickNameController.text.trim().isEmpty) {
                    CustomToast.show(AppStrings.pleaseEnterNickName.tr);
                    return;
                  }
                  if (AppSettings.emailController.text.trim().isEmpty) {
                    CustomToast.show("Please enter your email address");
                    return;
                  }
                  if (AppSettings.phoneController.text.trim().isEmpty) {
                    CustomToast.show("Please enter your mobile number");
                    return;
                  }
                  if (AppSettings.isValidPhone.value == false) {
                    CustomToast.show("Please enter a valid mobile number");
                    return;
                  }
                  if (_formKey.currentState?.validate() == false) {
                    return;
                  }
                  try {
                    Get.dialog(const LoaderUi(color: AppColor.white), barrierDismissible: false);
                    AppSettings.showLog("Fill Profile Complete");

                    String? url;
                    if (AppSettings.pickImagePath.isNotEmpty) {
                      if (AppSettings.pickImagePath.value.startsWith('https://') || AppSettings.pickImagePath.value.startsWith('http://')) {
                        try {
                          AppSettings.pickImagePath.value = await urlToFile(AppSettings.pickImagePath.value);
                        } catch (e) {
                          AppSettings.showLog("URL to file error: $e");
                        }
                      }
                      if (AppSettings.pickImagePath.isNotEmpty && File(AppSettings.pickImagePath.value).existsSync()) {
                        url = await ConvertChannelImageApi.callApi(AppSettings.pickImagePath.value);
                      }
                    }

                    final isSuccess = await EditProfileApi.callApi(loginUserId: widget.loginUserId, profileImage: url, gender: AppSettings.selectedGender);
                    
                    // Always close loading dialog first!
                    if (Get.isDialogOpen ?? false) {
                      Get.back();
                    }

                    if (isSuccess) {
                      CustomDialog.show(AppIcons.profileDoneLogo1, AppStrings.congratulations.tr, AppStrings.congratulationsNote.tr);
                      await GetProfileApi.callApi(widget.loginUserId);
                      Get.offAll(() => const MainHomePageView());
                    } else {
                      CustomToast.show(AppStrings.someThingWentWrong.tr);
                    }
                  } catch (e) {
                    AppSettings.showLog("Fill profile submit error: $e");
                    if (Get.isDialogOpen ?? false) {
                      Get.back();
                    }
                    CustomToast.show(AppStrings.someThingWentWrong.tr);
                  }
                },
              ),
              SizedBox(height: Get.height * 0.015),
            ],
          ),
        ),
      ),
    );
  }
}

Future<String> urlToFile(String imageUrl, {String fieldName = 'file'}) async {
  final response = await http.get(Uri.parse(imageUrl));

  if (response.statusCode == 200) {
    final tempDir = await getTemporaryDirectory();
    final filePath = '${tempDir.path}/${basename(imageUrl)}';

    final file = File(filePath);
    await file.writeAsBytes(response.bodyBytes);

    return file.path;
  } else {
    throw Exception("Failed to download image from $imageUrl");
  }
}

void chooseImageBottomSheet() {
  Get.bottomSheet(
    backgroundColor: isDarkMode.value ? AppColor.secondDarkMode : Colors.white,
    SizedBox(
      height: 160,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          const SizedBox(height: 8),
          Container(
            width: SizeConfig.blockSizeHorizontal * 12,
            height: 3,
            decoration: BoxDecoration(borderRadius: BorderRadius.circular(60), color: AppColor.grey_300),
          ),
          const SizedBox(height: 10),
          Text(AppStrings.chooseImage.tr, style: titalstyle1),
          const SizedBox(height: 5),
          Divider(indent: 25, endIndent: 25, color: AppColor.grey_300.withOpacity(0.8)),
          const SizedBox(height: 10),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: GestureDetector(
              onTap: () => CustomImagePicker.pickImage(ImageSource.camera),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.start,
                children: [
                  Image.asset(AppIcons.camera, color: isDarkMode.value ? AppColor.white.withOpacity(0.5) : AppColor.black, height: 30, width: 30),
                  const SizedBox(width: 15),
                  Text("Take a photo", style: bottomstyle)
                ],
              ),
            ),
          ),
          const SizedBox(height: 15),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: GestureDetector(
              onTap: () => CustomImagePicker.pickImage(ImageSource.gallery),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.start,
                children: [
                  Image.asset(AppIcons.gallery, color: isDarkMode.value ? AppColor.white.withOpacity(0.5) : AppColor.black, height: 25, width: 25).paddingOnly(left: 3),
                  // const Icon(CupertinoIcons.photo),
                  const SizedBox(width: 15),
                  Text("Choose from your file", style: bottomstyle)
                ],
              ),
            ),
          ),
          const SizedBox(height: 15),
        ],
      ),
    ),
  );
}

class ProfileTextFieldView extends StatefulWidget {
  const ProfileTextFieldView({super.key, required this.hintText, required this.controller, this.keyboardType, this.isReadOnly, this.inputFormatter});

  final String hintText;
  final TextEditingController controller;
  final TextInputType? keyboardType;
  final bool? isReadOnly;
  final List<TextInputFormatter>? inputFormatter;

  @override
  State<ProfileTextFieldView> createState() => _ProfileTextFieldViewState();
}

class _ProfileTextFieldViewState extends State<ProfileTextFieldView> {
  @override
  Widget build(BuildContext context) {
    return Container(
      height: SizeConfig.screenHeight / 16,
      width: SizeConfig.screenWidth / 1.1,
      alignment: Alignment.center,
      padding: const EdgeInsets.only(left: 20),
      decoration: BoxDecoration(
        color: isDarkMode.value ? AppColor.secondDarkMode : AppColor.grey_100,
        borderRadius: BorderRadius.circular(10),
      ),
      child: TextFormField(
        style: GoogleFonts.urbanist(textStyle: TextStyle(color: isDarkMode.value ? AppColor.white : AppColor.black, fontWeight: FontWeight.w600, fontSize: 16)),
        cursorColor: isDarkMode.value ? AppColor.white : AppColor.black,
        controller: widget.controller,
        keyboardType: widget.keyboardType,
        readOnly: widget.isReadOnly ?? false,
        inputFormatters: widget.inputFormatter,
        decoration: InputDecoration(
          isDense: true,
          hintText: widget.hintText,
          border: InputBorder.none,
          hintStyle: GoogleFonts.urbanist(textStyle: const TextStyle(color: AppColor.grey, fontWeight: FontWeight.w400, fontSize: 15)),
        ),
      ),
    );
  }
}

class PhoneNumberTextFormField extends StatelessWidget {
  const PhoneNumberTextFormField({
    super.key,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = isDarkMode.value ?? false;
    return SizedBox(
      height: SizeConfig.screenHeight / 11,
      width: SizeConfig.screenWidth / 1.1,
      child: IntlPhoneField(
        flagsButtonPadding: const EdgeInsets.all(8),
        dropdownIconPosition: IconPosition.trailing,
        controller: AppSettings.phoneController,
        obscureText: false,
        cursorColor: isDark ? AppColor.white : AppColor.black,
        dropdownTextStyle: TextStyle(color: isDark ? AppColor.white : AppColor.black, fontSize: 15),
        keyboardType: TextInputType.number,
        showCountryFlag: true,
        style: GoogleFonts.urbanist(textStyle: TextStyle(color: isDark ? AppColor.white : AppColor.black, fontWeight: FontWeight.w600, fontSize: 16)),
        inputFormatters: [FilteringTextInputFormatter.digitsOnly],
        onChanged: (phone) {
          try {
            AppSettings.isValidPhone.value = phone.isValidNumber();
          } catch (e) {
            AppSettings.isValidPhone.value = true;
          }
        },
        decoration: InputDecoration(
          contentPadding: const EdgeInsets.symmetric(vertical: 10),
          filled: true,
          fillColor: isDark ? AppColor.secondDarkMode : AppColor.grey_100,
          hintStyle: GoogleFonts.urbanist(textStyle: const TextStyle(color: AppColor.grey, fontWeight: FontWeight.w400, fontSize: 15)),
          focusedBorder: OutlineInputBorder(borderSide: const BorderSide(color: AppColor.transparent), borderRadius: BorderRadius.circular(8)),
          border: const OutlineInputBorder(borderRadius: BorderRadius.all(Radius.circular(8))),
          enabledBorder: OutlineInputBorder(borderSide: const BorderSide(color: AppColor.transparent), borderRadius: BorderRadius.circular(8)),
        ),
        initialCountryCode: 'IN',
      ),
    );
  }
}
