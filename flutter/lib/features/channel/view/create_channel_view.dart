import 'package:youpeak/core/platform/responsive.dart';
import 'package:youpeak/core/platform/app_layout.dart';
import 'package:flutter/material.dart';
import 'package:youpeak/shared/widgets/app_artwork.dart';
import 'package:youpeak/core/assets/app_visuals.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/core/utils/custom_toast.dart';
import 'package:youpeak/shared/widgets/loader_ui.dart';
import 'package:youpeak/core/storage/database/database.dart';
import 'package:youpeak/main.dart';
import 'package:youpeak/features/profile/api/get_profile_api.dart';
import 'package:youpeak/features/channel/api/check_channel_name_api.dart';
import 'package:youpeak/features/channel/api/create_channel_api.dart';
import 'package:youpeak/features/channel/view/your_channel_view.dart';
import 'package:youpeak/features/upload/controller/upload_video_controller.dart';
import 'package:youpeak/core/assets/app_icons.dart';
import 'package:youpeak/shared/widgets/app_icon.dart';
import 'package:youpeak/shared/widgets/app_pressable.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:youpeak/core/config/size_config.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'package:youpeak/core/constants/app_string.dart';
import 'package:youpeak/core/theme/app_style.dart';
import 'package:dropdown_button2/dropdown_button2.dart';
import 'package:youpeak/core/utils/utils.dart';

// Set while a create request is running: a second tap (or Enter) must not start
// another one.
bool _creatingChannel = false;

class CreateChannelView extends StatelessWidget {
  const CreateChannelView({super.key});

  @override
  Widget build(BuildContext context) {
    final controller = Get.find<UploadVideoController>();
    List channelTypes = [1, 2];
    final wide = PageWidth.of(context) >= Responsive.inlineActionFrom;
    final dockedAction = AppPressable(
        onTap: () async {
          AppSettings.showLog("Create Channel Method Called");
          if (_creatingChannel) return;
          final name = controller.channelName.text.trim();
          final description = controller.channelDescription.text.trim();
          if (name.isEmpty || description.isEmpty) {
            CustomToast.show(AppStrings.pleaseFillUpDetails.tr);
            return;
          }
          if (name.length < 2) {
            CustomToast.show("The channel name needs at least 2 characters.");
            return;
          }
          _creatingChannel = true;
          FocusScope.of(context).requestFocus(FocusNode());
          Get.dialog(const LoaderUi(color: AppColor.white), barrierDismissible: false);
          try {
            final nameStatus = await CheckChannelNameApi.callApi(name);

            if (nameStatus == null) {
              Get.back();
              CustomToast.show("Could not check the channel name. Check your connection and try again.", long: true);
              return;
            }
            if (nameStatus == false) {
              Get.back();
              CustomToast.show(CheckChannelNameApi.lastMessage.isNotEmpty ? CheckChannelNameApi.lastMessage : "This channel name is already taken. Please try another one.", long: true);
              return;
            }
            // A free name doesn't create the channel by itself: create it now.
            AppSettings.nameController.text = name;
            AppSettings.channelDescriptionController.text = description;
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
            _creatingChannel = false;
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
                  ChannelNameField(controller: controller.channelName),
                  SizedBox(height: SizeConfig.screenHeight / 30),
                  ChannelDescriptionField(controller: controller.channelDescription),
                  SizedBox(height: SizeConfig.screenHeight / 30),
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

class ChannelNameField extends StatelessWidget {
  const ChannelNameField({super.key, required this.controller});

  final TextEditingController controller;

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
        inputFormatters: [LengthLimitingTextInputFormatter(30)],
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

class ChannelDescriptionField extends StatelessWidget {
  const ChannelDescriptionField({super.key, required this.controller});

  final TextEditingController controller;

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
        controller: controller,
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
