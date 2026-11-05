// Storage Setting
export const digitalOceanContent = [
    {
        label: "Endpoint",
        description: "Tells your app where to connect to your Space for uploads/downloads.",
    },
    {
        label: "Host Name",
        description: "Defines the base URL for serving files from your Space region.",
    },
    {
        label: "Secret Key",
        description: "Secures access to your files. Keep this private.",
    },
    {
        label: "Access Key",
        description: "Works with Secret Key to authenticate file requests.",
    },
    {
        label: "Bucket Name",
        description: "Specifies which Space stores your uploaded files.",
    },
    {
        label: "Region",
        description: "Decides the data center (e.g., blr1) — affects speed and latency.",
    },
];

export const awsContent = [
    {
        label: "Endpoint",
        description: "Connects your app to AWS S3 for file storage.",
    },
    {
        label: "Host Name",
        description: "Used to generate URLs for accessing stored files.",
    },
    {
        label: "Access Key",
        description: "Identifies your AWS account when making storage requests.",
    },
    {
        label: "Secret Key",
        description: "Secures those requests. Keep this hidden.",
    },
    {
        label: "Bucket Name",
        description: "Defines which S3 bucket your files are stored in.",
    },
    {
        label: "Region",
        description: "Specifies bucket’s location (e.g., ap-south-1). Impacts latency & costs.",
    },
];

export const storageOptionContent = [
    {
        label: "Local",
        description: "Stores files on your own server. Easy setup but limited space.",
    },
    {
        label: "AWS S3",
        description: "Scalable storage from Amazon. Best for large-scale apps.",
    },
    {
        label: "DigitalOcean Space",
        description: "Affordable S3-compatible storage. Good for small to medium apps.",
    },
];


// Payment Setting 
export const razorpayContent = [
    {
        label: "Razorpay",
        description: "Toggle to enable or disable Razorpay as a payment method.",
    },
    {
        label: "Razorpay Id",
        description: (
            <>
                Public Key ID for Razorpay integration.{" "}
                <a
                    href="https://dashboard.razorpay.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "#059669", textDecoration: "underline" }}
                >
                    Get it from Razorpay Dashboard
                </a>
            </>
        ),
    },
    {
        label: "Razorpay Secret Key",
        description: (
            <>
                Secret API key paired with the Key ID for secure transactions.{" "}
                <a
                    href="https://dashboard.razorpay.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "#059669", textDecoration: "underline" }}
                >
                    Manage it in Razorpay Dashboard
                </a>
            </>
        ),
    },
];

export const stripeContent = [
    {
        label: "Stripe",
        description: "Toggle to enable or disable Stripe as a payment method.",
    },
    {
        label: "Stripe Publishable Key",
        description: (
            <>
                Public API key for Stripe payments. Required for client-side requests.{" "}
                <a
                    href="https://dashboard.stripe.com/apikeys"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "#059669", textDecoration: "underline" }}
                >
                    Get it from Stripe Dashboard
                </a>
            </>
        ),
    },
    {
        label: "Stripe Secret Key",
        description: (
            <>
                Secret API key for server-side requests. Keep this key private.{" "}
                <a
                    href="https://dashboard.stripe.com/apikeys"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "#059669", textDecoration: "underline" }}
                >
                    Manage it in Stripe Dashboard
                </a>
            </>
        ),
    },
];

export const googlePlayContent = [
    {
        label: "Google Play",
        description: (
            <>
                Toggle to enable or disable Google Play billing for in-app purchases.{" "}
                <a
                    href="https://developer.android.com/google/play/billing"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "#059669", textDecoration: "underline" }}
                >
                    Learn more at Google Play Billing Docs
                </a>
            </>
        ),
    },
];

export const flutterWaveContent = [
    {
        label: "Flutterwave",
        description: "Enable or disable Flutterwave as a payment method.",
    },
    {
        label: "Flutterwave ID",
        description: (
            <>
                API key for Flutterwave integration.{" "}
                <a
                    href="https://dashboard.flutterwave.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "#059669", textDecoration: "underline" }}
                >
                    Get it from Flutterwave Dashboard
                </a>
            </>
        ),
    },
];

export const paystackContent = [
    {
        label: "Paystack",
        description: "Toggle to enable or disable Paystack as a payment method.",
    },
    {
        label: "Paystack Public Key",
        description: (
            <>
                Public API key for Paystack payments. Required for client-side requests.{" "}
                <a
                    href="https://dashboard.paystack.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "#059669", textDecoration: "underline" }}
                >
                    Get it from Paystack Dashboard
                </a>
            </>
        ),
    },
    {
        label: "Paystack Secret Key",
        description: (
            <>
                Secret API key for server-side requests. Keep this key private.{" "}
                <a
                    href="https://dashboard.paystack.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "#059669", textDecoration: "underline" }}
                >
                    Manage it in Paystack Dashboard
                </a>
            </>
        ),
    },
];

export const paypalContent = [
    {
        label: "PayPal",
        description: "Toggle to enable or disable PayPal as a payment method.",
    },
    {
        label: "PayPal Client Id",
        description: (
            <>
                Client ID for PayPal integration. Used for identifying your application.{" "}
                <a
                    href="https://developer.paypal.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "#059669", textDecoration: "underline" }}
                >
                    Get it from PayPal Developer Dashboard
                </a>
            </>
        ),
    },
    {
        label: "PayPal Secret Key",
        description: (
            <>
                Secret key paired with the Client ID for secure transactions. Keep this private.{" "}
                <a
                    href="https://developer.paypal.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "#059669", textDecoration: "underline" }}
                >
                    Manage it in PayPal Developer Dashboard
                </a>
            </>
        ),
    },
];

export const cashfreeContent = [
    {
        label: "Cashfree",
        description: "Toggle to enable or disable Cashfree as a payment method.",
    },
    {
        label: "Cashfree Client Id",
        description: (
            <>
                Client ID for Cashfree integration. Used for API authentication.{" "}
                <a
                    href="https://merchant.cashfree.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "#059669", textDecoration: "underline" }}
                >
                    Get it from Cashfree Merchant Dashboard
                </a>
            </>
        ),
    },
    {
        label: "Cashfree Client Secret",
        description: (
            <>
                Client Secret paired with the Client ID for secure API calls. Keep this private.{" "}
                <a
                    href="https://merchant.cashfree.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "#059669", textDecoration: "underline" }}
                >
                    Manage it in Cashfree Merchant Dashboard
                </a>
            </>
        ),
    },
];

// Ads Setting
export const androidAdsContent = [
    {
        label: "Android Google Interstitial",
        description: "Ad unit ID for interstitial ads on Android (full-screen ads shown between content).",
    },
    {
        label: "Android Google Native",
        description: "Ad unit ID for native ads on Android (blend into app content).",
    },
    {
        label: "Android Google Native Video",
        description: "Ad unit ID for native video ads on Android (video ads integrated into app content).",
    },
    {
        label: "Android Google Reward",
        description: "Ad unit ID for rewarded ads on Android (users watch ads to earn rewards).",
    },
    {
        label: "Android Interactive Video Ad URL",
        description: "URL for interactive video ads on Android (custom video ad content).",
    },
];

export const iosAdsContent = [
    {
        label: "iOS Google Interstitial",
        description: "Ad unit ID for interstitial ads on iOS (full-screen ads shown between content).",
    },
    {
        label: "iOS Google Native",
        description: "Ad unit ID for native ads on iOS (seamlessly integrated with UI).",
    },
    {
        label: "iOS Google Native Video",
        description: "Ad unit ID for native video ads on iOS (video ads integrated into app content).",
    },
    {
        label: "iOS Google Reward",
        description: "Ad unit ID for rewarded ads on iOS (users watch ads to earn rewards).",
    },
    {
        label: "iOS Interactive Video Ad URL",
        description: "URL for interactive video ads on iOS (custom video ad content).",
    },
];

// IMA Tags (Ad Manager / IMA DAI)
export const imaAdsTagsContent = [
    {
        label: "IMA Tag URL 1",
        description:
            "First IMA ad tag URL. It is saved to the API as the 1st item of the comma-separated `imaTagsUrl` value.",
    },
    {
        label: "IMA Tag URL 2",
        description:
            "Second IMA ad tag URL (2nd item of `imaTagsUrl`). Leave empty if you only use one tag.",
    },
    {
        label: "IMA Tag URL 3",
        description:
            "Third IMA ad tag URL (3rd item of `imaTagsUrl`).",
    },
    {
        label: "How it saves",
        description:
            "On submit, the app joins URL 1/2/3 into a single comma-separated string and sends it as `imaTagsUrl`.",
    },
];

// App Settings
export const appSettingContent = [
    {
        label: "Privacy Policy Link",
        description:
            "URL that the user opens from the app (when redirected from “Privacy Policy”).",
    },
    {
        label: "Privacy Policy Text",
        description:
            "The text shown inside the app so users can read your privacy policy without leaving the app.",
    },
    {
        label: "Website URL",
        description: "Public URL of your website, used for share links and deep linking.",
    },
];

// Firebase Notification
export const firebaseNotificationContent = [
    {
        label: "Private Key JSON",
        description:
            "Firebase service account JSON used to authenticate server-side notification sending.",
    },
];

// Channel / Video / Shorts
export const channelVideoShortContent = [
    {
        label: "Duration Of Shorts",
        description:
            "Maximum duration (in seconds) allowed for users to upload short videos.",
    },
];

// Coin Settings
export const coinSettingContent = [
    {
        label: "Coin (withdraw)",
        description:
            "Minimum coins required before a user can request a withdraw.",
    },
    {
        label: "Coin (convert)",
        description:
            "Minimum coins required before a user can convert coins.",
    },
    {
        label: "Amount",
        description:
            "Fixed conversion amount shown next to the coin inputs (currently set to 1).",
    },
];

// General Setting

export const resendApiSetting = [
    {
        label: "Resend API Key",
        description: (
            <>
                Key for Resend service to send OTPs, resets, and emails.{' '}
                <a
                    href="https://resend.com/api-keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500"
                >
                    Get it from Resend Dashboard
                </a>
                .
            </>
        ),
    }
]

export const zegoSetting = [
    {
        label: "Zego AppId",
        description: (
            <>
                Unique numeric ID for your ZegoCloud application.{" "}
                <a
                    href="https://console.zegocloud.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500"
                >
                    Get it from Zego Console
                </a>
                .
            </>
        ),
    },
    {
        label: "Zego App SignIn",
        description: (
            <>
                Security signature string used to authenticate with Zego services.{" "}
                <a
                    href="https://docs.zegocloud.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500"
                >
                    Learn how to generate it
                </a>
                .
            </>
        ),
    },
    {
        label: "Zego Server Secret",
        description: (
            <>
                Server secret key for ZegoCloud server-side authentication.{" "}
                <a
                    href="https://console.zegocloud.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500"
                >
                    Get it from Zego Console
                </a>
                .
            </>
        ),
    },
];

// Deeplink Setting
export const deeplinkSetting = [
    {
        label: "Android Asset Links",
        description: (
            <>
                Configure your Android App Links to verify ownership and enable deep linking.{' '}
                <a
                    href="https://developer.android.com/training/app-links/verify-site-associations"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500"
                >
                    Learn more
                </a>
                .
            </>
        ),
    },
    {
        label: "Apple App Site Association",
        description: (
            <>
                Configure Universal Links for iOS to enable deep linking from web to app.{' '}
                <a
                    href="https://developer.apple.com/documentation/xcode/supporting-universal-links-in-your-app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500"
                >
                    Learn more
                </a>
                .
            </>
        ),
    },
];
