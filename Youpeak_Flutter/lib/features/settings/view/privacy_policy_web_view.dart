import 'package:youpeak/core/platform/app_layout.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/shared/widgets/loader_ui.dart';
import 'package:youpeak/main.dart';
import 'package:youpeak/core/settings/admin_settings_api.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:youpeak/core/assets/app_icons.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'package:youpeak/core/utils/utils.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:youpeak/core/platform/platform_info.dart';

class PrivacyPolicyWebView extends StatefulWidget {
  const PrivacyPolicyWebView({super.key});

  // Browsers have no embeddable WebView (and policy sites usually refuse to
  // load in an iframe), so the web app opens the page in a new tab.
  static void open() {
    final link = AdminSettingsApi.adminSettingsModel?.setting?.privacyPolicyLink ?? "";
    if (PlatformInfo.isWeb) {
      if (link.isNotEmpty) launchUrl(Uri.parse(link));
      return;
    }
    Get.to(const PrivacyPolicyWebView());
  }

  @override
  State<PrivacyPolicyWebView> createState() => _PrivacyPolicyWebViewState();
}

class _PrivacyPolicyWebViewState extends State<PrivacyPolicyWebView> {
  WebViewController? webviewController;
  bool isLoading = true; // Track loader state
  @override
  void initState() {
    Utils.showLog("LINK ===> ${AdminSettingsApi.adminSettingsModel!.setting!.privacyPolicyLink!}");
    initWebView();

    super.initState();
  }

  void initWebView() {
    if (AdminSettingsApi.adminSettingsModel?.setting?.privacyPolicyLink != null) {
      webviewController = WebViewController()
        ..setJavaScriptMode(JavaScriptMode.unrestricted)
        ..setBackgroundColor(AppColor.white)
        ..setNavigationDelegate(
          NavigationDelegate(
            onPageFinished: (url) {
              setState(() {
                isLoading = false; // Hide loader once page loads
              });
            },
          ),
        )
        ..loadRequest(Uri.parse(AdminSettingsApi.adminSettingsModel!.setting!.privacyPolicyLink!));
      setState(() {}); // Update UI once controller is ready
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        systemOverlayStyle: const SystemUiOverlayStyle(statusBarColor: Colors.transparent, statusBarBrightness: Brightness.dark),
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: GestureDetector(child: Image.asset(AppIcons.arrowBack, color: isDarkMode.value ? AppColor.white : AppColor.black).paddingOnly(left: 15), onTap: () => Get.back()),
        leadingWidth: 33,
        title: Text("Privacy Policy", style: GoogleFonts.urbanist(fontSize: 18, fontWeight: FontWeight.bold)),
        centerTitle: AppSettings.isCenterTitle,
      ),
      body: Container(
        height: Get.height,
        width: AppLayout.widthOf(context),
        color: AppColor.white,
        child: webviewController != null
            ? Stack(
                children: [
                  WebViewWidget(controller: webviewController!),
                  if (isLoading)
                    const Center(
                      child: LoaderUi(), // Your loader widget
                    ),
                ],
              )
            : const LoaderUi(),
      ),
    );
  }
}
