import 'package:get/get.dart';
import 'package:youpeak/core/utils/custom_toast.dart';
import 'package:youpeak/core/storage/database/database.dart';
import 'package:youpeak/features/coins/api/fetch_coin_plan_api.dart';
import 'package:youpeak/features/coins/api/purchase_coin_plan_api.dart';
import 'package:youpeak/features/coins/model/fetch_coin_plan_model.dart';
import 'package:youpeak/features/coins/model/purchase_coin_plan_model.dart';
import 'package:youpeak/features/coins/widget/coin_payment_view.dart';
import 'package:youpeak/core/constants/app_string.dart';
import 'package:youpeak/core/utils/utils.dart';

class BuyCoinController extends GetxController {
  bool isLoading = false;
  FetchCoinPlanModel? fetchCoinPlanModel;

  List<Data> coinPlans = [];

  int selectedPlanIndex = 0;

  @override
  void onInit() {
    Utils.showLog("Buy Coin Controller Initialize Success");
    onGetCoinPlan();
    super.onInit();
  }

  @override
  void onClose() {
    Utils.showLog("Buy Coin Controller Dispose Success");
    super.onClose();
  }

  Future<void> onGetCoinPlan() async {
    isLoading = true;
    update(["onGetCoinPlan"]);

    fetchCoinPlanModel = await FetchCoinPlanApi.callApi();
    coinPlans.clear();
    coinPlans.addAll(fetchCoinPlanModel?.data ?? []);

    isLoading = false;
    update(["onGetCoinPlan"]);
  }

  void onChangePlan(int value) {
    selectedPlanIndex = value;
    update(["onChangePlan"]);
  }

  void onClickPayment() async {
    Utils.showLog("Click To Payment");
    Utils.showLog("User Id => ${Database.loginUserId} ** ${coinPlans[selectedPlanIndex].id}");
    // onPurchaseCoinPlan();
    Get.to(CoinPaymentView(
        amount: (coinPlans[selectedPlanIndex].amount ?? 0).toDouble(),
        premiumPlanId: coinPlans[selectedPlanIndex].id ?? "",
        productKey: coinPlans[selectedPlanIndex].productKey ?? ""));
  }
}
