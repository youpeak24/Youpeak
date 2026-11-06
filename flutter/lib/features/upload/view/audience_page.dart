import 'package:youpeak/core/platform/responsive.dart';
import 'package:youpeak/shared/widgets/option_tile.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:youpeak/shared/widgets/basic_button.dart';
import 'package:youpeak/shared/widgets/custom_filled_button.dart';
import 'package:youpeak/features/upload/controller/upload_video_controller.dart';
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
          for (int i = 0; i < audienceCollection.length; i++)
            OptionTile(
              title: audienceCollection[i],
              selected: _selectedAudience == i,
              onTap: () => setState(() => _selectedAudience = i),
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
                controller.selectAudience.value = _selectedAudience;
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
