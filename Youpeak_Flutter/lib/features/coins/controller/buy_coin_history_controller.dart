import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:intl/intl.dart';
import 'package:youpeak/core/utils/custom_range_picker.dart';
import 'package:youpeak/core/storage/database/database.dart';
import 'package:youpeak/features/coins/api/fetch_buy_coin_history_api.dart';
import 'package:youpeak/features/coins/model/fetch_buy_coin_history_model.dart';
import 'package:youpeak/core/utils/utils.dart';

class BuyCoinHistoryController extends GetxController {
  bool isLoading = false;
  FetchBuyCoinHistoryModel? buyCoinHistoryModel;
  ScrollController scrollController = ScrollController();
  RxBool isPaginationLoading = false.obs;

  List<Data> coinHistory = [];

  String startDate = "All";
  String endDate = "All";
  String selectDateRange = "All";

  int selectedPlanIndex = 0;

  @override
  void onInit() {
    Utils.showLog("Buy Coin History Controller Initialize Success");
    FetchBuyCoinHistoryApi.startPagination = 0;
    scrollController.addListener(onChannelPlayListScrolling);
    onGetCoinHistory();
    super.onInit();
  }

  @override
  void onClose() {
    Utils.showLog("Buy Coin History Controller Dispose Success");
    scrollController.dispose();
    super.onClose();
  }

  void onChangeDateRange(BuildContext context) async {
    DateTimeRange? initialRange;
    if (startDate != "All" && endDate != "All") {
      try {
        initialRange = DateTimeRange(
          start: DateFormat('yyyy-MM-dd').parse(startDate),
          end: DateFormat('yyyy-MM-dd').parse(endDate),
        );
      } catch (e) {
        debugPrint("Error parsing dates: $e");
      }
    }

    DateTimeRange? dateTimeRange = await CustomRangePicker.onPick(context, initialRange: initialRange);
    if (dateTimeRange != null) {
      startDate = DateFormat('yyyy-MM-dd').format(dateTimeRange.start);
      endDate = DateFormat('yyyy-MM-dd').format(dateTimeRange.end);
      selectDateRange = "${DateFormat('dd/MM/yy').format(dateTimeRange.start)} - ${DateFormat('dd/MM/yy').format(dateTimeRange.end)}";
      FetchBuyCoinHistoryApi.startPagination = 0;
      onGetCoinHistory();
      update(["onChangeDateRange"]);
    }
  }

  void onChannelPlayListScrolling() async {
    if (scrollController.position.pixels == scrollController.position.maxScrollExtent) {
      isPaginationLoading.value = true;
      await onGetCoinHistory();
      isPaginationLoading.value = false;
    }
  }

  Future<void> onGetCoinHistory() async {
    if (FetchBuyCoinHistoryApi.startPagination <= 0) {
      isLoading = true;
      coinHistory.clear();
      update(["onGetCoinHistory"]);
    }
    
    buyCoinHistoryModel = await FetchBuyCoinHistoryApi.callApi(loginUserId: Database.loginUserId ?? "", startDate: startDate, endDate: endDate);

    final data = buyCoinHistoryModel?.data;
    if (data != null && data.isNotEmpty) {
      coinHistory.addAll(data);
    } else {
      FetchBuyCoinHistoryApi.startPagination--;
    }
    isLoading = false;
    update(["onGetCoinHistory"]);
  }
}
