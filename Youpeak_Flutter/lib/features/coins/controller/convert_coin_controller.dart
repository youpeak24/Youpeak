import 'package:flutter/cupertino.dart';
import 'package:get/get.dart';
import 'package:youpeak/core/utils/custom_toast.dart';
import 'package:youpeak/shared/widgets/loader_ui.dart';
import 'package:youpeak/core/storage/database/database.dart';
import 'package:youpeak/features/coins/api/convert_coin_api.dart';
import 'package:youpeak/features/coins/model/convert_coin_model.dart';
import 'package:youpeak/features/coins/api/get_my_coin_api.dart';
import 'package:youpeak/features/coins/model/get_my_coin_model.dart';
import 'package:youpeak/features/coins/widget/withdrawal_done_dialog.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'dart:math';
import 'package:intl/intl.dart';
import 'package:youpeak/features/notifications/model/notification_model.dart' as model;
import 'package:youpeak/core/notification/local_notification_storage.dart';

class ConvertCoinController extends GetxController {
  TextEditingController coinController = TextEditingController();

  int convertedAmount = 0;
  bool isLoadingCoin = false;
  GetMyCoinModel? getMyCoinModel;
  ConvertCoinModel? convertCoinModel;

  RxBool isEnableWithdrawButton = false.obs;

  @override
  void onInit() {
    init();
    super.onInit();
  }

  Future<void> init() async {
    isLoadingCoin = true;
    update(["onGetMyCoin"]);
    coinController.clear();
    await onGetMyCoin();
  }

  Future<void> onGetMyCoin() async {
    getMyCoinModel = await GetMyCoinApi.callApi(loginUserId: Database.loginUserId ?? "");

    if (getMyCoinModel?.data?.coin != null) {
      isLoadingCoin = false;
      update(["onGetMyCoin"]);
    }
  }

  void onClickAll() {
    coinController = TextEditingController(text: (getMyCoinModel?.data?.coin ?? 0).toString());
    update(["onClickAll"]);
    onConvertCoinToAmount();
  }

  void onConvertCoinToAmount() {
    if (coinController.text.trim().isNotEmpty) {
      final int coin = int.parse(coinController.text.trim());

      AppSettings.showLog("Enter Coin => $coin");

      convertedAmount = coin ~/ (getMyCoinModel?.data?.minCoinForCashOut ?? 1);

      AppSettings.showLog("Converted Amount => $convertedAmount");
      update(["onConvertCoinToAmount"]);
    }

    if (coinController.text.trim().isEmpty ||
        (getMyCoinModel?.data?.coin ?? 0) < int.parse(coinController.text.trim()) ||
        (getMyCoinModel?.data?.minConvertCoin ?? 0) > int.parse(coinController.text.trim())) {
      isEnableWithdrawButton.value = false;
    } else {
      isEnableWithdrawButton.value = true;
    }
  }

  void onClickWithdraw(BuildContext context) async {
    FocusManager.instance.primaryFocus?.unfocus();

    if (isEnableWithdrawButton.value) {
      if (coinController.text.trim().isEmpty) {
        CustomToast.show("Please enter coin for withdrawal");
      } else if ((getMyCoinModel?.data?.coin ?? 0) < int.parse(coinController.text.trim())) {
        CustomToast.show("Balance Not Available");
      } else {
        Get.dialog(const LoaderUi(), barrierDismissible: false);
        convertCoinModel = await ConvertCoinApi.callApi(loginUserId: Database.loginUserId ?? "", coin: int.parse(coinController.text.trim()));
        Get.back();
        if (convertCoinModel != null && (convertCoinModel?.status ?? false)) {
          final coinNotification = model.Notification(
            id: Random.secure().nextInt(10000).toString(),
            title: "Withdrawal Requested",
            message: "Successfully converted ${coinController.text.trim()} coins to cash.",
            time: DateFormat('dd-MM-yyyy, hh:mm a').format(DateTime.now()),
          );
          LocalNotificationStorage.saveNotification(coinNotification);
          WithdrawalDoneDialog.show(context);
        } else {
          CustomToast.show(convertCoinModel?.message ?? "Failed to convert coins");
        }
      }
    }
  }
}
