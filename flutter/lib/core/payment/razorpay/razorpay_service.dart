// Razorpay checkout for every platform. The Android/iOS app uses the native
// razorpay_flutter SDK; the web app opens Razorpay's hosted Checkout.js.
// Both expose the same RazorPayService.openCheckout contract.
export 'razorpay_success.dart';
export 'razorpay_service_mobile.dart' if (dart.library.js_interop) 'razorpay_service_web.dart';
