import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/shared/widgets/basic_button.dart';
import 'package:youpeak/shared/widgets/custom_filled_button.dart';
import 'package:youpeak/features/upload/controller/upload_video_controller.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:youpeak/core/constants/app_string.dart';

class AudiencePageView extends StatefulWidget {
  const AudiencePageView({super.key});

  @override
  State<AudiencePageView> createState() => _AudiencePageViewState();
}

class _AudiencePageViewState extends State<AudiencePageView> {
  late int _selectedAudience;

  late List<String> audienceCollection;

  @override
  void initState() {
    super.initState();
    final controller = Get.find<UploadVideoController>();
    _selectedAudience = controller.selectAudience.value;
    audienceCollection = [
      AppStrings.itsMadeForKids.tr,
      AppStrings.itsMadeFor18Adult.tr,
      AppStrings.itsMadeForBothKids18Adult.tr,
    ];
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          BasicAppBar(title: AppStrings.selectAudience.tr),
          const SizedBox(height: 10),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 10),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                for (int i = 0; i < audienceCollection.length; i++)
                  GestureDetector(
                    onTap: () => setState(() => _selectedAudience = i),
                    child: Container(
                      height: 50,
                      width: Get.width,
                      color: Colors.transparent,
                      child: Row(
                        children: [
                          Radio<int>(
                            fillColor: const WidgetStatePropertyAll(AppColor.primaryColor),
                            value: i,
                            groupValue: _selectedAudience,
                            onChanged: (val) => setState(() => _selectedAudience = i),
                          ),
                          Expanded(
                            child: Text(
                              audienceCollection[i],
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: GoogleFonts.urbanist(fontWeight: FontWeight.bold, fontSize: 16),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                const SizedBox(height: 10),
              ],
            ),
          ),
          const Expanded(child: Offstage()),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 10),
            child: CustomFilledButton(
              title: AppStrings.apply.tr,
              callback: () {
                final controller = Get.find<UploadVideoController>();
                controller.selectAudience.value = _selectedAudience;
                Get.back();
              },
            ),
          ),
          const SizedBox(height: 10),
        ],
      ),
    );
  }
}
