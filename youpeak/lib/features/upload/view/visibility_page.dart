import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/shared/widgets/basic_button.dart';
import 'package:youpeak/shared/widgets/custom_filled_button.dart';
import 'package:youpeak/features/upload/controller/upload_video_controller.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:youpeak/core/constants/app_string.dart';

class VisibilityPageView extends StatefulWidget {
  const VisibilityPageView({super.key});

  @override
  State<VisibilityPageView> createState() => _VisibilityPageViewState();
}

class _VisibilityPageViewState extends State<VisibilityPageView> {
  late int _selectedVisibility;

  late List<Map<String, String>> visibilityCollection;

  @override
  void initState() {
    super.initState();
    final controller = Get.find<UploadVideoController>();
    _selectedVisibility = controller.selectVisibility.value;
    visibilityCollection = [
      {"title": AppStrings.public.tr, "subTitle": AppStrings.anyoneCanSearchForAndView.tr},
      {"title": AppStrings.private.tr, "subTitle": AppStrings.onlyFollowersCanView.tr},
      {"title": AppStrings.unlisted.tr, "subTitle": AppStrings.anyoneWithTheLinkCanView.tr},
    ];
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          BasicAppBar(title: AppStrings.addVisibility.tr),
          const SizedBox(height: 10),
          for (int i = 0; i < visibilityCollection.length; i++)
            GestureDetector(
              onTap: () => setState(() => _selectedVisibility = i),
              child: Container(
                height: 60,
                width: Get.width,
                margin: const EdgeInsets.only(bottom: 5),
                color: Colors.transparent,
                child: Row(
                  children: [
                    Radio<int>(
                      fillColor: const WidgetStatePropertyAll(AppColor.primaryColor),
                      value: i,
                      groupValue: _selectedVisibility,
                      onChanged: (val) => setState(() => _selectedVisibility = i),
                    ),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          visibilityCollection[i]["title"]!,
                          style: GoogleFonts.urbanist(fontWeight: FontWeight.bold, fontSize: 16),
                        ),
                        SizedBox(
                          width: Get.width / 1.2,
                          child: Text(
                            visibilityCollection[i]["subTitle"]!,
                            maxLines: 1,
                            style: GoogleFonts.urbanist(fontSize: 14),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          const Expanded(child: Offstage()),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 10),
            child: CustomFilledButton(
              title: AppStrings.apply.tr,
              callback: () {
                final controller = Get.find<UploadVideoController>();
                controller.selectVisibility.value = _selectedVisibility;
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
