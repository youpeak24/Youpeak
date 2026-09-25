import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/main.dart';
import 'package:youpeak/features/upload/controller/upload_video_controller.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:youpeak/core/assets/app_icons.dart';
import 'package:youpeak/core/utils/utils.dart';

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
    return Scaffold(
      body: Column(
        children: [
          const VideoChargesAppbar(),
          Expanded(
            child: SingleChildScrollView(
              child: Column(
                children: [
                  10.height,
                  Center(
                    child: Text(
                      "Select the video charges method you want to use.",
                      style: GoogleFonts.urbanist(fontSize: 14, fontWeight: FontWeight.w500),
                    ),
                  ),
                  15.height,
                  _ChargeOptionTile(
                    icon: AppIcons.free,
                    label: "Free",
                    value: 1,
                    groupValue: _selectedType,
                    onTap: () => setState(() => _selectedType = 1),
                  ),
                  15.height,
                  _ChargeOptionTile(
                    icon: AppIcons.paid,
                    label: "Paid",
                    value: 2,
                    groupValue: _selectedType,
                    onTap: () => setState(() => _selectedType = 2),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
      bottomNavigationBar: GestureDetector(
        onTap: () {
          final controller = Get.find<UploadVideoController>();
          controller.videoChargeType.value = _selectedType;
          Get.back();
        },
        child: Container(
          height: 55,
          width: Get.width,
          alignment: Alignment.center,
          margin: const EdgeInsets.all(15),
          decoration: BoxDecoration(
            color: AppColor.primaryColor,
            borderRadius: BorderRadius.circular(50),
          ),
          child: Text(
            "Apply",
            style: GoogleFonts.urbanist(fontSize: 16, color: AppColor.white, fontWeight: FontWeight.bold),
          ),
        ),
      ),
    );
  }
}

class _ChargeOptionTile extends StatelessWidget {
  const _ChargeOptionTile({
    required this.icon,
    required this.label,
    required this.value,
    required this.groupValue,
    required this.onTap,
  });

  final String icon;
  final String label;
  final int value;
  final int groupValue;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: 55,
        width: Get.width,
        margin: const EdgeInsets.symmetric(horizontal: 15),
        padding: const EdgeInsets.symmetric(horizontal: 15),
        decoration: BoxDecoration(
          color: isDarkMode.value ? AppColor.mainDark : AppColor.white,
          borderRadius: BorderRadius.circular(15),
          boxShadow: [
            BoxShadow(
              color: AppColor.grey_200,
              blurRadius: 2,
            )
          ],
        ),
        child: Row(
          children: [
            Image.asset(icon, color: isDarkMode.value ? AppColor.white : AppColor.black, width: 25),
            15.width,
            Text(
              label,
              style: GoogleFonts.urbanist(fontSize: 18, fontWeight: FontWeight.w700),
            ),
            const Spacer(),
            Transform.scale(
              scale: 1.1,
              child: Radio<int>(
                fillColor: const WidgetStatePropertyAll(AppColor.primaryColor),
                value: value,
                groupValue: groupValue,
                onChanged: (_) => onTap(),
              ),
            ),
          ],
        ),
      ),
    );
  }
}


class VideoChargesAppbar extends StatelessWidget {
  const VideoChargesAppbar({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 60,
      width: Get.width,
      color: AppColor.transparent,
      margin: EdgeInsets.only(top: MediaQuery.of(context).viewPadding.top),
      padding: const EdgeInsets.symmetric(vertical: 5, horizontal: 10),
      child: Center(
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            GestureDetector(
              onTap: () => Get.back(),
              child: Container(
                height: 50,
                width: 50,
                alignment: Alignment.center,
                decoration: const BoxDecoration(
                  color: AppColor.transparent,
                  shape: BoxShape.circle,
                ),
                child: Image.asset(AppIcons.arrowBack, color: isDarkMode.value ? AppColor.white : AppColor.black, width: 22),
              ),
            ),
            5.width,
            Text(
              "Video Charges",
              style: GoogleFonts.urbanist(fontSize: 20, color: isDarkMode.value ? AppColor.white : AppColor.black, fontWeight: FontWeight.bold),
            ),
          ],
        ),
      ),
    );
  }
}
