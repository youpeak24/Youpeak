import 'package:url_launcher/url_launcher.dart';
import 'package:youpeak/core/providers/app_provider_container.dart';
import 'package:youpeak/core/storage/database/database.dart';
import 'package:youpeak/core/system_config/presentation/system_configs_provider.dart';
import 'package:youpeak/core/utils/custom_toast.dart';

/// Store compliance: the app never sells memberships, Starter Passes, VIP
/// Passes or the Digital Partner license itself. Every such purchase opens
/// the web portal (system_configs/app_policy.membershipPortalUrl, managed by
/// the admin) in the external browser, where Razorpay / PhonePe handle it.
class MembershipPortal {
  MembershipPortal._();

  static String get baseUrl => appProviderContainer.read(systemConfigsProvider).appPolicy.membershipPortalUrl;

  /// [plan] is a tier id (e.g. tier_tasker_bronze) or a purchase kind the
  /// portal understands (e.g. "digital_partner_license").
  static Uri uriFor({String? plan, String? overrideBaseUrl}) {
    final base = Uri.parse(overrideBaseUrl ?? baseUrl);
    return base.replace(queryParameters: {
      ...base.queryParameters,
      if (plan != null && plan.isNotEmpty) "plan": plan,
      if (Database.loginUserId != null) "uid": Database.loginUserId!,
      "source": "app",
    });
  }

  static Future<void> open({String? plan, String? overrideBaseUrl}) async {
    final uri = uriFor(plan: plan, overrideBaseUrl: overrideBaseUrl);
    try {
      if (!await launchUrl(uri, mode: LaunchMode.externalApplication)) {
        CustomToast.show("Couldn't open ${uri.host}. Please visit it in your browser.");
      }
    } catch (_) {
      CustomToast.show("Couldn't open ${uri.host}. Please visit it in your browser.");
    }
  }
}
