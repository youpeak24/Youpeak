// ignore_for_file: must_be_immutable

import 'package:country_picker/country_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:get/get_rx/src/rx_typedefs/rx_typedefs.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/main.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:youpeak/core/config/size_config.dart';
import 'package:youpeak/core/assets/app_icons.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'package:youpeak/core/constants/app_string.dart';
import 'package:youpeak/core/theme/app_style.dart';

class BasicButton extends StatelessWidget {
  const BasicButton({super.key, required this.title, required this.callback, this.width});

  final String title;
  final Callback callback;
  final double? width;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: callback,
      child: Container(
        height: 47,
        width: width ?? SizeConfig.screenWidth / 1.1,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: AppColor.primaryColor,
          borderRadius: BorderRadius.circular(100),
          // color: ColorValues.Shadow2RedColor,
        ),
        child: Text(
          title,
          textAlign: TextAlign.center,
          style: onBoardingButtonTextStyle,
        ),
      ),
    );
  }
}

class LoginScreenBottomText extends StatelessWidget {
  String text1;
  String text2;
  void Function() onTap;

  LoginScreenBottomText({super.key, required this.text1, required this.text2, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text.rich(
            TextSpan(
              children: [
                TextSpan(
                  text: text1,
                  style: GoogleFonts.urbanist(
                    fontSize: 15,
                    color: isDarkMode.value ? AppColor.white : AppColor.grey,
                  ),
                ),
                TextSpan(
                  text: " $text2",
                  style: GoogleFonts.urbanist(
                    fontSize: 15,
                    fontWeight: FontWeight.bold,
                    color: AppColor.primaryColor,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

Color color = AppColor.grey_100;

class TwoButton extends StatelessWidget {
  void Function() button1OnTap;
  String button1;
  String button2;
  void Function() button2OnTap;

  TwoButton({super.key, required this.button1OnTap, required this.button2OnTap, required this.button1, required this.button2});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
      children: [
        GestureDetector(
          onTap: button1OnTap,
          child: Container(
            alignment: Alignment.center,
            height: Get.height / 15,
            width: Get.width / 2.5,
            decoration: BoxDecoration(
              color: isDarkMode.value ? AppColor.grey.withOpacity(0.1) : AppColor.grey_100,
              borderRadius: BorderRadius.circular(30),
            ),
            child: Text(
              button1,
              style: skipStyle,
            ),
          ),
        ),
        GestureDetector(
          onTap: button2OnTap,
          child: Container(
            alignment: Alignment.center,
            height: Get.height / 15,
            width: Get.width / 2.5,
            decoration: BoxDecoration(
              color: AppColor.primaryColor,
              borderRadius: BorderRadius.circular(30),
            ),
            child: Text(
              button2,
              style: getStartStyle,
            ),
          ),
        ),
      ],
    );
  }
}

class CountryTextFormField extends StatefulWidget {
  const CountryTextFormField({super.key});

  @override
  State<CountryTextFormField> createState() => _CountryTextFormFieldState();
}

class _CountryTextFormFieldState extends State<CountryTextFormField> {
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => showCountryPicker(
        context: context,
        exclude: <String>['KN', 'MF'],
        showPhoneCode: false,
        moveAlongWithKeyboard: true,
        onSelect: (Country country) {
          setState(() {
            AppSettings.countryController.text = country.name;
          });
        },
        countryListTheme: CountryListThemeData(
          bottomSheetHeight: Get.height / 2,
          borderRadius: const BorderRadius.only(
            topLeft: Radius.circular(30.0),
            topRight: Radius.circular(30.0),
          ),
          inputDecoration: InputDecoration(
            hintText: 'Search',
            prefixIcon: const Icon(Icons.search),
            hintStyle: GoogleFonts.urbanist(textStyle: const TextStyle(color: AppColor.grey, fontWeight: FontWeight.w400, fontSize: 15)),
            contentPadding: EdgeInsets.zero,
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(25),
              borderSide: BorderSide(color: AppColor.grey_400),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(25),
              borderSide: BorderSide(color: AppColor.grey_400),
            ),
          ),
        ),
      ),
      child: Container(
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
          controller: AppSettings.countryController,
          readOnly: true,
          decoration: InputDecoration(
            enabled: false,
            contentPadding: const EdgeInsets.only(top: 12),
            hintText: AppStrings.country.tr,
            hintStyle: GoogleFonts.urbanist(textStyle: const TextStyle(color: AppColor.grey, fontWeight: FontWeight.w400, fontSize: 15)),
            isDense: true,
            suffixIconConstraints: const BoxConstraints(minWidth: 2, minHeight: 2),
            prefixIconConstraints: const BoxConstraints(minWidth: 2, minHeight: 2),
            border: InputBorder.none,
            suffixIcon: IconButton(
              onPressed: () {},
              icon: Icon(Icons.arrow_drop_down, size: 26, color: isDarkMode.value ? AppColor.white : AppColor.grey),
            ),
          ),
        ),
      ),
    );
  }
}

class ChannelNameTextFormField extends StatelessWidget {
  const ChannelNameTextFormField({super.key});

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
        controller: AppSettings.nameController, // Full Name == Channel Name ==> nameContoller
        inputFormatters: [LengthLimitingTextInputFormatter(20)],
        decoration: InputDecoration(
          hintText: AppStrings.channelName.tr,
          hintStyle: fillYourProfileStyle,
          isDense: true,
          suffixIconConstraints: const BoxConstraints(
            minWidth: 2,
            minHeight: 2,
          ),
          prefixIconConstraints: const BoxConstraints(
            minWidth: 2,
            minHeight: 2,
          ),
          border: InputBorder.none,
        ),
      ),
    );
  }
}

class DescriptionOfChannelTextFormField extends StatelessWidget {
  const DescriptionOfChannelTextFormField({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      height: SizeConfig.screenHeight / 6,
      width: SizeConfig.screenWidth / 1.1,
      alignment: Alignment.center,
      padding: const EdgeInsets.only(left: 20),
      decoration: BoxDecoration(
        color: isDarkMode.value ? AppColor.secondDarkMode : AppColor.grey_100,
        borderRadius: BorderRadius.circular(10),
      ),
      child: TextFormField(
        onEditingComplete: () => FocusScope.of(context).unfocus(),
        controller: AppSettings.channelDescriptionController,
        style: const TextStyle(
          decoration: TextDecoration.none,
          fontSize: 16,
        ),
        maxLines: 7,
        decoration: InputDecoration(
          contentPadding: const EdgeInsets.only(top: 10),
          border: InputBorder.none,
          hintText: "Tell us about yourself...",
          hintStyle: fillYourProfileStyle,
        ),
      ),
    );
  }
}

class BasicAppBar extends StatelessWidget {
  String title;

  BasicAppBar({super.key, required this.title});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 40),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          SizedBox(width: SizeConfig.blockSizeHorizontal * 2),
          Container(
            alignment: Alignment.topLeft,
            child: IconButton(
              icon: Image(
                image: const AssetImage(AppIcons.arrowBack),
                height: 18,
                width: 18,
                color: isDarkMode.value ? AppColor.white : AppColor.black,
              ),
              onPressed: () {
                Get.back();
              },
            ),
          ),
          SizedBox(width: SizeConfig.blockSizeHorizontal * 2),
          SizedBox(
            width: Get.width / 1.5,
            child: Text(
              title,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: profileTitleStyle,
            ),
          ),
        ],
      ),
    );
  }
}

class BottomShitButton extends StatelessWidget {
  BottomShitButton({super.key, required this.name, required this.onTap, required this.widget, this.color});

  void Function() onTap;
  String name;
  Widget widget;
  Color? color;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Padding(
        padding: EdgeInsets.only(left: SizeConfig.blockSizeHorizontal * 4),
        child: Container(
          color: AppColor.transparent,
          child: Row(
            children: [
              widget,
              SizedBox(width: SizeConfig.blockSizeHorizontal * 3),
              Text(
                name,
                style: GoogleFonts.urbanist(fontSize: 15, fontWeight: FontWeight.w600, color: color),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class CreateShortsOption extends StatelessWidget {
  String logo;
  String option;
  void Function() onTap;

  CreateShortsOption({
    super.key,
    required this.logo,
    required this.option,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        color: Colors.transparent,
        height: 80,
        width: Get.width,
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.only(
                left: 15,
              ),
              child: CircleAvatar(
                backgroundColor: isDarkMode.value ? const Color(0xFF31252F) : const Color(0xFFFFF1F3),
                radius: 28,
                child: Image(
                  image: AssetImage(logo),
                  height: 25,
                  width: 25,
                  color: AppColor.primaryColor,
                ),
              ),
            ),
            SizedBox(
              width: SizeConfig.blockSizeHorizontal * 5,
            ),
            Text(
              option,
              style: GoogleFonts.urbanist(fontWeight: FontWeight.bold, fontSize: 15),
            ),
          ],
        ),
      ),
    );
  }
}
