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
import 'package:youpeak/features/upload/controller/upload_video_controller.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:youpeak/core/config/size_config.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'package:youpeak/core/constants/app_string.dart';
import 'package:youpeak/core/theme/app_style.dart';
import 'package:dropdown_button2/dropdown_button2.dart';
import 'package:youpeak/core/utils/utils.dart';

class CreateChannelView extends StatelessWidget {
  const CreateChannelView({super.key});

  @override
  Widget build(BuildContext context) {
    final controller = Get.find<UploadVideoController>();
    List channelTypes = [1, 2];
    return Scaffold(
      appBar: AppBar(
        elevation: 0,
        automaticallyImplyLeading: false,
        centerTitle: AppSettings.isCenterTitle,
        title: Text(
          AppStrings.createYourChannel.tr,
          style: GoogleFonts.urbanist(
            fontSize: 19,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
      bottomNavigationBar: GestureDetector(
        onTap: () async {
          AppSettings.showLog("Create Channel Method Called");
          if (controller.channelName.text.trim().isEmpty || controller.channelDescription.text.trim().isEmpty) {
            CustomToast.show(AppStrings.pleaseFillUpDetails.tr);
          } else {
            FocusScope.of(context).requestFocus(FocusNode());

            Get.dialog(const LoaderUi(color: AppColor.white), barrierDismissible: false);

            final nameStatus = await CheckChannelNameApi.callApi(controller.channelName.text.trim());

            if (nameStatus == null) {
              Get.back();
              CustomToast.show(AppStrings.someThingWentWrong.tr);
            } else if (nameStatus == false) {
              Get.back();
              CustomToast.show("The provided channelName is already in use. Please choose a different one.");
            } else {
              // A free name doesn't create the channel by itself — this used to
              // stop right here and just refresh the profile, so isChannel
              // stayed false on the server and every upload attempt bounced
              // back to this same screen. Actually create it now.
              AppSettings.nameController.text = controller.channelName.text.trim();
              AppSettings.channelDescriptionController.text = controller.channelDescription.text.trim();
              await CreateChannelApi.callApi();

              if (CreateChannelApi.status == true) {
                await GetProfileApi.callApi(Database.loginUserId!);
                Get.close(2);
              } else {
                Get.back();
                CustomToast.show(CreateChannelApi.message?.toString() ?? AppStrings.someThingWentWrong.tr);
              }
            }
          }
        },
        child: Container(
          alignment: Alignment.center,
          height: Get.height / 15,
          margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
          decoration: BoxDecoration(color: AppColor.primaryColor, borderRadius: BorderRadius.circular(30)),
          child: Text(AppStrings.continueString.tr, style: getStartStyle),
        ),
      ),
      body: GestureDetector(
        onTap: () => FocusScope.of(context).requestFocus(FocusNode()),
        child: SizedBox(
          height: Get.height,
          width: Get.width,
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
