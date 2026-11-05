/**
 * Razorpay Checkout.js (hosted checkout) for the web portal.
 *
 * The order is always created on the server first (/client/payment/createOrder
 * returns the public key id + order id + amount); this only opens the popup and
 * hands back the signed response for /client/payment/verify.
 */

const SCRIPT_URL = "https://checkout.razorpay.com/v1/checkout.js";
let loading = null;

export function loadCheckoutScript() {
  if (typeof window === "undefined") return Promise.reject(new Error("Checkout needs a browser."));
  if (window.Razorpay) return Promise.resolve();
  if (!loading) {
    loading = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = SCRIPT_URL;
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => {
        loading = null;
        s.remove();
        reject(new Error("Couldn't load the secure payment window. Check your connection (or ad-blocker) and try again."));
      };
      document.head.appendChild(s);
    });
  }
  return loading;
}

/**
 * Open checkout. Resolves with { orderId, paymentId, signature } once the user
 * has paid; rejects with { dismissed: true } if they close it, or
 * { failed: true, message } if the gateway reports a failed payment.
 */
export async function openCheckout({ checkout, name = "YouPeak", description, prefill, themeColor = "#059669" }) {
  await loadCheckoutScript();
  return new Promise((resolve, reject) => {
    let settled = false;
    let lastFailure = "";
    const done = (fn, value) => {
      if (settled) return;
      settled = true;
      fn(value);
    };
    const rzp = new window.Razorpay({
      key: checkout.key,
      order_id: checkout.order_id,
      amount: checkout.amount,
      currency: checkout.currency || "INR",
      name,
      description,
      prefill,
      theme: { color: themeColor },
      retry: { enabled: true, max_count: 3 },
      handler: (r) =>
        done(resolve, { orderId: r.razorpay_order_id, paymentId: r.razorpay_payment_id, signature: r.razorpay_signature }),
      modal: {
        // A failed attempt doesn't end checkout (the buyer can retry inside the
        // window), so only report it if they then close the window unpaid.
        ondismiss: () => done(reject, lastFailure ? { failed: true, message: lastFailure } : { dismissed: true }),
        confirm_close: true,
      },
    });
    rzp.on("payment.failed", (r) => {
      lastFailure = (r && r.error && r.error.description) || "The payment didn't go through.";
    });
    rzp.open();
  });
}
