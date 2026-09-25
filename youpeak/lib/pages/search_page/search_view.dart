import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lottie/lottie.dart';
import 'package:youpeak/custom/custom_method/custom_format_number.dart';
import 'package:youpeak/custom/custom_method/custom_toast.dart';
import 'package:youpeak/custom/custom_ui/data_not_found_ui.dart';
import 'package:youpeak/custom/custom_ui/loader_ui.dart';
import 'package:youpeak/custom/custom_ui/normal_video_ui.dart';
import 'package:youpeak/custom/custom_ui/short_video_ui.dart';
import 'package:youpeak/database/database.dart';
import 'package:youpeak/database/search_history_database.dart';
import 'package:youpeak/main.dart';
import 'package:youpeak/pages/nav_subscription_page/subscribe_channel_api.dart';
import 'package:youpeak/pages/profile_page/your_channel_page/main_page/your_channel_view.dart';
import 'package:youpeak/pages/search_page/search_controller.dart';
import 'package:youpeak/pages/video_details_page/more_information_bottom_sheet.dart';
import 'package:youpeak/pages/video_details_page/more_information_model.dart';
import 'package:youpeak/pages/video_details_page/normal_video_details_view.dart';
import 'package:youpeak/pages/video_details_page/shorts_video_details_view.dart';
import 'package:youpeak/utils/colors/app_color.dart';
import 'package:youpeak/utils/icons/app_icons.dart';
import 'package:youpeak/utils/services/preview_image.dart';
import 'package:youpeak/utils/string/app_string.dart';
import 'package:youpeak/utils/style/app_style.dart';
import 'package:youpeak/utils/utils.dart';
import 'package:youpeak/widget/subscribe_premium_channel_bottom_sheet.dart';

class SearchView extends StatefulWidget {
  const SearchView({super.key, required this.isSearchShorts});

  final bool isSearchShorts;

  @override
  State<SearchView> createState() => _SearchViewState();
}

class _SearchViewState extends State<SearchView> {
  final _controller = Get.find<SearchingController>();
  final ScrollController _scrollController = ScrollController(); // નવું

  @override
  void initState() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _controller.init();
    });
    _scrollController.addListener(() {
      final maxScroll = _scrollController.position.maxScrollExtent;
      final currentScroll = _scrollController.position.pixels;
      const threshold = 200.0;

      if (currentScroll >= maxScroll - threshold) {
        _controller.loadMoreSearchData();
      }
    });

    super.initState();
  }

  @override
  void dispose() {
    _scrollController.dispose(); // dispose
    _controller.onDispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: PreferredSize(
        preferredSize: Size.fromHeight(MediaQuery.of(context).viewPadding.top + 60),
        child: Container(
          padding: EdgeInsets.only(top: MediaQuery.of(context).viewPadding.top, left: 15, right: 15),
          height: MediaQuery.of(context).viewPadding.top + 60,
          width: Get.width,
          color: AppColor.transparent,
          child: Row(
            children: [
              GestureDetector(
                onTap: Get.back,
                child: SizedBox(
                  height: 40,
                  width: 40,
                  child: Center(
                    child: Obx(
                      () => Image.asset(
                        AppIcons.arrowBack,
                        color: isDarkMode.value ? AppColor.white : AppColor.black,
                        width: 23,
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: GestureDetector(
                  onTap: () {
                    _controller.isShowHistory.value = true;
                  },
                  child: Container(
                    height: 45,
                    padding: const EdgeInsets.only(left: 15),
                    decoration: BoxDecoration(
                      color: AppColor.primaryColor.withOpacity(0.05),
                      border: Border.all(color: AppColor.primaryColor.withOpacity(0.5)),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Row(
                      children: [
                        Image.asset(
                          AppIcons.search,
                          color: Colors.grey,
                          width: 16,
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: GetBuilder<SearchingController>(
                            id: "onChanged",
                            builder: (controller) => TextFormField(
                              style: GoogleFonts.urbanist(
                                  color: isDarkMode.value ? AppColor.white : AppColor.black, fontSize: 15, fontWeight: FontWeight.bold),
                              onChanged: (value) => controller.onChanged(),
                              controller: controller.searchController,
                              decoration: InputDecoration(
                                border: InputBorder.none,
                                hintText: AppStrings.search.tr,
                                contentPadding: const EdgeInsets.only(bottom: 5),
                                hintStyle: GoogleFonts.urbanist(
                                    color: isDarkMode.value ? AppColor.grey : AppColor.grey, fontSize: 15, fontWeight: FontWeight.w500),
                              ),
                              onFieldSubmitted: (value) {
                                if (!SearchHistory.mainSearchHistory.contains(_controller.searchController.text) &&
                                    _controller.searchController.text.trim().isNotEmpty) {
                                  SearchHistory.mainSearchHistory.insert(0, _controller.searchController.text);
                                  SearchHistory.onSet();
                                }
                              },
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 18),
              GetBuilder<SearchingController>(
                id: "onClickMic",
                builder: (controller) => GestureDetector(
                  onTap: controller.onClickMic,
                  child: controller.isListening
                      ? Lottie.asset("assets/icons/mic.json", width: 45)
                      : Obx(
                          () => Image.asset(
                            AppIcons.audio,
                            color: isDarkMode.value ? AppColor.primaryColor : AppColor.primaryColor,
                            width: 45,
                          ),
                        ),
                ),
              ),
            ],
          ),
        ),
      ),
      body: Obx(
        () => _controller.isShowHistory.value
            ? const SearchHistoryWidget()
            : Column(
                children: [
                  const SizedBox(height: 10),
                  SizedBox(
                    width: Get.width,
                    height: 35,
                    child: ListView.builder(
                      padding: EdgeInsets.zero,
                      scrollDirection: Axis.horizontal,
                      itemCount: _controller.tabTitles.length,
                      itemBuilder: (context, index) => GetBuilder<SearchingController>(
                        id: "onChangeTab",
                        builder: (controller) => GestureDetector(
                          onTap: () => controller.onChangeTab(index),
                          child: Container(
                            alignment: Alignment.center,
                            padding: const EdgeInsets.symmetric(horizontal: 15),
                            margin: const EdgeInsets.only(left: 10),
                            decoration: BoxDecoration(
                              color: controller.selectedTabIndex == index ? AppColor.primaryColor : AppColor.primaryColor.withOpacity(0.08),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Text(
                              _controller.tabTitles[index],
                              style: GoogleFonts.urbanist(
                                fontSize: 14,
                                color: controller.selectedTabIndex == index
                                    ? AppColor.white
                                    : isDarkMode.value
                                        ? AppColor.white
                                        : AppColor.primaryColor,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 10),
                  GetBuilder<SearchingController>(
                    id: "onChangeTab",
                    builder: (controller) => GetBuilder<SearchingController>(
                      id: "onGetSearchData",
                      builder: (logic) => controller.selectedTabIndex == 0
                          ? SearchAllWidget(scrollController: _scrollController)
                          : controller.selectedTabIndex == 1
                              ? SearchChannelWidget(scrollController: _scrollController)
                              : controller.selectedTabIndex == 2
                                  ? SearchVideoWidget(scrollController: _scrollController)
                                  : SearchShortsWidget(scrollController: _scrollController),
                    ),
                  ),
                ],
              ),
      ),
    );
  }
}

class SearchAllWidget extends StatelessWidget {
  const SearchAllWidget({super.key, required this.scrollController});
  final ScrollController scrollController;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GetBuilder<SearchingController>(
        id: "onGetSearchData",
        builder: (controller) => controller.isLoading
            ? const LoaderUi()
            : controller.searchVideo.isEmpty
                ? controller.searchShorts.isNotEmpty
                    ? const Align(alignment: Alignment.topCenter, child: ShortsWidget())
                    : Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Image.asset(AppIcons.isEmpty, width: 250),
                            const SizedBox(height: 30),
                            Text(
                              AppStrings.dataNotFound.tr,
                              style: GoogleFonts.urbanist(
                                fontSize: 15,
                                fontWeight: FontWeight.bold,
                                color: const Color(0xFF757575),
                              ),
                            ),
                          ],
                        ),
                      )
                : SingleChildScrollView(
                    controller: scrollController,
                    child: Column(
                      children: [
                        ListView.separated(
                          shrinkWrap: true,
                          itemCount: controller.searchVideo.length,
                          physics: const NeverScrollableScrollPhysics(),
                          scrollDirection: Axis.vertical,
                          padding: const EdgeInsets.symmetric(vertical: 10),
                          itemBuilder: (context, index) {
                            final indexData = controller.searchVideo[index];
                            return (indexData.channelId != Database.channelId && ((indexData.videoPrivacyType == 2 && indexData.channelType == 1) ||
                                    (indexData.videoPrivacyType == 2 && indexData.channelType == 2 && indexData.isSubscribed == false)))
                                ? PrivateContentNormalVideoUi(
                                    videoId: indexData.id ?? "",
                                    title: indexData.title ?? "",
                                    videoImage: indexData.videoImage ?? "",
                                    videoUrl: indexData.videoUrl ?? "",
                                    videoTime: indexData.videoTime ?? 0,
                                    channelId: indexData.channelId ?? "",
                                    channelImage: indexData.channelImage ?? "",
                                    channelName: indexData.channelName ?? "",
                                    views: indexData.views ?? 0,
                                    uploadTime: indexData.time ?? "",
                                    isSave: indexData.isSaveToWatchLater ?? false,
                                    subscribeCallback: () => controller.onSubscribePrivateChannel(index: index, context: context, isShorts: false),
                                    videoCallback: () => controller.onUnlockPrivateVideo(index: index, context: context, isShorts: false),
                                    videoCost: indexData.videoUnlockCost?.toInt() ?? 0,
                                    subscribeCost: indexData.subscriptionCost?.toInt() ?? 0,
                                    channelType: indexData.channelType ?? 1,
                                  )
                                : GestureDetector(
                                    onTap: () {
                                      FocusManager.instance.primaryFocus?.unfocus();
                                      Get.to(NormalVideoDetailsView(
                                        videoId: indexData.id ?? "",
                                        videoUrl: indexData.videoUrl ?? "",
                                        cost: indexData.subscriptionCost,
                                      ));
                                    },
                                    child: NormalVideoUi(
                                      videoId: indexData.id ?? "",
                                      title: indexData.title ?? "",
                                      videoImage: indexData.videoImage ?? "",
                                      videoUrl: indexData.videoUrl ?? "",
                                      videoTime: indexData.videoTime ?? 0,
                                      channelId: indexData.channelId ?? "",
                                      channelImage: indexData.channelImage ?? "",
                                      channelName: indexData.channelName ?? "",
                                      views: indexData.views ?? 0,
                                      uploadTime: indexData.time ?? "",
                                      isSave: indexData.isSaveToWatchLater ?? false,
                                    ),
                                  );
                          },
                          separatorBuilder: (context, index) => Visibility(
                            visible: controller.searchShorts.isNotEmpty && index == 0,
                            child: const ShortsWidget(),
                          ),
                        ),
                        GetBuilder<SearchingController>(
                          id: "onChangeLoadMore",
                          builder: (ctrl) => ctrl.isLoadingMore
                              ? const Padding(
                                  padding: EdgeInsets.all(16),
                                  child: Center(
                                      child: CircularProgressIndicator(
                                    color: AppColor.primaryColor,
                                  )),
                                )
                              : const SizedBox.shrink(),
                        ),
                      ],
                    ),
                  ),
      ),
    );
  }
}

class ShortsWidget extends StatelessWidget {
  const ShortsWidget({super.key});

  @override
  Widget build(BuildContext context) {
    final controller = Get.find<SearchingController>();
    return SizedBox(
      height: 280,
      width: Get.width,
      child: GetBuilder<SearchingController>(
        id: "onGetSearchData",
        builder: (controller) => SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: ListView.builder(
            itemCount: controller.searchShorts.length,
            scrollDirection: Axis.horizontal,
            shrinkWrap: true,
            physics: const BouncingScrollPhysics(),
            padding: const EdgeInsets.only(left: 10, top: 0, bottom: 15),
            itemBuilder: (BuildContext context, int index) {
              final indexData = controller.searchShorts[index];
              return (indexData.channelId != Database.channelId && ((indexData.videoPrivacyType == 2 && indexData.channelType == 1) ||
                      (indexData.videoPrivacyType == 2 && indexData.channelType == 2 && indexData.isSubscribed == false)))
                  ? ShortsPrivateContentWidget(
                      id: indexData.id ?? "",
                      image: indexData.videoImage ?? "",
                      subscribe: () => controller.onSubscribePrivateChannel(index: index, context: context, isShorts: true),
                      unlock: () => controller.onUnlockPrivateVideo(index: index, context: context, isShorts: true),
                      subscribeCoin: indexData.subscriptionCost?.toInt() ?? 0,
                      unlockCoin: indexData.videoUnlockCost?.toInt() ?? 0,
                      title: indexData.title ?? "",
                      views: indexData.views ?? 0,
                      channelType: indexData.channelType ?? 1,
                    )
                  : GestureDetector(
                      onTap: () {
                        FocusManager.instance.primaryFocus?.unfocus();
                        Get.to(
                          ShortsVideoDetailsView(
                            previousPageIsSearch: true,
                            videoId: indexData.id ?? "",
                            videoUrl: indexData.videoUrl ?? "",
                          ),
                        );
                      },
                      child: ShortVideoUi(
                        videoId: indexData.id ?? "",
                        title: indexData.title ?? "",
                        videoImage: indexData.videoImage ?? "",
                        videoUrl: indexData.videoUrl ?? "",
                        views: indexData.views ?? 0,
                        channelId: indexData.channelId ?? "",
                        videoTime: indexData.videoTime?.toInt() ?? 0,
                        channelName: indexData.channelName ?? "",
                        isSave: indexData.isSaveToWatchLater ?? false,
                      ),
                    );
            },
          ),
        ),
      ),
    );
  }
}

class SearchChannelWidget extends StatelessWidget {
  const SearchChannelWidget({super.key, required this.scrollController});
  final ScrollController scrollController;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GetBuilder<SearchingController>(
        id: "onGetSearchData",
        builder: (controller) => controller.isLoading
            ? const LoaderUi()
            : controller.searchChannel.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Image.asset(AppIcons.isEmpty, width: 250),
                        const SizedBox(height: 30),
                        Text(
                          AppStrings.dataNotFound.tr,
                          style: GoogleFonts.urbanist(
                            fontSize: 15,
                            fontWeight: FontWeight.bold,
                            color: const Color(0xFF757575),
                          ),
                        ),
                      ],
                    ),
                  )
                : SingleChildScrollView(
                    controller: scrollController,
                    child: Column(
                      children: [
                        ListView.builder(
                          shrinkWrap: true,
                          itemCount: controller.searchChannel.length,
                          physics: const NeverScrollableScrollPhysics(),
                          scrollDirection: Axis.vertical,
                          padding: const EdgeInsets.symmetric(vertical: 10),
                          itemBuilder: (context, index) {
                            final indexData = controller.searchChannel[index];
                            return ChannelListTileWidget(indexData: indexData);
                          },
                        ),
                        GetBuilder<SearchingController>(
                          id: "onChangeLoadMore",
                          builder: (ctrl) => ctrl.isLoadingMore
                              ? const Padding(
                                  padding: EdgeInsets.all(16),
                                  child: Center(
                                      child: CircularProgressIndicator(
                                    color: AppColor.primaryColor,
                                  )),
                                )
                              : const SizedBox.shrink(),
                        ),
                      ],
                    ),
                  ),
      ),
    );
  }
}

class SearchShortsWidget extends StatelessWidget {
  const SearchShortsWidget({super.key, required this.scrollController});
  final ScrollController scrollController;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GetBuilder<SearchingController>(
        id: "onGetSearchData",
        builder: (controller) => controller.isLoading
            ? const LoaderUi()
            : controller.searchShorts.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Image.asset(AppIcons.isEmpty, width: 250),
                        const SizedBox(height: 30),
                        Text(
                          AppStrings.dataNotFound.tr,
                          style: GoogleFonts.urbanist(
                            fontSize: 15,
                            fontWeight: FontWeight.bold,
                            color: const Color(0xFF757575),
                          ),
                        ),
                      ],
                    ),
                  )
                : SingleChildScrollView(
                    controller: scrollController,
                    physics: const BouncingScrollPhysics(),
                    child: Column(
                      children: [
                        GridView.builder(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          itemCount: controller.searchShorts.length,
                          padding: const EdgeInsets.only(left: 10, top: 8.5, right: 10, bottom: 10),
                          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                              crossAxisCount: 2, mainAxisSpacing: 10, crossAxisSpacing: 10, mainAxisExtent: 280),
                          itemBuilder: (context, index) {
                            final indexData = controller.searchShorts[index];
                            return (indexData.channelId != Database.channelId && ((indexData.videoPrivacyType == 2 && indexData.channelType == 1) ||
                                    (indexData.videoPrivacyType == 2 && indexData.channelType == 2 && indexData.isSubscribed == false)))
                                ? ShortsPrivateContentWidget(
                                    id: indexData.id ?? "",
                                    image: indexData.videoImage ?? "",
                                    subscribe: () => controller.onSubscribePrivateChannel(index: index, context: context, isShorts: true),
                                    unlock: () => controller.onUnlockPrivateVideo(index: index, context: context, isShorts: true),
                                    subscribeCoin: indexData.subscriptionCost?.toInt() ?? 0,
                                    unlockCoin: indexData.videoUnlockCost?.toInt() ?? 0,
                                    title: indexData.title ?? "",
                                    views: indexData.views ?? 0,
                                    channelType: indexData.channelType ?? 1,
                                  )
                                : GestureDetector(
                                    onTap: () {
                                      FocusManager.instance.primaryFocus?.unfocus();
                                      Get.to(
                                        ShortsVideoDetailsView(
                                          previousPageIsSearch: true,
                                          videoId: indexData.id ?? "",
                                          videoUrl: indexData.videoUrl ?? "",
                                        ),
                                      );
                                    },
                                    child: Container(
                                      height: 280,
                                      width: 165,
                                      clipBehavior: Clip.antiAlias,
                                      decoration: BoxDecoration(
                                          color: isDarkMode.value ? AppColor.secondDarkMode : AppColor.grey_400,
                                          borderRadius: BorderRadius.circular(20)),
                                      child: Stack(
                                        children: [
                                          PreviewVideoImage(videoId: indexData.id ?? "", videoImage: indexData.videoImage ?? ""),
                                          Positioned(
                                            top: 10,
                                            right: 10,
                                            child: GestureDetector(
                                                onTap: () => MoreInfoBottomSheet.show(
                                                      context,
                                                      MoreInformationModel(
                                                        videoId: indexData.id ?? "",
                                                        title: indexData.title ?? '',
                                                        videoType: indexData.videoType ?? 0,
                                                        videoTime: indexData.videoTime?.toInt() ?? 0,
                                                        videoUrl: indexData.videoUrl ?? "",
                                                        channelName: indexData.channelName ?? "",
                                                        channelId: indexData.channelId ?? "",
                                                        videoImage: indexData.videoImage ?? "",
                                                        views: indexData.views ?? 0,
                                                        isSave: indexData.isSaveToWatchLater ?? false,
                                                      ),
                                                      true,
                                                    ),
                                                child: const Icon(Icons.more_vert, color: AppColor.white)),
                                          ),
                                          Positioned(
                                            bottom: 0,
                                            left: 10,
                                            child: Column(
                                              crossAxisAlignment: CrossAxisAlignment.start,
                                              children: [
                                                SizedBox(
                                                  width: 145,
                                                  child: Text(
                                                    indexData.title.toString(),
                                                    maxLines: 3,
                                                    style: shortsStyle,
                                                  ),
                                                ),
                                                const SizedBox(height: 10),
                                                Text(
                                                  "${indexData.views.toString()} Views",
                                                  style: shortsStyle,
                                                ),
                                                const SizedBox(height: 10),
                                              ],
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  );
                          },
                        ),
                        GetBuilder<SearchingController>(
                          id: "onChangeLoadMore",
                          builder: (ctrl) => ctrl.isLoadingMore
                              ? const Padding(
                                  padding: EdgeInsets.all(16),
                                  child: Center(
                                      child: CircularProgressIndicator(
                                    color: AppColor.primaryColor,
                                  )),
                                )
                              : const SizedBox.shrink(),
                        ),
                      ],
                    ),
                  ),
      ),
    );
  }
}

class SearchVideoWidget extends StatelessWidget {
  const SearchVideoWidget({super.key, required this.scrollController});
  final ScrollController scrollController;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GetBuilder<SearchingController>(
        id: "onGetSearchData",
        builder: (controller) => controller.isLoading
            ? const LoaderUi()
            : controller.searchVideo.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Image.asset(AppIcons.isEmpty, width: 250),
                        const SizedBox(height: 30),
                        Text(
                          AppStrings.dataNotFound.tr,
                          style: GoogleFonts.urbanist(
                            fontSize: 15,
                            fontWeight: FontWeight.bold,
                            color: const Color(0xFF757575),
                          ),
                        ),
                      ],
                    ),
                  )
                : SingleChildScrollView(
                    controller: scrollController,
                    physics: const BouncingScrollPhysics(),
                    child: Column(
                      children: [
                        ListView.builder(
                          shrinkWrap: true,
                          itemCount: controller.searchVideo.length,
                          physics: const NeverScrollableScrollPhysics(),
                          scrollDirection: Axis.vertical,
                          padding: const EdgeInsets.symmetric(vertical: 10),
                          itemBuilder: (context, index) {
                            final indexData = controller.searchVideo[index];
                            return (indexData.channelId != Database.channelId && ((indexData.videoPrivacyType == 2 && indexData.channelType == 1) ||
                                    (indexData.videoPrivacyType == 2 && indexData.channelType == 2 && indexData.isSubscribed == false)))
                                ? PrivateContentNormalVideoUi(
                                    videoId: indexData.id ?? "",
                                    title: indexData.title ?? "",
                                    videoImage: indexData.videoImage ?? "",
                                    videoUrl: indexData.videoUrl ?? "",
                                    videoTime: indexData.videoTime ?? 0,
                                    channelId: indexData.channelId ?? "",
                                    channelImage: indexData.channelImage ?? "",
                                    channelName: indexData.channelName ?? "",
                                    views: indexData.views ?? 0,
                                    uploadTime: indexData.time ?? "",
                                    isSave: indexData.isSaveToWatchLater ?? false,
                                    subscribeCallback: () => controller.onSubscribePrivateChannel(index: index, context: context, isShorts: false),
                                    videoCallback: () => controller.onUnlockPrivateVideo(index: index, context: context, isShorts: false),
                                    videoCost: indexData.videoUnlockCost?.toInt() ?? 0,
                                    subscribeCost: indexData.subscriptionCost?.toInt() ?? 0,
                                    channelType: indexData.channelType ?? 1,
                                  )
                                : GestureDetector(
                                    onTap: () {
                                      FocusManager.instance.primaryFocus?.unfocus();
                                      Get.to(NormalVideoDetailsView(
                                        videoId: indexData.id ?? "",
                                        videoUrl: indexData.videoUrl ?? "",
                                        cost: indexData.subscriptionCost,
                                      ));
                                    },
                                    child: NormalVideoUi(
                                      videoId: indexData.id ?? "",
                                      title: indexData.title ?? "",
                                      videoImage: indexData.videoImage ?? "",
                                      videoUrl: indexData.videoUrl ?? "",
                                      videoTime: indexData.videoTime ?? 0,
                                      channelId: indexData.channelId ?? "",
                                      channelImage: indexData.channelImage ?? "",
                                      channelName: indexData.channelName ?? "",
                                      views: indexData.views ?? 0,
                                      uploadTime: indexData.time ?? "",
                                      isSave: indexData.isSaveToWatchLater ?? false,
                                    ),
                                  );
                          },
                        ),
                        GetBuilder<SearchingController>(
                          id: "onChangeLoadMore",
                          builder: (ctrl) => ctrl.isLoadingMore
                              ? const Padding(
                                  padding: EdgeInsets.all(16),
                                  child: Center(
                                      child: CircularProgressIndicator(
                                    color: AppColor.primaryColor,
                                  )),
                                )
                              : const SizedBox.shrink(),
                        ),
                      ],
                    ),
                  ),
      ),
    );
  }
}

class ChannelListTileWidget extends StatefulWidget {
  const ChannelListTileWidget({super.key, this.indexData});

  final dynamic indexData;
  @override
  State<ChannelListTileWidget> createState() => _ChannelListTileWidgetState();
}

class _ChannelListTileWidgetState extends State<ChannelListTileWidget> {
  RxBool isSubscribed = false.obs;

  @override
  void initState() {
    isSubscribed.value = widget.indexData.isSubscribed ?? false;
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
        onTap: () {
          FocusManager.instance.primaryFocus?.unfocus();
          Get.to(() => YourChannelView(loginUserId: Database.loginUserId ?? "", channelId: widget.indexData.channelId ?? ""));
        },
        child: Container(
          height: 50,
          width: Get.width,
          margin: const EdgeInsets.only(bottom: 18),
          color: Colors.transparent,
          child: Row(
            children: [
              const SizedBox(width: 10),
              PreviewProfileImage(
                size: 45,
                id: widget.indexData.channelId ?? "",
                image: widget.indexData.image ?? "",
                fit: BoxFit.cover,
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Flexible(
                      child: Text(
                        widget.indexData.fullName.toString(),
                        style: GoogleFonts.urbanist(fontSize: 18, fontWeight: FontWeight.bold),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    Text(
                      "${widget.indexData.totalSubscribers}  Subscribers - ${widget.indexData.totalVideos} Videos",
                      style: GoogleFonts.urbanist(fontSize: 13, color: AppColor.grey),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 10),
              Visibility(
                visible: Database.channelId != widget.indexData.channelId,
                child: widget.indexData.channelType == 2
                    ? GestureDetector(
                        onTap: () async {
                          if (isSubscribed.value == false) {
                            SubscribePremiumChannelBottomSheet.onShow(
                              coin: (widget.indexData.subscriptionCost ?? 0).toString(),
                              callback: () async {
                                Get.dialog(const LoaderUi(), barrierDismissible: false);
                                final bool isSuccess = await SubscribeChannelApiClass.callApi(widget.indexData.channelId ?? "");

                                Get.close(2);

                                if (isSuccess) {
                                  isSubscribed.value = !isSubscribed.value;
                                }
                              },
                            );
                          } else {
                            isSubscribed.value = !isSubscribed.value;
                            await SubscribeChannelApiClass.callApi(widget.indexData.channelId.toString());
                          }
                        },
                        child: Obx(
                          () => Container(
                            height: 40,
                            width: isSubscribed.value ? 100 : 150,
                            alignment: Alignment.center,
                            decoration: BoxDecoration(
                              color: isSubscribed.value ? Colors.transparent : AppColor.primaryColor,
                              border: isSubscribed.value ? Border.all(color: AppColor.primaryColor, width: 1.5) : null,
                              borderRadius: BorderRadius.circular(100),
                            ),
                            child: isSubscribed.value
                                ? Text(
                                    "Subscribed",
                                    textAlign: TextAlign.center,
                                    style: GoogleFonts.urbanist(
                                      fontWeight: FontWeight.w600,
                                      fontSize: 14,
                                      color: isSubscribed.value ? AppColor.primaryColor : AppColor.white,
                                    ),
                                  )
                                : Row(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Text(
                                        "Subscribe",
                                        textAlign: TextAlign.center,
                                        style: GoogleFonts.urbanist(
                                          fontWeight: FontWeight.w600,
                                          fontSize: 14,
                                          color: isSubscribed.value ? AppColor.primaryColor : AppColor.white,
                                        ),
                                      ),
                                      8.width,
                                      Image.asset(AppIcons.coin, width: 15),
                                      Text(
                                        " ${CustomFormatNumber.convert(widget.indexData.subscriptionCost ?? 0)}/m",
                                        textAlign: TextAlign.center,
                                        style: GoogleFonts.urbanist(
                                          fontWeight: FontWeight.w600,
                                          fontSize: 14,
                                          color: isSubscribed.value ? AppColor.primaryColor : AppColor.white,
                                        ),
                                      ),
                                    ],
                                  ),
                          ),
                        ),
                      )
                    : GestureDetector(
                        onTap: () async {
                          isSubscribed.value = !isSubscribed.value;
                          await SubscribeChannelApiClass.callApi(widget.indexData.channelId.toString());
                        },
                        child: Obx(
                          () => Container(
                            height: 40,
                            width: 100,
                            alignment: Alignment.center,
                            decoration: BoxDecoration(
                              color: isSubscribed.value ? Colors.transparent : AppColor.primaryColor,
                              border: isSubscribed.value ? Border.all(color: AppColor.primaryColor, width: 1.5) : null,
                              borderRadius: BorderRadius.circular(100),
                            ),
                            child: Text(
                              isSubscribed.value ? "Subscribed" : "Subscribe",
                              textAlign: TextAlign.center,
                              style: GoogleFonts.urbanist(
                                fontWeight: FontWeight.w600,
                                fontSize: 14,
                                color: isSubscribed.value ? AppColor.primaryColor : AppColor.white,
                              ),
                            ),
                          ),
                        ),
                      ),
              ),
              const SizedBox(width: 10),
            ],
          ),
        ));
  }
}

class SearchHistoryWidget extends GetView<SearchingController> {
  const SearchHistoryWidget({super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                AppStrings.searchHistory.tr,
                style: GoogleFonts.urbanist(fontSize: 15, fontWeight: FontWeight.bold, color: const Color(0xFF757575)),
              ),
              GestureDetector(
                onTap: () {
                  if (SearchHistory.mainSearchHistory.isNotEmpty) {
                    SearchHistory.mainSearchHistory.clear();
                    SearchHistory.onSet();
                    CustomToast.show("Your History Clean Success");
                  }
                },
                child: Obx(
                  () => Text(
                    AppStrings.clearAll.tr,
                    style: GoogleFonts.urbanist(
                      fontSize: 15,
                      fontWeight: FontWeight.bold,
                      color: SearchHistory.mainSearchHistory.isEmpty ? AppColor.grey : AppColor.primaryColor,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
        Obx(
          () => SearchHistory.mainSearchHistory.isEmpty
              ? const Expanded(child: DataNotFoundUi(type: EmptyStateType.search))
              : SizedBox(
                  height: Get.height / 3,
                  child: ListView.builder(
                    itemCount: SearchHistory.mainSearchHistory.length,
                    padding: const EdgeInsets.all(10),
                    itemBuilder: (context, index) => Padding(
                      padding: const EdgeInsets.only(bottom: 12, left: 10, right: 10),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          GestureDetector(
                            onTap: () async {
                              controller.searchController.text = SearchHistory.mainSearchHistory[index];
                              controller.onGetSearchData();
                              FocusScope.of(context).unfocus();
                              controller.isShowHistory.value = false;
                            },
                            child: Text(
                              SearchHistory.mainSearchHistory[index],
                              style: GoogleFonts.urbanist(
                                fontSize: 15,
                                fontWeight: FontWeight.bold,
                                color: const Color(0xFF757575),
                              ),
                            ),
                          ),
                          GestureDetector(
                            onTap: () {
                              SearchHistory.mainSearchHistory.removeAt(index);
                              SearchHistory.onSet();
                            },
                            child: const Icon(Icons.close, color: AppColor.grey),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
        ),
      ],
    );
  }
}
