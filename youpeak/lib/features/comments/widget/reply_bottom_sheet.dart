import 'package:flutter/material.dart';
import 'package:youpeak/shared/widgets/youpeak_emoji.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/shared/widgets/loader_ui.dart';
import 'package:youpeak/features/comments/widget/comment_shimmer_ui.dart';
import 'package:youpeak/core/storage/database/database.dart';
import 'package:youpeak/main.dart';
import 'package:youpeak/features/comments/controller/comment_controller.dart';
import 'package:youpeak/features/comments/api/create_reply_api.dart';
import 'package:youpeak/features/comments/controller/reply_controller.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:youpeak/core/config/size_config.dart';
import 'package:youpeak/core/assets/app_icons.dart';
import 'package:youpeak/shared/widgets/preview_image.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'package:youpeak/core/constants/app_string.dart';
import 'package:youpeak/core/theme/app_style.dart';

class ReplyBottomSheet {
  static RxInt afterChangeTotalReply = 0.obs;

  static final _controller = Get.find<RepliesController>();
  static final _commentController = Get.find<CommentController>();

  static Future<int> show(BuildContext context, int commentIndex, String videoId, String commentId, int previousTotalReplies) async {
    afterChangeTotalReply.value = previousTotalReplies;

    // ScrollController add કરો
    final ScrollController scrollController = ScrollController();

    scrollController.addListener(() {
      final maxScroll = scrollController.position.maxScrollExtent;
      final currentScroll = scrollController.position.pixels;
      const threshold = 200.0;

      if (currentScroll >= maxScroll - threshold) {
        _controller.loadMoreReplies(Database.loginUserId!, videoId, commentId);
      }
    });

    _controller.mainReplies.clear();
    _controller.customChanges.clear();

    if (previousTotalReplies != 0) {
      _controller.onCheckReplies(true);

      _controller.getAllReplies(Database.loginUserId!, videoId, commentId);
    } else {
      _controller.onCheckReplies(false);
    }

    await Get.bottomSheet(
      Container(
        padding: EdgeInsets.only(left: SizeConfig.blockSizeHorizontal * 4, right: SizeConfig.blockSizeHorizontal * 3),
        height: SizeConfig.screenHeight / 1.3,
        child: Column(
          children: [
            const SizedBox(height: 10),
            Container(
              width: SizeConfig.blockSizeHorizontal * 12,
              height: 3,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(60),
                color: AppColor.grey_100,
              ),
            ),
            SizedBox(height: SizeConfig.blockSizeVertical * 1),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(AppStrings.replies.tr, style: profileTitleStyle),
                IconButton(
                  onPressed: () => Get.back(),
                  icon: const ImageIcon(AssetImage(AppIcons.remove), size: 30),
                ),
              ],
            ),
            const Divider(indent: 5, endIndent: 5),
            Column(
              children: [
                Row(
                  children: [
                    PreviewProfileImage(
                      size: 30,
                      id: _commentController.mainComments[_commentController.selectedCommentType][commentIndex].id ?? "",
                      image: _commentController.mainComments[_commentController.selectedCommentType][commentIndex].userImage ?? "",
                      fit: BoxFit.cover,
                    ),
                    SizedBox(width: SizeConfig.blockSizeHorizontal * 3),
                    Flexible(
                      fit: FlexFit.loose,
                      child: Text(
                        _commentController.mainComments[_commentController.selectedCommentType][commentIndex].fullName!,
                        style: GoogleFonts.urbanist(fontWeight: FontWeight.bold),
                      ),
                    ),
                    SizedBox(width: SizeConfig.blockSizeHorizontal * 3),
                    Text(
                      " •  ${_commentController.mainComments[_commentController.selectedCommentType][commentIndex].time!}",
                      style: GoogleFonts.urbanist(fontSize: 13),
                    ),
                  ],
                ),
                SizedBox(height: SizeConfig.blockSizeVertical * 2),
                SizedBox(
                  width: SizeConfig.screenWidth / 1.1,
                  child: EmojiText(_commentController.mainComments[_commentController.selectedCommentType][commentIndex].commentText!,
                      style: GoogleFonts.urbanist(), maxLines: 3, overflow: TextOverflow.ellipsis),
                ),
                SizedBox(height: SizeConfig.blockSizeVertical * 2),
                Row(
                  children: [
                    GetBuilder<CommentController>(
                      id: "onChangeLike",
                      builder: (controller) => GestureDetector(
                        onTap: () async => controller.onPressLike(videoId, commentIndex),
                        child: Container(
                          width: 50,
                          height: 50,
                          color: Colors.transparent,
                          child: Row(
                            children: [
                              ImageIcon(
                                AssetImage(
                                  controller.customChanges[_commentController.selectedCommentType][commentIndex]["isLike"]
                                      ? AppIcons.likeBold
                                      : AppIcons.like,
                                ),
                                color: controller.customChanges[_commentController.selectedCommentType][commentIndex]["isLike"]
                                    ? AppColor.primaryColor
                                    : null,
                                size: 17,
                              ),
                              SizedBox(width: SizeConfig.blockSizeHorizontal * 3),
                              Text(
                                controller.customChanges[_commentController.selectedCommentType][commentIndex]["like"].toString(),
                                style: GoogleFonts.urbanist(fontSize: 13),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                    GetBuilder<CommentController>(
                      id: "onChangeDisLike",
                      builder: (controller) => GestureDetector(
                        onTap: () async => controller.onPressDisLike(videoId, commentIndex),
                        child: Container(
                          width: 50,
                          height: 50,
                          color: Colors.transparent,
                          child: Row(
                            children: [
                              ImageIcon(
                                AssetImage(
                                  controller.customChanges[_commentController.selectedCommentType][commentIndex]["isDisLike"]
                                      ? AppIcons.disLikeBold
                                      : AppIcons.disLike,
                                ),
                                color: controller.customChanges[_commentController.selectedCommentType][commentIndex]["isDisLike"]
                                    ? AppColor.primaryColor
                                    : null,
                                size: 17,
                              ),
                              SizedBox(width: SizeConfig.blockSizeHorizontal * 3),
                              Text(
                                controller.customChanges[_commentController.selectedCommentType][commentIndex]["disLike"].toString(),
                                style: GoogleFonts.urbanist(fontSize: 13),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                    const ImageIcon(AssetImage(AppIcons.reply), size: 17),
                    SizedBox(width: SizeConfig.blockSizeHorizontal * 3),
                    Obx(
                      () => Text(
                        afterChangeTotalReply.value.toString(),
                        style: GoogleFonts.urbanist(fontSize: 13),
                      ),
                    ),
                  ],
                ),
                const Divider(indent: 5, endIndent: 5),
                SizedBox(height: SizeConfig.blockSizeVertical * 1),
              ],
            ),
            EmojiQuickBar(size: 26, onPick: (emoji) => EmojiQuickBar.insertInto(_controller.repliesController, emoji)),
            Row(
              crossAxisAlignment: CrossAxisAlignment.center,
              mainAxisAlignment: MainAxisAlignment.start,
              children: [
                Obx(
                  () => PreviewProfileImage(
                    size: 40,
                    id: Database.channelId ?? "",
                    image: AppSettings.profileImage.value,
                    fit: BoxFit.cover,
                  ),
                ),
                const SizedBox(width: 10),
                SizedBox(
                  width: Get.width - 80,
                  child: TextFormField(
                    controller: _controller.repliesController,
                    keyboardType: TextInputType.multiline,
                    decoration: InputDecoration(
                      filled: true,
                      fillColor: isDarkMode.value ? AppColor.secondDarkMode : AppColor.grey_200,
                      contentPadding: const EdgeInsets.only(left: 10),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                      hintText: AppStrings.addComments.tr,
                      hintStyle: GoogleFonts.urbanist(color: Colors.grey, fontSize: 14),
                      suffixIcon: IconButton(
                        onPressed: () async {
                          if (_controller.repliesController.text.isNotEmpty) {
                            FocusScope.of(context).requestFocus(FocusNode());

                            final messageText = _controller.repliesController.text;
                            _controller.repliesController.clear();

                            if (_controller.isRepliesAvailable == false) {
                              _controller.onCheckReplies(true);
                            }
                            Get.dialog(barrierDismissible: false, const LoaderUi());
                            _controller.advanceChanges();
                            _controller.customAddComment(AppSettings.profileImage.value, AppSettings.channelName.value, messageText);

                            afterChangeTotalReply.value++;

                            Get.back();

                            await CreateReplyApi.callApi(Database.loginUserId!, videoId, commentId, messageText);

                            await _controller.getAllReplies(Database.loginUserId!, videoId, commentId);
                          }
                        },
                        icon: const Icon(Icons.send_rounded, color: Colors.grey),
                      ),
                    ),
                  ),
                ),
              ],
            ),
            SizedBox(height: SizeConfig.blockSizeVertical * 0.5),
            const Divider(indent: 5, endIndent: 5),
            Expanded(
              child: SizedBox(
                height: 200,
                child: GetBuilder<RepliesController>(
                  id: "onChangeRepliesAvailable",
                  builder: (controller) => controller.isRepliesAvailable == false
                      ? Center(child: Text(AppStrings.commentsNotAvailable.tr))
                      : controller.mainReplies.isEmpty
                          ? const CommentShimmerUi()
                          : GetBuilder<RepliesController>(
                              id: "onChangeReplyList",
                              builder: (controller) => SingleChildScrollView(
                                    controller: scrollController,
                                    physics: const BouncingScrollPhysics(),
                                    child: Column(
                                      children: [
                                        ListView.builder(
                                          shrinkWrap: true,
                                          physics: const NeverScrollableScrollPhysics(),
                                          itemCount: controller.mainReplies.length,
                                          padding: const EdgeInsets.only(left: 5),
                                          itemBuilder: (context, index) {
                                            return Column(
                                              children: [
                                                Row(
                                                  children: [
                                                    PreviewProfileImage(
                                                      size: 30,
                                                      id: controller.mainReplies[index].userImage ?? "",
                                                      image: controller.mainReplies[index].userImage ?? "",
                                                      fit: BoxFit.cover,
                                                    ),
                                                    SizedBox(width: SizeConfig.blockSizeHorizontal * 3),
                                                    Flexible(
                                                      fit: FlexFit.loose,
                                                      child: Text(
                                                        controller.mainReplies[index].fullName.toString(),
                                                        style: GoogleFonts.urbanist(fontWeight: FontWeight.bold),
                                                      ),
                                                    ),
                                                    SizedBox(width: SizeConfig.blockSizeHorizontal * 3),
                                                    Text(
                                                      " •  ${controller.mainReplies[index].time}",
                                                      style: GoogleFonts.urbanist(fontSize: 13),
                                                    ),
                                                  ],
                                                ),
                                                SizedBox(height: SizeConfig.blockSizeVertical * 2),
                                                SizedBox(
                                                  width: SizeConfig.screenWidth / 1.1,
                                                  child: EmojiText(controller.mainReplies[index].commentText.toString(),
                                                      style: GoogleFonts.urbanist(), maxLines: 3, overflow: TextOverflow.ellipsis),
                                                ),
                                                Row(
                                                  children: [
                                                    GetBuilder<RepliesController>(
                                                      id: "onChangeLike",
                                                      builder: (controller) => GestureDetector(
                                                        onTap: () async => controller.onPressLike(Database.loginUserId!, videoId, commentId, index),
                                                        child: Container(
                                                          width: 50,
                                                          height: 50,
                                                          color: Colors.transparent,
                                                          child: Row(
                                                            children: [
                                                              ImageIcon(
                                                                AssetImage(controller.customChanges[index]["isLike"] == true
                                                                    ? AppIcons.likeBold
                                                                    : AppIcons.like),
                                                                color:
                                                                    controller.customChanges[index]["isLike"] == true ? AppColor.primaryColor : null,
                                                                size: 17,
                                                              ),
                                                              SizedBox(width: SizeConfig.blockSizeHorizontal * 3),
                                                              Text(
                                                                controller.customChanges[index]["like"].toString(),
                                                                style: GoogleFonts.urbanist(fontSize: 13),
                                                              ),
                                                            ],
                                                          ),
                                                        ),
                                                      ),
                                                    ),
                                                    GetBuilder<RepliesController>(
                                                      id: "onChangeDisLike",
                                                      builder: (controller) => GestureDetector(
                                                        onTap: () async =>
                                                            controller.onPressDisLike(Database.loginUserId!, videoId, commentId, index),
                                                        child: Container(
                                                          width: 50,
                                                          height: 50,
                                                          color: Colors.transparent,
                                                          child: Row(
                                                            children: [
                                                              ImageIcon(
                                                                AssetImage(controller.customChanges[index]["isDisLike"] == true
                                                                    ? AppIcons.disLikeBold
                                                                    : AppIcons.disLike),
                                                                color: controller.customChanges[index]["isDisLike"] == true
                                                                    ? AppColor.primaryColor
                                                                    : null,
                                                                size: 17,
                                                              ),
                                                              SizedBox(width: SizeConfig.blockSizeHorizontal * 3),
                                                              Text(
                                                                controller.customChanges[index]["disLike"].toString(),
                                                                style: GoogleFonts.urbanist(fontSize: 13),
                                                              ),
                                                            ],
                                                          ),
                                                        ),
                                                      ),
                                                    ),
                                                    SizedBox(width: SizeConfig.blockSizeHorizontal * 3),
                                                  ],
                                                ),
                                                const Divider(indent: 5, endIndent: 5),
                                                SizedBox(height: SizeConfig.blockSizeVertical * 1),
                                              ],
                                            );
                                          },
                                        ),
                                        GetBuilder<RepliesController>(
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
                                  )),
                ),
              ),
            ),
          ],
        ),
      ),
      isScrollControlled: true,
      backgroundColor: isDarkMode.value ? AppColor.secondDarkMode : AppColor.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.only(
          topLeft: Radius.circular(25),
          topRight: Radius.circular(25),
        ),
      ),
    );
    scrollController.dispose();

    return afterChangeTotalReply.value;
  }
}
