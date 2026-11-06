import 'package:flutter/cupertino.dart';
import 'package:get/get.dart';
import 'package:youpeak/core/utils/custom_toast.dart';
import 'package:youpeak/shared/widgets/loader_ui.dart';
import 'package:youpeak/core/storage/database/database.dart';
import 'package:youpeak/features/profile/api/get_profile_api.dart';
import 'package:youpeak/features/profile/model/get_profile_model.dart';
import 'package:youpeak/features/channel/api/edit_subscription_plan_api.dart';
import 'package:youpeak/core/utils/utils.dart';

class SubscriptionPlanController extends GetxController {
  TextEditingController videoController = TextEditingController();
  TextEditingController subscribeController = TextEditingController();

  GetProfileModel? getProfileModel;
  String oldSubscriptionCost = "";
  String oldVideoUnlockCost = "";

  @override
  void onInit() {
    oldSubscriptionCost = (GetProfileApi.profileModel?.user?.subscriptionCost ?? 0).toString();

    oldVideoUnlockCost = (GetProfileApi.profileModel?.user?.videoUnlockCost ?? 0).toString();

    subscribeController = TextEditingController(text: (GetProfileApi.profileModel?.user?.subscriptionCost ?? 0).toString());
    videoController = TextEditingController(text: (GetProfileApi.profileModel?.user?.videoUnlockCost ?? 0).toString());
    super.onInit();
  }

  @override
  void onClose() {
    subscribeController.clear();
    videoController.clear();
    super.onClose();
  }

  void onClickSubmit() async {
    String newSubscription = subscribeController.text.trim();
    String newVideoCost = videoController.text.trim();

    if (newSubscription.isEmpty || int.parse(newSubscription) < 1) {
      CustomToast.show("Please enter subscription plan coin");
    } else if (newVideoCost.isEmpty || int.parse(newVideoCost) < 1) {
      CustomToast.show("Please enter unlock video coin");
    } else if (newSubscription == oldSubscriptionCost && newVideoCost == oldVideoUnlockCost) {
      CustomToast.show("No changes detected");
      Get.back();
    } else {
      Get.dialog(const LoaderUi(), barrierDismissible: false);

      getProfileModel = await EditSubscriptionPlanApi.callApi(
        loginUserId: Database.loginUserId ?? "",
        subscriptionCost: newSubscription,
        videoUnlockCost: newVideoCost,
      );

      Get.back();

      if (getProfileModel?.status == true) {
        oldSubscriptionCost = newSubscription;
        oldVideoUnlockCost = newVideoCost;

        Get.back();
        CustomToast.show(getProfileModel?.message ?? "");
        Utils.showLog("Profile Model Change Success");
        GetProfileApi.profileModel = getProfileModel;
      }
    }
  }
}
