import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:intl/intl.dart';
import 'package:youpeak/core/utils/custom_range_picker.dart';
import 'package:youpeak/core/storage/database/database.dart';
import 'package:youpeak/features/wallet/api/get_wallet_history_api.dart';
import 'package:youpeak/features/wallet/model/get_wallet_history_model.dart';

class MyWalletController extends GetxController {
  num myBalance = 0;

  bool isLoadingHistory = false;
  GetWalletHistoryModel? getWalletHistoryModel;
  List<Data> walletHistory = [];
  bool isLoadingMore = false;
  bool hasMoreData = true;
  String startDate = "All";
  String endDate = "All";
  String selectDateRange = "All";
  int start = 1; // pagination start index
  final int limit = 10; // number of items per page

  @override
  void onInit() {
    init();
    super.onInit();
  }

  void init() {
    walletHistory.clear();
    start = 1;
    hasMoreData = true;
    isLoadingHistory = true;
    update(["onGetWalletHistory"]);
    fetchWalletHistory();
  }

  Future<void> fetchWalletHistory() async {
    if (!hasMoreData) return;

    if (start > 0) {
      isLoadingMore = true;
      update(["onGetWalletHistory"]);
    }

    final response = await GetWalletHistoryApi.callApi(
      loginUserId: Database.loginUserId ?? "",
      startDate: startDate,
      endDate: endDate,
      start: start,
      limit: limit,
    );
    print("response.total::::::::::::::${response!.total}");

    myBalance = response!.total ?? 0;

    if (response?.data != null && response!.data!.isNotEmpty) {
      print("response.total${response.total}");
      myBalance = (response.total ?? 0);
      walletHistory.addAll(response.data ?? []);
      start += limit; // increment start for next page
      hasMoreData = response.data?.length == limit; // if less than limit, no more data
    } else {
      hasMoreData = false;
    }

    isLoadingHistory = false;
    isLoadingMore = false;
    update(["onGetWalletHistory"]);
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
      init();
      update(["onChangeDateRange"]);
    }
  }
}
