import 'package:flutter/material.dart';
import 'package:youpeak/custom/custom_ui/app_artwork.dart';
import 'package:youpeak/utils/icons/app_visuals.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/custom/custom_ui/data_not_found_ui.dart';
import 'package:youpeak/custom/custom_ui/loader_ui.dart';
import 'package:youpeak/main.dart';
import 'package:youpeak/pages/profile_page/help_center_page/help_center_controller.dart';
import 'package:youpeak/utils/colors/app_color.dart';
import 'package:youpeak/utils/config/size_config.dart';
import 'package:youpeak/utils/icons/app_icons.dart';
import 'package:youpeak/utils/services/preview_image.dart';
import 'package:youpeak/utils/settings/app_settings.dart';
import 'package:youpeak/utils/string/app_string.dart';
import 'package:youpeak/utils/style/app_style.dart';

class HelpCenterView extends StatefulWidget {
  const HelpCenterView({super.key});

  @override
  State<HelpCenterView> createState() => _HelpCenterViewState();
}

class _HelpCenterViewState extends State<HelpCenterView> with SingleTickerProviderStateMixin {
  TabController? _tabController;

  final controller = Get.put(HelpCenterController());

  @override
  void initState() {
    _tabController = TabController(length: 2, vsync: this, initialIndex: 0);
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        leading: Container(
          padding: EdgeInsets.only(left: SizeConfig.blockSizeHorizontal * 2),
          alignment: Alignment.topLeft,
          child: IconButton(
            icon: Image(
              height: 18,
              width: 18,
              image: const AssetImage(AppIcons.arrowBack),
              color: isDarkMode.value ? AppColor.white : AppColor.black,
            ),
            onPressed: () => Get.back(),
          ),
        ),
        elevation: 0,
        centerTitle: AppSettings.isCenterTitle,
        title: Text(
          AppStrings.helpCenter.tr,
          style: GoogleFonts.urbanist(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        bottom: TabBar(
          labelColor: AppColor.primaryColor,
          indicatorColor: AppColor.primaryColor,
          controller: _tabController,
          labelStyle: labelStyle,
          unselectedLabelColor: AppColor.grey,
          tabs: [
            Tab(text: AppStrings.faq.tr),
            Tab(text: AppStrings.contactUs.tr),
          ],
        ),
      ),
      body: TabBarView(controller: _tabController, children: const [
        FAQ(),
        CONTACT(),
      ]),
    );
  }
}

class FAQ extends StatelessWidget {
  const FAQ({super.key});

  @override
  Widget build(BuildContext context) {
    return GetBuilder<HelpCenterController>(
      id: "onGetFAQ",
      builder: (controller) => controller.faqCollection == null
          ? const LoaderUi()
          : (controller.faqCollection?.isEmpty ?? true)
              ? const DataNotFoundUi()
              : Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 15),
                  child: SingleChildScrollView(
                    physics: const BouncingScrollPhysics(),
                    child: Column(children: [
                    const FeatureArtwork(asset: AppVisuals.helpHero),
                    ListView.builder(
                      padding: const EdgeInsets.only(top: 10),
                      physics: const NeverScrollableScrollPhysics(),
                      shrinkWrap: true,
                      itemCount: controller.faqCollection?.length ?? 0,
                      itemBuilder: (context, index) {
                        return Column(
                          children: [
                            Theme(
                              data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
                              child: SizedBox(
                                child: ExpansionTile(
                                  controller: ExpansionTileController(),
                                  childrenPadding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
                                  backgroundColor: isDarkMode.value ? AppColor.secondDarkMode : AppColor.white,
                                  title: Text("${controller.faqCollection![index].question}", style: titalstyle6),
                                  children: [
                                    Text(
                                      "${controller.faqCollection![index].answer}",
                                      style: answerStyle,
                                    )
                                  ],
                                ),
                              ),
                            ),
                          ],
                        );
                      },
                    ),
                    ]),
                  ),
                ),
    );
  }
}

class CONTACT extends StatelessWidget {
  const CONTACT({super.key});

  @override
  Widget build(BuildContext context) {
    return GetBuilder<HelpCenterController>(
      id: "onGetContact",
      builder: (controller) => controller.contactCollection == null
          ? const LoaderUi()
          : (controller.contactCollection?.isEmpty ?? true)
              ? const DataNotFoundUi()
              : Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 15),
                  child: SingleChildScrollView(
                    physics: const BouncingScrollPhysics(),
                    child: ListView.builder(
                      padding: const EdgeInsets.only(top: 10),
                      physics: const NeverScrollableScrollPhysics(),
                      shrinkWrap: true,
                      itemCount: controller.contactCollection?.length ?? 0,
                      itemBuilder: (context, index) {
                        return GestureDetector(
                          onTap: () => controller.onTapContact(Uri.parse(controller.contactCollection![index].link!)),
                          child: Container(
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(10.0),
                              color: isDarkMode.value ? AppColor.secondDarkMode : AppColor.white,
                            ),
                            padding: const EdgeInsets.all(10),
                            margin: EdgeInsets.only(top: SizeConfig.blockSizeVertical * 2),
                            child: Row(
                              children: [
                                SizedBox(
                                  height: 55,
                                  width: 55,
                                  child: PreviewVideoImage(
                                    videoId: controller.contactCollection![index].id!,
                                    videoImage: controller.contactCollection![index].image!,
                                    fit: BoxFit.contain,
                                  ),
                                ),
                                const SizedBox(width: 20),
                                Text(controller.contactCollection![index].name.toString(), style: titalstyle6),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                ),
    );
  }
}
