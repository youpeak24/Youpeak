import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:intl/intl.dart';
import 'package:youpeak/core/utils/custom_range_picker.dart';
import 'package:youpeak/core/storage/database/database.dart';
import 'package:youpeak/features/wallet/api/get_withdraw_history_api.dart';
import 'package:youpeak/features/wallet/model/get_withdraw_history_model.dart';

class WithdrawHistoryController extends GetxController {
  bool isLoadingHistory = false;
  GetWithdrawHistoryModel? getWithdrawHistoryModel;
  List<WithDrawRequests> withdrawHistory = [];
  ScrollController scrollController = ScrollController();
  RxBool isPaginationLoading = false.obs;

  String startDate = "All";
  String endDate = "All";
  String selectDateRange = "All";

  @override
  void onInit() {
    init();
    super.onInit();
  }

  void init() {
    withdrawHistory.clear();
    isLoadingHistory = true;
    update(["onGetWithdrawHistory"]);
    GetWithdrawHistoryApi.startPagination = 0;
    onGetWithdrawHistory();
    scrollController.addListener(onWalletHistoryListScrolling);
  }

  // Future<void> onGetWithdrawHistory() async {
  //   getWithdrawHistoryModel = await GetWithdrawHistoryApi.callApi(loginUserId: Database.loginUserId ?? "", startDate: startDate, endDate: endDate);
  //
  //   if (getWithdrawHistoryModel?.withDrawRequests != null) {
  //     final data = getWithdrawHistoryModel?.withDrawRequests ?? [];
  //     withdrawHistory.clear();
  //     withdrawHistory.addAll(data);
  //     isLoadingHistory = false;
  //     update(["onGetWithdrawHistory"]);
  //   }
  // }

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
      init();
      update(["onChangeDateRange"]);
    }
  }

  Future<void> onGetWithdrawHistory() async {
    isLoadingHistory = true;
    update(["onGetWithdrawHistory"]);
    getWithdrawHistoryModel = await GetWithdrawHistoryApi.callApi(loginUserId: Database.loginUserId ?? "", startDate: startDate, endDate: endDate);

    final data = getWithdrawHistoryModel?.withDrawRequests;
    if (data != null && data.isNotEmpty) {
      withdrawHistory.addAll(data);
    } else {
      if (GetWithdrawHistoryApi.startPagination > 0) {
        GetWithdrawHistoryApi.startPagination--;
      }
    }
    isLoadingHistory = false;
    update(["onGetWithdrawHistory"]);
  }

  void onWalletHistoryListScrolling() async {
    if (scrollController.position.pixels == scrollController.position.maxScrollExtent) {
      isPaginationLoading.value = true;
      await onGetWithdrawHistory();
      isPaginationLoading.value = false;
    }
  }
}
