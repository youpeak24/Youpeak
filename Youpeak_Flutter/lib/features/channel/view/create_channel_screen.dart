import 'package:youpeak/core/platform/responsive.dart';
import 'package:youpeak/core/platform/app_layout.dart';
import 'package:youpeak/features/channel/view/your_channel_view.dart';

import 'package:dropdown_button2/dropdown_button2.dart';
import 'package:flutter/material.dart';
import 'package:youpeak/shared/widgets/app_artwork.dart';
import 'package:youpeak/core/assets/app_visuals.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/shared/widgets/basic_button.dart';
import 'package:youpeak/core/utils/custom_toast.dart';
import 'package:youpeak/shared/widgets/loader_ui.dart';
import 'package:youpeak/core/storage/database/database.dart';
import 'package:youpeak/main.dart';
import 'package:youpeak/features/profile/api/get_profile_api.dart';
import 'package:youpeak/features/channel/api/create_channel_api.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:youpeak/core/config/size_config.dart';
import 'package:youpeak/core/assets/app_icons.dart';
import 'package:youpeak/shared/widgets/app_icon.dart';
import 'package:youpeak/shared/widgets/app_pressable.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'package:youpeak/core/constants/app_string.dart';
import 'package:youpeak/core/theme/app_style.dart';
import 'package:youpeak/core/utils/utils.dart';

class CreateChannelScreen extends StatefulWidget {
  const CreateChannelScreen({super.key});

  @override
  State<CreateChannelScreen> createState() => _CreateChannelScreenState();
}

class _CreateChannelScreenState extends State<CreateChannelScreen> {
  // Set while a create request is running: a second tap must not start another.
  bool _creating = false;

  @override
  Widget build(BuildContext context) {
    List channelTypes = [1, 2];

    final wide = PageWidth.of(context) >= Responsive.inlineActionFrom;
    final dockedAction = AppPressable(
        onTap: () async {
          AppSettings.showLog("Create Channel Method Called");
          if (_creating) return;
          final name = AppSettings.nameController.text.trim();
          if (name.isEmpty || AppSettings.channelDescriptionController.text.trim().isEmpty) {
            CustomToast.show(AppStrings.pleaseFillUpDetails.tr);
            return;
          }
          if (name.length < 2) {
            CustomToast.show("The channel name needs at least 2 characters.");
            return;
          }
          _creating = true;
          Get.dialog(const LoaderUi(color: AppColor.white), barrierDismissible: false);
          try {
            await CreateChannelApi.callApi();
            if (CreateChannelApi.status == true) {
              await GetProfileApi.callApi(Database.loginUserId!);
              final channelId = CreateChannelApi.channelId.isNotEmpty ? CreateChannelApi.channelId : (Database.channelId ?? Database.loginUserId ?? "");
              Get.back(); // loader
              CustomToast.show(AppStrings.channelCreated.tr);
              // Open the new channel in place of this form.
              Get.off(() => YourChannelView(loginUserId: Database.loginUserId ?? "", channelId: channelId));
            } else {
              Get.back();
              CustomToast.show(CreateChannelApi.message?.isNotEmpty == true ? CreateChannelApi.message! : AppStrings.someThingWentWrong.tr, long: true);
            }
          } finally {
            _creating = false;
          }
        },
        semanticLabel: AppStrings.continueString.tr,
        pressedScale: 0.985,
        haptic: true,
        child: Container(
          alignment: Alignment.center,
          height: 52,
          margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
          decoration: BoxDecoration(color: AppColor.primaryColor, borderRadius: BorderRadius.circular(100)),
          child: Text(AppStrings.continueString.tr, style: getStartStyle),
        ),
      );

    return Scaffold(
      appBar: AppBar(
        elevation: 0,
        centerTitle: AppSettings.isCenterTitle,
        leadingWidth: 54,
        leading: AppPressable(
          onTap: () => Get.back(),
          semanticLabel: "Back",
          child: SizedBox(
            width: 48,
            height: 48,
            child: Center(
              child: Obx(
                () => AppIcon(
                  AppIcons.arrowBack,
                  size: 22,
                  color: isDarkMode.value ? AppColor.white : AppColor.black,
                ),
              ),
            ),
          ),
        ),
        title: Text(
          AppStrings.createYourChannel.tr,
          style: GoogleFonts.urbanist(
            fontSize: 19,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
      bottomNavigationBar: wide ? null : dockedAction,
      body: GestureDetector(
        onTap: () => FocusScope.of(context).requestFocus(FocusNode()),
        child: SizedBox(
          height: Get.height,
          width: AppLayout.widthOf(context),
          child: Padding(
            padding: const EdgeInsets.all(10.0),
            child: SingleChildScrollView(
              physics: const BouncingScrollPhysics(),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const FeatureArtwork(asset: AppVisuals.channelHero),
                  const ChannelNameTextFormField(),
                  SizedBox(height: SizeConfig.screenHeight / 30),
                  const DescriptionOfChannelTextFormField(),
                  SizedBox(height: SizeConfig.screenHeight / 30),
                  // Row(
                  //   mainAxisAlignment: MainAxisAlignment.center,
                  //   children: [
                  //     Transform.scale(
                  //       scale: 1.2,
                  //       child: Radio(
                  //         fillColor: const WidgetStatePropertyAll(AppColor.primaryColor),
                  //         value: 1,
                  //         groupValue: AppSettings.channelType.value,
                  //         onChanged: (value) => AppSettings.channelType.value = value ?? 0,
                  //       ),
                  //     ),
                  //     Text(
                  //       AppStrings.public.tr,
                  //       style: GoogleFonts.urbanist(fontSize: 18, color: isDarkMode.value ? AppColor.white : AppColor.black, fontWeight: FontWeight.bold),
                  //     ),
                  //     15.width,
                  //     Transform.scale(
                  //       scale: 1.2,
                  //       child: Radio(
                  //         fillColor: const WidgetStatePropertyAll(AppColor.primaryColor),
                  //         value: 2,
                  //         groupValue: AppSettings.channelType.value,
                  //         onChanged: (value) => AppSettings.channelType.value = value ?? 0,
                  //       ),
                  //     ),
                  //     Text(
                  //       AppStrings.private.tr,
                  //       style: GoogleFonts.urbanist(fontSize: 18, color: isDarkMode.value ? AppColor.white : AppColor.black, fontWeight: FontWeight.bold),
                  //     ),
                  //   ],
                  // )
                  // Container(
                  //   height: Get.height / 16,
                  //   width: AppLayout.width / 1.1,
                  //   alignment: Alignment.center,
                  //   padding: EdgeInsets.only(right: SizeConfig.blockSizeHorizontal * 3),
                  //   decoration: BoxDecoration(
                  //     color: isDarkMode.value ? AppColor.secondDarkMode : AppColor.grey_100,
                  //     borderRadius: BorderRadius.circular(10),
                  //   ),
                  //   child: DropdownButtonFormField2(
                  //     value: AppSettings.selectedGender,
                  //     decoration: const InputDecoration(
                  //       isDense: true,
                  //       suffixIconConstraints: BoxConstraints(minWidth: 2, minHeight: 2),
                  //       prefixIconConstraints: BoxConstraints(minWidth: 2, minHeight: 2),
                  //       contentPadding: EdgeInsets.zero,
                  //       border: InputBorder.none,
                  //     ),
                  //     isExpanded: true,
                  //     hint: Text("${AppStrings.gender.tr} *", style: fillYourProfileStyle),
                  //     items: channelTypes
                  //         .map(
                  //           (item) => DropdownMenuItem<String>(
                  //             value: item,
                  //             child: Row(
                  //               children: [
                  //                 Text(
                  //                   item,
                  //                   style: const TextStyle(
                  //                     fontSize: 14,
                  //                   ),
                  //                 ),
                  //               ],
                  //             ),
                  //           ),
                  //         )
                  //         .toList(),
                  //     onChanged: (value) {
                  //       if (value == AppStrings.public.tr) {
                  //         AppSettings.channelType.value = 1;
                  //       } else if (value == AppStrings.private.tr) {
                  //         AppSettings.channelType.value = 2;
                  //       }
                  //       log("Channel Type => ${AppSettings.channelType}");
                  //     },
                  //     onSaved: (value) {
                  //       if (value == AppStrings.public.tr) {
                  //         AppSettings.channelType.value = 1;
                  //       } else if (value == AppStrings.private.tr) {
                  //         AppSettings.channelType.value = 2;
                  //       }
                  //     },
                  //   ),
                  // ),

                  Container(
                    height: Get.height / 16,
                    width: AppLayout.width / 1.1,
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
                        suffixIconConstraints: BoxConstraints(minWidth: 2, minHeight: 2),
                        prefixIconConstraints: BoxConstraints(minWidth: 2, minHeight: 2),
                        contentPadding: EdgeInsets.zero,
                        border: InputBorder.none,
                      ),
                      isExpanded: true,
                      hint: Text("${AppStrings.channelType.tr} *", style: fillYourProfileStyle),
                      items: channelTypes
                          .map(
                            (item) => DropdownMenuItem<int>(
                              value: item,
                              child: Text(
                                item == 1 ? AppStrings.public.tr : AppStrings.private.tr,
                                style: const TextStyle(fontSize: 14),
                              ),
                            ),
                          )
                          .toList(),
                      onChanged: (value) {
                        AppSettings.channelType.value = value ?? 0;
                        Utils.showLog("Channel Type => ${AppSettings.channelType.value}");
                      },
                    ),
                  ),
                  if (wide) ...[const SizedBox(height: 16), Center(child: SizedBox(width: 420, child: dockedAction))],
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
