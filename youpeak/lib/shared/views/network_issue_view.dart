import 'package:flutter/material.dart';
import 'package:youpeak/core/assets/app_visuals.dart';
import 'package:get/get.dart';
import 'package:get/get_rx/src/rx_typedefs/rx_typedefs.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/shared/widgets/loader_ui.dart';
import 'package:youpeak/main.dart';

class NetworkIssueView extends StatelessWidget {
  const NetworkIssueView({super.key, this.callback});
  final Callback? callback;
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
          Container(
            height: 200,
            width: 200,
            clipBehavior: Clip.antiAlias,
            padding: const EdgeInsets.all(0),
            decoration: const BoxDecoration(shape: BoxShape.circle, color: Colors.white),
            child: Image.asset(AppVisuals.noInternet, width: 200),
          ),
          Obx(() => isDarkMode.value ? const SizedBox(height: 20) : const Offstage()),
          Text("Something went wrong", style: GoogleFonts.urbanist(fontSize: 25, fontWeight: FontWeight.bold)),
          const SizedBox(height: 12),
          Text("Check your connection, then refresh the page.", style: GoogleFonts.urbanist(fontSize: 15)),
          const SizedBox(height: 40),
          const LoaderUi()
          // GestureDetector(
          //   onTap: callback,
          //   child: Container(
          //       padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 6),
          //       decoration: BoxDecoration(
          //         border: Border.all(color: AppColors.primaryColor),
          //         borderRadius: BorderRadius.circular(100),
          //       ),
          //       child:
          //       Text(
          //         "Refresh",
          //         textAlign: TextAlign.center,
          //         style: GoogleFonts.urbanist(
          //           fontWeight: FontWeight.w600,
          //           fontSize: 16,
          //           color: AppColors.primaryColor,
          //         ),
          //       ),
          //       ),
          // )
        ]),
      ),
    );
  }
}
