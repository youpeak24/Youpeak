import 'package:flutter/cupertino.dart';
import 'package:get/get.dart';
import 'package:youpeak/core/utils/custom_toast.dart';
import 'package:youpeak/shared/widgets/loader_ui.dart';
import 'package:youpeak/core/storage/database/database.dart';
import 'package:youpeak/core/file_upload/convert_video_image_api.dart';
import 'package:youpeak/features/live/api/create_live_user_api.dart';
import 'package:youpeak/features/live/view/live_view.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'package:youpeak/core/constants/app_string.dart';

class AddThumbnailController extends GetxController {
  TextEditingController titleController = TextEditingController();

  @override
  void onInit() {
    AppSettings.pickImagePath.value = "";
    super.onInit();
  }

  void onGoLive() async {
    if (AppSettings.pickImagePath.value == "") {
      CustomToast.show(AppStrings.pleaseAddThumbnail.tr);
    } else if (titleController.text.trim().isEmpty) {
      CustomToast.show(AppStrings.pleaseEnterTitle.tr);
    } else {
      Get.dialog(const LoaderUi(color: AppColor.white), barrierDismissible: false);

      final thumbnail = await ConvertVideoImageApi.callApi(AppSettings.pickImagePath.value, true);

      if (thumbnail != null) {
        final liveHistoryId = await CreateLiveUserApi.callApi(
          loginUserId: Database.loginUserId ?? "",
          liveType: 1,
          thumbnail: thumbnail,
          title: titleController.text.trim(),
        );

        Get.close(2);

        if (liveHistoryId != null) {
          AppSettings.showLog("liveHistoryId => $liveHistoryId");

          Get.to(
            () => LivePage(
              isHost: true,
              localUserID: Database.loginUserId!,
              localUserName: "Seller",
              roomID: liveHistoryId,
            ),
          );
        }
      }
    }
  }
}
