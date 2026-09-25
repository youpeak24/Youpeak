import 'dart:async';
import 'dart:convert';
import 'dart:developer';
import 'dart:io';

import 'package:dio/dio.dart';
import 'package:get/get_rx/src/rx_typedefs/rx_typedefs.dart';
import 'package:in_app_purchase/in_app_purchase.dart';

/// ignore: depend_on_referenced_packages
import 'package:in_app_purchase_android/in_app_purchase_android.dart';

/// ignore: depend_on_referenced_packages, implementation_imports
import 'package:in_app_purchase_android/src/billing_client_wrappers/billing_client_wrapper.dart';

/// ignore: depend_on_referenced_packages
import 'package:in_app_purchase_storekit/store_kit_wrappers.dart';
import 'package:youpeak/main.dart';
import 'package:youpeak/core/storage/prefrens.dart';

import 'package:youpeak/core/payment/in_app_purchase/iap_callback.dart';
import 'package:youpeak/core/payment/in_app_purchase/iap_receipt_data.dart';

class InAppPurchaseHelper {
  static final InAppPurchaseHelper _inAppPurchaseHelper = InAppPurchaseHelper._internal();

  InAppPurchaseHelper._internal();

  factory InAppPurchaseHelper() {
    return _inAppPurchaseHelper;
  }

  num discountAmount = 0;
  num discountPercentage = 0;
  String date = "";
  String time = "";
  double rupee = 0;
  int withoutTaxRupee = 0;
  String serviceId = "";
  String expertId = "";
  String userId = "";
  String paymentType = "";
  Callback onComplete = () {};
  List<String> productId = [];

  init({
    required double rupee,
    required String userId,
    required String paymentType,
    required List<String> productKey,
    required Callback callBack,
  }) {
    this.rupee = rupee;
    this.userId = userId;
    this.paymentType = paymentType;
    productId = productKey;
    onComplete = () => callBack.call();
  }

  // static final List<String> _kProductIds = <String>[Utils.getProductId()];

  final InAppPurchase _connection = InAppPurchase.instance;
  StreamSubscription<List<PurchaseDetails>>? _subscription;
  List<ProductDetails> _products = [];
  List<PurchaseDetails> _purchases = [];
  IAPCallback? _iapCallback;

  initialize() {
    if (Platform.isAndroid) {
      /// ignore: deprecated_member_use
      // InAppPurchaseAndroidPlatformAddition.enablePendingPurchases();
    } else {
      SKPaymentQueueWrapper().restoreTransactions();
    }
  }

  ProductDetails? getProductDetail(String productID) {
    for (ProductDetails item in _products) {
      if (item.id == productID) {
        return item;
      }
    }
    return null;
  }

  getAlreadyPurchaseItems(IAPCallback iapCallback) {
    _iapCallback = iapCallback;
    final Stream<List<PurchaseDetails>> purchaseUpdated = _connection.purchaseStream;
    _subscription = purchaseUpdated.listen(
        (purchaseDetailsList) {
          if (purchaseDetailsList != [] && purchaseDetailsList.isNotEmpty) {
            purchaseDetailsList.sort((a, b) => a.transactionDate!.compareTo(b.transactionDate!));

            if (purchaseDetailsList[0].status == PurchaseStatus.restored) {
              getPastPurchases(purchaseDetailsList);
            } else {
              _listenToPurchaseUpdated(purchaseDetailsList);
            }
          }
        },
        cancelOnError: true,
        onDone: () {
          _subscription?.cancel();
        },
        onError: (error) {
          log(error);
          handleError(error);
        });
    initStoreInfo();
  }

  Future<void> initStoreInfo() async {
    final bool isAvailable = await _connection.isAvailable();
    if (!isAvailable) {
      _products = [];
      _purchases = [];
      return;
    }

    ProductDetailsResponse productDetailResponse = await _connection.queryProductDetails(productId.toSet());
    if (productDetailResponse.error != null) {
      _products = productDetailResponse.productDetails;
      _purchases = [];
      return;
    }

    if (productDetailResponse.productDetails.isEmpty) {
      _products = productDetailResponse.productDetails;
      _purchases = [];
      return;
    } else {
      _products = productDetailResponse.productDetails;
      _purchases = [];
    }
    await _connection.restorePurchases();
  }

  Future<void> getPastPurchases(List<PurchaseDetails> verifiedPurchases) async {
    verifiedPurchases.sort((a, b) => a.transactionDate!.compareTo(b.transactionDate!));

    if (Platform.isIOS) {
      if (verifiedPurchases.isNotEmpty) {
        await _verifyProductReceipts(verifiedPurchases);
      } else {
        log("You have not Purchased :::::::::::::::::::=>");
        Preference.shared.setIsPurchase(false);
        _iapCallback?.onBillingError("You haven't purchase our product, so we can't restore.");
      }
    }

    if (verifiedPurchases.isNotEmpty) {
      if (verifiedPurchases != [] && verifiedPurchases.isNotEmpty) {
        _purchases = verifiedPurchases;
        log("You have already Purchased :::::::::::::::::::=>");
        Preference.shared.setIsPurchase(true);

        for (var element in _purchases) {
          MyApp.purchaseStreamController.add(element);
          _iapCallback?.onSuccessPurchase(element);
        }
      } else {
        log("You have not Purchased :::::::::::::::::::=>");
        _iapCallback?.onBillingError("You haven't purchase our product, so we can't restore.");
        Preference.shared.setIsPurchase(false);
        _iapCallback?.onBillingError("");
      }
    } else {
      log("You have not Purchased :::::::::::::::::::=>");
      _iapCallback?.onBillingError("You haven't purchase our product, so we can't restore.");
      Preference.shared.setIsPurchase(false);
      _iapCallback?.onBillingError("");
    }
  }

  _verifyProductReceipts(List<PurchaseDetails> verifiedPurchases) async {
    var dio = Dio(
      BaseOptions(
        connectTimeout: const Duration(microseconds: 5000),
        receiveTimeout: const Duration(microseconds: 5000),
      ),
    );

    Map<String, String> data = {};
    data.putIfAbsent("receipt-data", () => verifiedPurchases[0].verificationData.localVerificationData);

    try {
      String verifyReceiptUrl;

      if (2 == 2) {
        // if (Utils.sandboxVerifyReceiptUrl) {
        verifyReceiptUrl = 'https://sandbox.itunes.apple.com/verifyReceipt';
      } else {
        verifyReceiptUrl = 'https://buy.itunes.apple.com/verifyReceipt';
      }

      final graphResponse = await dio.post<String>(verifyReceiptUrl, data: data);
      Map<String, dynamic> profile = jsonDecode(graphResponse.data!);

      var receiptData = IapReceiptData.fromJson(profile);

      if (receiptData.latestReceiptInfo != null) {
        receiptData.latestReceiptInfo!.sort((a, b) => b.expiresDateMs!.compareTo(a.expiresDateMs!));
        if (int.parse(receiptData.latestReceiptInfo![0].expiresDateMs!) > DateTime.now().millisecondsSinceEpoch) {
          for (PurchaseDetails data in verifiedPurchases) {
            if (data.productID == receiptData.latestReceiptInfo![0].productId) {
              _purchases.clear();
              _purchases.add(data);
              if (_purchases != [] && _purchases.isNotEmpty) {
                Preference.shared.setBool(Preference.isPurchasePremium, true);
                for (var element in _purchases) {
                  MyApp.purchaseStreamController.add(element);
                  _iapCallback?.onSuccessPurchase(element);
                }
              } else {
                Preference.shared.setBool(Preference.isPurchasePremium, false);
                _iapCallback?.onBillingError("");
              }
              log("Already Purchased =>${receiptData.latestReceiptInfo![0].toJson()}");

              return;
            } else {
              Preference.shared.setBool(Preference.isPurchasePremium, false);
              _iapCallback?.onBillingError("");
            }

            if (data.pendingCompletePurchase) {
              await _connection.completePurchase(data);
            }
          }
        } else {
          Preference.shared.setIsPurchase(false);
          _iapCallback?.onBillingError("");
        }
      }
    } catch (ex) {
      try {
        Preference.shared.setIsPurchase(false);
        _iapCallback?.onBillingError("");
      } catch (e) {
        Preference.shared.setIsPurchase(false);
        _iapCallback?.onBillingError("");
        log(e.toString());
      }
    }
  }

  Map<String, PurchaseDetails> getPurchases() {
    Map<String, PurchaseDetails> purchases = Map.fromEntries(_purchases.map((PurchaseDetails purchase) {
      if (purchase.pendingCompletePurchase) {
        _connection.completePurchase(purchase);
      }
      return MapEntry<String, PurchaseDetails>(purchase.productID, purchase);
    }));
    return purchases;
  }

  finishTransaction() async {
    if (Platform.isIOS) {
      final transactions = await SKPaymentQueueWrapper().transactions();

      if (transactions != []) {
        for (final transaction in transactions) {
          try {
            if (transaction.transactionState != SKPaymentTransactionStateWrapper.purchasing) {
              await SKPaymentQueueWrapper().finishTransaction(transaction);
              await SKPaymentQueueWrapper().finishTransaction(transaction.originalTransaction!);
            }
          } catch (e) {
            log(e.toString());
            _iapCallback?.onBillingError(e);
          }
        }
      }
    }
  }

  buySubscription(ProductDetails productDetails, Map<String, PurchaseDetails> purchases) async {
    if (Platform.isIOS) {
      final transactions = await SKPaymentQueueWrapper().transactions();

      log(transactions.toString());

      for (final transaction in transactions) {
        try {
          if (transaction.transactionState != SKPaymentTransactionStateWrapper.purchasing) {
            await SKPaymentQueueWrapper().finishTransaction(transaction);
            await SKPaymentQueueWrapper().finishTransaction(transaction.originalTransaction!);
          }
        } catch (e) {
          _iapCallback?.onBillingError(e);
          log(e.toString());
        }
      }

      final transaction = await SKPaymentQueueWrapper().transactions();

      log(transaction.toString());

      for (final transaction in transaction) {
        try {
          if (transaction.transactionState != SKPaymentTransactionStateWrapper.purchasing) {
            await SKPaymentQueueWrapper().finishTransaction(transaction);
            await SKPaymentQueueWrapper().finishTransaction(transaction.originalTransaction!);
          }
        } catch (e) {
          _iapCallback?.onBillingError(e);
          log(e.toString());
        }
      }
    } else {
      if (Platform.isIOS) {
        _iapCallback?.onBillingError("");
      }
    }
    PurchaseParam purchaseParam;

    if (Platform.isAndroid) {
      final oldSubscription = _getOldSubscription(productDetails, purchases);

      purchaseParam = GooglePlayPurchaseParam(
          productDetails: productDetails,
          applicationUserName: null,
          changeSubscriptionParam: (oldSubscription != null)
              ? ChangeSubscriptionParam(
                  oldPurchaseDetails: oldSubscription,
                  // prorationMode: ProrationMode.immediateWithTimeProration,
                )
              : null);
    } else {
      purchaseParam = PurchaseParam(
        productDetails: productDetails,
        applicationUserName: null,
      );
    }

    _connection.buyNonConsumable(purchaseParam: purchaseParam).catchError((error) async {
      handleError(error);
      log(error.toString());
      return false;
    });
  }

  Future<void> clearTransactions() async {
    if (Platform.isIOS) {
      final transactions = await SKPaymentQueueWrapper().transactions();
      for (final transaction in transactions) {
        try {
          if (transaction.transactionState != SKPaymentTransactionStateWrapper.purchasing) {
            await SKPaymentQueueWrapper().finishTransaction(transaction);
            await SKPaymentQueueWrapper().finishTransaction(transaction.originalTransaction!);
          }
        } catch (e) {
          _iapCallback?.onBillingError(e);
          log(e.toString());
        }
      }
    }
  }

  void deliverProduct(PurchaseDetails purchaseDetails) async {
    /// IMPORTANT!! Always verify a purchase purchase details before delivering the product.
    _purchases.add(purchaseDetails);
    MyApp.purchaseStreamController.add(purchaseDetails);
    _iapCallback?.onSuccessPurchase(purchaseDetails);
  }

  void handleError(dynamic error) {
    _iapCallback?.onBillingError(error);
  }

  Future<bool> _verifyPurchase(PurchaseDetails purchaseDetails) {
    /// IMPORTANT!! Always verify a purchase before delivering the product.
    /// For the purpose of an example, we directly return true.
    return Future<bool>.value(true);
  }

  void _handleInvalidPurchase(PurchaseDetails purchaseDetails) {
    /// handle invalid purchase here if  _verifyPurchase` failed.
  }

  Future<void> _listenToPurchaseUpdated(List<PurchaseDetails> purchaseDetailsList) async {
    /// ignore: avoid_function_literals_in_foreach_calls
    purchaseDetailsList.forEach((PurchaseDetails detailsPurchase) async {
      if (detailsPurchase.status == PurchaseStatus.pending) {
        _iapCallback?.onPending(detailsPurchase);
      } else {
        if (detailsPurchase.status == PurchaseStatus.error) {
          handleError(detailsPurchase.error);
        } else if (detailsPurchase.status == PurchaseStatus.restored) {
          getPastPurchases(purchaseDetailsList);
        } else if (detailsPurchase.status == PurchaseStatus.canceled) {
          _iapCallback?.onBillingError(detailsPurchase.error);
        } else if (detailsPurchase.status == PurchaseStatus.purchased) {
          if (detailsPurchase.status == PurchaseStatus.purchased) {
            bool valid = await _verifyPurchase(detailsPurchase);
            if (valid) {
              onComplete();
            } else {}
            // Deliver the product

            deliverProduct(detailsPurchase);
          } else {
            _handleInvalidPurchase(detailsPurchase);
            return;
          }
        }
        bool valid = await _verifyPurchase(detailsPurchase);
        if (valid) {
          deliverProduct(detailsPurchase);
        } else {
          _handleInvalidPurchase(detailsPurchase);
          return;
        }
      }

      if (detailsPurchase.pendingCompletePurchase) {
        await _connection.completePurchase(detailsPurchase);
        finishTransaction();
      }
    });
    await clearTransactions();
  }

  GooglePlayPurchaseDetails? _getOldSubscription(ProductDetails productDetails, Map<String, PurchaseDetails> purchases) {
    return purchases[productDetails.id] as GooglePlayPurchaseDetails?;
  }
}
