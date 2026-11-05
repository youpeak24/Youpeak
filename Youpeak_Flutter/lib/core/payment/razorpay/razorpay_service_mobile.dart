import 'package:razorpay_flutter/razorpay_flutter.dart';
import 'package:youpeak/core/payment/razorpay/razorpay_success.dart';

// Thin wrapper around the Razorpay SDK. The checkout map MUST come from the
// backend's POST /client/payment/createOrder response (key/order_id/amount/
// currency) — never build it client-side, since order_id is what lets the
// server verify the payment signature after checkout completes.
class RazorPayService {
  Razorpay? _razorpay;

  void openCheckout({
    required Map<String, dynamic> checkout,
    required String appName,
    String? email,
    String? contact,
    required void Function(RazorpaySuccess response) onSuccess,
    required void Function(String message) onError,
  }) {
    // Fresh instance per checkout — reusing one across purchases stacks
    // listeners and can fire onSuccess more than once for a single payment.
    _razorpay?.clear();
    final razorpay = Razorpay();
    _razorpay = razorpay;

    razorpay.on(
      Razorpay.EVENT_PAYMENT_SUCCESS,
      (PaymentSuccessResponse r) => onSuccess(RazorpaySuccess(orderId: r.orderId, paymentId: r.paymentId, signature: r.signature)),
    );
    razorpay.on(Razorpay.EVENT_PAYMENT_ERROR, (PaymentFailureResponse r) => onError(r.message ?? "Payment failed."));
    razorpay.on(Razorpay.EVENT_EXTERNAL_WALLET, (ExternalWalletResponse r) {});

    final options = <String, dynamic>{
      'key': checkout['key'],
      'order_id': checkout['order_id'],
      'amount': checkout['amount'],
      'currency': checkout['currency'] ?? 'INR',
      'name': appName,
      'theme': {'color': '#FF4D67'},
      if ((email ?? '').isNotEmpty || (contact ?? '').isNotEmpty)
        'prefill': {
          if ((email ?? '').isNotEmpty) 'email': email,
          if ((contact ?? '').isNotEmpty) 'contact': contact,
        },
    };

    try {
      razorpay.open(options);
    } catch (e) {
      onError(e.toString());
    }
  }

  void dispose() {
    _razorpay?.clear();
    _razorpay = null;
  }
}
