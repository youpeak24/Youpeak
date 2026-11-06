import 'package:flutter/cupertino.dart';
import 'package:get/get.dart';
import 'package:youpeak/core/utils/custom_toast.dart';
import 'package:youpeak/core/storage/database/database.dart';
import 'package:youpeak/features/edit_video/api/edit_video_api.dart';
import 'package:youpeak/features/video/api/video_details_api.dart';
import 'package:youpeak/features/video/model/video_details_model.dart';
import 'package:youpeak/core/constants/app_string.dart';

class EditVideoController extends GetxController {
  TextEditingController titleController = TextEditingController();
  TextEditingController descriptionController = TextEditingController();

  VideoDetailsModel? videoDetailsModel;
  bool isLoadingVideoDetails = false;
  bool isLoading = false;

  void init({required String videoId, required int videoType}) async {
    await onGetVideoDetails(videoId: videoId, videoType: videoType);
    titleController = TextEditingController(text: videoDetailsModel?.detailsOfVideo?.title ?? "");
    descriptionController = TextEditingController(text: videoDetailsModel?.detailsOfVideo?.description ?? "");
  }

  Future<void> onGetVideoDetails({required String videoId, required int videoType}) async {
    isLoadingVideoDetails = true;
    update(["onLoading"]);
    videoDetailsModel = await VideoDetailsApi.callApi(Database.loginUserId ?? "", videoId, videoType);
    isLoadingVideoDetails = false;
    update(["onLoading"]);
  }

  void onEditVideo() async {
    if (titleController.text.trim().isEmpty) {
      CustomToast.show(AppStrings.pleaseEnterVideoTitle.tr);
    } else {
      isLoading = true;
      update(["onLoading"]);
      final status = await EditVideoApi.callApi(
        loginUserId: Database.loginUserId ?? "",
        videoId: videoDetailsModel?.detailsOfVideo?.id ?? "",
        channelId: videoDetailsModel?.detailsOfVideo?.channelId ?? "",
        videoType: videoDetailsModel?.detailsOfVideo?.videoType?.toInt() ?? 0,
        title: titleController.text.trim(),
        description: descriptionController.text.trim(),
      );
      isLoading = false;
      update(["onLoading"]);

      if (status == true) {
        Get.close(2);
        CustomToast.show(AppStrings.editVideoSuccess.tr);
      } else {
        CustomToast.show(AppStrings.someThingWentWrong.tr);
      }
    }
  }
}
