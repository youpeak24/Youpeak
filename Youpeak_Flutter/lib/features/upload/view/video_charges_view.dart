import 'package:youpeak/core/platform/responsive.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/core/assets/app_icons.dart';
import 'package:youpeak/core/constants/app_string.dart';
import 'package:youpeak/features/upload/controller/upload_video_controller.dart';
import 'package:youpeak/main.dart' show isDarkMode;
import 'package:youpeak/core/theme/app_color.dart';
import 'package:youpeak/shared/widgets/app_icon.dart';
import 'package:youpeak/shared/widgets/basic_button.dart';
import 'package:youpeak/shared/widgets/custom_filled_button.dart';
import 'package:youpeak/shared/widgets/option_tile.dart';

class VideoChargesView extends StatefulWidget {
  const VideoChargesView({super.key});

  @override
  State<VideoChargesView> createState() => _VideoChargesViewState();
}

class _VideoChargesViewState extends State<VideoChargesView> {
  late int _selectedType;

  @override
  void initState() {
    super.initState();
    final controller = Get.find<UploadVideoController>();
    _selectedType = controller.videoChargeType.value;
  }

  @override
  Widget build(BuildContext context) {
    final dark = isDarkMode.value;
    return Scaffold(
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          BasicAppBar(title: "Video Charges"),
          const SizedBox(height: 12),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Text(
              "Select whether viewers can watch for free or must unlock with coins.",
              style: GoogleFonts.urbanist(fontSize: 14, fontWeight: FontWeight.w500, color: dark ? AppColor.mutedTextDark : AppColor.mutedText),
            ),
          ),
          const SizedBox(height: 16),
          OptionTile(
            leading: AppIcon(AppIcons.free, size: 24, color: dark ? AppColor.white : AppColor.black),
            title: "Free",
            subtitle: "Anyone can watch this video without coins",
            selected: _selectedType == 1,
            onTap: () => setState(() => _selectedType = 1),
          ),
          OptionTile(
            leading: AppIcon(AppIcons.paid, size: 24, color: dark ? AppColor.white : AppColor.black),
            title: "Paid",
            subtitle: "Requires video unlock coins or channel subscription",
            selected: _selectedType == 2,
            onTap: () => setState(() => _selectedType = 2),
          ),
          // Phones pin Apply to the bottom; on a wide page it sits under the options.
          if (PageWidth.of(context) < Responsive.inlineActionFrom) const Expanded(child: Offstage()) else const SizedBox(height: 24),
          ActionWidth(
            child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: CustomFilledButton(
              title: AppStrings.apply.tr,
              callback: () {
                final controller = Get.find<UploadVideoController>();
                controller.videoChargeType.value = _selectedType;
                Get.back();
              },
            ),
          )),
          const SizedBox(height: 16),
        ],
      ),
    );
  }
}
