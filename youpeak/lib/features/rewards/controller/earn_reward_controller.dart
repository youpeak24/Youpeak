import 'package:youpeak/core/providers/app_provider_container.dart';
import 'package:youpeak/core/security/security_service.dart';
import 'dart:async';

import 'package:flutter/cupertino.dart';
import 'package:get/get.dart';
import 'package:youpeak/core/ads/google_reward_ad.dart';
import 'package:youpeak/core/utils/custom_get_current_week_date.dart';
import 'package:youpeak/core/utils/custom_toast.dart';
import 'package:youpeak/shared/widgets/loader_ui.dart';
import 'package:youpeak/core/storage/database/database.dart';
import 'package:youpeak/features/rewards/widget/check_in_done_dialog.dart';
import 'package:youpeak/features/rewards/api/earn_coin_from_check_in_api.dart';
import 'package:youpeak/features/rewards/model/earn_coin_from_check_in_model.dart';
import 'package:youpeak/features/rewards/api/earn_coin_from_watch_ad_api.dart';
import 'package:youpeak/features/rewards/model/earn_coin_from_watch_ad_model.dart';
import 'package:youpeak/features/rewards/api/get_ad_reward_api.dart';
import 'package:youpeak/features/rewards/model/get_ad_reward_model.dart';
import 'package:youpeak/features/rewards/api/get_daily_reward_api.dart';
import 'package:youpeak/features/rewards/model/get_daily_reward_model.dart';
import 'package:youpeak/core/settings/app_settings.dart';

class EarnRewardController extends GetxController {
  // >>>> Ad Reward <<<<<

  RxInt myRewardCoin = 0.obs;

  RxBool isShowOriginalCoin = false.obs;

  EarnCoinFromWatchAdModel? earnCoinFromWatchAdModel;
  GetAdRewardModel? getAdRewardModel;
  bool isLoadingAdRewards = false;
  List<Data> adRewards = [];
  bool isPaginationLoading = false;
  ScrollController scrollController = ScrollController();
  Timer? timer;
  int completeAdTask = 0;
  bool isEnableCurrentAdTask = false;
  int nextAdTaskTime = 0;

  Future<void> init() async {
    onGetDailyRewards();
    await onGetAdRewards(isFirstLoad: true);

    scrollController.addListener(() {
      if (scrollController.position.pixels >= scrollController.position.maxScrollExtent - 200 && !isPaginationLoading && !GetAdRewardApi.isLastPage) {
        onGetAdRewards();
      }
    });

    if (completeAdTask == 0) {
      isEnableCurrentAdTask = true;
    } else if (Database.nextAdTaskTime == null || Database.nextAdTaskTime == 0) {
      isEnableCurrentAdTask = true;
    } else {
      onStartTimer();
    }
  }

  void onStopTimer() {
    timer?.cancel();
    nextAdTaskTime = 0;
    isEnableCurrentAdTask = true;
    Database.onSetNextAdTaskTime(nextAdTaskTime);
    update(["onChangeAdReward"]);
  }

  void onOpenApp() async {
    if (Database.lastRewardDate != null && Database.nextAdTaskTime != null && Database.nextAdTaskTime != 0) {
      DateTime now = DateTime.now();
      DateTime lastDateTime = DateTime.parse(Database.lastRewardDate ?? "");
      Duration difference = now.difference(lastDateTime);
      int seconds = difference.inSeconds;

      print("********* Dif => $seconds ");

      int lastTime = Database.nextAdTaskTime ?? 0;

      if (lastTime > seconds) {
        int currentTime = lastTime - seconds;
        Database.onSetNextAdTaskTime(currentTime);
      } else {
        Database.onSetNextAdTaskTime(0);
      }

      await 100.milliseconds.delay();

      update(["onChangeAdReward"]);
      onStartTimer();
    } else {
      onStartTimer();
    }
  }

  void onCloseApp() async {
    DateTime now = DateTime.now();
    Database.onSetLastRewardDate(now.toString());

    timer?.cancel();
    timer = null;
    Database.onSetNextAdTaskTime(nextAdTaskTime);
  }

  String convertAdTime(int seconds) {
    int hours = seconds ~/ 3600;
    int minutes = (seconds % 3600) ~/ 60;
    int remainingSeconds = seconds % 60;

    return '${hours.toString().padLeft(2, '0')}:${minutes.toString().padLeft(2, '0')}:${remainingSeconds.toString().padLeft(2, '0')}';
  }

  //   int minutes = seconds ~/ 60;
  //   int remainingSeconds = seconds % 60;
  //
  //   String formattedMinutes = minutes.toString().padLeft(2, '0');
  //   String formattedSeconds = remainingSeconds.toString().padLeft(2, '0');
  //
  //   return '$formattedMinutes:$formattedSeconds';
  // }

  Future<void> onGetAdRewards({bool isFirstLoad = false}) async {
    if (isFirstLoad) {
      GetAdRewardApi.startPagination = 1;
      GetAdRewardApi.isLastPage = false;
      adRewards.clear();
      isLoadingAdRewards = true;
    } else {
      isPaginationLoading = true;
    }

    update(["onGetAdRewards"]);

    final response = await GetAdRewardApi.callApi(userId: Database.loginUserId ?? "");

    if (response != null) {
      completeAdTask = response.userWatchAds?.count ?? completeAdTask;

      adRewards.addAll(response.data ?? []);

      GetAdRewardApi.startPagination++;
    }

    isLoadingAdRewards = false;
    isPaginationLoading = false;

    update(["onGetAdRewards"]);
  }

  void onClickPlay(int index) async {
    AppSettings.showLog("Click To Index => $index");

    if (index == completeAdTask && isEnableCurrentAdTask) {
      // Anti-fraud gate (VPN / emulator / root / second account / bot-like
      // tapping): the server refuses these rewards anyway, so don't burn an ad.
      final security = appProviderContainer.read(securityServiceProvider.notifier);
      if (!security.allowTaskAction()) {
        final message = appProviderContainer.read(securityServiceProvider).message;
        CustomToast.show(message.isNotEmpty ? message : "Please wait a moment before the next task.");
        return;
      }
      AppSettings.showLog("Show Ad Success");

      GoogleRewardAd.showAd(fun: () {
        onCreateAdReward(adRewards[index].coinEarnedFromAd ?? 0, adRewards[index].id ?? "");
        onShowAd(index);
      });
    }
  }

  void onShowAd(int index) {
    final newIndex = index + 1;

    if (newIndex < adRewards.length) {
      AppSettings.showLog("Next Task Available");

      isEnableCurrentAdTask = false;
      nextAdTaskTime = adRewards[newIndex].adDisplayInterval ?? 0;
      completeAdTask = newIndex;
      Database.onSetNextAdTaskTime(nextAdTaskTime);

      AppSettings.showLog("Ad Reward Save Database => $completeAdTask ${Database.nextAdTaskTime}");
      update(["onChangeAdReward"]);

      onStartTimer();
    } else {
      completeAdTask = adRewards.length;
      isEnableCurrentAdTask = false;
      Database.onSetNextAdTaskTime(0);
      update(["onChangeAdReward"]);
      AppSettings.showLog("Next Not Task Available");
    }
  }

  void onStartTimer() {
    AppSettings.showLog("On Start Time");
    isEnableCurrentAdTask = false;
    nextAdTaskTime = Database.nextAdTaskTime ?? 0;

    if (nextAdTaskTime != 0) {
      timer?.cancel();
      timer = null;
      timer = Timer.periodic(
        const Duration(seconds: 1),
        (time) {
          if (nextAdTaskTime != 0) {
            nextAdTaskTime--;
            Database.onSetNextAdTaskTime(nextAdTaskTime);
            update(["onChangeAdReward"]);
          } else {
            onStopTimer();
          }
        },
      );
    } else {
      isEnableCurrentAdTask = true;
    }
  }

  void onCreateAdReward(int coinEarnedFromAd, String adId) async {
    earnCoinFromWatchAdModel = await EarnCoinFromWatchAdApi.callApi(
      loginUserId: Database.loginUserId ?? "",
      coinEarnedFromAd: coinEarnedFromAd,
      adId: adId,
    );
    if (earnCoinFromWatchAdModel?.status == false) {
      CustomToast.show(earnCoinFromWatchAdModel?.message ?? "");
    } else if (earnCoinFromWatchAdModel?.data?.coin != null) {
      myRewardCoin.value = earnCoinFromWatchAdModel?.data?.coin ?? 0;
    }
  }

  // >>>>> >>>>> >>>>> Check In Reward <<<<< <<<<< <<<<<

  GetDailyRewardModel? getDailyRewardModel;
  EarnCoinFromCheckInModel? earnCoinFromCheckInModel;
  bool isLoadingDailyRewards = false;
  List<DailyRewardData> dailyRewards = [];
  bool isTodayCheckIn = false;
  int todayCoin = 0;

  Future<void> onGetDailyRewards() async {
    isLoadingDailyRewards = true;
    update(["onGetDailyRewards"]);
    getDailyRewardModel = await GetDailyRewardApi.callApi(loginUserId: Database.loginUserId ?? "");

    if (getDailyRewardModel?.data?.isNotEmpty ?? false) {
      dailyRewards.clear();
      dailyRewards.addAll(getDailyRewardModel?.data ?? []);
      isLoadingDailyRewards = false;
      update(["onGetDailyRewards"]);

      myRewardCoin.value = getDailyRewardModel?.totalCoins ?? 0;

      for (int index = 0; index < dailyRewards.length; index++) {
        if (DateTime.now().day == CustomGetCurrentWeekDate.onGet()[index].day) {
          todayCoin = dailyRewards[index].reward ?? 0;
          isTodayCheckIn = dailyRewards[index].isCheckIn ?? false;
          update(["onGetDailyRewards"]);
        }
      }
    }
  }

  void onCheckIn(BuildContext context) async {
    if (isTodayCheckIn) {
    } else {
      Get.dialog(const LoaderUi(), barrierDismissible: false);
      earnCoinFromCheckInModel = await EarnCoinFromCheckInApi.callApi(
        loginUserId: Database.loginUserId ?? "",
        dailyRewardCoin: todayCoin,
      );

      Get.back();

      if (earnCoinFromCheckInModel?.status == true) {
        CheckInDoneDialog.show(context, todayCoin.toString());
      }

      CustomToast.show(earnCoinFromCheckInModel?.message ?? "");
      if (earnCoinFromCheckInModel?.isCheckIn ?? false) {
        isTodayCheckIn = true;
        update(["onGetDailyRewards"]);
      }
    }
  }
}
