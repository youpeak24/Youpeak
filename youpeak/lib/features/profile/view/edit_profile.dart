// ignore_for_file: avoid_print

import 'dart:developer';
import 'dart:io';

import 'package:dropdown_button2/dropdown_button2.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl_phone_field2/intl_phone_field.dart';

import 'package:youpeak/shared/widgets/basic_button.dart';
import 'package:youpeak/shared/widgets/custom_filled_button.dart';
import 'package:youpeak/core/utils/custom_image_picker.dart';
import 'package:youpeak/core/utils/custom_toast.dart';
import 'package:youpeak/shared/widgets/loader_ui.dart';
import 'package:youpeak/core/storage/database/database.dart';
import 'package:youpeak/main.dart';
import 'package:youpeak/core/file_upload/convert_channel_image_api.dart';
import 'package:youpeak/features/profile/api/edit_profile_api.dart';
import 'package:youpeak/features/profile/api/get_profile_api.dart';
import 'package:youpeak/features/bites/view/nav_shorts_details_view.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:youpeak/core/config/size_config.dart';
import 'package:youpeak/core/assets/app_icons.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'package:youpeak/core/constants/app_string.dart';
import 'package:youpeak/core/theme/app_style.dart';
import 'package:youpeak/core/utils/utils.dart';

class EditProfileView extends StatefulWidget {
  const EditProfileView({super.key});

  @override
  State<EditProfileView> createState() => _EditProfileViewState();
}

class _EditProfileViewState extends State<EditProfileView> {
  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();

  List<int> channelTypes = [1, 2];

  List<String> genderItems = ['male'.tr, 'female'.tr];

  @override
  void initState() {
    super.initState();

    AppSettings.pickImagePath.value = "";

    AppSettings.nameController = TextEditingController(
      text: GetProfileApi.profileModel?.user?.fullName ?? "",
    );

    AppSettings.nickNameController = TextEditingController(
      text: GetProfileApi.profileModel?.user?.nickName ?? "",
    );

    AppSettings.emailController = TextEditingController(
      text: GetProfileApi.profileModel?.user?.email ?? "",
    );

    AppSettings.phoneController = TextEditingController(
      text: GetProfileApi.profileModel?.user?.mobileNumber ?? "",
    );

    AppSettings.ageController = TextEditingController(
      text: GetProfileApi.profileModel?.user?.age.toString() ?? "",
    );

    AppSettings.instagramController = TextEditingController(
      text: GetProfileApi.profileModel?.user?.socialMediaLinks?.instagramLink ?? "",
    );

    AppSettings.facebookController = TextEditingController(
      text: GetProfileApi.profileModel?.user?.socialMediaLinks?.facebookLink ?? "",
    );

    AppSettings.twitterController = TextEditingController(
      text: GetProfileApi.profileModel?.user?.socialMediaLinks?.twitterLink ?? "",
    );

    AppSettings.websiteController = TextEditingController(
      text: GetProfileApi.profileModel?.user?.socialMediaLinks?.websiteLink ?? "",
    );

    AppSettings.countryController = TextEditingController(
      text: GetProfileApi.profileModel?.user?.country ?? "",
    );

    AppSettings.selectedGender = GetProfileApi.profileModel?.user?.gender ?? 'male'.tr;

    AppSettings.channelType.value = GetProfileApi.profileModel?.user?.channelType ?? 1;

    AppSettings.isValidPhone.value = true;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        elevation: 0,
        backgroundColor: Colors.transparent,
        centerTitle: AppSettings.isCenterTitle,
        leadingWidth: 60,
        leading: IconButtonUi(
          callback: () => Get.back(),
          icon: Obx(
            () => Image.asset(
              AppIcons.arrowBack,
              height: 20,
              width: 20,
              color: isDarkMode.value ? AppColor.white : AppColor.black,
            ),
          ),
        ),
        title: Text(
          "Edit Profile",
          style: profileTitleStyle,
        ),
      ),
      body: SingleChildScrollView(
        physics: const BouncingScrollPhysics(),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 10),
          child: Column(
            children: [
              SizedBox(height: SizeConfig.screenHeight / 40),

              /// PROFILE IMAGE
              GestureDetector(
                onTap: chooseImageBottomSheet,
                child: Stack(
                  children: [
                    Obx(
                      () => Container(
                        height: 125,
                        width: 125,
                        decoration: BoxDecoration(
                          color: isDarkMode.value ? AppColor.secondDarkMode : AppColor.white,
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: AppColor.grey_300,
                          ),
                          image: AppSettings.pickImagePath.isEmpty
                              ? AppSettings.profileImage.isNotEmpty
                                  ? DecorationImage(
                                      image: NetworkImage(
                                        AppSettings.profileImage.value,
                                      ),
                                      fit: BoxFit.cover,
                                    )
                                  : const DecorationImage(
                                      image: AssetImage(
                                        AppIcons.profileImage,
                                      ),
                                      fit: BoxFit.cover,
                                    )
                              : DecorationImage(
                                  image: FileImage(
                                    File(
                                      AppSettings.pickImagePath.value,
                                    ),
                                  ),
                                  fit: BoxFit.cover,
                                ),
                        ),
                      ),
                    ),
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
                            BoxShadow(
                              color: Colors.black26,
                              blurRadius: 4,
                            ),
                          ],
                        ),
                        child: const Center(
                          child: Icon(Icons.edit, color: Colors.white, size: 16),
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              Form(
                key: _formKey,
                child: Column(
                  children: [
                    SizedBox(height: SizeConfig.screenHeight / 40),

                    /// FULL NAME
                    ProfileTextFieldView(
                      hintText: "${AppStrings.fullName.tr} *",
                      controller: AppSettings.nameController,
                      inputFormatter: [
                        LengthLimitingTextInputFormatter(50),
                      ],
                    ),

                    SizedBox(height: SizeConfig.screenHeight / 40),

                    /// NICK NAME
                    ProfileTextFieldView(
                      hintText: "${AppStrings.nickName.tr} *",
                      controller: AppSettings.nickNameController,
                      inputFormatter: [
                        LengthLimitingTextInputFormatter(20),
                      ],
                    ),

                    SizedBox(height: SizeConfig.screenHeight / 40),

                    /// EMAIL
                    ProfileTextFieldView(
                      hintText: "${AppStrings.email.tr} *",
                      controller: AppSettings.emailController,
                      isReadOnly: false,
                    ),

                    SizedBox(height: SizeConfig.screenHeight / 40),

                    /// PHONE
                    const PhoneNumberTextFormField(),

                    SizedBox(height: SizeConfig.screenHeight / 40),

                    /// AGE
                    ProfileTextFieldView(
                      hintText: AppStrings.age.tr,
                      controller: AppSettings.ageController,
                      keyboardType: TextInputType.number,
                      inputFormatter: [
                        FilteringTextInputFormatter.digitsOnly,
                        LengthLimitingTextInputFormatter(3),
                      ],
                    ),

                    SizedBox(height: SizeConfig.screenHeight / 40),

                    /// GENDER
                    Container(
                      height: Get.height / 16,
                      width: Get.width / 1.1,
                      alignment: Alignment.center,
                      padding: EdgeInsets.only(
                        right: SizeConfig.blockSizeHorizontal * 3,
                      ),
                      decoration: BoxDecoration(
                        color: isDarkMode.value ? AppColor.secondDarkMode : AppColor.grey_100,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: DropdownButtonFormField2(
                        value: AppSettings.selectedGender,
                        decoration: const InputDecoration(
                          isDense: true,
                          border: InputBorder.none,
                          contentPadding: EdgeInsets.zero,
                        ),
                        isExpanded: true,
                        hint: Text(
                          "${AppStrings.gender.tr} *",
                          style: fillYourProfileStyle,
                        ),
                        items: genderItems
                            .map(
                              (item) => DropdownMenuItem<String>(
                                value: item,
                                child: Row(
                                  children: [
                                    Icon(
                                      item == "male".tr ? Icons.male : Icons.female,
                                    ),
                                    const SizedBox(width: 8),
                                    Text(item),
                                  ],
                                ),
                              ),
                            )
                            .toList(),
                        onChanged: (value) {
                          AppSettings.selectedGender = value.toString();

                          log(
                            "selectedGender => ${AppSettings.selectedGender}",
                          );
                        },
                      ),
                    ),

                    SizedBox(height: SizeConfig.screenHeight / 40),

                    /// CHANNEL TYPE
                    Container(
                      height: Get.height / 16,
                      width: Get.width / 1.1,
                      alignment: Alignment.center,
                      padding: const EdgeInsets.symmetric(horizontal: 15),
                      decoration: BoxDecoration(
                        color: isDarkMode.value ? AppColor.secondDarkMode : AppColor.grey_100,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: DropdownButtonFormField2(
                        value: AppSettings.channelType.value,
                        decoration: const InputDecoration(
                          isDense: true,
                          border: InputBorder.none,
                          contentPadding: EdgeInsets.zero,
                        ),
                        isExpanded: true,
                        hint: Text(
                          "${AppStrings.channelType.tr} *",
                          style: fillYourProfileStyle,
                        ),
                        items: channelTypes
                            .map(
                              (item) => DropdownMenuItem<int>(
                                value: item,
                                child: Text(
                                  item == 1 ? AppStrings.public.tr : AppStrings.private.tr,
                                ),
                              ),
                            )
                            .toList(),
                        onChanged: (value) {
                          AppSettings.channelType.value = value ?? 1;

                          Utils.showLog(
                            "Channel Type => ${AppSettings.channelType.value}",
                          );
                        },
                      ),
                    ),

                    SizedBox(height: SizeConfig.screenHeight / 40),

                    /// INSTAGRAM (OPTIONAL)
                    ProfileTextFieldView(
                      hintText: AppStrings.instagram.tr,
                      controller: AppSettings.instagramController,
                      inputFormatter: [
                        LengthLimitingTextInputFormatter(50),
                      ],
                    ),

                    SizedBox(height: SizeConfig.screenHeight / 40),

                    /// FACEBOOK (OPTIONAL)
                    ProfileTextFieldView(
                      hintText: AppStrings.facebook.tr,
                      controller: AppSettings.facebookController,
                      inputFormatter: [
                        LengthLimitingTextInputFormatter(50),
                      ],
                    ),

                    SizedBox(height: SizeConfig.screenHeight / 40),

                    /// TWITTER (OPTIONAL)
                    ProfileTextFieldView(
                      hintText: AppStrings.twitter.tr,
                      controller: AppSettings.twitterController,
                      inputFormatter: [
                        LengthLimitingTextInputFormatter(50),
                      ],
                    ),

                    SizedBox(height: SizeConfig.screenHeight / 40),

                    /// WEBSITE (OPTIONAL)
                    ProfileTextFieldView(
                      hintText: AppStrings.website.tr,
                      controller: AppSettings.websiteController,
                      inputFormatter: [
                        LengthLimitingTextInputFormatter(50),
                      ],
                    ),

                    SizedBox(height: SizeConfig.screenHeight / 40),

                    /// COUNTRY
                    const CountryTextFormField(),
                  ],
                ),
              ),

              SizedBox(height: SizeConfig.screenHeight / 20),

              /// SAVE BUTTON
              CustomFilledButton(
                title: AppStrings.save.tr,
                callback: () async {
                  final name = AppSettings.nameController.text.trim();

                  final nickName = AppSettings.nickNameController.text.trim();

                  final phone = AppSettings.phoneController.text.trim();

                  final age = AppSettings.ageController.text.trim();

                  final country = AppSettings.countryController.text.trim();

                  final hasImage = GetProfileApi.profileModel?.user?.image != null || AppSettings.pickImagePath.isNotEmpty;

                  /// REQUIRED VALIDATION

                  if (!hasImage) {
                    CustomToast.show(
                      "Please select profile image",
                    );
                    return;
                  }

                  if (name.isEmpty) {
                    CustomToast.show(
                      "Please enter full name",
                    );
                    return;
                  }

                  if (nickName.isEmpty) {
                    CustomToast.show(
                      "Please enter nick name",
                    );
                    return;
                  }

                  if (phone.isEmpty) {
                    CustomToast.show(
                      "Please enter phone number",
                    );
                    return;
                  }

                  if (!AppSettings.isValidPhone.value) {
                    CustomToast.show(
                      "Please enter valid phone number",
                    );
                    return;
                  }

                  if (age.isEmpty) {
                    CustomToast.show(
                      "Please enter age",
                    );
                    return;
                  }

                  if (int.tryParse(age) == null || int.parse(age) <= 0) {
                    CustomToast.show(
                      "Please enter valid age",
                    );
                    return;
                  }

                  if (AppSettings.selectedGender.isEmpty) {
                    CustomToast.show(
                      "Please select gender",
                    );
                    return;
                  }

                  if (country.isEmpty) {
                    CustomToast.show(
                      "Please enter country",
                    );
                    return;
                  }

                  if (AppSettings.channelType.value == 0) {
                    CustomToast.show(
                      "Please select channel type",
                    );
                    return;
                  }

                  if (!_formKey.currentState!.validate()) {
                    return;
                  }

                  /// CHECK CHANGE

                  final isProfileChanged = AppSettings.pickImagePath.value.isNotEmpty ||
                      AppSettings.nameController.text != (GetProfileApi.profileModel?.user?.fullName ?? "") ||
                      AppSettings.nickNameController.text != (GetProfileApi.profileModel?.user?.nickName ?? "") ||
                      AppSettings.phoneController.text != (GetProfileApi.profileModel?.user?.mobileNumber ?? "") ||
                      AppSettings.ageController.text != (GetProfileApi.profileModel?.user?.age.toString() ?? "") ||
                      AppSettings.selectedGender != GetProfileApi.profileModel?.user?.gender ||
                      AppSettings.instagramController.text != (GetProfileApi.profileModel?.user?.socialMediaLinks?.instagramLink ?? "") ||
                      AppSettings.facebookController.text != (GetProfileApi.profileModel?.user?.socialMediaLinks?.facebookLink ?? "") ||
                      AppSettings.twitterController.text != (GetProfileApi.profileModel?.user?.socialMediaLinks?.twitterLink ?? "") ||
                      AppSettings.websiteController.text != (GetProfileApi.profileModel?.user?.socialMediaLinks?.websiteLink ?? "") ||
                      AppSettings.countryController.text != (GetProfileApi.profileModel?.user?.country ?? "") ||
                      AppSettings.channelType.value != (GetProfileApi.profileModel?.user?.channelType ?? 1);

                  /// NO CHANGE

                  if (!isProfileChanged) {
                    Get.back();

                    CustomToast.show(
                      "Profile Updated Successfully!",
                    );

                    return;
                  }

                  /// API CALL
                  try {
                    Get.dialog(
                      const LoaderUi(
                        color: AppColor.white,
                      ),
                      barrierDismissible: false,
                    );

                    String? imageUrl;

                    if (AppSettings.pickImagePath.isNotEmpty) {
                      imageUrl = await ConvertChannelImageApi.callApi(
                        AppSettings.pickImagePath.value,
                      );
                    }

                    String userId = (Database.loginUserId != null && Database.loginUserId!.isNotEmpty)
                        ? Database.loginUserId!
                        : (GetProfileApi.profileModel?.user?.id ?? "");

                    if (userId.isNotEmpty && (Database.loginUserId == null || Database.loginUserId!.isEmpty)) {
                      await Database.onSetLoginUserId(userId);
                    }

                    if (userId.isEmpty) {
                      if (Get.isDialogOpen ?? false) Get.back();
                      CustomToast.show("User session expired. Please log in again.");
                      return;
                    }

                    final isSuccess = await EditProfileApi.callApi(
                      loginUserId: userId,
                      profileImage: imageUrl,
                      gender: AppSettings.selectedGender,
                    );

                    if (Get.isDialogOpen ?? false) Get.back();

                    if (isSuccess) {
                      await GetProfileApi.callApi(userId);
                      Get.back();
                      CustomToast.show("Profile Updated Successfully!");
                    } else {
                      CustomToast.show(AppStrings.someThingWentWrong.tr);
                    }
                  } catch (e) {
                    AppSettings.showLog("Edit profile submit error: $e");
                    if (Get.isDialogOpen ?? false) Get.back();
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

void chooseImageBottomSheet() {
  Get.bottomSheet(
    backgroundColor: isDarkMode.value ? AppColor.secondDarkMode : Colors.white,
    SizedBox(
      height: 160,
      child: Column(
        children: [
          const SizedBox(height: 8),
          Container(
            width: SizeConfig.blockSizeHorizontal * 12,
            height: 3,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(60),
              color: AppColor.grey_300,
            ),
          ),
          const SizedBox(height: 10),
          Text(
            AppStrings.chooseImage.tr,
            style: titalstyle1,
          ),
          const SizedBox(height: 5),
          Divider(
            indent: 25,
            endIndent: 25,
            color: AppColor.grey_300.withOpacity(0.8),
          ),
          const SizedBox(height: 10),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: GestureDetector(
              onTap: () => CustomImagePicker.pickImage(ImageSource.camera),
              child: Row(
                children: [
                  Image.asset(
                    AppIcons.camera,
                    color: isDarkMode.value ? AppColor.white.withOpacity(0.5) : AppColor.black,
                    height: 30,
                    width: 30,
                  ),
                  const SizedBox(width: 15),
                  Text(
                    "Take a photo",
                    style: bottomstyle,
                  ),
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
                children: [
                  Image.asset(
                    AppIcons.gallery,
                    color: isDarkMode.value ? AppColor.white.withOpacity(0.5) : AppColor.black,
                    height: 25,
                    width: 25,
                  ).paddingOnly(left: 3),
                  const SizedBox(width: 15),
                  Text(
                    "Choose from your file",
                    style: bottomstyle,
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    ),
  );
}

class ProfileTextFieldView extends StatelessWidget {
  const ProfileTextFieldView({
    super.key,
    required this.hintText,
    required this.controller,
    this.keyboardType,
    this.isReadOnly,
    this.inputFormatter,
  });

  final String hintText;
  final TextEditingController controller;
  final TextInputType? keyboardType;
  final bool? isReadOnly;
  final List<TextInputFormatter>? inputFormatter;

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
        controller: controller,
        keyboardType: keyboardType,
        readOnly: isReadOnly ?? false,
        inputFormatters: inputFormatter,
        cursorColor: isDarkMode.value ? AppColor.white : AppColor.black,
        style: GoogleFonts.urbanist(
          textStyle: TextStyle(
            color: isDarkMode.value ? AppColor.white : AppColor.black,
            fontWeight: FontWeight.w600,
            fontSize: 16,
          ),
        ),
        decoration: InputDecoration(
          isDense: true,
          hintText: hintText,
          border: InputBorder.none,
          hintStyle: GoogleFonts.urbanist(
            textStyle: const TextStyle(
              color: AppColor.grey,
              fontWeight: FontWeight.w400,
              fontSize: 15,
            ),
          ),
        ),
      ),
    );
  }
}

class PhoneNumberTextFormField extends StatelessWidget {
  const PhoneNumberTextFormField({super.key});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: SizeConfig.screenHeight / 13,
      width: SizeConfig.screenWidth / 1.1,
      child: IntlPhoneField(
        flagsButtonPadding: const EdgeInsets.all(8),
        dropdownIconPosition: IconPosition.trailing,
        controller: AppSettings.phoneController,
        obscureText: false,
        cursorColor: isDarkMode.value ? AppColor.white : AppColor.black,
        dropdownTextStyle: TextStyle(
          color: isDarkMode.value ? AppColor.white : AppColor.black,
          fontSize: 15,
        ),
        keyboardType: TextInputType.number,
        showCountryFlag: true,
        inputFormatters: [
          FilteringTextInputFormatter.digitsOnly,
        ],
        style: GoogleFonts.urbanist(
          textStyle: TextStyle(
            color: isDarkMode.value ? AppColor.white : AppColor.black,
            fontWeight: FontWeight.w600,
            fontSize: 16,
          ),
        ),
        onChanged: (phone) {
          try {
            AppSettings.isValidPhone.value = phone.isValidNumber();
          } catch (e) {
            AppSettings.isValidPhone.value = false;
          }
        },
        decoration: InputDecoration(
          hintText: "Phone*",
          contentPadding: const EdgeInsets.symmetric(vertical: 10),
          filled: true,
          fillColor: isDarkMode.value ? AppColor.secondDarkMode : AppColor.grey_100,
          hintStyle: GoogleFonts.urbanist(
            textStyle: const TextStyle(
              color: AppColor.grey,
              fontSize: 14,
            ),
          ),
          focusedBorder: OutlineInputBorder(
            borderSide: const BorderSide(
              color: AppColor.transparent,
            ),
            borderRadius: BorderRadius.circular(8),
          ),
          border: const OutlineInputBorder(
            borderRadius: BorderRadius.all(
              Radius.circular(8),
            ),
          ),
          enabledBorder: OutlineInputBorder(
            borderSide: const BorderSide(
              color: AppColor.transparent,
            ),
            borderRadius: BorderRadius.circular(8),
          ),
        ),
        initialCountryCode: 'IN',
      ),
    );
  }
}
