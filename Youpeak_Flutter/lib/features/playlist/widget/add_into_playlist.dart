import 'package:youpeak/shared/dialogs/app_sheet.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/core/utils/custom_toast.dart';
import 'package:youpeak/shared/widgets/data_not_found_ui.dart';
import 'package:youpeak/shared/widgets/loader_ui.dart';
import 'package:youpeak/core/storage/database/database.dart';
import 'package:youpeak/main.dart';
import 'package:youpeak/features/playlist/api/add_into_play_list_api.dart';
import 'package:youpeak/features/channel/api/channel_playlist_api.dart';
import 'package:youpeak/features/channel/model/channel_playlist_model.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:youpeak/core/config/size_config.dart';
import 'package:youpeak/shared/widgets/preview_image.dart';
import 'package:youpeak/core/constants/app_string.dart';
import 'package:youpeak/core/theme/app_style.dart';

class AddIntoPlayList {
  static ChannelPlaylistModel? channelPlaylistModel;

  // Using Rx<List<...>> instead of RxList<...> to avoid GetX generic type
  // caching conflict with the unrelated `PlayList` class in get_play_list_model.dart
  static final Rx<List<PlayListsOfChannel>> mainPlayList = Rx<List<PlayListsOfChannel>>([]);

  static RxBool isLoading = true.obs;
  static RxString selectedPlayList = "".obs;

  static Future<void> onGetPlayList(String channelId) async {
    channelPlaylistModel = await ChannelPlayListApi.callApi(channelId);
    isLoading.value = false;

    if (channelPlaylistModel?.playListsOfChannel != null && channelPlaylistModel!.playListsOfChannel!.isNotEmpty) {
      mainPlayList.value = [...mainPlayList.value, ...channelPlaylistModel!.playListsOfChannel!];
    } else {
      ChannelPlayListApi.startPagination--;
    }
  }

  static void onAddToPlayList(String channelId, String videoId) async {
    ChannelPlayListApi.startPagination = 0;
    mainPlayList.value = [];
    channelPlaylistModel = null;
    isLoading.value = true;
    onGetPlayList(channelId);

    AppSheet.show(
      backgroundColor: isDarkMode.value ? AppColor.secondDarkMode : AppColor.white,
      SizedBox(
        height: SizeConfig.screenHeight / 2,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
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
            Text(AppStrings.addToPlayList.tr, style: titalstyle1),
            const SizedBox(height: 5),
            const Divider(
              indent: 25,
              endIndent: 25,
              color: AppColor.grey,
            ),
            const SizedBox(height: 8),
            Expanded(
              child: Obx(
                () => isLoading.value
                    ? const LoaderUi()
                    : mainPlayList.value.isEmpty
                        ? const DataNotFoundUi(type: EmptyStateType.playlist)
                        : SingleChildScrollView(
                            child: ListView.builder(
                              shrinkWrap: true,
                              physics: const NeverScrollableScrollPhysics(),
                              itemCount: mainPlayList.value.length,
                              padding: const EdgeInsets.symmetric(horizontal: 20),
                              itemBuilder: (context, index) => Padding(
                                padding: const EdgeInsets.only(bottom: 10),
                                child: GestureDetector(
                                  onTap: () async {
                                    CustomToast.show(AppStrings.pleaseWait.tr);
                                    Get.back();
                                    // await AddIntoPlayListApi.callApi(Database.loginUserId!, channelId, mainPlayList.value[index].id!, videoId,
                                    //     mainPlayList.value[index].playListName.toString(), mainPlayList.value[index].playListType.toString());

                                    await AddIntoPlayListApi.callApi(
                                      Database.loginUserId!,
                                      channelId,
                                      mainPlayList.value[index].id!,
                                      videoId,
                                      mainPlayList.value[index].playListName ?? "",
                                      mainPlayList.value[index].playListType ?? 0,
                                    );
                                  },
                                  child: Row(
                                    children: [
                                      Container(
                                        clipBehavior: Clip.hardEdge,
                                        height: 50,
                                        width: 50,
                                        decoration: BoxDecoration(
                                            borderRadius: BorderRadius.circular(10),
                                            color: isDarkMode.value ? AppColor.secondDarkMode : AppColor.grey_400),
                                        child: PreviewVideoImage(
                                          videoId: mainPlayList.value[index].id!,
                                          videoImage: mainPlayList.value[index].videoImage!,
                                        ),
                                        // child: ConvertedPathView(
                                        //     imageVideoPath: controller.channelPlayList![index].videos![0].videoImage!),
                                      ),
                                      const SizedBox(width: 10),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                                "${mainPlayList.value[index].playListName ?? ""} (${mainPlayList.value[index].totalVideo?.toString() ?? "0"})",
                                                style: GoogleFonts.urbanist(fontSize: 16, fontWeight: FontWeight.w600)),
                                            Text(mainPlayList.value[index].channelName ?? "",
                                                style: GoogleFonts.urbanist(fontSize: 14, color: AppColor.grey_400)),
                                          ],
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                          ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
