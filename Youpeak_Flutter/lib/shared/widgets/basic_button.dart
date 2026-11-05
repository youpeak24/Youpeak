// ignore_for_file: must_be_immutable

import 'package:youpeak/core/platform/app_layout.dart';
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
import 'package:youpeak/core/theme/app_tokens.dart';
import 'package:youpeak/shared/widgets/app_pressable.dart';
import 'package:youpeak/shared/widgets/app_icon.dart';

class BasicButton extends StatelessWidget {
  const BasicButton({super.key, required this.title, required this.callback, this.width});

  final String title;
  final Callback callback;
  final double? width;

  @override
  Widget build(BuildContext context) {
    return AppPressable(
      onTap: callback,
      haptic: true,
      semanticLabel: title,
      child: Container(
        height: 52,
        width: width ?? SizeConfig.screenWidth / 1.1,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: AppColor.primaryColor,
          borderRadius: BorderRadius.circular(100),
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
    return AppPressable(
      onTap: onTap,
      pressedScale: 0.98,
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
                    fontWeight: FontWeight.w800,
                    color: isDarkMode.value ? AppColor.brightGreen : AppColor.primaryColor,
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
    final dark = isDarkMode.value;
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
      children: [
        AppPressable(
          onTap: button1OnTap,
          haptic: true,
          child: Container(
            alignment: Alignment.center,
            height: 52,
            width: AppLayout.width / 2.5,
            decoration: BoxDecoration(
              color: dark ? AppColor.white.withValues(alpha: 0.08) : AppColor.secondaryMintGreen,
              borderRadius: BorderRadius.circular(100),
            ),
            child: Text(button1, style: skipStyle),
          ),
        ),
        AppPressable(
          onTap: button2OnTap,
          haptic: true,
          child: Container(
            alignment: Alignment.center,
            height: 52,
            width: AppLayout.width / 2.5,
            decoration: BoxDecoration(
              color: AppColor.primaryColor,
              borderRadius: BorderRadius.circular(100),
            ),
            child: Text(button2, style: getStartStyle),
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
    // The page draws under the status bar, so inset by the real height (a
    // fixed 40 left notched phones with the title behind the cut-out).
    return Padding(
      padding: EdgeInsets.only(top: MediaQuery.paddingOf(context).top + 6, left: 4, right: 12),
      child: Row(
        children: [
          AppPressable(
            onTap: () => Get.back(),
            semanticLabel: "Back",
            child: SizedBox(
              width: 48,
              height: 48,
              child: Center(
                child: Obx(() => AppIcon(AppIcons.arrowBack, size: 22, color: isDarkMode.value ? AppColor.white : AppColor.black)),
              ),
            ),
          ),
          const SizedBox(width: 4),
          Expanded(
            child: Text(
              title,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: GoogleFonts.urbanist(fontSize: 20, fontWeight: FontWeight.w800, letterSpacing: -0.2),
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
    final dark = isDarkMode.value;
    return AppPressable(
      onTap: onTap,
      pressedScale: 0.985,
      semanticLabel: name,
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 12),
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 11),
        color: Colors.transparent,
        child: Row(
          children: [
            Container(
              height: 40,
              width: 40,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: dark ? AppColor.white.withValues(alpha: 0.08) : AppColor.secondaryMintGreen,
              ),
              child: Center(child: widget),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Text(
                name,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: GoogleFonts.urbanist(fontSize: 15.5, fontWeight: FontWeight.w700, color: color),
              ),
            ),
          ],
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
    final dark = isDarkMode.value;
    return AppPressable(
      onTap: onTap,
      haptic: true,
      pressedScale: 0.985,
      semanticLabel: option,
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 5),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: dark ? AppColor.white.withValues(alpha: 0.06) : AppColor.lightGreyBG,
          borderRadius: BorderRadius.circular(AppRadius.card),
          border: Border.all(color: AppElevation.hairline(dark)),
        ),
        child: Row(
          children: [
            Container(
              height: 48,
              width: 48,
              decoration: BoxDecoration(
                color: dark ? AppColor.white.withValues(alpha: 0.10) : AppColor.secondaryMintGreen,
                borderRadius: BorderRadius.circular(14),
              ),
              child: Center(child: AppIcon(logo, size: 24, color: dark ? AppColor.brightGreen : AppColor.primaryColor)),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Text(
                option,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: GoogleFonts.urbanist(fontWeight: FontWeight.w800, fontSize: 16),
              ),
            ),
            Icon(Icons.chevron_right_rounded, color: dark ? AppColor.mutedTextDark : AppColor.mutedText),
          ],
        ),
      ),
    );
  }
}
