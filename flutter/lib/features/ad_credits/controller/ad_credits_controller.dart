import 'package:get/get.dart';
import 'package:youpeak/core/constants/app_string.dart';
import 'package:youpeak/core/payment/payment_api.dart';
import 'package:youpeak/core/payment/razorpay/razorpay_service.dart';
import 'package:youpeak/core/utils/custom_toast.dart';
import 'package:youpeak/features/ad_credits/api/ad_credits_api.dart';
import 'package:youpeak/features/ad_credits/model/ad_credits_models.dart';
import 'package:youpeak/features/profile/api/get_profile_api.dart';
import 'package:youpeak/shared/widgets/loader_ui.dart';

class AdCreditsController extends GetxController {
  bool isLoading = false;
  bool isPurchasing = false;
  bool isTermsAccepted = true;

  AdCreditWalletData wallet = AdCreditWalletData.empty();
  List<AdCreditPack> packs = [];
  int selectedPackIndex = 0;

  List<AdCreditLedgerItem> history = [];
  String historyFilter = "ALL"; // ALL | CREDIT | DEBIT | EXPIRY

  final RazorPayService _razorPayService = RazorPayService();

  @override
  void onInit() {
    super.onInit();
    loadAll();
  }

  @override
  void onClose() {
    _razorPayService.dispose();
    super.onClose();
  }

  Future<void> loadAll() async {
    isLoading = true;
    update();

    final results = await Future.wait([
      AdCreditsApi.fetchWallet(),
      AdCreditsApi.fetchPacks(),
      AdCreditsApi.fetchHistory(),
    ]);

    if (results[0] != null) {
      wallet = results[0] as AdCreditWalletData;
    }
    if (results[1] != null) {
      packs = results[1] as List<AdCreditPack>;
    }
    if (results[2] != null) {
      history = results[2] as List<AdCreditLedgerItem>;
    }

    isLoading = false;
    update();
  }

  void selectPack(int index) {
    if (index >= 0 && index < packs.length) {
      selectedPackIndex = index;
      update();
    }
  }

  void toggleTerms(bool? val) {
    isTermsAccepted = val ?? false;
    update();
  }

  void setFilter(String filter) {
    historyFilter = filter;
    update();
  }

  List<AdCreditLedgerItem> get filteredHistory {
    if (historyFilter == "CREDIT") {
      return history.where((h) => h.direction.toUpperCase() == "CREDIT").toList();
    }
    if (historyFilter == "DEBIT") {
      return history.where((h) => h.direction.toUpperCase() == "DEBIT" && h.source != "EXPIRY").toList();
    }
    if (historyFilter == "EXPIRY") {
      return history.where((h) => h.source == "EXPIRY").toList();
    }
    return history;
  }

  AdCreditPack? get selectedPack {
    if (packs.isEmpty || selectedPackIndex < 0 || selectedPackIndex >= packs.length) {
      return null;
    }
    return packs[selectedPackIndex];
  }

  Future<void> purchaseSelectedPack() async {
    if (selectedPack == null) {
      CustomToast.show("Please select an ad credit pack.");
      return;
    }

    if (!isTermsAccepted) {
      CustomToast.show("Please accept the terms before proceeding to checkout.");
      return;
    }

    if (isPurchasing) return;
    isPurchasing = true;
    update();

    Get.dialog(const LoaderUi(), barrierDismissible: false);

    try {
      final pack = selectedPack!;
      final order = await PaymentApi.createOrder(
        purpose: "ad_credits",
        packId: pack.id,
      );

      if (Get.isDialogOpen == true) Get.back();

      if (order["status"] != true || order["checkout"] == null) {
        isPurchasing = false;
        update();
        CustomToast.show(order["message"]?.toString() ?? "Could not create payment order.");
        return;
      }

      final checkout = Map<String, dynamic>.from(order["checkout"]);

      _razorPayService.openCheckout(
        checkout: checkout,
        appName: AppStrings.appName.tr,
        email: GetProfileApi.profileModel?.user?.email,
        contact: GetProfileApi.profileModel?.user?.mobileNumber,
        onSuccess: (response) async {
          Get.dialog(const LoaderUi(), barrierDismissible: false);
          final verify = await PaymentApi.verify(
            orderId: response.orderId ?? "",
            paymentId: response.paymentId ?? "",
            signature: response.signature ?? "",
          );

          if (Get.isDialogOpen == true) Get.back();
          isPurchasing = false;

          if (verify["status"] == true) {
            CustomToast.show("Payment successful! Ad Credits added to your wallet.");
            await loadAll();
          } else {
            CustomToast.show(verify["message"]?.toString() ?? "Verification failed.");
            update();
          }
        },
        onError: (errorMessage) {
          isPurchasing = false;
          update();
          CustomToast.show(errorMessage);
        },
      );
    } catch (e) {
      if (Get.isDialogOpen == true) Get.back();
      isPurchasing = false;
      update();
      CustomToast.show("An error occurred: $e");
    }
  }
}
