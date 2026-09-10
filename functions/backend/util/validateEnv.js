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

  if (missingRequired.length) {
    const msg = `Missing required env vars: ${missingRequired.join(", ")}`;
    if (isProd) {
      console.error("❌ " + msg);
      throw new Error(msg);
    }
    console.warn("⚠️  " + msg + " (continuing — dev only)");
  }
};
