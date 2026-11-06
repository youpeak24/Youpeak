import 'package:youpeak/shared/dialogs/app_sheet.dart';
import 'package:youpeak/core/platform/app_layout.dart';
import 'package:dropdown_button2/dropdown_button2.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/shared/widgets/basic_button.dart';
import 'package:youpeak/core/utils/custom_format_timer.dart';
import 'package:youpeak/core/utils/custom_toast.dart';
import 'package:youpeak/shared/widgets/data_not_found_ui.dart';
import 'package:youpeak/shared/widgets/loader_ui.dart';
import 'package:youpeak/shared/widgets/small_video_widget.dart';
import 'package:youpeak/main.dart';
import 'package:youpeak/features/playlist/controller/create_playlist_controller.dart';
import 'package:youpeak/features/library/controller/nav_library_controller.dart';
import 'package:youpeak/features/bites/view/nav_shorts_details_view.dart';
import 'package:youpeak/features/video/view/normal_video_details_view.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:youpeak/core/config/size_config.dart';
import 'package:youpeak/core/assets/app_icons.dart';
import 'package:youpeak/shared/widgets/preview_image.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'package:youpeak/core/constants/app_string.dart';
import 'package:youpeak/core/theme/app_style.dart';

class CreatePlayListView extends GetView<CreatePlaylistController> {
  const CreatePlayListView({super.key});

  @override
  Widget build(BuildContext context) {
    List<String> playListType = ["private".tr, "public".tr];
    return PopScope(
      child: Scaffold(
        resizeToAvoidBottomInset: false,
        appBar: AppBar(
          elevation: 0,
          centerTitle: AppSettings.isCenterTitle,
          systemOverlayStyle: SystemUiOverlayStyle(statusBarColor: Colors.transparent, statusBarIconBrightness: isDarkMode.value ? Brightness.light : Brightness.dark),
          leading: IconButtonUi(callback: () => Get.back(), icon: Image.asset(AppIcons.arrowBack, color: isDarkMode.value ? AppColor.white : AppColor.black).paddingOnly(left: 15, right: 20)),
          leadingWidth: 55,
          title: Text(
            AppStrings.createNewPlayList.tr,
            style: GoogleFonts.urbanist(fontSize: 18, fontWeight: FontWeight.bold),
          ),
          actions: [
            GetBuilder<NavLibraryPageController>(
                id: "onChangePlayList",
                builder: (controller) => GestureDetector(
                      onTap: controller.playList.length >= 1
                          ? () => AppSheet.show(
                                isScrollControlled: true,
                                backgroundColor: isDarkMode.value ? AppColor.secondDarkMode : AppColor.white,
                                shape: const RoundedRectangleBorder(
                                  borderRadius: BorderRadius.only(
                                    topRight: Radius.circular(25),
                                    topLeft: Radius.circular(25),
                                  ),
                                ),
                                SizedBox(
                                  height: SizeConfig.screenHeight / 1.8,
                                  child: Column(
                                    children: [
                                      SizedBox(height: SizeConfig.blockSizeVertical * 2),
                                      Container(
                                        width: SizeConfig.blockSizeHorizontal * 12,
                                        height: 3,
                                        decoration: BoxDecoration(
                                          borderRadius: BorderRadius.circular(60),
                                          color: AppColor.grey_300,
                                        ),
                                      ),
                                      SizedBox(height: SizeConfig.blockSizeVertical * 2),
                                      Text(AppStrings.newPlaylist.tr, style: titalstyle1),
                                      SizedBox(height: SizeConfig.blockSizeVertical * 2),
                                      const Divider(indent: 25, endIndent: 25, color: AppColor.grey),
                                      SizedBox(height: SizeConfig.blockSizeVertical * 2),
                                      Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                                        children: [
                                          Padding(
                                            padding: EdgeInsets.only(
                                              left: SizeConfig.blockSizeHorizontal * 6,
                                            ),
                                            child: Text(
                                              AppStrings.playlistTitle.tr,
                                              style: titalstyle1,
                                              textAlign: TextAlign.left,
                                            ),
                                          ),
                                          SizedBox(height: SizeConfig.blockSizeVertical * 2),
                                          Container(
                                              height: SizeConfig.screenHeight / 14.5,
                                              width: SizeConfig.screenWidth / 1.15,
                                              alignment: Alignment.center,
                                              padding: const EdgeInsets.only(left: 20),
                                              margin: EdgeInsets.only(left: SizeConfig.blockSizeHorizontal * 6),
                                              decoration: BoxDecoration(
                                                borderRadius: BorderRadius.circular(10),
                                                color: AppColor.grey.withOpacity(0.1),
                                              ),
                                              child: TextFormField(
                                                controller: AppSettings.playListNameController,
                                                style: const TextStyle(fontSize: 14),
                                                decoration: InputDecoration(border: InputBorder.none, hintText: AppStrings.enterYourTitle.tr, hintStyle: const TextStyle(color: Colors.grey, fontSize: 14)),
                                              )),
                                          SizedBox(height: SizeConfig.blockSizeVertical * 2),
                                          Padding(
                                            padding: EdgeInsets.only(left: SizeConfig.blockSizeHorizontal * 6),
                                            child: Text(AppStrings.privacy.tr, style: titalstyle1, textAlign: TextAlign.left),
                                          ),
                                          SizedBox(height: SizeConfig.blockSizeVertical * 2),
                                          Container(
                                            height: SizeConfig.screenHeight / 14.5,
                                            width: SizeConfig.screenWidth / 1.15,
                                            alignment: Alignment.center,
                                            margin: EdgeInsets.only(left: SizeConfig.blockSizeHorizontal * 6),
                                            padding: const EdgeInsets.only(left: 10, right: 10),
                                            decoration: BoxDecoration(
                                              borderRadius: BorderRadius.circular(10),
                                              color: AppColor.grey.withOpacity(0.1),
                                            ),
                                            child: DropdownButtonFormField2(
                                              value: null,
                                              decoration: const InputDecoration(isDense: true, suffixIconConstraints: BoxConstraints(minWidth: 2, minHeight: 2), prefixIconConstraints: BoxConstraints(minWidth: 2, minHeight: 2), contentPadding: EdgeInsets.zero, border: InputBorder.none),
                                              isExpanded: true,
                                              hint: Text(
                                                AppStrings.enterYourPrivacy.tr,
                                                style: const TextStyle(color: Colors.grey, fontSize: 14),
                                              ),
                                              items: playListType
                                                  .map((item) => DropdownMenuItem<String>(
                                                        value: item,
                                                        child: Text(item.tr, style: const TextStyle(fontSize: 14)),
                                                      ))
                                                  .toList(),
                                              validator: (value) {
                                                if (value == null) {
                                                  return 'Please Select PlayList Type.';
                                                }
                                                return null;
                                              },
                                              onChanged: (value) {
                                                if (value == AppStrings.private.tr) {
                                                  controller.selectPlayListType = 1;
                                                } else {
                                                  controller.selectPlayListType = 2;
                                                }
                                              },
                                            ),
                                          ),
                                          SizedBox(height: SizeConfig.blockSizeVertical * 2),
                                          const Divider(indent: 25, endIndent: 25, color: AppColor.grey),
                                          SizedBox(height: SizeConfig.blockSizeVertical * 2),
                                          TwoButton(
                                            button1: AppStrings.cancel.tr,
                                            button2: AppStrings.create.tr,
                                            button1OnTap: () => Get.back(),
                                            button2OnTap: () => controller.createPlayList(),
                                          ),
                                          SizedBox(height: SizeConfig.blockSizeVertical * 2),
                                        ],
                                      ),
                                    ],
                                  ),
                                ),
                              )
                          : () => CustomToast.show(AppStrings.pleaseSelectMinimum2Videos.tr),
                      child: Center(
                        child: Text(AppStrings.next.tr, style: GoogleFonts.urbanist(color: controller.playList.length >= 1 ? AppColor.primaryColor : Colors.grey, fontSize: 16, fontWeight: FontWeight.bold)),
                      ),
                    )),
            const SizedBox(width: 15),
          ],
        ),
        body: GetBuilder<CreatePlaylistController>(
          id: "onGetNormalVideo",
          builder: (controller) => controller.isLoadingPlayList
              ? const LoaderUi()
              : controller.videos.isEmpty
                  ? const DataNotFoundUi(type: EmptyStateType.playlist)
                  : RefreshIndicator(
                      onRefresh: () => controller.init(),
                      color: AppColor.primaryColor,
                      child: ListView.builder(
                        controller: controller.scrollControllerPlayList,
                        itemCount: controller.videos.length,
                        physics: const BouncingScrollPhysics(),
                        padding: const EdgeInsets.symmetric(horizontal: 10),
                        itemBuilder: (context, index) {
                          final indexData = controller.videos[index];

                          return Padding(
                            padding: const EdgeInsets.only(bottom: 10),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Stack(
                                  children: [
                                    Obx(
                                      () => Container(
                                        clipBehavior: Clip.hardEdge,
                                        height: SizeConfig.smallVideoImageHeight,
                                        width: SizeConfig.smallVideoImageWidth,
                                        decoration: BoxDecoration(
                                          color: isDarkMode.value ? AppColor.secondDarkMode : AppColor.grey_400,
                                          borderRadius: BorderRadius.circular(20),
                                        ),
                                        child: PreviewVideoImage(
                                          videoId: indexData.id ?? "",
                                          videoImage: indexData.videoImage ?? "",
                                        ),
                                      ),
                                    ),
                                    Positioned(
                                      right: 10,
                                      bottom: 10,
                                      child: Container(
                                        alignment: Alignment.center,
                                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                                        decoration: BoxDecoration(
                                          borderRadius: BorderRadius.circular(7),
                                          color: AppColor.black,
                                        ),
                                        child: Text(
                                          CustomFormatTime.convertSecond(int.parse(indexData.videoTime.toString() == "null" ? "0" : indexData.videoTime.toString())),
                                          style: GoogleFonts.urbanist(color: AppColor.white, fontSize: 11),
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                                SizedBox(width: AppLayout.width * 0.03),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        indexData.title.toString(),
                                        maxLines: 3,
                                        style: GoogleFonts.urbanist(
                                          fontSize: 16,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                      const SizedBox(height: 5),
                                      Text(
                                        indexData.channelName.toString(),
                                        style: GoogleFonts.urbanist(
                                          fontSize: 12,
                                          color: isDarkMode.value ? AppColor.white.withOpacity(0.7) : AppColor.black.withOpacity(0.7),
                                        ),
                                      ),
                                      const SizedBox(height: 5),
                                      Text(
                                        // "${indexData.views.toString()} • ${indexData.videoTime.toString()}",
                                        indexData.channelName.toString(),
                                        style: GoogleFonts.urbanist(
                                          fontSize: 10,
                                          color: isDarkMode.value ? AppColor.white.withOpacity(0.7) : AppColor.black.withOpacity(0.7),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                GetBuilder<NavLibraryPageController>(
                                  id: "onChangePlayList",
                                  builder: (navLibController) => Checkbox(
                                    checkColor: AppColor.white,
                                    activeColor: AppColor.primaryColor,
                                    value: navLibController.playList.contains(indexData.id ?? ""),
                                    onChanged: (value) {
                                      if (indexData.id != null) {
                                        if (navLibController.playList.contains(indexData.id!)) {
                                          navLibController.deleteIntoPlayList(indexData.id!);
                                        } else {
                                          navLibController.insertIntoPlayList(indexData.id!);
                                        }
                                      }
                                    },
                                  ),
                                ),
                              ],
                            ),
                          );
                        },
                      ),
                    ),
        ),
        bottomNavigationBar: GetBuilder<CreatePlaylistController>(
          id: "onPagination",
          builder: (controller) => Visibility(
            visible: controller.isLoadingPaginationPlayList,
            child: LinearProgressIndicator(color: AppColor.primaryColor, backgroundColor: AppColor.grey_300),
          ),
        ),
      ),
    );
  }
}
