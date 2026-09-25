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
import 'package:webview_flutter/webview_flutter.dart';

class PrivacyPolicyWebView extends StatefulWidget {
  const PrivacyPolicyWebView({super.key});

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
        width: Get.width,
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
