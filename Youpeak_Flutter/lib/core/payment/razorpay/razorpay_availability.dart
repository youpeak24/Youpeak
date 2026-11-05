import 'package:youpeak/core/platform/platform_info.dart';
import 'package:youpeak/core/settings/admin_settings_model.dart';

/// Whether the admin has switched Razorpay on for the platform the app is
/// running on (Admin Panel → Settings → Payment → Razor Pay switches).
///
///   • iOS      → "Razor Pay iOS Switch"  (razorpayIosEnabled)
///   • Web      → "Razor Pay Web Switch"  (razorpayWebEnabled); settings saved
///                before that switch existed fall back to the Android switch
///   • Android  → "Razor Pay Android Switch" (razorPaySwitch)
///
/// The server still refuses an order if no Razorpay key is configured.
bool isRazorpayEnabled(Setting? setting) {
  if (setting == null) return false;
  if (PlatformInfo.isIOS) return setting.razorpayIosEnabled == true;
  if (PlatformInfo.isWeb) return (setting.razorpayWebEnabled ?? setting.razorPaySwitch) == true;
  return setting.razorPaySwitch == true;
}
