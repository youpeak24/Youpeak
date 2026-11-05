// The three values the backend needs to verify a Razorpay payment signature
// (POST /client/payment/verify).
class RazorpaySuccess {
  const RazorpaySuccess({this.orderId, this.paymentId, this.signature});

  final String? orderId;
  final String? paymentId;
  final String? signature;
}
