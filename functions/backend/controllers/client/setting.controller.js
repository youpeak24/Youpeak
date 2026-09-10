const db = require("../../util/connection");

//get setting
exports.get = async (req, res) => {
  try {
    let advertise = await db.findOne("advertises", {});
    if (!advertise) {
      advertise = {
        isGoogle: true,
        android: { google: { interstitial: "", native: "", reward: "", nativeAdVideo: "", videoAdUrl: "" } },
        ios: { google: { interstitial: "", native: "", reward: "", nativeAdVideo: "", videoAdUrl: "" } },
      };
    }

    const setting = global.settingJSON ? global.settingJSON : {};
    const settingObj = typeof setting.toObject === "function" ? setting.toObject() : { ...setting };

    const merged = { ...settingObj, ...advertise };

    // ── Strip every server-only secret before sending settings to the client ──
    // Payments are now server-side (util/payment.service): the client only needs
    // the public key ids (razorPayId, stripePublishableKey), never the secrets.
    const SENSITIVE_SETTING_KEYS = [
      // payment gateway secrets
      "razorSecretKey", "razorpayKeySecret", "razorpayWebhookSecret",
      "stripeSecretKey", "stripeTestSecretKey",
      "paypalSecretKey", "paystackSecretKey",
      "cashfreeClientSecret", "cashfreeSecretKey", "cashfreeWebhookSecret",
      "flutterWaveSecretKey", "flutterwaveSecretKey",
      // storage engine selectors / creds
      "storage",
      "doEndpoint", "doAccessKey", "doSecretKey", "doHostname", "doBucketName", "doRegion", "digitalOcean",
      "awsEndpoint", "awsAccessKey", "awsSecretKey", "awsHostname", "awsBucketName", "awsRegion", "awsS3", "local",
      // Cloudflare R2 / Stream
      "r2AccountId", "r2AccessKeyId", "r2SecretAccessKey", "r2BucketName", "r2Endpoint", "r2PublicDomain",
      "cloudflareAccountId", "cloudflareApiToken", "cloudflareR2AccessKey", "cloudflareR2SecretKey",
      "cloudflareR2Bucket", "cloudflareStreamToken",
      // Firebase Admin service account
      "privateKey", "private_key", "private_key_id", "privateKeyId", "client_email", "clientEmail",
      "client_id", "clientId", "client_x509_cert_url", "clientX509CertUrl",
      "auth_provider_x509_cert_url", "authProviderX509CertUrl", "auth_uri", "authUri",
      "token_uri", "tokenUri", "project_id", "projectId", "type", "universe_domain", "universeDomain",
      // misc server secrets
      "secretKey", "JWT_SECRET", "jwtSecret", "resendApiKey", "zegoServerSecret",
      "mongodbConnectionString", "MONGODB_CONNECTION_STRING",
      // deep-link association files (served on their own well-known routes)
      "androidAssetLinks", "appleAppSiteAssociation",
    ];
    for (const key of SENSITIVE_SETTING_KEYS) delete merged[key];

    return res.status(200).json({
      status: true,
      message: "Success",
      setting: merged,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};
