import 'package:youpeak/core/platform/responsive.dart';
import 'package:youpeak/shared/widgets/option_tile.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:youpeak/shared/widgets/basic_button.dart';
import 'package:youpeak/shared/widgets/custom_filled_button.dart';
import 'package:youpeak/features/upload/controller/upload_video_controller.dart';
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
      {"title": AppStrings.private.tr, "subTitle": "Only you can view it"},
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
            OptionTile(
              title: visibilityCollection[i]["title"]!,
              subtitle: visibilityCollection[i]["subTitle"],
              selected: _selectedVisibility == i,
              onTap: () => setState(() => _selectedVisibility = i),
            ),
          // Phones pin Apply to the bottom; on a wide page it sits under the options.
          if (PageWidth.of(context) < Responsive.inlineActionFrom) const Expanded(child: Offstage()) else const SizedBox(height: 24),
          ActionWidth(
            child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 10),
            child: CustomFilledButton(
              title: AppStrings.apply.tr,
              callback: () {
                final controller = Get.find<UploadVideoController>();
                controller.selectVisibility.value = _selectedVisibility;
                Get.back();
              },
            ),
          )),
          const SizedBox(height: 10),
        ],
      ),
    );
  }
}
