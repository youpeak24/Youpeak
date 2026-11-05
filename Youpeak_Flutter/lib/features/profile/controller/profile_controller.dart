import 'package:flutter/cupertino.dart';
import 'package:get/get.dart';
import 'package:youpeak/core/storage/database/database.dart';
import 'package:youpeak/features/profile/api/get_profile_api.dart';
import 'package:youpeak/features/rewards/api/get_daily_reward_api.dart';
import 'package:youpeak/features/rewards/model/get_daily_reward_model.dart';
import 'package:youpeak/features/monetization/api/monetization_request_api.dart';
import 'package:youpeak/features/monetization/model/monetization_request_model.dart';
import 'package:youpeak/features/wallet/api/get_wallet_history_api.dart';
import 'package:youpeak/features/wallet/model/get_wallet_history_model.dart';
import 'package:youpeak/features/premium/model/get_premium_plan_purchase_history_model.dart';
import 'package:youpeak/features/premium/api/get_premium_purchase_history_api.dart';

class ProfileController extends GetxController {
  // List<PlanHistory>? premiumPurchaseHistory;
  List<CoinplanHistory>? coinPurchaseHistory;
  bool isLoading = false;
  GetDailyRewardModel? getDailyRewardModel;
  GetWalletHistoryModel? getWalletHistoryModel;
  MonetizationRequestModel? monetizationRequestModel;
  List<PlanHistory> premiumPurchaseHistory = [];

  RxInt rewardCoins = 0.obs;
  bool isPaginationLoading = false;
  ScrollController scrollController = ScrollController();

  RxInt myBalance = 0.obs;

  @override
  void onInit() {
    onGetRewardCoin();
    // monetizationApi();
    onGetPurchaseHistory(isFirstLoad: true);

    scrollController.addListener(() {
      if (scrollController.position.pixels >= scrollController.position.maxScrollExtent - 200 && !isPaginationLoading && !GetPremiumPlanHistoryApi.isLastPage) {
        onGetPurchaseHistory();
      }
    });
    super.onInit();
  }

  // Future<void> monetizationApi() async {
  //   monetizationRequestModel = await MonetizationRequestApi.callApi(Database.loginUserId!);
  // }

  Future<void> onGetPurchaseHistory({bool isFirstLoad = false}) async {
    if (isFirstLoad) {
      GetPremiumPlanHistoryApi.startPagination = 1;
      GetPremiumPlanHistoryApi.isLastPage = false;
      if (premiumPurchaseHistory.isEmpty) {
        isLoading = true;
      }
    } else {
      isPaginationLoading = true;
    }

    update(["onGetPurchaseHistory"]);

    final response = await GetPremiumPlanHistoryApi.callApi(Database.loginUserId!);

    if (response != null) {
      if (isFirstLoad) {
        premiumPurchaseHistory.clear();
      }
      premiumPurchaseHistory.addAll(response.planHistory ?? []);
      GetPremiumPlanHistoryApi.startPagination++;
    }

    isLoading = false;
    isPaginationLoading = false;

    update(["onGetPurchaseHistory"]);
  }

  Future<void> getProfile() async {
    if (Database.loginUserId != null) await GetProfileApi.callApi(Database.loginUserId!);
  }

  void onGetRewardCoin() async {
    getDailyRewardModel = await GetDailyRewardApi.callApi(loginUserId: Database.loginUserId ?? "");
    getWalletHistoryModel = await GetWalletHistoryApi.callApi(loginUserId: Database.loginUserId ?? "", startDate: "All", endDate: "All");
    rewardCoins.value = getDailyRewardModel?.totalCoins ?? 0;
    myBalance.value = (getWalletHistoryModel?.total ?? 0).toInt();
  }
}
