import 'dart:async';
import 'dart:js_interop';
import 'dart:js_interop_unsafe';

import 'package:web/web.dart' as web;
import 'package:youpeak/core/payment/razorpay/razorpay_success.dart';

// Web counterpart of the razorpay_flutter wrapper: same contract, backed by
// Razorpay's hosted Checkout.js. As on mobile, the checkout map MUST come from
// the backend's createOrder response so the server can verify the signature.
class RazorPayService {
  static const _scriptUrl = "https://checkout.razorpay.com/v1/checkout.js";
  static Future<void>? _scriptLoading;

  void openCheckout({
    required Map<String, dynamic> checkout,
    required String appName,
    String? email,
    String? contact,
    required void Function(RazorpaySuccess response) onSuccess,
    required void Function(String message) onError,
  }) {
    _open(checkout, appName, email, contact, onSuccess, onError);
  }

  Future<void> _open(
    Map<String, dynamic> checkout,
    String appName,
    String? email,
    String? contact,
    void Function(RazorpaySuccess response) onSuccess,
    void Function(String message) onError,
  ) async {
    try {
      await _loadScript();
    } catch (_) {
      onError("Could not load Razorpay checkout. Check your connection and try again.");
      return;
    }

    var paid = false;
    final options = <String, Object?>{
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
    }.jsify() as JSObject;

    options.setProperty(
      'handler'.toJS,
      ((JSObject r) {
        if (paid) return;
        paid = true;
        onSuccess(RazorpaySuccess(
          orderId: _string(r, 'razorpay_order_id'),
          paymentId: _string(r, 'razorpay_payment_id'),
          signature: _string(r, 'razorpay_signature'),
        ));
      }).toJS,
    );

    // Closing the popup without paying is the web equivalent of the native
    // SDK's "payment cancelled" error.
    final modal = JSObject();
    modal.setProperty(
      'ondismiss'.toJS,
      (() {
        if (!paid) onError("Payment cancelled.");
      }).toJS,
    );
    options.setProperty('modal'.toJS, modal);

    try {
      // new Razorpay(options)
      final checkoutPopup = globalContext.getProperty<JSFunction>("Razorpay".toJS).callAsConstructor<JSObject>(options);
      // A failed attempt keeps the popup open so the user can retry; just
      // surface the reason each time.
      checkoutPopup.callMethod<JSAny?>(
        'on'.toJS,
        'payment.failed'.toJS,
        ((JSObject r) {
          final error = r.getProperty<JSObject?>('error'.toJS);
          onError((error == null ? null : _string(error, 'description')) ?? "Payment failed.");
        }).toJS,
      );
      checkoutPopup.callMethod<JSAny?>('open'.toJS);
    } catch (e) {
      onError(e.toString());
    }
  }

  static String? _string(JSObject object, String key) => object.getProperty<JSAny?>(key.toJS)?.dartify()?.toString();

  static Future<void> _loadScript() {
    if (globalContext.has("Razorpay")) return Future.value();
    return _scriptLoading ??= () {
      final loaded = Completer<void>();
      final script = web.HTMLScriptElement()
        ..src = _scriptUrl
        ..async = true;
      script.onload = ((web.Event _) => loaded.complete()).toJS;
      script.onerror = ((web.Event _) {
        _scriptLoading = null;
        script.remove();
        loaded.completeError(StateError("Razorpay checkout failed to load"));
      }).toJS;
      web.document.head!.appendChild(script);
      return loaded.future;
    }();
  }

  // The hosted popup owns its own lifecycle; nothing to release.
  void dispose() {}
}
