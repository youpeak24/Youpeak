// Fail fast (in production) when required configuration is missing, instead of
// silently falling back to committed secrets.
const REQUIRED = [
  "secretKey",       // shared client API key (also baked into the app + admin web)
  "JWT_SECRET",      // admin token signing secret
];

const RECOMMENDED = [
  "FIREBASE_SERVICE_ACCOUNT",     // or GOOGLE_APPLICATION_CREDENTIALS / serviceAccountKey.json
  "CLOUDFLARE_ACCOUNT_ID",
  "CLOUDFLARE_R2_ACCESS_KEY",
  "CLOUDFLARE_R2_SECRET_KEY",
  "CLOUDFLARE_R2_BUCKET",
];

module.exports = function validateEnv() {
  const isProd = process.env.NODE_ENV === "production" || process.env.VERCEL || process.env.K_SERVICE;
  const missingRequired = REQUIRED.filter((k) => !process.env[k]);
  const missingRecommended = RECOMMENDED.filter((k) => !process.env[k]);

  if (missingRecommended.length) {
    console.warn("⚠️  Missing recommended env vars:", missingRecommended.join(", "));
  }

  // Razorpay can also be configured from Admin Panel > Settings > Payment (the
  // settings doc isn't readable this early), so this is a heads-up, not a failure.
  if (isProd) {
    const rp = ["RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET", "RAZORPAY_WEBHOOK_SECRET"].filter((k) => !String(process.env[k] || "").trim());
    if (rp.length) console.warn("⚠️  Razorpay env vars not set:", rp.join(", "), "(set them, or save the keys in the admin panel)");
    const id = String(process.env.RAZORPAY_KEY_ID || "").trim();
    if (id && !/^rzp_(test|live)_/.test(id)) console.warn("⚠️  RAZORPAY_KEY_ID should start with rzp_test_ or rzp_live_");
    if (/^rzp_test_/.test(id) && process.env.NODE_ENV === "production") console.warn("⚠️  Razorpay is in TEST mode in production - no real money will be collected.");
  }

  if (missingRequired.length) {
    const msg = `Missing required env vars: ${missingRequired.join(", ")}`;
    if (isProd) {
      console.error("❌ " + msg);
      throw new Error(msg);
    }
    console.warn("⚠️  " + msg + " (continuing — dev only)");
  }
};
